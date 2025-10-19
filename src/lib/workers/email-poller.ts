import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { InboundEmailAccount, ProcessedEmail } from '@/lib/types'
import { IMAPService, ParsedEmail } from '@/lib/services/imap-service'
import { EmailToTicketService } from '@/lib/services/email-to-ticket'

/**
 * Email Polling Worker
 * Background worker that polls IMAP accounts for new emails
 */
export class EmailPoller {
  private isRunning = false
  private pollIntervals: Map<string, NodeJS.Timeout> = new Map()
  private emailToTicketService: EmailToTicketService

  constructor() {
    this.emailToTicketService = new EmailToTicketService()
  }

  /**
   * Start polling all active email accounts
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Email poller already running')
      return
    }

    this.isRunning = true
    console.log('🚀 Starting email poller...')

    // Poll all active accounts once immediately
    await this.pollAllAccounts()

    // Set up polling intervals for each account
    await this.setupPollingIntervals()

    console.log('✅ Email poller started')
  }

  /**
   * Stop polling
   */
  stop(): void {
    console.log('🛑 Stopping email poller...')

    this.isRunning = false

    // Clear all polling intervals
    for (const [accountId, interval] of this.pollIntervals.entries()) {
      clearInterval(interval)
      console.log(`  ✓ Stopped polling account ${accountId}`)
    }

    this.pollIntervals.clear()

    console.log('✅ Email poller stopped')
  }

  /**
   * Poll all active email accounts once
   */
  async pollAllAccounts(): Promise<void> {
    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    // Get all active accounts
    const accounts = await accountsCollection
      .find({ isActive: true })
      .toArray()

    if (accounts.length === 0) {
      console.log('📭 No active email accounts found')
      return
    }

    console.log(`📬 Polling ${accounts.length} email account(s)...`)

    // Poll each account
    for (const account of accounts) {
      try {
        await this.pollAccount(account)
      } catch (error) {
        console.error(`❌ Error polling account ${account.email}:`, error)
      }
    }
  }

  /**
   * Poll a single email account
   */
  async pollAccount(account: InboundEmailAccount): Promise<void> {
    const startTime = Date.now()
    console.log(`📨 Polling ${account.email} (${account.name})...`)

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    try {
      // Connect to IMAP
      const imapService = new IMAPService(account.imap)
      await imapService.connect()

      // Fetch unread emails
      const emails = await imapService.fetchUnreadEmails()

      if (emails.length === 0) {
        console.log(`  ✓ No new emails`)
      } else {
        console.log(`  📧 Found ${emails.length} new email(s)`)

        // Process each email
        for (const email of emails) {
          await this.processEmail(email, account, imapService)
        }
      }

      // Disconnect
      await imapService.disconnect()

      // Update last polled timestamp
      await accountsCollection.updateOne(
        { _id: account._id },
        {
          $set: {
            lastPolledAt: new Date(),
            lastError: undefined, // Clear any previous errors
          },
        }
      )

      const duration = Date.now() - startTime
      console.log(`  ✅ Polling complete (${duration}ms)`)
    } catch (error: any) {
      console.error(`  ❌ Polling error:`, error)

      // Update last error
      await accountsCollection.updateOne(
        { _id: account._id },
        {
          $set: {
            lastError: error.message,
            lastPolledAt: new Date(),
          },
        }
      )
    }
  }

  /**
   * Process a single email
   */
  private async processEmail(
    email: ParsedEmail,
    account: InboundEmailAccount,
    imapService: IMAPService
  ): Promise<void> {
    const startTime = Date.now()
    console.log(`    📩 Processing: ${email.subject}`)

    const db = await getDatabase()
    const processedCollection = db.collection<ProcessedEmail>(COLLECTIONS.PROCESSED_EMAILS)
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    try {
      // Check if already processed (by Message-ID)
      const existing = await processedCollection.findOne({
        orgId: account.orgId,
        messageId: email.messageId,
      })

      if (existing) {
        console.log(`    ⏭️ Already processed (duplicate)`)
        return
      }

      // Process email (create ticket or add comment)
      const result = await this.emailToTicketService.processEmail(email, account)

      const processingTime = Date.now() - startTime

      // Log processed email
      const processedEmail: Omit<ProcessedEmail, '_id'> = {
        orgId: account.orgId,
        accountId: account._id.toString(),
        messageId: email.messageId,
        inReplyTo: email.inReplyTo,
        from: email.from.address,
        to: email.to.map((t) => t.address),
        subject: email.subject,
        bodyHtml: email.html,
        bodyText: email.text,
        action: result.action,
        ticketId: result.ticketId,
        commentId: result.commentId,
        errorMessage: result.errorMessage,
        attachments: email.attachments.map((att) => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
        })),
        receivedAt: email.date,
        processedAt: new Date(),
        processingTime,
      }

