# Deskwise ITSM - Project Management Module Uplift Plan (Part 3 - Final)

**Continued from PROJECT_MANAGEMENT_UPLIFT_PLAN_PART2.md**

---

## 12. Migration Plan

### 12.1 Current Data Inventory

**Existing Collections:**
- `projects` (current schema)
- `project_tasks` (current schema)
- `project_milestones` (collection exists, NO data)

**Data Quality Assessment:**
```typescript
export class DataMigrationAssessmentService {
  static async assessCurrentData(orgId: string) {
    const projects = await db.collection('projects').find({ orgId }).toArray()
    const tasks = await db.collection('project_tasks').find({ orgId }).toArray()

    const assessment = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.isActive).length,
        withBudget: projects.filter(p => p.budget != null).length,
        withClient: projects.filter(p => p.clientId != null).length,
        withTasks: projects.filter(p =>
          tasks.some(t => t.projectId === p._id.toString())
        ).length,

        issues: {
          missingFields: projects.filter(p =>
            !p.projectNumber || !p.name || !p.projectManager
          ),
          invalidDates: projects.filter(p =>
            p.endDate < p.startDate
          ),
          negativeBudget: projects.filter(p =>
            p.usedBudget > p.budget
          )
        }
      },

      tasks: {
        total: tasks.length,
        withDependencies: tasks.filter(t => t.dependencies?.length > 0).length,
        completed: tasks.filter(t => t.status === 'completed').length,
        orphaned: tasks.filter(t =>
          !projects.some(p => p._id.toString() === t.projectId)
        ).length
      }
    }

    return assessment
  }
}
```

### 12.2 Migration Strategy

**Phased Approach (Non-Breaking):**

**Phase 1: Schema Enhancement (Week 1)**
- Add new optional fields to existing schemas
- No data transformation yet
- Backward compatible

```typescript
// Migration Script 1: Add new fields
export async function migration_001_enhance_project_schema() {
  await db.collection('projects').updateMany(
    {},
    {
      $set: {
        // New fields with default values
        stage: 'execution', // Assume active projects are in execution
        health: 'green', // Default to green, will recalculate
        methodology: 'waterfall', // Default methodology
        type: 'internal' // Default type
      }
    }
  )

  // Add indexes for new fields
  await db.collection('projects').createIndex({ stage: 1, orgId: 1 })
  await db.collection('projects').createIndex({ health: 1, orgId: 1 })
  await db.collection('projects').createIndex({ portfolioId: 1, orgId: 1 })

  console.log('✅ Project schema enhanced')
}
```

**Phase 2: New Collections Creation (Week 1)**
- Create new supporting collections
- Populate with seed data where applicable

```typescript
// Migration Script 2: Create new collections
export async function migration_002_create_new_collections() {
  const newCollections = [
    'portfolios',
    'project_resources',
    'project_risks',
    'project_issues',
    'project_decisions',
    'project_assumptions',
    'project_documents',
    'project_time_entries',
    'project_change_requests',
    'project_gate_reviews',
    'project_templates',
    'project_audit_logs'
  ]

  for (const collectionName of newCollections) {
    const exists = await db.listCollections({ name: collectionName }).hasNext()
    if (!exists) {
      await db.createCollection(collectionName)
      console.log(`✅ Created collection: ${collectionName}`)
    }
  }

  // Create indexes for new collections
  await this.createIndexes()
}
```

**Phase 3: Data Transformation (Week 2)**
- Migrate existing data to new structures
- Calculate derived fields
- Preserve original data

```typescript
// Migration Script 3: Transform project data
export async function migration_003_transform_project_data() {
  const projects = await db.collection('projects').find({}).toArray()

  for (const project of projects) {
    const updates: any = {}

    // Calculate health score
    updates.health = await calculateProjectHealth(project)

    // Determine current stage based on status
    updates.stage = mapStatusToStage(project.status)

    // Rename date fields (copy to new, keep old for compatibility)
    updates.plannedStartDate = project.startDate
    updates.plannedEndDate = project.endDate

    // Initialize EVM if budget exists
    if (project.budget) {
      updates.evm = await calculateInitialEVM(project)
    }

    // Create default portfolio if none exists
    if (!project.portfolioId) {
      const defaultPortfolio = await getOrCreateDefaultPortfolio(project.orgId)
      updates.portfolioId = defaultPortfolio._id
    }

    await db.collection('projects').updateOne(
      { _id: project._id },
      { $set: updates }
    )

    console.log(`✅ Migrated project: ${project.projectNumber}`)
  }
}

function mapStatusToStage(status: ProjectStatus): ProjectStage {
  const mapping = {
    'draft': 'pre_initiation',
    'pending_approval': 'initiation',
    'approved': 'planning',
    'planning': 'planning',
    'active': 'execution',
    'on_hold': 'execution', // Still in execution, just paused
    'completed': 'closure',
    'cancelled': 'closure',
    'closed': 'closure'
  }
  return mapping[status] || 'execution'
}
```

**Phase 4: Task Enhancement (Week 2)**
- Enhance task data with new fields
- Calculate WBS codes
- Identify critical path

```typescript
// Migration Script 4: Enhance tasks
export async function migration_004_enhance_tasks() {
  const projects = await db.collection('projects').find({}).toArray()

  for (const project of projects) {
    const tasks = await db.collection('project_tasks').find({
      projectId: project._id.toString()
    }).toArray()

    // Generate WBS codes
    const tasksWithWBS = generateWBSCodes(tasks)

    // Calculate critical path
    const criticalPath = calculateCriticalPath(tasksWithWBS)

    for (let i = 0; i < tasksWithWBS.length; i++) {
      const task = tasksWithWBS[i]

      await db.collection('project_tasks').updateOne(
        { _id: task._id },
        {
          $set: {
            taskNumber: `TSK-${String(i + 1).padStart(3, '0')}`,
            wbsCode: task.wbsCode,
            level: task.level,
            isCriticalPath: criticalPath.includes(task._id.toString()),
            // Convert dependencies array to new structure
            dependencies: task.dependencies.map(depId => ({
              taskId: depId,
              type: 'finish_to_start',
              lag: 0
            }))
          }
        }
      )
    }

    console.log(`✅ Enhanced ${tasks.length} tasks for ${project.projectNumber}`)
  }
}

function generateWBSCodes(tasks: ProjectTask[]): ProjectTask[] {
  // Simple WBS: group by parent, assign sequential codes
  const rootTasks = tasks.filter(t => !t.parentTaskId)
  let wbsIndex = 1

  const processTask = (task: ProjectTask, parentCode: string = '') => {
    const code = parentCode ? `${parentCode}.${wbsIndex}` : `${wbsIndex}`
    task.wbsCode = code
    task.level = parentCode.split('.').length
    wbsIndex++

    // Process children
    const children = tasks.filter(t => t.parentTaskId === task._id.toString())
    let childIndex = 1
    for (const child of children) {
      processTask(child, code)
      childIndex++
    }
    wbsIndex = 1 // Reset for siblings
  }

  rootTasks.forEach(task => processTask(task))
  return tasks
}
```

