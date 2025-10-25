'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Save,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface OrganizationData {
  name: string
  email?: string
  phone?: string
  website?: string
  address?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }
  taxId?: string
  taxIdLabel?: string
  registrationNumber?: string
  paymentInstructions?: {
    bankName?: string
    accountName?: string
    accountNumber?: string
    routingNumber?: string
    swiftCode?: string
    iban?: string
    bsb?: string
    onlinePaymentUrl?: string
    additionalInstructions?: string
    paymentMethods?: string[]
  }
  invoiceDefaults?: {
    paymentTerms: number
    defaultNotes?: string
    footerText?: string
    termsAndConditions?: string
    latePaymentFee?: {
      enabled: boolean
      type: 'percentage' | 'fixed'
      value: number
      gracePeriodDays?: number
    }
  }
}

const paymentMethodOptions = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'check', label: 'Check' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' },
]

export default function CompanySettingsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<OrganizationData>({
    name: '',
    invoiceDefaults: {
      paymentTerms: 30,
      latePaymentFee: {
        enabled: false,
        type: 'percentage',
        value: 0,
        gracePeriodDays: 10,
      },
    },
  })

  useEffect(() => {
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/organization')
      const data = await response.json()

      if (data.success && data.organization) {
        setOrganization({
          ...data.organization,
          invoiceDefaults: data.organization.invoiceDefaults || {
            paymentTerms: 30,
            latePaymentFee: {
              enabled: false,
              type: 'percentage',
              value: 0,
              gracePeriodDays: 10,
            },
          },
        })
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error)
      toast({
        title: 'Error',
        description: 'Failed to load organization settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/organization', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(organization),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Organization settings saved successfully',
        })
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Failed to save organization:', error)
      toast({
        title: 'Error',
        description: 'Failed to save organization settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateField = (path: string, value: any) => {
    setOrganization((prev) => {
      const keys = path.split('.')
      const newOrg = JSON.parse(JSON.stringify(prev))
      let current = newOrg

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value
      return newOrg
    })
  }

  const togglePaymentMethod = (method: string) => {
    const current = organization.paymentInstructions?.paymentMethods || []
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method]

    updateField('paymentInstructions.paymentMethods', updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure your organization's information for invoices and communications
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>
            Organization name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={organization.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="ACME MSP Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={organization.email || ''}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="billing@company.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={organization.phone || ''}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={organization.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.company.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Address */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <CardTitle>Business Address</CardTitle>
          </div>
          <CardDescription>
            Physical business address for invoices and legal documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={organization.address?.street || ''}
              onChange={(e) => updateField('address.street', e.target.value)}
              placeholder="123 Business Ave, Suite 100"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={organization.address?.city || ''}
                onChange={(e) => updateField('address.city', e.target.value)}
                placeholder="New York"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={organization.address?.state || ''}
                onChange={(e) => updateField('address.state', e.target.value)}
                placeholder="NY"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={organization.address?.postalCode || ''}
                onChange={(e) => updateField('address.postalCode', e.target.value)}
                placeholder="10001"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={organization.address?.country || ''}
                onChange={(e) => updateField('address.country', e.target.value)}
                placeholder="United States"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal & Tax Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle>Legal & Tax Information</CardTitle>
          </div>
          <CardDescription>
            Tax ID and registration numbers for invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID / EIN / VAT / ABN</Label>
              <Input
                id="taxId"
                value={organization.taxId || ''}
                onChange={(e) => updateField('taxId', e.target.value)}
                placeholder="12-3456789"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxIdLabel">Tax ID Label</Label>
              <Input
                id="taxIdLabel"
                value={organization.taxIdLabel || ''}
                onChange={(e) => updateField('taxIdLabel', e.target.value)}
                placeholder="EIN, VAT Number, ABN, etc."
              />
              <p className="text-xs text-muted-foreground">
                How the tax ID should be labeled on invoices
              </p>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="registrationNumber">Company Registration Number</Label>
              <Input
                id="registrationNumber"
                value={organization.registrationNumber || ''}
                onChange={(e) => updateField('registrationNumber', e.target.value)}
                placeholder="Registration #"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Instructions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle>Payment Instructions</CardTitle>
          </div>
          <CardDescription>
            Banking details and payment information for clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={organization.paymentInstructions?.bankName || ''}
                onChange={(e) => updateField('paymentInstructions.bankName', e.target.value)}
                placeholder="Chase Bank"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                value={organization.paymentInstructions?.accountName || ''}
                onChange={(e) => updateField('paymentInstructions.accountName', e.target.value)}
                placeholder="ACME MSP LLC"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (last 4 digits)</Label>
              <Input
                id="accountNumber"
                value={organization.paymentInstructions?.accountNumber || ''}
                onChange={(e) => updateField('paymentInstructions.accountNumber', e.target.value)}
                placeholder="1234"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                Only enter last 4 digits for security
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input
                id="routingNumber"
                value={organization.paymentInstructions?.routingNumber || ''}
                onChange={(e) => updateField('paymentInstructions.routingNumber', e.target.value)}
                placeholder="021000021"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="swiftCode">SWIFT Code</Label>
              <Input
                id="swiftCode"
                value={organization.paymentInstructions?.swiftCode || ''}
                onChange={(e) => updateField('paymentInstructions.swiftCode', e.target.value)}
                placeholder="CHASUS33"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                value={organization.paymentInstructions?.iban || ''}
                onChange={(e) => updateField('paymentInstructions.iban', e.target.value)}
                placeholder="GB29 NWBK 6016 1331 9268 19"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bsb">BSB (Australian banks)</Label>
              <Input
                id="bsb"
                value={organization.paymentInstructions?.bsb || ''}
                onChange={(e) => updateField('paymentInstructions.bsb', e.target.value)}
                placeholder="123-456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="onlinePaymentUrl">Online Payment URL</Label>
              <Input
                id="onlinePaymentUrl"
                value={organization.paymentInstructions?.onlinePaymentUrl || ''}
                onChange={(e) => updateField('paymentInstructions.onlinePaymentUrl', e.target.value)}
                placeholder="https://pay.company.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Accepted Payment Methods</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {paymentMethodOptions.map((method) => (
                <div key={method.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.value}
                    checked={organization.paymentInstructions?.paymentMethods?.includes(method.value)}
                    onCheckedChange={() => togglePaymentMethod(method.value)}
                  />
                  <label
                    htmlFor={method.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {method.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInstructions">Additional Payment Instructions</Label>
            <Textarea
              id="additionalInstructions"
              value={organization.paymentInstructions?.additionalInstructions || ''}
              onChange={(e) => updateField('paymentInstructions.additionalInstructions', e.target.value)}
              placeholder="Please include invoice number in payment memo..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Defaults */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <CardTitle>Invoice Defaults</CardTitle>
          </div>
          <CardDescription>
            Default settings for all new invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Default Payment Terms (NET days)</Label>
            <Input
              id="paymentTerms"
              type="number"
              value={organization.invoiceDefaults?.paymentTerms || 30}
              onChange={(e) => updateField('invoiceDefaults.paymentTerms', parseInt(e.target.value) || 30)}
              placeholder="30"
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Number of days clients have to pay invoices (e.g., 30 for NET 30)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultNotes">Default Invoice Notes</Label>
            <Textarea
              id="defaultNotes"
              value={organization.invoiceDefaults?.defaultNotes || ''}
              onChange={(e) => updateField('invoiceDefaults.defaultNotes', e.target.value)}
              placeholder="Thank you for your business..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="footerText">Invoice Footer Text</Label>
            <Textarea
              id="footerText"
              value={organization.invoiceDefaults?.footerText || ''}
              onChange={(e) => updateField('invoiceDefaults.footerText', e.target.value)}
              placeholder="Thank you for choosing us!"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
            <Textarea
              id="termsAndConditions"
              value={organization.invoiceDefaults?.termsAndConditions || ''}
              onChange={(e) => updateField('invoiceDefaults.termsAndConditions', e.target.value)}
              placeholder="Payment due within specified terms. Late fees may apply..."
              rows={4}
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="latePaymentEnabled"
                checked={organization.invoiceDefaults?.latePaymentFee?.enabled || false}
                onCheckedChange={(checked) => updateField('invoiceDefaults.latePaymentFee.enabled', checked)}
              />
              <label
                htmlFor="latePaymentEnabled"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable Late Payment Fees
              </label>
            </div>

            {organization.invoiceDefaults?.latePaymentFee?.enabled && (
              <div className="grid gap-4 md:grid-cols-3 pl-6">
                <div className="space-y-2">
                  <Label htmlFor="lateFeeType">Fee Type</Label>
                  <Select
                    value={organization.invoiceDefaults.latePaymentFee.type}
                    onValueChange={(value) => updateField('invoiceDefaults.latePaymentFee.type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lateFeeValue">
                    {organization.invoiceDefaults.latePaymentFee.type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
                  </Label>
                  <Input
                    id="lateFeeValue"
                    type="number"
                    value={organization.invoiceDefaults.latePaymentFee.value || 0}
                    onChange={(e) => updateField('invoiceDefaults.latePaymentFee.value', parseFloat(e.target.value) || 0)}
                    placeholder="5"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={organization.invoiceDefaults.latePaymentFee.gracePeriodDays || 10}
                    onChange={(e) => updateField('invoiceDefaults.latePaymentFee.gracePeriodDays', parseInt(e.target.value) || 10)}
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/settings')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
