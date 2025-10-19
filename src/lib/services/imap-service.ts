import Imap from 'imap'
import { simpleParser, ParsedMail } from 'mailparser'
import { ImapConfig } from '@/lib/types'
import { decryptCredentials } from '@/lib/utils/email-encryption'

/**
 * Parsed Email Interface
 */
export interface ParsedEmail {
  messageId: string
  inReplyTo?: string
  from: {
    address: string
    name?: string
  }
  to: Array<{ address: string; name?: string }>
  subject: string
  text?: string
  html?: string
  date: Date
  attachments: Array<{
    filename: string
    contentType: string
    size: number
    content: Buffer
  }>
}

/**
 * IMAP Service
 * Handles connection to IMAP servers and fetching emails
 */
export class IMAPService {
  private config: ImapConfig
  private imap: Imap | null = null

  constructor(config: ImapConfig) {
    this.config = config
  }

  /**
   * Connect to IMAP server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Decrypt password
        const decrypted = decryptCredentials({
          smtpPassword: this.config.password, // Reuse same encryption key
        })

        // Create IMAP connection
        this.imap = new Imap({
          user: this.config.username,
          password: decrypted.smtpPassword!,
          host: this.config.host,
          port: this.config.port,
          tls: this.config.secure,
          tlsOptions: { rejectUnauthorized: false }, // For self-signed certs
        })

        // Handle connection events
        this.imap.once('ready', () => {
          console.log('✅ IMAP connection ready')
          resolve()
        })

        this.imap.once('error', (err: Error) => {
          console.error('❌ IMAP connection error:', err)
          reject(err)
        })

        this.imap.once('end', () => {
          console.log('📭 IMAP connection ended')
        })

        // Connect
        this.imap.connect()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Disconnect from IMAP server
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.imap) {
        this.imap.once('end', () => resolve())
        this.imap.end()
      } else {
        resolve()
      }
    })
  }

  /**
   * Fetch unread emails from INBOX
   */
  async fetchUnreadEmails(): Promise<ParsedEmail[]> {
    if (!this.imap) {
      throw new Error('IMAP not connected')
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err, box) => {
        if (err) {
          return reject(err)
        }

        // Search for unread emails
        this.imap!.search(['UNSEEN'], (searchErr, results) => {
          if (searchErr) {
            return reject(searchErr)
          }

          if (results.length === 0) {
            console.log('📬 No unread emails')
            return resolve([])
          }

          console.log(`📨 Found ${results.length} unread email(s)`)

          const emails: ParsedEmail[] = []
          const fetch = this.imap!.fetch(results, {
            bodies: '',
            markSeen: false, // Don't mark as read yet
          })

          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (parseErr, parsed: ParsedMail) => {
                if (parseErr) {
                  console.error('❌ Email parse error:', parseErr)
                  return
                }

                try {
                  const email = this.convertParsedMail(parsed)
                  emails.push(email)
                } catch (error) {
                  console.error('❌ Error converting email:', error)
                }
              })
            })

            msg.once('attributes', (attrs) => {
              // Store sequence number for later operations
              // (mark as read, delete, move)
            })

            msg.once('end', () => {
              // Message fully processed
            })
          })

          fetch.once('error', (fetchErr) => {
            console.error('❌ Fetch error:', fetchErr)
            reject(fetchErr)
          })

          fetch.once('end', () => {
            console.log(`✅ Fetched ${emails.length} email(s)`)
            resolve(emails)
          })
        })
      })
    })
  }

  /**
   * Mark email as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (!this.imap) {
      throw new Error('IMAP not connected')
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err, box) => {
        if (err) {
          return reject(err)
        }

        // Search for message by Message-ID header
        this.imap!.search([['HEADER', 'MESSAGE-ID', messageId]], (searchErr, results) => {
          if (searchErr) {
            return reject(searchErr)
          }

          if (results.length === 0) {
            return resolve() // Message not found (already processed?)
          }

          // Mark as seen
          this.imap!.addFlags(results, ['\\Seen'], (flagErr) => {
            if (flagErr) {
              return reject(flagErr)
            }
            console.log(`✅ Marked email ${messageId} as read`)
            resolve()
          })
        })
      })
    })
  }

  /**
   * Delete email
   */
  async deleteEmail(messageId: string): Promise<void> {
    if (!this.imap) {
      throw new Error('IMAP not connected')
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err, box) => {
        if (err) {
          return reject(err)
        }

        // Search for message by Message-ID header
        this.imap!.search([['HEADER', 'MESSAGE-ID', messageId]], (searchErr, results) => {
          if (searchErr) {
            return reject(searchErr)
          }

          if (results.length === 0) {
            return resolve() // Message not found
          }

          // Mark for deletion
          this.imap!.addFlags(results, ['\\Deleted'], (flagErr) => {
            if (flagErr) {
              return reject(flagErr)
            }

            // Expunge to permanently delete
            this.imap!.expunge((expungeErr) => {
              if (expungeErr) {
                return reject(expungeErr)
              }
              console.log(`🗑️ Deleted email ${messageId}`)
              resolve()
            })
          })
        })
      })
    })
  }

  /**
   * Move email to folder
   */
  async moveToFolder(messageId: string, folder: string): Promise<void> {
    if (!this.imap) {
      throw new Error('IMAP not connected')
    }

    return new Promise((resolve, reject) => {
      this.imap!.openBox('INBOX', false, (err, box) => {
        if (err) {
          return reject(err)
        }

        // Search for message by Message-ID header
        this.imap!.search([['HEADER', 'MESSAGE-ID', messageId]], (searchErr, results) => {
          if (searchErr) {
            return reject(searchErr)
          }

          if (results.length === 0) {
            return resolve() // Message not found
          }

          // Move to folder
          this.imap!.move(results, folder, (moveErr) => {
            if (moveErr) {
              return reject(moveErr)
            }
            console.log(`📂 Moved email ${messageId} to ${folder}`)
            resolve()
          })
        })
      })
    })
  }

  /**
   * Test IMAP connection
   */
  static async testConnection(config: ImapConfig): Promise<{
    success: boolean
    message: string
  }> {
    const service = new IMAPService(config)

    try {
      await service.connect()
      await service.disconnect()

      return {
        success: true,
        message: 'IMAP connection successful',
      }
    } catch (error: any) {
      console.error('IMAP connection test failed:', error)

      return {
        success: false,
        message: error.message || 'Failed to connect to IMAP server',
      }
    }
  }

  /**
   * Convert mailparser ParsedMail to our ParsedEmail format
   */
  private convertParsedMail(parsed: ParsedMail): ParsedEmail {
    return {
      messageId: parsed.messageId || `generated-${Date.now()}`,
      inReplyTo: parsed.inReplyTo as string | undefined,
      from: {
        address: parsed.from?.value[0]?.address || 'unknown@unknown.com',
        name: parsed.from?.value[0]?.name,
      },
      to: parsed.to?.value.map((addr) => ({
        address: addr.address || '',
        name: addr.name,
      })) || [],
      subject: parsed.subject || '(No Subject)',
      text: parsed.text,
      html: parsed.html as string | undefined,
      date: parsed.date || new Date(),
      attachments: parsed.attachments?.map((att) => ({
        filename: att.filename || 'unnamed',
        contentType: att.contentType,
        size: att.size,
        content: att.content,
      })) || [],
    }
  }
}
