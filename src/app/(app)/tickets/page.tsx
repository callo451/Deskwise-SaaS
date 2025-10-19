'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Search, AlertCircle, Clock, CheckCircle2, User, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SLAIndicator } from '@/components/tickets/sla-indicator'

interface Ticket {
  _id: string
  ticketNumber: string
  title: string
  description: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  assignedTo?: string
  assignedToName?: string
  createdAt: string
  updatedAt: string
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: string
    resolutionDeadline: string
    breached: boolean
  }
  requesterId: string
  tags: string[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
}

export default function TicketsPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [slaFilter, setSlaFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchTickets()
    // Auto-refresh every 30 seconds to update SLA timers
    const interval = setInterval(fetchTickets, 30000)
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter, slaFilter, assigneeFilter, page])

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1)
  }, [statusFilter, priorityFilter, slaFilter, assigneeFilter, search])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (slaFilter !== 'all') params.set('sla', slaFilter)
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned') {
          params.set('assignedTo', 'null')
        } else if (assigneeFilter === 'me') {
          params.set('assignedTo', session?.user?.id || '')
        } else {
          params.set('assignedTo', assigneeFilter)
        }
      }
      if (search) params.set('search', search)
      params.set('page', page.toString())
      params.set('limit', limit.toString())

      const response = await fetch(`/api/tickets?${params}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.data)
        if (data.pagination) {
          setTotal(data.pagination.total)
          setTotalPages(data.pagination.totalPages)
          setHasMore(data.pagination.hasMore)
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchTickets()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      new: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      open: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      pending: { variant: 'default', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      resolved: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    const cfg = config[status] || config.new
    return <Badge variant={cfg.variant} className={cfg.className}>{status.toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: any; className: string; icon: any }> = {
      low: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: null },
      medium: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: null },
      high: { variant: 'default', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertCircle },
      critical: { variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
    }
    const cfg = config[priority] || config.medium
    return (
      <Badge variant={cfg.variant} className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }


  // Quick stats at the top
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['new', 'open', 'pending'].includes(t.status)).length,
    breached: tickets.filter(t => t.sla?.breached).length,
    unassigned: tickets.filter(t => !t.assignedTo).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground">
            Manage and track IT service requests
          </p>
        </div>
        <Link href="/tickets/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </Link>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
            <p className="text-xs text-muted-foreground mt-1">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.breached}</div>
            <p className="text-xs text-muted-foreground mt-1">SLA Breached</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground mt-1">Unassigned</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-9"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="me">My Tickets</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>

              <Select value={slaFilter} onValueChange={setSlaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="SLA Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SLA</SelectItem>
                  <SelectItem value="breached">Breached</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="on-track">On Track</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tickets Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Tickets</CardTitle>
            <CardDescription>
              {total > 0 ? (
                <>
                  Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total} {total === 1 ? 'ticket' : 'tickets'}
                </>
              ) : (
                'No tickets found'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <div className="py-8">
                          <p className="text-muted-foreground mb-4">
                            No tickets found
                          </p>
                          <Link href="/tickets/new">
                            <Button variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Your First Ticket
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    tickets.map((ticket, index) => (
                      <motion.tr
                        key={ticket._id}
                        variants={item}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: index * 0.02 }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link href={`/tickets/${ticket._id}`} className="hover:underline text-primary">
                            {ticket.ticketNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/tickets/${ticket._id}`} className="hover:underline">
                            {ticket.title}
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>
                          <SLAIndicator sla={ticket.sla} createdAt={ticket.createdAt} variant="compact" />
                        </TableCell>
                        <TableCell>
                          {ticket.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{ticket.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeTime(ticket.updatedAt)}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Show pages around current page
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={!hasMore}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
