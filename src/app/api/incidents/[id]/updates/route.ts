import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { IncidentService } from '@/lib/services/incidents'
import { z } from 'zod'

const addUpdateSchema = z.object({
  status: z.enum(['investigating', 'identified', 'monitoring', 'resolved']),
  message: z.string().min(1, 'Message is required'),
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
    const updates = await IncidentService.getIncidentUpdates(id)

    return NextResponse.json({
      success: true,
      data: updates,
    })
  } catch (error) {
    console.error('Get incident updates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incident updates' },
      { status: 500 }
    )
  }
}

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
    const validatedData = addUpdateSchema.parse(body)

    const update = await IncidentService.addIncidentUpdate(
      id,
      session.user.orgId,
      validatedData.status,
      validatedData.message,
      session.user.id
    )

    // Also update the incident status
    await IncidentService.updateIncident(
      id,
      session.user.orgId,
      { status: validatedData.status },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: update,
      message: 'Update added successfully',
    })
  } catch (error) {
    console.error('Add incident update error:', error)

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
      { success: false, error: 'Failed to add update' },
      { status: 500 }
    )
  }
}
