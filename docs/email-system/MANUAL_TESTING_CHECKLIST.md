# Email Notification System - Manual Testing Checklist

## Overview

This checklist provides a comprehensive manual testing guide for the email notification system. Use this to verify all functionality before deployment or after making changes.

**Testing Date:** _______________
**Tester Name:** _______________
**Environment:** _______________
**Build/Version:** _______________

---

## Pre-Testing Setup

### Prerequisites
- [ ] Development/staging environment accessible
- [ ] Test user accounts created (Admin, Technician, End User)
- [ ] Valid AWS SES credentials available
- [ ] Test email addresses verified in SES
- [ ] MongoDB accessible and populated with test data
- [ ] Browser DevTools available for debugging

### Test Accounts

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@test.com | _______ | Full access testing |
| Technician | tech@test.com | _______ | Limited access testing |
| End User | user@test.com | _______ | Recipient testing |

---

## 1. Email Integration Settings

### 1.1 Access Control
- [ ] Admin can access `/dashboard/settings/email-integration`
- [ ] Non-admin users receive 403/redirect when accessing page
- [ ] Page loads without errors
- [ ] UI renders correctly

### 1.2 SES Credentials - Save
- [ ] Can enter AWS Access Key ID
- [ ] Can enter AWS Secret Access Key
- [ ] Region dropdown shows all AWS regions
- [ ] Can select region from dropdown
- [ ] Can enter sender email address
- [ ] Can enter sender name
- [ ] Email validation works (invalid format shows error)
- [ ] Required field validation works
- [ ] "Save Settings" button is enabled when form valid
- [ ] "Save Settings" button is disabled when form invalid

### 1.3 SES Credentials - Test Connection
- [ ] "Test Connection" button visible
- [ ] Click "Test Connection" shows loading state
- [ ] With valid credentials: Success message appears
- [ ] With invalid credentials: Error message appears
- [ ] Error message is helpful and specific
- [ ] Can test connection before saving
- [ ] Can test connection after saving

### 1.4 SES Credentials - Security
- [ ] After save, refresh page
- [ ] Credentials shown as masked (e.g., `AKIA***MPLE`)
- [ ] Open browser DevTools > Network
- [ ] Check API response for GET settings
- [ ] Plain text credentials NOT visible in response
- [ ] Use MongoDB client to check database
- [ ] Credentials stored in `encryptedData` field
- [ ] `iv` field exists (initialization vector)
- [ ] `tag` field exists (authentication tag)
- [ ] Plain text credentials NOT in database

### 1.5 Email Verification
- [ ] Can enter email address to verify
- [ ] "Verify Email" button sends verification email
- [ ] Verification email received in inbox
- [ ] Verification link in email works
- [ ] After verification, status shows "Verified"
- [ ] Can verify multiple email addresses
- [ ] Can view list of verified emails

### 1.6 Domain Verification
- [ ] Can enter domain to verify
- [ ] "Verify Domain" button returns DNS records
- [ ] TXT record displayed for verification
- [ ] DKIM records displayed
- [ ] Can copy DNS records
- [ ] Verification status updates after DNS propagation

### 1.7 Update Settings
- [ ] Can modify sender email
- [ ] Can modify sender name
- [ ] Can change AWS region
- [ ] Can update and re-test connection
- [ ] Changes save correctly
- [ ] Success notification shows after save

### 1.8 Global Notification Toggle
- [ ] "Enable Notifications" toggle visible
- [ ] Toggle OFF shows warning message
- [ ] When OFF, notifications are disabled globally
- [ ] Toggle back ON re-enables notifications
- [ ] Setting persists after page refresh

---

## 2. Template Management

### 2.1 Template List View
- [ ] Navigate to `/dashboard/settings/email-templates`
- [ ] Template list displays
- [ ] Templates show name, category, status
- [ ] Can filter by category
- [ ] Can search by name
- [ ] Active templates show green badge
- [ ] Inactive templates show gray badge
- [ ] "Create Template" button visible

