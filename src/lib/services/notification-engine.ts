import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  NotificationEvent,
  NotificationRule,
  EmailDeliveryLog,
  EmailDeliveryStatus,
  User,
  UserNotificationPreferences,
} from '@/lib/types'
import { EmailSettingsService } from './email-settings'
import { TemplateService } from './email-templates'
import { EmailService } from './email-service'

/**
 * NotificationEngine
 *
 * Core notification engine that triggers and sends email notifications.
 * Evaluates rules, determines recipients, renders templates, and queues emails.
 */
export class NotificationEngine {
  /**
   * Trigger a notification based on an event
   *
   * @param orgId - Organization ID
   * @param event - Notification event type
   * @param data - Event data (ticket, incident, etc.)
   * @param triggeredBy - User ID who triggered the event
   */
  static async triggerNotification(
    orgId: string,
    event: NotificationEvent,
    data: Record<string, any>,
    triggeredBy?: string
  ): Promise<void> {
    try {
      // Check if email notifications are enabled
      const emailSettings = await EmailSettingsService.getSettings(orgId)

      if (!emailSettings || !emailSettings.isEnabled || !emailSettings.isConfigured) {
        console.log(`Email notifications not enabled for org: ${orgId}`)
        return
      }

      // Find matching notification rules
      const rules = await this.findMatchingRules(orgId, event, data)

      if (rules.length === 0) {
        console.log(`No matching rules for event: ${event}`)
        return
      }

      // Process each rule
      for (const rule of rules) {
        try {
          await this.processRule(orgId, rule, data, triggeredBy)
        } catch (error) {
          console.error(`Error processing rule ${rule._id}:`, error)
          // Continue with other rules even if one fails
        }
      }
    } catch (error) {
      console.error('Notification engine error:', error)
      // Don't throw - notifications should not block main operations
    }
  }

  /**
   * Find notification rules matching the event and conditions
   */
  private static async findMatchingRules(
    orgId: string,
    event: NotificationEvent,
    data: Record<string, any>
  ): Promise<NotificationRule[]> {
    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    // Get all active rules for this event
    const rules = await rulesCollection
      .find({
        orgId,
        event,
        isEnabled: true,
      })
      .sort({ priority: 1 }) // Lower priority number = higher priority
      .toArray()

    // Filter rules by conditions
    return rules.filter((rule) => {
      if (!rule.conditions || rule.conditions.length === 0) {
        return true // No conditions = always match
      }

      // Check all conditions (AND logic)
      return rule.conditions.every((condition) => {
        const fieldValue = this.getNestedValue(data, condition.field)
        return this.evaluateCondition(fieldValue, condition.operator, condition.value)
      })
    })
  }

  /**
   * Process a single notification rule
   */
  private static async processRule(
    orgId: string,
    rule: NotificationRule,
    data: Record<string, any>,
    triggeredBy?: string
  ): Promise<void> {
    // Determine recipients
    const recipients = await this.determineRecipients(orgId, rule, data, triggeredBy)

    if (recipients.length === 0) {
      console.log(`No recipients for rule: ${rule.name}`)
      return
    }

    // Render template
    const rendered = await TemplateService.renderTemplate(rule.templateId, orgId, data)

    // Get email settings with decrypted credentials
    const emailSettings = await EmailSettingsService.getSettings(orgId, true)

    if (!emailSettings) {
      throw new Error('Email settings not found')
    }

    // Send emails to each recipient
    for (const recipient of recipients) {
      try {
        // Check user preferences
        const preferences = await this.getUserPreferences(recipient.userId, orgId)

        if (!this.shouldSendEmail(preferences, rule.event)) {
          console.log(`User ${recipient.email} has disabled notifications for ${rule.event}`)
          continue
        }

        // Check rate limits
        const rateLimits = await EmailSettingsService.checkRateLimits(orgId)

        if (!rateLimits.canSend) {
          console.warn(`Rate limit exceeded for org: ${orgId}`)
          break // Stop sending for this rule
        }

        // Send email
        await this.sendEmail(orgId, emailSettings, {
          to: recipient.email,
          subject: rendered.subject,
          htmlBody: rendered.htmlBody,
          textBody: rendered.textBody,
          event: rule.event,
          ruleId: rule._id.toString(),
          templateId: rule.templateId,
          relatedEntity: data.relatedEntity,
        })

        // Increment rate limits
        await EmailSettingsService.incrementRateLimits(orgId, 1)
      } catch (error) {
        console.error(`Error sending email to ${recipient.email}:`, error)
        // Continue with other recipients
      }
    }

    // Update rule execution stats
    await this.updateRuleStats(rule._id.toString(), orgId)
  }

