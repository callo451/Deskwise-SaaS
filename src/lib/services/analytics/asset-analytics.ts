import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { AssetStatus } from '@/lib/types'

export interface AssetAnalyticsMetrics {
  totalAssets: number
  activeAssets: number
  utilizationRate: number
  maintenanceDue: number
  totalAssetValue: number
  warrantyExpiringSoon: number // Within 90 days
  trendData: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
}

export interface AssetLifecycleDistribution {
  status: Record<AssetStatus, number>
  ageDistribution: Array<{ range: string; count: number; percentage: number }>
}

export interface AssetCategoryBreakdown {
  category: string
  count: number
  totalValue: number
  percentage: number
  avgAge: number
}

export interface AssetTCOAnalysis {
  category: string
  purchaseCost: number
  maintenanceCost: number
  totalCost: number
  assetCount: number
  avgCostPerAsset: number
}

export interface WarrantyExpirationTracker {
  expiringSoon: number // Within 30 days
  expiringThisQuarter: number // Within 90 days
  expired: number
  underWarranty: number
  byMonth: Array<{ month: string; expiringCount: number }>
}

/**
 * Asset Analytics Service
 * Provides comprehensive analytics and metrics for asset management
 */
export class AssetAnalyticsService {
  /**
   * Get overview metrics for assets
   */
  static async getOverviewMetrics(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AssetAnalyticsMetrics> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    // Build date filter (for assets created in period)
    const dateFilter: any = { orgId }
    if (startDate || endDate) {
      dateFilter.createdAt = {}
      if (startDate) dateFilter.createdAt.$gte = startDate
      if (endDate) dateFilter.createdAt.$lte = endDate
    }

    const now = new Date()
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Aggregate pipeline for overview metrics
    const [metricsResult] = await assetsCollection
      .aggregate([
        { $match: { orgId } }, // All assets for the org
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  active: {
                    $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                  },
                  assigned: {
                    $sum: {
                      $cond: [{ $ne: ['$assignedTo', null] }, 1, 0],
                    },
                  },
                  maintenanceDue: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ['$lastMaintenanceDate', null] },
                            { $ne: ['$maintenanceSchedule', null] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  warrantyExpiringSoon: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $ne: ['$warrantyExpiry', null] },
                            { $gte: ['$warrantyExpiry', now] },
                            { $lte: ['$warrantyExpiry', ninetyDaysFromNow] },
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
            totalValue: [
              {
                $group: {
                  _id: null,
                  totalValue: { $sum: { $ifNull: ['$purchaseCost', 0] } },
                },
              },
            ],
            newAssets: [
              { $match: dateFilter },
              { $count: 'count' },
            ],
          },
        },
      ])
      .toArray()

    const counts = metricsResult.counts[0] || {
      total: 0,
      active: 0,
      assigned: 0,
      maintenanceDue: 0,
      warrantyExpiringSoon: 0,
    }
    const totalValue = metricsResult.totalValue[0]?.totalValue || 0
    const newAssets = metricsResult.newAssets[0]?.count || 0

    // Calculate utilization rate (assigned assets / total assets)
    const utilizationRate =
      counts.total > 0 ? (counts.assigned / counts.total) * 100 : 0

    // Calculate trend (new assets in current period vs previous period)
    const previousPeriodStart = startDate
      ? new Date(
          startDate.getTime() -
            (endDate ? endDate.getTime() - startDate.getTime() : 30 * 24 * 60 * 60 * 1000)
        )
      : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    const previousPeriodEnd = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const previousCount = await assetsCollection.countDocuments({
      orgId,
      createdAt: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
    })

    const trendValue = newAssets - previousCount
    const trendPercentage =
      previousCount > 0
        ? Math.abs((trendValue / previousCount) * 100).toFixed(1)
        : '0.0'

    return {
      totalAssets: counts.total,
      activeAssets: counts.active,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      maintenanceDue: counts.maintenanceDue,
      totalAssetValue: Math.round(totalValue * 100) / 100,
      warrantyExpiringSoon: counts.warrantyExpiringSoon,
      trendData: {
        direction: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
        value: `${trendPercentage}%`,
        period: 'vs previous period',
      },
    }
  }

  /**
   * Get asset lifecycle distribution
   */
  static async getLifecycleDistribution(
    orgId: string
  ): Promise<AssetLifecycleDistribution> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    const now = new Date()

    const [distributionResult] = await assetsCollection
      .aggregate([
        { $match: { orgId } },
        {
          $facet: {
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } },
              { $sort: { _id: 1 } },
            ],
            byAge: [
              {
                $project: {
                  age: {
                    $divide: [
                      { $subtract: [now, '$purchaseDate'] },
                      365 * 24 * 60 * 60 * 1000, // Convert to years
                    ],
                  },
                },
              },
              {
                $bucket: {
                  groupBy: '$age',
                  boundaries: [0, 1, 3, 5, 10, 100],
                  default: 'unknown',
                  output: { count: { $sum: 1 } },
                },
              },
            ],
            total: [{ $count: 'count' }],
          },
        },
      ])
      .toArray()

    const total = distributionResult.total[0]?.count || 1

    // Process status distribution
    const statusDistribution: Record<AssetStatus, number> = {
      active: 0,
      maintenance: 0,
      retired: 0,
      disposed: 0,
    }
    distributionResult.byStatus.forEach((item: any) => {
      statusDistribution[item._id as AssetStatus] = item.count
    })

    // Process age distribution
    const ageLabels: Record<number, string> = {
      0: '0-1 years',
      1: '1-3 years',
      3: '3-5 years',
      5: '5-10 years',
      10: '10+ years',
    }

    const ageDistribution = distributionResult.byAge.map((item: any) => ({
      range: typeof item._id === 'number' ? ageLabels[item._id] : 'Unknown',
      count: item.count,
      percentage: Math.round((item.count / total) * 1000) / 10,
    }))

    return {
      status: statusDistribution,
      ageDistribution,
    }
  }

  /**
   * Get asset breakdown by category
   */
  static async getCategoryBreakdown(
    orgId: string
  ): Promise<AssetCategoryBreakdown[]> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    const now = new Date()

    const categoryData = await assetsCollection
      .aggregate([
        { $match: { orgId } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalValue: { $sum: { $ifNull: ['$purchaseCost', 0] } },
            avgAge: {
              $avg: {
                $divide: [
                  { $subtract: [now, { $ifNull: ['$purchaseDate', now] }] },
                  365 * 24 * 60 * 60 * 1000,
                ],
              },
            },
          },
        },
        { $sort: { count: -1 } },
      ])
      .toArray()

    const totalAssets = categoryData.reduce((sum: number, item: any) => sum + item.count, 0)

    return categoryData.map((item: any) => ({
      category: item._id || 'Uncategorized',
      count: item.count,
      totalValue: Math.round(item.totalValue * 100) / 100,
      percentage: totalAssets > 0 ? Math.round((item.count / totalAssets) * 1000) / 10 : 0,
      avgAge: Math.round(item.avgAge * 10) / 10,
    }))
  }

  /**
   * Get Total Cost of Ownership (TCO) analysis
   */
  static async getTCOAnalysis(
    orgId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AssetTCOAnalysis[]> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)
    const maintenanceCollection = db.collection(COLLECTIONS.ASSET_MAINTENANCE)

    // Build date filter for maintenance records
    const maintenanceFilter: any = { orgId }
    if (startDate || endDate) {
      maintenanceFilter.completedAt = {}
      if (startDate) maintenanceFilter.completedAt.$gte = startDate
      if (endDate) maintenanceFilter.completedAt.$lte = endDate
    }

    // Get maintenance costs by asset
    const maintenanceCosts = await maintenanceCollection
      .aggregate([
        { $match: maintenanceFilter },
        {
          $lookup: {
            from: COLLECTIONS.ASSETS,
            localField: 'assetId',
            foreignField: '_id',
            as: 'asset',
          },
        },
        { $unwind: '$asset' },
        {
          $group: {
            _id: '$asset.category',
            maintenanceCost: { $sum: { $ifNull: ['$cost', 0] } },
            assetIds: { $addToSet: '$asset._id' },
          },
        },
      ])
      .toArray()

    // Get purchase costs by category
    const purchaseCosts = await assetsCollection
      .aggregate([
        { $match: { orgId } },
        {
          $group: {
            _id: '$category',
            purchaseCost: { $sum: { $ifNull: ['$purchaseCost', 0] } },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Merge data
    const categoryMap = new Map<string, any>()

    purchaseCosts.forEach((item: any) => {
      categoryMap.set(item._id || 'Uncategorized', {
        category: item._id || 'Uncategorized',
        purchaseCost: item.purchaseCost,
        maintenanceCost: 0,
        assetCount: item.count,
      })
    })

    maintenanceCosts.forEach((item: any) => {
      const category = item._id || 'Uncategorized'
      const existing = categoryMap.get(category) || {
        category,
        purchaseCost: 0,
        maintenanceCost: 0,
        assetCount: 0,
      }
      existing.maintenanceCost = item.maintenanceCost
      categoryMap.set(category, existing)
    })

    return Array.from(categoryMap.values())
      .map((item) => ({
        category: item.category,
        purchaseCost: Math.round(item.purchaseCost * 100) / 100,
        maintenanceCost: Math.round(item.maintenanceCost * 100) / 100,
        totalCost: Math.round((item.purchaseCost + item.maintenanceCost) * 100) / 100,
        assetCount: item.assetCount,
        avgCostPerAsset:
          item.assetCount > 0
            ? Math.round(((item.purchaseCost + item.maintenanceCost) / item.assetCount) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
  }

  /**
   * Get warranty expiration tracking
   */
  static async getWarrantyExpirationTracker(
    orgId: string
  ): Promise<WarrantyExpirationTracker> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
    const twelveMonthsFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

    const [trackerResult] = await assetsCollection
      .aggregate([
        { $match: { orgId, warrantyExpiry: { $exists: true } } },
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  expiringSoon: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gte: ['$warrantyExpiry', now] },
                            { $lte: ['$warrantyExpiry', thirtyDaysFromNow] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  expiringThisQuarter: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $gte: ['$warrantyExpiry', now] },
                            { $lte: ['$warrantyExpiry', ninetyDaysFromNow] },
                          ],
                        },
                        1,
                        0,
                      ],
                    },
                  },
                  expired: {
                    $sum: {
                      $cond: [{ $lt: ['$warrantyExpiry', now] }, 1, 0],
                    },
                  },
                  underWarranty: {
                    $sum: {
                      $cond: [{ $gte: ['$warrantyExpiry', now] }, 1, 0],
                    },
                  },
                },
              },
            ],
            byMonth: [
              {
                $match: {
                  warrantyExpiry: {
                    $gte: now,
                    $lte: twelveMonthsFromNow,
                  },
                },
              },
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m', date: '$warrantyExpiry' },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ])
      .toArray()

    const counts = trackerResult.counts[0] || {
      expiringSoon: 0,
      expiringThisQuarter: 0,
      expired: 0,
      underWarranty: 0,
    }

    const byMonth = trackerResult.byMonth.map((item: any) => ({
      month: item._id,
      expiringCount: item.count,
    }))

    return {
      expiringSoon: counts.expiringSoon,
      expiringThisQuarter: counts.expiringThisQuarter,
      expired: counts.expired,
      underWarranty: counts.underWarranty,
      byMonth,
    }
  }

  /**
   * Get asset age distribution details
   */
  static async getAssetAgeDistribution(
    orgId: string
  ): Promise<Array<{ range: string; count: number; avgValue: number }>> {
    const db = await getDatabase()
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    const now = new Date()

    const ageData = await assetsCollection
      .aggregate([
        { $match: { orgId, purchaseDate: { $exists: true } } },
        {
          $project: {
            age: {
              $divide: [
                { $subtract: [now, '$purchaseDate'] },
                365 * 24 * 60 * 60 * 1000,
              ],
            },
            purchaseCost: { $ifNull: ['$purchaseCost', 0] },
          },
        },
        {
          $bucket: {
            groupBy: '$age',
            boundaries: [0, 1, 3, 5, 10, 100],
            default: 'unknown',
            output: {
              count: { $sum: 1 },
              avgValue: { $avg: '$purchaseCost' },
            },
          },
        },
      ])
      .toArray()

    const ageLabels: Record<number, string> = {
      0: '0-1 years',
      1: '1-3 years',
      3: '3-5 years',
      5: '5-10 years',
      10: '10+ years',
    }

    return ageData.map((item: any) => ({
      range: typeof item._id === 'number' ? ageLabels[item._id] : 'Unknown',
      count: item.count,
      avgValue: Math.round(item.avgValue * 100) / 100,
    }))
  }
}
