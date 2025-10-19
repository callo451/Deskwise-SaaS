import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServiceRequestService } from '@/lib/services/service-requests'
import { z } from 'zod'

const updateServiceRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(['submitted', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  category: z.string().optional(),
  assignedTo: z.string().optional(),
  formData: z.record(z.any()).optional(),
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
    const serviceRequest = await ServiceRequestService.getServiceRequestById(id, session.user.orgId)

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serviceRequest,
    })
  } catch (error) {
    console.error('Get service request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service request' },
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
    const validatedData = updateServiceRequestSchema.parse(body)

    const serviceRequest = await ServiceRequestService.updateServiceRequest(
      id,
      session.user.orgId,
      validatedData
    )

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: serviceRequest,
      message: 'Service request updated successfully',
    })
  } catch (error) {
    console.error('Update service request error:', error)

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
      { success: false, error: 'Failed to update service request' },
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

    if (!session?.user?.orgId || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const success = await ServiceRequestService.deleteServiceRequest(id, session.user.orgId)

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Service request deleted successfully',
    })
  } catch (error) {
    console.error('Delete service request error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete service request' },
      { status: 500 }
    )
  }
}
