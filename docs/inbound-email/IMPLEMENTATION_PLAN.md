# Inbound Email Integration - Implementation Plan

## 🎯 Overview

**Goal:** Enable ticket creation and updates via email, completing the email communication loop.

**What Users Can Do:**
- Send email to `support@company.com` → Creates ticket automatically
- Reply to ticket notification emails → Adds comment to ticket
- Attach files in emails → Files added to ticket
- Email gets auto-response with ticket number

**Estimated Effort:** 2-3 days
**Priority:** High (completes email system)

---

## 🏗️ Architecture

### **Data Flow**

```
Customer sends email
  ↓
IMAP Service polls mailbox (every 60 seconds)
  ↓
Email Parser extracts:
  - From address
  - Subject line
  - Body (HTML + plain text)
  - Attachments
  - In-Reply-To header (for replies)
  ↓
Check if email is a reply:
  - Extract ticket number from subject (#TKT-123)
  - Or match In-Reply-To header
  ↓
IF REPLY:
  - Add as comment to existing ticket
  - Notify assignee via outbound email
ELSE IF NEW:
  - Create new ticket
  - Apply auto-assignment rules
  - Send auto-reply to customer with ticket number
  ↓
Mark email as processed
Delete from mailbox (or move to processed folder)
```

---

## 🗄️ Database Schema

### **1. Email Accounts Collection** (`inbound_email_accounts`)

```typescript
interface InboundEmailAccount extends BaseEntity {
  orgId: string
  name: string // Display name: "Support Mailbox"
  email: string // support@company.com

  // IMAP Configuration
  imap: {
    host: string // imap.gmail.com
    port: number // 993
    secure: boolean // true for SSL
    username: string
    password: string // Encrypted
  }

  // Settings
  isActive: boolean
  pollingInterval: number // seconds (default: 60)
  deleteAfterProcessing: boolean // or move to folder
  processedFolder?: string // "Processed" or "Archive"

  // Auto-Assignment Rules
  defaultAssignee?: string // User ID
  autoAssignmentEnabled: boolean
  assignmentRules: {
    condition: 'subject_contains' | 'from_domain' | 'body_contains'
    value: string
    assignTo: string // User ID or team ID
  }[]

  // Stats
  lastPolledAt?: Date
  emailsProcessed: number
  ticketsCreated: number
  lastError?: string

  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### **2. Processed Emails Collection** (`processed_emails`)

```typescript
interface ProcessedEmail {
  _id: ObjectId
  orgId: string
  accountId: string // Reference to inbound_email_account

  // Email Data
  messageId: string // Email Message-ID header (unique)
  inReplyTo?: string // In-Reply-To header for threading
  from: string
  to: string[]
  subject: string
  bodyHtml?: string
  bodyText?: string

  // Processing Result
  action: 'ticket_created' | 'comment_added' | 'ignored' | 'error'
  ticketId?: string
  commentId?: string
  errorMessage?: string

  // Attachments
  attachments: {
    filename: string
    contentType: string
    size: number
    attachmentId?: string // MongoDB GridFS reference
  }[]

  // Metadata
  receivedAt: Date
  processedAt: Date
  processingTime: number // milliseconds
}
```

---

## 🔧 Components to Build

### **Backend Services**

#### **1. IMAP Service** (`src/lib/services/imap-service.ts`)

```typescript
class IMAPService {
  // Connect to IMAP server
  async connect(config: ImapConfig): Promise<ImapClient>

  // Fetch unread emails
  async fetchUnreadEmails(accountId: string): Promise<Email[]>

  // Mark email as read
  async markAsRead(messageId: string): Promise<void>

  // Delete email
  async deleteEmail(messageId: string): Promise<void>

  // Move email to folder
  async moveToFolder(messageId: string, folder: string): Promise<void>
}
```

**NPM Package:** `imap` or `node-imap` or `emailjs-imap-client`

#### **2. Email Parser Service** (`src/lib/services/email-parser.ts`)

```typescript
class EmailParser {
  // Parse email content
  parseEmail(rawEmail: any): ParsedEmail

