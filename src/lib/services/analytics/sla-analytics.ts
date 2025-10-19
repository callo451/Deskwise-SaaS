import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

export interface SLAAnalyticsMetrics {
  overallComplianceRate: number
  totalTicketsWithSLA: number
  slaMetTickets: number
  slaBreachedTickets: number
  avgTimeToBreachHours: number
  criticalBreaches: number // High/Critical priority breaches
  trendData: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
}

export interface SLABreachByCategory {
  category: string
  totalWithSLA: number
  breached: number
  breachRate: number
  avgBreachTimeHours: number
}

export interface SLABreachByPriority {
  priority: string
  totalWithSLA: number
  breached: number
  breachRate: number
  avgResolutionTimeHours: number
}

export interface SLAComplianceTrend {
  date: string
  total: number
  compliant: number
  breached: number
  complianceRate: number
}

export interface TimeToBreachAnalysis {
  range: string // e.g., "0-1 hours", "1-4 hours"
  count: number
  percentage: number
}

/**
 * SLA Analytics Service
 * Provides comprehensive analytics and metrics for SLA performance
 */
export class SLAAnalyticsService {
  /**
   * Get overview metrics for SLA performance
   */
  static async getOverviewMetrics(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SLAAnalyticsMetrics> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      'sla.resolutionDeadline': { $exists: true },
    }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    // Aggregate pipeline for SLA metrics
    const [metricsResult] = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $facet: {
            complianceMetrics: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  met: {
                    $sum: {
                      $cond: [{ $eq: ['$sla.breached', false] }, 1, 0],
                    },
                  },
                  breached: {
                    $sum: {
                      $cond: [{ $eq: ['$sla.breached', true] }, 1, 0],
                    },
                  },
                  criticalBreaches: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$sla.breached', true] },
                            { $in: ['$priority', ['high', 'critical']] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            breachTimeAnalysis: [
              {
                $match: {
                  'sla.breached': true,
                  resolvedAt: { $exists: true },
                },
              },
              {
                $project: {
                  timeToBreach: {
                    $divide: [
                      {
                        $subtract: [
                          '$resolvedAt',
                          '$sla.resolutionDeadline',
                        ],
                      },
                      3600000, // Convert to hours
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  avgTimeToBreachHours: { $avg: '$timeToBreach' },
                },
              },
            ],
          },
        },
      ])
      .toArray()

    const complianceMetrics = metricsResult.complianceMetrics[0] || {
      total: 0,
      met: 0,
      breached: 0,
      criticalBreaches: 0,
    }
    const breachTimeAnalysis = metricsResult.breachTimeAnalysis[0] || {
      avgTimeToBreachHours: 0,
    }

    // Calculate compliance rate
    const overallComplianceRate =
      complianceMetrics.total > 0
        ? (complianceMetrics.met / complianceMetrics.total) * 100
        : 0

