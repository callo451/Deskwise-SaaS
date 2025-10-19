# Accounting Integrations - Quick Start Guide

## 🚀 Getting Started (5 Minutes)

### Step 1: Navigate to Integrations Page

As an admin user, go to:
```
http://localhost:9002/settings/integrations
```

Or navigate through:
1. Settings (gear icon in sidebar)
2. Scroll to "Integrations" section
3. Click "Accounting Integrations"

### Step 2: View the Three Tabs

You'll see three tabs:
1. **Platforms** - Connect to Xero, QuickBooks, or MYOB
2. **Sync Status** - Monitor sync activity (shows after connecting)
3. **Logs** - View detailed sync history (shows after first sync)

### Step 3: Try Connecting a Platform (Demo Mode)

Since the backend isn't implemented yet, you can test the UI with demo data:

**Option A: Use Demo Data (Recommended for Testing)**

Modify the main integrations page to use demo data:

```tsx
// src/app/(app)/settings/integrations/page.tsx
import { demoConnections, demoConfigs } from '@/components/integrations/demo-data'

// Replace API calls with demo data:
useEffect(() => {
  // Comment out the real API calls
  // loadIntegrations()

  // Use demo data instead
  setIntegrations(demoConnections)
  setConfigs(demoConfigs)
  setLoading(false)
}, [])
```

**Option B: Implement Backend APIs**

See [Backend Implementation Guide](#backend-implementation-guide) below.

---

## 📦 What's Included

### Components (9 Total)
- ✅ `IntegrationCard` - Platform connection cards
- ✅ `ConnectDialog` - OAuth connection flow
- ✅ `XeroConfigDialog` - Xero configuration
- ✅ `QuickBooksConfigDialog` - QuickBooks configuration
- ✅ `MyobConfigDialog` - MYOB configuration
- ✅ `SyncStatusDashboard` - Real-time sync monitoring
- ✅ `SyncLogsViewer` - Sync history and logs
- ✅ `SyncBadge` - Invoice/quote sync indicator
- ✅ Main integrations page with 3 tabs

### Documentation (4 Files)
- ✅ `INTEGRATIONS_README.md` - Full documentation
- ✅ `INTEGRATION_USAGE_EXAMPLES.md` - Code examples
- ✅ `INTEGRATIONS_IMPLEMENTATION_SUMMARY.md` - Technical overview
- ✅ `INTEGRATIONS_QUICK_START.md` - This guide

### Type Definitions
- ✅ Complete TypeScript interfaces in `src/lib/types/integrations.ts`

---

## 🎨 UI Features at a Glance

### Platform Cards
Each platform (Xero, QuickBooks, MYOB) shows:
- ✅ Connection status (Connected, Not Connected, Error, Pending)
- ✅ Company name (when connected)
- ✅ Last sync time (relative, e.g., "2 hours ago")
- ✅ Connect/Disconnect buttons
- ✅ Configure button (opens platform-specific dialog)
- ✅ Test connection button

### Configuration Dialogs
Three tabs per platform:
- **Tab 1 - Sync Settings**: Choose what to sync (invoices, quotes, etc.) and when
- **Tab 2 - Account Mappings**: Map to platform's chart of accounts and tax rates
- **Tab 3 - Advanced**: Data handling and notification preferences

### Sync Status Dashboard
- ✅ Overall statistics per platform (success rate, total syncs, etc.)
- ✅ Entity breakdown (invoices, quotes, customers, products, payments)
- ✅ Manual sync buttons for each entity type
- ✅ Color-coded success indicators (green ≥90%, yellow 70-89%, red <70%)

### Sync Logs Viewer
- ✅ Filterable table (platform, entity type, status, search)
- ✅ Pagination (20 logs per page)
- ✅ Detailed log viewer with error messages and stack traces
- ✅ Export to CSV functionality

---

## 🛠️ Backend Implementation Guide

### Required API Endpoints

Create these endpoints in your backend:

#### 1. Connection Management

```typescript
// GET /api/integrations/connections
// Response: { connections: IntegrationConnection[] }

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const orgId = session.user.orgId

  const connections = await db.collection('integration_connections')
    .find({ orgId })
    .toArray()

  return NextResponse.json({ connections })
}

// DELETE /api/integrations/connections/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  await db.collection('integration_connections')
    .updateOne(
      { _id: new ObjectId(params.id), orgId: session.user.orgId },
      { $set: { status: 'disconnected', updatedAt: new Date() } }
    )

  return NextResponse.json({ success: true })
}

// POST /api/integrations/connections/:id/test
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  // Test the connection by making a simple API call to the platform
  // Return success/failure
  return NextResponse.json({ success: true, message: 'Connection is working' })
}
```

#### 2. OAuth Flow

```typescript
// POST /api/integrations/xero/auth
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const state = crypto.randomUUID()

  // Store state in session or database for verification
  await db.collection('oauth_states').insertOne({
    state,
    orgId: session.user.orgId,
    platform: 'xero',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  })

  const authUrl = `https://login.xero.com/identity/connect/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.XERO_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.XERO_REDIRECT_URI)}&` +
    `scope=accounting.transactions accounting.contacts accounting.settings&` +
    `state=${state}`

  return NextResponse.json({ authUrl })
}

