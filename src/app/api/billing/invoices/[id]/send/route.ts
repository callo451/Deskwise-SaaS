import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoices'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
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
    await InvoiceService.markAsSent(params.id, session.user.orgId, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Send invoice error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invoice' },
      { status: 500 }
    )
  }
}
