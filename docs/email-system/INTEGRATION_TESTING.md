# Email Notification System - Integration Testing Guide

## Overview

This document outlines comprehensive integration testing scenarios for the email notification system. Integration tests verify that all components work together correctly, from configuration to email delivery.

## Prerequisites

Before running integration tests:

- [ ] MongoDB instance running and accessible
- [ ] Valid AWS SES credentials (sandbox or production)
- [ ] Test email addresses verified in SES
- [ ] `.env.local` file configured with required variables
- [ ] Development server running (`npm run dev`)
- [ ] Test user accounts created in different roles (admin, technician, end user)

## Required Environment Variables

```env
MONGODB_URI=mongodb://localhost:27017/deskwise-test
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-test-secret-32-characters
AWS_SES_ACCESS_KEY_ID=your-test-access-key
AWS_SES_SECRET_ACCESS_KEY=your-test-secret-key
AWS_SES_REGION=us-east-1
TEST_EMAIL_SENDER=verified-sender@example.com
TEST_EMAIL_RECIPIENT=verified-recipient@example.com
```

## Test Scenarios

### 1. SES Configuration Flow

**Objective:** Verify that administrators can configure AWS SES credentials correctly.

#### Test Steps:

1. **Login as Admin**
   - Navigate to login page
   - Enter admin credentials
   - Verify redirect to dashboard

2. **Access Email Integration Settings**
   ```
   Expected URL: /dashboard/settings/email-integration
   Expected: Page loads with email configuration form
   ```

3. **Enter SES Credentials**
   - Input fields to test:
     - Access Key ID: `AKIAIOSFODNN7EXAMPLE`
     - Secret Access Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
     - AWS Region: `us-east-1`
     - Sender Email: `sender@example.com`
     - Sender Name: `Deskwise Support`

4. **Test Connection**
   - Click "Test Connection" button
   - Expected: Loading spinner appears
   - Expected: Success message: "Connection successful!"
   - Expected: Verification status displayed

5. **Save Configuration**
   - Click "Save Settings" button
   - Expected: Success toast notification
   - Expected: Settings persisted in database

6. **Verify Encryption**
   - Use MongoDB client to inspect `email_settings` collection:
   ```javascript
   db.email_settings.findOne({ orgId: "test_org" })
   ```
   - Expected: `sesCredentials.encryptedData` field exists
   - Expected: `sesCredentials.iv` field exists
   - Expected: Plain text credentials NOT visible
   - Expected: `accessKeyId` and `secretAccessKey` are encrypted

7. **Retrieve and Decrypt**
   - Refresh the settings page
   - Expected: Form shows masked credentials (e.g., `AKIA***MPLE`)
   - Expected: Region and sender email visible
   - Click "Test Connection" again
   - Expected: Connection succeeds (credentials decrypted successfully)

**Pass Criteria:**
- ✅ All form validations work
- ✅ Test connection succeeds
- ✅ Settings save to database
- ✅ Credentials encrypted in database
- ✅ Credentials can be decrypted and reused
- ✅ Error messages shown for invalid credentials

---

### 2. Template Creation Flow

**Objective:** Verify template creation, validation, and rendering.

#### Test Steps:

1. **Access Template Management**
   ```
   URL: /dashboard/settings/email-templates
   Expected: Template list page with "Create Template" button
   ```

2. **Create New Template**
   - Click "Create Template" button
   - Fill in template details:
     - Name: `Ticket Created Notification`
     - Category: `ticket`
     - Subject: `New Ticket #{{ticketNumber}} - {{ticketSubject}}`
     - HTML Body:
       ```html
       <div>
         <h2>Hello {{requesterName}},</h2>
         <p>Your ticket has been created successfully.</p>
         <p><strong>Ticket Number:</strong> {{ticketNumber}}</p>
         <p><strong>Subject:</strong> {{ticketSubject}}</p>
         <p><strong>Priority:</strong> {{priority}}</p>
         {{#if assigneeName}}
         <p><strong>Assigned to:</strong> {{assigneeName}}</p>
         {{/if}}
         <p>You can track your ticket status in the <a href="{{portalUrl}}">customer portal</a>.</p>
       </div>
       ```
     - Text Body:
       ```
       Hello {{requesterName}},

       Your ticket has been created successfully.

       Ticket Number: {{ticketNumber}}
       Subject: {{ticketSubject}}
       Priority: {{priority}}
       {{#if assigneeName}}Assigned to: {{assigneeName}}{{/if}}

       Track your ticket: {{portalUrl}}
       ```

