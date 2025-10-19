import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { OrganizationAssetSettings } from '../types'

export interface CreateOrganizationAssetSettingsInput {
  assetTagFormat?: {
    prefix?: string
    includeCategoryCode?: boolean
    sequenceLength?: number
    suffix?: string
    separator?: string
  }
  lifecycleStatuses?: Array<{
    value: string
    label: string
    color: string
    isActive: boolean
  }>
  defaultCategory?: string
  requireApprovalForAssignment?: boolean
  trackAssignmentHistory?: boolean
  enableAutoDiscovery?: boolean
  maintenanceReminderDays?: number
}

export class OrganizationAssetSettingsService {
  /**
   * Generate example asset tag based on format settings
   */
  private static generateExampleTag(
    format: OrganizationAssetSettings['assetTagFormat'],
    categoryCode: string = 'COMP'
  ): string {
    const parts: string[] = []

    if (format.prefix) {
      parts.push(format.prefix)
    }

    if (format.includeCategoryCode) {
      parts.push(categoryCode)
    }

    // Generate example sequence number
    const sequence = '1'.padStart(format.sequenceLength, '0')
    parts.push(sequence)

    if (format.suffix) {
      parts.push(format.suffix)
    }

    return parts.join(format.separator)
  }

  /**
   * Get or create organization asset settings
   */
  static async getOrCreateSettings(
    orgId: string,
    createdBy: string = 'system'
  ): Promise<OrganizationAssetSettings> {
    const db = await getDatabase()
    const collection = db.collection<OrganizationAssetSettings>(
      COLLECTIONS.ORGANIZATION_ASSET_SETTINGS
    )

    let settings = await collection.findOne({ orgId })

    if (!settings) {
      // Create default settings
      const defaultFormat = {
        prefix: '',
        includeCategoryCode: true,
        sequenceLength: 4,
        suffix: '',
        separator: '-',
        example: '',
      }

      defaultFormat.example = this.generateExampleTag(defaultFormat)

      settings = {
        _id: new ObjectId(),
        orgId,
        assetTagFormat: defaultFormat,
        lifecycleStatuses: [
          { value: 'active', label: 'Active', color: '#10b981', isActive: true },
          { value: 'in_use', label: 'In Use', color: '#3b82f6', isActive: true },
          { value: 'in_storage', label: 'In Storage', color: '#6366f1', isActive: true },
          { value: 'maintenance', label: 'Under Maintenance', color: '#f59e0b', isActive: true },
          { value: 'retired', label: 'Retired', color: '#64748b', isActive: true },
          { value: 'disposed', label: 'Disposed', color: '#ef4444', isActive: true },
        ],
        requireApprovalForAssignment: false,
        trackAssignmentHistory: true,
        enableAutoDiscovery: true,
        maintenanceReminderDays: 30,
        createdBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await collection.insertOne(settings)
    }

    return settings
  }

  /**
   * Update organization asset settings
   */
  static async updateSettings(
    orgId: string,
    updates: CreateOrganizationAssetSettingsInput
  ): Promise<OrganizationAssetSettings | null> {
    const db = await getDatabase()
    const collection = db.collection<OrganizationAssetSettings>(
      COLLECTIONS.ORGANIZATION_ASSET_SETTINGS
    )

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (updates.assetTagFormat) {
      // Merge with existing format
      const existing = await collection.findOne({ orgId })
      const currentFormat = existing?.assetTagFormat || {
        prefix: '',
        includeCategoryCode: true,
        sequenceLength: 4,
        suffix: '',
        separator: '-',
      }

      const newFormat = {
        ...currentFormat,
        ...updates.assetTagFormat,
      }

      // Generate new example
      newFormat.example = this.generateExampleTag(newFormat)

      updateData.assetTagFormat = newFormat
    }

    if (updates.lifecycleStatuses !== undefined) {
      updateData.lifecycleStatuses = updates.lifecycleStatuses
    }

    if (updates.defaultCategory !== undefined) {
      updateData.defaultCategory = updates.defaultCategory
    }

    if (updates.requireApprovalForAssignment !== undefined) {
      updateData.requireApprovalForAssignment = updates.requireApprovalForAssignment
    }

    if (updates.trackAssignmentHistory !== undefined) {
      updateData.trackAssignmentHistory = updates.trackAssignmentHistory
    }

    if (updates.enableAutoDiscovery !== undefined) {
      updateData.enableAutoDiscovery = updates.enableAutoDiscovery
    }

    if (updates.maintenanceReminderDays !== undefined) {
      updateData.maintenanceReminderDays = updates.maintenanceReminderDays
    }

    const result = await collection.findOneAndUpdate(
      { orgId },
      { $set: updateData },
      { returnDocument: 'after', upsert: true }
    )

    return result
  }

  /**
   * Generate next asset tag based on organization settings
   */
  static async generateNextAssetTag(
    orgId: string,
    categoryCode?: string
  ): Promise<string> {
    const db = await getDatabase()
    const settingsCollection = db.collection<OrganizationAssetSettings>(
      COLLECTIONS.ORGANIZATION_ASSET_SETTINGS
    )
    const assetsCollection = db.collection(COLLECTIONS.ASSETS)

    // Get settings
    const settings = await this.getOrCreateSettings(orgId)
    const format = settings.assetTagFormat

    // Find the highest sequence number for this prefix/category combination
    const pattern = this.buildSearchPattern(format, categoryCode)

    const assets = await assetsCollection
      .find({
        orgId,
        assetTag: { $regex: `^${pattern}` },
      })
      .sort({ assetTag: -1 })
      .limit(1)
      .toArray()

    let nextSequence = 1

    if (assets.length > 0) {
      // Extract sequence number from existing tag
      const lastTag = assets[0].assetTag
      const sequenceMatch = lastTag.match(/(\d+)/)
      if (sequenceMatch) {
        nextSequence = parseInt(sequenceMatch[1], 10) + 1
      }
    }

    // Build the new tag
    const parts: string[] = []

    if (format.prefix) {
      parts.push(format.prefix)
    }

    if (format.includeCategoryCode && categoryCode) {
      parts.push(categoryCode)
    }

    parts.push(nextSequence.toString().padStart(format.sequenceLength, '0'))

    if (format.suffix) {
      parts.push(format.suffix)
    }

    return parts.join(format.separator)
  }

  /**
   * Build regex pattern for finding existing tags
   */
  private static buildSearchPattern(
    format: OrganizationAssetSettings['assetTagFormat'],
    categoryCode?: string
  ): string {
    const parts: string[] = []

    if (format.prefix) {
      parts.push(format.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) // Escape regex chars
    }

    if (format.includeCategoryCode && categoryCode) {
      parts.push(categoryCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    }

    return parts.join(format.separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  }

  /**
   * Validate asset tag format
   */
  static validateAssetTag(tag: string): boolean {
    // Basic validation: not empty, reasonable length, alphanumeric with allowed separators
    if (!tag || tag.length === 0 || tag.length > 50) {
      return false
    }

    // Allow alphanumeric, hyphens, underscores
    return /^[A-Z0-9\-_]+$/i.test(tag)
  }
}
