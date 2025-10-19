# Portal Block Registry System

A comprehensive, typed block system for building dynamic portal pages with a visual composer.

## Overview

The block registry system provides:
- **30+ pre-built blocks** across 5 categories
- **Type-safe** with TypeScript and Zod schemas
- **Validation** for props, children, and tree structure
- **Data bindings** for dynamic content
- **Visibility guards** for role/permission-based rendering
- **Utility functions** for block manipulation

## Architecture

```
blocks/
├── types.ts              # Core TypeScript types
├── registry.ts           # Block registry and lookup functions
├── utils.ts              # Validation and tree operations
├── components/           # React components
│   └── index.tsx
├── schemas/              # Zod validation schemas
│   ├── container.ts      # Section, Grid, Stack, Container
│   ├── content.ts        # Text, Image, Button, Icon, Divider, Spacer
│   ├── data.ts           # List, Table, CardGrid
│   ├── form.ts           # Input, Textarea, Select, Checkbox, etc.
│   ├── widget.ts         # Deskwise-specific widgets
│   └── index.ts
└── index.ts              # Main export
```

## Block Categories

### 1. Container Blocks (4)
Layout and structure blocks that can contain children.

- **Section**: Full-width container with padding/background
- **Grid**: CSS Grid with responsive columns
- **Stack**: Flexbox vertical/horizontal stack
- **Container**: Generic container with semantic HTML tags

### 2. Content Blocks (6)
Display blocks for text, media, and UI elements.

- **Text**: Typography with markdown support
- **Image**: Responsive images with alt text
- **Button**: CTA buttons with links or actions
- **Icon**: Lucide icons with styling
- **Divider**: Visual separators
- **Spacer**: Empty spacing blocks

### 3. Data Blocks (3)
Blocks that display dynamic data from APIs or bindings.

- **List**: Repeater for arrays with item template
- **Table**: Data table with sorting/filtering
- **Card Grid**: Responsive grid of cards

### 4. Form Blocks (13)
Input blocks for building forms.

- **Input**: Text, email, password, number, date, etc.
- **Textarea**: Multi-line text input
- **Select**: Dropdown with search
- **Checkbox**: Single checkbox
- **Checkbox Group**: Multiple checkboxes
- **Radio Group**: Radio buttons
- **File Upload**: File picker with drag-and-drop
- **Switch**: Toggle switch
- **Slider**: Range slider
- **Date Picker**: Date/time picker
- **Rich Text Editor**: WYSIWYG editor
- **Submit Button**: Form submission
- **Form**: Form container

### 5. Widget Blocks (7)
Deskwise-specific widgets for portal functionality.

- **Ticket Create**: Inline ticket creation form
- **Ticket List**: Display user tickets
- **Incident Status**: System status timeline
- **KB Search**: Knowledge base search
- **Service Catalog**: Service request grid
- **Announcement Banner**: Alert banners
- **User Profile**: User info display

## Usage

### 1. Basic Block Definition

```typescript
import { blockRegistry, getBlockDefinition } from '@/lib/portal/blocks'

// Get a block definition
const textBlock = getBlockDefinition('text')
console.log(textBlock.metadata.label) // "Text"
console.log(textBlock.metadata.category) // "content"
```

### 2. Creating Block Instances

```typescript
import { generateBlockId, type BlockInstance } from '@/lib/portal/blocks'

const textBlock: BlockInstance = {
  id: generateBlockId(),
  type: 'text',
  props: {
    id: generateBlockId(),
    content: 'Hello, world!',
    variant: 'h1',
    align: 'center',
  },
  renderMode: 'server',
}
```

### 3. Building a Block Tree

```typescript
import { generateBlockId, type BlockInstance } from '@/lib/portal/blocks'

const page: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
      background: '#f9fafb',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'text',
        props: {
          id: generateBlockId(),
          content: 'Welcome to our portal',
          variant: 'h1',
        },
        renderMode: 'server',
      },
      {
        id: generateBlockId(),
        type: 'button',
        props: {
          id: generateBlockId(),
          text: 'Get Started',
          variant: 'primary',
          action: {
            type: 'link',
            href: '/get-started',
            target: '_self',
          },
        },
        renderMode: 'client',
      },
    ],
  },
]
```

