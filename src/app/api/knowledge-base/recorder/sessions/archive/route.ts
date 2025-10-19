import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecorderService } from '@/lib/services/recorder'
import { PermissionService } from '@/lib/services/permissions'

/**
 * POST /api/knowledge-base/recorder/sessions/archive
 * Auto-archive old recording sessions
 *
 * Archives completed sessions older than specified days that have linked articles.
 * Requires settings.edit OR kb.manage permission.
 *
 * Body:
 *   - daysOld: number (default: 30) - Archive sessions older than this many days
 *   - dryRun: boolean (default: false) - If true, only count sessions without archiving
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await PermissionService.hasAnyPermission(
      session.user.id,
      session.user.orgId,
      ['settings.edit', 'kb.manage']
    )

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to archive sessions' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const daysOld = body.daysOld || 30
    const dryRun = body.dryRun || false

    if (typeof daysOld !== 'number' || daysOld < 1) {
      return NextResponse.json(
        { success: false, error: 'daysOld must be a positive number' },
        { status: 400 }
      )
    }

    if (dryRun) {
      // Dry run - just count sessions
      const count = await RecorderService.getArchivableSessionsCount(
        session.user.orgId,
        daysOld
      )

      return NextResponse.json({
        success: true,
        dryRun: true,
        sessionsFound: count,
        message: `${count} session(s) eligible for archiving (older than ${daysOld} days)`,
      })
    }

    // Actually archive sessions
    const archivedCount = await RecorderService.autoArchiveOldSessions(
      session.user.orgId,
      daysOld
    )

    return NextResponse.json({
      success: true,
      archivedCount,
      daysOld,
      message: `Successfully archived ${archivedCount} recording session(s)`,
    })
  } catch (error: any) {
    console.error('Error archiving sessions:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
