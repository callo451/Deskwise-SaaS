import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoices'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json(
      { error: 'Feature only available for MSP organizations' },
      { status: 403 }
    )
  }

  try {
    const report = await InvoiceService.getAgingReport(session.user.orgId)
    return NextResponse.json({ success: true, data: report })
  } catch (error) {
    console.error('Get aging report error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch aging report' },
      { status: 500 }
    )
  }
}
