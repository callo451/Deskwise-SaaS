import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AgreementService } from '@/lib/services/agreements'

/**
 * GET /api/agreements/templates
 * Get all agreement templates
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)

    const filters: any = {}

    // Type filter
    const type = searchParams.get('type')
    if (type) {
      filters.type = type
    }

    const templates = await AgreementService.getTemplates(
      session.user.orgId,
      filters
    )

    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}
