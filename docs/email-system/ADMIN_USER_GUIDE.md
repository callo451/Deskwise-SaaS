# Email Integration Admin User Guide

## Overview

As an administrator, you have complete control over Deskwise's email notification system through four main settings pages. This guide walks you through each page and how to use them effectively.

## 📍 Navigation

All email management pages are located under **Settings** in the main sidebar:

```
Dashboard > Settings > [Select Page]
```

**Email-Related Settings Pages:**
1. **Email Integration** - Configure AWS SES and provider settings
2. **Email Templates** - Design and manage email templates
3. **Notification Rules** - Create automated notification rules
4. **Email Logs** - Monitor delivery and troubleshoot issues

---

## 🔧 Page 1: Email Integration (Email Settings)

**Path:** `/settings/email-integration`

### Purpose
This is where you configure your AWS SES credentials and email provider settings. This is the **first page you'll use** to set up the email system.

### Page Layout

#### Header Stats (4 Cards)
- **Connection Status** - Shows if AWS SES is connected (green badge) or not configured (gray badge)
- **Verified Emails** - Number of verified email addresses in SES
- **Last Tested** - When you last tested the connection
- **Provider** - Shows "Amazon SES" (currently the only provider)

#### Section 1: Amazon SES Configuration

**Fields:**

1. **AWS Access Key ID**
   - Type: Password field (can toggle visibility with eye icon)
   - Example: `AKIA...`
   - Where to get: AWS IAM Console → User Security Credentials

2. **AWS Secret Access Key**
   - Type: Password field (can toggle visibility with eye icon)
   - Example: `wJalrXUt...`
   - Where to get: AWS IAM Console → User Security Credentials
   - **⚠️ Important:** Encrypted with AES-256-GCM before storing in database

3. **AWS Region**
   - Type: Dropdown select
   - Options: 11 AWS regions (US East, US West, EU, Asia Pacific)
   - Example: `us-east-1 (N. Virginia)`
   - Must match where you set up SES

4. **Configuration Set (Optional)**
   - Type: Text input
   - For AWS SES metrics tracking
   - Leave blank if not using

5. **From Email Address**
   - Type: Email input
   - Example: `support@yourdomain.com`
   - **Must be verified in AWS SES** before use

6. **From Name**
   - Type: Text input
   - Example: `Deskwise Support`
   - Appears as sender name in inbox

**Actions:**

- **Test Connection** Button
  - Validates AWS credentials
  - Shows success/error toast notification
  - Updates connection status badge

- **Save Configuration** Button
  - Encrypts and saves credentials to database
  - Updates connection status

#### Section 2: Email Verification

**Purpose:** Manage verified email addresses/domains for SES

**Fields:**
- **Input Field** - Enter email address or domain (`@example.com`)
- **Verify Button** - Sends verification email via AWS

**Verified Emails List:**
- Shows all verified emails/domains
- Green checkmark icon
- "Verified" badge
- Cannot delete (must do in AWS Console)

**How to Verify:**
1. Enter email address (e.g., `support@yourdomain.com`)
2. Click "Verify"
3. Check inbox for AWS verification email
4. Click link in email
5. Refresh Deskwise page - email now appears in list

#### Section 3: Advanced Settings

**Global Notifications Toggle:**
- Switch to enable/disable all email notifications system-wide
- Useful for maintenance or emergencies

**Rate Limit (emails per hour):**
- Default: 100 emails/hour
- Range: 1-1000
- Prevents email abuse
- Also enforces daily limit (1000/day)

### Step-by-Step Setup

1. **Navigate:** Settings > Email Integration
2. **Enter AWS Credentials:**
   - Access Key ID and Secret Access Key from IAM
   - Select your AWS region
   - Enter verified from email address
   - Enter from name
3. **Test Connection:**
   - Click "Test Connection" button
   - Wait for success confirmation
4. **Save:**
   - Click "Save Configuration"
   - Credentials are encrypted and stored
5. **Verify Emails:**
   - Add any emails you'll send from
   - Check inbox and click verification link
   - Refresh page to see verified status

