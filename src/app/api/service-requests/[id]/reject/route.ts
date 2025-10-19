import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServiceRequestService } from '@/lib/services/service-requests'
import { z } from 'zod'

const rejectRequestSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required'),
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

    // Only admins and technicians can reject service requests
    if (session.user.role !== 'admin' && session.user.role !== 'technician') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { reason } = rejectRequestSchema.parse(body)

    // Check if service request exists
    const existingRequest = await ServiceRequestService.getServiceRequestById(id, session.user.orgId)
    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // Check if already approved or rejected
    if (existingRequest.approvalStatus === 'approved') {
      return NextResponse.json(
        { success: false, error: 'Cannot reject an approved service request' },
        { status: 400 }
      )
    }

    if (existingRequest.approvalStatus === 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Service request already rejected' },
        { status: 400 }
      )
    }

    const approvedByName = `${session.user.name || session.user.email}`

    const serviceRequest = await ServiceRequestService.rejectServiceRequest(
      id,
      session.user.orgId,
      session.user.id,
      approvedByName,
      reason
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
      message: 'Service request rejected successfully',
    })
  } catch (error) {
    console.error('Reject service request error:', error)

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
      { success: false, error: 'Failed to reject service request' },
      { status: 500 }
    )
  }
}
