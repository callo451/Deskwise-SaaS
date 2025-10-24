# Unified Ticket Time Tracking System

Complete time tracking implementation for unified tickets with manual entry and timer functionality.

## Overview

The unified ticket time tracking system provides:
- **Manual Time Entry**: Add time entries with hours and minutes
- **Start/Stop Timer**: Real-time timer with automatic time calculation
- **Billable/Non-Billable Tracking**: Flag time entries as billable or non-billable
- **Multiple Entries**: Support for multiple time entries per ticket
- **User-Level Tracking**: Each entry is associated with a user
- **Statistics**: Calculate total time, billable hours, and per-user breakdowns

## Database Collections

### `unified_ticket_time_entries`
Stores all time entries for unified tickets.

**Indexes:**
```javascript
db.unified_ticket_time_entries.createIndex({ ticketId: 1, orgId: 1 })
db.unified_ticket_time_entries.createIndex({ userId: 1, orgId: 1 })
db.unified_ticket_time_entries.createIndex({ createdAt: -1 })
```

**Schema:**
```typescript
{
  _id: ObjectId,
  ticketId: string,
  orgId: string,
  userId: string,
  userName: string,
  description: string,
  hours: number,
  minutes: number,
  isBillable: boolean,
  startTime?: Date,      // Optional: Set when created from timer
  endTime?: Date,        // Optional: Set when created from timer
  createdAt: Date
}
```

### `active_timers`
Stores currently running timers.

**Indexes:**
```javascript
db.active_timers.createIndex({ ticketId: 1, userId: 1, orgId: 1 }, { unique: true })
db.active_timers.createIndex({ userId: 1, orgId: 1 })
```

**Schema:**
```typescript
{
  _id: ObjectId,
  ticketId: string,
  orgId: string,
  userId: string,
  startTime: Date,
  description?: string
}
```

## Type Definitions

Located in `src/lib/types.ts`:

```typescript
export interface UnifiedTicketTimeEntry {
  _id: ObjectId
  ticketId: string
  orgId: string
  userId: string
  userName: string
  description: string
  hours: number
  minutes: number
  isBillable: boolean
  startTime?: Date
  endTime?: Date
  createdAt: Date
}

export interface ActiveTimer {
  _id: ObjectId
  ticketId: string
  orgId: string
  userId: string
  startTime: Date
  description?: string
}
```

## Service Layer

Located in `src/lib/services/unified-ticket-time.ts`.

### UnifiedTicketTimeService Methods

#### `addTimeEntry(ticketId, orgId, userId, userName, input)`
Add a manual time entry.

**Input:**
```typescript
{
  description: string,
  hours: number,        // 0-999
  minutes: number,      // 0-59
  isBillable: boolean
}
```

**Returns:** `UnifiedTicketTimeEntry`

---

#### `getTimeEntries(ticketId, orgId)`
Get all time entries for a ticket.

**Returns:** `UnifiedTicketTimeEntry[]`

---

#### `getTotalTime(ticketId, orgId)`
Calculate total time for a ticket.

**Returns:**
```typescript
{
  totalHours: number,
  totalMinutes: number,
  billableHours: number,
  billableMinutes: number
}
```

---

#### `startTimer(ticketId, orgId, userId, input?)`
Start a timer for a ticket.

**Input (optional):**
```typescript
{
  description?: string
}
```

**Returns:** `ActiveTimer`

**Throws:** Error if timer already running for this ticket/user

---

#### `stopTimer(ticketId, orgId, userId, userName, input)`
Stop a running timer and create a time entry.

**Input:**
```typescript
{
  description: string,
  isBillable: boolean
}
```

**Returns:** `UnifiedTicketTimeEntry` (with startTime and endTime set)

**Throws:** Error if no active timer found

---

#### `getActiveTimer(ticketId, userId, orgId)`
Get active timer for a user on a specific ticket.

**Returns:** `ActiveTimer | null`

---

#### `getUserActiveTimers(userId, orgId)`
Get all active timers for a user.

**Returns:** `ActiveTimer[]`

---

#### `deleteTimeEntry(entryId, orgId, userId?)`
Delete a time entry.

