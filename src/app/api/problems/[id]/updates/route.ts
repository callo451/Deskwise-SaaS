import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemService } from '@/lib/services/problems'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // Verify problem belongs to org
    const problem = await ProblemService.getProblemById(id, session.user.orgId)
    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    const updates = await ProblemService.getProblemUpdates(id)

    return NextResponse.json({
      success: true,
      data: updates,
    })
  } catch (error) {
    console.error('Get problem updates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch problem updates' },
      { status: 500 }
    )
  }
}
