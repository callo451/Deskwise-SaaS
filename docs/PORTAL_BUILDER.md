# Portal Visual Composer Documentation

## 1. Overview

The Portal Visual Composer is a powerful drag-and-drop page builder that allows administrators to create custom client portal pages without writing code. It provides a WYSIWYG (What You See Is What You Get) editing experience with a comprehensive library of pre-built blocks and extensive customization options.

### Key Features

- **Drag-and-Drop Interface**: Intuitive block placement from a categorized palette
- **Real-Time Preview**: See changes immediately in the canvas
- **Comprehensive Block Library**: 24 block types across 5 categories (Containers, Content, Data, Forms, Widgets)
- **Advanced Property Editing**: 200+ configurable properties with type-specific editors
- **Nested Layouts**: Container blocks support infinite nesting for complex layouts
- **Undo/Redo**: Full history with 50-level undo stack
- **Responsive Controls**: Zoom, breakpoint switching (mobile/tablet/desktop), and grid overlay
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Y (redo), Del (delete), Ctrl+D (duplicate), Ctrl+S (save)
- **Auto-Save Indicator**: Visual feedback for unsaved changes
- **Production Ready**: Integrated with MongoDB for page persistence

### Use Cases

- Create custom landing pages for client portals
- Build service request forms with complex layouts
- Design knowledge base article templates
- Customize ticket submission workflows
- Build branded client dashboards

---

## 2. Architecture

The Portal Composer follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Toolbar                               │
│  (Save, Publish, Undo/Redo, Zoom, Breakpoint Switcher)     │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────┬──────────────────┐
│              │                          │                  │
│  Block       │        Canvas            │  Inspector       │
│  Palette     │  (Visual Editor)         │  (Properties)    │
│              │                          │                  │
│  - Categories│  - Zoom/Pan              │  - Block Info    │
│  - Search    │  - Grid Overlay          │  - Properties    │
│  - Draggable │  - Drop Zones            │  - Advanced      │
│    Blocks    │  - Block Renderer        │  - Actions       │
│              │                          │                  │
└──────────────┴──────────────────────────┴──────────────────┘
                           ▲
                           │
                 ┌─────────┴─────────┐
                 │  Zustand Store    │
                 │  (composer-store) │
                 │                   │
                 │  - Blocks State   │
                 │  - Selection      │
                 │  - History        │
                 │  - UI State       │
                 └───────────────────┘
```

### Component Structure

**Core Components:**

1. **Toolbar** (`src/components/portal-composer/Toolbar.tsx`)
   - Top navigation bar with save/publish actions
   - Undo/redo buttons with state indicators
   - Zoom controls (25%-200%)
   - Breakpoint switcher (mobile/tablet/desktop)
   - Preview mode toggle
   - Grid overlay toggle

2. **BlockPalette** (`src/components/portal-composer/BlockPalette.tsx`)
   - Left sidebar with searchable block library
   - Categorized block list with expand/collapse
   - Draggable block items with tooltips
   - Real-time search filtering

3. **Canvas** (`src/components/portal-composer/Canvas.tsx`)
   - Main editing area with zoom and pan
   - Drop zones for block placement
   - Grid background overlay (optional)
   - Empty state with instructions
   - Click-to-deselect background

4. **Inspector** (`src/components/portal-composer/Inspector.tsx`)
   - Right sidebar with property editors
   - Tabbed interface (Properties / Advanced)
   - Dynamic property rendering based on block type
   - Scrollable property list
   - Block actions (duplicate, delete)

5. **BlockRenderer** (`src/components/portal-composer/BlockRenderer.tsx`)
   - Renders blocks with their configured properties
   - Supports 24 block types
   - Handles nested children for containers
   - Shows block toolbar on hover/select
   - Manages drag-and-drop behavior

6. **LayerTree** (`src/components/portal-composer/LayerTree.tsx`)
   - Hierarchical view of block structure
   - Drag-and-drop reordering
   - Click to select blocks
   - Visual nesting indicators

### State Management with Zustand

The composer uses **Zustand** for centralized state management (`src/lib/stores/composer-store.ts`):

**State Structure:**

```typescript
interface ComposerState {
  // Data
  page: PortalPage | null
  blocks: BlockInstance[]
  theme: Partial<PortalTheme> | null

  // Selection
  selectedBlockId: string | null
  hoveredBlockId: string | null

  // History (Undo/Redo)
  undoStack: BlockInstance[][]
  redoStack: BlockInstance[][]
  canUndo: boolean
  canRedo: boolean

  // UI State
  previewMode: boolean
  zoom: number (25-200)
  breakpoint: 'mobile' | 'tablet' | 'desktop'
  showGrid: boolean
  isDirty: boolean
  lastSaved: Date | null

