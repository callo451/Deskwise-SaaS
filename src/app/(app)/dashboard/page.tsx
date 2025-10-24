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
  Zap,
  GripVertical,
  Plus,
  Calendar,
  Book,
  Package
} from 'lucide-react'
import Link from 'next/link'
import { SLADashboardWidget } from '@/components/tickets/sla-dashboard-widget'
import { CSATWidget } from '@/components/dashboard/csat-widget'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

interface DashboardCard {
  id: string
  title: string
  value: string | number
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  link: string
  trend?: number
}

// Sortable Card Component
function SortableCard({ card, index }: { card: DashboardCard; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const [wasDragging, setWasDragging] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Track when dragging ends
  useEffect(() => {
    if (isDragging) {
      setWasDragging(true)
    } else if (wasDragging) {
      // Clear after a short delay to prevent click
      const timeout = setTimeout(() => setWasDragging(false), 100)
      return () => clearTimeout(timeout)
    }
  }, [isDragging, wasDragging])

  const handleCardClick = (e: React.MouseEvent) => {
    if (wasDragging) {
      e.preventDefault()
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={card.link} onClick={handleCardClick}>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/50 hover:scale-105 relative group">
          {/* Drag Handle */}
          <div
            {...listeners}
            className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/80 rounded hover:bg-accent"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

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
    </div>
  )
}

// Sortable Ticket Card Component (for secondary cards)
function SortableTicketCard({ card, index }: { card: DashboardCard; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const [wasDragging, setWasDragging] = useState(false)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Track when dragging ends
  useEffect(() => {
    if (isDragging) {
      setWasDragging(true)
    } else if (wasDragging) {
      // Clear after a short delay to prevent click
      const timeout = setTimeout(() => setWasDragging(false), 100)
      return () => clearTimeout(timeout)
    }
  }, [isDragging, wasDragging])

  const handleCardClick = (e: React.MouseEvent) => {
    if (wasDragging) {
      e.preventDefault()
    }
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Link href={card.link} onClick={handleCardClick}>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-primary/50 hover:scale-105 relative group">
          {/* Drag Handle */}
          <div
            {...listeners}
            className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 bg-background/80 rounded hover:bg-accent"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>

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
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Drag and drop state - combined cards
  const [allCardOrder, setAllCardOrder] = useState<string[]>([])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before dragging starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchStats()
    // Load saved layout from localStorage
    const savedOrder = localStorage.getItem('dashboard-all-cards-order')
    if (savedOrder) setAllCardOrder(JSON.parse(savedOrder))

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
  const kpiCards: DashboardCard[] = [
    {
      id: 'kpi-sla-compliance',
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
      id: 'kpi-mttr',
      title: 'MTTR (Incidents)',
      value: loading ? '...' : `${stats?.mttr.hours || 0}h`,
      description: `${stats?.mttr.incidentsResolved || 0} incidents resolved`,
      icon: Timer,
      color: (stats?.mttr.hours || 0) <= 4 ? 'text-blue-600' : 'text-orange-600',
      bgColor: (stats?.mttr.hours || 0) <= 4 ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-orange-100 dark:bg-orange-900/20',
      trend: stats?.mttr.hours || 0,
      link: '/unified-tickets?type=incident',
    },
    {
      id: 'kpi-service-health',
      title: 'Service Health',
      value: loading ? '...' : `${stats?.serviceHealth.percentage || 100}%`,
      description: `${stats?.serviceHealth.downtimeHours || 0}h downtime (30d)`,
      icon: Activity,
      color: (stats?.serviceHealth.percentage || 100) >= 99 ? 'text-green-600' : 'text-red-600',
      bgColor: (stats?.serviceHealth.percentage || 100) >= 99 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      trend: stats?.serviceHealth.percentage || 100,
      link: '/unified-tickets?type=incident',
    },
    {
      id: 'kpi-active-incidents',
      title: 'Active Incidents',
      value: loading ? '...' : (stats?.incidents.active || 0).toString(),
      description: stats?.incidents.active === 0 ? 'All systems operational' : 'Requires attention',
      icon: AlertCircle,
      color: stats?.incidents.active === 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.incidents.active === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      trend: stats?.incidents.active === 0,
      link: '/unified-tickets?type=incident',
    },
  ]

  // Secondary metric cards - Ticket-focused
  const ticketCards: DashboardCard[] = [
    {
      id: 'ticket-my-tickets',
      title: 'My Tickets',
      value: loading ? '...' : (stats?.tickets.myTickets || 0).toString(),
      description: 'Assigned to me',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      link: '/unified-tickets?assignedTo=me',
    },
    {
      id: 'ticket-overdue',
      title: 'Overdue Tickets',
      value: loading ? '...' : (stats?.tickets.overdue || 0).toString(),
      description: 'Past SLA deadline',
      icon: AlertTriangle,
      color: stats?.tickets.overdue === 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats?.tickets.overdue === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20',
      link: '/unified-tickets?filter=overdue',
    },
    {
      id: 'ticket-unassigned',
      title: 'Unassigned',
      value: loading ? '...' : (stats?.tickets.unassigned || 0).toString(),
      description: 'Awaiting assignment',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      link: '/unified-tickets?filter=unassigned',
    },
    {
      id: 'ticket-open',
      title: 'Open Tickets',
      value: loading ? '...' : (stats?.tickets.open || 0).toString(),
      description: `${stats?.tickets.total || 0} total tickets`,
      icon: Ticket,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      link: '/unified-tickets',
    },
  ]

  // Combine all cards
  const allCards = [...kpiCards, ...ticketCards]

  // Initialize card order
  useEffect(() => {
    if (allCardOrder.length === 0) {
      setAllCardOrder(allCards.map(card => card.id))
    }
  }, [allCards.length, allCardOrder.length])

  // Get sorted cards
  const sortedAllCards = allCardOrder.length > 0
    ? allCardOrder.map(id => allCards.find(card => card.id === id)).filter(Boolean) as DashboardCard[]
    : allCards

  // Split into two rows (first 4 cards in row 1, next 4 in row 2)
  const row1Cards = sortedAllCards.slice(0, 4)
  const row2Cards = sortedAllCards.slice(4, 8)

  // Handle drag end for all cards
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setAllCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        localStorage.setItem('dashboard-all-cards-order', JSON.stringify(newOrder))
        return newOrder
      })
    }
  }

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

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid gap-4 grid-cols-2 lg:grid-cols-4"
      >
        <Link href="/unified-tickets/new">
          <button className="group relative w-full p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Plus className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">New Ticket</p>
                <p className="text-xs text-white/80">Create request</p>
              </div>
            </div>
          </button>
        </Link>

        <Link href="/scheduling">
          <button className="group relative w-full p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Schedule</p>
                <p className="text-xs text-white/80">Book appointment</p>
              </div>
            </div>
          </button>
        </Link>

        <Link href="/knowledge">
          <button className="group relative w-full p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Book className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Knowledge</p>
                <p className="text-xs text-white/80">Find solutions</p>
              </div>
            </div>
          </button>
        </Link>

        <Link href="/assets">
          <button className="group relative w-full p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Package className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Assets</p>
                <p className="text-xs text-white/80">Manage inventory</p>
              </div>
            </div>
          </button>
        </Link>
      </motion.div>

      {/* Dashboard Metric Cards - Drag & Drop Enabled */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedAllCards.map(card => card.id)}
          strategy={rectSortingStrategy}
        >
          {/* Row 1 - First 4 Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {row1Cards.map((card, index) => (
              <SortableCard key={card.id} card={card} index={index} />
            ))}
          </motion.div>

          {/* Row 2 - Next 4 Cards */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {row2Cards.map((card, index) => (
              <SortableCard key={card.id} card={card} index={index + 4} />
            ))}
          </motion.div>
        </SortableContext>
      </DndContext>

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

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
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
