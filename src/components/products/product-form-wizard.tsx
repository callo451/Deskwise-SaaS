'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  DollarSign,
  Settings,
  Info,
} from 'lucide-react'

const categoryLabels: Record<string, string> = {
  managed_service: 'Managed Service',
  professional_service: 'Professional Service',
  hardware: 'Hardware',
  software: 'Software',
  license: 'License',
  support: 'Support',
  cloud_service: 'Cloud Service',
  security: 'Security',
  backup: 'Backup & DR',
  other: 'Other',
}

const typeLabels: Record<string, string> = {
  one_time: 'One-Time',
  recurring: 'Recurring',
  usage_based: 'Usage-Based',
}

const unitLabels: Record<string, string> = {
  hour: 'Hour',
  day: 'Day',
  month: 'Month',
  year: 'Year',
  each: 'Each',
  user: 'User',
  device: 'Device',
  license: 'License',
  gb: 'GB',
  tb: 'TB',
  seat: 'Seat',
}

interface ProductFormWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: any
  onSuccess?: () => void
}

export function ProductFormWizard({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductFormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    longDescription: product?.longDescription || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    type: product?.type || 'one_time',
    unitPrice: product?.unitPrice || 0,
    cost: product?.cost || 0,
    unitOfMeasure: product?.unitOfMeasure || 'each',
    minimumQuantity: product?.minimumQuantity || 1,
    defaultQuantity: product?.defaultQuantity || 1,
    vendor: product?.vendor || '',
    manufacturer: product?.manufacturer || '',
    partNumber: product?.partNumber || '',
    tags: product?.tags || [],
    isTaxable: product?.isTaxable ?? true,
    recurringInterval: product?.recurringInterval || 'monthly',
    isActive: product?.isActive ?? true,
  })

  const [tagInput, setTagInput] = useState('')

  const steps = [
    {
      title: 'Basic Information',
      description: 'Product identity and description',
      icon: Package,
    },
    {
      title: 'Pricing & Details',
      description: 'Pricing, units, and quantities',
      icon: DollarSign,
    },
    {
      title: 'Additional Info',
      description: 'Vendor, manufacturer, and tags',
      icon: Info,
    },
    {
      title: 'Settings',
      description: 'Tax and status configuration',
      icon: Settings,
    },
  ]

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 0) {
      if (!formData.sku || !formData.name || !formData.description || !formData.category) {
        setError('Please fill in all required fields')
        return
      }
    }
    if (currentStep === 1) {
      if (!formData.type || !formData.unitPrice || !formData.unitOfMeasure) {
        setError('Please fill in all required fields')
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
      const url = product ? `/api/products/${product._id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        onOpenChange(false)
        setCurrentStep(0)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setError(data.error || 'Failed to save product')
      }
    } catch (err) {
      console.error('Save product error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput && !formData.tags.includes(tagInput)) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const CurrentStepIcon = steps[currentStep].icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {CurrentStepIcon && <CurrentStepIcon className="w-5 h-5" />}
            {product ? 'Edit Product' : 'Create Product'}
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}: {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      index < currentStep
                        ? 'bg-primary border-primary text-primary-foreground'
                        : index === currentStep
                        ? 'border-primary text-primary'
                        : 'border-muted text-muted-foreground'
                    }`}
                  >
                    {index < currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                <p className="text-xs mt-1 text-center hidden sm:block">
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 transition-colors ${
                    index < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
            )
          })}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="MSP-MON-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="24/7 Network Monitoring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Continuous network monitoring and alerting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="longDescription">Detailed Description</Label>
                <Textarea
                  id="longDescription"
                  value={formData.longDescription}
                  onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                  placeholder="Comprehensive details about this product or service..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Optional subcategory"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Pricing & Details */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="type">Product Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.type === 'recurring' && (
                <div className="space-y-2">
                  <Label htmlFor="recurringInterval">Billing Interval</Label>
                  <Select
                    value={formData.recurringInterval}
                    onValueChange={(value) => setFormData({ ...formData, recurringInterval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Cost (Optional)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cost"
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit of Measure *</Label>
                <Select
                  value={formData.unitOfMeasure}
                  onValueChange={(value) => setFormData({ ...formData, unitOfMeasure: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultQuantity">Default Quantity</Label>
                  <Input
                    id="defaultQuantity"
                    type="number"
                    value={formData.defaultQuantity}
                    onChange={(e) => setFormData({ ...formData, defaultQuantity: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
                  <Input
                    id="minimumQuantity"
                    type="number"
                    value={formData.minimumQuantity}
                    onChange={(e) => setFormData({ ...formData, minimumQuantity: parseInt(e.target.value) || 1 })}
                    placeholder="1"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Additional Info */}
          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor</Label>
                  <Input
                    id="vendor"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    placeholder="Vendor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Manufacturer name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="Part or model number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 4: Settings */}
          {currentStep === 3 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Taxable Product</Label>
                    <p className="text-sm text-muted-foreground">
                      Apply taxes to this product
                    </p>
                  </div>
                  <Switch
                    checked={formData.isTaxable}
                    onCheckedChange={(checked) => setFormData({ ...formData, isTaxable: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Make product available in catalog
                    </p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Product Summary</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">SKU:</span> {formData.sku}</p>
                  <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
                  <p><span className="text-muted-foreground">Category:</span> {categoryLabels[formData.category] || '-'}</p>
                  <p><span className="text-muted-foreground">Type:</span> {typeLabels[formData.type]}</p>
                  <p><span className="text-muted-foreground">Price:</span> ${formData.unitPrice.toFixed(2)} per {unitLabels[formData.unitOfMeasure]}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  setCurrentStep(0)
                }}
              >
                Cancel
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
                  <Check className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
