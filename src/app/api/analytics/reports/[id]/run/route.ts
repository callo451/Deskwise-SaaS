import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface FilterCondition {
  field: string
  operator: string
  value: any
}

function buildMongoFilter(filters: FilterCondition[], orgId: string): any {
  const mongoFilter: any = { orgId }

  for (const filter of filters) {
    const [dataSource, fieldName] = filter.field.split('.')

    switch (filter.operator) {
      case 'equals':
        mongoFilter[fieldName] = filter.value
        break
      case 'notEquals':
        mongoFilter[fieldName] = { $ne: filter.value }
        break
      case 'contains':
        mongoFilter[fieldName] = { $regex: filter.value, $options: 'i' }
        break
      case 'notContains':
        mongoFilter[fieldName] = { $not: { $regex: filter.value, $options: 'i' } }
        break
      case 'startsWith':
        mongoFilter[fieldName] = { $regex: `^${filter.value}`, $options: 'i' }
        break
      case 'endsWith':
        mongoFilter[fieldName] = { $regex: `${filter.value}$`, $options: 'i' }
        break
      case 'greaterThan':
        mongoFilter[fieldName] = { $gt: Number(filter.value) }
        break
      case 'greaterThanOrEqual':
        mongoFilter[fieldName] = { $gte: Number(filter.value) }
        break
      case 'lessThan':
        mongoFilter[fieldName] = { $lt: Number(filter.value) }
        break
      case 'lessThanOrEqual':
        mongoFilter[fieldName] = { $lte: Number(filter.value) }
        break
      case 'isEmpty':
        mongoFilter[fieldName] = { $in: [null, '', []] }
        break
      case 'isNotEmpty':
        mongoFilter[fieldName] = { $nin: [null, '', []] }
        break
      case 'isTrue':
        mongoFilter[fieldName] = true
        break
      case 'isFalse':
        mongoFilter[fieldName] = false
        break
      case 'between':
        if (Array.isArray(filter.value) && filter.value.length === 2) {
          mongoFilter[fieldName] = {
            $gte: filter.value[0],
            $lte: filter.value[1],
          }
        }
        break
    }
  }

  return mongoFilter
}

function getCollectionName(dataSource: string): string {
  const collectionMap: Record<string, string> = {
    unified_tickets: 'unified_tickets',
    incidents: 'incidents',
    changes: 'change_requests',
    problems: 'problems',
    assets: 'assets',
    projects: 'projects',
    knowledge: 'kb_articles',
    users: 'users',
    clients: 'clients',
    billing: 'invoices',
    quotes: 'quotes',
  }

  return collectionMap[dataSource] || dataSource
}

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
    const reportsCollection = db.collection('custom_reports')

    // Get report configuration
    const report = await reportsCollection.findOne({
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

    // Build projection based on selected fields
    const projection: any = {}
    for (const field of report.fields) {
      const [dataSource, fieldName] = field.split('.')
      projection[fieldName] = 1
    }

    // Execute queries for each data source
    const results: any[] = []

    for (const dataSource of report.dataSources) {
      const collectionName = getCollectionName(dataSource)
      const collection = db.collection(collectionName)

      // Build filters
      const filter = buildMongoFilter(report.filters, session.user.orgId)

      // Execute query
      const data = await collection
        .find(filter, { projection })
        .limit(1000) // Safety limit
        .toArray()

      results.push(...data)
    }

    // Update report metadata
    await reportsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { lastRun: new Date() },
        $inc: { runCount: 1 },
      }
    )

    return NextResponse.json({
      success: true,
      data: {
        report: {
          name: report.name,
          description: report.description,
          category: report.category,
          chartType: report.chartType,
          fields: report.fields,
        },
        results,
        count: results.length,
        executedAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Run report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to run report' },
      { status: 500 }
    )
  }
}