### 4. Validating Blocks

```typescript
import { validateBlockTree } from '@/lib/portal/blocks'

const validation = validateBlockTree(page)

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}
```

### 5. Data Bindings

```typescript
import { type BlockInstance, type DataBinding } from '@/lib/portal/blocks'

const bindings: DataBinding[] = [
  {
    id: 'binding1',
    sourceType: 'context',
    sourcePath: 'user.firstName',
    targetProp: 'content',
  },
]

const textBlock: BlockInstance = {
  id: generateBlockId(),
  type: 'text',
  props: {
    id: generateBlockId(),
    content: 'Fallback name',
    variant: 'body1',
  },
  bindings, // Will replace content with user.firstName
  renderMode: 'server',
}
```

### 6. Visibility Guards

```typescript
import { type BlockInstance, type VisibilityGuard } from '@/lib/portal/blocks'

const guards: VisibilityGuard[] = [
  {
    id: 'guard1',
    type: 'role',
    condition: ['admin', 'technician'],
    operator: 'or',
  },
  {
    id: 'guard2',
    type: 'permission',
    condition: ['tickets.create'],
  },
]

const adminBlock: BlockInstance = {
  id: generateBlockId(),
  type: 'button',
  props: {
    id: generateBlockId(),
    text: 'Admin Panel',
    variant: 'primary',
  },
  guards, // Only visible to admins/technicians with tickets.create permission
  renderMode: 'client',
}
```

### 7. Resolving Bindings at Runtime

```typescript
import { resolveBlockBindings, type BlockContext } from '@/lib/portal/blocks'

const context: BlockContext = {
  user: {
    id: '123',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'admin',
    permissions: ['tickets.create', 'tickets.view'],
  },
  organization: {
    id: 'org1',
    name: 'Acme Corp',
  },
}

const resolved = resolveBlockBindings(textBlock, context)
console.log(resolved.content) // "John"
```

### 8. Tree Operations

```typescript
import {
  findBlockById,
  updateBlock,
  removeBlock,
  moveBlock,
  flattenBlocks,
  getBlockStatistics,
} from '@/lib/portal/blocks'

// Find a block
const block = findBlockById(page, 'block_123')

// Update a block
const updated = updateBlock(page, 'block_123', {
  props: { ...block.props, content: 'Updated text' },
})

// Remove a block
const removed = removeBlock(page, 'block_123')

// Move a block
const moved = moveBlock(page, 'block_123', 'parent_456', 2)

// Get all blocks as flat array
const all = flattenBlocks(page)

// Get statistics
const stats = getBlockStatistics(page)
console.log(stats.total) // Total block count
console.log(stats.byType) // { text: 5, button: 3, section: 2 }
console.log(stats.byCategory) // { content: 8, container: 2 }
console.log(stats.depth) // Maximum tree depth
```

## Block Props Schemas

All block props are validated with Zod schemas. Here are some examples:

### Text Block

```typescript
import { textPropsSchema } from '@/lib/portal/blocks'

const props = textPropsSchema.parse({
  id: 'text1',
  content: 'Hello, world!',
  variant: 'h1',
  align: 'center',
  color: '#000000',
  weight: 'bold',
  markdown: false,
})
```

### Button Block

```typescript
import { buttonPropsSchema } from '@/lib/portal/blocks'

const props = buttonPropsSchema.parse({
  id: 'btn1',
  text: 'Click me',
  variant: 'primary',
  size: 'md',
  action: {
    type: 'link',
    href: 'https://example.com',
    target: '_blank',
    external: true,
  },
})
```

### Form Input Block

```typescript
import { inputPropsSchema } from '@/lib/portal/blocks'

const props = inputPropsSchema.parse({
  id: 'input1',
  name: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  placeholder: 'john@example.com',
  validation: {
    pattern: '^[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+$',
    message: 'Please enter a valid email address',
  },
})
```

### List Block (Data)

```typescript
import { listPropsSchema } from '@/lib/portal/blocks'

const props = listPropsSchema.parse({
  id: 'list1',
  dataSource: {
    type: 'api',
    endpoint: 'https://api.example.com/items',
    method: 'GET',
  },
  layout: 'grid',
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  pagination: {
    enabled: true,
    pageSize: 12,
  },
})
```

