import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/test
 * Test Xero connection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[Xero API] Testing connection for org:', orgId)

    const result = await XeroIntegrationService.testConnection(orgId)

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        data: result.data,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[Xero API] Connection test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Connection test failed',
      },
      { status: 500 }
    )
  }
}
