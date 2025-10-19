import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MYOBIntegrationService } from '@/lib/services/myob-integration'
import { clientPromise } from '@/lib/mongodb'

/**
 * POST /api/integrations/myob/sync/quotes
 * Sync quotes from Deskwise to MYOB
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
    const { quoteIds, syncAll = false } = body

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
      'Quote',
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

      let quotes
      const client = await clientPromise
      const db = client.db('deskwise')

      if (syncAll) {
        quotes = await db
          .collection('quotes')
          .find({ orgId, status: { $in: ['draft', 'sent'] } })
          .toArray()
      } else if (quoteIds && quoteIds.length > 0) {
        quotes = await db
          .collection('quotes')
          .find({ orgId, _id: { $in: quoteIds.map((id: string) => new (require('mongodb').ObjectId)(id)) } })
          .toArray()
      } else {
        throw new Error('No quotes specified for sync')
      }

      results.total = quotes.length

      for (const quote of quotes) {
        try {
          if (!quote.clientId) {
            results.skipped++
            results.errors.push({
              recordId: quote._id.toString(),
              error: 'Quote has no customer assigned',
            })
            continue
          }

          const result = await MYOBIntegrationService.syncQuote(orgId, quote as any, 'create')

          results.success++
          results.syncedRecords.push({
            deskwiseId: quote._id.toString(),
            myobId: result.uid,
            myobUid: result.uid,
            entityType: 'Quote',
            action: 'create',
            status: 'success',
          })

          console.log(`Synced quote ${quote.quoteNumber} to MYOB: ${result.number || result.uid}`)
        } catch (error: any) {
          results.failed++
          results.errors.push({
            recordId: quote._id.toString(),
            error: error.message,
          })
          console.error(`Failed to sync quote ${quote.quoteNumber}:`, error.message)
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
        message: `Synced ${results.success} of ${results.total} quotes`,
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
    console.error('MYOB sync quotes error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync quotes' },
      { status: 500 }
    )
  }
}
