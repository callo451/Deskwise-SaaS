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
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Loader2, Package, Layers, Tag, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SettingsHeader } from '@/components/settings/settings-header'
import { EmptyState } from '@/components/settings/empty-state'

interface AssetCategory {
  _id: string
  name: string
  code: string
  icon?: string
  color?: string
  description?: string
  isSystem: boolean
  isActive: boolean
}

interface CategoryFormData {
  name: string
  code: string
  description: string
  color: string
}

export default function AssetCategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AssetCategory | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    code: '',
    description: '',
    color: '#6366f1',
  })
  const [saving, setSaving] = useState(false)
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/settings/asset-categories')
      if (!response.ok) throw new Error('Failed to fetch categories')
      const data = await response.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: AssetCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        code: category.code,
        description: category.description || '',
        color: category.color || '#6366f1',
      })
    } else {
      setEditingCategory(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        color: '#6366f1',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingCategory
        ? `/api/settings/asset-categories/${editingCategory._id}`
        : '/api/settings/asset-categories'

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save category')
      }

      toast({
        title: 'Success',
        description: `Category ${editingCategory ? 'updated' : 'created'} successfully`,
      })

      setDialogOpen(false)
      fetchCategories()
    } catch (error: any) {
      console.error('Error saving category:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to save category',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (category: AssetCategory) => {
    if (category.isSystem) {
      toast({
        title: 'Error',
        description: 'Cannot delete system categories',
        variant: 'destructive',
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/asset-categories/${category._id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete category')
      }

      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      })

      fetchCategories()
    } catch (error: any) {
      console.error('Error deleting category:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete category',
        variant: 'destructive',
      })
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const response = await fetch('/api/settings/asset-categories/seed', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to seed categories')

      toast({
        title: 'Success',
        description: 'Default categories created successfully',
      })

      fetchCategories()
    } catch (error) {
      console.error('Error seeding categories:', error)
      toast({
        title: 'Error',
        description: 'Failed to seed default categories',
        variant: 'destructive',
      })
    } finally {
      setSeeding(false)
    }
  }

  const stats = {
    total: categories.length,
    system: categories.filter(c => c.isSystem).length,
    custom: categories.filter(c => !c.isSystem).length,
    active: categories.filter(c => c.isActive).length,
  }

  return (
    <div className="space-y-6">
      <SettingsHeader
        title="Asset Categories"
        description="Manage asset categories and types for your organization"
        breadcrumbs={[{ label: 'Settings', href: '/settings' }]}
        icon={<Package className="h-6 w-6 text-gray-600" />}
        actions={
          <div className="flex gap-2">
            {categories.length === 0 && !loading && (
              <Button
                onClick={handleSeedDefaults}
                disabled={seeding}
                variant="outline"
              >
                {seeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Seed Defaults
              </Button>
            )}
            <Button onClick={() => handleOpenDialog()} className="bg-gray-600 hover:bg-gray-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-gray-200 bg-gray-50/50">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-700">Total Categories</CardDescription>
            <CardTitle className="text-3xl text-gray-900">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>System Categories</CardDescription>
            <CardTitle className="text-3xl">{stats.system}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Custom Categories</CardDescription>
            <CardTitle className="text-3xl">{stats.custom}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-3xl">{stats.active}</CardTitle>
            </div>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            View and manage asset categories. System categories cannot be deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No categories yet"
              description="Get started by adding your first category or seeding default categories"
              action={{
                label: 'Seed Defaults',
                onClick: handleSeedDefaults,
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full ring-1 ring-border"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {category.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm text-muted-foreground font-mono">
                          {category.color}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.isSystem ? 'default' : 'secondary'}>
                        {category.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {category.isActive ? (
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
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!category.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below'
                : 'Create a new asset category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Laptop"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="e.g., LPTOP"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Used for asset tag generation
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this category"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.code}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
