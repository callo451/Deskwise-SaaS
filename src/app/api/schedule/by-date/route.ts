import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SchedulingService } from '@/lib/services/scheduling'

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
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const assignedTo = searchParams.get('assignedTo') || undefined

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    const items = await SchedulingService.getScheduleByDateRange(
      session.user.orgId,
      startDate,
      endDate,
      assignedTo
    )

    return NextResponse.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error('Get schedule by date error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}
