import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { UserNotificationPreferences } from '@/lib/types'
import { ObjectId } from 'mongodb'

/**
 * GET /api/email/preferences
 * Get current user's notification preferences
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const prefsCollection = db.collection<UserNotificationPreferences>(
      COLLECTIONS.USER_NOTIFICATION_PREFERENCES
    )

    let preferences = await prefsCollection.findOne({
      userId: session.user.id,
      orgId: session.user.orgId
    })

    // If no preferences exist, create default preferences
    if (!preferences) {
      const now = new Date()
      const defaultPreferences: Omit<UserNotificationPreferences, '_id'> = {
        userId: session.user.id,
        orgId: session.user.orgId,
        emailNotificationsEnabled: true,
        digestMode: 'realtime',
        doNotDisturb: false,
        preferences: {},
        createdAt: now,
        updatedAt: now,
      }

      const result = await prefsCollection.insertOne(
        defaultPreferences as UserNotificationPreferences
      )

      preferences = {
        ...defaultPreferences,
        _id: result.insertedId,
      } as UserNotificationPreferences
    }

    return NextResponse.json({
      success: true,
      data: preferences
    })
  } catch (error: any) {
    console.error('Get notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/email/preferences
 * Update current user's notification preferences
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    const db = await getDatabase()
    const prefsCollection = db.collection<UserNotificationPreferences>(
      COLLECTIONS.USER_NOTIFICATION_PREFERENCES
    )

    const updates: any = {
      updatedAt: new Date(),
    }

    // Only update fields that are provided
    const allowedFields = [
      'emailNotificationsEnabled',
      'digestMode',
      'digestTime',
      'doNotDisturb',
      'doNotDisturbUntil',
      'preferences',
      'quietHoursEnabled',
      'quietHoursStart',
      'quietHoursEnd'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Use upsert to create if doesn't exist
    const result = await prefsCollection.findOneAndUpdate(
      {
        userId: session.user.id,
        orgId: session.user.orgId
      },
      { $set: updates },
      {
        returnDocument: 'after',
        upsert: true
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Notification preferences updated successfully'
    })
  } catch (error: any) {
    console.error('Update notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/email/preferences
 * Reset current user's notification preferences to defaults
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    const prefsCollection = db.collection<UserNotificationPreferences>(
      COLLECTIONS.USER_NOTIFICATION_PREFERENCES
    )

    // Reset to default preferences
    const now = new Date()
    const defaultPreferences: Omit<UserNotificationPreferences, '_id'> = {
      userId: session.user.id,
      orgId: session.user.orgId,
      emailNotificationsEnabled: true,
      digestMode: 'realtime',
      doNotDisturb: false,
      preferences: {},
      createdAt: now,
      updatedAt: now,
    }

    const result = await prefsCollection.findOneAndUpdate(
      {
        userId: session.user.id,
        orgId: session.user.orgId
      },
      { $set: defaultPreferences },
      {
        returnDocument: 'after',
        upsert: true
      }
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Notification preferences reset to defaults'
    })
  } catch (error: any) {
    console.error('Reset notification preferences error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reset notification preferences' },
      { status: 500 }
    )
  }
}
