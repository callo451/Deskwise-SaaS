import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { NotificationRule } from '@/lib/types'
import { ObjectId } from 'mongodb'

/**
 * GET /api/email/notification-rules/[id]
 * Get a single notification rule by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    const rule = await rulesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId
    })

    if (!rule) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: rule
    })
  } catch (error: any) {
    console.error('Get notification rule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get notification rule' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/email/notification-rules/[id]
 * Update an existing notification rule
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Validate recipients if provided
    if (body.recipients !== undefined) {
      if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
        return NextResponse.json(
          { error: 'At least one recipient must be specified' },
          { status: 400 }
        )
      }
    }

    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    const updates: any = {
      updatedAt: new Date(),
    }

    // Only update fields that are provided
    const allowedFields = [
      'name',
      'description',
      'event',
      'conditions',
      'templateId',
      'recipients',
      'priority',
      'isEnabled'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const result = await rulesCollection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId: session.user.orgId
      },
      { $set: updates },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Notification rule updated successfully'
    })
  } catch (error: any) {
    console.error('Update notification rule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification rule' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/email/notification-rules/[id]
 * Delete a notification rule
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    const result = await rulesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Notification rule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Notification rule deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete notification rule error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification rule' },
      { status: 500 }
    )
  }
}
