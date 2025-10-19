'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, ExternalLink, Globe, FolderSync, FileText, Building2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const ADMIN_PORTAL_INTENTS = [
  {
    key: 'sso',
    label: 'Single Sign-On',
    description: 'Configure SAML or OpenID Connect authentication',
    icon: Shield,
  },
  {
    key: 'dsync',
    label: 'Directory Sync',
    description: 'Sync users and groups from your identity provider',
    icon: FolderSync,
  },
  {
    key: 'domain_verification',
    label: 'Domain Verification',
    description: 'Verify ownership of your organization domains',
    icon: Globe,
  },
  {
    key: 'audit_logs',
    label: 'Audit Logs',
    description: 'Configure audit log streaming and monitoring',
    icon: FileText,
  },
]

interface AdminPortalClientProps {
  user: any
  organizationId?: string
}

export function AdminPortalClient({ user, organizationId }: AdminPortalClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [actualOrgId, setActualOrgId] = useState<string | undefined>(organizationId)
  const [isCheckingSetup, setIsCheckingSetup] = useState(!organizationId)
  const { toast } = useToast()

  // Check MongoDB if WorkOS session doesn't have organizationId
  useEffect(() => {
    if (!organizationId) {
      checkOrganizationSetup()
    }
  }, [organizationId])

  const checkOrganizationSetup = async () => {
    setIsCheckingSetup(true)
    try {
      const response = await fetch('/api/auth/check-setup')
      if (response.ok) {
        const data = await response.json()
        if (data.hasOrganization) {
          setActualOrgId(data.organizationId)
        }
      }
    } catch (error) {
      console.error('Error checking organization setup:', error)
    } finally {
      setIsCheckingSetup(false)
    }
  }

  const syncSession = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/sync-session', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setActualOrgId(data.organizationId)
        toast({
          title: 'Session Synced',
          description: 'Your session has been synchronized. Please refresh the page.',
        })
        // Refresh the page to pick up the updated session
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error('Failed to sync session')
      }
    } catch (error) {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync session. Please try signing out and back in.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generatePortalLink = async (intent: string) => {
    const orgIdToUse = actualOrgId || organizationId
    
    console.log('Generating portal link for:', { intent, orgId: orgIdToUse })
    
    if (!orgIdToUse) {
      toast({
        title: 'Setup Required',
        description: 'You need to complete account setup first. Please visit the setup page.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin-portal/portal-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId: orgIdToUse,
          intent,
        }),
      })

      const responseData = await response.json()
      console.log('Portal link response:', responseData)

      if (response.ok) {
        console.log('Redirecting to portal link:', responseData.link)
        window.location.href = responseData.link
      } else {
        console.error('Portal link generation failed:', responseData)
        throw new Error(responseData.error || 'Failed to generate portal link')
      }
    } catch (error) {
      console.error('Error generating portal link:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to open Admin Portal. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Admin Portal</h1>
        <p className="text-muted-foreground">
          Configure enterprise features like SSO, Directory Sync, and domain verification.
        </p>
      </div>

      {isCheckingSetup ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Checking Setup...
            </CardTitle>
            <CardDescription>
              Verifying your organization setup status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">
                Checking your organization status...
              </p>
            </div>
          </CardContent>
        </Card>
      ) : !actualOrgId && !organizationId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Setup Required
            </CardTitle>
            <CardDescription>
              You need to complete your account setup before accessing the Admin Portal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please complete the account setup process to create your organization and enable enterprise features.
            </p>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/auth/setup">Complete Setup</a>
              </Button>
              <Button variant="outline" onClick={syncSession}>
                Sync Session
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Enterprise Configuration
            </CardTitle>
            <CardDescription>
              Access the WorkOS Admin Portal to configure enterprise features for your organization.
              Portal links are secure and expire after 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {ADMIN_PORTAL_INTENTS.map((intent) => (
                <Button
                  key={intent.key}
                  variant="outline"
                  className="h-auto p-6 justify-start"
                  onClick={() => generatePortalLink(intent.key)}
                  disabled={isLoading}
                >
                  <div className="flex items-start gap-4 text-left">
                    <intent.icon className="h-6 w-6 mt-1 text-primary flex-shrink-0" />
                    <div className="flex-grow">
                      <div className="font-semibold flex items-center gap-2 mb-1">
                        {intent.label}
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {intent.description}
                      </div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">How it works</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Click any option above to open the WorkOS Admin Portal</li>
                <li>• Follow the guided setup for your chosen feature</li>
                <li>• Changes take effect immediately in your application</li>
                <li>• Portal links are secure and expire after 5 minutes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}