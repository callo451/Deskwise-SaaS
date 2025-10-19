import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { TicketStatus, TicketPriority } from '@/lib/types'

export interface TicketAnalyticsMetrics {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  closedTickets: number
  avgResolutionTimeHours: number
  avgFirstResponseTimeHours: number
  reopenRate: number
  backlogSize: number
  slaComplianceRate: number
  trendData: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
}

export interface TicketVolumeData {
  date: string
  total: number
  new: number
  open: number
  resolved: number
  closed: number
}

export interface TicketDistribution {
  status: Record<TicketStatus, number>
  priority: Record<TicketPriority, number>
  category: Array<{ name: string; count: number; percentage: number }>
}

export interface TicketTrends {
  volumeTrend: TicketVolumeData[]
  resolutionTimeTrend: Array<{ date: string; avgHours: number }>
  slaComplianceTrend: Array<{ date: string; complianceRate: number }>
}

export interface CategoryPerformance {
  category: string
  totalTickets: number
  avgResolutionHours: number
  slaCompliance: number
  openCount: number
}

/**
 * Ticket Analytics Service
 * Provides comprehensive analytics and metrics for ticket management
 */
export class TicketAnalyticsService {
  /**
   * Get overview metrics for tickets
   */
  static async getOverviewMetrics(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TicketAnalyticsMetrics> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    // Aggregate pipeline for overview metrics
    const [metricsResult] = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $facet: {
            totalCounts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  open: {
                    $sum: {
                      $cond: [
                        { $in: ['$status', ['new', 'open', 'pending']] },
                        1,
                        0,
                      ],
                    },
                  },
                  resolved: {
                    $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
                  },
                  closed: {
                    $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] },
                  },
                },
              },
            ],
            resolutionMetrics: [
              { $match: { resolvedAt: { $exists: true } } },
              {
                $project: {
                  resolutionTime: {
                    $divide: [
                      { $subtract: ['$resolvedAt', '$createdAt'] },
                      3600000, // Convert to hours
                    ],
                  },
                  firstResponseTime: {
                    $cond: {
                      if: { $ne: ['$sla.responseDeadline', null] },
                      then: {
                        $divide: [
                          {
                            $subtract: [
                              '$sla.responseDeadline',
                              '$createdAt',
                            ],
                          },
                          3600000,
                        ],
                      },
                      else: 0,
                    },
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgResolutionTime: { $avg: '$resolutionTime' },
                  avgFirstResponseTime: { $avg: '$firstResponseTime' },
                },
              },
            ],
            slaMetrics: [
              { $match: { 'sla.resolutionDeadline': { $exists: true } } },
              {
                $group: {
                  _id: null,
                  totalWithSla: { $sum: 1 },
                  slaCompliant: {
                    $sum: { $cond: [{ $eq: ['$sla.breached', false] }, 1, 0] },
                  },
                },
              },
            ],
            backlog: [
              {
                $match: {
                  status: { $in: ['new', 'open', 'pending'] },
                  createdAt: {
                    $lte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                  },
                },
              },
              { $count: 'count' },
            ],
          },
        },
      ])
      .toArray()

    const totalCounts = metricsResult.totalCounts[0] || {
      total: 0,
      open: 0,
      resolved: 0,
      closed: 0,
    }
    const resolutionMetrics = metricsResult.resolutionMetrics[0] || {
      avgResolutionTime: 0,
      avgFirstResponseTime: 0,
    }
    const slaMetrics = metricsResult.slaMetrics[0] || {
      totalWithSla: 0,
      slaCompliant: 0,
    }
    const backlog = metricsResult.backlog[0]?.count || 0

    // Calculate reopen rate (tickets that were resolved/closed but reopened)
    const reopenedCount = await ticketsCollection.countDocuments({
      orgId,
      status: { $in: ['new', 'open', 'pending'] },
      resolvedAt: { $exists: true },
    })
    const reopenRate =
      totalCounts.resolved > 0
        ? (reopenedCount / totalCounts.resolved) * 100
        : 0

    // Calculate SLA compliance rate
    const slaComplianceRate =
      slaMetrics.totalWithSla > 0
        ? (slaMetrics.slaCompliant / slaMetrics.totalWithSla) * 100
        : 0

    // Calculate trend (compare with previous period)
    const previousPeriodStart = startDate
      ? new Date(
          startDate.getTime() - (endDate ? endDate.getTime() - startDate.getTime() : 30 * 24 * 60 * 60 * 1000)
        )
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const previousPeriodCount = await ticketsCollection.countDocuments({
      orgId,
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
    })

    const trendValue = totalCounts.total - previousPeriodCount
    const trendPercentage =
      previousPeriodCount > 0
        ? Math.abs((trendValue / previousPeriodCount) * 100).toFixed(1)
        : '0.0'

    return {
      totalTickets: totalCounts.total,
      openTickets: totalCounts.open,
      resolvedTickets: totalCounts.resolved,
      closedTickets: totalCounts.closed,
      avgResolutionTimeHours: Math.round(resolutionMetrics.avgResolutionTime * 10) / 10,
      avgFirstResponseTimeHours: Math.round(resolutionMetrics.avgFirstResponseTime * 10) / 10,
      reopenRate: Math.round(reopenRate * 10) / 10,
      backlogSize: backlog,
      slaComplianceRate: Math.round(slaComplianceRate * 10) / 10,
      trendData: {
        direction: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
        value: `${trendPercentage}%`,
        period: 'vs previous period',
      },
    }
  }

  /**
   * Get ticket distribution by status, priority, and category
   */
  static async getDistribution(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TicketDistribution> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const [distributionResult] = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            byPriority: [
              { $group: { _id: '$priority', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            byCategory: [
              { $group: { _id: '$category', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .toArray()

    const total = distributionResult.total[0]?.count || 1 // Avoid division by zero

    // Process status distribution
    const statusDistribution: Record<TicketStatus, number> = {
      new: 0,
      open: 0,
      pending: 0,
      resolved: 0,
      closed: 0,
    }
    distributionResult.byStatus.forEach((item: any) => {
      statusDistribution[item._id as TicketStatus] = item.count
    })

    // Process priority distribution
    const priorityDistribution: Record<TicketPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    }
    distributionResult.byPriority.forEach((item: any) => {
      priorityDistribution[item._id as TicketPriority] = item.count
    })

    // Process category distribution
    const categoryDistribution = distributionResult.byCategory.map((item: any) => ({
      name: item._id || 'Uncategorized',
      count: item.count,
      percentage: Math.round((item.count / total) * 1000) / 10,
    }))

    return {
      status: statusDistribution,
      priority: priorityDistribution,
      category: categoryDistribution,
    }
  }

  /**
   * Get ticket volume trends over time
   */
  static async getVolumeTrends(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<TicketVolumeData[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Determine grouping format
    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const volumeData = await ticketsCollection
      .aggregate([
        {
          $match: {
            orgId,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            total: { $sum: 1 },
            new: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
            open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
            resolved: {
              $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
            },
            closed: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return volumeData.map((item: any) => ({
      date: item._id,
      total: item.total,
      new: item.new,
      open: item.open,
      resolved: item.resolved,
      closed: item.closed,
    }))
  }

  /**
   * Get performance metrics by category
   */
  static async getCategoryPerformance(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CategoryPerformance[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const categoryData = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$category',
            totalTickets: { $sum: 1 },
            resolvedCount: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ['$resolvedAt', null] }] },
                  1,
                  0,
                ],
              },
            },
            totalResolutionTime: {
              $sum: {
                $cond: [
                  { $ne: ['$resolvedAt', null] },
                  { $subtract: ['$resolvedAt', '$createdAt'] },
                  0,
                ],
              },
            },
            slaCompliantCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$sla.breached', null] },
                      { $eq: ['$sla.breached', false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            slaTotal: {
              $sum: {
                $cond: [{ $ne: ['$sla.breached', null] }, 1, 0],
              },
            },
            openCount: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['new', 'open', 'pending']] },
                  1,
                  0,
                ],
              },
            },
          },
        },
        { $sort: { totalTickets: -1 } },
        { $limit: 10 },
      ])
      .toArray()

    return categoryData.map((item: any) => ({
      category: item._id || 'Uncategorized',
      totalTickets: item.totalTickets,
      avgResolutionHours:
        item.resolvedCount > 0
          ? Math.round(
              (item.totalResolutionTime / item.resolvedCount / 3600000) * 10
            ) / 10
          : 0,
      slaCompliance:
        item.slaTotal > 0
          ? Math.round((item.slaCompliantCount / item.slaTotal) * 1000) / 10
          : 0,
      openCount: item.openCount,
    }))
  }

  /**
   * Get SLA compliance trends
   */
  static async getSLAComplianceTrend(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; complianceRate: number }>> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const slaData = await ticketsCollection
      .aggregate([
        {
          $match: {
            orgId,
            createdAt: { $gte: startDate, $lte: endDate },
            'sla.resolutionDeadline': { $exists: true },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            total: { $sum: 1 },
            compliant: {
              $sum: { $cond: [{ $eq: ['$sla.breached', false] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return slaData.map((item: any) => ({
      date: item._id,
      complianceRate:
        item.total > 0 ? Math.round((item.compliant / item.total) * 1000) / 10 : 0,
    }))
  }

  /**
   * Get resolution time trends
   */
  static async getResolutionTimeTrend(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ date: string; avgHours: number }>> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const resolutionData = await ticketsCollection
      .aggregate([
        {
          $match: {
            orgId,
            resolvedAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $project: {
            date: { $dateToString: { format: dateFormat, date: '$resolvedAt' } },
            resolutionTime: {
              $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000],
            },
          },
        },
        {
          $group: {
            _id: '$date',
            avgHours: { $avg: '$resolutionTime' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return resolutionData.map((item: any) => ({
      date: item._id,
      avgHours: Math.round(item.avgHours * 10) / 10,
    }))
  }
}