---

## 📧 Page 2: Email Templates

**Path:** `/settings/email-templates`

### Purpose
Design and manage HTML email templates with dynamic variables. New organizations automatically have 9 system templates.

### Page Layout

#### Header Stats (4 Cards)
- **Total Templates** - All templates in system (purple theme)
- **Active Templates** - Currently enabled templates
- **System Templates** - Auto-seeded templates (9 default)
- **Custom Templates** - Templates you've created

#### Header Actions
- **Create Template** Button (purple) - Opens template creation dialog

#### Templates Table

**Columns:**
1. **Template Name** - Display name (e.g., "Ticket Created")
2. **Event Type** - What triggers it (e.g., "Ticket Created")
3. **Subject** - Email subject line with variables
4. **Type** - "System" (auto-seeded) or "Custom" (user-created)
5. **Status** - "Active" (green) or "Inactive" (gray)
6. **Last Modified** - Date last updated
7. **Actions** - Three-dot menu with options

**Actions Menu (⋮):**
- **Edit Template** - Modify template content
- **Send Test** - Send test email to yourself
- **Duplicate** - Clone template for customization
- **Delete** - Remove template (only for custom templates, not system)

### Create/Edit Template Dialog

**Two-Column Layout:**

**Left Column - Template Editor:**

1. **Template Name**
   - Example: "Ticket Created Notification"

2. **Event Type**
   - Dropdown grouped by module
   - Examples: Ticket Created, Incident Created, Project Task Assigned
   - Badges show module (Tickets, Incidents, Projects)

3. **Subject Line**
   - Supports Handlebars variables: `{{ticket.title}}`
   - **Variable Picker** button - Click to see available variables

4. **HTML Body Editor**
   - Rich text editor
   - Full HTML support
   - Supports Handlebars syntax
   - Can paste from other editors

5. **Active Template Toggle**
   - Switch to enable/disable

**Right Column - Live Preview:**
- Shows how email will look
- Uses sample data to populate variables
- Updates in real-time as you type
- Preview of subject and HTML body

**Variable Picker:**
- Popup with all 120+ available variables
- Organized by category (Ticket, User, Organization, System)
- Click to insert into template
- Shows example values

### Usage Examples

**Creating a Custom Template:**

1. Click "Create Template" button
2. Enter name: "VIP Ticket Alert"
3. Select event: "Ticket Created"
4. Set subject: `🚨 VIP Ticket: {{ticket.title}}`
5. Design HTML body (can copy from system template)
6. Preview on right side
7. Toggle "Active" ON
8. Click "Create Template"

**Editing System Templates:**

System templates **can be edited** but **cannot be deleted**. This lets you customize while preserving the core template.

1. Click ⋮ menu on "Ticket Created" template
2. Select "Edit Template"
3. Modify subject or body as needed
4. Preview changes
5. Click "Save Changes"

**Testing Templates:**

1. Click ⋮ menu on any template
2. Select "Send Test"
3. Dialog opens
4. Enter your email address
5. Select sample data (Ticket, Incident, etc.)
6. Click "Send Test Email"
7. Check your inbox

---

## 🔔 Page 3: Notification Rules

**Path:** `/settings/notification-rules`

### Purpose
Define **when** and **to whom** email notifications are sent. Rules connect events to templates and recipients.

### Page Layout

#### Header Stats (4 Cards)
- **Total Rules** - All notification rules (blue theme)
- **Active Rules** - Currently enabled rules
- **Inactive Rules** - Disabled rules
- **Available Templates** - Active templates you can use

#### Header Actions
- **Create Rule** Button (blue) - Opens rule creation dialog

#### Rules Table

**Columns:**
1. **Rule Name** - Display name (e.g., "Notify Assignee on Ticket Assignment")
2. **Module** - What system area (Tickets, Incidents, Projects)
3. **Event** - What triggers it (created, assigned, updated)
4. **Template** - Which email template to use
5. **Recipients** - Who gets notified (badges: Requester, Assignee, Watchers)
6. **Status** - Toggle switch (ON/OFF)
7. **Actions** - Edit or Delete menu