  /**
   * Determine recipients based on rule configuration
   */
  private static async determineRecipients(
    orgId: string,
    rule: NotificationRule,
    data: Record<string, any>,
    triggeredBy?: string
  ): Promise<Array<{ userId: string; email: string }>> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const recipientsSet = new Set<string>() // Use Set to avoid duplicates
    const recipientsList: Array<{ userId: string; email: string }> = []

    for (const recipientConfig of rule.recipients) {
      switch (recipientConfig.type) {
        case 'requester':
          if (data.requesterId || data.createdBy) {
            recipientsSet.add(data.requesterId || data.createdBy)
          }
          break

        case 'assignee':
          if (data.assignedTo) {
            recipientsSet.add(data.assignedTo)
          }
          break

        case 'user':
          if (recipientConfig.value) {
            const userIds = Array.isArray(recipientConfig.value)
              ? recipientConfig.value
              : [recipientConfig.value]
            userIds.forEach((id) => recipientsSet.add(id))
          }
          break

        case 'role':
          if (recipientConfig.value) {
            const roleIds = Array.isArray(recipientConfig.value)
              ? recipientConfig.value
              : [recipientConfig.value]

            const usersWithRole = await usersCollection
              .find({
                orgId,
                roleId: { $in: roleIds },
                isActive: true,
              })
              .toArray()

            usersWithRole.forEach((user) => recipientsSet.add(user._id.toString()))
          }
          break

        case 'email':
          if (recipientConfig.value) {
            const emails = Array.isArray(recipientConfig.value)
              ? recipientConfig.value
              : [recipientConfig.value]

            emails.forEach((email) => {
              recipientsList.push({
                userId: 'external',
                email,
              })
            })
          }
          break
      }
    }

    // Remove the user who triggered the event (optional - can be made configurable)
    if (triggeredBy) {
      recipientsSet.delete(triggeredBy)
    }

    // Convert user IDs to email addresses
    if (recipientsSet.size > 0) {
      const users = await usersCollection
        .find({
          _id: { $in: Array.from(recipientsSet).map((id) => new ObjectId(id)) },
          isActive: true,
        })
        .toArray()

      users.forEach((user) => {
        recipientsList.push({
          userId: user._id.toString(),
          email: user.email,
        })
      })
    }

