import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailSettingsService } from '@/lib/services/email-settings'

/**
 * POST /api/email/settings/test
 * Test email settings by sending a test email
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    if (!body.testEmail) {
      return NextResponse.json(
        { error: 'testEmail is required' },
        { status: 400 }
      )
    }

    const result = await EmailSettingsService.testSettings(
      session.user.orgId,
      body.testEmail
    )

    return NextResponse.json({ success: result.success, message: result.message, messageId: result.messageId })
  } catch (error: any) {
    console.error('Test email settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to test email settings' },
      { status: 500 }
    )
  }
}