**Actions Menu (⋮):**
- **Edit Rule** - Modify rule configuration
- **Delete** - Remove rule (stops notifications immediately)

### Create/Edit Rule Dialog

**Single Column Form:**

1. **Rule Name**
   - Example: "Notify on High Priority Tickets"

2. **Module**
   - Dropdown: Tickets, Incidents, Changes, Projects, Assets, Knowledge Base

3. **Event Type**
   - Dropdown changes based on module
   - Examples for Tickets: Created, Assigned, Updated, Resolved, Closed, Commented

4. **Conditions (Optional)**
   - Add filters to only send when criteria match
   - Example: Only send if priority = "High"
   - **Add Condition:**
     - **Field:** priority, status, category, assignee
     - **Operator:** equals, not equals, contains, greater than, less than, in list
     - **Value:** High, Medium, Low (depends on field)
   - Can add multiple conditions (AND logic)
   - Display shows: `priority equals High` with X to remove

5. **Email Template**
   - Dropdown of active templates
   - Only shows templates that match the event type

6. **Recipients**
   - Checkboxes for who receives notification:
     - ☑ **Requester** - Person who created the item
     - ☑ **Assignee** - Person assigned to the item
     - ☑ **Watchers** - People following the item
   - Can select multiple

7. **Active Rule Toggle**
   - Switch to enable/disable rule

### Usage Examples

**Example 1: Notify Assignee When Ticket Assigned**

1. Click "Create Rule"
2. Name: "Notify Assignee on Ticket Assignment"
3. Module: Tickets
4. Event: Assigned
5. Conditions: None
6. Template: "Ticket Assigned"
7. Recipients: ☑ Assignee
8. Active: ON
9. Click "Create Rule"

**Result:** Every time a ticket is assigned, the assignee gets an email.

**Example 2: Alert Managers on Critical Incidents**

1. Click "Create Rule"
2. Name: "Critical Incident Alert"
3. Module: Incidents
4. Event: Created
5. Conditions: Add condition
   - Field: severity
   - Operator: equals
   - Value: critical
6. Template: "Incident Created"
7. Recipients: ☑ Assignee, ☑ Watchers
8. Active: ON
9. Click "Create Rule"

**Result:** Only critical incidents trigger this notification, and both assignee and watchers are notified.

**Example 3: Notify Requester on Ticket Status Change**

1. Click "Create Rule"
2. Name: "Status Change Notification"
3. Module: Tickets
4. Event: Updated
5. Conditions: None (or add: field=status, operator=changed)
6. Template: "Ticket Status Changed"
7. Recipients: ☑ Requester
8. Active: ON
9. Click "Create Rule"

**Result:** When ticket status changes, requester gets notified.

### Best Practices

**Rule Organization:**
- Create specific rules for each scenario
- Use clear, descriptive names
- Start with basic rules, add conditions later

**Avoiding Spam:**
- Don't create too many overlapping rules
- Use conditions to filter noise
- Consider recipient preferences

**Testing Rules:**
- Create test ticket/incident/project
- Verify email is sent
- Check Email Logs page for confirmation

---

## 📊 Page 4: Email Logs

**Path:** `/settings/email-logs`

### Purpose
Monitor all sent emails, troubleshoot delivery issues, and access complete email history.

### Page Layout

#### Header Stats (4 Cards)
- **Total Emails** - All emails in current view (gray theme)
- **Successfully Sent** - Green count
- **Failed/Bounced** - Red count
- **Retried** - Emails that were retried

#### Header Actions
- **Refresh** Button - Reload logs
- **Export CSV** Button - Download logs as CSV file

#### Filters

**Search Bar:**
- Search by recipient email or subject
- Real-time filtering

**Status Filter Dropdown:**
- All Status
- Sent (green badge)
- Failed (red badge)
- Bounced (red badge with ⚠)
- Spam Complaint (red badge)

#### Logs Table

