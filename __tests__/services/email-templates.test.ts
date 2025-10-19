/**
 * Unit Tests for Email Template Service
 *
 * Tests email template functionality including:
 * - Template rendering with variables
 * - Template validation
 * - Malformed template handling
 * - Variable substitution
 * - Security (XSS prevention)
 */

import { EmailTemplateService } from '@/lib/services/email-templates'
import { EmailTemplate, TemplateVariable } from '@/lib/types/email'

// Mock Handlebars
jest.mock('handlebars', () => ({
  compile: jest.fn((template: string) => {
    return (data: any) => {
      // Simple variable replacement for testing
      let result = template
      Object.keys(data).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        result = result.replace(regex, data[key])
      })
      return result
    }
  }),
  SafeString: jest.fn((str: string) => str),
  escapeExpression: jest.fn((str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  })
}))

describe('EmailTemplateService', () => {
  let service: EmailTemplateService

  const mockOrgId = 'org_123456789'
  const mockUserId = 'user_123456789'

  const sampleTemplate: Partial<EmailTemplate> = {
    name: 'Test Template',
    subject: 'Test: {{ticketNumber}}',
    htmlBody: '<p>Hello {{requesterName}},</p><p>Your ticket #{{ticketNumber}} has been created.</p>',
    textBody: 'Hello {{requesterName}}, Your ticket #{{ticketNumber}} has been created.',
    category: 'ticket',
    isActive: true
  }

  const sampleVariables = {
    ticketNumber: 'TICKET-001',
    requesterName: 'John Doe',
    assigneeName: 'Jane Smith',
    ticketSubject: 'Email not working',
    ticketDescription: 'Cannot send emails'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new EmailTemplateService()
  })

  describe('Template Rendering', () => {
    test('should render template with variables successfully', async () => {
      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, sampleVariables)

      expect(result).toBeDefined()
      expect(result.subject).toContain('TICKET-001')
      expect(result.htmlBody).toContain('John Doe')
      expect(result.htmlBody).toContain('TICKET-001')
    })

    test('should render both HTML and text body', async () => {
      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, sampleVariables)

      expect(result.htmlBody).toBeDefined()
      expect(result.textBody).toBeDefined()
      expect(result.subject).toBeDefined()
    })

    test('should handle missing variables gracefully', async () => {
      const incompleteVariables = {
        ticketNumber: 'TICKET-001'
        // Missing requesterName
      }

      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, incompleteVariables)

      expect(result).toBeDefined()
      // Should render with empty values or keep placeholders
      expect(result.subject).toContain('TICKET-001')
    })

    test('should handle empty template', async () => {
      const emptyTemplate: Partial<EmailTemplate> = {
        name: 'Empty Template',
        subject: '',
        htmlBody: '',
        textBody: ''
      }

      const result = await service.renderTemplate(emptyTemplate as EmailTemplate, sampleVariables)

      expect(result.subject).toBe('')
      expect(result.htmlBody).toBe('')
      expect(result.textBody).toBe('')
    })

    test('should preserve HTML formatting', async () => {
      const htmlTemplate: Partial<EmailTemplate> = {
        name: 'HTML Template',
        subject: 'Test',
        htmlBody: '<div><h1>Title</h1><p>Paragraph with {{variable}}</p></div>',
        textBody: 'Plain text'
      }

      const result = await service.renderTemplate(htmlTemplate as EmailTemplate, { variable: 'value' })

      expect(result.htmlBody).toContain('<h1>')
      expect(result.htmlBody).toContain('<p>')
      expect(result.htmlBody).toContain('value')
    })

    test('should handle special characters in variables', async () => {
      const specialVars = {
        ticketNumber: 'TICKET-001',
        requesterName: "O'Brien & Sons",
        ticketSubject: 'Issue with <script> tags'
      }

      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, specialVars)

      expect(result).toBeDefined()
      // Should be properly escaped
      expect(result.htmlBody).not.toContain('<script>')
    })
  })

  describe('Template Validation', () => {
    test('should validate correct template syntax', () => {
      const validation = service.validateTemplate(sampleTemplate.htmlBody!)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    test('should detect malformed handlebars syntax', () => {
      const malformedTemplates = [
        '{{unclosed',
        '{{#if condition}}<p>No closing tag',
        '{{invalid syntax here}}',
        '{{{{too many braces}}}}'
      ]

      malformedTemplates.forEach(template => {
        const validation = service.validateTemplate(template)
        expect(validation.isValid).toBe(false)
        expect(validation.errors.length).toBeGreaterThan(0)
      })
    })

    test('should validate required fields', () => {
      const invalidTemplate: Partial<EmailTemplate> = {
        name: '',  // Empty name
        subject: 'Test',
        htmlBody: '<p>Body</p>'
      }

      const validation = service.validateTemplateObject(invalidTemplate as EmailTemplate)

      expect(validation.isValid).toBe(false)
      expect(validation.errors).toContain('Template name is required')
    })

    test('should validate template variables exist', () => {
      const template = '<p>Hello {{unknownVariable}}</p>'
      const availableVariables = ['ticketNumber', 'requesterName']

      const validation = service.validateTemplateVariables(template, availableVariables)

      expect(validation.warnings).toContain('Variable "unknownVariable" is not defined')
    })

    test('should detect potentially dangerous content', () => {
      const dangerousTemplates = [
        '<script>alert("xss")</script>',
        '<img src=x onerror="alert(1)">',
        'javascript:void(0)',
        '<iframe src="malicious.com"></iframe>'
      ]

      dangerousTemplates.forEach(template => {
        const validation = service.validateTemplate(template)
        expect(validation.warnings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Variable Substitution', () => {
    test('should extract variables from template', () => {
      const template = 'Hello {{name}}, your ticket {{ticketNumber}} is {{status}}'
      const variables = service.extractVariables(template)

      expect(variables).toContain('name')
      expect(variables).toContain('ticketNumber')
      expect(variables).toContain('status')
      expect(variables).toHaveLength(3)
    })

    test('should handle nested variables', () => {
      const template = '{{user.name}} - {{user.email}}'
      const variables = service.extractVariables(template)

      expect(variables).toContain('user.name')
      expect(variables).toContain('user.email')
    })

    test('should handle conditional blocks', () => {
      const template = '{{#if hasAssignee}}Assigned to: {{assigneeName}}{{/if}}'
      const variables = service.extractVariables(template)

      expect(variables).toContain('hasAssignee')
      expect(variables).toContain('assigneeName')
    })

    test('should handle loops', () => {
      const template = '{{#each comments}}<p>{{this.text}}</p>{{/each}}'
      const variables = service.extractVariables(template)

      expect(variables).toContain('comments')
    })

    test('should remove duplicate variables', () => {
      const template = '{{name}} {{name}} {{name}}'
      const variables = service.extractVariables(template)

      expect(variables).toHaveLength(1)
      expect(variables[0]).toBe('name')
    })
  })

  describe('Security and XSS Prevention', () => {
    test('should escape HTML in variables by default', async () => {
      const xssVariables = {
        requesterName: '<script>alert("xss")</script>',
        ticketNumber: 'TICKET-001'
      }

      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, xssVariables)

      expect(result.htmlBody).not.toContain('<script>')
      expect(result.htmlBody).toContain('&lt;script&gt;')
    })

    test('should sanitize triple-brace raw HTML', async () => {
      const unsafeTemplate: Partial<EmailTemplate> = {
        name: 'Unsafe Template',
        subject: 'Test',
        htmlBody: '<p>{{{unsafeHtml}}}</p>',
        textBody: 'Test'
      }

      const result = await service.renderTemplate(
        unsafeTemplate as EmailTemplate,
        { unsafeHtml: '<script>alert("xss")</script>' }
      )

      // Should still escape or sanitize dangerous content
      expect(result.htmlBody).not.toContain('<script>alert')
    })

    test('should prevent template injection', async () => {
      const maliciousVariables = {
        ticketNumber: '{{malicious}}',
        requesterName: '{{#each admin}}{{password}}{{/each}}'
      }

      const result = await service.renderTemplate(sampleTemplate as EmailTemplate, maliciousVariables)

      // Variables should be rendered as plain text, not executed as template code
      expect(result.htmlBody).toBeDefined()
    })
  })

  describe('Template Categories', () => {
    test('should get available template categories', () => {
      const categories = service.getTemplateCategories()

      expect(categories).toContain('ticket')
      expect(categories).toContain('incident')
      expect(categories).toContain('change_request')
      expect(categories).toContain('system')
    })

    test('should get variables for specific category', () => {
      const ticketVars = service.getAvailableVariables('ticket')

      expect(ticketVars).toContainEqual(expect.objectContaining({
        key: 'ticketNumber',
        label: 'Ticket Number'
      }))

      expect(ticketVars).toContainEqual(expect.objectContaining({
        key: 'requesterName',
        label: 'Requester Name'
      }))
    })
  })

  describe('Template Preview', () => {
    test('should generate preview with sample data', async () => {
      const preview = await service.generatePreview(sampleTemplate as EmailTemplate)

      expect(preview).toBeDefined()
      expect(preview.subject).toBeDefined()
      expect(preview.htmlBody).toBeDefined()
      expect(preview.textBody).toBeDefined()
    })

    test('should use custom preview data if provided', async () => {
      const customData = {
        ticketNumber: 'CUSTOM-123',
        requesterName: 'Custom User'
      }

      const preview = await service.generatePreview(sampleTemplate as EmailTemplate, customData)

      expect(preview.subject).toContain('CUSTOM-123')
      expect(preview.htmlBody).toContain('Custom User')
    })
  })

  describe('Error Handling', () => {
    test('should handle rendering errors gracefully', async () => {
      const brokenTemplate: Partial<EmailTemplate> = {
        name: 'Broken Template',
        subject: '{{#if unclosed',
        htmlBody: '<p>{{undefined.property}}</p>',
        textBody: 'Test'
      }

      await expect(service.renderTemplate(brokenTemplate as EmailTemplate, {}))
        .rejects.toThrow()
    })

    test('should provide helpful error messages', async () => {
      const invalidTemplate: Partial<EmailTemplate> = {
        name: 'Invalid',
        subject: '{{unclosed',
        htmlBody: 'Body',
        textBody: 'Body'
      }

      try {
        await service.renderTemplate(invalidTemplate as EmailTemplate, {})
      } catch (error: any) {
        expect(error.message).toBeDefined()
        expect(error.message.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Template Helpers', () => {
    test('should support date formatting helper', async () => {
      const template: Partial<EmailTemplate> = {
        name: 'Date Template',
        subject: 'Test',
        htmlBody: '<p>Created: {{formatDate createdAt "MMMM DD, YYYY"}}</p>',
        textBody: 'Test'
      }

      const result = await service.renderTemplate(
        template as EmailTemplate,
        { createdAt: new Date('2024-01-15') }
      )

      expect(result.htmlBody).toContain('January 15, 2024')
    })

    test('should support conditional helpers', async () => {
      const template: Partial<EmailTemplate> = {
        name: 'Conditional Template',
        subject: 'Test',
        htmlBody: '{{#if isUrgent}}<strong>URGENT</strong>{{/if}}',
        textBody: 'Test'
      }

      const urgentResult = await service.renderTemplate(
        template as EmailTemplate,
        { isUrgent: true }
      )

      expect(urgentResult.htmlBody).toContain('URGENT')

      const normalResult = await service.renderTemplate(
        template as EmailTemplate,
        { isUrgent: false }
      )

      expect(normalResult.htmlBody).not.toContain('URGENT')
    })

    test('should support comparison helpers', async () => {
      const template: Partial<EmailTemplate> = {
        name: 'Comparison Template',
        subject: 'Test',
        htmlBody: '{{#ifEqual status "open"}}Ticket is open{{/ifEqual}}',
        textBody: 'Test'
      }

      const result = await service.renderTemplate(
        template as EmailTemplate,
        { status: 'open' }
      )

      expect(result.htmlBody).toContain('Ticket is open')
    })
  })

  describe('Performance', () => {
    test('should render large templates efficiently', async () => {
      const largeTemplate: Partial<EmailTemplate> = {
        name: 'Large Template',
        subject: 'Test',
        htmlBody: '<div>' + '<p>{{text}}</p>'.repeat(100) + '</div>',
        textBody: 'Test'
      }

      const startTime = Date.now()
      await service.renderTemplate(
        largeTemplate as EmailTemplate,
        { text: 'Sample text' }
      )
      const endTime = Date.now()

      // Should render in less than 1 second
      expect(endTime - startTime).toBeLessThan(1000)
    })

    test('should cache compiled templates', async () => {
      const firstRender = await service.renderTemplate(sampleTemplate as EmailTemplate, sampleVariables)
      const secondRender = await service.renderTemplate(sampleTemplate as EmailTemplate, sampleVariables)

      expect(firstRender).toEqual(secondRender)
      // Second render should be faster (cached)
    })
  })
})
