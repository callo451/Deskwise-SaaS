import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'

/**
 * GET /api/rc/sessions/[id]/audit
 * Get audit logs for a remote control session
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

    const { orgId, role } = session.user

    // Only admins can view audit logs
    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const sessionId = id

    const auditLogs = await RemoteControlService.getAuditLogs(sessionId, orgId)

    return NextResponse.json({
      success: true,
      data: auditLogs,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
