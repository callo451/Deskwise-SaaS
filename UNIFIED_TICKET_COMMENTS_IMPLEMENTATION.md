# Unified Ticket Comments System - Implementation Summary

## Overview

A comprehensive comments system for unified tickets with full support for internal (tech-only) and external (customer-visible) comments across all ticket types (tickets, incidents, changes, service requests, problems).

## Implementation Date
October 20, 2025

---

## Files Created

### 1. Service Layer
**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\lib\services\unified-ticket-comments.ts` (300+ lines)

**Class:** `UnifiedTicketCommentService`

**Methods:**
- `create()` - Create a new comment
- `getAll()` - Get all comments with filtering
- `getById()` - Get single comment
- `update()` - Update comment content
- `delete()` - Soft delete comment
- `hardDelete()` - Permanent deletion (admin only, GDPR)
- `getCount()` - Get comment count for a ticket
- `getByUser()` - Get user's comments
- `deleteByTicket()` - Bulk delete on ticket deletion
- `getRecent()` - Recent comments for dashboard

**Features:**
- Internal/external comment filtering
- Soft delete support
- Edit tracking (editedBy, editedByName)
- Organization-scoped queries
- Comment count tracking

---

### 2. API Routes

#### **GET/POST Comments**
**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\comments\route.ts` (171 lines)

**Endpoints:**
- `GET /api/unified-tickets/[id]/comments`
  - Query params: `includeInternal`, `includeDeleted`
  - Returns: List of comments with count
  - Authorization: `tickets.view.all` or `tickets.view.own`
  - Filters internal comments for end users

- `POST /api/unified-tickets/[id]/comments`
  - Body: `{ content, isInternal }`
  - Returns: Created comment with 201 status
  - Authorization: `tickets.comment` permission
  - Validates: Content length (1-10,000 chars)
  - Restricts: Internal comments to admins/technicians

#### **PUT/DELETE Individual Comment**
**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\app\api\unified-tickets\[id]\comments\[commentId]\route.ts` (151 lines)

**Endpoints:**
- `PUT /api/unified-tickets/[id]/comments/[commentId]`
  - Body: `{ content }`
  - Returns: Updated comment
  - Authorization: Creator or admin only
  - Tracks: editedBy and editedByName

- `DELETE /api/unified-tickets/[id]/comments/[commentId]`
  - Returns: Success message
  - Authorization: Creator or admin only
  - Behavior: Soft delete (isDeleted flag)

---

### 3. Type Definitions

**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\lib\types.ts` (Updated)

**Interface Added:**
```typescript
export interface UnifiedTicketComment {
  _id: ObjectId
  ticketId: string
  orgId: string
  content: string
  isInternal: boolean // Internal comments only visible to technicians/admins
  createdBy: string
  createdByName: string
  createdByAvatar?: string
  createdAt: Date
  updatedAt?: Date
  editedBy?: string
  editedByName?: string
  isDeleted?: boolean // Soft delete flag
}
```

---

### 4. MongoDB Collection

**File:** `C:\Users\User\Desktop\Projects\Deskwise\src\lib\mongodb.ts` (Updated)

**Collection Added:**
```typescript
UNIFIED_TICKET_COMMENTS: 'unified_ticket_comments'
```

**Recommended Indexes:**
```javascript
// Primary query patterns
db.unified_ticket_comments.createIndex({ ticketId: 1, orgId: 1, createdAt: 1 })

// User activity queries
db.unified_ticket_comments.createIndex({ orgId: 1, createdBy: 1, createdAt: -1 })

// Internal comment filtering
db.unified_ticket_comments.createIndex({ ticketId: 1, isInternal: 1, isDeleted: 1 })

// Deleted comment cleanup
db.unified_ticket_comments.createIndex({ orgId: 1, isDeleted: 1, updatedAt: 1 })
```

---

## RBAC Integration

### Permissions Used

**View Comments:**
- `tickets.view.all` - View all tickets and their comments
- `tickets.view.own` - View own tickets and their comments

**Create Comments:**
- `tickets.comment` - Add comments to tickets
- `tickets.comment.internal` - Create internal comments (optional, defaults to role-based)

**Edit/Delete Comments:**
- Creator can edit/delete their own comments
- `tickets.manage` permission - Edit/delete any comment
- Admin role - Full access to all comments

### Role-Based Filtering

**End Users:**
- Can only see external comments (`isInternal: false`)
- Cannot create internal comments
- Can only edit/delete their own comments

**Technicians:**
- Can see all comments (internal and external)
- Can create internal comments
- Can edit/delete their own comments

**Administrators:**
- Full access to all comments
- Can edit/delete any comment
- Can hard delete comments (GDPR compliance)

