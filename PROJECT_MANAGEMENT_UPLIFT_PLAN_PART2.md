# Deskwise ITSM - Project Management Module Uplift Plan (Part 2)

**Continued from PROJECT_MANAGEMENT_UPLIFT_PLAN.md**

---

## 7. UI/UX Design

### 7.1 Design Principles

1. **Progressive Disclosure**: Show essential info first, details on demand
2. **Contextual Actions**: Right action, right place, right time
3. **Multi-View Flexibility**: Let users choose how they work (Gantt/Kanban/List)
4. **Consistent Patterns**: Reuse existing Deskwise design system
5. **Fast Performance**: <200ms view switching, <500ms complex operations
6. **Keyboard-First**: Power users can work without mouse
7. **Mobile-Responsive**: Core features accessible on tablets/mobile
8. **Accessibility**: WCAG 2.1 AA compliance

### 7.2 Page Structure

#### 7.2.1 Projects List Page (Enhanced)

```
┌────────────────────────────────────────────────────────────────┐
│ 📊 Projects                                      [+ New Project]│
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🔍 Search projects...     [Portfolio ▼] [Status ▼] [Manager ▼]│
│                                                                 │
│ [List] [Kanban] [Gantt] [Calendar]              [Export] [⚙️] │
│                                                                 │
├────────────────────────────────────────────────────────────────┤
│ LIST VIEW                                                       │
├────────────────────────────────────────────────────────────────┤
│ ┌───┬──────────┬────────────────┬──────────┬──────────┬───┐    │
│ │ # │ Project  │ Status         │ Progress │ Budget   │ ⚠│    │
│ ├───┼──────────┼────────────────┼──────────┼──────────┼───┤    │
│ │🟢 │ PRJ-0042 │ ● Active       │ ████░░░░ │ $12.5K   │  │    │
│ │   │ Website  │ Execution      │ 45%      │ of $50K  │  │    │
│ │   │ Redesign │                │          │          │  │    │
│ ├───┼──────────┼────────────────┼──────────┼──────────┼───┤    │
│ │🟡 │ PRJ-0041 │ ⏸ On Hold     │ ██░░░░░░ │ $8.2K    │ 3│    │
│ │   │ Mobile   │ Planning       │ 25%      │ of $30K  │  │    │
│ │   │ App      │                │          │          │  │    │
│ ├───┼──────────┼────────────────┼──────────┼──────────┼───┤    │
│ │🔴 │ PRJ-0040 │ ● Active       │ ██████░░ │ $42K     │ 5│    │
│ │   │ ERP      │ Execution      │ 68%      │ of $40K  │  │    │
│ │   │ Upgrade  │ (Overrun!)     │          │ (105%)   │  │    │
│ └───┴──────────┴────────────────┴──────────┴──────────┴───┘    │
│                                                                 │
│ Showing 3 of 24 projects                      [← 1 2 3 4 →]   │
└────────────────────────────────────────────────────────────────┘

FEATURES:
- Color-coded health indicators (🟢🟡🔴)
- Inline status badges with icons
- Visual progress bars
- Budget utilization with % and $ amounts
- Risk/issue count badges (⚠ column)
- Sortable columns (click header)
- Clickable rows → Project detail
- Bulk actions (select multiple projects)
- Export to Excel/CSV
```

#### 7.2.2 Project Detail Page (Complete Redesign)

```
┌────────────────────────────────────────────────────────────────┐
│ [← Projects] PRJ-0042 · Website Redesign Project    [Edit] [•••]│
├────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ STATUS BAR (Sticky)                                       │   │
│ │ ● Active · Execution    Progress: 45% ████████░░░░░░     │   │
│ │ Budget: $12.5K / $50K (25%)    Due: Jun 30, 2025         │   │
│ │ Health: 🟢 On Track    [Quick Actions ▼]                 │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ TABS: [Overview] [Tasks] [Schedule] [Team] [Budget] [RAID]     │
│       [Documents] [Time] [Tickets] [Activity]                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ OVERVIEW TAB                                                    │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────┐ ┌───────────────────────────┐    │
│ │ 📋 Project Details        │ │ 📊 Key Metrics            │    │
│ ├───────────────────────────┤ ├───────────────────────────┤    │
│ │ Client: Acme Corp         │ │ ┌─────┬─────┬─────┬─────┐ │    │
│ │ Portfolio: Digital Trans  │ │ │ 12  │ 3   │ 2   │ 1   │ │    │
│ │ Manager: John Doe         │ │ │Tasks│Mile │Risk │Issue│ │    │
│ │ Team: 5 members           │ │ └─────┴─────┴─────┴─────┘ │    │
│ │ Type: Client Project      │ │                           │    │
│ │ Methodology: Agile        │ │ Budget Utilization: 25%   │    │
│ │                           │ │ Schedule: On Time         │    │
│ │ [View Full Details]       │ │ Quality Score: 92/100     │    │
│ └───────────────────────────┘ └───────────────────────────┘    │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐    │
│ │ 📅 Timeline                                              │    │
│ ├─────────────────────────────────────────────────────────┤    │
│ │ Jan    Feb    Mar    Apr    May    Jun    Jul    Aug    │    │
│ │ ├──────┼──────┼──────┼──────┼──────┼──────┼──────┼───   │    │
│ │ █Plan  █████Design█████████Build████████Test█UAT█        │    │
│ │        ▲      ▲             ▲           ▲   ▲            │    │
│ │      Start  Gate1        Gate2       Gate3 End           │    │
│ │                                                           │    │
│ │ ◆ Current: 45% complete (Mar 15)                         │    │
│ │ ⚠ Next Milestone: Design Approval (Mar 31) - 16 days     │    │
│ └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│ ┌───────────────────────────┐ ┌───────────────────────────┐    │
│ │ 🎯 Upcoming Milestones    │ │ ⚡ Recent Activity         │    │
│ ├───────────────────────────┤ ├───────────────────────────┤    │
│ │ Mar 31 · Design Approval  │ │ 2h ago · Sarah completed  │    │
│ │          Gate Review      │ │           TSK-008         │    │
│ │          [Submit Docs]    │ │ 5h ago · Budget updated   │    │
│ │                           │ │ 1d ago · John added risk  │    │
│ │ May 15 · Beta Release     │ │          RSK-003          │    │
│ │          Deliverable      │ │ 2d ago · New milestone    │    │
│ │                           │ │          created          │    │
│ │ [View All Milestones]     │ │ [View All Activity]       │    │
│ └───────────────────────────┘ └───────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### 7.2.3 Gantt View (NEW)

```
┌────────────────────────────────────────────────────────────────┐
│ GANTT CHART VIEW                                                │
├────────────────────────────────────────────────────────────────┤
│ [Zoom: Day|Week|Month|Quarter]  [Today]  [Critical Path] [⚙️]  │
│                                                                 │
├────────────────┬───────────────────────────────────────────────┤
│ TASK TREE      │ TIMELINE                                      │
├────────────────┼───────────────────────────────────────────────┤
│                │ Feb    Mar    Apr    May    Jun    Jul       │
│ ▼ PRJ-0042     │ ├──────┼──────┼──────┼──────┼──────┼──────  │
│                │                                                │
│ ▼ 1. Planning  │ ██████                                        │
│   ├ 1.1 Req    │ ███                                           │
│   ├ 1.2 Design │    ████                                       │
│   └ 1.3 Arch   │       ███                                     │
│                │        ▲                                       │
│ ▶ 2. Build     │        ██████████████████                     │
│   (collapsed)  │                                                │
│                │                                                │
│ ▶ 3. Test      │                              ████████         │
│                │                                                │
│ ◆ M1: Design   │       ◆                                       │
│ ◆ M2: Beta     │                              ◆                │
│ ◆ M3: Launch   │                                      ◆        │
│                │                                                │
│                │ ─────────────────────────────────────────────  │
│                │ Today ↑                                       │
└────────────────┴───────────────────────────────────────────────┘