  // Actions (20+ functions)
  setBlocks, addBlock, updateBlock, deleteBlock, moveBlock
  undo, redo, pushHistory
  selectBlock, hoverBlock
  setZoom, setBreakpoint, setPreviewMode
  markDirty, markClean
}
```

**Key Features:**

- **Immutable Updates**: All state mutations create new objects
- **History Management**: Automatic undo stack push on block changes (50-level limit)
- **Tree Operations**: Helper functions for finding, updating, removing blocks in nested structures
- **Dirty State Tracking**: Flags unsaved changes for save prompt

### Drag and Drop Implementation

The composer uses **@dnd-kit** for drag-and-drop functionality:

**Draggable Items:**

1. **Palette Blocks**: Dragged from BlockPalette to Canvas
   - Data: `{ type: PortalBlockType, source: 'palette' }`
   - Creates new block instance on drop

2. **Existing Blocks**: Dragged within Canvas for reordering
   - Data: `{ blockId: string, type: PortalBlockType }`
   - Moves block to new position

**Droppable Zones:**

1. **Root Canvas**: Accepts blocks at top level
   - ID: `drop-root`

2. **Container Blocks**: Accept children blocks
   - ID: `droppable-{blockId}`
   - Only enabled for `container` and `card-grid` types

3. **Between Blocks**: Drop zones before/after each block
   - ID: `drop-{blockId}-before/after`

**Drop Handling:**

```typescript
// When block is dropped
const handleDragEnd = (event) => {
  const { active, over } = event

  if (active.data.source === 'palette') {
    // Create new block from palette
    const newBlock = createBlockInstance(active.data.type)
    addBlock(newBlock, over.data.blockId, over.data.index)
  } else {
    // Move existing block
    moveBlock(active.data.blockId, over.data.blockId, over.data.index)
  }
}
```

---

## 3. Block System

### Block Definition Structure

Every block is defined in `src/lib/portal-blocks.ts` with the following schema:

```typescript
interface BlockDefinition {
  type: PortalBlockType               // Unique identifier
  category: string                     // Category ID (container, content, data, form, widget)
  label: string                        // Display name
  description: string                  // Tooltip description
  icon: string                         // Lucide icon name
  supportsChildren: boolean            // Can contain nested blocks
  defaultProps: BlockProps             // Default property values
  propertySchema: BlockPropertySchema[] // Property editor definitions
}
```

### Property Schema System

Properties are defined using a schema that auto-generates appropriate editors:

```typescript
interface BlockPropertySchema {
  key: string                    // Nested key (e.g., 'layout.direction')
  label: string                  // Display label
  type: PropertyType             // Editor type (see below)
  defaultValue?: any             // Default value
  required?: boolean             // Validation flag
  description?: string           // Help text
  options?: Array<{value, label}> // For select/dropdown
  min?: number                   // For number inputs
  max?: number                   // For number inputs
  step?: number                  // For number inputs
  showIf?: {                     // Conditional visibility
    property: string
    value: any
  }
  itemSchema?: Record<...>       // For array items
}
```

**Supported Property Types (14 types):**

| Type | Editor | Use Case |
|------|--------|----------|
| `string` | Text input | Simple text values |
| `number` | Number input with min/max/step | Numeric values |
| `boolean` | Toggle switch | True/false flags |
| `select` | Dropdown menu | Predefined options |
| `color` | Color picker + hex input | Color values |
| `image` | URL input + image preview | Image URLs |
| `richtext` | Textarea with HTML support | Formatted content |
| `spacing` | Range slider with px display | Padding/margins |
| `alignment` | Button group (left/center/right) | Text alignment |
| `array` | Add/remove/reorder items | Lists of objects |
| `icon` | Searchable icon picker (Lucide) | Icon selection |
| `link` | URL + "open in new tab" toggle | Link configuration |
| `datasource` | Data source dropdown | Dynamic data binding |
| `roles` | Multi-select role badges | Permission controls |
| `datetime` | Date/time input | Timestamps |
| `service-catalog` | Service item dropdown | Service catalog integration |

### How to Create a New Block

**Step 1: Define the Block**

Add to `BLOCK_DEFINITIONS` in `src/lib/portal-blocks.ts`:

```typescript
'my-custom-block': {
  type: 'my-custom-block',
  category: 'content',  // or 'container', 'data', 'form', 'widget'
  label: 'My Custom Block',
  description: 'A custom block for special content',
  icon: 'Star',  // Lucide icon name
  supportsChildren: false,
  defaultProps: {
    title: 'Hello World',
    color: '#3b82f6',
    size: 'medium',
  },
  propertySchema: [
    {
      key: 'title',
      label: 'Title',
      type: 'string',
      defaultValue: 'Hello World',
      description: 'The main title text',
    },
    {
      key: 'color',
      label: 'Text Color',
      type: 'color',
      defaultValue: '#3b82f6',
    },
    {
      key: 'size',
      label: 'Size',
      type: 'select',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
      defaultValue: 'medium',
    },
  ],
}
```

**Step 2: Add Renderer**

Add case to `renderBlockContent()` in `BlockRenderer.tsx`:

```typescript
case 'my-custom-block':
  return (
    <div
      className={cn('p-4 rounded-lg', {
        'text-sm': block.props.size === 'small',
        'text-base': block.props.size === 'medium',
        'text-lg': block.props.size === 'large',
      })}
      style={{ color: block.props.color }}
    >
      <h3>{block.props.title}</h3>
    </div>
  )
```

**Step 3: Add Type to TypeScript**

Add to `PortalBlockType` in `src/lib/types.ts`:

```typescript
export type PortalBlockType =
  | 'container'
  | 'heading'
  // ... existing types
  | 'my-custom-block'