  // Extract ticket number from subject
  extractTicketNumber(subject: string): string | null

  // Convert HTML to plain text
  htmlToText(html: string): string

  // Extract email signature
  removeSignature(body: string): string

  // Detect language
  detectLanguage(text: string): string
}
```

**NPM Packages:**
- `mailparser` for email parsing
- `html-to-text` for HTML conversion
- `turndown` for HTML to markdown

#### **3. Email-to-Ticket Service** (`src/lib/services/email-to-ticket.ts`)

```typescript
class EmailToTicketService {
  // Create ticket from email
  async createTicketFromEmail(
    email: ParsedEmail,
    accountId: string
  ): Promise<{ ticketId: string; ticketNumber: string }>

  // Add comment from email reply
  async addCommentFromEmail(
    email: ParsedEmail,
    ticketId: string
  ): Promise<{ commentId: string }>

  // Find or create requester
  async findOrCreateRequester(
    email: string,
    name?: string
  ): Promise<User>

  // Apply auto-assignment rules
  async applyAssignmentRules(
    email: ParsedEmail,
    account: InboundEmailAccount
  ): Promise<string | null> // Returns assignee ID

  // Send auto-reply
  async sendAutoReply(
    toEmail: string,
    ticketNumber: string
  ): Promise<void>
}
```

#### **4. Email Polling Worker** (`src/lib/workers/email-poller.ts`)

```typescript
class EmailPoller {
  // Start polling (called on server startup)
  start(): void

  // Stop polling
  stop(): void

  // Poll single account
  async pollAccount(account: InboundEmailAccount): Promise<void>

