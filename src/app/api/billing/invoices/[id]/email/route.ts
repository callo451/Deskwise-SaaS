import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoices'
import { ClientService } from '@/lib/services/clients'
import { OrganizationService } from '@/lib/services/organizations'
import { BrandingService } from '@/lib/services/branding'
import { EmailSettingsService } from '@/lib/services/email-settings'
import { EmailService } from '@/lib/services/email-service'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import {
  getInvoiceEmailTemplate,
  getInvoiceEmailSubject,
} from '@/lib/email/invoice-email-template'
import { generateInvoiceQRCode } from '@/lib/utils/qr-generator'

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

    // Fetch invoice
    const invoice = await InvoiceService.getInvoiceById(id, orgId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Fetch client
    const client = await ClientService.getClientById(invoice.clientId, orgId)
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

    // Fetch branding configuration
    const branding = await BrandingService.getBranding(orgId)

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
        currency: invoice.currency || 'USD',
      }).format(amount)
    }

    const formatDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    // Prepare email template data with branding
    const emailData = {
      clientName: client.name,
      invoiceNumber: invoice.invoiceNumber,
      total: formatCurrency(invoice.total),
      amountDue: formatCurrency(invoice.amountDue || invoice.total),
      dueDate: formatDate(invoice.dueDate),
      issueDate: formatDate(invoice.issueDate),
      viewUrl: `${process.env.NEXTAUTH_URL}/billing/invoices/${id}`,
      paymentTerms: invoice.paymentTerms ? `NET ${invoice.paymentTerms}` : undefined,
      organizationName: organization?.name || 'Your Company',
      organizationEmail: organization?.email,
      organizationPhone: organization?.phone,
      isPaid: invoice.status === 'paid',
      isPartial: invoice.status === 'partial',
      branding, // Include branding configuration
    }

    // Generate QR code for payment (only for unpaid invoices)
    let qrCodeDataUrl: string | undefined
    if (invoice.status !== 'paid') {
      qrCodeDataUrl = await generateInvoiceQRCode({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amountDue || invoice.total,
        currency: invoice.currency || 'USD',
        dueDate: new Date(invoice.dueDate).toISOString(),
        paymentUrl: organization?.paymentInstructions?.onlinePaymentUrl,
        organizationName: organization?.name,
      })
    }

    // Generate PDF for attachment with QR code
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({ invoice, client, organization, branding, qrCodeDataUrl })
    )

    // Initialize email service
    const emailService = new EmailService(emailSettings)

    // Send email with PDF attachment
    const emailResult = await emailService.sendEmail(
      primaryContact.email,
      getInvoiceEmailSubject(
        invoice.invoiceNumber,
        invoice.status === 'paid'
      ),
      getInvoiceEmailTemplate(emailData),
      undefined, // textBody
      undefined, // cc
      undefined, // bcc
      organization?.email, // replyTo
      [ // attachments
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ]
    )

    if (!emailResult.messageId) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // Update invoice status to 'sent' if it's currently 'draft'
    if (invoice.status === 'draft') {
      await InvoiceService.updateInvoiceStatus(id, orgId, 'sent')
    }

    return NextResponse.json({
      success: true,
      message: `Invoice sent to ${primaryContact.email}`,
      messageId: emailResult.messageId,
    })
  } catch (error) {
    console.error('Send invoice email error:', error)
    return NextResponse.json(
      { error: 'Failed to send invoice email' },
      { status: 500 }
    )
  }
}
