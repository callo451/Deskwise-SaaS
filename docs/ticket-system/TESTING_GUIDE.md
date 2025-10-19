# Integration Testing Guide - Ticket System Features

**Version:** 1.0.0
**Date:** 2025-01-18
**Server:** http://localhost:9002

---

## Overview

This guide walks through manual testing of all 7 new ticket system features. Complete these tests to verify the implementation before deploying to staging/production.

**Estimated Time:** 2-3 hours
**Prerequisites:**
- Development server running on http://localhost:9002
- MongoDB connection established
- At least one organization, admin user, and technician user created

---

## Pre-Testing Setup

### 1. Verify Server is Running

```bash
# Server should be running on port 9002
curl http://localhost:9002/api/health

# Expected response:
# {"status":"ok"}
```

### 2. Create Test Organization & Users

If you don't have test data, create:

1. **Admin User:**
   - Email: admin@test.com
   - Role: Administrator
   - Access: All permissions

2. **Technician User:**
   - Email: tech@test.com
   - Role: Technician
   - Access: Ticket management, time tracking

3. **End User:**
   - Email: user@test.com
   - Role: End User
   - Access: Submit tickets, view own tickets

### 3. Optional: Run Database Index Creation

```bash
node scripts/create-ticket-indexes.js
```

This is optional for testing but recommended for performance.

---

## Feature Testing Checklist

## 1. Canned Responses ✅ (Previously Completed)

### Test Case 1.1: Create Canned Response
- [ ] Navigate to `/settings/canned-responses`
- [ ] Click "Create Response"
- [ ] Fill in:
  - Name: "Password Reset Instructions"
  - Category: "Technical Support"
  - Content: "To reset your password, go to Settings > Security > Change Password"
  - Tags: "password", "security"
- [ ] Click Save
- [ ] Verify response appears in list

### Test Case 1.2: Use Canned Response in Ticket
- [ ] Go to any ticket detail page
- [ ] In comment box, click canned response icon
- [ ] Select "Password Reset Instructions"
- [ ] Verify content is inserted
- [ ] Add additional text and submit comment
- [ ] Check database: `use_count` should increment

### Test Case 1.3: Variable Interpolation
- [ ] Create response with variables: "Hello {{requester.name}}, your ticket #{{ticket.id}} is being processed"
- [ ] Use in a ticket
- [ ] Verify variables are replaced with actual values

**Status:** ⏳ Pending

---

## 2. SLA Escalation & Alerts ✅

### Test Case 2.1: Create Ticket with SLA

**API Test:**
```bash
curl -X POST http://localhost:9002/api/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "Test SLA Ticket",
    "description": "Testing SLA indicators",
    "priority": "high",
    "category": "incident",
    "sla": {
      "responseTime": 60,
      "resolutionTime": 240
    }
  }'
```

**UI Test:**
- [ ] Navigate to `/tickets/new`
- [ ] Fill in ticket details
- [ ] Set SLA: Response 1 hour, Resolution 4 hours
- [ ] Submit ticket
- [ ] Verify ticket created with SLA fields

### Test Case 2.2: Verify SLA Indicator Display

- [ ] Go to ticket detail page
- [ ] Verify SLA Status card shows:
  - Traffic light indicator (green/yellow/orange/red)
  - Time remaining countdown
  - Resolution deadline
  - Response deadline (if applicable)
- [ ] Status should be **green** (on-time) for new ticket

### Test Case 2.3: Test SLA States

**Manually Update Ticket Creation Time** (via MongoDB or API):
```javascript
// MongoDB Shell - Age the ticket
db.tickets.updateOne(
  { _id: ObjectId("ticket-id") },
  { $set: { createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) } } // 3 hours ago
)
```

- [ ] Refresh ticket page
- [ ] SLA should now be **yellow** or **orange** (at-risk)
- [ ] Time remaining should reflect updated status

### Test Case 2.4: Manual Escalation

- [ ] On ticket with at-risk SLA, click "Escalate" button
- [ ] Select escalation reason (dropdown)
- [ ] Optionally reassign to another user
- [ ] Submit escalation
- [ ] Verify:
  - Escalation history recorded
  - Priority increased (if configured)
  - Notification sent (if implemented)
  - Audit log created

### Test Case 2.5: SLA Dashboard Widget

- [ ] Navigate to `/dashboard`
- [ ] Verify SLA Dashboard Widget shows:
  - Total tickets with SLA
  - SLA compliance percentage
  - Breached count
  - At-risk count
  - On-time count
