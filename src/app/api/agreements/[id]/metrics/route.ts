import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'

/**
 * GET /api/agreements/[id]/metrics
 * Get agreement metrics
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    // Optional period filters
    const periodStartStr = searchParams.get('periodStart')
    const periodEndStr = searchParams.get('periodEnd')

    const periodStart = periodStartStr ? new Date(periodStartStr) : undefined
    const periodEnd = periodEndStr ? new Date(periodEndStr) : undefined

    const metrics = await AgreementService.calculateMetrics(
      params.id,
      session.user.orgId,
      periodStart,
      periodEnd
    )

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Get agreement metrics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate metrics' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agreements/[id]/metrics
 * Update agreement metrics (calculate and save to agreement)
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    const periodStart = data.periodStart ? new Date(data.periodStart) : undefined
    const periodEnd = data.periodEnd ? new Date(data.periodEnd) : undefined

    const metrics = await AgreementService.updateMetrics(
      params.id,
      session.user.orgId,
      periodStart,
      periodEnd
    )

    return NextResponse.json({ success: true, data: metrics })
  } catch (error) {
    console.error('Update agreement metrics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update metrics' },
      { status: 500 }
    )
  }
}
