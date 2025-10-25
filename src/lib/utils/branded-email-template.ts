import { OrganizationBranding } from '@/lib/types'
import { BrandingService } from '@/lib/services/branding'

/**
 * Generate a branded email template wrapper with organization branding
 *
 * @param content - HTML content to wrap
 * @param orgId - Organization ID
 * @returns Complete HTML email with branded styling
 */
export async function getBrandedEmailWrapper(
  content: string,
  orgId: string
): Promise<string> {
  // Fetch organization branding
  const branding = await BrandingService.getBranding(orgId)

  return generateBrandedEmailHTML(content, branding)
}

/**
 * Generate branded email HTML with given branding configuration
 *
 * @param content - HTML content to wrap
 * @param branding - Organization branding configuration
 * @returns Complete HTML email with branded styling
 */
export function generateBrandedEmailHTML(
  content: string,
  branding: OrganizationBranding
): string {
  // Extract branding values
  const companyName = branding.identity.companyName
  const headerColor = branding.email.headerColor || '#667eea'
  const fromName = branding.email.fromName
  const footerText = branding.email.footerText || `© ${new Date().getFullYear()} ${companyName}. All rights reserved.`
  const logoUrl = branding.email.logoUrl // Publicly accessible logo URL
  const fontFamily = branding.typography.fontFamily || 'system-ui, -apple-system, sans-serif'

  // Convert HSL to hex for email compatibility
  const primaryColor = hslToHex(
    branding.colors.primary.h,
    branding.colors.primary.s,
    branding.colors.primary.l
  )

  const secondaryColor = hslToHex(
    branding.colors.secondary.h,
    branding.colors.secondary.s,
    branding.colors.secondary.l
  )

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: ${fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background-color: ${headerColor};
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header-logo {
      max-width: 200px;
      max-height: 60px;
      margin-bottom: 10px;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background-color: ${primaryColor};
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      opacity: 0.9;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid ${primaryColor};
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-high { background-color: #fef3c7; color: #92400e; }
    .badge-critical { background-color: #fee2e2; color: #991b1b; }
    .badge-medium { background-color: #dbeafe; color: #1e40af; }
    .badge-low { background-color: #d1fae5; color: #065f46; }
    .company-name {
      color: ${primaryColor};
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoUrl ? `<img src="${logoUrl}" alt="${companyName}" class="header-logo" />` : ''}
      ${!logoUrl ? `<h1>${companyName}</h1>` : ''}
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      ${footerText}
    </div>
  </div>
</body>
</html>
`
}

/**
 * Convert HSL color to Hex format
 * Email clients have better support for hex colors than HSL
 *
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., "#667eea")
 */
function hslToHex(h: number, s: number, l: number): string {
  // Convert saturation and lightness to 0-1 range
  s = s / 100
  l = l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0

  if (h >= 0 && h < 60) {
    r = c
    g = x
    b = 0
  } else if (h >= 60 && h < 120) {
    r = x
    g = c
    b = 0
  } else if (h >= 120 && h < 180) {
    r = 0
    g = c
    b = x
  } else if (h >= 180 && h < 240) {
    r = 0
    g = x
    b = c
  } else if (h >= 240 && h < 300) {
    r = x
    g = 0
    b = c
  } else if (h >= 300 && h < 360) {
    r = c
    g = 0
    b = x
  }

  // Convert to 0-255 range
  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, '0')
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, '0')
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, '0')

  return `#${rHex}${gHex}${bHex}`
}

/**
 * Replace default email wrapper with branded version in template HTML
 *
 * @param templateHtml - Original template HTML
 * @param branding - Organization branding
 * @returns Template with branded wrapper
 */
export function applyBrandingToEmailTemplate(
  templateHtml: string,
  branding: OrganizationBranding
): string {
  // Extract content between <body> tags or use the whole template
  const bodyMatch = templateHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i)
  const containerMatch = templateHtml.match(/<div class="container"[^>]*>([\s\S]*)<\/div>\s*<\/body>/i)

  let content: string

  if (containerMatch) {
    // Extract content inside .container div
    const fullContainer = containerMatch[0]
    const contentMatch = fullContainer.match(/<div class="content"[^>]*>([\s\S]*?)<\/div>\s*<div class="footer"/i)
    content = contentMatch ? contentMatch[1] : fullContainer
  } else if (bodyMatch) {
    content = bodyMatch[1]
  } else {
    // No body tags, use whole template
    content = templateHtml
  }

  // Generate new branded wrapper
  return generateBrandedEmailHTML(content, branding)
}