// GET /api/integrations/xero/callback (OAuth redirect handler)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  // Verify state
  const oauthState = await db.collection('oauth_states').findOne({ state })
  if (!oauthState) {
    return NextResponse.redirect('/settings/integrations?error=invalid_state')
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.XERO_REDIRECT_URI!,
      client_id: process.env.XERO_CLIENT_ID!,
      client_secret: process.env.XERO_CLIENT_SECRET!,
    }),
  })

  const tokens = await tokenResponse.json()

  // Get tenant information
  const tenantsResponse = await fetch('https://api.xero.com/connections', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const tenants = await tenantsResponse.json()

  // Save connection
  await db.collection('integration_connections').insertOne({
    orgId: oauthState.orgId,
    platform: 'xero',
    status: 'connected',
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    tenantId: tenants[0].tenantId,
    tenantName: tenants[0].tenantName,
    companyName: tenants[0].tenantName,
    connectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: oauthState.userId,
    updatedBy: oauthState.userId,
    errorCount: 0,
  })

  return NextResponse.redirect('/settings/integrations?success=connected')
}
```

#### 3. Configuration Management

```typescript
// GET /api/integrations/configs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  const configs = await db.collection('integration_configs')
    .find({ orgId: session.user.orgId })
    .toArray()

  return NextResponse.json({ configs })
}

// POST /api/integrations/configs
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = await req.json()

  const config = {
    ...body,
    orgId: session.user.orgId,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: session.user.id,
    updatedBy: session.user.id,
  }

  const result = await db.collection('integration_configs').insertOne(config)

  return NextResponse.json({ ...config, _id: result.insertedId })
}

// PUT /api/integrations/configs
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const body = await req.json()

  await db.collection('integration_configs').updateOne(
    { _id: new ObjectId(body._id), orgId: session.user.orgId },
    {
      $set: {
        ...body,
        updatedAt: new Date(),
        updatedBy: session.user.id,
      }
    }
  )

  return NextResponse.json({ success: true })
}
```

#### 4. Platform Data (Accounts/Tax Rates)

```typescript
// GET /api/integrations/xero/:connectionId/accounts
export async function GET(req: NextRequest, { params }: { params: { connectionId: string } }) {
  const session = await getServerSession(authOptions)

  // Get connection
  const connection = await db.collection('integration_connections').findOne({
    _id: new ObjectId(params.connectionId),
    orgId: session.user.orgId,
  })

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  // Fetch accounts from Xero
  const response = await fetch('https://api.xero.com/api.xro/2.0/Accounts', {
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      'Xero-tenant-id': connection.tenantId,
    },
  })

  const data = await response.json()

  // Transform to our format
  const accounts = data.Accounts.map((acc: any) => ({
    id: acc.AccountID,
    code: acc.Code,
    name: acc.Name,
    type: acc.Type,
    taxType: acc.TaxType,
  }))

  return NextResponse.json({ accounts })
}

