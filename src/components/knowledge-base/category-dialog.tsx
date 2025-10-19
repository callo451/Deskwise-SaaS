'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Info, AlertTriangle } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useKBCategories, type KBCategoryWithChildren, type CreateCategoryInput } from '@/hooks/use-kb-categories'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  category?: KBCategoryWithChildren
  onSuccess?: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  mode,
  category,
  onSuccess,
}: CategoryDialogProps) {
  const { data: session } = useSession()
  const {
    categories,
    createCategory,
    updateCategory,
    getCategoryWithDescendants,
  } = useKBCategories()

  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    description: '',
    parentId: '',
    icon: 'Folder',
    color: '#8B5CF6',
    order: 0,
    isPublic: false,
    allowedRoles: [],
    allowedUsers: [],
  })
  const [slugPreview, setSlugPreview] = useState('')
  const [hasChildren, setHasChildren] = useState(false)

  useEffect(() => {
    if (mode === 'edit' && category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        parentId: category.parentId || '',
        icon: category.icon || 'Folder',
        color: category.color || '#8B5CF6',
        order: category.order,
        isPublic: category.isPublic,
        allowedRoles: category.allowedRoles || [],
        allowedUsers: category.allowedUsers || [],
      })
      setSlugPreview(category.slug)

      // Check if category has children
      const descendants = getCategoryWithDescendants(category._id.toString())
      setHasChildren(descendants.length > 1) // More than itself
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        parentId: '',
        icon: 'Folder',
        color: '#8B5CF6',
        order: 0,
        isPublic: false,
        allowedRoles: [],
        allowedUsers: [],
      })
      setSlugPreview('')
      setHasChildren(false)
    }
  }, [mode, category, open, getCategoryWithDescendants])

  useEffect(() => {
    // Auto-generate slug from name
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setSlugPreview(slug)
    } else {
      setSlugPreview('')
    }
  }, [formData.name])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return
    }

    setLoading(true)
    try {
      if (mode === 'edit' && category) {
        await updateCategory(category._id.toString(), {
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          parentId: formData.parentId || undefined,
          icon: formData.icon,
          color: formData.color,
          order: formData.order,
          isPublic: formData.isPublic,
          allowedRoles: formData.allowedRoles,
          allowedUsers: formData.allowedUsers,
        })
      } else {
        await createCategory({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          parentId: formData.parentId || undefined,
          icon: formData.icon,
          color: formData.color,
          order: formData.order,
          isPublic: formData.isPublic,
          allowedRoles: formData.allowedRoles,
          allowedUsers: formData.allowedUsers,
        })
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving category:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter out the current category and its descendants from parent selection
  const availableParents = categories.filter((cat) => {
    if (!category) return true
    const descendants = getCategoryWithDescendants(category._id.toString())
    return !descendants.includes(cat._id.toString())
  })

  const commonColors = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Yellow', value: '#EAB308' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Gray', value: '#6B7280' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create New Category' : 'Edit Category'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Create a new category to organize your knowledge base articles.'
                : 'Update category details and settings.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Getting Started, Troubleshooting"
                required
                disabled={loading}
              />
              {slugPreview && (
                <p className="text-xs text-muted-foreground">
                  Slug: <span className="font-mono">{slugPreview}</span>
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Brief description of this category..."
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Parent Category */}
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Category</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value === 'none' ? '' : value })
                }
                disabled={loading}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent (Root Category)</SelectItem>
                  {availableParents.map((cat) => (
                    <SelectItem key={cat._id.toString()} value={cat._id.toString()}>
                      {cat.fullPath || cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mode === 'edit' && hasChildren && formData.parentId && (
                <Alert variant="default">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Moving this category will also move all its subcategories.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-8 gap-2">
                  {commonColors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      className="w-8 h-8 rounded-md border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: colorOption.value,
                        borderColor:
                          formData.color === colorOption.value
                            ? '#000'
                            : 'transparent',
                      }}
                      onClick={() =>
                        setFormData({ ...formData, color: colorOption.value })
                      }
                      title={colorOption.name}
                      disabled={loading}
                    />
                  ))}
                </div>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 cursor-pointer"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                }
                min={0}
                placeholder="0"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Lower numbers appear first. Categories with the same order are sorted
                alphabetically.
              </p>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-3 pt-4 border-t">
              <h4 className="font-medium text-sm">Visibility Settings</h4>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPublic"
                  checked={formData.isPublic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPublic: checked as boolean })
                  }
                  disabled={loading}
                />
                <Label
                  htmlFor="isPublic"
                  className="text-sm font-normal cursor-pointer"
                >
                  Make this category public
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Public categories are visible in the self-service portal for public
                articles.
              </p>

              {/* TODO: Add role and user selectors when RBAC is fully integrated */}
              {/* <div className="space-y-2 ml-6">
                <Label htmlFor="allowedRoles">Allowed Roles</Label>
                <MultiSelect
                  options={roles}
                  value={formData.allowedRoles}
                  onChange={(roles) => setFormData({ ...formData, allowedRoles: roles })}
                />
              </div> */}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'create' ? 'Create Category' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
