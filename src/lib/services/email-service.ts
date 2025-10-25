import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
  GetIdentityVerificationAttributesCommand,
  type SendEmailCommandInput
} from '@aws-sdk/client-ses'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import { EmailSettings } from '@/lib/types'
import { decryptCredentials } from '@/lib/utils/email-encryption'

export interface EmailAttachment {
  filename: string
  content: Buffer | string
  contentType?: string
  encoding?: string
}

/**
 * Unified Email Service
 *
 * Supports two email providers:
 * 1. Platform - Uses AWS SES with credentials from .env (managed by Deskwise)
 * 2. SMTP - Uses organization's SMTP server with credentials from database
 */
export class EmailService {
  private provider: 'platform' | 'smtp'
  private sesClient: SESClient | null = null
  private smtpTransporter: Transporter | null = null
  private settings: EmailSettings

  /**
   * Initialize email service with organization settings
   */
  constructor(settings: EmailSettings) {
    this.settings = settings
    this.provider = settings.provider

    if (this.provider === 'platform') {
      this.initializePlatformProvider()
    } else if (this.provider === 'smtp' && settings.smtp) {
      this.initializeSmtpProvider(settings.smtp)
    } else {
      throw new Error('Invalid email provider configuration')
    }
  }

  /**
   * Initialize platform provider (AWS SES from .env)
   */
  private initializePlatformProvider(): void {
    const accessKeyId = process.env.AWS_SES_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_SES_SECRET_ACCESS_KEY
    const region = process.env.AWS_SES_REGION || 'us-east-1'

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'Platform email provider not configured. Missing AWS_SES_ACCESS_KEY_ID or AWS_SES_SECRET_ACCESS_KEY in environment variables.'
      )
    }

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    })
  }

  /**
   * Initialize SMTP provider (from database)
   */
  private initializeSmtpProvider(smtpConfig: any): void {
    try {
      // Decrypt SMTP password
      const decrypted = decryptCredentials({
        smtpPassword: smtpConfig.password,
      })

      // Create Nodemailer transporter
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.secure, // true for 465, false for other ports
        auth: {
          user: smtpConfig.username,
          pass: decrypted.smtpPassword,
        },
        requireTLS: smtpConfig.requireTLS !== false, // default true
      })
    } catch (error) {
      console.error('Failed to initialize SMTP transporter:', error)
      throw new Error('Invalid SMTP configuration or credentials')
    }
  }

  /**
   * Send an email via configured provider
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    cc?: string[],
    bcc?: string[],
    replyTo?: string,
    attachments?: EmailAttachment[]
  ): Promise<{ messageId: string; response: any }> {
    // Validate inputs
    const toAddresses = Array.isArray(to) ? to : [to]

    if (toAddresses.length === 0) {
      throw new Error('At least one recipient is required')
    }

    if (!subject || subject.trim() === '') {
      throw new Error('Subject is required')
    }

    if (!htmlBody || htmlBody.trim() === '') {
      throw new Error('Email body is required')
    }

    // Route to correct provider
    if (this.provider === 'platform') {
      return await this.sendViaSES(toAddresses, subject, htmlBody, textBody, cc, bcc, replyTo, attachments)
    } else {
      return await this.sendViaSMTP(toAddresses, subject, htmlBody, textBody, cc, bcc, replyTo, attachments)
    }
  }

  /**
   * Send email via AWS SES
   */
  private async sendViaSES(
    to: string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    cc?: string[],
    bcc?: string[],
    replyTo?: string,
    attachments?: EmailAttachment[]
  ): Promise<{ messageId: string; response: any }> {
    if (!this.sesClient) {
      throw new Error('AWS SES client not initialized')
    }

    try {
      // Get platform from email from env or use settings
      const fromEmail = process.env.AWS_SES_FROM_EMAIL || this.settings.fromEmail
      const fromName = process.env.AWS_SES_FROM_NAME || this.settings.fromName

      // If attachments are present, use SendRawEmailCommand
      if (attachments && attachments.length > 0) {
        return await this.sendViaSESRaw(to, subject, htmlBody, textBody, cc, bcc, replyTo, attachments, fromEmail, fromName)
      }

      const params: SendEmailCommandInput = {
        Source: `${fromName} <${fromEmail}>`,
        Destination: {
          ToAddresses: to,
          ...(cc && cc.length > 0 && { CcAddresses: cc }),
          ...(bcc && bcc.length > 0 && { BccAddresses: bcc }),
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            ...(textBody && {
              Text: {
                Data: textBody,
                Charset: 'UTF-8',
              },
            }),
          },
        },
        ...(replyTo && { ReplyToAddresses: [replyTo] }),
      }

      const command = new SendEmailCommand(params)
      const response = await this.sesClient.send(command)

      return {
        messageId: response.MessageId || '',
        response,
      }
    } catch (error: any) {
      console.error('SES send error:', error)

      // Parse SES error for better error messages
      let errorMessage = 'Failed to send email via AWS SES'

      if (error.name === 'MessageRejected') {
        errorMessage = 'Email rejected by SES. Check sender verification.'
      } else if (error.name === 'MailFromDomainNotVerifiedException') {
        errorMessage = 'Sender domain not verified in SES.'
      } else if (error.name === 'ConfigurationSetDoesNotExistException') {
        errorMessage = 'SES configuration set does not exist.'
      } else if (error.name === 'ThrottlingException' || error.name === 'Throttling') {
        errorMessage = 'Rate limit exceeded. Please try again later.'
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * Send email via AWS SES using raw MIME format (for attachments)
   */
  private async sendViaSESRaw(
    to: string[],
    subject: string,
    htmlBody: string,
    textBody: string | undefined,
    cc: string[] | undefined,
    bcc: string[] | undefined,
    replyTo: string | undefined,
    attachments: EmailAttachment[],
    fromEmail: string,
    fromName: string
  ): Promise<{ messageId: string; response: any }> {
    if (!this.sesClient) {
      throw new Error('AWS SES client not initialized')
    }

    try {
      // Generate boundary strings for MIME parts
      const boundaryMixed = `----=_Part_Mixed_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const boundaryAlt = `----=_Part_Alt_${Date.now()}_${Math.random().toString(36).substring(7)}`

      // Build email headers
      let rawMessage = `From: ${fromName} <${fromEmail}>\n`
      rawMessage += `To: ${to.join(', ')}\n`
      if (cc && cc.length > 0) rawMessage += `Cc: ${cc.join(', ')}\n`
      if (bcc && bcc.length > 0) rawMessage += `Bcc: ${bcc.join(', ')}\n`
      if (replyTo) rawMessage += `Reply-To: ${replyTo}\n`
      rawMessage += `Subject: ${subject}\n`
      rawMessage += `MIME-Version: 1.0\n`
      rawMessage += `Content-Type: multipart/mixed; boundary="${boundaryMixed}"\n\n`

      // Start mixed part (for text/html + attachments)
      rawMessage += `--${boundaryMixed}\n`
      rawMessage += `Content-Type: multipart/alternative; boundary="${boundaryAlt}"\n\n`

      // Text part
      if (textBody) {
        rawMessage += `--${boundaryAlt}\n`
        rawMessage += `Content-Type: text/plain; charset=UTF-8\n`
        rawMessage += `Content-Transfer-Encoding: 7bit\n\n`
        rawMessage += `${textBody}\n\n`
      }

      // HTML part
      rawMessage += `--${boundaryAlt}\n`
      rawMessage += `Content-Type: text/html; charset=UTF-8\n`
      rawMessage += `Content-Transfer-Encoding: 7bit\n\n`
      rawMessage += `${htmlBody}\n\n`
      rawMessage += `--${boundaryAlt}--\n\n`

      // Add attachments
      for (const attachment of attachments) {
        rawMessage += `--${boundaryMixed}\n`
        rawMessage += `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename}"\n`
        rawMessage += `Content-Transfer-Encoding: base64\n`
        rawMessage += `Content-Disposition: attachment; filename="${attachment.filename}"\n\n`

        // Convert content to base64
        const base64Content = Buffer.isBuffer(attachment.content)
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64')

        // Split into 76-character lines (MIME requirement)
        const lines = base64Content.match(/.{1,76}/g) || []
        rawMessage += lines.join('\n') + '\n\n'
      }

      // End message
      rawMessage += `--${boundaryMixed}--`

      // Send via SES
      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawMessage),
        },
      })

      const response = await this.sesClient.send(command)

      return {
        messageId: response.MessageId || '',
        response,
      }
    } catch (error: any) {
      console.error('SES raw send error:', error)
      throw new Error(error.message || 'Failed to send email with attachments via AWS SES')
    }
  }

  /**
   * Send email via SMTP
   */
  private async sendViaSMTP(
    to: string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    cc?: string[],
    bcc?: string[],
    replyTo?: string,
    attachments?: EmailAttachment[]
  ): Promise<{ messageId: string; response: any }> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized')
    }

    try {
      const mailOptions: any = {
        from: `${this.settings.fromName} <${this.settings.fromEmail}>`,
        to: to.join(', '),
        ...(cc && cc.length > 0 && { cc: cc.join(', ') }),
        ...(bcc && bcc.length > 0 && { bcc: bcc.join(', ') }),
        ...(replyTo && { replyTo }),
        subject,
        html: htmlBody,
        ...(textBody && { text: textBody }),
      }

      // Add attachments if present
      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType || 'application/octet-stream',
          encoding: att.encoding || 'base64',
        }))
      }

      const info = await this.smtpTransporter.sendMail(mailOptions)

      return {
        messageId: info.messageId || '',
        response: info,
      }
    } catch (error: any) {
      console.error('SMTP send error:', error)

      let errorMessage = 'Failed to send email via SMTP'

      if (error.responseCode) {
        errorMessage = `SMTP Error ${error.responseCode}: ${error.response || error.message}`
      } else if (error.message) {
        errorMessage = error.message
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * Test email connection
   */
  async testConnection(testEmail: string): Promise<{
    success: boolean
    message: string
    messageId?: string
  }> {
    try {
      const subject = 'Deskwise - Email Configuration Test'
      const htmlBody = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Email Configuration Test</h2>
              <p>This is a test email from your Deskwise email configuration.</p>
              <p>If you received this email, your ${this.provider === 'platform' ? 'platform email' : 'SMTP'} integration is working correctly!</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="font-size: 12px; color: #6b7280;">
                Provider: ${this.provider === 'platform' ? 'Platform Email (AWS SES)' : 'Custom SMTP'}<br>
                Sent from: ${this.settings.fromEmail}<br>
                Timestamp: ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `

      const textBody = `
Email Configuration Test

This is a test email from your Deskwise email configuration.
If you received this email, your ${this.provider === 'platform' ? 'platform email' : 'SMTP'} integration is working correctly!

Provider: ${this.provider === 'platform' ? 'Platform Email (AWS SES)' : 'Custom SMTP'}
Sent from: ${this.settings.fromEmail}
Timestamp: ${new Date().toISOString()}
      `

      const result = await this.sendEmail(
        testEmail,
        subject,
        htmlBody,
        textBody
      )

      return {
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId,
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to send test email',
      }
    }
  }

  /**
   * Validate provider connection without sending email
   */
  async validateConnection(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      if (this.provider === 'platform') {
        return await this.validatePlatformConnection()
      } else {
        return await this.validateSmtpConnection()
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Connection validation failed',
      }
    }
  }

  /**
   * Validate AWS SES connection
   */
  private async validatePlatformConnection(): Promise<{
    success: boolean
    message: string
  }> {
    if (!this.sesClient) {
      throw new Error('AWS SES client not initialized')
    }

    try {
      // Try to get verification attributes (lightweight API call)
      const fromEmail = process.env.AWS_SES_FROM_EMAIL || this.settings.fromEmail

      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [fromEmail],
      })

      await this.sesClient.send(command)

      return {
        success: true,
        message: 'Platform email provider connection is valid',
      }
    } catch (error: any) {
      let message = 'Invalid AWS SES credentials'

      if (error.name === 'InvalidClientTokenId') {
        message = 'Invalid AWS Access Key ID'
      } else if (error.name === 'SignatureDoesNotMatch') {
        message = 'Invalid AWS Secret Access Key'
      } else if (error.message) {
        message = error.message
      }

      return {
        success: false,
        message,
      }
    }
  }

  /**
   * Validate SMTP connection
   */
  private async validateSmtpConnection(): Promise<{
    success: boolean
    message: string
  }> {
    if (!this.smtpTransporter) {
      throw new Error('SMTP transporter not initialized')
    }

    try {
      // Verify SMTP connection
      await this.smtpTransporter.verify()

      return {
        success: true,
        message: 'SMTP connection is valid',
      }
    } catch (error: any) {
      let message = 'SMTP connection failed'

      if (error.code === 'EAUTH') {
        message = 'SMTP authentication failed. Check username and password.'
      } else if (error.code === 'ECONNECTION') {
        message = 'Cannot connect to SMTP server. Check host and port.'
      } else if (error.message) {
        message = error.message
      }

      return {
        success: false,
        message,
      }
    }
  }
}
