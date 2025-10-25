import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { OrganizationService } from '@/lib/services/organizations'

/**
 * GET /api/organization
 * Get current user's organization details
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const organization = await OrganizationService.getOrganizationById(session.user.orgId)

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      organization,
    })
  } catch (error) {
    console.error('Get organization error:', error)
    return NextResponse.json(
      { error: 'Failed to get organization' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/organization
 * Update organization details
 */
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin access
  if ((session.user as any).role !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Prepare update data (exclude _id, createdAt, and other protected fields)
    const {
      _id,
      createdAt,
      createdBy,
      ...updateData
    } = body

    // Update organization
    const updated = await OrganizationService.updateOrganization(
      session.user.orgId,
      updateData
    )

    if (!updated) {
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: updated,
    })
  } catch (error) {
    console.error('Update organization error:', error)
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    )
  }
}
