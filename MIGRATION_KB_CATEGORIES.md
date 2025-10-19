# Knowledge Base Categories Migration Guide

## Overview

This document provides guidance for migrating from the old string-based KB category system to the new nested category system with RBAC permissions.

## Old System (String-based)

Previously, KB articles used a simple string for categories:

```typescript
interface KBArticle {
  category: string // e.g., "IT Support", "Software", etc.
  // ...
}
```

## New System (Nested Categories with RBAC)

The new system uses proper KBCategory documents with:
- Hierarchical structure (parent-child relationships)
- URL-friendly slugs
- RBAC permissions (role-based and user-based access control)
- Visual customization (icons, colors)
- Public/private visibility control

```typescript
interface KBCategory extends BaseEntity {
  name: string
  slug: string
  parentId?: string // For nesting
  fullPath?: string // "Parent > Child > Grandchild"
  isPublic: boolean
  allowedRoles?: string[]
  allowedUsers?: string[]
  permissions?: {
    view?: string[]
    contribute?: string[]
    manage?: string[]
  }
}

interface KBArticle {
  category: string // Now references KBCategory._id (ObjectId as string)
  // ...
}
```

## Migration Steps

### Step 1: Seed Default Categories

Run the seed function to create default categories for your organization:

```typescript
import { KBCategoryService } from '@/lib/services/kb-categories'

await KBCategoryService.seedDefaultCategories(orgId, 'system')
```

This creates 7 default categories:
1. Getting Started (Public)
2. IT Support
3. Software & Applications
4. Hardware & Devices
5. Security & Compliance
6. Policies & Procedures
7. FAQs (Public)

### Step 2: Create Migration Script

Create a migration script to convert existing string categories to category IDs:

```typescript
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { KBCategoryService } from '@/lib/services/kb-categories'

async function migrateKBCategories(orgId: string) {
  const db = await getDatabase()
  const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)
  const categoriesCollection = db.collection(COLLECTIONS.KB_CATEGORIES)

  // Get all unique category strings from articles
  const uniqueCategories = await articlesCollection.distinct('category', { orgId })

  // Map old category names to new category IDs
  const categoryMap = new Map<string, string>()

  for (const oldCategoryName of uniqueCategories) {
    // Skip if already migrated (looks like an ObjectId)
    if (/^[a-f\d]{24}$/i.test(oldCategoryName)) {
      continue
    }

    // Try to find existing category by name
    let category = await categoriesCollection.findOne({
      orgId,
      name: oldCategoryName,
      isActive: true,
    })

    // Create category if it doesn't exist
    if (!category) {
      console.log(`Creating category: ${oldCategoryName}`)
      category = await KBCategoryService.createCategory(
        orgId,
        {
          name: oldCategoryName,
          description: `Migrated from legacy category: ${oldCategoryName}`,
          icon: 'Folder',
          color: '#6366f1',
          order: 999, // Put migrated categories at the end
          isPublic: false,
        },
        'migration-script'
      )
    }

    categoryMap.set(oldCategoryName, category._id.toString())
  }

  // Update all articles with new category IDs
  let migratedCount = 0
  for (const [oldName, newId] of categoryMap.entries()) {
    const result = await articlesCollection.updateMany(
      { orgId, category: oldName },
      { $set: { category: newId } }
    )
    migratedCount += result.modifiedCount
    console.log(`Migrated ${result.modifiedCount} articles from "${oldName}" to category ID`)
  }

  console.log(`Migration complete: ${migratedCount} articles updated`)
  console.log(`Category mapping:`, Object.fromEntries(categoryMap))

  return {
    migratedCount,
    categoryMap: Object.fromEntries(categoryMap),
  }
}

// Run migration for specific organization
migrateKBCategories('your-org-id')
  .then((result) => console.log('Migration successful:', result))
  .catch((error) => console.error('Migration failed:', error))
```

### Step 3: Update Frontend Components

Update any frontend components that display or select categories:

**Before:**
```typescript
// Category select with hardcoded strings
<select value={article.category}>
  <option value="IT Support">IT Support</option>
  <option value="Software">Software</option>
  {/* ... */}
</select>
```

**After:**
```typescript
// Category select with API-driven categories
const { data: categories } = useSWR('/api/knowledge-base/categories')

<select value={article.category}>
  {categories?.map((cat) => (
    <option key={cat._id} value={cat._id.toString()}>
      {cat.fullPath || cat.name}
    </option>
  ))}
</select>
```

### Step 4: Update Article Display Logic

Update how articles display their category:

**Before:**
```typescript
// Display category string directly
<span>{article.category}</span>
```

