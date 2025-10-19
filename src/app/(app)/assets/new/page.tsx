'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Sparkles, RefreshCw } from 'lucide-react'
import type { AssetCategory, AssetLocation, OrganizationAssetSettings } from '@/lib/types'

export default function NewAssetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [generatingTag, setGeneratingTag] = useState(false)

  // Dropdown options
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [locations, setLocations] = useState<AssetLocation[]>([])
  const [assetSettings, setAssetSettings] = useState<OrganizationAssetSettings | null>(null)

  const [formData, setFormData] = useState({
    assetTag: '',
    name: '',
    category: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyExpiry: '',
    assignedTo: '',
    location: '',
    status: '',
    purchaseCost: '',
    specifications: {} as Record<string, string>,
  })

  const [specKey, setSpecKey] = useState('')
  const [specValue, setSpecValue] = useState('')

  // Load categories, locations, and settings on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, locationsRes, settingsRes] = await Promise.all([
          fetch('/api/settings/asset-categories'),
          fetch('/api/settings/asset-locations'),
          fetch('/api/settings/asset-settings'),
        ])

        const [categoriesData, locationsData, settingsData] = await Promise.all([
          categoriesRes.json(),
          locationsRes.json(),
          settingsRes.json(),
        ])

        if (categoriesData.success) {
          setCategories(categoriesData.data.filter((c: AssetCategory) => c.isActive))
        }

        if (locationsData.success) {
          setLocations(locationsData.data)
        }

        if (settingsData.success && settingsData.data) {
          setAssetSettings(settingsData.data)
          // Set default status if available
          const defaultStatus = settingsData.data.lifecycleStatuses?.find((s: any) => s.isActive)
          if (defaultStatus) {
            setFormData(prev => ({ ...prev, status: defaultStatus.value }))
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoadingData(false)
      }
    }

    loadData()
  }, [])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleGenerateAssetTag = async () => {
    if (!formData.category) {
      alert('Please select a category first')
      return
    }

    setGeneratingTag(true)
    try {
      const response = await fetch('/api/settings/asset-settings/generate-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: formData.category }),
      })

      const data = await response.json()

      if (data.success) {
        setFormData(prev => ({ ...prev, assetTag: data.data.assetTag }))
      } else {
        alert(data.error || 'Failed to generate asset tag')
      }
    } catch (error) {
      console.error('Error generating asset tag:', error)
      alert('Failed to generate asset tag')
    } finally {
      setGeneratingTag(false)
    }
  }

  const handleAddSpecification = () => {
    if (specKey && specValue) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey]: specValue,
        },
      }))
      setSpecKey('')
      setSpecValue('')
    }
  }

  const handleRemoveSpecification = (key: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications }
      delete newSpecs[key]
      return { ...prev, specifications: newSpecs }
    })
  }

  // Helper to get location display name (hierarchical)
  const getLocationDisplayName = (location: AssetLocation): string => {
    return location.fullPath || location.name
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/assets/${data.data._id}`)
      } else {
        alert(data.error || 'Failed to create asset')
      }
    } catch (error) {
      console.error('Error creating asset:', error)
      alert('Failed to create asset')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading asset configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Link href="/assets">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Asset</h1>
          <p className="text-muted-foreground">Add a new IT asset to your inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core asset details and identification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  placeholder="e.g., Dell Latitude 5420"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                  disabled={categories.length === 0}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select a category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name} ({category.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assetTag">Asset Tag</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateAssetTag}
                    disabled={!formData.category || generatingTag}
                  >
                    {generatingTag ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                <Input
                  id="assetTag"
                  placeholder="Auto-generated or enter manually"
                  value={formData.assetTag}
                  onChange={(e) => handleChange('assetTag', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to auto-generate on save, or enter a custom tag
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Section */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
              <CardDescription>Location and user assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleChange('location', value)}
                  disabled={locations.length === 0}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder={locations.length === 0 ? "No locations available" : "Select a location"} />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {getLocationDisplayName(location)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Input
                  id="assignedTo"
                  placeholder="User ID or email"
                  value={formData.assignedTo}
                  onChange={(e) => handleChange('assignedTo', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange('status', value)}
                  disabled={!assetSettings?.lifecycleStatuses || assetSettings.lifecycleStatuses.length === 0}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {assetSettings?.lifecycleStatuses
                      ?.filter((s) => s.isActive)
                      .map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Hardware Details Section */}
          <Card>
            <CardHeader>
              <CardTitle>Hardware Details</CardTitle>
              <CardDescription>Manufacturer and device information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  placeholder="e.g., Dell, HP, Lenovo"
                  value={formData.manufacturer}
                  onChange={(e) => handleChange('manufacturer', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  placeholder="e.g., Latitude 5420"
                  value={formData.model}
                  onChange={(e) => handleChange('model', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  placeholder="e.g., 1234567890"
                  value={formData.serialNumber}
                  onChange={(e) => handleChange('serialNumber', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information Section */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Information</CardTitle>
              <CardDescription>Financial and warranty details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleChange('purchaseDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseCost">Purchase Cost ($)</Label>
                <Input
                  id="purchaseCost"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.purchaseCost}
                  onChange={(e) => handleChange('purchaseCost', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  value={formData.warrantyExpiry}
                  onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Specifications Section - Full Width */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
            <CardDescription>Add custom specifications for this asset (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                placeholder="Specification name (e.g., RAM, CPU)"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
              />
              <Input
                placeholder="Value (e.g., 16GB, Intel i7)"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={handleAddSpecification}>
                Add Specification
              </Button>
            </div>

            {Object.keys(formData.specifications).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-md">
                    <span className="text-sm">
                      <strong className="font-medium">{key}:</strong> {value}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSpecification(key)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(formData.specifications).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No specifications added yet. Add key-value pairs above.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Form Actions - Full Width */}
        <div className="flex gap-4 justify-end">
          <Link href="/assets">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={loading || !formData.name || !formData.category}>
            {loading ? 'Creating Asset...' : 'Create Asset'}
          </Button>
        </div>
      </form>
    </div>
  )
}
