import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TemplateService } from '@/lib/services/email-templates'

/**
 * GET /api/email/templates/[id]
 * Get a single email template by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const template = await TemplateService.getTemplate(id, session.user.orgId)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })
  } catch (error: any) {
    console.error('Get email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email template' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/email/templates/[id]
 * Update an existing email template
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()

    // Validate template syntax if updating content
    if (body.subject || body.htmlBody || body.textBody) {
      const validation = TemplateService.validateTemplate(
        body.subject || '',
        body.htmlBody || '',
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
    }

    const template = await TemplateService.updateTemplate(
      id,
      session.user.orgId,
      {
        name: body.name,
        description: body.description,
        subject: body.subject,
        htmlBody: body.htmlBody,
        textBody: body.textBody,
        availableVariables: body.availableVariables,
        isActive: body.isActive,
        previewData: body.previewData,
      }
    )

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found or is a system template' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template,
      message: 'Template updated successfully'
    })
  } catch (error: any) {
    console.error('Update email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email template' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/email/templates/[id]
 * Delete an email template
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const deleted = await TemplateService.deleteTemplate(id, session.user.orgId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Template not found or is a system template' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    })
  } catch (error: any) {
    console.error('Delete email template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email template' },
      { status: 500 }
    )
  }
}