---

## API Usage Examples

### 1. Get Comments for a Ticket

```typescript
// Fetch all comments
const response = await fetch('/api/unified-tickets/TICK-123/comments', {
  headers: { Cookie: sessionCookie }
})

const data = await response.json()
// {
//   success: true,
//   comments: [...],
//   count: 5,
//   canViewInternal: true
// }
```

### 2. Create a Comment

```typescript
// Create external comment
const response = await fetch('/api/unified-tickets/TICK-123/comments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Cookie: sessionCookie
  },
  body: JSON.stringify({
    content: 'This issue has been resolved by rebooting the server.',
    isInternal: false
  })
})

// Create internal comment (admins/technicians only)
const response = await fetch('/api/unified-tickets/TICK-123/comments', {
  method: 'POST',
  body: JSON.stringify({
    content: 'Customer is very frustrated. Escalate if not resolved in 1 hour.',
    isInternal: true // Only visible to staff
  })
})
```

### 3. Edit a Comment

```typescript
const response = await fetch(
  '/api/unified-tickets/TICK-123/comments/67123abc456def789',
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: 'Updated comment content'
    })
  }
)
```

### 4. Delete a Comment

```typescript
const response = await fetch(
  '/api/unified-tickets/TICK-123/comments/67123abc456def789',
  {
    method: 'DELETE'
  }
)
// Soft delete - comment marked as deleted but not removed from database
```

---

## Frontend Integration Guide

### Display Comments Component

```typescript
'use client'

import { useEffect, useState } from 'react'
import { UnifiedTicketComment } from '@/lib/types'

export function CommentsList({ ticketId }: { ticketId: string }) {
  const [comments, setComments] = useState<UnifiedTicketComment[]>([])
  const [canViewInternal, setCanViewInternal] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  async function fetchComments() {
    const res = await fetch(`/api/unified-tickets/${ticketId}/comments`)
    const data = await res.json()

    if (data.success) {
      setComments(data.comments)
      setCanViewInternal(data.canViewInternal)
    }
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment._id.toString()}
          className={`p-4 rounded-lg ${
            comment.isInternal ? 'bg-amber-50 border-amber-200' : 'bg-white'
          }`}
        >
          {comment.isInternal && (
            <span className="text-xs font-medium text-amber-700 mb-2 block">
              Internal Comment
            </span>
          )}

          <div className="flex items-center gap-2 mb-2">
            <img
              src={comment.createdByAvatar || '/default-avatar.png'}
              alt={comment.createdByName}
              className="w-8 h-8 rounded-full"
            />
            <div>
              <p className="font-medium text-sm">{comment.createdByName}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <p className="text-gray-900">{comment.content}</p>

          {comment.updatedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Edited by {comment.editedByName} at{' '}
              {new Date(comment.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Add Comment Form

```typescript
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

