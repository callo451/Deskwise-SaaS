import { z } from 'zod'

// ============================================
// Ticket Create Widget Block Schema
// ============================================

export const ticketCreateWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  title: z.string().default('Create Support Ticket'),
  description: z.string().optional(),
  showIcon: z.boolean().default(true),
  // Form configuration
  fields: z.object({
    title: z.object({
      show: z.boolean().default(true),
      required: z.boolean().default(true),
      label: z.string().default('Title'),
      placeholder: z.string().default('Brief description of your issue'),
    }),
    description: z.object({
      show: z.boolean().default(true),
      required: z.boolean().default(true),
      label: z.string().default('Description'),
      placeholder: z.string().default('Detailed description of your issue'),
      rows: z.number().min(3).max(10).default(4),
    }),
    category: z.object({
      show: z.boolean().default(true),
      required: z.boolean().default(false),
      label: z.string().default('Category'),
      options: z.array(z.string()).optional(), // If not provided, fetches from API
    }),
    priority: z.object({
      show: z.boolean().default(true),
      required: z.boolean().default(true),
      label: z.string().default('Priority'),
      default: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    }),
    attachments: z.object({
      show: z.boolean().default(true),
      required: z.boolean().default(false),
      label: z.string().default('Attachments'),
      maxFiles: z.number().min(1).max(10).default(5),
      maxSize: z.number().min(1).default(10485760), // 10MB default
      accept: z.array(z.string()).default(['image/*', '.pdf', '.doc', '.docx', '.txt']),
    }),
  }).optional(),
  // Submission
  submitButtonText: z.string().default('Submit Ticket'),
  successMessage: z.string().default('Your ticket has been created successfully!'),
  errorMessage: z.string().default('Failed to create ticket. Please try again.'),
  redirectOnSuccess: z.string().optional(), // URL to redirect after success
  showTicketNumberOnSuccess: z.boolean().default(true),
  // Auto-assignment
  autoAssign: z.boolean().default(true),
  defaultAssignee: z.string().optional(), // User ID
  // Integration
  webhookUrl: z.string().url('Invalid webhook URL').optional(), // External webhook on ticket creation
  // Styling
  variant: z.enum(['default', 'compact', 'inline']).default('default'),
  className: z.string().optional(),
})

export type TicketCreateWidgetProps = z.infer<typeof ticketCreateWidgetPropsSchema>

// ============================================
// Ticket List Widget Block Schema
// ============================================

export const ticketListWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  title: z.string().default('My Tickets'),
  showFilters: z.boolean().default(true),
  showSearch: z.boolean().default(true),
  // Filters
  filters: z.object({
    status: z.array(z.enum(['new', 'open', 'pending', 'resolved', 'closed'])).optional(),
    priority: z.array(z.enum(['low', 'medium', 'high', 'critical'])).optional(),
    assignedToMe: z.boolean().default(false),
    createdByMe: z.boolean().default(true), // For portal users
  }).optional(),
  // Columns to display
  columns: z.array(z.object({
    key: z.enum(['ticketNumber', 'title', 'status', 'priority', 'category', 'assignedTo', 'createdAt', 'updatedAt']),
    label: z.string(),
    visible: z.boolean().default(true),
  })).optional(),
  // Pagination
  pageSize: z.number().min(5).max(100).default(10),
  showPagination: z.boolean().default(true),
  // Row actions
  rowActions: z.object({
    view: z.boolean().default(true),
    edit: z.boolean().default(false),
    delete: z.boolean().default(false),
  }).optional(),
  // Styling
  compact: z.boolean().default(false),
  striped: z.boolean().default(true),
  className: z.string().optional(),
})

export type TicketListWidgetProps = z.infer<typeof ticketListWidgetPropsSchema>

// ============================================
// Incident Status Widget Block Schema
// ============================================

export const incidentStatusWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  title: z.string().default('System Status'),
  showOnlyActive: z.boolean().default(true),
  showResolvedTime: z.boolean().default(true),
  // Layout
  layout: z.enum(['list', 'timeline', 'cards']).default('list'),
  maxItems: z.number().min(1).max(50).default(10),
  // Filters
  filters: z.object({
    severity: z.array(z.enum(['minor', 'major', 'critical'])).optional(),
    affectingMe: z.boolean().default(true), // Show only incidents affecting current user's services
  }).optional(),
  // Auto-refresh
  autoRefresh: z.boolean().default(true),
  refreshInterval: z.number().min(10).max(300).default(60), // Seconds
  // Empty state
  emptyMessage: z.string().default('All systems operational'),
  emptyIcon: z.string().default('CheckCircle'),
  // Styling
  showSeverityColors: z.boolean().default(true),
  compact: z.boolean().default(false),
  className: z.string().optional(),
})