```

**Step 4: Test**

1. Restart dev server: `npm run dev`
2. Open Portal Composer
3. Find block in appropriate category
4. Drag to canvas and test property editors

---

## 4. Components in Detail

### BlockRenderer

**File**: `src/components/portal-composer/BlockRenderer.tsx` (1,182 lines)

**Purpose**: Renders blocks with their configured properties and handles visual feedback.

**Key Features:**

- **24 Block Type Renderers**: Each block type has custom rendering logic
- **React Hooks Compliance**: All hooks called at top level (fixed in recent update)
- **Nested Rendering**: Recursively renders child blocks for containers
- **Selection States**: Visual indicators for selected/hovered blocks
- **Block Toolbar**: Floating toolbar with duplicate/delete actions
- **Drag Behavior**: Integrates with @dnd-kit for dragging
- **Droppable Areas**: Container blocks accept children

**Example Container Rendering:**

```typescript
case 'container': {
  const containerProps = block.props
  const layout = containerProps.layout || {}
  const spacing = containerProps.spacing || {}
  const background = containerProps.background || {}

  return (
    <div
      ref={setDropRef}  // Droppable for children
      className={cn('border-2 border-dashed', isOver && 'border-primary')}
      style={{
        display: layout.display,
        flexDirection: layout.direction,
        gap: `${layout.gap}px`,
        padding: `${spacing.paddingTop}px ${spacing.paddingRight}px`,
        backgroundColor: background.color,
        // ... 60+ style properties
      }}
    >
      {block.children?.map(child => (
        <BlockRenderer key={child.id} block={child} />
      ))}
    </div>
  )
}
```

**Recent Fixes:**

- Fixed React Hooks violation by moving `useDroppable` to component top level
- Added delete/duplicate functionality to block toolbar
- Fixed toolbar button click handlers

---

### Inspector

**File**: `src/components/portal-composer/Inspector.tsx` (876 lines)

**Purpose**: Property editing panel with dynamic form generation.

**Key Features:**

- **Auto-Generated Forms**: Properties render based on schema
- **Nested Property Handling**: Supports dot-notation keys (`layout.direction`)
- **Conditional Rendering**: `showIf` property hides/shows fields dynamically
- **Tabbed Interface**: Properties tab and Advanced tab
- **Scrollable Content**: Proper overflow handling with ScrollArea
- **Block Actions**: Duplicate and delete buttons in header
- **Auto-Switch**: Automatically switches to Properties tab when selecting blocks

**Property Editor Types:**

1. **String Input**: Simple text input with placeholder
2. **Number Input**: Numeric input with min/max/step controls
3. **Boolean Switch**: Toggle switch for true/false
4. **Select Dropdown**: Dropdown with predefined options
5. **Color Picker**: Color input + hex text field
6. **Image Picker**: URL input with image preview
7. **Rich Text Editor**: Textarea with HTML support note
8. **Spacing Slider**: Range input with pixel display (0-80px)
9. **Alignment Buttons**: Icon button group (left/center/right)
10. **Array Editor**: Collapsible list items with add/remove/reorder
11. **Icon Picker**: Searchable Lucide icon grid (5x12 grid)
12. **Link Editor**: URL input + "open in new tab" toggle
13. **Data Source Selector**: Dropdown for data sources
14. **Role Selector**: Multi-select badge list
15. **DateTime Picker**: Native datetime-local input
16. **Service Catalog Selector**: Service item dropdown

**Advanced Tab:**

- Block ID (read-only)
- Custom CSS Classes
- Background Color
- Border Radius

**Recent Fixes:**

- Fixed overflow issues by adding proper ScrollArea wrapper
- Added auto-switch to Properties tab on block selection
- Improved width handling for all property editors

---

### BlockPalette

**File**: `src/components/portal-composer/BlockPalette.tsx` (150 lines)

**Purpose**: Left sidebar with draggable block library.

**Key Features:**

- **5 Block Categories**: Container, Content, Data, Forms, Widgets
- **Search Filtering**: Real-time search across block names and descriptions
- **Expand/Collapse**: Category toggle to reduce clutter
- **Tooltips**: Hover tooltips with block descriptions
- **Drag Indicators**: Visual feedback during drag
- **Default Expanded**: Container and Content categories start expanded

**Category Structure:**

```typescript
const BLOCK_CATEGORIES = [
  { id: 'container', label: 'Containers', icon: 'Box' },
  { id: 'content', label: 'Content', icon: 'Type' },
  { id: 'data', label: 'Data', icon: 'Database' },
  { id: 'form', label: 'Forms', icon: 'FileText' },
  { id: 'widget', label: 'Widgets', icon: 'Puzzle' },
]
```

**Drag Behavior:**

- Creates new block instance on drop
- Preserves block default properties
- Shows drag preview with opacity effect

---

### Canvas

**File**: `src/components/portal-composer/Canvas.tsx` (99 lines)

**Purpose**: Main editing area with visual feedback.

**Key Features:**

- **Zoom Controls**: 25%-200% scaling
- **Grid Overlay**: Optional 20px grid background
- **Drop Zones**: Visual drop targets between blocks
- **Empty State**: Instructions when no blocks present
- **Max Width Container**: 6xl (1152px) centered canvas
- **Click-to-Deselect**: Clicking background deselects blocks
- **Shadow Effect**: Elevated card appearance

**Drop Zone Placement:**

- One drop zone above first block (or center if empty)
- One drop zone after each block
- Drop zones expand on drag-over

**Zoom Implementation:**

```typescript
<div
  style={{
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    width: zoom < 100 ? `${(100 / zoom) * 100}%` : '100%',
  }}
>
```

---

### Toolbar

**File**: `src/components/portal-composer/Toolbar.tsx` (237 lines)

**Purpose**: Top navigation with save/publish and view controls.

**Key Features:**

- **Back Button**: Returns to portal page list
- **Undo/Redo**: With disabled state when no history
- **Zoom Controls**: -/+ buttons and dropdown (25%-200%)
- **Grid Toggle**: Shows/hides grid overlay
- **Breakpoint Switcher**: Mobile/Tablet/Desktop icons
- **Preview Mode**: Toggles editing UI
- **Save Button**: Disabled when no changes
- **Publish Button**: Publishes to live portal
- **Settings Button**: Future theme/settings panel
- **Page Title**: Shows current page name + dirty indicator

**Save/Publish Logic:**

```typescript
const handleSave = async () => {
  const { blocks, theme } = useComposerStore.getState()

  await fetch(`/api/admin/portal/pages/${page._id}`, {
    method: 'PUT',
    body: JSON.stringify({ blocks, themeOverrides: theme }),
  })

  markClean()  // Clear dirty flag
}
```

---

## 5. Features Implemented

### Drag and Drop

**From Palette to Canvas:**

1. User drags block from BlockPalette
2. Drop zones appear on Canvas
3. Block is dropped on zone
4. New block instance created with default props
5. Block added to state at specified position
6. History stack updated for undo

**Within Canvas (Reordering):**

1. User drags existing block
2. Drop zones appear around other blocks
3. Block is dropped in new position
4. State updated with new block order
5. History stack updated

**Into Containers:**

1. User drags block over container
2. Container border highlights (blue)
3. Block is dropped inside container
4. Block added to container's children array
5. Container re-renders with new child

### Container Blocks

**Container Block (63+ properties):**

- **Layout**: Display mode, flex direction, wrap, gap, alignment, justify
- **Dimensions**: Width, height, min/max constraints
- **Spacing**: Individual padding/margin controls (top/right/bottom/left)
- **Background**: Color, image, gradient, size, position, attachment
- **Border**: Width, style, color, individual corner radius
- **Effects**: Shadow depth, backdrop blur, opacity
- **Position**: Type, z-index, overflow
- **Responsive**: Hide on breakpoints, mobile overrides

**Card Grid Block (43+ properties):**

- **Grid Layout**: Fixed/auto/masonry modes, column count, card min/max width
- **Spacing**: Column/row gap, container padding, card padding
- **Alignment**: Align items, justify content, equal height
- **Card Style**: Variant (bordered/elevated/flat/outlined/ghost), shadow depth, border radius
- **Hover Effects**: Lift, scale, shadow increase, transition duration
- **Animation**: Entrance animations, stagger effect, duration
- **Responsive**: Stack on mobile, reduce gap, center alignment

**Droppable Behavior:**

- Only `container` and `card-grid` blocks accept children
- Visual indicator (blue border) on drag-over
- Drop creates parent-child relationship
- Children inherit container styling

### Property Editing

**200+ Total Properties Across All Blocks:**

- Container: 63 properties (most comprehensive)
- Card Grid: 43 properties
- Tabs: 15 properties
- Accordion: 18 properties
- Hero: 11 properties
- Stats Grid: 12 properties
- Icon Grid: 9 properties
- Form: 20 properties
- Ticket List: 25 properties
- Service Catalog: 16 properties
- Each content block: 3-8 properties

**Property Categories:**

1. **Content**: Text, images, icons, links
2. **Layout**: Flexbox, grid, spacing, alignment
3. **Styling**: Colors, borders, shadows, effects
4. **Behavior**: Animations, hover effects, transitions
5. **Data**: Data sources, filters, sorting, limits
6. **Visibility**: Conditional rendering, role restrictions
7. **Interactive**: Click actions, form validation, callbacks

**Nested Property Support:**

Properties use dot notation for nested objects:

```typescript
// Property key: 'layout.direction'
// Translates to: block.props.layout.direction

