import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  InboundEmailAccount,
  User,
  Ticket,
  TicketComment,
  EmailAssignmentRule,
  NotificationEvent,
} from '@/lib/types'
import { ParsedEmail } from './imap-service'
import { EmailParser } from './email-parser'
import { EmailService } from './email-service'
import { EmailSettingsService } from './email-settings'
import { NotificationEngine } from './notification-engine'

/**
 * Email-to-Ticket Service
 * Handles creation of tickets and comments from inbound emails
 */
export class EmailToTicketService {
  private parser: EmailParser

  constructor() {
    this.parser = new EmailParser()
  }

  /**
   * Process an email (create ticket or add comment)
   */
  async processEmail(
    email: ParsedEmail,
    account: InboundEmailAccount
  ): Promise<{
    action: 'ticket_created' | 'comment_added' | 'ignored' | 'error'
    ticketId?: string
    ticketNumber?: string
    commentId?: string
    errorMessage?: string
  }> {
    try {
      // Parse email
      const parsed = this.parser.parseForTicket(email)

      // Check if should ignore
      if (parsed.shouldIgnore) {
        console.log(`📭 Ignoring email: ${parsed.ignoreReason}`)
        return {
          action: 'ignored',
        }
      }

      // Check if reply or new ticket
      if (parsed.isReply && parsed.ticketNumber) {
        // Add comment to existing ticket
        return await this.addCommentFromEmail(
          email,
          parsed.ticketNumber,
          account.orgId,
          parsed
        )
      } else {
        // Create new ticket
        return await this.createTicketFromEmail(email, account, parsed)
      }
    } catch (error: any) {
      console.error('❌ Error processing email:', error)
      return {
        action: 'error',
        errorMessage: error.message,
      }
    }
  }

  /**
   * Create a new ticket from email
   */
  private async createTicketFromEmail(
    email: ParsedEmail,
    account: InboundEmailAccount,
    parsed: ReturnType<typeof EmailParser.prototype.parseForTicket>
  ): Promise<{
    action: 'ticket_created'
    ticketId: string
    ticketNumber: string
  }> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Find or create requester
    const requester = await this.findOrCreateRequester(
      account.orgId,
      parsed.senderEmail,
      parsed.senderName
    )

    // Apply auto-assignment rules
    const assignedTo = await this.applyAssignmentRules(email, account, parsed)

    // Generate ticket number
    const ticketNumber = await this.generateTicketNumber(account.orgId)

    // Create ticket
    const now = new Date()
    const ticket: Omit<Ticket, '_id'> = {
      orgId: account.orgId,
      ticketNumber,
      title: parsed.title,
      description: parsed.body,
      status: 'new',
      priority: 'medium', // Default priority
      category: 'Email', // Default category
      assignedTo,
      requesterId: requester._id.toString(),
      tags: ['email'],
      linkedAssets: [],
      attachments: [], // Will be added separately if needed
      createdBy: requester._id.toString(),
      createdAt: now,
      updatedAt: now,
    }

    const result = await ticketsCollection.insertOne(ticket as Ticket)
    const ticketId = result.insertedId.toString()

    console.log(`✅ Created ticket ${ticketNumber} from email`)

    // Send auto-reply to requester
    await this.sendAutoReply(
      parsed.senderEmail,
      ticketNumber,
      account.orgId
    )

    // Trigger notifications (assignee, watchers, etc.)
    await NotificationEngine.triggerNotification(
      account.orgId,
      NotificationEvent.TICKET_CREATED,
      {
        ticketId,
        ticketNumber,
        title: parsed.title,
        requesterId: requester._id.toString(),
        assignedTo,
        priority: 'medium',
        category: 'Email',
      },
      requester._id.toString()
    )

