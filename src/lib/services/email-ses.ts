import {
  SESClient,
  SendEmailCommand,
  VerifyEmailIdentityCommand,
  GetIdentityVerificationAttributesCommand,
  VerifyDomainIdentityCommand,
  type SendEmailCommandInput
} from '@aws-sdk/client-ses'
import { EmailSettings } from '@/lib/types'
import { decryptCredentials } from '@/lib/utils/email-encryption'

/**
 * SESEmailService
 *
 * Handles Amazon SES email sending operations.
 * Provides methods to send emails, verify identities, and test connections.
 */
export class SESEmailService {
  private client: SESClient | null = null
  private settings: EmailSettings | null = null

  /**
   * Initialize SES client with provided settings
   */
  constructor(settings: EmailSettings) {
    this.settings = settings

    try {
      // Decrypt credentials
      const credentials = decryptCredentials({
        awsAccessKeyId: settings.awsAccessKeyId,
        awsSecretAccessKey: settings.awsSecretAccessKey,
      })

      // Initialize SES client
      this.client = new SESClient({
        region: settings.awsRegion,
        credentials: {
          accessKeyId: credentials.awsAccessKeyId,
          secretAccessKey: credentials.awsSecretAccessKey,
        },
      })
    } catch (error) {
      console.error('Failed to initialize SES client:', error)
      throw new Error('Invalid email settings or credentials')
    }
  }

  /**
   * Send an email via Amazon SES
   *
   * @param to - Recipient email address(es)
   * @param subject - Email subject
   * @param htmlBody - HTML email body
   * @param textBody - Plain text email body (optional)
   * @param cc - CC recipients (optional)
   * @param bcc - BCC recipients (optional)
   * @param replyTo - Reply-to email address (optional)
   * @returns SES message ID on success
   */
  async sendEmail(
    to: string | string[],
    subject: string,
    htmlBody: string,
    textBody?: string,
    cc?: string[],
    bcc?: string[],
    replyTo?: string
  ): Promise<{ messageId: string; response: any }> {
    if (!this.client || !this.settings) {
      throw new Error('SES client not initialized')
    }

    // Normalize to array
    const toAddresses = Array.isArray(to) ? to : [to]

    // Validate inputs
    if (toAddresses.length === 0) {
      throw new Error('At least one recipient is required')
    }

    if (!subject || subject.trim() === '') {
      throw new Error('Subject is required')
    }

    if (!htmlBody || htmlBody.trim() === '') {
      throw new Error('Email body is required')
    }

    try {
      // Prepare email parameters
      const params: SendEmailCommandInput = {
        Source: this.settings.replyToEmail || this.settings.fromEmail,
        Destination: {
          ToAddresses: toAddresses,
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

      // Send email via SES
      const command = new SendEmailCommand(params)
      const response = await this.client.send(command)

      return {
        messageId: response.MessageId || '',
        response,
      }
    } catch (error: any) {
      console.error('SES send error:', error)

      // Parse SES error for better error messages
      let errorMessage = 'Failed to send email'

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
   * Verify an email address in Amazon SES
   *
   * @param email - Email address to verify
   * @returns Verification initiated successfully
   */
  async verifyEmailAddress(email: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('SES client not initialized')
    }

    try {
      const command = new VerifyEmailIdentityCommand({
        EmailAddress: email,
      })

      await this.client.send(command)
      return true
    } catch (error: any) {
      console.error('Email verification error:', error)
      throw new Error(`Failed to verify email: ${error.message}`)
    }
  }

  /**
   * Check if an email address is verified in Amazon SES
   *
   * @param email - Email address to check
   * @returns Verification status
   */
  async checkEmailVerification(email: string): Promise<{
    isVerified: boolean
    status: string
  }> {
    if (!this.client) {
      throw new Error('SES client not initialized')
    }

    try {
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [email],
      })

      const response = await this.client.send(command)
      const attributes = response.VerificationAttributes?.[email]

      return {
        isVerified: attributes?.VerificationStatus === 'Success',
        status: attributes?.VerificationStatus || 'Pending',
      }
    } catch (error: any) {
      console.error('Email verification check error:', error)
      throw new Error(`Failed to check email verification: ${error.message}`)
    }
  }

  /**
   * Verify a domain in Amazon SES
   *
   * @param domain - Domain to verify (e.g., 'example.com')
   * @returns Verification token for DNS records
   */
  async verifyDomain(domain: string): Promise<{ verificationToken: string }> {
    if (!this.client) {
      throw new Error('SES client not initialized')
    }

    try {
      const command = new VerifyDomainIdentityCommand({
        Domain: domain,
      })

      const response = await this.client.send(command)

      return {
        verificationToken: response.VerificationToken || '',
      }
    } catch (error: any) {
      console.error('Domain verification error:', error)
      throw new Error(`Failed to verify domain: ${error.message}`)
    }
  }

  /**
   * Test SES connection by sending a test email
   *
   * @param testEmail - Email address to send test email to
   * @returns True if test successful
   */
  async testConnection(testEmail: string): Promise<{
    success: boolean
    message: string
    messageId?: string
  }> {
    try {
      if (!this.settings) {
        throw new Error('Email settings not configured')
      }

      const subject = 'Deskwise ITSM - Test Email'
      const htmlBody = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Email Configuration Test</h2>
              <p>This is a test email from your Deskwise ITSM email configuration.</p>
              <p>If you received this email, your Amazon SES integration is working correctly!</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="font-size: 12px; color: #6b7280;">
                Sent from: ${this.settings.fromEmail}<br>
                Region: ${this.settings.awsRegion}<br>
                Timestamp: ${new Date().toISOString()}
              </p>
            </div>
          </body>
        </html>
      `

      const textBody = `
Email Configuration Test

This is a test email from your Deskwise ITSM email configuration.
If you received this email, your Amazon SES integration is working correctly!

Sent from: ${this.settings.fromEmail}
Region: ${this.settings.awsRegion}
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
   * Validate SES credentials without sending email
   *
   * @returns True if credentials are valid
   */
  async validateCredentials(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      if (!this.client || !this.settings) {
        throw new Error('SES client not initialized')
      }

      // Try to get verification attributes (lightweight API call)
      const command = new GetIdentityVerificationAttributesCommand({
        Identities: [this.settings.fromEmail],
      })

      await this.client.send(command)

      return {
        success: true,
        message: 'Credentials are valid',
      }
    } catch (error: any) {
      let message = 'Invalid credentials'

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
}
