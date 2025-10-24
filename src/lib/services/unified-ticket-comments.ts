import { ObjectId, Filter } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { COLLECTIONS } from '@/lib/mongodb'
import { UnifiedTicketComment } from '@/lib/types'

/**
 * Unified Ticket Comment Service
 * Handles comment operations for all unified ticket types with internal/external support
 */
export class UnifiedTicketCommentService {
  /**
   * Create a new comment on a unified ticket
   */
  static async create(
    ticketId: string,
    orgId: string,
    commentData: {
      content: string
      isInternal: boolean
      createdBy: string
      createdByName: string
      createdByAvatar?: string
    }
  ): Promise<UnifiedTicketComment> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const now = new Date()
    const comment: UnifiedTicketComment = {
      _id: new ObjectId(),
      ticketId,
      orgId,
      content: commentData.content,
      isInternal: commentData.isInternal,
      createdBy: commentData.createdBy,
      createdByName: commentData.createdByName,
      createdByAvatar: commentData.createdByAvatar,
      createdAt: now,
      isDeleted: false,
    }

    await collection.insertOne(comment)
    return comment
  }

  /**
   * Get all comments for a ticket
   * Filters internal comments based on user role
   */
  static async getAll(
    ticketId: string,
    orgId: string,
    options?: {
      includeInternal?: boolean
      includeDeleted?: boolean
    }
  ): Promise<UnifiedTicketComment[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const query: Filter<UnifiedTicketComment> = {
      ticketId,
      orgId,
    }

    // Filter out internal comments if user is not authorized
    if (!options?.includeInternal) {
      query.isInternal = false
    }

    // Filter out deleted comments unless specifically requested
    if (!options?.includeDeleted) {
      query.$or = [{ isDeleted: { $exists: false } }, { isDeleted: false }]
    }

    const comments = await collection.find(query).sort({ createdAt: 1 }).toArray()

    return comments.map((c) => ({ ...c, _id: c._id }))
  }

  /**
   * Get a single comment by ID
   */
  static async getById(
    commentId: string,
    orgId: string
  ): Promise<UnifiedTicketComment | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const comment = await collection.findOne({
      _id: new ObjectId(commentId),
      orgId,
    })

    return comment ? { ...comment, _id: comment._id } : null
  }

  /**
   * Update a comment
   * Only the creator or admin can update
   */
  static async update(
    commentId: string,
    orgId: string,
    content: string,
    editedBy: string,
    editedByName?: string
  ): Promise<UnifiedTicketComment | null> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const now = new Date()

    await collection.updateOne(
      { _id: new ObjectId(commentId), orgId },
      {
        $set: {
          content,
          updatedAt: now,
          editedBy,
          editedByName,
        },
      }
    )

    return this.getById(commentId, orgId)
  }

  /**
   * Delete a comment (soft delete)
   * Only the creator or admin can delete
   */
  static async delete(commentId: string, orgId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const result = await collection.updateOne(
      { _id: new ObjectId(commentId), orgId },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Permanently delete a comment
   * Admin only - for compliance/GDPR
   */
  static async hardDelete(commentId: string, orgId: string): Promise<boolean> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const result = await collection.deleteOne({
      _id: new ObjectId(commentId),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Get comment count for a ticket
   */
  static async getCount(
    ticketId: string,
    orgId: string,
    options?: {
      includeInternal?: boolean
      includeDeleted?: boolean
    }
  ): Promise<number> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const query: Filter<UnifiedTicketComment> = {
      ticketId,
      orgId,
    }

    if (!options?.includeInternal) {
      query.isInternal = false
    }

    if (!options?.includeDeleted) {
      query.$or = [{ isDeleted: { $exists: false } }, { isDeleted: false }]
    }

    return await collection.countDocuments(query)
  }

  /**
   * Get comments by user
   */
  static async getByUser(
    orgId: string,
    userId: string,
    options?: {
      includeDeleted?: boolean
      limit?: number
    }
  ): Promise<UnifiedTicketComment[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const query: Filter<UnifiedTicketComment> = {
      orgId,
      createdBy: userId,
    }

    if (!options?.includeDeleted) {
      query.$or = [{ isDeleted: { $exists: false } }, { isDeleted: false }]
    }

    let cursor = collection.find(query).sort({ createdAt: -1 })

    if (options?.limit) {
      cursor = cursor.limit(options.limit)
    }

    const comments = await cursor.toArray()
    return comments.map((c) => ({ ...c, _id: c._id }))
  }

  /**
   * Bulk delete comments for a ticket
   * Used when deleting a ticket
   */
  static async deleteByTicket(ticketId: string, orgId: string): Promise<number> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const result = await collection.updateMany(
      { ticketId, orgId },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount
  }

  /**
   * Get recent comments across organization
   * Admin dashboard view
   */
  static async getRecent(
    orgId: string,
    options?: {
      limit?: number
      includeInternal?: boolean
    }
  ): Promise<UnifiedTicketComment[]> {
    const client = await clientPromise
    const db = client.db('deskwise')
    const collection = db.collection<UnifiedTicketComment>(COLLECTIONS.UNIFIED_TICKET_COMMENTS)

    const query: Filter<UnifiedTicketComment> = {
      orgId,
      $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }],
    }

    if (!options?.includeInternal) {
      query.isInternal = false
    }

    const limit = options?.limit || 50

    const comments = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()

    return comments.map((c) => ({ ...c, _id: c._id }))
  }
}
