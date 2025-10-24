# Project Health Score Implementation

## Overview

The Project Health Score system provides automated, real-time assessment of project status across five key dimensions: **Schedule**, **Budget**, **Scope**, **Risk**, and **Quality**. This implementation follows PMBOK best practices and provides actionable insights for project managers.

## Architecture

### Service Layer
**File:** `src/lib/services/project-health.ts`

The `ProjectHealthService` class handles all health calculations with intelligent caching and comprehensive metrics.

### Database Schema
**Collection:** `projects`

Health data is stored directly in the project document with the following fields:

```typescript
{
  health: 'green' | 'yellow' | 'red',           // Overall health status
  healthScore: number,                           // Numeric score 0-100
  healthMetrics: {                               // Detailed breakdown
    overall: {
      health: ProjectHealth,
      score: number,
      timestamp: Date                            // Cache timestamp
    },
    schedule: { ... },
    budget: { ... },
    scope: { ... },
    risk: { ... },
    quality: { ... }
  }
}
```

## Health Calculation Algorithm

### Overall Health Score (0-100)

The overall health is a **weighted average** of five categories:

- **Schedule**: 30% weight
- **Budget**: 30% weight
- **Risk**: 20% weight
- **Quality**: 15% weight
- **Scope**: 5% weight

**Health Status Mapping:**
- **Green** (80-100): Project is healthy and on track
- **Amber** (50-79): Project is at risk and needs attention
- **Red** (0-49): Project is in critical condition

### 1. Schedule Health (30% weight)

**Algorithm:**
```
timeElapsed = (now - startDate) / (endDate - startDate) × 100
variance = progressCompleted - timeElapsed
```

**Health Rules:**
- **Green**: `progressCompleted >= timeElapsed` (on track or ahead)
- **Amber**: `progressCompleted >= timeElapsed × 0.8` (slightly behind, 80-99% of expected)
- **Red**: `progressCompleted < timeElapsed × 0.8` (significantly behind, <80% of expected)

**Score Calculation:**
- Green: `80 + (variance / 5)` (bonus for being ahead)
- Amber: `50 + ((progressCompleted / timeElapsed) × 30)`
- Red: `max(0, (progressCompleted / timeElapsed) × 50)`

**Additional Metrics:**
- Days remaining until deadline
- Estimated completion date based on current velocity
- Time variance (days ahead/behind)

**Default Behavior:**
If no schedule data is available (no startDate/endDate), defaults to **Green (100)**.

---

### 2. Budget Health (30% weight)

**Algorithm:**
```
spentPercentage = (budgetSpent / budgetTotal) × 100
variance = spentPercentage - progressPercentage
```

**Health Rules:**
- **Green**: `spentPercentage <= progressPercentage × 1.1` (under/on budget, within 110%)
- **Amber**: `spentPercentage <= progressPercentage × 1.25` (moderate overrun, 110-125%)
- **Red**: `spentPercentage > progressPercentage × 1.25` (significant overrun, >125%)

**Score Calculation:**
- Green: `max(80, 100 - variance)`
- Amber: `50 + ((1.25 × progressPercentage - spentPercentage) × 2)`
- Red: `max(0, 50 - (spentPercentage - progressPercentage))`

**Additional Metrics:**
- Burn rate (spending per day)
- Projected total spend at completion
- Budget remaining
- Budget variance (over/under)

**Default Behavior:**
If no budget data is available (budget = 0), defaults to **Green (100)**.

---

### 3. Scope Health (5% weight)

**Algorithm:**
Based on approved change requests that modify project scope.

**Health Rules:**
- **Green**: 0-3 approved changes (minimal scope creep)
- **Amber**: 4-6 approved changes (moderate scope creep)
- **Red**: 7+ approved changes (excessive scope creep)

**Score Calculation:**
- 0 changes: **100**
- 1-3 changes: `90 - (approvedChanges × 5)`
- 4-6 changes: `70 - ((approvedChanges - 3) × 5)`
- 7+ changes: `max(0, 50 - ((approvedChanges - 6) × 3))`

**Additional Metrics:**
- Total change requests
- Approved changes
- Pending changes
- Rejected changes
- Scope creep percentage

**Default Behavior:**
If `project_change_requests` collection doesn't exist, defaults to **Green (100)**.

---

### 4. Risk Health (20% weight)

**Algorithm:**
Counts high-risk items (risk score >= 15) that are still open.

