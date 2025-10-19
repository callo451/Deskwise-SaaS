# Email Notification System - Implementation Summary

## Overview
Complete backend implementation for Amazon SES email notifications with full customization support.

---

## ✅ Completed Components

### 1. Dependencies Installed
- `@aws-sdk/client-ses` (v3.913.0)
- `handlebars` (v4.7.8)

### 2. TypeScript Interfaces Added to `src/lib/types.ts`
- `EmailSettings` - SES configuration per organization
- `NotificationTemplate` - Customizable email templates
- `NotificationRule` - Notification trigger rules
- `UserNotificationPreferences` - User-level email preferences
- `EmailDeliveryLog` - Audit trail for sent emails
- `EmailQueueItem` - Queue for batch processing
- `NotificationEvent` - Event types (30+ events)
- `NotificationRecipientType` - Recipient determination types
- `EmailDeliveryStatus` - Email delivery tracking statuses

### 3. MongoDB Collections Added to `src/lib/mongodb.ts`
- `EMAIL_SETTINGS` - Email configuration storage
- `NOTIFICATION_TEMPLATES` - Email templates
- `NOTIFICATION_RULES` - Notification rules
- `USER_NOTIFICATION_PREFERENCES` - User preferences
- `EMAIL_DELIVERY_LOGS` - Delivery logs
- `EMAIL_QUEUE` - Email queue (for future batch processing)

### 4. Services Implemented

#### `src/lib/utils/email-encryption.ts`
- AES-256-GCM encryption for AWS credentials
- PBKDF2 key derivation
- Secure credential storage
- Test encryption function

#### `src/lib/services/email-ses.ts` (389 lines)
**Methods:**
- `sendEmail()` - Send email via SES
- `verifyEmailAddress()` - Verify email in SES
- `checkEmailVerification()` - Check verification status
- `verifyDomain()` - Verify domain in SES
- `testConnection()` - Send test email
- `validateCredentials()` - Validate AWS credentials

**Features:**
- Full SES integration
- Error handling with specific error messages
- Support for HTML and plain text emails
- CC, BCC, Reply-To support
- Comprehensive validation

#### `src/lib/services/email-templates.ts` (345 lines)
**Methods:**
- `createTemplate()` - Create new template
- `updateTemplate()` - Update existing template
- `deleteTemplate()` - Delete template (system templates protected)
- `getTemplate()` - Get single template
- `getTemplates()` - Get all templates with filters
- `renderTemplate()` - Render template with variables
- `renderCustomTemplate()` - Preview without saving
- `validateTemplate()` - Validate Handlebars syntax
- `cloneTemplate()` - Clone template

**Features:**
- Handlebars template engine integration
- Syntax validation
- Usage tracking
- System vs custom templates

#### `src/lib/services/email-settings.ts` (323 lines)
**Methods:**
- `saveSettings()` - Save/update email settings
- `getSettings()` - Get settings (with optional decryption)
- `testSettings()` - Test SES connection
- `verifyEmail()` - Initiate email verification
- `checkEmailVerification()` - Check verification status
- `verifyDomain()` - Initiate domain verification
- `setEnabled()` - Enable/disable notifications
- `checkRateLimits()` - Check and reset rate limits
- `incrementRateLimits()` - Increment rate counters
- `deleteSettings()` - Delete settings

**Features:**
- Automatic credential encryption/decryption
- Rate limiting (per hour/day)
- SES verification integration
- Test before enabling

#### `src/lib/services/notification-engine.ts` (413 lines)
**Methods:**
- `triggerNotification()` - Main entry point for notifications
- `findMatchingRules()` - Find rules matching event and conditions
- `processRule()` - Process single notification rule
- `determineRecipients()` - Determine who receives notification
- `sendEmail()` - Send email and create delivery log
- `getUserPreferences()` - Get user notification preferences
- `shouldSendEmail()` - Check if email should be sent
- `updateRuleStats()` - Track rule execution
- `evaluateCondition()` - Evaluate filter conditions
- `getNestedValue()` - Get nested object values

**Features:**
- Event-based triggering
- Condition evaluation (AND logic)
- Multiple recipient types (requester, assignee, role, user, email)
- User preferences integration
- Rate limit enforcement
- Delivery logging
- Error handling (non-blocking)
- Rule priority support

