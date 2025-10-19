import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuoteService } from '@/lib/services/quotes'

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

  const { searchParams } = new URL(request.url)
  const filters = {
    status: searchParams.get('status') || undefined,
    clientId: searchParams.get('clientId') || undefined,
    search: searchParams.get('search') || undefined,
  }

  try {
    const quotes = await QuoteService.getQuotes(session.user.orgId, filters)
    return NextResponse.json({ success: true, data: quotes })
  } catch (error) {
    console.error('Get quotes error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const data = await request.json()
    const quote = await QuoteService.createQuote(
      session.user.orgId,
      data,
      session.user.id
    )

    return NextResponse.json({ success: true, data: quote }, { status: 201 })
  } catch (error) {
    console.error('Create quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
