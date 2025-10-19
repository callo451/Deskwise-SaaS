import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'

/**
 * GET /api/agreements/[id]/breaches
 * Get SLA breaches for an agreement
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

    const filters: any = {}

    // Status filter
    const status = searchParams.get('status')
    if (status) {
      filters.status = status
    }

    // Severity filter
    const severity = searchParams.get('severity')
    if (severity) {
      filters.severity = severity
    }

    // Breach type filter
    const breachType = searchParams.get('breachType')
    if (breachType) {
      filters.breachType = breachType
    }

    const breaches = await AgreementService.getSLABreaches(
      params.id,
      session.user.orgId,
      filters
    )

    return NextResponse.json({ success: true, data: breaches })
  } catch (error) {
    console.error('Get SLA breaches error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLA breaches' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agreements/[id]/breaches
 * Record a new SLA breach
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

    // Get agreement to validate and get client info
    const agreement = await AgreementService.getAgreementById(
      params.id,
      session.user.orgId
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    const breachData = {
      ...data,
      agreementId: params.id,
      clientId: agreement.clientId,
    }

    const breach = await AgreementService.recordSLABreach(
      session.user.orgId,
      breachData
    )

    return NextResponse.json({ success: true, data: breach }, { status: 201 })
  } catch (error) {
    console.error('Record SLA breach error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to record SLA breach' },
      { status: 500 }
    )
  }
}
