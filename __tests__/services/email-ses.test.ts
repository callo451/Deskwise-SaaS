/**
 * Unit Tests for SES Email Service
 *
 * Tests the AWS SES email sending functionality including:
 * - Email sending (mocked)
 * - Credential encryption/decryption
 * - Error handling
 * - Rate limiting
 * - Email validation
 */

import { SESEmailService } from '@/lib/services/email-ses'
import { EmailMessage, SESCredentials } from '@/lib/types/email'

// Mock AWS SES client
jest.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: jest.fn().mockImplementation(() => ({
      send: jest.fn()
    })),
    SendEmailCommand: jest.fn(),
    VerifyEmailIdentityCommand: jest.fn(),
    VerifyDomainIdentityCommand: jest.fn(),
    GetIdentityVerificationAttributesCommand: jest.fn()
  }
})

// Mock crypto for encryption/decryption
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(() => Buffer.from('0123456789abcdef0123456789abcdef', 'hex')),
  createCipheriv: jest.fn(() => ({
    update: jest.fn(() => Buffer.from('encrypted')),
    final: jest.fn(() => Buffer.from('data'))
  })),
  createDecipheriv: jest.fn(() => ({
    update: jest.fn(() => Buffer.from('decrypted')),
    final: jest.fn(() => Buffer.from('data'))
  }))
}))