**Parameters:**
- `entryId`: Time entry ID to delete
- `orgId`: Organization ID
- `userId` (optional): If provided, only allows deletion of own entries

**Returns:** `boolean` (true if deleted)

**Throws:** Error if user tries to delete another user's entry

---

#### `getTicketTimeStats(ticketId, orgId)`
Get comprehensive time statistics.

**Returns:**
```typescript
{
  totalHours: number,
  totalMinutes: number,
  billableHours: number,
  billableMinutes: number,
  nonBillableHours: number,
  nonBillableMinutes: number,
  entryCount: number,
  entriesByUser: Array<{
    userId: string,
    userName: string,
    totalHours: number,
    totalMinutes: number,
    billableHours: number,
    billableMinutes: number
  }>
}
```

## API Routes

### GET `/api/unified-tickets/[id]/time`
Get time entries and statistics for a ticket.

**Authentication:** Required
**Permissions:** `tickets.view.all` OR `tickets.view.own`

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketId": "507f191e810c19729de860ea",
      "orgId": "org_123",
      "userId": "user_456",
      "userName": "John Doe",
      "description": "Troubleshooting network issue",
      "hours": 2,
      "minutes": 30,
      "isBillable": true,
      "startTime": "2025-01-20T10:00:00Z",
      "endTime": "2025-01-20T12:30:00Z",
      "createdAt": "2025-01-20T12:30:00Z"
    }
  ],
  "stats": {
    "totalHours": 2,
    "totalMinutes": 30,
    "billableHours": 2,
    "billableMinutes": 30,
    "nonBillableHours": 0,
    "nonBillableMinutes": 0,
    "entryCount": 1,
    "entriesByUser": [
      {
        "userId": "user_456",
        "userName": "John Doe",
        "totalHours": 2,
        "totalMinutes": 30,
        "billableHours": 2,
        "billableMinutes": 30
      }
    ]
  }
}
```

---

### POST `/api/unified-tickets/[id]/time`
Add a manual time entry.

**Authentication:** Required
**Permissions:** `tickets.edit.all` OR `tickets.edit.own`

**Request Body:**
```json
{
  "description": "Resolved printer configuration issue",
  "hours": 1,
  "minutes": 15,
  "isBillable": true
}
```

**Validation:**
- `description`: Required, min 1 character
- `hours`: Required, 0-999
- `minutes`: Required, 0-59
- `isBillable`: Required, boolean

**Response:**
```json
{
  "success": true,
  "entry": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketId": "507f191e810c19729de860ea",
    "orgId": "org_123",
    "userId": "user_456",
    "userName": "John Doe",
    "description": "Resolved printer configuration issue",
    "hours": 1,
    "minutes": 15,
    "isBillable": true,
    "createdAt": "2025-01-20T14:00:00Z"
  }
}
```

---

### DELETE `/api/unified-tickets/[id]/time`
Delete a time entry.

**Authentication:** Required
**Permissions:** `tickets.edit.all` OR `tickets.edit.own`

**Authorization:**
- Users with `tickets.edit.all` can delete any entry
- Users with only `tickets.edit.own` can only delete their own entries

**Request Body:**
```json
{
  "entryId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Time entry deleted successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": "You can only delete your own time entries"
}
```

---

### POST `/api/unified-tickets/[id]/time/start`
Start a timer for a ticket.

**Authentication:** Required
**Permissions:** `tickets.edit.all` OR `tickets.edit.own`

**Request Body:**
```json
{
  "description": "Working on network troubleshooting"
}
```

**Validation:**
- `description`: Optional string

**Response:**
```json
{
  "success": true,
  "timer": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketId": "507f191e810c19729de860ea",
    "orgId": "org_123",
    "userId": "user_456",
    "startTime": "2025-01-20T14:00:00Z",
    "description": "Working on network troubleshooting"
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Timer already running for this ticket"
}
```

---

### POST `/api/unified-tickets/[id]/time/stop`
Stop a running timer and create a time entry.

**Authentication:** Required
**Permissions:** `tickets.edit.all` OR `tickets.edit.own`

**Request Body:**
```json
{
  "description": "Completed network troubleshooting",
  "isBillable": true
}
```

**Validation:**
- `description`: Required, min 1 character
- `isBillable`: Required, boolean

**Response:**
```json
{
  "success": true,
  "entry": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketId": "507f191e810c19729de860ea",
    "orgId": "org_123",
    "userId": "user_456",
    "userName": "John Doe",
    "description": "Completed network troubleshooting",
    "hours": 1,
    "minutes": 23,
    "isBillable": true,
    "startTime": "2025-01-20T14:00:00Z",
    "endTime": "2025-01-20T15:23:00Z",
    "createdAt": "2025-01-20T15:23:00Z"
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "No active timer found for this ticket"
}
```

---

### GET `/api/unified-tickets/[id]/time/active`
Get active timer for current user on a ticket.

**Authentication:** Required
**Permissions:** `tickets.view.all` OR `tickets.view.own`

**Response (timer exists):**
```json
{
  "success": true,
  "timer": {
    "_id": "507f1f77bcf86cd799439011",
    "ticketId": "507f191e810c19729de860ea",
    "orgId": "org_123",
    "userId": "user_456",
    "startTime": "2025-01-20T14:00:00Z",
    "description": "Working on network troubleshooting"
  }
}
```

**Response (no timer):**
```json
{
  "success": true,
  "timer": null
}
```

## RBAC Integration

### Permissions Used

- **`tickets.view.all`**: View all time entries
- **`tickets.view.own`**: View own time entries
- **`tickets.edit.all`**: Add/delete any time entries, start/stop timers
- **`tickets.edit.own`**: Add own time entries, start/stop own timers

### Authorization Rules

1. **View Time Entries**: Requires `tickets.view.all` OR `tickets.view.own`
2. **Add Time Entry**: Requires `tickets.edit.all` OR `tickets.edit.own`
3. **Delete Time Entry**:
   - Admins (`tickets.edit.all`): Can delete any entry
   - Regular users (`tickets.edit.own`): Can only delete own entries
4. **Start/Stop Timer**: Requires `tickets.edit.all` OR `tickets.edit.own`

## Ticket Total Time Update

When time entries are added or deleted, the `unified_tickets.totalTimeSpent` field is automatically updated with the total time in decimal hours format.

**Example:**
- 2 hours 30 minutes → `2.5` hours
- 1 hour 15 minutes → `1.25` hours
- 45 minutes → `0.75` hours

This allows for easy reporting and billing calculations.

## Frontend Integration

### Example: Add Manual Time Entry

```typescript
const addTimeEntry = async (ticketId: string) => {
  const response = await fetch(`/api/unified-tickets/${ticketId}/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Troubleshooting network issue',
      hours: 2,
      minutes: 30,
      isBillable: true,
    }),
  })

  const data = await response.json()
  if (data.success) {
    console.log('Time entry added:', data.entry)
  }
}
```

### Example: Start Timer

```typescript
const startTimer = async (ticketId: string) => {
  const response = await fetch(`/api/unified-tickets/${ticketId}/time/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Working on ticket',
    }),
  })

  const data = await response.json()
  if (data.success) {
    console.log('Timer started:', data.timer)
  } else {
    console.error('Error:', data.error)
  }
}
```

### Example: Stop Timer

```typescript
const stopTimer = async (ticketId: string) => {
  const response = await fetch(`/api/unified-tickets/${ticketId}/time/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: 'Completed troubleshooting',
      isBillable: true,
    }),
  })

  const data = await response.json()
  if (data.success) {
    console.log('Timer stopped. Time entry:', data.entry)
    console.log(`Tracked: ${data.entry.hours}h ${data.entry.minutes}m`)
  }
}
```

### Example: Check Active Timer

```typescript
const checkActiveTimer = async (ticketId: string) => {
  const response = await fetch(`/api/unified-tickets/${ticketId}/time/active`)
  const data = await response.json()

  if (data.timer) {
    const elapsed = Date.now() - new Date(data.timer.startTime).getTime()
    const hours = Math.floor(elapsed / 3600000)
    const minutes = Math.floor((elapsed % 3600000) / 60000)
    console.log(`Timer running: ${hours}h ${minutes}m`)
  } else {
    console.log('No active timer')
  }
}
```

### Example: Display Time Statistics

```typescript
const displayTimeStats = async (ticketId: string) => {
  const response = await fetch(`/api/unified-tickets/${ticketId}/time`)
  const data = await response.json()

  if (data.success) {
    const { stats } = data
    console.log(`Total Time: ${stats.totalHours}h ${stats.totalMinutes}m`)
    console.log(`Billable: ${stats.billableHours}h ${stats.billableMinutes}m`)
    console.log(`Non-Billable: ${stats.nonBillableHours}h ${stats.nonBillableMinutes}m`)
    console.log(`Entries: ${stats.entryCount}`)

    stats.entriesByUser.forEach((user: any) => {
      console.log(`- ${user.userName}: ${user.totalHours}h ${user.totalMinutes}m`)
    })
  }
}
```

## Database Indexes (Recommended)

Run these commands in MongoDB shell or Compass to create optimal indexes:

```javascript
use deskwise

// Time entries indexes
db.unified_ticket_time_entries.createIndex({ ticketId: 1, orgId: 1 })
db.unified_ticket_time_entries.createIndex({ userId: 1, orgId: 1 })
db.unified_ticket_time_entries.createIndex({ createdAt: -1 })
db.unified_ticket_time_entries.createIndex({ orgId: 1, isBillable: 1, createdAt: -1 })

// Active timers indexes
db.active_timers.createIndex({ ticketId: 1, userId: 1, orgId: 1 }, { unique: true })
db.active_timers.createIndex({ userId: 1, orgId: 1 })
db.active_timers.createIndex({ startTime: 1 })
```

## Error Handling

All API routes return consistent error responses:

**Validation Error (400):**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "path": ["hours"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Unauthorized (401):**
```json
{
  "error": "Unauthorized"
}
```

**Forbidden (403):**
```json
{
  "error": "You do not have permission to perform this action. Required: tickets.edit.all or tickets.edit.own"
}
```

**Not Found (404):**
```json
{
  "error": "Time entry not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "error": "Error message here"
}
```

## Testing

### Manual Testing with cURL

**Add time entry:**
```bash
curl -X POST http://localhost:9002/api/unified-tickets/TICKET_ID/time \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "description": "Fixed network issue",
    "hours": 2,
    "minutes": 30,
    "isBillable": true
  }'
```

**Start timer:**
```bash
curl -X POST http://localhost:9002/api/unified-tickets/TICKET_ID/time/start \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{"description": "Working on ticket"}'
```

**Stop timer:**
```bash
curl -X POST http://localhost:9002/api/unified-tickets/TICKET_ID/time/stop \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "description": "Completed work",
    "isBillable": true
  }'
```

**Get time entries:**
```bash
curl http://localhost:9002/api/unified-tickets/TICKET_ID/time \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

## Files Created

### Type Definitions
- `src/lib/types.ts` - Added `UnifiedTicketTimeEntry` and `ActiveTimer` interfaces

### Database Collections
- `src/lib/mongodb.ts` - Added `UNIFIED_TICKET_TIME_ENTRIES` and `ACTIVE_TIMERS` constants

### Service Layer
- `src/lib/services/unified-ticket-time.ts` - Complete service implementation (391 lines)

### API Routes
- `src/app/api/unified-tickets/[id]/time/route.ts` - GET, POST, DELETE for time entries
- `src/app/api/unified-tickets/[id]/time/start/route.ts` - POST to start timer
- `src/app/api/unified-tickets/[id]/time/stop/route.ts` - POST to stop timer
- `src/app/api/unified-tickets/[id]/time/active/route.ts` - GET active timer

## Implementation Summary

The time tracking system is fully implemented and production-ready with:

- ✅ Complete type safety with TypeScript
- ✅ RBAC integration with permission checks
- ✅ Input validation with Zod schemas
- ✅ Comprehensive error handling
- ✅ Automatic ticket total time updates
- ✅ Support for both manual entry and timer workflows
- ✅ Multi-tenant organization isolation
- ✅ User-level entry tracking
- ✅ Billable/non-billable categorization
- ✅ Detailed statistics and reporting

All files have been created and are ready for use. No additional implementation is required.