**Phase 5: Create Default Milestones (Week 3)**
- For existing projects without milestones, create standard set

```typescript
// Migration Script 5: Create default milestones
export async function migration_005_create_default_milestones() {
  const projects = await db.collection('projects').find({
    status: { $in: ['active', 'planning'] } // Only active/planning projects
  }).toArray()

  for (const project of projects) {
    const existingMilestones = await db.collection('project_milestones').countDocuments({
      projectId: project._id.toString()
    })

    if (existingMilestones === 0) {
      // Create standard milestone set based on stage
      const milestones = generateStandardMilestones(project)

      await db.collection('project_milestones').insertMany(
        milestones.map(m => ({
          ...m,
          projectId: project._id.toString(),
          orgId: project.orgId,
          createdBy: 'migration_system',
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      )

      console.log(`✅ Created ${milestones.length} milestones for ${project.projectNumber}`)
    }
  }
}

function generateStandardMilestones(project: Project) {
  const duration = differenceInDays(project.plannedEndDate, project.plannedStartDate)
  const milestones = []

  if (project.stage === 'planning' || project.stage === 'pre_initiation') {
    milestones.push({
      name: 'Planning Complete',
      description: 'All planning artifacts completed and approved',
      type: 'gate',
      isGate: true,
      gateType: 'planning',
      plannedDate: addDays(project.plannedStartDate, Math.floor(duration * 0.2)),
      status: 'planned',
      approvalRequired: true,
      progressWeight: 20
    })
  }

  milestones.push({
    name: 'Mid-Project Review',
    description: 'Halfway checkpoint',
    type: 'gate',
    isGate: false,
    plannedDate: addDays(project.plannedStartDate, Math.floor(duration * 0.5)),
    status: 'planned',
    approvalRequired: false,
    progressWeight: 30
  })

  milestones.push({
    name: 'Delivery Complete',
    description: 'All deliverables completed',
    type: 'deliverable',
    isGate: false,
    plannedDate: addDays(project.plannedStartDate, Math.floor(duration * 0.9)),
    status: 'planned',
    approvalRequired: false,
    progressWeight: 40
  })

  milestones.push({
    name: 'Project Closure',
    description: 'Formal project closure and handover',
    type: 'gate',
    isGate: true,
    gateType: 'closure',
    plannedDate: project.plannedEndDate,
    status: 'planned',
    approvalRequired: true,
    progressWeight: 10
  })

  return milestones
}
```

**Phase 6: Rollback Plan (Safety Net)**
- Keep original data intact during migration
- Create rollback scripts

```typescript
// Rollback strategy: Store original state
export async function migration_000_backup_original_data() {
  // Create backup collections
  const collections = ['projects', 'project_tasks']

  for (const collName of collections) {
    const backupName = `${collName}_backup_pre_migration`

    // Check if backup already exists
    const exists = await db.listCollections({ name: backupName }).hasNext()
    if (exists) {
      console.log(`⚠️ Backup ${backupName} already exists, skipping`)
      continue
    }

    // Copy collection
    const docs = await db.collection(collName).find({}).toArray()
    await db.collection(backupName).insertMany(docs)

    console.log(`✅ Backed up ${docs.length} documents from ${collName}`)
  }

  // Store migration metadata
  await db.collection('migration_metadata').insertOne({
    version: '1.0',
    startedAt: new Date(),
    status: 'in_progress',
    backupCollections: collections.map(c => `${c}_backup_pre_migration`)
  })
}

// Rollback function
export async function rollback_migration() {
  const metadata = await db.collection('migration_metadata').findOne({
    version: '1.0'
  })

  if (!metadata) {
    throw new Error('No migration metadata found')
  }

  // Restore from backups
  for (const backupName of metadata.backupCollections) {
    const originalName = backupName.replace('_backup_pre_migration', '')

    // Delete current collection
    await db.collection(originalName).drop()

    // Restore from backup
    const backupDocs = await db.collection(backupName).find({}).toArray()
    if (backupDocs.length > 0) {
      await db.collection(originalName).insertMany(backupDocs)
    }

    console.log(`✅ Rolled back ${originalName} from ${backupName}`)
  }

  // Update metadata
  await db.collection('migration_metadata').updateOne(
    { _id: metadata._id },
    {
      $set: {
        status: 'rolled_back',
        rolledBackAt: new Date()
      }
    }
  )

  console.log('✅ Migration rolled back successfully')
}
```

### 12.3 Backward Compatibility

**API Compatibility Layer:**
```typescript
// Ensure existing API routes continue to work
export class BackwardCompatibilityService {
  // Map old field names to new field names
  static mapLegacyFields(project: any) {
    return {
      ...project,
      // Old fields (keep for compatibility)
      startDate: project.plannedStartDate || project.startDate,
      endDate: project.plannedEndDate || project.endDate,
      // New fields
      plannedStartDate: project.plannedStartDate,
      plannedEndDate: project.plannedEndDate
    }
  }

  // Accept both old and new field names in input
  static normalizeLegacyInput(input: any) {
    const normalized = { ...input }

    if (input.startDate && !input.plannedStartDate) {
      normalized.plannedStartDate = input.startDate
    }

    if (input.endDate && !input.plannedEndDate) {
      normalized.plannedEndDate = input.endDate
    }

    return normalized
  }
}

// Use in API routes
export async function PUT(req: NextRequest, { params }) {
  const body = await req.json()

  // Normalize legacy field names
  const normalized = BackwardCompatibilityService.normalizeLegacyInput(body)

  // Update project
  const updated = await ProjectService.updateProject(params.id, orgId, normalized)

  // Map response to include legacy fields
  const response = BackwardCompatibilityService.mapLegacyFields(updated)

  return NextResponse.json({ success: true, data: response })
}
```

