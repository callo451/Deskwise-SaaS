import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.enum(['incident', 'service-request', 'change', 'problem', 'ticket', 'asset', 'approval', 'notification', 'custom']).optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number(),
  }).optional(),
  trigger: z.object({
    type: z.enum(['manual', 'event', 'schedule', 'webhook']),
    config: z.any(),
  }).optional(),
  settings: z.object({
    enabled: z.boolean().optional(),
    runAsync: z.boolean().optional(),
    maxRetries: z.number().optional(),
    timeout: z.number().optional(),
    onError: z.enum(['stop', 'continue', 'notify']).optional(),
    notifyOnFailure: z.boolean().optional(),
    notifyEmails: z.array(z.string()).optional(),
  }).optional(),
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    const workflow = await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: workflow,
    })
  } catch (error) {
    console.error('Get workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow' },
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

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateWorkflowSchema.parse(body)

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    // Check if workflow exists
    const existingWorkflow = await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!existingWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const updateData: any = {
      ...validatedData,
      updatedAt: now,
    }

    // Increment version if nodes or edges changed
    if (validatedData.nodes || validatedData.edges) {
      updateData.version = (existingWorkflow.version || 1) + 1
    }

    const result = await workflowsCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const updatedWorkflow = await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: 'Workflow updated successfully',
    })
  } catch (error) {
    console.error('Update workflow error:', error)

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
      { success: false, error: 'Failed to update workflow' },
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

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    // Soft delete - set status to archived
    const result = await workflowsCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      {
        $set: {
          status: 'archived',
          updatedAt: new Date(),
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow archived successfully',
    })
  } catch (error) {
    console.error('Delete workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to archive workflow' },
      { status: 500 }
    )
  }
}
