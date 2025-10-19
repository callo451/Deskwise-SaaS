'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Shield,
  DollarSign,
  FileSignature,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface AgreementFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  clientName: string
  agreement?: any // Existing agreement for editing
  onSuccess?: () => void
}

interface FormData {
  // Basic Info
  name: string
  description: string
  type: 'msa' | 'sla' | 'sow' | 'maintenance'
  startDate: string
  endDate: string

  // SLA Config
  slaTier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'custom'
  timezone: string
  excludeHolidays: boolean

  // Custom SLA (if tier is custom)
  customResponseCritical: string
  customResponseHigh: string
  customResponseMedium: string
  customResponseLow: string
  customResolutionCritical: string
  customResolutionHigh: string
  customResolutionMedium: string
  customResolutionLow: string

  // Billing
  billingFrequency: 'monthly' | 'quarterly' | 'annually'
  billingAmount: string
  currency: string
  autoRenew: boolean
  renewalNoticeDays: string
  renewalTermMonths: string

  // Terms
  termsAndConditions: string
  customTerms: string
}

const steps = [
  {
    title: 'Basic Information',
    description: 'Agreement details and dates',
    icon: FileText,
  },
  {
    title: 'SLA Configuration',
    description: 'Service level targets',
    icon: Shield,
  },
  {
    title: 'Billing & Renewal',
    description: 'Pricing and billing terms',
    icon: DollarSign,
  },
  {
    title: 'Review & Create',
    description: 'Review and finalize',
    icon: FileSignature,
  },
]

const slaTierDefaults = {
  platinum: {
    response: { critical: 15, high: 30, medium: 120, low: 480 },
    resolution: { critical: 240, high: 480, medium: 1440, low: 2880 },
    availability: 99.9,
  },
  gold: {
    response: { critical: 30, high: 60, medium: 240, low: 720 },
    resolution: { critical: 480, high: 960, medium: 2880, low: 5760 },
    availability: 99.5,
  },
  silver: {
    response: { critical: 60, high: 120, medium: 480, low: 1440 },
    resolution: { critical: 960, high: 1920, medium: 5760, low: 11520 },
    availability: 99.0,
  },
  bronze: {
    response: { critical: 120, high: 240, medium: 960, low: 2880 },
    resolution: { critical: 1920, high: 3840, medium: 11520, low: 23040 },
    availability: 98.0,
  },
  custom: {
    response: { critical: 60, high: 120, medium: 480, low: 1440 },
    resolution: { critical: 480, high: 960, medium: 2880, low: 5760 },
    availability: 99.0,
  },
}

const minutesToHours = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

