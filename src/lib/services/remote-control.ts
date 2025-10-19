import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  RemoteControlSession,
  RemoteControlAuditLog,
  RemoteControlPolicy,
  RemoteControlSessionStatus,
  RemoteControlAction,
  UserRole,
  Asset,
} from '@/lib/types'
import { sign, verify } from 'jsonwebtoken'

const JWT_SECRET = process.env.RC_JWT_SECRET || process.env.NEXTAUTH_SECRET || 'remote-control-secret-change-me'
const SESSION_TOKEN_EXPIRY = 60 * 60 // 1 hour in seconds

export interface CreateSessionInput {
  assetId: string
  operatorUserId: string
  operatorName: string
  ipAddress?: string
  userAgent?: string
}

export interface SessionTokenPayload {
  sessionId: string
  assetId: string
  orgId: string
  userId: string
  permissions: string[]
}

export interface UpdateSessionMetrics {
  avgFps?: number
  avgLatency?: number
  packetsLost?: number
  bandwidth?: number
}

export class RemoteControlService {
  /**
   * Get or create default policy for an organization
   */
  static async getOrCreatePolicy(orgId: string, userId: string): Promise<RemoteControlPolicy> {
    const db = await getDatabase()
    const policiesCollection = db.collection<RemoteControlPolicy>('rc_policies')

    let policy = await policiesCollection.findOne({ orgId })

    if (!policy) {
      // Create default policy
      const now = new Date()
      const defaultPolicy: Omit<RemoteControlPolicy, '_id'> = {
        orgId,
        enabled: true,
        requireConsent: false,
        idleTimeout: 30, // 30 minutes
        allowClipboard: false,
        allowFileTransfer: false,
        allowedRoles: ['admin', 'technician'],
        createdAt: now,
        updatedAt: now,
        updatedBy: userId,
      }

      const result = await policiesCollection.insertOne(defaultPolicy as RemoteControlPolicy)
      policy = { ...defaultPolicy, _id: result.insertedId } as RemoteControlPolicy
    }

    return policy
  }

  /**
   * Update remote control policy
   */
  static async updatePolicy(
    orgId: string,
    updates: Partial<Omit<RemoteControlPolicy, '_id' | 'orgId' | 'createdAt'>>,
    userId: string
  ): Promise<RemoteControlPolicy> {
    const db = await getDatabase()
    const policiesCollection = db.collection<RemoteControlPolicy>('rc_policies')

    const result = await policiesCollection.findOneAndUpdate(
      { orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Policy not found')
    }

    return result
  }

  /**
   * Check if user has permission for remote control
   */
  static async checkPermission(orgId: string, userRole: UserRole, userId?: string): Promise<boolean> {
    // Get or create policy (this ensures a default policy exists)
    const policy = await this.getOrCreatePolicy(orgId, userId || 'system')

    if (!policy.enabled) {
      return false
    }

    return policy.allowedRoles.includes(userRole)
  }

  /**
   * Check if asset supports remote control
   */
  static async checkAssetCapability(assetId: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const assetsCollection = db.collection<Asset>(COLLECTIONS.ASSETS)

    const asset = await assetsCollection.findOne({
      _id: new ObjectId(assetId),
      orgId,
    })

    if (!asset) {
      throw new Error('Asset not found')
    }

    return asset.capabilities?.remoteControl === true
  }

  /**
   * Create a new remote control session
   */
  static async createSession(
    orgId: string,
    input: CreateSessionInput
  ): Promise<{ session: RemoteControlSession; token: string }> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    // Get policy
    const policy = await this.getOrCreatePolicy(orgId, input.operatorUserId)

    // Check if asset supports remote control
    const hasCapability = await this.checkAssetCapability(input.assetId, orgId)
    if (!hasCapability) {
      throw new Error('Asset does not support remote control')
    }

    // Check if there's already an active session for this asset
    const existingSession = await sessionsCollection.findOne({
      assetId: input.assetId,
      orgId,
      status: 'active',
    })

    if (existingSession) {
      throw new Error('Asset already has an active remote control session')
    }

    const now = new Date()
    const sessionId = new ObjectId().toHexString()

    const session: Omit<RemoteControlSession, '_id'> = {
      orgId,
      sessionId,
      assetId: input.assetId,
      operatorUserId: input.operatorUserId,
      operatorName: input.operatorName,
      status: policy.requireConsent ? 'pending' : 'active',
      startedAt: now,
      consentRequired: policy.requireConsent,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      policySnapshot: {
        idleTimeout: policy.idleTimeout,
        requireConsent: policy.requireConsent,
        allowClipboard: policy.allowClipboard,
        allowFileTransfer: policy.allowFileTransfer,
      },
      createdBy: input.operatorUserId,
      createdAt: now,
      updatedAt: now,
    }

    const result = await sessionsCollection.insertOne(session as RemoteControlSession)
    const createdSession = { ...session, _id: result.insertedId } as RemoteControlSession

    // Create audit log
    await this.createAuditLog(orgId, {
      sessionId,
      assetId: input.assetId,
      operatorUserId: input.operatorUserId,
      action: 'session_start',
      ipAddress: input.ipAddress,
    })

    // Generate JWT token
    const token = this.generateSessionToken({
      sessionId,
      assetId: input.assetId,
      orgId,
      userId: input.operatorUserId,
      permissions: ['view', 'input'],
    })

    return { session: createdSession, token }
  }

