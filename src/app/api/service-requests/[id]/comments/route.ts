import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ServiceRequestService } from '@/lib/services/service-requests'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  isInternal: z.boolean().optional(),
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

    // Verify service request exists and belongs to org
    const serviceRequest = await ServiceRequestService.getServiceRequestById(id, session.user.orgId)
    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    const comments = await ServiceRequestService.getComments(id)

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
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

    // Verify service request exists and belongs to org
    const serviceRequest = await ServiceRequestService.getServiceRequestById(id, session.user.orgId)
    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { content, isInternal } = createCommentSchema.parse(body)

    const comment = await ServiceRequestService.addComment(
      id,
      session.user.orgId,
      content,
      session.user.id,
      isInternal || false
    )

    return NextResponse.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
    })
  } catch (error) {
    console.error('Add comment error:', error)

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
      { success: false, error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
