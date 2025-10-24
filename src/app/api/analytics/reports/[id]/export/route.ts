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
    const { format, data: reportData } = await request.json()

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

    // Call the general export API with report-specific data
    const exportResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/analytics/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify({
        format,
        data: reportData,
        options: {
          filename: report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
          title: report.name,
          headers: report.fields.map((f: string) => {
            const [_, fieldName] = f.split('.')
            return fieldName
          }),
        },
      }),
    })

    if (!exportResponse.ok) {
      throw new Error('Export failed')
    }

    // Return the blob response
    const blob = await exportResponse.blob()
    const extension = format === 'excel' ? 'xlsx' : format
    const filename = `${report.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${extension}`

    return new NextResponse(blob, {
      headers: {
        'Content-Type': exportResponse.headers.get('Content-Type') || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Export report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to export report' },
      { status: 500 }
    )
  }
}
