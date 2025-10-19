# Portal Runtime Page Renderer

Complete implementation of the public-facing runtime renderer for published portal pages with ISR, data loading, theme application, caching, and security measures.

## Architecture Overview

### Components

1. **Runtime Page Component** - `src/app/portal/[...slug]/page.tsx`
2. **Block Renderer** - `src/lib/portal/renderer/BlockRenderer.tsx`
3. **Data Loader** - `src/lib/portal/renderer/dataLoader.ts`
4. **Visibility Guards** - `src/lib/portal/renderer/visibilityGuards.ts`
5. **Theme Applicator** - `src/lib/portal/theme/themeApplicator.ts`
6. **Page Service** - `src/lib/portal/pageService.ts`
7. **Block Components** - `src/lib/portal/renderer/blocks/*.tsx` (23 components)

## Features

### 1. Dynamic Routing with ISR

- **Route**: `/portal/[...slug]` - Catch-all dynamic route
- **ISR Configuration**: 5-minute revalidation (`revalidate = 300`)
- **Static Generation**: Pre-renders published pages at build time
- **On-Demand Revalidation**: API endpoint to invalidate cache on publish

**Example URLs:**
- `/portal/home` - Homepage
- `/portal/support` - Support page
- `/portal/kb/getting-started` - Nested KB article

### 2. Server-Side Rendering (SSR)

All pages are rendered as React Server Components:
- Data fetching happens server-side
- Visibility guards evaluated server-side
- Theme CSS injected server-side
- Minimal client-side JavaScript

### 3. Data Loading System

**Data Sources:**
- **Internal**: Deskwise entities (tickets, incidents, KB articles, service catalog)
- **External**: REST API calls with transformation
- **Static**: Hardcoded data

**Features:**
- In-memory caching with configurable TTL
- Parallel data loading
- Automatic org isolation
- User-scoped filtering

**Example:**
```typescript
const dataSources: DataSource[] = [
  {
    id: 'myTickets',
    name: 'My Open Tickets',
    type: 'internal',
    internal: {
      entity: 'tickets',
      filters: { status: 'open', onlyMine: true },
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 10
    },
    cache: {
      enabled: true,
      ttl: 300 // 5 minutes
    }
  }
]
```

### 4. Visibility Guards

Server-side evaluation of block visibility:
- **Authenticated**: Requires user login
- **Role**: Requires specific user role (admin, technician, user)
- **Permission**: Requires specific permissions
- **Custom**: JavaScript expression evaluation

**Example:**
```typescript
const visibilityGuards: VisibilityGuard[] = [
  {
    type: 'authenticated',
    fallbackContent: '<p>Please sign in to view this content.</p>'
  },
  {
    type: 'role',
    roles: ['admin', 'technician'],
    fallbackContent: '<p>This section is only visible to staff.</p>'
  },
  {
    type: 'permission',
    permissions: ['tickets.view'],
    fallbackContent: '<p>You do not have permission to view tickets.</p>'
  },
  {
    type: 'custom',
    expression: 'user && user.role === "admin" && data.tickets.length > 0',
    fallbackContent: '<p>No content available.</p>'
  }
]
```

### 5. Data Bindings

Dynamic content replacement using data context:
- Dot notation for nested values (e.g., `user.firstName`)
- Array indexing (e.g., `tickets[0].title`)
- Optional transformations (JavaScript expressions)
- Fallback values

**Example:**
```typescript
const props: BlockProps = {
  text: {
    content: '{{userName}}' // Will be replaced
  },
  bindings: {
    'text.content': {
      sourceId: 'user',
      field: 'firstName',
      transform: 'value.toUpperCase()',
      fallback: 'Guest'
    }
  }
}
```

### 6. Theme System

Organization-specific themes with design tokens:
- **Colors**: 18 semantic color tokens
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale
- **Border Radius**: Rounded corner styles
- **Shadows**: Elevation styles
- **Custom CSS**: Override with custom styles

**Theme Injection:**
```typescript
:root {
  --primary: hsl(222, 47%, 11%);
  --background: hsl(0, 0%, 100%);
  --font-family: 'Inter, system-ui, sans-serif';
  --spacing-md: '1rem';
  --radius-md: '0.5rem';
  --shadow-md: '0 4px 6px -1px rgb(0 0 0 / 0.1)';
}
```

### 7. Block Types (23 Total)

#### Layout Blocks
1. **Container** - Flexible layout container (row/column/grid)
2. **Hero** - Hero section with background image
3. **Card** - Content card with optional image
4. **Card Grid** - Responsive grid of cards

