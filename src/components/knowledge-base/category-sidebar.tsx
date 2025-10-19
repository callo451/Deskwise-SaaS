'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Library, Menu, X, Loader2, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CategoryTreeItem } from './category-tree-item'
import { CategoryDialog } from './category-dialog'
import { useKBCategories, type KBCategoryWithChildren } from '@/hooks/use-kb-categories'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface CategorySidebarProps {
  selectedCategoryId?: string
  onCategorySelect: (categoryId: string | undefined) => void
  totalArticles?: number
  className?: string
}

export function CategorySidebar({
  selectedCategoryId,
  onCategorySelect,
  totalArticles = 0,
  className,
}: CategorySidebarProps) {
  const { data: session } = useSession()
  const {
    categoriesTree,
    loading,
    error,
    fetchCategories,
    deleteCategory,
    hasChildren,
  } = useKBCategories()

  const [isOpen, setIsOpen] = useState(true) // Desktop: open by default
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [editingCategory, setEditingCategory] = useState<KBCategoryWithChildren | undefined>()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    fetchCategories(true)
  }, [fetchCategories])

  const handleAllArticlesClick = () => {
    onCategorySelect(undefined)
    setIsMobileOpen(false)
  }

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId)
    setIsMobileOpen(false)
  }

  const handleCreateCategory = () => {
    setDialogMode('create')
    setEditingCategory(undefined)
    setDialogOpen(true)
  }

  const handleEditCategory = (category: KBCategoryWithChildren) => {
    setDialogMode('edit')
    setEditingCategory(category)
    setDialogOpen(true)
  }

  const handleDeleteCategory = (categoryId: string) => {
    setCategoryToDelete(categoryId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!categoryToDelete) return

    try {
      // Check if category has children
      if (hasChildren(categoryToDelete)) {
        alert('Cannot delete category with subcategories. Please delete or move subcategories first.')
        return
      }

      await deleteCategory(categoryToDelete)
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)

      // If deleted category was selected, clear selection
      if (selectedCategoryId === categoryToDelete) {
        onCategorySelect(undefined)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleDialogSuccess = () => {
    setDialogOpen(false)
    fetchCategories(true)
  }

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Categories</h3>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCreateCategory}
            className="h-8 px-2"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCategories(true)}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Categories Tree */}
      {!loading && !error && (
        <div className="flex-1 overflow-y-auto">
          {/* All Articles Option */}
          <div
            className={cn(
              'flex items-center justify-between py-2 px-3 mb-2 rounded-md cursor-pointer transition-colors',
              'hover:bg-accent',
              !selectedCategoryId
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={handleAllArticlesClick}
          >
            <span className="text-sm">All Articles</span>
            {totalArticles > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                {totalArticles}
              </Badge>
            )}
          </div>

          {/* Empty State */}
          {categoriesTree.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-4">
                No categories yet
              </p>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreateCategory}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Category
                </Button>
              )}
            </div>
          )}

          {/* Category Tree */}
          {categoriesTree.map((category) => (
            <CategoryTreeItem
              key={category._id.toString()}
              category={category}
              selectedId={selectedCategoryId}
              onSelect={handleCategorySelect}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        className="md:hidden mb-4"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        <Menu className="w-4 h-4 mr-2" />
        Categories
      </Button>

      {/* Desktop Sidebar */}
      <Card className={cn('hidden md:block', className)}>
        <CardContent className="p-4 h-[calc(100vh-16rem)]">
          {sidebarContent}
        </CardContent>
      </Card>

      {/* Mobile Sidebar (Overlay) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
          />
          <Card className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle>Categories</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="h-[calc(100vh-5rem)] overflow-y-auto">
              {sidebarContent}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Create/Edit Dialog */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        category={editingCategory}
        onSuccess={handleDialogSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone. Articles in this category will become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
