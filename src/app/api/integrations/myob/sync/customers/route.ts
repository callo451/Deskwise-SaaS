import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'
import { clientPromise } from '@/lib/mongodb'

/**
 * POST /api/integrations/myob/sync/customers
 * Sync customers from Deskwise to MYOB
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId
    const userId = session.user.userId
    const body = await req.json()
    const { clientIds, syncAll = false } = body

    const integration = await MYOBIntegrationService.getIntegration(orgId)

    if (!integration || integration.status !== 'connected') {
      return NextResponse.json(
        { error: 'MYOB integration not connected' },
        { status: 400 }
      )
    }

    if (!integration.companyFileId) {
      return NextResponse.json(
        { error: 'No company file selected' },
        { status: 400 }
      )
    }

    const logId = await MYOBIntegrationService.createSyncLog(
      orgId,
      integration._id.toString(),
      'Customer',
      'deskwise_to_myob',
      'manual',
      userId
    )

    const results = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      syncedRecords: [] as any[],
      errors: [] as any[],
    }

    try {
      await MYOBIntegrationService.updateSyncLog(logId, {
        status: 'syncing',
      })

      let clients
      const client = await clientPromise
      const db = client.db('deskwise')

      if (syncAll) {
        clients = await db
          .collection('clients')
          .find({ orgId, status: 'active' })
          .toArray()
      } else if (clientIds && clientIds.length > 0) {
        clients = await db
          .collection('clients')
          .find({ orgId, _id: { $in: clientIds.map((id: string) => new (require('mongodb').ObjectId)(id)) } })
          .toArray()
      } else {
        throw new Error('No customers specified for sync')
      }

      results.total = clients.length

      for (const clientDoc of clients) {
        try {
          const result = await MYOBIntegrationService.syncCustomer(orgId, clientDoc as any, 'create')

          results.success++
          results.syncedRecords.push({
            deskwiseId: clientDoc._id.toString(),
            myobId: result.uid,
            myobUid: result.uid,
            entityType: 'Customer',
            action: 'create',
            status: 'success',
          })

          console.log(`Synced customer ${clientDoc.name} to MYOB: ${result.uid}`)
        } catch (error: any) {
          results.failed++
          results.errors.push({
            recordId: clientDoc._id.toString(),
            error: error.message,
          })
          console.error(`Failed to sync customer ${clientDoc.name}:`, error.message)
        }
      }

      await MYOBIntegrationService.updateSyncLog(logId, {
        status: results.failed === 0 ? 'completed' : 'failed',
        completedAt: new Date(),
        duration: Date.now() - logId.getTimestamp().getTime(),
        totalRecords: results.total,
        successCount: results.success,
        failureCount: results.failed,
        skippedCount: results.skipped,
        syncedRecords: results.syncedRecords,
        errors: results.errors,
      })

      return NextResponse.json({
        success: true,
        message: `Synced ${results.success} of ${results.total} customers`,
        results,
      })
    } catch (error: any) {
      await MYOBIntegrationService.updateSyncLog(logId, {
        status: 'failed',
        completedAt: new Date(),
        errors: [
          {
            recordId: 'sync',
            error: error.message,
          },
        ],
      })

      throw error
    }
  } catch (error: any) {
    console.error('MYOB sync customers error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync customers' },
      { status: 500 }
    )
  }
}
