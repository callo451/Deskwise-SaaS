import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { CannedResponseService } from '@/lib/services/canned-responses'

/**
 * POST /api/canned-responses/[id]/use
 * Use a canned response (interpolate variables and increment usage count)
 */
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

    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.assigned',
      'tickets.view.own',
      'tickets.create',
      'tickets.edit.all',
      'tickets.edit.assigned',
      'tickets.edit.own',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { variables } = body

    // Get canned response
    const cannedResponse = await CannedResponseService.getCannedResponseById(
      id,
      session.user.orgId
    )

    if (!cannedResponse) {
      return NextResponse.json(
        { success: false, error: 'Canned response not found' },
        { status: 404 }
      )
    }

    if (!cannedResponse.isActive) {
      return NextResponse.json(
        { success: false, error: 'Canned response is inactive' },
        { status: 400 }
      )
    }

    // Interpolate variables
    const interpolatedContent = CannedResponseService.interpolateVariables(
      cannedResponse.content,
      variables || {}
    )

    // Increment usage count asynchronously (don't wait for it)
    CannedResponseService.incrementUsageCount(id, session.user.orgId).catch(
      (error) => console.error('Failed to increment usage count:', error)
    )

    return NextResponse.json({
      success: true,
      data: {
        content: interpolatedContent,
        originalContent: cannedResponse.content,
        variables: cannedResponse.variables,
        name: cannedResponse.name,
      },
    })
  } catch (error) {
    console.error('Use canned response error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to use canned response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
