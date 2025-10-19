import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * POST /api/integrations/xero/sync/invoices
 * Sync invoice(s) to Xero
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
    const { invoiceId, invoiceIds } = body

    if (!invoiceId && (!invoiceIds || invoiceIds.length === 0)) {
      return NextResponse.json(
        { error: 'invoiceId or invoiceIds is required' },
        { status: 400 }
      )
    }

    console.log('[Xero API] Syncing invoices for org:', orgId)

    // Handle single invoice
    if (invoiceId) {
      const result = await XeroIntegrationService.syncInvoice(orgId, invoiceId, userId)

      if (result.success) {
        return NextResponse.json({
          success: true,
          xeroInvoiceId: result.xeroInvoiceId,
          message: 'Invoice synced successfully',
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.error || 'Failed to sync invoice',
          },
          { status: 400 }
        )
      }
    }

    // Handle multiple invoices
    if (invoiceIds && invoiceIds.length > 0) {
      const results = await Promise.all(
        invoiceIds.map((id: string) =>
          XeroIntegrationService.syncInvoice(orgId, id, userId)
        )
      )

      const successful = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success).length

      return NextResponse.json({
        success: true,
        message: `Synced ${successful} invoice(s), ${failed} failed`,
        results: results.map((r, idx) => ({
          invoiceId: invoiceIds[idx],
          success: r.success,
          xeroInvoiceId: r.xeroInvoiceId,
          error: r.error,
        })),
      })
    }

    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('[Xero API] Invoice sync error:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to sync invoices',
      },
      { status: 500 }
    )
  }
}
