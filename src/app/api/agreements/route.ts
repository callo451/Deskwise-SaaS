import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'
import { AgreementStatus } from '@/lib/types'

/**
 * GET /api/agreements
 * Get all agreements with optional filters
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    const filters: any = {}

    // Client filter
    const clientId = searchParams.get('clientId')
    if (clientId) {
      filters.clientId = clientId
    }

    // Status filter (can be multiple)
    const status = searchParams.get('status')
    if (status) {
      if (status.includes(',')) {
        filters.status = status.split(',') as AgreementStatus[]
      } else {
        filters.status = status as AgreementStatus
      }
    }

    // Type filter
    const type = searchParams.get('type')
    if (type) {
      filters.type = type
    }

    // Search filter
    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    const agreements = await AgreementService.getAgreements(
      session.user.orgId,
      filters
    )

    return NextResponse.json({ success: true, data: agreements })
  } catch (error) {
    console.error('Get agreements error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch agreements' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agreements
 * Create new agreement
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await request.json()

    // Validate required fields
    if (!data.clientId || !data.clientName || !data.name || !data.type || !data.startDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: clientId, clientName, name, type, startDate',
        },
        { status: 400 }
      )
    }

    const agreement = await AgreementService.createAgreement(
      session.user.orgId,
      data,
      session.user.id
    )

    return NextResponse.json({ success: true, data: agreement }, { status: 201 })
  } catch (error) {
    console.error('Create agreement error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create agreement' },
      { status: 500 }
    )
  }
}