**Columns:**
1. **Timestamp** - When email was sent (format: `10/18/2025, 2:30:45 PM`)
2. **Recipient** - Email address (bold)
3. **Subject** - Email subject line (truncated if long)
4. **Template/Event** - Badge showing which template or event
5. **Status** - Color-coded badge
6. **Retries** - Shows retry count if > 0 (e.g., `2x`)
7. **Actions** - Eye icon to view details

**Pagination:**
- Shows 50 logs per page
- Previous/Next buttons at bottom
- Page count display

### Log Details Dialog

**Click eye icon** on any log to open details dialog.

**Information Displayed:**

**Top Section (Grid):**
- **Recipient:** Email address (gray box)
- **From:** Sender email (gray box)
- **Status:** Badge (green=sent, red=failed/bounced)
- **Sent At:** Timestamp (gray box)

**Middle Section:**
- **Subject:** Full subject line (gray box)
- **Template:** Badge if template used
- **Message ID:** AWS SES message ID (for tracking)
- **Error Message:** Red alert box if failed
- **Retry Info:** Blue alert if retried

**Bottom Section (Tabs):**

**Preview Tab:**
- Shows rendered HTML email
- Exactly as recipient saw it
- Scrollable if long

**HTML Source Tab:**
- Shows raw HTML code
- Dark theme code view
- For debugging template issues

**Actions:**
- **Resend Email** button (only if status = failed)
- Attempts to send again with same content

### Usage Examples

**Finding Failed Emails:**

1. Navigate to Email Logs
2. Click "Status Filter" dropdown
3. Select "Failed"
4. Review failed emails in table
5. Click eye icon to see error message
6. Click "Resend Email" to retry

**Verifying Ticket Notification Was Sent:**

1. Navigate to Email Logs
2. Enter requester email in search: `jane.smith@example.com`
3. Look for subject containing ticket number
4. Check status is "Sent" (green)
5. Click eye icon to preview email

**Exporting Email History:**

1. Navigate to Email Logs
2. (Optional) Apply filters for date range or status
3. Click "Export CSV" button
4. File downloads: `email-logs-2025-10-18.csv`
5. Open in Excel or Google Sheets

**Troubleshooting Bounced Email:**

1. Filter by "Bounced" status
2. Click eye icon on bounced email
3. Read error message in red alert box
4. Common causes:
   - Invalid email address
   - Mailbox full
   - Email address no longer exists
5. Update contact's email in system
6. Resend if appropriate

---

## 👤 User Notification Preferences

**Path:** `/settings/notifications` (Available to all users, not just admins)

### Purpose
Individual users can customize their notification preferences here.

### Features

**Email Notifications Toggle:**
- Master switch to enable/disable all email notifications
- Users can opt-out without admin intervention

**Per-Event Preferences:**
- Choose which events trigger email
- Examples:
  - ☑ Ticket assigned to me
  - ☑ Ticket status changed
  - ☐ Ticket commented (disabled)

**Do Not Disturb Mode:**
- Temporarily disable all notifications
- Set end time/date
- Useful for vacation or focus time

---

## 🚀 Complete Workflow Example

### Scenario: Set Up Email Notifications for Your Organization

**Step 1: Configure AWS SES (5 minutes)**

1. Go to **Settings > Email Integration**
2. Enter AWS credentials
3. Select region: `us-east-1`
4. Enter from email: `support@yourcompany.com`
5. Enter from name: `YourCompany Support`
6. Click "Test Connection" → Success!
7. Click "Save Configuration"

**Step 2: Verify Email Addresses (2 minutes)**

1. Still on Email Integration page
2. Scroll to "Email Verification"
3. Enter: `support@yourcompany.com`
4. Click "Verify"
5. Check inbox for AWS email
6. Click verification link
7. Refresh page → Email shows as verified ✓

**Step 3: Review Templates (3 minutes)**

1. Go to **Settings > Email Templates**
2. See 9 system templates already created
3. Click ⋮ on "Ticket Created"
4. Select "Send Test"
5. Enter your email
6. Click "Send Test Email"
7. Check inbox → Email received! ✓

