/**
 * Demo Data for Integration Components
 * Use this for testing UI components without backend API
 */

import type {
  IntegrationConnection,
  IntegrationConfig,
  SyncLog,
  SyncStats,
  PlatformAccount,
  PlatformTaxRate,
} from '@/lib/types/integrations'

// Demo Connections
export const demoConnections: IntegrationConnection[] = [
  {
    _id: 'conn_xero_123',
    orgId: 'org_demo',
    platform: 'xero',
    status: 'connected',
    connectedAt: new Date('2024-12-01T10:00:00Z'),
    lastSyncAt: new Date('2025-01-15T14:30:00Z'),
    accessToken: 'xero_token_123',
    refreshToken: 'xero_refresh_123',
    tokenExpiresAt: new Date('2025-02-01T10:00:00Z'),
    tenantId: 'tenant_abc123',
    tenantName: 'Acme Corporation Pty Ltd',
    companyName: 'Acme Corporation Pty Ltd',
    lastError: undefined,
    errorCount: 0,
    configId: 'config_xero_123',
    createdAt: new Date('2024-12-01T10:00:00Z'),
    updatedAt: new Date('2025-01-15T14:30:00Z'),
    createdBy: 'user_admin',
    updatedBy: 'user_admin',
  },
  {
    _id: 'conn_qb_456',
    orgId: 'org_demo',
    platform: 'quickbooks',
    status: 'disconnected',
    errorCount: 0,
    createdAt: new Date('2024-11-15T08:00:00Z'),
    updatedAt: new Date('2024-11-15T08:00:00Z'),
    createdBy: 'user_admin',
    updatedBy: 'user_admin',
  },
  {
    _id: 'conn_myob_789',
    orgId: 'org_demo',
    platform: 'myob',
    status: 'error',
    connectedAt: new Date('2024-10-20T12:00:00Z'),
    lastSyncAt: new Date('2025-01-10T09:15:00Z'),
    accessToken: 'myob_token_789',
    companyFileId: 'file_xyz789',
    companyName: 'Demo Services Ltd',
    lastError: 'Authentication token expired. Please reconnect.',
    errorCount: 3,
    createdAt: new Date('2024-10-20T12:00:00Z'),
    updatedAt: new Date('2025-01-10T09:15:00Z'),
    createdBy: 'user_admin',
    updatedBy: 'user_admin',
  },
]

// Demo Configurations
export const demoConfigs: IntegrationConfig[] = [
  {
    _id: 'config_xero_123',
    orgId: 'org_demo',
    platform: 'xero',
    syncPreferences: {
      invoices: true,
      quotes: true,
      customers: true,
      products: true,
      payments: false,
    },
    syncFrequency: 'daily',
    syncDirection: 'deskwise_to_platform',
    autoSync: true,
    fieldMappings: {
      customerFields: {
        name: 'Name',
        email: 'EmailAddress',
        phone: 'PhoneNumber',
      },
      invoiceFields: {
        number: 'InvoiceNumber',
        date: 'Date',
        dueDate: 'DueDate',
      },
    },
    taxSettings: {
      includeTax: true,
      taxRateMapping: {
        'GST 10%': 'tax_rate_gst',
      },
      defaultTaxRate: 'tax_rate_gst',
    },
    accountMappings: {
      revenueAccount: 'acc_revenue_200',
      receivablesAccount: 'acc_receivable_1200',
      defaultAccount: 'acc_revenue_200',
    },
    advancedSettings: {
      skipDuplicates: true,
      updateExisting: false,
      syncCustomFields: false,
      notifyOnError: true,
      notifyOnSuccess: false,
    },
    createdAt: new Date('2024-12-01T10:15:00Z'),
    updatedAt: new Date('2025-01-10T11:20:00Z'),
    createdBy: 'user_admin',
    updatedBy: 'user_admin',
  },
]

// Demo Sync Stats
export const demoSyncStats: SyncStats[] = [
  {
    totalSyncs: 247,
    successfulSyncs: 235,
    failedSyncs: 12,
    lastSyncAt: new Date('2025-01-15T14:30:00Z'),
    lastSuccessAt: new Date('2025-01-15T14:30:00Z'),
    lastFailureAt: new Date('2025-01-12T08:15:00Z'),
    entityCounts: {
      invoices: 125,
      quotes: 45,
      customers: 65,
      products: 12,
      payments: 0,
    },
  },
]