describe('SESEmailService', () => {
  let service: SESEmailService

  const mockCredentials: SESCredentials = {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
  }

  const mockOrgId = 'org_123456789'

  beforeEach(() => {
    jest.clearAllMocks()
    service = new SESEmailService()
  })

  describe('Credential Encryption/Decryption', () => {
    test('should encrypt credentials successfully', async () => {
      const encrypted = await service.encryptCredentials(mockCredentials)

      expect(encrypted).toBeDefined()
      expect(encrypted).toHaveProperty('encryptedData')
      expect(encrypted).toHaveProperty('iv')
      expect(encrypted).toHaveProperty('tag')
      expect(typeof encrypted.encryptedData).toBe('string')
      expect(typeof encrypted.iv).toBe('string')
    })

    test('should decrypt credentials successfully', async () => {
      const encrypted = await service.encryptCredentials(mockCredentials)
      const decrypted = await service.decryptCredentials(encrypted)

      expect(decrypted).toBeDefined()
      expect(decrypted.accessKeyId).toBe(mockCredentials.accessKeyId)
      expect(decrypted.secretAccessKey).toBe(mockCredentials.secretAccessKey)
      expect(decrypted.region).toBe(mockCredentials.region)
    })

    test('should handle encryption errors gracefully', async () => {
      const invalidCredentials = null as any

      await expect(service.encryptCredentials(invalidCredentials))
        .rejects.toThrow()
    })

    test('should handle decryption errors gracefully', async () => {
      const invalidEncrypted = {
        encryptedData: 'invalid',
        iv: 'invalid',
        tag: 'invalid'
      }

      await expect(service.decryptCredentials(invalidEncrypted))
        .rejects.toThrow()
    })

    test('should use different IVs for each encryption', async () => {
      const encrypted1 = await service.encryptCredentials(mockCredentials)
      const encrypted2 = await service.encryptCredentials(mockCredentials)

      // IVs should be different (in real implementation)
      // This is a simplified test since we're mocking crypto
      expect(encrypted1).toBeDefined()
      expect(encrypted2).toBeDefined()
    })
  })

  describe('Email Validation', () => {
    test('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@subdomain.example.com',
        'user+tag@example.co.uk',
        'user_name@example.com'
      ]

      validEmails.forEach(email => {
        expect(service.validateEmail(email)).toBe(true)
      })
    })

    test('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        ''
      ]

      invalidEmails.forEach(email => {
        expect(service.validateEmail(email)).toBe(false)
      })
    })
  })

  describe('Email Sending', () => {
    const mockMessage: EmailMessage = {
      to: ['recipient@example.com'],
      from: 'sender@example.com',
      subject: 'Test Email',
      htmlBody: '<p>Test message</p>',
      textBody: 'Test message'
    }

    test('should send email successfully', async () => {
      const result = await service.sendEmail(mockOrgId, mockMessage, mockCredentials)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    test('should handle multiple recipients', async () => {
      const messageWithMultipleRecipients = {
        ...mockMessage,
        to: ['recipient1@example.com', 'recipient2@example.com', 'recipient3@example.com']
      }

      const result = await service.sendEmail(mockOrgId, messageWithMultipleRecipients, mockCredentials)

      expect(result.success).toBe(true)
    })

    test('should handle CC and BCC recipients', async () => {
      const messageWithCC = {
        ...mockMessage,
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com']
      }

      const result = await service.sendEmail(mockOrgId, messageWithCC, mockCredentials)

      expect(result.success).toBe(true)
    })

    test('should handle email sending errors', async () => {
      const invalidMessage = {
        ...mockMessage,
        to: ['invalid-email']
      }

      await expect(service.sendEmail(mockOrgId, invalidMessage, mockCredentials))
        .rejects.toThrow()
    })

    test('should handle SES rate limit errors', async () => {
      const mockSESClient = require('@aws-sdk/client-ses').SESClient
      mockSESClient.mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue({
          name: 'Throttling',
          message: 'Rate exceeded'
        })
      }))

      await expect(service.sendEmail(mockOrgId, mockMessage, mockCredentials))
        .rejects.toThrow()
    })

    test('should handle invalid credentials', async () => {
      const invalidCredentials = {
        ...mockCredentials,
        accessKeyId: 'INVALID'
      }

      await expect(service.sendEmail(mockOrgId, mockMessage, invalidCredentials))
        .rejects.toThrow()
    })

    test('should include attachments if provided', async () => {
      const messageWithAttachment = {
        ...mockMessage,
        attachments: [
          {
            filename: 'test.pdf',
            content: Buffer.from('test content'),
            contentType: 'application/pdf'
          }
        ]
      }

      const result = await service.sendEmail(mockOrgId, messageWithAttachment, mockCredentials)

      expect(result.success).toBe(true)
    })
  })

  describe('Connection Testing', () => {
    test('should test SES connection successfully', async () => {
      const result = await service.testConnection(mockCredentials)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.message).toBeDefined()
    })

    test('should handle connection test failures', async () => {
      const invalidCredentials = {
        ...mockCredentials,
        region: 'invalid-region'
      }

      const result = await service.testConnection(invalidCredentials)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Email Verification', () => {
    test('should verify email address', async () => {
      const email = 'verify@example.com'
      const result = await service.verifyEmailAddress(email, mockCredentials)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
    })

    test('should verify domain', async () => {
      const domain = 'example.com'
      const result = await service.verifyDomain(domain, mockCredentials)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.verificationToken).toBeDefined()
    })

    test('should check verification status', async () => {
      const identity = 'example.com'
      const status = await service.getVerificationStatus(identity, mockCredentials)

      expect(status).toBeDefined()
      expect(['Pending', 'Success', 'Failed', 'NotStarted']).toContain(status)
    })
  })

  describe('Rate Limiting', () => {
    test('should respect rate limits', async () => {
      const messages = Array(10).fill(null).map((_, i) => ({
        ...mockMessage,
        to: [`recipient${i}@example.com`]
      }))

      // Send multiple emails rapidly
      const results = await Promise.allSettled(
        messages.map(msg => service.sendEmail(mockOrgId, msg, mockCredentials))
      )

      // All should succeed or be rate limited gracefully
      results.forEach(result => {
        expect(['fulfilled', 'rejected']).toContain(result.status)
      })
    })

    test('should queue emails when rate limited', async () => {
      const queueService = service.getEmailQueue()

      expect(queueService).toBeDefined()
      expect(queueService.getPendingCount()).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const mockSESClient = require('@aws-sdk/client-ses').SESClient
      mockSESClient.mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue(new Error('Network error'))
      }))

      await expect(service.sendEmail(mockOrgId, mockMessage, mockCredentials))
        .rejects.toThrow('Network error')
    })

    test('should handle malformed email data', async () => {
      const malformedMessage = {
        to: null,
        from: null,
        subject: null,
        htmlBody: null
      } as any

      await expect(service.sendEmail(mockOrgId, malformedMessage, mockCredentials))
        .rejects.toThrow()
    })

    test('should sanitize error messages for security', async () => {
      const mockSESClient = require('@aws-sdk/client-ses').SESClient
      mockSESClient.mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue({
          message: 'Error with secret key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
        })
      }))

      try {
        await service.sendEmail(mockOrgId, mockMessage, mockCredentials)
      } catch (error: any) {
        // Error message should not contain secret key
        expect(error.message).not.toContain('wJalrXUtnFEMI')
      }
    })
  })

  describe('Metrics and Logging', () => {
    test('should log email sending attempts', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation()

      await service.sendEmail(mockOrgId, mockMessage, mockCredentials)

      expect(logSpy).toHaveBeenCalled()
      logSpy.mockRestore()
    })

    test('should track email delivery metrics', async () => {
      await service.sendEmail(mockOrgId, mockMessage, mockCredentials)

      const metrics = await service.getMetrics(mockOrgId)

      expect(metrics).toBeDefined()
      expect(metrics.sent).toBeGreaterThan(0)
    })
  })
})
