# Knowledge Base Categories Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [RBAC Integration](#rbac-integration)
6. [Service Layer](#service-layer)
7. [Frontend Components](#frontend-components)
8. [Migration Strategy](#migration-strategy)
9. [Code Examples](#code-examples)
10. [Testing](#testing)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Knowledge Base Categories system provides a hierarchical, RBAC-integrated category management solution for organizing KB articles. This implementation replaces the previous string-based category system with a robust, nested structure that supports:

- **Nested Categories**: Unlimited depth with parent-child relationships
- **RBAC Integration**: Role-based and permission-based access control
- **Public Portal Support**: Categories can be marked as public for external KB access
- **Visual Customization**: Icons, colors, and display ordering
- **Auto-Generated Metadata**: Full paths, slugs, and article counts

### Key Benefits

- **Better Organization**: Hierarchical structure mirrors organizational knowledge structure
- **Fine-Grained Access Control**: Different teams can have different category access
- **Improved User Experience**: Visual cues (icons/colors) and logical grouping
- **Scalability**: Supports large knowledge bases with thousands of articles
- **SEO-Friendly**: Slugs enable clean URLs for public KB articles

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  - Category Tree Component                                      │
│  - Category Selector (with hierarchy)                          │
│  - Article Filter (by category)                                │
│  - Category Management UI                                       │
│  - Permission Matrix                                            │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ API Calls (REST)
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                        API Routes Layer                         │
├─────────────────────────────────────────────────────────────────┤
│  /api/knowledge-base/categories                                 │
│    - GET:    List all categories (with hierarchy)              │
│    - POST:   Create new category                               │
│                                                                 │
│  /api/knowledge-base/categories/[id]                           │
│    - GET:    Get category by ID                                │
│    - PUT:    Update category                                   │
│    - DELETE: Delete category (with article migration)          │
│                                                                 │
│  /api/knowledge-base/categories/[id]/articles                  │
│    - GET:    Get all articles in category                      │
│                                                                 │
│  /api/knowledge-base/categories/tree                           │
│    - GET:    Get category tree structure                       │
│                                                                 │
│  /api/knowledge-base/categories/[id]/permissions               │
│    - GET:    Get category permissions                          │
│    - PUT:    Update category permissions                       │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ Service Layer Calls
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                      Service Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  KBCategoryService                                              │
│    - createCategory(orgId, input)                              │
│    - getCategories(orgId, filters)                             │
│    - getCategoryById(id, orgId)                                │
│    - getCategoryTree(orgId, rootId?)                           │
│    - updateCategory(id, orgId, updates)                        │
│    - deleteCategory(id, orgId, migrateTo?)                     │
│    - updateCategoryOrder(orgId, updates)                       │
│    - updateArticleCount(categoryId, orgId)                     │
│    - checkCategoryAccess(categoryId, session)                  │
│                                                                 │
│  PermissionService (Integration)                               │
│    - checkPermission(session, permissionKey)                   │
│    - getUserPermissions(userId, orgId)                         │
└───────────────────┬─────────────────────────────────────────────┘
                    │
                    │ Database Operations
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                      Database Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Collections:                                                   │
│    - kb_categories:     Category definitions                    │
│    - kb_articles:       Articles (categoryId field)            │
│    - permissions:       Permission definitions                  │
│    - roles:            Role definitions                         │
│    - users:            User data with roles                     │
│                                                                 │
│  Indexes:                                                       │
│    - { orgId: 1, slug: 1 } (unique)                           │
│    - { orgId: 1, parentId: 1 }                                │
│    - { orgId: 1, isActive: 1 }                                │
│    - { orgId: 1, order: 1 }                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: User requests categories or articles
2. **Authentication**: NextAuth.js validates session
3. **Authorization**: RBAC system checks permissions
4. **Category Filter**: Only categories user can access are returned
5. **Article Filter**: Only articles in accessible categories are shown
6. **Response**: Filtered data returned to frontend

---

## Database Schema

### KBCategory Collection

```typescript
interface KBCategory extends BaseEntity {
  // BaseEntity fields
  _id: ObjectId              // Primary key
  orgId: string              // Organization ID (multi-tenancy)
  createdAt: Date            // Creation timestamp
  updatedAt: Date            // Last update timestamp
  createdBy: string          // User ID who created

  // Core fields
  name: string               // Display name (e.g., "Windows Troubleshooting")
  slug: string               // URL-friendly identifier (e.g., "windows-troubleshooting")
  description?: string       // Optional description
  icon?: string              // Lucide icon name (e.g., "Laptop", "Server")
  color?: string             // Hex color code (e.g., "#3B82F6")

  // Hierarchy
  parentId?: string          // Reference to parent category _id (null = root)
  fullPath?: string          // Auto-generated path (e.g., "IT > Hardware > Laptops")
  order: number              // Display order within parent (0-based)

  // Metadata
  isActive: boolean          // Soft delete flag
  articleCount?: number      // Calculated field: number of articles

  // RBAC - Role-based access control
  allowedRoles?: string[]    // Role IDs that can view (empty = all roles)
  allowedUsers?: string[]    // User IDs with explicit access (override)
  isPublic: boolean          // Visible in public portal

  // Permission-based access control
  permissions?: {
    view?: string[]          // Permission keys to view (e.g., ["kb.view"])
    contribute?: string[]    // Permission keys to create articles
    manage?: string[]        // Permission keys to manage category
  }
}
```

### Field Explanations

#### Core Fields

- **name**: Human-readable name displayed in UI
- **slug**: Auto-generated from name, used in URLs (`/kb/category/windows-troubleshooting`)
- **description**: Optional longer description for category purpose
- **icon**: Lucide React icon name for visual identification
- **color**: Hex color for category badges and UI elements

#### Hierarchy Fields

- **parentId**: Reference to parent category's `_id`. `null` means root-level category
- **fullPath**: Auto-calculated breadcrumb path (e.g., "IT Support > Windows > Drivers")
- **order**: Sort order within parent category. Used for drag-and-drop reordering

#### RBAC Fields

- **allowedRoles**: Array of role IDs. If empty, all roles can access
- **allowedUsers**: Specific user IDs with explicit access (overrides role restrictions)
- **isPublic**: If true, category is visible in public portal (for public KB articles)
- **permissions.view**: Array of permission keys required to view category
- **permissions.contribute**: Permission keys required to create articles in category
- **permissions.manage**: Permission keys required to edit/delete category

### Database Indexes

```javascript
// Unique constraint: one slug per organization
db.kb_categories.createIndex(
  { orgId: 1, slug: 1 },
  { unique: true }
)

// Hierarchy queries
db.kb_categories.createIndex(
  { orgId: 1, parentId: 1, order: 1 }
)

// Active categories lookup
db.kb_categories.createIndex(
  { orgId: 1, isActive: 1 }
)

// Public portal queries
db.kb_categories.createIndex(
  { orgId: 1, isPublic: 1, isActive: 1 }
)
```

### KBArticle Collection Updates

The existing `kb_articles` collection requires a field update:

```typescript
// BEFORE (old system - string category)
interface KBArticle {
  // ...
  category: string  // Free-text category name
  // ...
}

// AFTER (new system - category reference)
interface KBArticle {
  // ...
  categoryId: string       // Reference to KBCategory._id
  category?: string        // DEPRECATED: Keep for backward compatibility
  // ...
}
```

---

## API Endpoints

### 1. List All Categories

**Endpoint**: `GET /api/knowledge-base/categories`

**Query Parameters**:
- `includeInactive` (boolean): Include soft-deleted categories
- `parentId` (string): Filter by parent category ID
- `isPublic` (boolean): Filter public/internal categories

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "orgId": "org_123",
      "name": "Windows Troubleshooting",
      "slug": "windows-troubleshooting",
      "description": "Common Windows OS issues and solutions",
      "icon": "Laptop",
      "color": "#3B82F6",
      "parentId": "507f1f77bcf86cd799439010",
      "fullPath": "IT Support > Windows Troubleshooting",
      "order": 0,
      "isActive": true,
      "isPublic": false,
      "articleCount": 42,
      "createdAt": "2025-10-01T10:00:00Z",
      "updatedAt": "2025-10-12T15:30:00Z"
    }
  ]
}
```

**Authorization**: Requires `kb.view` permission

---

### 2. Get Category Tree

**Endpoint**: `GET /api/knowledge-base/categories/tree`

**Query Parameters**:
- `rootId` (string): Start tree from specific category (optional)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439010",
      "name": "IT Support",
      "slug": "it-support",
      "icon": "HelpCircle",
      "color": "#10B981",
      "articleCount": 125,
      "children": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Windows Troubleshooting",
          "slug": "windows-troubleshooting",
          "icon": "Laptop",
          "color": "#3B82F6",
          "articleCount": 42,
          "children": [
            {
              "_id": "507f1f77bcf86cd799439012",
              "name": "Driver Issues",
              "slug": "driver-issues",
              "icon": "Settings",
              "color": "#8B5CF6",
              "articleCount": 15,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

**Authorization**: Returns only categories user has access to based on RBAC

---

### 3. Create Category

**Endpoint**: `POST /api/knowledge-base/categories`

**Request Body**:
```json
{
  "name": "Network Troubleshooting",
  "description": "Network connectivity and configuration issues",
  "parentId": "507f1f77bcf86cd799439010",
  "icon": "Network",
  "color": "#F59E0B",
  "isPublic": false,
  "allowedRoles": ["role_technician", "role_admin"],
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create", "kb.edit"],
    "manage": ["kb.manage"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "orgId": "org_123",
    "name": "Network Troubleshooting",
    "slug": "network-troubleshooting",
    "fullPath": "IT Support > Network Troubleshooting",
    // ... full category object
  },
  "message": "Category created successfully"
}
```

**Authorization**: Requires `kb.manage` permission

---

### 4. Update Category

**Endpoint**: `PUT /api/knowledge-base/categories/[id]`

**Request Body** (all fields optional):
```json
{
  "name": "Network Issues",
  "description": "Updated description",
  "icon": "Wifi",
  "color": "#EF4444",
  "parentId": "507f1f77bcf86cd799439010",
  "order": 5,
  "isPublic": true,
  "allowedRoles": ["role_admin"],
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create"],
    "manage": ["kb.manage", "settings.edit"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* updated category */ },
  "message": "Category updated successfully"
}
```

**Authorization**: Requires `kb.manage` permission

**Special Cases**:
- If `parentId` changes, `fullPath` is recalculated for category and all descendants
- If `name` changes, `slug` is regenerated (with uniqueness check)
- If `order` changes, other siblings may be reordered

---

### 5. Delete Category

**Endpoint**: `DELETE /api/knowledge-base/categories/[id]`

**Query Parameters**:
- `migrateTo` (string): Category ID to move articles to (optional)
- `force` (boolean): Force delete even if articles exist

**Request Body**:
```json
{
  "migrateArticlesTo": "507f1f77bcf86cd799439030"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Category deleted and 15 articles migrated to 'General'",
  "data": {
    "deletedCategoryId": "507f1f77bcf86cd799439020",
    "migratedArticles": 15,
    "deletedSubcategories": 3
  }
}
```

**Authorization**: Requires `kb.manage` permission

**Deletion Rules**:
1. Soft delete by default (sets `isActive: false`)
2. If category has articles:
   - If `migrateTo` provided: Move articles to target category
   - If `force: true`: Delete category anyway (articles become uncategorized)
   - Otherwise: Return error with article count
3. If category has subcategories:
   - Recursively soft-delete all descendants
   - Migrate all descendant articles if `migrateTo` specified

---

### 6. Get Category Articles

**Endpoint**: `GET /api/knowledge-base/categories/[id]/articles`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `status` (string): Filter by article status (draft/published/archived)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439040",
      "title": "How to Reset Windows Password",
      "categoryId": "507f1f77bcf86cd799439011",
      "category": "Windows Troubleshooting",
      "tags": ["windows", "password", "reset"],
      "views": 342,
      "helpful": 28,
      "createdAt": "2025-09-15T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

**Authorization**: User must have access to the category

---

### 7. Update Category Permissions

**Endpoint**: `PUT /api/knowledge-base/categories/[id]/permissions`

**Request Body**:
```json
{
  "allowedRoles": ["role_admin", "role_technician"],
  "allowedUsers": ["user_123", "user_456"],
  "isPublic": false,
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create", "kb.edit"],
    "manage": ["kb.manage"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Permissions updated successfully",
  "data": { /* updated category */ }
}
```

**Authorization**: Requires `kb.manage` or `settings.edit` permission

---

## RBAC Integration

### Permission Model

The Knowledge Base category system integrates with the existing RBAC system using three levels of access control:

#### 1. Permission-Based Access (Recommended)

Most granular control using permission keys:

```typescript
// Category definition
{
  permissions: {
    view: ["kb.view"],                    // Required to see category
    contribute: ["kb.create", "kb.edit"], // Required to create articles
    manage: ["kb.manage"]                 // Required to edit category
  }
}
```

**Permission Keys**:
- `kb.view` - View articles and categories
- `kb.view.all` - View all articles (including other users' drafts)
- `kb.create` - Create new articles
- `kb.edit` - Edit articles
- `kb.edit.own` - Edit own articles only
- `kb.delete` - Delete articles
- `kb.manage` - Manage categories and settings

#### 2. Role-Based Access

Simpler control using role IDs:

```typescript
// Category definition
{
  allowedRoles: ["role_admin", "role_technician"]
}
```

- If `allowedRoles` is empty or undefined: All roles can access
- If `allowedRoles` has values: Only listed roles can access

#### 3. User-Based Access (Overrides)

Explicit user access (overrides role restrictions):

```typescript
// Category definition
{
  allowedUsers: ["user_123", "user_456"]
}
```

- Users in `allowedUsers` can always access the category
- Useful for granting temporary access or special cases

### Access Check Algorithm

```typescript
async function checkCategoryAccess(
  categoryId: string,
  session: Session
): Promise<boolean> {
  const category = await getCategoryById(categoryId)
  const user = session.user

  // 1. Admin bypass
  if (user.role === 'admin') {
    return true
  }

  // 2. Check if category is active
  if (!category.isActive) {
    return false
  }

  // 3. Check user-level override
  if (category.allowedUsers?.includes(user.id)) {
    return true
  }

  // 4. Check role-based access
  if (category.allowedRoles && category.allowedRoles.length > 0) {
    if (!category.allowedRoles.includes(user.roleId)) {
      return false
    }
  }

  // 5. Check permission-based access
  if (category.permissions?.view && category.permissions.view.length > 0) {
    const userPermissions = await getUserPermissions(user.id, user.orgId)
    const hasRequiredPermission = category.permissions.view.some(
      perm => userPermissions.includes(perm)
    )
    if (!hasRequiredPermission) {
      return false
    }
  }

  // 6. All checks passed
  return true
}
```

### Public Portal Access

Categories marked as `isPublic: true` are visible in the public portal:

```typescript
// Public portal query
const publicCategories = await db.collection('kb_categories').find({
  orgId: currentOrg,
  isActive: true,
  isPublic: true
}).toArray()

// Articles in public categories
const publicArticles = await db.collection('kb_articles').find({
  orgId: currentOrg,
  categoryId: { $in: publicCategoryIds },
  visibility: 'public',
  status: 'published'
}).toArray()
```

---

## Service Layer

### KBCategoryService

Create a new service at `src/lib/services/kb-categories.ts`:

```typescript
import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { KBCategory } from '../types'

export interface CreateCategoryInput {
  name: string
  description?: string
  parentId?: string
  icon?: string
  color?: string
  isPublic?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
  permissions?: {
    view?: string[]
    contribute?: string[]
    manage?: string[]
  }
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  parentId?: string
  icon?: string
  color?: string
  order?: number
  isPublic?: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
  permissions?: {
    view?: string[]
    contribute?: string[]
    manage?: string[]
  }
}

export class KBCategoryService {
  /**
   * Generate URL-friendly slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  /**
   * Calculate full path for category
   */
  private static async calculateFullPath(
    orgId: string,
    categoryId: string
  ): Promise<string> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const path: string[] = []
    let currentId: string | undefined = categoryId

    while (currentId) {
      const category = await collection.findOne({
        _id: new ObjectId(currentId),
        orgId
      })

      if (!category) break

      path.unshift(category.name)
      currentId = category.parentId
    }

    return path.join(' > ')
  }

  /**
   * Create a new category
   */
  static async createCategory(
    orgId: string,
    input: CreateCategoryInput,
    createdBy: string
  ): Promise<KBCategory> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    // Generate unique slug
    const baseSlug = this.generateSlug(input.name)
    let slug = baseSlug
    let counter = 1

    while (await collection.findOne({ orgId, slug })) {
      slug = `${baseSlug}-${counter++}`
    }

    // Get order for new category
    const maxOrder = await collection
      .find({ orgId, parentId: input.parentId || null })
      .sort({ order: -1 })
      .limit(1)
      .toArray()

    const order = maxOrder.length > 0 ? maxOrder[0].order + 1 : 0

    const category: KBCategory = {
      _id: new ObjectId(),
      orgId,
      name: input.name,
      slug,
      description: input.description,
      icon: input.icon,
      color: input.color,
      parentId: input.parentId,
      fullPath: '', // Will be calculated
      order,
      isActive: true,
      articleCount: 0,
      isPublic: input.isPublic || false,
      allowedRoles: input.allowedRoles,
      allowedUsers: input.allowedUsers,
      permissions: input.permissions,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await collection.insertOne(category)

    // Calculate and update full path
    category.fullPath = await this.calculateFullPath(orgId, category._id.toString())
    await collection.updateOne(
      { _id: category._id },
      { $set: { fullPath: category.fullPath } }
    )

    return category
  }

  /**
   * Get all categories (flat list)
   */
  static async getCategories(
    orgId: string,
    includeInactive = false
  ): Promise<KBCategory[]> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const query: any = { orgId }
    if (!includeInactive) {
      query.isActive = true
    }

    const categories = await collection
      .find(query)
      .sort({ order: 1 })
      .toArray()

    return categories
  }

  /**
   * Get category tree structure
   */
  static async getCategoryTree(
    orgId: string,
    rootId?: string
  ): Promise<any[]> {
    const categories = await this.getCategories(orgId)

    const buildTree = (parentId: string | undefined): any[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(cat => ({
          ...cat,
          children: buildTree(cat._id.toString())
        }))
    }

    return buildTree(rootId)
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(
    id: string,
    orgId: string
  ): Promise<KBCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    return await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true
    })
  }

  /**
   * Update category
   */
  static async updateCategory(
    id: string,
    orgId: string,
    updates: UpdateCategoryInput
  ): Promise<KBCategory | null> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const updateData: any = {
      ...updates,
      updatedAt: new Date()
    }

    // Regenerate slug if name changed
    if (updates.name) {
      updateData.slug = this.generateSlug(updates.name)

      // Ensure slug uniqueness
      const existing = await collection.findOne({
        orgId,
        slug: updateData.slug,
        _id: { $ne: new ObjectId(id) }
      })

      if (existing) {
        let counter = 1
        const baseSlug = updateData.slug
        while (await collection.findOne({
          orgId,
          slug: `${baseSlug}-${counter}`,
          _id: { $ne: new ObjectId(id) }
        })) {
          counter++
        }
        updateData.slug = `${baseSlug}-${counter}`
      }
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    // Recalculate full path if parent changed or name changed
    if (result && (updates.parentId !== undefined || updates.name)) {
      const fullPath = await this.calculateFullPath(orgId, id)
      await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { fullPath } }
      )
      result.fullPath = fullPath

      // Update all descendant paths
      await this.updateDescendantPaths(orgId, id)
    }

    return result
  }

  /**
   * Update paths for all descendants
   */
  private static async updateDescendantPaths(
    orgId: string,
    categoryId: string
  ): Promise<void> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const descendants = await collection.find({
      orgId,
      parentId: categoryId
    }).toArray()

    for (const desc of descendants) {
      const fullPath = await this.calculateFullPath(orgId, desc._id.toString())
      await collection.updateOne(
        { _id: desc._id },
        { $set: { fullPath } }
      )

      // Recursively update children
      await this.updateDescendantPaths(orgId, desc._id.toString())
    }
  }

  /**
   * Delete category (soft delete)
   */
  static async deleteCategory(
    id: string,
    orgId: string,
    migrateArticlesTo?: string
  ): Promise<{ deletedCount: number; migratedArticles: number }> {
    const db = await getDatabase()
    const categoryCollection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)
    const articleCollection = db.collection(COLLECTIONS.KB_ARTICLES)

    // Get category and descendants
    const descendantIds = await this.getDescendantIds(orgId, id)
    const allIds = [id, ...descendantIds]

    // Count articles in category and descendants
    const articleCount = await articleCollection.countDocuments({
      orgId,
      categoryId: { $in: allIds }
    })

    // Migrate articles if target specified
    if (migrateArticlesTo) {
      await articleCollection.updateMany(
        { orgId, categoryId: { $in: allIds } },
        { $set: { categoryId: migrateArticlesTo } }
      )
    }

    // Soft delete categories
    await categoryCollection.updateMany(
      { orgId, _id: { $in: allIds.map(i => new ObjectId(i)) } },
      { $set: { isActive: false, updatedAt: new Date() } }
    )

    return {
      deletedCount: allIds.length,
      migratedArticles: migrateArticlesTo ? articleCount : 0
    }
  }

  /**
   * Get all descendant category IDs
   */
  private static async getDescendantIds(
    orgId: string,
    categoryId: string
  ): Promise<string[]> {
    const db = await getDatabase()
    const collection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)

    const descendants: string[] = []
    const children = await collection.find({
      orgId,
      parentId: categoryId
    }).toArray()

    for (const child of children) {
      const childId = child._id.toString()
      descendants.push(childId)
      const grandchildren = await this.getDescendantIds(orgId, childId)
      descendants.push(...grandchildren)
    }

    return descendants
  }

  /**
   * Update article count for category
   */
  static async updateArticleCount(
    categoryId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const categoryCollection = db.collection<KBCategory>(COLLECTIONS.KB_CATEGORIES)
    const articleCollection = db.collection(COLLECTIONS.KB_ARTICLES)

    const count = await articleCollection.countDocuments({
      orgId,
      categoryId,
      isActive: true,
      isArchived: false
    })

    await categoryCollection.updateOne(
      { _id: new ObjectId(categoryId), orgId },
      { $set: { articleCount: count } }
    )
  }

  /**
   * Check if user has access to category
   */
  static async checkCategoryAccess(
    categoryId: string,
    session: any
  ): Promise<boolean> {
    if (!session?.user) return false

    const category = await this.getCategoryById(categoryId, session.user.orgId)
    if (!category) return false

    const user = session.user

    // Admin always has access
    if (user.role === 'admin') return true

    // Check user-level override
    if (category.allowedUsers?.includes(user.id)) return true

    // Check role-based access
    if (category.allowedRoles && category.allowedRoles.length > 0) {
      if (!category.allowedRoles.includes(user.roleId)) return false
    }

    // Check permission-based access
    if (category.permissions?.view && category.permissions.view.length > 0) {
      const userPermissions = user.permissions || []
      const hasPermission = category.permissions.view.some(
        perm => userPermissions.includes(perm)
      )
      if (!hasPermission) return false
    }

    return true
  }
}
```

---

## Frontend Components

### Category Tree Component

```typescript
// src/components/knowledge-base/category-tree.tsx