**After:**
```typescript
// Lookup and display category name
const { data: category } = useSWR(`/api/knowledge-base/categories/${article.category}`)

<span>{category?.fullPath || category?.name || 'Uncategorized'}</span>
```

Or use a category cache/lookup:

```typescript
const categoryCache = new Map<string, KBCategory>()

// Pre-load categories
const categories = await fetch('/api/knowledge-base/categories').then(r => r.json())
categories.forEach(cat => categoryCache.set(cat._id.toString(), cat))

// Display
const category = categoryCache.get(article.category)
<span>{category?.fullPath || 'Uncategorized'}</span>
```

## Rollback Plan

If you need to rollback to string-based categories:

```typescript
async function rollbackKBCategories(orgId: string, categoryMap: Record<string, string>) {
  const db = await getDatabase()
  const articlesCollection = db.collection(COLLECTIONS.KB_ARTICLES)

  // Reverse the mapping (ID -> Name)
  const reverseMap = new Map<string, string>()
  for (const [name, id] of Object.entries(categoryMap)) {
    reverseMap.set(id, name)
  }

  let rolledBackCount = 0
  for (const [id, name] of reverseMap.entries()) {
    const result = await articlesCollection.updateMany(
      { orgId, category: id },
      { $set: { category: name } }
    )
    rolledBackCount += result.modifiedCount
  }

  console.log(`Rollback complete: ${rolledBackCount} articles reverted`)
}
```

## Testing Checklist

- [ ] Seed default categories for test organization
- [ ] Run migration script on test data
- [ ] Verify all articles have valid category IDs
- [ ] Test category tree API endpoint
- [ ] Test RBAC permissions (admin, technician, user)
- [ ] Test nested category creation
- [ ] Test category deletion (should fail if articles exist)
- [ ] Test circular reference prevention
- [ ] Verify frontend displays categories correctly
- [ ] Test category filtering (public/private, RBAC)

## RBAC Configuration Examples

### Example 1: Public Getting Started Category
```typescript
await KBCategoryService.createCategory(orgId, {
  name: 'Getting Started',
  isPublic: true, // Visible to everyone, including unauthenticated users
  permissions: {
    view: ['kb.view'], // Anyone with kb.view permission
    contribute: ['kb.create'], // Anyone who can create articles
    manage: ['settings.edit'], // Only admins/managers
  }
}, userId)
```

### Example 2: Role-Restricted Security Category
```typescript
await KBCategoryService.createCategory(orgId, {
  name: 'Security & Compliance',
  isPublic: false,
  allowedRoles: [adminRoleId, securityRoleId], // Only specific roles
  permissions: {
    view: ['kb.view', 'security.view'], // Need both permissions
    contribute: ['kb.create', 'security.manage'],
    manage: ['settings.edit'],
  }
}, userId)
```

### Example 3: User-Specific HR Category
```typescript
await KBCategoryService.createCategory(orgId, {
  name: 'HR & Policies',
  isPublic: false,
  allowedUsers: [hrManagerId, ceoId], // Explicit user access
  allowedRoles: [adminRoleId, hrRoleId],
  permissions: {
    view: ['kb.view'], // Plus user/role checks
    contribute: ['kb.create', 'hr.manage'],
    manage: ['settings.edit'],
  }
}, userId)
```

## Performance Considerations

### Category Caching

Since categories change infrequently, implement caching:

```typescript
// Frontend: SWR with long cache
const { data: categories } = useSWR(
  '/api/knowledge-base/categories',
  fetcher,
  { revalidateOnFocus: false, dedupingInterval: 60000 } // 1 minute
)

// Backend: Redis cache (future enhancement)
// Cache category lookups for 5 minutes
```

### Batch Category Lookups

When displaying multiple articles, batch category lookups:

```typescript
// Load all categories once
const categories = await KBCategoryService.getAllCategories(orgId)
const categoryMap = new Map(categories.map(c => [c._id.toString(), c]))

// Then lookup in memory
articles.forEach(article => {
  const category = categoryMap.get(article.category)
  console.log(category.fullPath)
})
```

## Support

For issues with migration:
1. Check migration logs for errors
2. Verify category slugs are unique
3. Ensure no circular parent references
4. Validate RBAC permissions are set correctly
5. Test with different user roles

## Future Enhancements

Planned features for KB categories:
- [ ] Bulk category migration UI
- [ ] Category merge tool (combine multiple old categories into one)
- [ ] Category usage analytics
- [ ] Automatic category suggestions based on article content (AI)
- [ ] Category templates for common use cases
- [ ] Import/export category hierarchy
