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

const createMilestoneSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().default(''),
  // Support both new and legacy formats
  type: z.enum(['gate', 'deliverable', 'event', 'decision_point']).optional().default('deliverable'),
  plannedDate: z.string().optional(),
  targetDate: z.string().optional(), // Legacy field
  baselineDate: z.string().optional(),
  isGate: z.boolean().optional().default(false),
  isKeyMilestone: z.boolean().optional(), // Legacy field
  gateType: z.enum(['initiation', 'planning', 'stage_boundary', 'closure']).optional(),
  gateArtifacts: z.array(gateArtifactSchema).optional(),
  approvalRequired: z.boolean().optional().default(false),
  approvers: z.array(z.string()).optional(),
  deliverables: z.array(milestoneDeliverableSchema).optional(),
  dependsOnMilestones: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(), // Legacy field
  dependsOnTasks: z.array(z.string()).optional(),
  progressWeight: z.number().min(0).max(100).optional().default(0),
  reminderDays: z.number().min(0).optional(),
  notifyUsers: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  order: z.number().optional(),
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

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.view.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: projectId } = await params
    const { searchParams } = new URL(request.url)

    // Parse filters from query params
    const filters: any = {}

    if (searchParams.get('status')) {
      filters.status = searchParams.get('status')
    }
    if (searchParams.get('type')) {
      filters.type = searchParams.get('type')
    }
    if (searchParams.get('isGate')) {
      filters.isGate = searchParams.get('isGate') === 'true'
    }
    if (searchParams.get('dateFrom')) {
      filters.dateFrom = new Date(searchParams.get('dateFrom')!)
    }
    if (searchParams.get('dateTo')) {
      filters.dateTo = new Date(searchParams.get('dateTo')!)
    }

    const milestones = await MilestoneService.getMilestones(
      projectId,
      session.user.orgId,
      filters
    )

    return NextResponse.json({
      success: true,
      data: milestones,
    })
  } catch (error) {
    console.error('Get milestones error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch milestones' },
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

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check permission
    const hasPermission = await requirePermission(session, 'projects.create')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id: projectId } = await params
    const body = await request.json()
    const validatedData = createMilestoneSchema.parse(body)

    // Handle legacy field mappings
    const plannedDateStr = validatedData.plannedDate || validatedData.targetDate
    if (!plannedDateStr) {
      return NextResponse.json(
        { success: false, error: 'Validation error: plannedDate or targetDate is required' },
        { status: 400 }
      )
    }

    // Convert to service input format
    const input = {
      ...validatedData,
      plannedDate: new Date(plannedDateStr),
      baselineDate: validatedData.baselineDate
        ? new Date(validatedData.baselineDate)
        : undefined,
      dependsOnMilestones: validatedData.dependsOnMilestones || validatedData.dependencies,
      deliverables: validatedData.deliverables?.map((d) => ({
        ...d,
        acceptedAt: d.acceptedAt ? new Date(d.acceptedAt) : undefined,
      })),
    }

    const milestone = await MilestoneService.createMilestone(
      projectId,
      session.user.orgId,
      input,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully',
    })
  } catch (error) {
    console.error('Create milestone error:', error)

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
      { success: false, error: 'Failed to create milestone' },
      { status: 500 }
    )
  }
}