3. **Use Variable Picker**
   - Click "Insert Variable" button
   - Expected: Dropdown shows available variables for "ticket" category:
     - `ticketNumber`
     - `ticketSubject`
     - `requesterName`
     - `requesterEmail`
     - `assigneeName`
     - `priority`
     - `status`
     - etc.
   - Click on `ticketNumber`
   - Expected: `{{ticketNumber}}` inserted at cursor position

4. **Validate Template Syntax**
   - Click "Validate" button
   - Expected: Green checkmark with "Template syntax is valid"
   - Test with invalid syntax:
     - Change subject to: `{{unclosed`
     - Click "Validate"
     - Expected: Error message: "Invalid template syntax: Unclosed tag"

5. **Preview Template**
   - Click "Preview" button
   - Expected: Modal opens with rendered preview
   - Expected: Sample data populated:
     - `{{ticketNumber}}` → `TICKET-001`
     - `{{requesterName}}` → `John Doe`
     - etc.
   - Expected: HTML rendering shows proper formatting

6. **Send Test Email**
   - In preview modal, enter test recipient email
   - Click "Send Test Email"
   - Expected: Loading spinner
   - Expected: Success message: "Test email sent!"
   - Check recipient inbox
   - Expected: Email received with subject: "New Ticket #TICKET-001 - Sample Subject"
   - Expected: Email body shows sample data properly rendered

7. **Save Template**
   - Click "Save Template"
   - Expected: Success notification
   - Expected: Redirect to template list
   - Expected: New template appears in list with status "Active"

8. **Edit Template**
   - Click "Edit" on the created template
   - Modify subject line
   - Click "Save"
   - Expected: Changes saved
   - Expected: Modified timestamp updated

9. **Duplicate Template**
   - Click "Duplicate" on template
   - Expected: New template created with name "Copy of Ticket Created Notification"
   - Expected: All content copied

10. **Deactivate Template**
    - Click "Deactivate" on template
    - Expected: Confirmation dialog
    - Confirm deactivation
    - Expected: Template status changes to "Inactive"
    - Expected: Template no longer used for notifications

**Pass Criteria:**
- ✅ Template creation succeeds
- ✅ Variable picker works correctly
- ✅ Syntax validation works
- ✅ Preview renders correctly
- ✅ Test email sends and renders properly
- ✅ Template saves to database
- ✅ CRUD operations work (create, read, update, delete)

---

### 3. Notification Rule Flow

**Objective:** Verify notification rules trigger emails correctly.

#### Test Steps:

1. **Create Notification Rule**
   ```
   URL: /dashboard/settings/notification-rules
   ```
   - Click "Create Rule"
   - Fill in rule details:
     - Name: `High Priority Ticket Alert`
     - Event Type: `ticket.created`
     - Conditions:
       - Field: `priority`
       - Operator: `equals`
       - Value: `high`
     - Template: Select "Ticket Created Notification"
     - Recipients: Select "Role: Technician"
     - Active: Yes

2. **Save Rule**
   - Click "Save Rule"
   - Expected: Success notification
   - Expected: Rule appears in active rules list

3. **Trigger Event**
   - Navigate to tickets page
   - Click "Create Ticket"
   - Fill in ticket form:
     - Subject: `Email server down`
     - Description: `Cannot access email`
     - Priority: `high` ← **Important: matches rule condition**
     - Requester: Select a test user
   - Click "Create Ticket"

4. **Verify Rule Evaluation**
   - Check server logs or email logs page
   - Expected: Log entry showing:
     - Rule "High Priority Ticket Alert" evaluated
     - Conditions matched: `true`
     - Recipients determined: 2 technicians
     - Emails queued for sending

5. **Verify Template Rendering**
   - Check email log details
   - Expected: Subject rendered: `New Ticket #TICKET-XXX - Email server down`
   - Expected: Variables substituted:
     - `{{ticketNumber}}` → actual ticket number
     - `{{ticketSubject}}` → `Email server down`
     - `{{priority}}` → `high`
     - `{{requesterName}}` → actual requester name

6. **Verify Email Sending**
   - Check recipient inboxes (technician email addresses)
   - Expected: 2 emails sent (one per technician)
   - Expected: Email subject matches rendered template
   - Expected: Email body contains all ticket details
   - Expected: Links in email are clickable and correct

