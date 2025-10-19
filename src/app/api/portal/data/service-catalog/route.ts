import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FormBuilderService } from '@/lib/services/form-builder'

/**
 * GET /api/portal/data/service-catalog
 * Get service catalog items for portal block selection
 * Returns simplified data optimized for dropdowns and selectors
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only active services
    const services = await FormBuilderService.listServices(session.user.orgId, { isActive: true })

    // Transform to dropdown-friendly format
    const simplified = services.map(service => ({
      value: service._id.toString(),
      label: service.name,
      description: service.shortDescription || service.description,
      category: service.category,
      icon: service.icon,
      itilCategory: service.itilCategory,
    }))

    return NextResponse.json(simplified)
  } catch (error: any) {
    console.error('Error fetching service catalog for portal:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
