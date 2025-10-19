import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuoteService } from '@/lib/services/quotes'

export async function GET(request: NextRequest) {
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
    const templates = await QuoteService.getTemplates(session.user.orgId)
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('Get quote templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quote templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const template = await QuoteService.createTemplate(
      session.user.orgId,
      data,
      session.user.id
    )

    return NextResponse.json({ success: true, data: template }, { status: 201 })
  } catch (error) {
    console.error('Create quote template error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create quote template' },
      { status: 500 }
    )
  }
}
