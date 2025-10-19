'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SettingsHeader } from '@/components/settings/settings-header'
import { IntegrationCard } from '@/components/integrations/integration-card'
import { SyncStatusDashboard } from '@/components/integrations/sync-status-dashboard'
import { SyncLogsViewer } from '@/components/integrations/sync-logs-viewer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Webhook, Activity, ScrollText, AlertCircle } from 'lucide-react'
import type { IntegrationConnection, IntegrationConfig } from '@/lib/types/integrations'

export default function IntegrationsPage() {
  const { data: session } = useSession()
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([])
  const [configs, setConfigs] = useState<IntegrationConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadIntegrations()
  }, [])

  const loadIntegrations = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch integrations and configs in parallel
      const [integrationsRes, configsRes] = await Promise.all([
        fetch('/api/integrations/connections'),
        fetch('/api/integrations/configs'),
      ])

      if (!integrationsRes.ok || !configsRes.ok) {
        throw new Error('Failed to load integrations')
      }

      const integrationsData = await integrationsRes.json()
      const configsData = await configsRes.json()

      setIntegrations(integrationsData.connections || [])
      setConfigs(configsData.configs || [])
    } catch (err) {
      console.error('Error loading integrations:', err)
      setError('Failed to load integrations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectionUpdate = async () => {
    await loadIntegrations()
  }

  const isAdmin = session?.user?.role === 'admin'

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="Integrations"
          description="Accounting platform integrations"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Webhook className="h-6 w-6 text-blue-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only administrators can manage integrations.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <SettingsHeader
        title="Integrations"
        description="Connect and manage accounting platform integrations"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Webhook className="h-6 w-6 text-blue-600" />}
      />

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs defaultValue="platforms" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="platforms" className="gap-2">
            <Webhook className="h-4 w-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="sync-status" className="gap-2">
            <Activity className="h-4 w-4" />
            Sync Status
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            Sync Logs
          </TabsTrigger>
        </TabsList>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-6">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-semibold mb-2">Accounting Platforms</h2>
                  <p className="text-muted-foreground">
                    Connect your accounting software to sync invoices, quotes, customers, and products
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <IntegrationCard
                    platform="xero"
                    connection={integrations.find((i) => i.platform === 'xero')}
                    config={configs.find((c) => c.platform === 'xero')}
                    onUpdate={handleConnectionUpdate}
                  />
                  <IntegrationCard
                    platform="quickbooks"
                    connection={integrations.find((i) => i.platform === 'quickbooks')}
                    config={configs.find((c) => c.platform === 'quickbooks')}
                    onUpdate={handleConnectionUpdate}
                  />
                  <IntegrationCard
                    platform="myob"
                    connection={integrations.find((i) => i.platform === 'myob')}
                    config={configs.find((c) => c.platform === 'myob')}
                    onUpdate={handleConnectionUpdate}
                  />
                </div>
              </div>

              {/* Info Card */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Integrations sync data from Deskwise to your accounting platform. Configure sync
                  preferences and field mappings for each platform after connecting.
                </AlertDescription>
              </Alert>
            </>
          )}
        </TabsContent>

        {/* Sync Status Tab */}
        <TabsContent value="sync-status" className="space-y-6">
          <SyncStatusDashboard />
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <SyncLogsViewer />
        </TabsContent>
      </Tabs>
    </div>
  )
}
