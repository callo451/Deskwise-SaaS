'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2, MapPin, Building2, Home } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'

interface AssetLocation {
  _id: string
  name: string
  code: string
  type: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  parentId?: string
  fullPath?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  isActive: boolean
}

interface LocationFormData {
  name: string
  code: string
  type: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  parentId: string
  street: string
  city: string
  state: string
  zip: string
  country: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  notes: string
}

const LOCATION_TYPES = [
  { value: 'site', label: 'Site', variant: 'default' as const },
  { value: 'building', label: 'Building', variant: 'secondary' as const },
  { value: 'floor', label: 'Floor', variant: 'outline' as const },
  { value: 'room', label: 'Room', variant: 'outline' as const },
  { value: 'rack', label: 'Rack', variant: 'outline' as const },
  { value: 'remote', label: 'Remote', variant: 'secondary' as const },
]

export default function AssetLocationsPage() {
  const { toast } = useToast()
  const [locations, setLocations] = useState<AssetLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<AssetLocation | null>(null)
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    code: '',
    type: 'site',
    parentId: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/settings/asset-locations')
      if (!response.ok) throw new Error('Failed to fetch locations')
      const data = await response.json()
      setLocations(data)
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (location?: AssetLocation) => {
    if (location) {
      setEditingLocation(location)
      setFormData({
        name: location.name,
        code: location.code,
        type: location.type,
        parentId: location.parentId || '',
        street: location.address?.street || '',
        city: location.address?.city || '',
        state: location.address?.state || '',
        zip: location.address?.zip || '',
        country: location.address?.country || '',
        contactPerson: location.contactPerson || '',
        contactEmail: location.contactEmail || '',
        contactPhone: location.contactPhone || '',
        notes: location.notes || '',
      })
    } else {
      setEditingLocation(null)
      setFormData({
        name: '',
        code: '',
        type: 'site',
        parentId: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: '',
        contactPerson: '',
        contactEmail: '',
        contactPhone: '',
        notes: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingLocation
        ? `/api/settings/asset-locations/${editingLocation._id}`
        : '/api/settings/asset-locations'

      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        parentId: formData.parentId || undefined,
        address:
          formData.street || formData.city || formData.state || formData.zip || formData.country
            ? {
                street: formData.street || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                zip: formData.zip || undefined,
                country: formData.country || undefined,
              }
            : undefined,
        contactPerson: formData.contactPerson || undefined,
        contactEmail: formData.contactEmail || undefined,
        contactPhone: formData.contactPhone || undefined,
        notes: formData.notes || undefined,
      }

      const response = await fetch(url, {
        method: editingLocation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save location')
      }

      toast({
        title: 'Success',
        description: `Location ${editingLocation ? 'updated' : 'created'} successfully`,
      })

      setDialogOpen(false)
      fetchLocations()
    } catch (error: any) {
      console.error('Error saving location:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save location',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (location: AssetLocation) => {
    // Check if location has children
    const hasChildren = locations.some((loc) => loc.parentId === location._id)
    if (hasChildren) {
      toast({
        title: 'Error',
        description: 'Cannot delete location with child locations. Delete children first.',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the location "${location.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/asset-locations/${location._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete location')
      }

      toast({
        title: 'Success',
        description: 'Location deleted successfully',
      })

      fetchLocations()
    } catch (error: any) {
      console.error('Error deleting location:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete location',
        variant: 'destructive',
      })
    }
  }

  const getLocationTypeBadgeVariant = (type: string) => {
    const typeConfig = LOCATION_TYPES.find((t) => t.value === type)
    return typeConfig?.variant || 'default'
  }

  const getParentLocationOptions = () => {
    // Filter out the location being edited to prevent circular references
    return locations.filter(
      (loc) => loc._id !== editingLocation?._id && loc.isActive
    )
  }

  const stats = {
    total: locations.length,
    sites: locations.filter(l => l.type === 'site').length,
    buildings: locations.filter(l => l.type === 'building').length,
    rooms: locations.filter(l => l.type === 'room' || l.type === 'floor' || l.type === 'rack').length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Asset Locations"
        description="Manage physical and logical locations for asset organization"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<MapPin className="h-6 w-6 text-gray-600" />}
        actions={
          <Button onClick={() => handleOpenDialog()} className="bg-gray-600 hover:bg-gray-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700">Total Locations</CardDescription>
            <CardTitle className="text-3xl text-gray-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Sites</CardDescription>
            <CardTitle className="text-3xl">{stats.sites}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Buildings</CardDescription>
            <CardTitle className="text-3xl">{stats.buildings}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Rooms/Others</CardDescription>
              <CardTitle className="text-3xl">{stats.rooms}</CardTitle>
            </div>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            View and manage asset locations. Locations with children cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : locations.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No locations yet"
              description="Get started by adding your first location"
              action={{
                label: 'Add Location',
                onClick: () => handleOpenDialog(),
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Full Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {location.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {location.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLocationTypeBadgeVariant(location.type)}>
                        {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {location.fullPath || location.name}
                    </TableCell>
                    <TableCell>
                      {location.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(location)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(location)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update the location details below'
                : 'Create a new asset location'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Main Office"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="e.g., HQ"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentId">Parent Location</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value })
                  }
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder="None (top level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top level)</SelectItem>
                    {getParentLocationOptions().map((location) => (
                      <SelectItem key={location._id} value={location._id}>
                        {location.fullPath || location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optional: Create hierarchical location structure
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Address (Optional)</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="street">Street</Label>
                  <Input
                    id="street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="New York"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="NY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      setFormData({ ...formData, country: e.target.value })
                    }
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Contact Information (Optional)</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) =>
                      setFormData({ ...formData, contactPerson: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactEmail: e.target.value })
                      }
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPhone: e.target.value })
                      }
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this location"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name || !formData.code || !formData.type}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
