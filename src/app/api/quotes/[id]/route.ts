import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuoteService } from '@/lib/services/quotes'

export async function GET(
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
    const quote = await QuoteService.getQuoteById(params.id, session.user.orgId)

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: quote })
  } catch (error) {
    console.error('Get quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const data = await request.json()
    const quote = await QuoteService.updateQuote(
      params.id,
      session.user.orgId,
      data,
      session.user.id
    )

    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: quote })
  } catch (error) {
    console.error('Update quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    const quote = await QuoteService.getQuoteById(params.id, session.user.orgId)
    if (!quote) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Prevent deletion of accepted or converted quotes
    if (quote.status === 'accepted' || quote.status === 'converted') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete accepted or converted quotes' },
        { status: 400 }
      )
    }

    await QuoteService.deleteQuote(params.id, session.user.orgId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete quote error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