export type IncidentStatusWidgetProps = z.infer<typeof incidentStatusWidgetPropsSchema>

// ============================================
// Knowledge Base Search Widget Block Schema
// ============================================

export const kbSearchWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  title: z.string().default('Search Knowledge Base'),
  placeholder: z.string().default('Search for articles...'),
  showIcon: z.boolean().default(true),
  // Search configuration
  minQueryLength: z.number().min(1).max(10).default(3),
  maxResults: z.number().min(1).max(50).default(10),
  searchFields: z.array(z.enum(['title', 'content', 'tags', 'category'])).default(['title', 'content']),
  // Filters
  filters: z.object({
    categories: z.array(z.string()).optional(), // Category IDs
    tags: z.array(z.string()).optional(),
    visibility: z.enum(['public', 'internal', 'all']).default('public'),
  }).optional(),
  // Results display
  showResultCount: z.boolean().default(true),
  showExcerpt: z.boolean().default(true),
  excerptLength: z.number().min(50).max(500).default(150),
  showThumbnails: z.boolean().default(false),
  // Highlighting
  highlightMatches: z.boolean().default(true),
  // Navigation
  openInNewTab: z.boolean().default(false),
  // Styling
  variant: z.enum(['default', 'compact', 'full']).default('default'),
  className: z.string().optional(),
})

export type KBSearchWidgetProps = z.infer<typeof kbSearchWidgetPropsSchema>

// ============================================
// Service Catalog Widget Block Schema
// ============================================

export const serviceCatalogWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  title: z.string().default('Request a Service'),
  showSearch: z.boolean().default(true),
  showFilters: z.boolean().default(true),
  // Layout
  layout: z.enum(['grid', 'list', 'carousel']).default('grid'),
  gridColumns: z.union([
    z.number().min(1).max(6),
    z.object({
      mobile: z.number().min(1).max(6).default(1),
      tablet: z.number().min(1).max(6).default(2),
      desktop: z.number().min(1).max(6).default(3),
    }),
  ]).default(3),
  // Filters
  filters: z.object({
    categories: z.array(z.string()).optional(), // Category IDs to include
    tags: z.array(z.string()).optional(),
    types: z.array(z.enum(['fixed', 'recurring', 'hourly'])).optional(),
    requiresApproval: z.boolean().optional(),
  }).optional(),
  // Card display
  showIcon: z.boolean().default(true),
  showDescription: z.boolean().default(true),
  showPrice: z.boolean().default(true),
  showEstimatedTime: z.boolean().default(true),
  // Sorting
  sortBy: z.enum(['name', 'popularity', 'price', 'recent']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  // Pagination
  pageSize: z.number().min(6).max(100).default(12),
  showPagination: z.boolean().default(true),
  // Interaction
  onClick: z.enum(['modal', 'page', 'custom']).default('modal'), // How to open service request form
  // Styling
  className: z.string().optional(),
})

export type ServiceCatalogWidgetProps = z.infer<typeof serviceCatalogWidgetPropsSchema>

// ============================================
// Announcement Banner Widget Block Schema
// ============================================

export const announcementBannerPropsSchema = z.object({
  id: z.string(),
  // Content
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['info', 'warning', 'success', 'error']).default('info'),
  // Display
  icon: z.string().optional(), // Lucide icon name (auto-selected if not provided)
  dismissible: z.boolean().default(true),
  persistent: z.boolean().default(false), // If true, shows on every page load
  // Action
  action: z.object({
    label: z.string(),
    href: z.string(),
    target: z.enum(['_self', '_blank']).default('_self'),
  }).optional(),
  // Styling
  position: z.enum(['top', 'bottom']).default('top'),
  fullWidth: z.boolean().default(true),
  className: z.string().optional(),
})

export type AnnouncementBannerProps = z.infer<typeof announcementBannerPropsSchema>

// ============================================
// User Profile Widget Block Schema
// ============================================

export const userProfileWidgetPropsSchema = z.object({
  id: z.string(),
  // Display options
  showAvatar: z.boolean().default(true),
  showName: z.boolean().default(true),
  showEmail: z.boolean().default(true),
  showRole: z.boolean().default(false),
  showOrganization: z.boolean().default(false),
  // Actions
  actions: z.array(z.object({
    label: z.string(),
    icon: z.string().optional(),
    href: z.string().optional(),
    handler: z.string().optional(), // Function name or code
  })).optional(),
  // Layout
  layout: z.enum(['horizontal', 'vertical', 'compact']).default('horizontal'),
  align: z.enum(['left', 'center', 'right']).default('left'),
  // Styling
  className: z.string().optional(),
})

export type UserProfileWidgetProps = z.infer<typeof userProfileWidgetPropsSchema>
