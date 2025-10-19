# Workflow Automation - Custom Node Components Implementation

## Overview

This document provides details on the custom React Flow node components created for the Deskwise ITSM workflow automation system. All 12 node types have been implemented with unique, custom styling using Tailwind CSS, glassmorphism effects, and gradient backgrounds.

---

## Files Created

### Node Components (12 files)

1. **TriggerNode.tsx** - Entry point node with blue-purple gradient and lightning icon
2. **ConditionNode.tsx** - Decision node with diamond shape and amber gradient
3. **ActionNode.tsx** - API operation node with module-specific colors
4. **ApprovalNode.tsx** - Human review node with octagon shape and green/red split
5. **DelayNode.tsx** - Wait/pause node with circular shape and purple gradient
6. **NotificationNode.tsx** - Alert node with cyan gradient and bell icon
7. **AssignmentNode.tsx** - Auto-routing node with blue gradient and user icon
8. **SLANode.tsx** - SLA management node with status-based colors
9. **TransformNode.tsx** - Data processing node with gray gradient and gear icon
10. **LoopNode.tsx** - Iteration node with orange gradient and circular arrows
11. **MergeNode.tsx** - Convergence node with purple/pink gradient and funnel icon
12. **EndNode.tsx** - Termination node with stop sign shape and status colors

### Edge Components (1 file)

13. **CustomEdge.tsx** - Custom edge with smooth bezier curves, labels, and animated flow

### Index Files (2 files)

14. **nodes/index.ts** - Exports all nodes as nodeTypes object with TypeScript definitions
15. **edges/index.ts** - Exports custom edge as edgeTypes object

### Configuration Updates (1 file)

16. **tailwind.config.ts** - Added custom animations (pulse-slow, spin-slow, dash)

---

## Unique Styling Features

### 1. TriggerNode
- **Shape**: Rounded rectangle (rounded-xl)
- **Gradient**: Blue-purple (from-blue-600 via-purple-600 to-indigo-700)
- **Icon**: Lightning bolt (Zap) with yellow-orange gradient background
- **Special Effects**:
  - Glow effect with before pseudo-element
  - Animated pulse-slow effect
  - Green status indicator dot with pulse animation
- **Handles**: Output only (right side)

### 2. ConditionNode
- **Shape**: Diamond (using rotate-45 and clip-path polygon)
- **Gradient**: Amber-orange (from-amber-500 via-orange-500 to-yellow-600)
- **Icon**: GitBranch icon
- **Special Effects**: Content rotated back -45deg for proper alignment
- **Handles**:
  - Input (left)
  - True path (top, green handle)
  - False path (bottom, red handle)

### 3. ActionNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Module-specific colors:
  - Tickets: Blue gradient
  - Incidents: Red gradient
  - Changes: Purple gradient
  - Assets: Gray gradient
  - Projects: Green gradient
- **Icon**: Dynamic based on action (Database, Edit, Trash2, Send, Zap)
- **Special Effects**: White/transparent gradient overlay
- **Badges**: Action type and module badges
- **Handles**: Input (left) and output (right)

### 4. ApprovalNode
- **Shape**: Octagon (using clip-path polygon with 8 points)
- **Gradient**: Split green-red (from-green-500 via-emerald-500 to-red-500)
- **Icons**: CheckCircle2 (green) and XCircle (red) side by side
- **Special Effects**: Centered layout with approver badges
- **Handles**:
  - Input (left)
  - Approved path (top, green handle)
  - Rejected path (bottom, red handle)

### 5. DelayNode
- **Shape**: Circle (w-[180px] h-[180px] rounded-full)
- **Gradient**: Purple-indigo (from-purple-600 via-indigo-600 to-violet-700)
- **Icon**: Clock with large icon size
- **Special Effects**:
  - Duration badge
  - Centered content layout
- **Handles**: Input (left) and output (right)

### 6. NotificationNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Cyan-teal (from-cyan-600 via-teal-600 to-blue-700)
- **Icon**: Bell with animated notification dot (ping and pulse)
- **Special Effects**:
  - Channel badges with icons (email, SMS, webhook)
  - Recipient count badge
  - Red notification indicator with double animation
