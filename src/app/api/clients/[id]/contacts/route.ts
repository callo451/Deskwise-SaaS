import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/clients'
import { ClientContact } from '@/lib/types'

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
    const contactData = await request.json()

    // Generate unique contact ID
    const contact: ClientContact = {
      ...contactData,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      notifications: contactData.notifications || {
        email: true,
        sms: false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await ClientService.addContact(params.id, session.user.orgId, contact)

    return NextResponse.json({ success: true, data: contact }, { status: 201 })
  } catch (error) {
    console.error('Add contact error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add contact' },
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
    const { contactId, ...contactData } = await request.json()

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required' },
        { status: 400 }
      )
    }

    await ClientService.updateContact(
      params.id,
      session.user.orgId,
      contactId,
      contactData
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

export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const contactId = searchParams.get('contactId')

    if (!clientId || !contactId) {
      return NextResponse.json(
        { success: false, error: 'Client ID and Contact ID are required' },
        { status: 400 }
      )
    }

    await ClientService.removeContact(clientId, session.user.orgId, contactId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove contact error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove contact' },
      { status: 500 }
    )
  }
}
