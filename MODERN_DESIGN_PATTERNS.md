# Modern Design Patterns for Deskwise ITSM

This document outlines the modern design patterns established for the unified ticketing system and applicable throughout the Deskwise ITSM platform.

## Table of Contents
1. [Component Styling Patterns](#component-styling-patterns)
2. [Color Coding System](#color-coding-system)
3. [Responsive Grid Layouts](#responsive-grid-layouts)
4. [Collapsible Components](#collapsible-components)
5. [Hover Effects and Transitions](#hover-effects-and-transitions)
6. [Icon Containers](#icon-containers)
7. [Code Examples](#code-examples)

---

## Component Styling Patterns

### Card Styling
Modern cards use enhanced borders and shadows for depth and emphasis:

```typescript
<Card className="border-2 shadow-lg transition-all">
  {/* Card content */}
</Card>
```

**Key Properties:**
- `border-2`: Stronger border emphasis (2px instead of default 1px)
- `shadow-lg`: Large shadow for depth
- `transition-all`: Smooth transitions for all properties

### Gradient Headers
Headers use subtle gradients to create visual hierarchy:

```typescript
<CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
  <div className="flex items-center gap-2">
    <Icon className="h-5 w-5 text-primary" />
    <div>
      <CardTitle className="text-xl">Title</CardTitle>
      <CardDescription className="text-base">Description</CardDescription>
    </div>
  </div>
</CardHeader>
```

**Gradient Pattern:**
- `bg-gradient-to-r from-primary/5 to-primary/10`: Horizontal gradient with low opacity
- `border-b-2`: Strong bottom border to separate from content
- Alternative: `bg-gradient-to-br from-accent/50 to-accent/20` for content areas

### Border Styles
Two primary border patterns:

1. **Solid Emphasis:**
   ```typescript
   <div className="border-2 rounded-lg">
   ```

2. **Dashed Interactive:**
   ```typescript
   <div className="border-2 border-dashed hover:border-primary/50">
   ```

---

## Color Coding System

### Semantic Color Assignment
Each type of information has a consistent color throughout the application:

| Information Type | Color | Usage Example |
|-----------------|-------|---------------|
| Assignments | Purple (`purple-500`, `purple-600`) | Assigned To field |
| User Information | Blue (`blue-500`, `blue-600`) | Requester, User profiles |
| Categories | Teal (`teal-500`, `teal-600`) | Category field |
| Client Information | Indigo (`indigo-500`, `indigo-600`) | Client field |
| Creation Timestamps | Green (`green-500`, `green-600`) | Created At field |
| Update Timestamps | Orange (`orange-500`, `orange-600`) | Last Updated field |
| Resolution | Green background (`green-500/10`) | Resolved At field |
| Closure | Gray background (`gray-500/10`) | Closed At field |
| Tags | Amber (`amber-500`, `amber-600`) | Tags section |
| Linked Assets | Cyan (`cyan-500`, `cyan-600`) | Asset links |

### Status Colors
Status badges follow these color conventions:

```typescript
const statusColors = {
  open: 'blue',
  'in-progress': 'yellow',
  'on-hold': 'orange',
  resolved: 'green',
  closed: 'gray',
  cancelled: 'red',
}
```

### Priority Colors
Priority badges use:

```typescript
const priorityColors = {
  critical: 'red',
  high: 'orange',
  medium: 'yellow',
  low: 'blue',
}
```

---

## Responsive Grid Layouts

### 3-Column Grid Pattern
The primary responsive grid pattern adapts to screen size:

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

**Breakpoints:**
- Mobile (`default`): 1 column - stack all items vertically
- Tablet (`md: 768px`): 2 columns - side-by-side pairs
- Desktop (`lg: 1024px`): 3 columns - full grid layout

**Gap Spacing:**
- `gap-4` (1rem / 16px): Standard gap between grid items
- `gap-6` (1.5rem / 24px): For larger components

### Grid Item Pattern
Each grid item follows this structure:

```typescript
<div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
  {/* Header with icon */}
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 bg-purple-500/10 rounded-md">
      <User className="h-4 w-4 text-purple-600" />
    </div>
    <span className="text-sm font-semibold">Field Label</span>
  </div>

  {/* Content */}
  <div className="text-sm">
    {/* Field value */}
  </div>
</div>
```

---

## Collapsible Components

### CollapsibleCard Component
A reusable wrapper for any collapsible content:

**Import:**
```typescript
import { CollapsibleCard } from '@/components/ui/collapsible-card'
```

**Usage:**
```typescript
<CollapsibleCard
  title="Section Title"
  description="Section description"
  icon={<Icon className="w-5 h-5 text-primary" />}
  defaultExpanded={true}
>
  {/* Content */}
</CollapsibleCard>
```

**Props:**
- `title`: String or React node for the title
- `description`: Optional subtitle
- `icon`: Optional icon component
- `children`: Content to show/hide
- `defaultExpanded`: Initial state (default: true)
- `className`: Optional card styling
- `headerClassName`: Optional header styling
- `contentClassName`: Optional content styling

### Manual Collapsible Pattern
For components that need custom collapse behavior:

```typescript
const [isExpanded, setIsExpanded] = useState(true)

<CardHeader
  className="cursor-pointer hover:bg-accent/50 transition-colors border-b-2"
  onClick={() => setIsExpanded(!isExpanded)}
>
  <div className="flex items-start justify-between">
    <div className="flex items-center gap-2 flex-1">
      {/* Header content */}
    </div>
    <button
      className="shrink-0 p-1 hover:bg-accent rounded-md transition-colors"
      onClick={(e) => {
        e.stopPropagation()
        setIsExpanded(!isExpanded)
      }}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
    >
      {isExpanded ? (
        <ChevronUp className="h-5 w-5 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      )}
    </button>
  </div>
</CardHeader>

{isExpanded && (
  <CardContent className="pt-6">
    {/* Content */}
  </CardContent>
)}
```

**Key Features:**
- Entire header is clickable
- Separate button with `stopPropagation()` for explicit control
- ChevronUp/ChevronDown icons indicate state
- ARIA labels for accessibility
- Smooth transitions on hover

---

## Hover Effects and Transitions

### Standard Hover Pattern
Apply to interactive elements:

```typescript
className="hover:border-primary/50 hover:bg-accent/20 transition-all"
```

**Components:**
- `hover:border-primary/50`: Border becomes primary color at 50% opacity
- `hover:bg-accent/20`: Background becomes accent color at 20% opacity
- `transition-all`: Smooth transition for all properties

### Button Hover
For clickable icons and buttons:

```typescript
className="p-1 hover:bg-accent rounded-md transition-colors"
```

### Card Hover
For entire clickable cards:

```typescript
className="cursor-pointer hover:bg-accent/50 transition-colors"
```

### Row Hover (Table/List)
For list items and table rows:

```typescript
className="hover:bg-accent/30 transition-colors cursor-pointer"
```

---

## Icon Containers

### Color-Coded Icon Pattern
Icons are wrapped in color-coded containers for semantic meaning:

```typescript
<div className="p-1.5 bg-purple-500/10 rounded-md">
  <User className="h-4 w-4 text-purple-600" />
</div>
```

**Pattern Breakdown:**
- `p-1.5`: Padding of 0.375rem (6px)
- `bg-{color}-500/10`: Background at 10% opacity for subtle effect
- `rounded-md`: Medium border radius (0.375rem)
- Icon className: `h-4 w-4 text-{color}-600` for darker icon color

### Icon Sizes
Standard icon sizes:

```typescript
// Small (field icons)
<Icon className="h-4 w-4" />

// Medium (section headers)
<Icon className="h-5 w-5" />

// Large (page headers)
<Icon className="h-6 w-6" />
```

---

## Code Examples

### Complete Field Example
A fully-styled field with all patterns applied:

```typescript
<div className="p-4 rounded-lg border-2 border-dashed hover:border-primary/50 hover:bg-accent/20 transition-all">
  {/* Header with icon */}
  <div className="flex items-center gap-2 mb-3">
    <div className="p-1.5 bg-purple-500/10 rounded-md">
      <User className="h-4 w-4 text-purple-600" />
    </div>
    <span className="text-sm font-semibold">Assigned To</span>
  </div>

  {/* Content */}
  <div className="text-sm">
    {assignedTo ? (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs">
          {assignedTo.name?.charAt(0)}
        </div>
        <span className="font-medium">{assignedTo.name}</span>
      </div>
    ) : (
      <span className="text-muted-foreground">Unassigned</span>
    )}
  </div>
</div>
```

### Complete Section Example
A full section with gradient header and grid layout:

```typescript
<Card className="border-2 shadow-lg transition-all">
  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b-2">
    <div className="flex items-center gap-2">
      <FileText className="h-5 w-5 text-primary" />
      <div>
        <CardTitle className="text-xl">Section Title</CardTitle>
        <CardDescription className="text-base">Section description</CardDescription>
      </div>
    </div>
  </CardHeader>

  <CardContent className="space-y-6 pt-6">
    {/* Full-width important content */}
    <div className="bg-gradient-to-br from-accent/50 to-accent/20 p-4 rounded-lg border-2">
      {/* Content */}
    </div>

    <Separator className="my-6" />

    {/* Grid layout for fields */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Grid items */}
    </div>
  </CardContent>
</Card>
```

### Badge Pattern
Modern badges with animations:

```typescript
import { ModernStatusBadge } from '@/components/tickets/modern-status-badge'
import { ModernPriorityBadge } from '@/components/tickets/modern-priority-badge'

<ModernStatusBadge status={ticket.status} />
<ModernPriorityBadge priority={ticket.priority} />
```

---

## Spacing Guidelines

### Component Spacing
- `space-y-4` (1rem): Standard vertical spacing between related items
- `space-y-6` (1.5rem): Larger spacing between sections
- `gap-2` (0.5rem): Tight gap for closely related items (icon + text)
- `gap-3` (0.75rem): Medium gap for related groups
- `gap-4` (1rem): Standard gap for grid items

### Padding
- `p-2` (0.5rem): Compact padding (small buttons)
- `p-4` (1rem): Standard padding (cards, sections)
- `p-6` (1.5rem): Generous padding (large cards)
- `pt-6` (1.5rem): Top padding for content below header

### Margins
- `mb-3` (0.75rem): Small bottom margin (field headers)
- `mb-6` (1.5rem): Large bottom margin (sections)
- `my-6` (1.5rem): Vertical margin (separators)

---

## Typography

### Text Sizes
```typescript
// Headings
<CardTitle className="text-xl">      // 1.25rem (20px)
<CardTitle className="text-2xl">     // 1.5rem (24px)

// Body
<CardDescription className="text-base">  // 1rem (16px)
<span className="text-sm">                // 0.875rem (14px)
<span className="text-xs">                // 0.75rem (12px)
```

### Font Weights
```typescript
<span className="font-medium">   // 500
<span className="font-semibold"> // 600
<span className="font-bold">     // 700
```

---

## Accessibility

### ARIA Labels
Always provide labels for interactive elements:

```typescript
<button aria-label={isExpanded ? 'Collapse' : 'Expand'}>
  {/* Icon */}
</button>
```

### Focus States
Ensure keyboard navigation works:

```typescript
className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
```

### Color Contrast
- Always use sufficient contrast ratios (WCAG AA minimum: 4.5:1)
- Test with `text-muted-foreground` for secondary text
- Use semantic colors consistently

---

## Implementation Checklist

When applying these patterns to a new page:

- [ ] Use `border-2 shadow-lg` for all major cards
- [ ] Apply gradient headers: `bg-gradient-to-r from-primary/5 to-primary/10 border-b-2`
- [ ] Use responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- [ ] Add color-coded icon containers with semantic colors
- [ ] Implement hover effects: `hover:border-primary/50 hover:bg-accent/20 transition-all`
- [ ] Add collapsible functionality where appropriate
- [ ] Use `ModernStatusBadge` and `ModernPriorityBadge` components
- [ ] Ensure all interactive elements have ARIA labels
- [ ] Test responsive layout on mobile, tablet, and desktop
- [ ] Verify color contrast for accessibility

---

## Best Practices

1. **Consistency**: Use the same pattern for similar elements across the application
2. **Semantic Colors**: Always use the color coding system for consistency
3. **Responsive First**: Always consider mobile layout first, then expand to larger screens
4. **Accessibility**: Never sacrifice accessibility for aesthetics
5. **Performance**: Use `transition-all` sparingly; prefer specific properties when possible
6. **Maintainability**: Use the shared components (`CollapsibleCard`, `ModernStatusBadge`, etc.) instead of duplicating code

---

## Related Components

- `src/components/ui/collapsible-card.tsx` - Reusable collapsible wrapper
- `src/components/tickets/modern-status-badge.tsx` - Status badges
- `src/components/tickets/modern-priority-badge.tsx` - Priority badges
- `src/components/unified-tickets/ticket-details-card.tsx` - Example implementation

---

**Last Updated:** October 2025
**Version:** 1.0
**Applies To:** Unified Ticketing System and all future ITSM modules
