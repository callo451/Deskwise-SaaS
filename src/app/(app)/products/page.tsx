'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { ProductFormWizard } from '@/components/products/product-form-wizard'
import { cn } from '@/lib/utils'

interface Product {
  _id: string
  sku: string
  name: string
  description: string
  longDescription?: string
  category: string
  type: string
  subcategory?: string
  unitPrice: number
  cost?: number
  unitOfMeasure: string
  minimumQuantity?: number
  defaultQuantity?: number
  taxCategory: string
  isTaxable: boolean
  recurringInterval?: string
  vendor?: string
  manufacturer?: string
  partNumber?: string
  isActive: boolean
  isArchived: boolean
  inStock?: boolean
  stockQuantity?: number
  tags?: string[]
  timesUsed?: number
  lastUsedAt?: string
}

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

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, categoryFilter, typeFilter, statusFilter])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()

      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((p) => p.type === typeFilter)
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((p) => p.isActive)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.isActive)
    }

    setFilteredProducts(filtered)
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setProductDialogOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setProductDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/products/${productToDelete._id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        setProductToDelete(null)
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Package className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Product Catalog</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage your services, hardware, and software products
            </p>
          </div>
        </div>
        <Button size="lg" className="gap-2" onClick={handleCreate}>
          <Plus className="w-5 h-5" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-amber-500/5 border-b-2 pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">Total Products</CardDescription>
              <div className="p-1.5 bg-amber-500/10 rounded-md">
                <Package className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 border-green-500/30 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-green-700 dark:text-green-400">Active</CardDescription>
              <div className="p-1.5 bg-green-500/20 rounded-md">
                <ShoppingCart className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-green-600">
              {products.filter((p) => p.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-blue-700 dark:text-blue-400">Recurring</CardDescription>
              <div className="p-1.5 bg-blue-500/20 rounded-md">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600">
              {products.filter((p) => p.type === 'recurring').length}
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105 border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium text-purple-700 dark:text-purple-400">Most Used</CardDescription>
              <div className="p-1.5 bg-purple-500/20 rounded-md">
                <Tag className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-purple-600">
              {products.length > 0
                ? Math.max(...products.map((p) => p.timesUsed || 0))
                : 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
          <CardTitle className="text-lg font-semibold">Products ({filteredProducts.length})</CardTitle>
          <CardDescription className="text-sm mt-1">
            Manage your product and service catalog
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found. Create your first product to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-accent/30 to-accent/10 hover:bg-gradient-to-r hover:from-accent/40 hover:to-accent/20">
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Unit</TableHead>
                  <TableHead className="font-semibold">Used</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id}>
                    <TableCell className="font-mono text-sm">
                      {product.sku}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {categoryLabels[product.category] || product.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeLabels[product.type] || product.type}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(product.unitPrice)}
                    </TableCell>
                    <TableCell>
                      {unitLabels[product.unitOfMeasure] ||
                        product.unitOfMeasure}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.timesUsed || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? 'default' : 'secondary'}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Form Wizard */}
      <ProductFormWizard
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        onSuccess={() => {
          setEditingProduct(null)
          fetchProducts()
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action
              will archive the product.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