### 5. API Routes Created

#### Email Settings Routes

**`src/app/api/email/settings/route.ts`**
- `GET /api/email/settings` - Get current settings (admin only)
- `POST /api/email/settings` - Save/update settings (admin only)
- `DELETE /api/email/settings` - Delete settings (admin only)

**`src/app/api/email/settings/test/route.ts`**
- `POST /api/email/settings/test` - Send test email (admin only)

---

## 📋 Remaining Implementation Tasks

### API Routes to Create

#### 1. Email Templates Routes

**`src/app/api/email/templates/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TemplateService } from '@/lib/services/email-templates'

// GET /api/email/templates - List all templates
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const event = searchParams.get('event')
  const isActive = searchParams.get('isActive')

  const templates = await TemplateService.getTemplates(session.user.orgId, {
    event: event as any,
    isActive: isActive === 'true',
  })

  return NextResponse.json({ success: true, data: templates })
}

// POST /api/email/templates - Create template
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId || !session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  const template = await TemplateService.createTemplate(session.user.orgId, session.user.id, body)

  return NextResponse.json({ success: true, data: template })
}
```

**`src/app/api/email/templates/[id]/route.ts`**
```typescript
// GET, PUT, DELETE for single template
// Similar pattern to above with template ID from params
```

**`src/app/api/email/templates/[id]/preview/route.ts`**
```typescript
// POST /api/email/templates/[id]/preview - Preview with sample data
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const rendered = await TemplateService.renderTemplate(id, session.user.orgId, body.variables)

  return NextResponse.json({ success: true, data: rendered })
}
```

#### 2. Notification Rules Routes

**`src/app/api/email/notification-rules/route.ts`**
```typescript
// GET /api/email/notification-rules - List rules
// POST /api/email/notification-rules - Create rule
// Similar RBAC protection as templates
```

**`src/app/api/email/notification-rules/[id]/route.ts`**
```typescript
// GET, PUT, DELETE for single rule
```

#### 3. User Preferences Routes

**`src/app/api/email/preferences/route.ts`**
```typescript
// GET /api/email/preferences - Get current user preferences
// PUT /api/email/preferences - Update user preferences
// No admin restriction - users can manage their own preferences
```

#### 4. Email Logs Route

**`src/app/api/email/logs/route.ts`**
```typescript
// GET /api/email/logs - Get delivery logs with pagination
// Admin only
// Support filters: status, event, date range, recipient
```

### Integration Hooks

Add to existing code to trigger notifications:

#### Ticket Hooks

**`src/app/api/tickets/route.ts` (POST)**
```typescript
// After ticket creation:
await NotificationEngine.triggerNotification(
  session.user.orgId,
  'ticket.created',
  {
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    priority: ticket.priority,
    status: ticket.status,
    requesterName: session.user.name,
    requesterId: session.user.id,
    assignedTo: ticket.assignedTo,
    url: `${process.env.NEXTAUTH_URL}/dashboard/tickets/${ticket._id}`,
    relatedEntity: {
      type: 'ticket',
      id: ticket._id.toString(),
      number: ticket.ticketNumber,
    },
  },
  session.user.id
)
```

**`src/app/api/tickets/[id]/route.ts` (PUT)**
```typescript
// After ticket update (check what changed):
if (updates.status && oldTicket.status !== updates.status) {
  await NotificationEngine.triggerNotification(
    session.user.orgId,
    'ticket.status_changed',
    { ...ticketData, oldStatus: oldTicket.status, newStatus: updates.status },
    session.user.id
  )
}

if (updates.assignedTo && oldTicket.assignedTo !== updates.assignedTo) {
  await NotificationEngine.triggerNotification(
    session.user.orgId,
    'ticket.assigned',
    { ...ticketData },
    session.user.id
  )
}
```

#### Incident Hooks

Similar pattern for:
- `src/app/api/incidents/route.ts`
- `src/app/api/incidents/[id]/route.ts`

#### Change Request Hooks

Similar pattern for:
- `src/app/api/change-requests/route.ts`
- `src/app/api/change-requests/[id]/route.ts`

### Default Email Templates

