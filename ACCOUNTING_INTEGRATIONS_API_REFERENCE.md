# Accounting Integrations API Reference

## Table of Contents
- [Authentication](#authentication)
- [Connection Endpoints](#connection-endpoints)
- [Configuration Endpoints](#configuration-endpoints)
- [Sync Endpoints](#sync-endpoints)
- [Data Import/Export Endpoints](#data-importexport-endpoints)
- [History and Logs Endpoints](#history-and-logs-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Error Codes](#error-codes)
- [Rate Limits](#rate-limits)

---

## Authentication

All API endpoints require authentication via NextAuth.js session cookie.

**Headers:**
```
Cookie: next-auth.session-token=<session_token>
```

**Required Permissions:**
- Read operations: `billing.view` or higher
- Write operations: `billing.manage` or `admin` role
- Integration management: `admin` role only

---

## Connection Endpoints

### Get Integration Status

Get the current accounting integration status for the organization.

**Endpoint:** `GET /api/integrations/accounting/status`

**Authentication:** Required

**Response:**

```json
{
  "connected": true,
  "platform": "xero",
  "tenantName": "Acme Corporation",
  "tenantId": "12345-abcde-67890-fghij",
  "connectedAt": "2025-01-15T10:30:00.000Z",
  "lastSyncAt": "2025-01-19T08:15:00.000Z",
  "status": "healthy",
  "config": {
    "autoSyncInvoices": true,
    "autoSyncPayments": true,
    "autoSyncClients": false,
    "syncDirection": "to_platform"
  }
}
```

**Response when not connected:**

```json
{
  "connected": false
}
```

---

### Initiate Xero Connection

Start the OAuth flow to connect Xero.

**Endpoint:** `POST /api/integrations/accounting/connect/xero`

**Authentication:** Required (admin only)

**Request Body:** None

**Response:**

```json
{
  "authUrl": "https://login.xero.com/identity/connect/authorize?client_id=...&redirect_uri=...&scope=..."
}
```

**Usage:**
Client should redirect user to `authUrl` to complete OAuth flow.

---

### Initiate QuickBooks Connection

Start the OAuth flow to connect QuickBooks Online.

**Endpoint:** `POST /api/integrations/accounting/connect/quickbooks`

**Authentication:** Required (admin only)

**Request Body:** None

**Response:**

```json
{
  "authUrl": "https://appcenter.intuit.com/connect/oauth2?client_id=...&redirect_uri=...&scope=..."
}
```

---

### Initiate MYOB Connection

Start the OAuth flow to connect MYOB.

**Endpoint:** `POST /api/integrations/accounting/connect/myob`

**Authentication:** Required (admin only)

**Request Body:** None

**Response:**

```json
{
  "authUrl": "https://secure.myob.com/oauth2/account/authorize?client_id=...&redirect_uri=...&scope=..."
}
```

---

### OAuth Callback Handler (Xero)

Handle the OAuth callback from Xero (internal use).

**Endpoint:** `GET /api/integrations/accounting/callback/xero`

**Authentication:** Not required (session established via state parameter)

**Query Parameters:**
- `code` (required): OAuth authorization code
- `state` (required): State parameter for CSRF protection

**Response:**
Redirects to `/settings/integrations?success=connected` or `/settings/integrations?error=<error_code>`

---

### OAuth Callback Handler (QuickBooks)

Handle the OAuth callback from QuickBooks.

**Endpoint:** `GET /api/integrations/accounting/callback/quickbooks`

**Query Parameters:**
- `code` (required): OAuth authorization code
- `realmId` (required): QuickBooks company ID
- `state` (required): State parameter

**Response:**
Redirects to `/settings/integrations?success=connected`

---

### OAuth Callback Handler (MYOB)

Handle the OAuth callback from MYOB.

**Endpoint:** `GET /api/integrations/accounting/callback/myob`

**Query Parameters:**
- `code` (required): OAuth authorization code
- `state` (required): State parameter

**Response:**
Redirects to `/settings/integrations?success=connected`

---

### Disconnect Integration

Disconnect the current accounting integration.

**Endpoint:** `DELETE /api/integrations/accounting/disconnect`

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "keepLinks": true,
  "password": "admin_password"
}
```

**Parameters:**
- `keepLinks` (optional, default: `true`): Whether to keep external ID references in Deskwise records
- `password` (required): Admin password for confirmation

**Response:**

```json
{
  "success": true,
  "message": "Integration disconnected successfully",
  "recordsAffected": {
    "invoices": 150,
    "clients": 45,
    "products": 80
  }
}
```

**Error Response:**

```json
{
  "error": "Invalid password",
  "code": "INVALID_PASSWORD"
}
```

---

### Test Connection

Test the health of the current integration.

**Endpoint:** `GET /api/integrations/accounting/test`

**Authentication:** Required

**Response:**

```json
{
  "healthy": true,
  "platform": "xero",
  "latency": 245,
  "tokenExpiry": "2025-01-20T10:30:00.000Z",
  "lastCheck": "2025-01-19T14:22:00.000Z"
}
```

**Error Response:**

```json
{
  "healthy": false,
  "error": "Token expired",
  "code": "TOKEN_EXPIRED",
  "recommendation": "Please reconnect your integration"
}
```

---

## Configuration Endpoints

### Get Configuration

Retrieve the current integration configuration settings.

**Endpoint:** `GET /api/integrations/accounting/config`

**Authentication:** Required

**Response:**

```json
{
  "platform": "xero",
  "config": {
    "autoSyncInvoices": true,
    "autoSyncPayments": true,
    "autoSyncClients": false,
    "autoSyncProducts": false,
    "syncDirection": "to_platform",
    "defaultIncomeAccount": "200",
    "defaultTaxCode": "TAX001",
    "invoiceTemplate": "default",
    "emailDelivery": "deskwise_only",
    "customFields": []
  }
}
```

---

### Update Configuration

Update integration configuration settings.

**Endpoint:** `PUT /api/integrations/accounting/config`

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "autoSyncInvoices": true,
  "autoSyncPayments": true,
  "autoSyncClients": true,
  "syncDirection": "bidirectional",
  "defaultIncomeAccount": "4-1100",
  "defaultTaxCode": "GST"
}
```

**Response:**

```json
{
  "success": true,
  "config": {
    "autoSyncInvoices": true,
    "autoSyncPayments": true,
    "autoSyncClients": true,
    "autoSyncProducts": false,
    "syncDirection": "bidirectional",
    "defaultIncomeAccount": "4-1100",
    "defaultTaxCode": "GST"
  }
}
```

---

### Get Mappings

Retrieve account and tax code mappings.

**Endpoint:** `GET /api/integrations/accounting/mappings`

**Authentication:** Required

**Query Parameters:**
- `type` (optional): Filter by mapping type (`account`, `tax`, `payment_term`, `product_category`)

**Response:**

```json
{
  "accountMappings": [
    {
      "deskwiseCategory": "Managed Services",
      "platformAccount": "4-1100",
      "platformLabel": "Sales - Services",
      "isDefault": true
    },
    {
      "deskwiseCategory": "Hardware",
      "platformAccount": "4-2100",
      "platformLabel": "Sales - Hardware",
      "isDefault": false
    }
  ],
  "taxMappings": [
    {
      "deskwiseRate": "10% GST",
      "platformCode": "GST",
      "platformLabel": "Goods & Services Tax 10%",
      "isDefault": true
    },
    {
      "deskwiseRate": "0% GST-Free",
      "platformCode": "FRE",
      "platformLabel": "GST Free",
      "isDefault": false
    }
  ],
  "paymentTermMappings": [
    {
      "deskwiseTerms": "Net 30",
      "platformTerms": "30",
      "platformLabel": "Net 30 Days",
      "isDefault": true
    }
  ]
}
```

---

### Update Mappings

Update account, tax, or payment term mappings.

**Endpoint:** `PUT /api/integrations/accounting/mappings`

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "mappingType": "account",
  "mappings": [
    {
      "deskwiseValue": "Managed Services",
      "platformValue": "4-1100",
      "platformLabel": "Sales - Services",
      "isDefault": true
    },
    {
      "deskwiseValue": "Professional Services",
      "platformValue": "4-1200",
      "platformLabel": "Consulting Income",
      "isDefault": false
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "mappingsUpdated": 2,
  "mappings": [
    {
      "deskwiseValue": "Managed Services",
      "platformValue": "4-1100",
      "platformLabel": "Sales - Services",
      "isDefault": true
    },
    {
      "deskwiseValue": "Professional Services",
      "platformValue": "4-1200",
      "platformLabel": "Consulting Income",
      "isDefault": false
    }
  ]
}
```

---

### Get Available Accounts

Retrieve available accounts from connected accounting platform.

**Endpoint:** `GET /api/integrations/accounting/accounts`

**Authentication:** Required

**Query Parameters:**
- `type` (optional): Filter by account type (`income`, `expense`, `asset`, `liability`, `equity`)

**Response:**

```json
{
  "accounts": [
    {
      "code": "4-1100",
      "name": "Sales - Services",
      "type": "income",
      "taxType": "GST",
      "isActive": true
    },
    {
      "code": "4-1200",
      "name": "Consulting Income",
      "type": "income",
      "taxType": "GST",
      "isActive": true
    },
    {
      "code": "200",
      "name": "Sales Revenue",
      "type": "income",
      "taxType": "Output",
      "isActive": true
    }
  ]
}
```

---

### Get Available Tax Codes

Retrieve available tax codes from connected accounting platform.

**Endpoint:** `GET /api/integrations/accounting/tax-codes`

**Authentication:** Required

**Response:**

```json
{
  "taxCodes": [
    {
      "code": "GST",
      "name": "Goods & Services Tax",
      "rate": 10.0,
      "type": "sales",
      "isActive": true
    },
    {
      "code": "FRE",
      "name": "GST Free",
      "rate": 0.0,
      "type": "sales",
      "isActive": true
    },
    {
      "code": "N-T",
      "name": "Not Reportable",
      "rate": 0.0,
      "type": "none",
      "isActive": true
    }
  ]
}
```

---

## Sync Endpoints

### Sync Single Invoice

Sync a single invoice to the accounting platform.

**Endpoint:** `POST /api/integrations/accounting/sync/invoice`

**Authentication:** Required

**Request Body:**

```json
{
  "invoiceId": "65a1b2c3d4e5f6789012345",
  "force": false,
  "validate": true
}
```

**Parameters:**
- `invoiceId` (required): Deskwise invoice ID
- `force` (optional, default: `false`): Force sync even if already synced
- `validate` (optional, default: `true`): Validate data before syncing

**Response (Success):**

```json
{
  "success": true,
  "invoiceId": "65a1b2c3d4e5f6789012345",
  "invoiceNumber": "INV-2025-0042",
  "externalId": "abc123-def456-ghi789",
  "externalNumber": "INV-0042",
  "platform": "xero",
  "url": "https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=abc123",
  "syncedAt": "2025-01-19T14:30:00.000Z",
  "duration": 1245
}
```

**Response (Failed):**

```json
{
  "success": false,
  "error": "Client must be synced before invoice",
  "code": "CLIENT_NOT_SYNCED",
  "details": {
    "clientId": "65a1b2c3d4e5f6789012999",
    "clientName": "Acme Corp"
  }
}
```

---

### Sync Bulk Invoices

Queue multiple invoices for syncing.

**Endpoint:** `POST /api/integrations/accounting/sync/bulk`

**Authentication:** Required

**Request Body:**

```json
{
  "invoiceIds": [
    "65a1b2c3d4e5f6789012345",
    "65a1b2c3d4e5f6789012346",
    "65a1b2c3d4e5f6789012347"
  ],
  "priority": "normal"
}
```

**Parameters:**
- `invoiceIds` (required): Array of invoice IDs
- `priority` (optional): Priority level (`low`, `normal`, `high`)

**Response:**

```json
{
  "success": true,
  "queued": 3,
  "batchId": "batch_xyz789",
  "estimatedCompletion": "2025-01-19T14:45:00.000Z",
  "jobs": [
    {
      "invoiceId": "65a1b2c3d4e5f6789012345",
      "jobId": "job_001",
      "status": "queued"
    },
    {
      "invoiceId": "65a1b2c3d4e5f6789012346",
      "jobId": "job_002",
      "status": "queued"
    },
    {
      "invoiceId": "65a1b2c3d4e5f6789012347",
      "jobId": "job_003",
      "status": "queued"
    }
  ]
}
```

---

### Sync Quote/Estimate

Sync a quote to the accounting platform as an estimate.

**Endpoint:** `POST /api/integrations/accounting/sync/quote`

**Authentication:** Required

**Request Body:**

```json
{
  "quoteId": "65a1b2c3d4e5f6789054321",
  "force": false
}
```

**Response:**

```json
{
  "success": true,
  "quoteId": "65a1b2c3d4e5f6789054321",
  "quoteNumber": "QTE-2025-0015",
  "externalId": "est_abc123",
  "platform": "quickbooks",
  "url": "https://app.qbo.intuit.com/app/estimate?txnId=est_abc123",
  "syncedAt": "2025-01-19T14:35:00.000Z"
}
```

---

### Sync Client/Customer

Sync a client to the accounting platform.

**Endpoint:** `POST /api/integrations/accounting/sync/client`

**Authentication:** Required

**Request Body:**

```json
{
  "clientId": "65a1b2c3d4e5f6789012999"
}
```

**Response:**

```json
{
  "success": true,
  "clientId": "65a1b2c3d4e5f6789012999",
  "clientName": "Acme Corporation",
  "externalId": "contact_xyz789",
  "platform": "xero",
  "syncedAt": "2025-01-19T14:32:00.000Z"
}
```

---

### Sync Product/Item

Sync a product to the accounting platform.

**Endpoint:** `POST /api/integrations/accounting/sync/product`

**Authentication:** Required

**Request Body:**

```json
{
  "productId": "65a1b2c3d4e5f6789011111",
  "syncAs": "service"
}
```

**Parameters:**
- `productId` (required): Deskwise product ID
- `syncAs` (optional): Sync as `service` or `inventory` item (platform-dependent)

**Response:**

```json
{
  "success": true,
  "productId": "65a1b2c3d4e5f6789011111",
  "productName": "Managed Backup - Monthly",
  "externalId": "item_backup001",
  "platform": "quickbooks",
  "syncedAt": "2025-01-19T14:33:00.000Z"
}
```

---

### Pull Payments

Pull recent payments from the accounting platform.

**Endpoint:** `POST /api/integrations/accounting/sync/pull-payments`

**Authentication:** Required

**Request Body:**

```json
{
  "fromDate": "2025-01-01T00:00:00.000Z",
  "toDate": "2025-01-19T23:59:59.000Z",
  "invoiceId": null
}
```

**Parameters:**
- `fromDate` (optional): Start date for payment records
- `toDate` (optional): End date for payment records
- `invoiceId` (optional): Pull payments for specific invoice only

**Response:**

```json
{
  "success": true,
  "paymentsPulled": 12,
  "invoicesUpdated": 8,
  "payments": [
    {
      "paymentId": "pay_abc123",
      "invoiceId": "65a1b2c3d4e5f6789012345",
      "invoiceNumber": "INV-2025-0042",
      "amount": 1500.00,
      "currency": "USD",
      "method": "credit_card",
      "paidAt": "2025-01-18T10:30:00.000Z",
      "transactionId": "txn_xyz789"
    }
  ]
}
```

---

### Get Sync Status

Get the status of a specific sync operation.

**Endpoint:** `GET /api/integrations/accounting/sync/status/{syncId}`

**Authentication:** Required

**Path Parameters:**
- `syncId`: Sync operation ID

**Response:**

```json
{
  "syncId": "sync_abc123xyz",
  "status": "completed",
  "entityType": "invoice",
  "entityId": "65a1b2c3d4e5f6789012345",
  "operation": "create",
  "platform": "xero",
  "startedAt": "2025-01-19T14:30:00.000Z",
  "completedAt": "2025-01-19T14:30:01.245Z",
  "duration": 1245,
  "result": {
    "success": true,
    "externalId": "inv_abc123",
    "url": "https://go.xero.com/..."
  }
}
```

---

## Data Import/Export Endpoints

### Initial Sync Configuration

Configure and preview initial data sync.

**Endpoint:** `POST /api/integrations/accounting/initial-sync/config`

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "direction": "import",
  "entities": {
    "clients": true,
    "products": true,
    "taxCodes": true,
    "historicalInvoices": false
  },
  "matchingRules": {
    "clients": "email",
    "products": "sku"
  },
  "preview": true
}
```

**Parameters:**
- `direction`: `import` (from platform), `export` (to platform), or `merge` (bidirectional)
- `entities`: Object specifying which entities to sync
- `matchingRules`: How to match existing records to prevent duplicates
- `preview`: If `true`, returns preview without making changes

**Response (Preview):**

```json
{
  "preview": true,
  "summary": {
    "clients": {
      "toCreate": 15,
      "toUpdate": 8,
      "toSkip": 2,
      "conflicts": 1
    },
    "products": {
      "toCreate": 42,
      "toUpdate": 5,
      "toSkip": 10,
      "conflicts": 0
    },
    "taxCodes": {
      "toCreate": 5,
      "toUpdate": 0,
      "toSkip": 0,
      "conflicts": 0
    }
  },
  "conflicts": [
    {
      "entityType": "client",
      "deskwiseName": "Acme Corp",
      "platformName": "ACME Corporation",
      "matchField": "email",
      "recommended": "merge"
    }
  ],
  "estimatedTime": "5-10 minutes"
}
```

---

### Execute Initial Sync

Execute the initial data sync based on configuration.

**Endpoint:** `POST /api/integrations/accounting/initial-sync/execute`

**Authentication:** Required (admin only)

**Request Body:**

```json
{
  "direction": "import",
  "entities": {
    "clients": true,
    "products": true,
    "taxCodes": true
  },
  "matchingRules": {
    "clients": "email",
    "products": "sku"
  },
  "conflictResolution": {
    "client_conflict1": "merge",
    "client_conflict2": "skip"
  }
}
```

**Response:**

```json
{
  "success": true,
  "batchId": "initial_sync_batch_001",
  "status": "in_progress",
  "estimatedCompletion": "2025-01-19T14:45:00.000Z",
  "statusUrl": "/api/integrations/accounting/initial-sync/status/initial_sync_batch_001"
}
```

---

### Get Initial Sync Status

Check the status of an initial sync operation.

**Endpoint:** `GET /api/integrations/accounting/initial-sync/status/{batchId}`

**Authentication:** Required

**Path Parameters:**
- `batchId`: Batch ID from initial sync execution

**Response:**

```json
{
  "batchId": "initial_sync_batch_001",
  "status": "in_progress",
  "progress": {
    "completed": 35,
    "total": 72,
    "percentage": 48
  },
  "results": {
    "clients": {
      "created": 12,
      "updated": 5,
      "skipped": 2,
      "failed": 0
    },
    "products": {
      "created": 16,
      "updated": 0,
      "skipped": 0,
      "failed": 0
    }
  },
  "errors": [],
  "startedAt": "2025-01-19T14:30:00.000Z",
  "estimatedCompletion": "2025-01-19T14:40:00.000Z"
}
```

---

### Import Clients from Platform

Import clients/customers from accounting platform.

**Endpoint:** `POST /api/integrations/accounting/import/clients`

**Authentication:** Required

**Request Body:**

```json
{
  "filters": {
    "activeOnly": true,
    "modifiedSince": "2025-01-01T00:00:00.000Z"
  },
  "matchBy": "email",
  "preview": false
}
```

**Response:**

```json
{
  "success": true,
  "imported": 24,
  "updated": 6,
  "skipped": 3,
  "clients": [
    {
      "externalId": "contact_abc123",
      "name": "Acme Corporation",
      "email": "contact@acme.com",
      "action": "created",
      "deskwiseId": "65a1b2c3d4e5f6789012999"
    }
  ]
}
```

---

### Import Products from Platform

Import items/products from accounting platform.

**Endpoint:** `POST /api/integrations/accounting/import/products`

**Authentication:** Required

**Request Body:**

```json
{
  "filters": {
    "type": "service",
    "activeOnly": true
  },
  "category": "Managed Services",
  "preview": false
}
```

**Response:**

```json
{
  "success": true,
  "imported": 18,
  "updated": 2,
  "skipped": 5,
  "products": [
    {
      "externalId": "item_service001",
      "name": "Monthly Monitoring",
      "sku": "MON-001",
      "price": 99.00,
      "action": "created",
      "deskwiseId": "65a1b2c3d4e5f6789011111"
    }
  ]
}
```

---

## History and Logs Endpoints

### Get Sync History

Retrieve sync operation history with filtering and pagination.

**Endpoint:** `GET /api/integrations/accounting/history`

**Authentication:** Required

**Query Parameters:**
- `page` (optional, default: `1`): Page number
- `limit` (optional, default: `50`, max: `200`): Records per page
- `entityType` (optional): Filter by entity type (`invoice`, `quote`, `client`, `product`, `payment`)
- `status` (optional): Filter by status (`success`, `failed`, `partial`)
- `fromDate` (optional): Start date filter
- `toDate` (optional): End date filter
- `platform` (optional): Filter by platform (`xero`, `quickbooks`, `myob`)

**Response:**

```json
{
  "history": [
    {
      "syncId": "sync_abc123",
      "entityType": "invoice",
      "entityId": "65a1b2c3d4e5f6789012345",
      "entityName": "INV-2025-0042",
      "operation": "create",
      "direction": "to_platform",
      "platform": "xero",
      "status": "success",
      "externalId": "inv_xyz789",
      "duration": 1245,
      "timestamp": "2025-01-19T14:30:00.000Z",
      "triggeredBy": "John Doe",
      "triggerType": "manual"
    },
    {
      "syncId": "sync_def456",
      "entityType": "payment",
      "entityId": "65a1b2c3d4e5f6789054321",
      "entityName": "Payment for INV-2025-0041",
      "operation": "create",
      "direction": "from_platform",
      "platform": "xero",
      "status": "success",
      "externalId": "pay_abc123",
      "duration": 523,
      "timestamp": "2025-01-19T14:25:00.000Z",
      "triggeredBy": "system",
      "triggerType": "scheduled"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1247,
    "totalPages": 25
  }
}
```

---

### Get Sync History Details

Get detailed information about a specific sync operation.

**Endpoint:** `GET /api/integrations/accounting/history/{syncId}`

**Authentication:** Required

**Path Parameters:**
- `syncId`: Sync operation ID

**Response:**

```json
{
  "syncId": "sync_abc123",
  "entityType": "invoice",
  "entityId": "65a1b2c3d4e5f6789012345",
  "operation": "create",
  "direction": "to_platform",
  "platform": "xero",
  "status": "success",

  "before": {
    "invoiceNumber": "INV-2025-0042",
    "status": "draft",
    "integration": null
  },

  "after": {
    "invoiceNumber": "INV-2025-0042",
    "status": "sent",
    "integration": {
      "platform": "xero",
      "externalId": "inv_xyz789",
      "syncStatus": "synced"
    }
  },

  "changes": [
    {
      "field": "integration.externalId",
      "before": null,
      "after": "inv_xyz789"
    },
    {
      "field": "integration.syncStatus",
      "before": null,
      "after": "synced"
    }
  ],

  "platformResponse": {
    "invoiceID": "inv_xyz789",
    "invoiceNumber": "INV-0042",
    "status": "SUBMITTED",
    "total": 1500.00
  },

  "duration": 1245,
  "timestamp": "2025-01-19T14:30:00.000Z",
  "triggeredBy": "65a1b2c3d4e5f6789099999",
  "triggeredByName": "John Doe",
  "triggerType": "manual"
}
```

---

### Export Sync History

Export sync history to CSV.

**Endpoint:** `GET /api/integrations/accounting/history/export`

**Authentication:** Required

**Query Parameters:**
- Same as "Get Sync History" endpoint
- `format` (optional, default: `csv`): Export format (`csv` or `json`)

**Response:**
Returns CSV file download or JSON file download.

**CSV Headers:**
```
Sync ID,Date/Time,Entity Type,Entity Name,Operation,Direction,Platform,Status,Duration (ms),Triggered By,Trigger Type,External ID,Error
```

---

### Get Failed Syncs

Retrieve only failed sync operations for troubleshooting.

**Endpoint:** `GET /api/integrations/accounting/history/failed`

**Authentication:** Required

**Query Parameters:**
- `page`, `limit` (pagination)
- `entityType` (filter)
- `fromDate`, `toDate` (date range)

**Response:**

```json
{
  "failed": [
    {
      "syncId": "sync_ghi789",
      "entityType": "invoice",
      "entityId": "65a1b2c3d4e5f6789012346",
      "entityName": "INV-2025-0043",
      "operation": "create",
      "platform": "xero",
      "errorCode": "VALIDATION_ERROR",
      "errorMessage": "Tax code 'INVALID' not found in Xero",
      "timestamp": "2025-01-19T13:45:00.000Z",
      "attempts": 3,
      "canRetry": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 8,
    "totalPages": 1
  }
}
```

---

### Retry Failed Sync

Retry a failed sync operation.

**Endpoint:** `POST /api/integrations/accounting/history/{syncId}/retry`

**Authentication:** Required

**Path Parameters:**
- `syncId`: Sync ID to retry

**Response:**

```json
{
  "success": true,
  "syncId": "sync_ghi789",
  "newJobId": "job_retry_001",
  "status": "queued",
  "message": "Sync queued for retry"
}
```

---

## Webhook Endpoints

### Xero Webhook Receiver

Receive webhooks from Xero (internal use).

**Endpoint:** `POST /api/integrations/accounting/webhook/xero`

**Authentication:** Verified via X-Xero-Signature header

**Headers:**
- `X-Xero-Signature`: HMAC-SHA256 signature for verification

**Request Body:**

```json
{
  "events": [
    {
      "resourceUrl": "https://api.xero.com/api.xro/2.0/Invoices/abc-123",
      "resourceId": "abc-123",
      "eventDateUtc": "2025-01-19T14:30:00.000Z",
      "eventType": "UPDATE",
      "eventCategory": "INVOICE",
      "tenantId": "tenant-xyz",
      "tenantType": "ORGANISATION"
    }
  ],
  "lastEventSequence": 12345,
  "firstEventSequence": 12340,
  "entropy": "random-string"
}
```

**Response:**

```json
{
  "received": true
}
```

**Note:** Returns 200 OK immediately, processes asynchronously.

---

### QuickBooks Webhook Receiver

Receive webhooks from QuickBooks.

**Endpoint:** `POST /api/integrations/accounting/webhook/quickbooks`

**Authentication:** Verified via Intuit-Signature header

**Headers:**
- `Intuit-Signature`: HMAC-SHA256 signature

**Request Body:**

```json
{
  "eventNotifications": [
    {
      "realmId": "123456789",
      "dataChangeEvent": {
        "entities": [
          {
            "name": "Invoice",
            "id": "inv-123",
            "operation": "Update",
            "lastUpdated": "2025-01-19T14:30:00.000Z"
          }
        ]
      }
    }
  ]
}
```

**Response:**

```json
{
  "received": true
}
```

---

### MYOB Webhook Receiver

Receive webhooks from MYOB.

**Endpoint:** `POST /api/integrations/accounting/webhook/myob`

**Authentication:** Verified via X-MYOB-Signature header

**Headers:**
- `X-MYOB-Signature`: HMAC-SHA256 signature

**Request Body:**

```json
{
  "Events": [
    {
      "EventId": "event-123",
      "EventType": "SaleInvoice.Updated",
      "CompanyFileId": "company-xyz",
      "ResourceUrl": "https://api.myob.com/accountright/company-xyz/Sale/Invoice/inv-123",
      "Timestamp": "2025-01-19T14:30:00.000Z"
    }
  ]
}
```

**Response:**

```json
{
  "received": true
}
```

---

## Error Codes

### General Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Integration Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NO_INTEGRATION` | 400 | No accounting integration connected |
| `INTEGRATION_DISCONNECTED` | 400 | Integration exists but is disconnected |
| `PLATFORM_ERROR` | 502 | Error from accounting platform API |
| `TOKEN_EXPIRED` | 401 | OAuth token expired, need to reconnect |
| `TOKEN_REFRESH_FAILED` | 500 | Failed to refresh OAuth token |

### Sync Errors

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `ALREADY_SYNCED` | 409 | Entity already synced (use `force: true` to override) |
| `CLIENT_NOT_SYNCED` | 400 | Client must be synced before invoice |
| `PRODUCT_NOT_SYNCED` | 400 | Product must be synced before use in invoice |
| `MAPPING_NOT_FOUND` | 400 | Required mapping not configured |
| `MISSING_REQUIRED_FIELD` | 400 | Required field missing in entity data |
| `DUPLICATE_EXTERNAL_ID` | 409 | External ID already exists in platform |
| `SYNC_QUEUE_FULL` | 429 | Too many pending sync jobs, try again later |

### Platform-Specific Errors

| Code | HTTP Status | Description | Platform |
|------|-------------|-------------|----------|
| `XERO_VALIDATION_ERROR` | 400 | Xero validation failed | Xero |
| `XERO_RATE_LIMIT` | 429 | Xero API rate limit exceeded | Xero |
| `QB_INVALID_COMPANY` | 400 | QuickBooks company not found | QuickBooks |
| `QB_ESTIMATE_NOT_SUPPORTED` | 400 | QB plan doesn't support estimates | QuickBooks |
| `MYOB_ACCOUNT_LOCKED` | 409 | MYOB account locked by another user | MYOB |
| `MYOB_TAX_CODE_INVALID` | 400 | Tax code not valid in MYOB | MYOB |

---

## Rate Limits

### Deskwise API Rate Limits

- **Standard**: 100 requests per minute per organization
- **Bulk operations**: 10 requests per minute
- **Webhook endpoints**: 200 requests per minute (across all platforms)

**Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1642598400
```

### Platform API Rate Limits

#### Xero
- **Burst limit**: 60 requests per minute
- **Daily limit**: 5,000 requests per day per organization
- **Concurrent limit**: 10 concurrent requests

#### QuickBooks Online
- **Standard**: 500 requests per minute per company
- **Burst**: No more than 100 requests in any 1-second window

#### MYOB
- **Standard**: 1,000 requests per day per company file
- **Burst**: 5 requests per second

**Note:** Deskwise automatically handles platform rate limits with exponential backoff and request queuing.

---

## Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/integrations/accounting/`

Future versions will use `/api/v2/integrations/accounting/` format.

---

## Support

For API support:
- **Documentation**: https://docs.deskwise.com/integrations/accounting
- **Support Email**: integrations@deskwise.com
- **Developer Discord**: https://discord.gg/deskwise-dev

---

*Last Updated: January 2025*
*API Version: 1.0*
