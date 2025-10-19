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
import { Plus, Search, AlertTriangle, TrendingUp, TrendingDown, Clock, User } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'

interface Problem {
  _id: string
  problemNumber: string
  title: string
  description: string
  status: 'open' | 'investigating' | 'known_error' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  category: string
  impact: 'low' | 'medium' | 'high'
  urgency: 'low' | 'medium' | 'high'
  assignedTo?: string
  assignedToName?: string
  relatedIncidents: string[]
  affectedServices: string[]
  isPublic: boolean
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

export default function ProblemsPage() {
  const { data: session } = useSession()
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [impactFilter, setImpactFilter] = useState('all')

  useEffect(() => {
    fetchProblems()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchProblems, 30000)
    return () => clearInterval(interval)
  }, [statusFilter, priorityFilter, impactFilter])

  const fetchProblems = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (priorityFilter !== 'all') params.set('priority', priorityFilter)
      if (impactFilter !== 'all') params.set('impact', impactFilter)
      if (search) params.set('search', search)

      const response = await fetch(`/api/problems?${params}`)
      const data = await response.json()

      if (data.success) {
        setProblems(data.data)
      }
    } catch (error) {
      console.error('Error fetching problems:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProblems()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string }> = {
      open: { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      investigating: { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      known_error: { className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      resolved: { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      closed: { className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
    }
    const cfg = config[status] || config.open
    return <Badge className={cfg.className}>{status.replace('_', ' ').toUpperCase()}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
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

  const getImpactBadge = (impact: string) => {
    const config: Record<string, { className: string }> = {
      low: { className: 'text-xs text-gray-600 dark:text-gray-400' },
      medium: { className: 'text-xs text-blue-600 dark:text-blue-400 font-medium' },
      high: { className: 'text-xs text-orange-600 dark:text-orange-400 font-bold' },
    }
    const cfg = config[impact] || config.medium
    return <span className={cfg.className}>{impact}</span>
  }

  const getDuration = (problem: Problem) => {
    const start = new Date(problem.startedAt)
    const end = problem.resolvedAt ? new Date(problem.resolvedAt) : new Date()
    const durationMs = end.getTime() - start.getTime()

    const days = Math.floor(durationMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  // Quick stats
  const stats = {
    total: problems.length,
    active: problems.filter(p => ['open', 'investigating'].includes(p.status)).length,
    knownErrors: problems.filter(p => p.status === 'known_error').length,
    resolved: problems.filter(p => ['resolved', 'closed'].includes(p.status)).length,
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
          <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
          <p className="text-muted-foreground">
            Root cause analysis and problem management
          </p>
        </div>
        <Link href="/problems/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Problem
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
            <p className="text-xs text-muted-foreground mt-1">Total Problems</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.knownErrors}</div>
            <p className="text-xs text-muted-foreground mt-1">Known Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground mt-1">Resolved</p>
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
                    placeholder="Search problems..."
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="known_error">Known Error</SelectItem>
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
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impact</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Problems Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>All Problems</CardTitle>
            <CardDescription>
              {problems.length} {problems.length === 1 ? 'problem' : 'problems'} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem #</TableHead>
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
                  ) : problems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        <div className="py-8">
                          <p className="text-muted-foreground mb-4">
                            No problems found
                          </p>
                          <Link href="/problems/new">
                            <Button variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              Create Your First Problem
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    problems.map((problem, index) => (
                      <motion.tr
                        key={problem._id}
                        variants={item}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: index * 0.02 }}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">
                          <Link href={`/problems/${problem._id}`} className="hover:underline text-primary">
                            {problem.problemNumber}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/problems/${problem._id}`}>
                            <div className="flex items-center gap-2">
                              <span className="hover:underline">{problem.title}</span>
                              {problem.isPublic && (
                                <Badge variant="outline" className="text-xs">Public</Badge>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell>{getStatusBadge(problem.status)}</TableCell>
                        <TableCell>{getPriorityBadge(problem.priority)}</TableCell>
                        <TableCell>{getImpactBadge(problem.impact)}</TableCell>
                        <TableCell>{getImpactBadge(problem.urgency)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getDuration(problem)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {problem.assignedToName ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{problem.assignedToName}</span>
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