**Risk Score Calculation:**
```
riskScore = probabilityScore × impactScore  // Range: 1-25
```
Where:
- `probabilityScore`: 1 (very low) to 5 (very high)
- `impactScore`: 1 (very low) to 5 (very high)

**Health Rules:**
- **Green**: 0-2 high risks
- **Amber**: 3-5 high risks
- **Red**: 6+ high risks

**Score Calculation:**
- 0 high risks: `100 - (mediumRisks × 5)` (consider medium risks)
- 1-2 high risks: `85 - (highRisks × 10)`
- 3-5 high risks: `70 - ((highRisks - 2) × 5)`
- 6+ high risks: `max(0, 50 - ((highRisks - 5) × 5))`

**Additional Metrics:**
- Total risks
- High risks (score >= 15)
- Medium risks (score 9-14)
- Low risks (score < 9)
- Open risks (identified/assessed status)
- Mitigated risks

**Default Behavior:**
If `project_risks` collection doesn't exist, defaults to **Green (100)**.

---

### 5. Quality Health (15% weight)

**Algorithm:**
Based on overdue tasks and completion rate.

**Health Rules:**
- **Green**: 0 overdue tasks
- **Amber**: Overdue tasks < 10% of total tasks
- **Red**: Overdue tasks >= 10% of total tasks

**Score Calculation:**
- 0 overdue: `min(100, 80 + (averageCompletionRate / 5))`
- <10% overdue: `60 + ((1 - (overdueCount / (totalTasks × 0.1))) × 20)`
- >=10% overdue: `max(0, 50 - ((overdueCount / totalTasks) × 50))`

**Additional Metrics:**
- Total tasks
- Completed tasks
- Overdue tasks count
- Overdue task IDs
- Average task completion rate
- Defect rate (placeholder for future)

**Default Behavior:**
If no tasks exist, defaults to **Green (100)** with 0% completion rate.

---

## Caching Strategy

### Cache Duration: **6 hours**

Health metrics are cached in the project document to avoid expensive recalculations on every request.

### Cache Invalidation

Health is automatically recalculated when:

1. **Explicit recalculation** (via POST `/api/projects/[id]/health`)
2. **Significant project changes** (automatic background recalculation):
   - Status change
   - Progress update
   - Budget or usedBudget change
   - Schedule date changes (startDate, endDate, plannedStartDate, plannedEndDate, actualStartDate, actualEndDate)

3. **Cache expiration** (6 hours old)

### Background Recalculation

When `ProjectService.updateProject()` detects significant changes, it triggers health recalculation in the background (non-blocking):

```typescript
ProjectHealthService.calculateHealthScore(id, orgId, true).catch((error) => {
  console.error('Failed to recalculate project health:', error)
})
```

This ensures the API response is not delayed by health calculations.

---

## API Endpoints

### GET `/api/projects/[id]/health`

**Description:** Get current health score and detailed breakdown

**Authentication:** Required (any authenticated user)

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "health": "green",
      "score": 85,
      "timestamp": "2025-10-24T10:30:00Z"
    },
    "schedule": {
      "health": "green",
      "score": 90,
      "details": {
        "timeElapsed": 45.5,
        "progressCompleted": 50.0,
        "variance": 4.5,
        "daysRemaining": 30,
        "estimatedCompletionDate": "2025-11-23T00:00:00Z"
      }
    },
    "budget": {
      "health": "amber",
      "score": 65,
      "details": {
        "budgetTotal": 100000,
        "budgetSpent": 55000,
        "budgetRemaining": 45000,
        "spentPercentage": 55.0,
        "progressPercentage": 50.0,
        "variance": 5.0,
        "burnRate": 1833.33,
        "projectedSpend": 110000
      }
    },
    "scope": {
      "health": "green",
      "score": 95,
      "details": {
        "totalChanges": 2,
        "approvedChanges": 1,
        "pendingChanges": 1,
        "rejectedChanges": 0,
        "scopeCreep": 50.0
      }
    },
    "risk": {
      "health": "green",
      "score": 85,
      "details": {
        "totalRisks": 8,
        "highRisks": 1,
        "mediumRisks": 3,
        "lowRisks": 4,
        "openRisks": 4,
        "mitigatedRisks": 3
      }
    },
    "quality": {
      "health": "amber",
      "score": 70,
      "details": {
        "totalTasks": 50,
        "completedTasks": 25,
        "overdueTasksCount": 3,
        "overdueTasks": ["507f1f77bcf86cd799439011", ...],
        "averageTaskCompletionRate": 50.0,
        "defectRate": 0
      }
    }
  }
}
```

---

### POST `/api/projects/[id]/health`

**Description:** Force recalculation of project health

**Authentication:** Required (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Project health recalculated successfully",
  "data": { /* same as GET response */ }
}
```

