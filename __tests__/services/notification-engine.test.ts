/**
 * Unit Tests for Notification Engine Service
 *
 * Tests notification rule evaluation and triggering including:
 * - Rule evaluation logic
 * - Recipient determination
 * - Event triggering
 * - Condition matching
 * - User preferences
 */

import { NotificationEngineService } from '@/lib/services/notification-engine'
import { NotificationRule, NotificationEvent, UserPreferences } from '@/lib/types/email'

describe('NotificationEngineService', () => {
  let service: NotificationEngineService

  const mockOrgId = 'org_123456789'

  const sampleRule: Partial<NotificationRule> = {
    name: 'Ticket Created',
    eventType: 'ticket.created',
    isActive: true,
    conditions: [
      {
        field: 'priority',
        operator: 'equals',
        value: 'high'
      }
    ],
    recipients: {
      type: 'role',
      roles: ['technician', 'admin']
    },
    templateId: 'template_123'
  }

  const sampleEvent: NotificationEvent = {
    type: 'ticket.created',
    orgId: mockOrgId,
    data: {
      ticketId: 'ticket_123',
      ticketNumber: 'TICKET-001',
      priority: 'high',
      subject: 'Email not working',
      requesterId: 'user_456',
      requesterName: 'John Doe',
      requesterEmail: 'john@example.com'
    },
    triggeredBy: 'user_789',
    timestamp: new Date()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    service = new NotificationEngineService()
  })

  describe('Rule Evaluation', () => {
    test('should evaluate rule conditions correctly', async () => {
      const result = await service.evaluateRule(sampleRule as NotificationRule, sampleEvent)

      expect(result).toBe(true)
    })

    test('should handle multiple conditions with AND logic', async () => {
      const multiConditionRule: Partial<NotificationRule> = {
        ...sampleRule,
        conditions: [
          { field: 'priority', operator: 'equals', value: 'high' },
          { field: 'subject', operator: 'contains', value: 'email' }
        ],
        conditionLogic: 'AND'
      }

      const result = await service.evaluateRule(multiConditionRule as NotificationRule, sampleEvent)

      expect(result).toBe(true)
    })

    test('should handle multiple conditions with OR logic', async () => {
      const orConditionRule: Partial<NotificationRule> = {
        ...sampleRule,
        conditions: [
          { field: 'priority', operator: 'equals', value: 'low' },  // False
          { field: 'priority', operator: 'equals', value: 'high' }  // True
        ],
        conditionLogic: 'OR'
      }

      const result = await service.evaluateRule(orConditionRule as NotificationRule, sampleEvent)

      expect(result).toBe(true)
    })

    test('should return false when conditions do not match', async () => {
      const nonMatchingEvent = {
        ...sampleEvent,
        data: { ...sampleEvent.data, priority: 'low' }
      }

      const result = await service.evaluateRule(sampleRule as NotificationRule, nonMatchingEvent)

      expect(result).toBe(false)
    })

    test('should handle missing fields gracefully', async () => {
      const incompleteEvent = {
        ...sampleEvent,
        data: { ticketId: 'ticket_123' }  // Missing priority
      }

      const result = await service.evaluateRule(sampleRule as NotificationRule, incompleteEvent)

      expect(result).toBe(false)
    })
  })

  describe('Condition Operators', () => {
    test('should evaluate "equals" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'priority', operator: 'equals', value: 'high' }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)

      const differentEvent = {
        ...sampleEvent,
        data: { ...sampleEvent.data, priority: 'low' }
      }

      expect(await service.evaluateRule(rule as NotificationRule, differentEvent)).toBe(false)
    })

    test('should evaluate "not_equals" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'priority', operator: 'not_equals', value: 'low' }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })

    test('should evaluate "contains" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'subject', operator: 'contains', value: 'email' }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })

    test('should evaluate "not_contains" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'subject', operator: 'not_contains', value: 'password' }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })

    test('should evaluate "greater_than" operator', async () => {
      const eventWithNumber = {
        ...sampleEvent,
        data: { ...sampleEvent.data, severity: 8 }
      }

      const rule = {
        ...sampleRule,
        conditions: [{ field: 'severity', operator: 'greater_than', value: 5 }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, eventWithNumber)).toBe(true)
    })

    test('should evaluate "less_than" operator', async () => {
      const eventWithNumber = {
        ...sampleEvent,
        data: { ...sampleEvent.data, severity: 3 }
      }

      const rule = {
        ...sampleRule,
        conditions: [{ field: 'severity', operator: 'less_than', value: 5 }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, eventWithNumber)).toBe(true)
    })

    test('should evaluate "in" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'priority', operator: 'in', value: ['high', 'critical'] }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })

    test('should evaluate "not_in" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'priority', operator: 'not_in', value: ['low', 'medium'] }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })

    test('should evaluate "is_empty" operator', async () => {
      const eventWithEmpty = {
        ...sampleEvent,
        data: { ...sampleEvent.data, assigneeId: null }
      }

      const rule = {
        ...sampleRule,
        conditions: [{ field: 'assigneeId', operator: 'is_empty', value: null }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, eventWithEmpty)).toBe(true)
    })

    test('should evaluate "is_not_empty" operator', async () => {
      const rule = {
        ...sampleRule,
        conditions: [{ field: 'requesterId', operator: 'is_not_empty', value: null }]
      }

      expect(await service.evaluateRule(rule as NotificationRule, sampleEvent)).toBe(true)
    })
  })

  describe('Recipient Determination', () => {
    test('should determine role-based recipients', async () => {
      const recipients = await service.determineRecipients(
        sampleRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients).toBeDefined()
      expect(Array.isArray(recipients)).toBe(true)
      expect(recipients.length).toBeGreaterThan(0)
    })

    test('should determine user-based recipients', async () => {
      const userRule = {
        ...sampleRule,
        recipients: {
          type: 'users',
          userIds: ['user_123', 'user_456']
        }
      }

      const recipients = await service.determineRecipients(
        userRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients.length).toBe(2)
    })

    test('should include dynamic recipients (requester, assignee)', async () => {
      const dynamicRule = {
        ...sampleRule,
        recipients: {
          type: 'dynamic',
          fields: ['requesterId', 'assigneeId']
        }
      }

      const eventWithAssignee = {
        ...sampleEvent,
        data: { ...sampleEvent.data, assigneeId: 'user_999' }
      }

      const recipients = await service.determineRecipients(
        dynamicRule as NotificationRule,
        eventWithAssignee,
        mockOrgId
      )

      expect(recipients).toContainEqual(expect.objectContaining({
        userId: 'user_456'  // requester
      }))

      expect(recipients).toContainEqual(expect.objectContaining({
        userId: 'user_999'  // assignee
      }))
    })

    test('should exclude event triggerer if configured', async () => {
      const excludeTriggerRule = {
        ...sampleRule,
        excludeTriggeringUser: true,
        recipients: {
          type: 'users',
          userIds: ['user_789', 'user_456']  // user_789 is triggerer
        }
      }

      const recipients = await service.determineRecipients(
        excludeTriggerRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients).not.toContainEqual(expect.objectContaining({
        userId: 'user_789'
      }))
    })

    test('should filter out recipients with email notifications disabled', async () => {
      const userPreferences: UserPreferences = {
        userId: 'user_456',
        emailNotifications: false,
        events: {}
      }

      // Mock user preferences retrieval
      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(userPreferences)

      const recipients = await service.determineRecipients(
        sampleRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients).not.toContainEqual(expect.objectContaining({
        userId: 'user_456'
      }))
    })

    test('should respect event-specific user preferences', async () => {
      const userPreferences: UserPreferences = {
        userId: 'user_456',
        emailNotifications: true,
        events: {
          'ticket.created': false  // Opted out of this specific event
        }
      }

      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(userPreferences)

      const recipients = await service.determineRecipients(
        sampleRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients).not.toContainEqual(expect.objectContaining({
        userId: 'user_456'
      }))
    })

    test('should handle empty recipient list', async () => {
      const noRecipientsRule = {
        ...sampleRule,
        recipients: {
          type: 'users',
          userIds: []
        }
      }

      const recipients = await service.determineRecipients(
        noRecipientsRule as NotificationRule,
        sampleEvent,
        mockOrgId
      )

      expect(recipients).toHaveLength(0)
    })
  })

  describe('Event Triggering', () => {
    test('should trigger notification for matching event', async () => {
      const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      await service.processEvent(sampleEvent)

      expect(mockSendEmail).toHaveBeenCalled()
    })

    test('should not trigger notification for inactive rule', async () => {
      const inactiveRule = { ...sampleRule, isActive: false }
      const mockSendEmail = jest.fn()
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)
      jest.spyOn(service, 'getRulesForEvent').mockResolvedValue([inactiveRule as NotificationRule])

      await service.processEvent(sampleEvent)

      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    test('should process multiple matching rules', async () => {
      const rule1 = { ...sampleRule, templateId: 'template_1' }
      const rule2 = { ...sampleRule, templateId: 'template_2' }

      jest.spyOn(service, 'getRulesForEvent').mockResolvedValue([
        rule1 as NotificationRule,
        rule2 as NotificationRule
      ])

      const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      await service.processEvent(sampleEvent)

      expect(mockSendEmail).toHaveBeenCalledTimes(2)
    })

    test('should handle rule evaluation errors gracefully', async () => {
      jest.spyOn(service, 'evaluateRule').mockRejectedValue(new Error('Evaluation error'))

      await expect(service.processEvent(sampleEvent)).resolves.not.toThrow()
    })

    test('should log failed notifications', async () => {
      const mockSendEmail = jest.fn().mockResolvedValue({ success: false, error: 'Send failed' })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      const mockLog = jest.fn()
      jest.spyOn(service, 'logNotification').mockImplementation(mockLog)

      await service.processEvent(sampleEvent)

      expect(mockLog).toHaveBeenCalledWith(expect.objectContaining({
        status: 'failed'
      }))
    })
  })

  describe('Rule Priority', () => {
    test('should process rules in priority order', async () => {
      const rules = [
        { ...sampleRule, priority: 3, name: 'Low Priority' },
        { ...sampleRule, priority: 1, name: 'High Priority' },
        { ...sampleRule, priority: 2, name: 'Medium Priority' }
      ]

      const sortedRules = service.sortRulesByPriority(rules as NotificationRule[])

      expect(sortedRules[0].priority).toBe(1)
      expect(sortedRules[1].priority).toBe(2)
      expect(sortedRules[2].priority).toBe(3)
    })

    test('should stop processing if stopOnMatch is true', async () => {
      const stopRule = { ...sampleRule, stopOnMatch: true }
      const continuingRule = { ...sampleRule, stopOnMatch: false }

      jest.spyOn(service, 'getRulesForEvent').mockResolvedValue([
        stopRule as NotificationRule,
        continuingRule as NotificationRule
      ])

      const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      await service.processEvent(sampleEvent)

      // Should only send one email (first rule stops processing)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })
  })

  describe('Quiet Hours', () => {
    test('should respect user quiet hours', async () => {
      const userPreferences: UserPreferences = {
        userId: 'user_456',
        emailNotifications: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        events: {}
      }

      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(userPreferences)

      // Create event during quiet hours
      const nightEvent = {
        ...sampleEvent,
        timestamp: new Date('2024-01-15T23:00:00')
      }

      const shouldSend = await service.shouldSendNotification('user_456', nightEvent)

      expect(shouldSend).toBe(false)
    })

    test('should send during non-quiet hours', async () => {
      const userPreferences: UserPreferences = {
        userId: 'user_456',
        emailNotifications: true,
        quietHours: {
          enabled: true,
          start: '22:00',
          end: '08:00'
        },
        events: {}
      }

      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(userPreferences)

      const dayEvent = {
        ...sampleEvent,
        timestamp: new Date('2024-01-15T14:00:00')
      }

      const shouldSend = await service.shouldSendNotification('user_456', dayEvent)

      expect(shouldSend).toBe(true)
    })
  })

  describe('Digest Mode', () => {
    test('should queue notifications for digest mode', async () => {
      const userPreferences: UserPreferences = {
        userId: 'user_456',
        emailNotifications: true,
        digestMode: {
          enabled: true,
          frequency: 'daily',
          time: '09:00'
        },
        events: {}
      }

      jest.spyOn(service, 'getUserPreferences').mockResolvedValue(userPreferences)

      const mockQueue = jest.fn()
      jest.spyOn(service, 'queueForDigest').mockImplementation(mockQueue)

      await service.processEvent(sampleEvent)

      expect(mockQueue).toHaveBeenCalled()
    })

    test('should send digest at scheduled time', async () => {
      const userId = 'user_456'
      const queuedNotifications = [
        { eventType: 'ticket.created', data: { ticketNumber: 'TICKET-001' } },
        { eventType: 'ticket.updated', data: { ticketNumber: 'TICKET-002' } }
      ]

      const mockSendDigest = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendDigestEmail').mockImplementation(mockSendDigest)

      await service.processDigest(userId, queuedNotifications)

      expect(mockSendDigest).toHaveBeenCalledWith(userId, queuedNotifications)
    })
  })

  describe('Deduplication', () => {
    test('should not send duplicate notifications', async () => {
      const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      // Send same event twice
      await service.processEvent(sampleEvent)
      await service.processEvent(sampleEvent)

      // Should only send once (deduplicated)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    test('should clear deduplication cache after timeout', async () => {
      jest.useFakeTimers()

      const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
      jest.spyOn(service, 'sendEmail').mockImplementation(mockSendEmail)

      await service.processEvent(sampleEvent)

      // Advance time past deduplication window (e.g., 5 minutes)
      jest.advanceTimersByTime(6 * 60 * 1000)

      await service.processEvent(sampleEvent)

      // Should send twice (cache cleared)
      expect(mockSendEmail).toHaveBeenCalledTimes(2)

      jest.useRealTimers()
    })
  })

  describe('Performance', () => {
    test('should handle high volume of events', async () => {
      const events = Array(100).fill(null).map((_, i) => ({
        ...sampleEvent,
        data: { ...sampleEvent.data, ticketNumber: `TICKET-${i}` }
      }))

      const startTime = Date.now()

      await Promise.all(events.map(event => service.processEvent(event)))

      const endTime = Date.now()
      const duration = endTime - startTime

      // Should process 100 events in less than 5 seconds
      expect(duration).toBeLessThan(5000)
    })

    test('should batch database queries', async () => {
      const mockBatchQuery = jest.fn().mockResolvedValue([])
      jest.spyOn(service, 'batchGetUsers').mockImplementation(mockBatchQuery)

      await service.processEvent(sampleEvent)

      // Should use batch query instead of individual queries
      expect(mockBatchQuery).toHaveBeenCalled()
    })
  })
})
