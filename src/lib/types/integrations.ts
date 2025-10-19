/**
 * Accounting Integration Types
 * Defines TypeScript interfaces for Xero, QuickBooks, and MYOB integrations
 */

export type IntegrationPlatform = 'xero' | 'quickbooks' | 'myob'

export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending'

export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual'

export type SyncStatus = 'success' | 'failed' | 'partial' | 'pending'

export type SyncDirection = 'deskwise_to_platform' | 'platform_to_deskwise' | 'bidirectional'

export type SyncEntityType = 'invoice' | 'quote' | 'customer' | 'product' | 'payment'

export interface IntegrationConnection {
  _id: string
  orgId: string
  platform: IntegrationPlatform
  status: IntegrationStatus
  connectedAt?: Date
  lastSyncAt?: Date
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date

  // Platform-specific data
  tenantId?: string // Xero
  tenantName?: string // Xero
  realmId?: string // QuickBooks
  companyId?: string // MYOB
  companyName?: string
  companyFileId?: string // MYOB

  // Error tracking
  lastError?: string
  errorCount: number

  // Configuration reference
  configId?: string

  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface IntegrationConfig {
  _id: string
  orgId: string
  platform: IntegrationPlatform

  // Sync preferences
  syncPreferences: {
    invoices: boolean
    quotes: boolean
    customers: boolean
    products: boolean
    payments: boolean
  }

  syncFrequency: SyncFrequency
  syncDirection: SyncDirection
  autoSync: boolean

  // Field mappings
  fieldMappings: {
    customerFields?: Record<string, string>
    invoiceFields?: Record<string, string>
    productFields?: Record<string, string>
    quoteFields?: Record<string, string>
  }

  // Tax handling
  taxSettings: {
    includeTax: boolean
    taxRateMapping?: Record<string, string>
    defaultTaxRate?: string
  }

  // Account mappings
  accountMappings?: {
    revenueAccount?: string
    receivablesAccount?: string
    defaultAccount?: string
  }

  // Advanced settings
  advancedSettings: {
    skipDuplicates: boolean
    updateExisting: boolean
    syncCustomFields: boolean
    notifyOnError: boolean
    notifyOnSuccess: boolean
  }

  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}

export interface SyncLog {
  _id: string
  orgId: string
  platform: IntegrationPlatform
  entityType: SyncEntityType
  entityId: string
  direction: SyncDirection
  status: SyncStatus

  // Details
  recordsProcessed: number
  recordsSuccessful: number
  recordsFailed: number

  // Platform IDs
  deskwiseId?: string
  platformId?: string

  // Error information
  errorMessage?: string
  errorDetails?: string
  stackTrace?: string

  // Timing
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds

  // Metadata
  initiatedBy: 'user' | 'system' | 'schedule'
  userId?: string

  createdAt: Date
}

export interface SyncStats {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  lastSyncAt?: Date
  lastSuccessAt?: Date
  lastFailureAt?: Date
  entityCounts: {
    invoices: number
    quotes: number
    customers: number
    products: number
    payments: number
  }
}

export interface PlatformAccount {
  id: string
  code: string
  name: string
  type: string
  taxType?: string
}

export interface PlatformTaxRate {
  id: string
  name: string
  rate: number
  isDefault?: boolean
}

export interface OAuthState {
  orgId: string
  platform: IntegrationPlatform
  returnUrl: string
  nonce: string
}
