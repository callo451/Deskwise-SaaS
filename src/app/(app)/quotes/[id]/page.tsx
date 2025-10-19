'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Send,
  CheckCircle,
  XCircle,
  Copy,
  FileText,
  Download,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  RefreshCw,
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

interface QuoteLineItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Quote {
  _id: string
  quoteNumber: string
  title: string
  description?: string
  clientId: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'converted' | 'expired'
  lineItems: QuoteLineItem[]
  subtotal: number
  discountType: 'percentage' | 'fixed'
  discountValue: number
  discountAmount: number
  taxRate: number
  taxAmount: number
  total: number
  currency: string
  validUntil: string
  terms?: string
  notes?: string
  createdAt: string
  sentAt?: string
  viewedAt?: string
  acceptedAt?: string
  declinedAt?: string
  declineReason?: string
  convertedToInvoice?: boolean
}

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-200',
  viewed: 'bg-purple-500/10 text-purple-600 border-purple-200',
  accepted: 'bg-green-500/10 text-green-600 border-green-200',
  declined: 'bg-red-500/10 text-red-600 border-red-200',
  converted: 'bg-teal-500/10 text-teal-600 border-teal-200',
  expired: 'bg-orange-500/10 text-orange-600 border-orange-200',
}

export default function QuoteDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [quoteId, setQuoteId] = useState<string>('')
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState('')

  useEffect(() => {
    params.then((p) => {
      setQuoteId(p.id)
      fetchQuote(p.id)
    })
  }, [])

  const fetchQuote = async (id: string) => {
    try {
      const response = await fetch(`/api/quotes/${id}`)
      const data = await response.json()

      if (data.success) {
        setQuote(data.data)
      } else {
        router.push('/quotes')
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error)
      router.push('/quotes')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchQuote(quoteId)
      }
    } catch (error) {
      console.error('Failed to send quote:', error)
    }
  }

  const handleAccept = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/accept`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchQuote(quoteId)
      }
    } catch (error) {
      console.error('Failed to accept quote:', error)
    }
  }

  const handleDecline = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason }),
      })

      if (response.ok) {
        setDeclineDialogOpen(false)
        fetchQuote(quoteId)
      }
    } catch (error) {
      console.error('Failed to decline quote:', error)
    }
  }

  const handleConvert = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/convert`, {
        method: 'POST',
      })

      if (response.ok) {
        router.push('/billing')
      }
    } catch (error) {
      console.error('Failed to convert quote:', error)
    }
  }

  const handleClone = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/clone`, {
        method: 'POST',
      })

      const data = await response.json()
      if (data.success) {
        router.push(`/quotes/${data.data._id}`)
      }
    } catch (error) {
      console.error('Failed to clone quote:', error)
    }
  }

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Quote-${quote?.quoteNumber || quoteId}.pdf`
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
      const response = await fetch(`/api/quotes/${quoteId}/email`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Quote sent successfully to client! ${data.message}`)
        // Refresh quote to update status
        fetchQuote(quoteId)
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
      currency: quote?.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isExpired = () => {
    return quote && new Date(quote.validUntil) < new Date() && quote.status === 'sent'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!quote) {
    return null
  }

  const displayStatus = isExpired() ? 'expired' : quote.status

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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {quote.quoteNumber}
              </h1>
              <Badge variant="outline" className={statusColors[displayStatus]}>
                {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
              </Badge>
              {isExpired() && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                  Expired
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Created on {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {quote.status === 'draft' && (
            <Button onClick={handleSend}>
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          )}
          {quote.status === 'sent' && (
            <>
              <Button variant="outline" onClick={handleAccept}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Accepted
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeclineDialogOpen(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Mark Declined
              </Button>
            </>
          )}
          {quote.status === 'accepted' && !quote.convertedToInvoice && (
            <Button onClick={handleConvert}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Convert to Invoice
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleClone}>
                <Copy className="w-4 h-4 mr-2" />
                Clone Quote
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEmailToClient}>
                <Mail className="w-4 h-4 mr-2" />
                Email to Client
              </DropdownMenuItem>
              {quote.status === 'draft' && (
                <>
                  <DropdownMenuItem onClick={() => router.push(`/quotes/${quoteId}/edit`)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Quote
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Quote
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Info */}
          <Card>
            <CardHeader>
              <CardTitle>{quote.title}</CardTitle>
              {quote.description && (
                <CardDescription>{quote.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Valid Until
                  </p>
                  <p className="font-semibold">{formatDate(quote.validUntil)}</p>
                </div>
                {quote.sentAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Sent On
                    </p>
                    <p className="font-semibold">{formatDate(quote.sentAt)}</p>
                  </div>
                )}
                {quote.acceptedAt && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Accepted On
                    </p>
                    <p className="font-semibold">{formatDate(quote.acceptedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Products and services included in this quote
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
                    {quote.lineItems.map((item, index) => (
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

          {/* Terms & Conditions */}
          {quote.terms && (
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quote.terms}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Decline Reason */}
          {quote.status === 'declined' && quote.declineReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Decline Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-800">{quote.declineReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          {quote.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
                <CardDescription>Not visible to client</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {quote.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Quote Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(quote.subtotal)}
                  </span>
                </div>

                {quote.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount
                      {quote.discountType === 'percentage'
                        ? ` (${quote.discountValue}%)`
                        : ''}
                    </span>
                    <span className="font-semibold text-green-600">
                      -{formatCurrency(quote.discountAmount)}
                    </span>
                  </div>
                )}

                {quote.taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Tax ({quote.taxRate}%)
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(quote.taxAmount)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between">
                  <span className="text-base font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(quote.total)}
                  </span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Activity Timeline
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">
                      Created on {formatDate(quote.createdAt)}
                    </span>
                  </div>
                  {quote.sentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-muted-foreground">
                        Sent on {formatDate(quote.sentAt)}
                      </span>
                    </div>
                  )}
                  {quote.acceptedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">
                        Accepted on {formatDate(quote.acceptedAt)}
                      </span>
                    </div>
                  )}
                  {quote.declinedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">
                        Declined on {formatDate(quote.declinedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Quote</DialogTitle>
            <DialogDescription>
              Please provide a reason for declining this quote.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason for declining</Label>
              <Textarea
                id="reason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Client found a better price elsewhere"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline}>
              Decline Quote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
