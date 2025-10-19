import { clientPromise } from '../mongodb'
import { ObjectId } from 'mongodb'
import {
  QuickBooksIntegration,
  QuickBooksSyncLog,
  QuickBooksEntityReference,
  Invoice,
  Quote,
  Client,
  Product,
  QuickBooksEntityType,
  QuickBooksSyncDirection,
} from '../types'
import * as crypto from 'crypto'

// QuickBooks OAuth and API client
const OAuthClient = require('intuit-oauth')
const QuickBooks = require('node-quickbooks')

/**
 * Encryption utilities for secure token storage
 */
class EncryptionService {
  private static algorithm = 'aes-256-gcm'
  private static key: Buffer | null = null

  private static getKey(): Buffer {
    if (!this.key) {
      const secret = process.env.INTEGRATION_ENCRYPTION_KEY
      if (!secret || secret.length < 32) {
        throw new Error('INTEGRATION_ENCRYPTION_KEY must be at least 32 characters')
      }
      this.key = crypto.scryptSync(secret, 'salt', 32)
    }
    return this.key
  }

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(this.algorithm, this.getKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format')
    }

    const [ivHex, authTagHex, encrypted] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(this.algorithm, this.getKey(), iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}

/**
 * QuickBooks Integration Service
 * Handles OAuth flow, token management, and API interactions with QuickBooks Online
 */
export class QuickBooksIntegrationService {
  /**
   * Get OAuth client instance
   */
  private static getOAuthClient(): any {
    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
    const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI
    const environment = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox'

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('QuickBooks OAuth credentials not configured')
    }

    return new OAuthClient({
      clientId,
      clientSecret,
      environment,
      redirectUri,
    })
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  static async getAuthorizationUrl(orgId: string): Promise<string> {
    try {
      const oauthClient = this.getOAuthClient()

      // Generate state token for CSRF protection
      const state = crypto.randomBytes(32).toString('hex')

      // Store state in database temporarily for validation
      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('qbo_oauth_states').insertOne({
        orgId,
        state,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 600000), // 10 minutes
      })

      // Generate authorization URL
      const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state,
      })

