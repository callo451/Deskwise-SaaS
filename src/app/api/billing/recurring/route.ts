import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoices'

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
    const schedules = await InvoiceService.getRecurringSchedules(session.user.orgId)
    return NextResponse.json({ success: true, data: schedules })
  } catch (error) {
    console.error('Get recurring schedules error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recurring schedules' },
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
    const schedule = await InvoiceService.createRecurringSchedule(
      session.user.orgId,
      data,
      session.user.id
    )

    return NextResponse.json({ success: true, data: schedule }, { status: 201 })
  } catch (error) {
    console.error('Create recurring schedule error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create recurring schedule' },
      { status: 500 }
    )
  }
}