**Step 4: Create Notification Rules (5 minutes)**

**Rule 1: Notify Assignee**
1. Go to **Settings > Notification Rules**
2. Click "Create Rule"
3. Name: "Notify Assignee on Assignment"
4. Module: Tickets
5. Event: Assigned
6. Template: "Ticket Assigned"
7. Recipients: ☑ Assignee
8. Active: ON
9. Click "Create Rule"

**Rule 2: Notify Requester on Status Change**
1. Click "Create Rule"
2. Name: "Requester Status Updates"
3. Module: Tickets
4. Event: Updated
5. Template: "Ticket Status Changed"
6. Recipients: ☑ Requester
7. Active: ON
8. Click "Create Rule"

**Rule 3: Notify on Ticket Resolution**
1. Click "Create Rule"
2. Name: "Resolution Notification"
3. Module: Tickets
4. Event: Resolved
5. Template: "Ticket Resolved"
6. Recipients: ☑ Requester
7. Active: ON
8. Click "Create Rule"

**Step 5: Test End-to-End (3 minutes)**

1. Create a test ticket
2. Assign it to yourself
3. Check email inbox
4. Receive "Ticket Assigned" email ✓
5. Update ticket status to "Resolved"
6. Check email again
7. Receive "Ticket Resolved" email ✓

**Step 6: Monitor Logs (2 minutes)**

1. Go to **Settings > Email Logs**
2. See both test emails in table
3. Status: "Sent" (green) ✓
4. Click eye icon to preview
5. Confirm emails look correct

**Total Setup Time: ~20 minutes**

✅ Email notifications now fully operational!

---

## 🎯 Common Admin Tasks

### Task: Add New Email Template for Custom Event

1. Go to Email Templates
2. Click "Create Template"
3. Name: "VIP Customer Alert"
4. Event: "Ticket Created"
5. Design custom HTML with VIP branding
6. Save as Active
7. Create notification rule to use it

### Task: Disable Notifications for Maintenance

1. Go to Email Integration
2. Find "Global Notifications" toggle
3. Switch to OFF
4. Perform maintenance
5. Switch back to ON when done

### Task: Troubleshoot Why User Didn't Receive Email

1. Go to Email Logs
2. Search for user's email address
3. Check if email appears in table
4. If not, notification rule may not be active
5. If yes but failed, click eye icon to see error
6. Common issues:
   - Email address not verified in SES
   - SES still in sandbox mode (can only send to verified addresses)
   - Typo in email address
   - Email bounced (mailbox full)

### Task: Create Escalation Rule

1. Go to Notification Rules
2. Click "Create Rule"
3. Name: "Escalate High Priority"
4. Module: Tickets
5. Event: Created
6. Conditions: priority equals High
7. Template: "Ticket Created" (or custom escalation template)
8. Recipients: ☑ Assignee, ☑ Watchers (add managers as watchers)
9. Active: ON

### Task: Weekly Email Report Export

1. Go to Email Logs
2. No filters (or filter by date if available)
3. Click "Export CSV"
4. Save to reports folder
5. Review in Excel:
   - Delivery rate
   - Failed emails
   - Most active templates

---

## 💡 Tips & Best Practices

### Email Templates

✅ **Do:**
- Use system templates as a starting point
- Test templates before using in rules
- Include clear call-to-action buttons
- Keep subject lines under 60 characters
- Use plain English, avoid jargon

