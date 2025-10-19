# Knowledge Base Categories Backend Infrastructure

## Overview

Complete backend implementation for nested KB categories with hierarchical structure and RBAC permissions.

**Status:** ✅ Production Ready

**Technologies:**
- Next.js 15 App Router
- MongoDB with Node.js driver
- TypeScript (strict mode)
- RBAC integration via PermissionService

## Architecture Components

### 1. Type Definitions

**File:** `src/lib/types.ts` (lines 391-418)

```typescript
export interface KBCategory extends BaseEntity {
  // Core fields
  name: string
  slug: string // URL-friendly (auto-generated)
  description?: string
  icon?: string // Lucide icon name
  color?: string // Hex color

  // Hierarchical structure
  parentId?: string // Parent category ID
  fullPath?: string // "Parent > Child > Grandchild"
  order: number // Display order

  // Status
  isActive: boolean
  articleCount?: number // Calculated field

  // RBAC - Role-based access control
  allowedRoles?: string[] // Role IDs
  allowedUsers?: string[] // User IDs
  isPublic: boolean // Public portal visibility

  // Permission-based access
  permissions?: {
    view?: string[] // e.g., ['kb.view']
    contribute?: string[] // e.g., ['kb.create']
    manage?: string[] // e.g., ['kb.manage', 'settings.edit']
  }
}
```

### 2. Service Layer

**File:** `src/lib/services/kb-categories.ts` (718 lines)

**Key Classes:**
- `KBCategoryService` - Main service class
- `CreateKBCategoryInput` - Input interface for creation
- `UpdateKBCategoryInput` - Input interface for updates
- `KBCategoryTreeNode` - Tree structure interface

**Core Methods:**

#### Category CRUD

```typescript
// Create category
static async createCategory(
  orgId: string,
  input: CreateKBCategoryInput,
  createdBy: string
): Promise<KBCategory>

// Get all categories (flat list)
static async getAllCategories(
  orgId: string,
  includeInactive: boolean = false
): Promise<KBCategory[]>

// Get single category
static async getCategoryById(
  id: string,
  orgId: string
): Promise<KBCategory | null>

// Update category
static async updateCategory(
  id: string,
  orgId: string,
  updates: UpdateKBCategoryInput
): Promise<KBCategory | null>

// Delete category (soft delete)
static async deleteCategory(
  id: string,
  orgId: string
): Promise<boolean>
```

#### Hierarchical Operations

```typescript
// Get category tree structure
static async getCategoryTree(
  orgId: string
): Promise<KBCategoryTreeNode[]>

// Build tree from flat array
static buildCategoryTree(
  categories: KBCategory[],
  parentId?: string,
  level: number = 0
): KBCategoryTreeNode[]

// Get breadcrumb path
static async getCategoryPath(
  categoryId: string,
  orgId: string
): Promise<KBCategory[]>
```

#### RBAC Integration

```typescript
// Check user's permission for category
static async checkCategoryPermission(
  categoryId: string,
  userId: string,
  orgId: string,
  action: 'view' | 'contribute' | 'manage'
): Promise<boolean>

// Get categories accessible by user
static async getCategoriesForUser(
  userId: string,
  orgId: string,
  includeInactive: boolean = false
): Promise<KBCategory[]>
```

#### Utility Methods

```typescript
// Get article count
static async getArticleCount(
  categoryId: string,
  orgId: string
): Promise<number>

// Seed default categories
static async seedDefaultCategories(
  orgId: string,
  createdBy: string = 'system'
): Promise<void>
```

#### Private Helper Methods

```typescript
// Generate URL-friendly slug
private static generateSlug(name: string): string

// Generate full path for breadcrumbs
private static async generateFullPath(
  categoryId: string | undefined,
  orgId: string,
  categoryName: string
): Promise<string>

// Check for circular references
private static async wouldCreateCircularReference(
  categoryId: string,
  parentId: string,
  orgId: string
): Promise<boolean>

// Update children's fullPath recursively
private static async updateChildrenFullPaths(
  parentId: string,
  orgId: string
): Promise<void>
```