// Helper functions handle nesting:
const value = getNestedValue(props, 'layout.direction')
const newProps = setNestedValue(props, 'layout.direction', 'row')
```

### Undo/Redo Functionality

**Implementation:**

- **History Stack**: Array of block snapshots (max 50)
- **Redo Stack**: Cleared on new action, preserved on undo
- **Automatic Push**: Every block change pushes to history
- **Deep Clone**: Full block tree copied for immutability

**Keyboard Shortcuts:**

- `Ctrl+Z`: Undo last change
- `Ctrl+Y`: Redo next change
- `Del`: Delete selected block
- `Ctrl+D`: Duplicate selected block
- `Ctrl+S`: Save page

**State Indicators:**

- Undo button disabled when no history
- Redo button disabled when no future states
- Visual feedback on toolbar buttons

### Auto-Switch to Properties Tab

**Behavior:**

1. User clicks a block in Canvas
2. Inspector switches to Properties tab automatically
3. Properties scroll to top
4. Block info header shows block name and description

**Implementation:**

```typescript
// In BlockRenderer.tsx
onClick={(e) => {
  e.stopPropagation()
  selectBlock(block.id)  // Triggers Inspector update
}}

// Inspector automatically shows Properties tab
// when selectedBlockId changes
```

### Tabbed Sidebar

**Blocks Tab:**

- Block palette with categories
- Search functionality
- Drag-and-drop items

**Properties Tab:**

- Auto-generated property editors
- Scrollable content area
- Block actions (duplicate/delete)

**Layers Tab:**

- Hierarchical block tree
- Drag-and-drop reordering
- Visual nesting with indentation
- Click to select

**Advanced Tab:**

- Block ID display
- Custom CSS classes
- Global styling overrides

### Responsive Property Panel

**Overflow Handling:**

- ScrollArea wrapper for long property lists
- Fixed header with block info
- Proper padding for scrollbar (pr-6)
- Tabbed content doesn't overflow

**Width Management:**

- All inputs use `w-full` for consistent width
- Color pickers: Fixed 16px + flex input
- Icon pickers: 80px popover with 5-column grid
- Array editors: Full width with nested inputs

---

## 6. Block Types Available

### Layout Blocks (2 types)

**1. Container**
- Purpose: Flexible layout wrapper with comprehensive styling
- Properties: 63 (layout, dimensions, spacing, background, border, effects, position, responsive)
- Supports Children: Yes
- Use Cases: Page sections, columns, rows, card wrappers

**2. Card Grid**
- Purpose: Responsive grid of cards with advanced layout options
- Properties: 43 (grid layout, spacing, alignment, card style, hover effects, animation)
- Supports Children: Yes (each child becomes a card)
- Use Cases: Feature grids, service catalogs, team member displays

### Content Blocks (8 types)

**3. Heading**
- Purpose: Typography heading (H1-H6)
- Properties: 4 (text content, level 1-6, alignment, color)
- Use Cases: Page titles, section headers

**4. Paragraph**
- Purpose: Rich text content block
- Properties: 3 (HTML content, alignment, font size)
- Use Cases: Body text, descriptions, formatted content

**5. Button**
- Purpose: Call-to-action button
- Properties: 6 (text, URL, variant, size, icon, full width)
- Use Cases: Form submissions, navigation links, CTAs

**6. Image**
- Purpose: Image display with sizing options
- Properties: 4 (source URL, alt text, width/height, object fit)
- Use Cases: Photos, illustrations, logos, banners

**7. Video**
- Purpose: Embedded video player
- Properties: 4 (source URL, provider, autoplay, controls, muted)
- Use Cases: Tutorial videos, demos, testimonials

**8. Divider**
- Purpose: Visual separator line
- Properties: 3 (orientation, thickness, color)
- Use Cases: Section breaks, content separation

**9. Spacer**
- Purpose: Empty vertical space
- Properties: 1 (height in pixels)
- Use Cases: Vertical spacing, layout control

**10. Custom HTML**
- Purpose: Arbitrary HTML content (sanitized)
- Properties: 4 (HTML code, sanitize option, security warnings, CSP compliance)
- Use Cases: Embeds, scripts, custom components

### Component Blocks (7 types)

**11. Hero**
- Purpose: Large banner section with background image
- Properties: 11 (image, overlay, text content, button config, alignment, height)
- Use Cases: Landing page headers, feature promotions

**12. Card**
- Purpose: Single card component with optional image
- Properties: 9 (title, description, image, variant, footer content, elevation)
- Use Cases: Feature cards, team members, testimonials

**13. Tabs**
- Purpose: Tabbed content container
- Properties: 15 (tab items array, variant, orientation, alignment, default tab, icon/badge display)
- Use Cases: Multi-section content, product details, FAQs

**14. Accordion**
- Purpose: Collapsible sections
- Properties: 18 (section items array, variant, spacing, expand icon, header/content styling)
- Use Cases: FAQ sections, expandable content, detailed information

**15. Stats Grid**
- Purpose: Statistics display grid
- Properties: 12 (stat items array, layout, icon display, trend indicators, animation)
- Use Cases: Dashboard metrics, performance indicators, KPIs

**16. Icon Grid**
- Purpose: Grid of icon cards with links
- Properties: 9 (icon items array, columns, hover effects, spacing, icon size)
- Use Cases: Navigation menus, service listings, feature highlights

**17. Testimonial**
- Purpose: Customer testimonial card
- Properties: 10 (quote, author, role, avatar, variant, show ratings, decorative elements)
- Use Cases: Social proof, customer reviews, case studies

**18. FAQ**
- Purpose: Frequently Asked Questions list
- Properties: 10 (FAQ items array, variant, search option, categories, expandable/collapsible)
- Use Cases: Help sections, support pages, product documentation

**19. Announcement Bar**
- Purpose: Prominent notification banner
- Properties: 8 (message, type (info/warning/error/success), dismissible, icon, position, animation)
- Use Cases: System alerts, promotions, important notices

### Data Blocks (4 types)

**20. Ticket List**
- Purpose: Display list of support tickets
- Properties: 25 (data source, filters, columns, sorting, pagination, status badges)
- Supports Children: No
- Use Cases: Client ticket views, support dashboards

**21. Incident List**
- Purpose: Display active incidents
- Properties: 23 (data source, severity filters, status display, auto-refresh, grouping)
- Supports Children: No
- Use Cases: Status pages, incident dashboards

**22. KB Article List**
- Purpose: Knowledge base article listing
- Properties: 21 (data source, category filters, search, rating display, view count, read time)
- Supports Children: No
- Use Cases: Help centers, documentation portals

**23. Service Catalog**
- Purpose: Display available services
- Properties: 16 (data source, layout mode, category filters, popular badge, request button config)
- Supports Children: No
- Use Cases: Service request forms, IT catalogs

### Form Block (1 type)

**24. Form**
- Purpose: Custom form builder with field types
- Properties: 20 (title, description, field array, validation, submit button, success message)
- Supports Children: No
- Use Cases: Contact forms, service requests, surveys

**Field Types Supported:**

- Text input
- Email input
- Textarea
- Select dropdown
- Checkbox
- Radio buttons
- File upload
- Date/time picker

---

## 7. Technical Details

### React Hooks Compliance

**Issue**: Original implementation called hooks conditionally inside switch statements, violating React's Rules of Hooks.

**Solution**: All hooks are now called at the component's top level:

```typescript
// BEFORE (Incorrect):
switch (block.type) {
  case 'container': {
    const { setNodeRef, isOver } = useDroppable(...)  // ❌ Conditional hook
    return <div ref={setNodeRef}>...</div>
  }
}

