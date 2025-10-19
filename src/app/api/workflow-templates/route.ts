import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  icon: z.string().optional(),
  tags: z.array(z.string()).default([]),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  trigger: z.any(),
  isSystem: z.boolean().default(false),
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
    const templatesCollection = db.collection(COLLECTIONS.WORKFLOW_TEMPLATES)

    // Build filter - show system templates and org-specific templates
    const filter: any = {
      $or: [
        { isSystem: true },
        { orgId: session.user.orgId, isSystem: false },
      ],
    }

    // Filter by category
    if (searchParams.get('category')) {
      filter.category = searchParams.get('category')!
    }

    // Search by name or description
    if (searchParams.get('search')) {
      const search = searchParams.get('search')!
      filter.$and = [
        filter.$or ? { $or: filter.$or } : {},
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        },
      ]
      delete filter.$or
    }

    // Filter by tags
    if (searchParams.get('tags')) {
      const tags = searchParams.get('tags')!.split(',')
      filter.tags = { $in: tags }
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const templates = await templatesCollection
      .find(filter)
      .sort({ usageCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    const total = await templatesCollection.countDocuments(filter)

    return NextResponse.json({
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get workflow templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workflow templates' },
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
    const validatedData = createTemplateSchema.parse(body)

    const db = await getDatabase()
    const templatesCollection = db.collection(COLLECTIONS.WORKFLOW_TEMPLATES)

    const now = new Date()
    const template = {
      ...validatedData,
      orgId: session.user.orgId,
      usageCount: 0,
      rating: 0,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await templatesCollection.insertOne(template)

    return NextResponse.json(
      {
        success: true,
        data: { _id: result.insertedId, ...template },
        message: 'Workflow template created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create workflow template error:', error)

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
      { success: false, error: 'Failed to create workflow template' },
      { status: 500 }
    )
  }
}