// GET /api/integrations/xero/:connectionId/tax-rates
export async function GET(req: NextRequest, { params }: { params: { connectionId: string } }) {
  // Similar to accounts, but fetch tax rates
  // https://api.xero.com/api.xro/2.0/TaxRates
}
```

#### 5. Sync Operations

```typescript
// POST /api/integrations/sync/manual
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { platform, entityType } = await req.json()

  // Queue sync job (use queue system like Bull, BullMQ, or simple database flag)
  await db.collection('sync_queue').insertOne({
    orgId: session.user.orgId,
    platform,
    entityType,
    status: 'pending',
    createdAt: new Date(),
    initiatedBy: 'user',
    userId: session.user.id,
  })

  // Trigger background worker to process
  // await syncWorker.process()

  return NextResponse.json({ success: true, message: 'Sync initiated' })
}

// POST /api/integrations/sync/invoice/:id
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  // Get invoice
  const invoice = await db.collection('invoices').findOne({
    _id: new ObjectId(params.id),
    orgId: session.user.orgId,
  })

  // Get active connection
  const connection = await db.collection('integration_connections').findOne({
    orgId: session.user.orgId,
    status: 'connected',
  })

  // Sync to platform
  const result = await syncInvoiceToXero(invoice, connection)

  // Log the sync
  await db.collection('sync_logs').insertOne({
    orgId: session.user.orgId,
    platform: connection.platform,
    entityType: 'invoice',
    entityId: params.id,
    status: result.success ? 'success' : 'failed',
    recordsProcessed: 1,
    recordsSuccessful: result.success ? 1 : 0,
    recordsFailed: result.success ? 0 : 1,
    deskwiseId: params.id,
    platformId: result.platformId,
    errorMessage: result.error,
    startedAt: new Date(),
    completedAt: new Date(),
    duration: result.duration,
    initiatedBy: 'user',
    userId: session.user.id,
    createdAt: new Date(),
  })

  return NextResponse.json(result)
}
```

#### 6. Sync Statistics

```typescript
// GET /api/integrations/sync/stats
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  const connections = await db.collection('integration_connections')
    .find({ orgId: session.user.orgId })
    .toArray()

  const platformStats = await Promise.all(
    connections.map(async (conn) => {
      const logs = await db.collection('sync_logs')
        .find({ orgId: session.user.orgId, platform: conn.platform })
        .toArray()

      const totalSyncs = logs.length
      const successfulSyncs = logs.filter((l) => l.status === 'success').length
      const failedSyncs = logs.filter((l) => l.status === 'failed').length

      const entityCounts = {
        invoices: logs.filter((l) => l.entityType === 'invoice' && l.status === 'success').length,
        quotes: logs.filter((l) => l.entityType === 'quote' && l.status === 'success').length,
        customers: logs.filter((l) => l.entityType === 'customer' && l.status === 'success').length,
        products: logs.filter((l) => l.entityType === 'product' && l.status === 'success').length,
        payments: logs.filter((l) => l.entityType === 'payment' && l.status === 'success').length,
      }

      return {
        platform: conn.platform,
        isConnected: conn.status === 'connected',
        stats: {
          totalSyncs,
          successfulSyncs,
          failedSyncs,
          lastSyncAt: logs[0]?.completedAt,
          lastSuccessAt: logs.find((l) => l.status === 'success')?.completedAt,
          lastFailureAt: logs.find((l) => l.status === 'failed')?.completedAt,
          entityCounts,
        },
      }
    })
  )

  return NextResponse.json({ platformStats })
}
```

#### 7. Sync Logs

```typescript
// GET /api/integrations/sync/logs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  const logs = await db.collection('sync_logs')
    .find({ orgId: session.user.orgId })
    .sort({ startedAt: -1 })
    .limit(100)
    .toArray()

  return NextResponse.json({ logs })
}

