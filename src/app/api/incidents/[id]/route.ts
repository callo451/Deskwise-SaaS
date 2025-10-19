import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { IncidentService } from '@/lib/services/incidents'
import { z } from 'zod'

const updateIncidentSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  severity: z.enum(['minor', 'major', 'critical']).optional(),
  affectedServices: z.array(z.string()).optional(),
  clientIds: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']).optional(),
  resolvedAt: z.string().optional(),
})

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
    const incident = await IncidentService.getIncidentById(id, session.user.orgId)

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: incident,
    })
  } catch (error) {
    console.error('Get incident error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validatedData = updateIncidentSchema.parse(body)

    // Convert resolvedAt string to Date if provided
    const updates: any = { ...validatedData }
    if (updates.resolvedAt) {
      updates.resolvedAt = new Date(updates.resolvedAt)
    }

    const incident = await IncidentService.updateIncident(
      id,
      session.user.orgId,
      updates,
      session.user.id
    )

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: incident,
      message: 'Incident updated successfully',
    })
  } catch (error) {
    console.error('Update incident error:', error)

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
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const success = await IncidentService.deleteIncident(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Incident deleted successfully',
    })
  } catch (error) {
    console.error('Delete incident error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}
