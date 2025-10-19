'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { XeroConfigDialog } from './xero-config-dialog'
import { QuickBooksConfigDialog } from './quickbooks-config-dialog'
import { MyobConfigDialog } from './myob-config-dialog'
import { ConnectDialog } from './connect-dialog'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, AlertCircle, Clock, Settings, Power, PowerOff } from 'lucide-react'
import type { IntegrationConnection, IntegrationConfig, IntegrationPlatform } from '@/lib/types/integrations'
import { formatDistanceToNow } from 'date-fns'

interface IntegrationCardProps {
  platform: IntegrationPlatform
  connection?: IntegrationConnection
  config?: IntegrationConfig
  onUpdate: () => void
}

const platformInfo = {
  xero: {
    name: 'Xero',
    description: 'Cloud accounting software for small and medium businesses',
    color: 'blue',
    logo: '🔷', // Replace with actual logo image
  },
  quickbooks: {
    name: 'QuickBooks',
    description: 'Accounting software by Intuit for small businesses',
    color: 'green',
    logo: '🟢', // Replace with actual logo image
  },
  myob: {
    name: 'MYOB',
    description: 'Business management solutions for Australian businesses',
    color: 'red',
    logo: '🔴', // Replace with actual logo image
  },
}

export function IntegrationCard({ platform, connection, config, onUpdate }: IntegrationCardProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [showConnect, setShowConnect] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const info = platformInfo[platform]
  const isConnected = connection?.status === 'connected'
  const hasError = connection?.status === 'error'

  const getStatusBadge = () => {
    if (!connection || connection.status === 'disconnected') {
      return <Badge variant="outline" className="gap-1"><PowerOff className="h-3 w-3" /> Not Connected</Badge>
    }

    switch (connection.status) {
      case 'connected':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>
      case 'error':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Error</Badge>
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      default:
        return <Badge variant="outline" className="gap-1"><AlertCircle className="h-3 w-3" /> Unknown</Badge>
    }
  }

  const handleConnect = () => {
    setShowConnect(true)
  }

  const handleDisconnect = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/integrations/connections/${connection?._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }

      toast({
        title: 'Disconnected',
        description: `${info.name} has been disconnected successfully.`,
      })

      setShowDisconnect(false)
      onUpdate()
    } catch (error) {
      console.error('Error disconnecting:', error)
      toast({
        title: 'Error',
        description: 'Failed to disconnect. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/integrations/connections/${connection?._id}/test`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      const data = await response.json()

      toast({
        title: 'Connection Test',
        description: data.message || 'Connection is working properly.',
      })
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Connection Test Failed',
        description: 'Unable to connect to the platform. Please check your settings.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Card className="flex flex-col h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-4xl">{info.logo}</div>
              <div className="space-y-1">
                <CardTitle className="text-xl">{info.name}</CardTitle>
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <CardDescription className="mt-2">{info.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1 space-y-4">
          {isConnected && connection && (
            <div className="space-y-3 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p className="text-sm font-semibold">
                  {connection.companyName || connection.tenantName || 'Unknown'}
                </p>
              </div>

              {connection.lastSyncAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(connection.lastSyncAt), { addSuffix: true })}
                  </p>
                </div>
              )}

              {connection.connectedAt && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Connected</p>
                  <p className="text-sm">
                    {formatDistanceToNow(new Date(connection.connectedAt), { addSuffix: true })}
                  </p>
                </div>
              )}
            </div>
          )}

          {hasError && connection?.lastError && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-muted-foreground">{connection.lastError}</p>
            </div>
          )}

          {!connection && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Connect {info.name} to sync your invoices, quotes, customers, and products automatically.
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {isConnected ? (
            <>
              <div className="flex w-full gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => setShowConfig(true)}
                >
                  <Settings className="h-4 w-4" />
                  Configure
                </Button>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={loading}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDisconnect(true)}
                disabled={loading}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button className="w-full" onClick={handleConnect} disabled={loading}>
              Connect {info.name}
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Configuration Dialogs */}
      {platform === 'xero' && (
        <XeroConfigDialog
          open={showConfig}
          onOpenChange={setShowConfig}
          connection={connection}
          config={config}
          onUpdate={onUpdate}
        />
      )}
      {platform === 'quickbooks' && (
        <QuickBooksConfigDialog
          open={showConfig}
          onOpenChange={setShowConfig}
          connection={connection}
          config={config}
          onUpdate={onUpdate}
        />
      )}
      {platform === 'myob' && (
        <MyobConfigDialog
          open={showConfig}
          onOpenChange={setShowConfig}
          connection={connection}
          config={config}
          onUpdate={onUpdate}
        />
      )}

      {/* Connect Dialog */}
      <ConnectDialog
        open={showConnect}
        onOpenChange={setShowConnect}
        platform={platform}
        onUpdate={onUpdate}
      />

      {/* Disconnect Confirmation */}
      <AlertDialog open={showDisconnect} onOpenChange={setShowDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {info.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will stop all automatic syncing with {info.name}. You can reconnect at any time.
              Your data in both Deskwise and {info.name} will remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
