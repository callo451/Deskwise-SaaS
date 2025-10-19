import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangeManagementService } from '@/lib/services/change-management'
import { z } from 'zod'

const updateChangeRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'implementing', 'completed', 'cancelled']).optional(),
  risk: z.enum(['low', 'medium', 'high']).optional(),
  impact: z.enum(['low', 'medium', 'high']).optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  plannedStartDate: z.string().optional(),
  plannedEndDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  affectedAssets: z.array(z.string()).optional(),
  relatedTickets: z.array(z.string()).optional(),
  backoutPlan: z.string().optional(),
  testPlan: z.string().optional(),
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
    const changeRequest = await ChangeManagementService.getChangeRequestById(
      id,
      session.user.orgId
    )

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: changeRequest,
    })
  } catch (error) {
    console.error('Get change request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch change request' },
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
    const validatedData = updateChangeRequestSchema.parse(body)

    // Convert date strings to Date objects if provided
    const updates: any = { ...validatedData }
    if (updates.plannedStartDate) {
      updates.plannedStartDate = new Date(updates.plannedStartDate)
    }
    if (updates.plannedEndDate) {
      updates.plannedEndDate = new Date(updates.plannedEndDate)
    }
    if (updates.actualStartDate) {
      updates.actualStartDate = new Date(updates.actualStartDate)
    }
    if (updates.actualEndDate) {
      updates.actualEndDate = new Date(updates.actualEndDate)
    }

    const changeRequest = await ChangeManagementService.updateChangeRequest(
      id,
      session.user.orgId,
      updates
    )

    if (!changeRequest) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: changeRequest,
      message: 'Change request updated successfully',
    })
  } catch (error) {
    console.error('Update change request error:', error)

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
      { success: false, error: 'Failed to update change request' },
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
    const success = await ChangeManagementService.deleteChangeRequest(
      id,
      session.user.orgId
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Change request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Change request deleted successfully',
    })
  } catch (error) {
    console.error('Delete change request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete change request' },
      { status: 500 }
    )
  }
}