// AFTER (Correct):
const { setNodeRef, isOver } = useDroppable({
  disabled: !isContainer,  // ✅ Hook at top level, conditionally disabled
})

switch (block.type) {
  case 'container': {
    return <div ref={setNodeRef}>...</div>  // ✅ Use ref from top-level hook
  }
}
```

**Result**: No React warnings, stable component behavior, predictable hook execution.

### Property Storage and Updates

**Data Structure:**

```typescript
interface BlockInstance {
  id: string                    // Unique identifier (block_{timestamp}_{random})
  type: PortalBlockType         // Block type (e.g., 'container', 'heading')
  props: BlockProps             // All block properties (nested object)
  children?: BlockInstance[]    // Child blocks (for containers)
}

// Props are stored as nested objects:
{
  layout: {
    display: 'flex',
    direction: 'column',
    gap: 16,
  },
  spacing: {
    paddingTop: 16,
    paddingRight: 16,
  },
  background: {
    color: '#ffffff',
  }
}
```

**Update Flow:**

1. User changes property in Inspector
2. `PropertyEditor` calls `handleChange(newValue)`
3. `setNestedValue()` creates new props object with updated path
4. `updateBlock()` action called with new props
5. `updateBlockInTree()` recursively finds and updates block
6. New blocks array created (immutable update)
7. History pushed to undo stack
8. State updated, triggering re-render
9. BlockRenderer renders with new props

**Helper Functions:**

```typescript
// Get nested value from object
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Set nested value in object (immutable)
function setNestedValue(obj: any, path: string, value: any): any {
  const keys = path.split('.')
  const result = { ...obj }
  let current = result

  for (let i = 0; i < keys.length - 1; i++) {
    current[keys[i]] = { ...current[keys[i]] }
    current = current[keys[i]]
  }

  current[keys[keys.length - 1]] = value
  return result
}
```

### Nested Property Handling

**Dot Notation Keys:**

Properties use dot notation to access nested objects:

- `layout.direction` → `block.props.layout.direction`
- `spacing.paddingTop` → `block.props.spacing.paddingTop`
- `background.imageUrl` → `block.props.background.imageUrl`

**Conditional Rendering:**

Properties can be hidden based on other property values using `showIf`:

```typescript
{
  key: 'layout.wrap',
  label: 'Flex Wrap',
  type: 'select',
  showIf: {
    property: 'layout.display',  // Hide if display is not 'flex'
    value: 'flex'  // Inverse logic: hide when value matches
  }
}
```

**Array Property Handling:**

Array properties store lists of objects with configurable schemas:

```typescript
{
  key: 'tabs.items',
  type: 'array',
  itemSchema: {
    label: { label: 'Tab Label', type: 'string' },
    content: { label: 'Tab Content', type: 'textarea' },
    icon: { label: 'Icon', type: 'string' },
  }
}

// Stored as:
{
  tabs: {
    items: [
      { label: 'Tab 1', content: 'Content 1', icon: 'Home' },
      { label: 'Tab 2', content: 'Content 2', icon: 'Settings' },
    ]
  }
}
```

**Array Editor Features:**

- Add new items with default values
- Remove items
- Reorder items (up/down buttons)
- Collapsible item editors
- Nested property editing

---

## 8. Recent Fixes

### Fixed React Hooks Violation in BlockRenderer

**Problem**: `useDroppable` hook was called conditionally inside switch statement, causing React warnings and potential bugs.

**Root Cause**:

```typescript
// Original code (incorrect)
switch (block.type) {
  case 'container': {
    const { setNodeRef } = useDroppable(...)  // ❌ Conditional hook call
    return <div ref={setNodeRef}>...</div>
  }
}
```

**Solution**:

1. Moved hook call to top of component (before any conditionals)
2. Made hook always execute, but disabled for non-container blocks
3. Used `disabled` prop to control droppable behavior

```typescript
// Fixed code
const isContainer = block.type === 'container' || block.type === 'card-grid'
const { setNodeRef, isOver } = useDroppable({
  id: `droppable-${block.id}`,
  disabled: !isContainer,  // ✅ Always call hook, conditionally disable
})