export function AgreementFormWizard({
  open,
  onOpenChange,
  clientId,
  clientName,
  agreement,
  onSuccess,
}: AgreementFormWizardProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'sla',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    slaTier: 'silver',
    timezone: 'America/New_York',
    excludeHolidays: true,
    customResponseCritical: '60',
    customResponseHigh: '120',
    customResponseMedium: '480',
    customResponseLow: '1440',
    customResolutionCritical: '480',
    customResolutionHigh: '960',
    customResolutionMedium: '2880',
    customResolutionLow: '5760',
    billingFrequency: 'monthly',
    billingAmount: '',
    currency: 'USD',
    autoRenew: false,
    renewalNoticeDays: '30',
    renewalTermMonths: '12',
    termsAndConditions: '',
    customTerms: '',
  })

  // Load agreement data if editing
  useEffect(() => {
    if (agreement && open) {
      setFormData({
        name: agreement.name || '',
        description: agreement.description || '',
        type: agreement.type || 'sla',
        startDate: agreement.startDate ? new Date(agreement.startDate).toISOString().split('T')[0] : '',
        endDate: agreement.endDate ? new Date(agreement.endDate).toISOString().split('T')[0] : '',
        slaTier: agreement.sla?.tier || 'silver',
        timezone: agreement.sla?.businessHours?.timezone || 'America/New_York',
        excludeHolidays: agreement.sla?.excludeHolidays ?? true,
        customResponseCritical: agreement.sla?.responseTime?.critical?.toString() || '60',
        customResponseHigh: agreement.sla?.responseTime?.high?.toString() || '120',
        customResponseMedium: agreement.sla?.responseTime?.medium?.toString() || '480',
        customResponseLow: agreement.sla?.responseTime?.low?.toString() || '1440',
        customResolutionCritical: agreement.sla?.resolutionTime?.critical?.toString() || '480',
        customResolutionHigh: agreement.sla?.resolutionTime?.high?.toString() || '960',
        customResolutionMedium: agreement.sla?.resolutionTime?.medium?.toString() || '2880',
        customResolutionLow: agreement.sla?.resolutionTime?.low?.toString() || '5760',
        billingFrequency: agreement.billing?.frequency || 'monthly',
        billingAmount: agreement.billing?.amount?.toString() || '',
        currency: agreement.billing?.currency || 'USD',
        autoRenew: agreement.renewal?.autoRenew || false,
        renewalNoticeDays: agreement.renewal?.renewalNoticeDays?.toString() || '30',
        renewalTermMonths: agreement.renewal?.renewalTermMonths?.toString() || '12',
        termsAndConditions: agreement.termsAndConditions || '',
        customTerms: agreement.customTerms || '',
      })
    }
  }, [agreement, open])

  const handleNext = () => {
    // Validate current step
    if (currentStep === 0) {
      if (!formData.name || !formData.type || !formData.startDate) {
        setError('Please fill in all required fields')
        return
      }
    }

    if (currentStep === 2) {
      if (!formData.billingAmount || parseFloat(formData.billingAmount) <= 0) {
        setError('Please enter a valid billing amount')
        return
      }
    }

    setError('')
    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      // Prepare agreement data
      const agreementData = {
        clientId,
        clientName,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        startDate: new Date(formData.startDate),
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
        sla: {
          tier: formData.slaTier,
          responseTime:
            formData.slaTier === 'custom'
              ? {
                  critical: parseInt(formData.customResponseCritical),
                  high: parseInt(formData.customResponseHigh),
                  medium: parseInt(formData.customResponseMedium),
                  low: parseInt(formData.customResponseLow),
                }
              : slaTierDefaults[formData.slaTier].response,
          resolutionTime:
            formData.slaTier === 'custom'
              ? {
                  critical: parseInt(formData.customResolutionCritical),
                  high: parseInt(formData.customResolutionHigh),
                  medium: parseInt(formData.customResolutionMedium),
                  low: parseInt(formData.customResolutionLow),
                }
              : slaTierDefaults[formData.slaTier].resolution,
          availability:
            formData.slaTier !== 'custom' ? slaTierDefaults[formData.slaTier].availability : 99.0,
          businessHours: {
            timezone: formData.timezone,
            monday: { enabled: true, start: '08:00', end: '17:00' },
            tuesday: { enabled: true, start: '08:00', end: '17:00' },
            wednesday: { enabled: true, start: '08:00', end: '17:00' },
            thursday: { enabled: true, start: '08:00', end: '17:00' },
            friday: { enabled: true, start: '08:00', end: '17:00' },
            saturday: { enabled: false, start: '08:00', end: '17:00' },
            sunday: { enabled: false, start: '08:00', end: '17:00' },
          },
          excludeHolidays: formData.excludeHolidays,
        },
        billing: {
          frequency: formData.billingFrequency,
          amount: parseFloat(formData.billingAmount),
          currency: formData.currency,
          nextBillingDate: new Date(formData.startDate),
          autoRenewal: formData.autoRenew,
        },
        renewal: {
          autoRenew: formData.autoRenew,
          renewalNoticeDays: parseInt(formData.renewalNoticeDays),
          renewalTermMonths: parseInt(formData.renewalTermMonths),
          renewalHistory: [],
        },
        termsAndConditions: formData.termsAndConditions,
        customTerms: formData.customTerms,
        coveredServices: [],
        documents: [],
        tags: [],
      }

      const url = agreement ? `/api/agreements/${agreement._id}` : '/api/agreements'
      const method = agreement ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agreementData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: agreement
            ? 'Agreement updated successfully'
            : 'Agreement created successfully',
        })
        onSuccess?.()
        onOpenChange(false)
        // Reset form
        setCurrentStep(0)
      } else {
        setError(data.error || 'Failed to save agreement')
      }
    } catch (error) {
      console.error('Error saving agreement:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const CurrentStepIcon = steps[currentStep].icon
  const selectedTier = formData.slaTier !== 'custom' ? slaTierDefaults[formData.slaTier] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {CurrentStepIcon && <CurrentStepIcon className="w-5 h-5" />}
            {agreement ? 'Edit Agreement' : 'Create New Agreement'}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 mb-2 ${
                      isCompleted
                        ? 'bg-primary border-primary text-primary-foreground'
                        : isCurrent
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <p
                    className={`text-xs text-center ${
                      isCurrent ? 'font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-2 mt-[-20px] ${
                      isCompleted ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-red-500/10 border border-red-200 text-red-600 mb-4">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Basic Information */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Agreement Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Managed IT Services Agreement"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">
                  Agreement Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value: any) => updateField('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="msa">Master Service Agreement (MSA)</SelectItem>
                    <SelectItem value="sla">Service Level Agreement (SLA)</SelectItem>
                    <SelectItem value="sow">Statement of Work (SOW)</SelectItem>
                    <SelectItem value="maintenance">Maintenance Agreement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the purpose and scope of this agreement..."
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Start Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                />
              </div>
            </div>

            <div className="p-4 rounded-md bg-blue-500/10 border border-blue-200">
              <p className="text-sm text-blue-600">
                <strong>Client:</strong> {clientName}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: SLA Configuration */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>SLA Tier</Label>
              <div className="grid gap-3 md:grid-cols-2">
                {(['platinum', 'gold', 'silver', 'bronze'] as const).map((tier) => (
                  <Card
                    key={tier}
                    className={`cursor-pointer transition-all ${
                      formData.slaTier === tier
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => updateField('slaTier', tier)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base capitalize">{tier}</CardTitle>
                      <CardDescription className="text-xs">
                        {slaTierDefaults[tier].availability}% Availability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Critical Response:</span>
                        <span className="font-medium">
                          {minutesToHours(slaTierDefaults[tier].response.critical)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Critical Resolution:</span>
                        <span className="font-medium">
                          {minutesToHours(slaTierDefaults[tier].resolution.critical)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => updateField('slaTier', 'custom')}
              >
                {formData.slaTier === 'custom' && <CheckCircle2 className="w-4 h-4 mr-2" />}
                Custom SLA Configuration
              </Button>
            </div>

            {formData.slaTier === 'custom' && (
              <div className="space-y-4 p-4 border rounded-md">
                <p className="text-sm font-medium">Custom Response Times (minutes)</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="customResponseCritical">Critical</Label>
                    <Input
                      id="customResponseCritical"
                      type="number"
                      value={formData.customResponseCritical}
                      onChange={(e) => updateField('customResponseCritical', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResponseHigh">High</Label>
                    <Input
                      id="customResponseHigh"
                      type="number"
                      value={formData.customResponseHigh}
                      onChange={(e) => updateField('customResponseHigh', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResponseMedium">Medium</Label>
                    <Input
                      id="customResponseMedium"
                      type="number"
                      value={formData.customResponseMedium}
                      onChange={(e) => updateField('customResponseMedium', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResponseLow">Low</Label>
                    <Input
                      id="customResponseLow"
                      type="number"
                      value={formData.customResponseLow}
                      onChange={(e) => updateField('customResponseLow', e.target.value)}
                    />
                  </div>
                </div>

                <p className="text-sm font-medium">Custom Resolution Times (minutes)</p>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="customResolutionCritical">Critical</Label>
                    <Input
                      id="customResolutionCritical"
                      type="number"
                      value={formData.customResolutionCritical}
                      onChange={(e) => updateField('customResolutionCritical', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResolutionHigh">High</Label>
                    <Input
                      id="customResolutionHigh"
                      type="number"
                      value={formData.customResolutionHigh}
                      onChange={(e) => updateField('customResolutionHigh', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResolutionMedium">Medium</Label>
                    <Input
                      id="customResolutionMedium"
                      type="number"
                      value={formData.customResolutionMedium}
                      onChange={(e) => updateField('customResolutionMedium', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customResolutionLow">Low</Label>
                    <Input
                      id="customResolutionLow"
                      type="number"
                      value={formData.customResolutionLow}
                      onChange={(e) => updateField('customResolutionLow', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => updateField('timezone', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 mt-8">
                <Switch
                  id="excludeHolidays"
                  checked={formData.excludeHolidays}
                  onCheckedChange={(checked) => updateField('excludeHolidays', checked)}
                />
                <Label htmlFor="excludeHolidays">Exclude holidays from SLA</Label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Billing & Renewal */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="billingAmount">
                  Billing Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="billingAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.billingAmount}
                  onChange={(e) => updateField('billingAmount', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => updateField('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="billingFrequency">Billing Frequency</Label>
                <Select
                  value={formData.billingFrequency}
                  onValueChange={(value: any) => updateField('billingFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoRenew"
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => updateField('autoRenew', checked)}
                />
                <Label htmlFor="autoRenew">Enable automatic renewal</Label>
              </div>

              {formData.autoRenew && (
                <div className="grid gap-4 md:grid-cols-2 pl-8">
                  <div className="space-y-2">
                    <Label htmlFor="renewalNoticeDays">Renewal Notice (days)</Label>
                    <Input
                      id="renewalNoticeDays"
                      type="number"
                      value={formData.renewalNoticeDays}
                      onChange={(e) => updateField('renewalNoticeDays', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Days before expiry to send renewal notice
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="renewalTermMonths">Renewal Term (months)</Label>
                    <Input
                      id="renewalTermMonths"
                      type="number"
                      value={formData.renewalTermMonths}
                      onChange={(e) => updateField('renewalTermMonths', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Length of renewal period</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agreement Summary</CardTitle>
                <CardDescription>Review the details before creating</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Agreement Name</p>
                    <p className="font-medium">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline" className="capitalize">
                      {formData.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">{clientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Period</p>
                    <p className="font-medium">
                      {new Date(formData.startDate).toLocaleDateString()} -{' '}
                      {formData.endDate
                        ? new Date(formData.endDate).toLocaleDateString()
                        : 'Ongoing'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">SLA Configuration</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="capitalize">
                      {formData.slaTier} Tier
                    </Badge>
                    {selectedTier && (
                      <span className="text-sm text-muted-foreground">
                        {selectedTier.availability}% Availability
                      </span>
                    )}
                  </div>
                  {selectedTier && (
                    <div className="grid gap-2 md:grid-cols-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Critical Response:</span>{' '}
                        <span className="font-medium">
                          {minutesToHours(selectedTier.response.critical)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Critical Resolution:</span>{' '}
                        <span className="font-medium">
                          {minutesToHours(selectedTier.resolution.critical)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Billing</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: formData.currency,
                        }).format(parseFloat(formData.billingAmount || '0'))}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {formData.billingFrequency}
                      </p>
                    </div>
                    {formData.autoRenew && (
                      <Badge variant="secondary">Auto-renews</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={loading}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : agreement ? 'Update Agreement' : 'Create Agreement'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
