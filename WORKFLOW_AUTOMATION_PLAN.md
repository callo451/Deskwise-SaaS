# Workflow Automation System - Implementation Plan

## Executive Summary

This document outlines a comprehensive workflow automation system for Deskwise ITSM, featuring a visual drag-and-drop builder powered by React Flow with custom styling and full integration with all platform API routes.

---

## Table of Contents

1. [Research Findings](#research-findings)
2. [System Architecture](#system-architecture)
3. [Data Models](#data-models)
4. [Node Types](#node-types)
5. [Implementation Phases](#implementation-phases)
6. [Technical Stack](#technical-stack)
7. [Custom Styling Approach](#custom-styling-approach)
8. [API Integration](#api-integration)
9. [Execution Engine](#execution-engine)
10. [User Interface](#user-interface)

---

## Research Findings

### ITSM Workflow Best Practices (2024)

Based on research of ServiceNow, Jira Service Management, and Freshservice:

#### Core Principles
1. **No-Code/Low-Code First**: Enable non-technical users to build workflows
2. **Visual Workflow Design**: Drag-and-drop interface with clear node connections
3. **Template Library**: Pre-built workflows for common ITSM processes
4. **Smart Assignment**: AI-powered routing based on multiple factors
5. **Approval Workflows**: Multi-level approval chains with notifications
6. **SLA Integration**: Automatic escalation and deadline tracking
7. **Audit Trail**: Complete logging of workflow executions

#### Key Features from Leading Platforms

**ServiceNow:**
- Enterprise-scale automation
- Deep ITIL alignment
- Dynamic task assignment
- AI-powered suggestions
- Complex conditional logic

**Jira Service Management:**
- Intuitive automation rules
- DevOps integration
- Automation playground (sandbox)
- Pre-built templates
- Quick deployment

**Freshservice:**
- Observer rules (trigger-based)
- Multi-condition workflows
- Auto-routing capabilities
- Approval nodes with state management
- 24/7 automated processing

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Workflow Builder UI                          │
│  (React Flow + Custom Nodes + Tailwind CSS + shadcn/ui)        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                   Workflow Service Layer                         │
│  • Workflow CRUD Operations                                      │
│  • Validation & Versioning                                       │
│  • Template Management                                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                 Workflow Execution Engine                        │
│  • Event Listener (Triggers)                                     │
│  • Node Processor (Conditional Logic)                            │
│  • Action Executor (API Calls)                                   │
│  • State Management (Execution Context)                          │
│  • Error Handling & Retry Logic                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                      Database Layer                              │
│  • workflows (definitions)                                       │
│  • workflow_executions (history)                                 │
│  • workflow_templates (pre-built)                                │
│  • workflow_logs (audit trail)                                   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                  Integration Layer (APIs)                        │
│  Tickets | Incidents | Problems | Service Requests | Changes    │
│  Assets | Users | KB | Projects | Scheduling | Billing          │
└─────────────────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── components/
│   ├── workflows/
│   │   ├── builder/
│   │   │   ├── WorkflowBuilder.tsx          # Main builder component
│   │   │   ├── WorkflowCanvas.tsx           # React Flow canvas
│   │   │   ├── NodePalette.tsx              # Drag-and-drop node list
│   │   │   ├── PropertiesPanel.tsx          # Node configuration panel
│   │   │   ├── Toolbar.tsx                  # Save, test, deploy buttons
│   │   │   └── MiniMap.tsx                  # Workflow overview
│   │   ├── nodes/
│   │   │   ├── TriggerNode.tsx              # Workflow entry points
│   │   │   ├── ConditionNode.tsx            # If/then logic
│   │   │   ├── ActionNode.tsx               # API actions
│   │   │   ├── ApprovalNode.tsx             # Approval requests
│   │   │   ├── DelayNode.tsx                # Wait/schedule
│   │   │   ├── NotificationNode.tsx         # Email/SMS/webhook
│   │   │   ├── AssignmentNode.tsx           # Auto-assignment
│   │   │   ├── SLANode.tsx                  # SLA management
│   │   │   ├── TransformNode.tsx            # Data transformation
│   │   │   ├── LoopNode.tsx                 # Iterate over items
│   │   │   ├── MergeNode.tsx                # Combine branches
│   │   │   └── EndNode.tsx                  # Workflow termination
│   │   ├── edges/
│   │   │   ├── ConditionalEdge.tsx          # True/false paths
│   │   │   └── DefaultEdge.tsx              # Standard connections
│   │   └── execution/
│   │       ├── ExecutionHistory.tsx         # Past runs
│   │       ├── ExecutionDetails.tsx         # Individual run view
│   │       └── ExecutionMetrics.tsx         # Performance stats
│   └── ui/                                   # shadcn/ui components
├── lib/
│   ├── services/
│   │   ├── workflows.ts                     # Workflow CRUD
│   │   ├── workflow-execution.ts            # Execution engine
│   │   └── workflow-templates.ts            # Template management
│   ├── workflow-engine/
│   │   ├── executor.ts                      # Core execution logic
│   │   ├── node-handlers/                   # Individual node processors
│   │   ├── triggers.ts                      # Event listeners
│   │   ├── context.ts                       # Execution state
│   │   └── validators.ts                    # Workflow validation
│   └── types/
│       └── workflows.ts                     # TypeScript definitions
└── app/
    ├── api/
    │   ├── workflows/
    │   │   ├── route.ts                     # GET, POST
    │   │   ├── [id]/route.ts                # GET, PUT, DELETE
    │   │   ├── [id]/execute/route.ts        # Manual execution
    │   │   ├── [id]/test/route.ts           # Dry run
    │   │   └── [id]/clone/route.ts          # Duplicate
    │   ├── workflow-executions/
    │   │   ├── route.ts                     # List executions
    │   │   └── [id]/route.ts                # Execution details
    │   └── workflow-templates/
    │       └── route.ts                     # Template CRUD
    └── (app)/
        └── workflows/
            ├── page.tsx                     # List view
            ├── new/page.tsx                 # Create workflow
            ├── [id]/page.tsx                # Edit workflow
            └── [id]/executions/page.tsx     # Execution history
```

---

## Data Models

### Workflow Definition

```typescript
interface Workflow {
  _id: ObjectId
  orgId: string
  name: string
  description: string
  category: 'incident' | 'service-request' | 'change' | 'problem' | 'ticket' | 'asset' | 'approval' | 'notification' | 'custom'
  status: 'draft' | 'active' | 'inactive' | 'archived'
  version: number

  // React Flow data
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport: { x: number; y: number; zoom: number }

  // Trigger configuration
  trigger: {
    type: 'manual' | 'event' | 'schedule' | 'webhook'
    config: TriggerConfig
  }

  // Metadata
  templateId?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lastExecutedAt?: Date
  executionCount: number

  // Settings
  settings: {
    enabled: boolean
    runAsync: boolean
    maxRetries: number
    timeout: number // milliseconds
    onError: 'stop' | 'continue' | 'notify'
    notifyOnFailure: boolean
    notifyEmails: string[]
  }

  // Analytics
  metrics: {
    averageExecutionTime: number
    successRate: number
    lastError?: string
  }
}

interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: NodeData
  style?: React.CSSProperties
  className?: string
}

type WorkflowNodeType =
  | 'trigger'
  | 'condition'
  | 'action'
  | 'approval'
  | 'delay'
  | 'notification'
  | 'assignment'
  | 'sla'
  | 'transform'
  | 'loop'
  | 'merge'
  | 'end'

interface NodeData {
  label: string
  description?: string
  icon: string
  color: string
  config: Record<string, any> // Node-specific configuration
  errors?: string[]
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: 'default' | 'conditional'
  data?: {
    label?: string
    condition?: string
  }
  animated?: boolean
  style?: React.CSSProperties
}

interface TriggerConfig {
  // Event-based trigger
  module?: 'tickets' | 'incidents' | 'problems' | 'service-requests' | 'changes' | 'assets'
  event?: 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned'
  conditions?: FilterCondition[]

  // Schedule-based trigger
  schedule?: {
    type: 'once' | 'recurring'
    startDate?: Date
    cron?: string
    timezone?: string
  }

  // Webhook trigger
  webhook?: {
    url: string
    secret: string
    method: 'GET' | 'POST' | 'PUT'
  }
}

interface FilterCondition {
  field: string
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than' | 'in' | 'not-in' | 'is-empty' | 'is-not-empty'
  value: any
}
```

### Workflow Execution

```typescript
interface WorkflowExecution {
  _id: ObjectId
  orgId: string
  workflowId: string
  workflowName: string
  version: number

  // Trigger info
  triggeredBy: 'user' | 'event' | 'schedule' | 'webhook'
  triggeredByUser?: string
  triggerData: Record<string, any>

  // Execution state
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds

  // Node execution tracking
  nodeExecutions: NodeExecution[]

  // Results
  output?: Record<string, any>
  error?: {
    message: string
    stack?: string
    nodeId?: string
  }

  // Context (data passed between nodes)
  context: ExecutionContext

  createdAt: Date
}

interface NodeExecution {
  nodeId: string
  nodeType: WorkflowNodeType
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt: Date
  completedAt?: Date
  duration?: number
  input?: Record<string, any>
  output?: Record<string, any>
  error?: string
  retryCount: number
}

interface ExecutionContext {
  // Original trigger data
  trigger: Record<string, any>

  // Current item being processed (e.g., ticket, incident)
  item: Record<string, any>

  // Variables set by nodes
  variables: Record<string, any>

  // User who triggered the workflow
  user: {
    id: string
    email: string
    name: string
    role: string
  }

  // Organization context
  orgId: string
}
```

### Workflow Template

```typescript
interface WorkflowTemplate {
  _id: ObjectId
  name: string
  description: string
  category: string
  icon: string
  tags: string[]

  // Template definition
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: TriggerConfig

  // Metadata
  isSystem: boolean // Built-in vs custom
  orgId?: string // null for system templates
  usageCount: number
  rating: number

  createdAt: Date
  updatedAt: Date
}
```

---

## Node Types

### 1. Trigger Node (Entry Point)

**Purpose**: Defines when the workflow starts

**Types**:
- **Event-based**: Ticket created, Status changed, Asset assigned
- **Schedule-based**: Daily report, Weekly review, Monthly cleanup
- **Manual**: Button click, API call
- **Webhook**: External system integration

**Configuration**:
```typescript
{
  type: 'event',
  module: 'tickets',
  event: 'created',
  conditions: [
    { field: 'priority', operator: 'equals', value: 'critical' },
    { field: 'category', operator: 'equals', value: 'Security' }
  ]
}
```

**Visual Style**:
- Gradient background (blue to purple)
- Lightning bolt icon
- Glow effect when active
- Badge showing trigger type

---

### 2. Condition Node (Decision)

**Purpose**: Branch workflow based on conditions

**Operators**:
- equals, not-equals
- contains, not-contains
- greater-than, less-than, between
- in, not-in
- is-empty, is-not-empty
- matches-regex

**Configuration**:
```typescript
{
  conditions: [
    {
      field: 'item.priority',
      operator: 'equals',
      value: 'critical'
    }
  ],
  logicOperator: 'AND' | 'OR',
  outputHandles: ['true', 'false']
}
```

**Visual Style**:
- Diamond shape
- Amber/orange theme
- Two connection points (true/false)
- Condition summary visible

---

### 3. Action Node (API Call)

**Purpose**: Perform operations on ITSM objects

**Action Types**:
- **Create**: New ticket, incident, asset
- **Update**: Status, assignee, priority, custom fields
- **Delete**: Soft delete item
- **Send**: Email, SMS, webhook
- **Add**: Comment, attachment, tag
- **Calculate**: Priority from impact/urgency
- **Search**: Find related items
- **Transform**: Data manipulation

**Configuration**:
```typescript
{
  action: 'update',
  module: 'tickets',
  itemId: '{{trigger.item._id}}',
  updates: {
    status: 'in_progress',
    assignedTo: '{{assignee.id}}',
    priority: 'high'
  }
}
```

**Visual Style**:
- Rectangular with rounded corners
- Module-specific colors (tickets=blue, incidents=red)
- Icon for action type
- Preview of action

---

### 4. Approval Node (Human Review)

**Purpose**: Request approval from users

**Features**:
- Single or multi-level approvals
- Sequential or parallel approval
- Auto-approve after timeout
- Delegate to backup approver

**Configuration**:
```typescript
{
  approvers: ['{{item.requestedBy.manager}}', 'security-team'],
  approvalType: 'any' | 'all' | 'majority',
  timeout: 86400000, // 24 hours
  onTimeout: 'approve' | 'reject' | 'escalate',
  message: 'Please approve this {{item.title}}'
}
```

**Visual Style**:
- Octagon shape
- Green/red split theme
- Checkmark/X icons
- Approval status badge

---

### 5. Delay Node (Wait)

**Purpose**: Pause workflow execution

**Delay Types**:
- Fixed duration: Wait 1 hour
- Until date: Wait until start date
- Until condition: Wait until status = 'approved'
- Business hours only: Skip nights/weekends

**Configuration**:
```typescript
{
  delayType: 'duration',
  duration: 3600000, // 1 hour in ms
  skipWeekends: true,
  skipHolidays: true,
  timezone: 'America/New_York'
}
```

**Visual Style**:
- Circle shape
- Clock icon
- Purple/indigo theme
- Countdown/duration display

---

### 6. Notification Node (Alerts)

**Purpose**: Send notifications to users or external systems

**Channels**:
- Email
- SMS (future)
- Webhook
- In-app notification
- Slack/Teams (future)

**Configuration**:
```typescript
{
  channel: 'email',
  recipients: ['{{item.assignedTo}}', 'manager@company.com'],
  subject: 'Ticket {{item.ticketNumber}} requires attention',
  body: 'Hello {{user.name}}, ...',
  template: 'ticket-assigned'
}
```

**Visual Style**:
- Bell icon
- Cyan/teal theme
- Channel badges
- Recipient count

---

### 7. Assignment Node (Auto-Routing)

**Purpose**: Automatically assign items to users/teams

**Assignment Logic**:
- Round-robin: Distribute evenly
- Load-based: Assign to least busy
- Skill-based: Match expertise
- Geographic: Match location
- Custom rules: Complex logic

**Configuration**:
```typescript
{
  assignmentType: 'skill-based',
  skills: ['{{item.category}}'],
  fallbackTo: 'manager',
  considerWorkload: true,
  maxActiveTickets: 10
}
```

**Visual Style**:
- User icon
- Blue theme
- Assignment strategy badge
- Team/user preview

---

### 8. SLA Node (SLA Management)

**Purpose**: Set or update SLA timers

**Operations**:
- Start SLA timer
- Pause SLA (while waiting)
- Resume SLA
- Escalate on breach
- Adjust deadlines

**Configuration**:
```typescript
{
  operation: 'start',
  responseTime: 240, // 4 hours
  resolutionTime: 480, // 8 hours
  onBreach: {
    action: 'escalate',
    escalateTo: 'manager'
  }
}
```

**Visual Style**:
- Stopwatch icon
- Red/yellow/green (SLA status)
- Timer display
- Breach warning

---

### 9. Transform Node (Data Processing)

**Purpose**: Manipulate data between nodes

**Operations**:
- Extract: Get field value
- Format: Date, string, number
- Calculate: Math operations
- Merge: Combine objects
- Filter: Array operations
- Map: Transform array items

**Configuration**:
```typescript
{
  operations: [
    {
      type: 'extract',
      source: 'item.createdAt',
      target: 'variables.date'
    },
    {
      type: 'calculate',
      expression: 'variables.date + 86400000',
      target: 'variables.dueDate'
    }
  ]
}
```

**Visual Style**:
- Gear/cog icon
- Gray theme
- Operation list preview
- Input/output handles

---

### 10. Loop Node (Iteration)

**Purpose**: Repeat actions for multiple items

**Loop Types**:
- For each: Iterate array
- While: Condition-based
- Repeat N times: Fixed count

**Configuration**:
```typescript
{
  loopType: 'forEach',
  source: 'variables.relatedTickets',
  itemVariable: 'currentTicket',
  maxIterations: 100,
  continueOnError: true
}
```

**Visual Style**:
- Circular arrows icon
- Orange theme
- Iteration count
- Loop body indicator

---

### 11. Merge Node (Convergence)

**Purpose**: Combine multiple workflow branches

**Merge Strategies**:
- Wait for all: All branches complete
- Wait for any: First branch completes
- Race: First successful branch
- Combine data: Merge outputs

**Configuration**:
```typescript
{
  strategy: 'waitForAll',
  timeout: 3600000,
  onTimeout: 'continue',
  mergeOutputs: true
}
```

**Visual Style**:
- Funnel icon
- Purple theme
- Multiple input handles
- Single output handle

---

### 12. End Node (Termination)

**Purpose**: Mark workflow completion

**End Types**:
- Success: Normal completion
- Failure: Error termination
- Cancel: User cancelled

**Configuration**:
```typescript
{
  endType: 'success',
  message: 'Workflow completed successfully',
  output: {
    ticketId: '{{item._id}}',
    status: '{{item.status}}'
  }
}
```

**Visual Style**:
- Stop sign shape
- Green (success) / Red (failure)
- Checkmark or X icon
- Output summary

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up infrastructure and basic workflow CRUD

**Tasks**:
1. Install React Flow and dependencies
2. Create database schema
3. Build API routes for workflows
4. Create basic workflow list/detail pages
5. Implement workflow service layer

**Deliverables**:
- Workflow database collections
- API endpoints for CRUD operations
- Basic UI for viewing workflows

---

### Phase 2: Visual Builder (Week 2)

**Goal**: Build drag-and-drop workflow builder

**Tasks**:
1. Create WorkflowBuilder component
2. Implement NodePalette with all node types
3. Build custom node components (visual only)
4. Create PropertiesPanel for configuration
5. Add custom styling and theming
6. Implement save/load functionality

**Deliverables**:
- Fully functional visual workflow builder
- 12 custom node types
- Node configuration UI
- Custom styling (unique design)

---

### Phase 3: Node Logic (Week 3)

**Goal**: Implement node execution handlers

**Tasks**:
1. Create execution engine core
2. Build node handlers for each node type
3. Implement condition evaluation
4. Add variable substitution
5. Create execution context management
6. Add error handling and retry logic

**Deliverables**:
- Working execution engine
- All node types functional
- Context variables working
- Error handling implemented

---

### Phase 4: Triggers & Integration (Week 4)

**Goal**: Connect workflows to platform events

**Tasks**:
1. Create event listener system
2. Implement trigger registration
3. Add webhook endpoints
4. Integrate with all API routes
5. Create schedule-based triggers
6. Add manual execution

**Deliverables**:
- Event-driven workflow execution
- Full platform integration
- Webhook support
- Scheduler integration

---

### Phase 5: Advanced Features (Week 5)

**Goal**: Add approval workflows, templates, and analytics

**Tasks**:
1. Implement approval workflow logic
2. Create workflow templates
3. Build execution history UI
4. Add workflow analytics
5. Create testing/dry-run mode
6. Add workflow versioning

**Deliverables**:
- Approval workflows working
- Template library
- Execution history
- Analytics dashboard
- Test mode

---

### Phase 6: Polish & Documentation (Week 6)

**Goal**: Optimize, test, and document

**Tasks**:
1. Performance optimization
2. Comprehensive testing
3. Create user documentation
4. Add workflow examples
5. Implement workflow import/export
6. Security audit

**Deliverables**:
- Production-ready system
- Complete documentation
- Example workflows
- Security validated

---

## Technical Stack

### Frontend

**Core Libraries**:
- **React Flow** (v11+): Visual workflow builder
- **Zustand**: State management for workflow data
- **React Hook Form**: Node configuration forms
- **Zod**: Form validation
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI components

**Additional Libraries**:
- **react-color**: Color picker for node styling
- **date-fns**: Date manipulation for delays/schedules
- **monaco-editor**: Code editor for expressions (optional)
- **react-json-view**: JSON viewer for debugging

### Backend

**Core**:
- **Node.js**: Runtime
- **Next.js API Routes**: RESTful API
- **MongoDB**: Database
- **node-cron**: Schedule-based triggers

**Additional**:
- **joi**: Server-side validation
- **lodash**: Utility functions
- **agenda**: Background job processing

---

## Custom Styling Approach

### Design System

**Color Palette** (Custom, not default React Flow):
```typescript
const workflowTheme = {
  background: {
    primary: '#0a0e1a',      // Dark navy
    secondary: '#141927',    // Slightly lighter
    tertiary: '#1e2536',     // Card backgrounds
  },
  accent: {
    primary: '#6366f1',      // Indigo
    secondary: '#8b5cf6',    // Purple
    success: '#10b981',      // Green
    warning: '#f59e0b',      // Amber
    error: '#ef4444',        // Red
    info: '#3b82f6',         // Blue
  },
  node: {
    trigger: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    condition: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    action: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    approval: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    delay: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    notification: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    assignment: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    sla: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    transform: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    loop: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
    merge: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
    end: 'linear-gradient(135deg, #f5576c 0%, #4c4177 100%)',
  },
  edge: {
    default: '#64748b',      // Slate
    conditional: '#8b5cf6',  // Purple
    active: '#10b981',       // Green (during execution)
  }
}
```

**Node Design**:
- Glassmorphism effect (backdrop blur + transparency)
- Subtle shadows and borders
- Icon-based visual language
- Animated connection points
- Hover effects showing node info
- Active state during execution

**Canvas Background**:
- Custom dot pattern (not default grid)
- Gradient overlay
- Subtle glow effects
- Zoom-responsive styling

**Edge Styling**:
- Smooth bezier curves
- Animated flow indicators
- Color-coded by type
- Labels with custom styling

### Custom Components

```typescript
// Base Node Component
const CustomNode = ({ data, selected }) => (
  <div className={cn(
    "relative p-4 rounded-lg backdrop-blur-md",
    "border border-white/10 shadow-2xl",
    "transition-all duration-200",
    selected && "ring-2 ring-indigo-500 shadow-indigo-500/50"
  )}>
    <div className="flex items-center gap-3 mb-2">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-semibold text-white">{data.label}</h4>
        <p className="text-xs text-gray-400">{data.type}</p>
      </div>
    </div>
    {data.description && (
      <p className="text-sm text-gray-300 mt-2">{data.description}</p>
    )}
    <Handle type="target" position={Position.Left} />
    <Handle type="source" position={Position.Right} />
  </div>
)
```

---

## API Integration

### All Platform Routes

**Tickets**:
- GET/POST `/api/tickets`
- GET/PUT/DELETE `/api/tickets/[id]`
- POST `/api/tickets/[id]/comments`

**Incidents**:
- GET/POST `/api/incidents`
- GET/PUT/DELETE `/api/incidents/[id]`
- POST `/api/incidents/[id]/updates`

**Problems**:
- GET/POST `/api/problems`
- GET/PUT/DELETE `/api/problems/[id]`
- POST `/api/problems/[id]/updates`

**Service Requests**:
- GET/POST `/api/service-requests`
- GET/PUT/DELETE `/api/service-requests/[id]`
- POST `/api/service-requests/[id]/approve`
- POST `/api/service-requests/[id]/reject`

**Changes**:
- GET/POST `/api/change-requests`
- GET/PUT/DELETE `/api/change-requests/[id]`
- POST `/api/change-requests/[id]/approve`

**Assets**:
- GET/POST `/api/assets`
- GET/PUT/DELETE `/api/assets/[id]`

**Users**:
- GET/POST `/api/users`
- GET/PUT `/api/users/[id]`
- PUT `/api/users/[id]/role`

**Knowledge Base**:
- GET/POST `/api/knowledge-base`
- GET/PUT/DELETE `/api/knowledge-base/[id]`

**Projects**:
- GET/POST `/api/projects`
- GET/PUT/DELETE `/api/projects/[id]`
- POST `/api/projects/[id]/tasks`

**Scheduling**:
- GET/POST `/api/schedule`
- GET/PUT/DELETE `/api/schedule/[id]`

### Workflow-Specific Routes

```typescript
// Workflow Management
GET    /api/workflows              // List all workflows
POST   /api/workflows              // Create workflow
GET    /api/workflows/[id]         // Get workflow
PUT    /api/workflows/[id]         // Update workflow
DELETE /api/workflows/[id]         // Delete workflow
POST   /api/workflows/[id]/clone   // Clone workflow
POST   /api/workflows/[id]/test    // Test workflow (dry run)
POST   /api/workflows/[id]/execute // Manual execution
PUT    /api/workflows/[id]/toggle  // Enable/disable

// Execution History
GET    /api/workflow-executions    // List executions
GET    /api/workflow-executions/[id] // Execution details
POST   /api/workflow-executions/[id]/cancel // Cancel running

// Templates
GET    /api/workflow-templates     // List templates
POST   /api/workflows/from-template // Create from template

// Triggers
POST   /api/workflows/webhook/[id] // Webhook endpoint
```

---

## Execution Engine

### Core Logic

```typescript
class WorkflowExecutor {
  async execute(workflow: Workflow, context: ExecutionContext): Promise<WorkflowExecution> {
    const execution = await this.createExecution(workflow, context)

    try {
      // Validate workflow
      await this.validateWorkflow(workflow)

      // Find entry node (trigger)
      const entryNode = workflow.nodes.find(n => n.type === 'trigger')
      if (!entryNode) throw new Error('No trigger node found')

      // Execute workflow graph
      await this.executeNode(entryNode, workflow, execution, context)

      // Mark as completed
      execution.status = 'completed'
      execution.completedAt = new Date()

    } catch (error) {
      execution.status = 'failed'
      execution.error = {
        message: error.message,
        stack: error.stack
      }

      // Handle error based on workflow settings
      if (workflow.settings.notifyOnFailure) {
        await this.notifyFailure(workflow, execution, error)
      }
    }

    await this.saveExecution(execution)
    return execution
  }

  private async executeNode(
    node: WorkflowNode,
    workflow: Workflow,
    execution: WorkflowExecution,
    context: ExecutionContext
  ): Promise<void> {
    const nodeExecution = this.createNodeExecution(node)

    try {
      // Get node handler
      const handler = this.getNodeHandler(node.type)

      // Execute node
      const output = await handler.execute(node, context)

      // Update context with output
      context.variables = { ...context.variables, ...output }

      // Find next nodes
      const nextEdges = workflow.edges.filter(e => e.source === node.id)

      // Process conditional edges
      for (const edge of nextEdges) {
        const shouldFollow = await this.evaluateEdgeCondition(edge, context)

        if (shouldFollow) {
          const nextNode = workflow.nodes.find(n => n.id === edge.target)
          if (nextNode) {
            await this.executeNode(nextNode, workflow, execution, context)
          }
        }
      }

      nodeExecution.status = 'completed'

    } catch (error) {
      nodeExecution.status = 'failed'
      nodeExecution.error = error.message

      // Retry logic
      if (nodeExecution.retryCount < workflow.settings.maxRetries) {
        nodeExecution.retryCount++
        await this.delay(1000 * nodeExecution.retryCount) // Exponential backoff
        return this.executeNode(node, workflow, execution, context)
      }

      throw error
    }

    execution.nodeExecutions.push(nodeExecution)
  }

  private getNodeHandler(type: WorkflowNodeType): NodeHandler {
    return nodeHandlers[type]
  }
}
```

### Node Handlers

Each node type has a dedicated handler:

```typescript
interface NodeHandler {
  execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>>
}

// Example: Action Node Handler
class ActionNodeHandler implements NodeHandler {
  async execute(node: WorkflowNode, context: ExecutionContext) {
    const { action, module, itemId, updates } = node.data.config

    // Substitute variables in configuration
    const resolvedItemId = this.substitute(itemId, context)
    const resolvedUpdates = this.substitute(updates, context)

    // Make API call
    const response = await fetch(`/api/${module}/${resolvedItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resolvedUpdates)
    })

    const result = await response.json()

    return {
      [`${action}Result`]: result
    }
  }

  private substitute(value: any, context: ExecutionContext): any {
    if (typeof value === 'string') {
      return value.replace(/\{\{(.+?)\}\}/g, (match, path) => {
        return this.getValueByPath(context, path)
      })
    }

    if (typeof value === 'object') {
      const result: any = {}
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.substitute(val, context)
      }
      return result
    }

    return value
  }
}
```

### Event Listeners

```typescript
class WorkflowTriggerManager {
  private listeners: Map<string, Workflow[]> = new Map()

  async registerWorkflow(workflow: Workflow) {
    const { type, module, event } = workflow.trigger.config

    if (type === 'event') {
      const key = `${module}.${event}`
      const workflows = this.listeners.get(key) || []
      workflows.push(workflow)
      this.listeners.set(key, workflows)
    }
  }

  async handleEvent(module: string, event: string, data: any) {
    const key = `${module}.${event}`
    const workflows = this.listeners.get(key) || []

    for (const workflow of workflows) {
      // Check if conditions match
      const shouldExecute = await this.evaluateConditions(
        workflow.trigger.config.conditions,
        data
      )

      if (shouldExecute) {
        const context: ExecutionContext = {
          trigger: { module, event },
          item: data,
          variables: {},
          user: data.createdBy || data.updatedBy,
          orgId: data.orgId
        }

        // Execute workflow asynchronously
        this.executor.execute(workflow, context)
      }
    }
  }
}
```

---

## User Interface

### Workflow List Page

**Features**:
- Grid/list view toggle
- Filter by category, status
- Search by name
- Sort by name, last executed, execution count
- Quick actions (edit, clone, delete, toggle)
- Stats cards (total, active, executions today)

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Workflows                                    [+ New Workflow]│
├─────────────────────────────────────────────────────────────┤
│ [Active: 12] [Draft: 3] [Executions Today: 147]             │
├─────────────────────────────────────────────────────────────┤
│ [Search...] [Category ▼] [Status ▼] [Sort ▼] [⊞] [≡]       │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ 🎯 Auto-Assign│ │ 🔔 Critical  │ │ ✅ SLA Monitor│         │
│ │ Service Req. │ │ Ticket Alert │ │ & Escalate   │         │
│ │ ────────────  │ │ ────────────  │ │ ────────────  │         │
│ │ Active       │ │ Active       │ │ Active       │         │
│ │ 23 exec/day  │ │ 8 exec/day   │ │ 45 exec/day  │         │
│ │ [Edit] [⋯]   │ │ [Edit] [⋯]   │ │ [Edit] [⋯]   │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

### Workflow Builder Page

**Layout**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│ ← Workflows  │  Critical Incident Workflow  │ [Test] [Save] [Deploy]   │
├──────────────┴──────────────────────────────────────────────────────────┤
│ ┌───────────┐ │                                                         │
│ │ Node      │ │                 Workflow Canvas                         │
│ │ Palette   │ │  ┌────────┐                                            │
│ │           │ │  │Trigger │──┐                                         │
│ │ 🎯 Trigger│ │  │Priority│  │                                         │
│ │ ❓ Condition│ │  └────────┘  ↓                                         │
│ │ ⚡ Action  │ │         ┌──────────┐                                   │
│ │ ✅ Approval│ │         │Condition │──┬──[True]──→ [Action: Escalate] │
│ │ ⏱ Delay   │ │         │Critical? │  │                                │
│ │ 🔔 Notify  │ │         └──────────┘  └──[False]─→ [Action: Assign]  │
│ │ 👤 Assign │ │                                            │            │
│ │ ⏰ SLA     │ │                                            ↓            │
│ │ ⚙️ Transform│ │                                      [End: Success]   │
│ │ 🔁 Loop   │ │                                                         │
│ │ 🔀 Merge  │ │                                                         │
│ │ 🛑 End    │ │                                                         │
│ │           │ │  [Minimap]                                              │
│ └───────────┘ │  ┌─────────────┐                                       │
├───────────────┴──┴─────────────┴────────────────────────────────────────┤
│ Properties Panel                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Action Node: Escalate to Manager                                    │ │
│ │ ───────────────────────────────────────────────────────────────────  │ │
│ │ Module: [Tickets ▼]                                                 │ │
│ │ Action: [Update ▼]                                                  │ │
│ │ Item ID: {{trigger.item._id}}                                       │ │
│ │ Updates:                                                             │ │
│ │   Priority: [Critical]                                               │ │
│ │   Assignee: {{item.createdBy.manager}}                              │ │
│ │   Add Comment: "Escalated due to criticality"                       │ │
│ │                                                        [Apply] [×]   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Execution History Page

**Features**:
- Timeline view of past executions
- Filter by status, date range
- Execution details (node-by-node)
- Error logs and debugging
- Execution metrics and analytics
- Re-run failed executions

**Layout**:
```
┌─────────────────────────────────────────────────────────────┐
│ Execution History                                            │
├─────────────────────────────────────────────────────────────┤
│ [Date Range ▼] [Status ▼] [Workflow ▼]                     │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✅ Completed - 2 mins ago                    125ms      │ │
│ │ Auto-Assign Service Request                             │ │
│ │ Triggered by: ticket.created (#TKT-00234)               │ │
│ │ [View Details]                                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ ❌ Failed - 5 mins ago                       2.3s       │ │
│ │ Critical Incident Workflow                              │ │
│ │ Error: User not found for assignment                    │ │
│ │ [View Details] [Retry]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

### KPIs

1. **Workflow Creation Time**: <10 minutes for simple workflows
2. **Execution Latency**: <500ms for most workflows
3. **Success Rate**: >95% of executions complete without errors
4. **User Adoption**: >50% of organizations create custom workflows within 30 days
5. **Time Saved**: Average 2 hours/day per team using automation

### Analytics

- Workflow execution counts (daily, weekly, monthly)
- Average execution time per workflow
- Success/failure rates
- Most used node types
- Most executed workflows
- Error trends and patterns

---

## Security Considerations

1. **Permissions**: Workflows execute with creator's permissions
2. **Data Access**: Respect organization boundaries (orgId)
3. **API Rate Limiting**: Prevent workflow abuse
4. **Webhook Authentication**: Secret tokens for webhook triggers
5. **Audit Logging**: Log all workflow executions
6. **Sensitive Data**: Mask sensitive fields in logs
7. **Approval Verification**: Validate approver identity

---

## Future Enhancements (Post-MVP)

1. **AI-Powered Workflow Suggestions**: Recommend workflows based on patterns
2. **Workflow Marketplace**: Share workflows between organizations
3. **Advanced Testing**: A/B testing for workflows
4. **Sub-Workflows**: Call workflows from within workflows
5. **External Integrations**: Slack, Teams, Jira, ServiceNow connectors
6. **Custom JavaScript Nodes**: User-defined logic
7. **Workflow Analytics Dashboard**: Comprehensive metrics
8. **Mobile Approval App**: Approve workflows on mobile
9. **Voice Commands**: "Alexa, approve request #SR-00123"
10. **GraphQL Support**: Alternative to REST for actions

---

## Conclusion

This workflow automation system will provide Deskwise ITSM users with a powerful, intuitive tool for automating complex processes across the platform. The custom-styled, React Flow-based builder ensures a unique, professional appearance while maintaining ease of use.

**Timeline**: 6 weeks to MVP
**Effort**: ~240 hours (1.5 developers)
**Impact**: High - core differentiator for ITSM platform

