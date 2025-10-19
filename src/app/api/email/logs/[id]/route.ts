import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { EmailDeliveryLog } from '@/lib/types'
import { ObjectId } from 'mongodb'

/**
 * GET /api/email/logs/[id]
 * Get a single email delivery log by ID
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
    const logsCollection = db.collection<EmailDeliveryLog>(COLLECTIONS.EMAIL_DELIVERY_LOGS)

    const log = await logsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId
    })

    if (!log) {
      return NextResponse.json(
        { error: 'Email log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: log
    })
  } catch (error: any) {
    console.error('Get email log error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email log' },
      { status: 500 }
    )
  }
}
