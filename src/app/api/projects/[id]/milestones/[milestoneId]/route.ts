import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MilestoneService } from '@/lib/services/project-milestones'
import { requirePermission } from '@/lib/middleware/permissions'
import { z } from 'zod'

// Validation Schemas
const gateArtifactSchema = z.object({
  name: z.string().min(1),
  required: z.boolean(),
  documentId: z.string().optional(),
  status: z.enum(['pending', 'submitted', 'approved']),
})

const milestoneDeliverableSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  acceptedBy: z.string().optional(),
  acceptedAt: z.string().optional(),
})

const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['gate', 'deliverable', 'event', 'decision_point']).optional(),
  plannedDate: z.string().optional(),
  baselineDate: z.string().optional(),
  actualDate: z.string().optional(),
  status: z.enum(['planned', 'at_risk', 'achieved', 'missed', 'cancelled']).optional(),
  isGate: z.boolean().optional(),
  gateType: z.enum(['initiation', 'planning', 'stage_boundary', 'closure']).optional(),
  gateArtifacts: z.array(gateArtifactSchema).optional(),
  approvalRequired: z.boolean().optional(),
  approvers: z.array(z.string()).optional(),
  approvalStatus: z.enum(['pending', 'approved', 'rejected', 'conditional']).optional(),
  rejectionReason: z.string().optional(),
  deliverables: z.array(milestoneDeliverableSchema).optional(),
  dependsOnMilestones: z.array(z.string()).optional(),
  dependsOnTasks: z.array(z.string()).optional(),
  progressWeight: z.number().min(0).max(100).optional(),
  reminderDays: z.number().min(0).optional(),
  notifyUsers: z.array(z.string()).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.view.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { milestoneId } = await params
    const milestone = await MilestoneService.getMilestoneById(
      milestoneId,
      session.user.orgId
    )

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: milestone,
    })
  } catch (error) {
    console.error('Get milestone error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestone' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.edit.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { milestoneId } = await params
    const body = await request.json()
    const validatedData = updateMilestoneSchema.parse(body)

    // Convert to service input format
    const updates: any = { ...validatedData }

    if (updates.plannedDate) {
      updates.plannedDate = new Date(updates.plannedDate)
    }
    if (updates.baselineDate) {
      updates.baselineDate = new Date(updates.baselineDate)
    }
    if (updates.actualDate) {
      updates.actualDate = new Date(updates.actualDate)
    }
    if (updates.deliverables) {
      updates.deliverables = updates.deliverables.map((d: any) => ({
        ...d,
        acceptedAt: d.acceptedAt ? new Date(d.acceptedAt) : undefined,
      }))
    }

    const milestone = await MilestoneService.updateMilestone(
      milestoneId,
      session.user.orgId,
      updates
    )

    if (!milestone) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone updated successfully',
    })
  } catch (error) {
    console.error('Update milestone error:', error)

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

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update milestone' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.delete')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { milestoneId } = await params
    const success = await MilestoneService.deleteMilestone(
      milestoneId,
      session.user.orgId
    )

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Milestone not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    })
  } catch (error) {
    console.error('Delete milestone error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete milestone' },
      { status: 500 }
    )
  }
}
