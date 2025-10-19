# QuickBooks Integration - API Examples

Complete API reference with cURL and JavaScript examples for all QuickBooks integration endpoints.

## Authentication

All API endpoints require authentication via NextAuth session cookie.

**Get Session Cookie** (login first):
```bash
# Login to get session
curl -X POST http://localhost:9002/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }' \
  -c cookies.txt

# Use cookies.txt for subsequent requests
curl http://localhost:9002/api/... -b cookies.txt
```

---

## Connection Management

### 1. Initiate OAuth Connection

**Endpoint**: `POST /api/integrations/quickbooks/connect`

**Description**: Generates QuickBooks authorization URL to begin OAuth flow.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/connect \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/connect', {
  method: 'POST',
  credentials: 'include',
})

const data = await response.json()
console.log(data.authorizationUrl)

// Redirect user to authorization URL
window.location.href = data.authorizationUrl
```

**Response**:
```json
{
  "success": true,
  "authorizationUrl": "https://appcenter.intuit.com/connect/oauth2?client_id=...&scope=...&redirect_uri=...&state=..."
}
```

**Flow**:
1. Call this endpoint
2. Redirect user to `authorizationUrl`
3. User authorizes in QuickBooks
4. QuickBooks redirects to callback URL
5. Backend completes OAuth flow automatically

---

### 2. Get Integration Status

**Endpoint**: `GET /api/integrations/quickbooks/status`

**Description**: Retrieve current QuickBooks integration status and statistics.

**cURL**:
```bash
curl http://localhost:9002/api/integrations/quickbooks/status \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/status', {
  credentials: 'include',
})

const data = await response.json()
console.log('Connected:', data.connected)
console.log('Company:', data.integration?.companyName)
```

**Response (Connected)**:
```json
{
  "connected": true,
  "integration": {
    "_id": "507f1f77bcf86cd799439011",
    "orgId": "org_abc123",
    "status": "connected",
    "realmId": "123456789",
    "companyName": "Acme Corp",
    "country": "US",
    "environment": "production",
    "autoSync": false,
    "syncDirection": "deskwise_to_qbo",
    "syncFrequency": "manual",
    "lastSyncAt": "2024-10-19T10:30:00.000Z",
    "lastSyncStatus": "success",
    "lastSyncError": null,
    "totalInvoicesSynced": 45,
    "totalCustomersSynced": 12,
    "totalProductsSynced": 8,
    "totalPaymentsSynced": 15,
    "lastHealthCheckAt": "2024-10-19T11:00:00.000Z",
    "lastHealthCheckStatus": "healthy",
    "createdAt": "2024-10-01T09:00:00.000Z",
    "updatedAt": "2024-10-19T10:30:00.000Z"
  }
}
```

**Response (Not Connected)**:
```json
{
  "connected": false,
  "integration": null
}
```

---

### 3. Test Connection

**Endpoint**: `POST /api/integrations/quickbooks/test`

**Description**: Test QuickBooks connection health and fetch company info.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/test \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/test', {
  method: 'POST',
  credentials: 'include',
})

const data = await response.json()

if (data.connected) {
  console.log('✅ Connected to:', data.companyName)
} else {
  console.error('❌ Connection failed:', data.error)
}
```

**Response (Success)**:
```json
{
  "connected": true,
  "companyName": "Sandbox Company_US_1"
}
```

**Response (Failure)**:
```json
{
  "connected": false,
  "error": "Token expired"
}
```

---

### 4. Disconnect Integration

**Endpoint**: `POST /api/integrations/quickbooks/disconnect`

**Description**: Disconnect QuickBooks integration and revoke tokens.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/disconnect \
  -H "Content-Type: application/json" \
  -d '{"reason": "Switching to different QuickBooks company"}' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/disconnect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    reason: 'No longer needed',
  }),
})

const data = await response.json()
console.log(data.message)
```

**Request Body**:
```json
{
  "reason": "Optional disconnect reason"
}
```

**Response**:
```json
{
  "success": true,
  "message": "QuickBooks integration disconnected successfully"
}
```

---

## Sync Operations

### 5. Sync Invoice(s)

**Endpoint**: `POST /api/integrations/quickbooks/sync/invoices`

**Description**: Sync one or more invoices to QuickBooks.

#### Single Invoice

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/invoices \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "507f1f77bcf86cd799439011"}' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/sync/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    invoiceId: '507f1f77bcf86cd799439011',
  }),
})

const data = await response.json()
console.log('Invoice synced:', data.results[0].qboInvoiceId)
```

#### Multiple Invoices (Bulk)

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "invoiceIds": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ]
  }' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const invoiceIds = [
  '507f1f77bcf86cd799439011',
  '507f1f77bcf86cd799439012',
  '507f1f77bcf86cd799439013',
]

