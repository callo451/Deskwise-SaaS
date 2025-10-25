import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { InvoiceService } from '@/lib/services/invoices'
import { ClientService } from '@/lib/services/clients'
import { OrganizationService } from '@/lib/services/organizations'
import { BrandingService } from '@/lib/services/branding'
import { renderToStream } from '@react-pdf/renderer'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { generateInvoiceQRCode } from '@/lib/utils/qr-generator'

export async function GET(
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

    // Fetch organization
    const organization = await OrganizationService.getOrganizationById(orgId)

    // Fetch branding configuration
    const branding = await BrandingService.getBranding(orgId)

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

    // Generate PDF with branding and QR code
    const stream = await renderToStream(
      InvoicePDF({ invoice, client, organization, branding, qrCodeDataUrl })
    )

    // Convert stream to buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    const buffer = Buffer.concat(chunks)

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Generate invoice PDF error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
