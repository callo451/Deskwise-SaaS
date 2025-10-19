'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Search,
  Plus,
  Filter,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  MoreVertical,
  Send,
  Eye,
  Ban,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface Invoice {
  _id: string
  invoiceNumber: string
  clientId: string
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'
  total: number
  amountPaid: number
  amountDue: number
  currency: string
  issueDate: string
  dueDate: string
  createdAt: string
  sentAt?: string
  paidAt?: string
}

interface InvoiceMetrics {
  totalInvoices: number
  draftInvoices: number
  sentInvoices: number
  paidInvoices: number
  partialInvoices: number
  overdueInvoices: number
  totalRevenue: number
  totalPaid: number
  totalOutstanding: number
}

interface AgingReport {
  current: number
  days30: number
  days60: number
  days90: number
  days90Plus: number
}

const statusColors = {
  draft: 'bg-gray-500/10 text-gray-600 border-gray-200',
  sent: 'bg-blue-500/10 text-blue-600 border-blue-200',
  partial: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
  paid: 'bg-green-500/10 text-green-600 border-green-200',
  overdue: 'bg-red-500/10 text-red-600 border-red-200',
  void: 'bg-gray-500/10 text-gray-600 border-gray-200',
}

export default function BillingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [metrics, setMetrics] = useState<InvoiceMetrics | null>(null)
  const [agingReport, setAgingReport] = useState<AgingReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchInvoices()
    fetchMetrics()
    fetchAgingReport()
  }, [statusFilter])

  const fetchInvoices = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/billing/invoices?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setInvoices(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/billing/stats')
      const data = await response.json()

      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const fetchAgingReport = async () => {
    try {
      const response = await fetch('/api/billing/aging')
      const data = await response.json()

      if (data.success) {
        setAgingReport(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch aging report:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchInvoices()
  }

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoiceId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchInvoices()
        fetchMetrics()
      }
    } catch (error) {
      console.error('Failed to send invoice:', error)
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && (status === 'sent' || status === 'partial')
  }

  const calculateCollectionRate = () => {
    if (!metrics) return 0
    if (metrics.totalRevenue === 0) return 0
    return Math.round((metrics.totalPaid / metrics.totalRevenue) * 100)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            Manage invoices, payments, and billing schedules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/billing/recurring')}>
            Recurring Billing
          </Button>
          <Button onClick={() => router.push('/billing/invoices/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.totalInvoices} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Collected
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(metrics.totalPaid)}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={calculateCollectionRate()} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground">
                  {calculateCollectionRate()}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Outstanding
              </CardTitle>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(metrics.totalOutstanding)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.sentInvoices + metrics.partialInvoices} unpaid
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overdue
              </CardTitle>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics.overdueInvoices}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aging Report Card */}
      {agingReport && (
        <Card>
          <CardHeader>
            <CardTitle>Accounts Receivable Aging</CardTitle>
            <CardDescription>
              Outstanding balances by age
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">Current</p>
                <p className="text-xl font-bold">{formatCurrency(agingReport.current)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">1-30 Days</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(agingReport.days30)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">31-60 Days</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(agingReport.days60)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">61-90 Days</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(agingReport.days90)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-1">90+ Days</p>
                <p className="text-xl font-bold text-red-700">{formatCurrency(agingReport.days90Plus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            View and manage all your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices by number or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="void">Void</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading invoices...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first invoice'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/billing/invoices/new')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Invoice
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {invoices.map((invoice) => {
                const overdue = isOverdue(invoice.dueDate, invoice.status)
                const displayStatus = overdue ? 'overdue' : invoice.status

                return (
                  <Card
                    key={invoice._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/billing/invoices/${invoice._id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {invoice.invoiceNumber}
                            </h3>
                            <Badge variant="outline" className={statusColors[displayStatus]}>
                              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                            </Badge>
                            {overdue && (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                                Overdue
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-sm font-semibold">
                                {formatCurrency(invoice.total, invoice.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Paid</p>
                              <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(invoice.amountPaid, invoice.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Due</p>
                              <p className={`text-sm font-semibold ${invoice.amountDue > 0 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                                {formatCurrency(invoice.amountDue, invoice.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Issue Date</p>
                              <p className="text-sm font-semibold">
                                {formatDate(invoice.issueDate)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Due Date</p>
                              <p className="text-sm font-semibold">
                                {formatDate(invoice.dueDate)}
                              </p>
                            </div>
                          </div>

                          {invoice.status === 'partial' && (
                            <div className="mt-3">
                              <Progress
                                value={(invoice.amountPaid / invoice.total) * 100}
                                className="h-2"
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                {Math.round((invoice.amountPaid / invoice.total) * 100)}% paid
                              </p>
                            </div>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/billing/invoices/${invoice._id}`)
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleSendInvoice(invoice._id)
                              }}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/billing/invoices/${invoice._id}/edit`)
                            }}>
                              Edit Invoice
                            </DropdownMenuItem>
                            {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/billing/invoices/${invoice._id}/payment`)
                              }}>
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            {invoice.status !== 'void' && invoice.status !== 'paid' && (
                              <DropdownMenuItem className="text-orange-600">
                                <Ban className="w-4 h-4 mr-2" />
                                Void Invoice
                              </DropdownMenuItem>
                            )}
                            {invoice.status === 'draft' && (
                              <DropdownMenuItem className="text-red-600">
                                Delete Invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