INTERACTIONS:
- Drag task bars to reschedule
- Drag edges to adjust duration
- Click task → Side panel with details
- Dependency lines show relationships (dotted)
- Critical path highlighted in red
- Milestones shown as diamonds
- Today line always visible
- Color coding: Green = done, Blue = in progress, Gray = not started
- Scroll horizontally for long timelines
- Collapse/expand task groups
```

#### 7.2.4 Kanban Board View (NEW)

```
┌────────────────────────────────────────────────────────────────┐
│ KANBAN BOARD VIEW                                               │
├────────────────────────────────────────────────────────────────┤
│ [Group By: Status|Assignee|Priority]  [WIP Limits: ON]  [⚙️]   │
│                                                                 │
├──────────┬──────────┬──────────┬──────────┬──────────┬────────┤
│ Backlog  │ To Do    │ Progress │ Review   │ Done     │ Total  │
│ (15)     │ (8) ⚠    │ (5)      │ (3)      │ (24)     │ 55     │
├──────────┼──────────┼──────────┼──────────┼──────────┼────────┤
│          │          │          │          │          │        │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │        │
│ │TSK-15│ │ │TSK-09│ │ │TSK-03│ │ │TSK-01│ │ │TSK-24│ │        │
│ │      │ │ │      │ │ │🔴    │ │ │      │ │ │✓     │ │        │
│ │DB Mig│ │ │API   │ │ │Login │ │ │Search│ │ │Setup │ │        │
│ │ration│ │ │Integ │ │ │Flow  │ │ │UI    │ │ │CI/CD │ │        │
│ │      │ │ │ration│ │ │      │ │ │      │ │ │      │ │        │
│ │5h    │ │ │8h    │ │ │3h/4h │ │ │2h    │ │ │8h/8h │ │        │
│ │@John │ │ │@Sarah│ │ │@Mike │ │ │@Lisa │ │ │@John │ │        │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │        │
│          │          │          │          │          │        │
│ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │ ┌──────┐ │        │
│ │TSK-16│ │ │TSK-10│ │ │TSK-04│ │ │TSK-02│ │ │TSK-23│ │        │
│ │      │ │ │      │ │ │      │ │ │      │ │ │      │ │        │
│ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │ └──────┘ │        │
│          │          │          │          │          │        │
│ [+ Add]  │ [+ Add]  │ [+ Add]  │ [+ Add]  │          │        │
│          │          │          │          │          │        │
└──────────┴──────────┴──────────┴──────────┴──────────┴────────┘

WIP LIMIT VIOLATION: "To Do" column has 8 tasks (limit: 5) ⚠

FEATURES:
- Drag-and-drop cards between columns
- Color-coded priority (🔴 high, 🟡 medium, 🟢 low)
- Progress indicators (3h/4h = 3 of 4 hours complete)
- Avatar/initials for assignee
- Card click → Task detail panel
- WIP (Work In Progress) limits with warnings
- Swimlanes (group by epic/assignee)
- Quick add card in each column
```

#### 7.2.5 Resource Planner View (NEW)

```
┌────────────────────────────────────────────────────────────────┐
│ RESOURCE PLANNER                                                │
├────────────────────────────────────────────────────────────────┤
│ [Week|Month|Quarter]  [This Week ▼]  [Show: All|Overallocated] │
│                                                                 │
├────────────────┬───────────────────────────────────────────────┤
│ RESOURCE       │ CAPACITY HEATMAP (Hours per week)            │
├────────────────┼───────────────────────────────────────────────┤
│                │ Mar 10  Mar 17  Mar 24  Mar 31  Apr 7        │
│ John Doe       │ ├──────┼──────┼──────┼──────┼──────          │
│ Capacity: 40h  │ ████████████████████████████████40h          │
│ Allocated: 45h │ ██████████████████████████████████████50h⚠   │
│ [🔴 105%]      │ ████████████████████████35h                  │
│ ─────────────  │ ████████████████████████████40h              │
│ PRJ-0042: 25h  │                                               │
│ PRJ-0041: 20h  │ Projects: ▓PRJ-0042 ░PRJ-0041                │
│                │                                               │
├────────────────┼───────────────────────────────────────────────┤
│ Sarah Kim      │ ████████████████████30h                      │
│ Capacity: 40h  │ ████████████████████████████████40h          │
│ Allocated: 35h │ ████████████████████████████████40h          │
│ [🟢 88%]       │ ████████████████████████25h                  │
│ ─────────────  │                                               │
│ PRJ-0042: 20h  │ Projects: ▓PRJ-0042 ░PRJ-0040                │
│ PRJ-0040: 15h  │                                               │
│                │                                               │
├────────────────┼───────────────────────────────────────────────┤
│ Mike Chen      │ ████████████████████████████████40h          │
│ Capacity: 32h  │ ████████░░░░░░░░░░░░20h (PTO)                │
│ Allocated: 30h │ ████████████████████████████████████50h⚠     │
│ [🟡 94%]       │ ████████████████████████████████40h          │
│ ─────────────  │                                               │
│ PRJ-0042: 15h  │ Projects: ▓PRJ-0042 ░PRJ-0043                │
│ PRJ-0043: 15h  │                                               │
│                │                                               │
└────────────────┴───────────────────────────────────────────────┘

LEGEND:
█ Full capacity (100%)    🟢 <90%    🟡 90-100%    🔴 >100% overallocated
░ Partial allocation      ⚠ Over-allocated warning

FEATURES:
- Color-coded utilization (green/yellow/red)
- Heatmap shows allocation across time periods
- Multiple project allocation shown in stacked bars
- PTO/time off shown as gaps
- Click resource → Allocation detail
- Drag to reallocate hours
- What-if scenario planning
- Export capacity report
```

### 7.3 Component Library (Reuse Existing)

Leverage existing Deskwise components from `src/components/ui/`:

**Existing Components to Reuse:**
- Button, Input, Select, Textarea (forms)
- Card, Badge, Progress (layout)
- Dialog, Sheet, Popover (modals/panels)
- Table, DataTable (lists)
- Calendar, DatePicker (scheduling)
- Avatar, Separator (UI elements)
- Tabs, Accordion, Collapsible (navigation)
- Chart components from analytics (metrics)

**New Components to Build:**
```typescript
// Gantt Chart
<GanttChart
  tasks={tasks}
  milestones={milestones}
  onTaskDrag={(taskId, newDates) => {}}
  onDependencyCreate={(fromTask, toTask) => {}}
  showCriticalPath={true}
  zoom="week"
/>

// Kanban Board
<KanbanBoard
  columns={statusColumns}
  tasks={tasks}
  onTaskMove={(taskId, newStatus) => {}}
  wipLimits={wipLimits}
  groupBy="status"
/>

// Resource Heatmap
<ResourceHeatmap
  resources={resources}
  allocations={allocations}
  timeRange={{ start, end }}
  granularity="week"
  onAllocationChange={(resourceId, newHours) => {}}
/>

// Project Health Badge
<ProjectHealthBadge
  health={project.health}
  metrics={{
    schedule: 'red',
    budget: 'green',
    scope: 'green',
    risk: 'yellow'
  }}
  showDetails={true}
/>

// Milestone Timeline
<MilestoneTimeline
  milestones={milestones}
  currentDate={new Date()}
  onMilestoneClick={(milestoneId) => {}}
/>

// RAID Register
<RAIDRegister
  type="risks" // or 'issues', 'assumptions', 'decisions'
  items={risks}
  onAdd={() => {}}
  onUpdate={(id, updates) => {}}
  showHeatmap={true}
/>
```

### 7.4 Mobile Responsiveness

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl)

**Mobile Adaptations:**
- **Project List**: Card-based layout instead of table
- **Gantt View**: Not available on mobile (show timeline view instead)
- **Kanban Board**: Single column, swipe to change status
- **Resource Planner**: Simplified list view, tap to expand
- **Project Detail**: Bottom sheet navigation instead of tabs

**Touch Optimizations:**
- Minimum tap target: 44px × 44px
- Swipe gestures for navigation
- Pull-to-refresh for data updates
- Optimistic UI updates

### 7.5 Accessibility (WCAG 2.1 AA)

**Requirements:**
- ✅ Keyboard navigation for all features
- ✅ ARIA labels and roles
- ✅ Focus indicators (visible outlines)
- ✅ Color contrast ratios ≥ 4.5:1
- ✅ Screen reader support
- ✅ Skip links for main content
- ✅ Form validation with clear error messages

**Keyboard Shortcuts:**
```
Global:
- Cmd/Ctrl + K: Global search
- G then P: Go to Projects
- G then T: Go to Tasks
- C: Create new item (context-aware)

