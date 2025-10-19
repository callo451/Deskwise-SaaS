# QuickBooks Online Integration

Complete production-ready integration with QuickBooks Online for the Deskwise MSP platform.

## Overview

This integration enables seamless synchronization between Deskwise and QuickBooks Online (QBO) for:
- **Invoices** → QuickBooks Invoices
- **Quotes** → QuickBooks Estimates
- **Clients** → QuickBooks Customers
- **Products** → QuickBooks Items/Services
- **Payments** → QuickBooks Payment records

## Architecture

### Components

1. **TypeScript Interfaces** (`src/lib/types.ts`)
   - `QuickBooksIntegration` - Connection configuration
   - `QuickBooksSyncLog` - Audit trail
   - `QuickBooksEntityReference` - Entity mapping
   - `QuickBooksMapping` - Field mapping configuration
   - `QuickBooksWebhookEvent` - Webhook events

2. **Service Layer**
   - `QuickBooksIntegrationService` (`src/lib/services/quickbooks-integration.ts`)
     - OAuth 2.0 flow management
     - Token encryption/decryption
     - Connection management
     - Token refresh automation
   - `QuickBooksSyncService` (`src/lib/services/quickbooks-sync.ts`)
     - Data transformation (Deskwise ↔ QuickBooks)
     - Sync operations
     - Error handling and retry logic

3. **API Routes** (`src/app/api/integrations/quickbooks/`)
   - `/connect` - Initiate OAuth flow
   - `/callback` - OAuth callback handler
   - `/disconnect` - Revoke integration
   - `/status` - Get connection status
   - `/test` - Test connection health
   - `/sync/invoices` - Sync invoices
   - `/sync/estimates` - Sync quotes as estimates
   - `/sync/customers` - Sync clients as customers
   - `/sync/items` - Sync products as items
   - `/sync-logs` - View sync history
   - `/tax-rates` - Fetch tax rates from QBO

### Database Collections

```javascript
// QuickBooks integrations
db.quickbooks_integrations {
  _id: ObjectId,
  orgId: string,
  status: 'connected' | 'disconnected' | 'expired' | 'error',
  realmId: string, // QuickBooks Company ID
  accessToken: string, // Encrypted
  refreshToken: string, // Encrypted
  tokenType: 'Bearer',
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,
  companyName: string,
  environment: 'sandbox' | 'production',
  autoSync: boolean,
  syncDirection: 'deskwise_to_qbo' | 'qbo_to_deskwise' | 'bidirectional',
  // ... stats and settings
}

// Sync audit logs
db.quickbooks_sync_logs {
  _id: ObjectId,
  orgId: string,
  integrationId: string,
  entityType: 'Invoice' | 'Estimate' | 'Customer' | 'Item' | 'Payment',
  direction: 'deskwise_to_qbo' | 'qbo_to_deskwise',
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  deskwiseEntityId: string,
  quickbooksEntityId: string,
  errorMessage: string,
  // ... detailed sync info
}

// Entity references (mapping)
db.quickbooks_entity_references {
  _id: ObjectId,
  orgId: string,
  integrationId: string,
  deskwiseEntityId: string,
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product',
  quickbooksEntityId: string,
  quickbooksEntityType: 'Invoice' | 'Estimate' | 'Customer' | 'Item',
  quickbooksSyncToken: string, // Required for updates
  lastSyncedAt: Date,
  isSyncEnabled: boolean
}

// OAuth state tokens (temporary)
db.qbo_oauth_states {
  _id: ObjectId,
  orgId: string,
  state: string, // CSRF token
  createdAt: Date,
  expiresAt: Date
}
```

## Setup Instructions

### 1. Create QuickBooks App