### 12.4 Feature Flags

**Gradual Rollout:**
```typescript
export interface FeatureFlags {
  orgId: string
  features: {
    // Portfolio management
    portfoliosEnabled: boolean

    // Enhanced project features
    milestonesEnabled: boolean
    gateReviewsEnabled: boolean
    evmEnabled: boolean

    // RAID
    raidEnabled: boolean

    // Resource management
    resourcePlanningEnabled: boolean

    // New UI views
    ganttViewEnabled: boolean
    kanbanViewEnabled: boolean

    // AI features
    aiSchedulingEnabled: boolean
    aiRiskPredictionEnabled: boolean

    // MSP features
    clientPortfoliosEnabled: boolean
    crossClientReportingEnabled: boolean
  }
}

export class FeatureFlagService {
  static async isEnabled(orgId: string, feature: keyof FeatureFlags['features']) {
    const flags = await db.collection('feature_flags').findOne({ orgId })

    if (!flags) {
      // Default: all features disabled for safety
      return false
    }

    return flags.features[feature] === true
  }

  static async enableFeature(orgId: string, feature: string) {
    await db.collection('feature_flags').updateOne(
      { orgId },
      {
        $set: { [`features.${feature}`]: true }
      },
      { upsert: true }
    )
  }

  static async enableAllFeatures(orgId: string) {
    const allFeatures = {
      portfoliosEnabled: true,
      milestonesEnabled: true,
      gateReviewsEnabled: true,
      evmEnabled: true,
      raidEnabled: true,
      resourcePlanningEnabled: true,
      ganttViewEnabled: true,
      kanbanViewEnabled: true,
      aiSchedulingEnabled: true,
      aiRiskPredictionEnabled: true,
      clientPortfoliosEnabled: true,
      crossClientReportingEnabled: true
    }

    await db.collection('feature_flags').updateOne(
      { orgId },
      { $set: { features: allFeatures } },
      { upsert: true }
    )
  }
}

// Usage in components
export function ProjectDetailPage({ projectId }) {
  const { data: project } = useProject(projectId)
  const milestonesEnabled = useFeatureFlag('milestonesEnabled')
  const ganttEnabled = useFeatureFlag('ganttViewEnabled')

  return (
    <div>
      {/* Standard tabs */}
      <Tabs>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>

          {/* Conditional tabs based on feature flags */}
          {milestonesEnabled && (
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          )}

          {ganttEnabled && (
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  )
}
```

### 12.5 Migration Timeline

**Week-by-Week Plan:**

| Week | Phase | Activities | Validation |
|------|-------|-----------|------------|
| **Week 1** | Preparation | - Backup all data<br>- Create new collections<br>- Add new optional fields | - Verify backups<br>- Test rollback<br>- No user impact |
| **Week 2** | Data Transform | - Run migration scripts<br>- Transform existing data<br>- Generate WBS codes | - Data quality checks<br>- Compare before/after<br>- Verify no data loss |
| **Week 3** | Milestones | - Create default milestones<br>- Populate RAID templates<br>- Create portfolios | - Verify milestone logic<br>- Test gate workflows |
| **Week 4** | Testing | - UAT with select users<br>- Performance testing<br>- Integration testing | - User acceptance<br>- Performance benchmarks<br>- API compatibility |
| **Week 5** | Rollout Start | - Enable features for pilot orgs<br>- Monitor closely<br>- Gather feedback | - Error monitoring<br>- User feedback<br>- Support tickets |
| **Week 6** | Full Rollout | - Enable for all orgs<br>- Announce new features<br>- Training materials | - Adoption metrics<br>- User satisfaction<br>- System stability |

---

## 13. Testing Strategy

### 13.1 Unit Testing

**Service Layer Tests:**
```typescript
// tests/services/project.service.test.ts
import { ProjectService } from '@/lib/services/projects'
import { MongoMemoryServer } from 'mongodb-memory-server'

describe('ProjectService', () => {
  let mongoServer: MongoMemoryServer

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    // Connect to in-memory MongoDB
  })

  afterAll(async () => {
    await mongoServer.stop()
  })

  describe('createProject', () => {
    it('should generate sequential project numbers', async () => {
      const project1 = await ProjectService.createProject({
        name: 'Project 1',
        orgId: 'org_123',
        // ... other fields
      }, 'user_123')

      expect(project1.projectNumber).toBe('PRJ-0001')

      const project2 = await ProjectService.createProject({
        name: 'Project 2',
        orgId: 'org_123'
      }, 'user_123')

      expect(project2.projectNumber).toBe('PRJ-0002')
    })

    it('should enforce required fields', async () => {
      await expect(
        ProjectService.createProject({
          name: '', // Empty name
          orgId: 'org_123'
        }, 'user_123')
      ).rejects.toThrow('Project name is required')
    })

    it('should validate date ranges', async () => {
      await expect(
        ProjectService.createProject({
          name: 'Test',
          orgId: 'org_123',
          plannedStartDate: new Date('2025-06-01'),
          plannedEndDate: new Date('2025-01-01') // End before start!
        }, 'user_123')
      ).rejects.toThrow('End date must be after start date')
    })
  })

  describe('calculateProjectProgress', () => {
    it('should calculate progress from completed tasks', async () => {
      const project = await createTestProject()

      await createTestTask(project._id, { status: 'completed' })
      await createTestTask(project._id, { status: 'completed' })
      await createTestTask(project._id, { status: 'in_progress' })
      await createTestTask(project._id, { status: 'todo' })

      const progress = await ProjectService.calculateProgress(project._id)

      expect(progress).toBe(50) // 2 of 4 tasks completed
    })

    it('should handle projects with no tasks', async () => {
      const project = await createTestProject()

      const progress = await ProjectService.calculateProgress(project._id)

      expect(progress).toBe(0)
    })
  })

  describe('calculateHealthScore', () => {
    it('should return green for on-track project', async () => {
      const project = await createTestProject({
        progress: 50,
        plannedEndDate: addDays(new Date(), 60),
        usedBudget: 40000,
        budget: 100000
      })

      const health = await ProjectService.calculateHealthScore(project)

      expect(health).toBe('green')
    })

    it('should return red for overrun project', async () => {
      const project = await createTestProject({
        progress: 30,
        plannedEndDate: addDays(new Date(), 7), // 7 days left
        usedBudget: 95000,
        budget: 100000
      })

      const health = await ProjectService.calculateHealthScore(project)

      expect(health).toBe('red') // Behind schedule and over budget
    })
  })
})
```

