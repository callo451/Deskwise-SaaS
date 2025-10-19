'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, XCircle, Clock, RefreshCw, ExternalLink, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { IntegrationPlatform } from '@/lib/types/integrations'

interface SyncBadgeProps {
  entityType: 'invoice' | 'quote'
  entityId: string
  platform?: IntegrationPlatform
  platformId?: string
  lastSyncedAt?: Date | string
  syncStatus?: 'synced' | 'pending' | 'failed' | 'not_synced'
  platformUrl?: string
  onSync?: () => void
}

export function SyncBadge({
  entityType,
  entityId,
  platform,
  platformId,
  lastSyncedAt,
  syncStatus = 'not_synced',
  platformUrl,
  onSync,
}: SyncBadgeProps) {
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  const platformNames = {
    xero: 'Xero',
    quickbooks: 'QuickBooks',
    myob: 'MYOB',
  }

  const handleSync = async () => {
    if (!onSync) {
      try {
        setSyncing(true)

        const response = await fetch(`/api/integrations/sync/${entityType}/${entityId}`, {
          method: 'POST',
        })

        if (!response.ok) {
          throw new Error('Sync failed')
        }

        const data = await response.json()

        toast({
          title: 'Sync Started',
          description: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} is being synced to ${platform ? platformNames[platform] : 'accounting platform'}.`,
        })

        // Optionally reload the page or update state
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } catch (error) {
        console.error('Error syncing:', error)
        toast({
          title: 'Sync Failed',
          description: 'Failed to sync. Please try again.',
          variant: 'destructive',
        })
      } finally {
        setSyncing(false)
      }
    } else {
      onSync()
    }
  }

  const getBadgeContent = () => {
    switch (syncStatus) {
      case 'synced':
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="h-3 w-3" />
            Synced to {platform && platformNames[platform]}
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            Sync Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Sync Failed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Not Synced
          </Badge>
        )
    }
  }

  const getTooltipContent = () => {
    if (syncStatus === 'synced' && lastSyncedAt) {
      return `Last synced ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}`
    }
    if (syncStatus === 'pending') {
      return 'Sync is in progress'
    }
    if (syncStatus === 'failed') {
      return 'Last sync attempt failed. Click to retry.'
    }
    return 'Not yet synced to accounting platform'
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{getBadgeContent()}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipContent()}</p>
            {platformId && (
              <p className="text-xs mt-1 opacity-70">Platform ID: {platformId}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {syncStatus === 'synced' && platformUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 gap-1"
          onClick={() => window.open(platformUrl, '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
          View
        </Button>
      )}

      {(syncStatus === 'not_synced' || syncStatus === 'failed') && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 gap-1"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              Sync
            </>
          )}
        </Button>
      )}

      {syncStatus === 'synced' && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2"
          onClick={handleSync}
          disabled={syncing}
        >
          <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  )
}