Project Detail:
- Tab: Next section
- Shift+Tab: Previous section
- E: Edit mode
- S: Save changes
- Esc: Cancel/Close

Gantt Chart:
- Arrow keys: Navigate tasks
- Space: Select task
- D: Add dependency
- Delete: Remove task

Kanban:
- Arrow keys: Move between cards
- Space: Drag mode (then arrows to move, space to drop)
- Enter: Open card detail
```

---

## 8. Security & RBAC

### 8.1 Current Security Gap

**CRITICAL ISSUE:**
The existing Projects API routes do NOT enforce RBAC permissions. They only check for authenticated session (any logged-in user can access any project in their org).

**Example of current (insecure) code:**
```typescript
// Current: INSECURE ❌
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // No permission check! Any user can read all projects
  const projects = await ProjectService.getProjects(session.user.orgId)
  return NextResponse.json({ success: true, data: projects })
}
```

### 8.2 Enhanced RBAC Implementation

#### 8.2.1 Permission Structure

**New Project Permissions:**
```typescript
export const PROJECT_PERMISSIONS = {
  // Portfolio
  'portfolios.view.all': 'View all portfolios',
  'portfolios.view.own': 'View portfolios where user is manager',
  'portfolios.create': 'Create new portfolios',
  'portfolios.edit.all': 'Edit all portfolios',
  'portfolios.edit.own': 'Edit own portfolios',
  'portfolios.delete': 'Delete portfolios',
  'portfolios.manage': 'Full portfolio management (rebalancing, prioritization)',

  // Projects (enhanced from existing)
  'projects.view.all': 'View all projects',
  'projects.view.own': 'View projects where user is PM',
  'projects.view.assigned': 'View projects where user is team member',
  'projects.create': 'Create new projects',
  'projects.edit.all': 'Edit all projects',
  'projects.edit.own': 'Edit own projects (as PM)',
  'projects.delete': 'Delete projects',
  'projects.manage': 'Full project management (tasks, milestones, resources)',

  // Tasks
  'projects.tasks.view': 'View project tasks',
  'projects.tasks.create': 'Create tasks',
  'projects.tasks.edit.all': 'Edit all tasks',
  'projects.tasks.edit.assigned': 'Edit assigned tasks',
  'projects.tasks.delete': 'Delete tasks',

  // Resources
  'projects.resources.view': 'View resource allocations',
  'projects.resources.allocate': 'Allocate resources to projects',
  'projects.resources.manage': 'Manage all resource allocations',

  // Financial
  'projects.budget.view': 'View project budgets',
  'projects.budget.edit': 'Edit project budgets',
  'projects.financials.manage': 'Manage financial tracking (EVM, invoicing)',

  // RAID
  'projects.raid.view': 'View RAID register',
  'projects.raid.manage': 'Manage risks, issues, assumptions, decisions',

  // Gate Reviews
  'projects.gates.view': 'View gate reviews',
  'projects.gates.approve': 'Approve gate reviews',

  // Documents
  'projects.documents.view': 'View project documents',
  'projects.documents.upload': 'Upload documents',
  'projects.documents.delete': 'Delete documents',

  // Time Tracking
  'projects.time.log': 'Log time to projects',
  'projects.time.approve': 'Approve time entries',
  'projects.time.view.all': 'View all time entries',

  // Reporting
  'projects.analytics.view': 'View project analytics',
  'projects.reports.generate': 'Generate custom reports'
}
```

#### 8.2.2 Role Assignments (Default)

```typescript
export const PROJECT_ROLE_PERMISSIONS = {
  Administrator: [
    'portfolios.*',
    'projects.*'
  ],

  'Project Manager': [
    'portfolios.view.all',
    'projects.view.all',
    'projects.create',
    'projects.edit.own',
    'projects.manage',
    'projects.tasks.*',
    'projects.resources.allocate',
    'projects.budget.view',
    'projects.budget.edit',
    'projects.raid.manage',
    'projects.gates.view',
    'projects.documents.*',
    'projects.time.approve',
    'projects.analytics.view'
  ],

  'Portfolio Manager': [
    'portfolios.view.all',
    'portfolios.edit.own',
    'portfolios.manage',
    'projects.view.all',
    'projects.create',
    'projects.analytics.view',
    'projects.reports.generate'
  ],

  Technician: [
    'projects.view.assigned',
    'projects.tasks.view',
    'projects.tasks.edit.assigned',
    'projects.time.log',
    'projects.documents.view',
    'projects.raid.view'
  ],

  'Service Desk Agent': [
    'projects.view.assigned',
    'projects.tasks.view',
    'projects.time.log'
  ],

  'End User': [] // No project access by default
}
```

#### 8.2.3 Secure API Implementation

```typescript
import { requirePermission } from '@/lib/middleware/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RBAC check - REQUIRED ✅
  const hasViewAll = await requirePermission(session, 'projects.view.all')
  const hasViewOwn = await requirePermission(session, 'projects.view.own')
  const hasViewAssigned = await requirePermission(session, 'projects.view.assigned')

  if (!hasViewAll && !hasViewOwn && !hasViewAssigned) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // Scope query based on permissions
  let filter = { orgId: session.user.orgId, isActive: true }

  if (hasViewAll) {
    // Can see all projects
  } else if (hasViewOwn) {
    // Only projects where user is PM
    filter.projectManager = session.user.userId
  } else if (hasViewAssigned) {
    // Only projects where user is team member
    filter.teamMembers = { $in: [session.user.userId] }
  }

  const projects = await ProjectService.getProjects(filter)
  return NextResponse.json({ success: true, data: projects })
}

// Update project - check ownership
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const project = await ProjectService.getProjectById(params.id, session.user.orgId)

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Check permissions based on ownership
  const canEditAll = await requirePermission(session, 'projects.edit.all')
  const canEditOwn = await requirePermission(session, 'projects.edit.own')

  const isOwner = project.projectManager === session.user.userId

  if (!canEditAll && !(canEditOwn && isOwner)) {
    return NextResponse.json({
      error: 'You do not have permission to edit this project'
    }, { status: 403 })
  }

  // Proceed with update
  const body = await req.json()
  const updated = await ProjectService.updateProject(params.id, session.user.orgId, body)

  return NextResponse.json({ success: true, data: updated })
}

// Budget update - requires specific permission
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!await requirePermission(session, 'projects.budget.edit')) {
    return NextResponse.json({
      error: 'You do not have permission to edit project budgets'
    }, { status: 403 })
  }

  const body = await req.json()
  const updated = await ProjectService.updateProjectBudget(
    params.id,
    session.user.orgId,
    body
  )

  return NextResponse.json({ success: true, data: updated })
}
```

### 8.3 Row-Level Security

**Multi-Tenancy:**
- ALL database queries MUST filter by `orgId`
- MSP mode: Additional `clientId` filtering for client users
- Portfolio scope: Users may only see projects in specific portfolios

**Query Examples:**
```typescript
// Base query - always include orgId
const baseQuery = {
  orgId: session.user.orgId,
  isActive: true
}

// MSP mode - client portal users
if (session.user.clientId) {
  baseQuery.clientId = session.user.clientId
}

// Portfolio restriction (org-level setting)
if (org.settings.restrictToPortfolios && session.user.portfolioIds?.length > 0) {
  baseQuery.portfolioId = { $in: session.user.portfolioIds }
}

const projects = await db.collection('projects').find(baseQuery).toArray()
```

### 8.4 Audit Logging

**Audit Events:**
```typescript
export interface ProjectAuditLog extends BaseEntity {
  _id: ObjectId
  orgId: string

  // Subject
  userId: string
  userName: string
  userRole: string