      await processedCollection.insertOne(processedEmail as ProcessedEmail)

      // Update account stats
      const updateFields: any = {
        emailsProcessed: (account.emailsProcessed || 0) + 1,
      }

      if (result.action === 'ticket_created') {
        updateFields.ticketsCreated = (account.ticketsCreated || 0) + 1
      }

      await accountsCollection.updateOne({ _id: account._id }, { $set: updateFields })

      // Mark email as processed (or delete/move)
      if (account.deleteAfterProcessing) {
        await imapService.deleteEmail(email.messageId)
        console.log(`    🗑️ Deleted from mailbox`)
      } else if (account.processedFolder) {
        await imapService.moveToFolder(email.messageId, account.processedFolder)
        console.log(`    📂 Moved to ${account.processedFolder}`)
      } else {
        await imapService.markAsRead(email.messageId)
        console.log(`    ✅ Marked as read`)
      }

      console.log(`    ✅ ${result.action} (${processingTime}ms)`)

      if (result.ticketNumber) {
        console.log(`       Ticket: ${result.ticketNumber}`)
      }
    } catch (error: any) {
      console.error(`    ❌ Processing error:`, error)

      // Log failed processing
      const processingTime = Date.now() - startTime

      await processedCollection.insertOne({
        orgId: account.orgId,
        accountId: account._id.toString(),
        messageId: email.messageId,
        inReplyTo: email.inReplyTo,
        from: email.from.address,
        to: email.to.map((t) => t.address),
        subject: email.subject,
        bodyHtml: email.html,
        bodyText: email.text,
        action: 'error',
        errorMessage: error.message,
        attachments: [],
        receivedAt: email.date,
        processedAt: new Date(),
        processingTime,
      } as ProcessedEmail)

      // Don't mark as read if processing failed
      // This allows for manual retry later
    }
  }

  /**
   * Set up polling intervals for all active accounts
   */
  private async setupPollingIntervals(): Promise<void> {
    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    const accounts = await accountsCollection.find({ isActive: true }).toArray()

    for (const account of accounts) {
      const intervalMs = (account.pollingInterval || 60) * 1000

      // Clear existing interval if any
      const existingInterval = this.pollIntervals.get(account._id.toString())
      if (existingInterval) {
        clearInterval(existingInterval)
      }

      // Set up new interval
      const interval = setInterval(async () => {
        try {
          await this.pollAccount(account)
        } catch (error) {
          console.error(`❌ Interval polling error for ${account.email}:`, error)
        }
      }, intervalMs)

      this.pollIntervals.set(account._id.toString(), interval)

      console.log(
        `  ✓ Polling ${account.email} every ${account.pollingInterval || 60} seconds`
      )
    }
  }

  /**
   * Reload polling intervals (call after account settings change)
   */
  async reloadPollingIntervals(): Promise<void> {
    console.log('🔄 Reloading polling intervals...')

    // Clear existing intervals
    for (const interval of this.pollIntervals.values()) {
      clearInterval(interval)
    }
    this.pollIntervals.clear()

    // Set up new intervals
    await this.setupPollingIntervals()

    console.log('✅ Polling intervals reloaded')
  }
}

// Singleton instance
let pollerInstance: EmailPoller | null = null

/**
 * Get or create email poller singleton
 */
export function getEmailPoller(): EmailPoller {
  if (!pollerInstance) {
    pollerInstance = new EmailPoller()
  }
  return pollerInstance
}