#### Content Blocks
5. **Heading** - Text headings (H1-H6)
6. **Paragraph** - Rich text paragraphs
7. **Button** - Call-to-action buttons
8. **Image** - Responsive images
9. **Video** - YouTube/Vimeo/custom videos
10. **Divider** - Visual separators
11. **Spacer** - Vertical spacing

#### Interactive Blocks
12. **Accordion** - Collapsible content
13. **Tabs** - Tabbed content
14. **Form** - Service request forms

#### Data-Driven Blocks
15. **Ticket List** - Dynamic ticket list
16. **Incident List** - Active incidents
17. **KB Article List** - Knowledge base articles
18. **Service Catalog** - Service catalog grid
19. **Announcement Bar** - Alert banners
20. **Stats Grid** - Statistics display

#### Feature Blocks
21. **Icon Grid** - Icon grid with links
22. **Testimonial** - Customer testimonials
23. **FAQ** - Frequently asked questions
24. **Custom HTML** - Sanitized custom HTML

### 8. Security Measures

#### HTML Sanitization
Uses `DOMPurify` (isomorphic-dompurify) to sanitize all HTML content:
- Allowed tags: Safe HTML tags only
- Allowed attributes: Whitelisted attributes
- URL validation: HTTPS/mailto/tel only
- Script tags: Completely blocked

#### Content Security Policy (CSP)
Recommended CSP headers:
```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  frame-src https://www.youtube.com https://player.vimeo.com;
```

#### RBAC Enforcement
- Role-based visibility guards
- Permission-based access control
- Multi-tenant isolation (orgId)
- Session-based authentication

### 9. Caching Strategy

#### ISR (Incremental Static Regeneration)
- **Revalidate**: 5 minutes
- **Static Generation**: Published pages at build time
- **On-Demand**: Revalidate on publish/unpublish

#### Data Source Cache
- **In-Memory**: Simple Map-based cache
- **TTL**: Configurable per data source
- **Key**: Source ID + config hash + orgId + userId
- **Invalidation**: Manual clear by source ID

#### Edge Caching
- CDN-ready with proper cache headers
- Vary by authentication state
- Public pages cached globally
- Private pages cached per-user

### 10. Preview Mode

JWT-based preview tokens for draft pages:
- **Token Generation**: 60-minute expiry (configurable)
- **URL Format**: `/portal/[slug]?preview=<token>`
- **Access Control**: Only page creators can preview
- **Bypass Cache**: Always renders latest draft

**Example:**
```typescript
const previewToken = await PortalPageService.generatePreviewToken(
  pageId,
  userId,
  60 // expires in 60 minutes
)

const previewUrl = `/portal/home?preview=${previewToken}`
```

### 11. SEO Optimization

**Metadata Generation:**
```typescript
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await fetchPage(slug)

  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description,
    keywords: page.seo?.keywords,
    openGraph: {
      title: page.seo?.title || page.title,
      description: page.seo?.description,
      images: page.seo?.ogImage ? [page.seo.ogImage] : []
    },
    robots: {
      index: !page.seo?.noIndex,
      follow: !page.seo?.noFollow
    }
  }
}
```

**Features:**
- Dynamic title/description
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Robots meta tags (index/follow)
- Structured data (future)

### 12. Error Handling

#### Error Boundaries
- Per-block error boundaries
- Graceful fallback rendering
- Error logging for monitoring

#### 404 Handling
- Next.js `notFound()` for missing pages
- Custom 404 page (future)

#### Access Denied
- Friendly access denied message
- Sign-in redirect link
- No leaked information

### 13. Performance Optimizations

- **Lazy Image Loading**: Next.js Image component
- **Font Optimization**: Next.js font optimization
- **Minimal JavaScript**: React Server Components
- **Streaming SSR**: Progressive rendering
- **Resource Hints**: Preload critical assets

## API Endpoints

### 1. Revalidate Page
**POST** `/api/portal/revalidate`

Invalidate ISR cache for a specific page.

**Request:**
```json
{
  "slug": "home"
}
```

