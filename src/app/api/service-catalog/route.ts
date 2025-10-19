import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FormBuilderService } from '@/lib/services/form-builder'

/**
 * GET /api/service-catalog
 * Get all service catalog items with form builder schemas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const itilCategory = searchParams.get('itilCategory')

    const filters: any = {}
    if (category) filters.category = category
    if (isActive !== null) filters.isActive = isActive === 'true'
    if (itilCategory) filters.itilCategory = itilCategory

    const services = await FormBuilderService.listServices(session.user.orgId, filters)

    return NextResponse.json(services)
  } catch (error: any) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/service-catalog
 * Create a new service catalog item
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create service catalog items
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const service = await FormBuilderService.createService(
      session.user.orgId,
      session.user.id,
      {
        name: body.name,
        description: body.description,
        shortDescription: body.shortDescription,
        category: body.category,
        icon: body.icon,
        tags: body.tags,
        type: body.type || 'fixed',
        estimatedTime: body.estimatedTime,
        requiresApproval: body.requiresApproval,
        availableFor: body.availableFor,
        slaResponseTime: body.slaResponseTime,
        slaResolutionTime: body.slaResolutionTime,
        itilCategory: body.itilCategory || 'service-request',
        requestType: body.requestType,
        templateId: body.templateId,
      }
    )

    return NextResponse.json(service, { status: 201 })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