7. **Verify Email Delivery Status**
   ```
   URL: /dashboard/settings/email-logs
   ```
   - Expected: 2 log entries with status "delivered"
   - Expected: Timestamp within last minute
   - Expected: Correct recipient emails
   - Click on log entry to view details
   - Expected: Full email content visible
   - Expected: SES Message ID present

8. **Test Negative Case (Non-Matching Condition)**
   - Create another ticket with priority: `low`
   - Expected: Rule does NOT trigger
   - Expected: No email sent
   - Expected: No log entry created

9. **Test Multiple Rules**
   - Create another rule for same event but different condition
   - Create ticket that matches both rules
   - Expected: Both rules trigger
   - Expected: Multiple emails sent (one per rule)
   - Expected: Separate log entries

**Pass Criteria:**
- ✅ Rule creation succeeds
- ✅ Rule evaluates conditions correctly
- ✅ Template renders with correct data
- ✅ Emails sent to correct recipients
- ✅ Email content is correct
- ✅ Delivery status logged
- ✅ Non-matching events don't trigger rule

---

### 4. User Preferences Flow

**Objective:** Verify user notification preferences are respected.

#### Test Steps:

1. **Access User Preferences**
   - Login as end user (not admin)
   - Navigate to profile/preferences
   ```
   URL: /dashboard/profile/preferences
   ```

2. **View Default Preferences**
   - Expected: Email notifications enabled by default
   - Expected: All event types checked
   - Expected: No quiet hours set
   - Expected: Digest mode disabled

3. **Disable All Email Notifications**
   - Toggle "Email Notifications" to OFF
   - Click "Save Preferences"
   - Expected: Success notification

4. **Trigger Event**
   - Have admin create a ticket for this user
   - Expected: No email sent (notifications disabled)
   - Check email logs
   - Expected: Log entry with status "skipped" and reason "User disabled notifications"

5. **Enable with Event-Specific Opt-Out**
   - Toggle "Email Notifications" to ON
   - Uncheck "Ticket Created" event
   - Keep other events checked
   - Click "Save Preferences"

6. **Test Event-Specific Preference**
   - Admin creates ticket for user
   - Expected: No email sent
   - Admin assigns existing ticket to user
   - Expected: Email sent (assignment notification still enabled)

7. **Configure Quiet Hours**
   - Enable "Quiet Hours"
   - Set start time: `22:00`
   - Set end time: `08:00`
   - Save preferences

8. **Test Quiet Hours**
   - Simulate or wait for event during quiet hours (10 PM - 8 AM)
   - Expected: Notification queued but not sent
   - Expected: Log shows "deferred" status
   - Simulate or wait for event outside quiet hours
   - Expected: Notification sent immediately

9. **Enable Digest Mode**
   - Enable "Daily Digest"
   - Set digest time: `09:00`
   - Save preferences

10. **Test Digest Mode**
    - Generate multiple events throughout the day
    - Expected: Individual emails NOT sent
    - Expected: Events queued for digest
    - At 9 AM next day (simulate or wait)
    - Expected: Single digest email sent with all queued notifications
    - Expected: Digest format:
      ```
      Daily Notification Digest - [Date]

      You received 5 notifications:

      1. Ticket TICKET-001 created
      2. Ticket TICKET-002 assigned to you
      3. Comment added to TICKET-001
      ...
      ```

**Pass Criteria:**
- ✅ Preferences save correctly
- ✅ Global email toggle works
- ✅ Event-specific opt-outs respected
- ✅ Quiet hours prevent immediate delivery
- ✅ Digest mode batches notifications
- ✅ Digest sent at scheduled time

---

### 5. Error Handling Flow

**Objective:** Verify system handles errors gracefully.

#### Test Scenarios:

##### 5.1 Invalid SES Credentials

1. Enter incorrect AWS Access Key
2. Click "Test Connection"
3. **Expected:** Error message: "Invalid AWS credentials"
4. Click "Save Settings"
5. **Expected:** Validation prevents saving invalid credentials

##### 5.2 SES Rate Limit Exceeded

1. Configure valid SES sandbox account (limited to 1 email/second)
2. Create rule that sends to 100 recipients
3. Trigger event
4. **Expected:** Emails queued and throttled
5. **Expected:** Error logs show "Rate limit exceeded"
6. **Expected:** Retry mechanism activates
7. **Expected:** All emails eventually delivered

##### 5.3 Invalid Email Addresses

1. Create notification rule
2. Add recipient with invalid email: `invalid-email`
3. Save rule
4. **Expected:** Validation error: "Invalid email address"
5. Force invalid email in database
6. Trigger rule
7. **Expected:** Email skipped with error logged
8. **Expected:** Other valid recipients still receive emails