switch (block.type) {
  case 'container': {
    return <div ref={setNodeRef}>...</div>  // ✅ Use hook result
  }
}
```

**Impact**: Eliminated React warnings, ensured stable hook execution order, improved code reliability.

---

### Fixed Overflow Issues in Inspector Panel

**Problem**: Long property lists caused Inspector to overflow container, making some properties inaccessible.

**Root Cause**: Missing ScrollArea wrapper and improper flex layout.

**Solution**:

1. Wrapped TabsContent with ScrollArea component
2. Added proper flex container hierarchy
3. Set `min-h-0` on flex children to allow scrolling
4. Added `pr-6` padding for scrollbar clearance

```typescript
// Before
<TabsContent value="properties">
  {properties.map(prop => <PropertyEditor />)}
</TabsContent>

// After
<Tabs className="flex-1 flex flex-col overflow-hidden min-h-0">
  <TabsList className="flex-shrink-0" />
  <ScrollArea className="flex-1 min-h-0">
    <TabsContent value="properties" className="pr-6">
      {properties.map(prop => <PropertyEditor />)}
    </TabsContent>
  </ScrollArea>
</Tabs>
```

**Impact**: All properties now accessible, smooth scrolling, no overflow issues.

---

### Added Auto-Switch to Properties Tab

**Problem**: Selecting a block didn't automatically show its properties, requiring manual tab switching.

**Solution**:

1. Modified Inspector to track selected block changes
2. Auto-switch to Properties tab when new block selected
3. Preserve tab selection when deselecting/reselecting same block

**Implementation**:

```typescript
// Inspector component
useEffect(() => {
  if (selectedBlockId && selectedBlockId !== previousBlockId) {
    setActiveTab('properties')  // Auto-switch to Properties tab
  }
}, [selectedBlockId])
```

**Impact**: Improved UX, reduced clicks, more intuitive workflow.

---

### Implemented Delete/Duplicate Buttons on Block Toolbar

**Problem**: Block toolbar showed placeholder comments for delete/duplicate actions.

**Solution**:

1. Connected toolbar buttons to Zustand store actions
2. Added proper event handling with `stopPropagation()`
3. Included tooltip titles for clarity

```typescript
// Before
<button onClick={(e) => {
  e.stopPropagation()
  // Duplicate block logic here  ❌ Comment placeholder
}}>
  <Icons.Copy />
</button>

// After
<button
  onClick={(e) => {
    e.stopPropagation()
    duplicateBlock(block.id)  // ✅ Actual implementation
  }}
  title="Duplicate block"
>
  <Icons.Copy />
</button>
```

**Impact**: Full block manipulation capabilities, consistent with Inspector actions.

---

## 9. Future Enhancements

### Integration with Actual Platform Data

**Current State**: Data blocks (Ticket List, KB Articles, Service Catalog) use mock data for preview.

**Planned**:

1. **Real-Time Data Fetching**:
   - Connect to MongoDB collections
   - Use existing service layer (`TicketService`, `KBArticleService`)
   - Support organization-scoped queries

2. **Live Filtering**:
   - Apply user-configured filters (status, priority, category)
   - Real-time search functionality
   - Pagination with actual record counts

3. **User Context**:
   - Show only tickets assigned to current user
   - Respect role-based visibility (admin sees all, user sees own)
   - Dynamic data based on session

**Example Implementation**:

```typescript
// In BlockRenderer.tsx
case 'ticket-list': {
  const [tickets, setTickets] = useState([])

  useEffect(() => {
    fetch(`/api/portal/tickets?status=${block.props.filter.status}`)
      .then(res => res.json())
      .then(data => setTickets(data.tickets))
  }, [block.props.filter])

  return <TicketListComponent tickets={tickets} {...block.props} />
}
```

---

### More Block Types

**Planned Additions:**

1. **Chart Blocks**:
   - Line/bar/pie charts for analytics
   - Integration with platform metrics
   - Customizable colors and legends

2. **Calendar Block**:
   - Schedule display
   - Event list view
   - Integration with scheduling module

3. **User Profile Block**:
   - Display current user info
   - Editable profile fields
   - Avatar upload

4. **Notification Feed**:
   - Recent notifications
   - Read/unread indicators
   - Mark as read functionality

5. **Quick Actions Block**:
   - Shortcuts to common tasks
   - Customizable button grid
   - Icon + label display

6. **Search Block**:
   - Global search interface
   - Configurable search scopes
   - Recent searches

**Implementation Pattern**:

1. Define block in `portal-blocks.ts` with schema
2. Add renderer case in `BlockRenderer.tsx`
3. Create specialized component if complex
4. Add to appropriate category
5. Document properties and use cases

---

### Advanced Styling Options

**Planned Features:**

1. **Custom Fonts**:
   - Google Fonts integration
   - Font upload support
   - Per-block font family selection

2. **Advanced Animations**:
   - Scroll-triggered animations
   - Parallax effects
   - Entrance/exit transitions

3. **CSS Filters**:
   - Blur, brightness, contrast, saturation
   - Image overlay effects
   - Blend modes

4. **Advanced Borders**:
   - Border images
   - Gradient borders
   - Individual border side controls

5. **Transform Controls**:
   - Rotate, scale, skew
   - 3D transforms
   - Transform origin point

**UI Additions**:

- "Style Presets" dropdown for quick styling
- Copy/paste styles between blocks
- Style library for reusable styles
- Theme variable integration

---

### Responsive Design Controls

**Current State**: Basic responsive properties (hide on mobile, mobile padding).

**Planned**:

1. **Breakpoint-Specific Properties**:
   - Different layouts per breakpoint
   - Mobile/tablet/desktop property tabs
   - Visual breakpoint switcher in canvas

2. **Responsive Preview**:
   - Side-by-side breakpoint comparison
   - Device frame overlays (iPhone, iPad, desktop)
   - Rotate orientation (portrait/landscape)

3. **Mobile-First Workflow**:
   - Start with mobile design
   - Progressive enhancement for larger screens
   - Inheritance of mobile styles to larger breakpoints

4. **Advanced Grid/Flexbox**:
   - Auto-responsive grid (CSS Grid auto-fit)
   - Container queries
   - Flexbox grow/shrink/basis per breakpoint

**Example UI**:

```
┌─────────────────────────────────────┐
│  Toolbar: [Mobile] [Tablet] [Desktop] │
└─────────────────────────────────────┘