- **Handles**: Input (left) and output (right)

### 7. AssignmentNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Blue-sky (from-blue-600 via-sky-600 to-indigo-700)
- **Icon**: UserCog in glassmorphic container
- **Special Effects**:
  - Assignment type badge
  - Team badge with Users icon
- **Handles**: Input (left) and output (right)

### 8. SLANode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Status-based colors:
  - OK: Green gradient
  - Warning: Yellow-amber gradient
  - Breach: Red gradient
- **Icon**: Timer/stopwatch
- **Special Effects**:
  - Response/resolution time grid
  - Status badge (On Track, At Risk, Breached)
  - Breach indicator with pulse animation
- **Handles**: Input (left) and output (right)

### 9. TransformNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Gray-slate (from-gray-600 via-slate-600 to-zinc-700)
- **Icon**: Settings/gear with spin-slow animation
- **Special Effects**:
  - Operation badges (up to 3 shown + count)
  - Rotating gear icon
- **Handles**: Input (left) and output (right)

### 10. LoopNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Orange-amber (from-orange-600 via-amber-600 to-yellow-700)
- **Icon**: RotateCw (circular arrows) with spin-slow animation
- **Special Effects**:
  - Iteration count badge (top-right corner)
  - Loop type badge
  - Rotating animation
- **Handles**:
  - Input (left)
  - Output (right)
  - Loop body (bottom)

### 11. MergeNode
- **Shape**: Rounded rectangle (rounded-2xl)
- **Gradient**: Purple-fuchsia (from-purple-600 via-fuchsia-600 to-pink-700)
- **Icon**: GitMerge rotated 90 degrees (funnel effect)
- **Special Effects**:
  - Strategy badge
  - Input count badge
  - Centered layout
- **Handles**:
  - Multiple inputs (left side, 3 handles at 30%, 50%, 70%)
  - Single output (right)

### 12. EndNode
- **Shape**: Stop sign (7-sided polygon using clip-path)
- **Gradient**: Status-based colors:
  - Success: Green gradient
  - Failure: Red gradient
  - Cancel: Gray gradient
- **Icons**:
  - Success: CheckCircle2
  - Failure: XCircle
  - Cancel: StopCircle
- **Special Effects**:
  - Large circular icon background
  - Status badge
  - Centered layout
- **Handles**: Input only (left side)

### 13. CustomEdge
- **Style**: Smooth bezier curves
- **Features**:
  - Glow effect layer (blurred path behind main path)
  - Color-coded by status (active=green, success=blue, error=red, selected=purple)
  - Animated dash for animated edges
  - Animated flow particle (circle following path)
  - Custom label with glassmorphic badge
- **Label**: Floating badge with backdrop blur and gradient background

---

## Common Design Patterns

All nodes share these design principles:

### Glassmorphism
- `backdrop-blur-md` for frosted glass effect
- Semi-transparent backgrounds (90% opacity gradients)
- `border border-white/20` for subtle borders

### Shadows and Glow
- `shadow-2xl` for depth
- `before:` pseudo-element for glow effect
- `hover:shadow-{color}-500/50` for colored shadows on hover

### Transitions
- `transition-all duration-300` for smooth animations
- `hover:scale-105` for subtle hover growth
- `selected && ring-2 ring-{color}-500` for selection state

### Icons
- Lucide React icons (consistent icon library)
- Icons placed in gradient circular or rectangular containers
- Drop shadows on icons for depth

### Handles (Connection Points)
- `!w-4 !h-4` sizing with important flags
- Gradient backgrounds matching node theme
- `!border-2 !border-white` for visibility
- `hover:!scale-125` for interactive feedback

### Typography
- `font-bold text-white drop-shadow-md` for titles
- `text-sm text-{color}-50` for descriptions
- Consistent badge styling with `backdrop-blur-sm`

---

## Usage Example