// Demo Sync Logs
export const demoSyncLogs: SyncLog[] = [
  {
    _id: 'log_001',
    orgId: 'org_demo',
    platform: 'xero',
    entityType: 'invoice',
    entityId: 'inv_2025_001',
    direction: 'deskwise_to_platform',
    status: 'success',
    recordsProcessed: 1,
    recordsSuccessful: 1,
    recordsFailed: 0,
    deskwiseId: 'inv_2025_001',
    platformId: 'xero_inv_abc123',
    startedAt: new Date('2025-01-15T14:30:00Z'),
    completedAt: new Date('2025-01-15T14:30:15Z'),
    duration: 15000,
    initiatedBy: 'user',
    userId: 'user_admin',
    createdAt: new Date('2025-01-15T14:30:00Z'),
  },
  {
    _id: 'log_002',
    orgId: 'org_demo',
    platform: 'xero',
    entityType: 'customer',
    entityId: 'cust_demo_42',
    direction: 'deskwise_to_platform',
    status: 'failed',
    recordsProcessed: 1,
    recordsSuccessful: 0,
    recordsFailed: 1,
    deskwiseId: 'cust_demo_42',
    errorMessage: 'Invalid email format for customer contact',
    errorDetails: 'The email address "invalid.email" does not match the required format',
    startedAt: new Date('2025-01-15T10:15:00Z'),
    completedAt: new Date('2025-01-15T10:15:05Z'),
    duration: 5000,
    initiatedBy: 'system',
    createdAt: new Date('2025-01-15T10:15:00Z'),
  },
  {
    _id: 'log_003',
    orgId: 'org_demo',
    platform: 'xero',
    entityType: 'quote',
    entityId: 'quote_2025_012',
    direction: 'deskwise_to_platform',
    status: 'partial',
    recordsProcessed: 5,
    recordsSuccessful: 3,
    recordsFailed: 2,
    deskwiseId: 'quote_2025_012',
    platformId: 'xero_quote_def456',
    errorMessage: 'Some line items failed validation',
    errorDetails: '2 line items had invalid product codes',
    startedAt: new Date('2025-01-14T16:45:00Z'),
    completedAt: new Date('2025-01-14T16:45:20Z'),
    duration: 20000,
    initiatedBy: 'schedule',
    createdAt: new Date('2025-01-14T16:45:00Z'),
  },
  {
    _id: 'log_004',
    orgId: 'org_demo',
    platform: 'myob',
    entityType: 'invoice',
    entityId: 'inv_2025_002',
    direction: 'deskwise_to_platform',
    status: 'failed',
    recordsProcessed: 1,
    recordsSuccessful: 0,
    recordsFailed: 1,
    deskwiseId: 'inv_2025_002',
    errorMessage: 'Authentication token expired',
    errorDetails: 'The access token has expired. Please reconnect to MYOB.',
    stackTrace: `Error: Token expired
    at MyobClient.authenticate (myob-client.ts:45)
    at MyobClient.syncInvoice (myob-client.ts:120)
    at SyncService.processInvoice (sync-service.ts:78)`,
    startedAt: new Date('2025-01-10T09:15:00Z'),
    completedAt: new Date('2025-01-10T09:15:03Z'),
    duration: 3000,
    initiatedBy: 'user',
    userId: 'user_tech1',
    createdAt: new Date('2025-01-10T09:15:00Z'),
  },
  {
    _id: 'log_005',
    orgId: 'org_demo',
    platform: 'xero',
    entityType: 'product',
    entityId: 'prod_monthly_hosting',
    direction: 'deskwise_to_platform',
    status: 'success',
    recordsProcessed: 1,
    recordsSuccessful: 1,
    recordsFailed: 0,
    deskwiseId: 'prod_monthly_hosting',
    platformId: 'xero_item_hosting001',
    startedAt: new Date('2025-01-13T11:00:00Z'),
    completedAt: new Date('2025-01-13T11:00:08Z'),
    duration: 8000,
    initiatedBy: 'system',
    createdAt: new Date('2025-01-13T11:00:00Z'),
  },
]

// Demo Platform Accounts (Xero)
export const demoXeroAccounts: PlatformAccount[] = [
  {
    id: 'acc_revenue_200',
    code: '200',
    name: 'Sales',
    type: 'REVENUE',
    taxType: 'OUTPUT',
  },
  {
    id: 'acc_revenue_260',
    code: '260',
    name: 'Consulting & Accounting',
    type: 'REVENUE',
    taxType: 'OUTPUT',
  },
  {
    id: 'acc_receivable_1200',
    code: '1200',
    name: 'Accounts Receivable',
    type: 'RECEIVABLE',
  },
  {
    id: 'acc_current_1000',
    code: '1000',
    name: 'Business Bank Account',
    type: 'CURRASS',
  },
]

