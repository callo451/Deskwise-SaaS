import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { IncidentService } from '@/lib/services/incidents'
import { z } from 'zod'

const createIncidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  severity: z.enum(['minor', 'major', 'critical']),
  affectedServices: z.array(z.string()),
  clientIds: z.array(z.string()),
  isPublic: z.boolean(),
})

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
    const filters = {
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      isPublic: searchParams.get('isPublic')
        ? searchParams.get('isPublic') === 'true'
        : undefined,
      search: searchParams.get('search') || undefined,
    }

    const incidents = await IncidentService.getIncidents(
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: incidents,
    })
  } catch (error) {
    console.error('Get incidents error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createIncidentSchema.parse(body)

    const incident = await IncidentService.createIncident(
      session.user.orgId,
      validatedData,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident created successfully',
    })
  } catch (error) {
    console.error('Create incident error:', error)

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
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}