    return recipientsList
  }

  /**
   * Send an email and log the delivery
   */
  private static async sendEmail(
    orgId: string,
    emailSettings: any,
    emailData: {
      to: string
      subject: string
      htmlBody: string
      textBody?: string
      event: NotificationEvent
      ruleId: string
      templateId: string
      relatedEntity?: any
    }
  ): Promise<void> {
    const db = await getDatabase()
    const logsCollection = db.collection<EmailDeliveryLog>(COLLECTIONS.EMAIL_DELIVERY_LOGS)

    const now = new Date()

    // Create delivery log
    const deliveryLog: Omit<EmailDeliveryLog, '_id'> = {
      orgId,
      to: [emailData.to],
      from: `${emailSettings.fromName} <${emailSettings.fromEmail}>`,
      replyTo: emailSettings.replyToEmail,
      subject: emailData.subject,
      htmlBody: emailData.htmlBody,
      textBody: emailData.textBody,
      event: emailData.event,
      ruleId: emailData.ruleId,
      templateId: emailData.templateId,
      relatedEntity: emailData.relatedEntity,
      status: 'queued',
      statusHistory: [
        {
          status: 'queued',
          timestamp: now,
        },
      ],
      retryCount: 0,
      maxRetries: 3,
      queuedAt: now,
    }

    const logResult = await logsCollection.insertOne(deliveryLog as EmailDeliveryLog)
    const logId = logResult.insertedId

    try {
      // Update status to sending
      await logsCollection.updateOne(
        { _id: logId },
        {
          $set: { status: 'sending' },
          $push: {
            statusHistory: {
              status: 'sending',
              timestamp: new Date(),
            },
          },
        }
      )

      // Send email via configured provider (platform or SMTP)
      const emailService = new EmailService(emailSettings)
      const result = await emailService.sendEmail(
        emailData.to,
        emailData.subject,
        emailData.htmlBody,
        emailData.textBody
      )

      // Update status to sent
      await logsCollection.updateOne(
        { _id: logId },
        {
          $set: {
            status: 'sent',
            sesMessageId: result.messageId,
            sesResponse: result.response,
            sentAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'sent',
              timestamp: new Date(),
              message: 'Email sent successfully',
            },
          },
        }
      )
    } catch (error: any) {
      console.error('Email sending error:', error)

      // Update status to failed
      await logsCollection.updateOne(
        { _id: logId },
        {
          $set: {
            status: 'failed',
            error: {
              message: error.message,
              code: error.code,
              timestamp: new Date(),
            },
            failedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'failed',
              timestamp: new Date(),
              message: error.message,
            },
          },
        }
      )

      throw error
    }
  }

  /**
   * Get user notification preferences
   */
  private static async getUserPreferences(
    userId: string,
    orgId: string
  ): Promise<UserNotificationPreferences | null> {
    const db = await getDatabase()
    const prefsCollection = db.collection<UserNotificationPreferences>(
      COLLECTIONS.USER_NOTIFICATION_PREFERENCES
    )

    return await prefsCollection.findOne({ userId, orgId })
  }

  /**
   * Check if email should be sent based on user preferences
   */
  private static shouldSendEmail(
    preferences: UserNotificationPreferences | null,
    event: NotificationEvent
  ): boolean {
    if (!preferences) {
      return true // No preferences = send all
    }

    if (!preferences.emailNotificationsEnabled) {
      return false // Notifications disabled
    }

    if (preferences.doNotDisturb) {
      if (!preferences.doNotDisturbUntil || preferences.doNotDisturbUntil > new Date()) {
        return false // DND active
      }
    }

    const eventPreference = preferences.preferences[event]

    if (!eventPreference) {
      return true // No specific preference = send
    }

    return eventPreference.enabled && eventPreference.frequency !== 'never'
  }

  /**
   * Update rule execution statistics
   */
  private static async updateRuleStats(ruleId: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const rulesCollection = db.collection<NotificationRule>(COLLECTIONS.NOTIFICATION_RULES)

    await rulesCollection.updateOne(
      { _id: new ObjectId(ruleId), orgId },
      {
        $inc: { executionCount: 1, successCount: 1 },
        $set: { lastExecutedAt: new Date() },
      }
    )
  }

  /**
   * Evaluate a condition
   */
  private static evaluateCondition(
    fieldValue: any,
    operator: string,
    expectedValue: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue

      case 'not-equals':
        return fieldValue !== expectedValue

      case 'contains':
        return String(fieldValue).includes(String(expectedValue))

      case 'not-contains':
        return !String(fieldValue).includes(String(expectedValue))

      case 'greater-than':
        return Number(fieldValue) > Number(expectedValue)

      case 'less-than':
        return Number(fieldValue) < Number(expectedValue)

      case 'is-empty':
        return !fieldValue || fieldValue === '' || (Array.isArray(fieldValue) && fieldValue.length === 0)

      case 'is-not-empty':
        return !!fieldValue && fieldValue !== '' && (!Array.isArray(fieldValue) || fieldValue.length > 0)

      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue)

      case 'not-in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue)

      default:
        return false
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
