import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import crypto from 'crypto'
import { AssetService } from './assets'

export interface EnrollmentToken {
  _id: ObjectId
  orgId: string
  assetId?: string // Optional - asset can be auto-created during enrollment
  token: string // Secure random token
  createdBy: string
  createdAt: Date
  expiresAt: Date
  usedAt?: Date
  agentId?: string
  assetId_created?: string // Asset ID if auto-created during enrollment
  status: 'pending' | 'used' | 'expired' | 'revoked'
  notes?: string
}

export interface AgentCredential {
  _id: ObjectId
  orgId: string
  assetId: string
  agentId: string
  credentialKey: string // Long-lived secure key
  enrolledAt: Date
  enrollmentTokenId: ObjectId
  lastSeenAt?: Date
  isActive: boolean
  revokedAt?: Date
  revokedBy?: string
}

export class EnrollmentTokenService {
  /**
   * Generate a new enrollment token
   * Asset ID is optional - if not provided, asset will be auto-created during enrollment
   */
  static async generateToken(
    orgId: string,
    createdBy: string,
    options: {
      assetId?: string
      expiresInHours?: number
      notes?: string
    } = {}
  ): Promise<EnrollmentToken> {
    const db = await getDatabase()
    const collection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)

    // Generate secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex')

    const enrollmentToken: EnrollmentToken = {
      _id: new ObjectId(),
      orgId,
      assetId: options.assetId,
      token,
      createdBy,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (options.expiresInHours || 24) * 60 * 60 * 1000),
      status: 'pending',
      notes: options.notes,
    }

    await collection.insertOne(enrollmentToken)

    return enrollmentToken
  }

  /**
   * Get enrollment token by token string (for agent enrollment)
   */
  static async getByToken(token: string): Promise<EnrollmentToken | null> {
    const db = await getDatabase()
    const collection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)

    return await collection.findOne({ token })
  }

  /**
   * List enrollment tokens for an organization
   */
  static async listTokens(
    orgId: string,
    filters?: {
      status?: 'pending' | 'used' | 'expired' | 'revoked'
      assetId?: string
    }
  ): Promise<EnrollmentToken[]> {
    const db = await getDatabase()
    const collection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)

    const query: any = { orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.assetId) {
      query.assetId = filters.assetId
    }

    return await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()
  }

  /**
   * Revoke an enrollment token
   */
  static async revokeToken(tokenId: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)

    const result = await collection.updateOne(
      { _id: new ObjectId(tokenId), orgId, status: 'pending' },
      {
        $set: {
          status: 'revoked',
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Mark expired tokens (called periodically or on-demand)
   */
  static async markExpiredTokens(): Promise<number> {
    const db = await getDatabase()
    const collection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)

    const result = await collection.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: {
          status: 'expired',
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount
  }

  /**
   * Enroll an agent using a token (exchange token for credential)
   * Auto-creates asset if token doesn't have an assetId
   */
  static async enrollAgent(
    token: string,
    agentId: string,
    agentInfo?: {
      hostname?: string
      platform?: string
      arch?: string
      systemInfo?: any
      hardwareInfo?: any
      networkInfo?: any
    }
  ): Promise<{ success: boolean; credentialKey?: string; assetId?: string; error?: string }> {
    const db = await getDatabase()
    const tokensCollection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)
    const credentialsCollection = db.collection<AgentCredential>(COLLECTIONS.AGENT_CREDENTIALS)

    // Find and validate token
    const enrollmentToken = await tokensCollection.findOne({ token })

    if (!enrollmentToken) {
      return { success: false, error: 'Invalid enrollment token' }
    }

    if (enrollmentToken.status !== 'pending') {
      return { success: false, error: `Token already ${enrollmentToken.status}` }
    }

    if (enrollmentToken.expiresAt < new Date()) {
      // Mark as expired
      await tokensCollection.updateOne(
        { _id: enrollmentToken._id },
        { $set: { status: 'expired', updatedAt: new Date() } }
      )
      return { success: false, error: 'Token has expired' }
    }

    // Auto-create asset if not specified in token
    let assetId = enrollmentToken.assetId
    if (!assetId) {
      const hostname = agentInfo?.hostname || 'Unknown'
      const platform = agentInfo?.platform || 'unknown'
      const arch = agentInfo?.arch || 'unknown'

      // Determine manufacturer from hardware info or platform
      let manufacturer = 'Unknown'
      if (agentInfo?.hardwareInfo?.manufacturer) {
        manufacturer = agentInfo.hardwareInfo.manufacturer
      } else if (platform === 'windows') {
        manufacturer = 'Microsoft'
      } else if (platform === 'darwin') {
        manufacturer = 'Apple'
      }

      // Use hardware model if available, otherwise fallback to platform/arch
      const model = agentInfo?.hardwareInfo?.model || `${platform}/${arch}`

      // Create asset automatically with comprehensive system information
      // assetTag will be auto-generated based on organization settings
      const asset = await AssetService.createAsset(
        enrollmentToken.orgId,
        {
          name: hostname,
          category: 'Computer', // Will match to category name or use as-is
          manufacturer,
          model,
          serialNumber: agentInfo?.hardwareInfo?.serialNumber,
          systemInfo: agentInfo?.systemInfo,
          hardwareInfo: agentInfo?.hardwareInfo,
          networkInfo: agentInfo?.networkInfo,
        },
        'system' // Created by system during enrollment
      )

      assetId = asset._id.toString()

      // Update token with created asset ID
      await tokensCollection.updateOne(
        { _id: enrollmentToken._id },
        { $set: { assetId_created: assetId } }
      )
    } else {
      // If asset already exists, update it with the collected system information
      if (agentInfo?.systemInfo || agentInfo?.hardwareInfo || agentInfo?.networkInfo) {
        await AssetService.updateAsset(assetId, enrollmentToken.orgId, {
          systemInfo: agentInfo.systemInfo,
          hardwareInfo: agentInfo.hardwareInfo,
          networkInfo: agentInfo.networkInfo,
        })
      }
    }

    // Generate long-lived credential key (32 bytes = 64 hex characters)
    const credentialKey = crypto.randomBytes(32).toString('hex')

    // Create agent credential
    const credential: AgentCredential = {
      _id: new ObjectId(),
      orgId: enrollmentToken.orgId,
      assetId: assetId!,
      agentId,
      credentialKey,
      enrolledAt: new Date(),
      enrollmentTokenId: enrollmentToken._id,
      isActive: true,
    }

    await credentialsCollection.insertOne(credential)

    // Mark token as used
    await tokensCollection.updateOne(
      { _id: enrollmentToken._id },
      {
        $set: {
          status: 'used',
          usedAt: new Date(),
          agentId,
        },
      }
    )

    return {
      success: true,
      credentialKey,
      assetId,
    }
  }

  /**
   * Verify agent credential (for ongoing authentication)
   */
  static async verifyCredential(
    credentialKey: string
  ): Promise<{ valid: boolean; credential?: AgentCredential }> {
    const db = await getDatabase()
    const collection = db.collection<AgentCredential>(COLLECTIONS.AGENT_CREDENTIALS)

    const credential = await collection.findOne({
      credentialKey,
      isActive: true,
    })

    if (!credential) {
      return { valid: false }
    }

    // Update last seen
    await collection.updateOne(
      { _id: credential._id },
      { $set: { lastSeenAt: new Date() } }
    )

    return { valid: true, credential }
  }

  /**
   * Revoke agent credential
   */
  static async revokeCredential(
    credentialId: string,
    orgId: string,
    revokedBy: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<AgentCredential>(COLLECTIONS.AGENT_CREDENTIALS)

    const result = await collection.updateOne(
      { _id: new ObjectId(credentialId), orgId },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokedBy,
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * List agent credentials for an organization
   */
  static async listCredentials(
    orgId: string,
    filters?: {
      assetId?: string
      isActive?: boolean
    }
  ): Promise<AgentCredential[]> {
    const db = await getDatabase()
    const collection = db.collection<AgentCredential>(COLLECTIONS.AGENT_CREDENTIALS)

    const query: any = { orgId }

    if (filters?.assetId) {
      query.assetId = filters.assetId
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    return await collection.find(query).sort({ enrolledAt: -1 }).toArray()
  }

  /**
   * Get enrollment statistics
   */
  static async getStats(orgId: string) {
    const db = await getDatabase()
    const tokensCollection = db.collection<EnrollmentToken>(COLLECTIONS.ENROLLMENT_TOKENS)
    const credentialsCollection = db.collection<AgentCredential>(COLLECTIONS.AGENT_CREDENTIALS)

    const [pendingTokens, usedTokens, expiredTokens, activeAgents, totalAgents] =
      await Promise.all([
        tokensCollection.countDocuments({ orgId, status: 'pending' }),
        tokensCollection.countDocuments({ orgId, status: 'used' }),
        tokensCollection.countDocuments({ orgId, status: 'expired' }),
        credentialsCollection.countDocuments({ orgId, isActive: true }),
        credentialsCollection.countDocuments({ orgId }),
      ])

    return {
      tokens: {
        pending: pendingTokens,
        used: usedTokens,
        expired: expiredTokens,
      },
      agents: {
        active: activeAgents,
        total: totalAgents,
        revoked: totalAgents - activeAgents,
      },
    }
  }
}
