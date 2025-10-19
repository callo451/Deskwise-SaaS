interface InvoiceEmailTemplateProps {
  clientName: string
  invoiceNumber: string
  total: string
  amountDue: string
  dueDate: string
  issueDate: string
  viewUrl: string
  paymentTerms?: string
  organizationName: string
  organizationEmail?: string
  organizationPhone?: string
  isPaid?: boolean
  isPartial?: boolean
}

export function getInvoiceEmailTemplate(props: InvoiceEmailTemplateProps): string {
  const statusMessage = props.isPaid
    ? 'This invoice has been paid in full. Thank you for your payment!'
    : props.isPartial
    ? `This invoice has a remaining balance of ${props.amountDue}.`
    : `Payment is due by ${props.dueDate}.`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${props.invoiceNumber}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #16a34a;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }
    .company-info {
      font-size: 14px;
      color: #6b7280;
    }
    .title {
      font-size: 28px;
      font-weight: bold;
      color: #16a34a;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #16a34a;
      padding: 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
    }
    .info-value {
      color: #1f2937;
    }
    .total {
      font-size: 24px;
      font-weight: bold;
      color: #16a34a;
    }
    .amount-due {
      font-size: 20px;
      font-weight: bold;
      color: #d97706;
    }
    .paid-badge {
      background-color: #d1fae5;
      color: #059669;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      display: inline-block;
      margin: 10px 0;
    }
    .cta-button {
      display: inline-block;
      background-color: #16a34a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      margin: 30px 0;
      text-align: center;
    }
    .cta-button:hover {
      background-color: #15803d;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .footer p {
      margin: 5px 0;
    }
    .payment-notice {
      background-color: ${props.isPaid ? '#d1fae5' : '#fef3c7'};
      border-left: 4px solid ${props.isPaid ? '#16a34a' : '#f59e0b'};
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
    .overdue-notice {
      background-color: #fee2e2;
      border-left: 4px solid #dc2626;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-name">${props.organizationName}</div>
      ${props.organizationEmail ? `<div class="company-info">${props.organizationEmail}</div>` : ''}
      ${props.organizationPhone ? `<div class="company-info">${props.organizationPhone}</div>` : ''}
    </div>

    <div style="text-align: center;">
      <div class="title">${props.isPaid ? 'Payment Received' : 'Invoice'}</div>
      <div class="subtitle">Invoice #${props.invoiceNumber}</div>
      ${props.isPaid ? '<div class="paid-badge">✓ PAID IN FULL</div>' : ''}
    </div>

    <p>Dear ${props.clientName},</p>

    <p>
      ${
        props.isPaid
          ? 'Thank you for your payment! This email confirms that your invoice has been paid in full.'
          : 'Please find attached your invoice. Your payment is appreciated and helps us continue to provide excellent service.'
      }
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Invoice Number:</span>
        <span class="info-value">${props.invoiceNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Issue Date:</span>
        <span class="info-value">${props.issueDate}</span>
      </div>
      ${
        !props.isPaid
          ? `
      <div class="info-row">
        <span class="info-label">Due Date:</span>
        <span class="info-value">${props.dueDate}</span>
      </div>
      ${
        props.paymentTerms
          ? `
      <div class="info-row">
        <span class="info-label">Payment Terms:</span>
        <span class="info-value">${props.paymentTerms}</span>
      </div>
      `
          : ''
      }
      `
          : ''
      }
      <div class="info-row">
        <span class="info-label">Total Amount:</span>
        <span class="total">${props.total}</span>
      </div>
      ${
        !props.isPaid && props.isPartial
          ? `
      <div class="info-row">
        <span class="info-label">Amount Due:</span>
        <span class="amount-due">${props.amountDue}</span>
      </div>
      `
          : ''
      }
    </div>

    ${
      !props.isPaid
        ? `
    <div class="payment-notice">
      <strong>${props.isPartial ? '💵 Partial Payment Received' : '📅 Payment Due'}</strong><br>
      ${statusMessage}
    </div>
    `
        : `
    <div class="payment-notice">
      <strong>✅ Payment Complete</strong><br>
      ${statusMessage}
    </div>
    `
    }

    <div style="text-align: center;">
      <a href="${props.viewUrl}" class="cta-button">View Invoice Details</a>
    </div>

    <p>
      The attached PDF contains the complete invoice with all line items and payment information.
      ${
        !props.isPaid
          ? 'If you have any questions about this invoice or need to arrange payment, please contact us.'
          : 'If you need a receipt or have any questions, please feel free to contact us.'
      }
    </p>

    <p>
      ${props.isPaid ? 'Thank you for your business!' : 'We appreciate your prompt payment.'}
    </p>

    <div class="footer">
      <p><strong>${props.organizationName}</strong></p>
      ${props.organizationEmail ? `<p>${props.organizationEmail}</p>` : ''}
      ${props.organizationPhone ? `<p>${props.organizationPhone}</p>` : ''}
      <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">
        This is an automated message. Please do not reply directly to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function getInvoiceEmailSubject(invoiceNumber: string, isPaid?: boolean): string {
  if (isPaid) {
    return `Invoice ${invoiceNumber} - Payment Received`
  }
  return `Invoice ${invoiceNumber} - Payment Due`
}