### 3. API Routes

#### Main Categories Route

**File:** `src/app/api/knowledge-base/categories/route.ts`

**GET /api/knowledge-base/categories**

Query Parameters:
- `includeInactive` (boolean): Include inactive categories
- `tree` (boolean): Return hierarchical tree structure
- `userFiltered` (boolean): Only categories user can access

Permissions:
- Requires: `kb.view`
- Managers with `settings.edit` or `kb.manage` see all categories
- Regular users see only accessible categories

Response:
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "orgId": "org_123",
    "name": "IT Support",
    "slug": "it-support",
    "description": "Technical support articles",
    "icon": "Wrench",
    "color": "#8b5cf6",
    "parentId": null,
    "fullPath": "IT Support",
    "order": 2,
    "isActive": true,
    "isPublic": false,
    "articleCount": 25,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "createdBy": "user_123"
  }
]
```

**POST /api/knowledge-base/categories**

Permissions:
- Requires: `settings.edit` OR `kb.manage`

Request Body:
```json
{
  "name": "Hardware Support",
  "description": "Hardware troubleshooting guides",
  "icon": "HardDrive",
  "color": "#f59e0b",
  "parentId": "507f1f77bcf86cd799439011",
  "order": 1,
  "isPublic": false,
  "allowedRoles": ["role_123", "role_456"],
  "allowedUsers": ["user_789"],
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create"],
    "manage": ["settings.edit"]
  }
}
```

Response: 201 Created with created category object

#### Individual Category Route

**File:** `src/app/api/knowledge-base/categories/[id]/route.ts`

**GET /api/knowledge-base/categories/[id]**

Permissions:
- Requires: `kb.view` + category-level permission check

Response:
```json
{
  "category": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "IT Support",
    // ... full category object
  },
  "path": [
    { "_id": "...", "name": "Knowledge Base" },
    { "_id": "...", "name": "IT Support" }
  ]
}
```

**PUT /api/knowledge-base/categories/[id]**

Permissions:
- Requires: `settings.edit` OR `kb.manage`

Request Body: (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "parentId": "new_parent_id",
  "isActive": false,
  "order": 5
}
```

Validation:
- Prevents circular parent references
- Verifies parent exists
- Checks slug uniqueness
- Auto-updates `fullPath` and children's `fullPath`

**DELETE /api/knowledge-base/categories/[id]**

Permissions:
- Requires: `settings.edit` OR `kb.manage`

Soft delete (sets `isActive: false`)

Validation:
- Fails if articles exist in category
- Fails if child categories exist

#### Category Tree Route

**File:** `src/app/api/knowledge-base/categories/tree/route.ts`

**GET /api/knowledge-base/categories/tree**

Convenience endpoint equivalent to `GET /categories?tree=true`

Permissions:
- Requires: `kb.view`
- Managers see full tree
- Users see filtered tree (only accessible categories)

Response:
```json
[
  {
    "_id": "...",
    "name": "IT Support",
    "level": 0,
    "children": [
      {
        "_id": "...",
        "name": "Hardware",
        "level": 1,
        "children": [
          {
            "_id": "...",
            "name": "Printers",
            "level": 2,
            "children": []
          }
        ]
      }
    ]
  }
]
```

## Database Schema

**Collection:** `kb_categories`

**Indexes (Recommended):**
```javascript
// Unique slug per organization
db.kb_categories.createIndex({ orgId: 1, slug: 1 }, { unique: true })

// Parent lookup
db.kb_categories.createIndex({ orgId: 1, parentId: 1 })

// Active categories
db.kb_categories.createIndex({ orgId: 1, isActive: 1 })

// Order sorting
db.kb_categories.createIndex({ orgId: 1, order: 1, name: 1 })

// Public categories
db.kb_categories.createIndex({ orgId: 1, isPublic: 1 })
```

