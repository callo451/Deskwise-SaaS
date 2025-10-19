'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
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
} from 'lucide-react'
import { UnifiedTicket, TicketType } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-500 mt-1">
            Unified view of all tickets, incidents, changes, and service requests
          </p>
        </div>
        <Button onClick={handleCreateTicket}>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(TAB_CONFIG)
          .filter(([key]) => key !== 'all')
          .map(([key, config]) => {
            const Icon = config.icon
            const typeStat = stats[key] || { total: 0, open: 0 }

            return (
              <Card
                key={key}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab(key as TabValue)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{config.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{typeStat.total}</p>
                    <p className="text-xs text-gray-500 mt-1">{typeStat.open} open</p>
                  </div>
                  <Icon className={`h-8 w-8 ${config.color}`} />
                </div>
              </Card>
            )
          })}
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by ticket number, title, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="w-full justify-start">
          {Object.entries(TAB_CONFIG).map(([key, config]) => {
            const Icon = config.icon
            return (
              <TabsTrigger key={key} value={key} className="gap-2">
                <Icon className="h-4 w-4" />
                {config.label}
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
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
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket._id.toString()}
                      onClick={() => handleRowClick(ticket)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(ticket.ticketType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm font-medium">
                          {ticket.ticketNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                          <p className="text-sm text-gray-500 truncate">{ticket.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusBadgeColor(ticket.status, ticket.ticketType)}
                        >
                          {ticket.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPriorityBadgeColor(ticket.priority)}
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700">
                          {ticket.assignedToName || ticket.assignedTo || 'Unassigned'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-500">
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
      </Tabs>
    </div>
  )
}
