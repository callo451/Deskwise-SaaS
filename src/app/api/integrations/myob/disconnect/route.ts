import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'

/**
 * POST /api/integrations/myob/disconnect
 * Disconnect MYOB integration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log(`Disconnecting MYOB integration for organization: ${orgId}`)

    // Disconnect integration
    await MYOBIntegrationService.disconnect(orgId)

    return NextResponse.json({
      success: true,
      message: 'MYOB integration disconnected successfully',
    })
  } catch (error: any) {
    console.error('MYOB disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect integration' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/integrations/myob/disconnect
 * Permanently delete MYOB integration
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log(`Deleting MYOB integration for organization: ${orgId}`)

    // Delete integration
    await MYOBIntegrationService.deleteIntegration(orgId)

    return NextResponse.json({
      success: true,
      message: 'MYOB integration deleted successfully',
    })
  } catch (error: any) {
    console.error('MYOB delete integration error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete integration' },
      { status: 500 }
    )
  }
}