##### 5.4 Template Rendering Errors

1. Create template with syntax error: `{{#if unclosed}`
2. Trigger notification using this template
3. **Expected:** Error logged: "Template rendering failed"
4. **Expected:** Fallback plain text notification sent
5. **Expected:** Admin notified of template error

##### 5.5 Network Failures

1. Disconnect network or block AWS SES endpoints
2. Trigger notification
3. **Expected:** Error: "Network error"
4. **Expected:** Email marked as "failed" in logs
5. **Expected:** Retry scheduled
6. Restore network
7. **Expected:** Retry succeeds, email delivered

##### 5.6 Database Errors

1. Simulate database connection failure
2. Attempt to save email settings
3. **Expected:** Error message: "Database error"
4. **Expected:** UI shows retry option
5. **Expected:** Transaction rolled back (no partial save)

**Pass Criteria:**
- ✅ All errors caught and handled gracefully
- ✅ Helpful error messages shown to users
- ✅ Errors logged for debugging
- ✅ System remains stable after errors
- ✅ Retry mechanisms work
- ✅ No data corruption

---

## End-to-End Workflows

### E2E 1: Ticket Created → Email Sent to Requester

**Workflow:**
```
User creates ticket → Rule evaluates → Template renders → Email sent → User receives email
```

**Steps:**
1. User submits ticket via portal
2. Backend creates ticket in database
3. Event published: `ticket.created`
4. Notification engine evaluates rules
5. Rule matches: "Notify requester on ticket creation"
6. Recipients determined: [requester email]
7. Template rendered with ticket data
8. Email sent via SES
9. Email logged with status "delivered"
10. User receives email confirmation

**Verification:**
- Check ticket created in database
- Check email log for successful delivery
- Check actual email received
- Verify all links in email work
- Verify ticket details accurate

---

### E2E 2: Ticket Assigned → Email Sent to Assignee

**Workflow:**
```
Admin assigns ticket → Event triggered → Assignee notified
```

**Steps:**
1. Admin opens ticket
2. Admin assigns to technician
3. Backend updates ticket
4. Event published: `ticket.assigned`
5. Rule matches: "Notify assignee"
6. Template renders with assignment details
7. Email sent to assignee
8. Assignee receives email with ticket link

**Verification:**
- Assignee email received
- Email contains ticket number and details
- Link to ticket works
- Assignee can click link and view ticket

---

### E2E 3: Ticket Commented → Email to Watchers

**Workflow:**
```
Comment added → Watchers notified (excluding commenter)
```

**Steps:**
1. User adds comment to ticket
2. Event published: `ticket.comment_added`
3. Recipients determined: requester, assignee, watchers
4. Commenter excluded from recipients
5. Emails sent to all watchers
6. Each watcher receives notification

**Verification:**
- All watchers receive email
- Commenter does NOT receive email
- Email shows comment text
- Email shows commenter name
- Link to comment works

---

### E2E 4: Ticket Resolved → CSAT Survey Email

**Workflow:**
```
Ticket resolved → CSAT email sent to requester
```

**Steps:**
1. Technician resolves ticket
2. Event published: `ticket.resolved`
3. Rule: "Send CSAT survey on resolution"
4. Template: "CSAT Survey"
5. Email sent with survey link
6. User clicks survey link
7. User rates satisfaction
8. Rating recorded in database

**Verification:**
- CSAT email received
- Survey link works
- Rating form displays
- Rating saves correctly
- Thank you message shown

---

### E2E 5: Incident Created → Team Notification

**Workflow:**
```
Critical incident → Multiple team members notified
```

**Steps:**
1. System detects critical incident
2. Event published: `incident.created`
3. Rule: Priority = critical → Notify all admins and on-call
4. Multiple recipients determined
5. Bulk emails sent
6. All team members receive alert

**Verification:**
- All admins receive email
- On-call technicians receive email
- Email shows incident severity
- Email contains incident details
- Response links work

---

### E2E 6: User Mention → Direct Notification

**Workflow:**
```
User mentioned in comment → Mentioned user notified
```

**Steps:**
1. Comment includes: "cc @john.doe"
2. System parses mentions
3. Event published: `user.mentioned`
4. Direct notification sent to mentioned user
5. User receives email

**Verification:**
- Mentioned user receives email
- Email shows who mentioned them
- Email shows context of mention
- Link to comment works

---

### E2E 7: SLA Breach → Escalation Email

**Workflow:**
```
SLA breached → Manager escalation
```