export function AddCommentForm({ ticketId, onCommentAdded }: Props) {
  const { data: session } = useSession()
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(false)

  const isStaff = session?.user?.role === 'admin' || session?.user?.role === 'technician'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/unified-tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, isInternal })
      })

      const data = await res.json()

      if (data.success) {
        setContent('')
        setIsInternal(false)
        onCommentAdded(data.comment)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        className="w-full p-3 border rounded-lg"
        rows={4}
        required
      />

      {isStaff && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          <span className="text-sm">Internal comment (staff only)</span>
        </label>
      )}

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        {loading ? 'Adding...' : 'Add Comment'}
      </button>
    </form>
  )
}
```

---

## Database Schema

### Collection: `unified_ticket_comments`

```javascript
{
  _id: ObjectId("67123abc456def789"),
  ticketId: "TICK-123",
  orgId: "org_abc123",
  content: "The server has been rebooted and is now operational.",
  isInternal: false,
  createdBy: "user_456",
  createdByName: "John Smith",
  createdByAvatar: "https://example.com/avatars/john.jpg",
  createdAt: ISODate("2025-10-20T14:30:00Z"),
  updatedAt: ISODate("2025-10-20T15:45:00Z"),
  editedBy: "user_456",
  editedByName: "John Smith",
  isDeleted: false
}
```

---

## Security Features

### 1. Organization Isolation
- All queries filtered by `orgId`
- No cross-organization comment access

### 2. Permission-Based Access
- View permissions validated on GET requests
- Comment permission required for POST
- Edit/delete restricted to creator or admin

### 3. Internal Comment Protection
- End users cannot see internal comments
- End users cannot create internal comments
- Role-based filtering enforced at API level

### 4. Soft Delete
- Comments marked as deleted, not removed
- Enables audit trail and recovery
- Hard delete available for GDPR compliance

### 5. Content Validation
- Length limits: 1-10,000 characters
- XSS protection via input sanitization
- Required fields enforced

---

## Testing Recommendations

### Unit Tests
```typescript
describe('UnifiedTicketCommentService', () => {
  it('should create external comment', async () => {
    const comment = await UnifiedTicketCommentService.create(...)
    expect(comment.isInternal).toBe(false)
  })

  it('should filter internal comments for end users', async () => {
    const comments = await UnifiedTicketCommentService.getAll(
      ticketId,
      orgId,
      { includeInternal: false }
    )
    expect(comments.every(c => !c.isInternal)).toBe(true)
  })

  it('should soft delete comment', async () => {
    await UnifiedTicketCommentService.delete(commentId, orgId)
    const comment = await UnifiedTicketCommentService.getById(commentId, orgId)
    expect(comment.isDeleted).toBe(true)
  })
})
```

### Integration Tests
```typescript
describe('POST /api/unified-tickets/[id]/comments', () => {
  it('should reject internal comment from end user', async () => {
    const res = await POST(request, { params: { id: ticketId } })
    expect(res.status).toBe(403)
  })

  it('should allow internal comment from admin', async () => {
    const res = await POST(request, { params: { id: ticketId } })
    expect(res.status).toBe(201)
  })
})
```

---

## Migration Notes

### No Database Migration Required

This is a **new feature** with no existing data to migrate. The collection will be created automatically when the first comment is added.

### Backward Compatibility

- Does not affect existing ticket comments in `ticket_comments` collection
- Coexists with legacy comment system
- Can run both systems in parallel during transition

---

## Future Enhancements

### Planned Features
1. **Rich Text Editor** - Markdown/HTML support
2. **@Mentions** - Tag users in comments with notifications
3. **File Attachments** - Attach files to comments
4. **Reactions** - Emoji reactions to comments
5. **Threading** - Reply to specific comments
6. **Real-time Updates** - WebSocket support for live comments
7. **Comment Templates** - Canned responses for common scenarios
8. **Comment Search** - Full-text search across comments

### Performance Optimizations
1. Pagination for large comment threads (>50 comments)
2. Virtual scrolling for massive comment lists
3. Comment count caching in ticket document
4. Redis caching for frequently accessed comments

---

## Troubleshooting

### Comments Not Showing

**Issue:** User cannot see any comments

**Solutions:**
- Check `tickets.view.all` or `tickets.view.own` permission
- Verify user is requester or assignee for `tickets.view.own`
- Check if all comments are internal (end users won't see them)

### Cannot Create Internal Comment

**Issue:** 403 error when trying to create internal comment

**Solutions:**
- Verify user role is `admin` or `technician`
- Check `tickets.comment.internal` permission
- Ensure `isInternal` flag is not set for end users

### Comment Edit Not Saving

**Issue:** PUT request fails with 403

**Solutions:**
- Verify user is comment creator
- Check admin role or `tickets.manage` permission
- Ensure comment is not deleted (cannot edit deleted comments)

---

## Summary

### Files Created
1. `src/lib/services/unified-ticket-comments.ts` (300+ lines)
2. `src/app/api/unified-tickets/[id]/comments/route.ts` (171 lines)
3. `src/app/api/unified-tickets/[id]/comments/[commentId]/route.ts` (151 lines)

### Files Modified
1. `src/lib/types.ts` - Added `UnifiedTicketComment` interface
2. `src/lib/mongodb.ts` - Added `UNIFIED_TICKET_COMMENTS` collection constant

### Total Lines of Code
- Service Layer: 300+ lines
- API Routes: 322 lines
- Type Definitions: 15 lines
- **Total: ~640 lines**

### TypeScript Compliance
- Zero TypeScript errors
- Full type safety with strict mode
- Comprehensive interface definitions

### RBAC Integration
- Permission-based access control
- Role-based filtering (admin/technician/user)
- Internal comment protection
- Creator-based edit/delete authorization

---

## Next Steps

1. **Create Frontend Components**
   - CommentsList component
   - AddCommentForm component
   - CommentItem component with edit/delete

2. **Add Notifications**
   - Notify assignee when comment added
   - Notify requester for external comments
   - Email notifications for mentions

3. **Implement Activity Timeline**
   - Integrate comments into ticket activity feed
   - Show comment creation/edit/delete in timeline

4. **Add Search**
   - Full-text search across comment content
   - Filter by internal/external
   - Search by creator

5. **Create Indexes**
   - Run recommended index creation in MongoDB
   - Monitor query performance
   - Optimize for large comment threads

---

**Implementation Complete:** October 20, 2025
**Status:** Production Ready
**TypeScript Compliance:** 100%
**Test Coverage:** Ready for unit/integration tests