  // Action
  action: string                  // 'project.created', 'project.updated', 'budget.changed'
  resource: string                // 'project', 'task', 'milestone'
  resourceId: string              // Project/task/milestone ID
  resourceName: string            // Human-readable name

  // Change details
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]

  // Context
  ipAddress?: string
  userAgent?: string

  // Timestamp
  timestamp: Date
}

// Audit logging service
export class AuditService {
  static async log(event: AuditLogEvent) {
    await db.collection('project_audit_logs').insertOne({
      orgId: event.orgId,
      userId: event.userId,
      userName: event.userName,
      userRole: event.userRole,
      action: event.action,
      resource: event.resource,
      resourceId: event.resourceId,
      resourceName: event.resourceName,
      changes: event.changes,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      timestamp: new Date(),
      createdAt: new Date()
    })
  }

  static async getAuditTrail(resourceId: string, resourceType: string) {
    return db.collection('project_audit_logs').find({
      resourceId,
      resource: resourceType
    }).sort({ timestamp: -1 }).toArray()
  }
}

// Usage in service methods
export class ProjectService {
  static async updateProject(id: string, orgId: string, updates: any, userId: string) {
    const oldProject = await this.getProjectById(id, orgId)

    // Perform update
    const result = await db.collection('projects').findOneAndUpdate(
      { _id: id, orgId },
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    // Audit log
    await AuditService.log({
      orgId,
      userId,
      action: 'project.updated',
      resource: 'project',
      resourceId: id,
      resourceName: oldProject.name,
      changes: this.detectChanges(oldProject, result.value)
    })

    return result.value
  }
}
```

### 8.5 Data Encryption

**Sensitive Fields:**
- Project budget details
- Resource hourly rates
- Financial forecasts
- Client contract information

**Implementation:**
```typescript
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY // 32-byte key
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): { encrypted: string, iv: string, tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(iv, 'hex')
  )

  decipher.setAuthTag(Buffer.from(tag, 'hex'))

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Service usage
export class ProjectService {
  static async createProject(input: CreateProjectInput, userId: string) {
    // Encrypt sensitive budget data
    const budgetEncrypted = input.budget
      ? encrypt(input.budget.toString())
      : null

    const project = {
      ...input,
      budget: budgetEncrypted?.encrypted,
      budgetIV: budgetEncrypted?.iv,
      budgetTag: budgetEncrypted?.tag,
      createdBy: userId,
      createdAt: new Date()
    }

    const result = await db.collection('projects').insertOne(project)
    return result
  }

  static async getProjectById(id: string, orgId: string) {
    const project = await db.collection('projects').findOne({ _id: id, orgId })

    // Decrypt budget
    if (project.budget && project.budgetIV && project.budgetTag) {
      project.budget = parseFloat(
        decrypt(project.budget, project.budgetIV, project.budgetTag)
      )
      delete project.budgetIV
      delete project.budgetTag
    }

    return project
  }
}
```

---

## 9. MSP-Specific Features

### 9.1 Client Portfolios

**Concept:**
Each client in MSP mode can have their own project portfolio, allowing MSPs to:
- Track all projects per client
- Generate client-specific reports
- Manage client-specific budgets and resources
- Provide client portal access to their projects

**Implementation:**
```typescript
// Client portfolio view
export class ClientPortfolioService {
  static async getClientPortfolio(clientId: string, orgId: string) {
    // Get client info
    const client = await db.collection('clients').findOne({ _id: clientId, orgId })

    // Get all projects for this client
    const projects = await db.collection('projects').find({
      orgId,
      clientId,
      isActive: true
    }).toArray()

    // Aggregate metrics
    const metrics = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,

      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      spentBudget: projects.reduce((sum, p) => sum + (p.usedBudget || 0), 0),

      onTimeDeliveryRate: this.calculateOnTimeRate(projects),
      avgProjectDuration: this.calculateAvgDuration(projects),

      healthDistribution: {
        green: projects.filter(p => p.health === 'green').length,
        yellow: projects.filter(p => p.health === 'yellow').length,
        red: projects.filter(p => p.health === 'red').length
      }
    }

    return {
      client,
      projects,
      metrics
    }
  }

  static async getClientResourceUtilization(clientId: string, orgId: string) {
    // Get all resource allocations for this client's projects
    const projects = await db.collection('projects').find({
      orgId,
      clientId
    }).toArray()

    const projectIds = projects.map(p => p._id)

    const allocations = await db.collection('project_resources').find({
      projectId: { $in: projectIds }
    }).toArray()

    // Group by user
    const userUtilization = _.groupBy(allocations, 'userId')

    return Object.entries(userUtilization).map(([userId, allocs]) => ({
      userId,
      userName: allocs[0].userName,
      totalHours: allocs.reduce((sum, a) => sum + a.hoursPerWeek, 0),
      projects: allocs.map(a => ({
        projectId: a.projectId,
        role: a.role,
        hours: a.hoursPerWeek
      }))
    }))
  }
}
```

### 9.2 Contract Awareness

**Linking Projects to Contracts:**
```typescript
// Project creation with contract validation
export class MSPProjectService {
  static async createProjectWithContractCheck(
    input: CreateProjectInput,
    userId: string
  ) {
    if (!input.clientId) {
      throw new Error('MSP mode requires clientId')
    }

    // Get client contract
    const contract = await db.collection('contracts').findOne({
      clientId: input.clientId,
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    })

    if (!contract) {
      throw new Error('No active contract found for this client')
    }

    // Check if project type is covered by contract
    const serviceAllowed = contract.services.some(s =>
      s.serviceId === input.serviceType ||
      s.category === input.category
    )

    if (!serviceAllowed) {
      throw new Error(
        `Service type "${input.category}" is not covered by contract ${contract.contractNumber}`
      )
    }

    // Check budget limits (if contract has spending caps)
    if (contract.budgetCap) {
      const clientSpend = await this.getClientSpend(input.clientId)
      if (clientSpend + input.budget > contract.budgetCap) {
        throw new Error('Project budget would exceed contract spending limit')
      }
    }

    // Create project with contract reference
    const project = await ProjectService.createProject({
      ...input,
      contractId: contract._id,
      contractNumber: contract.contractNumber
    }, userId)

    return project
  }