  // Process single email
  async processEmail(
    email: Email,
    account: InboundEmailAccount
  ): Promise<void>
}
```

This runs in the background (separate process or cron job)

---

### **API Routes**

#### **1. Email Account Management**

```
GET    /api/inbound-email/accounts        # List all email accounts
POST   /api/inbound-email/accounts        # Create email account
GET    /api/inbound-email/accounts/[id]   # Get account details
PUT    /api/inbound-email/accounts/[id]   # Update account
DELETE /api/inbound-email/accounts/[id]   # Delete account
POST   /api/inbound-email/accounts/[id]/test  # Test IMAP connection
```

#### **2. Email Processing**

```
POST   /api/inbound-email/poll             # Manually trigger poll (admin)
GET    /api/inbound-email/processed        # List processed emails
GET    /api/inbound-email/processed/[id]   # Get email details
POST   /api/inbound-email/reprocess/[id]   # Reprocess failed email
```

#### **3. Stats & Monitoring**

```
GET    /api/inbound-email/stats            # Processing stats
GET    /api/inbound-email/health           # Service health check
```

---

### **Frontend Pages**

#### **1. Email Accounts Management** (`/settings/inbound-email`)

**Features:**
- List all email accounts
- Add new email account (IMAP config)
- Test connection
- Enable/disable accounts
- View stats (emails processed, tickets created)
- Configure auto-assignment rules

**UI Components:**
- Account cards with stats
- IMAP configuration form (similar to SMTP we just built)
- Auto-assignment rules builder
- Test connection button

#### **2. Processed Emails Log** (`/settings/inbound-email/logs`)

**Features:**
- List all processed emails
- Filter by account, action, date
- View email content
- See which ticket was created
- Reprocess failed emails
- Search by sender or subject

**UI Components:**
- Data table with filtering
- Email detail modal
- Reprocess button for errors
- Link to created ticket

---

## 🔐 Security Considerations

### **Email Account Credentials**
- IMAP passwords encrypted with AES-256-GCM (same as SMTP)
- Never sent to browser (masked with `***********`)
- Decrypted only when connecting to IMAP server

### **Email Validation**
- Verify sender email before creating ticket
- Check for spam indicators
- Rate limiting (max tickets per email per hour)
- Blacklist/whitelist support

### **Attachment Security**
- Virus scanning (optional integration with ClamAV)
- File type restrictions
- Max file size limits
- Store in GridFS (like screenshots)

---

## 📋 Implementation Phases

### **Phase 1: Database & Types** (1-2 hours)
- [ ] Create TypeScript interfaces
- [ ] Add to `src/lib/types.ts`
- [ ] Update MongoDB collections enum
- [ ] Create database indexes

### **Phase 2: IMAP Service** (3-4 hours)
- [ ] Install dependencies (`imap`, `mailparser`)
- [ ] Create `IMAPService` class
- [ ] Implement connection handling
- [ ] Implement email fetching
- [ ] Add error handling and logging

### **Phase 3: Email Parser** (2-3 hours)
- [ ] Create `EmailParser` class
- [ ] Implement ticket number extraction
- [ ] HTML to text conversion
- [ ] Attachment handling
- [ ] Reply detection logic

### **Phase 4: Email-to-Ticket Service** (4-5 hours)
- [ ] Create `EmailToTicketService` class
- [ ] Implement ticket creation from email
- [ ] Implement comment creation from reply
- [ ] Auto-assignment rules engine
- [ ] Find/create requester logic
- [ ] Auto-reply sending

### **Phase 5: Polling Worker** (3-4 hours)
- [ ] Create `EmailPoller` class
- [ ] Implement polling loop
- [ ] Process emails sequentially
- [ ] Error handling and retry logic
- [ ] Mark emails as processed
- [ ] Integration with Next.js app lifecycle

### **Phase 6: API Routes** (3-4 hours)
- [ ] Email account CRUD endpoints
- [ ] Test connection endpoint
- [ ] Poll trigger endpoint (manual)
- [ ] Processed emails list endpoint
- [ ] Stats endpoint

### **Phase 7: Frontend - Account Management** (4-5 hours)
- [ ] Email accounts list page
- [ ] Add/edit email account form
- [ ] IMAP configuration UI
- [ ] Auto-assignment rules builder
- [ ] Test connection functionality
- [ ] Stats cards

### **Phase 8: Frontend - Email Logs** (3-4 hours)
- [ ] Processed emails list page
- [ ] Email detail modal
- [ ] Filtering and search
- [ ] Reprocess functionality
- [ ] Link to created tickets

### **Phase 9: Testing & Documentation** (3-4 hours)
- [ ] Test with Gmail IMAP
- [ ] Test with Outlook IMAP
- [ ] Test ticket creation
- [ ] Test reply detection
- [ ] Test attachments
- [ ] Test auto-assignment
- [ ] Write user guide
- [ ] Write API docs

---

## 🧪 Testing Checklist

### **IMAP Connection**
- [ ] Connects to Gmail successfully
- [ ] Connects to Outlook/Office 365 successfully
- [ ] Handles invalid credentials gracefully
- [ ] Handles network errors

### **Email Processing**
- [ ] Creates ticket from new email
- [ ] Extracts subject correctly
- [ ] Extracts body (HTML and text)
- [ ] Handles attachments
- [ ] Detects replies correctly
- [ ] Adds comments to existing tickets
- [ ] Ignores duplicates (same Message-ID)

### **Auto-Assignment**
- [ ] Assigns based on subject keywords
- [ ] Assigns based on sender domain
- [ ] Falls back to default assignee
- [ ] Handles no rules gracefully

### **Auto-Reply**
- [ ] Sends auto-reply for new tickets
- [ ] Includes correct ticket number
- [ ] Uses correct template
- [ ] Doesn't send for replies

### **Performance**
- [ ] Polls every 60 seconds
- [ ] Processes 10 emails in < 5 seconds
- [ ] Handles 100+ emails in queue
- [ ] Doesn't block app startup

---

## 📦 NPM Dependencies

```bash
npm install imap mailparser html-to-text turndown
npm install --save-dev @types/imap @types/mailparser
```

**Packages:**
- `imap` - IMAP client for Node.js
- `mailparser` - Parse emails (headers, body, attachments)
- `html-to-text` - Convert HTML emails to plain text
- `turndown` - Convert HTML to Markdown (optional)

---

## 🎨 UI Mockups

### **Email Accounts Page**

```
┌─ Inbound Email Settings ──────────────────────────┐
│ Configure email accounts for ticket creation      │
│                                                    │
│ [+ Add Email Account]                             │
│                                                    │
│ ┌─ Support Mailbox ──────────────────────┐        │
│ │ support@company.com                     │ ✅     │
│ │ Last polled: 2 minutes ago              │        │
│ │ Processed: 142 emails | Created: 89 tickets     │
│ │ [Edit] [Test] [Disable]                 │        │
│ └─────────────────────────────────────────┘        │
│                                                    │
│ ┌─ Sales Inquiries ──────────────────────┐        │
│ │ sales@company.com                       │ ⚠️     │
│ │ Last error: Invalid password            │        │
│ │ Processed: 23 emails | Created: 18 tickets      │
│ │ [Edit] [Test] [Enable]                  │        │
│ └─────────────────────────────────────────┘        │
└────────────────────────────────────────────────────┘
```

### **Add Email Account Form**

```
┌─ Add Email Account ────────────────────────────────┐
│                                                     │
│ Account Name *                                      │
│ [Support Mailbox________________]                   │
│                                                     │
│ Email Address *                                     │
│ [support@company.com____________]                   │
│                                                     │
│ ┌─ IMAP Configuration ────────────────────┐        │
│ │ Host *         Port *    SSL/TLS        │        │
│ │ [imap.gmail.com] [993]   ☑ Enabled      │        │
│ │                                         │        │
│ │ Username *                              │        │
│ │ [support@company.com___]                │        │
│ │                                         │        │
│ │ Password *                              │        │
│ │ [••••••••••••] 👁                       │        │
│ └─────────────────────────────────────────┘        │
│                                                     │
│ Polling Interval (seconds)                          │
│ [60__] (Default: 60)                                │
│                                                     │
│ After Processing:                                   │
│ ○ Delete email                                      │
│ ● Move to folder: [Processed_]                      │
│                                                     │
│ Default Assignee                                    │
│ [John Doe ▼]                                        │
│                                                     │
│ [Test Connection] [Cancel] [Save]                   │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment Notes

