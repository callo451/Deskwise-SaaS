import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TemplateService } from '@/lib/services/email-templates'

/**
 * POST /api/email/templates/[id]/preview
 * Preview a template with sample data
 *
 * Body:
 * - variables: Record<string, any> - Sample data for template variables
 * - subject: string (optional) - Override subject for preview
 * - htmlBody: string (optional) - Override HTML body for preview
 * - textBody: string (optional) - Override text body for preview
 */
export async function POST(
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

    const variables = body.variables || {}

    // If custom content is provided, use that for preview
    if (body.subject || body.htmlBody) {
      try {
        const rendered = TemplateService.renderCustomTemplate(
          body.subject || '',
          body.htmlBody || '',
          body.textBody,
          variables
        )

        return NextResponse.json({
          success: true,
          data: {
            subject: rendered.subject,
            htmlBody: rendered.htmlBody,
            textBody: rendered.textBody,
          }
        })
      } catch (error: any) {
        return NextResponse.json(
          {
            error: 'Failed to render preview',
            details: error.message
          },
          { status: 400 }
        )
      }
    }

    // Otherwise, render the template from database
    try {
      const rendered = await TemplateService.renderTemplate(
        id,
        session.user.orgId,
        variables
      )

      return NextResponse.json({
        success: true,
        data: {
          subject: rendered.subject,
          htmlBody: rendered.htmlBody,
          textBody: rendered.textBody,
        }
      })
    } catch (error: any) {
      console.error('Preview template error:', error)
      return NextResponse.json(
        {
          error: error.message || 'Failed to preview template'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Preview template error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to preview template' },
      { status: 500 }
    )
  }
}
