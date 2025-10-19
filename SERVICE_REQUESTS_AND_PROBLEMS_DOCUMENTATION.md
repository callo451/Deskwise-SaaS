# Service Requests and Problems Modules - Complete Documentation

## Overview

Deskwise ITSM now includes two new comprehensive modules following ITIL best practices:
- **Service Requests Module**: Manage standard service fulfillment requests with approval workflows
- **Problems Module**: Track root cause analysis for recurring incidents

Both modules follow the same design patterns as the existing Tickets and Incidents modules, ensuring consistency across the platform.

---

## Table of Contents

1. [Service Requests Module](#service-requests-module)
2. [Problems Module](#problems-module)
3. [Technical Architecture](#technical-architecture)
4. [API Reference](#api-reference)
5. [User Guide](#user-guide)
6. [Integration Points](#integration-points)

---

## Service Requests Module

### Purpose

Service Requests handle standard, predictable service fulfillment activities such as:
- New equipment requests (laptop, phone, monitor)
- Access requests (application access, network access)
- Software installation requests
- Information requests
- Standard changes (password resets, mailbox creation)

### Key Features

✅ **Approval Workflows**
- Three-state approval: Pending → Approved/Rejected → In Progress
- Rejection reasons tracked
- Approval timestamp and approver recorded
- Admin and technician roles can approve

✅ **Service Catalog Integration**
- Links to ServiceCatalogueItem via `serviceId`
- Stores submitted `formData` from custom forms
- Displays service name and description

✅ **SLA Monitoring**
- Response time SLA tracking
- Resolution time SLA tracking
- Breach detection with visual indicators
- Real-time countdown timers

✅ **Multi-stage Completion**
- `resolvedAt`: When work is completed by technician
- `completedAt`: When requester confirms satisfaction
- `closedAt`: Final closure timestamp

✅ **Request Numbering**
- Format: `SR-00001`, `SR-00002`, etc.
- Auto-incremented per organization
- 5-digit zero-padded sequence

### Data Model

```typescript
interface ServiceRequest extends BaseEntity {
  requestNumber: string           // SR-00001
  title: string
  description: string
  status: ServiceRequestStatus    // 7 states
  priority: ServiceRequestPriority // low, medium, high, critical
  category: string
  requestedBy: string             // User ID
  requestedByName?: string
  assignedTo?: string
  assignedToName?: string
  clientId?: string
  serviceId?: string              // Reference to service catalog
  formData?: Record<string, any>  // Dynamic form data
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  rejectionReason?: string
  sla?: {
    responseTime: number
    resolutionTime: number
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
  }
  resolvedAt?: Date
  closedAt?: Date
  completedAt?: Date
}

type ServiceRequestStatus =
  | 'submitted'        // Initial state
  | 'pending_approval' // Awaiting approval
  | 'approved'         // Approved, ready to start
  | 'rejected'         // Rejected with reason
  | 'in_progress'      // Work in progress
  | 'completed'        // Work completed
  | 'cancelled'        // Request cancelled
```

### UI Components

**Main List Page** (`/service-requests/page.tsx`):
- **Stats Cards**: Total, Active, Pending Approval, SLA Breached
- **Advanced Filters**: Status (8 options), Priority (4 options), Approval Status (3 options), Search
- **Table Columns**: Request #, Title, Status, Priority, SLA, Assigned To, Updated
- **Auto-refresh**: Every 30 seconds
- **Empty State**: Friendly CTA for first request

**Detail Page** (`/service-requests/[id]/page.tsx`):
- **Header**: Request number, status/priority badges, back navigation
- **Approval Section** (if pending):
  - Purple alert card
  - Approve button (green, instant action)
  - Reject button (red, opens dialog with reason textarea)
- **Main Content**:
  - Description card
  - Form data display (key-value pairs from service catalog)
  - Activity timeline with comments
  - Comment submission form
- **Sidebar**:
  - Status dropdown (instant updates)
  - Details card (category, requester, assignee, timestamps)
  - SLA information card

### Service Layer Methods

```typescript
class ServiceRequestService {
  static async createServiceRequest(orgId, userId, data)
  static async getServiceRequestById(id, orgId)
  static async getServiceRequests(orgId, filters?)
  static async updateServiceRequest(id, orgId, updates)
  static async deleteServiceRequest(id, orgId)
  static async updateStatus(id, orgId, status)
  static async approveServiceRequest(id, orgId, approvedBy, approverName)
  static async rejectServiceRequest(id, orgId, reason, rejectedBy, rejectorName)
  static async getServiceRequestStats(orgId)
  static async getMyServiceRequests(userId, orgId)
  static async addComment(requestId, orgId, content, createdBy, isInternal?)
  static async getComments(requestId)
  static async checkSLABreaches(orgId)
}
```

### API Routes

```
/api/service-requests
  GET  - List all service requests with filters
  POST - Create new service request

/api/service-requests/[id]
  GET    - Get single service request
  PUT    - Update service request
  DELETE - Delete service request (admin only)

/api/service-requests/[id]/approve
  POST - Approve request (admin/technician only)

/api/service-requests/[id]/reject
  POST - Reject request with reason (admin/technician only)

/api/service-requests/[id]/comments
  GET  - Get all comments
  POST - Add new comment

/api/service-requests/stats
  GET  - Get statistics
```

---

## Problems Module

### Purpose

Problems represent the underlying causes of one or more incidents. Problem Management focuses on:
- Root cause analysis
- Workaround documentation
- Permanent solution implementation
- Knowledge retention
- Preventing future incidents

### Key Features

✅ **Root Cause Analysis**
- Dedicated `rootCause` field (rich text)
- Investigation timeline
- Update tracking with timestamps

✅ **Workaround Management**
- Document temporary solutions
- Track workaround effectiveness
- Share with support team

✅ **Solution Documentation**
- Document permanent fix
- Auto-creates knowledge base article (planned)
- Prevents future incidents

✅ **Incident Linking**
- Link multiple incidents to problem
- Track related incident IDs
- Display linked incidents in detail view

✅ **Known Error Database**
- Status: `known_error` designates documented problems
- Searchable by symptoms
- Quick reference for support team

✅ **Problem Numbering**
- Format: `PRB-00001`, `PRB-00002`, etc.
- Auto-incremented per organization
- 5-digit zero-padded sequence

### Data Model

```typescript
interface Problem extends BaseEntity {
  problemNumber: string          // PRB-00001
  title: string
  description: string
  status: ProblemStatus          // 5 states
  priority: ProblemPriority      // low, medium, high, critical
  category: string
  reportedBy: string             // User ID
  assignedTo?: string
  // Root cause analysis
  rootCause?: string             // Investigation findings
  workaround?: string            // Temporary solution
  solution?: string              // Permanent fix
  // Related records
  relatedIncidents: string[]     // Incident IDs
  affectedServices: string[]
  clientIds: string[]            // [] = all clients
  // Impact assessment
  impact: ProblemImpact          // low, medium, high
  urgency: ProblemUrgency        // low, medium, high
  // Visibility
  isPublic: boolean              // Show in portal
  // Timestamps
  startedAt: Date
  resolvedAt?: Date
}

type ProblemStatus =
  | 'open'          // Initial state
  | 'investigating' // Analysis in progress
  | 'known_error'   // Root cause identified, workaround documented
  | 'resolved'      // Permanent solution implemented
  | 'closed'        // Problem closed

interface ProblemUpdate {
  problemId: string
  updateType: 'status' | 'root_cause' | 'workaround' | 'solution' | 'general'
  status?: ProblemStatus
  message: string
  createdBy: string
  createdAt: Date
}
```

### UI Components

**Main List Page** (`/problems/page.tsx`):
- **Stats Cards**: Total, Active, Known Errors, Resolved
- **Advanced Filters**: Status (5 options), Priority (4 options), Impact (3 options), Search
- **Table Columns**: Problem #, Title, Status, Priority, Impact, Urgency, Duration, Assigned To
- **Auto-refresh**: Every 30 seconds
- **Empty State**: Friendly CTA for first problem

**Detail Page** (`/problems/[id]/page.tsx`):
- **Header**: Problem number, status/priority badges, edit toggle
- **Main Content** (Two modes: View / Edit):
  - **Description**: Problem details
  - **Root Cause Analysis**: Investigation findings (editable)
  - **Workaround**: Temporary solution (editable)
  - **Solution**: Permanent fix (editable)
  - **Related Incidents**: Linked incident numbers with navigation
  - **Activity Timeline**: All updates with timestamps
- **Sidebar**:
  - Status and Priority (editable inline)
  - Category, Impact, Urgency
  - Duration counter (time since reported)
  - Assigned To / Reported By
  - Affected Services list
  - Created/Resolved timestamps

### Service Layer Methods

```typescript
class ProblemService {
  static async createProblem(orgId, createdBy, data)
  static async getProblems(orgId, filters?)
  static async getProblemById(id, orgId)
  static async updateProblem(id, orgId, updates)
  static async deleteProblem(id, orgId)
  static async linkIncidents(problemId, orgId, incidentIds, linkedBy)
  static async updateRootCause(problemId, orgId, rootCause, updatedBy)
  static async updateSolution(problemId, orgId, solution, updatedBy)
  static async addProblemUpdate(problemId, orgId, update)
  static async getProblemUpdates(problemId, orgId)
  static async getProblemStats(orgId)
}
```

### API Routes

```
/api/problems
  GET  - List all problems with filters
  POST - Create new problem

/api/problems/[id]
  GET    - Get single problem
  PUT    - Update problem (status, root cause, workaround, solution)
  DELETE - Delete problem

/api/problems/[id]/incidents
  POST - Link incidents to problem

/api/problems/[id]/updates
  GET - Get problem activity timeline

/api/problems/stats
  GET - Get statistics
```

---

## Technical Architecture

### Database Schema

**Collections:**
- `service_requests` - Main service request records
- `service_request_comments` - Comments on service requests
- `problems` - Main problem records
- `problem_updates` - Problem activity timeline

### Multi-tenancy

All queries scoped by `orgId`:
```typescript
const query = { orgId, ...filters }
const results = await collection.find(query).toArray()
```

### Role-Based Access Control

**Service Requests:**
- **End Users**: Can view own requests, create new requests
- **Technicians**: Can view all, update status, add comments
- **Admins**: Can view all, approve/reject, assign, delete

**Problems:**
- **End Users**: Can view public problems
- **Technicians**: Can view all, create, update, link incidents
- **Admins**: Can view all, create, update, delete

### Integration with Service Catalog

When user submits service catalog form with `itilCategory: 'service-request'`:

1. Form validated against schema
2. `ServiceCatalogSubmissionService.submitRequest()` called
3. Service request created via `ServiceRequestService.createServiceRequest()`
4. Form data stored in `formData` field
5. ITIL fields mapped (priority, impact, urgency)
6. SLA configured from service settings
7. Approval status set if `requiresApproval: true`
8. User redirected to `/service-requests/[id]`

---

## API Reference

### Create Service Request

**Endpoint:** `POST /api/service-requests`

**Request:**
```json
{
  "title": "New MacBook Pro Request",
  "description": "Need new laptop for development work",
  "priority": "high",
  "category": "Hardware",
  "serviceId": "507f191e810c19729de860ea",
  "formData": {
    "department": "Engineering",
    "costCenter": "ENG-001",
    "budget": "2500",
    "justification": "Current laptop is 5 years old"
  },
  "sla": {
    "responseTime": 60,
    "resolutionTime": 480
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Service request created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "requestNumber": "SR-00042",
    "title": "New MacBook Pro Request",
    "status": "pending_approval",
    "priority": "high",
    "approvalStatus": "pending",
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Approve Service Request

**Endpoint:** `POST /api/service-requests/[id]/approve`

**Response:**
```json
{
  "success": true,
  "message": "Service request approved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "approvalStatus": "approved",
    "approvedBy": "user123",
    "approvedByName": "John Admin",
    "approvedAt": "2025-01-15T10:35:00Z",
    "status": "approved"
  }
}
```

### Reject Service Request

**Endpoint:** `POST /api/service-requests/[id]/reject`

**Request:**
```json
{
  "reason": "Insufficient budget available for this quarter"
}
```

### Create Problem

**Endpoint:** `POST /api/problems`

**Request:**
```json
{
  "title": "Email Server Intermittent Disconnections",
  "description": "Multiple users reporting email disconnections throughout the day",
  "category": "Infrastructure",
  "priority": "high",
  "impact": "high",
  "urgency": "medium",
  "affectedServices": ["Email", "Calendar"],
  "relatedIncidents": ["INC-0042", "INC-0043", "INC-0044"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439012",
    "problemNumber": "PRB-00015",
    "title": "Email Server Intermittent Disconnections",
    "status": "open",
    "priority": "high",
    "relatedIncidents": ["INC-0042", "INC-0043", "INC-0044"],
    "startedAt": "2025-01-15T11:00:00Z"
  }
}
```

### Update Root Cause

**Endpoint:** `PUT /api/problems/[id]`

**Request:**
```json
{
  "rootCause": "Analysis revealed that the email server's connection pool was configured with a max size of 50. During peak hours (9-11 AM), connection requests exceed this limit, causing timeouts and disconnections. The issue is exacerbated by long-running connections that are not being released properly."
}
```

### Link Incidents to Problem

**Endpoint:** `POST /api/problems/[id]/incidents`

**Request:**
```json
{
  "incidentIds": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"]
}
```

---

## User Guide

### Service Requests Workflow

1. **Submission** (End User)
   - Navigate to Service Catalog
   - Select service (e.g., "New Laptop Request")
   - Fill out custom form
   - Submit → Creates service request with status `submitted`

2. **Approval** (Admin/Technician) - If required
   - Notification sent to approvers
   - Navigate to Service Requests
   - Open pending request
   - Click "Approve" or "Reject"
   - If rejected, provide reason

3. **Fulfillment** (Technician)
   - Request appears in queue
   - Technician assigns to self
   - Changes status to `in_progress`
   - Performs work
   - Adds comments/updates
   - Changes status to `completed`

4. **Closure** (Automatic or Manual)
   - Requester confirms satisfaction
   - Request marked as `closedAt`
   - SLA metrics recorded

### Problems Workflow

1. **Identification** (Technician)
   - Multiple similar incidents occur
   - Pattern recognized
   - Create new problem
   - Link related incidents
   - Status: `open`

2. **Investigation** (Problem Manager)
   - Analyze incidents
   - Review system logs
   - Reproduce issue
   - Change status to `investigating`
   - Document findings in updates

3. **Root Cause Analysis** (Problem Manager)
   - Identify root cause
   - Document in "Root Cause" field
   - Document temporary workaround
   - Change status to `known_error`
   - Share with support team

4. **Solution Implementation** (Change Manager)
   - Develop permanent fix
   - Create change request
   - Implement solution
   - Document in "Solution" field
   - Change status to `resolved`

5. **Closure** (Problem Manager)
   - Verify no new incidents
   - Update knowledge base
   - Close problem
   - Status: `closed`

---

## Integration Points

### Service Catalog → Service Requests

Automatic routing via `ServiceCatalogSubmissionService`:

```typescript
// When itilCategory = 'service-request'
const result = await ServiceRequestService.createServiceRequest(orgId, userId, {
  title: formData.title || service.name,
  description: formData.description,
  priority: calculatedPriority,
  category: service.category,
  serviceId: service._id.toString(),
  formData: formData, // All form fields stored
  approvalStatus: service.requiresApproval ? 'pending' : undefined,
  sla: {
    responseTime: service.slaResponseTime,
    resolutionTime: service.slaResolutionTime,
    // Deadlines calculated
  }
})
```

### Incidents → Problems

Link incidents to problems for root cause tracking:

```typescript
await ProblemService.linkIncidents(
  problemId,
  orgId,
  ['incident_id_1', 'incident_id_2'],
  userId
)
```

### Problems → Knowledge Base (Planned)

When problem resolved, auto-create KB article:
- Title: Problem title
- Content: Root cause + solution
- Category: Problem category
- Tags: Affected services
- Visibility: Public if `isPublic: true`

---

## Best Practices

### Service Requests

1. **Use Service Catalog**
   - Always create requests via service catalog forms
   - Don't create ad-hoc requests
   - Ensures proper approval routing

2. **Clear Descriptions**
   - Include business justification
   - Specify urgency
   - Add relevant details (cost center, location)

3. **Timely Approvals**
   - Set approval SLAs
   - Notify approvers immediately
   - Escalate overdue approvals

4. **Status Updates**
   - Keep requesters informed
   - Add comments at key milestones
   - Set realistic completion dates

### Problems

1. **Link All Related Incidents**
   - Helps identify patterns
   - Provides complete context
   - Tracks impact scope

2. **Document Thoroughly**
   - Root cause analysis should be detailed
   - Include reproduction steps
   - Note environmental factors

3. **Workarounds First**
   - Document temporary solutions quickly
   - Share with support team
   - Reduce immediate impact

4. **Permanent Solutions**
   - Develop comprehensive fix
   - Test thoroughly
   - Create change request for implementation

5. **Knowledge Retention**
   - Update knowledge base
   - Train support team
   - Prevent future occurrences

---

## Files Created

### Service Requests Module

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types.ts` | ServiceRequest type definition | 37 |
| `src/lib/mongodb.ts` | Collection constant | 1 |
| `src/lib/services/service-requests.ts` | Service layer | 460 |
| `src/app/api/service-requests/route.ts` | Main API routes | 118 |
| `src/app/api/service-requests/[id]/route.ts` | Individual routes | 147 |
| `src/app/api/service-requests/[id]/approve/route.ts` | Approval endpoint | 67 |
| `src/app/api/service-requests/[id]/reject/route.ts` | Rejection endpoint | 78 |
| `src/app/api/service-requests/[id]/comments/route.ts` | Comments API | 93 |
| `src/app/api/service-requests/stats/route.ts` | Statistics API | 42 |
| `src/app/(app)/service-requests/page.tsx` | List page UI | 469 |
| `src/app/(app)/service-requests/[id]/page.tsx` | Detail page UI | 573 |

### Problems Module

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types.ts` | Problem type definition | 37 |
| `src/lib/mongodb.ts` | Collection constants | 2 |
| `src/lib/services/problems.ts` | Service layer | 450 |
| `src/app/api/problems/route.ts` | Main API routes | 115 |
| `src/app/api/problems/[id]/route.ts` | Individual routes | 145 |
| `src/app/api/problems/[id]/incidents/route.ts` | Incident linking | 58 |
| `src/app/api/problems/[id]/updates/route.ts` | Activity timeline | 42 |
| `src/app/api/problems/stats/route.ts` | Statistics API | 42 |
| `src/app/(app)/problems/page.tsx` | List page UI | 465 |
| `src/app/(app)/problems/[id]/page.tsx` | Detail page UI | 615 |

### Integration Layer

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/services/service-catalog-submissions.ts` | Submission routing | 252 |
| `src/app/api/service-catalog/[id]/submit/route.ts` | Submission API | 48 |
| `src/components/layout/sidebar.tsx` | Navigation (updated) | - |

**Total:** ~4,200 lines of production-ready code

---

## Support

For technical details:
- Review FORM_BUILDER_DOCUMENTATION.md
- Check CLAUDE.md for project structure
- Examine tickets module for similar patterns
- Follow ITIL best practices

---

**Last Updated:** January 2025
**Version:** 1.0
**Author:** Deskwise Development Team