```tsx
import { ReactFlow } from 'reactflow'
import { nodeTypes } from '@/components/workflows/nodes'
import { edgeTypes } from '@/components/workflows/edges'
import 'reactflow/dist/style.css'

function WorkflowBuilder() {
  const nodes = [
    {
      id: '1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Ticket Created',
        description: 'Triggers when a ticket is created',
        triggerType: 'event',
      },
    },
    {
      id: '2',
      type: 'condition',
      position: { x: 400, y: 100 },
      data: {
        label: 'Check Priority',
        condition: 'priority === "critical"',
      },
    },
    {
      id: '3',
      type: 'action',
      position: { x: 700, y: 50 },
      data: {
        label: 'Escalate to Manager',
        action: 'update',
        module: 'tickets',
        description: 'Assign to manager and set high priority',
      },
    },
  ]

  const edges = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'custom',
      animated: true,
    },
    {
      id: 'e2-3',
      source: '2',
      target: '3',
      sourceHandle: 'true',
      type: 'custom',
      data: { label: 'Critical', animated: true },
    },
  ]

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
    />
  )
}
```

---

## TypeScript Support

All node data interfaces are exported from `nodes/index.ts`:

```typescript
import type {
  TriggerNodeData,
  ConditionNodeData,
  ActionNodeData,
  // ... etc
} from '@/components/workflows/nodes'
```

---

## Tailwind Animations Added

Custom animations added to `tailwind.config.ts`:

1. **pulse-slow**: 3s pulsing opacity (100% → 80% → 100%)
2. **spin-slow**: 3s continuous rotation for gear icons
3. **dash**: 1s animated stroke dash for edges

---

## Styling Challenges Addressed

### 1. Diamond Shape for ConditionNode
- **Challenge**: Creating a perfect diamond while maintaining content alignment
- **Solution**: Used `rotate-45` on container with `clipPath: polygon()` and `-rotate-45` on content

### 2. Octagon Shape for ApprovalNode
- **Challenge**: CSS doesn't have native octagon support
- **Solution**: Used `clipPath` with 8-point polygon definition

### 3. Stop Sign Shape for EndNode
- **Challenge**: Creating a 7-sided polygon (stop sign)
- **Solution**: Custom `clipPath` polygon with 7 points

### 4. Multiple Input Handles for MergeNode
- **Challenge**: React Flow only provides one default handle position per side
- **Solution**: Used multiple Handle components with custom `style={{ top: 'X%' }}` positioning

### 5. Animated Edge Flow
- **Challenge**: Showing direction of data flow along edges
- **Solution**: SVG circle with `<animateMotion>` following bezier path

### 6. Glassmorphism on Gradients
- **Challenge**: Balancing transparency with visibility
- **Solution**: 90% opacity gradients with backdrop-blur-md and white borders at 20% opacity

---

## Next Steps

To integrate these components into the workflow builder:

1. **Create WorkflowBuilder.tsx** - Main canvas component using ReactFlow
2. **Create NodePalette.tsx** - Drag-and-drop panel with all node types
3. **Create PropertiesPanel.tsx** - Configuration panel for selected node
4. **Add State Management** - Zustand store for workflow state
5. **Implement Node Configuration** - Forms for each node type's specific properties

---

## File Locations

All files are located in:
- **Nodes**: `C:\Users\User\Desktop\Projects\Deskwise\src\components\workflows\nodes\`
- **Edges**: `C:\Users\User\Desktop\Projects\Deskwise\src\components\workflows\edges\`
- **Config**: `C:\Users\User\Desktop\Projects\Deskwise\tailwind.config.ts`

---

## Summary

✅ **12 unique node components** created with distinct visual identities
✅ **1 custom edge component** with animations and labels
✅ **2 index files** for easy importing
✅ **Custom Tailwind animations** added
✅ **TypeScript type definitions** included
✅ **Glassmorphism design** throughout
✅ **Unique gradients** for each node type
✅ **Icons from Lucide React** for consistency
✅ **Hover effects and transitions** for interactivity
✅ **Handle positioning** optimized for workflow connections

All components are production-ready and follow the design specifications from WORKFLOW_AUTOMATION_PLAN.md.
