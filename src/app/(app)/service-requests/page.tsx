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
import { Plus, Search, AlertCircle, Clock, CheckCircle2, User, FileText } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface ServiceRequest {
  _id: string
  requestNumber: string
  title: string
  description: string
  status: 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  requestedBy?: string
  requestedByName?: string
  assignedTo?: string
  assignedToName?: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: string
    resolutionDeadline: string
    breached: boolean
  }
}

export default function ServiceRequestsPage() {
  const { data: session } = useSession()
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [approvalFilter, setApprovalFilter] = useState('all')

  useEffect(() => {
    fetchServiceRequests()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchServiceRequests, 30000)
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter, approvalFilter])

  const fetchServiceRequests = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (approvalFilter !== 'all') params.set('approvalStatus', approvalFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/service-requests?${params}`)
      const data = await response.json()

      if (data.success) {
        setServiceRequests(data.data)
      }
    } catch (error) {
      console.error('Error fetching service requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchServiceRequests()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; className: string }> = {
      submitted: { variant: 'default', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      pending_approval: { variant: 'default', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      approved: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      rejected: { variant: 'default', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      in_progress: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      completed: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      cancelled: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    const cfg = config[status] || config.submitted
    return <Badge variant={cfg.variant} className={cfg.className}>{status.replace('_', ' ').toUpperCase()}</Badge>
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

  const getSLAIndicator = (request: ServiceRequest) => {
    if (!request.sla) {
      return <span className="text-xs text-muted-foreground">No SLA</span>
    }

    if (request.sla.breached) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">BREACHED</span>
        </div>
      )
    }

    const deadline = new Date(request.sla.resolutionDeadline)
    const now = new Date()
    const timeLeft = deadline.getTime() - now.getTime()
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

    if (timeLeft < 0) {
      return (
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-medium text-red-600 dark:text-red-400">OVERDUE</span>
        </div>
      )
    }

    // Warning if less than 2 hours left
    if (hoursLeft < 2) {
      return (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-orange-500" />
          <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
            {hoursLeft > 0 ? `${hoursLeft}h ${minutesLeft}m` : `${minutesLeft}m`}
          </span>
        </div>
      )
    }

    // On track
    return (
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        <span className="text-xs text-green-600 dark:text-green-400">
          {hoursLeft > 24 ? `${Math.floor(hoursLeft / 24)}d` : `${hoursLeft}h`}
        </span>
      </div>
    )
  }

  // Quick stats at the top
  const stats = {
    total: serviceRequests.length,
    active: serviceRequests.filter(r => ['submitted', 'pending_approval', 'approved', 'in_progress'].includes(r.status)).length,
    pendingApproval: serviceRequests.filter(r => r.status === 'pending_approval').length,
    breached: serviceRequests.filter(r => r.sla?.breached).length,
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
          <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
          <p className="text-muted-foreground">
            Manage and track service requests from the catalog
          </p>
        </div>
        <Link href="/service-requests/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Request
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
            <p className="text-xs text-muted-foreground mt-1">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground mt-1">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.breached}</div>
            <p className="text-xs text-muted-foreground mt-1">SLA Breached</p>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
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
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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

              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Approval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Approvals</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Service Requests Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Service Requests</CardTitle>
            <CardDescription>
              {serviceRequests.length} {serviceRequests.length === 1 ? 'request' : 'requests'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request #</TableHead>
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
                  ) : serviceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <div className="py-8">
                          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            No service requests found
                          </p>
                          <Link href="/service-requests/new">
                            <Button variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Your First Request
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    serviceRequests.map((request, index) => (
                      <motion.tr
                        key={request._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link href={`/service-requests/${request._id}`} className="hover:underline text-primary">
                            {request.requestNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/service-requests/${request._id}`} className="hover:underline">
                            {request.title}
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{getPriorityBadge(request.priority)}</TableCell>
                        <TableCell>{getSLAIndicator(request)}</TableCell>
                        <TableCell>
                          {request.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{request.assignedToName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatRelativeTime(request.updatedAt)}
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