**Sample Document:**
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "orgId": "org_123",
  "name": "Hardware Support",
  "slug": "hardware-support",
  "description": "Troubleshooting guides for hardware issues",
  "icon": "HardDrive",
  "color": "#f59e0b",
  "parentId": "507f1f77bcf86cd799439012",
  "fullPath": "IT Support > Hardware Support",
  "order": 3,
  "isActive": true,
  "isPublic": false,
  "allowedRoles": ["role_admin", "role_technician"],
  "allowedUsers": ["user_hr_manager"],
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create", "kb.edit.own"],
    "manage": ["settings.edit", "kb.manage"]
  },
  "createdBy": "user_123",
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-20T15:30:00Z")
}
```

## RBAC Permission Flow

### Permission Check Logic

When `checkCategoryPermission()` is called:

1. **Public Check** (view only)
   - If `action === 'view'` AND `category.isPublic === true`
   - Return `true` (no auth required)

2. **User Allowlist Check**
   - If `category.allowedUsers` includes `userId`
   - Return `true` (explicit grant)

3. **Role Allowlist Check**
   - If user has a role AND `category.allowedRoles` includes user's `roleId`
   - Return `true` (role-based grant)

4. **Permission-Based Check**
   - If `category.permissions[action]` is defined and non-empty
   - Check if user has ANY of the required permissions via `PermissionService.hasAnyPermission()`
   - Return result

5. **Fallback Permission Check**
   - Map action to basic permission:
     - `view` → `kb.view`
     - `contribute` → `kb.create`
     - `manage` → `settings.edit`
   - Check via `PermissionService.hasPermission()`
   - Return result

### Integration Points

**PermissionService Methods Used:**
- `hasPermission(userId, orgId, permission)` - Single permission check
- `hasAnyPermission(userId, orgId, permissions[])` - OR logic
- `hasAllPermissions(userId, orgId, permissions[])` - AND logic (not currently used)

**User Object Fields:**
- `user.roleId` - Reference to Role._id
- `user.role` - Legacy role field (admin/technician/user)
- `user.customPermissions` - Additional permission grants
- `user.permissionOverrides` - Explicit grant/revoke overrides

## Slug Generation

**Algorithm:**

```typescript
private static generateSlug(name: string): string {
  return name
    .toLowerCase()                     // "IT Support & Help"
    .replace(/[^\w\s-]/g, '')         // "IT Support  Help"
    .replace(/\s+/g, '-')             // "IT-Support-Help"
    .replace(/-+/g, '-')              // "IT-Support-Help"
    .trim()                           // "it-support-help"
}
```

**Examples:**
- "IT Support & Help" → `it-support-help`
- "Software / Applications" → `software-applications`
- "Getting Started!" → `getting-started`
- "Network   Security" → `network-security`

**Uniqueness:**
- Checked per organization during creation/update
- MongoDB unique index: `{ orgId: 1, slug: 1 }`
- Throws error if duplicate slug exists

## Full Path Generation

**Algorithm:**

Traverses up the category tree to build full path string.

**Example:**

Category hierarchy:
```
Knowledge Base (root)
└── IT Support (parent)
    └── Hardware (child)
        └── Printers (grandchild)
