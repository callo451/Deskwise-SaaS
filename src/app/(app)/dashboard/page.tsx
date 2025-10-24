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
      link: '/unified-tickets?filter=sla',
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
      link: '/unified-tickets?assignedTo=me',
    },
    {
      title: 'Overdue Tickets',
      value: loading ? '...' : (stats?.tickets.overdue || 0).toString(),
      description: 'Past SLA deadline',
      icon: AlertTriangle,
      color: stats?.tickets.overdue === 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.tickets.overdue === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      link: '/unified-tickets?filter=overdue',
    },
    {
      title: 'Unassigned',
      value: loading ? '...' : (stats?.tickets.unassigned || 0).toString(),
      description: 'Awaiting assignment',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      link: '/unified-tickets?filter=unassigned',
    },
    {
      title: 'Open Tickets',
      value: loading ? '...' : (stats?.tickets.open || 0).toString(),
      description: `${stats?.tickets.total || 0} total tickets`,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      link: '/unified-tickets',
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
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-base mt-1">
              Welcome back, {session?.user?.firstName}! Here's your ITSM overview.
            </p>
          </div>
        </div>
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
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/50 hover:scale-105">
                <CardHeader className="bg-gradient-to-r from-accent/50 to-accent/20 border-b-2 pb-3">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                    <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-3xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-2">
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
              <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/50 hover:scale-105">
                <CardHeader className="border-b-2 border-dashed pb-3">
                  <div className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{card.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`w-4 h-4 ${card.color}`} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-2">
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
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-md">
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                  <CardDescription className="text-sm">Common tasks and shortcuts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-4">
              <Link href="/tickets/new">
                <button className="w-full text-left p-3 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/30 transition-all">
                  <p className="font-semibold">Create New Ticket</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Report an issue or request</p>
                </button>
              </Link>
              <Link href="/schedule/new">
                <button className="w-full text-left p-3 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/30 transition-all">
                  <p className="font-semibold">Schedule Appointment</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Book time for maintenance</p>
                </button>
              </Link>
              <Link href="/kb">
                <button className="w-full text-left p-3 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/30 transition-all">
                  <p className="font-semibold">Search Knowledge Base</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Find solutions and guides</p>
                </button>
              </Link>
              <Link href="/assets">
                <button className="w-full text-left p-3 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/30 transition-all">
                  <p className="font-semibold">View Assets</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Manage IT infrastructure</p>
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
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                  <Activity className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription className="text-sm">Latest updates across your organization</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
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
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-md">
                  <FolderKanban className="w-4 h-4 text-indigo-600" />
                </div>
                Active Projects
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.projects.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.projects.total || 0} total projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 rounded-md">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                Team Members
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.users.active || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.users.total || 0} total users
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <CardHeader className="border-b-2 border-dashed pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="p-1.5 bg-green-500/10 rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                Platform Status
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                <span className="text-xs font-medium">System Health</span>
                <span className="text-xs text-green-600 font-semibold">✓ Operational</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <span className="text-xs font-medium">Auto-Refresh</span>
                <span className="text-xs text-blue-600 font-semibold">→ 30s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