1. Go to [Intuit Developer Portal](https://developer.intuit.com)
2. Sign in or create an account
3. Create a new app:
   - **App Type**: QuickBooks Online
   - **Scopes**: Accounting, OpenID
4. Get credentials:
   - Client ID
   - Client Secret
5. Configure redirect URI:
   - Development: `http://localhost:9002/api/integrations/quickbooks/callback`
   - Production: `https://yourdomain.com/api/integrations/quickbooks/callback`

### 2. Environment Variables

Add to `.env.local`:

```env
# QuickBooks Online Integration
QUICKBOOKS_CLIENT_ID=your_client_id_here
QUICKBOOKS_CLIENT_SECRET=your_client_secret_here
QUICKBOOKS_REDIRECT_URI=http://localhost:9002/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox # or 'production'

# Integration Encryption (32+ characters)
INTEGRATION_ENCRYPTION_KEY=your-32-character-secret-key-for-encryption
```

**Important**:
- `INTEGRATION_ENCRYPTION_KEY` must be at least 32 characters
- Never commit `.env.local` to version control
- Use different keys for development and production

### 3. Database Indexes

Run these commands in MongoDB to create required indexes:

```javascript
// Unique integration per organization
db.quickbooks_integrations.createIndex({ orgId: 1, status: 1 })

// Sync logs queries
db.quickbooks_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.quickbooks_sync_logs.createIndex({ orgId: 1, entityType: 1, status: 1 })

// Entity references
db.quickbooks_entity_references.createIndex({
  orgId: 1,
  deskwiseEntityId: 1,
  deskwiseEntityType: 1
}, { unique: true })
db.quickbooks_entity_references.createIndex({
  orgId: 1,
  quickbooksEntityId: 1
})

// OAuth states (TTL index for auto-cleanup)
db.qbo_oauth_states.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

## OAuth 2.0 Flow

### Connection Flow

```
1. User clicks "Connect to QuickBooks"
   ↓
2. POST /api/integrations/quickbooks/connect
   - Generates authorization URL with state token
   - Stores state in database for CSRF validation
   ↓
3. User redirected to Intuit OAuth page
   - Selects QuickBooks company
   - Grants permissions
   ↓
4. Intuit redirects to callback URL
   GET /api/integrations/quickbooks/callback?code=...&realmId=...&state=...
   ↓
5. Backend validates state token
   ↓
6. Exchange authorization code for tokens
   ↓
7. Encrypt and store tokens in database
   ↓
8. Redirect user back to settings page with success message
```

### Token Management

- **Access Token**: Valid for 3600 seconds (1 hour)
- **Refresh Token**: Valid for 8726400 seconds (101 days)
- **Auto-refresh**: Service automatically refreshes tokens 5 minutes before expiry
- **Security**: All tokens encrypted with AES-256-GCM before database storage

### Token Refresh Logic

```typescript
// Automatic refresh before API calls
const isExpiring = integration.accessTokenExpiresAt.getTime() - now.getTime() < 5 * 60 * 1000

if (isExpiring) {
  await QuickBooksIntegrationService.refreshAccessToken(integrationId)
}
```

## Data Synchronization

### Invoice → QuickBooks Invoice

**Deskwise Invoice Fields**:
```typescript
{
  invoiceNumber: "INV-2024-0001",
  clientId: "client_123",
  clientName: "Acme Corp",
  invoiceDate: Date,
  dueDate: Date,
  lineItems: [
    {
      name: "Managed Services",
      description: "Monthly IT support",
      quantity: 1,
      unitPrice: 2500,
      total: 2500,
      taxable: true
    }
  ],
  subtotal: 2500,
  taxAmount: 200,
  total: 2700
}
```

**QuickBooks Invoice Format**:
```json
{
  "CustomerRef": { "value": "123" },
  "DocNumber": "INV-2024-0001",
  "TxnDate": "2024-10-19",
  "DueDate": "2024-11-19",
  "Line": [
    {
      "DetailType": "SalesItemLineDetail",
      "Amount": 2500,
      "Description": "Monthly IT support",
      "SalesItemLineDetail": {
        "Qty": 1,
        "UnitPrice": 2500,
        "ItemRef": { "value": "1" },
        "TaxCodeRef": { "value": "TAX" }
      }
    }
  ],
  "TxnTaxDetail": { "TotalTax": 200 }
}
```

### Quote → QuickBooks Estimate

Similar transformation as invoices, but creates Estimate entity with `ExpirationDate` field.

### Client → QuickBooks Customer

**Field Mapping**:
- `name` → `DisplayName` and `CompanyName`
- `primaryContact.email` → `PrimaryEmailAddr.Address`
- `primaryContact.phone` → `PrimaryPhone.FreeFormNumber`
- `address` → `BillAddr`
- `status` → `Active` (boolean)

### Product → QuickBooks Item

**Field Mapping**:
- `name` → `Name`
- `description` → `Description`
- `type` → `Type` (Service or NonInventory)
- `unitPrice` → `UnitPrice`
- `cost` → `PurchaseCost`
- `isTaxable` → `Taxable`
- `stockQuantity` → `QtyOnHand`

## Sync Operations

### Manual Sync (Single Entity)

```typescript
// Sync invoice
POST /api/integrations/quickbooks/sync/invoices
{
  "invoiceId": "invoice_123"
}

// Response
{
  "success": true,
  "qboInvoiceId": "456",
  "results": [...]
}
```

### Bulk Sync (Multiple Entities)

```typescript
// Sync multiple invoices
POST /api/integrations/quickbooks/sync/invoices
{
  "invoiceIds": ["invoice_1", "invoice_2", "invoice_3"]
}

// Response
{
  "success": true,
  "results": [
    { "invoiceId": "invoice_1", "success": true, "qboInvoiceId": "101" },
    { "invoiceId": "invoice_2", "success": true, "qboInvoiceId": "102" },
    { "invoiceId": "invoice_3", "success": false, "error": "Customer not found" }
  ],
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1
  }
}
```

### Automatic Customer Sync

When syncing an invoice or quote, if the customer doesn't exist in QuickBooks:
1. System automatically syncs the customer first
2. Uses the new customer ID for the invoice/quote
3. All operations logged in sync_logs

## QuickBooks-Specific Handling

### SyncToken (Sparse Update Pattern)

QuickBooks requires a `SyncToken` for all update operations:

```typescript
// Fetch current entity to get SyncToken
const currentInvoice = await qbo.getInvoice(existingRef.quickbooksEntityId)

