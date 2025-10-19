import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { Asset, AssetStatus } from '../types'
import { OrganizationAssetSettingsService } from './organization-asset-settings'
import { AssetCategoryService } from './asset-categories'

export interface CreateAssetInput {
  assetTag?: string // Optional - will be auto-generated if not provided
  name: string
  category: string // Can be category ID or category name
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: Date
  warrantyExpiry?: Date
  assignedTo?: string
  clientId?: string
  location?: string
  purchaseCost?: number
  specifications?: Record<string, string>
  systemInfo?: any
  hardwareInfo?: any
  networkInfo?: any
}

export interface UpdateAssetInput {
  assetTag?: string
  name?: string
  category?: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: Date
  warrantyExpiry?: Date
  assignedTo?: string
  clientId?: string
  location?: string
  status?: AssetStatus
  purchaseCost?: number
  specifications?: Record<string, string>
  maintenanceSchedule?: string
  lastMaintenanceDate?: Date
  systemInfo?: any
  hardwareInfo?: any
  networkInfo?: any
}

export interface AssetFilters {
  category?: string
  status?: AssetStatus
  assignedTo?: string
  clientId?: string
  location?: string
  search?: string
}

export interface PerformanceSnapshot {
  agentId: string
  assetId: string
  timestamp: Date
  timeWindow: string
  performanceData: {
    cpu: {
      usage: number
      temperature?: number
      frequency?: number
      perCore?: number[]
    }
    memory: {
      usagePercent: number
      usedBytes: number
      totalBytes: number
      availableBytes: number
      swapUsed?: number
    }
    disk: Array<{
      name: string
      usagePercent: number
      totalBytes: number
      usedBytes: number
      freeBytes: number
      readBytesPerSec?: number
      writeBytesPerSec?: number
      readOpsPerSec?: number
      writeOpsPerSec?: number
    }>
    network: {
      totalUsage: number
      interfaces: Array<{
        name: string
        bytesRecvPerSec: number
        bytesSentPerSec: number
        packetsRecvPerSec: number
        packetsSentPerSec: number
      }>
    }
    system: {
      uptime: number
      processCount: number
      threadCount: number
    }
  }
}

export class AssetService {
  /**
   * Create a new asset
   */
  static async createAsset(
    orgId: string,
    input: CreateAssetInput,
    createdBy: string
  ): Promise<Asset> {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    // Auto-generate asset tag if not provided
    let assetTag = input.assetTag
    let categoryCode: string | undefined

    if (!assetTag) {
      // Try to get category code from category ID or name
      const categories = await AssetCategoryService.getCategories(orgId)
      const category = categories.find(
        (c) =>
          c._id.toString() === input.category ||
          c.name.toLowerCase() === input.category.toLowerCase() ||
          c.code === input.category
      )

      if (category) {
        categoryCode = category.code
      }

      // Generate asset tag
      assetTag = await OrganizationAssetSettingsService.generateNextAssetTag(
        orgId,
        categoryCode
      )
    }

    const asset: Asset = {
      _id: new ObjectId(),
      orgId,
      assetTag,
      name: input.name,
      category: input.category,
      manufacturer: input.manufacturer,
      model: input.model,
      serialNumber: input.serialNumber,
      purchaseDate: input.purchaseDate,
      warrantyExpiry: input.warrantyExpiry,
      assignedTo: input.assignedTo,
      clientId: input.clientId,
      location: input.location,
      status: 'active',
      purchaseCost: input.purchaseCost,
      specifications: input.specifications,
      systemInfo: input.systemInfo,
      hardwareInfo: input.hardwareInfo,
      networkInfo: input.networkInfo,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    await collection.insertOne(asset)

    return asset
  }

  /**
   * Get all assets with optional filters
   */
  static async getAssets(
    orgId: string,
    filters?: AssetFilters
  ): Promise<Asset[]> {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    console.log('[AssetService.getAssets] Called with orgId:', orgId)
    console.log('[AssetService.getAssets] Filters:', filters)

    const query: any = { orgId, isActive: true }

    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.assignedTo) {
      query.assignedTo = filters.assignedTo
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.location) {
      query.location = filters.location
    }

    if (filters?.search) {
      query.$or = [
        { assetTag: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { serialNumber: { $regex: filters.search, $options: 'i' } },
        { manufacturer: { $regex: filters.search, $options: 'i' } },
        { model: { $regex: filters.search, $options: 'i' } },
      ]
    }

    console.log('[AssetService.getAssets] MongoDB query:', JSON.stringify(query))

    const assets = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    console.log('[AssetService.getAssets] MongoDB returned:', assets.length, 'assets')
    if (assets.length > 0) {
      console.log('[AssetService.getAssets] First asset:', {
        _id: assets[0]._id,
        orgId: assets[0].orgId,
        assetTag: assets[0].assetTag,
        name: assets[0].name,
        isActive: assets[0].isActive,
      })
    } else {
      // Try to find assets without isActive filter to debug
      const allAssets = await collection.find({ orgId }).toArray()
      console.log('[AssetService.getAssets] Total assets in DB for this orgId (no isActive filter):', allAssets.length)
      if (allAssets.length > 0) {
        console.log('[AssetService.getAssets] First asset (no filter):', {
          _id: allAssets[0]._id,
          orgId: allAssets[0].orgId,
          assetTag: allAssets[0].assetTag,
          name: allAssets[0].name,
          isActive: allAssets[0].isActive,
        })
      }
    }

    return assets
  }

  /**
   * Get asset by ID
   */
  static async getAssetById(id: string, orgId: string): Promise<Asset | null> {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    const asset = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })

