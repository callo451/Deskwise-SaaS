import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CSATService } from '@/lib/services/csat'

/**
 * POST /api/tickets/[id]/rating
 * Submit a CSAT rating for a ticket
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const ticketId = params.id

    const body = await request.json()
    const { rating, feedback } = body

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Submit the rating
    const csatRating = await CSATService.submitRating(
      session.user.orgId,
      {
        ticketId,
        rating: rating as 1 | 2 | 3 | 4 | 5,
        feedback,
      },
      session.user.userId,
      session.user.name || 'Unknown User'
    )

    return NextResponse.json({
      success: true,
      data: csatRating,
    })
  } catch (error) {
    console.error('Error submitting CSAT rating:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit rating' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/tickets/[id]/rating
 * Get the CSAT rating for a ticket
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await context.params
    const ticketId = params.id

    const rating = await CSATService.getTicketRating(
      ticketId,
      session.user.orgId
    )

    return NextResponse.json({
      success: true,
      data: rating,
    })
  } catch (error) {
    console.error('Error fetching CSAT rating:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rating' },
      { status: 500 }
    )
  }
}
