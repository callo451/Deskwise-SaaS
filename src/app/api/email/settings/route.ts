import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { EmailSettingsService } from '@/lib/services/email-settings'

/**
 * GET /api/email/settings
 * Get email settings for the organization
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

    const settings = await EmailSettingsService.getSettings(session.user.orgId)

    if (!settings) {
      return NextResponse.json({ data: null })
    }

    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Get email settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get email settings' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/settings
 * Save or update email settings
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

    // Validate provider
    if (!body.provider || !['platform', 'smtp'].includes(body.provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be "platform" or "smtp"' },
        { status: 400 }
      )
    }

    // Validate common required fields
    const commonRequiredFields = ['fromEmail', 'fromName']

    for (const field of commonRequiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate SMTP-specific fields if provider is 'smtp'
    if (body.provider === 'smtp') {
      if (!body.smtp) {
        return NextResponse.json(
          { error: 'SMTP configuration is required when using SMTP provider' },
          { status: 400 }
        )
      }

      const smtpRequiredFields = ['host', 'port', 'username', 'password']
      for (const field of smtpRequiredFields) {
        if (!body.smtp[field]) {
          return NextResponse.json(
            { error: `Missing required SMTP field: ${field}` },
            { status: 400 }
          )
        }
      }

      // Validate port is a number
      if (typeof body.smtp.port !== 'number') {
        return NextResponse.json(
          { error: 'SMTP port must be a number' },
          { status: 400 }
        )
      }
    }

    const settings = await EmailSettingsService.saveSettings(
      session.user.orgId,
      session.user.id,
      {
        provider: body.provider,
        smtp: body.smtp,
        fromEmail: body.fromEmail,
        fromName: body.fromName,
        replyToEmail: body.replyToEmail,
        maxEmailsPerHour: body.maxEmailsPerHour,
        maxEmailsPerDay: body.maxEmailsPerDay,
      }
    )

    return NextResponse.json({ success: true, data: settings })
  } catch (error: any) {
    console.error('Save email settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save email settings' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/email/settings
 * Delete email settings
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const deleted = await EmailSettingsService.deleteSettings(session.user.orgId)

    return NextResponse.json({ success: deleted })
  } catch (error: any) {
    console.error('Delete email settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete email settings' },
      { status: 500 }
    )
  }
}
