# Developer Guide - Ticket System

**Version:** 2.0
**Target Audience:** Backend & Frontend Developers

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Adding New Features](#adding-new-features)
3. [Code Patterns](#code-patterns)
4. [Testing Guidelines](#testing-guidelines)
5. [Deployment Checklist](#deployment-checklist)

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6.0+
- Git
- Code editor (VS Code recommended)

### Local Development Setup

```bash
# Clone repository
cd C:\Users\User\Desktop\Projects\Deskwise

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB URI and secrets

# Run development server
npm run dev

# Open http://localhost:9002
```

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── tickets/            # Ticket API routes
│   │       ├── route.ts        # List, create tickets
│   │       ├── stats/          # Statistics
│   │       └── [id]/           # Ticket-specific routes
│   │           ├── route.ts    # Get, update, delete ticket
│   │           ├── comments/   # Comments API
│   │           ├── time/       # Time tracking API
│   │           ├── assets/     # Asset linking API
│   │           └── ...         # Other features
│   └── (app)/
│       └── tickets/            # Ticket pages
│           ├── page.tsx        # List page
│           ├── new/            # Create page
│           └── [id]/           # Detail page
├── lib/
│   ├── services/
│   │   ├── tickets.ts          # Ticket business logic
│   │   ├── time-tracking.ts   # Time tracking logic
│   │   └── file-storage.ts    # File upload logic
│   ├── types.ts                # TypeScript interfaces
│   ├── mongodb.ts              # Database connection
│   └── middleware/
│       └── permissions.ts      # RBAC middleware
└── components/
    ├── tickets/                # Ticket-specific components
    └── ui/                     # Reusable UI components
```

---

## Adding New Features

### Step 1: Define Database Schema

Add interface to `src/lib/types.ts`:

```typescript
export interface MyFeature extends BaseEntity {
  _id: ObjectId
  orgId: string
  ticketId: string
  // ... your fields
  createdAt: Date
  updatedAt: Date
  createdBy: string
}
```

### Step 2: Create Service Layer

Create `src/lib/services/my-feature.ts`:

```typescript
import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { MyFeature } from '@/lib/types'

export class MyFeatureService {
  static async create(
    orgId: string,
    ticketId: string,
    data: any
  ): Promise<MyFeature> {
    const db = await getDatabase()
    const collection = db.collection<MyFeature>('my_features')

    const feature: Omit<MyFeature, '_id'> = {
      orgId,
      ticketId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy,
    }

    const result = await collection.insertOne(feature as MyFeature)

    return {
      ...feature,
      _id: result.insertedId,
    } as MyFeature
  }

  static async getByTicketId(
    ticketId: string,
    orgId: string
  ): Promise<MyFeature[]> {
    const db = await getDatabase()
    const collection = db.collection<MyFeature>('my_features')

    return await collection
      .find({ ticketId, orgId })
      .sort({ createdAt: -1 })
      .toArray()
  }

  // ... other CRUD methods
}
```

### Step 3: Create API Route

Create `src/app/api/tickets/[id]/my-feature/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { MyFeatureService } from '@/lib/services/my-feature'
import { requirePermission, createPermissionError } from '@/lib/middleware/permissions'
import { z } from 'zod'

const createSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions
    const hasPermission = await requirePermission(session, 'tickets.view.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.view') },
        { status: 403 }
      )
    }

    const { id } = await params
    const data = await MyFeatureService.getByTicketId(id, session.user.orgId)

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Get feature error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check RBAC permissions
    const hasPermission = await requirePermission(session, 'tickets.edit.all')
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: createPermissionError('tickets.edit') },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = createSchema.parse(body)

    const feature = await MyFeatureService.create(
      session.user.orgId,
      id,
      {
        ...validatedData,
        createdBy: session.user.id,
      }
    )

    return NextResponse.json({
      success: true,
      data: feature,
      message: 'Feature created successfully',
    })
  } catch (error) {
    console.error('Create feature error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create feature' },
      { status: 500 }
    )
  }
}
```

### Step 4: Create Frontend Component

Create `src/components/tickets/MyFeature.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface MyFeatureProps {
  ticketId: string
}

export function MyFeature({ ticketId }: MyFeatureProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [ticketId])

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/my-feature`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (newData: any) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/my-feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      })

      const result = await response.json()

      if (result.success) {
        fetchData() // Refresh data
      }
    } catch (error) {
      console.error('Error creating:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {/* Your UI here */}
    </div>
  )
}
```

### Step 5: Add Database Indexes

Create migration script or add to MongoDB:

