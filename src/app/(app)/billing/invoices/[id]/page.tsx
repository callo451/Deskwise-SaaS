'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  DollarSign,
  Download,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Ban,
  CreditCard,
  Calendar,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'

interface InvoiceLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference?: string
  notes?: string
  recordedAt: string
}

interface Invoice {
  _id: string
  invoiceNumber: string
  clientId: string
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'
  lineItems: InvoiceLineItem[]
  subtotal: number
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  issueDate: string
  dueDate: string
  paymentTerms: number
  terms?: string
  notes?: string
  payments?: Payment[]
  isRecurring: boolean
  createdAt: string
  sentAt?: string
  paidAt?: string
  voidedAt?: string
  voidReason?: string
}

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-200',
  partial: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  paid: 'bg-green-500/10 text-green-600 border-green-200',
  overdue: 'bg-red-500/10 text-red-600 border-red-200',
  void: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

export default function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoiceId, setInvoiceId] = useState<string>('')
  const [voidDialogOpen, setVoidDialogOpen] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: '',
  })

  useEffect(() => {
    params.then((p) => {
      setInvoiceId(p.id)
      fetchInvoice(p.id)
    })
  }, [])

  const fetchInvoice = async (id: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${id}`)
      const data = await response.json()

      if (data.success) {
        setInvoice(data.data)
        setPaymentData(prev => ({ ...prev, amount: data.data.amountDue }))
      } else {
        router.push('/billing')
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error)
      router.push('/billing')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchInvoice(invoiceId)
      }
    } catch (error) {
      console.error('Failed to send invoice:', error)
    }
  }

  const handleRecordPayment = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      })

      if (response.ok) {
        setPaymentDialogOpen(false)
        setPaymentData({
          amount: 0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'bank_transfer',
          reference: '',
          notes: '',
        })
        fetchInvoice(invoiceId)
      }
    } catch (error) {
      console.error('Failed to record payment:', error)
    }
  }

  const handleVoid = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason }),
      })

      if (response.ok) {
        setVoidDialogOpen(false)
        fetchInvoice(invoiceId)
      }
    } catch (error) {
      console.error('Failed to void invoice:', error)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/pdf`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Invoice-${invoice?.invoiceNumber || invoiceId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to download PDF:', error)
    }
  }

  const handleEmailToClient = async () => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/email`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Invoice sent successfully to client! ${data.message}`)
        // Refresh invoice to update status
        fetchInvoice(invoiceId)
      } else {
        alert(`Failed to send email: ${data.error}`)
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('Failed to send email to client')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = () => {
    return invoice && new Date(invoice.dueDate) < new Date() &&
           (invoice.status === 'sent' || invoice.status === 'partial')
  }

  const getPaymentProgress = () => {
    if (!invoice) return 0
    return (invoice.amountPaid / invoice.total) * 100
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!invoice) {
    return null
  }

  const displayStatus = isOverdue() ? 'overdue' : invoice.status

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/billing')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {invoice.invoiceNumber}
              </h1>
              <Badge variant="outline" className={statusColors[displayStatus]}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
              {isOverdue() && (
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                  Overdue
                </Badge>
              )}
              {invoice.isRecurring && (
                <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-200">
                  Recurring
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Issued on {formatDate(invoice.issueDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <Button onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && (
            <Button onClick={() => setPaymentDialogOpen(true)}>
              <CreditCard className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailToClient}>
                <Mail className="w-4 h-4 mr-2" />
                Email to Client
              </DropdownMenuItem>
              {invoice.status === 'draft' && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/billing/invoices/${invoiceId}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Invoice
                  </DropdownMenuItem>
                </>
              )}
              {invoice.status !== 'void' && invoice.status !== 'paid' && (
                <DropdownMenuItem
                  onClick={() => setVoidDialogOpen(true)}
                  className="text-orange-600"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Void Invoice
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Issue Date
                  </p>
                  <p className="font-semibold">{formatDate(invoice.issueDate)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Due Date
                  </p>
                  <p className={`font-semibold ${isOverdue() ? 'text-red-600' : ''}`}>
                    {formatDate(invoice.dueDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Payment Terms
                  </p>
                  <p className="font-semibold">Net {invoice.paymentTerms} days</p>
                </div>
                {invoice.paidAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Paid On
                    </p>
                    <p className="font-semibold text-green-600">
                      {formatDate(invoice.paidAt)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Progress */}
          {invoice.status === 'partial' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Progress</CardTitle>
                <CardDescription>
                  {formatCurrency(invoice.amountPaid)} of {formatCurrency(invoice.total)} paid
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={getPaymentProgress()} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {Math.round(getPaymentProgress())}% paid · {formatCurrency(invoice.amountDue)} remaining
                </p>
              </CardContent>
            </Card>
          )}

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Products and services billed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.lineItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.description}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Recorded payments for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoice.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentMethod.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Paid on {formatDate(payment.paymentDate)}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reference: {payment.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          {invoice.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {invoice.terms}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Void Reason */}
          {invoice.status === 'void' && invoice.voidReason && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900">Void Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-800">{invoice.voidReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {invoice.discountType === 'percentage'
                        ? ` (${invoice.discountValue}%)`
                        : ''}
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatCurrency(invoice.discountAmount)}
                    </span>
                  </div>
                )}

                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({invoice.taxRate}%)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(invoice.taxAmount)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(invoice.total)}
                  </span>
                </div>

                {invoice.amountPaid > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(invoice.amountPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base font-semibold">Amount Due</span>
                      <span className={`text-xl font-bold ${invoice.amountDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {formatCurrency(invoice.amountDue)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment received for this invoice
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                max={invoice.amountDue}
                step="0.01"
                value={paymentData.amount}
                onChange={(e) =>
                  setPaymentData({
                    ...paymentData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Amount due: {formatCurrency(invoice.amountDue)}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, paymentDate: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={paymentData.paymentMethod}
                onValueChange={(value) =>
                  setPaymentData({ ...paymentData, paymentMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Reference Number (Optional)</Label>
              <Input
                id="reference"
                value={paymentData.reference}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, reference: e.target.value })
                }
                placeholder="e.g., Check #1234 or Transaction ID"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paymentNotes">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                value={paymentData.notes}
                onChange={(e) =>
                  setPaymentData({ ...paymentData, notes: e.target.value })
                }
                placeholder="Any additional notes about this payment"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Invoice</DialogTitle>
            <DialogDescription>
              Please provide a reason for voiding this invoice.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="voidReason">Reason for voiding</Label>
              <Textarea
                id="voidReason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="e.g., Duplicate invoice created by mistake"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleVoid}>
              Void Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