// Include in update payload
qboInvoice.Id = existingRef.quickbooksEntityId
qboInvoice.SyncToken = currentInvoice.SyncToken

// Update
await qbo.updateInvoice(qboInvoice)
```

### Entity References

System maintains bidirectional mapping:

```typescript
{
  deskwiseEntityId: "invoice_abc123",
  deskwiseEntityType: "invoice",
  quickbooksEntityId: "456",
  quickbooksEntityType: "Invoice",
  quickbooksSyncToken: "3", // Latest SyncToken
  lastSyncedAt: Date
}
```

This enables:
- Updates (requires SyncToken)
- Duplicate prevention
- Two-way sync (future)
- Conflict detection

## Error Handling

### Rate Limiting

QuickBooks has API rate limits:
- **Per-app**: 500 requests per minute
- **Per-company**: 100 requests per minute

Service implements:
- Exponential backoff on 429 errors
- Retry logic (max 3 retries)
- Error logging with details

### Error Types

1. **Authentication Errors** (401)
   - Token expired → Auto-refresh
   - Invalid credentials → Mark as expired

2. **Validation Errors** (400)
   - Missing required fields
   - Invalid data format
   - Logged with full details

3. **Business Logic Errors**
   - Duplicate entity → Update instead
   - Missing dependencies → Auto-sync dependencies

4. **Network Errors**
   - Timeout → Retry with backoff
   - Connection failed → Mark as degraded

### Sync Log Example

```javascript
{
  _id: ObjectId("..."),
  orgId: "org_123",
  integrationId: "integration_456",
  entityType: "Invoice",
  direction: "deskwise_to_qbo",
  status: "completed", // or "failed"
  deskwiseEntityId: "invoice_abc",
  quickbooksEntityId: "789",
  startedAt: ISODate("2024-10-19T10:00:00Z"),
  completedAt: ISODate("2024-10-19T10:00:02Z"),
  duration: 2000, // milliseconds
  retryCount: 0,
  errorMessage: null,
  requestPayload: { /* full request */ },
  responseData: { /* QBO response */ },
  triggeredBy: "user_xyz",
  triggeredByName: "John Doe"
}
```

## Security

### Token Encryption

All QuickBooks tokens encrypted using AES-256-GCM:

```typescript
// Encryption
const encrypted = EncryptionService.encrypt(accessToken)
// Format: "iv:authTag:encryptedData"

// Decryption
const accessToken = EncryptionService.decrypt(encrypted)
```

### CSRF Protection

OAuth flow uses state tokens:
1. Generate random 32-byte state
2. Store in database with 10-minute expiry
3. Validate on callback
4. Delete after use

### Multi-Tenancy

All operations strictly scoped to `orgId`:
- Integration per organization
- Sync logs per organization
- Entity references per organization

## Health Monitoring

### Connection Test

```typescript
POST /api/integrations/quickbooks/test

// Response
{
  "connected": true,
  "companyName": "Sandbox Company_US_1"
}
```

### Health Checks

System tracks:
- `lastHealthCheckAt`: Timestamp of last test
- `lastHealthCheckStatus`: 'healthy' | 'degraded' | 'unhealthy'
- Updated on each API call

### Integration Status

```typescript
GET /api/integrations/quickbooks/status

