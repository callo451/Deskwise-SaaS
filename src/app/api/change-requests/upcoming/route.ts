import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangeManagementService } from '@/lib/services/change-management'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('days') || '7', 10)

    const changes = await ChangeManagementService.getUpcomingChanges(
      session.user.orgId,
      daysAhead
    )

    return NextResponse.json({
      success: true,
      data: changes,
    })
  } catch (error) {
    console.error('Get upcoming changes error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch upcoming changes' },
      { status: 500 }
    )
  }
}