**Critical Path Calculation Tests:**
```typescript
describe('CriticalPathService', () => {
  it('should identify critical path correctly', async () => {
    // Task graph:
    // A (5d) → C (3d) → E (2d)  = 10 days (critical)
    // B (4d) → D (2d) ↗         = 6 days

    const tasks = [
      { id: 'A', duration: 5, dependencies: [] },
      { id: 'B', duration: 4, dependencies: [] },
      { id: 'C', duration: 3, dependencies: ['A'] },
      { id: 'D', duration: 2, dependencies: ['B'] },
      { id: 'E', duration: 2, dependencies: ['C', 'D'] }
    ]

    const criticalPath = CriticalPathService.calculate(tasks)

    expect(criticalPath).toEqual(['A', 'C', 'E'])
    expect(criticalPath.totalDuration).toBe(10)
  })

  it('should calculate slack time for non-critical tasks', async () => {
    const tasks = [
      { id: 'A', duration: 5, dependencies: [] },
      { id: 'B', duration: 2, dependencies: [] },
      { id: 'C', duration: 3, dependencies: ['A', 'B'] }
    ]

    const analysis = CriticalPathService.analyze(tasks)

    expect(analysis.tasks.find(t => t.id === 'A').slack).toBe(0) // Critical
    expect(analysis.tasks.find(t => t.id === 'B').slack).toBe(3) // 3 days slack
  })
})
```

### 13.2 Integration Testing

**API Integration Tests:**
```typescript
// tests/api/projects.test.ts
import { testApiHandler } from 'next-test-api-route-handler'
import * as projectsHandler from '@/app/api/projects/route'

describe('/api/projects', () => {
  let testSession: any

  beforeEach(async () => {
    // Create test user and session
    testSession = await createTestSession({
      userId: 'user_123',
      orgId: 'org_123',
      permissions: ['projects.view.all', 'projects.create']
    })
  })

  describe('GET /api/projects', () => {
    it('should return projects for authorized user', async () => {
      await testApiHandler({
        handler: projectsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: {
              cookie: testSession.cookie
            }
          })

          expect(res.status).toBe(200)
          const data = await res.json()
          expect(data.success).toBe(true)
          expect(Array.isArray(data.data)).toBe(true)
        }
      })
    })

    it('should return 401 for unauthenticated request', async () => {
      await testApiHandler({
        handler: projectsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({ method: 'GET' })
          expect(res.status).toBe(401)
        }
      })
    })

    it('should return 403 for user without permission', async () => {
      const unauthorizedSession = await createTestSession({
        userId: 'user_456',
        orgId: 'org_123',
        permissions: [] // No permissions
      })

      await testApiHandler({
        handler: projectsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: { cookie: unauthorizedSession.cookie }
          })
          expect(res.status).toBe(403)
        }
      })
    })
  })

  describe('POST /api/projects', () => {
    it('should create project with valid input', async () => {
      await testApiHandler({
        handler: projectsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: testSession.cookie
            },
            body: JSON.stringify({
              name: 'Test Project',
              description: 'Test description',
              plannedStartDate: '2025-02-01',
              plannedEndDate: '2025-06-30',
              budget: 50000
            })
          })

          expect(res.status).toBe(201)
          const data = await res.json()
          expect(data.success).toBe(true)
          expect(data.data.projectNumber).toMatch(/PRJ-\d{4}/)
        }
      })
    })

    it('should validate required fields', async () => {
      await testApiHandler({
        handler: projectsHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              cookie: testSession.cookie
            },
            body: JSON.stringify({
              // Missing name
              description: 'Test'
            })
          })

          expect(res.status).toBe(400)
          const data = await res.json()
          expect(data.error).toContain('name')
        }
      })
    })
  })
})
```

### 13.3 End-to-End Testing

**User Flow Tests (Playwright):**
```typescript
// tests/e2e/project-creation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Project Creation Flow', () => {
  test('should create project from template', async ({ page }) => {
    // Login
    await page.goto('http://localhost:9002/auth/signin')
    await page.fill('input[name="email"]', 'testuser@test.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Navigate to projects
    await page.goto('http://localhost:9002/projects')

    // Click new project
    await page.click('button:has-text("New Project")')

    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Project')
    await page.fill('textarea[name="description"]', 'Created by E2E test')

    // Select template
    await page.click('select[name="templateId"]')
    await page.selectOption('select[name="templateId"]', { label: 'Standard IT Project' })

    // Set dates
    await page.fill('input[name="plannedStartDate"]', '2025-03-01')
    await page.fill('input[name="plannedEndDate"]', '2025-08-31')

    // Set budget
    await page.fill('input[name="budget"]', '100000')

    // Submit
    await page.click('button:has-text("Create Project")')

    // Verify redirect to project detail
    await expect(page).toHaveURL(/\/projects\/PRJ-\d{4}/)

    // Verify project created
    await expect(page.locator('h1')).toContainText('E2E Test Project')

    // Verify tasks from template were created
    await page.click('a:has-text("Tasks")')
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="task-row"]')).toHaveCount(10) // Assuming template has 10 tasks
  })

  test('should move task through workflow', async ({ page }) => {
    // Setup: Create project and task
    const { project, task } = await createTestProjectAndTask()

    // Navigate to project
    await page.goto(`http://localhost:9002/projects/${project.projectNumber}`)

    // Click on task
    await page.click(`[data-task-id="${task._id}"]`)

    // Task detail panel opens
    await expect(page.locator('[data-testid="task-detail-panel"]')).toBeVisible()

    // Change status from "To Do" to "In Progress"
    await page.click('select[name="status"]')
    await page.selectOption('select[name="status"]', 'in_progress')

    // Verify status changed
    await expect(page.locator('[data-testid="task-status-badge"]')).toHaveText('In Progress')

    // Start timer
    await page.click('button:has-text("Start Timer")')
    await expect(page.locator('[data-testid="timer-running"]')).toBeVisible()

    // Wait 2 seconds
    await page.waitForTimeout(2000)

    // Stop timer
    await page.click('button:has-text("Stop Timer")')

    // Verify time logged
    await expect(page.locator('[data-testid="time-logged"]')).toContainText('00:00:02')

    // Mark complete
    await page.click('select[name="status"]')
    await page.selectOption('select[name="status"]', 'completed')

    // Verify completion timestamp
    await expect(page.locator('[data-testid="completed-at"]')).toBeVisible()

    // Verify project progress updated
    const progressBar = page.locator('[data-testid="project-progress"]')
    const progressText = await progressBar.textContent()
    expect(parseInt(progressText!)).toBeGreaterThan(0)
  })
})
```

### 13.4 Performance Testing

**Load Testing (k6):**
```javascript
// tests/load/project-api.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 0 }    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01']    // Error rate should be below 1%
  }
}