// Response
{
  "connected": true,
  "integration": {
    "status": "connected",
    "companyName": "Acme Corp",
    "environment": "production",
    "totalInvoicesSynced": 45,
    "totalCustomersSynced": 12,
    "totalProductsSynced": 8,
    "lastSyncAt": "2024-10-19T09:30:00Z",
    "lastSyncStatus": "success",
    "lastHealthCheckStatus": "healthy"
  }
}
```

## Testing

### Sandbox Environment

1. Use `QUICKBOOKS_ENVIRONMENT=sandbox`
2. Create test company at [Intuit Developer](https://developer.intuit.com)
3. Test with sample data:
   - Create test invoices
   - Create test customers
   - Verify sync operations

### Production Checklist

- [ ] Environment variables set in production
- [ ] Encryption key is 32+ characters and unique
- [ ] Redirect URI matches production domain
- [ ] Database indexes created
- [ ] QuickBooks app approved by Intuit (for public release)
- [ ] Error monitoring configured
- [ ] Backup strategy for integration data

## API Reference

### Connect to QuickBooks
```
POST /api/integrations/quickbooks/connect
Response: { authorizationUrl: string }
```

### OAuth Callback
```
GET /api/integrations/quickbooks/callback?code=...&realmId=...&state=...
Redirects to: /dashboard/settings/integrations
```

### Disconnect
```
POST /api/integrations/quickbooks/disconnect
Body: { reason?: string }
Response: { success: boolean }
```

### Get Status
```
GET /api/integrations/quickbooks/status
Response: { connected: boolean, integration: {...} }
```

### Test Connection
```
POST /api/integrations/quickbooks/test
Response: { connected: boolean, companyName?: string, error?: string }
```

### Sync Invoices
```
POST /api/integrations/quickbooks/sync/invoices
Body: { invoiceId: string } or { invoiceIds: string[] }
Response: { success: boolean, results: [...], summary: {...} }
```

### Sync Estimates
```
POST /api/integrations/quickbooks/sync/estimates
Body: { quoteId: string } or { quoteIds: string[] }
Response: { success: boolean, results: [...], summary: {...} }
```

### Sync Customers
```
POST /api/integrations/quickbooks/sync/customers
Body: { clientId: string } or { clientIds: string[] }
Response: { success: boolean, results: [...], summary: {...} }
```

### Sync Items
```
POST /api/integrations/quickbooks/sync/items
Body: { productId: string } or { productIds: string[] }
Response: { success: boolean, results: [...], summary: {...} }
```

### Get Sync Logs
```
GET /api/integrations/quickbooks/sync-logs?entityType=Invoice&status=failed&limit=50
Response: { success: boolean, logs: [...], total: number }
```

### Fetch Tax Rates
```
GET /api/integrations/quickbooks/tax-rates
Response: { success: boolean, taxRates: [...], total: number }
```

## Dependencies

Installed packages:
- `intuit-oauth` - Official Intuit OAuth 2.0 client
- `node-quickbooks` - QuickBooks Online API client

## Future Enhancements

### Planned Features

1. **Bidirectional Sync**
   - Pull invoices from QuickBooks to Deskwise
   - Conflict resolution strategies

2. **Webhook Support**
   - Real-time updates from QuickBooks
   - Automatic sync on QuickBooks changes

3. **Advanced Mapping**
   - Custom field mappings per organization
   - Transformation scripts

4. **Scheduled Sync**
   - Hourly/daily automatic sync
   - Batch processing

5. **Reporting**
   - Sync success/failure rates
   - Data integrity checks
   - Sync analytics dashboard

### Webhook Implementation (Future)

```typescript
POST /api/integrations/quickbooks/webhook
// Receives notifications from QuickBooks
// Processes entity changes
// Triggers sync operations
```

## Troubleshooting

### Common Issues

**1. "Integration not found"**
- User hasn't connected QuickBooks yet
- Integration was disconnected
- Solution: Re-connect via settings page

**2. "Token expired"**
- Access token expired and refresh failed
- Refresh token expired (after 101 days)
- Solution: Re-authorize connection

**3. "Customer not found"**
- Customer not synced before invoice
- Solution: Sync automatically triggered (handled by system)

**4. "SyncToken mismatch"**
- Entity was updated in QuickBooks externally
- Solution: Fetch latest entity before update (handled by system)

**5. "Rate limit exceeded"**
- Too many requests in short time
- Solution: Retry with exponential backoff (handled by system)

### Debug Logging

Enable debugging in service calls:
```typescript
const qbo = new QuickBooks(
  clientId,
  clientSecret,
  accessToken,
  false,
  realmId,
  useSandbox,
  true, // ← Enable debugging
  null,
  '2.0',
  refreshToken
)
```

## Support

For issues or questions:
1. Check sync logs: `GET /api/integrations/quickbooks/sync-logs`
2. Test connection: `POST /api/integrations/quickbooks/test`
3. Review MongoDB collections for detailed error information
4. Check console logs for debugging output

## License

This integration is part of the Deskwise MSP platform.
