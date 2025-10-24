import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  dataSources: z.array(z.string()).optional(),
  fields: z.array(z.string()).optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
  chartType: z.string().optional(),
  schedule: z.any().optional(),
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
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    const report = await collection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
      isDeleted: { $ne: true },
    })

    if (!report) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: report,
    })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch report' },
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
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId: session.user.orgId,
        isDeleted: { $ne: true },
      },
      {
        $set: {
          ...validatedData,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Report updated successfully',
    })
  } catch (error) {
    console.error('Update report error:', error)

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
      { success: false, error: 'Failed to update report' },
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
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    // Soft delete
    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId: session.user.orgId,
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      }
    )

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully',
    })
  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}