### 2.2 Create New Template
- [ ] Click "Create Template"
- [ ] Modal/page opens with template form
- [ ] All fields visible:
  - [ ] Template Name
  - [ ] Category dropdown
  - [ ] Subject line
  - [ ] HTML body editor
  - [ ] Text body editor
- [ ] Category dropdown shows all categories
- [ ] Form validation prevents empty required fields

### 2.3 Variable Picker
- [ ] "Insert Variable" button visible
- [ ] Click button opens variable dropdown
- [ ] Variables grouped by category
- [ ] Ticket variables show:
  - [ ] `{{ticketNumber}}`
  - [ ] `{{ticketSubject}}`
  - [ ] `{{requesterName}}`
  - [ ] `{{requesterEmail}}`
  - [ ] `{{assigneeName}}`
  - [ ] `{{priority}}`
  - [ ] `{{status}}`
  - [ ] `{{createdAt}}`
  - [ ] `{{updatedAt}}`
- [ ] Click variable inserts it at cursor position
- [ ] Variables show helpful descriptions

### 2.4 Rich Text Editor (HTML Body)
- [ ] Editor supports bold, italic, underline
- [ ] Can create headings (H1, H2, H3)
- [ ] Can create bulleted lists
- [ ] Can create numbered lists
- [ ] Can insert links
- [ ] Can insert images
- [ ] Can change text color
- [ ] Can change background color
- [ ] Can align text (left, center, right)
- [ ] HTML source view available

### 2.5 Template Validation
- [ ] "Validate" button visible
- [ ] With valid syntax: Green checkmark appears
- [ ] Message: "Template syntax is valid"
- [ ] With invalid syntax (e.g., `{{unclosed`):
  - [ ] Red error icon appears
  - [ ] Error message specific and helpful
  - [ ] Error indicates line/position if possible
- [ ] Validation works on both subject and body

### 2.6 Template Preview
- [ ] "Preview" button visible
- [ ] Click "Preview" opens preview modal
- [ ] Preview shows rendered subject
- [ ] Preview shows rendered HTML body
- [ ] Variables replaced with sample data
- [ ] Conditional blocks render correctly
- [ ] HTML formatting preserved
- [ ] Links are clickable (in preview)

### 2.7 Send Test Email
- [ ] "Send Test Email" button in preview
- [ ] Can enter test recipient email
- [ ] Click "Send" shows loading state
- [ ] Success message appears
- [ ] Check test recipient inbox
- [ ] Email received with rendered template
- [ ] Subject line correct
- [ ] Body renders correctly
- [ ] HTML formatting works in email client
- [ ] Links in email work

### 2.8 Save Template
- [ ] "Save Template" button enabled when valid
- [ ] Click "Save" shows loading state
- [ ] Success notification appears
- [ ] Redirect to template list
- [ ] New template appears in list
- [ ] Template details correct
- [ ] Template status: Active by default

### 2.9 Edit Template
- [ ] Click "Edit" on existing template
- [ ] Form pre-populated with template data
- [ ] Can modify all fields
- [ ] Changes save correctly
- [ ] Modified timestamp updates
- [ ] Can cancel without saving changes

### 2.10 Duplicate Template
- [ ] Click "Duplicate" on template
- [ ] New template created
- [ ] Name prefixed with "Copy of"
- [ ] All content copied
- [ ] Can edit duplicate independently

### 2.11 Activate/Deactivate Template
- [ ] Click "Deactivate" on active template
- [ ] Confirmation dialog appears
- [ ] Confirm deactivation
- [ ] Template status changes to Inactive
- [ ] Inactive badge shows
- [ ] Click "Activate" re-enables template

### 2.12 Delete Template
- [ ] Click "Delete" on template
- [ ] Confirmation dialog appears
- [ ] Warning if template used in active rules
- [ ] Confirm deletion
- [ ] Template removed from list
- [ ] Cannot delete if used in active rule

### 2.13 Template Categories
Test template creation for each category:
- [ ] Ticket templates work
- [ ] Incident templates work
- [ ] Change Request templates work
- [ ] Project templates work
- [ ] System templates work
- [ ] Each category shows appropriate variables

---

## 3. Notification Rules

