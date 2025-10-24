# Workflow Templates Guide

This document provides a comprehensive guide to the 25 ITSM/ITIL workflow templates included in Deskwise.

## Table of Contents

- [Overview](#overview)
- [Installation & Seeding](#installation--seeding)
- [Workflow Categories](#workflow-categories)
- [Template Reference](#template-reference)
- [Customization Guide](#customization-guide)
- [Best Practices](#best-practices)

## Overview

Deskwise includes 25 pre-built workflow templates based on ITIL/ITSM best practices. These templates automate common IT service management tasks across all major modules:

- **Incident Management** - Auto-assignment, escalation, SLA tracking
- **Service Desk** - VIP handling, after-hours support, categorization
- **Change Management** - Approval workflows, implementation reminders
- **Problem Management** - Investigation workflows, duplicate detection
- **Asset Management** - Onboarding, warranty tracking
- **Knowledge Management** - Article suggestions, review workflows
- **Project Management** - Milestone tracking
- **Billing & Sales** - Invoice reminders, quote follow-ups
- **Scheduling** - Appointment reminders, maintenance notifications
- **Automation** - Recurring tasks, stale ticket cleanup

## Installation & Seeding

### For New Organizations

Workflow templates are automatically seeded when an organization is created. To manually seed:

```typescript
import { seedWorkflowTemplatesForOrganization } from '@/lib/services/workflow-seeding'

// During organization creation
const result = await seedWorkflowTemplatesForOrganization(orgId)
console.log(`Seeded ${result.seededCount} workflow templates`)
```

### For Existing Organizations

#### Option 1: Seed Specific Organization
```bash
npx ts-node scripts/seed-workflow-templates.ts --orgId=<your-org-id>
```

#### Option 2: Seed All Organizations
```bash
npx ts-node scripts/seed-workflow-templates.ts --all
```

#### Option 3: Programmatic Seeding
```typescript
import { seedWorkflowTemplatesForAllOrganizations } from '@/lib/services/workflow-seeding'

const result = await seedWorkflowTemplatesForAllOrganizations()
console.log(`Seeded workflows for ${result.successfulOrgs} organizations`)
console.log(`Total templates seeded: ${result.totalSeeded}`)
```

## Workflow Categories

### 🎫 Incident Management & Service Desk (10)
1. Auto-Assign Critical Tickets
2. Service Request Approval
3. SLA Escalation
4. Incident Response
5. VIP User Prioritization
6. After-Hours Escalation
7. Auto-Categorization
8. Duplicate Incident Detection
9. Auto-Close Stale Tickets
10. Unassigned Ticket Alert

### 🔄 Change & Problem Management (4)
11. Change Request Approval Flow
12. Change Implementation Reminder
13. Problem Investigation Workflow
14. First Response SLA Tracking

### 💻 Asset Management (2)
15. New Asset Onboarding
16. Asset Warranty Expiration Alert

### 📚 Knowledge Management (2)
17. Knowledge Article Suggestions
18. KB Article Review Workflow

### 📁 Project Management (1)
19. Project Milestone Tracking

### 💰 Billing & Sales (2)
20. Overdue Invoice Reminder
21. Quote Follow-Up Workflow

### 📅 Scheduling & Communication (3)
22. Appointment Reminder
23. Scheduled Maintenance Notification
24. Customer Satisfaction Survey

### 🤖 Automation & Tasks (1)
25. Recurring Task Automation

## Template Reference

### 1. Auto-Assign Critical Tickets

**Category:** Incident Management
**Trigger:** Ticket Created (Priority: Critical)
**Purpose:** Automatically routes critical priority tickets to the on-call technician

**Flow:**
1. Ticket created with critical priority
2. Check if within business hours
3. If business hours → Assign to on-call technician
4. If after hours → Assign to IT manager
5. Send email alert to assigned technician

**Customization Points:**
- Business hours definition (currently 8 AM - 5 PM)
- On-call technician assignment method
- Notification channels (email, SMS, in-app)

**Activation:**
```typescript
import { activateWorkflowTemplate } from '@/lib/services/workflow-seeding'
await activateWorkflowTemplate(orgId, 'Auto-Assign Critical Tickets')
```

---

### 2. Service Request Approval

**Category:** Service Desk
**Trigger:** Ticket Created (Type: Service Request)
**Purpose:** Route service requests for approval based on estimated cost

**Flow:**
1. Service request created
2. Check estimated cost
3. If cost > $1000 → Require CAB approval
4. If cost ≤ $1000 → Manager approval
5. Update ticket status based on approval decision
6. Notify requester of decision

**Customization Points:**
- Cost threshold ($1000 default)
- Approval timeout (24-48 hours)
- Approval groups (CAB members, managers)

---

### 3. SLA Escalation

**Category:** SLA Management
**Trigger:** Schedule (Every 15 minutes)
**Purpose:** Prevent SLA breaches by proactive escalation

**Flow:**
1. Find tickets within 30 minutes of SLA breach
2. For each at-risk ticket:
   - Escalate to manager
   - Send urgent notification
   - Update priority if needed

**Customization Points:**
- Warning threshold (30 minutes default)
- Escalation target (manager, team lead)
- Check frequency (15 minutes)

---

### 4. VIP User Prioritization

**Category:** Service Desk
**Trigger:** Ticket Created
**Purpose:** Expedite support for VIP users

**Flow:**
1. Check if requester is VIP user
2. If VIP:
   - Upgrade priority to High
   - Add VIP tag
   - Notify senior technician
   - Assign to skill-based queue (VIP support)

**Customization Points:**
- VIP user identification method
- Priority level (High, Urgent)
- Notification recipients

---

### 5. Auto-Categorization

**Category:** Service Desk (AI-Powered)
**Trigger:** Ticket Created
**Purpose:** Automatically categorize and tag tickets using AI

**Flow:**
1. Analyze ticket title and description with AI
2. Apply suggested category
3. Apply suggested tags
4. If confidence > 80% → Auto-assign based on category

**Customization Points:**
- AI confidence threshold (80% default)
- Category-to-team mapping
- Auto-assignment rules

---

### 6. Knowledge Article Suggestions

**Category:** Knowledge Management
**Trigger:** Ticket Created/Updated
**Purpose:** Suggest relevant KB articles to technicians

**Flow:**
1. Search knowledge base for similar issues
2. If articles found:
   - Add as internal comment
   - Notify assigned technician

**Customization Points:**
- Search similarity threshold
- Maximum articles to suggest (5 default)
- Notification method

---

### 7. Customer Satisfaction Survey

**Category:** Feedback
**Trigger:** Ticket Status → Resolved
**Purpose:** Collect CSAT ratings automatically

**Flow:**
1. Wait 1 hour after resolution
2. Check if still resolved (not reopened)
3. Send CSAT survey email
4. Mark survey as sent

**Customization Points:**
- Wait time (1 hour default)
- Survey template
- Survey channels (email, in-app)

---

### 8. Change Request Approval Flow

**Category:** Change Management
**Trigger:** Change Request Created
**Purpose:** Multi-level approval based on risk

**Flow:**
1. Check risk level
2. If High Risk → CAB approval (majority vote, 48hr timeout)
3. If Low/Medium Risk → Manager approval (24hr timeout)
4. Update status based on decision
5. Notify requester

**Customization Points:**
- Risk thresholds
- Approval groups
- Timeout periods

---

### 9. Problem Investigation Workflow

**Category:** Problem Management
**Trigger:** Problem Record Created
**Purpose:** Structured root cause analysis

**Flow:**
1. Assign to problem manager
2. Find and link related incidents
3. Notify investigation team
4. Wait 7 days for RCA
5. If RCA incomplete → Send reminder

**Customization Points:**
- Investigation period (7 days)
- Related incident search criteria
- Team notifications

---

### 10. Asset Warranty Expiration Alert

**Category:** Asset Management
**Trigger:** Schedule (Daily at 9 AM)
**Purpose:** Proactive warranty management

**Flow:**
1. Find assets with warranties expiring in 30 days
2. For each asset:
   - Send email to asset manager
   - Create renewal task
   - Mark alert as sent

**Customization Points:**
- Warning period (30 days)
- Notification recipients
- Task assignment

---

### 11. Overdue Invoice Reminder

**Category:** Billing
**Trigger:** Schedule (Daily at 10 AM)
**Purpose:** Automate collections

**Flow:**
1. Find overdue invoices
2. For each invoice:
   - Check days overdue
   - If 7, 14, or 30 days → Send reminder
   - Log reminder in invoice history

**Customization Points:**
- Reminder schedule (7, 14, 30 days)
- Email templates
- Escalation rules

---

### 12. Quote Follow-Up Workflow

**Category:** Sales
**Trigger:** Quote Status → Sent
**Purpose:** Automated follow-up sequence

**Flow:**
1. Wait 3 days
2. If still pending → Send first follow-up
3. Wait 4 more days
4. If still pending → Send final follow-up
5. If no response → Mark as lost

**Customization Points:**
- Follow-up intervals (3, 7 days)
- Email templates
- Lost quote criteria

---

### 13. Scheduled Maintenance Notification

**Category:** Communication
**Trigger:** Maintenance Window Created
**Purpose:** Multi-stage user communication

**Flow:**
1. Send immediate announcement
2. Wait until 24 hours before
3. Send 24-hour reminder
4. Wait until 1 hour before
5. Send final warning

**Customization Points:**
- Notification times
- Recipient groups
- Notification channels

---

### 14. Appointment Reminder

**Category:** Scheduling
**Trigger:** Schedule (Hourly)
**Purpose:** Reduce no-shows

**Flow:**
1. Find appointments in next 24 hours
2. For each appointment:
   - Notify client
   - Notify technician
   - Mark reminder sent

**Customization Points:**
- Reminder window (24 hours)
- Notification templates
- Channels (email, SMS)

---

### 15. Auto-Close Stale Tickets

**Category:** Housekeeping
**Trigger:** Schedule (Daily at 2 AM)
**Purpose:** Clean up resolved tickets

**Flow:**
1. Find tickets resolved for 7+ days
2. For each ticket:
   - Update status to closed
   - Notify requester (option to reopen)

**Customization Points:**
- Staleness period (7 days)
- Auto-close criteria
- Reopen instructions

---

## Customization Guide

### Activating Templates

Templates are created in **inactive** state by default. To activate:

```typescript
import { activateWorkflowTemplate } from '@/lib/services/workflow-seeding'

// Activate single template
await activateWorkflowTemplate(orgId, 'Auto-Assign Critical Tickets')
```

### Deactivating Templates

```typescript
import { deactivateWorkflowTemplate } from '@/lib/services/workflow-seeding'

await deactivateWorkflowTemplate(orgId, 'Auto-Categorization')
```

### Modifying Templates

1. Navigate to **Settings → Workflows**
2. Find the template in the list
3. Click **Edit** to open workflow builder
4. Modify nodes, edges, or trigger conditions
5. Save as custom workflow

**Note:** Editing a system template creates a new custom workflow. The original template remains unchanged.

### Creating Custom Templates

Based on existing templates:

1. Clone an existing template
2. Modify for your specific needs
3. Save with descriptive name
4. Test thoroughly before activating

## Best Practices

### Activation Strategy

1. **Start Small:** Activate 3-5 high-priority workflows first
2. **Monitor Performance:** Track execution success rates and timing
3. **Gather Feedback:** Ask technicians about workflow effectiveness
4. **Iterate:** Adjust thresholds and conditions based on feedback
5. **Scale Gradually:** Activate more workflows as team adapts

### Recommended Initial Workflows

For most organizations, start with:

1. **Auto-Assign Critical Tickets** - Immediate impact on response times
2. **SLA Escalation** - Prevent SLA breaches
3. **Customer Satisfaction Survey** - Start collecting CSAT data
4. **Asset Warranty Expiration Alert** - Avoid surprise expirations
5. **Auto-Close Stale Tickets** - Keep ticket queue clean

### Monitoring & Maintenance

- Review workflow execution logs weekly
- Check for failed executions and investigate
- Update notification recipients as team changes
- Adjust thresholds based on actual performance data
- Review and update quarterly

### Common Customizations

#### Business Hours

Many workflows use business hours (8 AM - 5 PM). Update in workflow conditions:

```json
{
  "field": "trigger.createdAt.hour",
  "operator": "greater-than",
  "value": 8
}
```

#### Notification Recipients

Update recipient lists in notification nodes:

```json
{
  "channel": "email",
  "recipients": ["your-team@example.com"],
  "subject": "...",
  "body": "..."
}
```

#### Time Thresholds

Adjust wait times in delay nodes:

```json
{
  "delayType": "duration",
  "duration": 3600000  // milliseconds (1 hour = 3600000)
}
```

## Getting Help

- **Documentation:** See CLAUDE.md for workflow system architecture
- **Template Issues:** Check workflow execution logs for errors
- **Customization Help:** Use workflow builder visual editor
- **Support:** Contact your system administrator

---

**Last Updated:** 2025-10-24
**Version:** 1.0.0
**Templates:** 25
