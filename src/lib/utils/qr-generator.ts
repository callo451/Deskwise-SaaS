import QRCode from 'qrcode'

export interface InvoiceQRData {
  invoiceNumber: string
  amount: number
  currency: string
  dueDate: string
  paymentUrl?: string
  organizationName?: string
}

/**
 * Generate QR code for invoice payment information
 * Returns a base64 data URL that can be used in PDF images
 */
export async function generateInvoiceQRCode(data: InvoiceQRData): Promise<string> {
  try {
    // If payment URL is provided, use that (simplest for customers)
    if (data.paymentUrl) {
      return await QRCode.toDataURL(data.paymentUrl, {
        errorCorrectionLevel: 'M',
        width: 200,
        margin: 2,
      })
    }

    // Otherwise, create structured payment data
    // Format: JSON string with invoice details
    const paymentInfo = {
      type: 'INVOICE_PAYMENT',
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
      currency: data.currency,
      dueDate: data.dueDate,
      organization: data.organizationName,
    }

    const qrData = JSON.stringify(paymentInfo)

    // Generate QR code as data URL
    return await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      width: 200,
      margin: 2,
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    // Return empty data URL on error
    return ''
  }
}

/**
 * Generate QR code for any text/URL
 */
export async function generateQRCode(text: string, width: number = 200): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      width,
      margin: 2,
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return ''
  }
}