### 3.1 Rules List View
- [ ] Navigate to `/dashboard/settings/notification-rules`
- [ ] Rules list displays
- [ ] Rules show name, event, status
- [ ] Can filter by event type
- [ ] Can search by name
- [ ] Active rules show toggle ON
- [ ] Inactive rules show toggle OFF

### 3.2 Create Notification Rule
- [ ] Click "Create Rule"
- [ ] Rule form displays
- [ ] Required fields:
  - [ ] Rule name
  - [ ] Event type dropdown
  - [ ] Template selector
  - [ ] Recipients configuration
- [ ] Form validation works

### 3.3 Event Type Selection
- [ ] Event type dropdown shows all events:
  - [ ] Ticket Created
  - [ ] Ticket Updated
  - [ ] Ticket Assigned
  - [ ] Ticket Resolved
  - [ ] Ticket Commented
  - [ ] Incident Created
  - [ ] Change Request Created
  - [ ] SLA Breached
  - [ ] User Mentioned
- [ ] Can select one event per rule

### 3.4 Conditions Configuration
- [ ] "Add Condition" button visible
- [ ] Click adds new condition row
- [ ] Condition fields:
  - [ ] Field selector (dropdown)
  - [ ] Operator selector (dropdown)
  - [ ] Value input
- [ ] Field selector shows relevant fields for event
- [ ] Operator selector shows:
  - [ ] Equals
  - [ ] Not Equals
  - [ ] Contains
  - [ ] Not Contains
  - [ ] Greater Than
  - [ ] Less Than
  - [ ] In
  - [ ] Not In
  - [ ] Is Empty
  - [ ] Is Not Empty
- [ ] Can add multiple conditions
- [ ] Can choose AND/OR logic
- [ ] Can remove condition

### 3.5 Template Selection
- [ ] Template dropdown shows active templates
- [ ] Templates filtered by category (matching event)
- [ ] Can select template
- [ ] Selected template preview available

### 3.6 Recipients Configuration
- [ ] Recipient type selector:
  - [ ] Specific Users
  - [ ] Roles
  - [ ] Dynamic (from event data)
  - [ ] Custom Email Addresses
- [ ] For "Specific Users":
  - [ ] User multi-select dropdown
  - [ ] Can search users
  - [ ] Can select multiple users
- [ ] For "Roles":
  - [ ] Role checkboxes
  - [ ] Can select multiple roles
- [ ] For "Dynamic":
  - [ ] Field selector (e.g., requesterId, assigneeId)
  - [ ] Can select multiple fields
- [ ] "Exclude event triggerer" checkbox works

### 3.7 Advanced Options
- [ ] Priority setting (1-10)
- [ ] "Stop processing on match" checkbox
- [ ] Quiet hours settings
- [ ] Rate limiting options

### 3.8 Save Rule
- [ ] "Save Rule" button enabled when valid
- [ ] Click "Save" creates rule
- [ ] Success notification
- [ ] Rule appears in list
- [ ] Rule active by default

### 3.9 Test Rule (Dry Run)
- [ ] "Test Rule" button available
- [ ] Click "Test" opens modal
- [ ] Can enter sample event data
- [ ] "Run Test" evaluates rule
- [ ] Shows:
  - [ ] Conditions matched: Yes/No
  - [ ] Recipients determined
  - [ ] Template preview
  - [ ] No actual email sent (dry run)

### 3.10 Edit Rule
- [ ] Click "Edit" on rule
- [ ] Form pre-populated
- [ ] Can modify all fields
- [ ] Changes save correctly

### 3.11 Enable/Disable Rule
- [ ] Toggle switch on rule card
- [ ] Click toggle disables rule
- [ ] Disabled rules don't trigger
- [ ] Toggle back to enable

### 3.12 Delete Rule
- [ ] Click "Delete" on rule
- [ ] Confirmation dialog
- [ ] Confirm deletion
- [ ] Rule removed

### 3.13 Clone Rule
- [ ] Click "Clone" on rule
- [ ] New rule created with same settings
- [ ] Name prefixed with "Copy of"
- [ ] Can edit clone independently

---

## 4. User Preferences

