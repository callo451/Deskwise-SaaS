import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
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
        { success: false, error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const collection = db.collection('custom_reports')

    // Find the original report
    const originalReport = await collection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
      isDeleted: { $ne: true },
    })

    if (!originalReport) {
      return NextResponse.json(
        { success: false, error: 'Report not found' },
        { status: 404 }
      )
    }

    // Create duplicate
    const { _id, createdAt, createdBy, createdByName, lastRun, runCount, ...reportData } = originalReport

    const duplicateReport = {
      ...reportData,
      name: `${originalReport.name} (Copy)`,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRun: null,
      runCount: 0,
    }

    const result = await collection.insertOne(duplicateReport)

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...duplicateReport,
      },
      message: 'Report duplicated successfully',
    })
  } catch (error) {
    console.error('Duplicate report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to duplicate report' },
      { status: 500 }
    )
  }
}
