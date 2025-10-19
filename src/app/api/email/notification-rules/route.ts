import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { NotificationRule, NotificationEvent } from '@/lib/types'
import { ObjectId } from 'mongodb'

/**
 * GET /api/email/notification-rules
 * Get all notification rules for the organization
 *
 * Query params:
 * - event: Filter by notification event
 * - isEnabled: Filter by enabled status (true/false)
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
    const event = searchParams.get('event') as NotificationEvent | null
    const isEnabled = searchParams.get('isEnabled')

    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    const query: any = { orgId: session.user.orgId }

    if (event) {
      query.event = event
    }

    if (isEnabled !== null) {
      query.isEnabled = isEnabled === 'true'
    }

    const rules = await rulesCollection
      .find(query)
      .sort({ priority: 1, name: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: rules,
      count: rules.length
    })
  } catch (error: any) {
    console.error('Get notification rules error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get notification rules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/notification-rules
 * Create a new notification rule
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    // Validate required fields
    const requiredFields = ['name', 'event', 'templateId', 'recipients']

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate recipients array is not empty
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'At least one recipient must be specified' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    const now = new Date()

    const rule: Omit<NotificationRule, '_id'> = {
      orgId: session.user.orgId,
      name: body.name,
      description: body.description || '',
      event: body.event,
      conditions: body.conditions || [],
      templateId: body.templateId,
      recipients: body.recipients,
      priority: body.priority || 100,
      isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
      executionCount: 0,
      successCount: 0,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await rulesCollection.insertOne(rule as NotificationRule)

    const createdRule = {
      ...rule,
      _id: result.insertedId,
    }

    return NextResponse.json({
      success: true,
      data: createdRule,
      message: 'Notification rule created successfully'
    })
  } catch (error: any) {
    console.error('Create notification rule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create notification rule' },
      { status: 500 }
    )
  }
}
