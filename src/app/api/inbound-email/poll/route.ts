import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getEmailPoller } from '@/lib/workers/email-poller'

/**
 * POST /api/inbound-email/poll
 * Manually trigger email polling (admin only)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Admin only
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    console.log('📨 Manual email poll triggered by admin')

    // Get poller instance and trigger poll
    const poller = getEmailPoller()
    await poller.pollAllAccounts()

    return NextResponse.json({
      success: true,
      message: 'Email polling completed',
    })
  } catch (error: any) {
    console.error('Manual poll error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to poll emails' },
      { status: 500 }
    )
  }
}
