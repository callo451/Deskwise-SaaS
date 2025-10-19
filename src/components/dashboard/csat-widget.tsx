'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface CSATWidgetData {
  averageScore: number
  totalResponses: number
  responseRate: number
  trend?: {
    change: number
    changePercent: number
  }
}

export function CSATWidget() {
  const [data, setData] = useState<CSATWidgetData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get current month's data
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(1) // First day of current month

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      const response = await fetch(`/api/csat/stats?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching CSAT widget data:', error)
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

  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent'
    if (score >= 4.0) return 'Good'
    if (score >= 3.0) return 'Fair'
    if (score >= 2.0) return 'Poor'
    return 'Very Poor'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4" />
            Customer Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.totalResponses === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4" />
            Customer Satisfaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              No CSAT ratings this month
            </p>
            <Link href="/reports/csat">
              <Button variant="outline" size="sm">
                View All Data
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4" />
          Customer Satisfaction
        </CardTitle>
        <Link href="/reports/csat">
          <Button variant="ghost" size="sm">
            View Details
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Average Score */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Month</p>
            <div className={`text-3xl font-bold ${getScoreColor(data.averageScore)}`}>
              {data.averageScore.toFixed(2)}
            </div>
            <p className="text-sm font-medium">{getScoreLabel(data.averageScore)}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star
                key={value}
                className={`w-6 h-6 ${
                  value <= Math.round(data.averageScore)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Responses</p>
            <p className="text-lg font-semibold">{data.totalResponses}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Response Rate</p>
            <p className="text-lg font-semibold">{data.responseRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Trend Indicator */}
        {data.trend && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {data.trend.change >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">
                  +{data.trend.changePercent.toFixed(1)}%
                </span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600 font-medium">
                  {data.trend.changePercent.toFixed(1)}%
                </span>
              </>
            )}
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}

        {/* Quick Link */}
        <Link href="/reports/csat">
          <Button variant="outline" size="sm" className="w-full">
            View Full Report
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