Inspector Properties Tab:
┌─────────────────────┐
│ 📱 Mobile (< 768px) │  ← Active breakpoint
│ 📊 Grid Columns: 1  │
│ 📏 Padding: 16px    │
├─────────────────────┤
│ 📱 Tablet (768-1024)│
│ 📊 Grid Columns: 2  │
│ 📏 Padding: 24px    │
├─────────────────────┤
│ 🖥 Desktop (> 1024) │
│ 📊 Grid Columns: 3  │
│ 📏 Padding: 32px    │
└─────────────────────┘
```

---

### Additional Features

**1. Component Library**:
- Save custom block combinations as reusable templates
- Organization-wide component sharing
- Version control for components

**2. Theme System**:
- Global color palette
- Typography system (font scale, weights)
- Spacing scale
- Component style overrides

**3. A/B Testing**:
- Create page variants
- Split traffic between versions
- Track conversion metrics

**4. Analytics Integration**:
- Page view tracking
- Click heatmaps
- User engagement metrics
- Form submission tracking

**5. Collaboration Features**:
- Multi-user editing (with conflict resolution)
- Comments on blocks
- Change history with user attribution
- Approval workflows

**6. Accessibility Tools**:
- WCAG compliance checker
- Contrast ratio validator
- Screen reader preview
- Keyboard navigation tester

**7. SEO Controls**:
- Meta tags editor
- Open Graph image
- Structured data (JSON-LD)
- XML sitemap generation

**8. Performance Optimization**:
- Lazy loading for images
- Code splitting for heavy blocks
- Image optimization (WebP, compression)
- Caching strategy

---

## 10. API Integration

### Save Page

**Endpoint**: `PUT /api/admin/portal/pages/{pageId}`

**Request Body**:

```json
{
  "blocks": [
    {
      "id": "block_1234567890_abc123",
      "type": "container",
      "props": {
        "layout": { "display": "flex", "direction": "column" },
        "spacing": { "paddingTop": 16 }
      },
      "children": [
        {
          "id": "block_1234567891_def456",
          "type": "heading",
          "props": {
            "text": { "content": "Welcome", "level": 1 }
          }
        }
      ]
    }
  ],
  "themeOverrides": {
    "primaryColor": "#3b82f6",
    "fontFamily": "Inter"
  }
}
```

**Response**:

```json
{
  "success": true,
  "page": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Home",
    "slug": "home",
    "blocks": [...],
    "themeOverrides": {...},
    "updatedAt": "2025-10-15T12:34:56.789Z"
  }
}
```

---

### Publish Page

**Endpoint**: `POST /api/admin/portal/pages/{pageId}/publish`

**Request Body**: Same as save

**Response**:

```json
{
  "success": true,
  "page": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "published",
    "publishedAt": "2025-10-15T12:34:56.789Z"
  }
}
```

**Actions**:

1. Validates block structure
2. Sanitizes HTML content
3. Updates page status to "published"
4. Sets `publishedAt` timestamp
5. Clears any draft flags
6. Invalidates cache for public portal

---

### Load Page

**Endpoint**: `GET /api/admin/portal/pages/{pageId}`

**Response**:

```json
{
  "success": true,
  "page": {
    "_id": "507f1f77bcf86cd799439011",
    "orgId": "org_123",
    "title": "Home",
    "slug": "home",
    "blocks": [...],
    "themeOverrides": {...},
    "status": "published",
    "createdAt": "2025-10-14T10:00:00.000Z",
    "updatedAt": "2025-10-15T12:34:56.789Z",
    "publishedAt": "2025-10-15T12:34:56.789Z"
  }
}
```

**Usage**: Called when opening composer to load existing page data into state.

---

## 11. Usage Examples

### Basic Page Layout

**Goal**: Create a landing page with hero, features, and CTA.

**Steps**:

1. Drag **Hero** block to canvas
   - Set image URL
   - Add heading text: "Welcome to Our Portal"
   - Configure CTA button: "Get Started"

2. Drag **Container** below hero
   - Set layout to `flex` with `direction: row`
   - Set gap to `24px`

3. Drag 3 **Card** blocks into container
   - Add icons to each card
   - Set titles: "Fast", "Secure", "Reliable"
   - Add descriptions

4. Drag **Button** below container
   - Set variant to `primary`
   - Set text: "Learn More"
   - Set URL: `/docs`

5. **Save** and **Publish**

**Result**: Professional landing page with hero section, 3-column feature grid, and CTA button.

---

### Service Request Form

**Goal**: Create a custom service request form with conditional fields.

**Steps**:

1. Drag **Heading** to canvas
   - Set level to `2`
   - Set text: "Submit Service Request"

2. Drag **Form** block below
   - Set title: "New Service Request"
   - Configure fields:
     - Field 1: Text input, "Service Type", required
     - Field 2: Select dropdown, "Priority", options: Low/Medium/High
     - Field 3: Textarea, "Description", required
     - Field 4: File upload, "Attachments"
   - Set submit button text: "Submit Request"
   - Configure success message

3. Drag **Announcement Bar** above form
   - Set type to `info`
   - Set message: "Expected response time: 24 hours"

4. **Save** and **Publish**

**Result**: Functional service request form with file uploads and priority selection.

---

### Knowledge Base Layout

**Goal**: Display KB articles in a searchable grid.

**Steps**:

1. Drag **Container** to canvas
   - Set max width to `1200px`
   - Set padding to `32px`

2. Drag **Heading** into container
   - Set text: "Knowledge Base"
   - Set level to `1`

3. Drag **KB Article List** into container
   - Configure filters: Show all categories
   - Enable search
   - Set sorting: "Most viewed"
   - Set pagination: 12 per page

4. Drag **FAQ** below article list
   - Add common questions
   - Set variant to `bordered`
   - Enable search

5. **Save** and **Publish**

**Result**: Searchable knowledge base with article list and FAQ section.

---

### Dashboard Stats Grid

**Goal**: Display key metrics in a visual grid.

**Steps**:

1. Drag **Container** to canvas
   - Set layout to `flex`, `direction: column`
   - Set gap to `32px`

2. Drag **Stats Grid** into container
   - Configure stat items:
     - Stat 1: "1,234", "Total Tickets", icon: "Ticket", trend: "up", trendValue: "+12%"
     - Stat 2: "987", "Resolved", icon: "CheckCircle", trend: "up", trendValue: "+8%"
     - Stat 3: "2.5h", "Avg Response", icon: "Clock", trend: "down", trendValue: "-15%"
   - Set columns to `3`
   - Enable trend indicators

3. Drag **Ticket List** below stats
   - Set data source to "My Tickets"
   - Enable filters
   - Set columns: ID, Subject, Status, Priority

4. **Save** and **Publish**

**Result**: Dashboard with key metrics and ticket list.

---

## 12. Troubleshooting

### Common Issues

**Issue**: Blocks not appearing after drag-and-drop

**Cause**: Drop zone not detecting drop event

**Solution**:
- Ensure drop zone is visible (blue border on hover)
- Check that block is dragged fully over drop zone
- Verify `useDraggable` and `useDroppable` IDs are unique

---

**Issue**: Properties not updating in Inspector

**Cause**: Stale block reference or incorrect property key

**Solution**:
- Check `selectedBlockId` matches actual block ID
- Verify property key uses correct dot notation
- Ensure `updateBlock` is called after property change
- Check for typos in nested property paths

---

**Issue**: Undo/Redo not working

**Cause**: History not being pushed on changes

**Solution**:
- Verify `pushHistory()` is called before state mutations
- Check that `undoStack` and `redoStack` are updating
- Ensure actions use `get()` to access current state
- Verify undo/redo buttons are enabled (check `canUndo`/`canRedo`)

---

**Issue**: Canvas zoom not working correctly

**Cause**: CSS transform scaling issues

**Solution**:
- Ensure zoom percentage is within 25%-200% range
- Check that `transformOrigin` is set to `top center`
- Verify width calculation adjusts for zoom < 100%
- Clear browser cache if styles are stale

---

**Issue**: Container not accepting children

**Cause**: `supportsChildren` or droppable not configured

**Solution**:
- Verify block definition has `supportsChildren: true`
- Check that `useDroppable` hook is not disabled
- Ensure container block has `children` array initialized
- Verify drop zone is visible on drag-over

---

**Issue**: Property editor showing wrong type

**Cause**: Property schema type mismatch

**Solution**:
- Check property `type` matches one of 14 supported types
- Verify `options` array is provided for `select` type
- Ensure `itemSchema` is defined for `array` type
- Check for spelling errors in property schema

---

### Debug Mode

**Enable Debug Mode**:

```typescript
// In composer-store.ts
const DEBUG = true