**Response:**
```json
{
  "success": true,
  "revalidated": true,
  "path": "/portal/home",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

**Authentication**: Required (admin or portal.manage permission)

### 2. Revalidate All Pages
**DELETE** `/api/portal/revalidate`

Invalidate ISR cache for all portal pages.

**Response:**
```json
{
  "success": true,
  "revalidated": true,
  "message": "All portal pages revalidated",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

**Authentication**: Required (admin only)

## Database Collections

### portal_pages
```typescript
{
  _id: ObjectId,
  orgId: string,
  title: string,
  slug: string,
  description: string,
  status: 'draft' | 'published' | 'archived',
  publishedAt: Date,
  publishedBy: string,
  blocks: BlockInstance[],
  dataSources: DataSource[],
  themeId: string,
  themeOverrides: Partial<PortalTheme>,
  seo: {
    title: string,
    description: string,
    keywords: string[],
    ogImage: string,
    canonicalUrl: string,
    noIndex: boolean,
    noFollow: boolean
  },
  isPublic: boolean,
  allowedRoles: UserRole[],
  requiredPermissions: string[],
  layout: {
    header: boolean,
    footer: boolean,
    sidebar: boolean,
    maxWidth: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  },
  version: number,
  previousVersionId: string,
  isHomePage: boolean,
  parentPageId: string,
  order: number,
  showInNav: boolean,
  navLabel: string,
  viewCount: number,
  lastViewedAt: Date,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### portal_themes
```typescript
{
  _id: ObjectId,
  orgId: string,
  name: string,
  description: string,
  isDefault: boolean,
  colors: { /* 18 color tokens */ },
  typography: { /* font, size, weight, line height */ },
  spacing: { /* xs, sm, md, lg, xl, 2xl */ },
  borderRadius: { /* none, sm, md, lg, full */ },
  shadows: { /* sm, md, lg, xl */ },
  customCss: string,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### portal_page_versions
```typescript
{
  _id: ObjectId,
  orgId: string,
  pageId: string,
  version: number,
  title: string,
  blocks: BlockInstance[],
  dataSources: DataSource[],
  changeMessage: string,
  restoredFromVersion: number,
  createdAt: Date,
  updatedAt: Date,
  createdBy: string
}
```

### portal_preview_tokens
```typescript
{
  _id: ObjectId,
  token: string,
  pageId: ObjectId,
  userId: string,
  expiresAt: Date,
  createdAt: Date
}
```

## Usage Examples

### 1. Simple Homepage
```typescript
const homepage: PortalPage = {
  title: 'Welcome to Support Portal',
  slug: 'home',
  status: 'published',
  isPublic: true,
  blocks: [
    {
      id: 'hero-1',
      type: 'hero',
      order: 0,
      props: {
        text: {
          content: 'Welcome to our Support Portal',
          align: 'center',
          color: '#ffffff'
        },
        image: {
          src: '/images/hero-bg.jpg'
        }
      }
    },
    {
      id: 'services-1',
      type: 'service-catalog',
      order: 1,
      props: {
        list: {
          limit: 6
        }
      }
    }
  ]
}
```

### 2. Authenticated Ticket Dashboard
```typescript
const ticketDashboard: PortalPage = {
  title: 'My Tickets',
  slug: 'my-tickets',
  status: 'published',
  isPublic: false, // Requires authentication
  dataSources: [
    {
      id: 'openTickets',
      name: 'Open Tickets',
      type: 'internal',
      internal: {
        entity: 'tickets',
        filters: { status: 'open', onlyMine: true },
        sortBy: 'createdAt',
        sortOrder: 'desc'
      },
      cache: { enabled: true, ttl: 300 }
    }
  ],
  blocks: [
    {
      id: 'heading-1',
      type: 'heading',
      order: 0,
      visibilityGuards: [{ type: 'authenticated' }],
      props: {
        text: {
          content: 'Welcome back, {{userName}}!',
          level: 1
        },
        bindings: {
          'text.content': {
            sourceId: 'user',
            field: 'firstName',
            transform: '`Welcome back, ${value}!`',
            fallback: 'Welcome back!'
          }
        }
      }
    },
    {
      id: 'tickets-1',
      type: 'ticket-list',
      order: 1,
      visibilityGuards: [{ type: 'authenticated' }],
      props: {
        list: {
          dataSource: 'openTickets'
        }
      }
    }
  ]
}
```

### 3. Admin-Only Stats Dashboard
```typescript
const adminDashboard: PortalPage = {
  title: 'Admin Dashboard',
  slug: 'admin',
  status: 'published',
  isPublic: false,
  allowedRoles: ['admin'],
  dataSources: [
    {
      id: 'stats',
      name: 'System Statistics',
      type: 'internal',
      internal: {
        entity: 'tickets',
        filters: {},
        sortBy: 'createdAt'
      },
      cache: { enabled: true, ttl: 60 }
    }
  ],
  blocks: [
    {
      id: 'stats-1',
      type: 'stats-grid',
      order: 0,
      visibilityGuards: [
        { type: 'role', roles: ['admin'] }
      ],
      props: {
        stats: {
          items: [
            {
              label: 'Total Tickets',
              value: '{{ticketCount}}',
              icon: 'Ticket',
              trend: 'up',
              trendValue: '+12%'
            }
          ]
        },
        bindings: {
          'stats.items[0].value': {
            sourceId: 'stats',
            field: 'length',
            fallback: '0'
          }
        }
      }
    }
  ]
}
```

## Service Methods

### PortalPageService

```typescript
// Generate preview token
const token = await PortalPageService.generatePreviewToken(pageId, userId, 60)

// Publish page
await PortalPageService.publishPage(pageId, userId, orgId)

// Unpublish page
await PortalPageService.unpublishPage(pageId, orgId)

// Create version snapshot
await PortalPageService.createPageVersion(pageId, orgId, userId, 'Saved draft')

// Restore from version
await PortalPageService.restorePageVersion(pageId, versionNumber, orgId, userId)

// Get page by slug
const page = await PortalPageService.getPageBySlug('home', orgId, false)

// Get all pages
const pages = await PortalPageService.getPages(orgId, { status: 'published' })

// Delete page
await PortalPageService.deletePage(pageId, orgId)

// Duplicate page
const newPageId = await PortalPageService.duplicatePage(
  pageId,
  orgId,
  userId,
  'New Page Title',
  'new-slug'
)
```

### DataLoader

```typescript
const loader = new DataLoader(orgId, userId)

// Load multiple data sources
const dataContext = await loader.loadDataSources(dataSources)

// Clear cache
DataLoader.clearCache('myDataSource') // Clear specific source
DataLoader.clearCache() // Clear all cache

// Get cache stats
const stats = DataLoader.getCacheStats()
console.log(`Cache size: ${stats.size} items`)
```

## Dependencies Required

Add these to package.json:
```json
{
  "dependencies": {
    "isomorphic-dompurify": "^2.15.0",
    "jsonwebtoken": "^9.0.2",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@types/jsonwebtoken": "^9.0.6"
  }
}
```

## Future Enhancements

1. **A/B Testing**: Test different page variants
2. **Analytics Integration**: Track page views, interactions
3. **Personalization**: User-specific content
4. **Multi-Language**: i18n support
5. **Advanced SEO**: Structured data, breadcrumbs
6. **Webhooks**: Trigger external actions on page events
7. **Version Comparison**: Visual diff between versions
8. **Collaborative Editing**: Real-time collaboration
9. **Component Library**: Reusable block templates
10. **AI-Powered Generation**: Auto-generate page content

## Testing

### Unit Tests (Future)
- Block renderer tests
- Visibility guard evaluation tests
- Data binding resolution tests
- Theme CSS generation tests

### Integration Tests (Future)
- End-to-end page rendering
- Authentication flow
- Data loading with MongoDB
- Cache invalidation

### Performance Tests (Future)
- Lighthouse CI
- Core Web Vitals monitoring
- Load testing with k6

## Monitoring

### Metrics to Track
- Page render time
- Data source load time
- Cache hit rate
- Error rate by block type
- User session duration
- Page view count

### Logging
- Block rendering errors
- Data source failures
- Visibility guard evaluations
- Cache operations

## Production Checklist

- [ ] Install dependencies (`isomorphic-dompurify`, `jsonwebtoken`)
- [ ] Configure MongoDB collections and indexes
- [ ] Set up CSP headers in next.config.js
- [ ] Configure preview token secret (NEXTAUTH_SECRET)
- [ ] Set up monitoring and error tracking
- [ ] Test ISR revalidation
- [ ] Verify theme CSS injection
- [ ] Test data source caching
- [ ] Validate HTML sanitization
- [ ] Test visibility guards with different user roles
- [ ] Verify SEO metadata generation
- [ ] Load test with realistic traffic
- [ ] Set up CDN for static assets
- [ ] Configure backup/restore for portal pages
- [ ] Document for content editors

## Support

For issues or questions:
1. Check this documentation
2. Review component source code
3. Check error logs in console
4. Test in preview mode before publishing
5. Contact development team

---

**Version**: 1.0.0
**Created**: October 2025
**Last Updated**: October 2025