  static async getContractProjectSummary(contractId: string, orgId: string) {
    const contract = await db.collection('contracts').findOne({
      _id: contractId,
      orgId
    })

    const projects = await db.collection('projects').find({
      contractId,
      orgId
    }).toArray()

    return {
      contract,
      projects,
      summary: {
        totalProjects: projects.length,
        totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
        totalSpent: projects.reduce((sum, p) => sum + (p.usedBudget || 0), 0),
        remainingContractValue: contract.monthlyRecurringRevenue -
          projects.reduce((sum, p) => sum + (p.usedBudget || 0), 0)
      }
    }
  }
}
```

### 9.3 Cross-Client Resource Planning

**Challenge:**
MSPs need to allocate resources across multiple client projects while avoiding over-allocation.

**Solution:**
```typescript
export class MSPResourcePlannerService {
  static async getCrossClientCapacity(orgId: string, startDate: Date, endDate: Date) {
    // Get all users (technicians)
    const users = await db.collection('users').find({
      orgId,
      role: { $in: ['technician', 'admin'] }
    }).toArray()

    // Get all project allocations in time period
    const allocations = await db.collection('project_resources').find({
      orgId,
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
      status: 'active'
    }).toArray()

    // Get client info for each allocation
    const projectIds = [...new Set(allocations.map(a => a.projectId))]
    const projects = await db.collection('projects').find({
      _id: { $in: projectIds }
    }).toArray()

    const projectClientMap = new Map(
      projects.map(p => [p._id.toString(), p.clientId])
    )

    // Build capacity view per user
    return users.map(user => {
      const userAllocs = allocations.filter(a => a.userId === user._id.toString())

      // Group by client
      const clientAllocations = _.groupBy(userAllocs, a =>
        projectClientMap.get(a.projectId.toString())
      )

      const totalHours = userAllocs.reduce((sum, a) => sum + a.hoursPerWeek, 0)
      const capacity = 40 // Standard week

      return {
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`,
        capacity,
        totalAllocated: totalHours,
        utilization: (totalHours / capacity) * 100,
        isOverallocated: totalHours > capacity,

        clientBreakdown: Object.entries(clientAllocations).map(([clientId, allocs]) => ({
          clientId,
          clientName: this.getClientName(clientId), // Cached lookup
          hours: allocs.reduce((sum, a) => sum + a.hoursPerWeek, 0),
          projects: allocs.map(a => ({
            projectId: a.projectId,
            projectName: this.getProjectName(a.projectId),
            role: a.role,
            hours: a.hoursPerWeek
          }))
        }))
      }
    })
  }

  static async suggestReallocation(overallocatedUserId: string, orgId: string) {
    // Get user's allocations
    const userAllocs = await db.collection('project_resources').find({
      userId: overallocatedUserId,
      orgId,
      status: 'active'
    }).toArray()

    // Find users with available capacity
    const availableUsers = await this.findAvailableResources(orgId, {
      minCapacity: 10, // At least 10h/week available
      skills: userAllocs[0].requiredSkills // Match skills
    })

    // Generate suggestions
    return availableUsers.map(u => ({
      userId: u.userId,
      userName: u.userName,
      availableHours: u.availableCapacity,
      skillMatch: u.skillMatchPercentage,
      currentProjects: u.currentProjects,
      suggestion: `Reallocate ${Math.min(u.availableCapacity, 10)}h from ${userAllocs[0].projectName}`
    }))
  }
}
```

### 9.4 Client Portal Features

**Client User Access:**
```typescript
// Client users can view ONLY their organization's projects
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user is a client user (not MSP staff)
  const isClientUser = session.user.userType === 'client'

  let filter = { orgId: session.user.orgId, isActive: true }

  if (isClientUser) {
    // Client users can ONLY see their client's projects
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'Client ID not found' }, { status: 403 })
    }

    filter.clientId = session.user.clientId
    filter.clientVisible = true // Only projects marked as client-visible
  }

  const projects = await ProjectService.getProjects(filter)

  // Filter sensitive data for client users
  if (isClientUser) {
    projects.forEach(p => {
      delete p.usedBudget // Hide actual spend
      delete p.evm // Hide internal metrics
      delete p.teamMembers // Hide team details (except PM)
    })
  }

  return NextResponse.json({ success: true, data: projects })
}
```

**Client Portal UI:**
```
┌────────────────────────────────────────────────────────────────┐
│ CLIENT PORTAL - Acme Corp Projects                             │
├────────────────────────────────────────────────────────────────┤
│ Welcome, John Smith (Acme Corp)                    [Support ▼] │
│                                                                 │
│ MY PROJECTS                                                     │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🟢 PRJ-0042 · Website Redesign                            │  │
│ │ Status: Active · Progress: 45%                            │  │
│ │ Next Milestone: Design Approval (Mar 31)                  │  │
│ │ [View Details] [Request Update]                           │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 🟢 PRJ-0038 · Office Network Upgrade                      │  │
│ │ Status: Completed · Delivered: Jan 15, 2025               │  │
│ │ [View Final Report] [Rate Service]                        │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ PROJECT METRICS                                                 │
│ ┌────────┬────────┬────────┬────────┐                          │
│ │ 5      │ 3      │ 2      │ 100%   │                          │
│ │ Total  │ Active │ Done   │ On Time│                          │
│ └────────┴────────┴────────┴────────┘                          │
│                                                                 │
│ [Request New Project] [View Contract] [Download Reports]       │
└────────────────────────────────────────────────────────────────┘

FEATURES:
- Read-only access to client's projects
- Simplified view (no internal details like actual costs)
- Milestone tracking
- Request updates/changes
- Service ratings after completion
- Contract overview
- Download executive reports
```

### 9.5 MSP Reporting & Analytics

**Consolidated MSP Dashboard:**
```typescript
export class MSPAnalyticsService {
  static async getMSPDashboard(orgId: string) {
    // Client summary
    const clients = await db.collection('clients').find({ orgId }).toArray()

    const clientMetrics = await Promise.all(
      clients.map(async (client) => {
        const projects = await db.collection('projects').find({
          orgId,
          clientId: client._id
        }).toArray()

        const activeProjects = projects.filter(p => p.status === 'active')
        const revenue = await this.calculateClientRevenue(client._id, orgId)

        return {
          clientId: client._id,
          clientName: client.name,
          activeProjects: activeProjects.length,
          totalProjects: projects.length,
          revenue,
          health: this.assessClientHealth(projects)
        }
      })
    )

    // Resource utilization across all clients
    const resourceUtil = await this.getCrossClientResourceUtilization(orgId)

    // Project portfolio health
    const allProjects = await db.collection('projects').find({ orgId }).toArray()
    const portfolioHealth = {
      total: allProjects.length,
      green: allProjects.filter(p => p.health === 'green').length,
      yellow: allProjects.filter(p => p.health === 'yellow').length,
      red: allProjects.filter(p => p.health === 'red').length
    }

    // Revenue forecast
    const forecast = await this.getRevenueForecast(orgId, 6) // 6 months

    return {
      clientMetrics,
      resourceUtilization: resourceUtil,
      portfolioHealth,
      revenueForecast: forecast,
      summary: {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.status === 'active').length,
        totalProjects: allProjects.length,
        totalRevenue: clientMetrics.reduce((sum, c) => sum + c.revenue, 0)
      }
    }
  }

  static async getClientComparison(orgId: string) {
    // Compare clients across key metrics
    const clients = await db.collection('clients').find({ orgId }).toArray()

    return Promise.all(
      clients.map(async (client) => {
        const projects = await db.collection('projects').find({
          orgId,
          clientId: client._id
        }).toArray()

        const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
        const totalSpent = projects.reduce((sum, p) => sum + (p.usedBudget || 0), 0)

        const onTimeDelivery = projects.filter(p =>
          p.status === 'completed' &&
          p.actualEndDate <= p.plannedEndDate
        ).length / projects.filter(p => p.status === 'completed').length

        return {
          clientName: client.name,
          projectCount: projects.length,
          totalBudget,
          totalSpent,
          profitMargin: ((totalBudget - totalSpent) / totalBudget) * 100,
          onTimeDeliveryRate: onTimeDelivery * 100,
          avgProjectDuration: this.calculateAvgDuration(projects),
          satisfaction: await this.getClientSatisfaction(client._id, orgId)
        }
      })
    )
  }
}
```

---

## 10. AI & Automation

### 10.1 AI-Assisted Scheduling

**Feature:** Auto-generate project schedule from task list using AI.

**Implementation:**
```typescript
import { generateText } from '@google/generative-ai'

export class AISchedulingService {
  static async generateSchedule(projectId: string, tasks: ProjectTask[]) {
    // Build prompt
    const prompt = `
You are a project scheduling expert. Given the following tasks for a project, generate an optimal schedule.

Project: ${project.name}
Start Date: ${project.plannedStartDate}
End Date: ${project.plannedEndDate}

Tasks:
${tasks.map(t => `
- ${t.title} (${t.estimatedHours}h)
  Dependencies: ${t.dependencies.join(', ') || 'None'}
  Skills needed: ${t.requiredSkills?.join(', ')}
`).join('\n')}

Available Resources:
${resources.map(r => `- ${r.userName}: ${r.hoursPerWeek}h/week, Skills: ${r.skills.join(', ')}`).join('\n')}

Generate a detailed schedule in JSON format with:
1. Task assignments (who works on what)
2. Start/end dates for each task
3. Critical path identification
4. Milestone suggestions
5. Risk assessment for timeline

Optimize for:
- Parallel execution where possible
- Skill matching
- Resource load balancing
- Critical path minimization

Return JSON only, no explanation.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.3, // Low temperature for more deterministic output
      maxOutputTokens: 4096
    })

    const schedule = JSON.parse(result.text)

    // Apply schedule to tasks
    await this.applySchedule(projectId, schedule)

    return schedule
  }

  static async optimizeSchedule(projectId: string, constraints: ScheduleConstraints) {
    // Re-optimize existing schedule based on new constraints
    // E.g., new resource availability, changed deadlines, new dependencies

    const project = await ProjectService.getProjectById(projectId)
    const tasks = await TaskService.getTasks(projectId)
    const resources = await ResourceService.getProjectResources(projectId)

    const prompt = `
Current schedule has issues:
${constraints.issues.join('\n')}

Optimize the schedule while considering:
- Fixed deadlines: ${constraints.fixedDeadlines}
- Resource constraints: ${constraints.resourceLimits}
- Must-have milestones: ${constraints.milestones}

Current task schedule:
${tasks.map(t => `${t.title}: ${t.plannedStartDate} - ${t.plannedEndDate}`).join('\n')}

Provide optimized schedule that resolves the issues.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt
    })

    return JSON.parse(result.text)
  }
}
```

### 10.2 Risk Prediction

**Feature:** AI analyzes project data to predict risks.

**Implementation:**
```typescript
export class AIRiskPredictionService {
  static async predictRisks(projectId: string) {
    const project = await ProjectService.getProjectById(projectId)
    const tasks = await TaskService.getTasks(projectId)
    const resources = await ResourceService.getProjectResources(projectId)
    const historicalData = await this.getHistoricalProjects(project.category)

    const prompt = `
Analyze this project and predict potential risks:

Project: ${project.name}
Budget: $${project.budget} (Used: $${project.usedBudget})
Timeline: ${project.plannedStartDate} to ${project.plannedEndDate}
Progress: ${project.progress}%
Team Size: ${project.teamMembers.length}

Tasks:
${tasks.map(t => `- ${t.title}: ${t.status}, ${t.actualHours || 0}h/${t.estimatedHours}h`).join('\n')}

Resource Utilization:
${resources.map(r => `- ${r.userName}: ${r.allocationPercentage}%`).join('\n')}

Historical Data (Similar Projects):
${historicalData.map(p => `
- ${p.name}: ${p.status}, Budget Variance: ${p.budgetVariance}%, Schedule Variance: ${p.scheduleVariance}%
`).join('\n')}

Identify potential risks in these categories:
1. Schedule risks (delays, dependencies)
2. Budget risks (overruns, cost increases)
3. Resource risks (over-allocation, skill gaps, turnover)
4. Technical risks (complexity, dependencies, integration)
5. Stakeholder risks (engagement, approval delays)

For each risk, provide:
- Title
- Description
- Probability (very_low, low, medium, high, very_high)
- Impact (very_low, low, medium, high, very_high)
- Mitigation suggestions
- Early warning signs

Return JSON array of risks.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.5
    })