    return {
      action: 'ticket_created',
      ticketId,
      ticketNumber,
    }
  }

  /**
   * Add comment to existing ticket from email reply
   */
  private async addCommentFromEmail(
    email: ParsedEmail,
    ticketNumber: string,
    orgId: string,
    parsed: ReturnType<typeof EmailParser.prototype.parseForTicket>
  ): Promise<{
    action: 'comment_added' | 'error'
    ticketId?: string
    commentId?: string
    errorMessage?: string
  }> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
    const commentsCollection = db.collection<TicketComment>(COLLECTIONS.TICKET_COMMENTS)

    // Find ticket by number
    const ticket = await ticketsCollection.findOne({
      orgId,
      ticketNumber,
    })

    if (!ticket) {
      console.error(`❌ Ticket ${ticketNumber} not found`)
      return {
        action: 'error',
        errorMessage: `Ticket ${ticketNumber} not found`,
      }
    }

    // Find or create requester
    const requester = await this.findOrCreateRequester(
      orgId,
      parsed.senderEmail,
      parsed.senderName
    )

    // Create comment
    const now = new Date()
    const comment: Omit<TicketComment, '_id'> = {
      orgId,
      ticketId: ticket._id.toString(),
      text: parsed.body,
      userId: requester._id.toString(),
      isInternal: false,
      isCustomerReply: true,
      createdAt: now,
      updatedAt: now,
    }

    const result = await commentsCollection.insertOne(comment as TicketComment)
    const commentId = result.insertedId.toString()

    // Update ticket's updatedAt timestamp
    await ticketsCollection.updateOne(
      { _id: ticket._id },
      { $set: { updatedAt: now } }
    )

    console.log(`✅ Added comment to ticket ${ticketNumber}`)

    // Trigger notification (assignee, watchers, etc.)
    await NotificationEngine.triggerNotification(
      orgId,
      NotificationEvent.TICKET_COMMENT_ADDED,
      {
        ticketId: ticket._id.toString(),
        ticketNumber,
        title: ticket.title,
        commentText: parsed.body,
        commentedBy: requester._id.toString(),
        assignedTo: ticket.assignedTo,
      },
      requester._id.toString()
    )

    return {
      action: 'comment_added',
      ticketId: ticket._id.toString(),
      commentId,
    }
  }

  /**
   * Find or create requester user
   */
  private async findOrCreateRequester(
    orgId: string,
    email: string,
    name?: string
  ): Promise<User> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    // Try to find existing user by email
    let user = await usersCollection.findOne({ orgId, email })

    if (user) {
      return user
    }

    // Create new user (external requester)
    const [firstName, ...lastNameParts] = (name || email.split('@')[0]).split(' ')
    const lastName = lastNameParts.join(' ') || ''

    const now = new Date()
    const newUser: Omit<User, '_id'> = {
      orgId,
      email,
      password: '', // No password for external users
      firstName,
      lastName,
      role: 'user',
      isActive: true,
      createdBy: 'system',
      createdAt: now,
      updatedAt: now,
    }

    const result = await usersCollection.insertOne(newUser as User)

    console.log(`✅ Created new user: ${email}`)

    return {
      ...newUser,
      _id: result.insertedId,
    } as User
  }

  /**
   * Apply auto-assignment rules
   */
  private async applyAssignmentRules(
    email: ParsedEmail,
    account: InboundEmailAccount,
    parsed: ReturnType<typeof EmailParser.prototype.parseForTicket>
  ): Promise<string | undefined> {
    if (!account.autoAssignmentEnabled) {
      return account.defaultAssignee
    }

    // Check each rule in order
    for (const rule of account.assignmentRules) {
      if (this.ruleMatches(rule, email, parsed)) {
        console.log(`✅ Matched assignment rule: ${rule.condition} = ${rule.value}`)
        return rule.assignTo
      }
    }

    // Fallback to default assignee
    return account.defaultAssignee
  }

  /**
   * Check if assignment rule matches email
   */
  private ruleMatches(
    rule: EmailAssignmentRule,
    email: ParsedEmail,
    parsed: ReturnType<typeof EmailParser.prototype.parseForTicket>
  ): boolean {
    const value = rule.value.toLowerCase()

    switch (rule.condition) {
      case 'subject_contains':
        return email.subject.toLowerCase().includes(value)

      case 'from_domain':
        const domain = email.from.address.split('@')[1]
        return domain.toLowerCase() === value

      case 'body_contains':
        return parsed.body.toLowerCase().includes(value)

      default:
        return false
    }
  }

  /**
   * Send auto-reply to requester
   */
  private async sendAutoReply(
    toEmail: string,
    ticketNumber: string,
    orgId: string
  ): Promise<void> {
    try {
      const emailSettings = await EmailSettingsService.getSettings(orgId, true)

      if (!emailSettings || !emailSettings.isEnabled) {
        console.log('📭 Email settings not configured, skipping auto-reply')
        return
      }

      const emailService = new EmailService(emailSettings)

      const subject = `Ticket ${ticketNumber} has been created`
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Thank you for contacting us</h2>
          <p>Your support request has been received and assigned ticket number <strong>${ticketNumber}</strong>.</p>
          <p>We'll review your request and respond as soon as possible.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Please reference ticket number ${ticketNumber} in any future correspondence.
          </p>
        </div>
      `

      await emailService.sendEmail(
        toEmail,
        subject,
        htmlBody,
        undefined, // textBody
        undefined, // cc
        undefined, // bcc
        emailSettings.replyToEmail
      )

      console.log(`✅ Sent auto-reply to ${toEmail}`)
    } catch (error) {
      console.error('❌ Failed to send auto-reply:', error)
      // Don't throw - auto-reply failure should not block ticket creation
    }
  }

  /**
   * Generate next ticket number for organization
   */
  private async generateTicketNumber(orgId: string): Promise<string> {
    const db = await getDatabase()
    const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

    // Get highest ticket number
    const lastTicket = await ticketsCollection
      .find({ orgId })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    let nextNumber = 1
    if (lastTicket.length > 0) {
      const lastNumber = parseInt(lastTicket[0].ticketNumber.replace('TKT-', ''))
      nextNumber = lastNumber + 1
    }

    return `TKT-${nextNumber.toString().padStart(5, '0')}`
  }
}
