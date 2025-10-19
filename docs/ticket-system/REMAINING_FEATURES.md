# Remaining Features - Ticket System Roadmap

**Document Version:** 1.0
**Last Updated:** October 2025
**Status:** Planning Phase

---

## Overview

This document outlines features from the original upgrade plan that have **not yet been implemented**. Each feature includes a description, estimated effort, priority recommendation, dependencies, and technical approach.

**What's Been Completed:**
See [ACHIEVEMENTS_SUMMARY.md](./ACHIEVEMENTS_SUMMARY.md) for detailed list of implemented features.

---

## Table of Contents

1. [Email Notification System](#1-email-notification-system)
2. [Ticket Templates](#2-ticket-templates)
3. [Ticket Relationships](#3-ticket-relationships)
4. [Ticket Merge & Split](#4-ticket-merge--split)
5. [Advanced Reporting & Analytics](#5-advanced-reporting--analytics)
6. [Email-to-Ticket Integration](#6-email-to-ticket-integration)
7. [Auto-Assignment Engine](#7-auto-assignment-engine)
8. [Workflow Automation](#8-workflow-automation)
9. [AI-Powered Features](#9-ai-powered-features)
10. [Custom Fields](#10-custom-fields)

---

## 1. Email Notification System

### Description

Send automated email notifications to users when ticket events occur (created, assigned, updated, commented, resolved).

### Priority

**HIGH** - Users need to know when tickets are updated without constantly checking the portal.

### Estimated Effort

**24-32 hours**

### Dependencies

- Email service provider (SendGrid, AWS SES, or similar)
- Email templates (HTML + text versions)
- User notification preferences UI
- Background job queue (Bull/BullMQ or similar)

### Technical Approach

#### 1. Email Service Setup

```typescript
// src/lib/services/email.ts
import sgMail from '@sendgrid/mail'

export class EmailService {
  private static client = sgMail

  static async sendTicketNotification(
    to: string,
    type: 'created' | 'assigned' | 'updated' | 'commented' | 'resolved',
    data: TicketEmailData
  ) {
    const template = this.getTemplate(type)
    const html = this.renderTemplate(template, data)

    await this.client.send({
      to,
      from: process.env.EMAIL_FROM!,
      subject: `Ticket ${data.ticketNumber}: ${this.getSubject(type)}`,
      html,
      text: this.htmlToText(html),
    })
  }

  private static getTemplate(type: string): EmailTemplate {
    // Load template from templates/email/
  }

  private static renderTemplate(template: EmailTemplate, data: any): string {
    // Use template engine (Handlebars, EJS, etc.)
  }
}
```

#### 2. Notification Triggers

Update existing API routes to trigger notifications:

```typescript
// After ticket created
await EmailService.sendTicketNotification(
  requester.email,
  'created',
  {
    ticketNumber: ticket.ticketNumber,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignedToName: assignedUser?.name,
    link: `${process.env.NEXTAUTH_URL}/tickets/${ticket._id}`,
  }
)
```

#### 3. User Preferences

```typescript
// Add to User type
interface User {
  // ... existing fields
  notificationPreferences: {
    email: {
      onAssign: boolean
      onComment: boolean
      onStatusChange: boolean
      onEscalation: boolean
      digestMode: boolean  // Daily digest vs real-time
      digestTime: string   // e.g., "09:00"
    }
  }
}
```

#### 4. Email Templates

Create templates in `src/templates/email/`:
- `ticket-created.hbs`
- `ticket-assigned.hbs`
- `ticket-updated.hbs`
- `ticket-commented.hbs`
- `ticket-resolved.hbs`
- `daily-digest.hbs`

### Implementation Steps

1. Set up SendGrid/AWS SES account and API keys
2. Create email templates (HTML + text versions)
3. Implement `EmailService` with template rendering
4. Add notification preferences to user settings
5. Update ticket API routes to trigger emails
6. Implement background job queue for email sending
7. Add email delivery monitoring and retry logic
8. Test with different email clients (Gmail, Outlook, etc.)

### Testing Checklist

- [ ] Emails sent for all event types
- [ ] User preferences respected
- [ ] Unsubscribe links work
- [ ] Emails render correctly in major clients
- [ ] Background jobs handle failures gracefully
- [ ] Rate limits not exceeded

---

## 2. Ticket Templates

### Description

Pre-configured ticket templates with default values for common request types (e.g., "Password Reset", "New Employee Setup", "Software Installation Request").

### Priority

**MEDIUM** - Improves efficiency but not critical.

### Estimated Effort

**16-20 hours**

### Dependencies

- None (standalone feature)

### Technical Approach

#### 1. Database Schema

```typescript
interface TicketTemplate extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string
  description: string
  category: string
  icon?: string

  // Default values
  defaultTitle: string
  defaultDescription: string
  defaultPriority: TicketPriority
  defaultCategory: string
  defaultTags: string[]
  defaultAssignedTo?: string

  // SLA defaults
  defaultSLA?: {
    responseTime: number
    resolutionTime: number
  }

  // Guided fields
  guidedFields?: Array<{
    label: string
    placeholder: string
    required: boolean
    type: 'text' | 'textarea' | 'select'
    options?: string[]  // For select fields
  }>

  // Metadata
  usageCount: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

#### 2. Service Layer

```typescript
// src/lib/services/ticket-templates.ts
export class TicketTemplateService {
  static async create(orgId: string, data: CreateTemplateInput): Promise<TicketTemplate>
  static async getAll(orgId: string): Promise<TicketTemplate[]>
  static async getById(id: string, orgId: string): Promise<TicketTemplate | null>
  static async update(id: string, orgId: string, updates: UpdateTemplateInput): Promise<TicketTemplate | null>
  static async delete(id: string, orgId: string): Promise<boolean>
  static async incrementUsage(id: string, orgId: string): Promise<void>
}
```

#### 3. UI Components

- **Template Selector:** Modal showing available templates
- **Template Manager:** Admin UI for CRUD operations
- **Template Editor:** Form builder for guided fields

### Implementation Steps

1. Create database schema and indexes
2. Implement `TicketTemplateService`
3. Create API routes (`/api/ticket-templates`)
4. Build template manager UI (admin section)
5. Build template selector UI (create ticket page)
6. Add template usage tracking
7. Seed default templates

### Seed Templates

```typescript
const defaultTemplates = [
  {
    name: 'Password Reset',
    defaultTitle: 'Password Reset Request',
    defaultPriority: 'high',
    defaultCategory: 'Access & Accounts',
    guidedFields: [
      { label: 'Username', type: 'text', required: true },
      { label: 'Email Address', type: 'text', required: true },
    ],
  },
  {
    name: 'New Employee Setup',
    defaultTitle: 'New Employee Onboarding',
    defaultPriority: 'high',
    defaultCategory: 'Onboarding',
    guidedFields: [
      { label: 'Employee Name', type: 'text', required: true },
      { label: 'Start Date', type: 'text', required: true },
      { label: 'Department', type: 'select', options: ['Sales', 'Engineering', 'Marketing'], required: true },
      { label: 'Manager Name', type: 'text', required: true },
    ],
  },
  // ... more templates
]
```

---

## 3. Ticket Relationships

### Description

Link tickets together with relationships: Related To, Blocked By, Duplicates, Parent/Child.

### Priority

**MEDIUM-HIGH** - Important for complex issue tracking.

### Estimated Effort

**32-40 hours**

### Dependencies

- None (standalone feature)

### Technical Approach

#### 1. Database Schema

```typescript
interface TicketRelationship {
  _id: ObjectId
  orgId: string
  ticketId: string          // Source ticket
  relatedTicketId: string   // Target ticket
  type: 'related' | 'blocks' | 'blocked_by' | 'duplicates' | 'parent' | 'child'
  createdBy: string
  createdAt: Date
  note?: string
}

// Add to Ticket type
interface Ticket {
  // ... existing fields
  relationships?: Array<{
    ticketId: string
    ticketNumber: string
    type: string
    direction: 'inbound' | 'outbound'
  }>
}
```

#### 2. Service Layer

```typescript
// src/lib/services/ticket-relationships.ts
export class TicketRelationshipService {
  static async linkTickets(
    orgId: string,
    ticketId: string,
    relatedTicketId: string,
    type: RelationshipType,
    createdBy: string
  ): Promise<TicketRelationship>

  static async unlinkTickets(relationshipId: string, orgId: string): Promise<boolean>

  static async getRelationships(ticketId: string, orgId: string): Promise<TicketRelationship[]>

  static async validateRelationship(
    ticketId: string,
    relatedTicketId: string,
    type: RelationshipType
  ): Promise<{ valid: boolean; error?: string }>
}
```

#### 3. Validation Rules

- Prevent circular dependencies (A blocks B, B blocks A)
- Prevent self-linking (ticket cannot relate to itself)
- Duplicate detection (auto-detect similar tickets)
- Parent/child must be hierarchical (no loops)

### Implementation Steps

1. Create database schema and indexes
2. Implement `TicketRelationshipService` with validation
3. Create API routes (`/api/tickets/[id]/relationships`)
4. Build relationship picker UI
5. Build relationship visualization (graph view)
6. Add auto-duplicate detection (AI-powered)
7. Update ticket detail page with relationships section

### UI Components

- **Relationship Picker:** Modal to select ticket and relationship type
- **Relationship Graph:** Visual representation of connected tickets
- **Relationship List:** Table showing all relationships

---

## 4. Ticket Merge & Split

### Description

Merge duplicate tickets into one or split a ticket into multiple sub-tasks.

### Priority

**MEDIUM** - Nice to have for ticket management.

### Estimated Effort

**24-32 hours**

### Dependencies

- Ticket Relationships feature (for parent/child after split)

### Technical Approach

#### 1. Merge Tickets

```typescript
// src/lib/services/ticket-merge.ts
export class TicketMergeService {
  static async mergeTickets(
    orgId: string,
    sourceTicketIds: string[],
    targetTicketId: string,
    mergedBy: string
  ): Promise<Ticket> {
    // 1. Validate all tickets exist and are in same org
    // 2. Move all comments to target ticket
    // 3. Merge attachments
    // 4. Merge time entries
    // 5. Merge linked assets
    // 6. Close source tickets with "Merged into TKT-XXXXX" comment
    // 7. Create audit log entries
    // 8. Return updated target ticket
  }
}
```

#### 2. Split Ticket

```typescript
// src/lib/services/ticket-split.ts
export class TicketSplitService {
  static async splitTicket(
    orgId: string,
    sourceTicketId: string,
    splitConfig: {
      subtasks: Array<{
        title: string
        description: string
        assignedTo?: string
      }>
    },
    splitBy: string
  ): Promise<Ticket[]> {
    // 1. Validate source ticket exists
    // 2. Create new child tickets
    // 3. Create parent/child relationships
    // 4. Copy relevant attachments
    // 5. Update source ticket as parent
    // 6. Create audit log entries
    // 7. Return all created tickets
  }
}
```

### Implementation Steps

1. Implement `TicketMergeService`
2. Implement `TicketSplitService`
3. Create API routes
4. Build merge UI (multi-select + confirmation)
5. Build split UI (sub-task creator)
6. Add audit logging
7. Test edge cases (permissions, SLA, time tracking)

---

## 5. Advanced Reporting & Analytics

### Description

Comprehensive reporting with custom dashboards, charts, and exportable reports.

### Priority

**HIGH** - Critical for management oversight and data-driven decisions.

### Estimated Effort

**60-80 hours**

### Dependencies

- Charting library (Recharts, Chart.js, or similar)
- Export library (ExcelJS for Excel, jsPDF for PDF)

### Technical Approach

#### 1. Report Types

**Pre-Built Reports:**
- Ticket Volume Trend (line chart)
- SLA Compliance Report (% compliance over time)
- Technician Performance Report (resolution time, CSAT, workload)
- Category Distribution (pie chart)
- Priority Distribution (bar chart)
- First Contact Resolution Rate
- Average Resolution Time
- Ticket Aging Report (how long tickets are open)

**Custom Report Builder:**
- Drag-and-drop field selector
- Filter builder (date range, status, priority, etc.)
- Chart type selector
- Group by options
- Export options (PDF, Excel, CSV)

#### 2. Service Layer

```typescript
// src/lib/services/reports.ts
export class ReportService {
  static async getTicketVolumeReport(
    orgId: string,
    startDate: Date,
    endDate: Date,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<ReportData>

  static async getSLAComplianceReport(orgId: string, period: Period): Promise<SLAReport>

  static async getTechnicianPerformanceReport(orgId: string, userId?: string): Promise<PerformanceReport>

  static async generateCustomReport(orgId: string, config: CustomReportConfig): Promise<ReportData>

  static async exportReport(reportData: ReportData, format: 'pdf' | 'excel' | 'csv'): Promise<Buffer>
}
```

#### 3. Dashboard Widgets

- **Ticket Statistics:** Total, open, resolved counts
- **SLA Compliance Gauge:** % of tickets meeting SLA
- **Top Categories:** Bar chart of most common issues
- **Technician Leaderboard:** Top performers by CSAT
- **Trend Chart:** Ticket volume over time
- **Priority Breakdown:** Pie chart
- **Average Resolution Time:** KPI card

### Implementation Steps

1. Implement report calculation logic
2. Create API routes for reports
3. Build dashboard with widgets
4. Build custom report builder UI
5. Implement export functionality (PDF, Excel, CSV)
6. Add scheduled reports (email digest)
7. Add report caching for performance

---

## 6. Email-to-Ticket Integration

### Description

Automatically create tickets from incoming emails sent to a designated support address (e.g., support@company.com).

### Priority

**HIGH** - Critical for organizations receiving support via email.

### Estimated Effort

**40-50 hours**

### Dependencies

- Email provider with API access (Gmail API, Microsoft Graph, AWS SES inbound)
- Email parsing library
- Background job queue for processing emails

### Technical Approach

#### 1. Email Processing Service

```typescript
// src/lib/services/email-to-ticket.ts
export class EmailToTicketService {
  static async processInboundEmail(rawEmail: RawEmail): Promise<Ticket | null> {
    // 1. Parse email (from, to, subject, body, attachments)
    // 2. Check for existing ticket (reply threading)
    // 3. Extract requester (find or create user)
    // 4. Auto-categorize based on subject/body (AI)
    // 5. Extract priority indicators (URGENT, ASAP, etc.)
    // 6. Download and attach files
    // 7. Create ticket or add comment to existing
    // 8. Send confirmation email to requester
  }

  static async handleEmailReply(email: ParsedEmail, ticketId: string): Promise<void> {
    // Add comment to existing ticket
  }

  static async parseEmailBody(html: string, text: string): Promise<string> {
    // Remove email signatures, quoted text, etc.
  }
}
```

#### 2. Email Threading

Track email threads to update existing tickets:

```typescript
interface EmailThread {
  _id: ObjectId
  orgId: string
  ticketId: string
  messageId: string        // Email Message-ID header
  inReplyTo?: string       // In-Reply-To header
  references?: string[]    // References header
  createdAt: Date
}
```

#### 3. Spam Filtering

```typescript
export class SpamFilterService {
  static async isSpam(email: ParsedEmail): Promise<boolean> {
    // Check sender reputation
    // Check for spam keywords
    // Check attachment types
    // Use external spam detection API
  }
}
```

### Implementation Steps

1. Set up email forwarding or API access
2. Implement email parsing
3. Implement `EmailToTicketService`
4. Create background job for email processing
5. Implement threading logic
6. Add spam filtering
7. Build admin UI for email settings
8. Test with various email formats

---

## 7. Auto-Assignment Engine

### Description

Automatically assign tickets to technicians based on rules (round-robin, skillset, workload, availability).

### Priority

**HIGH** - Reduces manual work and improves response time.

### Estimated Effort

**32-40 hours**

### Dependencies

- None (standalone feature)

### Technical Approach

#### 1. Assignment Rules

```typescript
interface AssignmentRule extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string
  priority: number          // Higher priority rules checked first
  isActive: boolean

  // Conditions (when to apply this rule)
  conditions: {
    categories?: string[]
    priorities?: TicketPriority[]
    tags?: string[]
    requesterIds?: string[]
    businessHours?: boolean
  }

  // Assignment strategy
  strategy: 'round-robin' | 'least-loaded' | 'skill-based' | 'specific-user'

  // Target users (for strategy)
  targetUsers?: string[]

  // Fallback if no match
  fallbackUserId?: string

  createdAt: Date
  updatedAt: Date
}
```

#### 2. Assignment Engine

```typescript
// src/lib/services/auto-assignment.ts
export class AutoAssignmentService {
  static async assignTicket(ticket: Ticket): Promise<string | null> {
    // 1. Get all active rules for org
    // 2. Find first matching rule
    // 3. Apply assignment strategy
    // 4. Return assigned user ID
  }

  static async applyRoundRobin(users: string[]): Promise<string> {
    // Track last assigned user, assign to next
  }

  static async applyLeastLoaded(users: string[]): Promise<string> {
    // Find user with fewest open tickets
  }

  static async applySkillBased(ticket: Ticket, users: string[]): Promise<string> {
    // Match ticket category/tags to user skills
  }
}
```

### Implementation Steps

1. Create database schema for rules
2. Implement `AutoAssignmentService`
3. Create API routes for rules management
4. Build rule builder UI (admin section)
5. Hook into ticket creation API
6. Add manual override capability
7. Test all assignment strategies

---

## 8. Workflow Automation

### Description

Trigger-based automation system to perform actions when ticket events occur (e.g., if priority=critical AND category=network, notify network team).

### Priority

**MEDIUM-HIGH** - Powerful but complex feature.

### Estimated Effort

**60-80 hours**

### Dependencies

- Background job queue for async execution

### Technical Approach

#### 1. Workflow Schema

```typescript
interface WorkflowAutomation extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string
  description: string
  isActive: boolean

  // Trigger
  trigger: {
    event: 'created' | 'updated' | 'assigned' | 'escalated' | 'sla_breach'
    conditions: FilterCondition[]
  }

  // Actions
  actions: Array<{
    type: 'assign' | 'notify' | 'update_field' | 'add_comment' | 'webhook'
    config: Record<string, any>
  }>

  // Stats
  executionCount: number
  lastExecutedAt?: Date

  createdAt: Date
  updatedAt: Date
}
```

#### 2. Execution Engine

```typescript
// src/lib/services/workflow-engine.ts
export class WorkflowEngine {
  static async execute(trigger: TriggerEvent, ticket: Ticket): Promise<void> {
    // 1. Find matching workflows
    // 2. Evaluate conditions
    // 3. Execute actions
    // 4. Log execution
    // 5. Handle errors
  }

  static async evaluateConditions(conditions: FilterCondition[], ticket: Ticket): Promise<boolean> {
    // Check if all conditions match
  }

  static async executeAction(action: WorkflowAction, ticket: Ticket): Promise<void> {
    // Perform action (assign, notify, update, etc.)
  }
}
```

### Implementation Steps

1. Create database schema
2. Implement `WorkflowEngine`
3. Create API routes
4. Build workflow builder UI (visual editor)
5. Hook into all ticket event triggers
6. Add execution history/logs
7. Test complex workflows

---

## 9. AI-Powered Features

### Description

Use Google Gemini 2.0 Flash for intelligent features: auto-classification, suggested solutions, sentiment analysis, ticket summarization.

### Priority

**MEDIUM** - Competitive differentiator but not critical.

### Estimated Effort

**40-60 hours**

### Dependencies

- Google Gemini API access (already available)
- Token budget management

### Technical Approach

#### 1. Auto-Classification

```typescript
// src/lib/services/ai-ticket-assistant.ts
export class AITicketAssistant {
  static async classifyTicket(title: string, description: string): Promise<{
    category: string
    priority: TicketPriority
    tags: string[]
    confidence: number
  }> {
    const prompt = `Analyze this support ticket and suggest category, priority, and tags:
    Title: ${title}
    Description: ${description}

    Available categories: ${categories.join(', ')}

    Respond in JSON format.`

    const response = await gemini.generateContent(prompt)
    return JSON.parse(response.text())
  }
}
```

#### 2. Suggested Solutions

```typescript
static async suggestSolutions(ticket: Ticket): Promise<string[]> {
  // Find similar historical tickets
  // Use Gemini to suggest solutions based on resolutions
}
```

#### 3. Sentiment Analysis

```typescript
static async analyzeSentiment(content: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  score: number
  keywords: string[]
}> {
  // Detect customer emotion (angry, frustrated, satisfied)
}
```

### Implementation Steps

1. Implement AI service wrapper for Gemini
2. Create API routes for AI features
3. Add AI suggestions to ticket creation UI
4. Add sentiment indicators to comments
5. Build knowledge base integration
6. Add token usage monitoring
7. Test accuracy and performance

---

## 10. Custom Fields

### Description

Allow admins to define custom fields for tickets (text, number, dropdown, date, checkbox) specific to categories or organization needs.

### Priority

**MEDIUM** - Adds flexibility but requires complex UI.

### Estimated Effort

**40-50 hours**

### Dependencies

- None (standalone feature)

### Technical Approach

#### 1. Custom Field Definition

```typescript
interface CustomFieldDefinition extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string
  key: string                // Unique key for storage
  type: 'text' | 'number' | 'dropdown' | 'date' | 'checkbox' | 'multiselect'
  isRequired: boolean
  options?: string[]         // For dropdown/multiselect
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  appliesTo: {
    categories?: string[]    // Apply to specific categories only
    allTickets: boolean
  }
  order: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### 2. Store Custom Field Values

```typescript
// Add to Ticket type
interface Ticket {
  // ... existing fields
  customFields?: Record<string, any>
}
```

#### 3. Dynamic Form Rendering

```typescript
// src/components/tickets/CustomFieldsForm.tsx
export function CustomFieldsForm({ category }: { category: string }) {
  const { data: fields } = useCustomFields(category)

  return (
    <>
      {fields.map((field) => (
        <DynamicField key={field.key} field={field} />
      ))}
    </>
  )
}
```

### Implementation Steps

1. Create database schema
2. Implement custom field service
3. Create API routes
4. Build field definition UI (admin)
5. Build dynamic form renderer
6. Add validation
7. Update ticket creation/edit forms
8. Test with various field types

---

## Priority Matrix

| Feature | Priority | Effort | Impact | ROI |
|---------|----------|--------|--------|-----|
| Email Notifications | HIGH | 24-32h | High | Very High |
| Auto-Assignment | HIGH | 32-40h | High | High |
| Email-to-Ticket | HIGH | 40-50h | Very High | Very High |
| Reporting & Analytics | HIGH | 60-80h | Very High | High |
| Ticket Relationships | MEDIUM-HIGH | 32-40h | Medium | Medium |
| Workflow Automation | MEDIUM-HIGH | 60-80h | Very High | High |
| AI Features | MEDIUM | 40-60h | Medium | Medium |
| Ticket Merge/Split | MEDIUM | 24-32h | Low | Low |
| Ticket Templates | MEDIUM | 16-20h | Medium | Medium |
| Custom Fields | MEDIUM | 40-50h | Medium | Medium |

---

## Recommended Implementation Order

**Phase 1 (Quick Wins):**
1. Email Notifications (24-32h)
2. Ticket Templates (16-20h)

**Phase 2 (High-Value Features):**
3. Auto-Assignment Engine (32-40h)
4. Email-to-Ticket Integration (40-50h)
5. Advanced Reporting (60-80h)

**Phase 3 (Workflow & Intelligence):**
6. Workflow Automation (60-80h)
7. AI-Powered Features (40-60h)

**Phase 4 (Advanced Management):**
8. Ticket Relationships (32-40h)
9. Custom Fields (40-50h)
10. Ticket Merge/Split (24-32h)

**Total Estimated Effort:** 400-540 hours (10-13 weeks with 1 developer)

---

## Next Steps

1. Review this document with stakeholders
2. Prioritize features based on business needs
3. Allocate development resources
4. Create detailed specifications for Phase 1 features
5. Begin implementation in sprints

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Status:** Planning Phase