// Demo Tax Rates (Xero)
export const demoXeroTaxRates: PlatformTaxRate[] = [
  {
    id: 'tax_rate_gst',
    name: 'GST on Income',
    rate: 10.0,
    isDefault: true,
  },
  {
    id: 'tax_rate_exempt',
    name: 'Tax Exempt',
    rate: 0.0,
    isDefault: false,
  },
  {
    id: 'tax_rate_15',
    name: 'GST on Capital',
    rate: 15.0,
    isDefault: false,
  },
]

// Demo QuickBooks Accounts
export const demoQuickBooksAccounts: PlatformAccount[] = [
  {
    id: 'qb_acc_income_4000',
    code: '4000',
    name: 'Service Revenue',
    type: 'Income',
  },
  {
    id: 'qb_acc_income_4100',
    code: '4100',
    name: 'Product Sales',
    type: 'Income',
  },
  {
    id: 'qb_acc_ar_1200',
    code: '1200',
    name: 'Accounts Receivable (A/R)',
    type: 'Accounts Receivable',
  },
  {
    id: 'qb_acc_bank_1000',
    code: '1000',
    name: 'Checking',
    type: 'Bank',
  },
]

// Demo QuickBooks Tax Codes
export const demoQuickBooksTaxCodes: PlatformTaxRate[] = [
  {
    id: 'qb_tax_sales',
    name: 'Sales Tax',
    rate: 8.5,
    isDefault: true,
  },
  {
    id: 'qb_tax_exempt',
    name: 'Non-Taxable',
    rate: 0.0,
    isDefault: false,
  },
]

// Demo MYOB Accounts
export const demoMyobAccounts: PlatformAccount[] = [
  {
    id: 'myob_acc_4100',
    code: '4-1000',
    name: 'Sales - General',
    type: 'Income',
  },
  {
    id: 'myob_acc_4200',
    code: '4-2000',
    name: 'Sales - Services',
    type: 'Income',
  },
  {
    id: 'myob_acc_1200',
    code: '1-2000',
    name: 'Trade Debtors',
    type: 'Asset - Receivable',
  },
  {
    id: 'myob_acc_1100',
    code: '1-1100',
    name: 'Cheque Account',
    type: 'Asset - Bank',
  },
]

// Demo MYOB Tax Codes
export const demoMyobTaxCodes: PlatformTaxRate[] = [
  {
    id: 'myob_gst_n-t',
    name: 'N-T (GST Free Income)',
    rate: 0.0,
    isDefault: false,
  },
  {
    id: 'myob_gst_gst',
    name: 'GST (Goods & Services Tax)',
    rate: 10.0,
    isDefault: true,
  },
  {
    id: 'myob_gst_exp',
    name: 'EXP (Export Sales)',
    rate: 0.0,
    isDefault: false,
  },
]

// Helper function to get demo data by platform
export const getDemoDataByPlatform = (platform: 'xero' | 'quickbooks' | 'myob') => {
  switch (platform) {
    case 'xero':
      return {
        accounts: demoXeroAccounts,
        taxRates: demoXeroTaxRates,
      }
    case 'quickbooks':
      return {
        accounts: demoQuickBooksAccounts,
        taxCodes: demoQuickBooksTaxCodes,
      }
    case 'myob':
      return {
        accounts: demoMyobAccounts,
        taxCodes: demoMyobTaxCodes,
      }
  }
}

// Mock API response generators
export const mockApiResponses = {
  connections: {
    success: {
      connections: demoConnections.filter((c) => c.status !== 'disconnected'),
    },
    empty: {
      connections: [],
    },
  },
  configs: {
    success: {
      configs: demoConfigs,
    },
    empty: {
      configs: [],
    },
  },
  syncStats: {
    success: {
      platformStats: [
        { platform: 'xero', isConnected: true, stats: demoSyncStats[0] },
        { platform: 'quickbooks', isConnected: false, stats: demoSyncStats[0] },
        { platform: 'myob', isConnected: true, stats: demoSyncStats[0] },
      ],
    },
  },
  syncLogs: {
    success: {
      logs: demoSyncLogs,
    },
    empty: {
      logs: [],
    },
  },
  platformData: {
    xero: {
      accounts: { accounts: demoXeroAccounts },
      taxRates: { taxRates: demoXeroTaxRates },
    },
    quickbooks: {
      accounts: { accounts: demoQuickBooksAccounts },
      taxCodes: { taxCodes: demoQuickBooksTaxCodes },
    },
    myob: {
      accounts: { accounts: demoMyobAccounts },
      taxCodes: { taxCodes: demoMyobTaxCodes },
    },
  },
}
