import { convert as htmlToText } from 'html-to-text'
import TurndownService from 'turndown'
import { ParsedEmail } from './imap-service'

/**
 * Email Parser Service
 * Handles email content parsing and extraction
 */
export class EmailParser {
  private turndown: TurndownService

  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '-',
      codeBlockStyle: 'fenced',
    })
  }

  /**
   * Extract ticket number from subject line
   * Looks for patterns like:
   * - #TKT-123
   * - [TKT-123]
   * - Re: Ticket #TKT-123
   * - Fwd: [TKT-123] Issue
   */
  extractTicketNumber(subject: string): string | null {
    const patterns = [
      /#(TKT-\d+)/i, // #TKT-123
      /\[(TKT-\d+)\]/i, // [TKT-123]
      /Ticket\s+#?(TKT-\d+)/i, // Ticket #TKT-123
      /(TKT-\d+)/i, // TKT-123 (fallback)
    ]

    for (const pattern of patterns) {
      const match = subject.match(pattern)
      if (match) {
        return match[1].toUpperCase()
      }
    }

    return null
  }

  /**
   * Convert HTML email to plain text
   */
  htmlToText(html: string): string {
    return htmlToText(html, {
      wordwrap: 120,
      selectors: [
        { selector: 'a', options: { ignoreHref: false } },
        { selector: 'img', format: 'skip' },
        { selector: 'blockquote', options: { trimEmptyLines: true } },
      ],
    })
  }

  /**
   * Convert HTML email to Markdown
   */
  htmlToMarkdown(html: string): string {
    try {
      return this.turndown.turndown(html)
    } catch (error) {
      console.error('❌ Error converting HTML to Markdown:', error)
      return this.htmlToText(html) // Fallback to plain text
    }
  }

  /**
   * Remove email signature from body
   * Common signature patterns:
   * - Lines starting with "--"
   * - "Sent from my iPhone"
   * - "Get Outlook for iOS"
   */
  removeSignature(body: string): string {
    const signaturePatterns = [
      /--\s*$/m, // Standard signature delimiter
      /^Sent from my .*/im, // Mobile signatures
      /^Get Outlook for .*/im, // Outlook signatures
      /^________________________________/im, // Outlook separator
    ]

    let cleanBody = body

    for (const pattern of signaturePatterns) {
      const match = cleanBody.match(pattern)
      if (match && match.index !== undefined) {
        cleanBody = cleanBody.substring(0, match.index).trim()
      }
    }

    return cleanBody
  }

  /**
   * Remove quoted reply text
   * Removes text like:
   * > Original message
   * On Jan 1, 2025, at 10:00 AM, user@example.com wrote:
   */
  removeQuotedReply(body: string): string {
    const lines = body.split('\n')
    const cleanLines: string[] = []

    for (const line of lines) {
      // Stop at quoted lines (starts with >)
      if (line.trim().startsWith('>')) {
        break
      }

      // Stop at "On ... wrote:" pattern
      if (/^On .+ wrote:$/i.test(line.trim())) {
        break
      }

      // Stop at "From: ... Sent: ..." pattern (Outlook)
      if (/^From:.+Sent:/i.test(line.trim())) {
        break
      }

      cleanLines.push(line)
    }

    return cleanLines.join('\n').trim()
  }

  /**
   * Clean email body
   * Removes signatures, quoted replies, and excessive whitespace
   */
  cleanBody(body: string, isReply: boolean = false): string {
    let cleaned = body

    // Remove signature
    cleaned = this.removeSignature(cleaned)

    // If it's a reply, remove quoted text
    if (isReply) {
      cleaned = this.removeQuotedReply(cleaned)
    }

    // Remove excessive whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n') // Max 2 newlines
    cleaned = cleaned.replace(/[ \t]+/g, ' ') // Collapse spaces
    cleaned = cleaned.trim()

    return cleaned
  }

  /**
   * Get best body content (prefer text, fallback to HTML)
   */
  getBestBody(email: ParsedEmail): string {
    if (email.text) {
      return email.text
    }

    if (email.html) {
      return this.htmlToText(email.html)
    }

    return '(No email body)'
  }

  /**
   * Detect if email is an auto-reply (vacation, out-of-office)
   */
  isAutoReply(email: ParsedEmail): boolean {
    const autoReplyIndicators = [
      'auto-reply',
      'automatic reply',
      'out of office',
      'out of the office',
      'away from my desk',
      'vacation',
      'autoreply',
      'do not reply',
    ]

    const subject = email.subject.toLowerCase()
    const body = this.getBestBody(email).toLowerCase()

    return autoReplyIndicators.some(
      (indicator) => subject.includes(indicator) || body.includes(indicator)
    )
  }

  /**
   * Detect if email is a delivery failure (bounce)
   */
  isBouncedEmail(email: ParsedEmail): boolean {
    const bounceIndicators = [
      'delivery failure',
      'undelivered',
      'returned mail',
      'mail delivery failed',
      'delivery status notification',
      'mailer-daemon',
    ]

    const from = email.from.address.toLowerCase()
    const subject = email.subject.toLowerCase()

    return (
      from.includes('mailer-daemon') ||
      from.includes('postmaster') ||
      bounceIndicators.some((indicator) => subject.includes(indicator))
    )
  }

  /**
   * Extract sender name (or fallback to email)
   */
  getSenderName(email: ParsedEmail): string {
    if (email.from.name) {
      return email.from.name
    }

    // Extract name from email (before @)
    const username = email.from.address.split('@')[0]
    return username.replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  /**
   * Parse email and prepare for ticket creation
   */
  parseForTicket(email: ParsedEmail): {
    isReply: boolean
    ticketNumber: string | null
    title: string
    body: string
    senderName: string
    senderEmail: string
    attachmentCount: number
    shouldIgnore: boolean
    ignoreReason?: string
  } {
    // Check if should ignore
    if (this.isAutoReply(email)) {
      return {
        isReply: false,
        ticketNumber: null,
        title: email.subject,
        body: '',
        senderName: this.getSenderName(email),
        senderEmail: email.from.address,
        attachmentCount: 0,
        shouldIgnore: true,
        ignoreReason: 'Auto-reply detected',
      }
    }

    if (this.isBouncedEmail(email)) {
      return {
        isReply: false,
        ticketNumber: null,
        title: email.subject,
        body: '',
        senderName: this.getSenderName(email),
        senderEmail: email.from.address,
        attachmentCount: 0,
        shouldIgnore: true,
        ignoreReason: 'Bounced email detected',
      }
    }

    // Extract ticket number (if reply)
    const ticketNumber = this.extractTicketNumber(email.subject)
    const isReply = !!ticketNumber || !!email.inReplyTo

    // Get and clean body
    const rawBody = this.getBestBody(email)
    const cleanedBody = this.cleanBody(rawBody, isReply)

    // Clean subject (remove Re:, Fwd:, ticket numbers)
    let title = email.subject
      .replace(/^(Re|Fwd|RE|FW):\s*/i, '')
      .replace(/\[?TKT-\d+\]?/gi, '')
      .replace(/#TKT-\d+/gi, '')
      .trim()

    return {
      isReply,
      ticketNumber,
      title,
      body: cleanedBody,
      senderName: this.getSenderName(email),
      senderEmail: email.from.address,
      attachmentCount: email.attachments.length,
      shouldIgnore: false,
    }
  }
}