❌ **Don't:**
- Delete system templates (you can't anyway)
- Create 20 similar templates (consolidate)
- Forget to test on mobile preview
- Use all caps in subject lines
- Include too many variables (keep it clean)

### Notification Rules

✅ **Do:**
- Start with basic rules, add complexity later
- Use conditions to reduce notification fatigue
- Name rules clearly and descriptively
- Test rules with real tickets before going live
- Review rules quarterly for optimization

❌ **Don't:**
- Create duplicate rules for same event
- Send to too many recipients (spam)
- Forget to enable rules after creation
- Create rules without testing templates first
- Ignore user feedback about notification volume

### Email Logs

✅ **Do:**
- Check logs weekly for issues
- Export logs monthly for records
- Investigate all bounced emails
- Fix failed emails promptly
- Monitor delivery rates

❌ **Don't:**
- Ignore persistent failures
- Assume emails are sent without checking
- Let bounced emails accumulate
- Forget to resend critical failed emails

### AWS SES

✅ **Do:**
- Verify all sending email addresses
- Request production access early
- Monitor SES sending limits
- Set up SNS bounce notifications
- Keep credentials secure (they're encrypted)

❌ **Don't:**
- Share AWS credentials
- Skip email verification
- Exceed SES sending limits
- Use personal email for testing in production
- Forget to monitor AWS SES console

---

## 🔐 Security & Permissions

### Who Can Access Email Settings?

**Admin-Only Pages:**
- Email Integration (AWS credentials)
- Email Templates (template management)
- Notification Rules (rule creation)
- Email Logs (full history)

**All Users:**
- User Notification Preferences (their own settings)

**Security Features:**
- AWS credentials encrypted with AES-256-GCM
- Credentials never sent to browser (masked in UI)
- Admin role required for all configuration
- JWT session validation on all API calls
- Rate limiting (100/hour, 1000/day per org)

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Test Connection" fails**

**Solutions:**
- Verify AWS Access Key ID is correct
- Verify AWS Secret Access Key is correct
- Check region matches where SES is set up
- Ensure IAM user has `AmazonSESFullAccess` policy
- Check AWS credentials are not expired

**Issue: Emails not sending**

**Solutions:**
- Check notification rule is Active (toggle ON)
- Verify email template is Active
- Check Global Notifications not disabled
- Verify from email is verified in SES
- If in sandbox mode, verify recipient email too
- Check Email Logs for error messages

**Issue: Email shows as "Failed" in logs**

**Solutions:**
- Click eye icon to see error message
- Common errors:
  - "Email address not verified" → Verify in SES
  - "Daily sending quota exceeded" → Wait or request limit increase
  - "Message rejected" → Check email content for spam triggers
  - "Mailbox full" → Recipient's mailbox is full

**Issue: Template variables showing as blank**

**Solutions:**
- Check variable name spelling (case-sensitive)
- Verify data exists for that field
- Use preview with sample data
- Check Handlebars syntax: `{{variable.name}}`

### Getting Help

**Documentation:**
- `/docs/email-system/IMPLEMENTATION_COMPLETE.md`
- `/docs/email-system/AUTO_TEMPLATE_SEEDING.md`

**AWS Resources:**
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [SES Sandbox Mode](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html)

---

## 📝 Appendix

### All Available Variables (120+)

**Ticket Variables:**
- `{{ticket.ticketNumber}}` - TKT-001
- `{{ticket.title}}` - Printer not working
- `{{ticket.description}}` - Full description
- `{{ticket.priority}}` - High, Medium, Low
- `{{ticket.status}}` - Open, In Progress, Resolved
- `{{ticket.category}}` - Hardware, Software
- `{{ticket.assignee.name}}` - John Doe
- `{{ticket.requester.name}}` - Jane Smith
- `{{ticket.createdAt}}` - 2025-10-18 10:30 AM
- `{{ticket.url}}` - Direct link to ticket

**User Variables:**
- `{{recipient.name}}` - Recipient's full name
- `{{recipient.email}}` - Recipient's email
- `{{user.firstName}}` - First name
- `{{user.lastName}}` - Last name
- `{{user.department}}` - Department name

**Organization Variables:**
- `{{organization.name}}` - Company name
- `{{platform.url}}` - Deskwise URL
- `{{organization.supportEmail}}` - Support email

**System Variables:**
- `{{formatDate createdAt}}` - Helper function
- `{{formatCurrency amount}}` - Helper function

*(See Variable Picker in template editor for complete list)*

---

**Last Updated:** October 18, 2025
**Version:** 1.0
**Deskwise ITSM Platform**
