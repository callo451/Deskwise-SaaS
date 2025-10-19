import { clientPromise } from '../mongodb'
import {
  MYOBIntegration,
  MYOBSyncLog,
  MYOBMapping,
  MYOBCompanyFile,
  MYOBCustomer,
  MYOBItem,
  MYOBInvoice,
  MYOBQuote,
  MYOBPayment,
  MYOBTaxCode,
  MYOBEntityType,
  MYOBSyncDirection,
  MYOBSyncStatus,
  Invoice,
  Quote,
  Client,
  Product,
} from '../types'
import { ObjectId } from 'mongodb'
import * as crypto from 'crypto'
import axios, { AxiosInstance } from 'axios'

/**
 * Encryption utility for storing sensitive data
 */
class EncryptionService {
  private static algorithm = 'aes-256-gcm'
  private static keyLength = 32

  private static getKey(): Buffer {
    const secret = process.env.INTEGRATION_ENCRYPTION_KEY
    if (!secret) {
      throw new Error('INTEGRATION_ENCRYPTION_KEY not configured')
    }
    // Derive a 32-byte key from the secret
    return crypto.scryptSync(secret, 'salt', this.keyLength)
  }

  static encrypt(text: string): string {
    const iv = crypto.randomBytes(16)
    const key = this.getKey()
    const cipher = crypto.createCipheriv(this.algorithm, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag()

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format')
    }

    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]

    const key = this.getKey()
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}

/**
 * MYOB AccountRight Integration Service
 * Handles OAuth, API calls, and data synchronization
 */
export class MYOBIntegrationService {
  private static readonly BASE_URL = 'https://api.myob.com/accountright'
  private static readonly AUTH_URL = 'https://secure.myob.com/oauth2/v1/authorize'
  private static readonly TOKEN_URL = 'https://secure.myob.com/oauth2/v1/token'

  /**
   * Get MYOB API client instance
   */
  private static getApiClient(accessToken: string, companyFileUri?: string): AxiosInstance {
    const decryptedToken = EncryptionService.decrypt(accessToken)

    return axios.create({
      baseURL: companyFileUri || this.BASE_URL,
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        'x-myobapi-key': process.env.MYOB_CLIENT_ID || '',
        'x-myobapi-version': 'v2',
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(orgId: string): string {
    const clientId = process.env.MYOB_CLIENT_ID
    const redirectUri = process.env.MYOB_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/myob/callback`

    if (!clientId) {
      throw new Error('MYOB_CLIENT_ID not configured')
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'CompanyFile', // Use 'CompanyFile' for keys created before March 12, 2025
      state: orgId, // Pass orgId for verification
    })

    return `${this.AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const clientId = process.env.MYOB_CLIENT_ID
    const clientSecret = process.env.MYOB_CLIENT_SECRET
    const redirectUri = process.env.MYOB_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/myob/callback`

    if (!clientId || !clientSecret) {
      throw new Error('MYOB credentials not configured')
    }

    try {
      const response = await axios.post(
        this.TOKEN_URL,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
          grant_type: 'authorization_code',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 1200, // Default 20 minutes
      }
    } catch (error: any) {
      console.error('MYOB token exchange error:', error.response?.data || error.message)
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`)
    }
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    expiresIn: number
  }> {
    const clientId = process.env.MYOB_CLIENT_ID
    const clientSecret = process.env.MYOB_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('MYOB credentials not configured')
    }

    const decryptedRefreshToken = EncryptionService.decrypt(refreshToken)

    try {
      const response = await axios.post(
        this.TOKEN_URL,
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: decryptedRefreshToken,
          grant_type: 'refresh_token',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in || 1200,
      }
    } catch (error: any) {
      console.error('MYOB token refresh error:', error.response?.data || error.message)
      throw new Error(`Failed to refresh token: ${error.response?.data?.error_description || error.message}`)
    }
  }

  /**
   * Get list of company files
   */
  static async getCompanyFiles(accessToken: string): Promise<MYOBCompanyFile[]> {
    const client = this.getApiClient(accessToken)

    try {
      const response = await client.get('/')

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid company files response')
      }

      return response.data.map((file: any) => ({
        id: file.Id,
        name: file.Name,
        libraryPath: file.LibraryPath,
        serialNumber: file.SerialNumber,
        productVersion: file.ProductVersion,
        productLevel: file.ProductLevel,
        checkoutStatus: file.CheckoutStatus,
        uri: file.Uri,
      }))
    } catch (error: any) {
      console.error('MYOB get company files error:', error.response?.data || error.message)
      throw new Error(`Failed to get company files: ${error.message}`)
    }
  }