const response = await fetch('/api/integrations/quickbooks/sync/invoices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({ invoiceIds }),
})

const data = await response.json()
console.log(`Synced: ${data.summary.succeeded}/${data.summary.total}`)
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "invoiceId": "507f1f77bcf86cd799439011",
      "success": true,
      "qboInvoiceId": "456"
    },
    {
      "invoiceId": "507f1f77bcf86cd799439012",
      "success": true,
      "qboInvoiceId": "457"
    },
    {
      "invoiceId": "507f1f77bcf86cd799439013",
      "success": false,
      "error": "Customer not found"
    }
  ],
  "summary": {
    "total": 3,
    "succeeded": 2,
    "failed": 1
  }
}
```

---

### 6. Sync Quote(s) as Estimates

**Endpoint**: `POST /api/integrations/quickbooks/sync/estimates`

**Description**: Sync Deskwise quotes to QuickBooks as estimates.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/estimates \
  -H "Content-Type: application/json" \
  -d '{"quoteId": "507f1f77bcf86cd799439014"}' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/sync/estimates', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    quoteId: '507f1f77bcf86cd799439014',
  }),
})

const data = await response.json()
```

**Request Body** (Bulk):
```json
{
  "quoteIds": [
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "quoteId": "507f1f77bcf86cd799439014",
      "success": true,
      "qboEstimateId": "789"
    }
  ],
  "summary": {
    "total": 1,
    "succeeded": 1,
    "failed": 0
  }
}
```

---

### 7. Sync Client(s) as Customers

**Endpoint**: `POST /api/integrations/quickbooks/sync/customers`

**Description**: Sync Deskwise clients to QuickBooks as customers.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/customers \
  -H "Content-Type: application/json" \
  -d '{"clientId": "507f1f77bcf86cd799439020"}' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/sync/customers', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    clientId: '507f1f77bcf86cd799439020',
  }),
})

const data = await response.json()
```

**Request Body** (Bulk):
```json
{
  "clientIds": [
    "507f1f77bcf86cd799439020",
    "507f1f77bcf86cd799439021"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "clientId": "507f1f77bcf86cd799439020",
      "success": true,
      "qboCustomerId": "123"
    }
  ],
  "summary": {
    "total": 1,
    "succeeded": 1,
    "failed": 0
  }
}
```

---

### 8. Sync Product(s) as Items

**Endpoint**: `POST /api/integrations/quickbooks/sync/items`

**Description**: Sync Deskwise products to QuickBooks as items/services.

**cURL**:
```bash
curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/items \
  -H "Content-Type: application/json" \
  -d '{"productId": "507f1f77bcf86cd799439030"}' \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/sync/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    productId: '507f1f77bcf86cd799439030',
  }),
})

const data = await response.json()
```

**Request Body** (Bulk):
```json
{
  "productIds": [
    "507f1f77bcf86cd799439030",
    "507f1f77bcf86cd799439031"
  ]
}
```

**Response**:
```json
{
  "success": true,
  "results": [
    {
      "productId": "507f1f77bcf86cd799439030",
      "success": true,
      "qboItemId": "999"
    }
  ],
  "summary": {
    "total": 1,
    "succeeded": 1,
    "failed": 0
  }
}
```

---

## Utilities

### 9. Get Sync Logs

**Endpoint**: `GET /api/integrations/quickbooks/sync-logs`

**Description**: Retrieve sync operation history with optional filters.

**Query Parameters**:
- `entityType` - Filter by entity type (Invoice, Estimate, Customer, Item, Payment)
- `status` - Filter by status (pending, syncing, completed, failed)
- `limit` - Max results (default: 100)

**cURL**:
```bash
# Get all logs
curl "http://localhost:9002/api/integrations/quickbooks/sync-logs" \
  -b cookies.txt

# Get failed invoice syncs
curl "http://localhost:9002/api/integrations/quickbooks/sync-logs?entityType=Invoice&status=failed&limit=50" \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
// Get all logs
const response = await fetch('/api/integrations/quickbooks/sync-logs', {
  credentials: 'include',
})

// Get failed syncs
const response = await fetch(
  '/api/integrations/quickbooks/sync-logs?entityType=Invoice&status=failed&limit=20',
  { credentials: 'include' }
)