### 4.1 Access Preferences
- [ ] Login as any user
- [ ] Navigate to `/dashboard/profile/preferences`
- [ ] Preferences page loads
- [ ] Email notification section visible

### 4.2 Global Email Toggle
- [ ] "Enable Email Notifications" toggle visible
- [ ] Default state: ON
- [ ] Toggle OFF disables all emails for user
- [ ] Toggle back ON re-enables emails
- [ ] Setting saves automatically or on click "Save"

### 4.3 Event-Specific Preferences
- [ ] List of all event types shown
- [ ] Each event has checkbox
- [ ] Default: All checked
- [ ] Uncheck specific events
- [ ] Unchecked events don't send emails
- [ ] Checked events send emails
- [ ] Changes save

### 4.4 Quiet Hours
- [ ] "Enable Quiet Hours" toggle
- [ ] When enabled:
  - [ ] Start time picker appears
  - [ ] End time picker appears
- [ ] Can set start time (e.g., 10:00 PM)
- [ ] Can set end time (e.g., 8:00 AM)
- [ ] Time format correct (12h or 24h based on locale)
- [ ] Validates end time after start time
- [ ] Settings save

### 4.5 Digest Mode
- [ ] "Enable Digest" toggle
- [ ] When enabled:
  - [ ] Frequency selector appears (Daily, Weekly)
  - [ ] Time picker appears
- [ ] Can select "Daily Digest"
- [ ] Can set digest time (e.g., 9:00 AM)
- [ ] Can select "Weekly Digest"
- [ ] Can select day of week
- [ ] Settings save

### 4.6 Save Preferences
- [ ] "Save Preferences" button
- [ ] Click shows loading state
- [ ] Success notification
- [ ] Settings persist after logout/login
- [ ] Settings apply immediately to new notifications

---

## 5. Email Logs

### 5.1 Access Logs
- [ ] Admin navigates to `/dashboard/settings/email-logs`
- [ ] Log list displays
- [ ] Non-admins cannot access (403/redirect)

### 5.2 Log List View
- [ ] Logs show:
  - [ ] Timestamp
  - [ ] Recipient
  - [ ] Subject
  - [ ] Status badge (Delivered, Failed, Pending)
  - [ ] Event type
- [ ] Logs sorted by timestamp (newest first)
- [ ] Pagination works

### 5.3 Filter Logs
- [ ] Filter by status:
  - [ ] All
  - [ ] Delivered
  - [ ] Failed
  - [ ] Pending
  - [ ] Skipped
- [ ] Filter by date range
- [ ] Date picker works
- [ ] Filters apply correctly

### 5.4 Search Logs
- [ ] Search box visible
- [ ] Can search by recipient email
- [ ] Can search by subject
- [ ] Can search by event type
- [ ] Search results accurate
- [ ] Search works with filters

### 5.5 View Log Details
- [ ] Click on log entry
- [ ] Detail modal/page opens
- [ ] Shows:
  - [ ] Full email content (subject, body)
  - [ ] Recipient details
  - [ ] Sender details
  - [ ] Event data
  - [ ] Rule triggered
  - [ ] Template used
  - [ ] SES Message ID
  - [ ] Timestamps (queued, sent, delivered)
  - [ ] Error details (if failed)

### 5.6 Resend Failed Email
- [ ] Failed email shows "Resend" button
- [ ] Click "Resend" attempts re-send
- [ ] Loading state shown
- [ ] Success or error message
- [ ] New log entry created for resend

### 5.7 Export Logs
- [ ] "Export" button visible
- [ ] Can export as CSV
- [ ] Can export as JSON
- [ ] Export includes filtered results
- [ ] Downloaded file correct

### 5.8 Email Preview
- [ ] Log detail shows email preview
- [ ] HTML email renders correctly
- [ ] Text version also available
- [ ] Can toggle between HTML and text view

---

## 6. End-to-End Notification Flows

### 6.1 Ticket Created → Requester Notified
- [ ] Create new ticket as admin
- [ ] Select requester
- [ ] Submit ticket
- [ ] Email sent to requester
- [ ] Check requester inbox
- [ ] Email received with correct details
- [ ] Ticket number in subject
- [ ] Ticket details in body
- [ ] Links work