```

Paths:
- Knowledge Base: `"Knowledge Base"`
- IT Support: `"Knowledge Base > IT Support"`
- Hardware: `"Knowledge Base > IT Support > Hardware"`
- Printers: `"Knowledge Base > IT Support > Hardware > Printers"`

**Update Behavior:**

When a category's name or parentId changes:
1. Regenerate its own `fullPath`
2. Recursively update all descendant categories' `fullPath`

**Protection:**

Max depth: 10 levels (prevents infinite loops)

## Circular Reference Prevention

**Problem:**

User could create a cycle by setting a descendant as parent.

```
A → B → C → A (INVALID)
```

**Solution:**

`wouldCreateCircularReference()` method:

1. Takes `categoryId` and proposed `parentId`
2. Traverses up from `parentId` to root
3. If `categoryId` is found in chain, returns `true` (would create cycle)
4. Otherwise returns `false` (safe to proceed)

**Limits:**

- Max traversal depth: 10 levels
- Prevents infinite loops from corrupted data

## Default Categories

7 pre-configured categories created via `seedDefaultCategories()`:

| Name                       | Icon         | Color     | Public | Order |
|----------------------------|--------------|-----------|--------|-------|
| Getting Started            | Rocket       | #3b82f6   | Yes    | 1     |
| IT Support                 | Wrench       | #8b5cf6   | No     | 2     |
| Software & Applications    | AppWindow    | #10b981   | No     | 3     |
| Hardware & Devices         | HardDrive    | #f59e0b   | No     | 4     |
| Security & Compliance      | Shield       | #ef4444   | No     | 5     |
| Policies & Procedures      | FileText     | #6366f1   | No     | 6     |
| FAQs                       | HelpCircle   | #06b6d4   | Yes    | 7     |

**Usage:**

```typescript
await KBCategoryService.seedDefaultCategories(orgId, 'system')
```

## Error Handling

### Common Errors

**Category Creation:**
- `"Category with name '...' already exists (slug: ...)"`
- `"Parent category not found"`

**Category Update:**
- `"Category not found"`
- `"Cannot set parent: would create circular reference"`
- `"Category with name '...' already exists"`

**Category Delete:**
- `"Category not found"`
- `"Cannot delete category: X article(s) exist in this category"`
- `"Cannot delete category: X subcategorie(s) exist"`

### HTTP Status Codes

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error, circular reference, has articles
- `401 Unauthorized` - No session
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Category doesn't exist
- `500 Internal Server Error` - Database error, unexpected error

## Performance Considerations

### Query Optimization

**Article Count Calculation:**

Currently done on-demand for each category:

```typescript
const count = await articlesCollection.countDocuments({
  orgId,
  category: category._id.toString(),
  isArchived: false,
})
```

**Optimization Options:**

1. **Denormalization:** Update `articleCount` field when articles are created/deleted
2. **Batch Counting:** Count all categories at once with aggregation pipeline
3. **Caching:** Cache category counts in Redis with TTL

### Recursive Operations

**Potential Bottleneck:** Updating children's `fullPath` recursively

**Current Mitigation:**
- Max depth limit (10 levels)
- MongoDB operations are batched (not in transaction)

**Future Optimization:**
- Move to background job queue for deep hierarchies
- Use MongoDB transactions for atomic updates

### Tree Building

`buildCategoryTree()` is O(n) where n = number of categories.

**Current Performance:**
- In-memory operation (fast)
- Suitable for <1000 categories

**Optimization for Large Hierarchies:**
- Implement pagination for tree endpoints
- Add `maxDepth` parameter to limit tree depth
- Cache tree structure with Redis

## Testing Recommendations

### Unit Tests

```typescript
describe('KBCategoryService', () => {
  describe('generateSlug', () => {
    it('should convert name to slug', () => {
      expect(generateSlug('IT Support & Help')).toBe('it-support-help')
    })
  })

  describe('wouldCreateCircularReference', () => {
    it('should detect direct cycle', async () => {
      // A → B, trying to set B → A
      const result = await wouldCreateCircularReference('A', 'B', orgId)
      expect(result).toBe(true)
    })
  })

  describe('buildCategoryTree', () => {
    it('should build correct hierarchy', () => {
      const flat = [
        { _id: '1', name: 'Root', parentId: undefined },
        { _id: '2', name: 'Child', parentId: '1' },
      ]
      const tree = buildCategoryTree(flat)
      expect(tree).toHaveLength(1)
      expect(tree[0].children).toHaveLength(1)
    })
  })
})
```

### Integration Tests

```typescript
describe('Category API', () => {
  it('should create category', async () => {
    const res = await POST('/api/knowledge-base/categories', {
      name: 'Test Category',
      icon: 'Folder',
    })
    expect(res.status).toBe(201)
    expect(res.body.slug).toBe('test-category')
  })

  it('should prevent circular reference', async () => {
    const parent = await createCategory({ name: 'Parent' })
    const child = await createCategory({ name: 'Child', parentId: parent._id })

    const res = await PUT(`/api/knowledge-base/categories/${parent._id}`, {
      parentId: child._id, // Try to create cycle
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toContain('circular')
  })

  it('should respect RBAC permissions', async () => {
    const category = await createCategory({
      name: 'Admin Only',
      allowedRoles: [adminRoleId],
    })

    const userSession = await loginAsUser()
    const res = await GET(`/api/knowledge-base/categories/${category._id}`, {
      session: userSession,
    })
    expect(res.status).toBe(403)
  })
})
```

## Migration Guide

See **MIGRATION_KB_CATEGORIES.md** for complete migration instructions.

**Quick Summary:**

1. Seed default categories
2. Run migration script to convert string categories to IDs
3. Update frontend to use category IDs
4. Test RBAC permissions
5. Deploy to production

## Future Enhancements

### Planned Features

- [ ] **Category Merge:** Combine multiple categories into one
- [ ] **Category Move:** Bulk move articles between categories
- [ ] **Category Templates:** Pre-configured category structures
- [ ] **Category Analytics:** Track views, article creation by category
- [ ] **AI Suggestions:** Auto-suggest category based on article content
- [ ] **Import/Export:** Bulk import/export category hierarchies
- [ ] **Category Permissions UI:** Visual permission matrix editor
- [ ] **Category Icons Upload:** Custom icon support
- [ ] **Category Banner Images:** Visual header images for categories
- [ ] **Category Metadata:** Tags, SEO fields for public KB

### Performance Enhancements

- [ ] Redis caching for category lookups
- [ ] Background job for recursive fullPath updates
- [ ] Aggregation pipeline for article counts
- [ ] Materialized path pattern for faster tree queries
- [ ] Category denormalization in articles (store category name + path)

### RBAC Enhancements

- [ ] Category-level content approval workflows
- [ ] Time-based access (temporary category access)
- [ ] IP-restricted categories
- [ ] Multi-factor auth requirement for sensitive categories
- [ ] Audit log for category permission changes

## API Reference Summary

| Endpoint                                      | Method | Permission                | Description                          |
|-----------------------------------------------|--------|---------------------------|--------------------------------------|
| `/api/knowledge-base/categories`              | GET    | `kb.view`                 | Get all categories (flat or tree)    |
| `/api/knowledge-base/categories`              | POST   | `settings.edit`           | Create new category                  |
| `/api/knowledge-base/categories/[id]`         | GET    | `kb.view` + category RBAC | Get single category with path        |
| `/api/knowledge-base/categories/[id]`         | PUT    | `settings.edit`           | Update category                      |
| `/api/knowledge-base/categories/[id]`         | DELETE | `settings.edit`           | Soft delete category                 |
| `/api/knowledge-base/categories/tree`         | GET    | `kb.view`                 | Get category tree (convenience)      |

## Support & Troubleshooting

### Common Issues

**Issue:** "Category not found" when accessing by ID

**Solution:** Ensure you're using `ObjectId.toString()` when storing category references in articles.

---

**Issue:** Circular reference error

**Solution:** Cannot set a descendant as parent. Move category to root first, then reparent.

---

**Issue:** Permission denied despite being admin

**Solution:** Check if RBAC system is seeded. Run `/api/rbac/seed` endpoint.

---

**Issue:** Slow tree building for large hierarchies

**Solution:** Implement caching or pagination. Consider using `userFiltered=true` to reduce result set.

---

**Issue:** Articles showing "Uncategorized" after migration

**Solution:** Verify migration script completed. Check article documents have valid ObjectId strings in `category` field.

## Contact

For questions or issues with KB categories backend:
- Check CLAUDE.md for project conventions
- Review MIGRATION_KB_CATEGORIES.md for migration help
- See RBAC documentation for permission system details
