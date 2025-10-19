import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FormBuilderService } from '@/lib/services/form-builder'

/**
 * PUT /api/service-catalog/[id]/form-schema
 * Update form schema (creates new version)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update form schemas
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const service = await FormBuilderService.updateFormSchema(
      id,
      session.user.orgId,
      session.user.id,
      {
        fields: body.fields || [],
        sections: body.sections || [],
      },
      body.changelog
    )

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error: any) {
    console.error('Error updating form schema:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/service-catalog/[id]/form-schema/publish
 * Publish a specific form version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can publish versions
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const service = await FormBuilderService.publishFormVersion(
      id,
      session.user.orgId,
      body.version
    )

    if (!service) {
      return NextResponse.json({ error: 'Service or version not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error: any) {
    console.error('Error publishing form version:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
