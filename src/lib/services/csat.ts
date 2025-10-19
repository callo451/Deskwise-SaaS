import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { CSATRating, Ticket } from '@/lib/types'

export interface SubmitRatingInput {
  ticketId: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback?: string
}

export interface CSATFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  assignedTo?: string
  minRating?: number
  maxRating?: number
}

export interface CSATStats {
  averageScore: number
  totalResponses: number
  totalTickets: number
  responseRate: number
  distribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
  trend?: {
    currentPeriod: number
    previousPeriod: number
    change: number
    changePercent: number
  }
  recentFeedback: Array<{
    ticketNumber: string
    rating: number
    feedback: string
    submittedAt: Date
    submittedByName: string
  }>
}

export class CSATService {
  /**
   * Submit CSAT rating for a ticket
   */
  static async submitRating(
    orgId: string,
    input: SubmitRatingInput,
    userId: string,
    userName: string
  ): Promise<CSATRating> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
    const ratingsCollection = db.collection<CSATRating>(COLLECTIONS.CSAT_RATINGS)

    // Get the ticket
    const ticket = await ticketsCollection.findOne({
      _id: new ObjectId(input.ticketId),
      orgId,
    })

    if (!ticket) {
      throw new Error('Ticket not found')
    }

    // Check if ticket is resolved or closed
    if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
      throw new Error('Can only rate resolved or closed tickets')
    }

    // Check if user is the requester
    if (ticket.requesterId !== userId) {
      throw new Error('Only the ticket requester can submit a rating')
    }

    // Check if rating already exists
    const existingRating = await ratingsCollection.findOne({
      ticketId: input.ticketId,
      orgId,
    })

    if (existingRating) {
      throw new Error('Rating already submitted for this ticket')
    }

    const now = new Date()
    const rating: Omit<CSATRating, '_id'> = {
      orgId,
      ticketId: input.ticketId,
      ticketNumber: ticket.ticketNumber,
      rating: input.rating,
      feedback: input.feedback,
      submittedBy: userId,
      submittedByName: userName,
      submittedAt: now,
    }

    // Insert the rating
    const result = await ratingsCollection.insertOne(rating as CSATRating)

    // Update the ticket with the rating reference
    await ticketsCollection.updateOne(
      { _id: new ObjectId(input.ticketId), orgId },
      {
        $set: {
          csatRating: {
            ...rating,
            _id: result.insertedId,
          } as CSATRating,
          updatedAt: now,
        },
      }
    )

    return {
      ...rating,
      _id: result.insertedId,
    } as CSATRating
  }

  /**
   * Get CSAT rating for a specific ticket
   */
  static async getTicketRating(
    ticketId: string,
    orgId: string
  ): Promise<CSATRating | null> {
    const db = await getDatabase()
    const ratingsCollection = db.collection<CSATRating>(COLLECTIONS.CSAT_RATINGS)

    return await ratingsCollection.findOne({
      ticketId,
      orgId,
    })
  }

  /**
   * Get CSAT statistics with filters
   */
  static async getCSATStats(
    orgId: string,
    filters?: CSATFilters
  ): Promise<CSATStats> {
    const db = await getDatabase()
    const ratingsCollection = db.collection<CSATRating>(COLLECTIONS.CSAT_RATINGS)
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Build the base query for ratings
    const ratingQuery: any = { orgId }
    const ticketQuery: any = {
      orgId,
      status: { $in: ['resolved', 'closed'] }
    }

    // Apply date filters
    if (filters?.startDate || filters?.endDate) {
      ratingQuery.submittedAt = {}
      if (filters.startDate) {
        ratingQuery.submittedAt.$gte = filters.startDate
      }
      if (filters.endDate) {
        ratingQuery.submittedAt.$lte = filters.endDate
      }
    }

    // Apply rating filters
    if (filters?.minRating !== undefined || filters?.maxRating !== undefined) {
      ratingQuery.rating = {}
      if (filters.minRating !== undefined) {
        ratingQuery.rating.$gte = filters.minRating
      }
      if (filters.maxRating !== undefined) {
        ratingQuery.rating.$lte = filters.maxRating
      }
    }

    // Get ticket IDs based on filters (category, assignedTo)
    let filteredTicketIds: string[] | undefined
    if (filters?.category || filters?.assignedTo) {
      if (filters.category) {
        ticketQuery.category = filters.category
      }
      if (filters.assignedTo) {
        ticketQuery.assignedTo = filters.assignedTo
      }

      const tickets = await ticketsCollection
        .find(ticketQuery, { projection: { _id: 1 } })
        .toArray()

      filteredTicketIds = tickets.map(t => t._id.toString())

      if (filteredTicketIds.length > 0) {
        ratingQuery.ticketId = { $in: filteredTicketIds }
      } else {
        // No tickets match, return empty stats
        return {
          averageScore: 0,
          totalResponses: 0,
          totalTickets: 0,
          responseRate: 0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          recentFeedback: [],
        }
      }
    }

    // Get all ratings matching the query
    const ratings = await ratingsCollection.find(ratingQuery).toArray()

    // Calculate statistics
    const totalResponses = ratings.length
    const averageScore =
      totalResponses > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalResponses
        : 0

    // Calculate distribution
    const distribution = {
      1: ratings.filter(r => r.rating === 1).length,
      2: ratings.filter(r => r.rating === 2).length,
      3: ratings.filter(r => r.rating === 3).length,
      4: ratings.filter(r => r.rating === 4).length,
      5: ratings.filter(r => r.rating === 5).length,
    }

    // Count total resolved/closed tickets for response rate
    const totalTickets = await ticketsCollection.countDocuments(ticketQuery)
    const responseRate =
      totalTickets > 0 ? (totalResponses / totalTickets) * 100 : 0

    // Get recent feedback (last 10 with comments)
    const recentFeedback = ratings
      .filter(r => r.feedback && r.feedback.trim().length > 0)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
      .slice(0, 10)
      .map(r => ({
        ticketNumber: r.ticketNumber,
        rating: r.rating,
        feedback: r.feedback || '',
        submittedAt: r.submittedAt,
        submittedByName: r.submittedByName || 'Unknown',
      }))

    // Calculate trend (compare with previous period)
    let trend
    if (filters?.startDate && filters?.endDate) {
      const periodLength =
        filters.endDate.getTime() - filters.startDate.getTime()
      const previousStartDate = new Date(
        filters.startDate.getTime() - periodLength
      )
      const previousEndDate = filters.startDate

      const previousRatings = await ratingsCollection
        .find({
          ...ratingQuery,
          submittedAt: {
            $gte: previousStartDate,
            $lte: previousEndDate,
          },
        })
        .toArray()

      const previousAverage =
        previousRatings.length > 0
          ? previousRatings.reduce((sum, r) => sum + r.rating, 0) /
            previousRatings.length
          : 0

      const change = averageScore - previousAverage
      const changePercent =
        previousAverage > 0 ? (change / previousAverage) * 100 : 0

      trend = {
        currentPeriod: averageScore,
        previousPeriod: previousAverage,
        change,
        changePercent,
      }
    }

    return {
      averageScore,
      totalResponses,
      totalTickets,
      responseRate,
      distribution,
      trend,
      recentFeedback,
    }
  }

  /**
   * Get CSAT ratings for a specific technician
   */
  static async getTechnicianStats(
    orgId: string,
    technicianId: string,
    filters?: CSATFilters
  ): Promise<CSATStats> {
    return this.getCSATStats(orgId, {
      ...filters,
      assignedTo: technicianId,
    })
  }

  /**
   * Get all ratings for an organization
   */
  static async getAllRatings(
    orgId: string,
    limit: number = 50
  ): Promise<CSATRating[]> {
    const db = await getDatabase()
    const ratingsCollection = db.collection<CSATRating>(COLLECTIONS.CSAT_RATINGS)

    return await ratingsCollection
      .find({ orgId })
      .sort({ submittedAt: -1 })
      .limit(limit)
      .toArray()
  }
}