    const risks = JSON.parse(result.text)

    // Auto-create high-probability, high-impact risks in RAID register
    for (const risk of risks) {
      if (risk.probabilityScore >= 4 && risk.impactScore >= 4) {
        await RiskService.createRisk(projectId, {
          ...risk,
          category: risk.category || 'ai_predicted',
          createdBy: 'ai_system'
        })
      }
    }

    return risks
  }

  static async analyzeRiskTrends(projectId: string) {
    // Analyze how risks are evolving over time
    const risks = await RiskService.getProjectRisks(projectId)
    const riskHistory = await db.collection('project_risk_history').find({
      projectId
    }).sort({ timestamp: 1 }).toArray()

    const prompt = `
Risk history for project:
${riskHistory.map(h => `${h.timestamp}: ${h.riskCount} total, ${h.highRisks} high, ${h.mitigatedRisks} mitigated`).join('\n')}

Current risks:
${risks.map(r => `${r.riskNumber}: ${r.title} (${r.probability}/${r.impact}) - ${r.status}`).join('\n')}

Analyze:
1. Are risks increasing or decreasing?
2. Are high-impact risks being mitigated effectively?
3. Are new risk categories emerging?
4. What actions should PM take?

Provide concise analysis and recommendations.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt
    })

    return result.text
  }
}
```

### 10.3 Scope Change Impact Analysis

**Feature:** AI estimates impact of proposed scope changes.

**Implementation:**
```typescript
export class AIScopeAnalysisService {
  static async analyzeChangeImpact(
    projectId: string,
    changeRequest: ProjectChangeRequest
  ) {
    const project = await ProjectService.getProjectById(projectId)
    const tasks = await TaskService.getTasks(projectId)
    const resources = await ResourceService.getProjectResources(projectId)

    const prompt = `
A change request has been submitted for this project:

Project: ${project.name}
Current Status: ${project.status} (${project.progress}% complete)
Remaining Budget: $${project.budget - project.usedBudget}
Days to Deadline: ${this.daysRemaining(project.plannedEndDate)}

Change Request: ${changeRequest.title}
Description: ${changeRequest.description}
Type: ${changeRequest.changeType}

Current Tasks:
${tasks.filter(t => t.status !== 'completed').map(t =>
  `- ${t.title}: ${t.estimatedHours}h, Due: ${t.dueDate}`
).join('\n')}

Analyze the impact of this change:

1. Schedule Impact:
   - Estimated delay in days
   - Affected tasks (by task number)
   - New critical path
   - Affected milestones

2. Budget Impact:
   - Additional cost estimate
   - Budget category breakdown
   - Resource cost changes

3. Resource Impact:
   - New skills required
   - Additional resource needs
   - Current team capacity

4. Risk Impact:
   - New risks introduced
   - Existing risks affected
   - Overall risk score change

5. Quality Impact:
   - Testing impact
   - Technical debt
   - Integration complexity

Return detailed JSON with all impact categories.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.4
    })

    const impact = JSON.parse(result.text)

    // Update change request with AI analysis
    await db.collection('project_change_requests').updateOne(
      { _id: changeRequest._id },
      {
        $set: {
          aiImpactAnalysis: impact,
          analyzedAt: new Date()
        }
      }
    )

    // Generate recommendation
    const recommendation = this.generateRecommendation(impact)

    return {
      impact,
      recommendation
    }
  }

  static generateRecommendation(impact: ChangeImpact): string {
    let recommendation = ''

    // Schedule impact
    if (impact.schedule.delayDays > 14) {
      recommendation += '⚠️ Significant schedule delay expected. '
    }

    // Budget impact
    const budgetIncreasePct = (impact.budget.additionalCost / impact.budget.currentBudget) * 100
    if (budgetIncreasePct > 15) {
      recommendation += '⚠️ Budget increase exceeds 15%. Requires sponsor approval. '
    }

    // Overall risk
    if (impact.risk.overallRiskScore > 15) {
      recommendation += '🔴 High risk change. Consider alternatives or phased implementation. '
    }

    if (recommendation === '') {
      recommendation = '🟢 Low impact change. Can be approved with minimal disruption.'
    }

    return recommendation
  }
}
```

### 10.4 Automated Status Updates

**Feature:** AI generates project status summaries.

**Implementation:**
```typescript
export class AIStatusReportingService {
  static async generateWeeklyStatus(projectId: string) {
    const project = await ProjectService.getProjectById(projectId)
    const tasks = await TaskService.getTasks(projectId)
    const thisWeekTasks = tasks.filter(t =>
      t.completedAt >= startOfWeek(new Date()) ||
      t.updatedAt >= startOfWeek(new Date())
    )

    const risks = await RiskService.getProjectRisks(projectId)
    const issues = await IssueService.getProjectIssues(projectId)

    const prompt = `
Generate a concise weekly project status report:

Project: ${project.name}
Overall Status: ${project.status} (${project.health})
Progress: ${project.progress}% (+${this.weeklyProgressChange(project)}% this week)

This Week's Accomplishments:
${thisWeekTasks.filter(t => t.status === 'completed').map(t => `- ${t.title}`).join('\n')}

In Progress:
${tasks.filter(t => t.status === 'in_progress').map(t => `- ${t.title} (${t.assignedToName})`).join('\n')}

Upcoming Next Week:
${tasks.filter(t => t.status === 'todo' && t.dueDate <= nextWeek()).map(t => `- ${t.title}`).join('\n')}

Active Risks: ${risks.filter(r => r.status !== 'closed').length}
Open Issues: ${issues.filter(i => i.status === 'open').length}

Budget: $${project.usedBudget} / $${project.budget} (${(project.usedBudget/project.budget*100).toFixed(1)}%)
Schedule: ${this.scheduleStatus(project)}

Write a brief executive summary (3-4 sentences) highlighting key progress, concerns, and next steps.
Use professional tone. No bullet points in summary.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.6
    })

    const summary = result.text

    // Save status report
    await db.collection('project_status_reports').insertOne({
      projectId,
      weekOf: startOfWeek(new Date()),
      summary,
      generatedBy: 'ai_system',
      generatedAt: new Date(),
      metrics: {
        progress: project.progress,
        budget: project.usedBudget,
        health: project.health,
        tasksCompleted: thisWeekTasks.filter(t => t.status === 'completed').length,
        activeRisks: risks.filter(r => r.status !== 'closed').length,
        openIssues: issues.filter(i => i.status === 'open').length
      }
    })

    // Send to stakeholders
    await NotificationService.send({
      users: project.stakeholders,
      type: 'weekly_status_report',
      subject: `Weekly Status: ${project.name}`,
      body: summary
    })

    return summary
  }
}
```

### 10.5 Smart Notifications

**Feature:** AI-driven intelligent notifications.

**Implementation:**
```typescript
export class AINotificationService {
  static async analyzeNotificationPriority(event: ProjectEvent) {
    // Determine if event warrants notification and to whom

    const prompt = `
Project event occurred:
Event: ${event.type}
Project: ${event.projectName}
Details: ${event.details}

Project Context:
- Health: ${event.projectHealth}
- Progress: ${event.projectProgress}%
- Days to deadline: ${event.daysToDeadline}
- Budget utilization: ${event.budgetUtilization}%

Determine:
1. Should we notify anyone? (yes/no)
2. Priority level (low/medium/high/critical)
3. Who to notify (pm, sponsor, team, stakeholders, all)
4. Urgency (can wait 1 hour, 15 minutes, immediate)
5. Suggested notification message (2 sentences max)

Example: If project is healthy and task completed on time, low priority.
Example: If project is red health and budget threshold crossed, critical priority, notify sponsor immediately.

Return JSON with notification decision.
`

    const result = await generateText({
      model: 'gemini-2.0-flash',
      prompt,
      temperature: 0.3
    })

    const decision = JSON.parse(result.text)

    if (decision.shouldNotify) {
      await NotificationService.send({
        users: this.resolveRecipients(decision.recipients, event.projectId),
        type: event.type,
        priority: decision.priority,
        urgency: decision.urgency,
        message: decision.message
      })
    }

    return decision
  }
}
```

---

## 11. Reporting & Analytics

### 11.1 Executive Dashboard

**Portfolio Overview:**
```typescript
export class ExecutiveDashboardService {
  static async getExecutiveDashboard(orgId: string) {
    // High-level portfolio metrics
    const portfolios = await db.collection('portfolios').find({ orgId }).toArray()
    const allProjects = await db.collection('projects').find({ orgId, isActive: true }).toArray()

    // Key metrics
    const metrics = {
      // Portfolio health
      totalPortfolios: portfolios.length,
      portfolioHealthDistribution: {
        green: portfolios.filter(p => p.healthScore >= 80).length,
        yellow: portfolios.filter(p => p.healthScore >= 60 && p.healthScore < 80).length,
        red: portfolios.filter(p => p.healthScore < 60).length
      },

      // Project metrics
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter(p => p.status === 'active').length,
      projectHealthDistribution: {
        green: allProjects.filter(p => p.health === 'green').length,
        yellow: allProjects.filter(p => p.health === 'yellow').length,
        red: allProjects.filter(p => p.health === 'red').length
      },

      // Financial
      totalBudget: allProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
      spentBudget: allProjects.reduce((sum, p) => sum + (p.usedBudget || 0), 0),
      forecastVariance: await this.calculateForecastVariance(allProjects),

      // Performance
      onTimeDeliveryRate: await this.calculateOnTimeRate(allProjects),
      avgBudgetVariance: await this.calculateAvgBudgetVariance(allProjects),

      // Resource
      resourceUtilization: await this.getOrgResourceUtilization(orgId),
      overallocatedResources: await this.getOverallocatedCount(orgId),

      // Risk
      highRiskProjects: allProjects.filter(p => p.riskScore >= 15).length,
      totalOpenRisks: await this.getTotalOpenRisks(orgId)
    }

    // Trending data (vs last quarter)
    const trends = await this.calculateTrends(orgId, metrics)

    // Top concerns
    const concerns = await this.identifyTopConcerns(allProjects)

    return {
      metrics,
      trends,
      concerns,
      portfolios: portfolios.map(p => ({
        id: p._id,
        name: p.name,
        projectCount: allProjects.filter(pr => pr.portfolioId === p._id).length,
        healthScore: p.healthScore,
        totalBudget: p.totalBudget,
        spentBudget: p.spentBudget
      }))
    }
  }

  static async identifyTopConcerns(projects: Project[]) {
    const concerns = []

    // Budget overruns
    const overrunProjects = projects.filter(p =>
      p.usedBudget > p.budget && p.status !== 'completed'
    )
    if (overrunProjects.length > 0) {
      concerns.push({
        type: 'budget_overrun',
        severity: 'high',
        count: overrunProjects.length,
        message: `${overrunProjects.length} projects over budget`,
        projects: overrunProjects.map(p => p.projectNumber)
      })
    }

    // Schedule delays
    const delayedProjects = projects.filter(p =>
      p.status === 'active' &&
      new Date(p.plannedEndDate) < new Date() &&
      p.progress < 100
    )
    if (delayedProjects.length > 0) {
      concerns.push({
        type: 'schedule_delay',
        severity: 'high',
        count: delayedProjects.length,
        message: `${delayedProjects.length} projects past deadline`,
        projects: delayedProjects.map(p => p.projectNumber)
      })
    }

    // Resource over-allocation
    const resourceIssue = await this.getOverallocatedCount()
    if (resourceIssue > 0) {
      concerns.push({
        type: 'resource_overallocation',
        severity: 'medium',
        count: resourceIssue,
        message: `${resourceIssue} resources over-allocated`
      })
    }

    return concerns.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }
}
```

### 11.2 Project Manager Dashboard

**PM-Specific Metrics:**
```typescript
export class PMDashboardService {
  static async getPMDashboard(userId: string, orgId: string) {
    // Projects where user is PM
    const myProjects = await db.collection('projects').find({
      orgId,
      projectManager: userId,
      isActive: true
    }).toArray()

    // My tasks across all projects
    const myTasks = await db.collection('project_tasks').find({
      orgId,
      $or: [
        { assignedTo: userId },
        { createdBy: userId }
      ],
      status: { $ne: 'completed' }
    }).toArray()

    // Approvals needed
    const pendingApprovals = await this.getPendingApprovals(userId, orgId)

    // Upcoming milestones (next 30 days)
    const upcomingMilestones = await db.collection('project_milestones').find({
      orgId,
      projectId: { $in: myProjects.map(p => p._id) },
      plannedDate: {
        $gte: new Date(),
        $lte: addDays(new Date(), 30)
      },
      status: { $ne: 'achieved' }
    }).sort({ plannedDate: 1 }).toArray()

    // At-risk items
    const atRiskProjects = myProjects.filter(p => p.health === 'red' || p.health === 'yellow')

    return {
      projects: {
        total: myProjects.length,
        green: myProjects.filter(p => p.health === 'green').length,
        yellow: myProjects.filter(p => p.health === 'yellow').length,
        red: myProjects.filter(p => p.health === 'red').length
      },

      tasks: {
        total: myTasks.length,
        overdue: myTasks.filter(t => t.dueDate && t.dueDate < new Date()).length,
        dueSoon: myTasks.filter(t =>
          t.dueDate &&
          t.dueDate >= new Date() &&
          t.dueDate <= addDays(new Date(), 7)
        ).length
      },

      approvals: {
        pending: pendingApprovals.length,
        categories: _.countBy(pendingApprovals, 'type')
      },

      milestones: {
        upcoming: upcomingMilestones.length,
        next: upcomingMilestones[0] // Soonest milestone
      },

      attention: {
        atRiskProjects: atRiskProjects.length,
        budgetConcerns: myProjects.filter(p =>
          p.usedBudget / p.budget > 0.9
        ).length,
        scheduleSlips: myProjects.filter(p =>
          p.evm?.schedulePerformanceIndex < 0.9
        ).length
      },

      recentActivity: await this.getRecentActivity(userId, myProjects),

      recommendations: await this.generateRecommendations(userId, myProjects)
    }
  }

  static async generateRecommendations(userId: string, projects: Project[]) {
    const recommendations = []

    // Check for projects nearing milestones without completed tasks
    for (const project of projects) {
      const nextMilestone = await db.collection('project_milestones').findOne({
        projectId: project._id,
        plannedDate: { $gte: new Date() },
        status: 'planned'
      }, { sort: { plannedDate: 1 } })

      if (nextMilestone && nextMilestone.plannedDate <= addDays(new Date(), 14)) {
        const milestoneTasks = await db.collection('project_tasks').find({
          projectId: project._id,
          milestoneId: nextMilestone._id,
          status: { $ne: 'completed' }
        }).toArray()

        if (milestoneTasks.length > 0) {
          recommendations.push({
            type: 'milestone_risk',
            priority: 'high',
            project: project.projectNumber,
            message: `Milestone "${nextMilestone.name}" in ${differenceInDays(nextMilestone.plannedDate, new Date())} days has ${milestoneTasks.length} incomplete tasks`,
            action: 'Review task assignments and consider reallocating resources'
          })
        }
      }
    }

    // Check for budget concerns
    const budgetRisk = projects.filter(p =>
      p.budget &&
      p.usedBudget / p.budget > 0.85 &&
      p.progress < 85
    )

    if (budgetRisk.length > 0) {
      recommendations.push({
        type: 'budget_risk',
        priority: 'high',
        message: `${budgetRisk.length} projects have spent >85% of budget with <85% progress`,
        action: 'Review project scope and consider change requests'
      })
    }

    return recommendations
  }
}
```

### 11.3 Custom Reports

**Report Builder:**
```typescript
export class CustomReportService {
  static async generateReport(reportConfig: ReportConfig) {
    const {
      type, // 'project_status', 'budget_variance', 'resource_utilization', etc.
      filters,
      groupBy,
      metrics,
      format // 'pdf', 'excel', 'csv', 'json'
    } = reportConfig

    // Build query from filters
    const query = this.buildQuery(filters)

    // Get data
    const data = await this.fetchReportData(type, query)

    // Apply grouping
    const grouped = groupBy ? _.groupBy(data, groupBy) : { 'All': data }

    // Calculate metrics
    const results = Object.entries(grouped).map(([group, items]) => ({
      group,
      metrics: this.calculateMetrics(items, metrics)
    }))

    // Format output
    switch (format) {
      case 'pdf':
        return this.generatePDF(results, reportConfig)
      case 'excel':
        return this.generateExcel(results, reportConfig)
      case 'csv':
        return this.generateCSV(results, reportConfig)
      default:
        return results
    }
  }

  static buildQuery(filters: ReportFilters) {
    const query: any = {}

    if (filters.portfolioIds?.length > 0) {
      query.portfolioId = { $in: filters.portfolioIds }
    }

    if (filters.clientIds?.length > 0) {
      query.clientId = { $in: filters.clientIds }
    }

    if (filters.projectManagers?.length > 0) {
      query.projectManager = { $in: filters.projectManagers }
    }

    if (filters.status?.length > 0) {
      query.status = { $in: filters.status }
    }

    if (filters.health?.length > 0) {
      query.health = { $in: filters.health }
    }

    if (filters.dateRange) {
      query.createdAt = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      }
    }

    return query
  }

  static calculateMetrics(items: any[], metrics: string[]) {
    const result = {}

    for (const metric of metrics) {
      switch (metric) {
        case 'count':
          result[metric] = items.length
          break

        case 'totalBudget':
          result[metric] = items.reduce((sum, i) => sum + (i.budget || 0), 0)
          break

        case 'totalSpent':
          result[metric] = items.reduce((sum, i) => sum + (i.usedBudget || 0), 0)
          break

        case 'avgProgress':
          result[metric] = items.reduce((sum, i) => sum + i.progress, 0) / items.length
          break

        case 'onTimeRate':
          const completed = items.filter(i => i.status === 'completed')
          const onTime = completed.filter(i => i.actualEndDate <= i.plannedEndDate)
          result[metric] = completed.length > 0
            ? (onTime.length / completed.length) * 100
            : 0
          break

        // Add more metrics as needed
      }
    }

    return result
  }
}
```

### 11.4 Benefits Realization Tracking

**Post-Project Benefits Monitoring:**
```typescript
export class BenefitsRealizationService {
  static async trackBenefits(projectId: string) {
    const project = await ProjectService.getProjectById(projectId)

    if (project.status !== 'closed' && project.status !== 'completed') {
      throw new Error('Can only track benefits for completed/closed projects')
    }

    // Get expected benefits from project
    const expectedBenefits = project.expectedBenefits || []

    // Check realization status
    for (const benefit of expectedBenefits) {
      if (benefit.realizationDate && benefit.realizationDate <= new Date()) {
        // Benefit should be realized by now - check actual value
        if (!benefit.actualValue) {
          // Send reminder to update
          await NotificationService.send({
            users: [project.projectManager, project.projectSponsor],
            type: 'benefits_update_needed',
            message: `Benefit "${benefit.description}" expected to be realized by ${benefit.realizationDate}. Please update actual value.`
          })
        } else {
          // Calculate variance
          const variance = benefit.actualValue - benefit.targetValue
          const variancePct = (variance / benefit.targetValue) * 100

          if (variancePct < -10) {
            // Under-delivered
            await NotificationService.send({
              users: [project.projectSponsor],
              type: 'benefits_shortfall',
              priority: 'high',
              message: `Benefit shortfall: "${benefit.description}" achieved ${benefit.actualValue} vs target ${benefit.targetValue} (${variancePct.toFixed(1)}% below target)`
            })
          }
        }
      }
    }

    // Generate benefits realization report
    return {
      projectId,
      projectName: project.name,
      closureDate: project.actualEndDate,
      benefits: expectedBenefits.map(b => ({
        ...b,
        status: this.determineBenefitStatus(b),
        variance: b.actualValue ? b.actualValue - b.targetValue : null,
        variancePercentage: b.actualValue
          ? ((b.actualValue - b.targetValue) / b.targetValue) * 100
          : null
      })),
      overallRealizationRate: this.calculateRealizationRate(expectedBenefits)
    }
  }

  static determineBenefitStatus(benefit: ExpectedBenefit) {
    if (!benefit.realizationDate || benefit.realizationDate > new Date()) {
      return 'pending'
    }

    if (!benefit.actualValue) {
      return 'not_measured'
    }

    const variance = ((benefit.actualValue - benefit.targetValue) / benefit.targetValue) * 100

    if (variance >= 0) {
      return 'realized'
    } else if (variance >= -10) {
      return 'partially_realized'
    } else {
      return 'not_realized'
    }
  }

  static calculateRealizationRate(benefits: ExpectedBenefit[]) {
    const measurableBenefits = benefits.filter(b =>
      b.quantifiable && b.realizationDate && b.realizationDate <= new Date()
    )

    if (measurableBenefits.length === 0) return null

    const realized = measurableBenefits.filter(b =>
      b.actualValue && b.actualValue >= b.targetValue * 0.9
    )

    return (realized.length / measurableBenefits.length) * 100
  }

  // Schedule recurring job to check benefits
  static async scheduleBenefitsChecks() {
    // Run monthly
    cron.schedule('0 0 1 * *', async () => {
      const closedProjects = await db.collection('projects').find({
        status: { $in: ['completed', 'closed'] },
        actualEndDate: {
          $gte: subMonths(new Date(), 12), // Within last year
          $lte: new Date()
        }
      }).toArray()

      for (const project of closedProjects) {
        await this.trackBenefits(project._id)
      }
    })
  }
}
```

---

**(Continuing in next file due to length...)**
