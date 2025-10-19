'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Plus,
  Filter,
  TrendingUp,
  CheckCircle,
  XCircle,
  DollarSign,
  MoreVertical,
  Send,
  Copy,
  Eye,
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

interface Quote {
  _id: string
  quoteNumber: string
  title: string
  clientId: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'converted' | 'expired'
  total: number
  subtotal: number
  currency: string
  validUntil: string
  createdAt: string
  sentAt?: string
  acceptedAt?: string
}

interface QuoteMetrics {
  totalQuotes: number
  draftQuotes: number
  sentQuotes: number
  acceptedQuotes: number
  declinedQuotes: number
  convertedQuotes: number
  totalValue: number
  acceptedValue: number
  acceptanceRate: number
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

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [metrics, setMetrics] = useState<QuoteMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchQuotes()
    fetchMetrics()
  }, [statusFilter])

  const fetchQuotes = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const response = await fetch(`/api/quotes?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setQuotes(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/quotes/stats')
      const data = await response.json()

      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchQuotes()
  }

  const handleSendQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchQuotes()
        fetchMetrics()
      }
    } catch (error) {
      console.error('Failed to send quote:', error)
    }
  }

  const handleCloneQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/clone`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchQuotes()
      }
    } catch (error) {
      console.error('Failed to clone quote:', error)
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

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">
            Create and manage client quotes and proposals
          </p>
        </div>
        <Button onClick={() => router.push('/quotes/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Quote
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Quotes
              </CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalQuotes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.sentQuotes} sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Acceptance Rate
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.acceptanceRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.acceptedQuotes} accepted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Value
              </CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.totalValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All quotes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accepted Value
              </CardTitle>
              <CheckCircle className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics.acceptedValue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.convertedQuotes} converted
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Quote List</CardTitle>
          <CardDescription>
            View and manage all your quotes and proposals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes by number, title, or client..."
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
                <SelectItem value="viewed">Viewed</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quote List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">Loading quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No quotes found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first quote'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button onClick={() => router.push('/quotes/new')} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quote
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {quotes.map((quote) => {
                const expired = isExpired(quote.validUntil) && quote.status === 'sent'
                const displayStatus = expired ? 'expired' : quote.status

                return (
                  <Card
                    key={quote._id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/quotes/${quote._id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {quote.quoteNumber}
                            </h3>
                            <Badge variant="outline" className={statusColors[displayStatus]}>
                              {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                            </Badge>
                            {expired && (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-200">
                                Expired
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mb-4">
                            {quote.title}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="text-sm font-semibold">
                                {formatCurrency(quote.total, quote.currency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Valid Until</p>
                              <p className="text-sm font-semibold">
                                {formatDate(quote.validUntil)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Created</p>
                              <p className="text-sm font-semibold">
                                {formatDate(quote.createdAt)}
                              </p>
                            </div>
                            {quote.sentAt && (
                              <div>
                                <p className="text-xs text-muted-foreground">Sent</p>
                                <p className="text-sm font-semibold">
                                  {formatDate(quote.sentAt)}
                                </p>
                              </div>
                            )}
                          </div>
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
                              router.push(`/quotes/${quote._id}`)
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleSendQuote(quote._id)
                              }}>
                                <Send className="w-4 h-4 mr-2" />
                                Send Quote
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleCloneQuote(quote._id)
                            }}>
                              <Copy className="w-4 h-4 mr-2" />
                              Clone Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/quotes/${quote._id}/edit`)
                            }}>
                              Edit Quote
                            </DropdownMenuItem>
                            {quote.status === 'draft' && (
                              <DropdownMenuItem className="text-red-600">
                                Delete Quote
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
