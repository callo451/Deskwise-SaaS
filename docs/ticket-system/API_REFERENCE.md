# Ticket System API Reference

**Version:** 2.0
**Base URL:** `/api`
**Authentication:** Required (NextAuth JWT token)

---

## Table of Contents

1. [Tickets](#tickets)
2. [Comments](#comments)
3. [Assignment](#assignment)
4. [Escalation](#escalation)
5. [Asset Linking](#asset-linking)
6. [Time Tracking](#time-tracking)
7. [CSAT Ratings](#csat-ratings)
8. [Attachments](#attachments)
9. [Error Codes](#error-codes)

---

## Tickets

### List Tickets

```
GET /api/tickets
```

**Query Parameters:**
- `status` (string, optional): Comma-separated status values
- `priority` (string, optional): Comma-separated priority values
- `category` (string, optional): Filter by category
- `assignedTo` (string, optional): Filter by assignee (use `null` for unassigned)
- `search` (string, optional): Search in title, description, ticket number
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 25, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "ticketNumber": "TKT-00001",
      "title": "Printer not working",
      "status": "open",
      "priority": "medium",
      "assignedTo": "user_123",
      "createdAt": "2025-10-18T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "page": 1,
    "limit": 25,
    "totalPages": 7,
    "hasMore": true
  }
}
```

**RBAC:** Requires `tickets.view.all`, `tickets.view.assigned`, or `tickets.view.own`

---

### Get Ticket

```
GET /api/tickets/[id]
```

**Path Parameters:**
- `id` (string, required): Ticket ObjectId

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketNumber": "TKT-00001",
    "title": "Printer not working",
    "description": "The office printer is offline",
    "status": "open",
    "priority": "medium",
    "category": "Hardware",
    "assignedTo": "user_123",
    "requesterId": "user_456",
    "linkedAssets": ["asset_789"],
    "totalTimeSpent": 45,
    "sla": {
      "responseTime": 60,
      "resolutionTime": 240,
      "responseDeadline": "2025-10-18T11:00:00Z",
      "resolutionDeadline": "2025-10-18T14:00:00Z",
      "breached": false
    },
    "createdAt": "2025-10-18T10:00:00Z",
    "updatedAt": "2025-10-18T10:30:00Z"
  }
}
```

**RBAC:** Requires view permissions

---

### Create Ticket

```
POST /api/tickets
```

**Request Body:**
```json
{
  "title": "Printer not working",
  "description": "The office printer is offline",
  "priority": "medium",
  "category": "Hardware",
  "assignedTo": "user_123",
  "clientId": "client_456",
  "tags": ["printer", "hardware"],
  "sla": {
    "responseTime": 60,
    "resolutionTime": 240
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketNumber": "TKT-00001",
    "title": "Printer not working",
    "status": "new",
    "priority": "medium",
    "createdAt": "2025-10-18T10:00:00Z"
  },
  "message": "Ticket created successfully"
}
```

**RBAC:** Requires `tickets.create`

**Validation Rules:**
- `title`: Required, min 1 character
- `description`: Required, min 1 character
- `priority`: Required, enum: `low` | `medium` | `high` | `critical`
- `category`: Required, min 1 character

---

### Update Ticket

```
PUT /api/tickets/[id]
```

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "high",
  "category": "Hardware",
  "assignedTo": "user_123",
  "tags": ["printer", "urgent"]
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated ticket */ },
  "message": "Ticket updated successfully"
}
```

**RBAC:** Requires `tickets.edit.all`, `tickets.edit.assigned`, or `tickets.edit.own`

---

### Delete Ticket

```
DELETE /api/tickets/[id]
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

**RBAC:** Requires `tickets.delete`

---

### Get Ticket Statistics

```
GET /api/tickets/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 500,
    "open": 120,
    "byStatus": {
      "new": 25,
      "open": 70,
      "pending": 25,
      "resolved": 200,
      "closed": 180
    },
    "byPriority": {
      "critical": 5,
      "high": 15
    },
    "slaBreached": 8
  }
}
```

**RBAC:** Requires `tickets.view.all`

---

## Comments

### Get Comments

```
GET /api/tickets/[id]/comments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "ticketId": "...",
      "content": "I'm working on this issue",
      "createdBy": "user_123",
      "createdAt": "2025-10-18T10:15:00Z",
      "isInternal": false
    },
    {
      "_id": "...",
      "content": "Internal note: customer is VIP",
      "isInternal": true,
      "createdAt": "2025-10-18T10:20:00Z"
    }
  ]
}
```

**Note:** End users only see `isInternal: false` comments. Admins and technicians see all comments.

**RBAC:** Requires view permissions

---

### Add Comment

```
POST /api/tickets/[id]/comments
```

**Request Body:**
```json
{
  "content": "I'm working on this issue",
  "isInternal": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "content": "I'm working on this issue",
    "createdBy": "user_123",
    "createdAt": "2025-10-18T10:15:00Z",
    "isInternal": false
  },
  "message": "Comment added successfully"
}
```

**Validation:**
- Only admins and technicians can set `isInternal: true`
- End users attempting to create internal notes receive 403 error

**RBAC:** Requires `tickets.edit.*`

---

## Assignment

### Assign Ticket

```
PUT /api/tickets/[id]/assign
```

**Request Body:**
```json
{
  "assignedTo": "user_123"  // or null to unassign
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated ticket */ },
  "message": "Ticket assigned successfully"
}
```

**Audit Log:** Creates audit log entry with action:
- `ticket.assigned` - First assignment
- `ticket.reassigned` - Changed assignee
- `ticket.unassigned` - Removed assignment

**RBAC:** Requires `tickets.assign`

---

### Get Assignment History

```
GET /api/tickets/[id]/assignment-history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "entityType": "ticket",
      "entityId": "...",
      "action": "ticket.assigned",
      "userId": "admin_123",
      "timestamp": "2025-10-18T10:00:00Z",
      "details": {
        "ticketNumber": "TKT-00001",
        "assignedTo": "user_123",
        "previousAssignee": null
      }
    }
  ]
}
```

**RBAC:** Requires view permissions

---

## Escalation

### Escalate Ticket

```
POST /api/tickets/[id]/escalate
```

**Request Body:**
```json
{
  "reason": "SLA breach imminent"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket escalated successfully"
}
```

**Side Effects:**
- Creates audit log entry
- Sends notification to managers (future)
- May trigger workflow automations (future)

**RBAC:** Requires `tickets.edit.*`

---

### Get Escalation History

```
GET /api/tickets/[id]/escalation-history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "action": "ticket.escalated",
      "userId": "user_123",
      "timestamp": "2025-10-18T12:00:00Z",
      "details": {
        "reason": "SLA breach imminent",
        "ticketNumber": "TKT-00001"
      }
    }
  ]
}
```

**RBAC:** Requires view permissions

---

## Asset Linking

### Get Linked Assets

```
GET /api/tickets/[id]/assets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "assetTag": "COMP-00123",
      "name": "Dell Latitude 5520",
      "category": "Laptop",
      "status": "active"
    }
  ]
}
```

**RBAC:** Requires view permissions

---

### Link Asset

```
POST /api/tickets/[id]/assets
```

**Request Body:**
```json
{
  "assetId": "asset_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asset linked successfully"
}
```

**RBAC:** Requires `tickets.edit.*`

---

### Unlink Asset

```
DELETE /api/tickets/[id]/assets
```

**Request Body:**
```json
{
  "assetId": "asset_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Asset unlinked successfully"
}
```

**RBAC:** Requires `tickets.edit.*`

---

## Time Tracking

### Start Timer

```
POST /api/tickets/[id]/time/start
```

**Request Body:**
```json
{
  "description": "Troubleshooting network issue",
  "isBillable": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "userId": "user_123",
    "userName": "John Doe",
    "description": "Troubleshooting network issue",
    "startTime": "2025-10-18T10:00:00Z",
    "isBillable": true,
    "isRunning": true,
    "createdAt": "2025-10-18T10:00:00Z"
  },
  "message": "Timer started"
}
```

**Note:** Only one timer can run per user per ticket.

**RBAC:** Requires `tickets.edit.*`

---

### Stop Timer

```
POST /api/tickets/[id]/time/[entryId]/stop
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "startTime": "2025-10-18T10:00:00Z",
    "endTime": "2025-10-18T10:45:00Z",
    "duration": 45,
    "isBillable": true,
    "isRunning": false
  },
  "message": "Timer stopped"
}
```

**Note:** Ticket's `totalTimeSpent` automatically updated.

**RBAC:** Requires `tickets.edit.*`

---

### Log Time Manually

```
POST /api/tickets/[id]/time
```

**Request Body:**
```json
{
  "description": "Fixed network configuration",
  "duration": 30,
  "isBillable": true,
  "startTime": "2025-10-18T10:00:00Z"  // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* time entry */ },
  "message": "Time logged successfully"
}
```

**RBAC:** Requires `tickets.edit.*`

---

### Get Time Entries

```
GET /api/tickets/[id]/time
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "ticketId": "...",
      "userId": "user_123",
      "userName": "John Doe",
      "description": "Troubleshooting",
      "startTime": "2025-10-18T10:00:00Z",
      "endTime": "2025-10-18T10:45:00Z",
      "duration": 45,
      "isBillable": true,
      "isRunning": false
    }
  ]
}
```

**RBAC:** Requires view permissions

---

### Update Time Entry

```
PUT /api/tickets/[id]/time/[entryId]
```

**Request Body:**
```json
{
  "description": "Updated description",
  "duration": 60,
  "isBillable": false
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated time entry */ },
  "message": "Time entry updated"
}
```

**Note:** Cannot update duration of running timer.

**RBAC:** Requires `tickets.edit.*`

---

### Delete Time Entry

```
DELETE /api/tickets/[id]/time/[entryId]
```

**Response:**
```json
{
  "success": true,
  "message": "Time entry deleted"
}
```

**Note:** Ticket's `totalTimeSpent` automatically updated.

**RBAC:** Requires `tickets.edit.*`

---

### Get Active Timers

```
GET /api/time-tracking/active
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "ticketId": "...",
      "ticketNumber": "TKT-00001",
      "startTime": "2025-10-18T10:00:00Z",
      "description": "Troubleshooting",
      "isBillable": true,
      "isRunning": true
    }
  ]
}
```

**RBAC:** Requires view permissions (returns user's own timers)

---

### Get Time Tracking Statistics

```
GET /api/time-tracking/stats
```

**Query Parameters:**
- `userId` (string, optional): Filter by user
- `startDate` (ISO date, optional): Filter by date range
- `endDate` (ISO date, optional): Filter by date range

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTime": 3600,
    "billableTime": 2400,
    "nonBillableTime": 1200,
    "averagePerTicket": 120,
    "ticketCount": 30,
    "byUser": [
      {
        "userId": "user_123",
        "userName": "John Doe",
        "totalTime": 1800,
        "billableTime": 1500,
        "ticketCount": 15
      }
    ],
    "byCategory": [
      {
        "category": "Hardware",
        "totalTime": 900,
        "ticketCount": 10
      }
    ]
  }
}
```

**RBAC:** Requires `tickets.view.all`

---

## CSAT Ratings

### Submit Rating

```
POST /api/tickets/[id]/rating
```

**Request Body:**
```json
{
  "rating": 5,
  "feedback": "Great service, issue resolved quickly!"
}
```

**Validation:**
- `rating`: Required, integer 1-5
- `feedback`: Optional, max 1000 characters

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "ticketNumber": "TKT-00001",
    "rating": 5,
    "feedback": "Great service!",
    "submittedBy": "user_123",
    "submittedAt": "2025-10-18T15:00:00Z"
  },
  "message": "Rating submitted successfully"
}
```

**Note:** One rating per ticket per user.

**RBAC:** Authenticated user (typically ticket requester)

---

### Get Rating

```
GET /api/tickets/[id]/rating
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "ticketId": "...",
    "rating": 5,
    "feedback": "Great service!",
    "submittedBy": "user_123",
    "submittedAt": "2025-10-18T15:00:00Z"
  }
}
```

**RBAC:** Requires view permissions

---

## Attachments

### List Attachments

```
GET /api/tickets/[id]/attachments
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "filename": "screenshot.png",
      "originalFilename": "error-screenshot.png",
      "contentType": "image/png",
      "size": 152400,
      "uploadedBy": "user_123",
      "uploadedAt": "2025-10-18T10:30:00Z",
      "url": "/uploads/...",
      "thumbnailUrl": "/uploads/thumbnails/..."
    }
  ]
}
```

**RBAC:** Requires view permissions

---

### Upload Attachments

```
POST /api/tickets/[id]/attachments
```

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `files`: Array of files

**Limits:**
- Max file size: 10MB per file
- Max total size: 50MB per ticket
- Supported types: All (images, PDFs, documents, logs, archives)

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "...",
        "filename": "screenshot.png",
        "size": 152400,
        "url": "/uploads/..."
      }
    ],
    "errors": []
  },
  "message": "Successfully uploaded 1 file(s)"
}
```

**Error Response (Partial Failure):**
```json
{
  "success": true,
  "data": {
    "uploaded": [ /* successful uploads */ ],
    "errors": [
      "file-large.zip: File size exceeds maximum of 10MB"
    ]
  },
  "message": "Successfully uploaded 2 file(s) with 1 error(s)"
}
```

**RBAC:** Requires `tickets.edit.*`

---

### Delete Attachment

```
DELETE /api/tickets/[id]/attachments/[attachmentId]
```

**Response:**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

**RBAC:** Requires `tickets.edit.*`

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or malformed request |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., timer already running) |
| 500 | Internal Server Error | Server-side error |

### Error Response Format

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["title"],
      "message": "Title is required"
    }
  ]
}
```

