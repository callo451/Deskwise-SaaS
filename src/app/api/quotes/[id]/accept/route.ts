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
    await QuoteService.markAsAccepted(params.id, session.user.orgId, session.user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Accept quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to accept quote' },
      { status: 500 }
    )
  }
}
