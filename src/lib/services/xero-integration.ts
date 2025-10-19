import { clientPromise } from '../mongodb'
import { ObjectId } from 'mongodb'
import {
  XeroIntegration,
  XeroSyncLog,
  XeroEntityReference,
  Invoice,
  Quote,
  Client,
  Product,
  XeroEntityType,
  XeroSyncDirection,
  XeroConnectionStatus,
  XeroSyncStatus,
} from '../types'
import * as crypto from 'crypto'
import { XeroClient, TokenSet } from 'xero-node'

/**
 * Encryption utilities for secure token storage
 * Reuses the same encryption key as QuickBooks integration
 */
class EncryptionService {
  private static algorithm = 'aes-256-gcm'
  private static key: Buffer | null = null

  private static getKey(): Buffer {
    if (!this.key) {
      const secret = process.env.INTEGRATION_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET
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
 * Xero Integration Service
 * Handles OAuth flow, token management, and API interactions with Xero
 */
export class XeroIntegrationService {
  /**
   * Get XeroClient instance
   */
  private static getXeroClient(): XeroClient {
    const clientId = process.env.XERO_CLIENT_ID
    const clientSecret = process.env.XERO_CLIENT_SECRET
    const redirectUris = process.env.XERO_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUris) {
      throw new Error('Xero OAuth credentials not configured. Please set XERO_CLIENT_ID, XERO_CLIENT_SECRET, and XERO_REDIRECT_URI in environment variables.')
    }

    return new XeroClient({
      clientId,
      clientSecret,
      redirectUris: [redirectUris],
      scopes: 'openid profile email accounting.settings accounting.transactions accounting.contacts offline_access'.split(' '),
      httpTimeout: 10000,
    })
  }

  /**
   * Generate authorization URL for OAuth flow
   */
  static async getAuthorizationUrl(orgId: string): Promise<string> {
    try {
      console.log(`[Xero] Generating authorization URL for org: ${orgId}`)

      const xeroClient = this.getXeroClient()
      const consentUrl = await xeroClient.buildConsentUrl()

      console.log(`[Xero] Authorization URL generated successfully`)
      return consentUrl
    } catch (error) {
      console.error('[Xero] Error generating authorization URL:', error)
      throw new Error(`Failed to generate Xero authorization URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Handle OAuth callback and store tokens
   */
  static async handleCallback(
    orgId: string,
    url: string,
    userId: string
  ): Promise<XeroIntegration> {
    try {
      console.log(`[Xero] Handling OAuth callback for org: ${orgId}`)

      const xeroClient = this.getXeroClient()
      const tokenSet = await xeroClient.apiCallback(url)

      if (!tokenSet.access_token || !tokenSet.refresh_token) {
        throw new Error('Invalid token set received from Xero')
      }

      // Get tenant connections
      await xeroClient.updateTenants()
      const tenants = xeroClient.tenants

      if (!tenants || tenants.length === 0) {
        throw new Error('No Xero organizations found for this connection')
      }

      // Use the first tenant (in production, you might want to let the user choose)
      const tenant = tenants[0]

      console.log(`[Xero] Connected to tenant: ${tenant.tenantName} (${tenant.tenantId})`)

      // Calculate token expiry dates
      const now = new Date()
      const accessTokenExpiresAt = new Date(now.getTime() + (tokenSet.expires_in || 1800) * 1000) // Default 30 minutes
      const refreshTokenExpiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days

      // Encrypt tokens
      const encryptedAccessToken = EncryptionService.encrypt(tokenSet.access_token)
      const encryptedRefreshToken = EncryptionService.encrypt(tokenSet.refresh_token)
      const encryptedIdToken = tokenSet.id_token ? EncryptionService.encrypt(tokenSet.id_token) : undefined

      // Create integration record
      const integration: Omit<XeroIntegration, '_id'> = {
        orgId,
        status: 'connected' as XeroConnectionStatus,
        tenantId: tenant.tenantId,
        tenantName: tenant.tenantName,
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        idToken: encryptedIdToken,
        tokenType: tokenSet.token_type || 'Bearer',
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        organizationName: tenant.tenantName,
        countryCode: tenant.tenantType,
        autoSync: false,
        syncDirection: 'deskwise_to_xero' as XeroSyncDirection,
        syncFrequency: 'manual',
        fieldMappings: {},
        syncInvoices: true,
        syncQuotes: true,
        syncContacts: true,
        syncProducts: true,
        syncPayments: true,
        consecutiveFailures: 0,
        connectedBy: userId,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      // Check if integration already exists
      const existingIntegration = await db.collection('xero_integrations').findOne({ orgId })

      if (existingIntegration) {
        // Update existing integration
        await db.collection('xero_integrations').updateOne(
          { orgId },
          {
            $set: {
              ...integration,
              updatedAt: now,
            },
          }
        )

        console.log(`[Xero] Updated existing integration for org: ${orgId}`)
        return { ...integration, _id: existingIntegration._id } as XeroIntegration
      } else {
        // Insert new integration
        const result = await db.collection('xero_integrations').insertOne(integration)

        console.log(`[Xero] Created new integration for org: ${orgId}`)
        return { ...integration, _id: result.insertedId } as XeroIntegration
      }
    } catch (error) {
      console.error('[Xero] OAuth callback error:', error)
      throw new Error(`Failed to complete Xero OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get integration for an organization
   */
  static async getIntegration(orgId: string): Promise<XeroIntegration | null> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      const integration = await db.collection('xero_integrations').findOne({ orgId })

      return integration as XeroIntegration | null
    } catch (error) {
      console.error('[Xero] Error fetching integration:', error)
      throw new Error(`Failed to fetch Xero integration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(orgId: string): Promise<void> {
    try {
      console.log(`[Xero] Refreshing access token for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      // Decrypt refresh token
      const refreshToken = EncryptionService.decrypt(integration.refreshToken)

      const xeroClient = this.getXeroClient()

      // Set the current token set
      xeroClient.setTokenSet({
        access_token: EncryptionService.decrypt(integration.accessToken),
        refresh_token: refreshToken,
        token_type: integration.tokenType,
      })

      // Refresh the token
      const newTokenSet = await xeroClient.refreshToken()

      if (!newTokenSet.access_token || !newTokenSet.refresh_token) {
        throw new Error('Invalid token set received from Xero during refresh')
      }

      // Calculate new expiry dates
      const now = new Date()
      const accessTokenExpiresAt = new Date(now.getTime() + (newTokenSet.expires_in || 1800) * 1000)
      const refreshTokenExpiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) // 60 days

      // Encrypt new tokens
      const encryptedAccessToken = EncryptionService.encrypt(newTokenSet.access_token)
      const encryptedRefreshToken = EncryptionService.encrypt(newTokenSet.refresh_token)
      const encryptedIdToken = newTokenSet.id_token ? EncryptionService.encrypt(newTokenSet.id_token) : undefined

      // Update integration with new tokens
      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('xero_integrations').updateOne(
        { orgId },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            idToken: encryptedIdToken,
            accessTokenExpiresAt,
            refreshTokenExpiresAt,
            status: 'connected' as XeroConnectionStatus,
            updatedAt: now,
            consecutiveFailures: 0,
          },
        }
      )

      console.log(`[Xero] Access token refreshed successfully for org: ${orgId}`)
    } catch (error) {
      console.error('[Xero] Token refresh error:', error)

      // Mark integration as expired
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_integrations').updateOne(
        { orgId },
        {
          $set: {
            status: 'expired' as XeroConnectionStatus,
            lastErrorAt: new Date(),
            updatedAt: new Date(),
          },
          $inc: { consecutiveFailures: 1 },
        }
      )

      throw new Error(`Failed to refresh Xero token: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get authenticated Xero client for API calls
   */
  private static async getAuthenticatedClient(orgId: string): Promise<XeroClient> {
    const integration = await this.getIntegration(orgId)
    if (!integration) {
      throw new Error('Xero integration not found')
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date()
    const expiryThreshold = new Date(now.getTime() + 5 * 60 * 1000)

    if (integration.accessTokenExpiresAt < expiryThreshold) {
      console.log(`[Xero] Token expired or expiring soon, refreshing...`)
      await this.refreshAccessToken(orgId)
      // Re-fetch integration with new tokens
      const updatedIntegration = await this.getIntegration(orgId)
      if (!updatedIntegration) {
        throw new Error('Failed to fetch updated integration')
      }
      integration.accessToken = updatedIntegration.accessToken
      integration.refreshToken = updatedIntegration.refreshToken
      integration.idToken = updatedIntegration.idToken
    }

    const xeroClient = this.getXeroClient()

    // Decrypt and set tokens
    const accessToken = EncryptionService.decrypt(integration.accessToken)
    const refreshToken = EncryptionService.decrypt(integration.refreshToken)
    const idToken = integration.idToken ? EncryptionService.decrypt(integration.idToken) : undefined

    xeroClient.setTokenSet({
      access_token: accessToken,
      refresh_token: refreshToken,
      id_token: idToken,
      token_type: integration.tokenType,
    })

    // Update tenants
    await xeroClient.updateTenants()

    return xeroClient
  }

  /**
   * Test connection to Xero
   */
  static async testConnection(orgId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log(`[Xero] Testing connection for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        return { success: false, message: 'Xero integration not found' }
      }

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Try to fetch organization info
      const response = await xeroClient.accountingApi.getOrganisations(integration.tenantId)

      if (response.body.organisations && response.body.organisations.length > 0) {
        const org = response.body.organisations[0]

        // Update health check timestamp
        const client = await clientPromise
        const db = client.db('deskwise')
        await db.collection('xero_integrations').updateOne(
          { orgId },
          {
            $set: {
              lastHealthCheck: new Date(),
              status: 'connected' as XeroConnectionStatus,
              consecutiveFailures: 0,
            },
          }
        )

        console.log(`[Xero] Connection test successful for org: ${orgId}`)
        return {
          success: true,
          message: 'Successfully connected to Xero',
          data: {
            name: org.name,
            countryCode: org.countryCode,
            baseCurrency: org.baseCurrency,
            isDemoCompany: org.isDemoCompany,
          },
        }
      }

      return { success: false, message: 'No organization data returned from Xero' }
    } catch (error) {
      console.error('[Xero] Connection test failed:', error)

      // Update error tracking
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_integrations').updateOne(
        { orgId },
        {
          $set: {
            lastErrorAt: new Date(),
            status: 'error' as XeroConnectionStatus,
          },
          $inc: { consecutiveFailures: 1 },
        }
      )

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      }
    }
  }

  /**
   * Disconnect Xero integration
   */
  static async disconnect(orgId: string, userId: string): Promise<void> {
    try {
      console.log(`[Xero] Disconnecting integration for org: ${orgId}`)

      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('xero_integrations').updateOne(
        { orgId },
        {
          $set: {
            status: 'disconnected' as XeroConnectionStatus,
            disconnectedAt: new Date(),
            disconnectedBy: userId,
            updatedAt: new Date(),
          },
        }
      )

      console.log(`[Xero] Integration disconnected successfully for org: ${orgId}`)
    } catch (error) {
      console.error('[Xero] Disconnect error:', error)
      throw new Error(`Failed to disconnect Xero: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sync invoice to Xero
   */
  static async syncInvoice(
    orgId: string,
    invoiceId: string,
    triggeredBy: string
  ): Promise<{ success: boolean; xeroInvoiceId?: string; error?: string }> {
    const startTime = Date.now()
    let syncLog: Partial<XeroSyncLog> = {
      orgId,
      integrationId: '',
      syncType: 'manual',
      entityType: 'Invoice',
      syncDirection: 'deskwise_to_xero',
      status: 'pending',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      duration: 0,
      errors: [],
      startedAt: new Date(),
      triggeredBy,
      triggerType: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: triggeredBy,
    }

    try {
      console.log(`[Xero] Syncing invoice ${invoiceId} for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      syncLog.integrationId = integration._id.toString()

      if (!integration.syncInvoices) {
        throw new Error('Invoice sync is disabled for this integration')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      // Fetch Deskwise invoice
      const invoice = await db.collection('invoices').findOne({
        _id: new ObjectId(invoiceId),
        orgId,
      }) as Invoice | null

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      syncLog.recordsProcessed = 1

      // Check if invoice is already synced
      const existingReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: invoiceId,
        deskwiseEntityType: 'invoice',
      }) as XeroEntityReference | null

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Build Xero invoice object
      const xeroInvoice: any = {
        type: invoice.type === 'credit_note' ? 'ACCRECCREDIT' : 'ACCREC',
        contact: {
          contactID: await this.getOrCreateContact(orgId, invoice.clientId),
        },
        lineItems: invoice.lineItems.map((item) => ({
          description: item.description || item.name,
          quantity: item.quantity,
          unitAmount: item.unitPrice,
          accountCode: integration.defaultRevenueAccount,
          taxType: item.taxable ? integration.defaultTaxType : 'NONE',
          lineAmount: item.total,
        })),
        date: invoice.invoiceDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        reference: invoice.invoiceNumber,
        status: this.mapInvoiceStatus(invoice.status),
      }

      let xeroInvoiceId: string

      if (existingReference && existingReference.xeroEntityId) {
        // Update existing invoice
        xeroInvoice.invoiceID = existingReference.xeroEntityId

        const response = await xeroClient.accountingApi.updateInvoice(
          integration.tenantId,
          existingReference.xeroEntityId,
          { invoices: [xeroInvoice] }
        )

        if (response.body.invoices && response.body.invoices.length > 0) {
          xeroInvoiceId = response.body.invoices[0].invoiceID!
          console.log(`[Xero] Updated invoice: ${xeroInvoiceId}`)
        } else {
          throw new Error('No invoice returned from Xero update')
        }
      } else {
        // Create new invoice
        const response = await xeroClient.accountingApi.createInvoices(integration.tenantId, {
          invoices: [xeroInvoice],
        })

        if (response.body.invoices && response.body.invoices.length > 0) {
          xeroInvoiceId = response.body.invoices[0].invoiceID!
          console.log(`[Xero] Created invoice: ${xeroInvoiceId}`)

          // Create entity reference
          await db.collection('xero_entity_references').insertOne({
            orgId,
            integrationId: integration._id.toString(),
            deskwiseEntityId: invoiceId,
            deskwiseEntityType: 'invoice',
            xeroEntityId: xeroInvoiceId,
            xeroEntityType: 'Invoice',
            xeroStatus: response.body.invoices[0].status,
            lastSyncedAt: new Date(),
            syncDirection: 'deskwise_to_xero',
            isSyncEnabled: true,
            deskwiseVersion: 1,
            xeroVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          throw new Error('No invoice returned from Xero create')
        }
      }

      syncLog.recordsSucceeded = 1
      syncLog.status = 'completed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime

      // Save sync log
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return { success: true, xeroInvoiceId }
    } catch (error) {
      console.error('[Xero] Invoice sync error:', error)

      syncLog.recordsFailed = 1
      syncLog.status = 'failed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime
      syncLog.errors = [
        {
          entityId: invoiceId,
          entityName: 'Invoice',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      ]

      // Save sync log
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync quote to Xero (as Quote/Estimate)
   */
  static async syncQuote(
    orgId: string,
    quoteId: string,
    triggeredBy: string
  ): Promise<{ success: boolean; xeroQuoteId?: string; error?: string }> {
    const startTime = Date.now()
    let syncLog: Partial<XeroSyncLog> = {
      orgId,
      integrationId: '',
      syncType: 'manual',
      entityType: 'Quote',
      syncDirection: 'deskwise_to_xero',
      status: 'pending',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      duration: 0,
      errors: [],
      startedAt: new Date(),
      triggeredBy,
      triggerType: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: triggeredBy,
    }

    try {
      console.log(`[Xero] Syncing quote ${quoteId} for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      syncLog.integrationId = integration._id.toString()

      if (!integration.syncQuotes) {
        throw new Error('Quote sync is disabled for this integration')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      // Fetch Deskwise quote
      const quote = await db.collection('quotes').findOne({
        _id: new ObjectId(quoteId),
        orgId,
      }) as Quote | null

      if (!quote) {
        throw new Error('Quote not found')
      }

      syncLog.recordsProcessed = 1

      // Check if quote is already synced
      const existingReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: quoteId,
        deskwiseEntityType: 'quote',
      }) as XeroEntityReference | null

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Build Xero quote object
      const xeroQuote: any = {
        contact: {
          contactID: await this.getOrCreateContact(orgId, quote.clientId),
        },
        lineItems: quote.lineItems.map((item) => ({
          description: item.description || item.name,
          quantity: item.quantity,
          unitAmount: item.unitPrice,
          accountCode: integration.defaultRevenueAccount,
          taxType: item.taxable ? integration.defaultTaxType : 'NONE',
          lineAmount: item.total,
        })),
        date: new Date().toISOString().split('T')[0],
        expiryDate: quote.validUntil.toISOString().split('T')[0],
        reference: quote.quoteNumber,
        status: this.mapQuoteStatus(quote.status),
        title: quote.title,
      }

      let xeroQuoteId: string

      if (existingReference && existingReference.xeroEntityId) {
        // Update existing quote
        xeroQuote.quoteID = existingReference.xeroEntityId

        const response = await xeroClient.accountingApi.updateQuote(
          integration.tenantId,
          existingReference.xeroEntityId,
          { quotes: [xeroQuote] }
        )

        if (response.body.quotes && response.body.quotes.length > 0) {
          xeroQuoteId = response.body.quotes[0].quoteID!
          console.log(`[Xero] Updated quote: ${xeroQuoteId}`)
        } else {
          throw new Error('No quote returned from Xero update')
        }
      } else {
        // Create new quote
        const response = await xeroClient.accountingApi.createQuotes(integration.tenantId, {
          quotes: [xeroQuote],
        })

        if (response.body.quotes && response.body.quotes.length > 0) {
          xeroQuoteId = response.body.quotes[0].quoteID!
          console.log(`[Xero] Created quote: ${xeroQuoteId}`)

          // Create entity reference
          await db.collection('xero_entity_references').insertOne({
            orgId,
            integrationId: integration._id.toString(),
            deskwiseEntityId: quoteId,
            deskwiseEntityType: 'quote',
            xeroEntityId: xeroQuoteId,
            xeroEntityType: 'Quote',
            xeroStatus: response.body.quotes[0].status,
            lastSyncedAt: new Date(),
            syncDirection: 'deskwise_to_xero',
            isSyncEnabled: true,
            deskwiseVersion: 1,
            xeroVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          throw new Error('No quote returned from Xero create')
        }
      }

      syncLog.recordsSucceeded = 1
      syncLog.status = 'completed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime

      // Save sync log
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return { success: true, xeroQuoteId }
    } catch (error) {
      console.error('[Xero] Quote sync error:', error)

      syncLog.recordsFailed = 1
      syncLog.status = 'failed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime
      syncLog.errors = [
        {
          entityId: quoteId,
          entityName: 'Quote',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      ]

      // Save sync log
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync customer/client to Xero
   */
  static async syncCustomer(
    orgId: string,
    clientId: string,
    triggeredBy: string
  ): Promise<{ success: boolean; xeroContactId?: string; error?: string }> {
    const startTime = Date.now()
    let syncLog: Partial<XeroSyncLog> = {
      orgId,
      integrationId: '',
      syncType: 'manual',
      entityType: 'Contact',
      syncDirection: 'deskwise_to_xero',
      status: 'pending',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      duration: 0,
      errors: [],
      startedAt: new Date(),
      triggeredBy,
      triggerType: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: triggeredBy,
    }

    try {
      console.log(`[Xero] Syncing customer ${clientId} for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      syncLog.integrationId = integration._id.toString()

      if (!integration.syncContacts) {
        throw new Error('Contact sync is disabled for this integration')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      // Fetch Deskwise client
      const deskwiseClient = await db.collection('clients').findOne({
        _id: new ObjectId(clientId),
        orgId,
      }) as Client | null

      if (!deskwiseClient) {
        throw new Error('Client not found')
      }

      syncLog.recordsProcessed = 1

      // Check if client is already synced
      const existingReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: clientId,
        deskwiseEntityType: 'client',
      }) as XeroEntityReference | null

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Build Xero contact object
      const xeroContact: any = {
        name: deskwiseClient.name || deskwiseClient.companyName || deskwiseClient.email,
        emailAddress: deskwiseClient.email,
        phones: [],
        addresses: [],
      }

      if (deskwiseClient.phone) {
        xeroContact.phones.push({
          phoneType: 'DEFAULT',
          phoneNumber: deskwiseClient.phone,
        })
      }

      if (deskwiseClient.address) {
        xeroContact.addresses.push({
          addressType: 'STREET',
          addressLine1: deskwiseClient.address.street,
          city: deskwiseClient.address.city,
          region: deskwiseClient.address.state,
          postalCode: (deskwiseClient.address as any).postalCode || (deskwiseClient.address as any).zip,
          country: deskwiseClient.address.country,
        })
      }

      let xeroContactId: string

      if (existingReference && existingReference.xeroEntityId) {
        // Update existing contact
        xeroContact.contactID = existingReference.xeroEntityId

        const response = await xeroClient.accountingApi.updateContact(
          integration.tenantId,
          existingReference.xeroEntityId,
          { contacts: [xeroContact] }
        )

        if (response.body.contacts && response.body.contacts.length > 0) {
          xeroContactId = response.body.contacts[0].contactID!
          console.log(`[Xero] Updated contact: ${xeroContactId}`)
        } else {
          throw new Error('No contact returned from Xero update')
        }
      } else {
        // Create new contact
        const response = await xeroClient.accountingApi.createContacts(integration.tenantId, {
          contacts: [xeroContact],
        })

        if (response.body.contacts && response.body.contacts.length > 0) {
          xeroContactId = response.body.contacts[0].contactID!
          console.log(`[Xero] Created contact: ${xeroContactId}`)

          // Create entity reference
          await db.collection('xero_entity_references').insertOne({
            orgId,
            integrationId: integration._id.toString(),
            deskwiseEntityId: clientId,
            deskwiseEntityType: 'client',
            xeroEntityId: xeroContactId,
            xeroEntityType: 'Contact',
            xeroStatus: response.body.contacts[0].contactStatus,
            lastSyncedAt: new Date(),
            syncDirection: 'deskwise_to_xero',
            isSyncEnabled: true,
            deskwiseVersion: 1,
            xeroVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          throw new Error('No contact returned from Xero create')
        }
      }

      syncLog.recordsSucceeded = 1
      syncLog.status = 'completed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime

      // Save sync log
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return { success: true, xeroContactId }
    } catch (error) {
      console.error('[Xero] Customer sync error:', error)

      syncLog.recordsFailed = 1
      syncLog.status = 'failed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime
      syncLog.errors = [
        {
          entityId: clientId,
          entityName: 'Client',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      ]

      // Save sync log
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Sync product/item to Xero
   */
  static async syncProduct(
    orgId: string,
    productId: string,
    triggeredBy: string
  ): Promise<{ success: boolean; xeroItemId?: string; error?: string }> {
    const startTime = Date.now()
    let syncLog: Partial<XeroSyncLog> = {
      orgId,
      integrationId: '',
      syncType: 'manual',
      entityType: 'Item',
      syncDirection: 'deskwise_to_xero',
      status: 'pending',
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      duration: 0,
      errors: [],
      startedAt: new Date(),
      triggeredBy,
      triggerType: 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: triggeredBy,
    }

    try {
      console.log(`[Xero] Syncing product ${productId} for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      syncLog.integrationId = integration._id.toString()

      if (!integration.syncProducts) {
        throw new Error('Product sync is disabled for this integration')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      // Fetch Deskwise product
      const product = await db.collection('products').findOne({
        _id: new ObjectId(productId),
        orgId,
      }) as Product | null

      if (!product) {
        throw new Error('Product not found')
      }

      syncLog.recordsProcessed = 1

      // Check if product is already synced
      const existingReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: productId,
        deskwiseEntityType: 'product',
      }) as XeroEntityReference | null

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Build Xero item object
      const xeroItem: any = {
        code: product.sku,
        name: product.name,
        description: product.description,
        salesDetails: {
          unitPrice: product.unitPrice,
          accountCode: integration.defaultRevenueAccount,
          taxType: product.isTaxable ? integration.defaultTaxType : 'NONE',
        },
        isTrackedAsInventory: false,
        isSold: true,
        isPurchased: false,
      }

      let xeroItemId: string

      if (existingReference && existingReference.xeroEntityId) {
        // Update existing item
        xeroItem.itemID = existingReference.xeroEntityId

        const response = await xeroClient.accountingApi.updateItem(
          integration.tenantId,
          existingReference.xeroEntityId,
          { items: [xeroItem] }
        )

        if (response.body.items && response.body.items.length > 0) {
          xeroItemId = response.body.items[0].itemID!
          console.log(`[Xero] Updated item: ${xeroItemId}`)
        } else {
          throw new Error('No item returned from Xero update')
        }
      } else {
        // Create new item
        const response = await xeroClient.accountingApi.createItems(integration.tenantId, {
          items: [xeroItem],
        })

        if (response.body.items && response.body.items.length > 0) {
          xeroItemId = response.body.items[0].itemID!
          console.log(`[Xero] Created item: ${xeroItemId}`)

          // Create entity reference
          await db.collection('xero_entity_references').insertOne({
            orgId,
            integrationId: integration._id.toString(),
            deskwiseEntityId: productId,
            deskwiseEntityType: 'product',
            xeroEntityId: xeroItemId,
            xeroEntityType: 'Item',
            lastSyncedAt: new Date(),
            syncDirection: 'deskwise_to_xero',
            isSyncEnabled: true,
            deskwiseVersion: 1,
            xeroVersion: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        } else {
          throw new Error('No item returned from Xero create')
        }
      }

      syncLog.recordsSucceeded = 1
      syncLog.status = 'completed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime

      // Save sync log
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return { success: true, xeroItemId }
    } catch (error) {
      console.error('[Xero] Product sync error:', error)

      syncLog.recordsFailed = 1
      syncLog.status = 'failed'
      syncLog.completedAt = new Date()
      syncLog.duration = Date.now() - startTime
      syncLog.errors = [
        {
          entityId: productId,
          entityName: 'Product',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date(),
        },
      ]

      // Save sync log
      const client = await clientPromise
      const db = client.db('deskwise')
      await db.collection('xero_sync_logs').insertOne(syncLog as XeroSyncLog)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Record payment in Xero
   */
  static async recordPayment(
    orgId: string,
    invoiceId: string,
    paymentAmount: number,
    paymentDate: Date,
    triggeredBy: string
  ): Promise<{ success: boolean; xeroPaymentId?: string; error?: string }> {
    try {
      console.log(`[Xero] Recording payment for invoice ${invoiceId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      if (!integration.syncPayments) {
        throw new Error('Payment sync is disabled for this integration')
      }

      // Get Xero invoice reference
      const client = await clientPromise
      const db = client.db('deskwise')

      const invoiceReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: invoiceId,
        deskwiseEntityType: 'invoice',
      }) as XeroEntityReference | null

      if (!invoiceReference || !invoiceReference.xeroEntityId) {
        throw new Error('Invoice not synced to Xero. Please sync invoice first.')
      }

      const xeroClient = await this.getAuthenticatedClient(orgId)

      // Create payment
      const payment: any = {
        invoice: {
          invoiceID: invoiceReference.xeroEntityId,
        },
        account: {
          code: integration.defaultBankAccount || integration.defaultRevenueAccount,
        },
        amount: paymentAmount,
        date: paymentDate.toISOString().split('T')[0],
      }

      const response = await xeroClient.accountingApi.createPayments(integration.tenantId, {
        payments: [payment],
      })

      if (response.body.payments && response.body.payments.length > 0) {
        const xeroPaymentId = response.body.payments[0].paymentID!
        console.log(`[Xero] Created payment: ${xeroPaymentId}`)

        return { success: true, xeroPaymentId }
      }

      throw new Error('No payment returned from Xero')
    } catch (error) {
      console.error('[Xero] Payment recording error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get tax rates from Xero
   */
  static async getTaxRates(orgId: string): Promise<any[]> {
    try {
      console.log(`[Xero] Fetching tax rates for org: ${orgId}`)

      const integration = await this.getIntegration(orgId)
      if (!integration) {
        throw new Error('Xero integration not found')
      }

      const xeroClient = await this.getAuthenticatedClient(orgId)

      const response = await xeroClient.accountingApi.getTaxRates(integration.tenantId)

      if (response.body.taxRates) {
        console.log(`[Xero] Fetched ${response.body.taxRates.length} tax rates`)
        return response.body.taxRates
      }

      return []
    } catch (error) {
      console.error('[Xero] Error fetching tax rates:', error)
      throw new Error(`Failed to fetch tax rates: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get or create contact in Xero
   * Helper method to ensure contact exists before creating invoice/quote
   */
  private static async getOrCreateContact(orgId: string, clientId: string): Promise<string> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      // Check if contact is already synced
      const existingReference = await db.collection('xero_entity_references').findOne({
        orgId,
        deskwiseEntityId: clientId,
        deskwiseEntityType: 'client',
      }) as XeroEntityReference | null

      if (existingReference && existingReference.xeroEntityId) {
        return existingReference.xeroEntityId
      }

      // Sync contact first
      const result = await this.syncCustomer(orgId, clientId, 'system')

      if (result.success && result.xeroContactId) {
        return result.xeroContactId
      }

      throw new Error('Failed to create contact in Xero')
    } catch (error) {
      console.error('[Xero] Error getting/creating contact:', error)
      throw error
    }
  }

  /**
   * Map Deskwise invoice status to Xero status
   */
  private static mapInvoiceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      sent: 'SUBMITTED',
      viewed: 'SUBMITTED',
      partial: 'AUTHORISED',
      paid: 'PAID',
      overdue: 'AUTHORISED',
      cancelled: 'VOIDED',
      refunded: 'VOIDED',
    }

    return statusMap[status] || 'DRAFT'
  }

  /**
   * Map Deskwise quote status to Xero status
   */
  private static mapQuoteStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'DRAFT',
      sent: 'SENT',
      viewed: 'SENT',
      approved: 'ACCEPTED',
      declined: 'DECLINED',
      expired: 'DELETED',
      converted: 'INVOICED',
    }

    return statusMap[status] || 'DRAFT'
  }

  /**
   * Get sync logs for an organization
   */
  static async getSyncLogs(
    orgId: string,
    limit: number = 50
  ): Promise<XeroSyncLog[]> {
    try {
      const client = await clientPromise
      const db = client.db('deskwise')

      const logs = await db
        .collection('xero_sync_logs')
        .find({ orgId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()

      return logs as XeroSyncLog[]
    } catch (error) {
      console.error('[Xero] Error fetching sync logs:', error)
      throw new Error(`Failed to fetch sync logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
