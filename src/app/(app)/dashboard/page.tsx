'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Ticket,
  AlertCircle,
  FolderKanban,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Activity,
  Target,
  Timer,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { SLADashboardWidget } from '@/components/tickets/sla-dashboard-widget'
import { CSATWidget } from '@/components/dashboard/csat-widget'

interface DashboardStats {
  users: { total: number; active: number }
  tickets: {
    total: number
    open: number
    overdue: number
    myTickets: number
    unassigned: number
  }
  incidents: { total: number; active: number }
  projects: { total: number; active: number }
  sla: {
    compliance: number
    totalTracked: number
    compliant: number
    breached: number
  }
  mttr: {
    hours: number
    incidentsResolved: number
  }
  serviceHealth: {
    percentage: number
    downtimeHours: number
  }
  recentActivity: Array<{
    type: 'ticket' | 'incident'
    id: string
    title: string
    status: string
    updatedAt: Date
  }>
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Primary KPI cards - Critical ITSM metrics
  const kpiCards = [
    {
      title: 'SLA Compliance',
      value: loading ? '...' : `${stats?.sla.compliance || 100}%`,
      description: `${stats?.sla.compliant || 0} met, ${stats?.sla.breached || 0} breached`,
      icon: Target,
      color: (stats?.sla.compliance || 100) >= 95 ? 'text-green-600' : 'text-orange-600',
      bgColor: (stats?.sla.compliance || 100) >= 95 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-orange-100 dark:bg-orange-900/20',
      trend: stats?.sla.compliance || 100,
      link: '/tickets?filter=sla',
    },
    {
      title: 'MTTR (Incidents)',
      value: loading ? '...' : `${stats?.mttr.hours || 0}h`,
      description: `${stats?.mttr.incidentsResolved || 0} incidents resolved`,
      icon: Timer,
      color: (stats?.mttr.hours || 0) <= 4 ? 'text-blue-600' : 'text-orange-600',
      bgColor: (stats?.mttr.hours || 0) <= 4 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-orange-100 dark:bg-orange-900/20',
      trend: stats?.mttr.hours || 0,
      link: '/incidents',
    },
    {
      title: 'Service Health',
      value: loading ? '...' : `${stats?.serviceHealth.percentage || 100}%`,
      description: `${stats?.serviceHealth.downtimeHours || 0}h downtime (30d)`,
      icon: Activity,
      color: (stats?.serviceHealth.percentage || 100) >= 99 ? 'text-green-600' : 'text-red-600',
      bgColor: (stats?.serviceHealth.percentage || 100) >= 99 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      trend: stats?.serviceHealth.percentage || 100,
      link: '/incidents',
    },
    {
      title: 'Active Incidents',
      value: loading ? '...' : (stats?.incidents.active || 0).toString(),
      description: stats?.incidents.active === 0 ? 'All systems operational' : 'Requires attention',
      icon: AlertCircle,
      color: stats?.incidents.active === 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.incidents.active === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      trend: stats?.incidents.active || 0,
      link: '/incidents',
    },
  ]

  // Secondary metric cards - Ticket-focused
  const ticketCards = [
    {
      title: 'My Tickets',
      value: loading ? '...' : (stats?.tickets.myTickets || 0).toString(),
      description: 'Assigned to me',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      link: '/tickets?assignedTo=me',
    },
    {
      title: 'Overdue Tickets',
      value: loading ? '...' : (stats?.tickets.overdue || 0).toString(),
      description: 'Past SLA deadline',
      icon: AlertTriangle,
      color: stats?.tickets.overdue === 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.tickets.overdue === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      link: '/tickets?filter=overdue',
    },
    {
      title: 'Unassigned',
      value: loading ? '...' : (stats?.tickets.unassigned || 0).toString(),
      description: 'Awaiting assignment',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      link: '/tickets?filter=unassigned',
    },
    {
      title: 'Open Tickets',
      value: loading ? '...' : (stats?.tickets.open || 0).toString(),
      description: `${stats?.tickets.total || 0} total tickets`,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      link: '/tickets',
    },
  ]

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {session?.user?.firstName}! Here's your ITSM overview.
        </p>
      </motion.div>

      {/* Primary KPIs - Critical ITSM Metrics */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {kpiCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Link href={card.link}>
              <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Secondary Metrics - Ticket Focus */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {ticketCards.map((card) => (
          <motion.div key={card.title} variants={item}>
            <Link href={card.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Performance Widgets Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* SLA Performance Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <SLADashboardWidget />
        </motion.div>

        {/* CSAT Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <CSATWidget />
        </motion.div>
      </div>

      {/* Content Grid - Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/tickets/new">
                <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                  <p className="font-medium">Create New Ticket</p>
                  <p className="text-sm text-muted-foreground">Report an issue or request</p>
                </button>
              </Link>
              <Link href="/schedule/new">
                <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                  <p className="font-medium">Schedule Appointment</p>
                  <p className="text-sm text-muted-foreground">Book time for maintenance</p>
                </button>
              </Link>
              <Link href="/kb">
                <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                  <p className="font-medium">Search Knowledge Base</p>
                  <p className="text-sm text-muted-foreground">Find solutions and guides</p>
                </button>
              </Link>
              <Link href="/assets">
                <button className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors">
                  <p className="font-medium">View Assets</p>
                  <p className="text-sm text-muted-foreground">Manage IT infrastructure</p>
                </button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates across your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <Link
                      key={`${activity.type}-${activity.id}-${index}`}
                      href={`/${activity.type === 'ticket' ? 'tickets' : 'incidents'}/${activity.id}`}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer"
                      >
                        <div className={`p-1.5 rounded-full mt-0.5 ${
                          activity.type === 'ticket'
                            ? 'bg-blue-100 dark:bg-blue-900/20'
                            : 'bg-orange-100 dark:bg-orange-900/20'
                        }`}>
                          {activity.type === 'ticket' ? (
                            <Ticket className="w-3 h-3 text-blue-600" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-orange-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              activity.status === 'resolved' || activity.status === 'closed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                            }`}>
                              {activity.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Additional Metrics Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderKanban className="w-4 h-4" />
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.projects.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.projects.total || 0} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.users.total || 0} total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Platform Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs">System Health</span>
                <span className="text-xs text-green-600 font-medium">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs">Auto-Refresh</span>
                <span className="text-xs text-blue-600 font-medium">→ 30s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
