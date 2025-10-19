import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { QuoteService } from '@/lib/services/quotes'
import { ClientService } from '@/lib/services/clients'
import { OrganizationService } from '@/lib/services/organization'
import { EmailSettingsService } from '@/lib/services/email-settings'
import { EmailService } from '@/lib/services/email-service'
import { renderToBuffer } from '@react-pdf/renderer'
import { QuotePDF } from '@/lib/pdf/quote-template'
import {
  getQuoteEmailTemplate,
  getQuoteEmailSubject,
} from '@/lib/email/quote-email-template'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json(
      { error: 'Feature only available for MSP organizations' },
      { status: 403 }
    )
  }

  try {
    const { id } = await params
    const orgId = session.user.orgId

    // Fetch quote
    const quote = await QuoteService.getQuoteById(id, orgId)
    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Fetch client
    const client = await ClientService.getClientById(quote.clientId, orgId)
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Get primary contact email
    const primaryContact = client.contacts?.find((c) => c.isPrimary)
    if (!primaryContact?.email) {
      return NextResponse.json(
        { error: 'Client has no primary contact email' },
        { status: 400 }
      )
    }

    // Fetch organization
    const organization = await OrganizationService.getOrganizationById(orgId)

    // Get email settings for this organization
    const emailSettings = await EmailSettingsService.getSettings(orgId)

    if (!emailSettings || !emailSettings.isEnabled || !emailSettings.isConfigured) {
      return NextResponse.json(
        { error: 'Email notifications are not configured for this organization' },
        { status: 400 }
      )
    }

    // Format currency and date
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: quote.currency || 'USD',
      }).format(amount)
    }

    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    // Prepare email template data
    const emailData = {
      clientName: client.name,
      quoteNumber: quote.quoteNumber,
      total: formatCurrency(quote.total),
      validUntil: formatDate(quote.validUntil),
      viewUrl: `${process.env.NEXTAUTH_URL}/quotes/${id}`,
      organizationName: organization?.name || 'Your Company',
      organizationEmail: organization?.email,
      organizationPhone: organization?.phone,
    }

    // Initialize email service
    const emailService = new EmailService(emailSettings)

    // Send email using existing EmailService
    // Note: PDF attachments require SendRawEmailCommand - will be added in future update
    const emailResult = await emailService.sendEmail(
      primaryContact.email,
      getQuoteEmailSubject(quote.quoteNumber),
      getQuoteEmailTemplate(emailData)
    )

    if (!emailResult.messageId) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Update quote status to 'sent' if it's currently 'draft'
    if (quote.status === 'draft') {
      await QuoteService.updateQuoteStatus(id, orgId, 'sent')
    }

    return NextResponse.json({
      success: true,
      message: `Quote sent to ${primaryContact.email}`,
      messageId: emailResult.messageId,
    })
  } catch (error) {
    console.error('Send quote email error:', error)
    return NextResponse.json(
      { error: 'Failed to send quote email' },
      { status: 500 }
    )
  }
}