export default function () {
  // Login
  const loginRes = http.post('http://localhost:9002/api/auth/signin', {
    email: 'testuser@test.com',
    password: 'password123'
  })

  check(loginRes, {
    'login successful': (r) => r.status === 200
  })

  const authToken = loginRes.json('token')

  // Get projects list
  const projectsRes = http.get('http://localhost:9002/api/projects', {
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  })

  check(projectsRes, {
    'projects list loaded': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500
  })

  sleep(1)

  // Get project detail
  const projects = projectsRes.json('data')
  if (projects.length > 0) {
    const projectId = projects[0]._id

    const detailRes = http.get(`http://localhost:9002/api/projects/${projectId}?include=tasks,milestones,budget`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    })

    check(detailRes, {
      'project detail loaded': (r) => r.status === 200,
      'includes all data': (r) => {
        const data = r.json('data')
        return data.tasks && data.milestones && data.budget
      }
    })
  }

  sleep(1)
}
```

### 13.5 Test Data Seeding

**Seed Script:**
```typescript
// scripts/seed-test-projects.ts
export async function seedTestProjects(orgId: string) {
  const testData = {
    users: [
      { email: 'pm1@test.com', name: 'John PM', role: 'project_manager' },
      { email: 'tech1@test.com', name: 'Sarah Tech', role: 'technician' },
      { email: 'tech2@test.com', name: 'Mike Tech', role: 'technician' }
    ],

    clients: [
      { name: 'Acme Corp', status: 'active' },
      { name: 'TechStart Inc', status: 'active' }
    ],

    portfolios: [
      { name: 'Digital Transformation 2025', type: 'strategic' },
      { name: 'Infrastructure Upgrades', type: 'operational' }
    ],

    projectTemplates: [
      {
        name: 'Standard IT Project',
        tasks: [
          { title: 'Requirements Gathering', estimatedHours: 40 },
          { title: 'Design', estimatedHours: 80, dependencies: ['1'] },
          { title: 'Development', estimatedHours: 160, dependencies: ['2'] },
          { title: 'Testing', estimatedHours: 80, dependencies: ['3'] },
          { title: 'Deployment', estimatedHours: 40, dependencies: ['4'] }
        ]
      }
    ]
  }

  // Create users
  const createdUsers = await Promise.all(
    testData.users.map(u => createTestUser({ ...u, orgId }))
  )

  // Create clients
  const createdClients = await Promise.all(
    testData.clients.map(c => createTestClient({ ...c, orgId }))
  )

  // Create portfolios
  const createdPortfolios = await Promise.all(
    testData.portfolios.map(p => createTestPortfolio({ ...p, orgId }))
  )

  // Create projects
  const projects = [
    {
      name: 'Website Redesign',
      portfolioId: createdPortfolios[0]._id,
      clientId: createdClients[0]._id,
      projectManager: createdUsers[0]._id,
      teamMembers: [createdUsers[1]._id, createdUsers[2]._id],
      plannedStartDate: new Date('2025-02-01'),
      plannedEndDate: new Date('2025-06-30'),
      budget: 50000,
      status: 'active',
      progress: 35
    },
    {
      name: 'ERP Upgrade',
      portfolioId: createdPortfolios[1]._id,
      clientId: createdClients[1]._id,
      projectManager: createdUsers[0]._id,
      teamMembers: [createdUsers[1]._id],
      plannedStartDate: new Date('2025-01-15'),
      plannedEndDate: new Date('2025-12-31'),
      budget: 200000,
      status: 'active',
      progress: 68
    }
  ]

  const createdProjects = await Promise.all(
    projects.map(p => ProjectService.createProject(p, createdUsers[0]._id))
  )

  console.log(`✅ Seeded ${createdProjects.length} test projects`)

  return {
    users: createdUsers,
    clients: createdClients,
    portfolios: createdPortfolios,
    projects: createdProjects
  }
}
```

---

## 14. Implementation Roadmap

### 14.1 Phased Rollout (6 Months)

```
┌─────────────────────────────────────────────────────────────────────┐
│                   IMPLEMENTATION TIMELINE                            │
└─────────────────────────────────────────────────────────────────────┘

PHASE 1: FOUNDATION (Months 1-2)
├─ Week 1-2: Database & Schema
│  ├─ Create new collections
│  ├─ Add indexes
│  ├─ Migration scripts
│  └─ Rollback procedures
│
├─ Week 3-4: RBAC Enhancement
│  ├─ New project permissions
│  ├─ API middleware updates
│  ├─ Permission checks in all routes
│  └─ Testing RBAC enforcement
│
├─ Week 5-6: Core Enhancements
│  ├─ Milestone CRUD (complete implementation)
│  ├─ Enhanced task management
│  ├─ Project health calculation
│  └─ Progress tracking improvements
│
└─ Week 7-8: Integration - Phase 1
   ├─ Project-Ticket linking
   ├─ Time tracking integration
   └─ Basic reporting

DELIVERABLES:
✓ Database migrations complete
✓ RBAC fully enforced
✓ Milestones functional
✓ Ticket integration working

────────────────────────────────────────────────────────────────────

PHASE 2: PLANNING & SCHEDULING (Months 3-4)
├─ Week 9-10: Resource Management
│  ├─ Resource allocation CRUD
│  ├─ Capacity planning
│  ├─ Skill matching
│  └─ Utilization dashboard
│
├─ Week 11-12: Advanced Scheduling
│  ├─ Dependency management
│  ├─ Critical path calculation
│  ├─ Gantt chart component
│  └─ Timeline visualization
│
├─ Week 13-14: Kanban & Views
│  ├─ Kanban board component
│  ├─ View switching
│  ├─ Drag-and-drop
│  └─ WIP limits
│
└─ Week 15-16: Portfolio Management
   ├─ Portfolio CRUD
   ├─ Portfolio analytics
   ├─ Prioritization
   └─ Balancing algorithms

