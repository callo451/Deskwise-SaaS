import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FormBuilderService } from '@/lib/services/form-builder'

/**
 * GET /api/service-catalog/templates
 * Get all form templates
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await FormBuilderService.listTemplates(session.user.orgId)

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/service-catalog/templates
 * Create a new form template
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create templates
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const template = await FormBuilderService.createTemplate(
      session.user.orgId,
      session.user.id,
      {
        name: body.name,
        description: body.description,
        category: body.category,
        icon: body.icon,
        itilCategory: body.itilCategory,
        schema: body.schema,
        isSystemTemplate: false,
        tags: body.tags,
      }
    )

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
