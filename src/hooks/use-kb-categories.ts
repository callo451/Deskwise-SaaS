import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'
import type { KBCategory } from '@/lib/types'

export interface KBCategoryWithChildren extends KBCategory {
  children?: KBCategoryWithChildren[]
  level?: number
}

export interface CreateCategoryInput {
  name: string
  description?: string
  parentId?: string
  icon?: string
  color?: string
  order?: number
  isPublic?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  parentId?: string
  icon?: string
  color?: string
  order?: number
  isPublic?: boolean
  isActive?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
}

export function useKBCategories() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<KBCategory[]>([])
  const [categoriesTree, setCategoriesTree] = useState<KBCategoryWithChildren[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Build hierarchical tree from flat category array
   */
  const buildTree = useCallback((flatCategories: KBCategory[]): KBCategoryWithChildren[] => {
    const map = new Map<string, KBCategoryWithChildren>()
    const roots: KBCategoryWithChildren[] = []

    // Create map of all categories
    flatCategories.forEach(cat => {
      map.set(cat._id.toString(), { ...cat, children: [], level: 0 })
    })

    // Build tree structure
    flatCategories.forEach(cat => {
      const node = map.get(cat._id.toString())!
      if (cat.parentId) {
        const parent = map.get(cat.parentId)
        if (parent) {
          parent.children = parent.children || []
          node.level = (parent.level || 0) + 1
          parent.children.push(node)
          // Sort children by order
          parent.children.sort((a, b) => a.order - b.order)
        } else {
          // Parent not found, treat as root
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    // Sort root categories by order
    return roots.sort((a, b) => a.order - b.order)
  }, [])

  /**
   * Fetch all categories
   */
  const fetchCategories = useCallback(async (includeTree = true) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (includeTree) params.set('tree', 'true')

      const response = await fetch(`/api/knowledge-base/categories?${params}`)
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
        if (includeTree) {
          setCategoriesTree(buildTree(data.data))
        }
      } else {
        setError(data.error || 'Failed to fetch categories')
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch categories',
          variant: 'destructive',
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch categories'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [buildTree])

  /**
   * Create new category
   */
  const createCategory = useCallback(async (categoryData: CreateCategoryInput) => {
    try {
      setLoading(true)

      const response = await fetch('/api/knowledge-base/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData),
      })

      const data = await response.json()

      if (data.success) {
        const newCategory = data.data
        setCategories(prev => [...prev, newCategory])
        setCategoriesTree(buildTree([...categories, newCategory]))

        toast({
          title: 'Success',
          description: 'Category created successfully',
        })
        return newCategory
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to create category',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create category'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [categories, buildTree])

  /**
   * Update existing category
   */
  const updateCategory = useCallback(async (id: string, updates: UpdateCategoryInput) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/knowledge-base/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (data.success) {
        const updatedCategory = data.data
        setCategories(prev =>
          prev.map(cat => (cat._id.toString() === id ? updatedCategory : cat))
        )
        setCategoriesTree(buildTree(
          categories.map(cat => (cat._id.toString() === id ? updatedCategory : cat))
        ))

        toast({
          title: 'Success',
          description: 'Category updated successfully',
        })
        return updatedCategory
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update category',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update category'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [categories, buildTree])

  /**
   * Delete category
   */
  const deleteCategory = useCallback(async (id: string) => {
    try {
      setLoading(true)

      const response = await fetch(`/api/knowledge-base/categories/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setCategories(prev => prev.filter(cat => cat._id.toString() !== id))
        setCategoriesTree(buildTree(categories.filter(cat => cat._id.toString() !== id)))

        toast({
          title: 'Success',
          description: 'Category deleted successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete category',
          variant: 'destructive',
        })
        throw new Error(data.error)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete category'
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
      throw err
    } finally {
      setLoading(false)
    }
  }, [categories, buildTree])

  /**
   * Get category by ID
   */
  const getCategoryById = useCallback((id: string): KBCategory | undefined => {
    return categories.find(cat => cat._id.toString() === id)
  }, [categories])

  /**
   * Get category with all its descendants
   */
  const getCategoryWithDescendants = useCallback((id: string): string[] => {
    const descendants: string[] = [id]

    const findChildren = (parentId: string) => {
      categories.forEach(cat => {
        if (cat.parentId === parentId) {
          descendants.push(cat._id.toString())
          findChildren(cat._id.toString())
        }
      })
    }

    findChildren(id)
    return descendants
  }, [categories])

  /**
   * Check if category has children
   */
  const hasChildren = useCallback((id: string): boolean => {
    return categories.some(cat => cat.parentId === id)
  }, [categories])

  /**
   * Get parent path for category (for breadcrumbs)
   */
  const getParentPath = useCallback((id: string): KBCategory[] => {
    const path: KBCategory[] = []
    let currentId: string | undefined = id

    while (currentId) {
      const category = getCategoryById(currentId)
      if (category) {
        path.unshift(category)
        currentId = category.parentId
      } else {
        break
      }
    }

    return path
  }, [getCategoryById])

  return {
    categories,
    categoriesTree,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    getCategoryWithDescendants,
    hasChildren,
    getParentPath,
    buildTree,
  }
}