    return asset
  }

  /**
   * Update asset
   */
  static async updateAsset(
    id: string,
    orgId: string,
    updates: UpdateAssetInput
  ): Promise<Asset | null> {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete asset (soft delete)
   */
  static async deleteAsset(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    const result = await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Store performance snapshot from agent
   */
  static async storePerformanceSnapshot(
    orgId: string,
    snapshot: PerformanceSnapshot
  ): Promise<void> {
    const db = await getDatabase()
    const snapshotsCollection = db.collection(COLLECTIONS.PERFORMANCE_SNAPSHOTS)
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    // Store raw snapshot in dedicated performance_snapshots collection
    await snapshotsCollection.insertOne({
      ...snapshot,
      orgId,
      _id: new ObjectId(),
    })

    // Update asset's last seen timestamp in assets collection
    if (snapshot.assetId) {
      await assetsCollection.updateOne(
        { _id: new ObjectId(snapshot.assetId), orgId },
        {
          $set: {
            lastSeen: snapshot.timestamp,
            updatedAt: new Date(),
          },
        }
      )
    }
  }

  /**
   * Get performance data for an asset
   */
  static async getAssetPerformance(
    assetId: string,
    orgId: string,
    timeWindow: string = '1hour',
    limit: number = 60
  ) {
    const db = await getDatabase()
    const collection = db.collection(COLLECTIONS.PERFORMANCE_SNAPSHOTS)

    const windowMinutes: Record<string, number> = {
      '1min': 1,
      '5min': 5,
      '15min': 15,
      '1hour': 60,
      '1day': 1440,
    }

    const minutes = windowMinutes[timeWindow] || 60
    const startTime = new Date(Date.now() - minutes * 60 * 1000)

    const snapshots = await collection
      .find({
        assetId,
        orgId,
        timestamp: { $gte: startTime },
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    return snapshots
  }

  /**
   * Get asset statistics
   */
  static async getAssetStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    const [totalAssets, activeAssets, maintenanceAssets, retiredAssets] =
      await Promise.all([
        collection.countDocuments({ orgId, isActive: true }),
        collection.countDocuments({ orgId, isActive: true, status: 'active' }),
        collection.countDocuments({
          orgId,
          isActive: true,
          status: 'maintenance',
        }),
        collection.countDocuments({ orgId, isActive: true, status: 'retired' }),
      ])

    // Get assets by category
    const byCategory = await collection
      .aggregate([
        { $match: { orgId, isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ])
      .toArray()

    const categoryStats: Record<string, number> = {}
    byCategory.forEach((item) => {
      categoryStats[item._id] = item.count
    })

    return {
      total: totalAssets,
      active: activeAssets,
      maintenance: maintenanceAssets,
      retired: retiredAssets,
      byCategory: categoryStats,
    }
  }

  /**
   * Update asset capabilities (reported by agent)
   */
  static async updateAssetCapabilities(
    assetId: string,
    orgId: string,
    capabilities: {
      remoteControl?: boolean
      screenCapture?: boolean
      inputInjection?: boolean
      webrtcSupported?: boolean
      platform?: string
      agentVersion?: string
    }
  ) {
    const db = await getDatabase()
    const collection = db.collection<Asset>(COLLECTIONS.ASSETS)

    console.log('[AssetService.updateAssetCapabilities] Updating capabilities for assetId:', assetId)
    console.log('[AssetService.updateAssetCapabilities] Capabilities to set:', JSON.stringify(capabilities))

    const result = await collection.updateOne(
      { _id: new ObjectId(assetId), orgId },
      {
        $set: {
          capabilities,
          lastSeen: new Date(),
          updatedAt: new Date(),
        },
      }
    )

    console.log('[AssetService.updateAssetCapabilities] Update result:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      acknowledged: result.acknowledged,
    })

    if (result.matchedCount === 0) {
      console.warn('[AssetService.updateAssetCapabilities] WARNING: No asset found with id:', assetId, 'and orgId:', orgId)
    }
  }
}