- [ ] Click "View At-Risk Tickets"
- [ ] Should navigate to filtered ticket list

### Test Case 2.6: At-Risk Tickets API

```bash
curl http://localhost:9002/api/tickets/at-risk \
  -H "Cookie: your-session-cookie"
```

**Expected:** List of tickets with < 25% time remaining

**Status:** ⏳ Pending

---

## 3. Internal Notes & Private Comments ✅

### Test Case 3.1: Create Internal Note (Admin)

- [ ] Log in as **admin** user
- [ ] Go to any ticket
- [ ] In comment section, toggle "Internal Note" switch
- [ ] Switch should show lock icon and amber background
- [ ] Write comment: "Internal: Customer is VIP, prioritize"
- [ ] Submit comment
- [ ] Verify comment displays with amber styling

### Test Case 3.2: Technician Views Internal Note

- [ ] Log out and log in as **technician** user
- [ ] Navigate to same ticket
- [ ] Verify internal note is visible
- [ ] Note should have amber background and lock icon

### Test Case 3.3: End User Cannot See Internal Note

- [ ] Log out and log in as **end user** (ticket requester)
- [ ] Navigate to same ticket
- [ ] Verify internal note is **NOT visible**
- [ ] Only public comments should display

### Test Case 3.4: API Response Filtering

```bash
# Admin/Technician - should get all comments
curl http://localhost:9002/api/tickets/{ticketId}/comments \
  -H "Cookie: admin-session-cookie"

# End User - should only get public comments
curl http://localhost:9002/api/tickets/{ticketId}/comments \
  -H "Cookie: user-session-cookie"
```

**Status:** ⏳ Pending

---

## 4. User Assignment ✅

### Test Case 4.1: Assign Ticket to User

- [ ] Go to ticket detail page
- [ ] In "Assignment" section, click "Assign"
- [ ] Dropdown should show:
  - **Admins** (grouped)
  - **Technicians** (grouped)
  - Workload indicator (e.g., "3 open tickets")
- [ ] Select a technician
- [ ] Click "Assign"
- [ ] Verify:
  - Assignee name displays
  - Avatar shows (if available)
  - Audit log created

### Test Case 4.2: Reassign Ticket

- [ ] From same ticket, click "Reassign"
- [ ] Select different user
- [ ] Verify assignment updates
- [ ] Check assignment history (if UI exists)

### Test Case 4.3: Unassign Ticket

- [ ] Click "Unassign" button
- [ ] Ticket should show "Unassigned"
- [ ] Assignee field should be empty

### Test Case 4.4: Workload Calculation

**Create multiple tickets and assign to same user:**
- [ ] Assign 5 tickets to "tech@test.com"
- [ ] Go to new ticket assignment dropdown
- [ ] "tech@test.com" should show "5 open tickets" in red/orange

### Test Case 4.5: My Assignments View

```bash
curl http://localhost:9002/api/tickets/my-assignments \
  -H "Cookie: technician-session-cookie"
```

**Expected:** List of tickets assigned to logged-in user

### Test Case 4.6: Assignment History Audit

```bash
curl http://localhost:9002/api/tickets/{ticketId}/assignment-history \
  -H "Cookie: session-cookie"
```

**Expected:** Array of assignment changes with:
- Timestamp
- Assigned by user
- Previous assignee
- New assignee

**Status:** ⏳ Pending

---

## 5. Asset Linking ✅

### Test Case 5.1: Link Asset to Ticket

**Prerequisites:** Create at least one asset in Asset Management

- [ ] Go to ticket detail page
- [ ] In "Linked Assets" section, click "Link Asset"
- [ ] Search for asset by name or ID
- [ ] Select asset from dropdown
- [ ] Click "Link"
- [ ] Verify:
  - Asset appears in linked assets list
  - Asset name, category, status visible

### Test Case 5.2: Link Multiple Assets

- [ ] From same ticket, link 2-3 more assets
- [ ] All assets should display in list
- [ ] Each asset should have "Unlink" button

### Test Case 5.3: Unlink Asset

- [ ] Click "Unlink" on one asset
- [ ] Confirm unlink action
- [ ] Asset should be removed from list

### Test Case 5.4: Navigate from Asset to Tickets

- [ ] Go to `/assets/{assetId}` (asset detail page)
- [ ] Should see "Linked Tickets" section
- [ ] All tickets linked to this asset should display
- [ ] Click on a ticket to navigate