DELIVERABLES:
✓ Resource planner working
✓ Gantt & Kanban views
✓ Portfolio management
✓ Critical path analysis

────────────────────────────────────────────────────────────────────

PHASE 3: GOVERNANCE & FINANCIALS (Month 5)
├─ Week 17-18: RAID & Gates
│  ├─ Risk register
│  ├─ Issue tracking
│  ├─ Decision log
│  ├─ Assumptions log
│  ├─ Gate review workflow
│  └─ Approval workflows
│
└─ Week 19-20: Financial Management
   ├─ Budget tracking enhancements
   ├─ EVM calculation
   ├─ Forecast & variance
   ├─ Invoice generation
   └─ Profitability analysis

DELIVERABLES:
✓ Full RAID register
✓ Gate reviews working
✓ EVM implemented
✓ Billing integration

────────────────────────────────────────────────────────────────────

PHASE 4: AI, MSP & POLISH (Month 6)
├─ Week 21-22: AI Features
│  ├─ AI scheduling
│  ├─ Risk prediction
│  ├─ Scope impact analysis
│  ├─ Status report generation
│  └─ Smart notifications
│
├─ Week 23: MSP Features
│  ├─ Client portfolios
│  ├─ Contract awareness
│  ├─ Cross-client reporting
│  └─ Client portal views
│
└─ Week 24: Final Polish
   ├─ Performance optimization
   ├─ Mobile responsiveness
   ├─ Accessibility audit
   ├─ Documentation
   ├─ Training materials
   └─ Launch preparation

DELIVERABLES:
✓ AI features live
✓ MSP capabilities
✓ Performance optimized
✓ Ready for production
```

### 14.2 Sprint Breakdown (Example - Phase 1, Sprint 1)

**Sprint 1 (Weeks 1-2): Database Foundation**

**Sprint Goal:** Complete database schema enhancements and migration infrastructure

**User Stories:**
1. **As a developer**, I need new database collections created so that new features can store data
   - Acceptance: All 12 new collections exist with proper indexes
   - Story Points: 3

2. **As a developer**, I need migration scripts that safely transform existing project data
   - Acceptance: Migration script runs without errors, data integrity verified
   - Story Points: 8

3. **As a developer**, I need a rollback mechanism in case migration fails
   - Acceptance: Rollback script restores original data completely
   - Story Points: 5

4. **As a project manager**, I need my existing projects to continue working during migration
   - Acceptance: No downtime, all existing APIs work as before
   - Story Points: 5

**Tasks:**
- [ ] Design new schema for all new collections (2h)
- [ ] Write collection creation script (4h)
- [ ] Create database indexes (2h)
- [ ] Write backup/restore scripts (6h)
- [ ] Write migration script for projects (8h)
- [ ] Write migration script for tasks (6h)
- [ ] Write data validation script (4h)
- [ ] Test migration on copy of production data (4h)
- [ ] Write rollback script (6h)
- [ ] Test rollback (2h)
- [ ] Document migration process (2h)
- [ ] Code review (2h)

**Total Estimated: 48 hours (~ 2 weeks for 1 developer at 50% allocation)**

### 14.3 Resource Allocation

**Team Composition:**
- **1 Lead Developer** (full-time)
- **1 Backend Developer** (full-time)
- **1 Frontend Developer** (full-time)
- **1 UX Designer** (part-time, 50%)
- **1 QA Engineer** (part-time, 50%)
- **1 Technical Writer** (part-time, 25%)

**Phase Allocation:**
| Phase | Lead Dev | Backend | Frontend | UX | QA | Writer |
|-------|----------|---------|----------|----|----|--------|
| 1 (Foundation) | 100% | 100% | 50% | 50% | 50% | 0% |
| 2 (Planning) | 100% | 75% | 100% | 75% | 50% | 0% |
| 3 (Governance) | 100% | 100% | 50% | 25% | 75% | 25% |
| 4 (AI & MSP) | 100% | 100% | 75% | 50% | 75% | 50% |

### 14.4 Dependency Management

**External Dependencies:**
- MongoDB Atlas (existing)
- Next.js 15 (existing)
- Google Gemini API (existing)
- S3 storage (existing)
- No new external services needed ✅

**Internal Dependencies:**
- RBAC system must be complete before advanced features
- Migration must complete before new UI can launch
- Time tracking integration needed for billing features
- Ticket integration needed for project workflow

**Mitigation:**
- Use feature flags to decouple dependencies where possible
- Build API layer first, UI can follow
- Run migration in phases to reduce risk

---

## 15. Success Metrics & KPIs

### 15.1 Adoption Metrics

**User Adoption:**
- % of projects using new features (milestones, RAID, etc.)
  - Target: 80% within 3 months
- % of PMs using Gantt/Kanban views
  - Target: 60% weekly active users
- % of organizations with portfolios created
  - Target: 70% of orgs with 5+ projects
- Average time to create first project from template
  - Target: < 5 minutes

**Feature Usage:**
- Gate reviews per project
  - Target: Average 3 gates per project
- Resource allocations per project
  - Target: Average 4 resources per active project
- Time entries linked to projects
  - Target: 50% of time logged to projects (vs tickets)
- RAID items per project
  - Target: Average 5 risks, 3 issues per active project

### 15.2 Performance Metrics

**System Performance:**
- Project list load time
  - Target: < 200ms for 100 projects
- Gantt chart render time
  - Target: < 500ms for 200 tasks
- Project detail page load
  - Target: < 300ms with all tabs
- API response times
  - Target: P95 < 400ms

**Data Quality:**
- Projects with complete budget data
  - Target: > 90%
- Projects with milestones
  - Target: > 80% of active projects
- Tasks with estimates
  - Target: > 85% of tasks
- Time tracking coverage
  - Target: > 75% of project hours logged

### 15.3 Business Impact

**Project Success:**
- On-time delivery rate
  - Baseline: 62% → Target: 75% (+13%)
- Budget variance
  - Baseline: ±18% → Target: ±10% (+44% improvement)
- Project health (% green)
  - Baseline: 45% → Target: 65% (+44%)

**Resource Efficiency:**
- Resource utilization rate
  - Baseline: 68% → Target: 82% (+21%)
- Over-allocation incidents
  - Baseline: 15/month → Target: 5/month (-67%)
- Idle time reduction
  - Baseline: 12% → Target: 6% (-50%)

**Financial:**
- Invoice accuracy (project billing)
  - Baseline: 82% → Target: 95% (+16%)
- Billing cycle time
  - Baseline: 12 days → Target: 5 days (-58%)
- Revenue recognition accuracy
  - Baseline: ±12% → Target: ±5% (+58%)

**Customer Satisfaction (MSP):**
- Client project visibility satisfaction
  - Target: 4.5/5.0
- Project update frequency satisfaction
  - Target: 4.3/5.0
- Overall project delivery satisfaction
  - Baseline: 3.8/5.0 → Target: 4.4/5.0 (+16%)

### 15.4 Dashboard for Tracking

**Executive Scorecard:**
```
┌────────────────────────────────────────────────────────────────┐
│ PROJECT MANAGEMENT UPLIFT - SUCCESS METRICS                    │
├────────────────────────────────────────────────────────────────┤
│ ADOPTION                           │ PERFORMANCE                │
│ ────────────────────────────────── │ ──────────────────────────│
│ Feature Usage:        78% ████▌    │ API Response:  P95 380ms  │
│ Gantt/Kanban Active:  64% ███▍     │ Page Load:     avg 250ms  │
│ Portfolios Created:   72% ███▋     │ Gantt Render:  avg 420ms  │
│                                    │                            │
│ BUSINESS IMPACT                    │ DATA QUALITY               │
│ ────────────────────────────────── │ ──────────────────────────│
│ On-Time Delivery:     73% ███▋     │ Budget Data:        92%   │
│ Budget Variance:      ±11%         │ Milestones:         84%   │
│ Resource Util:        80% ████     │ Time Tracking:      78%   │
│                                    │                            │
│ CUSTOMER SATISFACTION              │ FINANCIAL                  │
│ ────────────────────────────────── │ ──────────────────────────│
│ Client Portal:    4.6/5.0 ⭐⭐⭐⭐   │ Invoice Accuracy:   94%   │
│ Project Updates:  4.4/5.0 ⭐⭐⭐⭐   │ Billing Cycle:   6 days   │
│ Overall:          4.3/5.0 ⭐⭐⭐⭐   │ Revenue Recog:      ±6%   │
│                                    │                            │
│ STATUS: 🟢 ON TRACK - Month 4/6                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 16. Risk Register & Mitigations

