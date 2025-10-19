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
import { Loader2, AlertCircle, Activity } from 'lucide-react'
import type { IntegrationConnection, IntegrationConfig, SyncFrequency, PlatformAccount, PlatformTaxRate } from '@/lib/types/integrations'

interface QuickBooksConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connection?: IntegrationConnection
  config?: IntegrationConfig
  onUpdate: () => void
}

export function QuickBooksConfigDialog({ open, onOpenChange, connection, config, onUpdate }: QuickBooksConfigDialogProps) {
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
  const [autoSync, setAutoSync] = useState(true)
  const [includeTax, setIncludeTax] = useState(true)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [notifyOnError, setNotifyOnError] = useState(true)
  const [notifyOnSuccess, setNotifyOnSuccess] = useState(false)

  // Platform data
  const [accounts, setAccounts] = useState<PlatformAccount[]>([])
  const [taxCodes, setTaxCodes] = useState<PlatformTaxRate[]>([])
  const [incomeAccount, setIncomeAccount] = useState<string>('')
  const [arAccount, setArAccount] = useState<string>('')
  const [defaultTaxCode, setDefaultTaxCode] = useState<string>('')

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
    setAutoSync(config.autoSync)
    setIncludeTax(config.taxSettings.includeTax)
    setDefaultTaxCode(config.taxSettings.defaultTaxRate || '')
    setSkipDuplicates(config.advancedSettings.skipDuplicates)
    setUpdateExisting(config.advancedSettings.updateExisting)
    setNotifyOnError(config.advancedSettings.notifyOnError)
    setNotifyOnSuccess(config.advancedSettings.notifyOnSuccess)
    setIncomeAccount(config.accountMappings?.revenueAccount || '')
    setArAccount(config.accountMappings?.receivablesAccount || '')
  }

  const loadPlatformData = async () => {
    if (!connection?._id) return

    try {
      setLoading(true)

      const [accountsRes, taxCodesRes] = await Promise.all([
        fetch(`/api/integrations/quickbooks/${connection._id}/accounts`),
        fetch(`/api/integrations/quickbooks/${connection._id}/tax-codes`),
      ])

      if (accountsRes.ok) {
        const data = await accountsRes.json()
        setAccounts(data.accounts || [])
      }

      if (taxCodesRes.ok) {
        const data = await taxCodesRes.json()
        setTaxCodes(data.taxCodes || [])
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
        platform: 'quickbooks',
        syncPreferences,
        syncFrequency,
        syncDirection: 'deskwise_to_platform',
        autoSync,
        taxSettings: {
          includeTax,
          defaultTaxRate: defaultTaxCode || undefined,
        },
        accountMappings: {
          revenueAccount: incomeAccount || undefined,
          receivablesAccount: arAccount || undefined,
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
        description: 'QuickBooks integration settings have been updated successfully.',
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
        description: 'QuickBooks connection is working properly.',
      })
    } catch (error) {
      console.error('Error testing connection:', error)
      toast({
        title: 'Connection Test Failed',
        description: 'Unable to connect to QuickBooks. Please check your settings.',
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
          <DialogTitle>QuickBooks Configuration</DialogTitle>
          <DialogDescription>
            Configure sync preferences and account mappings for QuickBooks
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
                <CardDescription>Choose what data to sync with QuickBooks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-sync-invoices">Invoices</Label>
                    <p className="text-sm text-muted-foreground">Sync invoices from Deskwise to QuickBooks</p>
                  </div>
                  <Switch
                    id="qb-sync-invoices"
                    checked={syncPreferences.invoices}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, invoices: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-sync-quotes">Estimates/Quotes</Label>
                    <p className="text-sm text-muted-foreground">Sync quotes as estimates in QuickBooks</p>
                  </div>
                  <Switch
                    id="qb-sync-quotes"
                    checked={syncPreferences.quotes}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, quotes: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-sync-customers">Customers</Label>
                    <p className="text-sm text-muted-foreground">Sync customer records to QuickBooks</p>
                  </div>
                  <Switch
                    id="qb-sync-customers"
                    checked={syncPreferences.customers}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, customers: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-sync-products">Products/Services</Label>
                    <p className="text-sm text-muted-foreground">Sync products and services to QuickBooks</p>
                  </div>
                  <Switch
                    id="qb-sync-products"
                    checked={syncPreferences.products}
                    onCheckedChange={(checked) =>
                      setSyncPreferences({ ...syncPreferences, products: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-sync-payments">Payments</Label>
                    <p className="text-sm text-muted-foreground">Sync payment records to QuickBooks</p>
                  </div>
                  <Switch
                    id="qb-sync-payments"
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
                  <Label htmlFor="qb-sync-frequency">Sync Frequency</Label>
                  <Select value={syncFrequency} onValueChange={(value) => setSyncFrequency(value as SyncFrequency)}>
                    <SelectTrigger id="qb-sync-frequency">
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
                    How often should data automatically sync to QuickBooks
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-auto-sync">Automatic Sync</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically sync data based on frequency setting
                    </p>
                  </div>
                  <Switch
                    id="qb-auto-sync"
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
                <CardTitle className="text-base">QuickBooks Accounts</CardTitle>
                <CardDescription>Map Deskwise transactions to QuickBooks accounts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="qb-income-account">Income Account</Label>
                      <Select value={incomeAccount} onValueChange={setIncomeAccount}>
                        <SelectTrigger id="qb-income-account">
                          <SelectValue placeholder="Select income account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.type === 'Income')
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Account for invoice line items
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="qb-ar-account">Accounts Receivable</Label>
                      <Select value={arAccount} onValueChange={setArAccount}>
                        <SelectTrigger id="qb-ar-account">
                          <SelectValue placeholder="Select A/R account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts
                            .filter((a) => a.type === 'Accounts Receivable')
                            .map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
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
                <CardDescription>Configure tax handling for QuickBooks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-include-tax">Include Tax</Label>
                    <p className="text-sm text-muted-foreground">
                      Include sales tax in synced invoices
                    </p>
                  </div>
                  <Switch
                    id="qb-include-tax"
                    checked={includeTax}
                    onCheckedChange={setIncludeTax}
                  />
                </div>

                {includeTax && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="qb-default-tax-code">Default Tax Code</Label>
                      <Select value={defaultTaxCode} onValueChange={setDefaultTaxCode}>
                        <SelectTrigger id="qb-default-tax-code">
                          <SelectValue placeholder="Select default tax code" />
                        </SelectTrigger>
                        <SelectContent>
                          {taxCodes.map((code) => (
                            <SelectItem key={code.id} value={code.id}>
                              {code.name} ({code.rate}%)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Tax code to use when none is specified
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
                    <Label htmlFor="qb-skip-duplicates">Skip Duplicates</Label>
                    <p className="text-sm text-muted-foreground">
                      Don't sync records that already exist in QuickBooks
                    </p>
                  </div>
                  <Switch
                    id="qb-skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={setSkipDuplicates}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-update-existing">Update Existing</Label>
                    <p className="text-sm text-muted-foreground">
                      Update existing records when syncing
                    </p>
                  </div>
                  <Switch
                    id="qb-update-existing"
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
                    <Label htmlFor="qb-notify-error">Notify on Error</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications when sync fails
                    </p>
                  </div>
                  <Switch
                    id="qb-notify-error"
                    checked={notifyOnError}
                    onCheckedChange={setNotifyOnError}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="qb-notify-success">Notify on Success</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications on successful sync
                    </p>
                  </div>
                  <Switch
                    id="qb-notify-success"
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
