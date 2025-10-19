# Xero Integration Documentation

## Overview

This document provides comprehensive documentation for the production-ready Xero accounting integration for the Deskwise MSP platform. The integration enables seamless synchronization of invoices, quotes, customers, products, and payments between Deskwise and Xero using OAuth 2.0 authentication.

## Table of Contents

1. [Architecture](#architecture)
2. [Setup & Configuration](#setup--configuration)
3. [OAuth 2.0 Flow](#oauth-20-flow)
4. [API Endpoints](#api-endpoints)
5. [Service Layer Methods](#service-layer-methods)
6. [Database Collections](#database-collections)
7. [Security](#security)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Deskwise Frontend                        │
│            (React Components / API Calls)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│        /api/integrations/xero/*                              │
│  - connect, callback, disconnect                             │
│  - status, test                                              │
│  - sync/invoices, sync/quotes                                │
│  - sync/customers, sync/products                             │
│  - sync-logs, tax-rates                                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              XeroIntegrationService                          │
│         (src/lib/services/xero-integration.ts)               │
│  - OAuth flow management                                     │
│  - Token refresh and encryption                              │
│  - Entity synchronization logic                              │
│  - Error handling and retry logic                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   xero-node SDK                              │
│              (XeroClient from npm)                           │
│  - OAuth 2.0 authentication                                  │
│  - Xero Accounting API calls                                 │
│  - Token management                                          │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Xero API                                  │
│         (api.xero.com/api.xro/2.0)                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **OAuth Connection**: User initiates connection → Authorization URL generated → User authorizes on Xero → Callback received → Tokens stored (encrypted)
2. **Token Management**: Before each API call → Check token expiry → Refresh if needed → Use fresh token
3. **Entity Sync**: Sync request → Fetch from Deskwise DB → Transform to Xero format → Create/Update in Xero → Store reference → Log result

---

## Setup & Configuration

### 1. Install Dependencies

The `xero-node` package has already been installed:

```bash
npm install xero-node
```

### 2. Create Xero App

1. Go to [Xero Developer Portal](https://developer.xero.com/app/manage)
2. Click "New app"
3. Fill in app details:
   - **App name**: Deskwise MSP
   - **Integration type**: Web app
   - **Company or application URL**: `https://yourdomain.com`
   - **Redirect URI**: `https://yourdomain.com/api/integrations/xero/callback`
     - For local development: `http://localhost:9002/api/integrations/xero/callback`
4. Click "Create app"
5. Note down your **Client ID** and **Client Secret**

### 3. Environment Variables

Add the following to your `.env.local` file:

```env
# Xero OAuth Credentials
XERO_CLIENT_ID=your-xero-client-id-here
XERO_CLIENT_SECRET=your-xero-client-secret-here
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# Integration Encryption (for secure token storage)
# Use the same key as QuickBooks or create a new 32+ character secret
INTEGRATION_ENCRYPTION_KEY=your-32-character-encryption-secret-here

# Alternative: Will fall back to NEXTAUTH_SECRET if INTEGRATION_ENCRYPTION_KEY not set
NEXTAUTH_SECRET=your-nextauth-secret-here
```

### 4. Database Indexes

Create the following indexes in MongoDB for optimal performance:

```javascript
// xero_integrations collection
db.xero_integrations.createIndex({ orgId: 1 }, { unique: true })
db.xero_integrations.createIndex({ tenantId: 1 })
db.xero_integrations.createIndex({ status: 1 })

// xero_sync_logs collection
db.xero_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.xero_sync_logs.createIndex({ integrationId: 1, createdAt: -1 })
db.xero_sync_logs.createIndex({ entityType: 1 })

// xero_entity_references collection
db.xero_entity_references.createIndex({ orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 }, { unique: true })
db.xero_entity_references.createIndex({ orgId: 1, xeroEntityId: 1 })
db.xero_entity_references.createIndex({ integrationId: 1 })

// xero_mappings collection
db.xero_mappings.createIndex({ orgId: 1, entityType: 1 })
db.xero_mappings.createIndex({ integrationId: 1 })

// xero_webhook_events collection
db.xero_webhook_events.createIndex({ orgId: 1, createdAt: -1 })
db.xero_webhook_events.createIndex({ integrationId: 1, processed: 1 })
db.xero_webhook_events.createIndex({ tenantId: 1, eventType: 1 })
```

---

## OAuth 2.0 Flow

### Standard Authorization Code Flow

The Xero integration uses OAuth 2.0 with the authorization code grant type.

#### Step 1: Initiate Connection

**Endpoint**: `POST /api/integrations/xero/connect`

**Request**:
```javascript
fetch('/api/integrations/xero/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
})
```

**Response**:
```json
{
  "success": true,
  "authorizationUrl": "https://login.xero.com/identity/connect/authorize?..."
}
```

**Frontend Action**: Redirect user to `authorizationUrl`

#### Step 2: User Authorizes

User is redirected to Xero's authorization page where they:
1. Log in to their Xero account
2. Select the organization to connect
3. Grant permissions to Deskwise

#### Step 3: Callback Handler

**Endpoint**: `GET /api/integrations/xero/callback?code=xxx&state=yyy`

Xero redirects back to your callback URL with:
- `code`: Authorization code
- `state`: CSRF protection (optional)
- `scope`: Granted scopes

The callback handler:
1. Exchanges code for tokens (access token, refresh token, ID token)
2. Fetches tenant information
3. Encrypts tokens using AES-256-GCM
4. Stores integration in database
5. Redirects user to integrations page

#### Step 4: Token Refresh

**Automatic**: Tokens are automatically refreshed before API calls when:
- Access token expires (30 minutes by default)
- Access token is within 5 minutes of expiry

**Process**:
1. Check `accessTokenExpiresAt` before each API call
2. If expired/expiring soon:
   - Use `refreshToken` to get new tokens
   - Encrypt and store new tokens
   - Update expiry dates
   - Continue with API call

**Refresh Token Lifecycle**:
- Xero refresh tokens last **60 days**
- Each refresh gives you a **new refresh token**
- Old refresh token becomes invalid
- Store new refresh token immediately

---

## API Endpoints

### Connection Management

#### POST /api/integrations/xero/connect
Initiate OAuth flow and get authorization URL.

**Request**: None
**Response**:
```json
{
  "success": true,
  "authorizationUrl": "https://login.xero.com/identity/connect/authorize?..."
}
```

#### GET /api/integrations/xero/callback
OAuth callback handler (called by Xero).

**Query Params**: `code`, `state`, `scope`
**Response**: Redirects to `/dashboard/settings/integrations?xero=connected`

#### POST /api/integrations/xero/disconnect
Disconnect Xero integration.

**Request**: None
**Response**:
```json
{
  "success": true,
  "message": "Xero integration disconnected successfully"
}
```

#### GET /api/integrations/xero/status
Get integration status and configuration.

**Request**: None
**Response**:
```json
{
  "connected": true,
  "integration": {
    "_id": "...",
    "status": "connected",
    "tenantName": "Demo Company (US)",
    "organizationName": "Demo Company (US)",
    "countryCode": "US",
    "baseCurrency": "USD",
    "autoSync": false,
    "syncDirection": "deskwise_to_xero",
    "syncInvoices": true,
    "syncQuotes": true,
    "syncContacts": true,
    "syncProducts": true,
    "lastSyncAt": "2025-10-19T10:30:00Z",
    "lastHealthCheck": "2025-10-19T11:00:00Z"
  }
}
```

#### POST /api/integrations/xero/test
Test connection to Xero.

**Request**: None
**Response**:
```json
{
  "success": true,
  "message": "Successfully connected to Xero",
  "data": {
    "name": "Demo Company (US)",
    "countryCode": "US",
    "baseCurrency": "USD",
    "isDemoCompany": true
  }
}
```

### Entity Synchronization

#### POST /api/integrations/xero/sync/invoices
Sync invoice(s) to Xero.

**Request**:
```json
{
  "invoiceId": "507f1f77bcf86cd799439011"
}
```
OR (bulk sync):
```json
{
  "invoiceIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

**Response** (single):
```json
{
  "success": true,
  "xeroInvoiceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Invoice synced successfully"
}
```

**Response** (bulk):
```json
{
  "success": true,
  "message": "Synced 2 invoice(s), 0 failed",
  "results": [
    {
      "invoiceId": "507f1f77bcf86cd799439011",
      "success": true,
      "xeroInvoiceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "invoiceId": "507f1f77bcf86cd799439012",
      "success": true,
      "xeroInvoiceId": "b2c3d4e5-f6a7-8901-bcde-f12345678901"
    }
  ]
}
```

#### POST /api/integrations/xero/sync/quotes
Sync quote(s) to Xero.

**Request/Response**: Same structure as invoices, but with `quoteId`/`quoteIds` and `xeroQuoteId`

#### POST /api/integrations/xero/sync/customers
Sync customer(s) to Xero.

**Request/Response**: Same structure as invoices, but with `clientId`/`clientIds` and `xeroContactId`

#### POST /api/integrations/xero/sync/products
Sync product(s) to Xero.

**Request/Response**: Same structure as invoices, but with `productId`/`productIds` and `xeroItemId`

### Utility Endpoints

#### GET /api/integrations/xero/sync-logs
Get sync operation logs.

**Query Params**: `limit` (default: 50)
**Response**:
```json
{
  "success": true,
  "logs": [
    {
      "_id": "...",
      "syncType": "manual",
      "entityType": "Invoice",
      "syncDirection": "deskwise_to_xero",
      "status": "completed",
      "recordsProcessed": 1,
      "recordsSucceeded": 1,
      "recordsFailed": 0,
      "duration": 1523,
      "errors": [],
      "startedAt": "2025-10-19T10:30:00Z",
      "completedAt": "2025-10-19T10:30:01Z",
      "triggeredBy": "user_123",
      "triggerType": "manual"
    }
  ],
  "count": 15
}
```

#### GET /api/integrations/xero/tax-rates
Get tax rates from Xero.

**Request**: None
**Response**:
```json
{
  "success": true,
  "taxRates": [
    {
      "name": "Tax Exempt",
      "taxType": "NONE",
      "status": "ACTIVE"
    },
    {
      "name": "Sales Tax on Imports",
      "taxType": "GSTONIMPORTS",
      "effectiveRate": "15.00",
      "status": "ACTIVE"
    }
  ],
  "count": 2
}
```

---

## Service Layer Methods

### XeroIntegrationService

Located at: `src/lib/services/xero-integration.ts`

#### Connection Management

##### `getAuthorizationUrl(orgId: string): Promise<string>`
Generate OAuth authorization URL.

**Parameters**:
- `orgId`: Organization ID

**Returns**: Authorization URL to redirect user

**Example**:
```typescript
const authUrl = await XeroIntegrationService.getAuthorizationUrl('org_123')
window.location.href = authUrl
```

##### `handleCallback(orgId: string, url: string, userId: string): Promise<XeroIntegration>`
Handle OAuth callback and exchange code for tokens.

**Parameters**:
- `orgId`: Organization ID
- `url`: Full callback URL with query params
- `userId`: User ID who initiated connection

**Returns**: Created/updated integration object

**Example**:
```typescript
const integration = await XeroIntegrationService.handleCallback(
  'org_123',
  'http://localhost:9002/api/integrations/xero/callback?code=xxx',
  'user_123'
)
```

##### `getIntegration(orgId: string): Promise<XeroIntegration | null>`
Get integration for an organization.

**Parameters**:
- `orgId`: Organization ID

**Returns**: Integration object or null if not found

##### `refreshAccessToken(orgId: string): Promise<void>`
Refresh access token using refresh token.

**Parameters**:
- `orgId`: Organization ID

**Throws**: Error if refresh fails

**Note**: This is called automatically by `getAuthenticatedClient()` when token is expired

##### `disconnect(orgId: string, userId: string): Promise<void>`
Disconnect integration.

**Parameters**:
- `orgId`: Organization ID
- `userId`: User ID who disconnected

##### `testConnection(orgId: string): Promise<{ success: boolean; message: string; data?: any }>`
Test connection to Xero by fetching organization info.

**Parameters**:
- `orgId`: Organization ID

**Returns**: Test result with organization data

#### Entity Synchronization

##### `syncInvoice(orgId: string, invoiceId: string, triggeredBy: string): Promise<{ success: boolean; xeroInvoiceId?: string; error?: string }>`
Sync invoice to Xero.

**Parameters**:
- `orgId`: Organization ID
- `invoiceId`: Deskwise invoice ID
- `triggeredBy`: User ID who triggered sync

**Returns**: Sync result with Xero invoice ID

**Process**:
1. Fetch Deskwise invoice from DB
2. Check if already synced (entity reference)
3. Ensure customer/contact exists in Xero
4. Transform invoice data to Xero format
5. Create or update invoice in Xero
6. Store entity reference
7. Log sync operation
8. Return result

**Invoice Status Mapping**:
- `draft` → `DRAFT`
- `sent`, `viewed` → `SUBMITTED`
- `partial`, `overdue` → `AUTHORISED`
- `paid` → `PAID`
- `cancelled`, `refunded` → `VOIDED`

##### `syncQuote(orgId: string, quoteId: string, triggeredBy: string): Promise<{ success: boolean; xeroQuoteId?: string; error?: string }>`
Sync quote to Xero.

**Quote Status Mapping**:
- `draft` → `DRAFT`
- `sent`, `viewed` → `SENT`
- `accepted` → `ACCEPTED`
- `rejected` → `DECLINED`
- `expired` → `DELETED`
- `converted` → `INVOICED`

##### `syncCustomer(orgId: string, clientId: string, triggeredBy: string): Promise<{ success: boolean; xeroContactId?: string; error?: string }>`
Sync customer/client to Xero as Contact.

**Process**:
1. Fetch Deskwise client
2. Check if already synced
3. Transform to Xero Contact format
4. Create or update contact
5. Store entity reference
6. Log sync operation

##### `syncProduct(orgId: string, productId: string, triggeredBy: string): Promise<{ success: boolean; xeroItemId?: string; error?: string }>`
Sync product to Xero as Item.

**Process**:
1. Fetch Deskwise product
2. Check if already synced
3. Transform to Xero Item format
4. Create or update item
5. Store entity reference
6. Log sync operation

##### `recordPayment(orgId: string, invoiceId: string, paymentAmount: number, paymentDate: Date, triggeredBy: string): Promise<{ success: boolean; xeroPaymentId?: string; error?: string }>`
Record payment in Xero for an invoice.

**Parameters**:
- `orgId`: Organization ID
- `invoiceId`: Deskwise invoice ID
- `paymentAmount`: Payment amount
- `paymentDate`: Payment date
- `triggeredBy`: User ID

**Requirements**: Invoice must be already synced to Xero

#### Utility Methods

##### `getTaxRates(orgId: string): Promise<any[]>`
Fetch tax rates from Xero.

**Returns**: Array of tax rate objects

##### `getSyncLogs(orgId: string, limit: number = 50): Promise<XeroSyncLog[]>`
Get sync operation logs.

**Parameters**:
- `orgId`: Organization ID
- `limit`: Maximum number of logs to return (default: 50)

**Returns**: Array of sync log objects

---

## Database Collections

### xero_integrations

Stores Xero connection details and settings.

**Fields**:
```typescript
{
  _id: ObjectId,
  orgId: string,                      // Unique per organization
  status: 'connected' | 'disconnected' | 'expired' | 'error',
  tenantId: string,                   // Xero organization ID
  tenantName: string,

  // OAuth Tokens (encrypted with AES-256-GCM)
  accessToken: string,
  refreshToken: string,
  idToken: string,
  tokenType: string,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,

  // Organization Info
  organizationName: string,
  countryCode: string,
  baseCurrency: string,
  isDemoCompany: boolean,

  // Sync Settings
  autoSync: boolean,
  syncDirection: 'deskwise_to_xero' | 'xero_to_deskwise' | 'bidirectional',
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual',
  syncInvoices: boolean,
  syncQuotes: boolean,
  syncContacts: boolean,
  syncProducts: boolean,
  syncPayments: boolean,

  // Default Mapping
  defaultRevenueAccount: string,      // Account code
  defaultExpenseAccount: string,
  defaultBankAccount: string,
  defaultPaymentTerms: string,
  defaultTaxType: string,             // Tax type code

  // Field Mappings
  fieldMappings: {
    invoice?: Record<string, string>,
    contact?: Record<string, string>,
    item?: Record<string, string>
  },

  // Health & Error Tracking
  lastSyncAt: Date,
  lastHealthCheck: Date,
  consecutiveFailures: number,
  lastErrorAt: Date,

  // Audit
  connectedBy: string,
  disconnectedAt: Date,
  disconnectedBy: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### xero_sync_logs

Tracks all sync operations for auditing.

**Fields**:
```typescript
{
  _id: ObjectId,
  orgId: string,
  integrationId: string,

  syncType: 'full' | 'incremental' | 'manual',
  entityType: 'Invoice' | 'Quote' | 'Contact' | 'Item' | 'Payment',
  syncDirection: 'deskwise_to_xero' | 'xero_to_deskwise' | 'bidirectional',
  status: 'pending' | 'syncing' | 'completed' | 'failed' | 'cancelled',

  recordsProcessed: number,
  recordsSucceeded: number,
  recordsFailed: number,
  duration: number,                   // milliseconds

  errors: Array<{
    entityId: string,
    entityName: string,
    errorCode: string,
    errorMessage: string,
    timestamp: Date
  }>,

  startedAt: Date,
  completedAt: Date,
  triggeredBy: string,
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'auto',

  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### xero_entity_references

Maps Deskwise entities to Xero entities.

**Fields**:
```typescript
{
  _id: ObjectId,
  orgId: string,
  integrationId: string,

  // Deskwise Entity
  deskwiseEntityId: string,
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment',

  // Xero Entity
  xeroEntityId: string,
  xeroEntityType: 'Invoice' | 'Quote' | 'Contact' | 'Item' | 'Payment',
  xeroStatus: string,                 // e.g., 'DRAFT', 'AUTHORISED'

  // Sync Metadata
  lastSyncedAt: Date,
  syncDirection: 'deskwise_to_xero' | 'xero_to_deskwise' | 'bidirectional',
  isSyncEnabled: boolean,

  // Version Control
  deskwiseVersion: number,
  xeroVersion: number,

  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
```javascript
{ orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 } (unique)
{ orgId: 1, xeroEntityId: 1 }
{ integrationId: 1 }
```

### xero_mappings

Custom field mappings (optional, for advanced users).

**Fields**:
```typescript
{
  _id: ObjectId,
  orgId: string,
  integrationId: string,

  entityType: 'Invoice' | 'Quote' | 'Contact' | 'Item',
  mappingName: string,
  description: string,

  mappings: Array<{
    deskwiseField: string,
    xeroField: string,
    direction: 'to_xero' | 'from_xero' | 'bidirectional',
    transform: string,                // Function name for transformation
    isRequired: boolean,
    defaultValue: any
  }>,

  isActive: boolean,
  lastUsedAt: Date,
  usageCount: number,

  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### xero_webhook_events

Stores incoming webhook events (future feature).

**Fields**:
```typescript
{
  _id: ObjectId,
  orgId: string,
  integrationId: string,

  eventType: string,                  // e.g., 'CREATE', 'UPDATE'
  eventCategory: string,              // e.g., 'INVOICE', 'CONTACT'
  resourceId: string,
  tenantId: string,

  entityType: 'Invoice' | 'Quote' | 'Contact' | 'Item',
  entityId: string,

  rawPayload: Record<string, any>,

  processed: boolean,
  processedAt: Date,
  processingError: string,

  receivedAt: Date,
  signature: string,
  verificationStatus: 'verified' | 'failed' | 'skipped',

  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

---

## Security

### Token Encryption

All OAuth tokens are encrypted before storage using AES-256-GCM encryption.

**Encryption Process**:
1. Generate random 16-byte IV (Initialization Vector)
2. Derive 32-byte key from `INTEGRATION_ENCRYPTION_KEY` using scrypt
3. Encrypt token with AES-256-GCM
4. Get auth tag for integrity verification
5. Store as: `iv:authTag:encryptedData` (hex encoded)

**Decryption Process**:
1. Split stored string into `iv`, `authTag`, `encryptedData`
2. Convert from hex to buffers
3. Derive same key from `INTEGRATION_ENCRYPTION_KEY`
4. Decrypt with IV and verify auth tag
5. Return plaintext token

**Key Requirements**:
- `INTEGRATION_ENCRYPTION_KEY` must be at least 32 characters
- Use a cryptographically secure random string
- Never commit to version control
- Rotate periodically (requires re-encryption)

### CSRF Protection

OAuth state parameter provides CSRF protection:
- Generate random state before redirect
- Store in session or database
- Verify on callback

**Implementation** (optional):
```typescript
// Before redirect
const state = crypto.randomBytes(32).toString('hex')
await db.collection('oauth_states').insertOne({
  state,
  orgId,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
})

// On callback
const { state } = req.query
const storedState = await db.collection('oauth_states').findOne({ state })
if (!storedState || storedState.orgId !== session.user.orgId) {
  throw new Error('Invalid state parameter')
}
```

### Scope Restrictions

The integration requests the following scopes:
- `openid` - OpenID Connect
- `profile` - User profile information
- `email` - User email
- `accounting.settings` - Read organization settings
- `accounting.transactions` - Read/write invoices, quotes, payments
- `accounting.contacts` - Read/write contacts
- `offline_access` - Refresh token

**Minimum Required Scopes**:
- `openid profile email offline_access accounting.transactions accounting.contacts`

### Multi-Tenancy

All operations are scoped to `orgId`:
- Session includes `orgId`
- All database queries filter by `orgId`
- Token storage is per-organization
- Complete data isolation

---

## Error Handling

### Error Types

#### 1. OAuth Errors

**Cause**: Invalid credentials, denied access, expired tokens

**Handling**:
```typescript
try {
  const authUrl = await XeroIntegrationService.getAuthorizationUrl(orgId)
} catch (error) {
  if (error.message.includes('OAuth credentials not configured')) {
    // Missing XERO_CLIENT_ID, XERO_CLIENT_SECRET, or XERO_REDIRECT_URI
    // Action: Check environment variables
  }
}
```

#### 2. Token Refresh Errors

**Cause**: Refresh token expired, revoked, or invalid

**Handling**:
- Status automatically updated to `expired`
- `consecutiveFailures` incremented
- User must reconnect

**Prevention**:
- Refresh tokens last 60 days
- Prompt user to reconnect if approaching expiry
- Monitor `refreshTokenExpiresAt`

#### 3. API Rate Limits

**Xero Rate Limits**:
- **Per-tenant**: 60 requests per minute
- **Per-app**: 5000 requests per day

**Handling**:
```typescript
try {
  await xeroClient.accountingApi.createInvoices(...)
} catch (error) {
  if (error.response?.statusCode === 429) {
    // Rate limit exceeded
    const retryAfter = error.response.headers['retry-after']
    // Wait and retry
  }
}
```

**Best Practices**:
- Batch operations where possible
- Implement exponential backoff
- Queue sync operations
- Cache frequently accessed data

#### 4. Entity Sync Errors

**Common Errors**:

1. **Missing Required Fields**
   ```
   Error: Contact name is required
   ```
   **Solution**: Ensure all required fields are populated in Deskwise

2. **Invalid Data Format**
   ```
   Error: Invalid date format
   ```
   **Solution**: Use ISO 8601 format (`YYYY-MM-DD`)

3. **Duplicate SKU/Code**
   ```
   Error: Item code must be unique
   ```
   **Solution**: Check for existing items with same code

4. **Contact Not Found**
   ```
   Error: Contact not synced to Xero
   ```
   **Solution**: Sync customer first before syncing invoice

**Error Logging**:
All sync errors are logged in `xero_sync_logs` with:
- Entity ID
- Error message
- Error code (if available)
- Timestamp

### Retry Logic

**Automatic Retry** (recommended):
```typescript
async function syncWithRetry(
  syncFn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await syncFn()
    } catch (error) {
      if (attempt === maxRetries) throw error

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Usage
const result = await syncWithRetry(() =>
  XeroIntegrationService.syncInvoice(orgId, invoiceId, userId)
)
```

---

## Testing

### 1. Connection Test

Test OAuth flow and token management:

```bash
# Start dev server
npm run dev

# Navigate to integrations page
http://localhost:9002/dashboard/settings/integrations

# Click "Connect to Xero"
# Authorize on Xero
# Verify redirect back with success message
```

**Expected**:
- Redirect to Xero authorization page
- After authorization, redirect back to Deskwise
- Integration status shows "Connected"
- Organization details displayed

### 2. API Test

Test connection programmatically:

```bash
curl -X POST http://localhost:9002/api/integrations/xero/test \
  -H "Cookie: your-session-cookie"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Successfully connected to Xero",
  "data": {
    "name": "Demo Company (US)",
    "countryCode": "US",
    "baseCurrency": "USD",
    "isDemoCompany": true
  }
}
```

### 3. Invoice Sync Test

Test invoice synchronization:

```bash
curl -X POST http://localhost:9002/api/integrations/xero/sync/invoices \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "507f1f77bcf86cd799439011"}'
```

**Expected Response**:
```json
{
  "success": true,
  "xeroInvoiceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "message": "Invoice synced successfully"
}
```

**Verify in Xero**:
1. Log in to Xero
2. Go to Business > Invoices
3. Find invoice with reference matching `invoiceNumber`
4. Verify line items, amounts, dates

### 4. Token Refresh Test

Test automatic token refresh:

```javascript
// Manually expire token in database
db.xero_integrations.updateOne(
  { orgId: 'org_123' },
  { $set: { accessTokenExpiresAt: new Date() } }
)

// Make API call
fetch('/api/integrations/xero/test', { method: 'POST' })

// Token should be automatically refreshed
// Check database for new accessTokenExpiresAt
```

### 5. Error Handling Test

Test error scenarios:

```bash
# Test with invalid invoice ID
curl -X POST http://localhost:9002/api/integrations/xero/sync/invoices \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "invalid_id"}'

# Expected: Error response with message
```

### 6. Sync Log Test

Verify sync logging:

```bash
curl http://localhost:9002/api/integrations/xero/sync-logs?limit=10 \
  -H "Cookie: your-session-cookie"
```

**Expected**: Array of sync logs with metrics

---

## Troubleshooting

### Issue: "OAuth credentials not configured"

**Cause**: Missing environment variables

**Solution**:
1. Check `.env.local` file exists
2. Verify `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI` are set
3. Restart dev server: `npm run dev`

### Issue: "Invalid redirect URI"

**Cause**: Redirect URI mismatch between Xero app and environment variable

**Solution**:
1. Go to Xero Developer Portal > Your App > OAuth 2.0 Credentials
2. Check "Redirect URI" matches `XERO_REDIRECT_URI` exactly
3. For local development: `http://localhost:9002/api/integrations/xero/callback`
4. For production: `https://yourdomain.com/api/integrations/xero/callback`

### Issue: "Token refresh failed"

**Cause**: Refresh token expired or invalid

**Solution**:
1. Check `refreshTokenExpiresAt` in database
2. If expired (>60 days), user must reconnect
3. Disconnect and reconnect integration

### Issue: "Contact not synced to Xero"

**Cause**: Invoice sync attempted before customer sync

**Solution**:
The service automatically creates contacts, but if it fails:
1. Manually sync customer first: `POST /api/integrations/xero/sync/customers`
2. Then sync invoice

### Issue: "Rate limit exceeded"

**Cause**: Too many API calls in short time

**Solution**:
1. Check `Retry-After` header for wait time
2. Implement request queuing
3. Use bulk sync instead of individual syncs
4. Enable `autoSync` with appropriate `syncFrequency`

### Issue: "Encryption error"

**Cause**: Invalid or missing encryption key

**Solution**:
1. Verify `INTEGRATION_ENCRYPTION_KEY` is at least 32 characters
2. If missing, falls back to `NEXTAUTH_SECRET`
3. Generate new key: `openssl rand -base64 32`

### Issue: "No tenants found"

**Cause**: User doesn't have any Xero organizations

**Solution**:
1. User needs to create a Xero organization first
2. Or connect to an existing organization as a user/advisor

### Issue: TypeScript errors with xero-node

**Cause**: Missing type definitions

**Solution**:
```bash
npm install --save-dev @types/node
```

Or add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "skipLibCheck": true
  }
}
```

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured in production environment
- [ ] Xero app redirect URI updated to production URL
- [ ] Database indexes created
- [ ] Encryption key is 32+ characters and securely stored
- [ ] OAuth flow tested end-to-end
- [ ] Token refresh tested
- [ ] Invoice sync tested with real data
- [ ] Error handling tested
- [ ] Rate limit handling implemented
- [ ] Monitoring/logging configured
- [ ] Backup strategy for integration data
- [ ] User documentation created
- [ ] Support team trained on common issues

---

## Additional Resources

- **Xero API Documentation**: https://developer.xero.com/documentation/api/accounting/overview
- **xero-node GitHub**: https://github.com/XeroAPI/xero-node
- **OAuth 2.0 Guide**: https://developer.xero.com/documentation/guides/oauth2/overview/
- **Xero Developer Portal**: https://developer.xero.com/app/manage
- **Xero API Explorer**: https://developer.xero.com/documentation/tools/api-explorer

---

## Support

For issues or questions:
1. Check this documentation
2. Review Xero API documentation
3. Check xero-node GitHub issues
4. Contact development team

---

**Document Version**: 1.0
**Last Updated**: October 19, 2025
**Author**: Claude Code Assistant
