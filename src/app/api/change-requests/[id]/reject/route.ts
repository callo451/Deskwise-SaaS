import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ChangeManagementService } from '@/lib/services/change-management'
import { z } from 'zod'

const rejectSchema = z.object({
  rejectionReason: z.string().min(1, 'Rejection reason is required'),
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

    // Only admins can reject change requests
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can reject change requests' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = rejectSchema.parse(body)

    const changeRequest = await ChangeManagementService.rejectChangeRequest(
      id,
      session.user.orgId,
      session.user.id,
      validatedData.rejectionReason
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
      message: 'Change request rejected',
    })
  } catch (error) {
    console.error('Reject change request error:', error)

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
      { success: false, error: 'Failed to reject change request' },
      { status: 500 }
    )
  }
}
