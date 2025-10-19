import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().default(''),
  category: z.enum(['incident', 'service-request', 'change', 'problem', 'ticket', 'asset', 'approval', 'notification', 'custom']),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
  viewport: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    zoom: z.number().default(1),
  }).default({ x: 0, y: 0, zoom: 1 }),
  trigger: z.object({
    type: z.enum(['manual', 'event', 'schedule', 'webhook']),
    config: z.any(),
  }),
  settings: z.object({
    enabled: z.boolean().default(false),
    runAsync: z.boolean().default(true),
    maxRetries: z.number().default(3),
    timeout: z.number().default(300000), // 5 minutes
    onError: z.enum(['stop', 'continue', 'notify']).default('stop'),
    notifyOnFailure: z.boolean().default(true),
    notifyEmails: z.array(z.string()).default([]),
  }).default({
    enabled: false,
    runAsync: true,
    maxRetries: 3,
    timeout: 300000,
    onError: 'stop',
    notifyOnFailure: true,
    notifyEmails: [],
  }),
  templateId: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    // Build filter
    const filter: any = { orgId: session.user.orgId }

    // Filter by status
    if (searchParams.get('status')) {
      const statuses = searchParams.get('status')!.split(',')
      filter.status = statuses.length === 1 ? statuses[0] : { $in: statuses }
    }

    // Filter by category
    if (searchParams.get('category')) {
      const categories = searchParams.get('category')!.split(',')
      filter.category = categories.length === 1 ? categories[0] : { $in: categories }
    }

    // Search by name or description
    if (searchParams.get('search')) {
      const search = searchParams.get('search')!
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const workflows = await workflowsCollection
      .find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await workflowsCollection.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: workflows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get workflows error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createWorkflowSchema.parse(body)

    const db = await getDatabase()
    const workflowsCollection = db.collection(COLLECTIONS.WORKFLOWS)

    const now = new Date()
    const workflow = {
      ...validatedData,
      orgId: session.user.orgId,
      version: 1,
      executionCount: 0,
      lastExecutedAt: null,
      metrics: {
        averageExecutionTime: 0,
        successRate: 100,
        lastError: null,
      },
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await workflowsCollection.insertOne(workflow)

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...workflow },
        message: 'Workflow created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create workflow error:', error)

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
      { success: false, error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}
