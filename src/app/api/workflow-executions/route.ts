import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const db = await getDatabase()
    const executionsCollection = db.collection(COLLECTIONS.WORKFLOW_EXECUTIONS)

    // Build filter
    const filter: any = { orgId: session.user.orgId }

    // Filter by workflow ID
    if (searchParams.get('workflowId')) {
      const workflowId = searchParams.get('workflowId')!
      if (ObjectId.isValid(workflowId)) {
        filter.workflowId = workflowId
      }
    }

    // Filter by status
    if (searchParams.get('status')) {
      const statuses = searchParams.get('status')!.split(',')
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    // Filter by triggered by
    if (searchParams.get('triggeredBy')) {
      const triggeredBy = searchParams.get('triggeredBy')!.split(',')
      filter.triggeredBy =
        triggeredBy.length === 1 ? triggeredBy[0] : { $in: triggeredBy }
    }

    // Filter by triggered by user
    if (searchParams.get('triggeredByUser')) {
      filter.triggeredByUser = searchParams.get('triggeredByUser')!
    }

    // Filter by date range
    if (searchParams.get('startDate') || searchParams.get('endDate')) {
      filter.startedAt = {}
      if (searchParams.get('startDate')) {
        filter.startedAt.$gte = new Date(searchParams.get('startDate')!)
      }
      if (searchParams.get('endDate')) {
        filter.startedAt.$lte = new Date(searchParams.get('endDate')!)
      }
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Sort by most recent
    const executions = await executionsCollection
      .find(filter)
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await executionsCollection.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: executions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get workflow executions error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow executions' },
      { status: 500 }
    )
  }
}