### 16.1 Technical Risks

| # | Risk | Probability | Impact | Score | Mitigation | Contingency |
|---|------|------------|--------|-------|------------|-------------|
| **R1** | **Data migration fails**, causing data loss or corruption | Medium | Critical | 12 | - Comprehensive backups<br>- Dry run on copy of prod<br>- Rollback scripts tested<br>- Phased migration | - Rollback immediately<br>- Restore from backup<br>- Postpone migration<br>- Manual data recovery |
| **R2** | **Performance degradation** with complex Gantt charts (200+ tasks) | High | Medium | 12 | - Lazy loading<br>- Virtual scrolling<br>- Background processing<br>- Caching layer | - Pagination for large projects<br>- Limit Gantt to 100 tasks<br>- "Large Project" mode |
| **R3** | **Critical path algorithm** produces incorrect results | Low | High | 9 | - Comprehensive unit tests<br>- Validation against known datasets<br>- Manual review for pilot projects | - Disable feature<br>- Manual critical path<br>- Fix algorithm |
| **R4** | **RBAC enforcement gaps** allow unauthorized access | Low | Critical | 12 | - Security audit<br>- Penetration testing<br>- Code review of all routes<br>- Automated permission tests | - Hotfix deployment<br>- Temporary feature disable<br>- Audit log review |
| **R5** | **Database indexes** insufficient, queries slow | Medium | Medium | 6 | - Query performance testing<br>- Index optimization<br>- Query plan analysis | - Add indexes on demand<br>- Optimize slow queries<br>- Caching layer |

### 16.2 Schedule Risks

| # | Risk | Probability | Impact | Score | Mitigation | Contingency |
|---|------|------------|--------|-------|------------|-------------|
| **S1** | **Key developer leaves** mid-project | Low | High | 9 | - Knowledge sharing sessions<br>- Documentation<br>- Code reviews<br>- Cross-training | - Hire replacement quickly<br>- Extend timeline<br>- Reduce scope |
| **S2** | **Dependencies delayed** (RBAC system not ready) | Medium | Medium | 6 | - Early dependency identification<br>- Parallel work streams<br>- Feature flags | - Defer dependent features<br>- Temporary workarounds<br>- Adjust roadmap |
| **S3** | **Scope creep** from stakeholder requests | High | Medium | 12 | - Strict change control<br>- Prioritized backlog<br>- Clear MVP definition<br>- Stakeholder alignment | - Phase 2 features<br>- Say "no" politely<br>- Negotiate trade-offs |
| **S4** | **Testing takes longer** than estimated | Medium | Medium | 6 | - Test early and often<br>- Automated tests<br>- QA involvement from start | - Extend testing phase<br>- Reduce test coverage<br>- Prioritize critical paths |

### 16.3 Business Risks

| # | Risk | Probability | Impact | Score | Mitigation | Contingency |
|---|------|------------|--------|-------|------------|-------------|
| **B1** | **User adoption low**, features unused | Medium | High | 12 | - User research<br>- Beta testing<br>- Training materials<br>- Change management<br>- Gradual rollout | - Gather feedback<br>- Iterate quickly<br>- Marketing campaign<br>- Mandatory training |
| **B2** | **Competing priorities** delay project | Medium | Medium | 6 | - Executive sponsorship<br>- Clear business case<br>- Regular updates<br>- Quick wins | - Negotiate resources<br>- Extend timeline<br>- Reduce scope |
| **B3** | **Budget overrun** | Low | Medium | 3 | - Detailed estimates<br>- Contingency budget (20%)<br>- Regular cost tracking | - Cut scope<br>- Extend timeline<br>- Additional funding |
| **B4** | **Regulatory compliance** issues (data retention, audit) | Low | High | 9 | - Legal review<br>- Compliance audit<br>- Audit logging<br>- Data retention policies | - Implement controls<br>- Delay launch<br>- Feature disable |

### 16.4 Integration Risks

