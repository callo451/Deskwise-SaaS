# Email Notification System - Admin Setup Guide

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [AWS SES Console Setup](#aws-ses-console-setup)
  - [Creating AWS Account](#creating-aws-account)
  - [Navigating to SES Console](#navigating-to-ses-console)
  - [Creating IAM User for SES](#creating-iam-user-for-ses)
  - [Generating Access Keys](#generating-access-keys)
  - [Verifying Email Addresses](#verifying-email-addresses)
  - [Verifying Domains (Optional)](#verifying-domains-optional)
  - [Moving Out of SES Sandbox Mode](#moving-out-of-ses-sandbox-mode)
  - [Setting Up Bounce/Complaint Notifications](#setting-up-bouncecomplaint-notifications)
- [Deskwise Configuration](#deskwise-configuration)
  - [Accessing Email Settings](#accessing-email-settings)
  - [Entering SES Credentials](#entering-ses-credentials)
  - [Testing Connection](#testing-connection)
  - [Verifying Email Addresses](#verifying-email-addresses-1)
  - [Creating Your First Template](#creating-your-first-template)
  - [Creating Your First Notification Rule](#creating-your-first-notification-rule)
  - [Testing End-to-End](#testing-end-to-end)
- [Troubleshooting Common Issues](#troubleshooting-common-issues)
- [Best Practices](#best-practices)
- [Cost Considerations](#cost-considerations)

## Introduction

The Deskwise Email Notification System provides automated email notifications for IT service management events. This system uses Amazon SES (Simple Email Service) as the email delivery provider, offering reliable, scalable, and cost-effective email delivery.

**Key Features:**
- Customizable email templates with Handlebars syntax
- Flexible notification rules with conditions
- User preference management
- Digest mode for email consolidation
- Comprehensive audit logging
- Multi-tenant support

**Time Required:** 30-60 minutes for complete setup

## Prerequisites

Before starting, ensure you have:

- [ ] Administrator access to your Deskwise instance
- [ ] Valid credit/debit card for AWS account setup
- [ ] Domain name (optional but recommended)
- [ ] Email address for verification
- [ ] Permission to modify DNS records (if verifying domain)

**Required Deskwise Permissions:**
- `settings.email.manage` - Configure email settings
- `settings.email.templates` - Manage email templates
- `settings.email.rules` - Manage notification rules

## AWS SES Console Setup

### Creating AWS Account

If you don't already have an AWS account:

1. **Visit AWS Console:**
   - Navigate to https://aws.amazon.com
   - Click "Create an AWS Account"

2. **Enter Account Details:**
   - Email address: Your business email
   - Password: Strong password (save securely)
   - AWS account name: Your organization name

3. **Contact Information:**
   - Account type: Choose "Business" for organizations
   - Full name: Your organization's legal name
   - Phone number: Business contact number
   - Country/Region: Your location
   - Address: Business address

4. **Payment Information:**
   - Enter credit/debit card details
   - Billing address (if different from contact address)

   **Note:** AWS SES has a generous free tier (62,000 emails/month when sending from EC2). You won't be charged unless you exceed this limit.

5. **Identity Verification:**
   - Enter phone number for verification
   - Choose SMS or voice call verification
   - Enter verification code

6. **Select Support Plan:**
   - Choose "Basic Support - Free" (sufficient for SES)
   - Click "Complete Sign Up"

7. **Wait for Account Activation:**
   - Usually takes 5-15 minutes
   - You'll receive confirmation email

### Navigating to SES Console

1. **Sign in to AWS Console:**
   - Go to https://console.aws.amazon.com
   - Enter your root account email and password

2. **Select Region:**
   - Click region dropdown (top right, near your account name)
   - Choose region closest to your users for best performance:
     - **US East (N. Virginia)** - us-east-1 (recommended for US)
     - **EU (Ireland)** - eu-west-1 (recommended for Europe)
     - **Asia Pacific (Sydney)** - ap-southeast-2 (recommended for APAC)

   **Important:** Remember this region - you'll need it for Deskwise configuration.

3. **Open SES Console:**
   - In the search bar at the top, type "SES"
   - Click "Amazon Simple Email Service"
   - You should see the SES dashboard

### Creating IAM User for SES

**Security Best Practice:** Never use your root AWS account credentials. Create a dedicated IAM user with minimal permissions.

1. **Open IAM Console:**
   - Search for "IAM" in the AWS Console search bar
   - Click "IAM" (Identity and Access Management)

2. **Create New User:**
   - Click "Users" in the left sidebar
   - Click "Add users" button
   - User name: `deskwise-ses-user` (or your preferred name)
   - Click "Next"

3. **Set Permissions:**
   - Select "Attach policies directly"
   - Search for "SES"
   - Check the box for **"AmazonSESFullAccess"** policy
   - Click "Next"

4. **Review and Create:**
   - Review user details
   - Click "Create user"
   - User created successfully message appears

### Generating Access Keys

1. **Open User Details:**
   - Click on the newly created user (`deskwise-ses-user`)
   - Click "Security credentials" tab

2. **Create Access Key:**
   - Scroll to "Access keys" section
   - Click "Create access key"
   - Select use case: "Application running outside AWS"
   - Check "I understand the above recommendation"
   - Click "Next"

3. **Add Description Tag (Optional):**
   - Description: "Deskwise Email Notifications"
   - Click "Create access key"

4. **Save Credentials Securely:**
   - **Access key ID:** Shown on screen (example: `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key:** Click "Show" to reveal (example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

   **CRITICAL:** This is the only time you'll see the secret access key. Save both values securely:
   - Download the .csv file (recommended)
   - Or copy both values to a password manager

   **Never share these credentials or commit them to version control.**

5. **Click "Done"**

### Verifying Email Addresses

**Note:** In SES Sandbox mode (default for new accounts), you can only send TO verified email addresses. You must also verify FROM addresses.

1. **Open SES Console:**
   - Navigate to Amazon SES console
   - Ensure you're in the correct region

2. **Navigate to Verified Identities:**
   - Click "Verified identities" in left sidebar
   - Click "Create identity" button

3. **Create Email Identity:**
   - Identity type: Select "Email address"
   - Email address: Enter the sender email (e.g., `notifications@yourdomain.com`)
   - Click "Create identity"

4. **Check Verification Email:**
   - AWS sends verification email to the address
   - Check your inbox (and spam folder)
   - Subject: "Amazon Web Services - Email Address Verification Request"
   - Click the verification link in the email

5. **Verify Additional Addresses:**
   - Repeat steps 2-4 for:
     - Any additional sender addresses
     - Test recipient addresses (while in sandbox mode)
     - Support team addresses

6. **Check Verification Status:**
   - Return to "Verified identities" page
   - Status should show "Verified" (green checkmark)
   - May take 1-2 minutes to update

**Screenshot Description:**
- AWS SES Console showing "Verified identities" page
- Table with columns: Identity, Type, Status, Default configuration set
- Green "Verified" badge next to email addresses

### Verifying Domains (Optional)

**Recommended for Production Use:** Domain verification allows you to send from any email address @yourdomain.com without verifying each address individually.

1. **Create Domain Identity:**
   - Click "Verified identities" in left sidebar
   - Click "Create identity"
   - Identity type: Select "Domain"
   - Domain: Enter your domain (e.g., `yourdomain.com`)
   - Advanced DKIM settings: Leave default (Easy DKIM enabled)
   - Click "Create identity"

2. **Copy DNS Records:**
   - AWS displays DNS records you must add
   - Three types of records:
     - **DKIM Records (3 CNAME records):** For email authentication
     - **Domain Verification (1 TXT record):** Proves domain ownership

   **Example DNS Records:**
   ```
   Type: CNAME
   Name: abc123._domainkey.yourdomain.com
   Value: abc123.dkim.amazonses.com

   Type: CNAME
   Name: def456._domainkey.yourdomain.com
   Value: def456.dkim.amazonses.com

   Type: CNAME
   Name: ghi789._domainkey.yourdomain.com
   Value: ghi789.dkim.amazonses.com

   Type: TXT
   Name: _amazonses.yourdomain.com
   Value: jkl012mnopqr
   ```

3. **Add Records to DNS Provider:**
   - Log in to your DNS hosting provider (e.g., Cloudflare, GoDaddy, Route53)
   - Navigate to DNS management
   - Add all four records exactly as shown in AWS console
   - Save changes

4. **Wait for Verification:**
   - DNS propagation can take 5 minutes to 72 hours
   - Typically completes within 30 minutes
   - Check status in AWS SES "Verified identities"
   - Refresh page periodically

5. **Verify DKIM Status:**
   - Click on your domain in "Verified identities"
   - Check "DKIM configuration" section
   - Status should show "Successful"

**Benefits of Domain Verification:**
- Send from any email @yourdomain.com
- Better email deliverability
- DKIM signing improves spam score
- Professional appearance

### Moving Out of SES Sandbox Mode

**SES Sandbox Limitations:**
- Can only send TO verified email addresses
- Maximum 200 emails per 24 hours
- Maximum 1 email per second

**Production Mode Benefits:**
- Send to any email address
- Higher sending limits (initially 50,000 emails/day)
- Ability to request limit increases

**How to Request Production Access:**

1. **Open SES Console:**
   - Navigate to Amazon SES
   - Ensure you're in the correct region

2. **Request Production Access:**
   - Click "Account dashboard" in left sidebar
   - Look for "Sending statistics" section
   - You'll see "Your account is in the sandbox" warning
   - Click "Request production access" button

3. **Fill Out Request Form:**

   **Mail Type:** Select one that best fits:
   - "Transactional" (recommended for Deskwise - notifications, alerts)
   - "Subscription" (if users explicitly subscribe)
   - "Marketing" (promotional emails)

   **Website URL:**
   - Enter your Deskwise instance URL
   - Example: `https://deskwise.yourcompany.com`

   **Use Case Description:** Be specific and detailed. Example:
   ```
   We use Deskwise, an IT Service Management platform, to manage IT support
   tickets and incidents for our organization. We need to send automated email
   notifications to our staff when:

   - New support tickets are created
   - Tickets are assigned to technicians
   - Ticket status changes
   - SLA breaches occur
   - Incident reports are generated

   All recipients are employees and contractors who have accounts in our system.
   We estimate sending approximately 500-1,000 emails per day initially.

   We have implemented proper bounce and complaint handling, and users can
   manage their notification preferences.
   ```

   **Additional Information:**
   - Mention opt-out mechanism (user preferences)
   - Note that all emails are transactional (not marketing)
   - Confirm you handle bounces and complaints

   **Acknowledge Compliance:**
   - Check all boxes confirming compliance with AWS policies

4. **Submit Request:**
   - Click "Submit request"
   - You'll receive confirmation email

5. **Wait for Approval:**
   - AWS typically responds within 24 hours
   - May ask follow-up questions
   - Check email and AWS Support Center

6. **Check Approval Status:**
   - Return to SES "Account dashboard"
   - If approved: "Your account has production access" (green banner)
   - Your sending quota increases to default limits

**If Request is Denied:**
- AWS will provide specific reasons
- Address their concerns
- Provide more details about your use case
- Resubmit request

### Setting Up Bounce/Complaint Notifications

**Why This Matters:**
- AWS monitors bounce and complaint rates
- High rates can result in account suspension
- Proper handling maintains good sender reputation

**Setup SNS for Notifications:**

1. **Open SNS Console:**
   - Search for "SNS" in AWS Console
   - Click "Simple Notification Service"
   - Ensure you're in the same region as SES

2. **Create Topic for Bounces:**
   - Click "Topics" in left sidebar
   - Click "Create topic"
   - Type: "Standard"
   - Name: `deskwise-ses-bounces`
   - Display name: "Deskwise SES Bounces"
   - Click "Create topic"

3. **Create Topic for Complaints:**
   - Repeat step 2 with:
   - Name: `deskwise-ses-complaints`
   - Display name: "Deskwise SES Complaints"

4. **Subscribe to Topics:**
   - Click on `deskwise-ses-bounces` topic
   - Click "Create subscription"
   - Protocol: "Email"
   - Endpoint: Your admin email
   - Click "Create subscription"
   - Check email and confirm subscription
   - Repeat for `deskwise-ses-complaints` topic

5. **Configure SES to Use SNS Topics:**
   - Return to SES Console
   - Click "Verified identities"
   - Click on your verified domain or email
   - Click "Notifications" tab
   - Click "Edit" in "Feedback notifications" section

   **Configure:**
   - Bounce feedback: Select `deskwise-ses-bounces`
   - Complaint feedback: Select `deskwise-ses-complaints`
   - Include original headers: Yes (recommended)
   - Click "Save changes"

6. **Test Notifications:**
   - Send test email to bounce@simulator.amazonses.com (simulates bounce)
   - You should receive SNS notification email
   - Verify complaint notifications similarly

**Screenshot Description:**
- SNS Topic configuration page showing subscription confirmed
- SES Notification settings showing SNS topics configured

## Deskwise Configuration

### Accessing Email Settings

1. **Log In as Administrator:**
   - Navigate to your Deskwise instance
   - Log in with administrator credentials

2. **Navigate to Settings:**
   - Click "Administration" in left sidebar
   - Click "Settings"
   - Click "Email Settings" or "Email Notifications"

3. **Email Settings Page Structure:**
   - **Provider Configuration:** AWS SES credentials
   - **Email Templates:** Template management
   - **Notification Rules:** Event-based rules
   - **Verified Addresses:** Sender verification
   - **Email Logs:** Delivery tracking

**Screenshot Description:**
- Deskwise settings sidebar showing "Email Settings" option
- Email settings page with tabs: Configuration, Templates, Rules, Logs

### Entering SES Credentials

1. **Click "Configuration" Tab:**
   - You should see the email provider setup form

2. **Select Email Provider:**
   - Provider: Select "Amazon SES" from dropdown
   - Other options may include: SMTP, SendGrid, etc.

3. **Enter AWS SES Credentials:**

   **Region:**
   - Select your AWS SES region from dropdown
   - Must match the region where you verified identities
   - Example: `us-east-1` (US East - N. Virginia)

   **Access Key ID:**
   - Paste the Access Key ID from IAM user creation
   - Example: `AKIAIOSFODNN7EXAMPLE`

   **Secret Access Key:**
   - Paste the Secret Access Key
   - Will be masked after saving for security
   - Example: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

   **Default From Email:**
   - Enter verified sender email address
   - Example: `notifications@yourdomain.com`
   - Must be verified in AWS SES

   **Default From Name:**
   - Friendly name shown to recipients
   - Example: `Deskwise Notifications`

   **Reply-To Email (Optional):**
   - Where recipients' replies go
   - Example: `support@yourdomain.com`
   - If blank, uses From Email

4. **Advanced Options (Optional):**

   **Configuration Set:**
   - Leave blank for now (advanced SES feature)
   - Used for email analytics and tracking

   **Rate Limiting:**
   - Maximum emails per second: `1` (default)
   - Maximum emails per day: `200` (sandbox) or `50000` (production)

   **Retry Settings:**
   - Maximum retry attempts: `3`
   - Retry delay: `300` seconds (5 minutes)

5. **Save Configuration:**
   - Click "Save Settings" button
   - System validates credentials (may take 5-10 seconds)
   - Success message: "Email settings saved successfully"

**Security Notes:**
- Credentials are encrypted at rest in database
- Secret access key is never displayed after initial save
- Only administrators with `settings.email.manage` permission can view settings

**Screenshot Description:**
- Email configuration form with labeled fields
- AWS SES region dropdown showing available regions
- Save button at bottom

### Testing Connection

**After saving credentials, always test the connection:**

1. **Locate Test Connection Section:**
   - Below configuration form
   - Or click "Test Connection" button in header

2. **Enter Test Email:**
   - Recipient email: Enter your email address
   - Must be verified in SES (if in sandbox mode)
   - Subject: "Deskwise Email Test" (pre-filled)
   - Body: Simple test message (pre-filled)

3. **Click "Send Test Email" Button:**
   - System attempts to send email via SES
   - Shows loading spinner

4. **Check Results:**

   **Success:**
   - Green checkmark with message: "Test email sent successfully!"
   - Message ID displayed: `0102018c9876543-abc123-def456...`
   - Check your email inbox (may take 1-2 minutes)

   **Failure:**
   - Red X with error message
   - Common errors:
     - "Invalid credentials" - Check access keys
     - "Email not verified" - Verify sender email in SES
     - "Recipient not verified" - Verify recipient (sandbox mode)
     - "Region mismatch" - Wrong region selected

5. **Verify Email Received:**
   - Check inbox of test recipient
   - Check spam/junk folder
   - Email should arrive within 1-2 minutes
   - Verify sender name and email address correct

**Troubleshooting Failed Tests:**
- See [Troubleshooting Common Issues](#troubleshooting-common-issues) section
- Check AWS SES console for error details
- Verify all credentials are correct
- Ensure region matches SES setup

**Screenshot Description:**
- Test connection dialog with email input field
- Success message with green checkmark and message ID
- Example test email received in inbox

### Verifying Email Addresses

**Purpose:** Register and verify sender email addresses in Deskwise (separate from AWS SES verification).

1. **Navigate to Verified Addresses:**
   - In Email Settings, click "Verified Addresses" tab
   - Shows list of currently verified addresses

2. **Add New Address:**
   - Click "Add Email Address" button
   - Modal dialog opens

3. **Enter Email Details:**
   - Email address: `notifications@yourdomain.com`
   - Display name: `Deskwise Notifications`
   - Purpose: Sender address for automated notifications
   - Click "Add Address"

4. **Verify Status:**
   - System checks if email is verified in AWS SES
   - If verified: Green checkmark with "Verified" status
   - If not verified: Red warning "Not verified in SES - please verify in AWS console"

5. **Set Default Sender:**
   - Click "Make Default" button on preferred address
   - This becomes the default sender for all notifications
   - Can be overridden per template or rule

6. **Add Multiple Addresses:**
   - Repeat for different purposes:
     - `no-reply@yourdomain.com` - Automated messages
     - `support@yourdomain.com` - Support notifications
     - `alerts@yourdomain.com` - Critical alerts
     - `reports@yourdomain.com` - Digest emails

**Best Practices:**
- Use role-based addresses (not personal emails)
- Use descriptive display names
- Keep list organized by purpose
- Remove unused addresses

**Screenshot Description:**
- Table of verified email addresses
- Columns: Email, Display Name, Status, Default, Actions
- "Add Email Address" button at top

### Creating Your First Template

**Let's create a simple ticket assignment notification template:**

1. **Navigate to Templates:**
   - Click "Email Templates" tab
   - You'll see default templates (if any)

2. **Click "Create Template" Button:**
   - Template creation form appears

3. **Enter Template Details:**

   **Template Name:**
   - `ticket-assigned`
   - Used internally, not shown to users
   - Use lowercase with hyphens

   **Display Name:**
   - `Ticket Assigned Notification`
   - Shown in template selector

   **Description:**
   - `Sent when a ticket is assigned to a technician`
   - Helps administrators understand purpose

   **Category:**
   - Select "Tickets" from dropdown
   - Organizes templates by module

4. **Compose Email Subject:**
   ```
   Ticket #{{ticket.id}} Assigned to You: {{ticket.title}}
   ```

   **Variables Explained:**
   - `{{ticket.id}}` - Ticket number
   - `{{ticket.title}}` - Ticket title
   - Results in: "Ticket #12345 Assigned to You: Printer Not Working"

5. **Compose Email Body (HTML):**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <style>
       body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
       .container { max-width: 600px; margin: 0 auto; padding: 20px; }
       .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
       .content { background-color: #f9f9f9; padding: 20px; }
       .ticket-details { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
       .label { font-weight: bold; color: #666; }
       .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
       .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
     </style>
   </head>
   <body>
     <div class="container">
       <div class="header">
         <h1>New Ticket Assigned</h1>
       </div>

       <div class="content">
         <p>Hi {{assignee.name}},</p>

         <p>A new ticket has been assigned to you:</p>

         <div class="ticket-details">
           <p><span class="label">Ticket ID:</span> #{{ticket.id}}</p>
           <p><span class="label">Title:</span> {{ticket.title}}</p>
           <p><span class="label">Priority:</span> {{ticket.priority}}</p>
           <p><span class="label">Requester:</span> {{ticket.requester.name}} ({{ticket.requester.email}})</p>
           <p><span class="label">Due Date:</span> {{formatDate ticket.dueDate}}</p>
           <p><span class="label">Description:</span></p>
           <p>{{ticket.description}}</p>
         </div>

         <a href="{{system.url}}/tickets/{{ticket.id}}" class="button">View Ticket</a>

         <p>Please review and respond as soon as possible.</p>
       </div>

       <div class="footer">
         <p>This is an automated notification from {{org.name}}</p>
         <p>You can manage your email preferences in your <a href="{{system.url}}/settings/notifications">account settings</a></p>
       </div>
     </div>
   </body>
   </html>
   ```

6. **Compose Plain Text Version:**
   ```
   Hi {{assignee.name}},

   A new ticket has been assigned to you:

   Ticket ID: #{{ticket.id}}
   Title: {{ticket.title}}
   Priority: {{ticket.priority}}
   Requester: {{ticket.requester.name}} ({{ticket.requester.email}})
   Due Date: {{formatDate ticket.dueDate}}

   Description:
   {{ticket.description}}

   View ticket: {{system.url}}/tickets/{{ticket.id}}

   Please review and respond as soon as possible.

   ---
   This is an automated notification from {{org.name}}
   Manage preferences: {{system.url}}/settings/notifications
   ```

7. **Preview Template:**
   - Click "Preview" button
   - System shows sample with test data
   - Verify formatting and variables

8. **Save Template:**
   - Click "Save Template"
   - Template appears in templates list
   - Status: "Active"

**Screenshot Description:**
- Template editor with HTML and plain text tabs
- Variables sidebar showing available placeholders
- Preview pane showing rendered email

### Creating Your First Notification Rule

**Let's create a rule to send the template when tickets are assigned:**

1. **Navigate to Notification Rules:**
   - Click "Notification Rules" tab
   - Shows existing rules (if any)

2. **Click "Create Rule" Button:**
   - Rule creation form appears

3. **Enter Rule Details:**

   **Rule Name:**
   - `Send email on ticket assignment`
   - Descriptive name for administrators

   **Description:**
   - `Automatically email technician when ticket is assigned`

   **Status:**
   - Toggle "Active" (enabled by default)

   **Priority:**
   - `100` (higher numbers execute first)
   - Use for rule ordering

4. **Select Trigger Event:**
   - Module: Select "Tickets"
   - Event: Select "Ticket Assigned"
   - Other events: Ticket Created, Status Changed, Priority Changed, etc.

5. **Add Conditions (Optional):**
   - Click "Add Condition"

   **Condition Example - Only for High Priority:**
   - Field: `ticket.priority`
   - Operator: `equals`
   - Value: `High`

   **Condition Example - Only for Specific Queue:**
   - Click "Add Condition" again
   - Condition logic: `AND` (all conditions must match)
   - Field: `ticket.queue`
   - Operator: `equals`
   - Value: `IT Support`

   **Leave empty to trigger for ALL ticket assignments**

6. **Select Email Template:**
   - Template: Select "Ticket Assigned Notification" from dropdown
   - Preview: Click to see template preview

7. **Specify Recipients:**

   **Recipient Type:** Select one or more:
   - ☑ Assignee (the technician ticket is assigned to)
   - ☐ Requester (person who created ticket)
   - ☐ CC'd users
   - ☐ Ticket watchers
   - ☐ Custom users/roles

   **Custom Recipients (if selected):**
   - Add specific email addresses or user IDs
   - Add roles (e.g., "Managers")

8. **Advanced Options:**

   **Send Immediately:**
   - ☑ Yes (send right away)
   - ☐ No - Batch into digest (consolidate emails)

   **Rate Limiting:**
   - Maximum per user per hour: `5` (prevent email flooding)
   - Skip if user opted out: ☑ Yes

   **Quiet Hours:**
   - Respect user quiet hours: ☑ Yes
   - Queue for next available time

9. **Save Rule:**
   - Click "Save Rule"
   - Rule appears in rules list with "Active" badge

**Screenshot Description:**
- Rule creation form with event selector
- Conditions builder with AND/OR logic
- Recipients selector with checkboxes
- Active/Inactive toggle switch

### Testing End-to-End

**Complete workflow test:**

1. **Verify Everything is Set Up:**
   - ☑ AWS SES credentials configured
   - ☑ Test connection successful
   - ☑ Sender email verified
   - ☑ Template created and active
   - ☑ Notification rule created and active

2. **Trigger the Event:**
   - Navigate to Tickets module
   - Create a new test ticket:
     - Title: "Test Email Notification"
     - Description: "Testing end-to-end email flow"
     - Priority: "High" (if condition set)
   - Assign ticket to yourself or test user

3. **Monitor Email Logs:**
   - Navigate to Email Settings > Logs tab
   - Should see new entry:
     - Timestamp: Current time
     - Template: "Ticket Assigned Notification"
     - Recipient: Assignee email
     - Status: "Queued" → "Sending" → "Sent"
     - Refresh page every 5-10 seconds

4. **Check Email Inbox:**
   - Open email client for recipient
   - Look for new email (check spam if not in inbox)
   - Verify:
     - Subject line includes ticket ID and title
     - Sender shows "Deskwise Notifications"
     - Body displays ticket details correctly
     - Links work correctly
     - Styling renders properly

5. **Verify Audit Trail:**
   - Click on email log entry
   - Should show:
     - Message ID from SES
     - Full event details
     - Delivery status
     - Any errors (if failed)

6. **Test User Preferences:**
   - Log in as the test user/assignee
   - Navigate to Profile Settings > Notifications
   - Turn off "Ticket Assigned" notifications
   - Assign another ticket
   - Verify email is NOT sent (check logs)
   - Re-enable notification

**Troubleshooting Test:**
- If email not received: Check Email Logs for errors
- If status stuck on "Sending": Check AWS SES sending queue
- If email in spam: Configure SPF/DKIM records
- If variables empty: Verify ticket has required fields

**Screenshot Description:**
- Email logs table showing successful delivery
- Test email received in inbox with proper formatting
- Log entry details showing message ID and status history

## Troubleshooting Common Issues

### Issue: "Test Connection Failed - Invalid Credentials"

**Symptoms:**
- Test email fails immediately
- Error message: "The security token included in the request is invalid"

**Causes:**
- Incorrect Access Key ID or Secret Access Key
- Keys from different AWS region
- IAM user lacks SES permissions

**Solutions:**
1. Verify credentials in AWS IAM console:
   - Sign in to AWS Console
   - Navigate to IAM > Users > deskwise-ses-user
   - Security credentials tab
   - Compare Access Key ID with Deskwise settings

2. If credentials lost, create new access key:
   - Delete old key in IAM
   - Create new key
   - Update Deskwise settings

3. Verify IAM user has AmazonSESFullAccess policy:
   - IAM > Users > deskwise-ses-user
   - Permissions tab
   - Should show "AmazonSESFullAccess" policy attached

4. Check region consistency:
   - Verify region in Deskwise matches AWS SES region
   - Example: Both should be `us-east-1`

### Issue: "Email Address Not Verified"

**Symptoms:**
- Error: "Email address is not verified"
- Can't send to or from certain addresses

**Causes:**
- Email address not verified in AWS SES
- Account still in sandbox mode
- Verification link not clicked

**Solutions:**
1. Verify sender address in SES:
   - AWS SES Console > Verified identities
   - Check if sender email is listed and verified
   - If not, add and verify

2. Click verification link in email:
   - AWS sends verification email
   - Check spam folder
   - Link expires after 24 hours
   - Request new verification if expired

3. If in sandbox mode, verify recipient addresses:
   - Add recipient email to verified identities
   - Or request production access (see guide above)

### Issue: "Email Not Received"

**Symptoms:**
- Email shows "Sent" in logs
- Recipient never receives it
- No bounce notification

**Causes:**
- Email filtered to spam
- Email client blocking
- Incorrect email address
- Delayed delivery

**Solutions:**
1. Check spam/junk folder first

2. Search for sender email in all folders

3. Check email logs for delivery details:
   - Status should be "Delivered" not just "Sent"
   - Check for "Bounced" or "Rejected" status

4. Verify email address is correct:
   - Check for typos
   - Verify user profile has correct email

5. Configure SPF, DKIM, and DMARC records:
   - Improves deliverability
   - See domain verification section

6. Check AWS SES reputation dashboard:
   - High bounce rate can cause delays
   - AWS SES Console > Reputation metrics

### Issue: "Template Rendering Error"

**Symptoms:**
- Error: "Failed to render template"
- Variables showing as blank
- Email not sent

**Causes:**
- Invalid Handlebars syntax
- Missing required variables
- Incorrect variable names

**Solutions:**
1. Check template syntax:
   - Ensure all `{{` have matching `}}`
   - Verify variable names match available variables
   - See [Template Guide](TEMPLATE_GUIDE.md) for valid variables

2. Test template with preview:
   - Use Preview button in template editor
   - System shows sample data
   - Identifies syntax errors

3. Check notification event provides required data:
   - Some variables only available for certain events
   - Example: `{{ticket.assignee.name}}` only available after assignment

4. Escape HTML in variables if needed:
   - Use `{{{variable}}}` (triple braces) for HTML content
   - Use `{{variable}}` for plain text

### Issue: "Permission Denied"

**Symptoms:**
- Error: "You don't have permission to perform this action"
- Can't access email settings

**Causes:**
- User lacks required RBAC permissions
- Session expired
- Role changed

**Solutions:**
1. Verify required permissions:
   - `settings.email.manage` - Configure settings
   - `settings.email.templates` - Manage templates
   - `settings.email.rules` - Manage rules

2. Contact administrator to grant permissions:
   - Navigate to Users & Roles
   - Edit your role or user permissions
   - Add required email permissions

3. Re-login to refresh session:
   - Log out and log back in
   - Session may have stale permissions

### Issue: "SES Rate Limit Exceeded"

**Symptoms:**
- Error: "Maximum sending rate exceeded"
- Emails queued but not sending
- Throttling errors in logs

**Causes:**
- Sending faster than SES allows
- Sandbox limit: 1 email/second
- Production limit: varies by account

**Solutions:**
1. If in sandbox mode:
   - Request production access
   - See "Moving Out of SES Sandbox Mode" section

2. If in production:
   - Check current limits: AWS SES Console > Account dashboard
   - Request limit increase: AWS Support Center
   - Typical production limit: 14-50 emails/second

3. Configure rate limiting in Deskwise:
   - Email Settings > Configuration
   - Set "Max emails per second" to safe value
   - Example: 1 for sandbox, 10 for production

4. Use digest mode for high-volume scenarios:
   - Consolidates multiple notifications
   - Reduces email count

### Issue: "High Bounce Rate Warning"

**Symptoms:**
- Email from AWS: "Your bounce rate is above 5%"
- Sending paused or account under review

**Causes:**
- Sending to invalid email addresses
- Email addresses no longer exist
- Users blocking emails

**Solutions:**
1. Review bounce notifications:
   - Check SNS notifications for bounced addresses
   - Remove invalid addresses from user database

2. Implement bounce handling:
   - Automatically disable notifications for bounced addresses
   - Flag user accounts for email verification

3. Clean email lists regularly:
   - Verify active users
   - Remove deactivated accounts
   - Validate email format

4. Use email validation service:
   - Validate emails before adding users
   - Check for common typos

5. Contact AWS Support if falsely flagged:
   - Provide evidence of proper email management
   - Request review

## Best Practices

### Email Template Design

1. **Mobile-First Design:**
   - Use responsive CSS
   - Maximum width: 600px
   - Large touch-friendly buttons
   - Readable font sizes (14px minimum)

2. **Always Include Plain Text:**
   - Required for accessibility
   - Fallback for email clients that block HTML
   - Better spam score

3. **Keep It Simple:**
   - Avoid complex layouts
   - Limit images (slow loading)
   - Use inline CSS (not external stylesheets)
   - Test in multiple email clients

4. **Clear Call-to-Action:**
   - One primary action per email
   - Large, prominent button
   - Clear link text ("View Ticket" not "Click Here")

5. **Professional Branding:**
   - Use company colors
   - Include logo (as image or text)
   - Consistent footer
   - Contact information

### Notification Strategy

1. **Don't Over-Notify:**
   - Only send actionable notifications
   - Avoid noise (every comment doesn't need email)
   - Use digest mode for updates

2. **Respect User Preferences:**
   - Always check opt-out before sending
   - Respect quiet hours
   - Provide granular controls

3. **Prioritize Notifications:**
   - Critical alerts: Immediate
   - Updates: Digest (hourly/daily)
   - Reports: Scheduled (daily/weekly)

4. **Test Before Deploying:**
   - Send to test group first
   - Verify links work
   - Check all variables render
   - Test on mobile devices

5. **Monitor Metrics:**
   - Track open rates (if tracking enabled)
   - Monitor bounce rates (keep below 5%)
   - Watch complaint rates (keep below 0.1%)
   - Review logs regularly

### Security Best Practices

1. **Protect Credentials:**
   - Never commit AWS keys to version control
   - Rotate access keys every 90 days
   - Use IAM user (not root account)
   - Limit IAM permissions (only SES access)

2. **Verify Email Addresses:**
   - Only send from verified addresses
   - Verify domains for production
   - Implement SPF/DKIM/DMARC

3. **Audit Trail:**
   - Enable comprehensive logging
   - Log all email sends
   - Track who creates/modifies templates
   - Monitor for anomalies

4. **Data Privacy:**
   - Don't include sensitive data in emails
   - Use links to view details (not full content)
   - Consider GDPR/privacy regulations
   - Provide unsubscribe mechanism

### Cost Optimization

1. **Use Digest Mode:**
   - Consolidate multiple notifications
   - Reduce email count by 50-80%
   - Example: 10 ticket updates → 1 daily digest

2. **Set Appropriate Limits:**
   - Configure max emails per user per hour
   - Prevent runaway notification loops
   - Example: 5 emails/hour per user

3. **Clean Up Inactive Users:**
   - Disable notifications for inactive accounts
   - Remove bounced email addresses
   - Archive old user accounts

4. **Monitor Usage:**
   - Check SES usage dashboard monthly
   - Set up billing alerts in AWS
   - Alert at 80% of expected usage

5. **Optimize Template Size:**
   - Minimize HTML size
   - Compress images
   - Remove unnecessary styles
   - Smaller emails = lower costs (minimal but adds up)

## Cost Considerations

### AWS SES Pricing (as of 2024)

**Free Tier:**
- 62,000 emails per month when sending from AWS EC2
- 3,000 emails per month for all other sending

**Paid Tier (after free tier):**
- $0.10 per 1,000 emails sent
- $0.12 per GB of attachments sent

**Additional Costs:**
- Dedicated IP: $24.95/month (optional, for high volume)
- Email receiving: $0.10 per 1,000 emails (if enabled)
- SNS notifications: First 1,000 free, $0.50 per 1M after

### Example Monthly Costs

**Small Organization (2,000 emails/month):**
- Within free tier: **$0.00**

**Medium Organization (10,000 emails/month):**
- First 3,000: Free
- Remaining 7,000: $0.70
- **Total: $0.70/month**

**Large Organization (50,000 emails/month):**
- First 3,000: Free
- Remaining 47,000: $4.70
- SNS notifications: ~$0.00 (within free tier)
- **Total: $4.70/month**

**Enterprise (500,000 emails/month):**
- First 3,000: Free
- Remaining 497,000: $49.70
- SNS notifications: ~$0.25
- Dedicated IP (optional): $24.95
- **Total: $74.90/month (without dedicated IP: $49.95)**

### Cost Comparison

| Provider | 10,000 emails/month | 50,000 emails/month | 500,000 emails/month |
|----------|--------------------:|--------------------:|---------------------:|
| AWS SES | $0.70 | $4.70 | $49.95 |
| SendGrid | $15.00 | $60.00 | $450.00 |
| Mailgun | $35.00 | $80.00 | $650.00 |

**AWS SES is the most cost-effective option for transactional emails.**

### How to Estimate Your Costs

1. **Count Daily Email Events:**
   - New tickets per day: __________
   - Ticket assignments per day: __________
   - Status changes per day: __________
   - Other notifications per day: __________
   - **Total emails per day:** __________

2. **Calculate Monthly:**
   - Daily emails × 30 = __________ emails/month

3. **Apply Pricing:**
   - If < 3,000: Free
   - If > 3,000: (Total - 3,000) × $0.0001 = $__________

4. **Add Optional Costs:**
   - Dedicated IP (if needed): $24.95
   - **Total estimated monthly cost:** $__________

### Monitoring Costs

1. **Set Up AWS Billing Alerts:**
   - AWS Console > Billing Dashboard
   - Create budget alert
   - Example: Alert when charges exceed $10

2. **Check SES Dashboard:**
   - AWS SES Console > Account dashboard
   - View "Emails sent in last 24 hours"
   - Estimate monthly usage

3. **Review Deskwise Email Logs:**
   - Email Settings > Logs
   - Filter by date range
   - Count total emails sent

## Next Steps

After completing this setup guide:

1. **Learn Template Customization:**
   - Read [Template Creation Guide](TEMPLATE_GUIDE.md)
   - Create templates for other events
   - Customize branding and styling

2. **Configure More Rules:**
   - Read [Notification Rules Guide](NOTIFICATION_RULES_GUIDE.md)
   - Set up rules for incidents, changes, etc.
   - Implement digest mode

3. **Train Your Team:**
   - Share [User Preferences Guide](USER_PREFERENCES_GUIDE.md) with staff
   - Explain how to manage notifications
   - Encourage use of digest mode

4. **Monitor and Optimize:**
   - Review email logs weekly
   - Check bounce/complaint rates
   - Adjust rules based on feedback

5. **Plan for Growth:**
   - Request SES limit increases proactively
   - Consider dedicated IP for high volume
   - Implement advanced features (tracking, analytics)

## See Also

- [Template Creation Guide](TEMPLATE_GUIDE.md) - How to create email templates
- [Notification Rules Guide](NOTIFICATION_RULES_GUIDE.md) - Creating notification rules
- [User Preferences Guide](USER_PREFERENCES_GUIDE.md) - Managing user preferences
- [API Reference](API_REFERENCE.md) - Developer API documentation
- [Troubleshooting Guide](TROUBLESHOOTING.md) - Common issues and solutions
- [Security Documentation](SECURITY.md) - Security best practices

## Support

If you need help:
- Check [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review AWS SES documentation: https://docs.aws.amazon.com/ses/
- Contact your Deskwise administrator
- Submit support ticket in Deskwise

---

**Document Version:** 1.0
**Last Updated:** October 2025
**Maintained By:** Deskwise Team