**Error Response (403):**
```json
{
  "error": "Only administrators can recalculate project health"
}
```

---

## Methods Reference

### `ProjectHealthService.calculateHealthScore(projectId, orgId, forceRecalculate)`

**Parameters:**
- `projectId` (string): Project ObjectId
- `orgId` (string): Organization ID
- `forceRecalculate` (boolean): Skip cache and recalculate (default: false)

**Returns:** `Promise<HealthMetrics>`

**Behavior:**
- Checks cache age (6 hours)
- If cache is valid and `forceRecalculate` is false, returns cached data
- Otherwise, recalculates all metrics
- Updates project document with new health data
- Returns comprehensive health metrics

---

### `ProjectHealthService.getDetailedHealthMetrics(projectId, orgId)`

**Parameters:**
- `projectId` (string): Project ObjectId
- `orgId` (string): Organization ID

**Returns:** `Promise<HealthMetrics>`

**Behavior:**
Alias for `calculateHealthScore(projectId, orgId, false)` - uses cache if available.

---

### `ProjectHealthService.recalculateAllProjectHealth(orgId)`

**Parameters:**
- `orgId` (string): Organization ID

**Returns:** `Promise<number>` - Number of projects updated

**Behavior:**
Recalculates health for all active projects (status: planning, active, on_hold).

**Recommended Usage:**
Run via cron job nightly to keep health metrics fresh.

---

## Cron Job Recommendation

### Nightly Health Recalculation

**Frequency:** Daily at 2:00 AM

**Implementation Options:**

#### Option 1: Node-Cron (Simple)

Install:
```bash
npm install node-cron
```

Create `src/lib/cron/health-recalculation.ts`:
```typescript
import cron from 'node-cron'
import { ProjectHealthService } from '@/lib/services/project-health'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

// Run every night at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting nightly project health recalculation...')

  try {
    const db = await getDatabase()
    const orgsCollection = db.collection(COLLECTIONS.ORGANIZATIONS)

    // Get all active organizations
    const orgs = await orgsCollection.find({ isActive: true }).toArray()

    for (const org of orgs) {
      const updated = await ProjectHealthService.recalculateAllProjectHealth(
        org._id.toString()
      )
      console.log(`Updated ${updated} projects for org ${org.name}`)
    }

    console.log('Nightly health recalculation completed')
  } catch (error) {
    console.error('Error during nightly health recalculation:', error)
  }
})
```

Import in `src/app/api/cron/route.ts` or server startup file.

---

