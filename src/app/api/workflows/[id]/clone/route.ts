import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const cloneWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
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

    const { id } = await params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid workflow ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name } = cloneWorkflowSchema.parse(body)

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    // Get source workflow
    const sourceWorkflow = await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!sourceWorkflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Create cloned workflow
    const now = new Date()

    // Remove _id from source workflow and create new one
    const { _id, ...workflowData } = sourceWorkflow

    const clonedWorkflow = {
      ...workflowData,
      name,
      status: 'draft' as const, // Cloned workflows start as draft
      version: 1,
      executionCount: 0,
      lastExecutedAt: null,
      settings: {
        ...sourceWorkflow.settings,
        enabled: false, // Cloned workflows start disabled
      },
      metrics: {
        averageExecutionTime: 0,
        successRate: 100,
        lastError: null,
      },
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await workflowsCollection.insertOne(clonedWorkflow)

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...clonedWorkflow },
        message: 'Workflow cloned successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Clone workflow error:', error)

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
      { success: false, error: 'Failed to clone workflow' },
      { status: 500 }
    )
  }
}
