# Integration Components - Usage Examples

This document provides practical examples of how to use the accounting integration UI components in your application.

## 1. Adding Sync Badge to Invoice Detail Page

Add the sync badge to show integration status on invoice detail pages.

```tsx
// src/app/(app)/billing/invoices/[id]/page.tsx
'use client'

import { SyncBadge } from '@/components/integrations/sync-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  // Fetch invoice data
  const invoice = {
    _id: params.id,
    invoiceNumber: 'INV-2025-001',
    status: 'paid',
    total: 1500.00,
    // Integration fields
    syncedToXero: true,
    xeroInvoiceId: 'abc-123-def-456',
    lastSyncedAt: '2025-01-15T10:30:00Z',
    syncStatus: 'synced' as const,
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Invoice {invoice.invoiceNumber}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'}>
                  {invoice.status}
                </Badge>

                {/* Sync Badge Component */}
                <SyncBadge
                  entityType="invoice"
                  entityId={invoice._id}
                  platform="xero"
                  platformId={invoice.xeroInvoiceId}
                  lastSyncedAt={invoice.lastSyncedAt}
                  syncStatus={invoice.syncStatus}
                  platformUrl={`https://go.xero.com/app/!2kqZB/invoicing/view/${invoice.xeroInvoiceId}`}
                />
              </div>
            </div>
            <p className="text-2xl font-bold">${invoice.total.toFixed(2)}</p>
          </div>
        </CardHeader>
        <CardContent>
          {/* Invoice details */}
        </CardContent>
      </Card>
    </div>
  )
}
```

## 2. Adding Sync Badge to Quote Detail Page

Similar implementation for quotes/estimates.

```tsx
// src/app/(app)/billing/quotes/[id]/page.tsx
'use client'

import { SyncBadge } from '@/components/integrations/sync-badge'

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const quote = {
    _id: params.id,
    quoteNumber: 'QUO-2025-042',
    status: 'pending',
    total: 2300.00,
    syncedToQuickBooks: false,
    quickBooksEstimateId: null,
    lastSyncedAt: null,
    syncStatus: 'not_synced' as const,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge>{quote.status}</Badge>

        {/* Sync Badge for Quote */}
        <SyncBadge
          entityType="quote"
          entityId={quote._id}
          platform="quickbooks"
          syncStatus="not_synced"
          // Will show "Sync" button since not yet synced
        />
      </div>
    </div>
  )
}
```

## 3. Manual Sync with Custom Handler

If you want to handle the sync operation yourself (e.g., update local state after sync):

```tsx
'use client'

import { useState } from 'react'
import { SyncBadge } from '@/components/integrations/sync-badge'
import { useToast } from '@/hooks/use-toast'

