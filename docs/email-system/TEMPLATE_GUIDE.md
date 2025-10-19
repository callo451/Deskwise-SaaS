# Email Template Creation Guide

## Table of Contents

- [Introduction](#introduction)
- [Understanding Email Templates](#understanding-email-templates)
- [Template Variables Reference](#template-variables-reference)
  - [Ticket Variables](#ticket-variables)
  - [Incident Variables](#incident-variables)
  - [Change Request Variables](#change-request-variables)
  - [User Variables](#user-variables)
  - [Organization Variables](#organization-variables)
  - [System Variables](#system-variables)
  - [Asset Variables](#asset-variables)
  - [Project Variables](#project-variables)
- [Handlebars Template Syntax](#handlebars-template-syntax)
  - [Basic Variables](#basic-variables)
  - [Conditionals](#conditionals)
  - [Loops](#loops)
  - [Built-in Helpers](#built-in-helpers)
  - [Custom Helpers](#custom-helpers)
- [HTML Email Best Practices](#html-email-best-practices)
  - [Mobile-Responsive Design](#mobile-responsive-design)
  - [Plain Text Fallback](#plain-text-fallback)
  - [Image Optimization](#image-optimization)
  - [Testing Across Email Clients](#testing-across-email-clients)
- [Example Templates](#example-templates)
  - [Ticket Created](#example-ticket-created)
  - [Ticket Assigned](#example-ticket-assigned)
  - [SLA Breach Warning](#example-sla-breach-warning)
  - [Daily Digest](#example-daily-digest)
  - [Weekly Summary Report](#example-weekly-summary-report)
  - [Incident Notification](#example-incident-notification)
- [Template Testing and Preview](#template-testing-and-preview)
- [Common Mistakes to Avoid](#common-mistakes-to-avoid)
- [Template Library](#template-library)

## Introduction

Email templates in Deskwise allow you to create professional, consistent, and automated email notifications for various events in your IT service management workflow. Templates use the Handlebars templating language to dynamically insert data from tickets, incidents, users, and other system entities.

**Key Benefits:**
- **Consistency:** All notifications follow your organization's branding
- **Automation:** No manual email composition required
- **Personalization:** Dynamic content based on event data
- **Efficiency:** Reusable templates for common scenarios
- **Multi-language Support:** Create templates in different languages

**Who Creates Templates:**
- System administrators
- IT managers
- Communications team members

**Required Permission:**
- `settings.email.templates` - Manage email templates

## Understanding Email Templates

### Template Structure

Every email template consists of:

1. **Metadata:**
   - Name (internal identifier)
   - Display name (shown in UI)
   - Description
   - Category (Tickets, Incidents, etc.)
   - Status (Active/Inactive)

2. **Content:**
   - Subject line (with variables)
   - HTML body (with variables and styling)
   - Plain text body (fallback)

3. **Variables:**
   - Placeholders replaced with actual data
   - Module-specific (ticket, user, etc.)
   - System-wide (org name, current date, etc.)

### How Templates Work

```
Event Occurs → Notification Rule Triggered → Template Selected → Variables Populated → Email Sent
```

**Example Flow:**
1. Ticket #12345 assigned to John Doe
2. "Ticket Assigned" rule triggers
3. Template "ticket-assigned" selected
4. Variables populated: `{{ticket.id}}` → `12345`, `{{assignee.name}}` → `John Doe`
5. Email sent to John Doe

### Template Naming Conventions

**Best Practices:**
- Use lowercase with hyphens: `ticket-assigned`
- Include module prefix: `ticket-`, `incident-`, `change-`
- Descriptive names: `sla-breach-warning` not `template-1`
- Version if needed: `ticket-assigned-v2`

**Examples:**
- `ticket-created`
- `ticket-status-changed`
- `incident-critical-alert`
- `change-approval-requested`
- `daily-digest-tickets`
- `weekly-summary-report`

## Template Variables Reference

Variables use double curly braces: `{{variable.name}}`

### Ticket Variables

Available when template is used for ticket-related events:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{ticket.id}}` | String | Ticket ID | `12345` |
| `{{ticket.title}}` | String | Ticket title | `Printer Not Working` |
| `{{ticket.description}}` | String | Full description | `The HP printer...` |
| `{{ticket.status}}` | String | Current status | `Open`, `In Progress`, `Resolved` |
| `{{ticket.priority}}` | String | Priority level | `Low`, `Medium`, `High`, `Critical` |
| `{{ticket.category}}` | String | Ticket category | `Hardware`, `Software`, `Network` |
| `{{ticket.subcategory}}` | String | Subcategory | `Printer`, `Email Client` |
| `{{ticket.queue}}` | String | Assigned queue | `IT Support`, `Network Team` |
| `{{ticket.tags}}` | Array | Tags | `['urgent', 'hardware']` |
| `{{ticket.createdAt}}` | Date | Creation timestamp | `2025-10-18T10:30:00Z` |
| `{{ticket.updatedAt}}` | Date | Last update | `2025-10-18T14:22:00Z` |
| `{{ticket.dueDate}}` | Date | Due date | `2025-10-20T17:00:00Z` |
| `{{ticket.resolvedAt}}` | Date | Resolution time | `2025-10-19T09:15:00Z` |
| `{{ticket.closedAt}}` | Date | Closure time | `2025-10-19T10:00:00Z` |
| `{{ticket.requester.id}}` | String | Requester user ID | `user_abc123` |
| `{{ticket.requester.name}}` | String | Requester name | `Jane Smith` |
| `{{ticket.requester.email}}` | String | Requester email | `jane.smith@company.com` |
| `{{ticket.requester.phone}}` | String | Requester phone | `+1-555-0100` |
| `{{ticket.requester.department}}` | String | Department | `Marketing` |
| `{{ticket.assignee.id}}` | String | Assignee user ID | `user_def456` |
| `{{ticket.assignee.name}}` | String | Assignee name | `John Doe` |
| `{{ticket.assignee.email}}` | String | Assignee email | `john.doe@company.com` |
| `{{ticket.assignee.phone}}` | String | Assignee phone | `+1-555-0101` |
| `{{ticket.sla.name}}` | String | SLA policy name | `Standard Support` |
| `{{ticket.sla.responseTime}}` | Number | Response time (hours) | `4` |
| `{{ticket.sla.resolutionTime}}` | Number | Resolution time (hours) | `24` |
| `{{ticket.sla.timeRemaining}}` | Number | Time remaining (minutes) | `120` |
| `{{ticket.sla.percentElapsed}}` | Number | % of SLA elapsed | `75` |
| `{{ticket.sla.breached}}` | Boolean | SLA breached? | `true`, `false` |
| `{{ticket.watchers}}` | Array | List of watchers | `[{name: 'User1', email: '...'}]` |
| `{{ticket.attachments}}` | Array | Attachments | `[{name: 'screenshot.png', url: '...'}]` |
| `{{ticket.comments}}` | Array | Comments | `[{author: '...', text: '...', date: '...'}]` |
| `{{ticket.customFields}}` | Object | Custom fields | `{field1: 'value1'}` |

### Incident Variables

Available for incident-related events:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{incident.id}}` | String | Incident ID | `INC-2025-001` |
| `{{incident.title}}` | String | Incident title | `Email Server Outage` |
| `{{incident.description}}` | String | Description | `All users unable to...` |
| `{{incident.status}}` | String | Status | `New`, `Investigating`, `Resolved` |
| `{{incident.priority}}` | String | Priority | `P1`, `P2`, `P3`, `P4` |
| `{{incident.severity}}` | String | Severity | `Critical`, `High`, `Medium`, `Low` |
| `{{incident.impact}}` | String | Impact level | `Widespread`, `Multiple Users`, `Single User` |
| `{{incident.urgency}}` | String | Urgency | `High`, `Medium`, `Low` |
| `{{incident.category}}` | String | Category | `Service Outage`, `Performance` |
| `{{incident.affectedServices}}` | Array | Affected services | `['Email', 'CRM']` |
| `{{incident.affectedUsers}}` | Number | User count | `150` |
| `{{incident.rootCause}}` | String | Root cause | `Hardware failure` |
| `{{incident.workaround}}` | String | Temporary fix | `Use webmail instead` |
| `{{incident.createdAt}}` | Date | Created date | `2025-10-18T09:00:00Z` |
| `{{incident.detectedAt}}` | Date | Detection time | `2025-10-18T08:55:00Z` |
| `{{incident.resolvedAt}}` | Date | Resolution time | `2025-10-18T11:30:00Z` |
| `{{incident.reporter.name}}` | String | Reporter | `John Doe` |
| `{{incident.assignedTeam}}` | String | Team | `Network Operations` |
| `{{incident.relatedTickets}}` | Array | Related tickets | `['12345', '12346']` |

### Change Request Variables

Available for change management events:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{change.id}}` | String | Change ID | `CHG-2025-050` |
| `{{change.title}}` | String | Change title | `Upgrade Email Server` |
| `{{change.description}}` | String | Description | `Upgrade to Exchange 2025` |
| `{{change.status}}` | String | Status | `Requested`, `Approved`, `In Progress` |
| `{{change.type}}` | String | Change type | `Standard`, `Emergency`, `Normal` |
| `{{change.risk}}` | String | Risk level | `Low`, `Medium`, `High` |
| `{{change.priority}}` | String | Priority | `Low`, `Medium`, `High`, `Critical` |
| `{{change.category}}` | String | Category | `Infrastructure`, `Application` |
| `{{change.implementer.name}}` | String | Implementer | `John Doe` |
| `{{change.approver.name}}` | String | Approver | `Jane Smith` |
| `{{change.scheduledStart}}` | Date | Start time | `2025-10-20T18:00:00Z` |
| `{{change.scheduledEnd}}` | Date | End time | `2025-10-20T22:00:00Z` |
| `{{change.actualStart}}` | Date | Actual start | `2025-10-20T18:05:00Z` |
| `{{change.actualEnd}}` | Date | Actual end | `2025-10-20T21:45:00Z` |
| `{{change.rollbackPlan}}` | String | Rollback steps | `Restore from backup...` |
| `{{change.testPlan}}` | String | Testing steps | `Verify email flow...` |
| `{{change.affectedSystems}}` | Array | Systems | `['Email Server', 'CRM']` |
| `{{change.downtime}}` | Number | Downtime (minutes) | `30` |

### User Variables

Available for the current user context (recipient, assignee, etc.):

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{user.id}}` | String | User ID | `user_abc123` |
| `{{user.name}}` | String | Full name | `John Doe` |
| `{{user.firstName}}` | String | First name | `John` |
| `{{user.lastName}}` | String | Last name | `Doe` |
| `{{user.email}}` | String | Email address | `john.doe@company.com` |
| `{{user.phone}}` | String | Phone number | `+1-555-0100` |
| `{{user.mobile}}` | String | Mobile number | `+1-555-0200` |
| `{{user.title}}` | String | Job title | `IT Technician` |
| `{{user.department}}` | String | Department | `IT Support` |
| `{{user.location}}` | String | Office location | `New York Office` |
| `{{user.timezone}}` | String | Timezone | `America/New_York` |
| `{{user.language}}` | String | Preferred language | `en`, `es`, `fr` |
| `{{user.role}}` | String | System role | `Administrator`, `Technician` |

### Organization Variables

Available in all templates:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{org.id}}` | String | Organization ID | `org_xyz789` |
| `{{org.name}}` | String | Organization name | `Acme Corporation` |
| `{{org.domain}}` | String | Primary domain | `acme.com` |
| `{{org.logo}}` | String | Logo URL | `https://...` |
| `{{org.supportEmail}}` | String | Support email | `support@acme.com` |
| `{{org.supportPhone}}` | String | Support phone | `+1-555-SUPPORT` |
| `{{org.website}}` | String | Website URL | `https://acme.com` |
| `{{org.address}}` | String | Physical address | `123 Main St, New York, NY` |
| `{{org.timezone}}` | String | Default timezone | `America/New_York` |

### System Variables

Available in all templates:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{system.url}}` | String | Deskwise instance URL | `https://deskwise.acme.com` |
| `{{system.name}}` | String | System name | `Deskwise ITSM` |
| `{{system.version}}` | String | System version | `2.5.0` |
| `{{current.date}}` | Date | Current date/time | `2025-10-18T10:30:00Z` |
| `{{current.year}}` | Number | Current year | `2025` |
| `{{notification.id}}` | String | Notification ID | `notif_abc123` |
| `{{notification.type}}` | String | Notification type | `ticket.assigned` |

### Asset Variables

Available for asset-related events:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{asset.id}}` | String | Asset ID | `AST-12345` |
| `{{asset.name}}` | String | Asset name | `LAPTOP-JD-001` |
| `{{asset.type}}` | String | Asset type | `Laptop`, `Server`, `Phone` |
| `{{asset.category}}` | String | Category | `Hardware` |
| `{{asset.manufacturer}}` | String | Manufacturer | `Dell` |
| `{{asset.model}}` | String | Model | `Latitude 7420` |
| `{{asset.serialNumber}}` | String | Serial number | `ABC123XYZ` |
| `{{asset.status}}` | String | Status | `Active`, `In Storage`, `Retired` |
| `{{asset.assignee.name}}` | String | Assigned to | `John Doe` |
| `{{asset.location}}` | String | Location | `New York Office - Floor 3` |
| `{{asset.purchaseDate}}` | Date | Purchase date | `2024-01-15T00:00:00Z` |
| `{{asset.warrantyExpiry}}` | Date | Warranty expiry | `2027-01-15T00:00:00Z` |

### Project Variables

Available for project-related events:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `{{project.id}}` | String | Project ID | `PRJ-2025-005` |
| `{{project.name}}` | String | Project name | `Website Redesign` |
| `{{project.description}}` | String | Description | `Redesign company website...` |
| `{{project.status}}` | String | Status | `Planning`, `In Progress`, `Completed` |
| `{{project.priority}}` | String | Priority | `Low`, `Medium`, `High` |
| `{{project.manager.name}}` | String | Project manager | `Jane Smith` |
| `{{project.startDate}}` | Date | Start date | `2025-09-01T00:00:00Z` |
| `{{project.endDate}}` | Date | End date | `2025-12-31T00:00:00Z` |
| `{{project.budget}}` | Number | Budget | `50000` |
| `{{project.percentComplete}}` | Number | % complete | `75` |
| `{{project.team}}` | Array | Team members | `[{name: 'John'}, {name: 'Jane'}]` |

## Handlebars Template Syntax

Deskwise uses [Handlebars](https://handlebarsjs.com/) templating language for email templates.

### Basic Variables

**Syntax:** `{{variable}}`

**Example:**
```handlebars
Hello {{user.name}},

Ticket #{{ticket.id}} has been created.
```

**Output:**
```
Hello John Doe,

Ticket #12345 has been created.
```

**HTML-Escaped Variables:**
```handlebars
<p>{{ticket.description}}</p>
```
Automatically escapes HTML characters for security.

**Unescaped Variables (use with caution):**
```handlebars
<div>{{{ticket.htmlContent}}}</div>
```
Triple braces output raw HTML without escaping.

### Conditionals

**If Statement:**
```handlebars
{{#if ticket.assignee}}
  Assigned to: {{ticket.assignee.name}}
{{else}}
  Not yet assigned
{{/if}}
```

**If-Else Chain:**
```handlebars
{{#if ticket.priority == 'Critical'}}
  <span style="color: red;">CRITICAL PRIORITY</span>
{{else if ticket.priority == 'High'}}
  <span style="color: orange;">High Priority</span>
{{else}}
  <span style="color: green;">Normal Priority</span>
{{/if}}
```

**Checking for Existence:**
```handlebars
{{#if ticket.dueDate}}
  Due: {{formatDate ticket.dueDate}}
{{else}}
  No due date set
{{/if}}
```

**Negation:**
```handlebars
{{#unless ticket.resolved}}
  This ticket is still open.
{{/unless}}
```

**Complex Conditions:**
```handlebars
{{#if (and ticket.assignee (eq ticket.status 'Open'))}}
  Assigned and open
{{/if}}

{{#if (or (eq ticket.priority 'High') (eq ticket.priority 'Critical'))}}
  High priority ticket!
{{/if}}
```

### Loops

**Each Loop:**
```handlebars
<h3>Comments:</h3>
<ul>
{{#each ticket.comments}}
  <li>
    <strong>{{this.author}}</strong> ({{formatDate this.date}}):
    {{this.text}}
  </li>
{{/each}}
</ul>
```

**Accessing Index:**
```handlebars
{{#each ticket.watchers}}
  {{@index}}. {{this.name}} ({{this.email}})
{{/each}}
```

**Checking for Empty:**
```handlebars
{{#each ticket.attachments}}
  <a href="{{this.url}}">{{this.name}}</a>
{{else}}
  <p>No attachments</p>
{{/each}}
```

**Nested Loops:**
```handlebars
{{#each projects}}
  <h3>{{this.name}}</h3>
  <ul>
  {{#each this.tasks}}
    <li>{{this.title}}</li>
  {{/each}}
  </ul>
{{/each}}
```

### Built-in Helpers

Deskwise provides custom Handlebars helpers:

#### Date Formatting

**formatDate:**
```handlebars
{{formatDate ticket.createdAt}}
<!-- Output: October 18, 2025 10:30 AM -->

{{formatDate ticket.createdAt format="short"}}
<!-- Output: 10/18/25, 10:30 AM -->

{{formatDate ticket.createdAt format="medium"}}
<!-- Output: Oct 18, 2025, 10:30:00 AM -->

{{formatDate ticket.createdAt format="long"}}
<!-- Output: October 18, 2025 at 10:30:00 AM EDT -->

{{formatDate ticket.createdAt format="YYYY-MM-DD"}}
<!-- Output: 2025-10-18 -->

{{formatDate ticket.createdAt timezone="America/Los_Angeles"}}
<!-- Output: October 18, 2025 7:30 AM (converted to PT) -->
```

**formatRelativeTime:**
```handlebars
{{formatRelativeTime ticket.createdAt}}
<!-- Output: 2 hours ago -->
<!-- Output: in 3 days -->
```

**formatDuration:**
```handlebars
{{formatDuration ticket.sla.timeRemaining}}
<!-- Input: 125 (minutes) -->
<!-- Output: 2 hours 5 minutes -->
```

#### String Manipulation

**uppercase:**
```handlebars
{{uppercase ticket.status}}
<!-- Input: open -->
<!-- Output: OPEN -->
```

**lowercase:**
```handlebars
{{lowercase ticket.priority}}
<!-- Input: HIGH -->
<!-- Output: high -->
```

**capitalize:**
```handlebars
{{capitalize user.firstName}}
<!-- Input: john -->
<!-- Output: John -->
```

**truncate:**
```handlebars
{{truncate ticket.description length=100}}
<!-- Truncates to 100 characters with "..." -->

{{truncate ticket.title length=50 omission="…"}}
<!-- Custom omission character -->
```

**replace:**
```handlebars
{{replace ticket.category search="Hardware" replacement="HW"}}
<!-- Input: Hardware Issue -->
<!-- Output: HW Issue -->
```

#### Number Formatting

**formatNumber:**
```handlebars
{{formatNumber project.budget}}
<!-- Input: 50000 -->
<!-- Output: 50,000 -->

{{formatNumber ticket.sla.percentElapsed decimals=1}}
<!-- Input: 75.5678 -->
<!-- Output: 75.6 -->
```

**formatCurrency:**
```handlebars
{{formatCurrency project.budget}}
<!-- Input: 50000 -->
<!-- Output: $50,000.00 -->

{{formatCurrency project.budget currency="EUR"}}
<!-- Output: €50,000.00 -->
```

#### Comparison Helpers

**eq (equals):**
```handlebars
{{#if (eq ticket.status 'Open')}}
  This ticket is open
{{/if}}
```

**ne (not equals):**
```handlebars
{{#if (ne ticket.assignee null)}}
  Assigned to {{ticket.assignee.name}}
{{/if}}
```

**gt (greater than):**
```handlebars
{{#if (gt ticket.sla.percentElapsed 80)}}
  SLA nearly breached!
{{/if}}
```

**lt (less than):**
```handlebars
{{#if (lt ticket.sla.timeRemaining 60)}}
  Less than 1 hour remaining
{{/if}}
```

**and, or:**
```handlebars
{{#if (and ticket.assignee (eq ticket.status 'Open'))}}
  Assigned and still open
{{/if}}

{{#if (or (eq ticket.priority 'High') (eq ticket.priority 'Critical'))}}
  Requires immediate attention
{{/if}}
```

#### Array/List Helpers

**join:**
```handlebars
{{join ticket.tags separator=", "}}
<!-- Input: ['urgent', 'hardware', 'printer'] -->
<!-- Output: urgent, hardware, printer -->
```

**length:**
```handlebars
{{length ticket.comments}} comment(s)
<!-- Input: [comment1, comment2, comment3] -->
<!-- Output: 3 comment(s) -->
```

**first:**
```handlebars
{{first ticket.comments.text}}
<!-- Returns first comment text -->
```

**last:**
```handlebars
{{last ticket.comments.text}}
<!-- Returns last comment text -->
```

#### URL/Link Helpers

**ticketUrl:**
```handlebars
<a href="{{ticketUrl ticket.id}}">View Ticket</a>
<!-- Output: <a href="https://deskwise.acme.com/tickets/12345">View Ticket</a> -->
```

**incidentUrl:**
```handlebars
<a href="{{incidentUrl incident.id}}">View Incident</a>
```

**userProfileUrl:**
```handlebars
<a href="{{userProfileUrl user.id}}">View Profile</a>
```

### Custom Helpers

You can reference custom helpers defined in the system:

**priorityBadge:**
```handlebars
{{{priorityBadge ticket.priority}}}
<!-- Outputs styled HTML badge for priority -->
```

**statusBadge:**
```handlebars
{{{statusBadge ticket.status}}}
<!-- Outputs styled HTML badge for status -->
```

**slaIndicator:**
```handlebars
{{{slaIndicator ticket.sla}}}
<!-- Outputs color-coded SLA indicator -->
```

**gravatar:**
```handlebars
<img src="{{gravatar user.email size=50}}" alt="{{user.name}}">
<!-- Generates Gravatar image URL -->
```

## HTML Email Best Practices

### Mobile-Responsive Design

**Use Max-Width Container:**
```html
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Email content -->
</div>
```

**Responsive Tables:**
```html
<table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
  <tr>
    <td>Content</td>
  </tr>
</table>
```

**Media Queries:**
```html
<style>
  @media only screen and (max-width: 600px) {
    .container {
      width: 100% !important;
      padding: 10px !important;
    }
    .button {
      width: 100% !important;
      display: block !important;
    }
  }
</style>
```

**Touch-Friendly Buttons:**
```html
<a href="{{ticketUrl ticket.id}}" style="
  display: inline-block;
  background-color: #4F46E5;
  color: white;
  padding: 14px 28px;
  text-decoration: none;
  border-radius: 5px;
  font-size: 16px;
  min-height: 44px; /* iOS recommended touch target */
">View Ticket</a>
```

**Readable Font Sizes:**
```html
<p style="font-size: 16px; line-height: 1.6;">
  <!-- Minimum 14px for body text -->
</p>
```

### Plain Text Fallback

**Always provide plain text version:**

**HTML:**
```html
<div style="background-color: #f0f0f0; padding: 20px;">
  <h1 style="color: #333;">Ticket Assigned</h1>
  <p>Ticket #{{ticket.id}} has been assigned to you.</p>
  <a href="{{ticketUrl ticket.id}}" style="background-color: #4F46E5; color: white; padding: 10px 20px;">View Ticket</a>
</div>
```

**Plain Text:**
```
TICKET ASSIGNED

Ticket #{{ticket.id}} has been assigned to you.

View Ticket: {{ticketUrl ticket.id}}
```

**Why Plain Text Matters:**
- Accessibility for screen readers
- Fallback when HTML blocked
- Better spam scores
- Some users prefer plain text

### Image Optimization

**Best Practices:**
1. **Always use `alt` text:**
   ```html
   <img src="{{org.logo}}" alt="{{org.name}} Logo" width="150">
   ```

2. **Specify dimensions:**
   ```html
   <img src="logo.png" width="150" height="50" alt="Logo">
   ```

3. **Use absolute URLs:**
   ```html
   <img src="https://yourdomain.com/images/logo.png" alt="Logo">
   ```

4. **Don't rely solely on images:**
   - Images may be blocked by default
   - Important info should be in text

5. **Optimize file sizes:**
   - Logo: < 50 KB
   - Icons: < 10 KB
   - Use PNG for logos, JPG for photos

6. **Fallback background colors:**
   ```html
   <td style="background-color: #4F46E5;">
     <img src="header.png" alt="Header" style="display: block;">
   </td>
   ```

### Testing Across Email Clients

**Email clients behave differently:**

**Common Email Clients:**
- Gmail (web, iOS, Android)
- Outlook (2016, 2019, Microsoft 365, web)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- AOL Mail
- Thunderbird

**CSS Support Varies:**
- ✅ Inline styles (supported everywhere)
- ⚠️ `<style>` tags (limited support)
- ❌ External stylesheets (not supported)
- ❌ JavaScript (never supported)

**Use Inline Styles:**
```html
<!-- Good -->
<p style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Text</p>

<!-- Bad -->
<p class="text">Text</p>
```

**Testing Tools:**
- [Litmus](https://litmus.com) - Paid testing service
- [Email on Acid](https://www.emailonacid.com) - Paid testing
- Send to yourself on multiple clients (free)
- Deskwise preview feature

**Test Checklist:**
- [ ] Subject line not cut off (< 50 characters)
- [ ] Sender name displays correctly
- [ ] Layout not broken in Outlook
- [ ] Images load (or alt text shows)
- [ ] Links are clickable
- [ ] Buttons are touch-friendly (mobile)
- [ ] Text readable without images
- [ ] No horizontal scrolling (mobile)
- [ ] Unsubscribe link works

## Example Templates

### Example: Ticket Created

**Template Name:** `ticket-created`
**Category:** Tickets
**Description:** Sent when new ticket is created

**Subject:**
```
[Ticket #{{ticket.id}}] {{ticket.title}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Ticket Created</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">New Ticket Created</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 30px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi {{user.name}},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #666;">
                A new support ticket has been created:
              </p>

              <!-- Ticket Details Card -->
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8f9fa; border-left: 4px solid #667eea; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <table width="100%" cellpadding="5" cellspacing="0">
                      <tr>
                        <td style="font-weight: bold; color: #666; width: 120px;">Ticket ID:</td>
                        <td style="color: #333;">#{{ticket.id}}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; color: #666;">Title:</td>
                        <td style="color: #333;">{{ticket.title}}</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; color: #666;">Priority:</td>
                        <td>
                          <span style="display: inline-block; padding: 3px 8px; border-radius: 3px; font-size: 12px; font-weight: bold;
                            {{#if (eq ticket.priority 'Critical')}}background-color: #fee; color: #c00;
                            {{else if (eq ticket.priority 'High')}}background-color: #ffeaa7; color: #d63031;
                            {{else if (eq ticket.priority 'Medium')}}background-color: #dfe6e9; color: #2d3436;
                            {{else}}background-color: #55efc4; color: #00b894;{{/if}}">
                            {{ticket.priority}}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; color: #666;">Requester:</td>
                        <td style="color: #333;">{{ticket.requester.name}} ({{ticket.requester.email}})</td>
                      </tr>
                      <tr>
                        <td style="font-weight: bold; color: #666;">Created:</td>
                        <td style="color: #333;">{{formatDate ticket.createdAt format="long"}}</td>
                      </tr>
                      {{#if ticket.dueDate}}
                      <tr>
                        <td style="font-weight: bold; color: #666;">Due Date:</td>
                        <td style="color: #333;">{{formatDate ticket.dueDate format="long"}}</td>
                      </tr>
                      {{/if}}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Description -->
              <div style="margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; font-weight: bold; color: #666;">Description:</p>
                <p style="margin: 0; padding: 15px; background-color: #f8f9fa; border-radius: 4px; color: #333; line-height: 1.6;">
                  {{ticket.description}}
                </p>
              </div>

              <!-- Action Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ticketUrl ticket.id}}" style="
                      display: inline-block;
                      background-color: #667eea;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 16px;
                    ">View Ticket Details</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                This is an automated notification from {{org.name}}
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="{{system.url}}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage your email preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

**Plain Text Body:**
```
NEW TICKET CREATED

Hi {{user.name}},

A new support ticket has been created:

Ticket ID: #{{ticket.id}}
Title: {{ticket.title}}
Priority: {{ticket.priority}}
Requester: {{ticket.requester.name}} ({{ticket.requester.email}})
Created: {{formatDate ticket.createdAt format="long"}}
{{#if ticket.dueDate}}Due Date: {{formatDate ticket.dueDate format="long"}}{{/if}}

Description:
{{ticket.description}}

View Ticket: {{ticketUrl ticket.id}}

---
This is an automated notification from {{org.name}}
Manage your email preferences: {{system.url}}/settings/notifications
```

### Example: Ticket Assigned

**Template Name:** `ticket-assigned`
**Category:** Tickets

**Subject:**
```
You've been assigned: {{ticket.title}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px;">

          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">Ticket Assigned to You</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi {{ticket.assignee.name}},
              </p>

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #666;">
                Ticket <strong>#{{ticket.id}}</strong> has been assigned to you.
              </p>

              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f0fdf4; border-left: 4px solid #10b981; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold; color: #333;">
                      {{ticket.title}}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #666;">
                      Requested by {{ticket.requester.name}} • {{formatRelativeTime ticket.createdAt}}
                    </p>
                  </td>
                </tr>
              </table>

              {{#if ticket.sla}}
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #fef3c7; border-radius: 4px; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                      ⏱️ <strong>SLA:</strong> {{ticket.sla.name}} •
                      Due in {{formatDuration ticket.sla.timeRemaining}}
                    </p>
                  </td>
                </tr>
              </table>
              {{/if}}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ticketUrl ticket.id}}" style="
                      display: inline-block;
                      background-color: #10b981;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 16px;
                    ">View & Respond</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="{{system.url}}/settings/notifications" style="color: #10b981;">Manage notifications</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Example: SLA Breach Warning

**Template Name:** `sla-breach-warning`
**Category:** Tickets

**Subject:**
```
⚠️ SLA Warning: Ticket #{{ticket.id}} - {{ticket.sla.timeRemaining}} minutes remaining
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0;">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #fef2f2;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef2f2; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; border: 2px solid #ef4444;">

          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px;">⚠️ SLA BREACH WARNING</h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                <strong>Urgent:</strong> The following ticket is approaching SLA breach:
              </p>

              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #fee2e2; border-radius: 4px; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #991b1b;">
                      Ticket #{{ticket.id}}: {{ticket.title}}
                    </p>
                    <p style="margin: 0 0 15px 0; font-size: 14px; color: #7f1d1d;">
                      Priority: {{ticket.priority}} | Status: {{ticket.status}}
                    </p>
                    <div style="background-color: #7f1d1d; height: 30px; border-radius: 15px; position: relative; overflow: hidden;">
                      <div style="background-color: #fca5a5; height: 100%; width: {{ticket.sla.percentElapsed}}%; transition: width 0.3s;"></div>
                      <p style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); margin: 0; color: white; font-weight: bold; font-size: 12px;">
                        {{ticket.sla.percentElapsed}}% Elapsed
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 20px 0;">
                <tr>
                  <td style="padding: 10px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">
                      Time Remaining: {{formatDuration ticket.sla.timeRemaining}}
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td style="width: 50%; padding-right: 5px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; font-weight: bold;">SLA Policy:</p>
                    <p style="margin: 0; font-size: 14px; color: #333;">{{ticket.sla.name}}</p>
                  </td>
                  <td style="width: 50%; padding-left: 5px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; font-weight: bold;">Assigned To:</p>
                    <p style="margin: 0; font-size: 14px; color: #333;">{{ticket.assignee.name}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding-right: 5px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; font-weight: bold;">Response Time SLA:</p>
                    <p style="margin: 0; font-size: 14px; color: #333;">{{ticket.sla.responseTime}} hours</p>
                  </td>
                  <td style="padding-left: 5px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; font-weight: bold;">Resolution Time SLA:</p>
                    <p style="margin: 0; font-size: 14px; color: #333;">{{ticket.sla.resolutionTime}} hours</p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0 10px 0;">
                    <a href="{{ticketUrl ticket.id}}" style="
                      display: inline-block;
                      background-color: #dc2626;
                      color: white;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 18px;
                      text-transform: uppercase;
                    ">Take Action Now</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #fee2e2; padding: 15px; text-align: center; border-top: 1px solid #fca5a5;">
              <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">
                This is an urgent notification. Please respond immediately.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Example: Daily Digest

**Template Name:** `daily-digest-tickets`
**Category:** Tickets

**Subject:**
```
📊 Daily Ticket Digest - {{formatDate current.date format="MMMM D, YYYY"}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px;">

          <tr>
            <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; color: white; font-size: 28px;">Daily Ticket Digest</h1>
              <p style="margin: 0; color: #bfdbfe; font-size: 14px;">
                {{formatDate current.date format="EEEE, MMMM d, yyyy"}}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">

              <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
                Hi {{user.name}},
              </p>

              <p style="margin: 0 0 30px 0; font-size: 16px; color: #666;">
                Here's your daily summary of ticket activity:
              </p>

              <!-- Statistics Cards -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="width: 50%; padding-right: 10px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #dbeafe; border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #1e40af;">
                            {{digest.newTickets}}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #1e3a8a;">New Tickets</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="width: 50%; padding-left: 10px;">
                    <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #d1fae5; border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 32px; font-weight: bold; color: #065f46;">
                            {{digest.resolvedTickets}}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #064e3b;">Resolved</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Assigned to You -->
              {{#if digest.yourTickets}}
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
                Assigned to You ({{length digest.yourTickets}})
              </h2>

              {{#each digest.yourTickets}}
              <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #f8fafc; border-left: 4px solid
                {{#if (eq this.priority 'Critical')}}#dc2626
                {{else if (eq this.priority 'High')}}#f59e0b
                {{else}}#3b82f6{{/if}};
                margin: 0 0 10px 0; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">
                      #{{this.id}}: {{this.title}}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #666;">
                      {{this.priority}} Priority • Created {{formatRelativeTime this.createdAt}}
                      {{#if this.sla}}• SLA: {{formatDuration this.sla.timeRemaining}} remaining{{/if}}
                    </p>
                  </td>
                  <td style="width: 100px; text-align: right;">
                    <a href="{{ticketUrl this.id}}" style="
                      display: inline-block;
                      background-color: #3b82f6;
                      color: white;
                      padding: 8px 16px;
                      text-decoration: none;
                      border-radius: 4px;
                      font-size: 12px;
                    ">View</a>
                  </td>
                </tr>
              </table>
              {{/each}}
              {{/if}}

              <!-- High Priority Tickets -->
              {{#if digest.highPriorityTickets}}
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                High Priority ({{length digest.highPriorityTickets}})
              </h2>

              {{#each digest.highPriorityTickets}}
              <table width="100%" cellpadding="12" cellspacing="0" style="background-color: #fef2f2; border-left: 4px solid #dc2626; margin: 0 0 10px 0; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 5px 0; font-size: 16px; font-weight: bold; color: #333;">
                      #{{this.id}}: {{this.title}}
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #666;">
                      Assigned to {{this.assignee.name}} • {{this.status}}
                    </p>
                  </td>
                  <td style="width: 100px; text-align: right;">
                    <a href="{{ticketUrl this.id}}" style="
                      display: inline-block;
                      background-color: #dc2626;
                      color: white;
                      padding: 8px 16px;
                      text-decoration: none;
                      border-radius: 4px;
                      font-size: 12px;
                    ">View</a>
                  </td>
                </tr>
              </table>
              {{/each}}
              {{/if}}

              <!-- View All Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0 10px 0;">
                    <a href="{{system.url}}/tickets" style="
                      display: inline-block;
                      background-color: #3b82f6;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 16px;
                    ">View All Tickets</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">
                Digest sent daily at 8:00 AM {{org.timezone}}
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                <a href="{{system.url}}/settings/notifications" style="color: #3b82f6;">Manage digest preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Example: Weekly Summary Report

**Template Name:** `weekly-summary-report`
**Category:** Reports

**Subject:**
```
📈 Weekly IT Summary - Week of {{formatDate weekStart format="MMM D"}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px;">

          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 10px 0; color: white; font-size: 32px;">Weekly IT Summary</h1>
              <p style="margin: 0; color: #e0e7ff; font-size: 16px;">
                {{formatDate report.weekStart format="MMMM d"}} - {{formatDate report.weekEnd format="MMMM d, yyyy"}}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px;">

              <p style="margin: 0 0 30px 0; font-size: 16px; color: #666;">
                Hi {{user.name}}, here's your IT operations summary for the past week:
              </p>

              <!-- Key Metrics Grid -->
              <table width="100%" cellpadding="0" cellspacing="10" style="margin: 0 0 30px 0;">
                <tr>
                  <td style="width: 50%;">
                    <table width="100%" cellpadding="20" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 36px; font-weight: bold; color: white;">
                            {{report.totalTickets}}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #e0e7ff;">Total Tickets</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="width: 50%;">
                    <table width="100%" cellpadding="20" cellspacing="0" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 36px; font-weight: bold; color: white;">
                            {{report.resolvedTickets}}
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #d1fae5;">Resolved</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table width="100%" cellpadding="20" cellspacing="0" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 36px; font-weight: bold; color: white;">
                            {{report.avgResolutionTime}}h
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #fef3c7;">Avg Resolution</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td>
                    <table width="100%" cellpadding="20" cellspacing="0" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-radius: 8px;">
                      <tr>
                        <td style="text-align: center;">
                          <p style="margin: 0 0 5px 0; font-size: 36px; font-weight: bold; color: white;">
                            {{report.satisfactionScore}}%
                          </p>
                          <p style="margin: 0; font-size: 14px; color: #cffafe;">Satisfaction</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Ticket Breakdown -->
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
                Ticket Breakdown
              </h2>

              <table width="100%" cellpadding="12" cellspacing="0" style="margin: 0 0 30px 0;">
                <tr style="background-color: #f8f9fa;">
                  <td style="font-weight: bold; color: #666; border-bottom: 1px solid #e0e0e0;">Category</td>
                  <td style="font-weight: bold; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">Count</td>
                  <td style="font-weight: bold; color: #666; text-align: right; border-bottom: 1px solid #e0e0e0;">%</td>
                </tr>
                {{#each report.ticketsByCategory}}
                <tr>
                  <td style="color: #333; border-bottom: 1px solid #f0f0f0;">{{this.name}}</td>
                  <td style="color: #333; text-align: right; border-bottom: 1px solid #f0f0f0;">{{this.count}}</td>
                  <td style="color: #333; text-align: right; border-bottom: 1px solid #f0f0f0;">{{this.percentage}}%</td>
                </tr>
                {{/each}}
              </table>

              <!-- Top Performers -->
              {{#if report.topPerformers}}
              <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
                🏆 Top Performers
              </h2>

              {{#each report.topPerformers}}
              <table width="100%" cellpadding="10" cellspacing="0" style="background-color: #f0fdf4; margin: 0 0 10px 0; border-radius: 4px;">
                <tr>
                  <td style="width: 40px; text-align: center; font-size: 24px;">{{add @index 1}}</td>
                  <td>
                    <p style="margin: 0 0 3px 0; font-weight: bold; color: #333;">{{this.name}}</p>
                    <p style="margin: 0; font-size: 13px; color: #666;">
                      {{this.resolvedTickets}} tickets resolved • {{this.avgRating}} avg rating
                    </p>
                  </td>
                </tr>
              </table>
              {{/each}}
              {{/if}}

              <!-- Action Items -->
              {{#if report.actionItems}}
              <h2 style="margin: 30px 0 15px 0; font-size: 20px; color: #333; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
                ⚠️ Action Items
              </h2>

              <ul style="margin: 0; padding-left: 20px;">
                {{#each report.actionItems}}
                <li style="margin: 0 0 10px 0; color: #333; line-height: 1.6;">{{this}}</li>
                {{/each}}
              </ul>
              {{/if}}

              <!-- View Full Report Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 30px 0 10px 0;">
                    <a href="{{system.url}}/reports/weekly" style="
                      display: inline-block;
                      background-color: #667eea;
                      color: white;
                      padding: 14px 28px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 16px;
                    ">View Full Report</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #999;">
                Report generated automatically every Monday at 9:00 AM
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### Example: Incident Notification

**Template Name:** `incident-critical-alert`
**Category:** Incidents

**Subject:**
```
🚨 CRITICAL INCIDENT: {{incident.title}}
```

**HTML Body:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #7f1d1d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #7f1d1d; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">

          <tr>
            <td style="background-color: #dc2626; padding: 30px; text-align: center; border-bottom: 4px solid #991b1b;">
              <p style="margin: 0 0 10px 0; font-size: 48px;">🚨</p>
              <h1 style="margin: 0; color: white; font-size: 28px; text-transform: uppercase;">
                Critical Incident
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; background-color: #fef2f2;">

              <table width="100%" cellpadding="20" cellspacing="0" style="background-color: white; border: 2px solid #dc2626; border-radius: 8px; margin: 0 0 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 22px; font-weight: bold; color: #991b1b;">
                      {{incident.title}}
                    </p>
                    <p style="margin: 0; font-size: 14px; color: #7f1d1d;">
                      Incident ID: {{incident.id}} • Detected: {{formatRelativeTime incident.detectedAt}}
                    </p>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: white; margin: 0 0 20px 0; border-radius: 8px;">
                <tr>
                  <td style="width: 50%; border-right: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Severity</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">{{incident.severity}}</p>
                  </td>
                  <td style="width: 50%; padding-left: 15px;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Impact</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #dc2626;">{{incident.impact}}</p>
                  </td>
                </tr>
                <tr>
                  <td style="border-right: 1px solid #f0f0f0; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Affected Users</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">{{incident.affectedUsers}}</p>
                  </td>
                  <td style="padding-left: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666; text-transform: uppercase;">Assigned Team</p>
                    <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">{{incident.assignedTeam}}</p>
                  </td>
                </tr>
              </table>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">Description:</p>
                <p style="margin: 0; color: #333; line-height: 1.6;">{{incident.description}}</p>
              </div>

              {{#if incident.affectedServices}}
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 0 0 20px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #666;">Affected Services:</p>
                <p style="margin: 0; color: #333;">
                  {{join incident.affectedServices separator=", "}}
                </p>
              </div>
              {{/if}}

              {{#if incident.workaround}}
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 0 0 20px 0; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #92400e;">💡 Temporary Workaround:</p>
                    <p style="margin: 0; color: #78350f; line-height: 1.6;">{{incident.workaround}}</p>
                  </td>
                </tr>
              </table>
              {{/if}}

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0;">
                    <a href="{{system.url}}/incidents/{{incident.id}}" style="
                      display: inline-block;
                      background-color: #dc2626;
                      color: white;
                      padding: 16px 32px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      font-size: 18px;
                      text-transform: uppercase;
                      letter-spacing: 1px;
                    ">View Incident Details</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td style="background-color: #dc2626; padding: 15px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: white; font-weight: bold;">
                This is a critical alert. Immediate action required.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Template Testing and Preview

### Using the Built-in Preview

1. **Open Template Editor:**
   - Navigate to Email Settings > Templates
   - Click existing template or create new

2. **Click "Preview" Button:**
   - Located at top right of editor
   - Opens preview modal

3. **Preview Shows:**
   - Rendered HTML with sample data
   - Both desktop and mobile views
   - Subject line rendered

4. **Test Data:**
   - System uses realistic sample data
   - All variables populated
   - Shows how template will look to recipients

5. **Edit and Re-Preview:**
   - Make changes to template
   - Click "Preview" again
   - See changes immediately

### Sending Test Emails

1. **Save Template:**
   - Click "Save Template"
   - Template must be saved before testing

2. **Click "Send Test Email":**
   - Button in template editor header

3. **Enter Test Recipients:**
   - Your email address
   - Other team members
   - Multiple addresses supported

4. **Select Test Data:**
   - Choose sample ticket/incident/etc.
   - Or use default test data

5. **Send:**
   - Test email sent immediately
   - Check inbox
   - Verify rendering in your email client

### Testing Checklist

Before activating a template:

- [ ] Preview in Deskwise shows correctly
- [ ] Send test email to yourself
- [ ] Check email in Gmail
- [ ] Check email in Outlook
- [ ] Check email on mobile device
- [ ] Verify all variables render correctly
- [ ] Verify no syntax errors
- [ ] Verify links are clickable
- [ ] Verify buttons work
- [ ] Verify images load (if used)
- [ ] Verify plain text version readable
- [ ] Verify subject line not truncated
- [ ] Check spam score (if available)

## Common Mistakes to Avoid

### 1. Forgetting to Close Tags

**❌ Wrong:**
```handlebars
{{#if ticket.assignee}}
  Assigned to: {{ticket.assignee.name}}
<!-- Missing {{/if}} -->
```

**✅ Correct:**
```handlebars
{{#if ticket.assignee}}
  Assigned to: {{ticket.assignee.name}}
{{/if}}
```

### 2. Using Wrong Variable Names

**❌ Wrong:**
```handlebars
{{ticket.assigned_to}}  <!-- Wrong field name -->
```

**✅ Correct:**
```handlebars
{{ticket.assignee.name}}  <!-- Correct nested path -->
```

### 3. Not Handling Null/Undefined Values

**❌ Wrong:**
```handlebars
Due: {{formatDate ticket.dueDate}}
<!-- Breaks if dueDate is null -->
```

**✅ Correct:**
```handlebars
{{#if ticket.dueDate}}
  Due: {{formatDate ticket.dueDate}}
{{else}}
  No due date set
{{/if}}
```

### 4. Using External Stylesheets

**❌ Wrong:**
```html
<link rel="stylesheet" href="styles.css">
<!-- Won't work in emails -->
```

**✅ Correct:**
```html
<p style="color: #333; font-size: 16px;">Text</p>
<!-- Use inline styles -->
```

### 5. Forgetting Plain Text Version

**❌ Wrong:**
- Only providing HTML version

**✅ Correct:**
- Always provide both HTML and plain text versions

### 6. Overly Complex Layouts

**❌ Wrong:**
```html
<div class="grid-container">
  <div class="col-1"></div>
  <div class="col-2"></div>
  <!-- Complex CSS Grid/Flexbox -->
</div>
```

**✅ Correct:**
```html
<table width="100%">
  <tr>
    <td width="50%">Col 1</td>
    <td width="50%">Col 2</td>
  </tr>
</table>
<!-- Use tables for layout -->
```

### 7. Using JavaScript

**❌ Wrong:**
```html
<script>
  // JavaScript never works in emails
</script>
```

**✅ Correct:**
- Never use JavaScript
- All interaction must be via links

### 8. Large Image Files

**❌ Wrong:**
```html
<img src="logo.png" alt="Logo">
<!-- 2 MB file size -->
```

**✅ Correct:**
```html
<img src="logo-optimized.png" width="150" alt="Logo">
<!-- 50 KB file size -->
```

### 9. Not Testing on Mobile

**❌ Wrong:**
- Only testing on desktop

**✅ Correct:**
- Always test on mobile devices
- Use responsive design

### 10. Hardcoding URLs

**❌ Wrong:**
```handlebars
<a href="https://deskwise.acme.com/tickets/12345">View</a>
```

**✅ Correct:**
```handlebars
<a href="{{ticketUrl ticket.id}}">View</a>
```

## Template Library

Deskwise includes a library of pre-built templates you can use as starting points:

**Ticket Templates:**
- `ticket-created` - New ticket notification
- `ticket-assigned` - Assignment notification
- `ticket-status-changed` - Status update
- `ticket-comment-added` - New comment
- `ticket-resolved` - Resolution notification
- `ticket-closed` - Closure notification
- `sla-breach-warning` - SLA alert
- `sla-breached` - SLA breach notification

**Incident Templates:**
- `incident-created` - New incident
- `incident-critical-alert` - Critical incident
- `incident-resolved` - Resolution notification
- `incident-update` - Status update

**Change Management Templates:**
- `change-approval-requested` - Approval request
- `change-approved` - Approval granted
- `change-rejected` - Approval denied
- `change-scheduled` - Schedule notification
- `change-completed` - Completion notification

**Digest Templates:**
- `daily-digest-tickets` - Daily ticket summary
- `weekly-summary-report` - Weekly IT report
- `monthly-executive-summary` - Executive summary

**User Templates:**
- `welcome-new-user` - User onboarding
- `password-reset` - Password reset link
- `account-locked` - Security alert

**Asset Templates:**
- `asset-assigned` - Asset assignment
- `warranty-expiring` - Warranty alert
- `asset-due-return` - Return reminder

### Importing Templates

1. Navigate to Email Settings > Templates
2. Click "Import Template"
3. Select template from library
4. Customize as needed
5. Save

### Exporting Templates

1. Open template editor
2. Click "Export Template"
3. Choose format: JSON or HTML
4. Save file
5. Share with other organizations/instances

## Next Steps

Now that you understand email templates:

1. **Create Your First Template:**
   - Start with simple ticket notification
   - Use examples above as reference
   - Test thoroughly

2. **Set Up Notification Rules:**
   - Read [Notification Rules Guide](NOTIFICATION_RULES_GUIDE.md)
   - Connect templates to events

3. **Train Your Team:**
   - Share template naming conventions
   - Document custom variables
   - Establish approval process

4. **Maintain Templates:**
   - Review quarterly
   - Update branding as needed
   - Remove unused templates

## See Also

- [Admin Setup Guide](ADMIN_SETUP_GUIDE.md) - Initial email system setup
- [Notification Rules Guide](NOTIFICATION_RULES_GUIDE.md) - Creating rules
- [User Preferences Guide](USER_PREFERENCES_GUIDE.md) - User settings
- [API Reference](API_REFERENCE.md) - Template API documentation
- [Developer Guide](DEVELOPER_GUIDE.md) - Adding custom variables

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintained By:** Deskwise Team
