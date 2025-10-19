import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ProcessedEmail } from '@/lib/types'

/**
 * GET /api/inbound-email/processed
 * List processed emails with optional filtering
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin' && session.user.role !== 'technician') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const db = await getDatabase()
    const processedCollection = db.collection<ProcessedEmail>(COLLECTIONS.PROCESSED_EMAILS)

    // Build query
    const query: any = { orgId: session.user.orgId }

    if (accountId) {
      query.accountId = accountId
    }

    if (action) {
      query.action = action
    }

    // Get total count
    const total = await processedCollection.countDocuments(query)

    // Get processed emails
    const emails = await processedCollection
      .find(query)
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      data: emails,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + emails.length < total,
      },
    })
  } catch (error: any) {
    console.error('Get processed emails error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get processed emails' },
      { status: 500 }
    )
  }
}
