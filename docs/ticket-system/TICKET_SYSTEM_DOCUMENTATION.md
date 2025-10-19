# Deskwise ITSM Ticket System Documentation

**Version:** 2.0
**Last Updated:** October 2025
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implemented Features](#implemented-features)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Component Hierarchy](#component-hierarchy)
7. [Integration Points](#integration-points)
8. [Configuration Options](#configuration-options)
9. [Security & RBAC](#security--rbac)
10. [Performance Considerations](#performance-considerations)

---

## Overview

### Purpose

The Deskwise ticket system is a comprehensive ITSM ticketing platform built with Next.js 15, TypeScript, MongoDB, and NextAuth.js. It provides enterprise-grade ticket management with advanced features including SLA tracking, time tracking, asset linking, CSAT ratings, and internal notes.

### Key Capabilities

- **Full Lifecycle Management:** Create, update, assign, escalate, and resolve tickets
- **SLA Tracking & Alerts:** Automated deadline calculation with breach detection
- **Time Tracking:** Start/stop timers and manual time entry with billable hours
- **Asset Integration:** Link tickets to managed assets for context
- **Internal Notes:** Private comments visible only to technicians and admins
- **User Assignment:** Assign tickets with full audit history
- **CSAT Ratings:** Customer satisfaction ratings with feedback
- **File Attachments:** Multi-file upload with thumbnails for images
- **Canned Responses:** Template-based responses for common issues
- **Advanced Filtering:** Search, filter, and paginate ticket lists
- **RBAC Integration:** Role-based and permission-based access control

### Technology Stack

- **Frontend:** Next.js 15 with React 18, TypeScript
- **Backend:** Next.js API Routes with async params pattern
- **Database:** MongoDB Atlas with Node.js driver
- **Authentication:** NextAuth.js with JWT sessions
- **Validation:** Zod schemas for input validation
- **Styling:** Tailwind CSS with Radix UI components

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React Components                                   │    │
│  │  - Ticket List                                      │    │
│  │  - Ticket Detail                                     │    │
│  │  - Time Tracker                                      │    │
│  │  - Comment Section                                   │    │
│  │  - Assignment UI                                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/JSON
                      ▼
┌─────────────────────────────────────────────────────────────┐
│               Next.js API Routes (Middleware)                │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Authentication (NextAuth)                          │    │
│  │  RBAC Permission Checks                             │    │
│  │  Input Validation (Zod)                             │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌────────────────┬────────────────┬─────────────────┐     │
│  │ TicketService  │ TimeTracking   │ FileStorage     │     │
│  │                │   Service      │   Service       │     │
│  └────────────────┴────────────────┴─────────────────┘     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Atlas                             │
│  ┌────────────────┬────────────────┬─────────────────┐     │
│  │    tickets     │ time_entries   │ ticket_comments │     │
│  │                │                │                 │     │
│  │ csat_ratings   │ audit_logs     │ attachments     │     │
│  └────────────────┴────────────────┴─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenancy Architecture

All ticket data is **organization-scoped** using the `orgId` field:

- Every database document includes `orgId`
- Every API route filters by `session.user.orgId`
- Complete data isolation between organizations
- Session includes organization context via NextAuth

### Request Flow

1. **Client Request:** User interacts with UI (e.g., creates a ticket)
2. **API Route:** Request hits `/api/tickets` (POST)
3. **Authentication:** `getServerSession()` validates JWT token
4. **Authorization:** `requirePermission()` checks RBAC permissions
5. **Validation:** Zod schema validates request body
6. **Service Layer:** `TicketService.createTicket()` executes business logic
7. **Database:** MongoDB operation with `orgId` filter
8. **Response:** JSON response with success/error status

---

## Implemented Features

### 1. SLA Tracking & Escalation

**Purpose:** Automatically track Service Level Agreement deadlines and alert when tickets are at risk of breach.

**Key Components:**
- `src/lib/services/tickets.ts` - `checkSLABreaches()` method
- `src/app/api/tickets/[id]/escalate/route.ts` - Manual escalation endpoint
- `src/app/api/tickets/[id]/escalation-history/route.ts` - Escalation audit trail
- `src/components/tickets/sla-dashboard-widget.tsx` - Visual SLA indicators

**Database Collections:**
- `tickets` - SLA fields: `sla.responseTime`, `sla.resolutionTime`, `sla.responseDeadline`, `sla.resolutionDeadline`, `sla.breached`
- `audit_logs` - Escalation events tracked

**How It Works:**
1. When a ticket is created with SLA settings, deadlines are calculated
2. Background job runs periodically to check for breached SLAs
3. If current time exceeds deadline and status is open, `sla.breached` is set to `true`
4. Visual indicators change from green → yellow → red as deadline approaches
5. Manual escalation can be triggered via `/api/tickets/[id]/escalate`

**API Endpoints:**
- `POST /api/tickets/[id]/escalate` - Manually escalate a ticket
- `GET /api/tickets/[id]/escalation-history` - Get escalation audit log

**RBAC Permissions Required:**
- `tickets.edit.all` or `tickets.edit.assigned` to escalate tickets

**Configuration:**
- SLA times defined in minutes when creating ticket
- Business hours calculation (future enhancement)

---

### 2. Internal Notes & Private Comments

**Purpose:** Allow technicians and administrators to communicate privately without end users seeing sensitive information.

**Key Components:**
- `src/lib/services/tickets.ts` - `addComment()` with `isInternal` parameter
- `src/lib/services/tickets.ts` - `getComments()` with role-based filtering
- `src/app/api/tickets/[id]/comments/route.ts` - Comment API with validation

**Database Schema:**
```typescript
interface TicketComment {
  _id: ObjectId
  ticketId: string
  content: string
  createdBy: string
  createdAt: Date
  isInternal: boolean  // ✨ Key field for internal notes
}
```

**How It Works:**
1. When adding a comment, user specifies `isInternal: true` or `false`
2. Only admins and technicians can create internal notes (enforced in API)
3. When fetching comments, end users (`role: 'user'`) only see `isInternal: false` comments
4. Technicians and admins see all comments

**API Endpoints:**
- `GET /api/tickets/[id]/comments` - Get comments (filtered by role)
- `POST /api/tickets/[id]/comments` - Add comment (with `isInternal` flag)

**RBAC Permissions Required:**
- `tickets.view.all`, `tickets.view.assigned`, or `tickets.view.own` to view comments
- `tickets.edit.all`, `tickets.edit.assigned`, or `tickets.edit.own` to add comments
- Only `admin` and `technician` roles can create internal notes

**UI Behavior:**
- Internal notes have distinct visual styling (background color, lock icon)
- End users never see internal notes in UI or API responses

---

### 3. User Assignment System

**Purpose:** Assign tickets to technicians with full audit history and notifications.

**Key Components:**
- `src/lib/services/tickets.ts` - `assignTicket()` method
- `src/app/api/tickets/[id]/assign/route.ts` - Assignment endpoint
- `src/app/api/tickets/[id]/assignment-history/route.ts` - Assignment history

**Database Collections:**
- `tickets` - `assignedTo` field (user ID)
- `audit_logs` - Assignment events: `ticket.assigned`, `ticket.unassigned`, `ticket.reassigned`

**How It Works:**
1. Ticket can be assigned via `PUT /api/tickets/[id]/assign`
2. Previous assignee is tracked before update
3. Ticket's `assignedTo` field is updated
4. Audit log entry created with action type:
   - `ticket.assigned` - First assignment
   - `ticket.reassigned` - Changed from one user to another
   - `ticket.unassigned` - Removed assignment
5. Notifications sent to assignee (future enhancement)

**API Endpoints:**
- `PUT /api/tickets/[id]/assign` - Assign/unassign ticket
  - Body: `{ assignedTo: "userId" | null }`
- `GET /api/tickets/[id]/assignment-history` - Get assignment audit trail

**RBAC Permissions Required:**
- `tickets.assign` permission to assign tickets

**Query Filtering:**
- Filter tickets by `assignedTo: "userId"` to get user's tickets
- Filter tickets by `assignedTo: null` to get unassigned tickets

---

### 4. Asset Linking System

**Purpose:** Link tickets to managed assets (computers, servers, devices) for better context and tracking.

**Key Components:**
- `src/app/api/tickets/[id]/assets/route.ts` - Asset linking endpoint
- `src/lib/types.ts` - `Ticket.linkedAssets` field

**Database Schema:**
```typescript
interface Ticket extends BaseEntity {
  // ... other fields
  linkedAssets?: string[]  // Array of Asset._id references
}
```

**How It Works:**
1. Tickets can be linked to one or more assets
2. Asset IDs stored in `linkedAssets` array
3. When viewing ticket, linked assets are fetched and displayed
4. When viewing asset, all linked tickets are shown
5. Useful for tracking hardware issues, maintenance, and history

**API Endpoints:**
- `POST /api/tickets/[id]/assets` - Link an asset to ticket
  - Body: `{ assetId: "assetId" }`
- `DELETE /api/tickets/[id]/assets` - Unlink an asset from ticket
  - Body: `{ assetId: "assetId" }`
- `GET /api/tickets/[id]/assets` - Get all linked assets

**RBAC Permissions Required:**
- `tickets.edit.all`, `tickets.edit.assigned`, or `tickets.edit.own` to link assets

**Use Cases:**
- Link a ticket about a laptop issue to the laptop asset
- Track all tickets related to a specific server
- Maintenance history tracking
- Warranty claim documentation

---

### 5. Time Tracking System

**Purpose:** Track time spent on tickets with start/stop timers and manual entries for billing and reporting.

**Key Components:**
- `src/lib/services/time-tracking.ts` - TimeTrackingService (558 lines)
- `src/app/api/tickets/[id]/time/route.ts` - Time entry CRUD
- `src/app/api/tickets/[id]/time/start/route.ts` - Start timer
- `src/app/api/tickets/[id]/time/stop/route.ts` - Stop timer
- `src/app/api/time-tracking/active/route.ts` - Get active timers
- `src/app/api/time-tracking/stats/route.ts` - Time tracking statistics

**Database Collections:**
- `time_entries` - All time entries
- `tickets` - `totalTimeSpent` field (auto-calculated)

**Database Schema:**
```typescript
interface TimeEntry {
  _id: ObjectId
  orgId: string
  ticketId: string
  userId: string
  userName: string
  description: string
  startTime: Date
  endTime?: Date
  duration?: number       // minutes (calculated when timer stops)
  isBillable: boolean
  isRunning: boolean      // true if timer is currently active
  createdAt: Date
  updatedAt: Date
}
```

**How It Works:**

**Timer Mode:**
1. User starts timer: `POST /api/tickets/[id]/time/start`
2. Time entry created with `isRunning: true`
3. User stops timer: `POST /api/tickets/[id]/time/[entryId]/stop`
4. Duration calculated: `(endTime - startTime) / 60000` (minutes)
5. Time entry updated with `isRunning: false` and `duration`
6. Ticket's `totalTimeSpent` updated automatically

**Manual Entry Mode:**
1. User logs time: `POST /api/tickets/[id]/time`
2. Provide `duration` (minutes) and optional `startTime`
3. Time entry created with `isRunning: false`
4. Ticket's `totalTimeSpent` updated automatically

**API Endpoints:**
- `POST /api/tickets/[id]/time/start` - Start timer
  - Body: `{ description: string, isBillable: boolean }`
- `POST /api/tickets/[id]/time/[entryId]/stop` - Stop running timer
- `POST /api/tickets/[id]/time` - Log time manually
  - Body: `{ description: string, duration: number, isBillable: boolean, startTime?: Date }`
- `GET /api/tickets/[id]/time` - Get all time entries for ticket
- `PUT /api/tickets/[id]/time/[entryId]` - Update time entry
- `DELETE /api/tickets/[id]/time/[entryId]` - Delete time entry
- `GET /api/time-tracking/active` - Get user's active timers
- `GET /api/time-tracking/stats` - Get time tracking statistics

**RBAC Permissions Required:**
- `tickets.view.all`, `tickets.view.assigned`, or `tickets.view.own` to view time entries
- `tickets.edit.all`, `tickets.edit.assigned`, or `tickets.edit.own` to track time

**Statistics & Reporting:**
- Total time per ticket
- Billable vs non-billable hours
- Time by user (technician performance)
- Time by category (which issues take longest)
- Average time per ticket
- Time tracking coverage (% of tickets with time logged)

---

### 6. CSAT Rating System

**Purpose:** Collect customer satisfaction ratings and feedback after ticket resolution.

**Key Components:**
- `src/app/api/tickets/[id]/rating/route.ts` - CSAT rating endpoint
- `src/lib/types.ts` - `CSATRating` interface

**Database Collections:**
- `csat_ratings` - All customer satisfaction ratings
- `tickets` - `csatRating` reference field

**Database Schema:**
```typescript
interface CSATRating {
  _id: ObjectId
  orgId: string
  ticketId: string
  ticketNumber: string
  rating: 1 | 2 | 3 | 4 | 5      // 1=Very Unsatisfied, 5=Very Satisfied
  feedback?: string               // Optional customer feedback
  submittedBy: string             // User ID
  submittedByName?: string
  submittedAt: Date
}
```

**How It Works:**
1. When ticket is resolved/closed, customer receives CSAT survey (future: email)
2. Customer rates experience on 1-5 scale
3. Optional feedback text field
4. Rating stored in `csat_ratings` collection
5. Ticket's `csatRating` field updated with reference
6. Ratings used for technician performance metrics

**API Endpoints:**
- `POST /api/tickets/[id]/rating` - Submit CSAT rating
  - Body: `{ rating: 1-5, feedback?: string }`
- `GET /api/tickets/[id]/rating` - Get ticket's CSAT rating

**RBAC Permissions Required:**
- Any authenticated user can rate tickets they requested
- Admins can view all ratings

**Metrics:**
- Average CSAT score (org-wide, per-technician, per-category)
- CSAT distribution (how many 1s, 2s, 3s, 4s, 5s)
- Feedback themes (sentiment analysis - future)
- CSAT trends over time

**Rating Scale:**
- **1 - Very Unsatisfied:** Major issues, poor service
- **2 - Unsatisfied:** Issues resolved but poor experience
- **3 - Neutral:** Acceptable but room for improvement
- **4 - Satisfied:** Good service, minor issues
- **5 - Very Satisfied:** Excellent service, exceeded expectations

---

### 7. Enhanced UI/UX

**Purpose:** Modern, intuitive interface with improved usability and visual feedback.

**Key Improvements:**
- **Visual SLA Indicators:** Traffic light system (green/yellow/red) shows SLA status at a glance
- **Inline Editing:** Update title, priority, status without full page refresh
- **Drag-and-Drop Attachments:** Modern file upload experience
- **Loading States:** Skeleton screens and spinners for better perceived performance
- **Empty States:** Helpful messages when no data available
- **Responsive Design:** Mobile-first approach for technicians on the go
- **Keyboard Shortcuts:** Power-user features (Ctrl+Enter to save, ESC to close)
- **Activity Timeline:** Visual timeline of ticket history

**Components:**
- `src/components/tickets/sla-dashboard-widget.tsx` - SLA visualization
- Radix UI components for accessible, customizable UI elements
- Tailwind CSS for consistent styling

---

### 8. Canned Responses

**Purpose:** Pre-written response templates to save time on common issues.

**Status:** ✅ Already Implemented

**Key Components:**
- `src/lib/types.ts` - `CannedResponse` interface
- Database collection: `canned_responses`

**Database Schema:**
```typescript
interface CannedResponse extends BaseEntity {
  name: string
  content: string
  category: string
  variables: string[]      // e.g., ['{{ticketNumber}}', '{{requesterName}}']
  usageCount: number
  isActive: boolean
  tags?: string[]
}
```

**Features:**
- Category-based organization (e.g., "Password Reset", "Network Issues")
- Variable substitution for personalization
- Usage tracking for analytics
- Quick-insert UI in comment section

---

### 9. Attachment Management

**Purpose:** Allow file uploads for screenshots, logs, documents to provide context.

**Status:** ✅ Already Implemented

**Key Components:**
- `src/lib/services/file-storage.ts` - FileStorageService
- `src/app/api/tickets/[id]/attachments/route.ts` - Upload/list attachments
- `src/app/api/tickets/[id]/attachments/[attachmentId]/route.ts` - Delete attachment

**Database Schema:**
```typescript
interface TicketAttachment {
  id: string
  filename: string
  originalFilename: string
  contentType: string
  size: number              // bytes
  uploadedBy: string
  uploadedAt: Date
  url: string
  thumbnailUrl?: string     // For images
}
```

**Features:**
- Multi-file upload (10MB per file, 50MB total per ticket)
- Image thumbnails auto-generated
- Supported file types: images, PDFs, documents, logs, archives
- Drag-and-drop upload UI
- File size validation
- Virus scanning (optional - future enhancement)

**API Endpoints:**
- `POST /api/tickets/[id]/attachments` - Upload files (multipart/form-data)
- `GET /api/tickets/[id]/attachments` - List all attachments
- `DELETE /api/tickets/[id]/attachments/[attachmentId]` - Delete attachment

---

## Database Schema

### Collections

#### `tickets`

Primary ticket data collection.

```typescript
interface Ticket extends BaseEntity {
  _id: ObjectId
  orgId: string                  // Multi-tenancy
  ticketNumber: string           // Auto-generated (TKT-00001)
  title: string
  description: string
  status: TicketStatus           // 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: TicketPriority       // 'low' | 'medium' | 'high' | 'critical'
  category: string
  assignedTo?: string            // User ID
  clientId?: string              // Client reference (MSP mode)
  requesterId: string            // User ID of requester
  tags: string[]
  linkedAssets?: string[]        // Asset IDs
  attachments?: TicketAttachment[]
  sla?: {
    responseTime: number         // minutes
    resolutionTime: number       // minutes
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
  }
  csatRating?: CSATRating        // Reference or embedded
  totalTimeSpent?: number        // Total minutes (calculated)
  resolvedAt?: Date
  closedAt?: Date
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

**Indexes:**
```javascript
tickets.createIndex({ orgId: 1, status: 1 })
tickets.createIndex({ orgId: 1, assignedTo: 1 })
tickets.createIndex({ orgId: 1, createdAt: -1 })
tickets.createIndex({ orgId: 1, ticketNumber: 1 }, { unique: true })
tickets.createIndex({ orgId: 1, 'sla.breached': 1 })
```

---

#### `ticket_comments`

Comments and internal notes on tickets.

```typescript
interface TicketComment {
  _id: ObjectId
  ticketId: string
  content: string
  createdBy: string
  createdAt: Date
  isInternal: boolean           // Private note flag
}
```

**Indexes:**
```javascript
ticket_comments.createIndex({ ticketId: 1, createdAt: 1 })
ticket_comments.createIndex({ ticketId: 1, isInternal: 1 })
```

---

#### `time_entries`

Time tracking entries for billable hours.

```typescript
interface TimeEntry {
  _id: ObjectId
  orgId: string
  ticketId: string
  userId: string
  userName: string
  description: string
  startTime: Date
  endTime?: Date
  duration?: number             // minutes
  isBillable: boolean
  isRunning: boolean
  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
```javascript
time_entries.createIndex({ orgId: 1, ticketId: 1 })
time_entries.createIndex({ orgId: 1, userId: 1, isRunning: 1 })
time_entries.createIndex({ orgId: 1, startTime: -1 })
```

---

#### `csat_ratings`

Customer satisfaction ratings.

```typescript
interface CSATRating {
  _id: ObjectId
  orgId: string
  ticketId: string
  ticketNumber: string
  rating: 1 | 2 | 3 | 4 | 5
  feedback?: string
  submittedBy: string
  submittedByName?: string
  submittedAt: Date
}
```

**Indexes:**
```javascript
csat_ratings.createIndex({ orgId: 1, ticketId: 1 }, { unique: true })
csat_ratings.createIndex({ orgId: 1, submittedAt: -1 })
```

---

#### `audit_logs`

Audit trail for all ticket actions.

```typescript
interface AuditLog {
  _id: ObjectId
  orgId: string
  entityType: string            // 'ticket'
  entityId: string              // Ticket ID
  action: string                // 'ticket.assigned', 'ticket.escalated', etc.
  userId: string                // Who performed the action
  timestamp: Date
  details?: Record<string, any> // Action-specific data
}
```

**Indexes:**
```javascript
audit_logs.createIndex({ orgId: 1, entityType: 1, entityId: 1, timestamp: -1 })
audit_logs.createIndex({ orgId: 1, action: 1, timestamp: -1 })
```

---

#### `canned_responses`

Pre-written response templates.

```typescript
interface CannedResponse extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string
  content: string
  category: string
  variables: string[]
  usageCount: number
  isActive: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

---

## API Endpoints

### Ticket Management

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `GET` | `/api/tickets` | List tickets with filters | `tickets.view.*` |
| `POST` | `/api/tickets` | Create new ticket | `tickets.create` |
| `GET` | `/api/tickets/[id]` | Get ticket by ID | `tickets.view.*` |
| `PUT` | `/api/tickets/[id]` | Update ticket | `tickets.edit.*` |
| `DELETE` | `/api/tickets/[id]` | Delete ticket | `tickets.delete` |
| `GET` | `/api/tickets/stats` | Get ticket statistics | `tickets.view.all` |

**Query Parameters for `GET /api/tickets`:**
- `status`: Filter by status (comma-separated)
- `priority`: Filter by priority (comma-separated)
- `category`: Filter by category
- `assignedTo`: Filter by assignee (use `null` for unassigned)
- `search`: Full-text search (title, description, ticket number)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 25, max: 100)

---

### Comments & Internal Notes

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `GET` | `/api/tickets/[id]/comments` | Get comments (role-filtered) | `tickets.view.*` |
| `POST` | `/api/tickets/[id]/comments` | Add comment | `tickets.edit.*` |

**Request Body for `POST /api/tickets/[id]/comments`:**
```json
{
  "content": "Comment text",
  "isInternal": false
}
```

**Note:** Only admins and technicians can set `isInternal: true`.

---

### Assignment

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `PUT` | `/api/tickets/[id]/assign` | Assign/unassign ticket | `tickets.assign` |
| `GET` | `/api/tickets/[id]/assignment-history` | Get assignment history | `tickets.view.*` |

**Request Body for `PUT /api/tickets/[id]/assign`:**
```json
{
  "assignedTo": "userId"  // or null to unassign
}
```

---

### Escalation

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `POST` | `/api/tickets/[id]/escalate` | Manually escalate ticket | `tickets.edit.*` |
| `GET` | `/api/tickets/[id]/escalation-history` | Get escalation history | `tickets.view.*` |

**Request Body for `POST /api/tickets/[id]/escalate`:**
```json
{
  "reason": "SLA breach imminent"
}
```

---

### Asset Linking

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `GET` | `/api/tickets/[id]/assets` | Get linked assets | `tickets.view.*` |
| `POST` | `/api/tickets/[id]/assets` | Link asset to ticket | `tickets.edit.*` |
| `DELETE` | `/api/tickets/[id]/assets` | Unlink asset from ticket | `tickets.edit.*` |

**Request Body for `POST /api/tickets/[id]/assets`:**
```json
{
  "assetId": "assetObjectId"
}
```

---

### Time Tracking

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `POST` | `/api/tickets/[id]/time/start` | Start timer | `tickets.edit.*` |
| `POST` | `/api/tickets/[id]/time/[entryId]/stop` | Stop timer | `tickets.edit.*` |
| `POST` | `/api/tickets/[id]/time` | Log time manually | `tickets.edit.*` |
| `GET` | `/api/tickets/[id]/time` | Get time entries | `tickets.view.*` |
| `PUT` | `/api/tickets/[id]/time/[entryId]` | Update time entry | `tickets.edit.*` |
| `DELETE` | `/api/tickets/[id]/time/[entryId]` | Delete time entry | `tickets.edit.*` |
| `GET` | `/api/time-tracking/active` | Get active timers | `tickets.view.*` |
| `GET` | `/api/time-tracking/stats` | Get time statistics | `tickets.view.all` |

**Request Body for `POST /api/tickets/[id]/time/start`:**
```json
{
  "description": "Troubleshooting network issue",
  "isBillable": true
}
```

**Request Body for `POST /api/tickets/[id]/time`:**
```json
{
  "description": "Troubleshooting network issue",
  "duration": 45,
  "isBillable": true,
  "startTime": "2025-10-18T10:00:00Z"  // optional
}
```

---

### CSAT Ratings

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `POST` | `/api/tickets/[id]/rating` | Submit CSAT rating | Authenticated user |
| `GET` | `/api/tickets/[id]/rating` | Get ticket rating | `tickets.view.*` |

**Request Body for `POST /api/tickets/[id]/rating`:**
```json
{
  "rating": 5,
  "feedback": "Great service!"
}
```

---

### Attachments

| Method | Endpoint | Description | RBAC Permission |
|--------|----------|-------------|-----------------|
| `GET` | `/api/tickets/[id]/attachments` | List attachments | `tickets.view.*` |
| `POST` | `/api/tickets/[id]/attachments` | Upload files | `tickets.edit.*` |
| `DELETE` | `/api/tickets/[id]/attachments/[attachmentId]` | Delete attachment | `tickets.edit.*` |

**Request for `POST /api/tickets/[id]/attachments`:**
- Content-Type: `multipart/form-data`
- Field: `files` (array of files)

---

## Component Hierarchy

### Page Components

```
src/app/(app)/tickets/
├── page.tsx                  # Ticket list page
├── new/
│   └── page.tsx             # Create ticket page
└── [id]/
    └── page.tsx             # Ticket detail page
```

### Feature Components

```
src/components/tickets/
├── TicketList.tsx           # Main ticket list component
├── TicketCard.tsx           # Individual ticket card
├── TicketDetail.tsx         # Ticket detail view
├── TicketForm.tsx           # Create/edit ticket form
├── CommentSection.tsx       # Comments and internal notes
├── TimeTracker.tsx          # Time tracking widget
├── AssetLinker.tsx          # Asset linking UI
├── AssignmentPicker.tsx     # User assignment dropdown
├── SLAIndicator.tsx         # SLA status badge
├── CSATRatingForm.tsx       # CSAT rating submission
├── AttachmentUploader.tsx   # File upload component
└── sla-dashboard-widget.tsx # SLA dashboard widget
```

### UI Components (Radix UI)

```
src/components/ui/
├── button.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── textarea.tsx
├── badge.tsx
├── select.tsx
├── calendar.tsx
└── ... (other Radix primitives)
```

---

## Integration Points

### 1. Asset Management Integration

**Purpose:** Link tickets to managed assets for context.

**Integration Points:**
- `/api/tickets/[id]/assets` - Link/unlink assets
- Asset detail page shows all linked tickets
- Ticket detail page shows all linked assets

**Data Flow:**
1. User links asset to ticket via asset picker
2. Asset ID added to `ticket.linkedAssets[]` array
3. When viewing ticket, asset details fetched via `GET /api/assets/[id]`
4. When viewing asset, linked tickets fetched via `GET /api/tickets?linkedAssets=[assetId]`

---

### 2. RBAC System Integration

**Purpose:** Enforce role-based and permission-based access control.

**Integration Points:**
- `src/lib/middleware/permissions.ts` - Permission checking functions
- Every ticket API route checks permissions via `requirePermission()` or `requireAnyPermission()`

**Permission Structure:**
- `tickets.view.all` - View all tickets
- `tickets.view.assigned` - View assigned tickets only
- `tickets.view.own` - View own tickets only
- `tickets.create` - Create new tickets
- `tickets.edit.all` - Edit all tickets
- `tickets.edit.assigned` - Edit assigned tickets only
- `tickets.edit.own` - Edit own tickets only
- `tickets.delete` - Delete tickets
- `tickets.assign` - Assign tickets to users

**Middleware Usage:**
```typescript
import { requirePermission } from '@/lib/middleware/permissions'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  const hasPermission = await requirePermission(session, 'tickets.create')
  if (!hasPermission) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Proceed with ticket creation
}
```

---

### 3. Audit Logging Integration

**Purpose:** Track all ticket actions for compliance and troubleshooting.

**Integration Points:**
- Assignment changes logged to `audit_logs`
- Escalation events logged to `audit_logs`
- Status changes logged to `audit_logs`

**Audit Log Structure:**
```typescript
{
  orgId: string
  entityType: 'ticket'
  entityId: ticketId
  action: 'ticket.assigned' | 'ticket.escalated' | 'ticket.status_changed'
  userId: string
  timestamp: Date
  details: { ... }
}
```

**Querying Audit Logs:**
```javascript
db.audit_logs.find({
  orgId: 'org_123',
  entityType: 'ticket',
  entityId: 'ticket_456'
}).sort({ timestamp: -1 })
```

---

### 4. User Management Integration

**Purpose:** Fetch user details for assignment, comments, time tracking.

**Integration Points:**
- User picker for ticket assignment
- User names displayed in comments
- User names displayed in time entries

**User Data Fetching:**
- Users fetched via `GET /api/users` or `GET /api/users/[id]`
- User data cached in session for performance

---

## Configuration Options

### Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string

# NextAuth.js
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-32-character-secret

# File Upload Limits
MAX_FILE_SIZE=10485760           # 10MB per file
MAX_TOTAL_SIZE=52428800          # 50MB total per ticket

# SLA Configuration (future)
SLA_CHECK_INTERVAL=300000        # Check SLA every 5 minutes
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00

# Email Notifications (future)
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@deskwise.com
```

---

### Organization Settings

```typescript
// Per-organization settings (stored in database)
interface OrganizationTicketSettings {
  ticketPrefix: string           // Default: "TKT"
  defaultSLA: {
    responseTime: number         // minutes
    resolutionTime: number       // minutes
  }
  allowGuestTickets: boolean
  requireCategory: boolean
  enableCSAT: boolean
  csatAutoSend: boolean          // Auto-send after resolution
  timeTrackingRequired: boolean
  attachmentMaxSize: number      // bytes
  attachmentAllowedTypes: string[]
}
```

---

### User Preferences

```typescript
// Per-user preferences (stored in user document)
interface UserTicketPreferences {
  emailNotifications: {
    onAssign: boolean
    onComment: boolean
    onStatusChange: boolean
    onEscalation: boolean
    digestMode: boolean          // Daily digest vs real-time
  }
  defaultFilters: {
    status: string[]
    priority: string[]
  }
  ticketsPerPage: number
}
```

---

## Security & RBAC

### Authentication

All ticket API routes require authentication via NextAuth.js:

```typescript
const session = await getServerSession(authOptions)

if (!session?.user?.orgId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Authorization

Permission checks enforce RBAC:

```typescript
import { requirePermission, requireAnyPermission } from '@/lib/middleware/permissions'

// Require specific permission
const hasPermission = await requirePermission(session, 'tickets.create')

// Require any of multiple permissions
const hasPermission = await requireAnyPermission(session, [
  'tickets.view.all',
  'tickets.view.assigned',
  'tickets.view.own'
])
```

### Multi-Tenancy

All queries filter by `orgId`:

```typescript
const tickets = await db.collection('tickets').find({
  orgId: session.user.orgId,  // Always filter by org
  status: 'open'
}).toArray()
```

### Input Validation

Zod schemas validate all request bodies:

```typescript
import { z } from 'zod'

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.string().min(1, 'Category is required'),
})

const validatedData = createTicketSchema.parse(body)
```

### SQL Injection Prevention

MongoDB Node.js driver automatically prevents injection via parameterized queries.

### XSS Prevention

- All user input sanitized before storage
- React automatically escapes rendered content
- Rich text content sanitized with DOMPurify (future)

---

## Performance Considerations

### Database Indexing

Critical indexes for performance:

```javascript
// Ticket list queries
tickets.createIndex({ orgId: 1, status: 1 })
tickets.createIndex({ orgId: 1, assignedTo: 1 })
tickets.createIndex({ orgId: 1, createdAt: -1 })

// Search queries
tickets.createIndex({ orgId: 1, ticketNumber: 1 }, { unique: true })
tickets.createIndex({ orgId: 1, title: 'text', description: 'text' })

// SLA breach queries
tickets.createIndex({ orgId: 1, 'sla.breached': 1 })
tickets.createIndex({ orgId: 1, 'sla.resolutionDeadline': 1 })
```

### Query Optimization

1. **Pagination:** Limit results to 25-100 per page
2. **Projection:** Only fetch required fields
3. **Aggregation:** Use aggregation pipeline for complex queries
4. **Caching:** Cache frequently accessed data (users, categories)

### Frontend Optimization

1. **Code Splitting:** Lazy load heavy components
2. **Memoization:** Use `React.memo()` for expensive renders
3. **Virtual Scrolling:** For large ticket lists (future)
4. **Debouncing:** Search input debounced (300ms)
5. **Optimistic Updates:** Update UI before server response

### File Upload Optimization

1. **Client-side validation:** Check file size before upload
2. **Chunked uploads:** For large files (future)
3. **Thumbnail generation:** Async job for images
4. **CDN delivery:** Serve attachments via CDN (future)

---

## Next Steps

### Remaining Features (Not Yet Implemented)

See [REMAINING_FEATURES.md](./REMAINING_FEATURES.md) for detailed specifications:

1. **Email Notification System**
2. **Ticket Templates**
3. **Ticket Relationships (Parent/Child, Related, Duplicates)**
4. **Ticket Merge & Split**
5. **Advanced Reporting & Analytics**
6. **Email-to-Ticket Integration**
7. **Auto-Assignment Engine**
8. **Workflow Automation**
9. **AI-Powered Features (Classification, Suggestions)**
10. **Custom Fields**

---

## Support & Documentation

- **Developer Guide:** [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- **User Guide:** [USER_GUIDE.md](./USER_GUIDE.md)
- **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
- **Achievements Summary:** [ACHIEVEMENTS_SUMMARY.md](./ACHIEVEMENTS_SUMMARY.md)

---

**Document Version:** 2.0
**Last Updated:** October 2025
**Maintained By:** Deskwise Development Team