### Common Error Messages

**Authentication Errors:**
- `Unauthorized` - No valid session token
- `Session expired` - JWT token expired

**Authorization Errors:**
- `Insufficient permissions to view tickets` - Missing view permission
- `Insufficient permissions to create tickets` - Missing create permission
- `Insufficient permissions to edit tickets` - Missing edit permission
- `Only technicians and administrators can create internal notes` - End user tried to create internal note

**Validation Errors:**
- `Title is required`
- `Description is required`
- `Invalid priority value`
- `Comment cannot be empty`

**Resource Errors:**
- `Ticket not found` - Invalid ticket ID or not in organization
- `Time entry not found`
- `Asset not found`
- `User not found`

**Conflict Errors:**
- `Timer already running for this ticket` - Cannot start multiple timers
- `Rating already submitted for this ticket` - Cannot rate twice

**File Upload Errors:**
- `No files provided`
- `File size exceeds maximum of 10MB`
- `Total attachment size exceeds maximum allowed size of 50MB`
- `Unsupported file type`

---

## Rate Limiting

**Current Status:** Not implemented

**Planned Limits:**
- 100 requests per minute per user
- 1000 requests per hour per organization
- 10 concurrent file uploads per user

---

## Webhooks (Future)

**Planned Events:**
- `ticket.created`
- `ticket.updated`
- `ticket.assigned`
- `ticket.escalated`
- `ticket.resolved`
- `ticket.closed`
- `comment.added`
- `rating.submitted`

---

**Document Version:** 2.0
**Last Updated:** October 2025
**API Version:** v1
