# Block Registry - Quick Start Guide

## Installation

The block registry system is already installed at `src/lib/portal/blocks/`.

## Import

```typescript
import {
  // Types
  type BlockInstance,
  type BlockContext,

  // Registry
  blockRegistry,
  getBlockDefinition,
  getAllBlockDefinitions,

  // Utilities
  generateBlockId,
  validateBlockTree,
  resolveBlockBindings,
  checkVisibility,

  // Schemas (if needed)
  textPropsSchema,
  buttonPropsSchema,
  // ... etc
} from '@/lib/portal/blocks'
```

## Create a Simple Page

```typescript
import { generateBlockId, type BlockInstance } from '@/lib/portal/blocks'

const page: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'text',
        props: {
          id: generateBlockId(),
          content: 'Hello, World!',
          variant: 'h1',
        },
        renderMode: 'server',
      },
    ],
  },
]
```

## Validate Before Saving

```typescript
import { validateBlockTree } from '@/lib/portal/blocks'

const validation = validateBlockTree(page)

if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
  throw new Error('Invalid page structure')
}

// Save to database
await db.collection('portal_pages').insertOne({
  orgId: '...',
  slug: 'home',
  blocks: page,
  // ... other fields
})
```

## Add Data Bindings

```typescript
const dynamicText: BlockInstance = {
  id: generateBlockId(),
  type: 'text',
  props: {
    id: generateBlockId(),
    content: 'Guest', // Fallback
    variant: 'h2',
  },
  bindings: [
    {
      id: 'binding1',
      sourceType: 'context',
      sourcePath: 'user.name',
      targetProp: 'content',
    },
  ],
  renderMode: 'server',
}
```

## Add Visibility Guards

```typescript
const adminOnly: BlockInstance = {
  id: generateBlockId(),
  type: 'button',
  props: {
    id: generateBlockId(),
    text: 'Admin Settings',
    variant: 'primary',
  },
  guards: [
    {
      id: 'guard1',
      type: 'role',
      condition: ['admin'],
    },
  ],
  renderMode: 'client',
}
```

## Render at Runtime

```typescript
import {
  resolveBlockBindings,
  checkVisibility,
  type BlockContext,
} from '@/lib/portal/blocks'

function renderBlock(block: BlockInstance, context: BlockContext) {
  // Check visibility
  if (!checkVisibility(block, context)) {
    return null // Don't render
  }

  // Resolve data bindings
  const resolved = resolveBlockBindings(block, context)
  const finalProps = { ...block.props, ...resolved }

  // Get component and render
  const Component = getBlockComponent(block.type)
  return <Component {...finalProps} />
}
```

## Available Block Types

### Containers
- `section` - Full-width container
- `grid` - CSS Grid layout
- `stack` - Flexbox stack
- `container` - Generic container

### Content
- `text` - Typography
- `image` - Images
- `button` - Buttons
- `icon` - Icons
- `divider` - Dividers
- `spacer` - Spacing

### Data
- `list` - Repeater
- `table` - Data table
- `card-grid` - Card grid

### Forms
- `input` - Text input
- `textarea` - Multi-line input
- `select` - Dropdown
- `checkbox` - Checkbox
- `checkbox-group` - Multiple checkboxes
- `radio-group` - Radio buttons
- `file-upload` - File upload
- `switch` - Toggle
- `slider` - Range slider
- `date-picker` - Date picker
- `rich-text-editor` - Rich text
- `submit-button` - Submit
- `form` - Form container

### Widgets
- `ticket-create-widget` - Create tickets
- `ticket-list-widget` - List tickets
- `incident-status-widget` - System status
- `kb-search-widget` - KB search
- `service-catalog-widget` - Service catalog
- `announcement-banner` - Announcements
- `user-profile-widget` - User profile

## Get Block Metadata

```typescript
import { getBlockDefinition } from '@/lib/portal/blocks'

const textBlock = getBlockDefinition('text')

console.log(textBlock.metadata)
// {
//   label: 'Text',
//   description: 'Typography with rich text support and markdown',
//   category: 'content',
//   icon: 'Type',
//   isContainer: false,
//   tags: ['text', 'typography', 'content']
// }
```

## Browse All Blocks

```typescript
import { getAllBlockDefinitions } from '@/lib/portal/blocks'

const allBlocks = getAllBlockDefinitions()

allBlocks.forEach((block) => {
  console.log(`${block.metadata.label} (${block.type})`)
})
```

## Filter by Category

```typescript
import { getBlockDefinitionsByCategory } from '@/lib/portal/blocks'

const formBlocks = getBlockDefinitionsByCategory('form')
const widgets = getBlockDefinitionsByCategory('widget')
```

## Tree Operations

```typescript
import {
  findBlockById,
  updateBlock,
  removeBlock,
  moveBlock,
  cloneBlock,
} from '@/lib/portal/blocks'

// Find a block
const block = findBlockById(page, 'block_123')

// Update a block
const updated = updateBlock(page, 'block_123', {
  props: { ...block.props, content: 'Updated!' },
})

// Remove a block
const removed = removeBlock(page, 'block_123')

// Move a block
const moved = moveBlock(page, 'block_123', 'parent_456', 2)

// Clone a block (generates new IDs)
const cloned = cloneBlock(block)
```

## Statistics

```typescript
import { getBlockStatistics } from '@/lib/portal/blocks'

const stats = getBlockStatistics(page)

console.log(stats)
// {
//   total: 25,
//   byType: { text: 10, button: 5, section: 3, ... },
//   byCategory: { content: 15, container: 5, widget: 5 },
//   depth: 4
// }
```

## Examples

See `examples.ts` for complete working examples:
- Simple landing page
- Service catalog page
- Contact form
- Dashboard with data bindings
- Admin-only content
- Data-driven table

## Next Steps

1. Read `README.md` for comprehensive documentation
2. Review `examples.ts` for working code
3. Check `IMPLEMENTATION_SUMMARY.md` for architecture details
4. Start building your visual page builder UI!

## Support

For questions or issues, refer to:
- `README.md` - Full documentation
- `examples.ts` - Working examples
- `types.ts` - Type definitions
- `IMPLEMENTATION_SUMMARY.md` - Architecture guide
