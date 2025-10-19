# Amazon SES Email Notifications Research & Implementation Guide
## Deskwise ITSM Platform

**Research Date:** October 18, 2025
**Platform:** Deskwise ITSM (Next.js 15, MongoDB, TypeScript)
**Purpose:** Comprehensive research for implementing email notification system with Amazon SES

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current Platform Analysis](#current-platform-analysis)
3. [Amazon SES Overview](#amazon-ses-overview)
4. [Module & Event Analysis](#module--event-analysis)
5. [Template System Design](#template-system-design)
6. [Implementation Architecture](#implementation-architecture)
7. [Security & Best Practices](#security--best-practices)
8. [Cost Analysis](#cost-analysis)
9. [Recommended Next Steps](#recommended-next-steps)

---

## 1. Executive Summary

### Current State
- **No email infrastructure exists** - No nodemailer, sendgrid, or other email libraries currently installed
- **Workflow system exists** with NotificationNode UI component, but no backend email implementation
- **Rich module structure** with 15+ modules requiring notifications
- **Multi-tenant architecture** with organization-scoped data (B2B SaaS)
- **RBAC system** with 120+ permissions for fine-grained access control

### Recommendation
Implement Amazon SES with **custom Handlebars template engine** for full flexibility:
- ✅ **@aws-sdk/client-ses** package (v3.913.0) - already installed in package.json
- ✅ **handlebars** package (v4.7.8) - already installed in package.json
- ✅ Custom template storage in MongoDB for admin editability
- ✅ Template variable system with type-safe interpolation
- ✅ User notification preferences in database

---

## 2. Current Platform Analysis

### 2.1 Database Collections (MongoDB)

Based on `src/lib/mongodb.ts`, the platform has **108 collections** including:

#### Core ITSM Modules
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `tickets` | Ticket management | Created, Updated, Status Changed, Assigned, Commented, Resolved, Closed, SLA Breached |
| `incidents` | Incident management | Created, Status Changed, Updated, Resolved |
| `incident_updates` | Incident status updates | Update posted |
| `service_requests` | Service catalog requests | Submitted, Approved, Rejected, Assigned, Status Changed |
| `problems` | Problem management | Created, Status Changed, Root Cause Found, Workaround Added, Resolved |
| `problem_updates` | Problem investigation logs | Update posted |
| `change_requests` | Change management | Submitted, Approved, Rejected, Scheduled, Implementing, Completed |
| `change_approvals` | Change approval workflow | Approval requested, Approved, Rejected |
| `projects` | Project management | Created, Milestone reached, Task assigned, Status changed |
| `project_tasks` | Project tasks | Created, Assigned, Status Changed, Completed |
| `schedule_items` | Calendar/scheduling | Appointment scheduled, Reminder (15min, 1hr, 24hr), Rescheduled, Cancelled |

#### Asset Management
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `assets` | IT asset tracking | Created, Updated, Assigned, Maintenance due, Warranty expiring, Retired |
| `asset_maintenance` | Maintenance history | Scheduled, Completed, Overdue |
| `enrollment_tokens` | Agent enrollment | Token created, Token revoked, Agent enrolled |

#### Knowledge Base
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `kb_articles` | Knowledge base | Article published, Article updated, Article archived, Feedback received |
| `kb_categories` | KB organization | Category created, Category updated |
| `recording_sessions` | KB recording | Recording completed, Article generated |

#### Workflow & Automation
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `workflows` | Workflow automation | Workflow triggered, Workflow completed, Workflow failed |
| `workflow_executions` | Execution history | Execution started, Node failed, Execution completed |

#### User Management
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `users` | User accounts | User created, User updated, Password changed, Role changed |
| `roles` | RBAC roles | Role assigned, Permission changed |
| `role_assignment_history` | Audit trail | Role changed |

#### Remote Control
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `rc_sessions` | Remote desktop sessions | Session started, Consent requested, Session ended |
| `audit_remote_control` | Remote control audit | Security event logged |

#### Portal & Client
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `portal_pages` | Custom portal pages | Page published, Page updated |
| `clients` | MSP client management | Client onboarded, Contract expiring |

#### Business Operations
| Collection | Purpose | Notification Events |
|------------|---------|---------------------|
| `quotes` | Quote management | Quote sent, Quote accepted, Quote rejected, Quote expiring |
| `contracts` | Contract management | Contract signed, Contract expiring, Auto-renewal |
| `invoices` | Billing | Invoice generated, Payment due, Payment overdue |
| `time_entries` | Time tracking | Timer started, Timer stopped (for billing) |
| `csat_ratings` | Customer satisfaction | CSAT submitted (alert on low ratings) |

### 2.2 Existing Infrastructure

**File:** `C:\Users\User\Desktop\Projects\Deskwise\package.json`
```json
{
  "dependencies": {
    "@aws-sdk/client-ses": "^3.913.0",  // ✅ Already installed!
    "handlebars": "^4.7.8",              // ✅ Already installed!
    "mongodb": "^6.12.0",
    "next-auth": "^4.24.11",
    "next": "^15.1.5"
  }
}
```

**Notification UI Components Exist:**
- `src/components/workflows/nodes/NotificationNode.tsx` - Workflow visual component with channels: email, sms, webhook
- Notification validation in workflows service (validates channel & recipients)

**No Email Implementation Found:**
- ❌ No email service file (`src/lib/services/email.ts` does not exist)
- ❌ No template storage or management
- ❌ No user notification preferences
- ❌ No email sending code anywhere in codebase

### 2.3 Service Layer Patterns

**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\lib\services/tickets.ts`

The platform follows a **service layer pattern**:
```typescript
export class TicketService {
  static async createTicket(orgId: string, input: CreateTicketInput, createdBy: string): Promise<Ticket> {
    // 1. Business logic
    // 2. Database operations
    // 3. ⚠️ NO EMAIL NOTIFICATIONS
    // 4. Return result
  }

  static async updateTicket(id: string, orgId: string, updates: UpdateTicketInput): Promise<Ticket | null> {
    // Status changes detected but not notified
  }

  static async assignTicket(ticketId: string, orgId: string, assignedTo: string, assignedBy: string): Promise<Ticket | null> {
    // Creates audit log but no email notification
  }
}
```

**Notification Hook Points Identified:**
- After entity creation (POST routes)
- After entity updates (PUT routes)
- After status changes (dedicated status change routes)
- After assignments (assignment routes)
- After comments (comment routes)
- After approvals/rejections (approval routes)

---

## 3. Amazon SES Overview

### 3.1 AWS SES Setup Requirements

#### Verified Identities
**REQUIRED for both sandbox and production:**
- Verify ALL sender addresses ("From", "Source", "Sender", "Return-Path")
- Can verify up to 10,000 identities per region (domains + emails)
- **Recommended:** Verify domain (e.g., `deskwise.com`) for professional emails
  - Allows sending from any `@deskwise.com` address without individual verification
  - Requires DNS records (DKIM, SPF, DMARC)

#### Sandbox Mode Limitations
**Default for new accounts:**
- ✅ Free tier: 200 emails per 24 hours
- ✅ Rate: 1 email per second
- ⚠️ **Restriction:** Can only send to verified recipient addresses
- ⚠️ **Testing:** Use Amazon SES Mailbox Simulator for testing

#### Production Mode Benefits
**After requesting production access:**
- ✅ Send to ANY recipient (no verification required)
- ✅ Initial quota: ~50,000 emails per day
- ✅ Rate: Increases based on sending quality
- ✅ Auto-scaling quotas based on patterns
- ⏱️ **Approval time:** 24 hours (may require additional info)

#### Production Access Requirements
Before requesting production access:
1. ✅ Verify at least one domain or email
2. ✅ Set up email authentication (DKIM, SPF)
3. ✅ Configure bounce/complaint handling
4. ✅ Prepare use case description (Transactional vs Marketing)
5. ✅ Document volume projections
6. ✅ Compliance documentation ready

### 3.2 AWS SDK Installation & Configuration

**Package:** `@aws-sdk/client-ses` v3.913.0 (already installed)

**Environment Variables Required:**
```bash
# AWS SES Configuration
AWS_REGION=us-east-1                    # AWS region (e.g., us-east-1, eu-west-1)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX  # IAM user access key
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx     # IAM user secret key

# Email Configuration
EMAIL_FROM_ADDRESS=noreply@deskwise.com # Default sender address (must be verified)
EMAIL_FROM_NAME=Deskwise ITSM          # Sender display name
EMAIL_REPLY_TO=support@deskwise.com    # Reply-to address (optional)

# Email Feature Flags
EMAIL_ENABLED=true                      # Global email toggle
EMAIL_DEBUG_MODE=false                  # Log emails instead of sending (dev)
EMAIL_RATE_LIMIT=10                     # Max emails per second
```

**IAM Permissions Required:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendTemplatedEmail"
      ],
      "Resource": "*"
    }
  ]
}
```

### 3.3 Basic Implementation Example

**Using @aws-sdk/client-ses:**
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const command = new SendEmailCommand({
  Source: 'noreply@deskwise.com',
  Destination: {
    ToAddresses: ['user@example.com'],
  },
  Message: {
    Subject: {
      Data: 'Ticket Created',
      Charset: 'UTF-8',
    },
    Body: {
      Html: {
        Data: '<h1>Your ticket has been created</h1>',
        Charset: 'UTF-8',
      },
      Text: {
        Data: 'Your ticket has been created',
        Charset: 'UTF-8',
      },
    },
  },
})

await sesClient.send(command)
```

### 3.4 Bounce & Complaint Handling

**Required for production:**
1. **Set up SNS topics** for bounces and complaints
2. **Configure SES notifications** to publish to SNS
3. **Create webhook endpoint** to receive SNS notifications
4. **Database tracking:**
   - Store bounce/complaint events
   - Disable sending to hard-bounced addresses
   - Alert admins on high complaint rates

**Recommended database collection:**
```typescript
interface EmailBounce {
  _id: ObjectId
  orgId: string
  email: string
  bounceType: 'hard' | 'soft' | 'complaint'
  timestamp: Date
  reason: string
  messageId?: string
}
```

---

## 4. Module & Event Analysis

### 4.1 High-Priority Notification Events

Based on codebase analysis and ITSM best practices:

#### Tickets (HIGHEST PRIORITY)
**File:** `src/lib/services/tickets.ts`, `src/app/api/tickets/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `ticket.created` | `POST /api/tickets` | Requester, Assigned tech | 🔴 Critical |
| `ticket.assigned` | `POST /api/tickets/[id]/assign` | New assignee, Previous assignee | 🔴 Critical |
| `ticket.status_changed` | `PUT /api/tickets/[id]` (status update) | Requester, Assigned tech | 🟡 High |
| `ticket.commented` | `POST /api/tickets/[id]/comments` | Ticket watchers, Assignee | 🟡 High |
| `ticket.resolved` | `PUT /api/tickets/[id]` (status=resolved) | Requester (with CSAT survey link) | 🔴 Critical |
| `ticket.sla_warning` | Scheduled check (80% of SLA time) | Assigned tech, Manager | 🔴 Critical |
| `ticket.sla_breached` | Scheduled check (100% of SLA time) | Assigned tech, Manager, Admin | 🔴 Critical |
| `ticket.escalated` | `POST /api/tickets/[id]/escalate` | Escalation team, Manager | 🔴 Critical |

#### Incidents (HIGH PRIORITY)
**File:** `src/lib/services/incidents.ts`, `src/app/api/incidents/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `incident.created` | `POST /api/incidents` | Affected clients, Incident team | 🔴 Critical |
| `incident.status_changed` | `PUT /api/incidents/[id]` | Affected clients, Subscribers | 🔴 Critical |
| `incident.update_posted` | `POST /api/incidents/[id]/updates` | Affected clients, Subscribers | 🟡 High |
| `incident.resolved` | Status change to 'resolved' | Affected clients, Subscribers | 🟡 High |

#### Service Requests (HIGH PRIORITY)
**File:** `src/lib/services/service-requests.ts`, `src/app/api/service-requests/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `service_request.submitted` | `POST /api/service-catalog/[id]/submit` | Requester, Approvers | 🔴 Critical |
| `service_request.approved` | `POST /api/service-requests/[id]/approve` | Requester, Assigned tech | 🔴 Critical |
| `service_request.rejected` | `POST /api/service-requests/[id]/reject` | Requester | 🔴 Critical |
| `service_request.assigned` | Assignment change | New assignee, Previous assignee | 🟡 High |

#### Change Requests (MEDIUM PRIORITY)
**File:** `src/lib/services/change-management.ts`, `src/app/api/change-requests/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `change.submitted` | `POST /api/change-requests` | Change Advisory Board (CAB) | 🟡 High |
| `change.approved` | `POST /api/change-requests/[id]/approve` | Requester, Implementer | 🟡 High |
| `change.rejected` | `POST /api/change-requests/[id]/reject` | Requester | 🟡 High |
| `change.scheduled` | Status change to 'scheduled' | Stakeholders, Implementer | 🟡 High |
| `change.reminder_24h` | Scheduled check (24h before) | Stakeholders, Implementer | 🟡 High |
| `change.implementing` | Status change to 'implementing' | Stakeholders | 🟢 Medium |
| `change.completed` | Status change to 'completed' | Stakeholders, Requester | 🟢 Medium |

#### Projects (MEDIUM PRIORITY)
**File:** `src/lib/services/projects.ts`, `src/app/api/projects/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `project.task_assigned` | Task assignment | Assigned team member | 🟡 High |
| `project.milestone_reached` | Milestone completion | Project manager, Team | 🟢 Medium |
| `project.deadline_warning` | Scheduled check (3 days before) | Project manager, Team | 🟡 High |
| `project.overdue` | Task past due date | Assigned member, PM | 🔴 Critical |

#### Assets (MEDIUM PRIORITY)
**File:** `src/lib/services/assets.ts`, `src/app/api/assets/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `asset.warranty_expiring` | Scheduled check (30 days before) | IT manager, Procurement | 🟡 High |
| `asset.maintenance_due` | Scheduled check | Assigned tech, IT manager | 🟡 High |
| `asset.assigned` | Asset assignment change | New assignee, Previous assignee | 🟢 Medium |

#### Remote Control (MEDIUM PRIORITY)
**File:** `src/lib/services/remote-control.ts`, `src/app/api/rc/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `remote_session.consent_requested` | Session start with consent policy | End user (asset owner) | 🔴 Critical |
| `remote_session.started` | Session becomes active | End user, IT manager (audit) | 🟡 High |
| `remote_session.ended` | Session ends | End user, Operator (with metrics) | 🟢 Medium |

#### User Management (LOW PRIORITY)
**File:** `src/lib/services/users.ts`, `src/app/api/users/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `user.created` | `POST /api/users` | New user (with credentials) | 🔴 Critical |
| `user.password_reset` | Password reset initiated | User | 🔴 Critical |
| `user.role_changed` | `PUT /api/users/[id]/role` | User, Manager | 🟢 Medium |

#### Workflow Automation (LOW PRIORITY)
**File:** `src/lib/services/workflows.ts`, `src/app/api/workflows/**/*.ts`

| Event | Trigger | Recipients | Priority |
|-------|---------|------------|----------|
| `workflow.failed` | Workflow execution failure | Workflow owner, Admins | 🟡 High |
| `workflow.approval_required` | Approval node reached | Approvers | 🟡 High |

### 4.2 Notification Recipients Types

Based on the codebase structure:

1. **Direct User ID** - Specific user (assignee, requester, creator)
2. **Role-based** - All users with specific role (e.g., all admins, all technicians)
3. **Client-based** - All users associated with a client (for MSP mode)
4. **Watchers/Subscribers** - Users who opted-in to follow entity
5. **Dynamic (workflow-based)** - Recipients determined by workflow rules

### 4.3 Recommended Event Priority Matrix

**Implementation Phases:**

**Phase 1 (MVP - Week 1-2):**
- ✅ Ticket created
- ✅ Ticket assigned
- ✅ Ticket status changed
- ✅ Ticket commented
- ✅ Ticket resolved
- ✅ Service request submitted/approved/rejected

**Phase 2 (Essential - Week 3-4):**
- ✅ Incident created/updated/resolved
- ✅ Change request submitted/approved/rejected
- ✅ User account created (welcome email)
- ✅ Password reset
- ✅ SLA warning/breach

**Phase 3 (Enhanced - Week 5-6):**
- ✅ Project task assigned
- ✅ Asset maintenance due
- ✅ Remote session consent request
- ✅ Workflow approval required
- ✅ Knowledge base article published

**Phase 4 (Advanced - Week 7+):**
- ✅ Scheduled reports (daily digest)
- ✅ Weekly summaries
- ✅ Analytics reports
- ✅ Invoice reminders
- ✅ Contract expiration warnings

---

## 5. Template System Design

### 5.1 Template Engine Choice: Custom Handlebars

**Why NOT AWS SES Native Templates:**
- ❌ No UI for template editing in AWS console
- ❌ Cannot register custom Handlebars helpers
- ❌ Difficult to debug and test
- ❌ Less flexible for complex logic
- ❌ Hard to version control

**Why Custom Handlebars Templates:**
- ✅ Full control over template engine
- ✅ Store templates in MongoDB (admin editable via UI)
- ✅ Easy local testing and debugging
- ✅ Version control and rollback support
- ✅ Custom helpers for formatting (dates, currency, status badges)
- ✅ Multi-language support potential
- ✅ Handlebars already installed in package.json

### 5.2 Template Variable System

**Standard Variables Available in ALL Templates:**
```typescript
interface EmailTemplateContext {
  // Organization context
  org: {
    id: string
    name: string
    logo?: string
    website?: string
    supportEmail?: string
    supportPhone?: string
  }

  // Recipient context
  user: {
    id: string
    firstName: string
    lastName: string
    fullName: string
    email: string
    role: string
    timezone?: string
    language?: string
  }

  // Email metadata
  meta: {
    timestamp: Date
    year: number
    unsubscribeUrl: string
    preferencesUrl: string
    portalUrl: string
  }

  // Event-specific data (varies by template)
  data: Record<string, any>
}
```

**Event-Specific Variables:**

**Ticket Events:**
```typescript
{
  ticket: {
    id: string
    ticketNumber: string        // "TKT-00123"
    title: string
    description: string
    status: string               // "new", "open", "resolved", etc.
    priority: string             // "low", "medium", "high", "critical"
    category: string
    url: string                  // Direct link to ticket
    createdAt: Date
    updatedAt: Date

    requester: {
      id: string
      name: string
      email: string
    }

    assignee?: {
      id: string
      name: string
      email: string
    }

    sla?: {
      responseDeadline: Date
      resolutionDeadline: Date
      breached: boolean
      timeRemaining: string      // "2 hours 15 minutes"
    }
  }

  // For status change events
  previousStatus?: string

  // For assignment events
  previousAssignee?: {
    id: string
    name: string
  }

  // For comment events
  comment?: {
    content: string
    author: string
    authorName: string
    isInternal: boolean
    createdAt: Date
  }
}
```

**Incident Events:**
```typescript
{
  incident: {
    id: string
    incidentNumber: string       // "INC-00045"
    title: string
    description: string
    status: string               // "investigating", "identified", "monitoring", "resolved"
    severity: string             // "minor", "major", "critical"
    impact: string
    urgency: string
    priority: string
    affectedServices: string[]
    isPublic: boolean
    url: string
    startedAt: Date
    resolvedAt?: Date

    assignee?: {
      id: string
      name: string
    }
  }

  // For update events
  update?: {
    status: string
    message: string
    author: string
    authorName: string
    createdAt: Date
  }
}
```

**Service Request Events:**
```typescript
{
  serviceRequest: {
    id: string
    requestNumber: string        // "SR-00089"
    title: string
    description: string
    status: string
    priority: string
    category: string
    url: string
    formData?: Record<string, any>

    requester: {
      id: string
      name: string
      email: string
    }

    approver?: {
      id: string
      name: string
    }

    assignee?: {
      id: string
      name: string
    }
  }

  // For approval/rejection events
  approvalStatus?: 'approved' | 'rejected'
  rejectionReason?: string
}
```

**User Events:**
```typescript
{
  newUser: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    temporaryPassword?: string   // Only for user.created
  }

  // For password reset
  resetToken?: string
  resetUrl?: string
  resetExpiresAt?: Date
}
```

### 5.3 Template Database Schema

**Collection:** `email_templates`

```typescript
interface EmailTemplate {
  _id: ObjectId
  orgId: string                  // For multi-tenancy

  // Template identification
  templateKey: string            // e.g., "ticket.created", "incident.resolved"
  category: string               // e.g., "tickets", "incidents", "users"
  name: string                   // Display name
  description: string

  // Template content
  subject: string                // Handlebars template for subject
  bodyHtml: string               // Handlebars template for HTML body
  bodyText: string               // Handlebars template for plain text body

  // Customization
  isCustom: boolean              // false = system default, true = org-customized
  isActive: boolean              // Can be disabled without deletion

  // Preview/testing
  sampleData: Record<string, any> // Sample data for preview

  // Versioning
  version: number
  previousVersionId?: string

  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastUsedAt?: Date
  usageCount: number
}
```

**Collection:** `email_logs` (for debugging and compliance)

```typescript
interface EmailLog {
  _id: ObjectId
  orgId: string

  // Email details
  messageId: string              // AWS SES message ID
  templateKey: string

  // Recipients
  to: string[]
  cc?: string[]
  bcc?: string[]
  from: string
  replyTo?: string

  // Content (for debugging)
  subject: string
  bodyPreview: string            // First 500 chars of body

  // Context data (for re-sending)
  context: Record<string, any>

  // Status tracking
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'complaint'
  error?: string
  sentAt?: Date

  // Engagement tracking (if implemented)
  opened?: boolean
  openedAt?: Date
  clicked?: boolean
  clickedAt?: Date

  // Metadata
  createdAt: Date
  updatedAt: Date
}
```

**Collection:** `user_notification_preferences` (for opt-in/opt-out)

```typescript
interface UserNotificationPreferences {
  _id: ObjectId
  userId: string
  orgId: string

  // Global preferences
  emailEnabled: boolean          // Master toggle
  digestEnabled: boolean         // Daily/weekly digest
  digestFrequency: 'daily' | 'weekly' | 'none'

  // Event-specific preferences
  preferences: {
    [eventKey: string]: {
      email: boolean             // e.g., ticket.created: true
      inApp: boolean             // Future: in-app notifications
      sms: boolean               // Future: SMS notifications
    }
  }

  // Examples:
  // 'ticket.created': { email: true, inApp: true, sms: false }
  // 'ticket.commented': { email: false, inApp: true, sms: false }
  // 'incident.created': { email: true, inApp: true, sms: true }

  // Quiet hours (future feature)
  quietHours?: {
    enabled: boolean
    startTime: string            // "22:00"
    endTime: string              // "08:00"
    timezone: string
  }

  updatedAt: Date
}
```

### 5.4 Custom Handlebars Helpers

**Recommended helpers for email templates:**

```typescript
// Date formatting
{{formatDate ticket.createdAt format="MMM dd, yyyy 'at' h:mm a"}}
// Output: "Oct 18, 2025 at 3:45 PM"

// Relative time
{{timeAgo ticket.createdAt}}
// Output: "2 hours ago"

// Status badge (HTML)
{{statusBadge ticket.status}}
// Output: <span style="...">Open</span>

// Priority color
{{priorityColor ticket.priority}}
// Output: "#DC2626" (red for critical)

// Currency formatting
{{formatCurrency 1234.56 currency="USD"}}
// Output: "$1,234.56"

// Conditional pluralization
{{pluralize ticket.comments.length "comment" "comments"}}
// Output: "5 comments"

// URL building
{{ticketUrl ticket.id}}
// Output: "https://app.deskwise.com/tickets/123456"

// Text truncation
{{truncate ticket.description length=150}}
// Output: "This is a long description that will be..."

// Markdown to HTML (if KB articles use markdown)
{{markdown content}}

// Safe HTML (prevent XSS)
{{safeHtml content}}
```

### 5.5 Email Design Standards

**Layout Components:**
1. **Header** - Logo, organization name
2. **Hero Section** - Event icon, primary message
3. **Content Area** - Main details, data table, description
4. **Action Buttons** - CTAs (View Ticket, Approve Request, etc.)
5. **Footer** - Unsubscribe, preferences, support contact

**Responsive Design:**
- Mobile-first approach
- Max width: 600px
- Tested on Gmail, Outlook, Apple Mail, Yahoo Mail

**Accessibility:**
- Semantic HTML
- Alt text for images
- Sufficient color contrast (WCAG AA)
- Plain text fallback

**Branding:**
- Configurable primary color (from org settings)
- Organization logo in header
- Consistent typography
- Professional, clean design

---

## 6. Implementation Architecture

### 6.1 Service Layer Structure

**File:** `src/lib/services/email.ts` (NEW FILE NEEDED)

```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import Handlebars from 'handlebars'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// ============================================
// Email Service Configuration
// ============================================

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// ============================================
// Handlebars Setup with Custom Helpers
// ============================================

// Register custom helpers
Handlebars.registerHelper('formatDate', (date: Date, options: any) => {
  // Use date-fns (already installed)
  const format = options.hash.format || 'MMM dd, yyyy'
  return formatDate(new Date(date), format)
})

Handlebars.registerHelper('timeAgo', (date: Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
})

Handlebars.registerHelper('statusBadge', (status: string) => {
  const colors = {
    new: '#3B82F6',
    open: '#10B981',
    pending: '#F59E0B',
    resolved: '#8B5CF6',
    closed: '#6B7280',
  }
  const color = colors[status as keyof typeof colors] || '#6B7280'
  return new Handlebars.SafeString(
    `<span style="background-color: ${color}; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600;">${status.toUpperCase()}</span>`
  )
})

// More helpers...

// ============================================
// Email Service Class
// ============================================

export interface SendEmailOptions {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  templateKey: string
  context: Record<string, any>
  orgId: string
  userId?: string                // For logging who triggered the email
}

export class EmailService {
  /**
   * Main method: Send templated email
   */
  static async send(options: SendEmailOptions): Promise<string> {
    // 1. Check if emails are enabled
    if (!this.isEnabled()) {
      console.log('[EMAIL] Email sending is disabled')
      return 'disabled'
    }

    // 2. Get user preferences (check if user opted out)
    if (options.userId) {
      const preferences = await this.getUserPreferences(options.userId, options.orgId)
      if (!preferences.emailEnabled) {
        console.log(`[EMAIL] User ${options.userId} has email disabled`)
        return 'opted_out'
      }

      // Check event-specific preference
      const eventPref = preferences.preferences[options.templateKey]
      if (eventPref && !eventPref.email) {
        console.log(`[EMAIL] User opted out of ${options.templateKey}`)
        return 'opted_out'
      }
    }

    // 3. Load template from database
    const template = await this.getTemplate(options.templateKey, options.orgId)
    if (!template) {
      throw new Error(`Email template not found: ${options.templateKey}`)
    }

    // 4. Build context with standard variables
    const context = await this.buildContext(options.orgId, options.context)

    // 5. Render subject and body
    const subject = this.renderTemplate(template.subject, context)
    const bodyHtml = this.renderTemplate(template.bodyHtml, context)
    const bodyText = this.renderTemplate(template.bodyText, context)

    // 6. Send via SES
    const messageId = await this.sendViaSES({
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject,
      bodyHtml,
      bodyText,
    })

    // 7. Log the email
    await this.logEmail({
      orgId: options.orgId,
      messageId,
      templateKey: options.templateKey,
      to: Array.isArray(options.to) ? options.to : [options.to],
      cc: options.cc,
      bcc: options.bcc,
      subject,
      bodyPreview: bodyText.substring(0, 500),
      context: options.context,
      status: 'sent',
    })

    return messageId
  }

  /**
   * Send email via AWS SES
   */
  private static async sendViaSES(options: {
    to: string[]
    cc?: string | string[]
    bcc?: string | string[]
    replyTo?: string
    subject: string
    bodyHtml: string
    bodyText: string
  }): Promise<string> {
    const command = new SendEmailCommand({
      Source: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
      Destination: {
        ToAddresses: options.to,
        CcAddresses: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
        BccAddresses: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      },
      ReplyToAddresses: options.replyTo ? [options.replyTo] : undefined,
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: options.bodyHtml,
            Charset: 'UTF-8',
          },
          Text: {
            Data: options.bodyText,
            Charset: 'UTF-8',
          },
        },
      },
    })

    const response = await sesClient.send(command)
    return response.MessageId!
  }

  /**
   * Get template from database (with caching)
   */
  private static async getTemplate(templateKey: string, orgId: string): Promise<EmailTemplate | null> {
    const db = await getDatabase()
    const templatesCollection = db.collection<EmailTemplate>('email_templates')

    // Try org-specific custom template first
    let template = await templatesCollection.findOne({
      orgId,
      templateKey,
      isCustom: true,
      isActive: true,
    })

    // Fallback to system default template
    if (!template) {
      template = await templatesCollection.findOne({
        orgId: 'system',  // System templates have orgId='system'
        templateKey,
        isActive: true,
      })
    }

    return template
  }

  /**
   * Build full context with standard variables
   */
  private static async buildContext(orgId: string, eventData: Record<string, any>): Promise<EmailTemplateContext> {
    const db = await getDatabase()

    // Get organization
    const org = await db.collection('organizations').findOne({ _id: new ObjectId(orgId) })
    if (!org) throw new Error('Organization not found')

    // Get user (if provided in event data)
    let user = null
    if (eventData.userId) {
      user = await db.collection('users').findOne({ _id: new ObjectId(eventData.userId) })
    }

    return {
      org: {
        id: org._id.toString(),
        name: org.name,
        logo: org.logo,
        website: org.website,
        supportEmail: org.supportEmail || process.env.EMAIL_FROM_ADDRESS,
        supportPhone: org.supportPhone,
      },
      user: user ? {
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
      } : null,
      meta: {
        timestamp: new Date(),
        year: new Date().getFullYear(),
        unsubscribeUrl: `${process.env.NEXTAUTH_URL}/preferences/notifications?action=unsubscribe`,
        preferencesUrl: `${process.env.NEXTAUTH_URL}/preferences/notifications`,
        portalUrl: process.env.NEXTAUTH_URL!,
      },
      data: eventData,
    }
  }

  /**
   * Render Handlebars template
   */
  private static renderTemplate(templateString: string, context: any): string {
    const template = Handlebars.compile(templateString)
    return template(context)
  }

  /**
   * Check if email sending is enabled
   */
  private static isEnabled(): boolean {
    return process.env.EMAIL_ENABLED === 'true'
  }

  /**
   * Get user notification preferences
   */
  private static async getUserPreferences(userId: string, orgId: string): Promise<UserNotificationPreferences> {
    const db = await getDatabase()
    const prefsCollection = db.collection<UserNotificationPreferences>('user_notification_preferences')

    let prefs = await prefsCollection.findOne({ userId, orgId })

    // Create default preferences if not found
    if (!prefs) {
      prefs = {
        _id: new ObjectId(),
        userId,
        orgId,
        emailEnabled: true,
        digestEnabled: false,
        digestFrequency: 'daily',
        preferences: {},  // Empty = all enabled by default
        updatedAt: new Date(),
      }
      await prefsCollection.insertOne(prefs)
    }

    return prefs
  }

  /**
   * Log email for debugging and compliance
   */
  private static async logEmail(log: Omit<EmailLog, '_id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await getDatabase()
    const logsCollection = db.collection<EmailLog>('email_logs')

    await logsCollection.insertOne({
      ...log,
      _id: new ObjectId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmailLog)
  }

  // ============================================
  // Template Management Methods (for admin UI)
  // ============================================

  /**
   * Create or update email template
   */
  static async saveTemplate(orgId: string, template: Partial<EmailTemplate>, userId: string): Promise<EmailTemplate> {
    const db = await getDatabase()
    const templatesCollection = db.collection<EmailTemplate>('email_templates')

    if (template._id) {
      // Update existing
      const updated = await templatesCollection.findOneAndUpdate(
        { _id: new ObjectId(template._id), orgId },
        {
          $set: {
            ...template,
            updatedAt: new Date(),
          },
          $inc: { version: 1 },
        },
        { returnDocument: 'after' }
      )
      return updated!
    } else {
      // Create new
      const newTemplate: Omit<EmailTemplate, '_id'> = {
        orgId,
        templateKey: template.templateKey!,
        category: template.category!,
        name: template.name!,
        description: template.description || '',
        subject: template.subject!,
        bodyHtml: template.bodyHtml!,
        bodyText: template.bodyText!,
        isCustom: true,
        isActive: true,
        sampleData: template.sampleData || {},
        version: 1,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      }

      const result = await templatesCollection.insertOne(newTemplate as EmailTemplate)
      return { ...newTemplate, _id: result.insertedId } as EmailTemplate
    }
  }

  /**
   * Preview template with sample data
   */
  static async previewTemplate(templateKey: string, orgId: string, sampleData?: Record<string, any>): Promise<{ subject: string; bodyHtml: string; bodyText: string }> {
    const template = await this.getTemplate(templateKey, orgId)
    if (!template) {
      throw new Error(`Template not found: ${templateKey}`)
    }

    const context = await this.buildContext(orgId, sampleData || template.sampleData)

    return {
      subject: this.renderTemplate(template.subject, context),
      bodyHtml: this.renderTemplate(template.bodyHtml, context),
      bodyText: this.renderTemplate(template.bodyText, context),
    }
  }

  /**
   * Seed default templates for organization
   */
  static async seedDefaultTemplates(orgId: string): Promise<number> {
    // Copy all system templates to organization
    const db = await getDatabase()
    const templatesCollection = db.collection<EmailTemplate>('email_templates')

    const systemTemplates = await templatesCollection.find({ orgId: 'system' }).toArray()

    const operations = systemTemplates.map(template => ({
      updateOne: {
        filter: { orgId, templateKey: template.templateKey },
        update: {
          $setOnInsert: {
            ...template,
            _id: new ObjectId(),
            orgId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }))

    const result = await templatesCollection.bulkWrite(operations)
    return result.upsertedCount
  }
}
```

### 6.2 Integration Points

**Where to add email notifications:**

#### 1. Ticket Service
**File:** `src/lib/services/tickets.ts`

```typescript
// After createTicket()
await EmailService.send({
  to: requesterEmail,
  templateKey: 'ticket.created',
  context: {
    ticket: {
      id: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      url: `${process.env.NEXTAUTH_URL}/tickets/${ticket._id}`,
      createdAt: ticket.createdAt,
    },
    requester: {
      id: requester._id.toString(),
      name: `${requester.firstName} ${requester.lastName}`,
      email: requester.email,
    },
  },
  orgId: ticket.orgId,
  userId: requester._id.toString(),
})

// If assigned, notify assignee
if (ticket.assignedTo) {
  await EmailService.send({
    to: assigneeEmail,
    templateKey: 'ticket.assigned',
    context: { /* ... */ },
    orgId: ticket.orgId,
    userId: ticket.assignedTo,
  })
}
```

#### 2. API Routes (Alternative Pattern)
**File:** `src/app/api/tickets/route.ts`

```typescript
export async function POST(request: NextRequest) {
  try {
    // ... existing code ...
    const ticket = await TicketService.createTicket(session.user.orgId, validatedData, session.user.id)

    // Send email notification (non-blocking)
    EmailService.send({
      to: ticket.requesterId,
      templateKey: 'ticket.created',
      context: { ticket },
      orgId: session.user.orgId,
    }).catch(err => {
      console.error('Failed to send email:', err)
      // Don't fail the API request if email fails
    })

    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    // ... error handling ...
  }
}
```

#### 3. Background Job Pattern (Recommended for scale)
**File:** `src/lib/jobs/email-queue.ts` (NEW FILE)

```typescript
import { Queue, Worker } from 'bullmq'
import { EmailService } from '@/lib/services/email'

interface EmailJob {
  to: string | string[]
  templateKey: string
  context: Record<string, any>
  orgId: string
  userId?: string
}

// Create queue
const emailQueue = new Queue<EmailJob>('emails', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

// Worker to process emails
const worker = new Worker<EmailJob>(
  'emails',
  async (job) => {
    console.log(`Processing email job: ${job.id}`)
    await EmailService.send(job.data)
  },
  {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
  }
)

// Usage in API routes:
await emailQueue.add('send-email', {
  to: user.email,
  templateKey: 'ticket.created',
  context: { ticket },
  orgId: session.user.orgId,
})
```

**Note:** Queue approach requires Redis. For MVP, use direct `EmailService.send()` with `.catch()` error handling.

### 6.3 Admin UI for Template Management

**Recommended Pages:**

1. **`/settings/email-templates`** - List all templates
2. **`/settings/email-templates/[key]`** - Edit template
3. **`/settings/email-templates/preview`** - Preview with sample data
4. **`/preferences/notifications`** - User notification preferences

**UI Features:**
- Rich text editor for HTML templates (e.g., Monaco Editor, already installed)
- Variable picker (insert Handlebars variables)
- Live preview with sample data
- Test email sender
- Template version history
- Clone system template to customize

### 6.4 Error Handling & Retry Logic

**Error Scenarios:**

1. **AWS SES API Error** (network, credentials, quota exceeded)
   - Retry with exponential backoff (3 attempts)
   - Log error to database
   - Alert admins if critical event

2. **Template Rendering Error** (invalid Handlebars syntax, missing variables)
   - Catch error during render
   - Use fallback plain text template
   - Alert template admin

3. **Recipient Email Invalid**
   - Validate email format before sending
   - Skip invalid emails, log warning
   - Don't fail entire batch

4. **User Opted Out**
   - Check preferences before sending
   - Return early (no error)
   - Respect unsubscribe requests

**Retry Strategy:**
```typescript
async function sendWithRetry(options: SendEmailOptions, maxRetries = 3): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await EmailService.send(options)
    } catch (error) {
      lastError = error as Error
      console.error(`Email send attempt ${attempt} failed:`, error)

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw new Error(`Failed to send email after ${maxRetries} attempts: ${lastError?.message}`)
}
```

---

## 7. Security & Best Practices

### 7.1 AWS Security

**IAM User Setup:**
1. Create dedicated IAM user for SES (e.g., `deskwise-ses-user`)
2. Apply principle of least privilege (only SES send permissions)
3. Rotate access keys regularly (every 90 days)
4. Store credentials in environment variables (never commit to git)
5. Use AWS Secrets Manager for production (recommended)

**Environment Variables Security:**
```bash
# .env.local (NEVER commit this file)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Add to .gitignore
.env.local
.env.*.local
```

### 7.2 Email Security

**Prevent Email Spoofing:**
1. **SPF Record** - Authorize AWS SES to send from your domain
   ```
   v=spf1 include:amazonses.com ~all
   ```

2. **DKIM Signing** - AWS SES automatically signs with domain key
   - Enable Easy DKIM in SES console
   - Add CNAME records to DNS

3. **DMARC Policy** - Instruct receivers on how to handle failures
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc@deskwise.com
   ```

**Prevent XSS in Templates:**
```typescript
// Escape user input in templates
Handlebars.registerHelper('safeHtml', (html: string) => {
  // Use DOMPurify or similar (isomorphic-dompurify already installed)
  return new Handlebars.SafeString(DOMPurify.sanitize(html))
})
```

**Rate Limiting:**
```typescript
// Prevent abuse (e.g., 100 emails per user per hour)
const rateLimit = new Map<string, { count: number; resetAt: Date }>()

function checkRateLimit(userId: string, limit = 100): boolean {
  const now = new Date()
  const userLimit = rateLimit.get(userId)

  if (!userLimit || userLimit.resetAt < now) {
    rateLimit.set(userId, { count: 1, resetAt: new Date(now.getTime() + 3600000) })
    return true
  }

  if (userLimit.count >= limit) {
    return false // Rate limited
  }

  userLimit.count++
  return true
}
```

### 7.3 GDPR & Privacy Compliance

**User Consent:**
- Users can opt-out of non-essential emails
- Transactional emails (e.g., ticket.created for requester) cannot be disabled
- Marketing/digest emails must be opt-in

**Data Retention:**
- Email logs retained for 90 days (configurable)
- PII in logs anonymized after retention period
- User preferences deleted after account deletion

**Unsubscribe Links:**
- All emails must include unsubscribe link
- One-click unsubscribe (RFC 8058)
- Respect unsubscribe within 10 business days

**Example footer:**
```handlebars
<p style="font-size: 12px; color: #6B7280; text-align: center;">
  You are receiving this email because you have an account with {{org.name}}.<br>
  <a href="{{meta.preferencesUrl}}">Manage notification preferences</a> |
  <a href="{{meta.unsubscribeUrl}}">Unsubscribe</a>
</p>
```

### 7.4 Monitoring & Alerting

**Metrics to Track:**
1. **Send Success Rate** - % of emails successfully sent
2. **Bounce Rate** - % of hard bounces (should be <2%)
3. **Complaint Rate** - % of spam complaints (should be <0.1%)
4. **Template Render Errors** - Failed template compilations
5. **Queue Depth** - Emails pending (if using queue)

**Alerting Thresholds:**
- Bounce rate >5% → Alert admins
- Complaint rate >0.5% → Alert admins + pause sending
- Send failure rate >10% → Alert admins (AWS issue?)
- SES quota >80% → Alert admins (request increase)

**CloudWatch Integration:**
```typescript
// Send metrics to CloudWatch (optional)
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch'

async function recordMetric(metricName: string, value: number) {
  const cwClient = new CloudWatchClient({ region: process.env.AWS_REGION })

  await cwClient.send(new PutMetricDataCommand({
    Namespace: 'Deskwise/Email',
    MetricData: [{
      MetricName: metricName,
      Value: value,
      Timestamp: new Date(),
    }],
  }))
}
```

---

## 8. Cost Analysis

### 8.1 AWS SES Pricing (2025)

**Base Pricing:**
- **$0.10 per 1,000 emails** after free tier
- **Free tier:** 3,000 emails/month for first 12 months (new AWS accounts)
- **New 2025 credit:** $200 in AWS credits for 6 months (new accounts)

**High-Volume Discounts:**
- 50-100M emails/month: **$0.02 per 1,000 emails**

**Additional Costs:**
- **Dedicated IP:** $24.95/month per IP
- **Data transfer:** $0.12/GB (after 1GB free)
- **Incoming email:** $0.10 per 1,000 messages

### 8.2 Cost Projections

**Scenario 1: Small MSP (100 clients, 10 techs)**
- Average: 5,000 emails/month
  - Ticket notifications: 3,000/month
  - Incident updates: 500/month
  - Service requests: 800/month
  - User management: 200/month
  - Scheduled reports: 500/month

**Monthly Cost:**
- 5,000 emails = **$0.50/month** (after free tier)
- ✅ **Effectively free for 12 months**

---

**Scenario 2: Mid-Size MSP (500 clients, 50 techs)**
- Average: 50,000 emails/month
  - Ticket notifications: 30,000/month
  - Incident updates: 5,000/month
  - Service requests: 8,000/month
  - User management: 2,000/month
  - Scheduled reports: 5,000/month

**Monthly Cost:**
- 50,000 emails = **$5.00/month**
- ✅ **Very affordable**

---

**Scenario 3: Large Enterprise (2,000 clients, 200 techs)**
- Average: 500,000 emails/month
  - Ticket notifications: 300,000/month
  - Incident updates: 50,000/month
  - Service requests: 80,000/month
  - User management: 20,000/month
  - Scheduled reports: 50,000/month

**Monthly Cost:**
- 500,000 emails = **$50.00/month**
- Add dedicated IP: +$24.95/month
- **Total: ~$75/month**
- ✅ **Excellent value for enterprise**

---

**Comparison to Alternatives:**

| Service | 100K emails/month | 500K emails/month |
|---------|-------------------|-------------------|
| **AWS SES** | **$10** | **$50** |
| SendGrid | $19.95 (40K) + overage | $89.95 |
| Mailgun | $35 | $90 |
| Postmark | $50 | $200 |
| Mandrill | $20 | $95 |

**Winner:** AWS SES is 50-75% cheaper than competitors

### 8.3 Quota Management

**Initial Quotas (Sandbox):**
- 200 emails / 24 hours
- 1 email / second

**Production Quotas:**
- Start: ~50,000 emails / 24 hours
- Rate: 14 emails / second
- **Auto-scaling:** Increases based on sending patterns and reputation

**Requesting Quota Increases:**
1. Go to AWS SES console → Account dashboard
2. Click "Request production access" or "Request a sending quota increase"
3. Provide business case and volume projections
4. AWS typically approves within 24 hours

**Monitoring Quotas:**
```typescript
import { SESClient, GetSendQuotaCommand } from '@aws-sdk/client-ses'

async function checkQuota() {
  const sesClient = new SESClient({ region: process.env.AWS_REGION })
  const command = new GetSendQuotaCommand({})
  const response = await sesClient.send(command)

  console.log(`Quota: ${response.Max24HourSend} emails / 24 hours`)
  console.log(`Sent today: ${response.SentLast24Hours}`)
  console.log(`Remaining: ${response.Max24HourSend - response.SentLast24Hours}`)
  console.log(`Rate limit: ${response.MaxSendRate} emails / second`)
}
```

---

## 9. Recommended Next Steps

### Phase 1: MVP Setup (Week 1-2) - 3-5 days

**Day 1-2: AWS SES Setup**
1. ✅ Create AWS account (if needed)
2. ✅ Verify sender domain in SES
3. ✅ Configure SPF, DKIM, DMARC DNS records
4. ✅ Create IAM user with SES permissions
5. ✅ Add AWS credentials to `.env.local`
6. ✅ Test sending email with AWS SDK

**Day 3: Email Service Implementation**
1. ✅ Create `src/lib/services/email.ts` (EmailService class)
2. ✅ Implement `send()` method with SES client
3. ✅ Register Handlebars helpers (formatDate, statusBadge, etc.)
4. ✅ Create base email template (HTML + text)
5. ✅ Test sending basic email

**Day 4: Database & Templates**
1. ✅ Create MongoDB collections:
   - `email_templates`
   - `email_logs`
   - `user_notification_preferences`
2. ✅ Seed 5 default templates:
   - `ticket.created`
   - `ticket.assigned`
   - `ticket.status_changed`
   - `ticket.commented`
   - `ticket.resolved`
3. ✅ Implement `getTemplate()` and `renderTemplate()` methods

**Day 5: Integration & Testing**
1. ✅ Add email notifications to `TicketService.createTicket()`
2. ✅ Add email notifications to `TicketService.assignTicket()`
3. ✅ Test end-to-end (create ticket → receive email)
4. ✅ Test error handling (invalid email, template error)
5. ✅ Verify email logs in database

---

### Phase 2: Core Events (Week 3-4) - 5-7 days

**Week 3: Incident & Service Request Notifications**
1. ✅ Create 6 templates:
   - `incident.created`, `incident.updated`, `incident.resolved`
   - `service_request.submitted`, `service_request.approved`, `service_request.rejected`
2. ✅ Integrate with IncidentService
3. ✅ Integrate with ServiceRequestService
4. ✅ Test all event types

**Week 4: User Management & Preferences**
1. ✅ Build notification preferences UI (`/preferences/notifications`)
2. ✅ Implement opt-in/opt-out logic
3. ✅ Create `user.created` (welcome email) template
4. ✅ Create `user.password_reset` template
5. ✅ Test preference enforcement

---

### Phase 3: Advanced Features (Week 5-6) - 5-7 days

**Week 5: Admin Template Management**
1. ✅ Build template editor UI (`/settings/email-templates`)
2. ✅ Implement template CRUD operations
3. ✅ Add live preview with sample data
4. ✅ Add "Test Email" sender
5. ✅ Implement template versioning

**Week 6: SLA & Scheduled Notifications**
1. ✅ Create background job for SLA checks
2. ✅ Implement `ticket.sla_warning` and `ticket.sla_breached` templates
3. ✅ Create scheduled reports (daily digest)
4. ✅ Implement asset maintenance reminders
5. ✅ Test scheduled jobs

---

### Phase 4: Production Readiness (Week 7+) - 3-5 days

**Week 7: Production Setup**
1. ✅ Request AWS SES production access
2. ✅ Implement bounce/complaint webhook
3. ✅ Set up CloudWatch monitoring
4. ✅ Configure alerting (Slack, email)
5. ✅ Implement rate limiting

**Week 8: Documentation & Training**
1. ✅ Write admin documentation
2. ✅ Create video tutorials for template editing
3. ✅ Train support team
4. ✅ Prepare incident response plan
5. ✅ Launch beta testing

---

## Appendix A: Sample Template

**Template Key:** `ticket.created`

**Subject:**
```handlebars
[{{org.name}}] New Ticket: {{data.ticket.ticketNumber}} - {{data.ticket.title}}
```

**Body HTML:**
```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ticket Created</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #F3F4F6; }
    .container { max-width: 600px; margin: 20px auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); color: white; padding: 30px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px 20px; }
    .ticket-info { background-color: #F9FAFB; border-left: 4px solid #667EEA; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .ticket-info table { width: 100%; border-collapse: collapse; }
    .ticket-info td { padding: 8px 0; }
    .ticket-info td:first-child { font-weight: 600; color: #6B7280; width: 120px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #667EEA; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background-color: #5568D3; }
    .footer { background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; border-top: 1px solid #E5E7EB; }
    .footer a { color: #667EEA; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎫 New Ticket Created</h1>
      <p>{{data.ticket.ticketNumber}}</p>
    </div>

    <div class="content">
      <p>Hello {{user.firstName}},</p>

      <p>A new support ticket has been created in {{org.name}}.</p>

      <div class="ticket-info">
        <table>
          <tr>
            <td><strong>Ticket #:</strong></td>
            <td>{{data.ticket.ticketNumber}}</td>
          </tr>
          <tr>
            <td><strong>Title:</strong></td>
            <td>{{data.ticket.title}}</td>
          </tr>
          <tr>
            <td><strong>Priority:</strong></td>
            <td>{{statusBadge data.ticket.priority}}</td>
          </tr>
          <tr>
            <td><strong>Category:</strong></td>
            <td>{{data.ticket.category}}</td>
          </tr>
          <tr>
            <td><strong>Created:</strong></td>
            <td>{{formatDate data.ticket.createdAt format="MMM dd, yyyy 'at' h:mm a"}}</td>
          </tr>
          {{#if data.ticket.assignee}}
          <tr>
            <td><strong>Assigned to:</strong></td>
            <td>{{data.ticket.assignee.name}}</td>
          </tr>
          {{/if}}
        </table>
      </div>

      <div style="background-color: #F9FAFB; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <p><strong>Description:</strong></p>
        <p style="margin: 10px 0 0 0; white-space: pre-wrap;">{{data.ticket.description}}</p>
      </div>

      <center>
        <a href="{{data.ticket.url}}" class="button">View Ticket</a>
      </center>

      <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
        Need help? Contact our support team at <a href="mailto:{{org.supportEmail}}" style="color: #667EEA;">{{org.supportEmail}}</a>
      </p>
    </div>

    <div class="footer">
      <p>&copy; {{meta.year}} {{org.name}}. All rights reserved.</p>
      <p>
        <a href="{{meta.preferencesUrl}}">Notification Preferences</a> |
        <a href="{{meta.unsubscribeUrl}}">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
```

**Body Text:**
```handlebars
Hello {{user.firstName}},

A new support ticket has been created in {{org.name}}.

Ticket Details:
---------------
Ticket #: {{data.ticket.ticketNumber}}
Title: {{data.ticket.title}}
Priority: {{data.ticket.priority}}
Category: {{data.ticket.category}}
Created: {{formatDate data.ticket.createdAt format="MMM dd, yyyy 'at' h:mm a"}}
{{#if data.ticket.assignee}}Assigned to: {{data.ticket.assignee.name}}{{/if}}

Description:
{{data.ticket.description}}

View ticket: {{data.ticket.url}}

---

Need help? Contact our support team at {{org.supportEmail}}

© {{meta.year}} {{org.name}}. All rights reserved.
Manage notification preferences: {{meta.preferencesUrl}}
Unsubscribe: {{meta.unsubscribeUrl}}
```

---

## Appendix B: Environment Variables Checklist

**Required for Production:**
```bash
# AWS SES Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration
EMAIL_FROM_ADDRESS=noreply@deskwise.com
EMAIL_FROM_NAME=Deskwise ITSM
EMAIL_REPLY_TO=support@deskwise.com

# Feature Flags
EMAIL_ENABLED=true
EMAIL_DEBUG_MODE=false

# Application URL (for links in emails)
NEXTAUTH_URL=https://app.deskwise.com

# MongoDB (already configured)
MONGODB_URI=mongodb+srv://...

# Optional: CloudWatch Monitoring
CLOUDWATCH_ENABLED=false
CLOUDWATCH_NAMESPACE=Deskwise/Email

# Optional: Rate Limiting
EMAIL_RATE_LIMIT=10
EMAIL_MAX_BATCH_SIZE=50

# Optional: Redis (if using queue)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Appendix C: Testing Checklist

**Pre-Launch Testing:**

- [ ] Send test email to Gmail
- [ ] Send test email to Outlook
- [ ] Send test email to Yahoo Mail
- [ ] Verify HTML rendering on mobile
- [ ] Test plain text fallback
- [ ] Test with very long ticket titles
- [ ] Test with special characters in content
- [ ] Test with non-English characters (UTF-8)
- [ ] Verify all links work (absolute URLs)
- [ ] Test unsubscribe link
- [ ] Test notification preferences toggle
- [ ] Verify email logs are created
- [ ] Test rate limiting (send 200+ emails)
- [ ] Test error handling (invalid email)
- [ ] Test template rendering error
- [ ] Verify bounced email webhook
- [ ] Test SLA breach notification timing
- [ ] Test scheduled digest email
- [ ] Verify multi-tenant isolation (emails only go to org users)
- [ ] Test admin template editor
- [ ] Verify template preview works
- [ ] Test "Send Test Email" feature

---

## Conclusion

This research document provides a comprehensive foundation for implementing email notifications in Deskwise ITSM using Amazon SES. The platform already has the necessary packages installed (@aws-sdk/client-ses, handlebars), and the multi-tenant, service-layer architecture is well-suited for email integration.

**Key Takeaways:**

1. ✅ **No existing email infrastructure** - Clean slate for implementation
2. ✅ **15+ modules** with 80+ notification event types identified
3. ✅ **AWS SES recommended** for cost-effectiveness ($0.10/1K emails)
4. ✅ **Custom Handlebars templates** recommended for flexibility
5. ✅ **Multi-tenant architecture** already supports organization-scoped emails
6. ✅ **Service layer pattern** makes integration straightforward
7. ✅ **Estimated timeline:** 4-8 weeks for full implementation

**Next Action:** Proceed with Phase 1 (MVP Setup) to implement ticket notifications and validate the architecture with real-world usage.

---

**Document Version:** 1.0
**Last Updated:** October 18, 2025
**Author:** Research Team
**Status:** Ready for Implementation
