import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'
import { InvoiceService } from '@/lib/services/invoices'
import { clientPromise } from '@/lib/mongodb'

/**
 * POST /api/integrations/myob/sync/invoices
 * Sync invoices from Deskwise to MYOB
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
    const { invoiceIds, syncAll = false } = body

    // Get integration
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

    // Create sync log
    const logId = await MYOBIntegrationService.createSyncLog(
      orgId,
      integration._id.toString(),
      'Invoice',
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
      // Update sync log to running
      await MYOBIntegrationService.updateSyncLog(logId, {
        status: 'syncing',
      })

      // Get invoices to sync
      let invoices
      if (syncAll) {
        const client = await clientPromise
        const db = client.db('deskwise')
        invoices = await db
          .collection('invoices')
          .find({ orgId, status: { $in: ['draft', 'sent', 'viewed'] } })
          .toArray()
      } else if (invoiceIds && invoiceIds.length > 0) {
        const client = await clientPromise
        const db = client.db('deskwise')
        invoices = await db
          .collection('invoices')
          .find({ orgId, _id: { $in: invoiceIds.map((id: string) => new (require('mongodb').ObjectId)(id)) } })
          .toArray()
      } else {
        throw new Error('No invoices specified for sync')
      }

      results.total = invoices.length

      // Sync each invoice
      for (const invoice of invoices) {
        try {
          // Check if customer is synced
          if (!invoice.clientId) {
            results.skipped++
            results.errors.push({
              recordId: invoice._id.toString(),
              error: 'Invoice has no customer assigned',
            })
            continue
          }

          // Sync invoice to MYOB
          const result = await MYOBIntegrationService.syncInvoice(orgId, invoice as any, 'create')

          results.success++
          results.syncedRecords.push({
            deskwiseId: invoice._id.toString(),
            myobId: result.uid,
            myobUid: result.uid,
            entityType: 'Invoice',
            action: 'create',
            status: 'success',
          })

          console.log(`Synced invoice ${invoice.invoiceNumber} to MYOB: ${result.number || result.uid}`)
        } catch (error: any) {
          results.failed++
          results.errors.push({
            recordId: invoice._id.toString(),
            error: error.message,
          })
          console.error(`Failed to sync invoice ${invoice.invoiceNumber}:`, error.message)
        }
      }

      // Update sync log with results
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
        message: `Synced ${results.success} of ${results.total} invoices`,
        results,
      })
    } catch (error: any) {
      // Update sync log with error
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
    console.error('MYOB sync invoices error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync invoices' },
      { status: 500 }
    )
  }
}
