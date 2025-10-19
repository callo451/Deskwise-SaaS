'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { SettingsHeader } from '@/components/settings/settings-header'
import { useEmailSettings } from '@/hooks/use-email-settings'
import {
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  TestTube,
  Server,
  Cloud,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'

export default function EmailIntegrationPage() {
  const { data: session } = useSession()
  const { settings, loading, fetchSettings, saveSettings, testConnection } =
    useEmailSettings()
  const { toast } = useToast()

  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  const [formData, setFormData] = useState({
    provider: 'platform' as 'platform' | 'smtp',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
    },
    fromEmail: '',
    fromName: '',
    notificationsEnabled: true,
    rateLimitPerHour: 100,
  })

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    if (isAdmin) {
      fetchSettings()
    }
  }, [isAdmin, fetchSettings])

  useEffect(() => {
    if (settings) {
      setFormData({
        provider: settings.provider || 'platform',
        smtp: settings.smtp || formData.smtp,
        fromEmail: settings.fromEmail || '',
        fromName: settings.fromName || '',
        notificationsEnabled: true,
        rateLimitPerHour: settings.maxEmailsPerHour || 100,
      })
    }
  }, [settings])

  const handleSave = async () => {
    await saveSettings(formData)
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    await testConnection()
    setTestingConnection(false)
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SettingsHeader
          title="Email Integration"
          description="Manage email settings and notifications"
          breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
          icon={<Mail className="h-6 w-6 text-orange-600" />}
        />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need administrator privileges to access email integration settings.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const getStatusBadge = () => {
    if (!settings?.isConfigured) {
      return (
        <Badge variant="secondary">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Configured
        </Badge>
      )
    }

    if (settings.lastTestResult?.success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Connected
        </Badge>
      )
    }

    return (
      <Badge variant="secondary">
        <AlertCircle className="h-3 w-3 mr-1" />
        Not Tested
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Email Integration"
        description="Configure email provider and notification settings"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Mail className="h-6 w-6 text-orange-600" />}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-orange-700">Connection Status</CardDescription>
            <div className="mt-2">{getStatusBadge()}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Provider</CardDescription>
            <CardTitle className="text-xl">
              {settings?.provider === 'platform' ? 'Platform Email' : 'Custom SMTP'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Last Tested</CardDescription>
            <CardTitle className="text-base">
              {settings?.lastTestedAt
                ? new Date(settings.lastTestedAt).toLocaleDateString()
                : 'Never'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Rate Limit</CardDescription>
            <CardTitle className="text-xl">
              {settings?.maxEmailsPerHour || 100}/hour
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Error Message */}
      {settings?.lastTestResult && !settings.lastTestResult.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{settings.lastTestResult.message}</AlertDescription>
        </Alert>
      )}

      {/* Email Provider Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Email Provider</CardTitle>
          <CardDescription>
            Choose between platform-managed email or your own SMTP server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <Label>Email Provider</Label>
                <RadioGroup
                  value={formData.provider}
                  onValueChange={(value: 'platform' | 'smtp') =>
                    setFormData({ ...formData, provider: value })
                  }
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="platform" id="platform" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="platform" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">Platform Email (Recommended)</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use Deskwise's managed email service. No SMTP configuration needed.
                          Emails sent from Deskwise's servers.
                        </p>
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="smtp" id="smtp" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="smtp" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <Server className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold">Custom SMTP Server</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Use your own SMTP server (Gmail, Outlook, SendGrid, etc.).
                          Emails sent from your domain.
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* SMTP Configuration (only if provider is smtp) */}
              {formData.provider === 'smtp' && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-semibold">SMTP Server Configuration</h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtpHost">SMTP Host *</Label>
                        <Input
                          id="smtpHost"
                          value={formData.smtp.host}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              smtp: { ...formData.smtp, host: e.target.value },
                            })
                          }
                          placeholder="smtp.gmail.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Your SMTP server hostname
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPort">SMTP Port *</Label>
                        <Input
                          id="smtpPort"
                          type="number"
                          value={formData.smtp.port}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              smtp: { ...formData.smtp, port: parseInt(e.target.value) },
                            })
                          }
                          placeholder="587"
                        />
                        <p className="text-xs text-muted-foreground">
                          Common: 587 (STARTTLS), 465 (SSL), 25 (plain)
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtpUsername">SMTP Username *</Label>
                        <Input
                          id="smtpUsername"
                          value={formData.smtp.username}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              smtp: { ...formData.smtp, username: e.target.value },
                            })
                          }
                          placeholder="your-email@gmail.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="smtpPassword">SMTP Password *</Label>
                        <div className="relative">
                          <Input
                            id="smtpPassword"
                            type={showSmtpPassword ? 'text' : 'password'}
                            value={formData.smtp.password}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                smtp: { ...formData.smtp, password: e.target.value },
                              })
                            }
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                          >
                            {showSmtpPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          For Gmail, use App Password, not regular password
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Use SSL/TLS</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable for port 465. Disable for ports 587 or 25 (uses STARTTLS)
                        </p>
                      </div>
                      <Switch
                        checked={formData.smtp.secure}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            smtp: { ...formData.smtp, secure: checked },
                          })
                        }
                      />
                    </div>
                  </div>

                  <Separator />
                </>
              )}

              {/* Common Email Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold">Sender Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">From Email Address *</Label>
                    <Input
                      id="fromEmail"
                      type="email"
                      value={formData.fromEmail}
                      onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                      placeholder="support@yourdomain.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      {formData.provider === 'platform'
                        ? 'This can be any email address (platform handles sending)'
                        : 'Must match your SMTP account email'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name *</Label>
                    <Input
                      id="fromName"
                      value={formData.fromName}
                      onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                      placeholder="Deskwise Support"
                    />
                    <p className="text-xs text-muted-foreground">
                      Display name shown in recipient's inbox
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="space-y-0.5">
                  <Label>Test Connection</Label>
                  <p className="text-sm text-muted-foreground">
                    Verify your email configuration is working
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testingConnection || !formData.fromEmail}
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => fetchSettings()}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={loading} className="bg-orange-600 hover:bg-orange-700">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
          <CardDescription>
            Additional configuration options for email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Global Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable all email notifications system-wide
              </p>
            </div>
            <Switch
              checked={formData.notificationsEnabled}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, notificationsEnabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateLimit">Rate Limit (emails per hour)</Label>
            <Input
              id="rateLimit"
              type="number"
              value={formData.rateLimitPerHour}
              onChange={(e) =>
                setFormData({ ...formData, rateLimitPerHour: parseInt(e.target.value) })
              }
              min="1"
              max="1000"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of emails that can be sent per hour to prevent abuse
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