  /**
   * Create or update MYOB integration
   */
  static async saveIntegration(
    orgId: string,
    data: {
      code?: string
      accessToken?: string
      refreshToken?: string
      companyFileId?: string
      companyFileName?: string
      companyFileUri?: string
    },
    userId: string
  ): Promise<MYOBIntegration> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const apiKey = process.env.MYOB_CLIENT_ID || ''
    const apiSecret = EncryptionService.encrypt(process.env.MYOB_CLIENT_SECRET || '')

    // Check for existing integration
    const existing = await db.collection('myob_integrations').findOne({ orgId })

    let tokens
    if (data.code) {
      // Exchange code for tokens
      tokens = await this.exchangeCodeForTokens(data.code)
    } else if (data.accessToken && data.refreshToken) {
      // Use provided tokens
      tokens = {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: 1200,
      }
    } else if (existing) {
      // Use existing tokens (updating company file selection)
      tokens = {
        accessToken: EncryptionService.decrypt(existing.accessToken),
        refreshToken: EncryptionService.decrypt(existing.refreshToken),
        expiresIn: 1200,
      }
    } else {
      throw new Error('No authentication data provided')
    }

    // Encrypt tokens
    const encryptedAccessToken = EncryptionService.encrypt(tokens.accessToken)
    const encryptedRefreshToken = EncryptionService.encrypt(tokens.refreshToken)

    const accessTokenExpiresAt = new Date(now.getTime() + tokens.expiresIn * 1000)
    const refreshTokenExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week

    const integrationData: Partial<MYOBIntegration> = {
      status: 'connected',
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      apiKey,
      apiSecret,
      environment: 'live',
      updatedAt: now,
    }

    // Add company file info if provided
    if (data.companyFileId) {
      integrationData.companyFileId = data.companyFileId
      integrationData.companyFileName = data.companyFileName || ''
      integrationData.companyFileUri = data.companyFileUri
    }

