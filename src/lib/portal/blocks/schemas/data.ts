import { z } from 'zod'

// ============================================
// List Block Schema (Repeater)
// ============================================

export const listPropsSchema = z.object({
  id: z.string(),
  // Data source
  dataSource: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('static'),
      items: z.array(z.record(z.any())),
    }),
    z.object({
      type: z.literal('binding'),
      path: z.string(), // e.g., 'context.tickets', 'api.getTickets'
    }),
    z.object({
      type: z.literal('api'),
      endpoint: z.string().url('Invalid API endpoint'),
      method: z.enum(['GET', 'POST']).default('GET'),
      headers: z.record(z.string()).optional(),
      body: z.record(z.any()).optional(),
      transformResponse: z.string().optional(), // JS expression to transform response
    }),
  ]),
  // Item rendering
  itemKey: z.string().default('id'), // Field to use as unique key
  emptyMessage: z.string().default('No items to display'),
  loadingMessage: z.string().default('Loading...'),
  // Filtering and sorting
  filter: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan', 'in', 'notIn']),
    value: z.any(),
  }).optional(),
  sortBy: z.string().optional(), // Field to sort by
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.number().min(1).optional(), // Max items to display
  // Pagination
  pagination: z.object({
    enabled: z.boolean().default(false),
    pageSize: z.number().min(1).default(10),
    showPageNumbers: z.boolean().default(true),
    showPageSizeSelector: z.boolean().default(false),
  }).optional(),
  // Layout
  layout: z.enum(['list', 'grid', 'masonry']).default('list'),
  gridColumns: z.union([
    z.number().min(1).max(12),
    z.object({
      mobile: z.number().min(1).max(12).default(1),
      tablet: z.number().min(1).max(12).default(2),
      desktop: z.number().min(1).max(12).default(3),
    }),
  ]).optional(),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  // Styling
  dividers: z.boolean().default(false),
  striped: z.boolean().default(false),
  hoverable: z.boolean().default(false),
  className: z.string().optional(),
})

export type ListProps = z.infer<typeof listPropsSchema>

// ============================================
// Table Block Schema
// ============================================

export const tablePropsSchema = z.object({
  id: z.string(),
  // Data source (same as List)
  dataSource: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('static'),
      items: z.array(z.record(z.any())),
    }),
    z.object({
      type: z.literal('binding'),
      path: z.string(),
    }),
    z.object({
      type: z.literal('api'),
      endpoint: z.string().url('Invalid API endpoint'),
      method: z.enum(['GET', 'POST']).default('GET'),
      headers: z.record(z.string()).optional(),
      body: z.record(z.any()).optional(),
      transformResponse: z.string().optional(),
    }),
  ]),
  // Column configuration
  columns: z.array(z.object({
    key: z.string(),
    label: z.string(),
    type: z.enum(['text', 'number', 'date', 'datetime', 'badge', 'boolean', 'image', 'link', 'custom']).default('text'),
    width: z.union([z.number(), z.string()]).optional(),
    align: z.enum(['left', 'center', 'right']).default('left'),
    sortable: z.boolean().default(false),
    hidden: z.boolean().default(false),
    // Badge configuration (when type = 'badge')
    badgeColors: z.record(z.string()).optional(), // e.g., { 'active': 'green', 'inactive': 'red' }
    // Format configuration
    format: z.string().optional(), // Format string or function
    // Custom render function
    render: z.string().optional(), // Function name or code
  })).min(1, 'At least one column is required'),
  // Table features
  sortable: z.boolean().default(true),
  filterable: z.boolean().default(false),
  searchable: z.boolean().default(false),
  searchPlaceholder: z.string().default('Search...'),
  // Pagination
  pagination: z.object({
    enabled: z.boolean().default(true),
    pageSize: z.number().min(1).default(10),
    showPageNumbers: z.boolean().default(true),
    showPageSizeSelector: z.boolean().default(true),
    pageSizeOptions: z.array(z.number()).default([10, 25, 50, 100]),
  }).optional(),
  // Row actions
  rowActions: z.array(z.object({
    label: z.string(),
    icon: z.string().optional(),
    variant: z.enum(['default', 'primary', 'secondary', 'destructive']).default('default'),
    action: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('link'),
        href: z.string(), // Can include {field} placeholders
        target: z.enum(['_self', '_blank']).default('_self'),
      }),
      z.object({
        type: z.literal('custom'),
        handler: z.string(), // Function name or code
      }),
    ]),
  })).optional(),
  // Selection
  selectable: z.boolean().default(false),
  selectMode: z.enum(['single', 'multiple']).default('single'),
  // Styling
  striped: z.boolean().default(false),
  bordered: z.boolean().default(true),
  hoverable: z.boolean().default(true),
  compact: z.boolean().default(false),
  // Empty state
  emptyMessage: z.string().default('No data available'),
  loadingMessage: z.string().default('Loading data...'),
  className: z.string().optional(),
})

export type TableProps = z.infer<typeof tablePropsSchema>

// ============================================
// Card Grid Block Schema
// ============================================

export const cardGridPropsSchema = z.object({
  id: z.string(),
  // Data source (same as List)
  dataSource: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('static'),
      items: z.array(z.record(z.any())),
    }),
    z.object({
      type: z.literal('binding'),
      path: z.string(),
    }),
    z.object({
      type: z.literal('api'),
      endpoint: z.string().url('Invalid API endpoint'),
      method: z.enum(['GET', 'POST']).default('GET'),
      headers: z.record(z.string()).optional(),
      body: z.record(z.any()).optional(),
      transformResponse: z.string().optional(),
    }),
  ]),
  // Card configuration
  cardTemplate: z.object({
    title: z.string(), // Field path or template string
    description: z.string().optional(),
    image: z.string().optional(), // Field path
    badge: z.string().optional(), // Field path
    badgeColor: z.string().optional(),
    footer: z.string().optional(),
    action: z.object({
      label: z.string(),
      href: z.string(), // Can include {field} placeholders
      target: z.enum(['_self', '_blank']).default('_self'),
    }).optional(),
  }),
  // Grid layout
  columns: z.union([
    z.number().min(1).max(12),
    z.object({
      mobile: z.number().min(1).max(12).default(1),
      tablet: z.number().min(1).max(12).default(2),
      desktop: z.number().min(1).max(12).default(3),
    }),
  ]).default(3),
  gap: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
  // Card styling
  variant: z.enum(['default', 'bordered', 'elevated', 'flat']).default('default'),
  hoverable: z.boolean().default(true),
  // Pagination
  pagination: z.object({
    enabled: z.boolean().default(false),
    pageSize: z.number().min(1).default(12),
  }).optional(),
  // Empty state
  emptyMessage: z.string().default('No items to display'),
  loadingMessage: z.string().default('Loading...'),
  className: z.string().optional(),
})

export type CardGridProps = z.infer<typeof cardGridPropsSchema>