  /**
   * Get session by ID
   */
  static async getSession(sessionId: string, orgId: string): Promise<RemoteControlSession | null> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    return sessionsCollection.findOne({ sessionId, orgId })
  }

  /**
   * Get all sessions (with optional filters)
   */
  static async getSessions(
    orgId: string,
    filters?: {
      assetId?: string
      operatorUserId?: string
      status?: RemoteControlSessionStatus
      limit?: number
    }
  ): Promise<RemoteControlSession[]> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    const query: Record<string, unknown> = { orgId }
    if (filters?.assetId) query.assetId = filters.assetId
    if (filters?.operatorUserId) query.operatorUserId = filters.operatorUserId
    if (filters?.status) query.status = filters.status

    return sessionsCollection
      .find(query)
      .sort({ startedAt: -1 })
      .limit(filters?.limit || 50)
      .toArray()
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    orgId: string,
    status: RemoteControlSessionStatus
  ): Promise<RemoteControlSession> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    // If ending session, calculate duration
    if (status === 'ended' || status === 'failed') {
      const session = await this.getSession(sessionId, orgId)
      if (session) {
        const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000)
        updates.endedAt = new Date()
        updates.duration = duration

        // Create audit log
        await this.createAuditLog(orgId, {
          sessionId,
          assetId: session.assetId,
          operatorUserId: session.operatorUserId,
          action: 'session_end',
        })
      }
    }

    const result = await sessionsCollection.findOneAndUpdate(
      { sessionId, orgId },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Session not found')
    }

    return result
  }

  /**
   * Grant consent for a session
   */
  static async grantConsent(
    sessionId: string,
    orgId: string,
    grantedBy: string
  ): Promise<RemoteControlSession> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    const now = new Date()

    const result = await sessionsCollection.findOneAndUpdate(
      { sessionId, orgId, status: 'pending' },
      {
        $set: {
          status: 'active',
          consentGranted: true,
          consentGrantedBy: grantedBy,
          consentGrantedAt: now,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new Error('Session not found or not pending')
    }

    // Create audit log
    const session = result
    await this.createAuditLog(orgId, {
      sessionId,
      assetId: session.assetId,
      operatorUserId: session.operatorUserId,
      action: 'consent_granted',
      details: { grantedBy },
    })

    return result
  }

  /**
   * Deny consent for a session
   */
  static async denyConsent(sessionId: string, orgId: string, deniedBy: string): Promise<void> {
    const session = await this.getSession(sessionId, orgId)
    if (!session) {
      throw new Error('Session not found')
    }

    await this.updateSessionStatus(sessionId, orgId, 'failed')

    // Create audit log
    await this.createAuditLog(orgId, {
      sessionId,
      assetId: session.assetId,
      operatorUserId: session.operatorUserId,
      action: 'consent_denied',
      details: { deniedBy },
    })
  }

  /**
   * Update session quality metrics
   */
  static async updateMetrics(
    sessionId: string,
    orgId: string,
    metrics: UpdateSessionMetrics
  ): Promise<void> {
    const db = await getDatabase()
    const sessionsCollection = db.collection<RemoteControlSession>('rc_sessions')

    await sessionsCollection.updateOne(
      { sessionId, orgId },
      {
        $set: {
          qualityMetrics: metrics,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(
    orgId: string,
    input: {
      sessionId: string
      assetId: string
      operatorUserId: string
      action: RemoteControlAction
      details?: Record<string, unknown>
      ipAddress?: string
    }
  ): Promise<void> {
    const db = await getDatabase()
    const auditCollection = db.collection<RemoteControlAuditLog>('audit_remote_control')

    const auditLog: Omit<RemoteControlAuditLog, '_id'> = {
      orgId,
      sessionId: input.sessionId,
      assetId: input.assetId,
      operatorUserId: input.operatorUserId,
      action: input.action,
      timestamp: new Date(),
      details: input.details,
      ipAddress: input.ipAddress,
    }

    await auditCollection.insertOne(auditLog as RemoteControlAuditLog)
  }

  /**
   * Get audit logs for a session
   */
  static async getAuditLogs(
    sessionId: string,
    orgId: string
  ): Promise<RemoteControlAuditLog[]> {
    const db = await getDatabase()
    const auditCollection = db.collection<RemoteControlAuditLog>('audit_remote_control')

    return auditCollection.find({ sessionId, orgId }).sort({ timestamp: 1 }).toArray()
  }

  /**
   * Generate JWT token for session
   */
  static generateSessionToken(payload: SessionTokenPayload): string {
    return sign(payload, JWT_SECRET, {
      expiresIn: SESSION_TOKEN_EXPIRY,
    })
  }

  /**
   * Verify and decode session token
   */
  static verifySessionToken(token: string): SessionTokenPayload {
    try {
      return verify(token, JWT_SECRET) as SessionTokenPayload
    } catch (error) {
      throw new Error('Invalid or expired session token')
    }
  }

  /**
   * Get ICE server configuration (STUN/TURN)
   */
  static getICEServers(): Array<{ urls: string | string[]; username?: string; credential?: string }> {
    const iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }> = [
      { urls: 'stun:stun.l.google.com:19302' }, // Free Google STUN server
    ]

    // Add TURN server if configured
    if (process.env.TURN_URL) {
      iceServers.push({
        urls: process.env.TURN_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      })
    }

    return iceServers
  }
}
