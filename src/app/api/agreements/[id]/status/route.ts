import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'
import { AgreementStatus } from '@/lib/types'

/**
 * PUT /api/agreements/[id]/status
 * Change agreement status
 */
export async function PUT(
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

    if (!data.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      )
    }

    const agreement = await AgreementService.changeStatus(
      params.id,
      session.user.orgId,
      data.status as AgreementStatus,
      session.user.id,
      data.comments
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('Change agreement status error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to change status' },
      { status: 500 }
    )
  }
}