### Test Case 5.5: Asset Suggestions

- [ ] Create ticket **as a specific user**
- [ ] That user should have assets assigned to them
- [ ] When linking assets, their assets should appear first (smart suggestions)

### Test Case 5.6: API Testing

```bash
# Link assets
curl -X PUT http://localhost:9002/api/tickets/{ticketId}/assets \
  -H "Content-Type: application/json" \
  -H "Cookie: session-cookie" \
  -d '{"assetIds": ["asset1", "asset2"]}'

# Get tickets for an asset
curl http://localhost:9002/api/assets/{assetId}/tickets \
  -H "Cookie: session-cookie"
```

**Status:** ⏳ Pending

---

## 6. Time Tracking ✅

### Test Case 6.1: Start Timer

- [ ] Go to ticket detail page
- [ ] In "Time Tracking" section, click "Start Timer"
- [ ] Enter description: "Investigating issue"
- [ ] Set billable toggle (on/off)
- [ ] Click "Start"
- [ ] Verify:
  - Timer shows running state
  - Elapsed time updates every second
  - "Stop" button appears

### Test Case 6.2: Stop Timer

- [ ] Let timer run for 30+ seconds
- [ ] Click "Stop Timer"
- [ ] Verify:
  - Timer stops
  - Time entry appears in list below
  - Duration calculated correctly
  - Total time on ticket updates

### Test Case 6.3: Manual Time Entry

- [ ] Click "Add Time Manually"
- [ ] Fill in:
  - Description: "Researched KB articles"
  - Duration: 30 minutes
  - Billable: Yes
  - Date: Today
- [ ] Submit entry
- [ ] Entry should appear in time entries list

### Test Case 6.4: Edit Time Entry

- [ ] Click edit icon on existing time entry
- [ ] Modify duration or description
- [ ] Save changes
- [ ] Verify updates reflect

### Test Case 6.5: Delete Time Entry

- [ ] Click delete icon on time entry
- [ ] Confirm deletion
- [ ] Entry removed from list
- [ ] Total time recalculates

### Test Case 6.6: Prevent Duplicate Timers

- [ ] Start timer on Ticket A
- [ ] Without stopping, try to start another timer on Ticket A
- [ ] Should show error: "Timer already running on this ticket"

### Test Case 6.7: Time Tracking Report

- [ ] Navigate to `/reports/time-tracking`
- [ ] Verify report shows:
  - Total hours tracked
  - Billable vs Non-billable breakdown
  - Entries grouped by ticket
  - Filters (date range, user, ticket)
- [ ] Apply date filter (last 7 days)
- [ ] Results should update

### Test Case 6.8: Export Time Entries

- [ ] On time tracking report page
- [ ] Click "Export CSV"
- [ ] CSV file should download
- [ ] Open CSV and verify data:
  - Ticket ID, Title, User, Duration, Billable, Date

### Test Case 6.9: Active Timer Indicator

```bash
curl http://localhost:9002/api/time-tracking/active \
  -H "Cookie: session-cookie"
```

**Expected:** List of user's active timers across all tickets

**Status:** ⏳ Pending

---

## 7. CSAT Rating System ✅

### Test Case 7.1: Submit CSAT Rating

**Prerequisites:** Ticket must be in "resolved" or "closed" status

- [ ] Resolve a ticket (change status to "resolved")
- [ ] CSAT rating dialog should auto-popup
- [ ] Verify dialog shows:
  - 5-star rating selector
  - Emoji indicators (😞 😐 🙂 😊 😍)
  - Optional feedback textarea
- [ ] Select 4 stars
- [ ] Enter feedback: "Great service, resolved quickly"
- [ ] Submit rating

### Test Case 7.2: Verify Rating Display

- [ ] Go to same ticket detail page
- [ ] CSAT rating should display in sidebar
- [ ] Shows: 4 stars, timestamp, feedback

### Test Case 7.3: Prevent Duplicate Ratings

- [ ] Try to submit another rating on same ticket
- [ ] Should show error: "Rating already submitted"

### Test Case 7.4: Rating as End User

- [ ] Log in as **end user** (ticket requester)
- [ ] Navigate to their resolved ticket
- [ ] Submit CSAT rating
- [ ] Verify rating saved

### Test Case 7.5: CSAT Dashboard Widget

- [ ] Go to `/dashboard`
- [ ] Verify CSAT Widget shows:
  - Average rating (e.g., 4.2/5.0)
  - Total ratings this month
  - Rating distribution (5 stars: 45%, 4 stars: 30%, etc.)
  - Trend indicator (↑ or ↓)

