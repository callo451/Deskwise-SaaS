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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Plus, Pencil, Trash2, Loader2, Tag, AlertCircle, Settings2, BarChart3 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SettingsHeader } from '@/components/settings/settings-header'

interface AssetSettings {
  _id?: string
  assetTagFormat: {
    prefix?: string
    includeCategoryCode: boolean
    sequenceLength: number
    suffix?: string
    separator: string
    example?: string
  }
  lifecycleStatuses: Array<{
    value: string
    label: string
    color: string
    isActive: boolean
  }>
  defaultCategory?: string
  requireApprovalForAssignment: boolean
  trackAssignmentHistory: boolean
  enableAutoDiscovery: boolean
  maintenanceReminderDays: number
}

interface AssetCategory {
  _id: string
  name: string
  code: string
}

interface StatusFormData {
  value: string
  label: string
  color: string
}

export default function AssetSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [editingStatus, setEditingStatus] = useState<number | null>(null)
  const [statusFormData, setStatusFormData] = useState<StatusFormData>({
    value: '',
    label: '',
    color: '#6366f1',
  })

  const [settings, setSettings] = useState<AssetSettings>({
    assetTagFormat: {
      includeCategoryCode: true,
      sequenceLength: 4,
      separator: '-',
      example: '',
    },
    lifecycleStatuses: [
      { value: 'active', label: 'Active', color: '#10b981', isActive: true },
      { value: 'maintenance', label: 'In Maintenance', color: '#f59e0b', isActive: true },
      { value: 'retired', label: 'Retired', color: '#6b7280', isActive: true },
      { value: 'disposed', label: 'Disposed', color: '#ef4444', isActive: true },
    ],
    requireApprovalForAssignment: false,
    trackAssignmentHistory: true,
    enableAutoDiscovery: false,
    maintenanceReminderDays: 30,
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    // Update example whenever format changes
    const example = generateExampleTag()
    setSettings((prev) => ({
      ...prev,
      assetTagFormat: {
        ...prev.assetTagFormat,
        example,
      },
    }))
  }, [
    settings.assetTagFormat.prefix,
    settings.assetTagFormat.includeCategoryCode,
    settings.assetTagFormat.sequenceLength,
    settings.assetTagFormat.suffix,
    settings.assetTagFormat.separator,
  ])

  const fetchData = async () => {
    try {
      // Fetch settings
      const settingsResponse = await fetch('/api/settings/asset-settings')
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setSettings(settingsData)
      }

      // Fetch categories for dropdown
      const categoriesResponse = await fetch('/api/settings/asset-categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.filter((cat: AssetCategory) => cat))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const generateExampleTag = (): string => {
    const parts: string[] = []
    const { prefix, includeCategoryCode, sequenceLength, suffix, separator } = settings.assetTagFormat

    if (prefix) parts.push(prefix)
    if (includeCategoryCode) parts.push('COMP') // Example category code

    const sequence = '0'.repeat(sequenceLength)
    parts.push(sequence)

    if (suffix) parts.push(suffix)

    return parts.join(separator)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/asset-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error: any) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleOpenStatusDialog = (index?: number) => {
    if (index !== undefined) {
      const status = settings.lifecycleStatuses[index]
      setEditingStatus(index)
      setStatusFormData({
        value: status.value,
        label: status.label,
        color: status.color,
      })
    } else {
      setEditingStatus(null)
      setStatusFormData({
        value: '',
        label: '',
        color: '#6366f1',
      })
    }
    setStatusDialogOpen(true)
  }

  const handleSaveStatus = () => {
    if (!statusFormData.value || !statusFormData.label) {
      toast({
        title: 'Validation Error',
        description: 'Value and label are required',
        variant: 'destructive',
      })
      return
    }

    const newStatuses = [...settings.lifecycleStatuses]

    if (editingStatus !== null) {
      // Editing existing status
      newStatuses[editingStatus] = {
        ...newStatuses[editingStatus],
        label: statusFormData.label,
        color: statusFormData.color,
      }
    } else {
      // Adding new status
      newStatuses.push({
        value: statusFormData.value.toLowerCase().replace(/\s+/g, '_'),
        label: statusFormData.label,
        color: statusFormData.color,
        isActive: true,
      })
    }

    setSettings((prev) => ({
      ...prev,
      lifecycleStatuses: newStatuses,
    }))

    setStatusDialogOpen(false)
  }

  const handleToggleStatus = (index: number) => {
    const newStatuses = [...settings.lifecycleStatuses]
    newStatuses[index].isActive = !newStatuses[index].isActive
    setSettings((prev) => ({
      ...prev,
      lifecycleStatuses: newStatuses,
    }))
  }

  const handleDeleteStatus = (index: number) => {
    const status = settings.lifecycleStatuses[index]
    const defaultStatuses = ['active', 'maintenance', 'retired', 'disposed']

    if (defaultStatuses.includes(status.value)) {
      toast({
        title: 'Cannot Delete',
        description: 'System statuses cannot be deleted, only deactivated',
        variant: 'destructive',
      })
      return
    }

    const newStatuses = settings.lifecycleStatuses.filter((_, i) => i !== index)
    setSettings((prev) => ({
      ...prev,
      lifecycleStatuses: newStatuses,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
      </div>
    )
  }

  const stats = {
    tagFormat: settings.assetTagFormat.example || generateExampleTag(),
    lifecycleStatuses: settings.lifecycleStatuses.length,
    activeStatuses: settings.lifecycleStatuses.filter(s => s.isActive).length,
    categories: categories.length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Asset Settings"
        description="Configure asset tag generation and lifecycle management"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Tag className="h-6 w-6 text-gray-600" />}
        actions={
          <Button onClick={handleSave} disabled={saving} className="bg-gray-600 hover:bg-gray-700">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700">Tag Format Preview</CardDescription>
            <CardTitle className="text-xl font-mono text-gray-900">{stats.tagFormat}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Lifecycle Statuses</CardDescription>
            <CardTitle className="text-3xl">{stats.lifecycleStatuses}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Statuses</CardDescription>
            <CardTitle className="text-3xl">{stats.activeStatuses}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Categories</CardDescription>
              <CardTitle className="text-3xl">{stats.categories}</CardTitle>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      {/* Asset Tag Format Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-gray-600" />
            <CardTitle>Asset Tag Format</CardTitle>
          </div>
          <CardDescription>
            Configure how asset tags are automatically generated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prefix">Prefix (Optional)</Label>
              <Input
                id="prefix"
                placeholder="e.g., ACME-"
                value={settings.assetTagFormat.prefix || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    assetTagFormat: {
                      ...prev.assetTagFormat,
                      prefix: e.target.value,
                    },
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Text to appear at the beginning of asset tags
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="suffix">Suffix (Optional)</Label>
              <Input
                id="suffix"
                placeholder="e.g., -2024"
                value={settings.assetTagFormat.suffix || ''}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    assetTagFormat: {
                      ...prev.assetTagFormat,
                      suffix: e.target.value,
                    },
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Text to appear at the end of asset tags
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sequenceLength">Sequence Length</Label>
              <Input
                id="sequenceLength"
                type="number"
                min={1}
                max={10}
                value={settings.assetTagFormat.sequenceLength}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    assetTagFormat: {
                      ...prev.assetTagFormat,
                      sequenceLength: Math.max(1, Math.min(10, parseInt(e.target.value) || 4)),
                    },
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Number of digits for sequence (1-10)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="separator">Separator</Label>
              <Input
                id="separator"
                placeholder="-"
                maxLength={1}
                value={settings.assetTagFormat.separator}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    assetTagFormat: {
                      ...prev.assetTagFormat,
                      separator: e.target.value || '-',
                    },
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Character between tag parts (single character)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeCategoryCode"
              checked={settings.assetTagFormat.includeCategoryCode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  assetTagFormat: {
                    ...prev.assetTagFormat,
                    includeCategoryCode: checked as boolean,
                  },
                }))
              }
            />
            <Label htmlFor="includeCategoryCode" className="cursor-pointer">
              Include category code in asset tag
            </Label>
          </div>

          {/* Example Preview */}
          <div className="p-4 rounded-lg bg-gray-50/50 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Live Preview</span>
            </div>
            <div className="text-2xl font-mono font-bold text-gray-900">
              {settings.assetTagFormat.example || generateExampleTag()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              This is how your asset tags will look
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Statuses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lifecycle Statuses</CardTitle>
              <CardDescription>
                Manage asset lifecycle statuses and their colors
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenStatusDialog()} className="bg-gray-600 hover:bg-gray-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.lifecycleStatuses.map((status, index) => (
                <TableRow key={status.value}>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                      {status.value}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge style={{ backgroundColor: status.color, color: '#fff' }}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {status.color}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={status.isActive}
                      onCheckedChange={() => handleToggleStatus(index)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenStatusDialog(index)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStatus(index)}
                        disabled={['active', 'maintenance', 'retired', 'disposed'].includes(status.value)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* General Settings Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-gray-600" />
            <CardTitle>General Settings</CardTitle>
          </div>
          <CardDescription>
            Additional asset management preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultCategory">Default Category</Label>
            <Select
              value={settings.defaultCategory || ''}
              onValueChange={(value) =>
                setSettings((prev) => ({
                  ...prev,
                  defaultCategory: value,
                }))
              }
            >
              <SelectTrigger id="defaultCategory">
                <SelectValue placeholder="Select default category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Default</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name} ({category.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Default category for new assets
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenanceReminderDays">
              Maintenance Reminder Days
            </Label>
            <Input
              id="maintenanceReminderDays"
              type="number"
              min={1}
              value={settings.maintenanceReminderDays}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  maintenanceReminderDays: parseInt(e.target.value) || 30,
                }))
              }
            />
            <p className="text-sm text-muted-foreground">
              Days before warranty expiry to send reminders
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requireApprovalForAssignment"
                checked={settings.requireApprovalForAssignment}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    requireApprovalForAssignment: checked as boolean,
                  }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="requireApprovalForAssignment" className="cursor-pointer">
                  Require approval for asset assignment
                </Label>
                <p className="text-sm text-muted-foreground">
                  Asset assignments require manager approval
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="trackAssignmentHistory"
                checked={settings.trackAssignmentHistory}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    trackAssignmentHistory: checked as boolean,
                  }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="trackAssignmentHistory" className="cursor-pointer">
                  Track assignment history
                </Label>
                <p className="text-sm text-muted-foreground">
                  Maintain complete history of asset assignments
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="enableAutoDiscovery"
                checked={settings.enableAutoDiscovery}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({
                    ...prev,
                    enableAutoDiscovery: checked as boolean,
                  }))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="enableAutoDiscovery" className="cursor-pointer">
                  Enable auto-discovery
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow automatic asset enrollment from discovery agents
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStatus !== null ? 'Edit Status' : 'Add New Status'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus !== null
                ? 'Modify the status label and color'
                : 'Create a new lifecycle status for assets'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="statusValue">Value</Label>
              <Input
                id="statusValue"
                placeholder="e.g., deployed"
                value={statusFormData.value}
                onChange={(e) =>
                  setStatusFormData((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                disabled={editingStatus !== null}
              />
              <p className="text-sm text-muted-foreground">
                Internal value (cannot be changed after creation)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusLabel">Label</Label>
              <Input
                id="statusLabel"
                placeholder="e.g., Deployed to Client"
                value={statusFormData.label}
                onChange={(e) =>
                  setStatusFormData((prev) => ({
                    ...prev,
                    label: e.target.value,
                  }))
                }
              />
              <p className="text-sm text-muted-foreground">
                Display name for this status
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusColor">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="statusColor"
                  type="color"
                  value={statusFormData.color}
                  onChange={(e) =>
                    setStatusFormData((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={statusFormData.color}
                  onChange={(e) =>
                    setStatusFormData((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  className="flex-1 font-mono"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Badge background color
              </p>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <p className="text-sm text-muted-foreground mb-2">Preview:</p>
              <Badge style={{ backgroundColor: statusFormData.color, color: '#fff' }}>
                {statusFormData.label || 'Status Label'}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStatus}>
              {editingStatus !== null ? 'Update' : 'Add'} Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