```javascript
// In MongoDB shell or via migration script
db.my_features.createIndex({ orgId: 1, ticketId: 1 })
db.my_features.createIndex({ orgId: 1, createdAt: -1 })
```

### Step 6: Update COLLECTIONS Enum

Add to `src/lib/mongodb.ts`:

```typescript
export const COLLECTIONS = {
  TICKETS: 'tickets',
  TIME_ENTRIES: 'time_entries',
  MY_FEATURES: 'my_features', // Add your collection
  // ... other collections
} as const
```

---

## Code Patterns

### 1. Service Layer Pattern

**Always use service layer for business logic:**

```typescript
// ❌ Bad: Business logic in API route
export async function POST(request: NextRequest) {
  const db = await getDatabase()
  const tickets = db.collection('tickets')

  const count = await tickets.countDocuments({ orgId })
  const ticketNumber = `TKT-${(count + 1).toString().padStart(5, '0')}`

  await tickets.insertOne({ ticketNumber, ... })
}

// ✅ Good: Business logic in service layer
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  const ticket = await TicketService.createTicket(
    session.user.orgId,
    validatedData,
    session.user.id
  )

  return NextResponse.json({ success: true, data: ticket })
}
```

### 2. Input Validation Pattern

**Always validate with Zod:**

```typescript
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  email: z.string().email().optional(),
})

try {
  const validatedData = schema.parse(body)
} catch (error) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }
}
```

### 3. RBAC Permission Check Pattern

**Always check permissions:**

```typescript
import { requirePermission, requireAnyPermission } from '@/lib/middleware/permissions'

// Single permission
const hasPermission = await requirePermission(session, 'tickets.create')

// Multiple permissions (OR logic)
const hasPermission = await requireAnyPermission(session, [
  'tickets.view.all',
  'tickets.view.assigned',
  'tickets.view.own'
])

if (!hasPermission) {
  return NextResponse.json(
    { success: false, error: createPermissionError('tickets.view') },
    { status: 403 }
  )
}
```

### 4. Multi-Tenancy Pattern

**Always filter by orgId:**

```typescript
// ❌ Bad: No orgId filter
const tickets = await db.collection('tickets').find({ status: 'open' }).toArray()

// ✅ Good: Always filter by orgId
const tickets = await db.collection('tickets').find({
  orgId: session.user.orgId,
  status: 'open'
}).toArray()
```

### 5. Error Handling Pattern

**Consistent error responses:**

```typescript
try {
  // Your code here
} catch (error) {
  console.error('Descriptive error name:', error)

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: 'Validation error', details: error.errors },
      { status: 400 }
    )
  }

  if (error instanceof MyCustomError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    )
  }

  return NextResponse.json(
    { success: false, error: 'Failed to perform operation' },
    { status: 500 }
  )
}
```

### 6. Async Params Pattern (Next.js 15)

**API routes with dynamic segments:**

```typescript
// Next.js 15 requires await for params
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params // ✅ Must await params

  // Use id
}
```

### 7. Pagination Pattern

**Server-side pagination:**

```typescript
const page = parseInt(searchParams.get('page') || '1', 10)
const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100)
const skip = (page - 1) * limit

const [total, tickets] = await Promise.all([
  collection.countDocuments(query),
  collection.find(query).skip(skip).limit(limit).toArray(),
])

return NextResponse.json({
  success: true,
  data: tickets,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page < Math.ceil(total / limit),
  },
})
```

---

## Testing Guidelines

### Unit Testing (Service Layer)

```typescript
// __tests__/services/tickets.test.ts
import { TicketService } from '@/lib/services/tickets'

describe('TicketService', () => {
  beforeEach(async () => {
    // Clear test database
  })

  describe('createTicket', () => {
    it('should create ticket with auto-generated number', async () => {
      const ticket = await TicketService.createTicket(
        'org_123',
        {
          title: 'Test ticket',
          description: 'Test description',
          priority: 'medium',
          category: 'Hardware',
        },
        'user_123'
      )

      expect(ticket.ticketNumber).toMatch(/^TKT-\d{5}$/)
      expect(ticket.status).toBe('new')
      expect(ticket.orgId).toBe('org_123')
    })

    it('should calculate SLA deadlines', async () => {
      const ticket = await TicketService.createTicket(
        'org_123',
        {
          title: 'Test ticket',
          description: 'Test',
          priority: 'high',
          category: 'Hardware',
          sla: {
            responseTime: 60,
            resolutionTime: 240,
          },
        },
        'user_123'
      )

      expect(ticket.sla).toBeDefined()
      expect(ticket.sla!.responseDeadline).toBeInstanceOf(Date)
      expect(ticket.sla!.breached).toBe(false)
    })
  })
})
```

### Integration Testing (API Routes)

