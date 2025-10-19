import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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
        { success: false, error: 'Invalid execution ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const executionsCollection = db.collection(COLLECTIONS.WORKFLOW_EXECUTIONS)

    const execution = await executionsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: execution,
    })
  } catch (error) {
    console.error('Get execution error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch execution' },
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
        { success: false, error: 'Invalid execution ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const executionsCollection = db.collection(COLLECTIONS.WORKFLOW_EXECUTIONS)

    // Get execution
    const execution = await executionsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!execution) {
      return NextResponse.json(
        { success: false, error: 'Execution not found' },
        { status: 404 }
      )
    }

    // Only allow cancelling running or pending executions
    if (execution.status !== 'running' && execution.status !== 'pending') {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot cancel execution with status: ${execution.status}`,
        },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update execution to cancelled status
    await executionsCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      {
        $set: {
          status: 'cancelled',
          completedAt: now,
          duration: now.getTime() - execution.startedAt.getTime(),
          error: {
            message: 'Execution cancelled by user',
            stack: null,
            nodeId: null,
          },
          updatedAt: now,
        },
      }
    )

    // Get updated execution
    const updatedExecution = await executionsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    return NextResponse.json({
      success: true,
      data: updatedExecution,
      message: 'Execution cancelled successfully',
    })
  } catch (error) {
    console.error('Cancel execution error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel execution' },
      { status: 500 }
    )
  }
}