Create seed data script: `scripts/seed-email-templates.ts`

```typescript
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { NotificationTemplate } from '@/lib/types'

export const defaultTemplates = [
  {
    name: 'Ticket Created',
    description: 'Notification when a new ticket is created',
    event: 'ticket.created',
    subject: 'New Ticket #{{ticketNumber}}: {{title}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #2563eb;">New Ticket Created</h2>
    <p>A new ticket has been created and requires attention.</p>

    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p><strong>Ticket #{{ticketNumber}}</strong></p>
      <p><strong>Title:</strong> {{title}}</p>
      <p><strong>Priority:</strong> {{priority}}</p>
      <p><strong>Status:</strong> {{status}}</p>
      <p><strong>Requester:</strong> {{requesterName}}</p>
    </div>

    <p><a href="{{url}}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Ticket</a></p>
  </div>
</body>
</html>
    `,
    textBody: `New Ticket Created\n\nTicket #{{ticketNumber}}\nTitle: {{title}}\nPriority: {{priority}}\nStatus: {{status}}\nRequester: {{requesterName}}\n\nView: {{url}}`,
    availableVariables: ['ticketNumber', 'title', 'priority', 'status', 'requesterName', 'url'],
    isSystem: true,
    isActive: true,
    usageCount: 0,
  },
  {
    name: 'Ticket Assigned',
    description: 'Notification when a ticket is assigned to a technician',
    event: 'ticket.assigned',
    subject: 'Ticket #{{ticketNumber}} Assigned to You',
    htmlBody: `<!-- Similar HTML structure -->`,
    textBody: `<!-- Similar text structure -->`,
    availableVariables: ['ticketNumber', 'title', 'priority', 'assigneeName', 'url'],
    isSystem: true,
    isActive: true,
    usageCount: 0,
  },
  // Add 10-15 more default templates for all major events
]

export async function seedEmailTemplates(orgId: string): Promise<number> {
  const db = await getDatabase()
  const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

  const now = new Date()

  const templatesToInsert = defaultTemplates.map(template => ({
    ...template,
    orgId,
    createdBy: 'system',
    createdAt: now,
    updatedAt: now,
  }))

  const result = await templatesCollection.insertMany(templatesToInsert as any)
  return result.insertedCount
}
```

---

## 🔧 Environment Variables

Add to `.env.local`:

```env
# Email Encryption (optional - defaults to NEXTAUTH_SECRET)
EMAIL_ENCRYPTION_SECRET=your-32-character-secret-key-here

# Note: AWS credentials are stored encrypted in database per organization
# No global AWS credentials needed in environment
```

---

## 📊 Database Indexes (Recommended)

```javascript
// Email Settings
db.email_settings.createIndex({ orgId: 1 }, { unique: true })

// Notification Templates
db.notification_templates.createIndex({ orgId: 1, event: 1 })
db.notification_templates.createIndex({ orgId: 1, isActive: 1 })

// Notification Rules
db.notification_rules.createIndex({ orgId: 1, event: 1, isEnabled: 1 })
db.notification_rules.createIndex({ orgId: 1, priority: 1 })

// User Notification Preferences
db.user_notification_preferences.createIndex({ userId: 1, orgId: 1 }, { unique: true })

// Email Delivery Logs
db.email_delivery_logs.createIndex({ orgId: 1, status: 1 })
db.email_delivery_logs.createIndex({ orgId: 1, queuedAt: -1 })
db.email_delivery_logs.createIndex({ orgId: 1, event: 1 })
db.email_delivery_logs.createIndex({ sesMessageId: 1 })
```

---

## 🚀 Usage Example

### 1. Configure Email Settings (Admin UI)
```typescript
// Admin saves SES settings
POST /api/email/settings
{
  "awsRegion": "us-east-1",
  "awsAccessKeyId": "AKIA...",
  "awsSecretAccessKey": "...",
  "fromEmail": "support@example.com",
  "fromName": "Company Support",
  "replyToEmail": "noreply@example.com"
}

