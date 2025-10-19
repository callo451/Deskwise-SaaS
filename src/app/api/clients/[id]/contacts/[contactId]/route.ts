import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/clients'

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; contactId: string }> }
) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contactData = await request.json()

    await ClientService.updateContact(
      params.id,
      session.user.orgId,
      params.contactId,
      {
        ...contactData,
        updatedAt: new Date(),
      }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update contact error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; contactId: string }> }
) {
  const params = await props.params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await ClientService.removeContact(params.id, session.user.orgId, params.contactId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove contact error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove contact' },
      { status: 500 }
    )
  }
}
