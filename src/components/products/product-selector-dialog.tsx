'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Package, DollarSign, TrendingUp } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Product {
  _id: string
  sku: string
  name: string
  description: string
  category: string
  type: string
  unitPrice: number
  unitOfMeasure: string
  defaultQuantity?: number
  isActive: boolean
  timesUsed?: number
}

interface ProductSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectProduct: (product: Product) => void
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

export function ProductSelectorDialog({
  open,
  onOpenChange,
  onSelectProduct,
}: ProductSelectorDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    if (open) {
      fetchProducts()
    }
  }, [open])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, categoryFilter])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products?isActive=true')
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

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter)
    }

    setFilteredProducts(filtered)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleSelect = (product: Product) => {
    onSelectProduct(product)
    onOpenChange(false)
    // Reset filters
    setSearchQuery('')
    setCategoryFilter('all')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Select Product from Catalog
          </DialogTitle>
          <DialogDescription>
            Choose a product or service to add to the quote
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-2 py-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by SKU, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
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

        {/* Product List */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No products found.</p>
              <p className="text-sm mt-2">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSelect(product)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{product.name}</h4>
                        {product.timesUsed && product.timesUsed > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {product.timesUsed} uses
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-mono">{product.sku}</span>
                        <Badge variant="outline" className="text-xs">
                          {categoryLabels[product.category] || product.category}
                        </Badge>
                        <span>
                          per {unitLabels[product.unitOfMeasure] || product.unitOfMeasure}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(product.unitPrice)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Default qty: {product.defaultQuantity || 1}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}{' '}
            available
          </p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
