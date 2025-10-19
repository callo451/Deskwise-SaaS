import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)
    const executionsCollection = db.collection(COLLECTIONS.WORKFLOW_EXECUTIONS)

    // Get workflow
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

    // Check if workflow is enabled
    if (workflow.status !== 'active' && workflow.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Workflow is not active or in draft status' },
        { status: 400 }
      )
    }

    // Get trigger data from request body (optional)
    let triggerData = {}
    try {
      const body = await request.json()
      triggerData = body.triggerData || {}
    } catch {
      // No body provided
    }

    const now = new Date()

    // Create execution record
    const execution = {
      orgId: session.user.orgId,
      workflowId: workflow._id.toString(),
      workflowName: workflow.name,
      version: workflow.version,
      triggeredBy: 'user' as const,
      triggeredByUser: session.user.id,
      triggerData,
      status: 'pending' as const,
      startedAt: now,
      completedAt: null,
      duration: null,
      nodeExecutions: [],
      output: null,
      error: null,
      context: {
        trigger: {
          type: 'manual',
          ...triggerData,
        },
        item: triggerData,
        variables: {},
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || '',
          role: session.user.role,
        },
        orgId: session.user.orgId,
      },
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await executionsCollection.insertOne(execution)

    // Update workflow execution stats
    await workflowsCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      {
        $set: {
          lastExecutedAt: now,
          updatedAt: now,
        },
        $inc: {
          executionCount: 1,
        },
      }
    )

    // TODO: Trigger actual workflow execution in background
    // This would typically be done via a message queue or background job
    // For now, we just create the execution record with pending status

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: result.insertedId,
          ...execution,
        },
        message: 'Workflow execution initiated',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Execute workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to execute workflow' },
      { status: 500 }
    )
  }
}
