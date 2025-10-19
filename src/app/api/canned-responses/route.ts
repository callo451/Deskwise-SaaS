import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireAnyPermission, createPermissionError } from '@/lib/middleware/permissions'
import { CannedResponseService } from '@/lib/services/canned-responses'

/**
 * GET /api/canned-responses
 * Get all canned responses with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RBAC check - need tickets.view permission to see canned responses
    const hasPermission = await requireAnyPermission(session, [
      'tickets.view.all',
      'tickets.view.assigned',
      'tickets.view.own',
      'tickets.create',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || undefined
    const search = searchParams.get('search') || undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam !== null
      ? isActiveParam === 'true'
      : undefined

    const cannedResponses = await CannedResponseService.getCannedResponses(
      session.user.orgId,
      { category, search, isActive }
    )

    return NextResponse.json({
      success: true,
      data: cannedResponses,
    })
  } catch (error) {
    console.error('Get canned responses error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch canned responses',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/canned-responses
 * Create a new canned response
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // RBAC check - need tickets.manage or admin permission to create canned responses
    const hasPermission = await requireAnyPermission(session, [
      'tickets.manage',
      'settings.edit',
    ])

    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.manage') },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, content, category, tags } = body

    // Validation
    if (!name || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Name, content, and category are required' },
        { status: 400 }
      )
    }

    if (name.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Name must be 100 characters or less' },
        { status: 400 }
      )
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { success: false, error: 'Content must be 5000 characters or less' },
        { status: 400 }
      )
    }

    const cannedResponse = await CannedResponseService.createCannedResponse(
      session.user.orgId,
      {
        name: name.trim(),
        content: content.trim(),
        category: category.trim(),
        tags: tags || [],
      },
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: cannedResponse,
      message: 'Canned response created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create canned response error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create canned response',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
