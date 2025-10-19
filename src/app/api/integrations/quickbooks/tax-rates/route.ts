import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { QuickBooksSyncService } from '@/lib/services/quickbooks-sync'

/**
 * GET /api/integrations/quickbooks/tax-rates
 * Fetch tax rates from QuickBooks
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[QuickBooks API] Fetching tax rates for org:', orgId)

    const taxRates = await QuickBooksSyncService.fetchTaxRates(orgId)

    return NextResponse.json({
      success: true,
      taxRates,
      total: taxRates.length,
    })
  } catch (error: any) {
    console.error('[QuickBooks API] Error fetching tax rates:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch tax rates',
      },
      { status: 500 }
    )
  }
}
