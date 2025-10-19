'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, CheckCircle2, XCircle, Clock, TrendingUp, FileText, Users, Package, CreditCard, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SyncStats, IntegrationPlatform } from '@/lib/types/integrations'

interface PlatformStats {
  platform: IntegrationPlatform
  stats: SyncStats
  isConnected: boolean
}

export function SyncStatusDashboard() {
  const [loading, setLoading] = useState(true)
  const [platformStats, setPlatformStats] = useState<PlatformStats[]>([])
  const [syncing, setSyncing] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/integrations/sync/stats')
      if (!response.ok) {
        throw new Error('Failed to load sync statistics')
      }

      const data = await response.json()
      setPlatformStats(data.platformStats || [])
    } catch (error) {
      console.error('Error loading stats:', error)
      toast({
        title: 'Error',
        description: 'Failed to load sync statistics.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManualSync = async (platform: IntegrationPlatform, entityType?: string) => {
    const syncKey = `${platform}-${entityType || 'all'}`

    try {
      setSyncing({ ...syncing, [syncKey]: true })

      const response = await fetch('/api/integrations/sync/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, entityType }),
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      const data = await response.json()

      toast({
        title: 'Sync Started',
        description: `${entityType ? entityType.charAt(0).toUpperCase() + entityType.slice(1) : 'All'} sync for ${platform} has been initiated.`,
      })

      // Reload stats after a delay
      setTimeout(loadStats, 2000)
    } catch (error) {
      console.error('Error triggering sync:', error)
      toast({
        title: 'Sync Failed',
        description: 'Failed to start sync. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSyncing({ ...syncing, [syncKey]: false })
    }
  }

  const platformNames = {
    xero: 'Xero',
    quickbooks: 'QuickBooks',
    myob: 'MYOB',
  }

  const entityIcons = {
    invoices: FileText,
    quotes: FileText,
    customers: Users,
    products: Package,
    payments: CreditCard,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    )
  }

  if (platformStats.length === 0 || !platformStats.some((p) => p.isConnected)) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No active integrations. Connect to Xero, QuickBooks, or MYOB to view sync status.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Sync Status</h2>
          <p className="text-muted-foreground">
            Monitor synchronization activity across all connected platforms
          </p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Platform Stats Cards */}
      {platformStats.map(({ platform, stats, isConnected }) => {
        if (!isConnected) return null

        const successRate = stats.totalSyncs > 0
          ? Math.round((stats.successfulSyncs / stats.totalSyncs) * 100)
          : 0

        return (
          <Card key={platform}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{platformNames[platform]}</CardTitle>
                  <CardDescription className="mt-1">
                    Synchronization statistics and manual sync controls
                  </CardDescription>
                </div>
                <Button
                  onClick={() => handleManualSync(platform)}
                  disabled={syncing[`${platform}-all`]}
                  size="sm"
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing[`${platform}-all`] ? 'animate-spin' : ''}`} />
                  Sync All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Overall Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Syncs</p>
                  <p className="text-2xl font-bold">{stats.totalSyncs}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold">{successRate}%</p>
                    {successRate >= 90 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : successRate >= 70 ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Last Sync</p>
                  <p className="text-sm font-medium">
                    {stats.lastSyncAt
                      ? formatDistanceToNow(new Date(stats.lastSyncAt), { addSuffix: true })
                      : 'Never'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Failed Syncs</p>
                  <p className="text-2xl font-bold text-destructive">{stats.failedSyncs}</p>
                </div>
              </div>

              {/* Entity Type Breakdown */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Entity Breakdown</h4>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                  {Object.entries(stats.entityCounts).map(([entity, count]) => {
                    const Icon = entityIcons[entity as keyof typeof entityIcons]
                    const syncKey = `${platform}-${entity}`

                    return (
                      <Card key={entity} className="border-muted">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{entity}</span>
                          </div>
                          <div className="flex items-end justify-between gap-2">
                            <div>
                              <p className="text-2xl font-bold">{count}</p>
                              <p className="text-xs text-muted-foreground">synced</p>
                            </div>
                            <Button
                              onClick={() => handleManualSync(platform, entity)}
                              disabled={syncing[syncKey]}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                            >
                              <RefreshCw className={`h-3 w-3 ${syncing[syncKey] ? 'animate-spin' : ''}`} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>

              {/* Last Sync Status */}
              {stats.lastSuccessAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-muted-foreground">
                    Last successful sync:{' '}
                    <span className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(stats.lastSuccessAt), { addSuffix: true })}
                    </span>
                  </span>
                </div>
              )}

              {stats.lastFailureAt && (
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-muted-foreground">
                    Last failed sync:{' '}
                    <span className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(stats.lastFailureAt), { addSuffix: true })}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
