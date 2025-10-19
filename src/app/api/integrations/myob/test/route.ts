import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * POST /api/integrations/myob/test
 * Test MYOB connection
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log(`Testing MYOB connection for organization: ${orgId}`)

    // Test connection
    const result = await MYOBIntegrationService.testConnection(orgId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('MYOB test connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to test connection',
      },
      { status: 500 }
    )
  }
}
