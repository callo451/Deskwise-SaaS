# Portal Visual Composer - MongoDB Data Model

Complete data model specification for the Portal Visual Composer system in Deskwise ITSM.

## Table of Contents

1. [Overview](#overview)
2. [Collections](#collections)
3. [TypeScript Types](#typescript-types)
4. [MongoDB Indexes](#mongodb-indexes)
5. [Service Layer](#service-layer)
6. [Usage Examples](#usage-examples)

---

## Overview

The Portal Visual Composer is a no-code/low-code page builder for creating custom self-service portals in Deskwise. It provides:

- **Visual Page Builder**: Drag-and-drop interface for building portal pages with reusable blocks
- **Draft/Publish Workflow**: Version-controlled page management with draft and published states
- **Theme System**: Design token-based theming with customizable colors, typography, spacing, etc.
- **Data Sources**: Integration with internal Deskwise data (tickets, assets, etc.) and external APIs
- **Audit Trail**: Complete tracking of all changes to pages, themes, and data sources
- **Analytics**: Page view tracking and user interaction metrics

---

## Collections

### 1. `portal_pages`

Stores portal page definitions with block tree structure, draft/published workflow, and metadata.

**Collection Name**: `portal_pages`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID (tenant isolation)

  // Basic Information
  title: string,               // Page title (admin-facing)
  slug: string,                // URL-friendly path (e.g., 'home', 'support')
  description?: string,        // Page description

  // Status & Versioning
  status: 'draft' | 'published' | 'archived',
  version: number,             // Current version number
  publishedAt?: Date,          // When last published
  publishedBy?: string,        // User ID who published
  previousVersionId?: string,  // Reference to previous version

  // Page Structure
  blocks: BlockInstance[],     // Block tree (nested structure)
  dataSources?: DataSource[],  // Data source configurations

  // Theme
  themeId?: string,            // Reference to PortalTheme._id
  themeOverrides?: object,     // Page-specific theme overrides

  // SEO & Meta
  seo?: {
    title?: string,
    description?: string,
    keywords?: string[],
    ogImage?: string,
    canonicalUrl?: string,
    noIndex?: boolean,
    noFollow?: boolean
  },

  // Access Control
  isPublic: boolean,           // Accessible without authentication
  allowedRoles?: UserRole[],   // Roles that can view this page
  requiredPermissions?: string[], // Permission keys required

  // Layout Settings
  layout?: {
    header?: boolean,
    footer?: boolean,
    sidebar?: boolean,
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  },

  // Navigation
  isHomePage: boolean,         // Default landing page
  parentPageId?: string,       // For hierarchical navigation
  order: number,               // Display order in navigation
  showInNav: boolean,          // Show in navigation menu
  navLabel?: string,           // Override label in navigation

  // Analytics
  viewCount: number,           // Total page views
  lastViewedAt?: Date,         // Last view timestamp

  // Metadata
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Block Instance Structure**:

```typescript
{
  id: string,                  // Unique instance ID
  type: PortalBlockType,       // Block type (e.g., 'hero', 'button', 'form')
  props: BlockProps,           // Block configuration
  children?: BlockInstance[],  // Nested blocks
  visibilityGuards?: VisibilityGuard[], // Conditional rendering rules
  order: number                // Display order
}
```

**Indexes**:

```javascript
// Unique slug per organization
db.portal_pages.createIndex({ orgId: 1, slug: 1 }, { unique: true })

// Find pages by status
db.portal_pages.createIndex({ orgId: 1, status: 1 })

// Find public pages
db.portal_pages.createIndex({ orgId: 1, isPublic: 1 })

// Find home page
db.portal_pages.createIndex({ orgId: 1, isHomePage: 1 })

// Navigation ordering
db.portal_pages.createIndex({ orgId: 1, order: 1, createdAt: -1 })

// Recently updated pages
db.portal_pages.createIndex({ orgId: 1, updatedAt: -1 })
```

---

### 2. `portal_page_versions`

Stores version history for portal pages to enable rollback and comparison.

**Collection Name**: `portal_page_versions`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID
  pageId: string,              // Reference to portal_pages._id

  // Version Info
  version: number,             // Version number
  title: string,               // Page title at this version
  blocks: BlockInstance[],     // Block tree at this version
  dataSources?: DataSource[],  // Data sources at this version

  // Metadata
  changeMessage?: string,      // Optional changelog message
  restoredFromVersion?: number, // If restored from older version
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

```javascript
// Find versions for a page
db.portal_page_versions.createIndex({ orgId: 1, pageId: 1, version: -1 })

// Recently created versions
db.portal_page_versions.createIndex({ orgId: 1, createdAt: -1 })
```

---

### 3. `portal_themes`

Stores theme definitions with design tokens (colors, typography, spacing, etc.).

**Collection Name**: `portal_themes`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID

  // Basic Information
  name: string,                // Theme name
  description?: string,        // Theme description
  isDefault: boolean,          // Default theme for organization

  // Design Tokens
  colors: {
    primary: string,
    primaryForeground: string,
    secondary: string,
    secondaryForeground: string,
    accent: string,
    accentForeground: string,
    background: string,
    foreground: string,
    muted: string,
    mutedForeground: string,
    card: string,
    cardForeground: string,
    popover: string,
    popoverForeground: string,
    border: string,
    input: string,
    ring: string,
    destructive: string,
    destructiveForeground: string
  },

  typography: {
    fontFamily: string,
    headingFontFamily?: string,
    fontSize: {
      xs: string,
      sm: string,
      base: string,
      lg: string,
      xl: string,
      '2xl': string,
      '3xl': string,
      '4xl': string
    },
    fontWeight: {
      normal: number,
      medium: number,
      semibold: number,
      bold: number
    },
    lineHeight: {
      tight: number,
      normal: number,
      relaxed: number
    }
  },

  spacing: {
    xs: string,
    sm: string,
    md: string,
    lg: string,
    xl: string,
    '2xl': string
  },

  borderRadius: {
    none: string,
    sm: string,
    md: string,
    lg: string,
    full: string
  },

  shadows: {
    sm: string,
    md: string,
    lg: string,
    xl: string
  },

  // Custom CSS
  customCss?: string,          // Additional CSS overrides

  // Metadata
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

```javascript
// Find default theme
db.portal_themes.createIndex({ orgId: 1, isDefault: 1 })

// List all themes
db.portal_themes.createIndex({ orgId: 1, createdAt: -1 })
```

---

### 4. `portal_data_sources`

Stores data source configurations for external APIs, GraphQL endpoints, or internal Deskwise data.

**Collection Name**: `portal_data_sources`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID

  // Basic Information
  name: string,                // Data source name
  description?: string,        // Description
  type: 'rest' | 'graphql' | 'internal',

  // Configuration
  config: {
    // REST API Config
    baseUrl?: string,
    headers?: Record<string, string>,
    authType?: 'none' | 'bearer' | 'apikey' | 'basic' | 'oauth2',
    authSecretRef?: string,    // Reference to encrypted secret storage
    authConfig?: {
      tokenUrl?: string,       // OAuth2 token endpoint
      clientId?: string,
      scope?: string,
      apiKeyHeader?: string,   // Header name for API key
      bearerPrefix?: string    // Prefix for bearer token
    },
    timeout?: number,          // Request timeout in ms
    retryPolicy?: {
      maxRetries: number,
      backoffMs: number
    },
    endpoints?: DataSourceEndpoint[],

    // GraphQL Config
    graphqlEndpoint?: string,
    queries?: GraphQLQuery[],

    // Internal Config
    internal?: {
      resource: 'tickets' | 'assets' | 'incidents' | 'users' | 'kb_articles' | 'service_requests',
      filters?: Record<string, any>,
      fields?: string[],
      sort?: Record<string, 1 | -1>,
      limit?: number,
      includeRelated?: boolean
    },

    // Caching
    globalCache?: {
      enabled: boolean,
      ttl: number,             // seconds
      strategy: 'memory' | 'redis'
    },

    // Rate Limiting
    rateLimit?: {
      requestsPerMinute: number,
      burstSize?: number
    }
  },

  // Status
  isActive: boolean,
  lastTestedAt?: Date,
  testStatus?: 'success' | 'failed',
  testError?: string,
  usageCount?: number,         // Number of blocks using this data source
  tags?: string[],

  // Metadata
  createdBy: string,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

```javascript
// Find active data sources
db.portal_data_sources.createIndex({ orgId: 1, isActive: 1 })

// Find by type
db.portal_data_sources.createIndex({ orgId: 1, type: 1 })

// List all data sources
db.portal_data_sources.createIndex({ orgId: 1, name: 1 })
```

---

### 5. `portal_audit_logs`

Tracks all changes to portal pages, themes, and data sources for compliance and debugging.

**Collection Name**: `portal_audit_logs`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID

  // Action Details
  action: 'page_create' | 'page_update' | 'page_publish' | 'page_unpublish' | 'page_delete' |
          'theme_create' | 'theme_update' | 'theme_delete' |
          'datasource_create' | 'datasource_update' | 'datasource_delete' | 'datasource_test' |
          'page_view',

  // Resource Details
  resourceType: 'page' | 'theme' | 'datasource',
  resourceId: string,          // Resource ID
  resourceName: string,        // Resource name (for display)

  // User Details
  userId: string,
  userName: string,

  // Change Details
  timestamp: Date,
  changes?: {
    before?: any,              // State before change
    after?: any,               // State after change
    fields?: string[]          // List of changed fields
  },

  // Request Details
  ipAddress?: string,
  userAgent?: string,
  sessionId?: string
}
```

**Indexes**:

```javascript
// Find logs by resource
db.portal_audit_logs.createIndex({ orgId: 1, resourceType: 1, resourceId: 1, timestamp: -1 })

// Find logs by action
db.portal_audit_logs.createIndex({ orgId: 1, action: 1, timestamp: -1 })

// Find logs by user
db.portal_audit_logs.createIndex({ orgId: 1, userId: 1, timestamp: -1 })

// Recent audit logs
db.portal_audit_logs.createIndex({ orgId: 1, timestamp: -1 })
```

---

### 6. `portal_analytics`

Tracks page views and user interactions for analytics and reporting.

**Collection Name**: `portal_analytics`

**Schema**:

```typescript
{
  _id: ObjectId,
  orgId: string,               // Organization ID

  // Event Details
  eventType: 'page_view' | 'block_interaction' | 'form_submit' | 'error',
  pageId: string,              // Page ID
  pageSlug: string,            // Page slug (for display)
  blockId?: string,            // Block ID (if applicable)
  blockType?: string,          // Block type (if applicable)

  // User Details
  userId?: string,             // If authenticated
  sessionId: string,           // Anonymous session ID

  // Event Metadata
  timestamp: Date,
  metadata?: Record<string, any>, // Additional event data
  userAgent?: string,
  ipAddress?: string,
  referrer?: string,
  duration?: number            // Time on page in ms
}
```

**Indexes**:

```javascript
// Find analytics by page
db.portal_analytics.createIndex({ orgId: 1, pageId: 1, timestamp: -1 })

// Find analytics by event type
db.portal_analytics.createIndex({ orgId: 1, eventType: 1, timestamp: -1 })

// Find analytics by user
db.portal_analytics.createIndex({ orgId: 1, userId: 1, timestamp: -1 })

// Recent analytics
db.portal_analytics.createIndex({ orgId: 1, timestamp: -1 })
```

---

### 7. `portal_preview_tokens`

Stores temporary preview tokens for viewing draft pages.

**Collection Name**: `portal_preview_tokens`

**Schema**:

```typescript
{
  token: string,               // Unique preview token
  pageId: string,              // Page ID
  userId: string,              // User who generated token
  expiresAt: Date,             // Token expiration
  createdAt: Date
}
```

**Indexes**:

```javascript
// Find token by value
db.portal_preview_tokens.createIndex({ token: 1 }, { unique: true })

// Find tokens by page
db.portal_preview_tokens.createIndex({ pageId: 1 })

// Clean up expired tokens
db.portal_preview_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

## TypeScript Types

All TypeScript types are defined in `src/lib/types.ts`:

### Core Types

- `PortalPage` - Portal page definition
- `PortalPageVersion` - Page version history
- `PortalTheme` - Theme configuration
- `PortalDataSource` - Data source configuration
- `PortalAuditLog` - Audit log entry
- `PortalAnalyticsEvent` - Analytics event
- `PortalPreviewToken` - Preview token

### Supporting Types

- `BlockInstance` - Block tree node
- `BlockProps` - Block configuration
- `PortalBlockType` - Block type enum
- `PortalPageStatus` - Page status enum
- `VisibilityGuard` - Conditional rendering
- `DataBinding` - Data binding configuration
- `DataSource` - Data source definition
- `DataSourceEndpoint` - REST endpoint config
- `GraphQLQuery` - GraphQL query config
- `InternalDataSourceConfig` - Internal data config

---

## Service Layer

The service layer is implemented in `src/lib/services/portal.ts`:

### PortalPageService

Page management service with the following methods:

- `createPage(orgId, input, createdBy)` - Create new page
- `getPageById(id, orgId)` - Get page by ID
- `getPageBySlug(slug, orgId)` - Get page by slug
- `listPages(orgId, filters?)` - List all pages
- `updatePage(id, orgId, updates, updatedBy)` - Update page draft
- `publishPage(id, orgId, publishedBy)` - Publish page
- `unpublishPage(id, orgId, unpublishedBy)` - Unpublish page
- `deletePage(id, orgId, deletedBy)` - Delete page
- `getPageVersions(pageId, orgId)` - Get version history
- `restoreVersion(pageId, versionNumber, orgId, restoredBy)` - Restore from version
- `incrementViewCount(id, orgId)` - Increment view count

### PortalThemeService

Theme management service with the following methods:

- `createTheme(orgId, input, createdBy)` - Create theme
- `getThemeById(id, orgId)` - Get theme by ID
- `getDefaultTheme(orgId)` - Get default theme
- `listThemes(orgId)` - List all themes
- `updateTheme(id, orgId, updates, updatedBy)` - Update theme
- `deleteTheme(id, orgId, deletedBy)` - Delete theme

### PortalDataSourceService

Data source management service with the following methods:

- `createDataSource(orgId, input, createdBy)` - Create data source
- `getDataSourceById(id, orgId)` - Get data source by ID
- `listDataSources(orgId, type?)` - List all data sources
- `updateDataSource(id, orgId, updates, updatedBy)` - Update data source
- `deleteDataSource(id, orgId, deletedBy)` - Delete data source
- `testDataSource(id, orgId, testedBy)` - Test connection

### PortalAuditService

Audit log service with the following methods:

- `getAuditLogs(orgId, filters?)` - Get audit logs

---

## Usage Examples

### Creating a Page

```typescript
import { PortalPageService } from '@/lib/services/portal'

const page = await PortalPageService.createPage(
  'org-123',
  {
    title: 'Support Portal',
    slug: 'support',
    description: 'Submit and track support tickets',
    isPublic: true,
    blocks: [
      {
        id: 'hero-1',
        type: 'hero',
        props: {
          text: {
            content: 'Welcome to Support',
            level: 1,
            align: 'center'
          },
          layout: {
            padding: 64
          }
        },
        order: 0
      },
      {
        id: 'form-1',
        type: 'form',
        props: {
          form: {
            title: 'Submit a Ticket',
            description: 'Describe your issue and we\'ll help',
            submitButtonText: 'Submit Ticket'
          }
        },
        order: 1
      }
    ]
  },
  'user-456'
)
```

### Publishing a Page

```typescript
import { PortalPageService } from '@/lib/services/portal'

await PortalPageService.publishPage('page-id', 'org-123', 'user-456')
```

### Creating a Theme

```typescript
import { PortalThemeService } from '@/lib/services/portal'

const theme = await PortalThemeService.createTheme(
  'org-123',
  {
    name: 'Brand Theme',
    description: 'Corporate branding',
    isDefault: true,
    colors: {
      primary: '#0070f3',
      primaryForeground: '#ffffff',
      secondary: '#7c3aed',
      secondaryForeground: '#ffffff',
      accent: '#f59e0b',
      accentForeground: '#000000',
      background: '#ffffff',
      foreground: '#000000',
      muted: '#f3f4f6',
      mutedForeground: '#6b7280',
      // ... more colors
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      // ... more typography
    },
    // ... more design tokens
  },
  'user-456'
)
```

### Creating a Data Source

```typescript
import { PortalDataSourceService } from '@/lib/services/portal'

// Internal data source
const internalDS = await PortalDataSourceService.createDataSource(
  'org-123',
  {
    name: 'Open Tickets',
    description: 'Fetch open tickets for current user',
    type: 'internal',
    config: {
      internal: {
        resource: 'tickets',
        filters: { status: 'open' },
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 10
      },
      globalCache: {
        enabled: true,
        ttl: 60,
        strategy: 'memory'
      }
    }
  },
  'user-456'
)

// REST API data source
const restDS = await PortalDataSourceService.createDataSource(
  'org-123',
  {
    name: 'External Status API',
    description: 'System status from external API',
    type: 'rest',
    config: {
      baseUrl: 'https://status.example.com/api',
      authType: 'bearer',
      authConfig: {
        bearerPrefix: 'Bearer '
      },
      endpoints: [
        {
          id: 'get-status',
          name: 'Get System Status',
          method: 'GET',
          path: '/status',
          caching: {
            enabled: true,
            ttl: 300
          }
        }
      ]
    }
  },
  'user-456'
)
```

### Retrieving Audit Logs

```typescript
import { PortalAuditService } from '@/lib/services/portal'

const logs = await PortalAuditService.getAuditLogs('org-123', {
  resourceType: 'page',
  action: 'page_publish',
  startDate: new Date('2025-01-01'),
  limit: 50
})
```

---

## Additional Notes

### Organization Isolation

All collections include `orgId` field for complete multi-tenancy isolation. Every query must filter by organization ID.

### Error Handling

All service methods throw errors for validation failures, not found resources, and permission issues. API routes should wrap service calls in try-catch blocks.

### Audit Logging

All mutations (create, update, delete, publish) automatically create audit log entries. Audit logs are immutable and never deleted.

### Caching Strategy

Data sources support caching at two levels:
- **Global cache**: Cache responses for all users (configured per data source)
- **Block-level cache**: Cache rendered block output (configured per block)

### Security Considerations

- Data source secrets are stored encrypted (referenced by `authSecretRef`)
- Custom HTML blocks are sanitized before rendering
- External API calls are rate-limited
- All pages support role-based and permission-based access control

---

## MongoDB Index Creation Scripts

Run these commands to create all required indexes:

```javascript
// Portal Pages
db.portal_pages.createIndex({ orgId: 1, slug: 1 }, { unique: true })
db.portal_pages.createIndex({ orgId: 1, status: 1 })
db.portal_pages.createIndex({ orgId: 1, isPublic: 1 })
db.portal_pages.createIndex({ orgId: 1, isHomePage: 1 })
db.portal_pages.createIndex({ orgId: 1, order: 1, createdAt: -1 })
db.portal_pages.createIndex({ orgId: 1, updatedAt: -1 })

// Portal Page Versions
db.portal_page_versions.createIndex({ orgId: 1, pageId: 1, version: -1 })
db.portal_page_versions.createIndex({ orgId: 1, createdAt: -1 })

// Portal Themes
db.portal_themes.createIndex({ orgId: 1, isDefault: 1 })
db.portal_themes.createIndex({ orgId: 1, createdAt: -1 })

// Portal Data Sources
db.portal_data_sources.createIndex({ orgId: 1, isActive: 1 })
db.portal_data_sources.createIndex({ orgId: 1, type: 1 })
db.portal_data_sources.createIndex({ orgId: 1, name: 1 })

// Portal Audit Logs
db.portal_audit_logs.createIndex({ orgId: 1, resourceType: 1, resourceId: 1, timestamp: -1 })
db.portal_audit_logs.createIndex({ orgId: 1, action: 1, timestamp: -1 })
db.portal_audit_logs.createIndex({ orgId: 1, userId: 1, timestamp: -1 })
db.portal_audit_logs.createIndex({ orgId: 1, timestamp: -1 })

// Portal Analytics
db.portal_analytics.createIndex({ orgId: 1, pageId: 1, timestamp: -1 })
db.portal_analytics.createIndex({ orgId: 1, eventType: 1, timestamp: -1 })
db.portal_analytics.createIndex({ orgId: 1, userId: 1, timestamp: -1 })
db.portal_analytics.createIndex({ orgId: 1, timestamp: -1 })

// Portal Preview Tokens
db.portal_preview_tokens.createIndex({ token: 1 }, { unique: true })
db.portal_preview_tokens.createIndex({ pageId: 1 })
db.portal_preview_tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

---

**End of Document**
