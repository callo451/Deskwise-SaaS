import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksIntegrationService } from '@/lib/services/quickbooks-integration'

/**
 * POST /api/integrations/quickbooks/test
 * Test QuickBooks connection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[QuickBooks API] Testing connection for org:', orgId)

    const result = await QuickBooksIntegrationService.testConnection(orgId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[QuickBooks API] Error testing connection:', error)
    return NextResponse.json(
      {
        connected: false,
        error: error.message || 'Failed to test connection',
      },
      { status: 500 }
    )
  }
}
