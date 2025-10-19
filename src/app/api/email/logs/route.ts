import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { EmailDeliveryLog, EmailDeliveryStatus } from '@/lib/types'

/**
 * GET /api/email/logs
 * Get email delivery logs with pagination and filters
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50, max: 100)
 * - status: Filter by delivery status
 * - event: Filter by notification event
 * - from: Filter by start date (ISO string)
 * - to: Filter by end date (ISO string)
 * - search: Search in subject or recipient
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const skip = (page - 1) * limit

    // Filters
    const status = searchParams.get('status') as EmailDeliveryStatus | null
    const event = searchParams.get('event')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const search = searchParams.get('search')

    const db = await getDatabase()
    const logsCollection = db.collection<EmailDeliveryLog>(COLLECTIONS.EMAIL_DELIVERY_LOGS)

    // Build query
    const query: any = { orgId: session.user.orgId }

    if (status) {
      query.status = status
    }

    if (event) {
      query.event = event
    }

    if (from || to) {
      query.queuedAt = {}
      if (from) {
        query.queuedAt.$gte = new Date(from)
      }
      if (to) {
        query.queuedAt.$lte = new Date(to)
      }
    }

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { to: { $elemMatch: { $regex: search, $options: 'i' } } }
      ]
    }

    // Get logs with pagination
    const logs = await logsCollection
      .find(query)
      .sort({ queuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await logsCollection.countDocuments(query)

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })
  } catch (error: any) {
    console.error('Get email logs error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email logs' },
      { status: 500 }
    )
  }
}
