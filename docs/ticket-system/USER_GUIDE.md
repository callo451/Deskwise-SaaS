# User Guide - Deskwise Ticket System

**Version:** 2.0
**Target Audience:** End Users, Technicians, Administrators

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Tickets](#creating-tickets)
3. [Managing Tickets](#managing-tickets)
4. [Time Tracking](#time-tracking)
5. [Working with Assets](#working-with-assets)
6. [Rating Your Experience](#rating-your-experience)
7. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### Logging In

1. Navigate to Deskwise portal (e.g., `https://yourcompany.deskwise.com`)
2. Enter your email and password
3. Click **Sign In**

### Dashboard Overview

After logging in, you'll see the main dashboard with:

- **Ticket Statistics:** Open, pending, and resolved ticket counts
- **My Tickets:** Tickets assigned to you or requested by you
- **Recent Activity:** Latest updates across all tickets
- **Quick Actions:** Create ticket, view reports

---

## Creating Tickets

### Step 1: Open Create Ticket Form

Click **New Ticket** button in the sidebar or on the dashboard.

### Step 2: Fill Out Ticket Details

**Required Fields:**
- **Title:** Brief description of the issue (e.g., "Printer not working")
- **Description:** Detailed explanation of the problem
- **Priority:**
  - **Low:** Minor inconvenience, workaround available
  - **Medium:** Normal issue, impacts work but not critical
  - **High:** Significant impact, no workaround
  - **Critical:** Business-critical, work completely blocked
- **Category:** Select from dropdown (e.g., Hardware, Software, Network)

**Optional Fields:**
- **Assign To:** Select a technician (if you have permission)
- **Tags:** Add keywords for easier searching
- **Client:** Select client (MSP mode only)
- **SLA Settings:** Response and resolution time targets

### Step 3: Add Attachments (Optional)

Click **Upload Files** or drag and drop files into the upload area.

**Supported Files:**
- Images (screenshots): PNG, JPG, GIF
- Documents: PDF, DOCX, XLSX
- Logs: TXT, LOG
- Archives: ZIP, RAR

**Limits:**
- Max 10MB per file
- Max 50MB total per ticket

### Step 4: Submit Ticket

Click **Create Ticket** button.

You'll receive a ticket number (e.g., **TKT-00123**) for tracking.

---

## Managing Tickets

### Viewing Your Tickets

**My Tickets:**
- Click **Tickets** in sidebar
- Filter by **Assigned to Me** or **Requested by Me**

**All Tickets** (Technicians/Admins):
- View all organization tickets
- Filter by status, priority, category, assignee

### Filtering Tickets

Use the filter panel to narrow down tickets:

1. Click **Filters** button
2. Select filters:
   - **Status:** New, Open, Pending, Resolved, Closed
   - **Priority:** Low, Medium, High, Critical
   - **Category:** Hardware, Software, etc.
   - **Assigned To:** Specific technician or "Unassigned"
3. Click **Apply Filters**

### Searching Tickets

Use the search bar to find tickets by:
- Ticket number (e.g., "TKT-00123")
- Title keywords
- Description content

---

## Working with Tickets

### Adding Comments

1. Open ticket detail page
2. Scroll to **Comments** section
3. Type your comment in the text box
4. Click **Add Comment**

**For Technicians/Admins:**
- Toggle **Internal Note** switch to create private comments
- Internal notes are hidden from end users
- Use for sensitive information or internal coordination

### Updating Ticket Status

**For Technicians/Admins:**

1. Open ticket detail page
2. Click on **Status** dropdown
3. Select new status:
   - **New:** Just created, not yet reviewed
   - **Open:** Actively being worked on
   - **Pending:** Waiting for customer response or external dependency
   - **Resolved:** Issue fixed, awaiting customer confirmation
   - **Closed:** Confirmed resolved and closed

### Assigning Tickets

**For Technicians/Admins:**

1. Open ticket detail page
2. Click on **Assigned To** dropdown
3. Select technician from list
4. Ticket automatically assigned

**Audit Trail:**
- All assignments are logged
- View assignment history in **Activity** tab

### Escalating Tickets

**When to Escalate:**
- SLA breach imminent or already breached
- Issue requires manager or specialist attention
- Customer is VIP and requires immediate attention

**How to Escalate:**

1. Open ticket detail page
2. Click **Escalate** button
3. Enter escalation reason
4. Click **Confirm**

**What Happens:**
- Ticket priority may be increased
- Managers are notified
- Escalation logged in audit trail

---

## Time Tracking

**For Technicians:**

### Starting a Timer

1. Open ticket detail page
2. Go to **Time Tracking** section
3. Click **Start Timer** button
4. Enter description (e.g., "Troubleshooting network issue")
5. Toggle **Billable** if applicable
6. Click **Start**

**Timer Indicators:**
- Running timer shows elapsed time
- Timer continues running even if you navigate away
- Only one timer can run per ticket per user

### Stopping a Timer

1. Open ticket with running timer
2. Click **Stop Timer** button
3. Time automatically calculated and saved
4. Ticket's total time updated

### Logging Time Manually

**For backdated or offline work:**

1. Open ticket detail page
2. Go to **Time Tracking** section
3. Click **Log Time** button
4. Enter:
   - **Description:** What you did
   - **Duration:** Minutes spent (e.g., 45)
   - **Start Time:** (optional) When work started
   - **Billable:** Toggle if billable to customer
5. Click **Save**

### Viewing Time Entries

1. Open ticket detail page
2. Go to **Time Tracking** section
3. See all time entries:
   - Who logged time
   - When it was logged
   - Duration
   - Billable status

**Total Time:**
- Displayed at top of ticket
- Automatically calculated from all entries

### Editing Time Entries

1. Find time entry to edit
2. Click **Edit** icon
3. Update description, duration, or billable status
4. Click **Save**

**Note:** Cannot edit duration of running timers.

### Deleting Time Entries

1. Find time entry to delete
2. Click **Delete** icon
3. Confirm deletion
4. Ticket's total time automatically updated

---

## Working with Assets

**For Technicians/Admins:**

### Linking Assets to Tickets

**Why Link Assets:**
- Track which device has issues
- View all tickets related to a device
- Maintenance history tracking
- Warranty claim documentation

**How to Link:**

1. Open ticket detail page
2. Go to **Linked Assets** section
3. Click **Link Asset** button
4. Search for asset by:
   - Asset tag (e.g., "COMP-00123")
   - Name
   - Serial number
5. Select asset from list
6. Asset linked to ticket

### Viewing Linked Assets

1. Open ticket detail page
2. Go to **Linked Assets** section
3. See all linked assets with:
   - Asset tag
   - Name
   - Category
   - Status

4. Click asset to view full asset details

### Unlinking Assets

1. Find asset in **Linked Assets** section
2. Click **Unlink** icon
3. Confirm unlinking
4. Asset removed from ticket

---

## Rating Your Experience

**For End Users (Ticket Requesters):**

### When to Rate

After your ticket is resolved, you'll receive a request to rate your experience.

### How to Rate

1. Open resolved ticket
2. Find **Rate This Ticket** section
3. Select rating:
   - ⭐ **1 Star:** Very Unsatisfied
   - ⭐⭐ **2 Stars:** Unsatisfied
   - ⭐⭐⭐ **3 Stars:** Neutral
   - ⭐⭐⭐⭐ **4 Stars:** Satisfied
   - ⭐⭐⭐⭐⭐ **5 Stars:** Very Satisfied
4. (Optional) Add feedback comments
5. Click **Submit Rating**

**Your Feedback Helps:**
- Improve service quality
- Recognize excellent technicians
- Identify areas for improvement

**Note:** You can only rate each ticket once.

---

## Tips & Best Practices

### For End Users

**When Creating Tickets:**

1. **Be Specific:** "Printer in Conference Room B not printing" instead of "Printer broken"
2. **Include Details:**
   - What were you trying to do?
   - What actually happened?
   - Error messages (copy exact text)
   - When did it start?
3. **Attach Screenshots:** A picture is worth a thousand words
4. **Choose Correct Priority:**
   - Don't mark everything as Critical
   - Use High/Critical only for true emergencies
5. **Add Context:**
   - Is this affecting others?
   - Is there a workaround?
   - Is this time-sensitive?

**While Ticket is Open:**

1. **Respond Promptly:** When technician asks for information
2. **Test Thoroughly:** When technician says issue is fixed
3. **Keep Comments Professional:** Even if frustrated
4. **Don't Create Duplicates:** Check if ticket already exists

**After Resolution:**

1. **Confirm Fix:** Test the solution before closing
2. **Provide Feedback:** Rate your experience honestly
3. **Document Workarounds:** If temporary solution was used

---

### For Technicians

**When Assigned a Ticket:**

1. **Acknowledge Quickly:** Add comment acknowledging receipt
2. **Set Expectations:** Tell customer when you'll start working
3. **Update Regularly:** Keep customer informed of progress
4. **Use Internal Notes:** For sensitive information or team coordination

**While Working on Ticket:**

1. **Track Time:** Start timer when you begin working
2. **Document Steps:** Add comments explaining what you tried
3. **Link Assets:** Associate relevant devices
4. **Update Status:** Keep status accurate (Open → Pending → Resolved)
5. **Upload Evidence:** Screenshots of fixed issue

**Before Closing:**

1. **Verify Fix:** Test solution thoroughly
2. **Document Root Cause:** Explain what was wrong
3. **Document Solution:** Explain what you did to fix it
4. **Check SLA:** Ensure you met response and resolution times
5. **Request CSAT:** Ask customer to rate their experience

**SLA Management:**

1. **Check Deadlines:** Review SLA indicators (green/yellow/red)
2. **Prioritize Breaches:** Work on red/yellow tickets first
3. **Escalate Early:** Don't wait until last minute
4. **Communicate Delays:** If you'll miss SLA, tell customer why

**Time Tracking Best Practices:**

1. **Start Timer Immediately:** When you start working
2. **Pause for Interruptions:** Stop timer if pulled away
3. **Describe Work Clearly:** "Investigated network logs" not "Working"
4. **Mark Billable Correctly:** Follow company policy
5. **Review Before Submitting:** Ensure accuracy

---

### For Administrators

**Ticket Management:**

1. **Monitor SLA Compliance:** Review SLA dashboard daily
2. **Balance Workload:** Ensure even distribution of tickets
3. **Review Escalations:** Handle escalated tickets promptly
4. **Analyze Trends:** Look for recurring issues

**Team Management:**

1. **Review Time Logs:** Check for accuracy and efficiency
2. **Monitor CSAT Scores:** Recognize high performers, coach low scorers
3. **Check Assignment Balance:** Ensure fair ticket distribution
4. **Review Internal Notes:** Quality check technician documentation

**Process Improvement:**

1. **Identify Common Issues:** Create knowledge base articles
2. **Optimize Categories:** Add/remove as needed
3. **Update Canned Responses:** Keep templates current
4. **Train Team:** Share best practices

---

## Keyboard Shortcuts

**Global:**
- `Ctrl + K`: Open command palette
- `Ctrl + /`: Open search
- `/`: Focus search bar

**Ticket List:**
- `N`: Create new ticket
- `R`: Refresh ticket list
- `F`: Open filters

**Ticket Detail:**
- `Ctrl + Enter`: Save comment
- `ESC`: Close modal
- `T`: Start/stop timer
- `E`: Edit ticket

---

## Frequently Asked Questions

### Q: How do I change the priority of a ticket?

**A:** Open the ticket and click on the priority dropdown. Select the new priority. Only technicians and admins can change priority.

### Q: Can I assign multiple people to one ticket?

**A:** No, tickets can only have one assignee at a time. However, multiple technicians can collaborate via comments and time tracking.

### Q: What happens when I escalate a ticket?

**A:** Escalation notifies managers and creates an audit log entry. The ticket's priority may be automatically increased.

### Q: Can I edit or delete comments?

**A:** Currently, comments cannot be edited or deleted. Please be careful when posting.

### Q: How do I see all tickets for a specific asset?

**A:** Go to the asset detail page and scroll to the "Related Tickets" section.

### Q: Can I export ticket data?

**A:** Yes, administrators can export tickets via the Reports section (future feature).

### Q: What if I accidentally close a ticket?

**A:** Technicians and admins can reopen closed tickets by changing the status back to "Open".

### Q: How long are tickets stored?

**A:** Tickets are stored indefinitely. Admins can archive old tickets to reduce clutter.

---

## Getting Help

### Support Resources

- **Knowledge Base:** [Browse articles](#)
- **Video Tutorials:** [Watch guides](#)
- **Email Support:** support@yourcompany.com
- **Live Chat:** Available 9 AM - 5 PM EST

### Reporting Issues

If you encounter problems with Deskwise itself:

1. Create a ticket with category "Deskwise Support"
2. Include:
   - What you were trying to do
   - What happened instead
   - Browser and OS version
   - Screenshots if applicable

---

**Document Version:** 2.0
**Last Updated:** October 2025
**For Questions:** Contact your IT administrator
