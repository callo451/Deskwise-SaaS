import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/clients'

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
    const agreements = await ClientService.getClientAgreements(
      params.id,
      session.user.orgId
    )
    return NextResponse.json({ success: true, data: agreements })
  } catch (error) {
    console.error('Get client agreements error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client agreements' },
      { status: 500 }
    )
  }
}

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
    const data = await request.json()

    // Ensure clientId matches the URL parameter
    const agreementData = {
      ...data,
      clientId: params.id,
    }

    const agreement = await ClientService.createAgreement(
      session.user.orgId,
      agreementData,
      session.user.id
    )

    // Update client health score after adding agreement
    await ClientService.updateHealthScore(params.id, session.user.orgId)

    return NextResponse.json({ success: true, data: agreement }, { status: 201 })
  } catch (error) {
    console.error('Create agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agreement' },
      { status: 500 }
    )
  }
}
