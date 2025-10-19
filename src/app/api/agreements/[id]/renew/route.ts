import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'

/**
 * POST /api/agreements/[id]/renew
 * Renew an agreement
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

    const renewalData = {
      newEndDate: data.newEndDate ? new Date(data.newEndDate) : undefined,
      priceChange: data.priceChange,
      notes: data.notes,
    }

    const agreement = await AgreementService.renewAgreement(
      params.id,
      session.user.orgId,
      session.user.id,
      renewalData
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('Renew agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to renew agreement' },
      { status: 500 }
    )
  }
}
