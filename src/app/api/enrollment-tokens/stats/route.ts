import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'

/**
 * GET /api/enrollment-tokens/stats - Get enrollment statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await EnrollmentTokenService.getStats(session.user.orgId)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching enrollment stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollment statistics' },
      { status: 500 }
    )
  }
}
