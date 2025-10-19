# Workflow Builder Components

This directory contains all components for the visual workflow automation builder, built with React Flow and custom styling.

## Directory Structure

```
workflows/
├── builder/                 # Main builder UI components
│   ├── WorkflowBuilder.tsx  # Container component (entry point)
│   ├── WorkflowCanvas.tsx   # React Flow canvas with custom styling
│   ├── NodePalette.tsx      # Drag-and-drop node selector
│   ├── PropertiesPanel.tsx  # Node configuration panel
│   ├── Toolbar.tsx          # Top action bar
│   └── index.ts             # Exports
├── nodes/                   # Custom node components
│   ├── BaseNode.tsx         # Default node component
│   ├── ConditionNode.tsx    # Diamond-shaped condition node
│   └── index.tsx            # Node type registration
└── README.md                # This file
```

## Usage

### Basic Setup

```tsx
import { WorkflowBuilder } from '@/components/workflows/builder'

export default function WorkflowPage() {
  const handleSave = async (data) => {
    // Save workflow to API
    await fetch('/api/workflows/123', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  const handleTest = async () => {
    // Test workflow execution
    await fetch('/api/workflows/123/test', { method: 'POST' })
  }

  const handleToggleEnabled = async () => {
    // Enable/disable workflow
    await fetch('/api/workflows/123/toggle', { method: 'PUT' })
  }

  return (
    <WorkflowBuilder
      workflowId="123"
      initialData={{
        name: 'Auto-Assign Tickets',
        nodes: [],
        edges: [],
        enabled: true,
      }}
      onSave={handleSave}
      onTest={handleTest}
      onToggleEnabled={handleToggleEnabled}
    />
  )
}
```

## Components

### 1. WorkflowBuilder (Main Container)

**File:** `builder/WorkflowBuilder.tsx`

**Purpose:** Main container that orchestrates all subcomponents and handles workflow state.

**Features:**
- Combines NodePalette, Canvas, and PropertiesPanel
- Manages drag-and-drop from palette to canvas
- Handles keyboard shortcuts (Cmd+S to save, Del to delete)
- Integrates with Zustand store for state management
- Provides save/test/toggle handlers

**Props:**
```typescript
interface WorkflowBuilderProps {
  workflowId?: string
  initialData?: {
    name: string
    nodes: any[]
    edges: any[]
    viewport?: any
    enabled: boolean
  }
  onSave?: (data) => Promise<void>
  onTest?: () => Promise<void>
  onToggleEnabled?: () => Promise<void>
}
```

### 2. WorkflowCanvas

**File:** `builder/WorkflowCanvas.tsx`

**Purpose:** React Flow canvas with custom dark theme and styling.

