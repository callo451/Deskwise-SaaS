'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  Calendar,
  DollarSign,
  Percent,
  FileText,
  Package,
} from 'lucide-react'
import { ProductSelectorDialog } from '@/components/products/product-selector-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertCircle } from 'lucide-react'

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Client {
  _id: string
  name: string
  displayName?: string
  currency: string
  taxRate: number
}

export default function NewQuotePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])

  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    taxRate: 0,
    terms: `Payment is due within 30 days of quote acceptance.
All prices are in USD unless otherwise specified.
This quote is valid for 30 days from the issue date.`,
    notes: '',
  })

  const [productSelectorOpen, setProductSelectorOpen] = useState(false)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: '1',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    },
  ])

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    // Auto-set tax rate when client is selected
    const selectedClient = clients.find((c) => c._id === formData.clientId)
    if (selectedClient) {
      setFormData((prev) => ({ ...prev, taxRate: selectedClient.taxRate }))
    }
  }, [formData.clientId, clients])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?status=active')
      const data = await response.json()
      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const handleSelectProduct = (product: any) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: product.name,
      quantity: product.defaultQuantity || 1,
      unitPrice: product.unitPrice,
      total: (product.defaultQuantity || 1) * product.unitPrice,
    }
    setLineItems([...lineItems, newItem])
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value }
          if (field === 'quantity' || field === 'unitPrice') {
            updated.total = updated.quantity * updated.unitPrice
          }
          return updated
        }
        return item
      })
    )
  }

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)

    const discountAmount =
      formData.discountType === 'percentage'
        ? (subtotal * formData.discountValue) / 100
        : formData.discountValue

    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * formData.taxRate) / 100
    const total = taxableAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    }
  }

  const totals = calculateTotals()
  const selectedClient = clients.find((c) => c._id === formData.clientId)

  const handleSubmit = async (status: 'draft' | 'sent') => {
    if (!formData.clientId) {
      setError('Please select a client')
      return
    }

    if (!formData.title) {
      setError('Please enter a quote title')
      return
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.unitPrice < 0)) {
      setError('Please complete all line items with valid values')
      return
    }

    setLoading(true)
    setError('')

    try {
      const quoteData = {
        ...formData,
        lineItems,
        status,
        currency: selectedClient?.currency || 'USD',
        ...totals,
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      })

      const data = await response.json()

      if (data.success) {
        if (status === 'sent') {
          // Mark as sent
          await fetch(`/api/quotes/${data.data._id}/send`, { method: 'POST' })
        }
        router.push(`/quotes/${data.data._id}`)
      } else {
        setError(data.error || 'Failed to create quote')
      }
    } catch (err) {
      console.error('Create quote error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedClient?.currency || 'USD',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/quotes')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Quote</h1>
            <p className="text-muted-foreground">
              Build a professional quote for your client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit('draft')}
            disabled={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit('sent')} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Sending...' : 'Send to Client'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Quote Details */}
          <Card>
            <CardHeader>
              <CardTitle>Quote Details</CardTitle>
              <CardDescription>
                Select client and enter quote information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, clientId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client._id} value={client._id}>
                          {client.displayName || client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="title">Quote Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Monthly IT Support Package"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description of the quoted services"
                    rows={3}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>
                    Add products or services to this quote
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setProductSelectorOpen(true)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Add from Catalog
                  </Button>
                  <Button variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Manual Item
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Description</TableHead>
                      <TableHead className="w-[15%]">Quantity</TableHead>
                      <TableHead className="w-[20%]">Unit Price</TableHead>
                      <TableHead className="w-[20%]">Total</TableHead>
                      <TableHead className="w-[5%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Input
                            value={item.description}
                            onChange={(e) =>
                              updateLineItem(item.id, 'description', e.target.value)
                            }
                            placeholder="Item description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'quantity',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) =>
                              updateLineItem(
                                item.id,
                                'unitPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Discounts & Tax */}
          <Card>
            <CardHeader>
              <CardTitle>Discounts & Tax</CardTitle>
              <CardDescription>
                Apply discounts and configure tax settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: 'percentage' | 'fixed') =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Discount Value</Label>
                  <div className="relative">
                    {formData.discountType === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                      value={formData.discountValue}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountValue: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxRate: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Terms & Notes</CardTitle>
              <CardDescription>
                Payment terms and additional information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="terms">Terms & Conditions</Label>
                <Textarea
                  id="terms"
                  value={formData.terms}
                  onChange={(e) =>
                    setFormData({ ...formData, terms: e.target.value })
                  }
                  rows={5}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Internal Notes (Not visible to client)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add internal notes about this quote"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Quote Preview
              </CardTitle>
              <CardDescription>
                Real-time quote summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedClient ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Client
                    </p>
                    <p className="font-semibold">
                      {selectedClient.displayName || selectedClient.name}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Line Items
                    </p>
                    <p className="text-2xl font-bold">{lineItems.length}</p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-semibold">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>

                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Discount
                          {formData.discountType === 'percentage'
                            ? ` (${formData.discountValue}%)`
                            : ''}
                        </span>
                        <span className="font-semibold text-green-600">
                          -{formatCurrency(totals.discountAmount)}
                        </span>
                      </div>
                    )}

                    {formData.taxRate > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax ({formData.taxRate}%)
                        </span>
                        <span className="font-semibold">
                          {formatCurrency(totals.taxAmount)}
                        </span>
                      </div>
                    )}

                    <Separator />

                    <div className="flex justify-between">
                      <span className="text-base font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Valid Until
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold">
                        {new Date(formData.validUntil).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select a client to preview quote
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Selector Dialog */}
      <ProductSelectorDialog
        open={productSelectorOpen}
        onOpenChange={setProductSelectorOpen}
        onSelectProduct={handleSelectProduct}
      />
    </div>
  )
}
