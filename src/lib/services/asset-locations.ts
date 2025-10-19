import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { AssetLocation } from '../types'

export interface CreateAssetLocationInput {
  name: string
  code: string
  type: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  parentId?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
}

export interface UpdateAssetLocationInput {
  name?: string
  code?: string
  type?: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  parentId?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  isActive?: boolean
}

export class AssetLocationService {
  /**
   * Build full path for a location (e.g., "HQ > Building A > Floor 2 > Room 201")
   */
  private static async buildFullPath(
    locationId: string,
    orgId: string,
    db: any
  ): Promise<string> {
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)
    const path: string[] = []
    let currentId: string | undefined = locationId

    // Traverse up the hierarchy
    while (currentId) {
      const location = await collection.findOne({ _id: new ObjectId(currentId), orgId })
      if (!location) break

      path.unshift(location.name)
      currentId = location.parentId
    }

    return path.join(' > ')
  }

  /**
   * Create a new asset location
   */
  static async createLocation(
    orgId: string,
    input: CreateAssetLocationInput,
    createdBy: string
  ): Promise<AssetLocation> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    // Check if code already exists for this org
    const existing = await collection.findOne({ orgId, code: input.code, isActive: true })
    if (existing) {
      throw new Error(`Location with code '${input.code}' already exists`)
    }

    // Validate parent exists if specified
    if (input.parentId) {
      const parent = await collection.findOne({
        _id: new ObjectId(input.parentId),
        orgId,
        isActive: true,
      })
      if (!parent) {
        throw new Error('Parent location not found')
      }
    }

    const location: AssetLocation = {
      _id: new ObjectId(),
      orgId,
      name: input.name,
      code: input.code.toUpperCase(),
      type: input.type,
      parentId: input.parentId,
      fullPath: '', // Will be updated below
      address: input.address,
      coordinates: input.coordinates,
      contactPerson: input.contactPerson,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      notes: input.notes,
      isActive: true,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Build full path
    location.fullPath = await this.buildFullPath(location._id.toString(), orgId, db)

    await collection.insertOne(location)
    return location
  }

  /**
   * Get all locations for an organization
   */
  static async getLocations(
    orgId: string,
    includeInactive: boolean = false
  ): Promise<AssetLocation[]> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    const query: any = { orgId }
    if (!includeInactive) {
      query.isActive = true
    }

    const locations = await collection
      .find(query)
      .sort({ fullPath: 1 })
      .toArray()

    return locations
  }

  /**
   * Get location by ID
   */
  static async getLocationById(
    id: string,
    orgId: string
  ): Promise<AssetLocation | null> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    const location = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })

    return location
  }

  /**
   * Update location
   */
  static async updateLocation(
    id: string,
    orgId: string,
    updates: UpdateAssetLocationInput
  ): Promise<AssetLocation | null> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    // Don't allow updating code if it would conflict
    if (updates.code) {
      const existing = await collection.findOne({
        orgId,
        code: updates.code.toUpperCase(),
        _id: { $ne: new ObjectId(id) },
        isActive: true,
      })
      if (existing) {
        throw new Error(`Location with code '${updates.code}' already exists`)
      }
      updates.code = updates.code.toUpperCase()
    }

    // Validate parent if being updated
    if (updates.parentId) {
      // Don't allow circular references
      if (updates.parentId === id) {
        throw new Error('Location cannot be its own parent')
      }

      const parent = await collection.findOne({
        _id: new ObjectId(updates.parentId),
        orgId,
        isActive: true,
      })
      if (!parent) {
        throw new Error('Parent location not found')
      }
    }

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Rebuild full path for this location and all children
    if (result && (updates.name || updates.parentId)) {
      const updatedFullPath = await this.buildFullPath(id, orgId, db)
      await collection.updateOne(
        { _id: new ObjectId(id), orgId },
        { $set: { fullPath: updatedFullPath } }
      )

      // Update all children's full paths recursively
      await this.updateChildrenPaths(id, orgId, db)

      // Fetch the updated location
      return await collection.findOne({ _id: new ObjectId(id), orgId })
    }

    return result
  }

  /**
   * Recursively update full paths for all children
   */
  private static async updateChildrenPaths(
    parentId: string,
    orgId: string,
    db: any
  ): Promise<void> {
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)
    const children = await collection.find({ orgId, parentId, isActive: true }).toArray()

    for (const child of children) {
      const fullPath = await this.buildFullPath(child._id.toString(), orgId, db)
      await collection.updateOne(
        { _id: child._id, orgId },
        { $set: { fullPath } }
      )

      // Recursively update grandchildren
      await this.updateChildrenPaths(child._id.toString(), orgId, db)
    }
  }

  /**
   * Delete location (soft delete)
   */
  static async deleteLocation(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    // Check if location has children
    const children = await collection.findOne({ orgId, parentId: id, isActive: true })
    if (children) {
      throw new Error('Cannot delete location with active child locations')
    }

    // TODO: Check if any assets are using this location before deleting

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
   * Get hierarchical location tree
   */
  static async getLocationTree(orgId: string): Promise<AssetLocation[]> {
    const locations = await this.getLocations(orgId)

    // Build parent-child relationships
    const locationMap = new Map<string, AssetLocation & { children?: AssetLocation[] }>()
    const rootLocations: (AssetLocation & { children?: AssetLocation[] })[] = []

    // First pass: create map
    locations.forEach((loc) => {
      locationMap.set(loc._id.toString(), { ...loc, children: [] })
    })

    // Second pass: build tree
    locations.forEach((loc) => {
      const locationWithChildren = locationMap.get(loc._id.toString())!
      if (loc.parentId) {
        const parent = locationMap.get(loc.parentId)
        if (parent) {
          parent.children!.push(locationWithChildren)
        } else {
          rootLocations.push(locationWithChildren)
        }
      } else {
        rootLocations.push(locationWithChildren)
      }
    })

    return rootLocations as AssetLocation[]
  }

  /**
   * Get locations by type
   */
  static async getLocationsByType(
    orgId: string,
    type: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  ): Promise<AssetLocation[]> {
    const db = await getDatabase()
    const collection = db.collection<AssetLocation>(COLLECTIONS.ASSET_LOCATIONS)

    const locations = await collection
      .find({ orgId, type, isActive: true })
      .sort({ fullPath: 1 })
      .toArray()

    return locations
  }
}
