# Accounting Integrations Developer Guide

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Database Schema](#database-schema)
- [Service Layer Design](#service-layer-design)
- [API Endpoints Reference](#api-endpoints-reference)
- [OAuth Flow](#oauth-flow)
- [Data Mapping Specifications](#data-mapping-specifications)
- [Error Handling Patterns](#error-handling-patterns)
- [Testing Strategy](#testing-strategy)
- [Security Considerations](#security-considerations)
- [Rate Limiting Strategies](#rate-limiting-strategies)
- [Webhook Implementation](#webhook-implementation)
- [Adding a New Platform](#adding-a-new-platform)
- [Performance Optimization](#performance-optimization)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Deskwise Application                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Frontend   │───▶│  API Routes  │───▶│   Service    │     │
│  │  Components  │    │              │    │    Layer     │     │
│  └──────────────┘    └──────────────┘    └──────┬───────┘     │
│                                                   │              │
│                                                   │              │
│  ┌──────────────────────────────────────────────▼───────────┐  │
│  │           Integration Service Layer                      │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │  • AccountingIntegrationService (base)                   │  │
│  │  • XeroIntegrationService                                │  │
│  │  • QuickBooksIntegrationService                          │  │
│  │  • MYOBIntegrationService                                │  │
│  └──────────────┬───────────────────────┬────────────────────┘  │
│                 │                       │                        │
│                 ▼                       ▼                        │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │  Sync Queue Manager  │   │  Webhook Handler     │           │
│  │  (Bull/BullMQ)      │   │  (Event-driven)      │           │
│  └──────────┬───────────┘   └──────────────────────┘           │
│             │                                                    │
└─────────────┼────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB Database                          │
├─────────────────────────────────────────────────────────────────┤
│  • accounting_connections                                        │
│  • accounting_sync_queue                                         │
│  • accounting_sync_history                                       │
│  • accounting_webhooks                                           │
│  • accounting_mappings                                           │
│  • invoices (with externalId)                                    │
│  • clients (with externalId)                                     │
│  • products (with externalId)                                    │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ External API Calls
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Accounting APIs                       │
├─────────────────────────────────────────────────────────────────┤
│  • Xero API (OAuth 2.0)                                         │
│  • QuickBooks API (OAuth 2.0)                                   │
│  • MYOB API (OAuth 2.0)                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Design Principles

1. **Abstraction**: Common interface for all accounting platforms
2. **Modularity**: Each platform has isolated service implementation
3. **Resilience**: Retry logic, error handling, queue-based processing
4. **Scalability**: Async processing, rate limiting, batch operations
5. **Auditability**: Complete logging of all sync operations
6. **Testability**: Dependency injection, mocked external APIs

### Technology Stack

- **Backend Framework**: Next.js 15 API Routes
- **Database**: MongoDB with Mongoose ODM
- **Queue System**: Bull/BullMQ (Redis-based)
- **HTTP Client**: Axios with interceptors
- **OAuth**: NextAuth.js providers for accounting platforms
- **Validation**: Zod schemas
- **Testing**: Jest + Supertest for API, Mock Service Worker for external APIs
- **Logging**: Winston or Pino with structured logging

---

## Database Schema

### Collections Overview

```typescript
// accounting_connections collection
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  status: 'connected' | 'disconnected' | 'error',

  // OAuth tokens
  accessToken: string, // Encrypted
  refreshToken: string, // Encrypted
  tokenExpiry: Date,
  scopes: string[],

  // Platform-specific identifiers
  tenantId: string, // Xero organization ID, QB company ID, MYOB company file ID
  tenantName: string,

  // Configuration
  config: {
    autoSyncInvoices: boolean,
    autoSyncPayments: boolean,
    autoSyncClients: boolean,
    autoSyncProducts: boolean,
    syncDirection: 'to_platform' | 'from_platform' | 'bidirectional',
    defaultIncomeAccount: string,
    defaultTaxCode: string,
    invoiceTemplate: string, // Platform-specific template ID
    // ... platform-specific settings
  },

  // Metadata
  connectedAt: Date,
  connectedBy: string, // User ID
  lastSyncAt: Date,
  lastHealthCheck: Date,
  healthCheckStatus: 'healthy' | 'degraded' | 'unhealthy',

  createdAt: Date,
  updatedAt: Date
}

// accounting_mappings collection
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  mappingType: 'account' | 'tax' | 'payment_term' | 'product_category',

  mappings: [
    {
      deskwiseValue: string, // e.g., "Managed Services" category
      platformValue: string, // e.g., "4-1100" MYOB account code
      platformLabel: string, // e.g., "Sales - Services"
      isDefault: boolean
    }
  ],

  createdAt: Date,
  updatedAt: Date,
  updatedBy: string
}

// accounting_sync_queue collection
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',

  jobId: string, // Bull job ID
  entityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment',
  entityId: string, // Deskwise entity ID
  operation: 'create' | 'update' | 'delete',
  direction: 'to_platform' | 'from_platform',

  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retrying',
  priority: number, // Higher = more urgent

  payload: object, // Entity data to sync

  attempts: number,
  maxAttempts: number,
  lastAttemptAt: Date,
  lastError: string,

  scheduledFor: Date,
  startedAt: Date,
  completedAt: Date,

  createdAt: Date,
  createdBy: string
}

// accounting_sync_history collection
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',

  syncId: string, // Unique sync operation ID
  entityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment',
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  direction: 'to_platform' | 'from_platform',

  status: 'success' | 'failed' | 'partial',

  // Data snapshots
  before: object, // State before sync
  after: object, // State after sync
  changes: object, // Diff of changes

  // Platform response
  platformEntityId: string, // External ID returned by platform
  platformResponse: object, // Raw API response

  // Error details
  errorCode: string,
  errorMessage: string,
  errorStack: string,

  // Timing
  duration: number, // milliseconds
  timestamp: Date,

  // User context
  triggeredBy: string, // User ID or 'system' for auto-sync
  triggerType: 'manual' | 'auto' | 'webhook' | 'scheduled',

  createdAt: Date
}

// accounting_webhooks collection
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',

  webhookId: string, // Platform's webhook ID
  eventType: string, // e.g., 'invoice.updated', 'payment.created'

  payload: object, // Raw webhook payload
  signature: string, // For verification
  verified: boolean,

  processed: boolean,
  processedAt: Date,
  processingError: string,

  receivedAt: Date
}

// Extended existing collections

// invoices collection (add integration fields)
{
  // ... existing invoice fields

  integration: {
    platform: 'xero' | 'quickbooks' | 'myob',
    externalId: string, // Invoice ID in external platform
    externalNumber: string, // Invoice number in external platform (may differ)
    syncStatus: 'not_synced' | 'pending' | 'synced' | 'failed' | 'conflict',
    lastSyncedAt: Date,
    lastSyncError: string,
    url: string // Deep link to invoice in platform
  }
}

// clients collection (add integration fields)
{
  // ... existing client fields

  integration: {
    platform: 'xero' | 'quickbooks' | 'myob',
    externalId: string,
    syncStatus: 'not_synced' | 'pending' | 'synced' | 'failed',
    lastSyncedAt: Date
  }
}

// products collection (add integration fields)
{
  // ... existing product fields

  integration: {
    platform: 'xero' | 'quickbooks' | 'myob',
    externalId: string,
    syncStatus: 'not_synced' | 'pending' | 'synced' | 'failed',
    lastSyncedAt: Date
  }
}
```

### Indexes

```javascript
// accounting_connections
db.accounting_connections.createIndex({ orgId: 1, platform: 1 }, { unique: true })
db.accounting_connections.createIndex({ tenantId: 1 })
db.accounting_connections.createIndex({ tokenExpiry: 1 })

// accounting_mappings
db.accounting_mappings.createIndex({ orgId: 1, platform: 1, mappingType: 1 }, { unique: true })

// accounting_sync_queue
db.accounting_sync_queue.createIndex({ orgId: 1, status: 1 })
db.accounting_sync_queue.createIndex({ jobId: 1 }, { unique: true })
db.accounting_sync_queue.createIndex({ scheduledFor: 1 })
db.accounting_sync_queue.createIndex({ entityType: 1, entityId: 1 })

// accounting_sync_history
db.accounting_sync_history.createIndex({ orgId: 1, createdAt: -1 })
db.accounting_sync_history.createIndex({ entityType: 1, entityId: 1 })
db.accounting_sync_history.createIndex({ syncId: 1 }, { unique: true })
db.accounting_sync_history.createIndex({ platform: 1, status: 1 })
db.accounting_sync_history.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL

// accounting_webhooks
db.accounting_webhooks.createIndex({ orgId: 1, processed: 1 })
db.accounting_webhooks.createIndex({ webhookId: 1 }, { unique: true })
db.accounting_webhooks.createIndex({ receivedAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days TTL

// invoices
db.invoices.createIndex({ 'integration.externalId': 1 })
db.invoices.createIndex({ 'integration.syncStatus': 1 })

// clients
db.clients.createIndex({ 'integration.externalId': 1 })

// products
db.products.createIndex({ 'integration.externalId': 1 })
```

---

## Service Layer Design

### Base Integration Service (Abstract Class)

```typescript
// src/lib/services/integrations/accounting/base.ts

import { ObjectId } from 'mongodb'

export interface AccountingConnection {
  _id: ObjectId
  orgId: string
  platform: 'xero' | 'quickbooks' | 'myob'
  status: 'connected' | 'disconnected' | 'error'
  accessToken: string
  refreshToken: string
  tokenExpiry: Date
  tenantId: string
  tenantName: string
  config: AccountingConfig
  connectedAt: Date
  lastSyncAt: Date
}

export interface AccountingConfig {
  autoSyncInvoices: boolean
  autoSyncPayments: boolean
  autoSyncClients: boolean
  autoSyncProducts: boolean
  syncDirection: 'to_platform' | 'from_platform' | 'bidirectional'
  defaultIncomeAccount: string
  defaultTaxCode: string
  [key: string]: any // Platform-specific settings
}

export interface SyncResult {
  success: boolean
  externalId?: string
  externalNumber?: string
  error?: string
  platformResponse?: any
}

export interface SyncOptions {
  force?: boolean // Force sync even if already synced
  validate?: boolean // Validate before syncing
  createOnly?: boolean // Only create, don't update
}

/**
 * Base abstract class for all accounting platform integrations
 */
export abstract class BaseAccountingIntegration {
  protected orgId: string
  protected connection: AccountingConnection
  protected apiClient: any // Platform-specific HTTP client

  constructor(orgId: string, connection: AccountingConnection) {
    this.orgId = orgId
    this.connection = connection
    this.apiClient = this.initializeApiClient()
  }

  /**
   * Initialize platform-specific API client with auth
   */
  protected abstract initializeApiClient(): any

  /**
   * Refresh OAuth access token if expired
   */
  protected abstract refreshAccessToken(): Promise<void>

  /**
   * Test connection health
   */
  public abstract testConnection(): Promise<boolean>

  // ==================== INVOICE METHODS ====================

  /**
   * Sync invoice to accounting platform
   */
  public abstract syncInvoice(
    invoiceId: string,
    options?: SyncOptions
  ): Promise<SyncResult>

  /**
   * Pull invoice from accounting platform
   */
  public abstract pullInvoice(externalId: string): Promise<any>

  /**
   * Void/cancel invoice in platform
   */
  public abstract voidInvoice(externalId: string): Promise<SyncResult>

  // ==================== QUOTE/ESTIMATE METHODS ====================

  /**
   * Sync quote to accounting platform
   */
  public abstract syncQuote(
    quoteId: string,
    options?: SyncOptions
  ): Promise<SyncResult>

  /**
   * Convert quote to invoice in platform
   */
  public abstract convertQuoteToInvoice(
    externalQuoteId: string
  ): Promise<SyncResult>

  // ==================== CLIENT/CUSTOMER METHODS ====================

  /**
   * Sync client to accounting platform
   */
  public abstract syncClient(
    clientId: string,
    options?: SyncOptions
  ): Promise<SyncResult>

  /**
   * Pull clients from accounting platform
   */
  public abstract pullClients(
    filters?: any
  ): Promise<any[]>

  // ==================== PRODUCT/ITEM METHODS ====================

  /**
   * Sync product to accounting platform
   */
  public abstract syncProduct(
    productId: string,
    options?: SyncOptions
  ): Promise<SyncResult>

  /**
   * Pull products/items from accounting platform
   */
  public abstract pullProducts(
    filters?: any
  ): Promise<any[]>

  // ==================== PAYMENT METHODS ====================

  /**
   * Pull payments from accounting platform
   */
  public abstract pullPayments(
    filters?: {
      fromDate?: Date
      toDate?: Date
      invoiceId?: string
    }
  ): Promise<any[]>

  /**
   * Apply payment to invoice in Deskwise
   */
  public abstract applyPayment(
    invoiceId: string,
    paymentData: any
  ): Promise<void>

  // ==================== TAX METHODS ====================

  /**
   * Pull tax codes/rates from accounting platform
   */
  public abstract pullTaxCodes(): Promise<any[]>

  // ==================== ACCOUNT METHODS ====================

  /**
   * Pull chart of accounts from accounting platform
   */
  public abstract pullAccounts(): Promise<any[]>

  // ==================== UTILITY METHODS ====================

  /**
   * Get platform-specific URL for entity
   */
  public abstract getEntityUrl(
    entityType: 'invoice' | 'quote' | 'client' | 'product',
    externalId: string
  ): string

  /**
   * Handle webhook from platform
   */
  public abstract handleWebhook(
    eventType: string,
    payload: any
  ): Promise<void>

  // ==================== COMMON HELPER METHODS ====================

  /**
   * Check if token is expired and refresh if needed
   */
  protected async ensureValidToken(): Promise<void> {
    const now = new Date()
    const buffer = 5 * 60 * 1000 // 5 minutes buffer

    if (this.connection.tokenExpiry.getTime() - now.getTime() < buffer) {
      await this.refreshAccessToken()
    }
  }

  /**
   * Log sync operation to history
   */
  protected async logSyncHistory(
    entityType: string,
    entityId: string,
    operation: string,
    direction: string,
    result: SyncResult,
    duration: number,
    triggeredBy: string
  ): Promise<void> {
    const db = await getDatabase()

    await db.collection('accounting_sync_history').insertOne({
      orgId: this.orgId,
      platform: this.connection.platform,
      syncId: new ObjectId().toString(),
      entityType,
      entityId,
      operation,
      direction,
      status: result.success ? 'success' : 'failed',
      platformEntityId: result.externalId,
      platformResponse: result.platformResponse,
      errorMessage: result.error,
      duration,
      timestamp: new Date(),
      triggeredBy,
      triggerType: 'manual', // or 'auto', 'webhook', etc.
      createdAt: new Date()
    })
  }

  /**
   * Handle API errors with proper logging and classification
   */
  protected handleApiError(error: any): SyncResult {
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN_ERROR'

    if (error.response) {
      // HTTP error response
      errorMessage = error.response.data?.message || error.response.statusText
      errorCode = `HTTP_${error.response.status}`
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - unable to reach accounting platform'
      errorCode = 'NETWORK_ERROR'
    } else {
      // Other error
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
      platformResponse: error.response?.data
    }
  }
}
```

### Xero Integration Service

```typescript
// src/lib/services/integrations/accounting/xero.ts

import { BaseAccountingIntegration, SyncResult, SyncOptions } from './base'
import { XeroClient } from 'xero-node'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export class XeroIntegrationService extends BaseAccountingIntegration {
  private xeroClient: XeroClient

  protected initializeApiClient() {
    this.xeroClient = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!],
      scopes: [
        'openid',
        'profile',
        'email',
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings.read'
      ]
    })

    // Set existing tokens
    this.xeroClient.setTokenSet({
      access_token: this.connection.accessToken,
      refresh_token: this.connection.refreshToken,
      expires_at: this.connection.tokenExpiry.getTime() / 1000
    })

    return this.xeroClient
  }

  protected async refreshAccessToken(): Promise<void> {
    const tokenSet = await this.xeroClient.refreshToken()

    // Update connection with new tokens
    const db = await getDatabase()
    await db.collection('accounting_connections').updateOne(
      { _id: this.connection._id },
      {
        $set: {
          accessToken: tokenSet.access_token!,
          refreshToken: tokenSet.refresh_token!,
          tokenExpiry: new Date(tokenSet.expires_at! * 1000),
          updatedAt: new Date()
        }
      }
    )

    // Update local connection object
    this.connection.accessToken = tokenSet.access_token!
    this.connection.refreshToken = tokenSet.refresh_token!
    this.connection.tokenExpiry = new Date(tokenSet.expires_at! * 1000)
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.ensureValidToken()

      const response = await this.xeroClient.accountingApi.getOrganisations(
        this.connection.tenantId
      )

      return response.body.organisations!.length > 0
    } catch (error) {
      console.error('Xero connection test failed:', error)
      return false
    }
  }

  public async syncInvoice(
    invoiceId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const startTime = Date.now()

    try {
      await this.ensureValidToken()

      // Get invoice from Deskwise
      const db = await getDatabase()
      const invoice = await db.collection('invoices').findOne({
        _id: new ObjectId(invoiceId),
        orgId: this.orgId
      })

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Check if already synced
      if (invoice.integration?.externalId && !options.force) {
        return {
          success: true,
          externalId: invoice.integration.externalId,
          externalNumber: invoice.integration.externalNumber
        }
      }

      // Get client (contact) external ID
      const client = await db.collection('clients').findOne({
        _id: new ObjectId(invoice.clientId),
        orgId: this.orgId
      })

      if (!client) {
        throw new Error('Client not found')
      }

      // Ensure client is synced to Xero first
      let contactId = client.integration?.externalId
      if (!contactId) {
        const contactResult = await this.syncClient(invoice.clientId)
        if (!contactResult.success) {
          throw new Error(`Failed to sync client: ${contactResult.error}`)
        }
        contactId = contactResult.externalId
      }

      // Map Deskwise invoice to Xero invoice format
      const xeroInvoice = this.mapInvoiceToXero(invoice, contactId!)

      // Create or update invoice in Xero
      let response
      if (invoice.integration?.externalId && !options.createOnly) {
        // Update existing
        response = await this.xeroClient.accountingApi.updateInvoice(
          this.connection.tenantId,
          invoice.integration.externalId,
          { invoices: [xeroInvoice] }
        )
      } else {
        // Create new
        response = await this.xeroClient.accountingApi.createInvoices(
          this.connection.tenantId,
          { invoices: [xeroInvoice] }
        )
      }

      const createdInvoice = response.body.invoices![0]

      // Update Deskwise invoice with integration data
      await db.collection('invoices').updateOne(
        { _id: new ObjectId(invoiceId) },
        {
          $set: {
            'integration.platform': 'xero',
            'integration.externalId': createdInvoice.invoiceID!,
            'integration.externalNumber': createdInvoice.invoiceNumber!,
            'integration.syncStatus': 'synced',
            'integration.lastSyncedAt': new Date(),
            'integration.url': this.getEntityUrl('invoice', createdInvoice.invoiceID!),
            updatedAt: new Date()
          }
        }
      )

      const result: SyncResult = {
        success: true,
        externalId: createdInvoice.invoiceID!,
        externalNumber: createdInvoice.invoiceNumber!,
        platformResponse: createdInvoice
      }

      // Log sync history
      await this.logSyncHistory(
        'invoice',
        invoiceId,
        invoice.integration?.externalId ? 'update' : 'create',
        'to_platform',
        result,
        Date.now() - startTime,
        'system' // or user ID if manual
      )

      return result
    } catch (error: any) {
      const result = this.handleApiError(error)

      // Update invoice with error status
      const db = await getDatabase()
      await db.collection('invoices').updateOne(
        { _id: new ObjectId(invoiceId) },
        {
          $set: {
            'integration.syncStatus': 'failed',
            'integration.lastSyncError': result.error,
            updatedAt: new Date()
          }
        }
      )

      await this.logSyncHistory(
        'invoice',
        invoiceId,
        'create',
        'to_platform',
        result,
        Date.now() - startTime,
        'system'
      )

      return result
    }
  }

  private mapInvoiceToXero(invoice: any, contactId: string): any {
    return {
      type: 'ACCREC', // Accounts Receivable (sales invoice)
      contact: {
        contactID: contactId
      },
      date: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      invoiceNumber: invoice.invoiceNumber,
      reference: invoice.quoteId ? `Quote: ${invoice.quoteId}` : undefined,
      status: this.mapInvoiceStatus(invoice.status),
      lineItems: invoice.lineItems.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitAmount: item.rate,
        accountCode: this.getAccountCode(item.category),
        taxType: this.getTaxCode(item.taxRate),
        lineAmount: item.total
      })),
      lineAmountTypes: 'Exclusive', // or 'Inclusive' based on org settings
      currencyCode: invoice.currency || 'USD'
    }
  }

  private mapInvoiceStatus(deskwiseStatus: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'DRAFT',
      'sent': 'SUBMITTED',
      'viewed': 'SUBMITTED',
      'partial': 'AUTHORISED',
      'paid': 'PAID',
      'overdue': 'AUTHORISED',
      'cancelled': 'VOIDED',
      'refunded': 'VOIDED'
    }
    return statusMap[deskwiseStatus] || 'DRAFT'
  }

  private getAccountCode(category: string): string {
    // Look up account code mapping from accounting_mappings collection
    // Implementation details...
    return this.connection.config.defaultIncomeAccount || '200'
  }

  private getTaxCode(taxRate: number): string {
    // Map tax rate to Xero tax type
    // Implementation details...
    if (taxRate === 0) return 'NONE'
    if (taxRate === 10) return 'OUTPUT' // GST for Australia
    return this.connection.config.defaultTaxCode || 'TAX001'
  }

  public async pullInvoice(externalId: string): Promise<any> {
    await this.ensureValidToken()

    const response = await this.xeroClient.accountingApi.getInvoice(
      this.connection.tenantId,
      externalId
    )

    return response.body.invoices![0]
  }

  public async voidInvoice(externalId: string): Promise<SyncResult> {
    try {
      await this.ensureValidToken()

      const response = await this.xeroClient.accountingApi.updateInvoice(
        this.connection.tenantId,
        externalId,
        {
          invoices: [{
            invoiceID: externalId,
            status: 'VOIDED'
          }]
        }
      )

      return {
        success: true,
        externalId,
        platformResponse: response.body.invoices![0]
      }
    } catch (error: any) {
      return this.handleApiError(error)
    }
  }

  // Implement other methods: syncQuote, syncClient, syncProduct, pullPayments, etc.
  // Similar pattern to syncInvoice...

  public getEntityUrl(
    entityType: 'invoice' | 'quote' | 'client' | 'product',
    externalId: string
  ): string {
    const baseUrl = 'https://go.xero.com'
    const paths = {
      invoice: `/AccountsReceivable/View.aspx?InvoiceID=${externalId}`,
      quote: `/AccountsReceivable/ViewQuote.aspx?QuoteID=${externalId}`,
      client: `/Contacts/View/${externalId}`,
      product: `/Items/View/${externalId}`
    }
    return `${baseUrl}${paths[entityType]}`
  }

  public async handleWebhook(eventType: string, payload: any): Promise<void> {
    // Handle Xero webhooks
    // Implementation details...
  }

  // Additional Xero-specific methods...
}
```

### QuickBooks Integration Service

```typescript
// src/lib/services/integrations/accounting/quickbooks.ts

import { BaseAccountingIntegration, SyncResult } from './base'
import OAuthClient from 'intuit-oauth'

export class QuickBooksIntegrationService extends BaseAccountingIntegration {
  private oauthClient: OAuthClient

  protected initializeApiClient() {
    this.oauthClient = new OAuthClient({
      clientId: process.env.QBO_CLIENT_ID!,
      clientSecret: process.env.QBO_CLIENT_SECRET!,
      environment: process.env.QBO_ENVIRONMENT || 'production',
      redirectUri: process.env.QBO_REDIRECT_URI!
    })

    this.oauthClient.setToken({
      access_token: this.connection.accessToken,
      refresh_token: this.connection.refreshToken,
      expires_in: Math.floor(
        (this.connection.tokenExpiry.getTime() - Date.now()) / 1000
      )
    })

    return this.oauthClient
  }

  // Implement QuickBooks-specific methods
  // Similar structure to Xero but with QB API specifics
}
```

### MYOB Integration Service

```typescript
// src/lib/services/integrations/accounting/myob.ts

import { BaseAccountingIntegration, SyncResult } from './base'
import axios from 'axios'

export class MYOBIntegrationService extends BaseAccountingIntegration {
  private apiClient: any

  protected initializeApiClient() {
    this.apiClient = axios.create({
      baseURL: 'https://api.myob.com/accountright',
      headers: {
        'x-myobapi-key': process.env.MYOB_CLIENT_ID!,
        'x-myobapi-version': 'v2',
        'Accept': 'application/json'
      }
    })

    // Add auth interceptor
    this.apiClient.interceptors.request.use(async (config: any) => {
      await this.ensureValidToken()
      config.headers.Authorization = `Bearer ${this.connection.accessToken}`
      return config
    })

    return this.apiClient
  }

  // Implement MYOB-specific methods
  // MYOB has different API structure than Xero/QB
}
```

### Integration Service Factory

```typescript
// src/lib/services/integrations/accounting/factory.ts

import { BaseAccountingIntegration } from './base'
import { XeroIntegrationService } from './xero'
import { QuickBooksIntegrationService } from './quickbooks'
import { MYOBIntegrationService } from './myob'
import { getDatabase } from '@/lib/mongodb'

export class AccountingIntegrationFactory {
  /**
   * Get integration service instance for organization
   */
  static async getIntegration(
    orgId: string
  ): Promise<BaseAccountingIntegration | null> {
    const db = await getDatabase()

    const connection = await db.collection('accounting_connections').findOne({
      orgId,
      status: 'connected'
    })

    if (!connection) {
      return null
    }

    switch (connection.platform) {
      case 'xero':
        return new XeroIntegrationService(orgId, connection)
      case 'quickbooks':
        return new QuickBooksIntegrationService(orgId, connection)
      case 'myob':
        return new MYOBIntegrationService(orgId, connection)
      default:
        throw new Error(`Unsupported platform: ${connection.platform}`)
    }
  }

  /**
   * Check if organization has active integration
   */
  static async hasIntegration(orgId: string): Promise<boolean> {
    const db = await getDatabase()

    const count = await db.collection('accounting_connections').countDocuments({
      orgId,
      status: 'connected'
    })

    return count > 0
  }
}
```

---

## API Endpoints Reference

### Connection Management

```typescript
/**
 * GET /api/integrations/accounting/status
 * Get current integration status
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const integration = await AccountingIntegrationFactory.getIntegration(
    session.user.orgId
  )

  if (!integration) {
    return NextResponse.json({ connected: false })
  }

  const healthy = await integration.testConnection()

  return NextResponse.json({
    connected: true,
    platform: integration.connection.platform,
    tenantName: integration.connection.tenantName,
    lastSyncAt: integration.connection.lastSyncAt,
    status: healthy ? 'healthy' : 'unhealthy'
  })
}

/**
 * POST /api/integrations/accounting/connect/xero
 * Initialize Xero OAuth flow
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const xeroClient = new XeroClient({
    clientId: process.env.XERO_CLIENT_ID!,
    clientSecret: process.env.XERO_CLIENT_SECRET!,
    redirectUris: [process.env.XERO_REDIRECT_URI!],
    scopes: ['openid', 'profile', 'email', 'accounting.transactions', 'accounting.contacts', 'accounting.settings.read']
  })

  const consentUrl = await xeroClient.buildConsentUrl()

  return NextResponse.json({ authUrl: consentUrl })
}

/**
 * GET /api/integrations/accounting/callback/xero
 * Handle Xero OAuth callback
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code) {
    return NextResponse.redirect('/settings/integrations?error=no_code')
  }

  // Exchange code for tokens
  const xeroClient = new XeroClient({ /* config */ })
  const tokenSet = await xeroClient.apiCallback(request.url)

  // Get tenant info
  await xeroClient.updateTenants()
  const tenants = xeroClient.tenants
  const primaryTenant = tenants[0]

  // Store connection
  const db = await getDatabase()
  await db.collection('accounting_connections').updateOne(
    { orgId: session.user.orgId, platform: 'xero' },
    {
      $set: {
        orgId: session.user.orgId,
        platform: 'xero',
        status: 'connected',
        accessToken: tokenSet.access_token,
        refreshToken: tokenSet.refresh_token,
        tokenExpiry: new Date(tokenSet.expires_at! * 1000),
        tenantId: primaryTenant.tenantId,
        tenantName: primaryTenant.tenantName,
        connectedAt: new Date(),
        connectedBy: session.user.userId,
        updatedAt: new Date()
      },
      $setOnInsert: {
        config: {
          autoSyncInvoices: false,
          autoSyncPayments: true,
          autoSyncClients: false,
          autoSyncProducts: false,
          syncDirection: 'to_platform',
          defaultIncomeAccount: '',
          defaultTaxCode: ''
        },
        createdAt: new Date()
      }
    },
    { upsert: true }
  )

  return NextResponse.redirect('/settings/integrations?success=connected')
}

/**
 * DELETE /api/integrations/accounting/disconnect
 * Disconnect integration
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDatabase()
  await db.collection('accounting_connections').updateOne(
    { orgId: session.user.orgId },
    {
      $set: {
        status: 'disconnected',
        updatedAt: new Date()
      }
    }
  )

  return NextResponse.json({ success: true })
}
```

### Configuration

```typescript
/**
 * GET /api/integrations/accounting/config
 * Get integration configuration
 */
export async function GET(request: NextRequest) {
  // Return current config
}

/**
 * PUT /api/integrations/accounting/config
 * Update integration configuration
 */
export async function PUT(request: NextRequest) {
  // Update config settings
}

/**
 * GET /api/integrations/accounting/mappings
 * Get account/tax mappings
 */
export async function GET(request: NextRequest) {
  // Return mappings
}

/**
 * PUT /api/integrations/accounting/mappings
 * Update account/tax mappings
 */
export async function PUT(request: NextRequest) {
  // Update mappings
}
```

### Sync Operations

```typescript
/**
 * POST /api/integrations/accounting/sync/invoice
 * Sync single invoice
 */
export async function POST(request: NextRequest) {
  const { invoiceId } = await request.json()

  const integration = await AccountingIntegrationFactory.getIntegration(
    session.user.orgId
  )

  if (!integration) {
    return NextResponse.json({ error: 'No integration connected' }, { status: 400 })
  }

  const result = await integration.syncInvoice(invoiceId)

  return NextResponse.json(result)
}

/**
 * POST /api/integrations/accounting/sync/bulk
 * Bulk sync multiple invoices
 */
export async function POST(request: NextRequest) {
  const { invoiceIds } = await request.json()

  // Queue jobs for each invoice
  const jobs = invoiceIds.map(id => ({
    entityType: 'invoice',
    entityId: id,
    operation: 'sync'
  }))

  await SyncQueueManager.addBulkJobs(jobs)

  return NextResponse.json({ queued: jobs.length })
}

/**
 * POST /api/integrations/accounting/sync/initial
 * Perform initial data sync
 */
export async function POST(request: NextRequest) {
  const { syncClients, syncProducts, syncDirection } = await request.json()

  // Implement initial sync logic
}

/**
 * GET /api/integrations/accounting/sync/status/[syncId]
 * Get sync operation status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { syncId: string } }
) {
  // Return sync status
}
```

### History and Logs

```typescript
/**
 * GET /api/integrations/accounting/history
 * Get sync history
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const entityType = searchParams.get('entityType')
  const status = searchParams.get('status')

  const db = await getDatabase()

  const query: any = { orgId: session.user.orgId }
  if (entityType) query.entityType = entityType
  if (status) query.status = status

  const history = await db.collection('accounting_sync_history')
    .find(query)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()

  const total = await db.collection('accounting_sync_history').countDocuments(query)

  return NextResponse.json({
    history,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}

/**
 * GET /api/integrations/accounting/history/export
 * Export sync history to CSV
 */
export async function GET(request: NextRequest) {
  // Generate and return CSV
}
```

### Webhooks

```typescript
/**
 * POST /api/integrations/accounting/webhook/xero
 * Receive Xero webhooks
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-xero-signature')
  const payload = await request.json()

  // Verify signature
  const isValid = verifyXeroSignature(signature, payload)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Store webhook for processing
  const db = await getDatabase()
  await db.collection('accounting_webhooks').insertOne({
    platform: 'xero',
    eventType: payload.eventType,
    payload,
    signature,
    verified: true,
    processed: false,
    receivedAt: new Date()
  })

  // Queue for async processing
  await SyncQueueManager.processWebhook(payload)

  return NextResponse.json({ received: true })
}
```

---

*This is part 1 of the Developer Guide. Due to length constraints, the guide continues in the next section with OAuth Flow, Data Mapping, Error Handling, and more.*