// POST /api/integrations/sync/logs/export
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const { filters } = await req.json()

  // Build query from filters
  const query: any = { orgId: session.user.orgId }
  if (filters.platform && filters.platform !== 'all') {
    query.platform = filters.platform
  }
  if (filters.entityType && filters.entityType !== 'all') {
    query.entityType = filters.entityType
  }
  if (filters.status && filters.status !== 'all') {
    query.status = filters.status
  }

  const logs = await db.collection('sync_logs')
    .find(query)
    .sort({ startedAt: -1 })
    .toArray()

  // Generate CSV
  const csv = [
    'Timestamp,Platform,Entity Type,Status,Records Processed,Records Successful,Records Failed,Duration,Error Message',
    ...logs.map((log) =>
      [
        log.startedAt.toISOString(),
        log.platform,
        log.entityType,
        log.status,
        log.recordsProcessed,
        log.recordsSuccessful,
        log.recordsFailed,
        log.duration || '',
        log.errorMessage || '',
      ].join(',')
    ),
  ].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=sync-logs.csv',
    },
  })
}
```

---

## 🗄️ Database Schema

### Collections Required

#### 1. `integration_connections`
```typescript
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  status: 'connected' | 'disconnected' | 'error' | 'pending',
  accessToken: string,
  refreshToken: string,
  tokenExpiresAt: Date,
  tenantId: string,
  tenantName: string,
  companyName: string,
  companyFileId: string, // MYOB only
  lastSyncAt: Date,
  connectedAt: Date,
  lastError: string,
  errorCount: number,
  configId: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  updatedBy: string,
}
```

#### 2. `integration_configs`
```typescript
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  syncPreferences: {
    invoices: boolean,
    quotes: boolean,
    customers: boolean,
    products: boolean,
    payments: boolean,
  },
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'manual',
  syncDirection: 'deskwise_to_platform' | 'platform_to_deskwise' | 'bidirectional',
  autoSync: boolean,
  taxSettings: {
    includeTax: boolean,
    defaultTaxRate: string,
  },
  accountMappings: {
    revenueAccount: string,
    receivablesAccount: string,
  },
  advancedSettings: {
    skipDuplicates: boolean,
    updateExisting: boolean,
    notifyOnError: boolean,
    notifyOnSuccess: boolean,
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: string,
  updatedBy: string,
}
```

#### 3. `sync_logs`
```typescript
{
  _id: ObjectId,
  orgId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  entityType: 'invoice' | 'quote' | 'customer' | 'product' | 'payment',
  entityId: string,
  direction: 'deskwise_to_platform' | 'platform_to_deskwise',
  status: 'success' | 'failed' | 'partial' | 'pending',
  recordsProcessed: number,
  recordsSuccessful: number,
  recordsFailed: number,
  deskwiseId: string,
  platformId: string,
  errorMessage: string,
  errorDetails: string,
  stackTrace: string,
  startedAt: Date,
  completedAt: Date,
  duration: number, // milliseconds
  initiatedBy: 'user' | 'system' | 'schedule',
  userId: string,
  createdAt: Date,
}
```

#### 4. `oauth_states` (temporary storage)
```typescript
{
  _id: ObjectId,
  state: string,
  orgId: string,
  userId: string,
  platform: 'xero' | 'quickbooks' | 'myob',
  returnUrl: string,
  createdAt: Date,
  expiresAt: Date,
}
```

---

## 🔑 Environment Variables

Add these to your `.env.local`:

```bash
# Xero OAuth
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=your_quickbooks_client_id
QUICKBOOKS_CLIENT_SECRET=your_quickbooks_client_secret
QUICKBOOKS_REDIRECT_URI=http://localhost:9002/api/integrations/quickbooks/callback

# MYOB OAuth
MYOB_CLIENT_ID=your_myob_client_id
MYOB_CLIENT_SECRET=your_myob_client_secret
MYOB_REDIRECT_URI=http://localhost:9002/api/integrations/myob/callback
```

---

## 🧪 Testing Locally

### 1. With Demo Data (No Backend Required)

```tsx
// src/app/(app)/settings/integrations/page.tsx
import { demoConnections, demoConfigs, mockApiResponses } from '@/components/integrations/demo-data'

