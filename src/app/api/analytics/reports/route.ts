import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { z } from 'zod'

const reportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  description: z.string().optional(),
  category: z.string(),
  dataSources: z.array(z.string()),
  fields: z.array(z.string()),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })),
  chartType: z.string(),
  schedule: z.any().optional(),
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

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    const reports = await collection
      .find({ orgId: session.user.orgId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: reports,
    })
  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
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
    const validatedData = reportSchema.parse(body)

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    const report = {
      ...validatedData,
      orgId: session.user.orgId,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRun: null,
      runCount: 0,
      isDeleted: false,
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...report,
      },
      message: 'Report saved successfully',
    })
  } catch (error) {
    console.error('Create report error:', error)

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
      { success: false, error: 'Failed to create report' },
      { status: 500 }
    )
  }
}
