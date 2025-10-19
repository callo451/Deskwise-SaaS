import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'

/**
 * GET /api/agreements/[id]
 * Get agreement by ID
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

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('Get agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agreement' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/agreements/[id]
 * Update agreement
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

    const agreement = await AgreementService.updateAgreement(
      params.id,
      session.user.orgId,
      data
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('Update agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update agreement' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agreements/[id]
 * Delete (terminate) agreement
 */
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agreement = await AgreementService.deleteAgreement(
      params.id,
      session.user.orgId
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: agreement })
  } catch (error) {
    console.error('Delete agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete agreement' },
      { status: 500 }
    )
  }
}