#### Option 2: Vercel Cron Jobs (Production)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/health-recalculation",
      "schedule": "0 2 * * *"
    }
  ]
}
```

Create `src/app/api/cron/health-recalculation/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ProjectHealthService } from '@/lib/services/project-health'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const orgsCollection = db.collection(COLLECTIONS.ORGANIZATIONS)

    const orgs = await orgsCollection.find({ isActive: true }).toArray()
    let totalUpdated = 0

    for (const org of orgs) {
      const updated = await ProjectHealthService.recalculateAllProjectHealth(
        org._id.toString()
      )
      totalUpdated += updated
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${totalUpdated} projects`,
    })
  } catch (error) {
    console.error('Error during health recalculation:', error)
    return NextResponse.json(
      { error: 'Health recalculation failed' },
      { status: 500 }
    )
  }
}
```

Add to `.env.local`:
```
CRON_SECRET=your-random-secret-here
```

---

## Performance Considerations

### Database Queries

Each health calculation performs:
- **1 query**: Fetch project
- **1 query**: Fetch all tasks
- **1-2 queries**: Fetch change requests (if collection exists)
- **1-2 queries**: Fetch risks (if collection exists)
- **1 update**: Save health metrics to project

**Total:** ~5-7 queries per project

### Optimization Tips

1. **Use caching**: The 6-hour cache significantly reduces database load
2. **Background recalculation**: Non-blocking updates don't delay API responses
3. **Nightly cron**: Ensures health is fresh without on-demand calculations
4. **Indexed queries**: Ensure indexes exist on:
   - `projects: { orgId: 1, isActive: 1, status: 1 }`
   - `project_tasks: { projectId: 1, status: 1, dueDate: 1 }`
   - `project_risks: { projectId: 1, orgId: 1, riskScore: 1, status: 1 }`
   - `project_change_requests: { projectId: 1, orgId: 1, status: 1 }`

---

## Frontend Integration Examples

### Display Health Badge

```typescript
import { Badge } from '@/components/ui/badge'

const HealthBadge = ({ health }: { health: ProjectHealth }) => {
  const colors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  }

  return (
    <Badge className={colors[health]}>
      {health.toUpperCase()}
    </Badge>
  )
}
```

### Fetch Health Data

```typescript
const fetchProjectHealth = async (projectId: string) => {
  const response = await fetch(`/api/projects/${projectId}/health`)
  const { data } = await response.json()
  return data
}
```

### Display Detailed Metrics

```typescript
const HealthDashboard = ({ projectId }: { projectId: string }) => {
  const [health, setHealth] = useState<HealthMetrics | null>(null)

  useEffect(() => {
    fetchProjectHealth(projectId).then(setHealth)
  }, [projectId])

  if (!health) return <Loading />

  return (
    <div className="grid grid-cols-5 gap-4">
      <MetricCard
        title="Schedule"
        health={health.schedule.health}
        score={health.schedule.score}
        details={health.schedule.details}
      />
      <MetricCard
        title="Budget"
        health={health.budget.health}
        score={health.budget.score}
        details={health.budget.details}
      />
      {/* ... other metrics */}
    </div>
  )
}
```

---

## Testing

### Manual Testing

1. **Create test project** with schedule and budget
2. **Add tasks** with due dates
3. **Create change requests** (if collection exists)
4. **Create risks** (if collection exists)
5. **Fetch health**: `GET /api/projects/[id]/health`
6. **Verify calculations** match algorithm
7. **Update project** (change progress, budget, etc.)
8. **Verify health recalculates** in background

### Unit Tests (Future)

Create `src/lib/services/__tests__/project-health.test.ts`:

```typescript
import { ProjectHealthService } from '../project-health'

describe('ProjectHealthService', () => {
  describe('calculateScheduleHealth', () => {
    it('should return green when ahead of schedule', async () => {
      const project = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        progress: 60,
      }
      // Time elapsed: 50%, Progress: 60% → Green
    })

    it('should return amber when slightly behind', async () => {
      // Time elapsed: 50%, Progress: 45% → Amber
    })

    it('should return red when significantly behind', async () => {
      // Time elapsed: 50%, Progress: 30% → Red
    })
  })

  // ... more tests
})
```

---

## Troubleshooting

### Health always shows "green" with score 100

**Cause:** Missing schedule, budget, or task data

**Solution:** Ensure projects have:
- `startDate` and `endDate` (or `plannedStartDate`/`plannedEndDate`)
- `budget` and `usedBudget` values
- Tasks with due dates

---

### Health not updating after changes

**Cause:** Cache not invalidated

**Solution:**
- Force recalculation: `POST /api/projects/[id]/health`
- Check if changed fields are in `significantFields` list in `updateProject`

---

### Cron job not running

**Cause:** Cron not registered or secret mismatch

**Solution:**
- Verify `vercel.json` configuration
- Check `CRON_SECRET` environment variable
- Test endpoint manually with Bearer token

---

## Future Enhancements

1. **Quality Metrics:**
   - Track defects/bugs via issue tracking
   - Measure test coverage
   - Monitor code quality metrics

2. **Predictive Analytics:**
   - Machine learning to predict project outcomes
   - Early warning system for at-risk projects
   - Trend analysis over time

3. **Customizable Weights:**
   - Allow organizations to customize category weights
   - Per-project health calculation rules
   - Custom health thresholds

4. **Health History:**
   - Track health changes over time
   - Generate health trend charts
   - Compare projects by health

5. **Automated Alerts:**
   - Email notifications when health degrades
   - Slack/Teams integration
   - Escalation rules

---

## Summary

The Project Health Score system provides:

✅ **Automated health assessment** across 5 dimensions
✅ **Intelligent caching** (6-hour cache)
✅ **Background recalculation** on significant changes
✅ **Comprehensive metrics** with detailed breakdowns
✅ **RESTful API** for easy integration
✅ **Graceful degradation** when data is missing
✅ **Production-ready** with cron job support

**Next Steps:**
1. Deploy changes to production
2. Set up nightly cron job
3. Create frontend health dashboard
4. Monitor performance and adjust cache duration if needed
