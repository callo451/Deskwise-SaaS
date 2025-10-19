'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Trash2, Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { AssetCategory, AssetLocation } from '@/lib/types'

interface Asset {
  _id: string
  assetTag: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  status: 'active' | 'maintenance' | 'retired' | 'disposed'
  assignedTo?: string
  clientId?: string
  location?: string
  purchaseDate?: string
  warrantyExpiry?: string
  purchaseCost?: number
  specifications?: Record<string, string>
  maintenanceSchedule?: string
  lastMaintenanceDate?: string
  notes?: string
  // System Information (collected by agent)
  systemInfo?: {
    osName?: string
    osVersion?: string
    platform?: string
  }
  // Hardware Information (collected by agent)
  hardwareInfo?: {
    manufacturer?: string
    model?: string
    serialNumber?: string
    cpuModel?: string
    cpuCores?: number
    totalMemoryGB?: number
  }
  // Network Information (collected by agent)
  networkInfo?: {
    primaryMac?: string
    primaryIp?: string
  }
}

export default function EditAssetPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [asset, setAsset] = useState<Asset | null>(null)

  // Dropdown options
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [locations, setLocations] = useState<AssetLocation[]>([])

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'active' as 'active' | 'maintenance' | 'retired' | 'disposed',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: '',
    assignedTo: '',
    purchaseDate: '',
    warrantyExpiry: '',
    purchaseCost: '',
    notes: '',
  })

  useEffect(() => {
    if (params.id) {
      fetchAsset()
      fetchCategories()
      fetchLocations()
    }
  }, [params.id])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const assetData = data.data
        setAsset(assetData)

        // Populate form with current data
        setFormData({
          name: assetData.name || '',
          category: assetData.category || '',
          status: assetData.status || 'active',
          manufacturer: assetData.manufacturer || '',
          model: assetData.model || '',
          serialNumber: assetData.serialNumber || '',
          location: assetData.location || '',
          assignedTo: assetData.assignedTo || '',
          purchaseDate: assetData.purchaseDate ? new Date(assetData.purchaseDate).toISOString().split('T')[0] : '',
          warrantyExpiry: assetData.warrantyExpiry ? new Date(assetData.warrantyExpiry).toISOString().split('T')[0] : '',
          purchaseCost: assetData.purchaseCost?.toString() || '',
          notes: assetData.notes || '',
        })
      }
    } catch (error) {
      console.error('Error fetching asset:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/settings/asset-categories')
      const data = await response.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/settings/asset-locations')
      const data = await response.json()
      setLocations(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          status: formData.status,
          // Only send hardware fields if NOT from agent
          manufacturer: !asset?.hardwareInfo?.manufacturer ? formData.manufacturer : undefined,
          model: !asset?.hardwareInfo?.model ? formData.model : undefined,
          serialNumber: !asset?.hardwareInfo?.serialNumber ? formData.serialNumber : undefined,
          // Always editable manual fields
          location: formData.location,
          assignedTo: formData.assignedTo,
          purchaseDate: formData.purchaseDate,
          warrantyExpiry: formData.warrantyExpiry,
          purchaseCost: formData.purchaseCost ? parseFloat(formData.purchaseCost) : undefined,
          notes: formData.notes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/assets/${params.id}`)
      } else {
        alert(data.error || 'Failed to update asset')
      }
    } catch (error) {
      console.error('Error updating asset:', error)
      alert('Failed to update asset')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/assets/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/dashboard/assets')
      } else {
        console.error('Failed to delete asset')
        setDeleting(false)
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      setDeleting(false)
    }
  }

  // Check if hardware fields are from agent
  const isHardwareFromAgent = !!(asset?.hardwareInfo?.manufacturer || asset?.hardwareInfo?.model || asset?.hardwareInfo?.serialNumber)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading asset...</p>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Asset Not Found</h2>
        <Link href="/assets">
          <Button>Back to Assets</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/assets" className="hover:text-foreground">Assets</Link>
        <span>/</span>
        <Link href={`/dashboard/assets/${asset._id}`} className="hover:text-foreground">{asset.name}</Link>
        <span>/</span>
        <span className="text-foreground">Edit</span>
      </div>

      <div className="flex items-center gap-4">
        <Link href={`/dashboard/assets/${asset._id}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="font-mono">{asset.assetTag}</Badge>
            <span className="text-muted-foreground">{asset.name}</span>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              <Trash2 className="w-4 h-4 mr-2" />
              {deleting ? 'Deleting...' : 'Delete Asset'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{asset.name}</strong> ({asset.assetTag})?
                This action cannot be undone and will remove all associated performance data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? 'Deleting...' : 'Delete Asset'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Editable Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core asset details (always editable)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetTag">Asset Tag</Label>
                  <Input
                    id="assetTag"
                    value={asset.assetTag}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated, cannot be modified</p>
                </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category <span className="text-destructive">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                    <SelectTrigger id="category"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat._id.toString()} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="Desktop">Desktop</SelectItem>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Network Device">Network Device</SelectItem>
                          <SelectItem value="Printer">Printer</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                          <SelectItem value="Peripherals">Peripherals</SelectItem>
                          <SelectItem value="Mobile Device">Mobile Device</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                  <Select value={formData.status} onValueChange={(value: any) => handleChange('status', value)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hardware Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Hardware Information
                {isHardwareFromAgent && (
                  <Badge variant="secondary" className="text-xs">
                    Auto-Collected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isHardwareFromAgent
                  ? 'These fields were collected by the monitoring agent and cannot be edited'
                  : 'Manufacturer, model, and serial number details'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g., Dell"
                    value={isHardwareFromAgent && asset.hardwareInfo?.manufacturer
                      ? asset.hardwareInfo.manufacturer
                      : formData.manufacturer}
                    onChange={(e) => handleChange('manufacturer', e.target.value)}
                    disabled={isHardwareFromAgent}
                    className={isHardwareFromAgent ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Latitude 5420"
                    value={isHardwareFromAgent && asset.hardwareInfo?.model
                      ? asset.hardwareInfo.model
                      : formData.model}
                    onChange={(e) => handleChange('model', e.target.value)}
                    disabled={isHardwareFromAgent}
                    className={isHardwareFromAgent ? 'bg-muted' : ''}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    placeholder="e.g., 1234567890"
                    value={isHardwareFromAgent && asset.hardwareInfo?.serialNumber
                      ? asset.hardwareInfo.serialNumber
                      : formData.serialNumber}
                    onChange={(e) => handleChange('serialNumber', e.target.value)}
                    disabled={isHardwareFromAgent}
                    className={isHardwareFromAgent ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              {isHardwareFromAgent && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md text-sm">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-blue-900 dark:text-blue-100">
                    These fields are automatically collected from the monitoring agent and are read-only to maintain data accuracy.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Manual Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Location & Assignment</CardTitle>
              <CardDescription>Always editable manual fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={formData.location} onValueChange={(value) => handleChange('location', value)}>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.length > 0 ? (
                        locations.map((loc) => (
                          <SelectItem key={loc._id.toString()} value={loc.fullPath || loc.name}>
                            {loc.fullPath || loc.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="No locations available" disabled>
                          No locations configured
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    placeholder="User name or ID"
                    value={formData.assignedTo}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Will be user selector in future update</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiry"
                    type="date"
                    value={formData.warrantyExpiry}
                    onChange={(e) => handleChange('warrantyExpiry', e.target.value)}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={4}
                  placeholder="Additional notes about this asset..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Link href={`/dashboard/assets/${asset._id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>

        {/* Right Column - Read-Only System Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* System Information */}
          {asset.systemInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
                <CardDescription>Read-only data from agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {asset.systemInfo.platform && (
                  <div>
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="font-medium ml-2">{asset.systemInfo.platform}</span>
                  </div>
                )}
                {asset.systemInfo.osName && (
                  <div>
                    <span className="text-muted-foreground">OS:</span>
                    <span className="font-medium ml-2">{asset.systemInfo.osName}</span>
                  </div>
                )}
                {asset.systemInfo.osVersion && (
                  <div>
                    <span className="text-muted-foreground">Version:</span>
                    <span className="font-medium ml-2">{asset.systemInfo.osVersion}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hardware Details */}
          {asset.hardwareInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hardware Details</CardTitle>
                <CardDescription>Read-only data from agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {asset.hardwareInfo.cpuModel && (
                  <div>
                    <span className="text-muted-foreground">CPU:</span>
                    <span className="font-medium ml-2">{asset.hardwareInfo.cpuModel}</span>
                  </div>
                )}
                {asset.hardwareInfo.cpuCores && (
                  <div>
                    <span className="text-muted-foreground">CPU Cores:</span>
                    <span className="font-medium ml-2">{asset.hardwareInfo.cpuCores} cores</span>
                  </div>
                )}
                {asset.hardwareInfo.totalMemoryGB && (
                  <div>
                    <span className="text-muted-foreground">Memory:</span>
                    <span className="font-medium ml-2">{asset.hardwareInfo.totalMemoryGB.toFixed(2)} GB</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Network Information */}
          {asset.networkInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Network Information</CardTitle>
                <CardDescription>Read-only data from agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {asset.networkInfo.primaryIp && (
                  <div>
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-medium ml-2 font-mono">{asset.networkInfo.primaryIp}</span>
                  </div>
                )}
                {asset.networkInfo.primaryMac && (
                  <div>
                    <span className="text-muted-foreground">MAC Address:</span>
                    <span className="font-medium ml-2 font-mono">{asset.networkInfo.primaryMac}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!asset.systemInfo && !asset.hardwareInfo && !asset.networkInfo && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">No Agent Data</CardTitle>
                <CardDescription>This asset has no monitoring agent installed</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Install the monitoring agent to automatically collect system, hardware, and network information.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </form>
    </div>
  )
}
