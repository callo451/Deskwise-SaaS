import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/clients'

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ agreementId: string }> }
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
    const agreement = await ClientService.updateAgreement(
      params.agreementId,
      session.user.orgId,
      data,
      session.user.id
    )

    if (!agreement) {
      return NextResponse.json(
        { success: false, error: 'Agreement not found' },
        { status: 404 }
      )
    }

    // Update client health score if agreement status changed
    if (data.status && (agreement as any).clientId) {
      await ClientService.updateHealthScore(
        (agreement as any).clientId,
        session.user.orgId
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

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ agreementId: string }> }
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
    await ClientService.deleteAgreement(params.agreementId, session.user.orgId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete agreement' },
      { status: 500 }
    )
  }
}