**Features:**
- Custom dot pattern background (#0a0e1a)
- Zoom controls and minimap
- Keyboard shortcuts panel
- Custom edge and node styling
- Animated connection flows

**Custom Styling:**
- Background: Dark navy (#0a0e1a)
- Edges: Slate (#64748b) with purple highlight
- Handles: Indigo with hover effects
- Animated edges for active workflows

### 3. NodePalette

**File:** `builder/NodePalette.tsx`

**Purpose:** Left sidebar with draggable node types.

**Features:**
- 12 node types organized in 4 categories:
  - Triggers (1)
  - Logic (3)
  - Actions (6)
  - Flow Control (2)
- Search/filter nodes
- Visual icons and descriptions
- Drag-to-add functionality

**Node Types:**
| Type | Icon | Category | Description |
|------|------|----------|-------------|
| Trigger | Zap | Triggers | Start workflow on event |
| Condition | GitBranch | Logic | Branch based on rules |
| Loop | Repeat | Logic | Repeat actions |
| Merge | Merge | Logic | Combine branches |
| Action | Zap | Actions | Update data |
| Approval | CheckCircle | Actions | Request approval |
| Notification | Bell | Actions | Send alerts |
| Assignment | UserPlus | Actions | Auto-assign users |
| SLA | Timer | Actions | Manage SLA timers |
| Transform | Settings | Actions | Process data |
| Delay | Clock | Flow Control | Wait before continuing |
| End | StopCircle | Flow Control | Terminate workflow |

### 4. PropertiesPanel

**File:** `builder/PropertiesPanel.tsx`

**Purpose:** Right sidebar for configuring selected node.

**Features:**
- Dynamic form based on node type
- React Hook Form + Zod validation
- Real-time updates
- Node-specific configuration fields
- Save/cancel actions

**Configuration Forms:**
- **Trigger:** Type, module, event selection
- **Condition:** Logic operator (AND/OR)
- **Action:** Action type, module, target

### 5. Toolbar

**File:** `builder/Toolbar.tsx`

**Purpose:** Top action bar with workflow controls.

**Features:**
- Workflow name display
- Unsaved changes indicator
- Zoom controls (in/out/fit)
- Test button (dry run)
- Save button (highlighted when dirty)
- Enable/disable toggle
- Settings dropdown

## State Management

**Store:** `@/lib/stores/workflow-store.ts`

Uses Zustand for workflow builder state:

```typescript
interface WorkflowState {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  selectedNode: WorkflowNode | null
  viewport: Viewport
  isDirty: boolean
  isSaving: boolean

  // Actions
  setNodes, setEdges, onNodesChange, onEdgesChange, onConnect
  addNode, updateNode, deleteNode, selectNode
  loadWorkflow, reset, markDirty, markClean
}
```

## Custom Node Components

### BaseNode

**File:** `nodes/BaseNode.tsx`

Default node component with glassmorphism effect:
- Gradient icon badge
- Label and description
- Error display
- Config preview
- Connection handles

### ConditionNode

**File:** `nodes/ConditionNode.tsx`

Diamond-shaped node for conditional logic:
- Rotated container
- True/false output handles
- Condition count display
- Amber/orange gradient

### Creating Custom Nodes

To create a new custom node:

1. Create component in `nodes/` directory
2. Export from `nodes/index.tsx`
3. Register in `nodeTypes` object

Example:

```tsx
// nodes/ApprovalNode.tsx
export function ApprovalNode({ data, selected }) {
  return (
    <div className="octagon-shape">
      {/* Your custom design */}
    </div>
  )
}

// nodes/index.tsx
export const nodeTypes: NodeTypes = {
  // ...existing
  approval: ApprovalNode,
}
```

## Styling System

### Color Palette

From `WORKFLOW_AUTOMATION_PLAN.md`:

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
  },
  node: {
    trigger: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    condition: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    action: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    // ...see plan for all 12 gradients
  }
}
```

### Design Features

1. **Glassmorphism:** Backdrop blur + transparency
2. **Gradients:** Custom gradients for each node type
3. **Shadows:** Subtle shadows with glow effects
4. **Animations:** Smooth transitions and hover effects
5. **Dark Theme:** Consistent dark navy background

## Integration Notes

### For Node Components

When creating custom node components, they will automatically receive:
- `data` prop with node configuration
- `selected` prop indicating selection state
- `id` prop with unique node identifier

### For API Integration

The WorkflowBuilder expects these callbacks:

```typescript
// Save workflow (called on Cmd+S or Save button)
onSave: async ({ nodes, edges, viewport }) => {
  await fetch(`/api/workflows/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ nodes, edges, viewport }),
  })
}

// Test workflow (dry run)
onTest: async () => {
  await fetch(`/api/workflows/${id}/test`, { method: 'POST' })
}

// Toggle enabled state
onToggleEnabled: async () => {
  await fetch(`/api/workflows/${id}/toggle`, { method: 'PUT' })
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + S` | Save workflow |
| `Delete` | Delete selected node |
| `Shift + Click` | Multi-select nodes |

## Next Steps

1. **Create remaining node components:** Trigger, Approval, Delay, End nodes with unique shapes
2. **Add edge types:** Custom conditional edges with labels
3. **Implement validation:** Real-time workflow validation with error display
4. **Add undo/redo:** History management for builder actions
5. **Create templates:** Pre-built workflow templates library

## Dependencies

- `reactflow`: ^11.11.4
- `zustand`: ^5.0.8
- `react-hook-form`: ^7.65.0
- `@hookform/resolvers`: ^5.2.2
- `zod`: ^3.24.1
- `lucide-react`: ^0.460.0
- `framer-motion`: ^12.23.24

## Resources

- [React Flow Documentation](https://reactflow.dev/)
- [Workflow Plan](../../../WORKFLOW_AUTOMATION_PLAN.md)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
