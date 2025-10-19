/**
 * Block Registry Examples
 *
 * Example usage patterns for the block registry system
 */

import type { BlockInstance, BlockContext } from './types'
import {
  generateBlockId,
  validateBlockTree,
  resolveBlockBindings,
  checkVisibility,
  getBlockStatistics,
} from './utils'

// ============================================
// Example 1: Simple Landing Page
// ============================================

export const simpleLandingPage: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'xl',
      background: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)',
      maxWidth: 'full',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'stack',
        props: {
          id: generateBlockId(),
          direction: 'vertical',
          gap: 'lg',
          align: 'center',
        },
        renderMode: 'server',
        children: [
          {
            id: generateBlockId(),
            type: 'text',
            props: {
              id: generateBlockId(),
              content: 'Welcome to Our Portal',
              variant: 'h1',
              align: 'center',
              color: '#ffffff',
            },
            renderMode: 'server',
          },
          {
            id: generateBlockId(),
            type: 'text',
            props: {
              id: generateBlockId(),
              content: 'Get the support you need, when you need it',
              variant: 'body1',
              align: 'center',
              color: '#e5e7eb',
            },
            renderMode: 'server',
          },
          {
            id: generateBlockId(),
            type: 'button',
            props: {
              id: generateBlockId(),
              text: 'Create Ticket',
              variant: 'primary',
              size: 'lg',
              action: {
                type: 'link',
                href: '/tickets/create',
                target: '_self',
              },
            },
            renderMode: 'client',
          },
        ],
      },
    ],
  },
]

// ============================================
// Example 2: Service Catalog Grid
// ============================================

export const serviceCatalogPage: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
      maxWidth: 'xl',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'text',
        props: {
          id: generateBlockId(),
          content: 'Request a Service',
          variant: 'h2',
        },
        renderMode: 'server',
      },
      {
        id: generateBlockId(),
        type: 'spacer',
        props: {
          id: generateBlockId(),
          size: 'md',
        },
        renderMode: 'server',
      },
      {
        id: generateBlockId(),
        type: 'service-catalog-widget',
        props: {
          id: generateBlockId(),
          title: 'Available Services',
          layout: 'grid',
          gridColumns: 3,
          showSearch: true,
          showFilters: true,
        },
        renderMode: 'client',
      },
    ],
  },
]

// ============================================
// Example 3: Contact Form
// ============================================

export const contactFormPage: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
      maxWidth: 'md',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'text',
        props: {
          id: generateBlockId(),
          content: 'Contact Support',
          variant: 'h2',
        },
        renderMode: 'server',
      },
      {
        id: generateBlockId(),
        type: 'form',
        props: {
          id: generateBlockId(),
          name: 'contact-form',
          action: '/api/contact',
          method: 'POST',
          layout: 'vertical',
          gap: 'md',
        },
        renderMode: 'client',
        children: [
          {
            id: generateBlockId(),
            type: 'input',
            props: {
              id: generateBlockId(),
              name: 'name',
              label: 'Your Name',
              type: 'text',
              required: true,
              placeholder: 'John Doe',
            },
            renderMode: 'client',
          },
          {
            id: generateBlockId(),
            type: 'input',
            props: {
              id: generateBlockId(),
              name: 'email',
              label: 'Email Address',
              type: 'email',
              required: true,
              placeholder: 'john@example.com',
            },
            renderMode: 'client',
          },
          {
            id: generateBlockId(),
            type: 'textarea',
            props: {
              id: generateBlockId(),
              name: 'message',
              label: 'Message',
              required: true,
              rows: 6,
              placeholder: 'How can we help you?',
            },
            renderMode: 'client',
          },
          {
            id: generateBlockId(),
            type: 'submit-button',
            props: {
              id: generateBlockId(),
              text: 'Send Message',
              variant: 'primary',
              size: 'lg',
              fullWidth: true,
            },
            renderMode: 'client',
          },
        ],
      },
    ],
  },
]

// ============================================
// Example 4: Dashboard with Data Bindings
// ============================================

export const dashboardPage: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
      maxWidth: 'xl',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'stack',
        props: {
          id: generateBlockId(),
          direction: 'vertical',
          gap: 'lg',
        },
        renderMode: 'server',
        children: [
          // Welcome message with data binding
          {
            id: generateBlockId(),
            type: 'text',
            props: {
              id: generateBlockId(),
              content: 'Welcome back!', // Fallback
              variant: 'h1',
            },
            bindings: [
              {
                id: 'binding1',
                sourceType: 'context',
                sourcePath: 'user.name',
                targetProp: 'content',
                transform: 'value => `Welcome back, ${value}!`',
              },
            ],
            renderMode: 'server',
          },
          // Grid of stats
          {
            id: generateBlockId(),
            type: 'grid',
            props: {
              id: generateBlockId(),
              columns: 3,
              gap: 'md',
            },
            renderMode: 'server',
            children: [
              // Each stat card would be a child block here
            ],
          },
          // Recent tickets
          {
            id: generateBlockId(),
            type: 'ticket-list-widget',
            props: {
              id: generateBlockId(),
              title: 'My Recent Tickets',
              pageSize: 5,
              showPagination: false,
            },
            renderMode: 'client',
          },
        ],
      },
    ],
  },
]

// ============================================
// Example 5: Admin-Only Content with Guards
// ============================================