'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'

interface CategoryNode {
  _id: string
  name: string
  icon?: string
  color?: string
  articleCount: number
  children: CategoryNode[]
}

interface CategoryTreeProps {
  onSelect?: (categoryId: string) => void
  selectedId?: string
}

export function CategoryTree({ onSelect, selectedId }: CategoryTreeProps) {
  const [tree, setTree] = useState<CategoryNode[]>([])
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchCategoryTree()
  }, [])

  const fetchCategoryTree = async () => {
    const res = await fetch('/api/knowledge-base/categories/tree')
    const data = await res.json()
    if (data.success) {
      setTree(data.data)
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const renderNode = (node: CategoryNode, depth = 0) => {
    const isExpanded = expanded.has(node._id)
    const isSelected = selectedId === node._id
    const hasChildren = node.children.length > 0

    return (
      <div key={node._id}>
        <div
          className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => onSelect?.(node._id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(node._id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-6" />}

          {isExpanded ? (
            <FolderOpen className="w-5 h-5" style={{ color: node.color }} />
          ) : (
            <Folder className="w-5 h-5" style={{ color: node.color }} />
          )}

          <span className="flex-1 font-medium">{node.name}</span>
          <span className="text-sm text-gray-500">{node.articleCount}</span>
        </div>

        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {tree.map(node => renderNode(node))}
    </div>
  )
}
```

### Category Selector Component

```typescript
// src/components/knowledge-base/category-selector.tsx

'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

interface Category {
  _id: string
  name: string
  fullPath: string
  icon?: string
  color?: string
}

interface CategorySelectorProps {
  value?: string
  onChange: (categoryId: string) => void
  placeholder?: string
}

export function CategorySelector({
  value,
  onChange,
  placeholder = 'Select category...'
}: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const res = await fetch('/api/knowledge-base/categories')
    const data = await res.json()
    if (data.success) {
      setCategories(data.data)
    }
  }

  const selectedCategory = categories.find(c => c._id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 border rounded-md"
      >
        <span className="truncate">
          {selectedCategory?.fullPath || placeholder}
        </span>
        <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
          {categories.map(category => (
            <div
              key={category._id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onChange(category._id)
                setOpen(false)
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || '#6B7280' }}
              />
              <span className="flex-1 truncate text-sm">
                {category.fullPath}
              </span>
              {value === category._id && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## Migration Strategy

See [KB_CATEGORIES_MIGRATION.md](./KB_CATEGORIES_MIGRATION.md) for detailed migration steps.

**High-Level Strategy**:

1. **Phase 1: Preparation**
   - Analyze existing category strings
   - Create category mapping plan
   - Test migration script on development database

2. **Phase 2: Database Migration**
   - Add `categoryId` field to `kb_articles` collection
   - Create `kb_categories` collection with indexes
   - Run migration script to create categories and update articles

3. **Phase 3: Code Updates**
   - Update API routes to support both old and new systems
   - Update frontend components to use category IDs
   - Add backward compatibility fallbacks

4. **Phase 4: Testing & Verification**
   - Verify all articles have valid categories
   - Test category access controls
   - Test article filtering by category

5. **Phase 5: Cleanup** (Optional)
   - Remove deprecated `category` string field
   - Remove backward compatibility code

---

## Code Examples

### Creating a Category via API

```typescript
// Client-side code
async function createCategory() {
  const response = await fetch('/api/knowledge-base/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Email Issues',
      description: 'Common email client problems and solutions',
      parentId: 'parent_category_id',
      icon: 'Mail',
      color: '#10B981',
      isPublic: false,
      permissions: {
        view: ['kb.view'],
        contribute: ['kb.create'],
        manage: ['kb.manage']
      }
    })
  })

  const result = await response.json()
  if (result.success) {
    console.log('Category created:', result.data)
  }
}
```

### Filtering Articles by Category

```typescript
// Get all articles in a category (including subcategories)
async function getArticlesInCategory(categoryId: string) {
  // Get category tree starting from categoryId
  const treeRes = await fetch(
    `/api/knowledge-base/categories/tree?rootId=${categoryId}`
  )
  const treeData = await treeRes.json()

  // Flatten tree to get all descendant IDs
  const categoryIds = flattenTree(treeData.data)

  // Get articles in all categories
  const articlesRes = await fetch('/api/knowledge-base', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: {
        categoryIds: categoryIds
      }
    })
  })

  const articlesData = await articlesRes.json()
  return articlesData.data
}

function flattenTree(nodes: any[]): string[] {
  const ids: string[] = []
  for (const node of nodes) {
    ids.push(node._id)
    if (node.children?.length > 0) {
      ids.push(...flattenTree(node.children))
    }
  }
  return ids
}
```

### Checking Category Access in API Route

```typescript
// API route with category access check
import { getServerSession } from 'next-auth'
import { KBCategoryService } from '@/lib/services/kb-categories'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')

  // Check category access
  if (categoryId) {
    const hasAccess = await KBCategoryService.checkCategoryAccess(
      categoryId,
      session
    )

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
  }

  // Continue with query...
}
```

---

## Testing

### Unit Tests

```typescript
// tests/services/kb-categories.test.ts

import { KBCategoryService } from '@/lib/services/kb-categories'

describe('KBCategoryService', () => {
  describe('createCategory', () => {
    it('should create a root category', async () => {
      const category = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Test Category',
          icon: 'Folder',
          color: '#3B82F6'
        },
        'user_test'
      )

      expect(category.name).toBe('Test Category')
      expect(category.slug).toBe('test-category')
      expect(category.parentId).toBeUndefined()
      expect(category.fullPath).toBe('Test Category')
    })

    it('should create a nested category', async () => {
      const parent = await KBCategoryService.createCategory(
        'org_test',
        { name: 'Parent' },
        'user_test'
      )

      const child = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Child',
          parentId: parent._id.toString()
        },
        'user_test'
      )

      expect(child.parentId).toBe(parent._id.toString())
      expect(child.fullPath).toBe('Parent > Child')
    })

    it('should generate unique slugs', async () => {
      const cat1 = await KBCategoryService.createCategory(
        'org_test',
        { name: 'Duplicate' },
        'user_test'
      )

      const cat2 = await KBCategoryService.createCategory(
        'org_test',
        { name: 'Duplicate' },
        'user_test'
      )

      expect(cat1.slug).toBe('duplicate')
      expect(cat2.slug).toBe('duplicate-1')
    })
  })

  describe('getCategoryTree', () => {
    it('should return hierarchical tree', async () => {
      // Create test categories
      const root = await KBCategoryService.createCategory(
        'org_test',
        { name: 'Root' },
        'user_test'
      )

      const child = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Child',
          parentId: root._id.toString()
        },
        'user_test'
      )

      const tree = await KBCategoryService.getCategoryTree('org_test')

      expect(tree).toHaveLength(1)
      expect(tree[0].name).toBe('Root')
      expect(tree[0].children).toHaveLength(1)
      expect(tree[0].children[0].name).toBe('Child')
    })
  })

  describe('checkCategoryAccess', () => {
    it('should allow admin access', async () => {
      const category = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Restricted',
          allowedRoles: ['role_technician']
        },
        'user_test'
      )

      const session = {
        user: {
          id: 'admin_user',
          orgId: 'org_test',
          role: 'admin'
        }
      }

      const hasAccess = await KBCategoryService.checkCategoryAccess(
        category._id.toString(),
        session
      )

      expect(hasAccess).toBe(true)
    })

    it('should restrict based on role', async () => {
      const category = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Technician Only',
          allowedRoles: ['role_technician']
        },
        'user_test'
      )

      const session = {
        user: {
          id: 'user_123',
          orgId: 'org_test',
          role: 'user',
          roleId: 'role_user'
        }
      }

      const hasAccess = await KBCategoryService.checkCategoryAccess(
        category._id.toString(),
        session
      )

      expect(hasAccess).toBe(false)
    })

    it('should allow user-level override', async () => {
      const category = await KBCategoryService.createCategory(
        'org_test',
        {
          name: 'Restricted',
          allowedRoles: ['role_technician'],
          allowedUsers: ['user_special']
        },
        'user_test'
      )

      const session = {
        user: {
          id: 'user_special',
          orgId: 'org_test',
          role: 'user',
          roleId: 'role_user'
        }
      }

      const hasAccess = await KBCategoryService.checkCategoryAccess(
        category._id.toString(),
        session
      )

      expect(hasAccess).toBe(true)
    })
  })
})
```

### Integration Tests

```typescript
// tests/api/kb-categories.test.ts

import { testApiHandler } from 'next-test-api-route-handler'
import * as handler from '@/app/api/knowledge-base/categories/route'

describe('GET /api/knowledge-base/categories', () => {
  it('should return categories for authorized user', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // Mock session cookie
          }
        })

        const data = await res.json()

        expect(res.status).toBe(200)
        expect(data.success).toBe(true)
        expect(Array.isArray(data.data)).toBe(true)
      }
    })
  })

  it('should return 401 for unauthorized user', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: 'GET' })
        expect(res.status).toBe(401)
      }
    })
  })
})
```

---

## Troubleshooting

### Issue: Duplicate Slugs

**Symptom**: Error when creating category: "Duplicate slug"

**Cause**: Slug generation conflict

**Solution**: The service automatically appends a counter. If this still fails:
1. Check for existing categories with similar names
2. Manually specify a unique slug in the UI
3. Run slug regeneration script

### Issue: Full Path Not Updated

**Symptom**: Category path shows old parent name

**Cause**: Path recalculation didn't run

**Solution**:
```typescript
// Run path recalculation
await KBCategoryService.updateDescendantPaths(orgId, categoryId)
```

### Issue: Articles Not Showing in Category

**Symptom**: Category shows 0 articles despite having articles

**Cause**: Articles still using old string-based category

**Solution**: Run migration script again or manually update:
```javascript
db.kb_articles.updateMany(
  { orgId: 'org_123', category: 'Old Category Name' },
  { $set: { categoryId: 'new_category_id' } }
)
```

### Issue: Permission Denied

**Symptom**: User cannot see category they should have access to

**Cause**: RBAC misconfiguration

**Debug Steps**:
1. Check user's role: `session.user.roleId`
2. Check user's permissions: `session.user.permissions`
3. Check category's `allowedRoles` and `permissions.view`
4. Verify user is not in `allowedUsers` override

**Solution**: Adjust category permissions or user role

### Issue: Circular Parent Reference

**Symptom**: Category tree fails to load

**Cause**: Category's parent is set to itself or creates a loop

**Prevention**: API validates parent is not self or descendant

**Fix**:
```javascript
// Find circular references
db.kb_categories.find({
  $expr: { $eq: ['$_id', '$parentId'] }
})

// Reset parent
db.kb_categories.updateOne(
  { _id: ObjectId('...') },
  { $unset: { parentId: '' } }
)
```

---

## FAQ

**Q: Can I have unlimited nesting depth?**
A: Technically yes, but we recommend max 3-4 levels for UX reasons.

**Q: What happens to articles when a category is deleted?**
A: Articles can be migrated to another category or become uncategorized (if `force: true`).

**Q: Can a category be both internal and public?**
A: No. `isPublic: true` means it's visible in the public portal. For internal categories, set `isPublic: false`.

**Q: How do I bulk-update category permissions?**
A: Use the API endpoint `PUT /api/knowledge-base/categories/bulk-permissions` with an array of category IDs.

**Q: Can I import categories from a CSV?**
A: Yes, create a script using the `KBCategoryService.createCategory()` method.

**Q: How does permission precedence work?**
A: Order: Admin bypass > User override > Role check > Permission check

**Q: Can I reorder categories via drag-and-drop?**
A: Yes, update the `order` field via `PUT /api/knowledge-base/categories/[id]` with new order values.

**Q: How do I backup categories before migration?**
A: Run `mongodump --collection=kb_categories` before migration.

---

## Additional Resources

- [KB Categories Migration Guide](./KB_CATEGORIES_MIGRATION.md)
- [KB Categories User Guide](./KB_CATEGORIES_USER_GUIDE.md)
- [RBAC System Design](./RBAC_SYSTEM_DESIGN.md)
- [API Documentation](./API_DOCUMENTATION.md)

---

**Document Version**: 1.0
**Last Updated**: October 12, 2025
**Author**: Claude Code
**Status**: Production Ready