### **Running the Poller**

**Option 1: Next.js App Lifecycle** (Simple)
```typescript
// src/app/api/cron/email-poller/route.ts
// Call this endpoint every minute via external cron (Vercel Cron, etc.)
export async function GET() {
  await EmailPoller.pollAllAccounts()
  return NextResponse.json({ success: true })
}
```

**Option 2: Separate Process** (Recommended)
```typescript
// src/workers/email-poller.ts
// Run as: node workers/email-poller.js
while (true) {
  await EmailPoller.pollAllAccounts()
  await sleep(60000) // 60 seconds
}
```

**Option 3: Vercel Cron Jobs** (Serverless)
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/email-poller",
    "schedule": "*/1 * * * *" // Every minute
  }]
}
```

### **Environment Variables**

No new `.env` variables needed! Credentials stored in database (encrypted).

---

## 📊 Success Metrics

**Functional:**
- Email-to-ticket conversion works 100% of time
- Reply detection accuracy > 95%
- Auto-reply sent within 5 seconds
- Attachments preserved correctly

**Performance:**
- Poll cycle completes in < 10 seconds
- Email processed in < 2 seconds each
- No memory leaks after 1000 emails
- CPU usage < 5% when idle

**User Experience:**
- Setup takes < 5 minutes
- Test connection provides clear feedback
- Email logs are easy to search
- Failed emails can be reprocessed

---

## 🎯 MVP Scope (Minimum Viable Product)

To get this working quickly, we'll focus on:

**✅ Include in MVP:**
- IMAP polling (Gmail + Outlook support)
- Create ticket from new email
- Add comment from reply email
- Basic auto-assignment (default assignee only)
- Simple auto-reply
- Email account configuration UI
- Email logs page

**❌ Defer to Later:**
- Advanced assignment rules (complex conditions)
- Email templates for auto-replies
- Spam filtering
- Virus scanning
- Webhook receiving (instead of IMAP)
- Multi-language support

---

**Ready to start implementation?** ✅

**Estimated Total Time:** 20-25 hours (2-3 days)
**Files to Create:** ~15
**Lines of Code:** ~3,000