### 6.2 Ticket Assigned → Assignee Notified
- [ ] Open existing ticket
- [ ] Assign to technician
- [ ] Save assignment
- [ ] Email sent to assignee
- [ ] Check assignee inbox
- [ ] Email received
- [ ] Assignment details correct
- [ ] Link to ticket works

### 6.3 Ticket Commented → Watchers Notified
- [ ] Add comment to ticket
- [ ] Email sent to:
  - [ ] Requester
  - [ ] Assignee
  - [ ] Previous commenters
- [ ] Commenter NOT emailed (excluded)
- [ ] All recipients receive email
- [ ] Comment text in email
- [ ] Link to comment works

### 6.4 Ticket Resolved → CSAT Email
- [ ] Resolve ticket
- [ ] CSAT survey email sent to requester
- [ ] Check requester inbox
- [ ] Email received with survey link
- [ ] Click survey link
- [ ] Survey form opens
- [ ] Can submit rating
- [ ] Thank you message shown

### 6.5 Incident Created → Team Notified
- [ ] Create critical incident
- [ ] Email sent to:
  - [ ] All admins
  - [ ] On-call technicians (if configured)
- [ ] All recipients receive email
- [ ] Incident details correct
- [ ] Severity indicated
- [ ] Link to incident works

### 6.6 User Mentioned → Notification Sent
- [ ] Add comment: "cc @john.doe"
- [ ] System parses mention
- [ ] Email sent to mentioned user
- [ ] Check mentioned user's inbox
- [ ] Email received
- [ ] Shows who mentioned them
- [ ] Shows context of mention
- [ ] Link works

### 6.7 SLA Breach → Escalation
- [ ] Simulate or wait for SLA breach
- [ ] Escalation rule triggers
- [ ] Email sent to manager
- [ ] Check manager inbox
- [ ] Email received
- [ ] SLA breach details shown
- [ ] Ticket details included
- [ ] Link to ticket works

### 6.8 Multiple Events → No Duplicate Emails
- [ ] Perform multiple actions on same ticket rapidly
- [ ] Check recipient inbox
- [ ] No duplicate emails sent
- [ ] Deduplication works

---

## 7. Error Scenarios

### 7.1 Invalid SES Credentials
- [ ] Enter wrong Access Key ID
- [ ] Click "Test Connection"
- [ ] Error message: "Invalid credentials"
- [ ] Cannot save invalid credentials
- [ ] Helpful error message

### 7.2 SES Rate Limit
- [ ] Configure sandbox SES (limited rate)
- [ ] Send many emails quickly
- [ ] System respects rate limit
- [ ] Emails queued
- [ ] No errors shown to user
- [ ] Emails eventually delivered

### 7.3 Invalid Email Address
- [ ] Add recipient: `invalid-email`
- [ ] Validation error shown
- [ ] Cannot save with invalid email
- [ ] Helpful error message

### 7.4 Template Rendering Error
- [ ] Create template with syntax error
- [ ] Save template
- [ ] Trigger notification using this template
- [ ] Error logged
- [ ] Fallback notification sent (if configured)
- [ ] Admin notified of error

### 7.5 Network Error
- [ ] Simulate network disconnect
- [ ] Trigger notification
- [ ] Error: "Network error"
- [ ] Email marked as failed
- [ ] Retry scheduled
- [ ] After network restore, retry succeeds

### 7.6 Missing Template
- [ ] Delete template used in rule
- [ ] Trigger rule
- [ ] Error logged
- [ ] Graceful failure
- [ ] Rule disabled or error notification sent

---

## 8. Security Testing

### 8.1 Credentials Not Exposed
- [ ] Save SES credentials
- [ ] Open DevTools > Network
- [ ] Refresh settings page
- [ ] Check GET /api/email/settings response
- [ ] Credentials masked in response
- [ ] Check database directly
- [ ] Credentials encrypted

### 8.2 RBAC Enforced
- [ ] Login as non-admin
- [ ] Try to access email settings
- [ ] Access denied (403 or redirect)
- [ ] Try direct API call
- [ ] Unauthorized (401)

