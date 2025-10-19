import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ProblemService } from '@/lib/services/problems'
import { z } from 'zod'

const linkIncidentsSchema = z.object({
  incidentIds: z.array(z.string()).min(1, 'At least one incident ID is required'),
})

export async function POST(
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
    const body = await request.json()
    const validatedData = linkIncidentsSchema.parse(body)

    const problem = await ProblemService.linkIncidents(
      id,
      session.user.orgId,
      validatedData.incidentIds,
      session.user.id
    )

    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: problem,
      message: 'Incidents linked successfully',
    })
  } catch (error) {
    console.error('Link incidents error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to link incidents' },
      { status: 500 }
    )
  }
}
