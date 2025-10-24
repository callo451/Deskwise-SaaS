import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ResourceManagementService } from '@/lib/services/resource-management'
import { requirePermission } from '@/lib/middleware/permissions'

/**
 * GET /api/resources/allocations
 * Get resource allocations (filtered by project or user)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.view.all'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status') as any

    let allocations

    if (projectId) {
      allocations = await ResourceManagementService.getProjectAllocations(
        projectId,
        session.user.orgId
      )
    } else if (userId) {
      const startDate = searchParams.get('startDate')
        ? new Date(searchParams.get('startDate')!)
        : undefined
      const endDate = searchParams.get('endDate')
        ? new Date(searchParams.get('endDate')!)
        : undefined

      allocations = await ResourceManagementService.getUserAllocations(
        userId,
        session.user.orgId,
        { startDate, endDate, status }
      )
    } else {
      return NextResponse.json(
        { error: 'Either projectId or userId is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: allocations
    })
  } catch (error) {
    console.error('Error fetching resource allocations:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch resource allocations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/resources/allocations
 * Create a new resource allocation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await requirePermission(session, 'projects.manage'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      userId,
      userName,
      userEmail,
      resourceType,
      projectId,
      projectName,
      taskId,
      taskName,
      allocatedHours,
      startDate,
      endDate,
      allocationPercentage,
      role,
      status,
      notes
    } = body

    // Validate required fields
    if (!userId || !projectId || !allocatedHours || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check for conflicts
    const conflicts = await ResourceManagementService.checkAllocationConflicts(
      userId,
      session.user.orgId,
      new Date(startDate),
      new Date(endDate),
      allocatedHours
    )

    // Create allocation
    const allocation = await ResourceManagementService.createAllocation(
      session.user.orgId,
      {
        userId,
        userName,
        userEmail,
        resourceType: resourceType || 'project',
        projectId,
        projectName,
        taskId,
        taskName,
        allocatedHours,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allocationPercentage: allocationPercentage || 100,
        role,
        status: status || 'planned',
        notes,
        createdBy: session.user.userId
      }
    )

    return NextResponse.json({
      success: true,
      data: allocation,
      warnings: conflicts.length > 0 ? {
        message: 'Resource is over-allocated',
        conflicts
      } : undefined
    })
  } catch (error) {
    console.error('Error creating resource allocation:', error)
    return NextResponse.json(
      {
        error: 'Failed to create resource allocation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