**Steps:**
1. Ticket exceeds response SLA
2. Event published: `ticket.sla_breached`
3. Rule: Escalate to manager
4. Manager receives escalation email
5. Email shows SLA details and breach time

**Verification:**
- Manager receives email immediately
- Email marked as high priority
- Email shows SLA breach details
- Link to ticket works
- Escalation logged

---

## Performance Testing

### Load Test: 100 Simultaneous Emails

**Test:**
```javascript
// Create 100 events simultaneously
const events = Array(100).fill(null).map((_, i) => ({
  type: 'ticket.created',
  data: { ticketNumber: `TICKET-${i}` }
}))

await Promise.all(events.map(event => notificationEngine.processEvent(event)))
```

**Expected:**
- All 100 emails queued
- Throttling respects SES limits
- All emails delivered within 2 minutes
- No errors or failures
- Database handles concurrent writes

### Load Test: 1000 Emails in 1 Minute

**Expected:**
- Queueing system handles load
- SES rate limits respected
- Background worker processes queue
- All emails eventually delivered
- System remains responsive

---

## Security Testing

### Test: Credentials Not Exposed

**Steps:**
1. Save SES credentials
2. Make API call to GET settings
3. **Expected:** Response shows masked credentials
4. Check browser DevTools Network tab
5. **Expected:** Plain credentials NOT visible in response
6. Check database
7. **Expected:** Credentials encrypted

### Test: RBAC Enforced

**Steps:**
1. Login as end user (non-admin)
2. Try to access `/dashboard/settings/email-integration`
3. **Expected:** 403 Forbidden or redirect
4. Try to call API: `POST /api/email/settings`
5. **Expected:** 401 Unauthorized

### Test: Input Validation Prevents Injection

**Steps:**
1. Create template with potential XSS:
   ```html
   <p>Hello {{requesterName}}</p>
   ```
2. Trigger event with malicious data:
   ```javascript
   requesterName: '<script>alert("xss")</script>'
   ```
3. **Expected:** Email shows escaped HTML: `&lt;script&gt;...`

### Test: Email Address Validation

**Steps:**
1. Try to add recipient: `invalid-email`
2. **Expected:** Validation error
3. Try SQL injection: `test@example.com'; DROP TABLE users; --`
4. **Expected:** Validation error or properly sanitized

---

## Monitoring and Logging

### Test: Email Logs Comprehensive

**Verify logs include:**
- ✅ Timestamp
- ✅ Event type
- ✅ Rule triggered
- ✅ Template used
- ✅ Recipients
- ✅ Delivery status
- ✅ SES Message ID
- ✅ Error details (if failed)

### Test: Audit Trail Complete

**Verify audit includes:**
- ✅ Who configured SES settings
- ✅ Who created/modified templates
- ✅ Who created/modified rules
- ✅ When changes were made
- ✅ Before/after values

---

## Test Data Cleanup

After integration tests, clean up:

```javascript
// Clean up test data
await db.collection('email_settings').deleteMany({ orgId: 'test_org' })
await db.collection('email_templates').deleteMany({ orgId: 'test_org' })
await db.collection('notification_rules').deleteMany({ orgId: 'test_org' })
await db.collection('email_logs').deleteMany({ orgId: 'test_org' })
await db.collection('users').deleteMany({ orgId: 'test_org' })
```

---

## Continuous Integration

### Automated Integration Tests

```yaml
# .github/workflows/integration-tests.yml
name: Email System Integration Tests

on: [push, pull_request]

jobs:
  integration-test:
    runs-on: ubuntu-latest

    services:
      mongodb:
        image: mongo:latest
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run integration tests
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          AWS_SES_ACCESS_KEY_ID: ${{ secrets.TEST_SES_KEY }}
          AWS_SES_SECRET_ACCESS_KEY: ${{ secrets.TEST_SES_SECRET }}
        run: npm run test:integration
```

---

## Success Criteria

All integration tests pass when:

- ✅ SES configuration saves and retrieves correctly
- ✅ Credentials encrypted at rest
- ✅ Templates create, validate, and render correctly
- ✅ Notification rules evaluate conditions accurately
- ✅ Emails sent to correct recipients
- ✅ User preferences respected
- ✅ Email content renders properly
- ✅ Delivery status tracked
- ✅ Errors handled gracefully
- ✅ Performance meets requirements
- ✅ Security controls work
- ✅ Audit logs complete
- ✅ Multi-tenancy enforced (org A can't access org B's data)
