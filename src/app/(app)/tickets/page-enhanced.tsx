'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Trash2,
  MoreVertical,
  Eye,
  Edit3,
  Copy,
  Columns3,
  SlidersHorizontal,
  RefreshCw,
  Keyboard,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { SLAIndicator } from '@/components/tickets/sla-indicator'
import { KeyboardShortcutsHelp } from '@/components/tickets/keyboard-shortcuts-help'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'

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
  requesterId: string
  requesterName?: string
  createdAt: string
  updatedAt: string
  tags: string[]
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: string
    resolutionDeadline: string
    breached: boolean
  }
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

interface ColumnConfig {
  id: string
  label: string
  enabled: boolean
}

export default function EnhancedTicketsPage() {
  const { data: session } = useSession()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<string[]>([])
  const [slaFilter, setSlaFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])

  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Column visibility
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: 'number', label: 'Ticket #', enabled: true },
    { id: 'title', label: 'Title', enabled: true },
    { id: 'status', label: 'Status', enabled: true },
    { id: 'priority', label: 'Priority', enabled: true },
    { id: 'sla', label: 'SLA', enabled: true },
    { id: 'assignee', label: 'Assignee', enabled: true },
    { id: 'requester', label: 'Requester', enabled: false },
    { id: 'category', label: 'Category', enabled: false },
    { id: 'updated', label: 'Updated', enabled: true },
  ])

  useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, 30000)
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter, slaFilter, assigneeFilter, page, search])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, priorityFilter, slaFilter, assigneeFilter, search])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter.length > 0) params.set('status', statusFilter.join(','))
      if (priorityFilter.length > 0) params.set('priority', priorityFilter.join(','))
      if (slaFilter !== 'all') params.set('sla', slaFilter)
      if (assigneeFilter !== 'all') params.set('assignee', assigneeFilter)
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
        }
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedTickets.length === 0) return
    // Implement bulk status change
    console.log('Bulk status change:', newStatus, selectedTickets)
  }

  const handleBulkDelete = async () => {
    if (selectedTickets.length === 0) return
    if (!confirm(`Delete ${selectedTickets.length} tickets?`)) return
    // Implement bulk delete
    console.log('Bulk delete:', selectedTickets)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Export tickets:', selectedTickets.length > 0 ? selectedTickets : 'all')
  }

  const toggleColumn = (columnId: string) => {
    setColumns(prev =>
      prev.map(col =>
        col.id === columnId ? { ...col, enabled: !col.enabled } : col
      )
    )
  }

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev =>
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const toggleAllTickets = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([])
    } else {
      setSelectedTickets(tickets.map(t => t._id))
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      new: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      open: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      pending: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      resolved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    return <Badge className={config[status]?.className}>{status.toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string; icon?: any }> = {
      low: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
      medium: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: AlertCircle },
      critical: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertCircle },
    }
    const cfg = config[priority]
    const Icon = cfg?.icon
    return (
      <Badge className={cfg?.className}>
        {Icon && <Icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const stats = useMemo(() => ({
    total: total,
    open: tickets.filter(t => ['new', 'open', 'pending'].includes(t.status)).length,
    breached: tickets.filter(t => t.sla?.breached).length,
    unassigned: tickets.filter(t => !t.assignedTo).length,
  }), [tickets, total])

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'n',
      description: 'Create new ticket',
      action: () => window.location.href = '/tickets/new',
      category: 'Actions',
    },
    {
      key: 'r',
      description: 'Refresh ticket list',
      action: fetchTickets,
      category: 'Actions',
    },
    {
      key: '/',
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]')
        if (searchInput) (searchInput as HTMLInputElement).focus()
      },
      category: 'Navigation',
    },
  ]

  useKeyboardShortcuts({ shortcuts })

  return (
    <div className="space-y-6">
      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp shortcuts={shortcuts} />

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/tickets/new">
            <Button size="lg">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </Link>
        </div>
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

      {/* Advanced Filters & Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                <CardTitle className="text-lg">Filters & Actions</CardTitle>
              </div>
              {selectedTickets.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedTickets.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('open')}>
                        Set to Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('pending')}>
                        Set to Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStatusChange('resolved')}>
                        Set to Resolved
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Selected
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets... (press /)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Status Filter (Multi-select) */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Status {statusFilter.length > 0 && `(${statusFilter.length})`}</span>
                      <SlidersHorizontal className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes('new')}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev =>
                          checked ? [...prev, 'new'] : prev.filter(s => s !== 'new')
                        )
                      }}
                    >
                      New
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes('open')}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev =>
                          checked ? [...prev, 'open'] : prev.filter(s => s !== 'open')
                        )
                      }}
                    >
                      Open
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes('pending')}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev =>
                          checked ? [...prev, 'pending'] : prev.filter(s => s !== 'pending')
                        )
                      }}
                    >
                      Pending
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes('resolved')}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev =>
                          checked ? [...prev, 'resolved'] : prev.filter(s => s !== 'resolved')
                        )
                      }}
                    >
                      Resolved
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={statusFilter.includes('closed')}
                      onCheckedChange={(checked) => {
                        setStatusFilter(prev =>
                          checked ? [...prev, 'closed'] : prev.filter(s => s !== 'closed')
                        )
                      }}
                    >
                      Closed
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Priority Filter (Multi-select) */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>Priority {priorityFilter.length > 0 && `(${priorityFilter.length})`}</span>
                      <SlidersHorizontal className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuCheckboxItem
                      checked={priorityFilter.includes('low')}
                      onCheckedChange={(checked) => {
                        setPriorityFilter(prev =>
                          checked ? [...prev, 'low'] : prev.filter(p => p !== 'low')
                        )
                      }}
                    >
                      Low
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={priorityFilter.includes('medium')}
                      onCheckedChange={(checked) => {
                        setPriorityFilter(prev =>
                          checked ? [...prev, 'medium'] : prev.filter(p => p !== 'medium')
                        )
                      }}
                    >
                      Medium
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={priorityFilter.includes('high')}
                      onCheckedChange={(checked) => {
                        setPriorityFilter(prev =>
                          checked ? [...prev, 'high'] : prev.filter(p => p !== 'high')
                        )
                      }}
                    >
                      High
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={priorityFilter.includes('critical')}
                      onCheckedChange={(checked) => {
                        setPriorityFilter(prev =>
                          checked ? [...prev, 'critical'] : prev.filter(p => p !== 'critical')
                        )
                      }}
                    >
                      Critical
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* SLA Filter */}
              <div>
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

              {/* Column Visibility */}
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Columns3 className="w-4 h-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {columns.map(column => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        checked={column.enabled}
                        onCheckedChange={() => toggleColumn(column.id)}
                      >
                        {column.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedTickets.length === tickets.length && tickets.length > 0}
                        onCheckedChange={toggleAllTickets}
                      />
                    </TableHead>
                    {columns.find(c => c.id === 'number')?.enabled && <TableHead>Ticket #</TableHead>}
                    {columns.find(c => c.id === 'title')?.enabled && <TableHead>Title</TableHead>}
                    {columns.find(c => c.id === 'status')?.enabled && <TableHead>Status</TableHead>}
                    {columns.find(c => c.id === 'priority')?.enabled && <TableHead>Priority</TableHead>}
                    {columns.find(c => c.id === 'sla')?.enabled && <TableHead>SLA</TableHead>}
                    {columns.find(c => c.id === 'assignee')?.enabled && <TableHead>Assigned To</TableHead>}
                    {columns.find(c => c.id === 'requester')?.enabled && <TableHead>Requester</TableHead>}
                    {columns.find(c => c.id === 'category')?.enabled && <TableHead>Category</TableHead>}
                    {columns.find(c => c.id === 'updated')?.enabled && <TableHead>Updated</TableHead>}
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={columns.filter(c => c.enabled).length + 2} className="text-center">
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : tickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.filter(c => c.enabled).length + 2} className="text-center">
                        <div className="py-12">
                          <p className="text-muted-foreground mb-4">No tickets found</p>
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
                    tickets.map((ticket) => (
                      <TableRow
                        key={ticket._id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedTickets.includes(ticket._id)}
                            onCheckedChange={() => toggleTicketSelection(ticket._id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        {columns.find(c => c.id === 'number')?.enabled && (
                          <TableCell className="font-medium">
                            <Link href={`/tickets/${ticket._id}`} className="hover:underline text-primary">
                              {ticket.ticketNumber}
                            </Link>
                          </TableCell>
                        )}
                        {columns.find(c => c.id === 'title')?.enabled && (
                          <TableCell>
                            <Link href={`/tickets/${ticket._id}`} className="hover:underline">
                              {ticket.title}
                            </Link>
                          </TableCell>
                        )}
                        {columns.find(c => c.id === 'status')?.enabled && (
                          <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        )}
                        {columns.find(c => c.id === 'priority')?.enabled && (
                          <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        )}
                        {columns.find(c => c.id === 'sla')?.enabled && (
                          <TableCell>
                            <SLAIndicator sla={ticket.sla} createdAt={ticket.createdAt} variant="compact" />
                          </TableCell>
                        )}
                        {columns.find(c => c.id === 'assignee')?.enabled && (
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
                        )}
                        {columns.find(c => c.id === 'requester')?.enabled && (
                          <TableCell>
                            <span className="text-sm">{ticket.requesterName || 'Unknown'}</span>
                          </TableCell>
                        )}
                        {columns.find(c => c.id === 'category')?.enabled && (
                          <TableCell>
                            <span className="text-sm">{ticket.category}</span>
                          </TableCell>
                        )}
                        {columns.find(c => c.id === 'updated')?.enabled && (
                          <TableCell className="text-muted-foreground text-sm">
                            {formatRelativeTime(ticket.updatedAt)}
                          </TableCell>
                        )}
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/tickets/${ticket._id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="w-4 h-4 mr-2" />
                                Clone
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
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

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    disabled={page === totalPages}
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
