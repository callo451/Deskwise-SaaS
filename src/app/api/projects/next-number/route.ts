import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProjectService } from '@/lib/services/projects'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const projectNumber = await ProjectService.generateNextProjectNumber(session.user.orgId)

    return NextResponse.json({
      success: true,
      projectNumber,
    })
  } catch (error) {
    console.error('Get next project number error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate project number' },
      { status: 500 }
    )
  }
}
