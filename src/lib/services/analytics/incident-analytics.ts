import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { IncidentStatus, IncidentSeverity } from '@/lib/types'

export interface IncidentAnalyticsMetrics {
  activeIncidents: number
  totalIncidents: number
  mttrHours: number // Mean Time to Resolve
  mtbfHours: number // Mean Time Between Failures
  serviceAvailability: number // Percentage
  p1Incidents: number // Critical priority
  p2Incidents: number // High priority
  trendData: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
}

export interface IncidentSeverityTimeline {
  date: string
  minor: number
  major: number
  critical: number
  total: number
}

export interface RootCauseDistribution {
  category: string
  count: number
  percentage: number
  avgResolutionHours: number
}

export interface ServiceImpactAnalysis {
  service: string
  incidentCount: number
  totalDowntimeHours: number
  avgMttrHours: number
  availability: number
}

/**
 * Incident Analytics Service
 * Provides comprehensive analytics and metrics for incident management
 */
export class IncidentAnalyticsService {
  /**
   * Get overview metrics for incidents
   */
  static async getOverviewMetrics(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<IncidentAnalyticsMetrics> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.startedAt = {}
      if (startDate) dateFilter.startedAt.$gte = startDate
      if (endDate) dateFilter.startedAt.$lte = endDate
    }

