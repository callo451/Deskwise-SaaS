# MYOB AccountRight Integration - Implementation Guide

## Overview

This document provides complete documentation for the MYOB AccountRight integration implemented in Deskwise ITSM.

## Features

- **OAuth 2.0 Authentication**: Secure authentication flow with MYOB
- **Company File Management**: Select and manage multiple MYOB company files
- **Bi-directional Sync**: Sync data between Deskwise and MYOB
- **Entity Mapping**: Track relationships between Deskwise and MYOB entities
- **Comprehensive Error Handling**: Detailed error logging and recovery
- **Token Management**: Automatic token refresh (20-minute access token, 1-week refresh token)
- **Audit Trail**: Complete sync history and audit logs

## Supported Entities

1. **Customers** - Sync Deskwise clients to MYOB customers
2. **Invoices** - Create MYOB invoices from Deskwise invoices
3. **Quotes** - Create MYOB quotes from Deskwise quotes
4. **Items/Products** - Sync product catalog (planned)
5. **Payments** - Record payments in MYOB (planned)
6. **Tax Codes** - Retrieve MYOB tax codes for invoicing

## Environment Variables

Add the following to your `.env.local` file:

```env
# MYOB AccountRight API
MYOB_CLIENT_ID=your_myob_api_key
MYOB_CLIENT_SECRET=your_myob_api_secret
MYOB_REDIRECT_URI=http://localhost:9002/api/integrations/myob/callback

# Integration Encryption (32-character secret for encrypting tokens)
INTEGRATION_ENCRYPTION_KEY=your-32-character-encryption-secret

# NextAuth URL (if not already set)
NEXTAUTH_URL=http://localhost:9002
```

### Getting MYOB API Credentials

