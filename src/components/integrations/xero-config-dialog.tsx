'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle, CheckCircle2, Activity, ScrollText } from 'lucide-react'
import type { IntegrationConnection, IntegrationConfig, SyncFrequency, SyncDirection, PlatformAccount, PlatformTaxRate } from '@/lib/types/integrations'

interface XeroConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: IntegrationConnection
  config?: IntegrationConfig
  onUpdate: () => void
}

export function XeroConfigDialog({ open, onOpenChange, connection, config, onUpdate }: XeroConfigDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const { toast } = useToast()

  // Configuration state
  const [syncPreferences, setSyncPreferences] = useState({
    invoices: true,
    quotes: true,
    customers: true,
    products: true,
    payments: false,
  })
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('daily')
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('deskwise_to_platform')
  const [autoSync, setAutoSync] = useState(true)
  const [includeTax, setIncludeTax] = useState(true)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [notifyOnError, setNotifyOnError] = useState(true)
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false)

  // Platform data
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [taxRates, setTaxRates] = useState<PlatformTaxRate[]>([])
  const [revenueAccount, setRevenueAccount] = useState<string>('')
  const [receivablesAccount, setReceivablesAccount] = useState<string>('')
  const [defaultTaxRate, setDefaultTaxRate] = useState<string>('')

  useEffect(() => {
    if (open && connection) {
      loadConfig()
      loadPlatformData()
    }
  }, [open, connection])

  const loadConfig = async () => {
    if (!config) return

    setSyncPreferences(config.syncPreferences)
    setSyncFrequency(config.syncFrequency)
    setSyncDirection(config.syncDirection)
    setAutoSync(config.autoSync)
    setIncludeTax(config.taxSettings.includeTax)
    setDefaultTaxRate(config.taxSettings.defaultTaxRate || '')
    setSkipDuplicates(config.advancedSettings.skipDuplicates)
    setUpdateExisting(config.advancedSettings.updateExisting)
    setNotifyOnError(config.advancedSettings.notifyOnError)
    setNotifyOnSuccess(config.advancedSettings.notifyOnSuccess)
    setRevenueAccount(config.accountMappings?.revenueAccount || '')
    setReceivablesAccount(config.accountMappings?.receivablesAccount || '')
  }

  const loadPlatformData = async () => {
    if (!connection?._id) return

    try {
      setLoading(true)

      const [accountsRes, taxRatesRes] = await Promise.all([
        fetch(`/api/integrations/xero/${connection._id}/accounts`),
        fetch(`/api/integrations/xero/${connection._id}/tax-rates`),
      ])

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }

      if (taxRatesRes.ok) {
        const data = await taxRatesRes.json()
        setTaxRates(data.taxRates || [])
      }
    } catch (error) {
      console.error('Error loading platform data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!connection?._id) return

    try {
      setSaving(true)

      const configData: Partial<IntegrationConfig> = {
        platform: 'xero',
        syncPreferences,
        syncFrequency,
        syncDirection,
        autoSync,
        taxSettings: {
          includeTax,
          defaultTaxRate: defaultTaxRate || undefined,
        },
        accountMappings: {
          revenueAccount: revenueAccount || undefined,
          receivablesAccount: receivablesAccount || undefined,
        },
        advancedSettings: {
          skipDuplicates,
          updateExisting,
          syncCustomFields: false,
          notifyOnError,
          notifyOnSuccess,
        },
        fieldMappings: {},
      }

      const response = await fetch(`/api/integrations/configs`, {
        method: config ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...configData,
          connectionId: connection._id,
          ...(config && { _id: config._id }),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save configuration')
      }

      toast({
        title: 'Configuration Saved',
        description: 'Xero integration settings have been updated successfully.',
      })

      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save configuration. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!connection?._id) return

    try {
      setTestingConnection(true)

      const response = await fetch(`/api/integrations/connections/${connection._id}/test`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Connection test failed')
      }

      toast({
        title: 'Connection Test Successful',
        description: 'Xero connection is working properly.',
      })
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Connection Test Failed',
        description: 'Unable to connect to Xero. Please check your settings.',
        variant: 'destructive',
      })
    } finally {
      setTestingConnection(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Xero Configuration</DialogTitle>
          <DialogDescription>
            Configure sync preferences and field mappings for Xero
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="sync" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sync">Sync Settings</TabsTrigger>
            <TabsTrigger value="mappings">Account Mappings</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Sync Settings Tab */}
          <TabsContent value="sync" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Preferences</CardTitle>
                <CardDescription>Choose what data to sync with Xero</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-invoices">Invoices</Label>
                    <p className="text-sm text-muted-foreground">Sync invoices from Deskwise to Xero</p>
                  </div>
                  <Switch
                    id="sync-invoices"
                    checked={syncPreferences.invoices}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, invoices: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-quotes">Quotes</Label>
                    <p className="text-sm text-muted-foreground">Sync quotes from Deskwise to Xero</p>
                  </div>
                  <Switch
                    id="sync-quotes"
                    checked={syncPreferences.quotes}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, quotes: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-customers">Customers</Label>
                    <p className="text-sm text-muted-foreground">Sync customer contacts to Xero</p>
                  </div>
                  <Switch
                    id="sync-customers"
                    checked={syncPreferences.customers}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, customers: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-products">Products</Label>
                    <p className="text-sm text-muted-foreground">Sync products and services to Xero</p>
                  </div>
                  <Switch
                    id="sync-products"
                    checked={syncPreferences.products}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, products: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sync-payments">Payments</Label>
                    <p className="text-sm text-muted-foreground">Sync payment records to Xero</p>
                  </div>
                  <Switch
                    id="sync-payments"
                    checked={syncPreferences.payments}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, payments: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sync Behavior</CardTitle>
                <CardDescription>Configure when and how data syncs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">Sync Frequency</Label>
                  <Select value={syncFrequency} onValueChange={(value) => setSyncFrequency(value as SyncFrequency)}>
                    <SelectTrigger id="sync-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time (immediate)</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How often should data automatically sync to Xero
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sync">Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync data based on frequency setting
                    </p>
                  </div>
                  <Switch
                    id="auto-sync"
                    checked={autoSync}
                    onCheckedChange={setAutoSync}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Mappings Tab */}
          <TabsContent value="mappings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Xero Accounts</CardTitle>
                <CardDescription>Map Deskwise transactions to Xero accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="revenue-account">Revenue Account</Label>
                      <Select value={revenueAccount} onValueChange={setRevenueAccount}>
                        <SelectTrigger id="revenue-account">
                          <SelectValue placeholder="Select revenue account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.type === 'REVENUE')
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Account for invoice line items
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="receivables-account">Accounts Receivable</Label>
                      <Select value={receivablesAccount} onValueChange={setReceivablesAccount}>
                        <SelectTrigger id="receivables-account">
                          <SelectValue placeholder="Select receivables account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.type === 'RECEIVABLE' || a.type === 'CURRASS')
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.code} - {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Account for tracking customer balances
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tax Settings</CardTitle>
                <CardDescription>Configure tax handling for Xero</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="include-tax">Include Tax</Label>
                    <p className="text-sm text-muted-foreground">
                      Include tax calculations in synced invoices
                    </p>
                  </div>
                  <Switch
                    id="include-tax"
                    checked={includeTax}
                    onCheckedChange={setIncludeTax}
                  />
                </div>

                {includeTax && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="default-tax-rate">Default Tax Rate</Label>
                      <Select value={defaultTaxRate} onValueChange={setDefaultTaxRate}>
                        <SelectTrigger id="default-tax-rate">
                          <SelectValue placeholder="Select default tax rate" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxRates.map((rate) => (
                            <SelectItem key={rate.id} value={rate.id}>
                              {rate.name} ({rate.rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Tax rate to use when none is specified
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Handling</CardTitle>
                <CardDescription>Configure how data conflicts are handled</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="skip-duplicates">Skip Duplicates</Label>
                    <p className="text-sm text-muted-foreground">
                      Don't sync records that already exist in Xero
                    </p>
                  </div>
                  <Switch
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={setSkipDuplicates}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="update-existing">Update Existing</Label>
                    <p className="text-sm text-muted-foreground">
                      Update existing records when syncing
                    </p>
                  </div>
                  <Switch
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={setUpdateExisting}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications</CardTitle>
                <CardDescription>Get notified about sync events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-error">Notify on Error</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications when sync fails
                    </p>
                  </div>
                  <Switch
                    id="notify-error"
                    checked={notifyOnError}
                    onCheckedChange={setNotifyOnError}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-success">Notify on Success</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications on successful sync
                    </p>
                  </div>
                  <Switch
                    id="notify-success"
                    checked={notifyOnSuccess}
                    onCheckedChange={setNotifyOnSuccess}
                  />
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Test your connection before saving to ensure all settings are correct.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testingConnection || !connection}
            className="gap-2"
          >
            {testingConnection ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !connection}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
