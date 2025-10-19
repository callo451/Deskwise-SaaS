import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { CannedResponse } from '@/lib/types'

export interface CreateCannedResponseInput {
  name: string
  content: string
  category: string
  tags?: string[]
}

export interface UpdateCannedResponseInput {
  name?: string
  content?: string
  category?: string
  tags?: string[]
  isActive?: boolean
}

export interface CannedResponseFilters {
  category?: string
  search?: string
  isActive?: boolean
}

export class CannedResponseService {
  /**
   * Extract variables from content
   * Looks for {{variableName}} patterns
   */
  private static extractVariables(content: string): string[] {
    const variablePattern = /\{\{(\w+)\}\}/g
    const matches = [...content.matchAll(variablePattern)]
    const variables = matches.map((match) => `{{${match[1]}}}`)

    // Return unique variables
    return [...new Set(variables)]
  }

  /**
   * Interpolate variables in content
   * Replaces {{variableName}} with actual values
   */
  static interpolateVariables(
    content: string,
    variables: Record<string, string | number | undefined>
  ): string {
    let result = content

    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      result = result.replace(pattern, String(value || ''))
    }

    return result
  }

  /**
   * Create a new canned response
   */
  static async createCannedResponse(
    orgId: string,
    input: CreateCannedResponseInput,
    createdBy: string
  ): Promise<CannedResponse> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const now = new Date()
    const variables = this.extractVariables(input.content)

    const cannedResponse: Omit<CannedResponse, '_id'> = {
      orgId,
      name: input.name,
      content: input.content,
      category: input.category,
      variables,
      usageCount: 0,
      isActive: true,
      tags: input.tags || [],
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await collection.insertOne(cannedResponse as CannedResponse)

    return {
      ...cannedResponse,
      _id: result.insertedId,
    } as CannedResponse
  }

  /**
   * Get canned response by ID
   */
  static async getCannedResponseById(
    id: string,
    orgId: string
  ): Promise<CannedResponse | null> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    return await collection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get all canned responses with filters
   */
  static async getCannedResponses(
    orgId: string,
    filters?: CannedResponseFilters
  ): Promise<CannedResponse[]> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const query: any = { orgId }

    // Apply filters
    if (filters?.category) {
      query.category = filters.category
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { category: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } },
      ]
    }

    return await collection
      .find(query)
      .sort({ name: 1 })
      .toArray()
  }

  /**
   * Get canned responses by category
   */
  static async getCannedResponsesByCategory(
    orgId: string,
    category: string
  ): Promise<CannedResponse[]> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    return await collection
      .find({
        orgId,
        category,
        isActive: true,
      })
      .sort({ name: 1 })
      .toArray()
  }

  /**
   * Get all unique categories
   */
  static async getCategories(orgId: string): Promise<string[]> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const categories = await collection
      .distinct('category', { orgId, isActive: true })

    return categories.sort()
  }

  /**
   * Update canned response
   */
  static async updateCannedResponse(
    id: string,
    orgId: string,
    updates: UpdateCannedResponseInput
  ): Promise<CannedResponse | null> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // Re-extract variables if content changed
    if (updates.content) {
      updateData.variables = this.extractVariables(updates.content)
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete canned response
   */
  static async deleteCannedResponse(
    id: string,
    orgId: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Increment usage count
   */
  static async incrementUsageCount(
    id: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      { $inc: { usageCount: 1 } }
    )
  }

  /**
   * Get most used canned responses
   */
  static async getMostUsed(
    orgId: string,
    limit: number = 10
  ): Promise<CannedResponse[]> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    return await collection
      .find({
        orgId,
        isActive: true,
      })
      .sort({ usageCount: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get recently created canned responses
   */
  static async getRecentlyCreated(
    orgId: string,
    limit: number = 5
  ): Promise<CannedResponse[]> {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    return await collection
      .find({
        orgId,
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()
  }

  /**
   * Get statistics
   */
  static async getStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<CannedResponse>(COLLECTIONS.CANNED_RESPONSES)

    const [
      total,
      active,
      inactive,
      totalUsage,
      categories,
    ] = await Promise.all([
      collection.countDocuments({ orgId }),
      collection.countDocuments({ orgId, isActive: true }),
      collection.countDocuments({ orgId, isActive: false }),
      collection
        .aggregate([
          { $match: { orgId } },
          { $group: { _id: null, total: { $sum: '$usageCount' } } },
        ])
        .toArray()
        .then((result) => result[0]?.total || 0),
      collection.distinct('category', { orgId, isActive: true }),
    ])

    return {
      total,
      active,
      inactive,
      totalUsage,
      categoryCount: categories.length,
      categories,
    }
  }
}
