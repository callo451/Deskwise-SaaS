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
import { Plus, Search, AlertTriangle, Clock, User, TrendingUp, TrendingDown } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Incident {
  _id: string
  incidentNumber: string
  title: string
  description: string
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  severity: 'minor' | 'major' | 'critical'
  impact?: 'low' | 'medium' | 'high'
  urgency?: 'low' | 'medium' | 'high'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  affectedServices: string[]
  isPublic: boolean
  assignedTo?: string
  assignedToName?: string
  startedAt: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
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

export default function IncidentsPage() {
  const { data: session } = useSession()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  useEffect(() => {
    fetchIncidents()
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchIncidents, 30000)
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter])

  const fetchIncidents = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/incidents?${params}`)
      const data = await response.json()

      if (data.success) {
        setIncidents(data.data)
      }
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchIncidents()
  }

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, { className: string }> = {
      minor: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      major: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      critical: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    }
    const cfg = config[severity] || config.minor
    return <Badge className={cfg.className}>{severity.toUpperCase()}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      investigating: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      identified: { className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      monitoring: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      resolved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    }
    const cfg = config[status] || config.investigating
    return <Badge className={cfg.className}>{status.toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return <span className="text-xs text-muted-foreground">Not set</span>

    const config: Record<string, { className: string; icon: any }> = {
      low: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400', icon: TrendingDown },
      medium: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400', icon: null },
      high: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400', icon: TrendingUp },
      critical: { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400', icon: AlertTriangle },
    }
    const cfg = config[priority] || config.medium
    return (
      <Badge className={cfg.className}>
        {cfg.icon && <cfg.icon className="w-3 h-3 mr-1" />}
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getImpactUrgencyBadge = (level?: string, type: 'impact' | 'urgency' = 'impact') => {
    if (!level) return <span className="text-xs text-muted-foreground">-</span>

    const config: Record<string, { className: string }> = {
      low: { className: 'text-xs text-gray-600 dark:text-gray-400' },
      medium: { className: 'text-xs text-blue-600 dark:text-blue-400' },
      high: { className: 'text-xs text-orange-600 dark:text-orange-400 font-medium' },
    }
    const cfg = config[level] || config.medium
    return <span className={cfg.className}>{level}</span>
  }

  const getDuration = (incident: Incident) => {
    const start = new Date(incident.startedAt)
    const end = incident.resolvedAt ? new Date(incident.resolvedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()

    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Quick stats
  const stats = {
    total: incidents.length,
    active: incidents.filter(i => ['investigating', 'identified', 'monitoring'].includes(i.status)).length,
    critical: incidents.filter(i => i.priority === 'critical').length,
    avgResolutionTime: incidents.filter(i => i.resolvedAt).length > 0
      ? Math.floor(
          incidents
            .filter(i => i.resolvedAt)
            .reduce((sum, i) => {
              const duration = new Date(i.resolvedAt!).getTime() - new Date(i.startedAt).getTime()
              return sum + duration
            }, 0) /
          incidents.filter(i => i.resolvedAt).length /
          (1000 * 60 * 60)
        )
      : 0,
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
          <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
          <p className="text-muted-foreground">
            Track and manage service disruptions
          </p>
        </div>
        <Link href="/incidents/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Incident
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
            <p className="text-xs text-muted-foreground mt-1">Total Incidents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground mt-1">Critical Priority</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.avgResolutionTime}h</div>
            <p className="text-xs text-muted-foreground mt-1">Avg Resolution</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search incidents..."
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
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Incidents Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Incidents</CardTitle>
            <CardDescription>
              {incidents.length} {incidents.length === 1 ? 'incident' : 'incidents'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Incident #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : incidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        <div className="py-8">
                          <p className="text-muted-foreground mb-4">
                            No incidents found
                          </p>
                          <Link href="/incidents/new">
                            <Button variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Your First Incident
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incidents.map((incident, index) => (
                      <motion.tr
                        key={incident._id}
                        variants={item}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: index * 0.02 }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link href={`/incidents/${incident._id}`} className="hover:underline text-primary">
                            {incident.incidentNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/incidents/${incident._id}`}>
                            <div className="flex items-center gap-2">
                              <span className="hover:underline">{incident.title}</span>
                              {incident.isPublic && (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(incident.status)}</TableCell>
                        <TableCell>{getPriorityBadge(incident.priority)}</TableCell>
                        <TableCell>{getImpactUrgencyBadge(incident.impact, 'impact')}</TableCell>
                        <TableCell>{getImpactUrgencyBadge(incident.urgency, 'urgency')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getDuration(incident)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {incident.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{incident.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                      </motion.tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