export default function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const [syncStatus, setSyncStatus] = useState(invoice.syncStatus)
  const [lastSyncedAt, setLastSyncedAt] = useState(invoice.lastSyncedAt)
  const { toast } = useToast()

  const handleSync = async () => {
    try {
      setSyncStatus('pending')

      const response = await fetch(`/api/integrations/sync/invoice/${invoice._id}`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Sync failed')

      const data = await response.json()

      // Update local state
      setSyncStatus('synced')
      setLastSyncedAt(new Date().toISOString())

      toast({
        title: 'Sync Successful',
        description: `Invoice synced to ${data.platform}`,
      })
    } catch (error) {
      setSyncStatus('failed')
      toast({
        title: 'Sync Failed',
        description: 'Please try again or check the sync logs.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex items-center gap-2">
      <SyncBadge
        entityType="invoice"
        entityId={invoice._id}
        platform={invoice.platform}
        platformId={invoice.platformId}
        lastSyncedAt={lastSyncedAt}
        syncStatus={syncStatus}
        onSync={handleSync} // Custom handler
      />
    </div>
  )
}
```

## 4. Bulk Invoice Sync with Table Actions

Add sync functionality to invoice list pages with bulk operations.

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { SyncBadge } from '@/components/integrations/sync-badge'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw } from 'lucide-react'

export default function InvoiceListPage() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const invoices = [
    { _id: '1', number: 'INV-001', syncStatus: 'synced', platform: 'xero' },
    { _id: '2', number: 'INV-002', syncStatus: 'not_synced', platform: null },
    { _id: '3', number: 'INV-003', syncStatus: 'failed', platform: 'xero' },
  ]

  const handleBulkSync = async () => {
    try {
      setSyncing(true)

      const response = await fetch('/api/integrations/sync/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: selectedInvoices }),
      })

      if (!response.ok) throw new Error('Bulk sync failed')

      const data = await response.json()

      toast({
        title: 'Bulk Sync Complete',
        description: `${data.successful} of ${selectedInvoices.length} invoices synced successfully.`,
      })

      // Refresh the page or update state
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Bulk Sync Failed',
        description: 'Some invoices failed to sync. Check logs for details.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {selectedInvoices.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <span className="text-sm">{selectedInvoices.length} selected</span>
          <Button onClick={handleBulkSync} disabled={syncing} size="sm" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            Sync to Accounting Platform
          </Button>
        </div>
      )}

      {/* Invoice Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-12">
              <Checkbox
                checked={selectedInvoices.length === invoices.length}
                onCheckedChange={(checked) => {
                  setSelectedInvoices(checked ? invoices.map((i) => i._id) : [])
                }}
              />
            </th>
            <th>Invoice #</th>
            <th>Sync Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td>
                <Checkbox
                  checked={selectedInvoices.includes(invoice._id)}
                  onCheckedChange={(checked) => {
                    setSelectedInvoices(
                      checked
                        ? [...selectedInvoices, invoice._id]
                        : selectedInvoices.filter((id) => id !== invoice._id)
                    )
                  }}
                />
              </td>
              <td>{invoice.number}</td>
              <td>
                <SyncBadge
                  entityType="invoice"
                  entityId={invoice._id}
                  platform={invoice.platform as any}
                  syncStatus={invoice.syncStatus as any}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## 5. Conditional Platform Display

Show sync badge only when a platform integration is active.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { SyncBadge } from '@/components/integrations/sync-badge'

export default function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  const [hasActiveIntegration, setHasActiveIntegration] = useState(false)
  const [activePlatform, setActivePlatform] = useState<'xero' | 'quickbooks' | 'myob' | null>(null)

  useEffect(() => {
    // Check if organization has any active integrations
    fetch('/api/integrations/connections')
      .then((res) => res.json())
      .then((data) => {
        const connected = data.connections.find((c: any) => c.status === 'connected')
        if (connected) {
          setHasActiveIntegration(true)
          setActivePlatform(connected.platform)
        }
      })
  }, [])

  return (
    <div className="flex items-center gap-2">
      <h1>Invoice {invoice.number}</h1>

      {/* Only show sync badge if integration is active */}
      {hasActiveIntegration && activePlatform && (
        <SyncBadge
          entityType="invoice"
          entityId={invoice._id}
          platform={activePlatform}
          platformId={invoice.platformId}
          lastSyncedAt={invoice.lastSyncedAt}
          syncStatus={invoice.syncStatus || 'not_synced'}
        />
      )}
    </div>
  )
}
```

## 6. Handling Multiple Platforms

If you support multiple platforms simultaneously (e.g., syncing to both Xero and QuickBooks):

```tsx
'use client'

import { SyncBadge } from '@/components/integrations/sync-badge'

export default function InvoiceMultiPlatform({ invoice }: { invoice: Invoice }) {
  const platforms = [
    {
      platform: 'xero' as const,
      platformId: invoice.xeroInvoiceId,
      lastSyncedAt: invoice.xeroLastSyncedAt,
      syncStatus: invoice.xeroSyncStatus || 'not_synced' as const,
      platformUrl: invoice.xeroUrl,
    },
    {
      platform: 'quickbooks' as const,
      platformId: invoice.qbInvoiceId,
      lastSyncedAt: invoice.qbLastSyncedAt,
      syncStatus: invoice.qbSyncStatus || 'not_synced' as const,
      platformUrl: invoice.qbUrl,
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Accounting Platforms</p>
      <div className="flex flex-wrap gap-2">
        {platforms.map(({ platform, ...props }) => (
          <SyncBadge
            key={platform}
            entityType="invoice"
            entityId={invoice._id}
            platform={platform}
            {...props}
          />
        ))}
      </div>
    </div>
  )
}
```

## 7. Integration Status in Dashboard Widget

Display integration status in a dashboard widget.

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Webhook, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function IntegrationStatusWidget() {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/integrations/connections')
      .then((res) => res.json())
      .then((data) => {
        setConnections(data.connections || [])
        setLoading(false)
      })
  }, [])

  const connectedCount = connections.filter((c: any) => c.status === 'connected').length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Webhook className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Integrations</CardTitle>
          </div>
          {connectedCount > 0 && (
            <Badge variant="default" className="bg-green-600">
              {connectedCount} Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : connectedCount === 0 ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <p>No accounting platforms connected</p>
            </div>
            <Link href="/settings/integrations">
              <Button variant="outline" size="sm" className="w-full">
                Connect Platform
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((conn: any) => (
              <div key={conn._id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{conn.platform}</span>
                <Badge
                  variant={conn.status === 'connected' ? 'default' : 'outline'}
                  className={conn.status === 'connected' ? 'bg-green-600' : ''}
                >
                  {conn.status}
                </Badge>
              </div>
            ))}
            <Link href="/settings/integrations">
              <Button variant="outline" size="sm" className="w-full mt-2">
                Manage Integrations
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

## API Response Types

For reference, here are the expected API response formats:

```typescript
// GET /api/integrations/connections
{
  "connections": [
    {
      "_id": "conn_123",
      "orgId": "org_456",
      "platform": "xero",
      "status": "connected",
      "companyName": "Acme Corporation",
      "tenantId": "tenant_789",
      "lastSyncAt": "2025-01-15T10:30:00Z",
      "connectedAt": "2025-01-01T08:00:00Z"
    }
  ]
}

// POST /api/integrations/sync/invoice/:id
{
  "success": true,
  "platform": "xero",
  "platformId": "abc-123-def-456",
  "syncedAt": "2025-01-15T11:00:00Z",
  "message": "Invoice synced successfully"
}

// GET /api/integrations/sync/stats
{
  "platformStats": [
    {
      "platform": "xero",
      "isConnected": true,
      "stats": {
        "totalSyncs": 150,
        "successfulSyncs": 145,
        "failedSyncs": 5,
        "lastSyncAt": "2025-01-15T10:30:00Z",
        "lastSuccessAt": "2025-01-15T10:30:00Z",
        "lastFailureAt": "2025-01-14T14:20:00Z",
        "entityCounts": {
          "invoices": 85,
          "quotes": 30,
          "customers": 25,
          "products": 10,
          "payments": 0
        }
      }
    }
  ]
}
```

## Common Patterns

### Pattern 1: Auto-sync on Invoice Creation
```tsx
const handleCreateInvoice = async (invoiceData: InvoiceInput) => {
  // Create invoice in Deskwise
  const invoice = await createInvoice(invoiceData)

  // Check if auto-sync is enabled
  const config = await fetch('/api/integrations/configs').then(r => r.json())
  const activeConfig = config.configs.find((c: any) =>
    c.autoSync && c.syncPreferences.invoices
  )

  if (activeConfig && activeConfig.syncFrequency === 'realtime') {
    // Trigger immediate sync
    await fetch(`/api/integrations/sync/invoice/${invoice._id}`, {
      method: 'POST'
    })
  }

  return invoice
}
```

### Pattern 2: Retry Failed Sync
```tsx
const handleRetrySync = async (logId: string) => {
  const log = await fetch(`/api/integrations/sync/logs/${logId}`).then(r => r.json())

  // Retry the sync
  await fetch(`/api/integrations/sync/${log.entityType}/${log.entityId}`, {
    method: 'POST'
  })
}
```

### Pattern 3: Conditional Rendering Based on Platform
```tsx
const renderPlatformSpecificFields = (platform: IntegrationPlatform) => {
  switch (platform) {
    case 'xero':
      return <XeroTaxCodeSelector />
    case 'quickbooks':
      return <QuickBooksClassSelector />
    case 'myob':
      return <MyobJobSelector />
  }
}
```

## Tips and Best Practices

1. **Always handle loading states** - Users should see feedback while sync is in progress
2. **Provide clear error messages** - Tell users what went wrong and how to fix it
3. **Use optimistic updates** - Update UI immediately, revert on error
4. **Implement retry logic** - Allow users to retry failed syncs
5. **Log everything** - Detailed logs help troubleshoot integration issues
6. **Test with real data** - Use actual platform sandbox environments
7. **Handle rate limits** - Some platforms have API rate limits
8. **Validate data before sync** - Ensure data meets platform requirements
9. **Show platform-specific requirements** - e.g., "MYOB requires all prices to include tax"
10. **Provide rollback options** - Allow users to disconnect without data loss

## Troubleshooting

### Sync Badge Not Showing
- Check if `platformId` exists in invoice/quote data
- Verify API endpoint returns correct `syncStatus`
- Ensure component is imported correctly

### OAuth Popup Blocked
- Check browser popup blocker settings
- Use HTTPS in production (required by most OAuth providers)
- Test popup dimensions (600x700 works well)

### Platform Data Not Loading
- Verify connection ID is correct
- Check API endpoint implementation
- Ensure OAuth token hasn't expired
- Check network tab for failed requests

### Manual Sync Fails
- Verify entity exists in database
- Check platform API credentials
- Review sync logs for detailed error messages
- Ensure platform account is not locked

## Support Resources

- **Xero API Docs**: https://developer.xero.com/documentation/
- **QuickBooks API Docs**: https://developer.intuit.com/app/developer/qbo/docs/get-started
- **MYOB API Docs**: https://developer.myob.com/api/accountright/v2/
