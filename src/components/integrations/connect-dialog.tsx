'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { IntegrationPlatform } from '@/lib/types/integrations'

interface ConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: IntegrationPlatform
  onUpdate: () => void
}

const platformInfo = {
  xero: {
    name: 'Xero',
    authUrl: '/api/integrations/xero/auth',
    instructions: [
      'Click "Connect to Xero" to open the OAuth authorization window',
      'Sign in to your Xero account',
      'Select the organization you want to connect',
      'Authorize Deskwise to access your Xero data',
      'You will be redirected back once connected',
    ],
  },
  quickbooks: {
    name: 'QuickBooks',
    authUrl: '/api/integrations/quickbooks/auth',
    instructions: [
      'Click "Connect to QuickBooks" to open the OAuth authorization window',
      'Sign in to your Intuit account',
      'Select the company you want to connect',
      'Authorize Deskwise to access your QuickBooks data',
      'You will be redirected back once connected',
    ],
  },
  myob: {
    name: 'MYOB',
    authUrl: '/api/integrations/myob/auth',
    instructions: [
      'Click "Connect to MYOB" to open the OAuth authorization window',
      'Sign in to your MYOB account',
      'Select the company file you want to connect',
      'Authorize Deskwise to access your MYOB data',
      'You will be redirected back once connected',
    ],
  },
}

export function ConnectDialog({ open, onOpenChange, platform, onUpdate }: ConnectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const info = platformInfo[platform]

  const handleConnect = async () => {
    try {
      setLoading(true)
      setStatus('authorizing')
      setErrorMessage(null)

      // Initiate OAuth flow
      const response = await fetch(info.authUrl, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to initiate authorization')
      }

      const data = await response.json()

      // Open OAuth window
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const authWindow = window.open(
        data.authUrl,
        'oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
      )

      if (!authWindow) {
        throw new Error('Failed to open authorization window. Please check your popup blocker.')
      }

      // Poll for completion
      const pollInterval = setInterval(async () => {
        if (authWindow.closed) {
          clearInterval(pollInterval)
          setLoading(false)
          setStatus('idle')

          // Check if connection was successful
          const checkResponse = await fetch(`/api/integrations/connections/latest?platform=${platform}`)
          if (checkResponse.ok) {
            const connection = await checkResponse.json()
            if (connection.status === 'connected') {
              setStatus('success')
              toast({
                title: 'Connected Successfully',
                description: `${info.name} has been connected to your account.`,
              })
              setTimeout(() => {
                onOpenChange(false)
                onUpdate()
              }, 1500)
            } else if (connection.status === 'error') {
              setStatus('error')
              setErrorMessage(connection.lastError || 'Connection failed')
            }
          } else {
            setStatus('error')
            setErrorMessage('Connection verification failed')
          }
        }
      }, 500)
    } catch (error) {
      console.error('Error connecting:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect')
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setStatus('idle')
      setErrorMessage(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to {info.name}</DialogTitle>
          <DialogDescription>
            Follow these steps to connect your {info.name} account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === 'idle' && (
            <ol className="space-y-3 text-sm text-muted-foreground">
              {info.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{instruction}</span>
                </li>
              ))}
            </ol>
          )}

          {status === 'authorizing' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Waiting for authorization... Please complete the process in the popup window.
              </AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully connected to {info.name}! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading || status === 'success'} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4" />
                Connect to {info.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
