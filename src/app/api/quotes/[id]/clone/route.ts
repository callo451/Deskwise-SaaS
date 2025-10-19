import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuoteService } from '@/lib/services/quotes'

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
    const quote = await QuoteService.cloneQuote(
      params.id,
      session.user.orgId,
      session.user.id
    )
    return NextResponse.json({ success: true, data: quote }, { status: 201 })
  } catch (error: any) {
    console.error('Clone quote error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to clone quote' },
      { status: 500 }
    )
  }
}
