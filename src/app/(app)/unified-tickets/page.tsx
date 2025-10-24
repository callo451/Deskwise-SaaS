'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
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
  Plus,
  Search,
  Filter,
  Ticket,
  AlertTriangle,
  Settings,
  HelpCircle,
  GitBranch,
  Loader2,
  TrendingUp,
} from 'lucide-react'
import { UnifiedTicket, TicketType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { ModernPriorityBadge } from '@/components/tickets/modern-priority-badge'
import { cn } from '@/lib/utils'

type TabValue = 'all' | 'ticket' | 'incident' | 'service_request' | 'change' | 'problem'

const TAB_CONFIG = {
  all: {
    label: 'All',
    icon: Ticket,
    color: 'text-gray-600',
  },
  ticket: {
    label: 'Tickets',
    icon: Ticket,
    color: 'text-blue-600',
  },
  incident: {
    label: 'Incidents',
    icon: AlertTriangle,
    color: 'text-red-600',
  },
  service_request: {
    label: 'Service Requests',
    icon: HelpCircle,
    color: 'text-green-600',
  },
  change: {
    label: 'Changes',
    icon: Settings,
    color: 'text-orange-600',
  },
  problem: {
    label: 'Problems',
    icon: GitBranch,
    color: 'text-purple-600',
  },
}

export default function UnifiedTicketsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabValue>('all')
  const [tickets, setTickets] = useState<UnifiedTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<UnifiedTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchTickets()
    fetchStats()
  }, [activeTab])

  useEffect(() => {
    filterTickets()
  }, [searchQuery, tickets])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()

      if (activeTab !== 'all') {
        params.set('type', activeTab)
      }

      const response = await fetch(`/api/unified-tickets?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.tickets || [])
        setFilteredTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/unified-tickets/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.byType || {})
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const filterTickets = () => {
    if (!searchQuery.trim()) {
      setFilteredTickets(tickets)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = tickets.filter(
      (ticket) =>
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query)
    )
    setFilteredTickets(filtered)
  }

  const getStatusBadgeColor = (status: string, type: TicketType) => {
    const statusColors: Record<string, string> = {
      // Tickets
      new: 'bg-blue-100 text-blue-800',
      open: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-orange-100 text-orange-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      // Incidents
      investigating: 'bg-yellow-100 text-yellow-800',
      identified: 'bg-orange-100 text-orange-800',
      monitoring: 'bg-blue-100 text-blue-800',
      // Service Requests
      submitted: 'bg-blue-100 text-blue-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      in_progress: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      // Changes
      draft: 'bg-gray-100 text-gray-800',
      scheduled: 'bg-blue-100 text-blue-800',
      implementing: 'bg-orange-100 text-orange-800',
    }

    return statusColors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadgeColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      low: 'bg-blue-100 text-blue-800 border-blue-200',
    }

    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTypeIcon = (type: TicketType) => {
    const config = TAB_CONFIG[type]
    const Icon = config?.icon || Ticket
    return <Icon className={`h-4 w-4 ${config?.color || 'text-gray-600'}`} />
  }

  const handleCreateTicket = () => {
    router.push('/unified-tickets/new')
  }

  const handleRowClick = (ticket: UnifiedTicket) => {
    router.push(`/unified-tickets/${ticket._id}`)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and Tabs - Integrated */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tickets</h1>
            <p className="text-muted-foreground text-base mt-1">
              Manage all tickets, incidents, changes, service requests, and problems
            </p>
          </div>
        </div>
        <Button onClick={handleCreateTicket} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(TAB_CONFIG)
          .filter(([key]) => key !== 'all')
          .map(([key, config]) => {
            const Icon = config.icon
            const typeStat = stats[key] || { total: 0, open: 0 }

            return (
              <Card
                key={key}
                className="border-2 shadow-lg cursor-pointer hover:shadow-xl hover:border-primary/50 transition-all"
                onClick={() => setActiveTab(key as TabValue)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardDescription className="text-xs font-medium mb-2">
                        {config.label}
                      </CardDescription>
                      <div className="flex items-baseline gap-2">
                        <CardTitle className="text-3xl">{typeStat.total}</CardTitle>
                        <span className="text-xs text-muted-foreground">total</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-muted-foreground">
                          {typeStat.open} open
                        </span>
                      </div>
                    </div>
                    <div className={cn("p-3 rounded-lg", config.color.replace('text-', 'bg-') + '/10')}>
                      <Icon className={cn("h-8 w-8", config.color)} />
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
      </div>

      {/* Search, Filters, and Tabs - Integrated */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <Card className="border-2 shadow-lg">
          <CardHeader className="space-y-4 pb-4">
            {/* Search and Filters */}
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket number, title, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-2"
                />
              </div>
              <Button variant="outline" className="border-2">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              {Object.entries(TAB_CONFIG).map(([key, config]) => {
                const Icon = config.icon
                const isActive = activeTab === key

                // Get color classes based on ticket type
                const colorClasses = {
                  all: {
                    bg: 'bg-gray-500/10',
                    activeBg: 'bg-gray-500/20',
                    border: 'border-gray-500/30',
                    activeBorder: 'border-gray-500',
                    text: 'text-gray-700 dark:text-gray-300',
                    activeText: 'text-gray-900 dark:text-gray-100',
                    icon: 'text-gray-600',
                    activeIcon: 'text-gray-700',
                  },
                  ticket: {
                    bg: 'bg-blue-500/10',
                    activeBg: 'bg-blue-500/20',
                    border: 'border-blue-500/30',
                    activeBorder: 'border-blue-500',
                    text: 'text-blue-700 dark:text-blue-300',
                    activeText: 'text-blue-900 dark:text-blue-100',
                    icon: 'text-blue-600',
                    activeIcon: 'text-blue-700',
                  },
                  incident: {
                    bg: 'bg-red-500/10',
                    activeBg: 'bg-red-500/20',
                    border: 'border-red-500/30',
                    activeBorder: 'border-red-500',
                    text: 'text-red-700 dark:text-red-300',
                    activeText: 'text-red-900 dark:text-red-100',
                    icon: 'text-red-600',
                    activeIcon: 'text-red-700',
                  },
                  service_request: {
                    bg: 'bg-green-500/10',
                    activeBg: 'bg-green-500/20',
                    border: 'border-green-500/30',
                    activeBorder: 'border-green-500',
                    text: 'text-green-700 dark:text-green-300',
                    activeText: 'text-green-900 dark:text-green-100',
                    icon: 'text-green-600',
                    activeIcon: 'text-green-700',
                  },
                  change: {
                    bg: 'bg-orange-500/10',
                    activeBg: 'bg-orange-500/20',
                    border: 'border-orange-500/30',
                    activeBorder: 'border-orange-500',
                    text: 'text-orange-700 dark:text-orange-300',
                    activeText: 'text-orange-900 dark:text-orange-100',
                    icon: 'text-orange-600',
                    activeIcon: 'text-orange-700',
                  },
                  problem: {
                    bg: 'bg-purple-500/10',
                    activeBg: 'bg-purple-500/20',
                    border: 'border-purple-500/30',
                    activeBorder: 'border-purple-500',
                    text: 'text-purple-700 dark:text-purple-300',
                    activeText: 'text-purple-900 dark:text-purple-100',
                    icon: 'text-purple-600',
                    activeIcon: 'text-purple-700',
                  },
                }[key as TabValue]

                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as TabValue)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 font-medium transition-all duration-200',
                      'hover:shadow-md hover:scale-105',
                      isActive ? [
                        colorClasses.activeBg,
                        colorClasses.activeBorder,
                        colorClasses.activeText,
                        'shadow-lg scale-105'
                      ] : [
                        colorClasses.bg,
                        colorClasses.border,
                        colorClasses.text,
                        'hover:' + colorClasses.activeBg
                      ]
                    )}
                  >
                    <Icon className={cn(
                      'h-4 w-4',
                      isActive ? colorClasses.activeIcon : colorClasses.icon
                    )} />
                    <span className="text-sm">{config.label}</span>
                  </button>
                )
              })}
            </div>
          </CardHeader>

        <TabsContent value={activeTab} className="mt-0">
          <Card className="border-0 shadow-none">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center p-12">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">No tickets found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {searchQuery
                    ? 'Try adjusting your search'
                    : `Create your first ${activeTab === 'all' ? 'ticket' : TAB_CONFIG[activeTab].label.toLowerCase()}`}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-accent/30 to-accent/10 hover:bg-gradient-to-r hover:from-accent/40 hover:to-accent/20">
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Number</TableHead>
                    <TableHead className="font-semibold">Title</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Priority</TableHead>
                    <TableHead className="font-semibold">Assigned To</TableHead>
                    <TableHead className="font-semibold">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket._id.toString()}
                      onClick={() => handleRowClick(ticket)}
                      className="cursor-pointer hover:bg-accent/30 transition-all border-b-2 border-dashed"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "p-1.5 rounded-md",
                            TAB_CONFIG[ticket.ticketType]?.color.replace('text-', 'bg-') + '/10'
                          )}>
                            {getTypeIcon(ticket.ticketType)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-semibold bg-primary/5 px-2 py-1 rounded border">
                          {ticket.ticketNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-semibold text-foreground truncate">{ticket.title}</p>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{ticket.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium border-2 transition-all duration-200",
                            getStatusBadgeColor(ticket.status, ticket.ticketType)
                          )}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ModernPriorityBadge
                          priority={ticket.priority as 'low' | 'medium' | 'high' | 'critical'}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {ticket.assignedToName || ticket.assignedTo ? (
                            <>
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                {(ticket.assignedToName || ticket.assignedTo || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium">
                                {ticket.assignedToName || ticket.assignedTo}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">Unassigned</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
        </Card>
      </Tabs>
    </div>
  )
}