    // Calculate trend (compare with previous period)
    const previousPeriodStart = startDate
      ? new Date(
          startDate.getTime() -
            (endDate ? endDate.getTime() - startDate.getTime() : 30 * 24 * 60 * 60 * 1000)
        )
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const [previousMetrics] = await ticketsCollection
      .aggregate([
        {
          $match: {
            orgId,
            'sla.resolutionDeadline': { $exists: true },
            createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            met: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', false] }, 1, 0],
              },
            },
          },
        },
      ])
      .toArray()

    const previousComplianceRate =
      previousMetrics?.total > 0
        ? (previousMetrics.met / previousMetrics.total) * 100
        : 0

    const trendValue = overallComplianceRate - previousComplianceRate
    const trendPercentage = Math.abs(trendValue).toFixed(1)

    return {
      overallComplianceRate: Math.round(overallComplianceRate * 10) / 10,
      totalTicketsWithSLA: complianceMetrics.total,
      slaMetTickets: complianceMetrics.met,
      slaBreachedTickets: complianceMetrics.breached,
      avgTimeToBreachHours: Math.round(breachTimeAnalysis.avgTimeToBreachHours * 10) / 10,
      criticalBreaches: complianceMetrics.criticalBreaches,
      trendData: {
        direction: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
        value: `${trendPercentage}%`,
        period: 'vs previous period',
      },
    }
  }

  /**
   * Get SLA breach analysis by category
   */
  static async getBreachByCategory(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10
  ): Promise<SLABreachByCategory[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      'sla.resolutionDeadline': { $exists: true },
    }
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
            totalWithSLA: { $sum: 1 },
            breached: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', true] }, 1, 0],
              },
            },
            totalBreachTime: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$sla.breached', true] },
                      { $ne: ['$resolvedAt', null] },
                    ],
                  },
                  {
                    $subtract: [
                      '$resolvedAt',
                      '$sla.resolutionDeadline',
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
        {
          $project: {
            category: '$_id',
            totalWithSLA: 1,
            breached: 1,
            breachRate: {
              $multiply: [
                { $divide: ['$breached', '$totalWithSLA'] },
                100,
              ],
            },
            avgBreachTimeHours: {
              $cond: {
                if: { $gt: ['$breached', 0] },
                then: {
                  $divide: ['$totalBreachTime', '$breached', 3600000],
                },
                else: 0,
              },
            },
          },
        },
        { $sort: { breachRate: -1 } },
        { $limit: limit },
      ])
      .toArray()

    return categoryData.map((item: any) => ({
      category: item.category || 'Uncategorized',
      totalWithSLA: item.totalWithSLA,
      breached: item.breached,
      breachRate: Math.round(item.breachRate * 10) / 10,
      avgBreachTimeHours: Math.round(item.avgBreachTimeHours * 10) / 10,
    }))
  }

  /**
   * Get SLA breach analysis by priority
   */
  static async getBreachByPriority(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SLABreachByPriority[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      'sla.resolutionDeadline': { $exists: true },
    }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const priorityData = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$priority',
            totalWithSLA: { $sum: 1 },
            breached: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', true] }, 1, 0],
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
            resolvedCount: {
              $sum: {
                $cond: [{ $ne: ['$resolvedAt', null] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            priority: '$_id',
            totalWithSLA: 1,
            breached: 1,
            breachRate: {
              $multiply: [
                { $divide: ['$breached', '$totalWithSLA'] },
                100,
              ],
            },
            avgResolutionTimeHours: {
              $cond: {
                if: { $gt: ['$resolvedCount', 0] },
                then: {
                  $divide: [
                    '$totalResolutionTime',
                    '$resolvedCount',
                    3600000,
                  ],
                },
                else: 0,
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray()

    return priorityData.map((item: any) => ({
      priority: item.priority,
      totalWithSLA: item.totalWithSLA,
      breached: item.breached,
      breachRate: Math.round(item.breachRate * 10) / 10,
      avgResolutionTimeHours: Math.round(item.avgResolutionTimeHours * 10) / 10,
    }))
  }

  /**
   * Get SLA compliance trend over time
   */
  static async getComplianceTrend(
    orgId: string,
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month' = 'day'
  ): Promise<SLAComplianceTrend[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    const dateFormat =
      granularity === 'day'
        ? '%Y-%m-%d'
        : granularity === 'week'
        ? '%Y-W%U'
        : '%Y-%m'

    const trendData = await ticketsCollection
      .aggregate([
        {
          $match: {
            orgId,
            'sla.resolutionDeadline': { $exists: true },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
            total: { $sum: 1 },
            compliant: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', false] }, 1, 0],
              },
            },
            breached: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', true] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            date: '$_id',
            total: 1,
            compliant: 1,
            breached: 1,
            complianceRate: {
              $multiply: [{ $divide: ['$compliant', '$total'] }, 100],
            },
          },
        },
        { $sort: { date: 1 } },
      ])
      .toArray()

    return trendData.map((item: any) => ({
      date: item.date,
      total: item.total,
      compliant: item.compliant,
      breached: item.breached,
      complianceRate: Math.round(item.complianceRate * 10) / 10,
    }))
  }

  /**
   * Get time to breach analysis
   */
  static async getTimeToBreachAnalysis(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<TimeToBreachAnalysis[]> {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      'sla.breached': true,
      resolvedAt: { $exists: true },
    }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const breachData = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $project: {
            timeToBreachHours: {
              $divide: [
                {
                  $subtract: [
                    '$resolvedAt',
                    '$sla.resolutionDeadline',
                  ],
                },
                3600000,
              ],
            },
          },
        },
        {
          $bucket: {
            groupBy: '$timeToBreachHours',
            boundaries: [0, 1, 4, 8, 24, 72, 1000],
            default: 'over 72 hours',
            output: { count: { $sum: 1 } },
          },
        },
      ])
      .toArray()

    const rangeLabels: Record<number, string> = {
      0: '0-1 hours',
      1: '1-4 hours',
      4: '4-8 hours',
      8: '8-24 hours',
      24: '1-3 days',
      72: '3+ days',
    }

    const total = breachData.reduce((sum: number, item: any) => sum + item.count, 0)

    return breachData.map((item: any) => ({
      range: typeof item._id === 'number' ? rangeLabels[item._id] : item._id,
      count: item.count,
      percentage: total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0,
    }))
  }

  /**
   * Get SLA performance by service/team
   */
  static async getPerformanceByTeam(
    orgId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 10
  ): Promise<
    Array<{
      assignee: string
      assigneeName: string
      totalTickets: number
      slaCompliant: number
      complianceRate: number
    }>
  > {
    const db = await getDatabase()
    const ticketsCollection = db.collection(COLLECTIONS.TICKETS)
    const usersCollection = db.collection(COLLECTIONS.USERS)

    // Build date filter
    const dateFilter: any = {
      orgId,
      'sla.resolutionDeadline': { $exists: true },
      assignedTo: { $exists: true, $ne: null },
    }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const teamData = await ticketsCollection
      .aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$assignedTo',
            totalTickets: { $sum: 1 },
            slaCompliant: {
              $sum: {
                $cond: [{ $eq: ['$sla.breached', false] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            assignee: '$_id',
            totalTickets: 1,
            slaCompliant: 1,
            complianceRate: {
              $multiply: [
                { $divide: ['$slaCompliant', '$totalTickets'] },
                100,
              ],
            },
          },
        },
        { $sort: { complianceRate: -1 } },
        { $limit: limit },
      ])
      .toArray()

    // Fetch user names
    const userIds = teamData.map((item: any) => item.assignee)
    const users = await usersCollection
      .find({ _id: { $in: userIds } })
      .project({ firstName: 1, lastName: 1 })
      .toArray()

    const userMap = new Map(
      users.map((u: any) => [u._id.toString(), `${u.firstName} ${u.lastName}`])
    )

    return teamData.map((item: any) => ({
      assignee: item.assignee,
      assigneeName: userMap.get(item.assignee) || 'Unknown',
      totalTickets: item.totalTickets,
      slaCompliant: item.slaCompliant,
      complianceRate: Math.round(item.complianceRate * 10) / 10,
    }))
  }
}