if (DEBUG) {
  console.log('Block added:', block)
  console.log('Current blocks:', blocks)
  console.log('History stack size:', undoStack.length)
}
```

**Useful Debug Checks**:

1. **Inspect Zustand State**:
   ```javascript
   // In browser console
   window.__ZUSTAND_DEVTOOLS__ = true
   ```

2. **Log Block Tree**:
   ```typescript
   console.log('Block tree:', JSON.stringify(blocks, null, 2))
   ```

3. **Check Property Updates**:
   ```typescript
   console.log('Property changed:', key, oldValue, newValue)
   ```

4. **Verify Drop Events**:
   ```typescript
   console.log('Drop event:', event.active.id, event.over?.id)
   ```

---

## 13. Performance Considerations

### Optimization Strategies

**1. Block Rendering**:

- Use React.memo() for BlockRenderer to prevent unnecessary re-renders
- Implement shouldComponentUpdate for complex blocks
- Lazy load heavy components (charts, videos)

**2. Property Updates**:

- Debounce rapid property changes (e.g., slider inputs)
- Batch multiple property updates into single state change
- Use immutable update patterns to prevent deep clones

**3. History Management**:

- Limit history stack to 50 entries
- Use structural sharing for unchanged subtrees
- Consider implementing history compression

**4. Canvas Performance**:

- Use CSS transform for zoom (GPU-accelerated)
- Implement virtual scrolling for long block lists
- Throttle drag events to 60fps

**5. Data Fetching**:

- Cache API responses for data blocks
- Implement pagination for large datasets
- Use SWR or React Query for data management

---

## 14. Keyboard Shortcuts Reference

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+Z` | Undo | Reverts last change, up to 50 levels |
| `Ctrl+Y` | Redo | Re-applies undone change |
| `Ctrl+Shift+Z` | Redo | Alternative redo shortcut |
| `Del` | Delete | Deletes selected block |
| `Backspace` | Delete | Alternative delete key |
| `Ctrl+D` | Duplicate | Duplicates selected block |
| `Ctrl+C` | Copy | Copies selected block (future) |
| `Ctrl+V` | Paste | Pastes copied block (future) |
| `Ctrl+S` | Save | Saves page changes |
| `Esc` | Deselect | Clears block selection |
| `Tab` | Next Block | Selects next block (future) |
| `Shift+Tab` | Previous Block | Selects previous block (future) |
| `Arrow Up/Down` | Navigate | Navigate block tree (future) |
| `Ctrl+F` | Search | Search block palette (future) |

---

## 15. Best Practices

### Layout Design

1. **Use Containers Wisely**:
   - Nest containers for complex layouts
   - Set explicit widths for columns
   - Use flexbox gap instead of margins

2. **Maintain Visual Hierarchy**:
   - Use heading levels semantically (H1 > H2 > H3)
   - Apply consistent spacing between sections
   - Group related content in containers

3. **Responsive Considerations**:
   - Test all breakpoints before publishing
   - Use responsive containers (fluid, fixed)
   - Hide non-essential content on mobile

### Content Organization

1. **Block Naming**:
   - Use descriptive block IDs in Advanced tab
   - Add CSS classes for custom styling
   - Group related blocks in containers

2. **Reusability**:
   - Create reusable container templates
   - Use consistent color schemes
   - Standardize spacing values

3. **Accessibility**:
   - Always add alt text to images
   - Use semantic heading levels
   - Ensure sufficient color contrast

### Performance

1. **Image Optimization**:
   - Use appropriate image formats (WebP preferred)
   - Compress images before uploading
   - Use lazy loading for below-fold images

2. **Block Count**:
   - Limit page to 50-100 blocks for optimal performance
   - Combine related content into single blocks
   - Use data blocks instead of manual lists

3. **Nesting Depth**:
   - Avoid nesting containers more than 5 levels deep
   - Flatten layouts where possible
   - Use grid layouts instead of nested flex containers

---

## Conclusion

The Portal Visual Composer is a production-ready, feature-rich page builder that empowers non-technical users to create sophisticated client portal pages. With 24 block types, 200+ properties, and advanced features like undo/redo and drag-and-drop, it provides a comprehensive solution for custom portal design.

The modular architecture, Zustand state management, and React-based component system ensure maintainability and extensibility. Future enhancements will add real-time data integration, more block types, responsive controls, and collaboration features.

For questions or contributions, refer to the main CLAUDE.md documentation or contact the development team.
