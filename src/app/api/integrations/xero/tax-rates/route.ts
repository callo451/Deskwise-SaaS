import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { XeroIntegrationService } from '@/lib/services/xero-integration'

/**
 * GET /api/integrations/xero/tax-rates
 * Get tax rates from Xero
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orgId = session.user.orgId

    console.log('[Xero API] Fetching tax rates for org:', orgId)

    const taxRates = await XeroIntegrationService.getTaxRates(orgId)

    return NextResponse.json({
      success: true,
      taxRates,
      count: taxRates.length,
    })
  } catch (error: any) {
    console.error('[Xero API] Error fetching tax rates:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch tax rates',
      },
      { status: 500 }
    )
  }
}