## Extending the System

### Adding a New Block Type

1. **Create schema** in `schemas/`:

```typescript
// schemas/custom.ts
import { z } from 'zod'

export const customBlockPropsSchema = z.object({
  id: z.string(),
  myProp: z.string(),
  myNumber: z.number().min(0).max(100),
})

export type CustomBlockProps = z.infer<typeof customBlockPropsSchema>
```

2. **Create component** in `components/`:

```typescript
// components/index.tsx
export const CustomBlock: React.FC<CustomBlockProps> = (props) => {
  return <div>{props.myProp}</div>
}
```

3. **Register in registry**:

```typescript
// registry.ts
import { customBlockPropsSchema } from './schemas/custom'
import { CustomBlock } from './components'

const customBlock: BlockDefinition<CustomBlockProps> = {
  type: 'custom-block',
  component: CustomBlock,
  schema: customBlockPropsSchema,
  metadata: {
    label: 'Custom Block',
    description: 'My custom block',
    category: 'content',
    icon: 'Star',
    isContainer: false,
  },
  defaultProps: {
    id: '',
    myProp: 'default',
    myNumber: 50,
  },
}

// Add to registry
export const blockRegistry: BlockRegistry = {
  // ... existing blocks
  'custom-block': customBlock,
}
```

## Type Safety

All block operations are fully typed:

```typescript
// TypeScript will catch these errors:
const textBlock: BlockInstance = {
  id: 'text1',
  type: 'text',
  props: {
    id: 'text1',
    content: 'Hello',
    variant: 'invalid', // ❌ Error: Type '"invalid"' is not assignable to type 'TypographyVariant'
  },
  renderMode: 'server',
}

// Zod will catch these at runtime:
const result = textPropsSchema.safeParse({
  id: 'text1',
  content: 'Hello',
  variant: 'h1',
  color: 'not-a-color', // ✅ Valid, strings are allowed
  weight: 'invalid', // ❌ Zod error: Invalid enum value
})
```

## Best Practices

1. **Always validate** blocks before rendering or saving
2. **Use data bindings** instead of hardcoding values when possible
3. **Apply visibility guards** to protect sensitive content
4. **Leverage utility functions** instead of manual tree manipulation
5. **Keep block trees shallow** (max 3-4 levels deep)
6. **Use semantic containers** (section, article, nav) for accessibility
7. **Set proper alt text** for images
8. **Use server rendering** for static content, client for interactive
9. **Test custom blocks** with schema validation before adding to registry
10. **Document custom blocks** with clear descriptions and examples

## Performance Considerations

- **Tree depth**: Keep trees shallow (max 4-5 levels) to avoid rendering performance issues
- **Data bindings**: Expensive transformations should be memoized
- **Validation**: Validate on save, not on every render
- **Flattening**: Use `flattenBlocks()` sparingly as it creates a new array
- **Cloning**: `cloneBlock()` performs deep copies; use sparingly

## Error Handling

The system provides comprehensive error messages:

```typescript
const validation = validateBlockTree(page)

if (!validation.valid) {
  validation.errors?.forEach((error) => {
    console.error(
      `Block ${error.blockId}: ${error.message} at ${error.path}`
    )
  })
}

// Example output:
// Block block_123: Invalid enum value at blocks.block_123.props.variant
// Block block_456: Unknown block type: invalid-type at blocks.block_456
```

## Integration with Visual Builder

This registry system is designed to integrate with a visual page builder:

1. **Block Palette**: Use `getBlockDefinitionsByCategory()` to group blocks
2. **Drag & Drop**: Use `moveBlock()` for tree updates
3. **Props Panel**: Generate forms from Zod schemas
4. **Preview**: Use `checkVisibility()` to conditionally render
5. **Validation**: Use `validateBlock()` to show inline errors
6. **Save**: Use `serializeBlocks()` to store in database
7. **Load**: Use `deserializeBlocks()` to restore from database

## License

Part of the Deskwise ITSM platform. Proprietary and confidential.