### 8.3 Input Validation
- [ ] Try XSS in template: `<script>alert(1)</script>`
- [ ] Template saves
- [ ] Trigger notification
- [ ] Email received
- [ ] Script NOT executed (escaped)
- [ ] Try SQL injection in recipient email
- [ ] Validation prevents saving

### 8.4 Multi-Tenancy
- [ ] Login as user from Org A
- [ ] Check email settings
- [ ] Only Org A settings visible
- [ ] Cannot access Org B templates
- [ ] Cannot access Org B rules
- [ ] Cannot see Org B email logs

---

## 9. Performance Testing

### 9.1 Large Template Rendering
- [ ] Create template with 1000+ characters
- [ ] Include many variables
- [ ] Trigger notification
- [ ] Template renders in <1 second
- [ ] Email sends successfully

### 9.2 High Volume Notifications
- [ ] Create rule with 50+ recipients
- [ ] Trigger event
- [ ] All emails queued
- [ ] System remains responsive
- [ ] All emails delivered

### 9.3 Page Load Times
- [ ] Template list page loads in <2 seconds
- [ ] Rule list page loads in <2 seconds
- [ ] Email logs page loads in <3 seconds
- [ ] No performance degradation with 100+ templates
- [ ] No performance degradation with 1000+ logs

---

## 10. Compatibility Testing

### 10.1 Browser Compatibility
Test in each browser:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

For each browser:
- [ ] Email settings page works
- [ ] Template editor works
- [ ] Rich text editor works
- [ ] Rule configuration works
- [ ] All buttons/forms functional

### 10.2 Email Client Rendering
Send test email and verify in:
- [ ] Gmail (web)
- [ ] Outlook (web)
- [ ] Apple Mail (desktop)
- [ ] Outlook (desktop)
- [ ] Gmail (mobile)
- [ ] iOS Mail (mobile)

For each client:
- [ ] HTML renders correctly
- [ ] Formatting preserved
- [ ] Links work
- [ ] Images load (if included)
- [ ] Responsive design works

### 10.3 Mobile Responsiveness
On mobile device:
- [ ] Settings pages responsive
- [ ] Forms usable
- [ ] Template editor usable
- [ ] Buttons touchable (not too small)
- [ ] Tables scroll horizontally if needed

---

## 11. Accessibility Testing

### 11.1 Keyboard Navigation
- [ ] Can tab through all form fields
- [ ] Can submit forms with Enter key
- [ ] Dropdowns accessible via keyboard
- [ ] Modals dismissible with Escape
- [ ] Focus indicators visible

### 11.2 Screen Reader
Using screen reader:
- [ ] Form labels read correctly
- [ ] Error messages announced
- [ ] Success messages announced
- [ ] Button purposes clear
- [ ] Table data navigable

### 11.3 Color Contrast
- [ ] Status badges have sufficient contrast
- [ ] Error messages readable
- [ ] Form validation errors visible
- [ ] Links distinguishable

---

## 12. Smoke Tests (Quick Validation)

After deployment, run these quick tests:

- [ ] Login as admin ✓
- [ ] Settings page loads ✓
- [ ] Can access email integration page ✓
- [ ] Test connection button works ✓
- [ ] Can send test email ✓
- [ ] Logs show test email ✓
- [ ] Create sample ticket ✓
- [ ] Notification sent (if rule exists) ✓
- [ ] Check email received ✓
- [ ] All links work ✓

**Time to complete smoke tests:** < 10 minutes

---

## Test Summary

### Overall Results

**Total Tests:** _______
**Passed:** _______
**Failed:** _______
**Skipped:** _______
**Pass Rate:** _______%

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Minor Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations

_______________________________________________________
_______________________________________________________
_______________________________________________________

### Sign-Off

**Tested By:** _______________
**Date:** _______________
**Approved By:** _______________
**Date:** _______________

---

## Notes

Use this space for additional observations, edge cases, or issues:

_______________________________________________________
_______________________________________________________
_______________________________________________________
_______________________________________________________
_______________________________________________________
