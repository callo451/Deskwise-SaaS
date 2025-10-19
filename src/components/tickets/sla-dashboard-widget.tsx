'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface SLAStats {
  total: number
  onTime: number
  atRisk: number
  critical: number
  breached: number
  compliance: number
}

interface SLADashboardWidgetProps {
  className?: string
  showDetails?: boolean
}

export function SLADashboardWidget({
  className,
  showDetails = true,
}: SLADashboardWidgetProps) {
  const [stats, setStats] = useState<SLAStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/tickets/sla-stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching SLA stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            SLA Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading SLA metrics...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return null
  }

  const complianceColor =
    stats.compliance >= 95
      ? 'text-green-600'
      : stats.compliance >= 80
      ? 'text-yellow-600'
      : 'text-red-600'

  const complianceBg =
    stats.compliance >= 95
      ? 'bg-green-100 dark:bg-green-900/20'
      : stats.compliance >= 80
      ? 'bg-yellow-100 dark:bg-yellow-900/20'
      : 'bg-red-100 dark:bg-red-900/20'

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              SLA Performance
            </CardTitle>
            <CardDescription>Real-time compliance tracking</CardDescription>
          </div>
          <Link href="/tickets?filter=sla">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compliance Score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Compliance</span>
            <span className={`text-2xl font-bold ${complianceColor}`}>
              {stats.compliance}%
            </span>
          </div>
          <Progress
            value={stats.compliance}
            className="h-3"
            indicatorClassName={
              stats.compliance >= 95
                ? 'bg-green-500'
                : stats.compliance >= 80
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }
          />
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp className={`w-3 h-3 ${complianceColor}`} />
            <span className={`text-xs font-medium ${complianceColor}`}>
              {stats.onTime + stats.atRisk} of {stats.total} tickets on track
            </span>
          </div>
        </div>

        {showDetails && (
          <>
            {/* Status Breakdown */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Ticket Status</h4>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/10"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">On Time</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {stats.onTime}
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">At Risk</span>
                </div>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {stats.atRisk}
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Critical</span>
                </div>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  {stats.critical}
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-900/10"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Breached</span>
                </div>
                <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {stats.breached}
                </Badge>
              </motion.div>
            </div>

            {/* Quick Actions */}
            {(stats.critical > 0 || stats.breached > 0) && (
              <div className="pt-4 border-t">
                <div className="space-y-2">
                  {stats.breached > 0 && (
                    <Link href="/tickets?filter=breached">
                      <Button variant="destructive" size="sm" className="w-full">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Review {stats.breached} Breached Ticket{stats.breached !== 1 ? 's' : ''}
                      </Button>
                    </Link>
                  )}
                  {stats.critical > 0 && (
                    <Link href="/tickets?filter=critical">
                      <Button variant="outline" size="sm" className="w-full border-orange-500 text-orange-600 hover:bg-orange-50">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Review {stats.critical} Critical Ticket{stats.critical !== 1 ? 's' : ''}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