### Test Case 7.6: CSAT Analytics Report

- [ ] Navigate to `/reports/csat`
- [ ] Verify page shows:
  - Overall average rating
  - Total ratings
  - Score distribution chart (bar chart)
  - Recent ratings list
  - Filters:
    - Date range
    - Category
    - Technician
    - Rating (1-5 stars)

### Test Case 7.7: Filter by Rating

- [ ] On CSAT report, select "1 star" filter
- [ ] Only 1-star ratings should display
- [ ] Useful for finding dissatisfied customers

### Test Case 7.8: Technician Performance

- [ ] Filter CSAT report by specific technician
- [ ] Shows average rating for that technician's tickets
- [ ] Useful for performance reviews

### Test Case 7.9: API Testing

```bash
# Submit rating
curl -X POST http://localhost:9002/api/tickets/{ticketId}/rating \
  -H "Content-Type: application/json" \
  -H "Cookie: session-cookie" \
  -d '{"rating": 5, "feedback": "Excellent support!"}'

# Get CSAT stats
curl http://localhost:9002/api/csat/stats?startDate=2025-01-01 \
  -H "Cookie: session-cookie"
```

**Status:** ⏳ Pending

---

## 8. Enhanced UI/UX ✅

### Test Case 8.1: Keyboard Shortcuts

**Open shortcuts help:**
- [ ] Press `Ctrl + /` or `?`
- [ ] Shortcuts modal should appear
- [ ] Shows list of available shortcuts

**Test shortcuts:**
- [ ] `Ctrl + S` - Save ticket (on edit pages)
- [ ] `Ctrl + N` - New ticket
- [ ] `Ctrl + K` - Open command palette (if implemented)
- [ ] `Esc` - Close dialogs
- [ ] `Ctrl + Enter` - Submit comment

### Test Case 8.2: Inline Editing

- [ ] On ticket detail page, hover over title
- [ ] Should show edit icon
- [ ] Click to edit inline
- [ ] Modify title
- [ ] Press Enter or click checkmark to save
- [ ] Title updates without page reload

**Also test:**
- [ ] Description inline edit
- [ ] Priority inline edit
- [ ] Status inline edit

### Test Case 8.3: Activity Timeline

- [ ] On ticket detail page, scroll to "Activity Timeline"
- [ ] Verify events display:
  - Ticket created
  - Status changes
  - Comments added
  - Assignments
  - SLA escalations
  - Time entries
  - CSAT ratings
- [ ] Events should be chronologically ordered
- [ ] Each event has icon, timestamp, description

### Test Case 8.4: Quick Status Buttons

- [ ] Ticket detail page shows quick actions
- [ ] Status buttons adapt based on current status:
  - New → ["Start Progress", "Resolve"]
  - In Progress → ["Resolve", "Put on Hold"]
  - Resolved → ["Close", "Reopen"]
- [ ] Click "Resolve"
- [ ] Status changes immediately (optimistic update)

### Test Case 8.5: Loading Skeletons

- [ ] Clear browser cache
- [ ] Navigate to ticket list page
- [ ] Should see skeleton loading states before data loads
- [ ] Skeletons should match layout of actual content

### Test Case 8.6: Enhanced Comment Section

- [ ] Ticket detail page comment section
- [ ] Verify features:
  - Rich text editing (if implemented)
  - @mention suggestions (if implemented)
  - Attachment upload
  - Canned responses button
  - Internal note toggle
  - Character count
  - Preview mode

### Test Case 8.7: Mobile Responsive Layout

**Resize browser to mobile size (375px width):**
- [ ] Ticket detail page adapts to single column
- [ ] Sidebar moves below main content
- [ ] Navigation collapses to hamburger menu
- [ ] All features accessible on mobile

**Status:** ⏳ Pending

---

## Cross-Feature Integration Tests

### Test Case INT-1: Complete Ticket Lifecycle

1. [ ] **Create** ticket with SLA (Feature 2)
2. [ ] **Assign** to technician (Feature 4)
3. [ ] **Link** asset to ticket (Feature 5)
4. [ ] **Start** time tracker (Feature 6)
5. [ ] Add **internal note** for private tracking (Feature 3)
6. [ ] Use **canned response** to reply to requester (Feature 1)
7. [ ] **Stop** timer (Feature 6)
8. [ ] **Resolve** ticket
9. [ ] **Submit** CSAT rating (Feature 7)
10. [ ] Verify **activity timeline** shows all events (Feature 8)

