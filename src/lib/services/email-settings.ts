import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { EmailSettings, EmailProvider, SmtpConfig } from '@/lib/types'
import { encryptCredentials, decryptCredentials } from '@/lib/utils/email-encryption'
import { EmailService } from './email-service'

/**
 * EmailSettingsService
 *
 * Manages email settings for organizations.
 * Supports both platform (AWS SES from .env) and SMTP (customer-configured) providers.
 */
export class EmailSettingsService {
  /**
   * Save or update email settings for an organization
   */
  static async saveSettings(
    orgId: string,
    userId: string,
    settingsData: {
      provider: EmailProvider
      smtp?: {
        host: string
        port: number
        secure: boolean
        username: string
        password: string
        requireTLS?: boolean
      }
      fromEmail: string
      fromName: string
      replyToEmail?: string
      maxEmailsPerHour?: number
      maxEmailsPerDay?: number
    }
  ): Promise<EmailSettings> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    const now = new Date()

    // Prepare SMTP config with encrypted password
    let encryptedSmtp: SmtpConfig | undefined

    if (settingsData.provider === 'smtp' && settingsData.smtp) {
      const encryptedCredentials = encryptCredentials({
        smtpPassword: settingsData.smtp.password,
      })

      encryptedSmtp = {
        host: settingsData.smtp.host,
        port: settingsData.smtp.port,
        secure: settingsData.smtp.secure,
        username: settingsData.smtp.username,
        password: encryptedCredentials.smtpPassword!,
        requireTLS: settingsData.smtp.requireTLS !== false,
      }
    }

    // Check if settings already exist
    const existingSettings = await settingsCollection.findOne({ orgId })

    if (existingSettings) {
      // Update existing settings
      const result = await settingsCollection.findOneAndUpdate(
        { orgId },
        {
          $set: {
            provider: settingsData.provider,
            ...(encryptedSmtp && { smtp: encryptedSmtp }),
            fromEmail: settingsData.fromEmail,
            fromName: settingsData.fromName,
            replyToEmail: settingsData.replyToEmail,
            maxEmailsPerHour: settingsData.maxEmailsPerHour || 100,
            maxEmailsPerDay: settingsData.maxEmailsPerDay || 1000,
            isConfigured: true,
            updatedAt: now,
          },
          // Unset smtp if provider is platform
          ...(settingsData.provider === 'platform' && { $unset: { smtp: '' } }),
        },
        { returnDocument: 'after' }
      )

      return result!
    } else {
      // Create new settings
      const newSettings: Omit<EmailSettings, '_id'> = {
        orgId,
        provider: settingsData.provider,
        ...(encryptedSmtp && { smtp: encryptedSmtp }),
        fromEmail: settingsData.fromEmail,
        fromName: settingsData.fromName,
        replyToEmail: settingsData.replyToEmail,
        isEnabled: false,
        isConfigured: true,
        maxEmailsPerHour: settingsData.maxEmailsPerHour || 100,
        maxEmailsPerDay: settingsData.maxEmailsPerDay || 1000,
        currentHourCount: 0,
        currentDayCount: 0,
        lastResetHour: now,
        lastResetDay: now,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }

      const result = await settingsCollection.insertOne(newSettings as EmailSettings)

      return {
        ...newSettings,
        _id: result.insertedId,
      } as EmailSettings
    }
  }

  /**
   * Get email settings for an organization
   */
  static async getSettings(
    orgId: string,
    includeDecrypted: boolean = false
  ): Promise<EmailSettings | null> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    const settings = await settingsCollection.findOne({ orgId })

    if (!settings) {
      return null
    }

    // Mask encrypted credentials unless explicitly requested
    if (!includeDecrypted && settings.smtp?.password) {
      return {
        ...settings,
        smtp: {
          ...settings.smtp,
          password: '***********',
        },
      }
    }

    return settings
  }

  /**
   * Test email settings by sending a test email
   */
  static async testSettings(
    orgId: string,
    testEmail: string
  ): Promise<{
    success: boolean
    message: string
    messageId?: string
  }> {
    try {
      const settings = await this.getSettings(orgId, true)

      if (!settings || !settings.isConfigured) {
        return {
          success: false,
          message: 'Email settings not configured',
        }
      }

      // Create email service instance
      const emailService = new EmailService(settings)

      // Test connection
      const result = await emailService.testConnection(testEmail)

      // Update test result in database
      const db = await getDatabase()
      const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

      await settingsCollection.updateOne(
        { orgId },
        {
          $set: {
            lastTestedAt: new Date(),
            lastTestResult: {
              success: result.success,
              message: result.message,
              timestamp: new Date(),
            },
          },
        }
      )

      return result
    } catch (error: any) {
      console.error('Test settings error:', error)
      return {
        success: false,
        message: error.message || 'Failed to test email settings',
      }
    }
  }

  /**
   * Enable or disable email notifications
   */
  static async setEnabled(orgId: string, enabled: boolean): Promise<EmailSettings | null> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    const result = await settingsCollection.findOneAndUpdate(
      { orgId },
      {
        $set: {
          isEnabled: enabled,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Check and reset rate limits
   */
  static async checkRateLimits(orgId: string): Promise<{
    canSend: boolean
    hourlyRemaining: number
    dailyRemaining: number
  }> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    const settings = await settingsCollection.findOne({ orgId })

    if (!settings) {
      throw new Error('Email settings not found')
    }

    const now = new Date()
    let resetHour = false
    let resetDay = false

    // Check if we need to reset hourly count
    const hoursSinceReset =
      (now.getTime() - settings.lastResetHour.getTime()) / (1000 * 60 * 60)
    if (hoursSinceReset >= 1) {
      resetHour = true
    }

    // Check if we need to reset daily count
    const daysSinceReset =
      (now.getTime() - settings.lastResetDay.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceReset >= 1) {
      resetDay = true
    }

    // Reset counts if needed
    if (resetHour || resetDay) {
      await settingsCollection.updateOne(
        { orgId },
        {
          $set: {
            ...(resetHour && { currentHourCount: 0, lastResetHour: now }),
            ...(resetDay && { currentDayCount: 0, lastResetDay: now }),
          },
        }
      )

      return {
        canSend: true,
        hourlyRemaining: settings.maxEmailsPerHour,
        dailyRemaining: settings.maxEmailsPerDay,
      }
    }

    // Check if limits are exceeded
    const canSend =
      settings.currentHourCount < settings.maxEmailsPerHour &&
      settings.currentDayCount < settings.maxEmailsPerDay

    return {
      canSend,
      hourlyRemaining: settings.maxEmailsPerHour - settings.currentHourCount,
      dailyRemaining: settings.maxEmailsPerDay - settings.currentDayCount,
    }
  }

  /**
   * Increment rate limit counters
   */
  static async incrementRateLimits(orgId: string, count: number = 1): Promise<void> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    await settingsCollection.updateOne(
      { orgId },
      {
        $inc: {
          currentHourCount: count,
          currentDayCount: count,
        },
      }
    )
  }

  /**
   * Delete email settings (disables email notifications)
   */
  static async deleteSettings(orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const settingsCollection = db.collection<EmailSettings>(COLLECTIONS.EMAIL_SETTINGS)

    const result = await settingsCollection.deleteOne({ orgId })

    return result.deletedCount > 0
  }
}
