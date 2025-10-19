import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemService } from '@/lib/services/problems'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const stats = await ProblemService.getProblemStats(session.user.orgId)

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Get problem stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problem statistics' },
      { status: 500 }
    )
  }
}