const data = await response.json()
console.log(`Found ${data.total} logs`)
```

**Response**:
```json
{
  "success": true,
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "orgId": "org_abc123",
      "integrationId": "507f1f77bcf86cd799439011",
      "syncType": "manual",
      "entityType": "Invoice",
      "direction": "deskwise_to_qbo",
      "status": "completed",
      "deskwiseEntityId": "507f1f77bcf86cd799439011",
      "deskwiseEntityType": "invoice",
      "quickbooksEntityId": "456",
      "quickbooksEntityType": "Invoice",
      "startedAt": "2024-10-19T10:00:00.000Z",
      "completedAt": "2024-10-19T10:00:02.000Z",
      "duration": 2000,
      "retryCount": 0,
      "maxRetries": 3,
      "errorMessage": null,
      "conflictDetected": false,
      "triggeredBy": "user_xyz",
      "triggeredByName": "John Doe",
      "createdAt": "2024-10-19T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 10. Fetch Tax Rates

**Endpoint**: `GET /api/integrations/quickbooks/tax-rates`

**Description**: Fetch available tax rates from QuickBooks for your company.

**cURL**:
```bash
curl "http://localhost:9002/api/integrations/quickbooks/tax-rates" \
  -b cookies.txt
```

**JavaScript (fetch)**:
```javascript
const response = await fetch('/api/integrations/quickbooks/tax-rates', {
  credentials: 'include',
})

const data = await response.json()
console.log('Available tax rates:', data.taxRates)
```

**Response**:
```json
{
  "success": true,
  "taxRates": [
    {
      "Id": "1",
      "Name": "Sales Tax",
      "RateValue": 8.5,
      "Active": true,
      "Description": "California Sales Tax"
    },
    {
      "Id": "2",
      "Name": "Exempt",
      "RateValue": 0,
      "Active": true,
      "Description": "Tax Exempt"
    }
  ],
  "total": 2
}
```

---

## Error Responses

All endpoints return standardized error responses:

**400 Bad Request**:
```json
{
  "error": "No invoice IDs provided"
}
```

**401 Unauthorized**:
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to sync invoice: Customer not found"
}
```

---

## Complete Workflow Example

### JavaScript (Frontend Integration)

```javascript
// 1. Check if already connected
async function checkConnection() {
  const res = await fetch('/api/integrations/quickbooks/status', {
    credentials: 'include',
  })
  const data = await res.json()
  return data.connected
}

// 2. Connect to QuickBooks
async function connectQuickBooks() {
  const res = await fetch('/api/integrations/quickbooks/connect', {
    method: 'POST',
    credentials: 'include',
  })
  const data = await res.json()

  // Redirect user to QuickBooks authorization
  window.location.href = data.authorizationUrl
}

// 3. Test connection (after OAuth callback)
async function testConnection() {
  const res = await fetch('/api/integrations/quickbooks/test', {
    method: 'POST',
    credentials: 'include',
  })
  const data = await res.json()

  if (data.connected) {
    alert(`Connected to ${data.companyName}`)
  } else {
    alert(`Connection failed: ${data.error}`)
  }
}

// 4. Sync invoice
async function syncInvoice(invoiceId) {
  const res = await fetch('/api/integrations/quickbooks/sync/invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ invoiceId }),
  })
  const data = await res.json()

  if (data.success) {
    console.log('Synced to QuickBooks:', data.results[0].qboInvoiceId)
  } else {
    console.error('Sync failed:', data.results[0].error)
  }
}

// 5. View sync history
async function viewSyncHistory() {
  const res = await fetch('/api/integrations/quickbooks/sync-logs?limit=50', {
    credentials: 'include',
  })
  const data = await res.json()

  console.log(`Total syncs: ${data.total}`)
  data.logs.forEach((log) => {
    console.log(`${log.entityType} - ${log.status} - ${log.errorMessage || 'Success'}`)
  })
}

// 6. Disconnect
async function disconnectQuickBooks() {
  const res = await fetch('/api/integrations/quickbooks/disconnect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason: 'User requested' }),
  })
  const data = await res.json()

  alert(data.message)
}
```

---

## Testing Checklist

Use these examples to test your integration:

- [ ] Connect to QuickBooks (OAuth flow)
- [ ] Check connection status
- [ ] Test connection health
- [ ] Sync a single invoice
- [ ] Sync multiple invoices (bulk)
- [ ] Sync a quote as estimate
- [ ] Sync a client as customer
- [ ] Sync a product as item
- [ ] View sync logs
- [ ] Filter sync logs by status
- [ ] Fetch tax rates
- [ ] Disconnect integration

---

## Rate Limits

QuickBooks API has rate limits:
- **Per-app**: 500 requests per minute
- **Per-company**: 100 requests per minute

The integration handles rate limits automatically with:
- Exponential backoff
- Retry logic (max 3 attempts)
- Error logging

---

## Support

For issues or questions:
1. Check sync logs for detailed error information
2. Test connection to verify QuickBooks is accessible
3. Review MongoDB collections for debugging
4. Check console logs for detailed output

**Documentation**:
- `QUICKBOOKS_INTEGRATION.md` - Complete guide
- `QUICKBOOKS_OAUTH_FLOW.md` - OAuth details
- `QUICKBOOKS_SETUP.md` - Setup instructions