    // Aggregate pipeline for overview metrics
    const [metricsResult] = await incidentsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: {
                    $sum: {
                      $cond: [
                        {
                          $in: [
                            '$status',
                            ['investigating', 'identified', 'monitoring'],
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  p1: {
                    $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] },
                  },
                  p2: {
                    $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] },
                  },
                },
              },
            ],
            mttrData: [
              { $match: { resolvedAt: { $exists: true } } },
              {
                $project: {
                  resolutionTime: {
                    $divide: [
                      { $subtract: ['$resolvedAt', '$startedAt'] },
                      3600000, // Convert to hours
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgMttr: { $avg: '$resolutionTime' },
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },
      ])
      .toArray()

    const counts = metricsResult.counts[0] || {
      total: 0,
      active: 0,
      p1: 0,
      p2: 0,
    }
    const mttrData = metricsResult.mttrData[0] || {
      avgMttr: 0,
      count: 0,
    }

    // Calculate MTBF (Mean Time Between Failures)
    // MTBF = Total operational time / Number of failures
    const periodHours = endDate && startDate
      ? (endDate.getTime() - startDate.getTime()) / 3600000
      : 720 // Default 30 days in hours

    const mtbf = counts.total > 0 ? periodHours / counts.total : periodHours

    // Calculate service availability
    // Availability = (Total time - Downtime) / Total time * 100
    const totalDowntime = mttrData.avgMttr * mttrData.count
    const availability = ((periodHours - totalDowntime) / periodHours) * 100

    // Calculate trend (compare with previous period)
    const previousPeriodStart = startDate
      ? new Date(
          startDate.getTime() -
            (endDate ? endDate.getTime() - startDate.getTime() : 30 * 24 * 60 * 60 * 1000)
        )
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const previousCount = await incidentsCollection.countDocuments({
      orgId,
      startedAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
    })

    const trendValue = counts.total - previousCount
    const trendPercentage =
      previousCount > 0
        ? Math.abs((trendValue / previousCount) * 100).toFixed(1)
        : '0.0'

    return {
      activeIncidents: counts.active,
      totalIncidents: counts.total,
      mttrHours: Math.round(mttrData.avgMttr * 10) / 10,
      mtbfHours: Math.round(mtbf * 10) / 10,
      serviceAvailability: Math.round(availability * 100) / 100,
      p1Incidents: counts.p1,
      p2Incidents: counts.p2,
      trendData: {
        direction: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
        value: `${trendPercentage}%`,
        period: 'vs previous period',
      },
    }
  }

  /**
   * Get incident severity timeline
   */
  static async getSeverityTimeline(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<IncidentSeverityTimeline[]> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const timelineData = await incidentsCollection
      .aggregate([
        {
          $match: {
            orgId,
            startedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$startedAt' } },
            total: { $sum: 1 },
            minor: {
              $sum: { $cond: [{ $eq: ['$severity', 'minor'] }, 1, 0] },
            },
            major: {
              $sum: { $cond: [{ $eq: ['$severity', 'major'] }, 1, 0] },
            },
            critical: {
              $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return timelineData.map((item: any) => ({
      date: item._id,
      minor: item.minor,
      major: item.major,
      critical: item.critical,
      total: item.total,
    }))
  }

  /**
   * Get root cause distribution
   */
  static async getRootCauseDistribution(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RootCauseDistribution[]> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    // Build date filter
    const dateFilter: any = { orgId, resolvedAt: { $exists: true } }
    if (startDate || endDate) {
      dateFilter.startedAt = {}
      if (startDate) dateFilter.startedAt.$gte = startDate
      if (endDate) dateFilter.startedAt.$lte = endDate
    }

    // For now, we'll use category as a proxy for root cause
    // In a real implementation, you might have a dedicated rootCause field
    const rootCauseData = await incidentsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$severity', // Group by severity as proxy
            count: { $sum: 1 },
            totalResolutionTime: {
              $sum: { $subtract: ['$resolvedAt', '$startedAt'] },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    const total = rootCauseData.reduce((sum: number, item: any) => sum + item.count, 0)

    return rootCauseData.map((item: any) => ({
      category: item._id || 'Unknown',
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
      avgResolutionHours:
        item.count > 0
          ? Math.round((item.totalResolutionTime / item.count / 3600000) * 10) / 10
          : 0,
    }))
  }

  /**
   * Get service impact analysis
   */
  static async getServiceImpactAnalysis(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ServiceImpactAnalysis[]> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.startedAt = {}
      if (startDate) dateFilter.startedAt.$gte = startDate
      if (endDate) dateFilter.startedAt.$lte = endDate
    }

    // Unwind affectedServices array and analyze
    const serviceData = await incidentsCollection
      .aggregate([
        { $match: dateFilter },
        { $unwind: '$affectedServices' },
        {
          $group: {
            _id: '$affectedServices',
            incidentCount: { $sum: 1 },
            totalDowntime: {
              $sum: {
                $cond: [
                  { $ne: ['$resolvedAt', null] },
                  { $subtract: ['$resolvedAt', '$startedAt'] },
                  0,
                ],
              },
            },
            resolvedCount: {
              $sum: {
                $cond: [{ $ne: ['$resolvedAt', null] }, 1, 0],
              },
            },
          },
        },
        { $sort: { incidentCount: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    // Calculate availability for each service
    const periodMs = endDate && startDate
      ? endDate.getTime() - startDate.getTime()
      : 30 * 24 * 60 * 60 * 1000 // 30 days

    return serviceData.map((item: any) => {
      const downtimeHours = item.totalDowntime / 3600000
      const periodHours = periodMs / 3600000
      const availability = ((periodHours - downtimeHours) / periodHours) * 100

      return {
        service: item._id,
        incidentCount: item.incidentCount,
        totalDowntimeHours: Math.round(downtimeHours * 10) / 10,
        avgMttrHours:
          item.resolvedCount > 0
            ? Math.round((item.totalDowntime / item.resolvedCount / 3600000) * 10) / 10
            : 0,
        availability: Math.round(availability * 100) / 100,
      }
    })
  }

  /**
   * Get incident status distribution
   */
  static async getStatusDistribution(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Record<IncidentStatus, number>> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.startedAt = {}
      if (startDate) dateFilter.startedAt.$gte = startDate
      if (endDate) dateFilter.startedAt.$lte = endDate
    }

    const statusData = await incidentsCollection
      .aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .toArray()

    const distribution: Record<IncidentStatus, number> = {
      investigating: 0,
      identified: 0,
      monitoring: 0,
      resolved: 0,
    }

    statusData.forEach((item: any) => {
      distribution[item._id as IncidentStatus] = item.count
    })

    return distribution
  }

  /**
   * Get MTTR by severity
   */
  static async getMTTRBySeverity(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<{ severity: IncidentSeverity; mttrHours: number }>> {
    const db = await getDatabase()
    const incidentsCollection = db.collection(COLLECTIONS.INCIDENTS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      resolvedAt: { $exists: true },
    }
    if (startDate || endDate) {
      dateFilter.startedAt = {}
      if (startDate) dateFilter.startedAt.$gte = startDate
      if (endDate) dateFilter.startedAt.$lte = endDate
    }

    const mttrData = await incidentsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$severity',
            avgResolutionTime: {
              $avg: { $subtract: ['$resolvedAt', '$startedAt'] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return mttrData.map((item: any) => ({
      severity: item._id,
      mttrHours: Math.round((item.avgResolutionTime / 3600000) * 10) / 10,
    }))
  }
}
