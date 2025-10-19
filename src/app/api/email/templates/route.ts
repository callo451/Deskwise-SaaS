import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TemplateService } from '@/lib/services/email-templates'
import { NotificationEvent } from '@/lib/types'

/**
 * GET /api/email/templates
 * Get all email templates for the organization
 *
 * Query params:
 * - event: Filter by notification event
 * - isActive: Filter by active status (true/false)
 * - isSystem: Filter by system templates (true/false)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const event = searchParams.get('event') as NotificationEvent | null
    const isActive = searchParams.get('isActive')
    const isSystem = searchParams.get('isSystem')

    const filters: any = {}

    if (event) {
      filters.event = event
    }

    if (isActive !== null) {
      filters.isActive = isActive === 'true'
    }

    if (isSystem !== null) {
      filters.isSystem = isSystem === 'true'
    }

    const templates = await TemplateService.getTemplates(session.user.orgId, filters)

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    })
  } catch (error: any) {
    console.error('Get email templates error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email templates' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    // Validate required fields
    const requiredFields = [
      'name',
      'subject',
      'htmlBody',
      'event',
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate template syntax
    const validation = TemplateService.validateTemplate(
      body.subject,
      body.htmlBody,
      body.textBody
    )

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid template syntax',
          details: validation.errors
        },
        { status: 400 }
      )
    }

    const template = await TemplateService.createTemplate(
      session.user.orgId,
      session.user.id,
      {
        name: body.name,
        description: body.description || '',
        subject: body.subject,
        htmlBody: body.htmlBody,
        textBody: body.textBody,
        event: body.event,
        availableVariables: body.availableVariables || [],
        previewData: body.previewData,
      }
    )

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template created successfully'
    })
  } catch (error: any) {
    console.error('Create email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create email template' },
      { status: 500 }
    )
  }
}
