'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CSATStats {
  averageScore: number
  totalResponses: number
  totalTickets: number
  responseRate: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  trend?: {
    currentPeriod: number
    previousPeriod: number
    change: number
    changePercent: number
  }
  recentFeedback: Array<{
    ticketNumber: string
    rating: number
    feedback: string
    submittedAt: Date
    submittedByName: string
  }>
}

export default function CSATDashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<CSATStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [category, setCategory] = useState<string>('all')
  const [technician, setTechnician] = useState<string>('all')

  useEffect(() => {
    fetchStats()
  }, [dateRange, category, technician])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Calculate date range
      if (dateRange !== 'all') {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(dateRange, 10))
        params.append('startDate', startDate.toISOString())
        params.append('endDate', endDate.toISOString())
      }

      if (category !== 'all') {
        params.append('category', category)
      }

      if (technician !== 'all') {
        params.append('assignedTo', technician)
      }

      const response = await fetch(`/api/csat/stats?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching CSAT stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-emerald-600'
    if (score >= 4.0) return 'text-green-600'
    if (score >= 3.0) return 'text-yellow-600'
    if (score >= 2.0) return 'text-orange-600'
    return 'text-red-600'
  }

  const getStarColor = (rating: number) => {
    if (rating >= 4) return 'fill-emerald-400 text-emerald-400'
    if (rating === 3) return 'fill-yellow-400 text-yellow-400'
    return 'fill-red-400 text-red-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading CSAT data...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const maxDistribution = Math.max(...Object.values(stats.distribution))

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Customer Satisfaction (CSAT)</h1>
          <p className="text-muted-foreground mt-1">
            Track customer satisfaction and feedback metrics
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="sm" onClick={fetchStats}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Average Score */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getScoreColor(stats.averageScore)}`}>
              {stats.averageScore.toFixed(2)}
            </div>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  className={`w-4 h-4 ${
                    value <= Math.round(stats.averageScore)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            {stats.trend && (
              <div className="flex items-center gap-1 mt-2">
                {stats.trend.change >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-xs ${
                    stats.trend.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stats.trend.changePercent.toFixed(1)}% vs previous period
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Total Responses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Out of {stats.totalTickets} resolved tickets
            </p>
          </CardContent>
        </Card>

        {/* Response Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.responseRate.toFixed(1)}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${stats.responseRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feedback Comments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.recentFeedback.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Recent feedback comments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.distribution[rating as keyof typeof stats.distribution]
              const percentage =
                stats.totalResponses > 0 ? (count / stats.totalResponses) * 100 : 0

              return (
                <div key={rating} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rating} Star{rating !== 1 && 's'}</span>
                      <Star className={`w-4 h-4 ${getStarColor(rating)}`} />
                    </div>
                    <span className="text-muted-foreground">
                      {count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        rating >= 4
                          ? 'bg-emerald-500'
                          : rating === 3
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{
                        width: `${maxDistribution > 0 ? (count / maxDistribution) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentFeedback.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No feedback comments yet
            </p>
          ) : (
            <div className="space-y-4">
              {stats.recentFeedback.map((feedback, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{feedback.ticketNumber}</Badge>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <Star
                            key={value}
                            className={`w-3 h-3 ${
                              value <= feedback.rating
                                ? getStarColor(feedback.rating)
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(feedback.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{feedback.feedback}</p>
                  <p className="text-xs text-muted-foreground">
                    — {feedback.submittedByName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