      console.log('[QuickBooks] Generated authorization URL for org:', orgId)
      return authUri
    } catch (error: any) {
      console.error('[QuickBooks] Error generating auth URL:', error)
      throw new Error(`Failed to generate authorization URL: ${error.message}`)
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    orgId: string,
    code: string,
    state: string,
    realmId: string,
    userId: string
  ): Promise<QuickBooksIntegration> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      // Validate state token
      const stateRecord = await db.collection('qbo_oauth_states').findOne({
        orgId,
        state,
        expiresAt: { $gt: new Date() },
      })

      if (!stateRecord) {
        throw new Error('Invalid or expired state token')
      }

      // Delete used state token
      await db.collection('qbo_oauth_states').deleteOne({ _id: stateRecord._id })

      // Exchange code for tokens
      const oauthClient = this.getOAuthClient()
      const authResponse = await oauthClient.createToken(code)

      const token = authResponse.getToken()

      // Encrypt tokens before storage
      const encryptedAccessToken = EncryptionService.encrypt(token.access_token)
      const encryptedRefreshToken = EncryptionService.encrypt(token.refresh_token)

      // Get company info
      let companyName = 'Unknown'
      try {
        const qbo = new QuickBooks(
          process.env.QUICKBOOKS_CLIENT_ID,
          process.env.QUICKBOOKS_CLIENT_SECRET,
          token.access_token,
          false, // no token secret for OAuth 2.0
          realmId,
          process.env.QUICKBOOKS_ENVIRONMENT === 'sandbox',
          true, // enable debugging
          null, // minorversion
          '2.0', // oauthversion
          token.refresh_token
        )

        const companyInfo: any = await new Promise((resolve, reject) => {
          qbo.getCompanyInfo(realmId, (err: any, info: any) => {
            if (err) reject(err)
            else resolve(info)
          })
        })

        companyName = companyInfo?.CompanyInfo?.CompanyName || 'Unknown'
      } catch (err) {
        console.warn('[QuickBooks] Could not fetch company name:', err)
      }

      // Calculate expiry dates
      const now = new Date()
      const accessTokenExpiresAt = new Date(now.getTime() + token.expires_in * 1000)
      const refreshTokenExpiresAt = new Date(now.getTime() + token.x_refresh_token_expires_in * 1000)

      // Check if integration already exists
      const existingIntegration = await db.collection('quickbooks_integrations').findOne({
        orgId,
        status: { $ne: 'disconnected' },
      })

      if (existingIntegration) {
        // Update existing integration
        await db.collection('quickbooks_integrations').updateOne(
          { _id: existingIntegration._id },
          {
            $set: {
              status: 'connected',
              realmId,
              accessToken: encryptedAccessToken,
              refreshToken: encryptedRefreshToken,
              tokenType: 'Bearer',
              accessTokenExpiresAt,
              refreshTokenExpiresAt,
              companyName,
              environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
              baseUrl: token.token_type === 'bearer' ? authResponse.baseUrl : undefined,
              updatedAt: now,
              lastHealthCheckAt: now,
              lastHealthCheckStatus: 'healthy',
            },
          }
        )

        const updated = await db.collection('quickbooks_integrations').findOne({
          _id: existingIntegration._id,
        })

        console.log('[QuickBooks] Updated existing integration for org:', orgId)
        return updated as unknown as QuickBooksIntegration
      }

      // Create new integration
      const integration: Partial<QuickBooksIntegration> = {
        orgId,
        status: 'connected',
        realmId,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenType: 'Bearer',
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        companyName,
        country: 'US',
        baseUrl: authResponse.baseUrl,
        environment: (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production',
        autoSync: false,
        syncDirection: 'deskwise_to_qbo',
        syncFrequency: 'manual',
        fieldMappings: {},
        totalInvoicesSynced: 0,
        totalCustomersSynced: 0,
        totalProductsSynced: 0,
        totalPaymentsSynced: 0,
        lastHealthCheckAt: now,
        lastHealthCheckStatus: 'healthy',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      }

      const result = await db.collection('quickbooks_integrations').insertOne(integration)

      const created = await db.collection('quickbooks_integrations').findOne({
        _id: result.insertedId,
      })

      console.log('[QuickBooks] Created new integration for org:', orgId)
      return created as unknown as QuickBooksIntegration
    } catch (error: any) {
      console.error('[QuickBooks] Error exchanging code for tokens:', error)
      throw new Error(`Failed to complete OAuth flow: ${error.message}`)
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(integrationId: string): Promise<void> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      const integration = await db.collection('quickbooks_integrations').findOne({
        _id: new ObjectId(integrationId),
      }) as unknown as QuickBooksIntegration | null

      if (!integration) {
        throw new Error('Integration not found')
      }

      // Decrypt refresh token
      const refreshToken = EncryptionService.decrypt(integration.refreshToken)

      // Refresh token
      const oauthClient = this.getOAuthClient()
      oauthClient.setToken({
        refresh_token: refreshToken,
      })

      const authResponse = await oauthClient.refresh()
      const token = authResponse.getToken()

      // Encrypt new tokens
      const encryptedAccessToken = EncryptionService.encrypt(token.access_token)
      const encryptedRefreshToken = EncryptionService.encrypt(token.refresh_token)

      // Calculate new expiry dates
      const now = new Date()
      const accessTokenExpiresAt = new Date(now.getTime() + token.expires_in * 1000)
      const refreshTokenExpiresAt = new Date(now.getTime() + token.x_refresh_token_expires_in * 1000)

      // Update integration
      await db.collection('quickbooks_integrations').updateOne(
        { _id: new ObjectId(integrationId) },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
            status: 'connected',
            updatedAt: now,
          },
        }
      )

      console.log('[QuickBooks] Refreshed access token for integration:', integrationId)
    } catch (error: any) {
      console.error('[QuickBooks] Error refreshing token:', error)

      // Mark integration as expired
      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('quickbooks_integrations').updateOne(
        { _id: new ObjectId(integrationId) },
        {
          $set: {
            status: 'expired',
            updatedAt: new Date(),
          },
        }
      )

      throw new Error(`Failed to refresh token: ${error.message}`)
    }
  }

  /**
   * Get valid QuickBooks API client
   * Automatically refreshes token if expired
   */
  static async getQuickBooksClient(orgId: string): Promise<any> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const integration = await db.collection('quickbooks_integrations').findOne({
      orgId,
      status: 'connected',
    }) as unknown as QuickBooksIntegration | null

    if (!integration) {
      throw new Error('QuickBooks integration not found or disconnected')
    }

    // Check if access token is expired or about to expire (within 5 minutes)
    const now = new Date()
    const expiryBuffer = 5 * 60 * 1000 // 5 minutes
    const isExpiring = integration.accessTokenExpiresAt.getTime() - now.getTime() < expiryBuffer

    if (isExpiring) {
      console.log('[QuickBooks] Access token expiring soon, refreshing...')
      await this.refreshAccessToken(integration._id.toString())

      // Fetch updated integration
      const updated = await db.collection('quickbooks_integrations').findOne({
        _id: integration._id,
      }) as unknown as QuickBooksIntegration

      integration.accessToken = updated.accessToken
      integration.refreshToken = updated.refreshToken
    }

    // Decrypt access token
    const accessToken = EncryptionService.decrypt(integration.accessToken)
    const refreshToken = EncryptionService.decrypt(integration.refreshToken)

    // Create QuickBooks client
    const qbo = new QuickBooks(
      process.env.QUICKBOOKS_CLIENT_ID,
      process.env.QUICKBOOKS_CLIENT_SECRET,
      accessToken,
      false, // no token secret for OAuth 2.0
      integration.realmId,
      integration.environment === 'sandbox',
      true, // enable debugging
      null, // minorversion
      '2.0', // oauthversion
      refreshToken
    )

    return qbo
  }

  /**
   * Test QuickBooks connection
   */
  static async testConnection(orgId: string): Promise<{
    connected: boolean
    companyName?: string
    error?: string
  }> {
    try {
      const qbo = await this.getQuickBooksClient(orgId)

      const client = await clientPromise
      const db = client.db('deskwise')

      const integration = await db.collection('quickbooks_integrations').findOne({
        orgId,
      }) as unknown as QuickBooksIntegration | null

      if (!integration) {
        return { connected: false, error: 'Integration not found' }
      }

      // Fetch company info to test connection
      const companyInfo: any = await new Promise((resolve, reject) => {
        qbo.getCompanyInfo(integration.realmId, (err: any, info: any) => {
          if (err) reject(err)
          else resolve(info)
        })
      })

      const companyName = companyInfo?.CompanyInfo?.CompanyName

      // Update health check
      await db.collection('quickbooks_integrations').updateOne(
        { orgId },
        {
          $set: {
            lastHealthCheckAt: new Date(),
            lastHealthCheckStatus: 'healthy',
            companyName,
          },
        }
      )

      console.log('[QuickBooks] Connection test successful for org:', orgId)
      return { connected: true, companyName }
    } catch (error: any) {
      console.error('[QuickBooks] Connection test failed:', error)

      // Update health check
      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('quickbooks_integrations').updateOne(
        { orgId },
        {
          $set: {
            lastHealthCheckAt: new Date(),
            lastHealthCheckStatus: 'unhealthy',
          },
        }
      )

      return { connected: false, error: error.message }
    }
  }

  /**
   * Disconnect QuickBooks integration
   */
  static async disconnect(orgId: string, userId: string, reason?: string): Promise<void> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      const integration = await db.collection('quickbooks_integrations').findOne({
        orgId,
      })

      if (!integration) {
        throw new Error('Integration not found')
      }

      // Revoke tokens with QuickBooks
      try {
        const oauthClient = this.getOAuthClient()
        const accessToken = EncryptionService.decrypt(integration.accessToken as string)

        oauthClient.setToken({
          access_token: accessToken,
        })

        await oauthClient.revoke()
        console.log('[QuickBooks] Tokens revoked successfully')
      } catch (revokeError) {
        console.warn('[QuickBooks] Failed to revoke tokens:', revokeError)
        // Continue with disconnect even if revoke fails
      }

      // Update integration status
      await db.collection('quickbooks_integrations').updateOne(
        { orgId },
        {
          $set: {
            status: 'disconnected',
            disconnectedAt: new Date(),
            disconnectedBy: userId,
            disconnectReason: reason,
            updatedAt: new Date(),
          },
        }
      )

      console.log('[QuickBooks] Disconnected integration for org:', orgId)
    } catch (error: any) {
      console.error('[QuickBooks] Error disconnecting:', error)
      throw new Error(`Failed to disconnect: ${error.message}`)
    }
  }

  /**
   * Get integration status for organization
   */
  static async getIntegrationStatus(orgId: string): Promise<QuickBooksIntegration | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const integration = await db.collection('quickbooks_integrations').findOne({
      orgId,
      status: { $ne: 'disconnected' },
    })

    return integration as unknown as QuickBooksIntegration | null
  }

  /**
   * Create sync log entry
   */
  static async createSyncLog(
    orgId: string,
    integrationId: string,
    data: Partial<QuickBooksSyncLog>,
    userId: string
  ): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const syncLog: Partial<QuickBooksSyncLog> = {
      orgId,
      integrationId,
      syncType: data.syncType || 'manual',
      entityType: data.entityType!,
      direction: data.direction!,
      status: 'pending',
      startedAt: new Date(),
      retryCount: 0,
      maxRetries: 3,
      conflictDetected: false,
      triggeredBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      ...data,
    }

    const result = await db.collection('quickbooks_sync_logs').insertOne(syncLog)
    return result.insertedId.toString()
  }

  /**
   * Update sync log
   */
  static async updateSyncLog(
    syncLogId: string,
    updates: Partial<QuickBooksSyncLog>
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('quickbooks_sync_logs').updateOne(
      { _id: new ObjectId(syncLogId) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Get sync logs for organization
   */
  static async getSyncLogs(
    orgId: string,
    filters?: {
      entityType?: QuickBooksEntityType
      status?: string
      limit?: number
    }
  ): Promise<QuickBooksSyncLog[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.entityType) {
      query.entityType = filters.entityType
    }

    if (filters?.status) {
      query.status = filters.status
    }

    const logs = await db
      .collection('quickbooks_sync_logs')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .toArray()

    return logs as unknown as QuickBooksSyncLog[]
  }

  /**
   * Create or update entity reference
   */
  static async upsertEntityReference(
    orgId: string,
    integrationId: string,
    deskwiseEntityId: string,
    deskwiseEntityType: string,
    quickbooksEntityId: string,
    quickbooksEntityType: QuickBooksEntityType,
    syncToken?: string
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()

    await db.collection('quickbooks_entity_references').updateOne(
      {
        orgId,
        integrationId,
        deskwiseEntityId,
        deskwiseEntityType,
      },
      {
        $set: {
          quickbooksEntityId,
          quickbooksEntityType,
          quickbooksSyncToken: syncToken,
          lastSyncedAt: now,
          isSyncEnabled: true,
          updatedAt: now,
        },
        $setOnInsert: {
          syncDirection: 'deskwise_to_qbo',
          deskwiseVersion: 1,
          quickbooksVersion: 1,
          createdAt: now,
        },
        $inc: {
          deskwiseVersion: 1,
        },
      },
      { upsert: true }
    )
  }

  /**
   * Get entity reference
   */
  static async getEntityReference(
    orgId: string,
    deskwiseEntityId: string,
    deskwiseEntityType: string
  ): Promise<QuickBooksEntityReference | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const ref = await db.collection('quickbooks_entity_references').findOne({
      orgId,
      deskwiseEntityId,
      deskwiseEntityType,
      isSyncEnabled: true,
    })

    return ref as unknown as QuickBooksEntityReference | null
  }
}

export default QuickBooksIntegrationService