### Test Case INT-2: SLA + Assignment + Time Tracking

- [ ] Create high-priority ticket with 2-hour SLA
- [ ] Assign to user with high workload
- [ ] SLA should show at-risk due to workload
- [ ] Start timer
- [ ] Resolve ticket within SLA
- [ ] Verify total time tracked matches timer
- [ ] Submit 5-star CSAT
- [ ] All data syncs correctly

### Test Case INT-3: Multi-Asset Incident

- [ ] Create incident ticket
- [ ] Link 5 different assets (servers, workstations, etc.)
- [ ] Add internal notes about each asset
- [ ] Track time separately for diagnosing each asset
- [ ] Verify total time aggregates correctly
- [ ] Asset detail pages all show this ticket

---

## Performance Testing

### Test Case PERF-1: Large Dataset Queries

**Create test data:**
- 100 tickets with SLA
- 50 time entries per ticket
- 20 CSAT ratings

**Test queries:**
- [ ] Load ticket list page (with SLA indicators)
- [ ] Should load in < 2 seconds
- [ ] Load time tracking report
- [ ] Should load in < 3 seconds
- [ ] Load CSAT analytics
- [ ] Should load in < 2 seconds

### Test Case PERF-2: Real-time Timer Updates

- [ ] Start 3 timers on different tickets
- [ ] All timers should update every second
- [ ] No lag or stuttering
- [ ] Browser devtools show < 10% CPU usage

---

## Security Testing

### Test Case SEC-1: RBAC Enforcement

**End User attempts admin actions:**
- [ ] Try to access `/settings/users` as end user
- [ ] Should redirect or show 403 Forbidden
- [ ] Try to create internal note
- [ ] Should not see internal note toggle
- [ ] Try to access time tracking report
- [ ] Should be denied

### Test Case SEC-2: Organization Isolation

**Create two organizations:**
- [ ] Create tickets in Org A
- [ ] Log in as user from Org B
- [ ] Try to access Org A tickets (by guessing URL)
- [ ] Should return 404 or 403
- [ ] Verify no data leakage

---

## API Testing (Optional)

### Postman Collection

Import the Postman collection (if available) and run:

- [ ] GET /api/tickets/sla-stats
- [ ] GET /api/tickets/at-risk
- [ ] POST /api/tickets/{id}/escalate
- [ ] POST /api/tickets/{id}/assign
- [ ] PUT /api/tickets/{id}/assets
- [ ] POST /api/tickets/{id}/time/start
- [ ] POST /api/tickets/{id}/time/stop
- [ ] POST /api/tickets/{id}/rating
- [ ] GET /api/csat/stats
- [ ] GET /api/time-tracking/entries

**All endpoints should:**
- Return 200 OK (or appropriate status)
- Include proper error handling
- Validate input
- Enforce RBAC

---

## Regression Testing

### Verify Existing Features Still Work

- [ ] Ticket CRUD (Create, Read, Update, Delete)
- [ ] Incident management
- [ ] Change requests
- [ ] Projects
- [ ] Knowledge base
- [ ] Asset management
- [ ] User management
- [ ] Settings pages

**No existing features should be broken by new code.**

---

## Known Issues & Workarounds

### Issue 1: Port Already in Use
**Error:** `EADDRINUSE: address already in use :::9002`
**Workaround:** Kill existing Node processes before starting server

### Issue 2: MongoDB Connection
**Error:** `MongoNetworkError: failed to connect to server`
**Workaround:** Verify MONGODB_URI in `.env.local`

---

## Test Results Template

```markdown
# Test Results - [Your Name] - [Date]

## Summary
- **Total Tests:** X
- **Passed:** Y
- **Failed:** Z
- **Skipped:** W

## Failed Tests
1. Test Case 6.3 - Manual Time Entry
   - Issue: Duration not calculating correctly
   - Steps to reproduce: ...
   - Expected: ...
   - Actual: ...

## Notes
- ...
```

---

## Next Steps After Testing

1. ✅ All tests passed → Proceed to staging deployment
2. ⚠️ Minor issues → Create bug tickets and fix
3. ❌ Critical issues → Halt deployment, fix immediately

**Staging deployment checklist** available in `docs/DEPLOYMENT_GUIDE.md` (if needed)

---

**Testing Guide Version:** 1.0.0
**Last Updated:** 2025-01-18
**Questions?** Contact the development team