1. Go to [MYOB Developer Portal](https://my.myob.com.au/Pages/Default.aspx)
2. Sign in with your MYOB account
3. Navigate to "Developer" or "API Keys"
4. Create a new App/API Key
5. Set the redirect URI to match your `MYOB_REDIRECT_URI`
6. Copy the Client ID (API Key) and Client Secret

**Important**: For API keys created after March 12, 2025, use the new scopes. For keys created before, use `CompanyFile` scope.

## Architecture

### Database Collections

```javascript
// MYOB Integrations
db.myob_integrations {
  _id: ObjectId,
  orgId: string,
  status: 'connected' | 'disconnected' | 'expired' | 'error',
  companyFileId: string,
  companyFileName: string,
  companyFileUri: string,
  accessToken: string, // Encrypted
  refreshToken: string, // Encrypted
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,
  syncSettings: { ... },
  lastSyncAt: Date,
  createdAt: Date,
  updatedAt: Date
}

// Entity Mappings
db.myob_mappings {
  _id: ObjectId,
  orgId: string,
  integrationId: string,
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product',
  deskwiseEntityId: string,
  myobEntityType: 'Invoice' | 'Quote' | 'Customer' | 'Item',
  myobEntityId: string,
  myobUid: string,
  myobRowVersion: string,
  lastSyncedAt: Date,
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error',
  createdAt: Date,
  updatedAt: Date
}

// Sync Logs
db.myob_sync_logs {
  _id: ObjectId,
  orgId: string,
  integrationId: string,
  entityType: 'Invoice' | 'Quote' | 'Customer' | 'Item',
  direction: 'deskwise_to_myob' | 'myob_to_deskwise',
  status: 'pending' | 'syncing' | 'completed' | 'failed',
  totalRecords: number,
  successCount: number,
  failureCount: number,
  syncedRecords: [...],
  errors: [...],
  startedAt: Date,
  completedAt: Date,
  createdAt: Date
}
```

### TypeScript Interfaces

All types are defined in `src/lib/types.ts`:

- `MYOBIntegration` - Integration configuration
- `MYOBCompanyFile` - Company file metadata
- `MYOBSyncLog` - Sync audit log
- `MYOBMapping` - Entity mapping
- `MYOBCustomer` - Customer sync structure
- `MYOBInvoice` - Invoice sync structure
- `MYOBQuote` - Quote sync structure
- `MYOBTaxCode` - Tax code structure

### Service Layer

**Location**: `src/lib/services/myob-integration.ts`

Key methods:

```typescript
// Authentication
MYOBIntegrationService.getAuthorizationUrl(orgId)
MYOBIntegrationService.exchangeCodeForTokens(code)
MYOBIntegrationService.refreshAccessToken(refreshToken)
MYOBIntegrationService.ensureValidToken(integration)

// Connection Management
MYOBIntegrationService.getCompanyFiles(accessToken)
MYOBIntegrationService.saveIntegration(orgId, data, userId)
MYOBIntegrationService.getIntegration(orgId)
MYOBIntegrationService.testConnection(orgId)
MYOBIntegrationService.disconnect(orgId)
MYOBIntegrationService.deleteIntegration(orgId)

// Data Sync
MYOBIntegrationService.syncCustomer(orgId, client, action)
MYOBIntegrationService.syncInvoice(orgId, invoice, action)
MYOBIntegrationService.syncQuote(orgId, quote, action)
MYOBIntegrationService.getTaxCodes(orgId)

// Audit
MYOBIntegrationService.createSyncLog(...)
MYOBIntegrationService.updateSyncLog(logId, update)
MYOBIntegrationService.getSyncLogs(orgId, filters)
```

### API Endpoints

#### Connection Management

```http
GET /api/integrations/myob/connect
# Returns OAuth authorization URL

GET /api/integrations/myob/callback?code=XXX&state=YYY
# OAuth callback - exchanges code for tokens

GET /api/integrations/myob/status
# Get integration status

POST /api/integrations/myob/test
# Test connection and retrieve company files

POST /api/integrations/myob/disconnect
# Disconnect integration (soft delete)

DELETE /api/integrations/myob/disconnect
# Permanently delete integration
```

#### Company File Management

```http
GET /api/integrations/myob/company-files
# List available company files

POST /api/integrations/myob/company-files
Body: { companyFileId, companyFileName, companyFileUri }
# Select a company file
```

#### Data Synchronization

```http
POST /api/integrations/myob/sync/customers
Body: { clientIds: [...], syncAll: boolean }
# Sync customers to MYOB

POST /api/integrations/myob/sync/invoices
Body: { invoiceIds: [...], syncAll: boolean }
# Sync invoices to MYOB

POST /api/integrations/myob/sync/quotes
Body: { quoteIds: [...], syncAll: boolean }
# Sync quotes to MYOB
```

## OAuth Flow

### Step-by-Step Flow

1. **Initiate Connection**
   ```javascript
   const response = await fetch('/api/integrations/myob/connect')
   const { authUrl } = await response.json()
   window.location.href = authUrl
   ```

2. **User Authorization**
   - User is redirected to MYOB login
   - User selects company file
   - User grants permissions

3. **Callback Handling**
   - MYOB redirects to `/api/integrations/myob/callback?code=XXX&state=orgId`
   - API exchanges code for tokens
   - Tokens are encrypted and stored
   - User redirected to success page

4. **Select Company File**
   ```javascript
   const response = await fetch('/api/integrations/myob/company-files')
   const { companyFiles } = await response.json()

   await fetch('/api/integrations/myob/company-files', {
     method: 'POST',
     body: JSON.stringify({
       companyFileId: selectedFile.id,
       companyFileName: selectedFile.name,
       companyFileUri: selectedFile.uri
     })
   })
   ```

5. **Ready to Sync**
   - Integration is now active
   - Can sync customers, invoices, quotes

## Token Management

### Access Token (20 minutes)

- Automatically refreshed before expiry
- `ensureValidToken()` checks expiry and refreshes if needed
- All API calls use this method to ensure valid token

### Refresh Token (1 week)

- Used to get new access token
- Stored encrypted in database
- If expired, user must re-authenticate

### Security

- All tokens encrypted using AES-256-GCM
- Encryption key from `INTEGRATION_ENCRYPTION_KEY` environment variable
- Tokens never sent to client
- CSRF protection via state parameter

## Sync Workflows

### Customer Sync

```typescript
// 1. Map Deskwise client to MYOB customer
const myobCustomer = {
  companyName: client.name,
  isIndividual: false,
  isActive: client.status === 'active',
  addresses: [{
    street: client.address.street,
    city: client.address.city,
    state: client.address.state,
    postcode: client.address.postalCode,
    country: client.address.country
  }]
}

// 2. POST to MYOB API
POST /{companyFileId}/Contact/Customer

// 3. Save mapping
db.myob_mappings.insert({
  deskwiseEntityId: client._id,
  myobEntityId: response.uid,
  myobUid: response.uid,
  myobRowVersion: response.headers['x-myobapi-version']
})
```

### Invoice Sync

```typescript
// 1. Check customer is synced
const customerMapping = await db.myob_mappings.findOne({
  deskwiseEntityType: 'client',
  deskwiseEntityId: invoice.clientId
})

if (!customerMapping) {
  throw new Error('Customer not synced')
}

// 2. Get tax codes
const taxCodes = await getTaxCodes(orgId)
const defaultTaxCode = taxCodes.find(tc => tc.isActive)

// 3. Map invoice to MYOB format
const myobInvoice = {
  date: invoice.invoiceDate.toISOString().split('T')[0],
  customer: {
    uid: customerMapping.myobUid
  },
  lines: invoice.lineItems.map(item => ({
    type: 'Transaction',
    description: item.description,
    total: item.total,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    taxCode: { uid: defaultTaxCode.uid }
  })),
  subtotal: invoice.subtotal,
  totalTax: invoice.taxAmount,
  totalAmount: invoice.total
}

// 4. POST to MYOB API
POST /{companyFileId}/Sale/Invoice/Item

// 5. Save mapping
db.myob_mappings.insert({
  deskwiseEntityId: invoice._id,
  myobEntityId: response.uid,
  myobUid: response.uid,
  myobRowVersion: response.headers['x-myobapi-version']
})
```

### Quote Sync

Similar to invoice sync, but uses:
- Endpoint: `/{companyFileId}/Sale/Quote/Item`
- Entity type: `Quote`

## Error Handling

### Common Errors

1. **401 Unauthorized** - Token expired or invalid
   - Solution: Automatic token refresh via `ensureValidToken()`

2. **400 Bad Request** - Invalid data format
   - Check MYOB API documentation for required fields
   - Validate data before sending

3. **404 Not Found** - Company file not found
   - User may need to re-select company file

4. **429 Rate Limit** - Too many requests
   - Implement exponential backoff
   - Current implementation: 30-second timeout per request

5. **500 Server Error** - MYOB API issue
   - Log error details
   - Retry with exponential backoff

### Error Logging

All errors are logged to:
1. Console with detailed stack trace
2. Sync logs in database
3. Integration status field

```typescript
// Example error logging
try {
  await syncInvoice(...)
} catch (error) {
  console.error('MYOB sync error:', error.response?.data || error.message)

  await db.myob_sync_logs.updateOne({ _id: logId }, {
    $set: {
      status: 'failed',
      errors: [{
        recordId: invoice._id,
        error: error.message,
        details: error.response?.data
      }]
    }
  })
}
```

## Testing

### Connection Test

```http
POST /api/integrations/myob/test

Response:
{
  "success": true,
  "message": "Successfully connected. Found 2 company file(s)",
  "companyFiles": [...]
}
```

### Sync Test (Single Invoice)

```http
POST /api/integrations/myob/sync/invoices
Content-Type: application/json

{
  "invoiceIds": ["invoice_id_here"],
  "syncAll": false
}

Response:
{
  "success": true,
  "message": "Synced 1 of 1 invoices",
  "results": {
    "total": 1,
    "success": 1,
    "failed": 0,
    "skipped": 0,
    "syncedRecords": [...]
  }
}
```

## MYOB API Specifics

### UID vs GUID

- **UID**: MYOB's unique identifier format (e.g., "1234-5678-90ab-cdef")
- **GUID**: Global unique identifier
- Both are interchangeable in most contexts

### RowVersion

- MYOB uses RowVersion for optimistic concurrency
- Must include RowVersion when updating records
- Updated on every modification
- Store in mapping table for updates

### Invoice Types

MYOB supports 5 invoice types:
1. **Item** - Product-based invoices (most common)
2. **Service** - Service-based invoices
3. **Professional** - Professional services
4. **Time Billing** - Time-based billing
5. **Miscellaneous** - Other types

Current implementation uses **Item** type.

### Tax Codes

- Required for all line items
- Retrieved from MYOB company file
- Different for each country (GST, VAT, Sales Tax)
- Must be active to use

### Company File URI

Format: `https://api.myob.com/accountright/{companyFileId}`

All API calls are made to this URI + endpoint path.

## Troubleshooting

### "No active tax code found"

**Problem**: Cannot create invoice without tax code

**Solution**:
1. Log into MYOB AccountRight
2. Go to Lists → Tax Codes
3. Ensure at least one tax code is active
4. If none exist, create one (e.g., "GST 10%")

### "Customer not synced"

**Problem**: Invoice references customer that doesn't exist in MYOB

**Solution**:
1. Sync customer first using `/api/integrations/myob/sync/customers`
2. Then sync invoice

### "Token expired" after 1 week

**Problem**: Refresh token has expired

**Solution**:
1. User must re-authenticate
2. Click "Connect to MYOB" again
3. Go through OAuth flow

### "Integration not configured"

**Problem**: Missing environment variables

**Solution**:
1. Check `.env.local` has all required variables
2. Restart Next.js server
3. Verify MYOB_CLIENT_ID and MYOB_CLIENT_SECRET

## Best Practices

1. **Always sync customers before invoices**
   - Invoices require customer UID from MYOB

2. **Test in sandbox first**
   - Use MYOB sandbox environment for development
   - Switch to production when ready

3. **Handle rate limits**
   - MYOB API has rate limits
   - Implement batch processing with delays

4. **Monitor sync logs**
   - Check sync_logs collection regularly
   - Set up alerts for failed syncs

5. **Keep tokens secure**
   - Never log unencrypted tokens
   - Rotate encryption key periodically
   - Use HTTPS in production

6. **Validate data before sync**
   - Check required fields
   - Ensure valid formats
   - Prevent duplicate syncs

## Future Enhancements

1. **Bi-directional Sync**
   - Pull data from MYOB to Deskwise
   - Detect changes in MYOB

2. **Product/Item Sync**
   - Sync Deskwise products to MYOB items
   - Map item UIDs for invoicing

3. **Payment Recording**
   - Record payments in MYOB
   - Update invoice balances

4. **Webhook Support**
   - Real-time sync on entity changes
   - Reduce polling requirements

5. **Conflict Resolution**
   - Handle concurrent updates
   - UI for resolving conflicts

6. **Scheduled Sync**
   - Auto-sync at intervals
   - Background job processing

## Support Resources

- **MYOB Developer Centre**: https://developer.myob.com
- **API Documentation**: https://developer.myob.com/api/accountright/v2/
- **Support Portal**: https://apisupport.myob.com
- **Community Forums**: https://community.myob.com

## License

This integration is part of Deskwise ITSM and follows the same license terms.