```typescript
// __tests__/api/tickets.test.ts
import { POST } from '@/app/api/tickets/route'
import { NextRequest } from 'next/server'

describe('/api/tickets', () => {
  it('should create ticket with valid data', async () => {
    const request = new NextRequest('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test ticket',
        description: 'Test description',
        priority: 'medium',
        category: 'Hardware',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.ticketNumber).toMatch(/^TKT-\d{5}$/)
  })

  it('should return 400 for invalid data', async () => {
    const request = new NextRequest('http://localhost/api/tickets', {
      method: 'POST',
      body: JSON.stringify({
        title: '', // Invalid: empty title
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Validation error')
  })
})
```

### E2E Testing (Playwright)

```typescript
// e2e/tickets.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Ticket Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9002/auth/login')
    // Login
  })

  test('should create new ticket', async ({ page }) => {
    await page.goto('http://localhost:9002/tickets/new')

    await page.fill('input[name="title"]', 'Test ticket')
    await page.fill('textarea[name="description"]', 'Test description')
    await page.selectOption('select[name="priority"]', 'medium')
    await page.selectOption('select[name="category"]', 'Hardware')

    await page.click('button[type="submit"]')

    await expect(page).toHaveURL(/\/tickets\/[a-f0-9]+/)
    await expect(page.locator('h1')).toContainText('Test ticket')
  })

  test('should filter tickets by status', async ({ page }) => {
    await page.goto('http://localhost:9002/tickets')

    await page.click('button:has-text("Filters")')
    await page.check('input[value="open"]')
    await page.click('button:has-text("Apply")')

    const tickets = page.locator('[data-testid="ticket-card"]')
    await expect(tickets).not.toHaveCount(0)

    const statuses = await tickets.locator('[data-testid="status-badge"]').allTextContents()
    expect(statuses.every((status) => status === 'Open')).toBe(true)
  })
})
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run tests: `npm test`
- [ ] Run type checking: `npm run typecheck`
- [ ] Run linter: `npm run lint`
- [ ] Run production build: `npm run build`
- [ ] Test production build locally: `npm start`
- [ ] Review database migrations
- [ ] Update environment variables
- [ ] Review security settings (CORS, CSP, rate limiting)

### Database Migrations

```javascript
// migrations/001_add_time_tracking.js
async function up(db) {
  // Create indexes
  await db.collection('time_entries').createIndex({ orgId: 1, ticketId: 1 })
  await db.collection('time_entries').createIndex({ orgId: 1, userId: 1, isRunning: 1 })

  // Update existing tickets
  await db.collection('tickets').updateMany(
    { totalTimeSpent: { $exists: false } },
    { $set: { totalTimeSpent: 0 } }
  )
}

async function down(db) {
  // Rollback changes
  await db.collection('time_entries').dropIndexes()
  await db.collection('tickets').updateMany(
    {},
    { $unset: { totalTimeSpent: '' } }
  )
}
```

### Deployment Steps

1. **Backup Database:**
   ```bash
   mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
   ```

2. **Deploy Code:**
   ```bash
   git push origin main
   # Or trigger deployment pipeline
   ```

3. **Run Migrations:**
   ```bash
   npm run migrate:up
   ```

4. **Verify Deployment:**
   - Check application health endpoint
   - Test critical user flows
   - Monitor error logs

5. **Rollback Plan:**
   ```bash
   # Restore database
   mongorestore --uri="mongodb+srv://..." /backups/20251018

   # Revert code
   git revert HEAD
   git push origin main
   ```

### Post-Deployment

- [ ] Monitor error logs for 24 hours
- [ ] Check performance metrics
- [ ] Verify SLA compliance
- [ ] Test all critical features
- [ ] Notify users of new features

---

## Common Debugging Tips

### 1. API Route Not Working

**Check:**
- Is session valid? `console.log(session)`
- Is orgId present? `console.log(session.user.orgId)`
- Are params awaited? `const { id } = await params`
- Is MongoDB connection active? `db.admin().ping()`

### 2. Permission Denied Errors

**Check:**
- Does user have required permission? Check `session.user.permissions`
- Is permission key correct? Check `permissions` collection
- Is role assigned? Check `users.roleId`

### 3. Data Not Showing

**Check:**
- Is orgId filter applied? `{ orgId: session.user.orgId }`
- Is data in correct collection? Check MongoDB Atlas
- Are indexes created? `db.collection.getIndexes()`

### 4. Validation Errors

**Check:**
- Is Zod schema correct? Test with sample data
- Are required fields provided?
- Are enum values valid?

---

**Document Version:** 2.0
**Last Updated:** October 2025
**For Questions:** Contact development team
