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

    // Validate workflow structure
    const validationResults = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    }

    // Check for trigger node
    const hasTriggerNode = workflow.nodes?.some(
      (node: any) => node.type === 'trigger'
    )
    if (!hasTriggerNode) {
      validationResults.errors.push('Workflow must have a trigger node')
      validationResults.isValid = false
    }

    // Check for end node
    const hasEndNode = workflow.nodes?.some((node: any) => node.type === 'end')
    if (!hasEndNode) {
      validationResults.warnings.push(
        'Workflow should have an end node for proper termination'
      )
    }

    // Check for disconnected nodes
    const nodeIds = new Set(workflow.nodes?.map((node: any) => node.id) || [])
    const connectedNodes = new Set()

    // Add source and target nodes from edges
    workflow.edges?.forEach((edge: any) => {
      connectedNodes.add(edge.source)
      connectedNodes.add(edge.target)
    })

    const disconnectedNodes = Array.from(nodeIds).filter(
      (id) => !connectedNodes.has(id)
    )

    // Trigger node doesn't need incoming edges
    const triggerNodes = workflow.nodes?.filter(
      (node: any) => node.type === 'trigger'
    )
    const triggerNodeIds = triggerNodes?.map((node: any) => node.id) || []

    const actuallyDisconnected = disconnectedNodes.filter(
      (id) => !triggerNodeIds.includes(id)
    )

    if (actuallyDisconnected.length > 0) {
      validationResults.warnings.push(
        `Found ${actuallyDisconnected.length} disconnected node(s)`
      )
    }

    // Check for nodes without configuration
    const nodesWithoutConfig = workflow.nodes?.filter(
      (node: any) => !node.data?.config || Object.keys(node.data.config).length === 0
    )

    if (nodesWithoutConfig && nodesWithoutConfig.length > 0) {
      validationResults.warnings.push(
        `Found ${nodesWithoutConfig.length} node(s) without configuration`
      )
    }

    // Check trigger configuration
    if (!workflow.trigger?.type) {
      validationResults.errors.push('Workflow trigger type is not configured')
      validationResults.isValid = false
    }

    if (workflow.trigger?.type === 'event') {
      if (!workflow.trigger.config?.module) {
        validationResults.errors.push('Event trigger requires a module')
        validationResults.isValid = false
      }
      if (!workflow.trigger.config?.event) {
        validationResults.errors.push('Event trigger requires an event type')
        validationResults.isValid = false
      }
    }

    if (workflow.trigger?.type === 'schedule') {
      if (!workflow.trigger.config?.schedule) {
        validationResults.errors.push('Schedule trigger requires schedule configuration')
        validationResults.isValid = false
      }
    }

    if (workflow.trigger?.type === 'webhook') {
      if (!workflow.trigger.config?.webhook?.url) {
        validationResults.errors.push('Webhook trigger requires a URL')
        validationResults.isValid = false
      }
    }

    // Check for circular dependencies (basic check)
    const edges = workflow.edges || []
    const visited = new Set()
    const recursionStack = new Set()

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) return true
      if (visited.has(nodeId)) return false

      visited.add(nodeId)
      recursionStack.add(nodeId)

      const outgoingEdges = edges.filter((e: any) => e.source === nodeId)
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.target)) return true
      }

      recursionStack.delete(nodeId)
      return false
    }

    for (const node of workflow.nodes || []) {
      if (hasCycle(node.id)) {
        validationResults.errors.push('Workflow contains circular dependencies')
        validationResults.isValid = false
        break
      }
    }

    // Return validation results
    return NextResponse.json({
      success: true,
      data: {
        workflowId: id,
        workflowName: workflow.name,
        validation: validationResults,
        nodeCount: workflow.nodes?.length || 0,
        edgeCount: workflow.edges?.length || 0,
      },
      message: validationResults.isValid
        ? 'Workflow validation passed'
        : 'Workflow validation failed',
    })
  } catch (error) {
    console.error('Test workflow error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to test workflow' },
      { status: 500 }
    )
  }
}