export default function IntegrationsPage() {
  useEffect(() => {
    // Use demo data
    setIntegrations(demoConnections.filter(c => c.status !== 'disconnected'))
    setConfigs(demoConfigs)
    setLoading(false)
  }, [])

  // ...rest of component
}
```

### 2. With Mock Service Worker (MSW)

Install MSW:
```bash
npm install msw --save-dev
```

Create mock handlers:
```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'
import { mockApiResponses } from '@/components/integrations/demo-data'

export const handlers = [
  rest.get('/api/integrations/connections', (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.connections.success))
  }),

  rest.get('/api/integrations/configs', (req, res, ctx) => {
    return res(ctx.json(mockApiResponses.configs.success))
  }),

  // Add more handlers as needed
]
```

### 3. With Real Backend

1. Implement API endpoints as shown above
2. Set up OAuth apps with Xero/QuickBooks/MYOB
3. Configure environment variables
4. Test OAuth flow end-to-end

---

## 📝 Common Tasks

### Add Sync Badge to Invoice Page

```tsx
// src/app/(app)/billing/invoices/[id]/page.tsx
import { SyncBadge } from '@/components/integrations/sync-badge'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const invoice = /* fetch invoice data */

  return (
    <div>
      <h1>Invoice {invoice.number}</h1>

      <SyncBadge
        entityType="invoice"
        entityId={invoice._id}
        platform={invoice.platform}
        platformId={invoice.platformId}
        lastSyncedAt={invoice.lastSyncedAt}
        syncStatus={invoice.syncStatus}
        platformUrl={invoice.platformUrl}
      />

      {/* Invoice details */}
    </div>
  )
}
```

### Trigger Sync from Code

```typescript
const handleSyncInvoice = async (invoiceId: string) => {
  const response = await fetch(`/api/integrations/sync/invoice/${invoiceId}`, {
    method: 'POST',
  })

  if (!response.ok) {
    toast({ title: 'Sync Failed', variant: 'destructive' })
    return
  }

  const data = await response.json()
  toast({ title: 'Sync Successful', description: `Synced to ${data.platform}` })
}
```

### Check if Integration is Active

```typescript
const checkIntegrationStatus = async () => {
  const response = await fetch('/api/integrations/connections')
  const data = await response.json()

  const hasActiveIntegration = data.connections.some(
    (c: any) => c.status === 'connected'
  )

  return hasActiveIntegration
}
```

---

## 🐛 Troubleshooting

### Issue: OAuth Popup Blocked
**Solution**: Check browser popup settings, ensure HTTPS in production

### Issue: Connection Test Fails
**Solution**: Verify OAuth tokens haven't expired, check API credentials

### Issue: Platform Data Not Loading
**Solution**: Check connection ID, verify API endpoint, ensure OAuth token is valid

### Issue: Sync Badge Not Showing
**Solution**: Verify `platformId` exists in invoice/quote data, check API response format

---

## 📚 Further Reading

- **Full Documentation**: `INTEGRATIONS_README.md`
- **Usage Examples**: `INTEGRATION_USAGE_EXAMPLES.md`
- **Technical Overview**: `INTEGRATIONS_IMPLEMENTATION_SUMMARY.md`
- **Xero API**: https://developer.xero.com/documentation/
- **QuickBooks API**: https://developer.intuit.com/app/developer/qbo/docs/get-started
- **MYOB API**: https://developer.myob.com/api/accountright/v2/

---

## ✅ Next Steps

1. ✅ Review this quick start guide
2. ⬜ Test UI with demo data
3. ⬜ Set up OAuth apps (Xero, QuickBooks, MYOB)
4. ⬜ Implement backend API endpoints
5. ⬜ Create database collections
6. ⬜ Test OAuth flow end-to-end
7. ⬜ Implement sync logic
8. ⬜ Add error logging
9. ⬜ Deploy to staging
10. ⬜ User acceptance testing

---

**Need Help?** Check the full documentation in `INTEGRATIONS_README.md` or review code examples in `INTEGRATION_USAGE_EXAMPLES.md`.

**Ready to Code?** Start with the backend API implementation guide above!