export const adminOnlySection: BlockInstance = {
  id: generateBlockId(),
  type: 'section',
  props: {
    id: generateBlockId(),
    padding: 'lg',
    background: '#fee2e2',
    border: true,
    borderColor: '#dc2626',
  },
  guards: [
    {
      id: 'guard1',
      type: 'role',
      condition: ['admin'],
    },
  ],
  renderMode: 'server',
  children: [
    {
      id: generateBlockId(),
      type: 'text',
      props: {
        id: generateBlockId(),
        content: 'Admin Dashboard',
        variant: 'h3',
        color: '#dc2626',
      },
      renderMode: 'server',
    },
    {
      id: generateBlockId(),
      type: 'text',
      props: {
        id: generateBlockId(),
        content: 'This content is only visible to administrators.',
        variant: 'body2',
      },
      renderMode: 'server',
    },
  ],
}

// ============================================
// Example 6: Data-Driven Table
// ============================================

export const ticketTablePage: BlockInstance[] = [
  {
    id: generateBlockId(),
    type: 'section',
    props: {
      id: generateBlockId(),
      padding: 'lg',
      maxWidth: 'full',
    },
    renderMode: 'server',
    children: [
      {
        id: generateBlockId(),
        type: 'text',
        props: {
          id: generateBlockId(),
          content: 'All Tickets',
          variant: 'h2',
        },
        renderMode: 'server',
      },
      {
        id: generateBlockId(),
        type: 'table',
        props: {
          id: generateBlockId(),
          dataSource: {
            type: 'api',
            endpoint: '/api/tickets',
            method: 'GET',
          },
          columns: [
            {
              key: 'ticketNumber',
              label: 'Ticket #',
              type: 'text',
              width: 120,
              sortable: true,
            },
            {
              key: 'title',
              label: 'Title',
              type: 'text',
              sortable: true,
            },
            {
              key: 'status',
              label: 'Status',
              type: 'badge',
              width: 120,
              sortable: true,
              badgeColors: {
                new: 'blue',
                open: 'yellow',
                pending: 'orange',
                resolved: 'green',
                closed: 'gray',
              },
            },
            {
              key: 'priority',
              label: 'Priority',
              type: 'badge',
              width: 100,
              sortable: true,
              badgeColors: {
                low: 'gray',
                medium: 'blue',
                high: 'orange',
                critical: 'red',
              },
            },
            {
              key: 'createdAt',
              label: 'Created',
              type: 'date',
              width: 150,
              sortable: true,
            },
          ],
          sortable: true,
          filterable: true,
          searchable: true,
          pagination: {
            enabled: true,
            pageSize: 25,
            showPageSizeSelector: true,
          },
          rowActions: [
            {
              label: 'View',
              icon: 'Eye',
              variant: 'default',
              action: {
                type: 'link',
                href: '/tickets/{id}',
                target: '_self',
              },
            },
          ],
        },
        renderMode: 'client',
      },
    ],
  },
]

// ============================================
// Example Usage Functions
// ============================================

/**
 * Example: Validate a page before saving
 */
export function validatePageExample(page: BlockInstance[]): void {
  const validation = validateBlockTree(page)

  if (!validation.valid) {
    console.error('Page validation failed:')
    validation.errors?.forEach((error) => {
      console.error(`  - ${error.message} at ${error.path}`)
    })
    throw new Error('Invalid page structure')
  }

  console.log('✓ Page validation passed')
}

/**
 * Example: Resolve data bindings for rendering
 */
export function renderBlockExample(block: BlockInstance, context: BlockContext): void {
  // Check visibility
  if (!checkVisibility(block, context)) {
    console.log(`Block ${block.id} is hidden for current user`)
    return
  }

  // Resolve bindings
  const resolved = resolveBlockBindings(block, context)
  const finalProps = { ...block.props, ...resolved }

  console.log(`Rendering ${block.type} with props:`, finalProps)
}

/**
 * Example: Get page statistics
 */
export function analyzePageExample(page: BlockInstance[]): void {
  const stats = getBlockStatistics(page)

  console.log('Page Statistics:')
  console.log(`  Total blocks: ${stats.total}`)
  console.log(`  Max depth: ${stats.depth}`)
  console.log('  By category:')
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`    - ${category}: ${count}`)
  })
  console.log('  By type:')
  Object.entries(stats.byType).forEach(([type, count]) => {
    console.log(`    - ${type}: ${count}`)
  })
}

// ============================================
// Example Context
// ============================================

export const exampleContext: BlockContext = {
  user: {
    id: 'user_123',
    email: 'john@example.com',
    name: 'John Doe',
    role: 'admin',
    permissions: [
      'tickets.view',
      'tickets.create',
      'tickets.edit',
      'tickets.delete',
      'kb.view',
      'settings.view',
    ],
  },
  organization: {
    id: 'org_456',
    name: 'Acme Corporation',
    settings: {
      ticketPrefix: 'ACME',
      enableAI: true,
    },
  },
  page: {
    id: 'page_789',
    slug: 'dashboard',
  },
  theme: {
    primaryColor: '#667eea',
    accentColor: '#764ba2',
    mode: 'light',
  },
}

// ============================================
// Run Examples
// ============================================

// Uncomment to run examples:
// validatePageExample(simpleLandingPage)
// analyzePageExample(dashboardPage)
// renderBlockExample(adminOnlySection, exampleContext)