| # | Risk | Probability | Impact | Score | Mitigation | Contingency |
|---|------|------------|--------|-------|------------|-------------|
| **I1** | **Time tracking integration** breaks existing functionality | Medium | High | 12 | - Backward compatibility<br>- Comprehensive testing<br>- Feature flags<br>- Gradual rollout | - Rollback changes<br>- Hotfix deployment<br>- Manual workaround |
| **I2** | **Billing integration** produces incorrect invoices | Low | Critical | 12 | - Extensive testing<br>- Validation rules<br>- Manual review process<br>- Pilot with internal projects | - Disable auto-billing<br>- Manual invoice review<br>- Fix calculation logic |
| **I3** | **API breaking changes** affect external integrations | Low | Medium | 3 | - API versioning<br>- Deprecation notices<br>- Backward compatibility | - Maintain old API<br>- Migration guide<br>- Support period |

### 16.5 Risk Monitoring

**Weekly Risk Reviews:**
- Review risk register in project standup
- Update probability/impact based on new information
- Escalate high-risk items to stakeholders
- Track mitigation progress

**Risk Triggers:**
- R1: Migration dry run fails → Escalate immediately
- S3: 3+ scope change requests in one week → Stakeholder meeting
- B1: Feature usage <40% in month 1 → User research sprint
- I1: Time tracking bug reports >5 → Rollback feature

---

## Conclusion & Next Steps

### Summary

This comprehensive uplift plan transforms the Deskwise Projects module from a basic Phase 1 implementation into a **world-class, ITIL-aligned Project Portfolio Management platform**. The plan delivers:

**✅ ITIL 4 Alignment**
- Full PRINCE2-inspired project lifecycle with gates
- Portfolio management with strategic prioritization
- Risk-based decision making with RAID registers
- Benefits realization tracking

**✅ MSP Excellence**
- Per-client project portfolios
- Contract-aware project creation
- Cross-client resource planning
- White-label client portals
- Consolidated MSP reporting

**✅ Seamless Integration**
- Bidirectional ticket-project links
- Unified time tracking (tickets + projects)
- Invoice generation from project time
- Asset assignments to projects
- Change request impact analysis

**✅ Enterprise Features**
- Gantt charts with critical path
- Kanban boards with WIP limits
- Resource capacity planning
- EVM (Earned Value Management)
- Gate review workflows
- Multi-view flexibility

**✅ AI-Powered**
- Auto-scheduling from task lists
- Risk prediction and analysis
- Scope change impact assessment
- Automated status reports
- Smart notifications

**✅ Production Ready**
- Complete RBAC enforcement
- Audit logging
- Data encryption
- Multi-tenant security
- Feature flags for gradual rollout
- Comprehensive testing strategy

### Implementation Confidence

**Feasibility: HIGH ✅**
- No new external dependencies
- Leverages existing Deskwise stack (Next.js, MongoDB, Gemini)
- Proven patterns from RBAC and Unified Ticketing implementations
- Backward compatible migration strategy

**Complexity: MEDIUM**
- Well-scoped 6-month timeline
- Phased approach reduces risk
- Feature flags enable gradual rollout
- Rollback mechanisms in place

**ROI: HIGH 💰**
- Improved project delivery (+13% on-time)
- Better resource utilization (+21%)
- Faster billing cycle (-58%)
- Higher client satisfaction (+16%)

### Immediate Next Steps (Week 1)

1. **Stakeholder Approval**
   - Present plan to executive team
   - Get budget approval
   - Assign project sponsor

2. **Team Formation**
   - Hire/assign developers
   - Onboard team to codebase
   - Set up development environment

3. **Sprint 0 Preparation**
   - Create backlog in project management tool
   - Set up CI/CD for new features
   - Prepare development/staging environments

4. **Kickoff**
   - Project kickoff meeting
   - Establish communication cadence
   - Begin Sprint 1 (Database Foundation)

### Long-Term Vision (12 Months+)

Beyond the 6-month uplift:

**Advanced Features:**
- Machine learning for project success prediction
- Advanced portfolio optimization algorithms
- Integration with Microsoft Project, Jira, etc.
- Mobile apps (iOS/Android) for on-the-go PM
- Real-time collaboration (WebSockets)
- Advanced data visualizations (D3.js)

**Continuous Improvement:**
- Quarterly feature releases
- User feedback incorporation
- Performance optimization
- Security enhancements
- Compliance certifications (SOC 2, ISO 27001)

---

**Document Version:** 1.0
**Last Updated:** October 24, 2025
**Status:** Ready for Review
**Next Review:** Post-Stakeholder Approval

---

## Appendices

### Appendix A: Glossary

- **ITIL**: Information Technology Infrastructure Library
- **PRINCE2**: Projects IN Controlled Environments (version 2)
- **PMBOK**: Project Management Body of Knowledge
- **PPM**: Project Portfolio Management
- **EVM**: Earned Value Management
- **RAID**: Risks, Assumptions, Issues, Decisions
- **WBS**: Work Breakdown Structure
- **MSP**: Managed Service Provider
- **SLA**: Service Level Agreement
- **OLA**: Operational Level Agreement
- **PID**: Project Initiation Document
- **RAG**: Red, Amber, Green (status)
- **ETC**: Estimate To Complete
- **EAC**: Estimate At Completion
- **CPI**: Cost Performance Index
- **SPI**: Schedule Performance Index

### Appendix B: Referenced Documents

- ITIL 4 Practice Guide - Portfolio Management: https://www.axelos.com/resource-hub/practice/portfolio-management-itil-4-practice-guide
- PRINCE2 Project Stages Guide: https://www.prince2-online.co.uk/prince2-project-stages
- ServiceNow Strategic Portfolio Management Guide: https://www.cloudnuro.ai/blog/top-10-project-portfolio-management-ppm-solutions-for-it-projects-2025
- Resource Capacity Planning Best Practices: https://birdviewpsa.com/blog/adefinitive-guide-to-resource-capacity-planning/
- Modern SaaS UX Patterns (Asana): https://asana.com/features/project-management/project-views

### Appendix C: Contact Information

**Project Team:**
- Project Sponsor: [TBD]
- Lead Developer: [TBD]
- Backend Developer: [TBD]
- Frontend Developer: [TBD]
- UX Designer: [TBD]
- QA Engineer: [TBD]

**Stakeholders:**
- Product Manager: [TBD]
- Engineering Manager: [TBD]
- CTO: [TBD]

---

**END OF DOCUMENT**
