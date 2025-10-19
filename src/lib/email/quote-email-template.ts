interface QuoteEmailTemplateProps {
  clientName: string
  quoteNumber: string
  total: string
  validUntil: string
  viewUrl: string
  organizationName: string
  organizationEmail?: string
  organizationPhone?: string
}

export function getQuoteEmailTemplate(props: QuoteEmailTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote ${props.quoteNumber}</title>
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
      border-bottom: 3px solid #2563eb;
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
      color: #2563eb;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 30px;
    }
    .info-box {
      background-color: #f3f4f6;
      border-left: 4px solid #2563eb;
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
      color: #2563eb;
    }
    .cta-button {
      display: inline-block;
      background-color: #2563eb;
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
      background-color: #1d4ed8;
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
    .expiry-notice {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
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
      <div class="title">New Quote</div>
      <div class="subtitle">Quote #${props.quoteNumber}</div>
    </div>

    <p>Dear ${props.clientName},</p>

    <p>
      Thank you for your interest in our services. We are pleased to provide you with the following quote for your review.
    </p>

    <div class="info-box">
      <div class="info-row">
        <span class="info-label">Quote Number:</span>
        <span class="info-value">${props.quoteNumber}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Quote Total:</span>
        <span class="total">${props.total}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Valid Until:</span>
        <span class="info-value">${props.validUntil}</span>
      </div>
    </div>

    <div class="expiry-notice">
      <strong>⚠️ Important:</strong> This quote is valid until ${props.validUntil}. Please review and respond before this date.
    </div>

    <div style="text-align: center;">
      <a href="${props.viewUrl}" class="cta-button">View Quote Details</a>
    </div>

    <p>
      The attached PDF contains the complete quote with all line items, terms, and conditions.
      If you have any questions or would like to discuss this quote further, please don't hesitate to contact us.
    </p>

    <p>
      We look forward to working with you!
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

export function getQuoteEmailSubject(quoteNumber: string): string {
  return `Quote ${quoteNumber} - Review Your Quote`
}
