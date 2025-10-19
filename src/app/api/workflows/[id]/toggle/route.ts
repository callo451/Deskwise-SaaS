import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    // Get current workflow
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

    // Toggle status between active and inactive
    let newStatus: string
    if (workflow.status === 'active') {
      newStatus = 'inactive'
    } else if (workflow.status === 'inactive' || workflow.status === 'draft') {
      newStatus = 'active'
    } else {
      return NextResponse.json(
        { success: false, error: 'Cannot toggle archived workflow' },
        { status: 400 }
      )
    }

    // Update workflow status and settings
    const now = new Date()
    await workflowsCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      {
        $set: {
          status: newStatus,
          'settings.enabled': newStatus === 'active',
          updatedAt: now,
        },
      }
    )

    // Get updated workflow
    const updatedWorkflow = await workflowsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    return NextResponse.json({
      success: true,
      data: updatedWorkflow,
      message: `Workflow ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`,
    })
  } catch (error) {
    console.error('Toggle workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to toggle workflow' },
      { status: 500 }
    )
  }
}
