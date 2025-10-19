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

    const stats = await ChangeManagementService.getChangeRequestStats(
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get change request stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch change request statistics' },
      { status: 500 }
    )
  }
}