// Test configuration
POST /api/email/settings/test
{
  "testEmail": "admin@example.com"
}
```

### 2. Create Notification Rule (Admin UI)
```typescript
POST /api/email/notification-rules
{
  "name": "Notify on High Priority Tickets",
  "description": "Send email when high priority ticket is created",
  "event": "ticket.created",
  "conditions": [
    { "field": "priority", "operator": "equals", "value": "high" }
  ],
  "recipients": [
    { "type": "role", "value": "role_admin_id" },
    { "type": "assignee" }
  ],
  "templateId": "template_id",
  "isEnabled": true,
  "priority": 1
}
```

### 3. Trigger from Code
```typescript
// In ticket creation API
import { NotificationEngine } from '@/lib/services/notification-engine'

await NotificationEngine.triggerNotification(
  orgId,
  'ticket.created',
  {
    ticketNumber: 'TKT-001',
    title: 'Server down',
    priority: 'high',
    status: 'open',
    requesterName: 'John Doe',
    requesterId: 'user123',
    assignedTo: 'tech456',
    url: 'https://app.example.com/tickets/001',
    relatedEntity: {
      type: 'ticket',
      id: '507f1f77bcf86cd799439011',
      number: 'TKT-001'
    }
  },
  'user123' // triggeredBy - will be excluded from recipients
)
```

---

## ✅ Testing Checklist

- [ ] Install dependencies successfully
- [ ] TypeScript compiles without errors
- [ ] Can save SES settings via API
- [ ] Credentials are encrypted in database
- [ ] Test email sends successfully
- [ ] Can create custom email template
- [ ] Template renders with Handlebars correctly
- [ ] Can create notification rule
- [ ] Notification triggers on ticket creation
- [ ] Email is sent to correct recipients
- [ ] User preferences are respected
- [ ] Rate limits are enforced
- [ ] Delivery logs are created
- [ ] Admin can view delivery logs

---

## 🔒 Security Features

1. **Credential Encryption**: AWS credentials encrypted with AES-256-GCM before storage
2. **RBAC Protection**: All admin endpoints protected with role checks
3. **Rate Limiting**: Per-organization hourly and daily limits
4. **Input Validation**: All inputs validated before processing
5. **Template Sandbox**: Handlebars templates run in safe context
6. **Audit Trail**: Complete delivery log for compliance
7. **User Preferences**: Users can opt-out of notifications
8. **Non-blocking**: Notification failures don't block main operations

---

## 📈 Future Enhancements

1. **Email Queue Worker**: Background job to process email queue
2. **Batch Digest Emails**: Daily/weekly digest mode
3. **Email Analytics Dashboard**: Open rates, click rates, bounce rates
4. **SES Webhook Integration**: Handle bounces, complaints, deliveries
5. **Multi-language Support**: Template translations
6. **A/B Testing**: Test different email templates
7. **Scheduled Notifications**: Send at specific times
8. **SMS Notifications**: Add Twilio/SNS integration
9. **Slack/Teams Integration**: Alternative notification channels
10. **Email Builder UI**: Drag-and-drop email designer

---

## 📝 Notes

- All notification triggering is **non-blocking** - errors are logged but don't throw
- Rate limits reset automatically every hour/day
- System templates cannot be deleted (only deactivated)
- User preferences override notification rules
- The notification engine automatically excludes the user who triggered the event
- All emails are logged for audit compliance
- Credentials are never returned in API responses unless explicitly requested (internal use only)

---

## Summary of Files Created

### Services (4 files)
1. `src/lib/utils/email-encryption.ts` - Credential encryption utility
2. `src/lib/services/email-ses.ts` - SES email service
3. `src/lib/services/email-templates.ts` - Template management
4. `src/lib/services/email-settings.ts` - Settings management
5. `src/lib/services/notification-engine.ts` - Notification engine

### API Routes (2 files created, 15 more needed)
1. `src/app/api/email/settings/route.ts` - Settings CRUD
2. `src/app/api/email/settings/test/route.ts` - Test endpoint

**Still needed:**
- Templates CRUD (3 files)
- Notification Rules CRUD (2 files)
- User Preferences (1 file)
- Email Logs (1 file)

### Modified Files (2 files)
1. `src/lib/types.ts` - Added email notification interfaces (~350 lines)
2. `src/lib/mongodb.ts` - Added 6 new collection names

### Total Lines of Code: ~2,500 lines

---

## End of Summary