    if (existing) {
      // Update existing
      await db.collection('myob_integrations').updateOne(
        { _id: existing._id },
        {
          $set: integrationData,
        }
      )

      return {
        ...existing,
        ...integrationData,
      } as MYOBIntegration
    } else {
      // Create new
      const newIntegration: Omit<MYOBIntegration, '_id'> = {
        orgId,
        ...integrationData,
        companyFileId: data.companyFileId || '',
        companyFileName: data.companyFileName || '',
        syncSettings: {
          autoSync: false,
          syncInterval: 60,
          syncDirection: 'deskwise_to_myob',
          enabledEntities: ['Invoice', 'Quote', 'Customer', 'Item'],
        },
        fieldMappings: {},
        createdAt: now,
        createdBy: userId,
      } as Omit<MYOBIntegration, '_id'>

      const result = await db.collection('myob_integrations').insertOne(newIntegration)

      return {
        _id: result.insertedId,
        ...newIntegration,
      } as MYOBIntegration
    }
  }

  /**
   * Get integration for organization
   */
  static async getIntegration(orgId: string): Promise<MYOBIntegration | null> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const integration = await db.collection('myob_integrations').findOne({ orgId })

    return integration as MYOBIntegration | null
  }

  /**
   * Ensure access token is valid (refresh if needed)
   */
  static async ensureValidToken(integration: MYOBIntegration): Promise<string> {
    const now = new Date()

    // Check if access token is expired or about to expire (within 1 minute)
    if (integration.accessTokenExpiresAt < new Date(now.getTime() + 60000)) {
      console.log('Access token expired, refreshing...')

      // Refresh token
      const tokens = await this.refreshAccessToken(integration.refreshToken)

      // Update integration with new tokens
      const client = await clientPromise
      const db = client.db('deskwise')

      const encryptedAccessToken = EncryptionService.encrypt(tokens.accessToken)
      const encryptedRefreshToken = EncryptionService.encrypt(tokens.refreshToken)

      await db.collection('myob_integrations').updateOne(
        { _id: integration._id },
        {
          $set: {
            accessToken: encryptedAccessToken,
            refreshToken: encryptedRefreshToken,
            accessTokenExpiresAt: new Date(now.getTime() + tokens.expiresIn * 1000),
            refreshTokenExpiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            status: 'connected',
            updatedAt: now,
          },
        }
      )

      return tokens.accessToken
    }

    // Token is still valid
    return EncryptionService.decrypt(integration.accessToken)
  }

  /**
   * Test connection and get company files
   */
  static async testConnection(orgId: string): Promise<{
    success: boolean
    message: string
    companyFiles?: MYOBCompanyFile[]
  }> {
    try {
      const integration = await this.getIntegration(orgId)
      if (!integration) {
        return {
          success: false,
          message: 'Integration not found',
        }
      }

      const accessToken = await this.ensureValidToken(integration)
      const companyFiles = await this.getCompanyFiles(EncryptionService.encrypt(accessToken))

      // Update last tested
      const client = await clientPromise
      const db = client.db('deskwise')

      await db.collection('myob_integrations').updateOne(
        { _id: integration._id },
        {
          $set: {
            lastTestedAt: new Date(),
            lastTestResult: {
              success: true,
              message: `Found ${companyFiles.length} company file(s)`,
              timestamp: new Date(),
              companyFiles,
            },
            status: 'connected',
          },
        }
      )

      return {
        success: true,
        message: `Successfully connected. Found ${companyFiles.length} company file(s)`,
        companyFiles,
      }
    } catch (error: any) {
      console.error('MYOB connection test error:', error)

      // Update test result
      try {
        const integration = await this.getIntegration(orgId)
        if (integration) {
          const client = await clientPromise
          const db = client.db('deskwise')

          await db.collection('myob_integrations').updateOne(
            { _id: integration._id },
            {
              $set: {
                lastTestedAt: new Date(),
                lastTestResult: {
                  success: false,
                  message: error.message,
                  timestamp: new Date(),
                },
                status: 'error',
              },
            }
          )
        }
      } catch (updateError) {
        console.error('Failed to update test result:', updateError)
      }

      return {
        success: false,
        message: error.message,
      }
    }
  }

  /**
   * Disconnect integration
   */
  static async disconnect(orgId: string): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('myob_integrations').updateOne(
      { orgId },
      {
        $set: {
          status: 'disconnected',
          updatedAt: new Date(),
        },
      }
    )

    // Note: MYOB doesn't have a token revocation endpoint
    // Tokens will expire naturally (access: 20 min, refresh: 1 week)
  }

  /**
   * Delete integration (complete removal)
   */
  static async deleteIntegration(orgId: string): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Delete integration
    await db.collection('myob_integrations').deleteOne({ orgId })

    // Delete mappings
    await db.collection('myob_mappings').deleteMany({ orgId })

    // Delete sync logs (optional - keep for audit trail)
    // await db.collection('myob_sync_logs').deleteMany({ orgId })
  }

  /**
   * Get tax codes from MYOB
   */
  static async getTaxCodes(orgId: string): Promise<MYOBTaxCode[]> {
    const integration = await this.getIntegration(orgId)
    if (!integration || !integration.companyFileUri) {
      throw new Error('Integration not configured or company file not selected')
    }

    const accessToken = await this.ensureValidToken(integration)
    const client = this.getApiClient(EncryptionService.encrypt(accessToken), integration.companyFileUri)

    try {
      const response = await client.get(`/${integration.companyFileId}/Tax/TaxCode`)

      if (!response.data?.Items) {
        return []
      }

      return response.data.Items.map((taxCode: any) => ({
        uid: taxCode.UID,
        code: taxCode.Code,
        description: taxCode.Description,
        rate: taxCode.Rate || 0,
        type: taxCode.Type || 'GST',
        isActive: taxCode.IsActive !== false,
      }))
    } catch (error: any) {
      console.error('MYOB get tax codes error:', error.response?.data || error.message)
      throw new Error(`Failed to get tax codes: ${error.message}`)
    }
  }

  /**
   * Sync customer to MYOB
   */
  static async syncCustomer(
    orgId: string,
    client: Client,
    action: 'create' | 'update' = 'create'
  ): Promise<{ uid: string; rowVersion: string }> {
    const integration = await this.getIntegration(orgId)
    if (!integration || !integration.companyFileUri) {
      throw new Error('Integration not configured or company file not selected')
    }

    const accessToken = await this.ensureValidToken(integration)
    const apiClient = this.getApiClient(EncryptionService.encrypt(accessToken), integration.companyFileUri)

    // Map Deskwise client to MYOB customer
    const myobCustomer: Partial<MYOBCustomer> = {
      companyName: client.name,
      isIndividual: false,
      isActive: client.status === 'active',
      addresses: client.address
        ? [
            {
              location: 1,
              street: client.address.street,
              city: client.address.city,
              state: client.address.state,
              postcode: (client.address as any).postalCode || (client.address as any).zip || '',
              country: client.address.country,
              phone1: client.phone,
              email: client.email,
              website: client.website,
            },
          ]
        : undefined,
      notes: client.notes,
    }

    try {
      // Check if mapping exists
      const db = (await clientPromise).db('deskwise')
      const mapping = await db.collection('myob_mappings').findOne({
        orgId,
        integrationId: integration._id.toString(),
        deskwiseEntityType: 'client',
        deskwiseEntityId: client._id.toString(),
      })

      let response
      if (mapping && action === 'update') {
        // Update existing customer
        const updatePayload = {
          ...myobCustomer,
          UID: mapping.myobUid,
          RowVersion: mapping.myobRowVersion,
        }

        response = await apiClient.put(`/${integration.companyFileId}/Contact/Customer/${mapping.myobUid}`, updatePayload)
      } else {
        // Create new customer
        response = await apiClient.post(`/${integration.companyFileId}/Contact/Customer`, myobCustomer)
      }

      const uid = response.headers.location?.split('/').pop() || mapping?.myobUid || ''
      const rowVersion = response.headers['x-myobapi-version'] || ''

      // Save or update mapping
      if (mapping) {
        await db.collection('myob_mappings').updateOne(
          { _id: mapping._id },
          {
            $set: {
              myobRowVersion: rowVersion,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }
        )
      } else {
        await db.collection('myob_mappings').insertOne({
          orgId,
          integrationId: integration._id.toString(),
          deskwiseEntityType: 'client',
          deskwiseEntityId: client._id.toString(),
          myobEntityType: 'Customer',
          myobEntityId: uid,
          myobUid: uid,
          myobRowVersion: rowVersion,
          lastSyncedAt: new Date(),
          syncDirection: 'deskwise_to_myob',
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return { uid, rowVersion }
    } catch (error: any) {
      console.error('MYOB sync customer error:', error.response?.data || error.message)
      throw new Error(`Failed to sync customer: ${error.response?.data?.Errors?.[0]?.Message || error.message}`)
    }
  }

  /**
   * Sync invoice to MYOB
   */
  static async syncInvoice(
    orgId: string,
    invoice: Invoice,
    action: 'create' | 'update' = 'create'
  ): Promise<{ uid: string; rowVersion: string; number?: string }> {
    const integration = await this.getIntegration(orgId)
    if (!integration || !integration.companyFileUri) {
      throw new Error('Integration not configured or company file not selected')
    }

    const accessToken = await this.ensureValidToken(integration)
    const apiClient = this.getApiClient(EncryptionService.encrypt(accessToken), integration.companyFileUri)

    const db = (await clientPromise).db('deskwise')

    // Get customer mapping
    const customerMapping = invoice.clientId
      ? await db.collection('myob_mappings').findOne({
          orgId,
          deskwiseEntityType: 'client',
          deskwiseEntityId: invoice.clientId,
        })
      : null

    if (!customerMapping) {
      throw new Error('Customer not synced to MYOB. Please sync the customer first.')
    }

    // Get tax codes (use first active tax code as default)
    const taxCodes = await this.getTaxCodes(orgId)
    const defaultTaxCode = taxCodes.find((tc) => tc.isActive)

    if (!defaultTaxCode) {
      throw new Error('No active tax code found in MYOB')
    }

    // Map Deskwise invoice to MYOB invoice
    const myobInvoice: Partial<MYOBInvoice> = {
      date: invoice.invoiceDate.toISOString().split('T')[0],
      customer: {
        uid: customerMapping.myobUid || '',
      },
      lines: invoice.lineItems.map((item, index) => ({
        rowId: index + 1,
        type: 'Transaction' as const,
        description: item.description,
        total: item.total,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxCode: {
          uid: defaultTaxCode.uid,
        },
      })),
      subtotal: invoice.subtotal,
      totalTax: invoice.taxAmount,
      totalAmount: invoice.total,
      comment: invoice.memo,
      isTaxInclusive: false,
      status: invoice.status === 'paid' ? 'Closed' : 'Open',
    }

    try {
      // Check if mapping exists
      const mapping = await db.collection('myob_mappings').findOne({
        orgId,
        integrationId: integration._id.toString(),
        deskwiseEntityType: 'invoice',
        deskwiseEntityId: invoice._id.toString(),
      })

      let response
      if (mapping && action === 'update') {
        // Update existing invoice
        const updatePayload = {
          ...myobInvoice,
          UID: mapping.myobUid,
          RowVersion: mapping.myobRowVersion,
        }

        response = await apiClient.put(
          `/${integration.companyFileId}/Sale/Invoice/Item/${mapping.myobUid}`,
          updatePayload
        )
      } else {
        // Create new invoice
        response = await apiClient.post(`/${integration.companyFileId}/Sale/Invoice/Item`, myobInvoice)
      }

      const uid = response.headers.location?.split('/').pop() || mapping?.myobUid || ''
      const rowVersion = response.headers['x-myobapi-version'] || ''

      // Get the invoice number from MYOB
      const invoiceData = await apiClient.get(`/${integration.companyFileId}/Sale/Invoice/Item/${uid}`)
      const myobInvoiceNumber = invoiceData.data?.Number

      // Save or update mapping
      if (mapping) {
        await db.collection('myob_mappings').updateOne(
          { _id: mapping._id },
          {
            $set: {
              myobRowVersion: rowVersion,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }
        )
      } else {
        await db.collection('myob_mappings').insertOne({
          orgId,
          integrationId: integration._id.toString(),
          deskwiseEntityType: 'invoice',
          deskwiseEntityId: invoice._id.toString(),
          myobEntityType: 'Invoice',
          myobEntityId: uid,
          myobUid: uid,
          myobRowVersion: rowVersion,
          lastSyncedAt: new Date(),
          syncDirection: 'deskwise_to_myob',
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return { uid, rowVersion, number: myobInvoiceNumber }
    } catch (error: any) {
      console.error('MYOB sync invoice error:', error.response?.data || error.message)
      throw new Error(`Failed to sync invoice: ${error.response?.data?.Errors?.[0]?.Message || error.message}`)
    }
  }

  /**
   * Sync quote to MYOB
   */
  static async syncQuote(
    orgId: string,
    quote: Quote,
    action: 'create' | 'update' = 'create'
  ): Promise<{ uid: string; rowVersion: string; number?: string }> {
    const integration = await this.getIntegration(orgId)
    if (!integration || !integration.companyFileUri) {
      throw new Error('Integration not configured or company file not selected')
    }

    const accessToken = await this.ensureValidToken(integration)
    const apiClient = this.getApiClient(EncryptionService.encrypt(accessToken), integration.companyFileUri)

    const db = (await clientPromise).db('deskwise')

    // Get customer mapping
    const customerMapping = await db.collection('myob_mappings').findOne({
      orgId,
      deskwiseEntityType: 'client',
      deskwiseEntityId: quote.clientId,
    })

    if (!customerMapping) {
      throw new Error('Customer not synced to MYOB. Please sync the customer first.')
    }

    // Get tax codes
    const taxCodes = await this.getTaxCodes(orgId)
    const defaultTaxCode = taxCodes.find((tc) => tc.isActive)

    if (!defaultTaxCode) {
      throw new Error('No active tax code found in MYOB')
    }

    // Map Deskwise quote to MYOB quote
    const myobQuote: Partial<MYOBQuote> = {
      date: quote.createdAt.toISOString().split('T')[0],
      customer: {
        uid: customerMapping.myobUid || '',
      },
      lines: quote.lineItems.map((item, index) => ({
        rowId: index + 1,
        type: 'Transaction' as const,
        description: item.description,
        total: item.total,
        quantity: item.quantity,
        unitPrice: item.rate,
        taxCode: {
          uid: defaultTaxCode.uid,
        },
      })),
      subtotal: quote.subtotal,
      totalTax: quote.tax || 0,
      totalAmount: quote.total,
      expirationDate: quote.validUntil.toISOString().split('T')[0],
      comment: quote.notes,
      isTaxInclusive: false,
      status: quote.status === 'accepted' ? 'Accepted' : 'Open',
    }

    try {
      const mapping = await db.collection('myob_mappings').findOne({
        orgId,
        integrationId: integration._id.toString(),
        deskwiseEntityType: 'quote',
        deskwiseEntityId: quote._id.toString(),
      })

      let response
      if (mapping && action === 'update') {
        const updatePayload = {
          ...myobQuote,
          UID: mapping.myobUid,
          RowVersion: mapping.myobRowVersion,
        }

        response = await apiClient.put(
          `/${integration.companyFileId}/Sale/Quote/Item/${mapping.myobUid}`,
          updatePayload
        )
      } else {
        response = await apiClient.post(`/${integration.companyFileId}/Sale/Quote/Item`, myobQuote)
      }

      const uid = response.headers.location?.split('/').pop() || mapping?.myobUid || ''
      const rowVersion = response.headers['x-myobapi-version'] || ''

      const quoteData = await apiClient.get(`/${integration.companyFileId}/Sale/Quote/Item/${uid}`)
      const myobQuoteNumber = quoteData.data?.Number

      if (mapping) {
        await db.collection('myob_mappings').updateOne(
          { _id: mapping._id },
          {
            $set: {
              myobRowVersion: rowVersion,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              updatedAt: new Date(),
            },
          }
        )
      } else {
        await db.collection('myob_mappings').insertOne({
          orgId,
          integrationId: integration._id.toString(),
          deskwiseEntityType: 'quote',
          deskwiseEntityId: quote._id.toString(),
          myobEntityType: 'Quote',
          myobEntityId: uid,
          myobUid: uid,
          myobRowVersion: rowVersion,
          lastSyncedAt: new Date(),
          syncDirection: 'deskwise_to_myob',
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      return { uid, rowVersion, number: myobQuoteNumber }
    } catch (error: any) {
      console.error('MYOB sync quote error:', error.response?.data || error.message)
      throw new Error(`Failed to sync quote: ${error.response?.data?.Errors?.[0]?.Message || error.message}`)
    }
  }

  /**
   * Create sync log
   */
  static async createSyncLog(
    orgId: string,
    integrationId: string,
    entityType: MYOBEntityType,
    direction: MYOBSyncDirection,
    triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'auto',
    userId?: string
  ): Promise<ObjectId> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const syncLog: Omit<MYOBSyncLog, '_id'> = {
      orgId,
      integrationId,
      entityType,
      direction,
      status: 'pending',
      totalRecords: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      startedAt: new Date(),
      syncedRecords: [],
      errors: [],
      triggeredBy,
      triggeredByUser: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId || 'system',
    }

    const result = await db.collection('myob_sync_logs').insertOne(syncLog)
    return result.insertedId
  }

  /**
   * Update sync log
   */
  static async updateSyncLog(
    logId: ObjectId,
    update: Partial<MYOBSyncLog>
  ): Promise<void> {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('myob_sync_logs').updateOne(
      { _id: logId },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Get sync logs
   */
  static async getSyncLogs(
    orgId: string,
    filters?: {
      entityType?: MYOBEntityType
      status?: MYOBSyncStatus
      limit?: number
    }
  ): Promise<MYOBSyncLog[]> {
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
      .collection('myob_sync_logs')
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 50)
      .toArray()

    return logs as MYOBSyncLog[]
  }
}
