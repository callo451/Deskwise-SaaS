# KB Categories Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- MongoDB collection `kb_categories` exists ✅
- RBAC system seeded ✅
- Next.js 15 with App Router ✅

### Installation

No installation needed - backend infrastructure is complete!

**Files Created:**
- ✅ `src/lib/types.ts` - KBCategory type definition
- ✅ `src/lib/services/kb-categories.ts` - Service layer (718 lines)
- ✅ `src/app/api/knowledge-base/categories/route.ts` - Main API route
- ✅ `src/app/api/knowledge-base/categories/[id]/route.ts` - Individual category CRUD
- ✅ `src/app/api/knowledge-base/categories/tree/route.ts` - Tree endpoint
- ✅ `MIGRATION_KB_CATEGORIES.md` - Migration guide
- ✅ `KB_CATEGORIES_BACKEND.md` - Complete documentation

## 📋 Quick Reference

### API Endpoints

```bash
# Get all categories (flat list)
GET /api/knowledge-base/categories

# Get category tree
GET /api/knowledge-base/categories?tree=true

# Get user-accessible categories only
GET /api/knowledge-base/categories?userFiltered=true

# Create category (requires settings.edit permission)
POST /api/knowledge-base/categories
Content-Type: application/json
{
  "name": "Hardware Support",
  "description": "Hardware troubleshooting",
  "icon": "HardDrive",
  "color": "#f59e0b",
  "parentId": "parent_category_id",
  "isPublic": false
}

# Get single category with breadcrumb path
GET /api/knowledge-base/categories/[id]

# Update category
PUT /api/knowledge-base/categories/[id]
{
  "name": "Updated Name",
  "parentId": "new_parent_id"
}

# Delete category (soft delete)
DELETE /api/knowledge-base/categories/[id]
```

### Service Layer Usage

```typescript
import { KBCategoryService } from '@/lib/services/kb-categories'

// Create category
const category = await KBCategoryService.createCategory(
  orgId,
  {
    name: 'IT Support',
    icon: 'Wrench',
    color: '#8b5cf6',
    isPublic: false,
  },
  userId
)

// Get all categories
const categories = await KBCategoryService.getAllCategories(orgId)

// Get category tree
const tree = await KBCategoryService.getCategoryTree(orgId)

// Check permission
const hasAccess = await KBCategoryService.checkCategoryPermission(
  categoryId,
  userId,
  orgId,
  'view'
)

// Get user's accessible categories
const userCategories = await KBCategoryService.getCategoriesForUser(
  userId,
  orgId
)

// Seed default categories for new org
await KBCategoryService.seedDefaultCategories(orgId, 'system')
```

### TypeScript Types

```typescript
import type { KBCategory, KBCategoryTreeNode } from '@/lib/types'
import type {
  CreateKBCategoryInput,
  UpdateKBCategoryInput,
} from '@/lib/services/kb-categories'

// Use in components
const [categories, setCategories] = useState<KBCategory[]>([])
const [tree, setTree] = useState<KBCategoryTreeNode[]>([])
```

## 🔐 RBAC Permissions

### Permission Checks

Categories use multi-level RBAC:

1. **Public Categories**: Always viewable if `isPublic: true`
2. **User Allowlist**: Explicit user IDs in `allowedUsers`
3. **Role Allowlist**: Role IDs in `allowedRoles`
4. **Permission-Based**: Custom permission requirements
5. **Fallback**: Basic KB permissions

### Required Permissions

| Action | Permission Options |
|--------|-------------------|
| View categories | `kb.view` |
| Create categories | `settings.edit` OR `kb.manage` |
| Update categories | `settings.edit` OR `kb.manage` |
| Delete categories | `settings.edit` OR `kb.manage` |

### Example: Restricted Category

```typescript
const category = await KBCategoryService.createCategory(orgId, {
  name: 'Security & Compliance',
  isPublic: false,
  allowedRoles: [adminRoleId, securityRoleId],
  permissions: {
    view: ['kb.view', 'security.view'],
    contribute: ['kb.create', 'security.manage'],
    manage: ['settings.edit'],
  },
}, userId)
```

## 🌲 Hierarchical Structure

### Creating Nested Categories

```typescript
// Create parent
const parent = await KBCategoryService.createCategory(orgId, {
  name: 'IT Support',
  order: 1,
}, userId)

// Create child
const child = await KBCategoryService.createCategory(orgId, {
  name: 'Hardware',
  parentId: parent._id.toString(),
  order: 1,
}, userId)

// Create grandchild
const grandchild = await KBCategoryService.createCategory(orgId, {
  name: 'Printers',
  parentId: child._id.toString(),
  order: 1,
}, userId)
```

**Result:**
- Parent: `fullPath = "IT Support"`
- Child: `fullPath = "IT Support > Hardware"`
- Grandchild: `fullPath = "IT Support > Hardware > Printers"`

### Tree Structure Example

```typescript
const tree = await KBCategoryService.getCategoryTree(orgId)

// Returns:
[
  {
    _id: "...",
    name: "IT Support",
    level: 0,
    children: [
      {
        _id: "...",
        name: "Hardware",
        level: 1,
        children: [
          {
            _id: "...",
            name: "Printers",
            level: 2,
            children: []
          }
        ]
      }
    ]
  }
]
```

## 🔄 Migration from String Categories

### Step 1: Seed Default Categories

```typescript
// In your migration script or API route
import { KBCategoryService } from '@/lib/services/kb-categories'

await KBCategoryService.seedDefaultCategories(orgId, 'migration')
```

### Step 2: Create Custom Categories

```typescript
// Map old category strings to new category IDs
const oldCategories = ['Hardware', 'Software', 'Networking']
const categoryMap = new Map()

for (const oldName of oldCategories) {
  const category = await KBCategoryService.createCategory(orgId, {
    name: oldName,
    icon: 'Folder',
    color: '#6366f1',
  }, 'migration-script')

  categoryMap.set(oldName, category._id.toString())
}
```

### Step 3: Update Articles

```typescript
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

const db = await getDatabase()
const articles = db.collection(COLLECTIONS.KB_ARTICLES)

// Update articles with new category IDs
for (const [oldName, newId] of categoryMap.entries()) {
  await articles.updateMany(
    { orgId, category: oldName },
    { $set: { category: newId } }
  )
}
```

See **MIGRATION_KB_CATEGORIES.md** for complete guide.

## 🎨 Default Categories

7 categories created by `seedDefaultCategories()`:

| Name | Icon | Color | Public | Description |
|------|------|-------|--------|-------------|
| Getting Started | Rocket | Blue | ✅ Yes | Essential guides for new users |
| IT Support | Wrench | Purple | ❌ No | Technical support articles |
| Software & Applications | AppWindow | Green | ❌ No | Software guides |
| Hardware & Devices | HardDrive | Orange | ❌ No | Hardware setup & troubleshooting |
| Security & Compliance | Shield | Red | ❌ No | Security best practices |
| Policies & Procedures | FileText | Indigo | ❌ No | Company policies |
| FAQs | HelpCircle | Cyan | ✅ Yes | Frequently asked questions |

## 🔍 Common Use Cases

### 1. Category Selector Dropdown

```typescript
// In your React component
import useSWR from 'swr'

function CategorySelector({ value, onChange }) {
  const { data: categories } = useSWR('/api/knowledge-base/categories')

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">Select Category</option>
      {categories?.map((cat) => (
        <option key={cat._id} value={cat._id.toString()}>
          {cat.fullPath || cat.name}
        </option>
      ))}
    </select>
  )
}
```

### 2. Category Tree Navigation

```typescript
function CategoryTree() {
  const { data: tree } = useSWR('/api/knowledge-base/categories/tree')

  const renderNode = (node: KBCategoryTreeNode) => (
    <div key={node._id} style={{ paddingLeft: node.level * 20 }}>
      <div className="flex items-center gap-2">
        <Icon name={node.icon} />
        <span>{node.name}</span>
        <Badge>{node.articleCount}</Badge>
      </div>
      {node.children.map(renderNode)}
    </div>
  )

  return <div>{tree?.map(renderNode)}</div>
}
```

### 3. Breadcrumb Navigation

```typescript
function CategoryBreadcrumb({ categoryId }: { categoryId: string }) {
  const { data } = useSWR(`/api/knowledge-base/categories/${categoryId}`)
  const path = data?.path || []

  return (
    <nav>
      {path.map((cat, i) => (
        <span key={cat._id}>
          {i > 0 && ' > '}
          <Link href={`/kb/category/${cat._id}`}>{cat.name}</Link>
        </span>
      ))}
    </nav>
  )
}
```

### 4. Check User Access to Category

```typescript
// In your API route
const hasAccess = await KBCategoryService.checkCategoryPermission(
  categoryId,
  session.user.id,
  session.user.orgId,
  'view'
)

if (!hasAccess) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

## 🛡️ Security Features

### Protection Against

- ✅ **Circular References**: Prevented by `wouldCreateCircularReference()`
- ✅ **Orphaned Articles**: Cannot delete category with articles
- ✅ **Orphaned Children**: Cannot delete category with subcategories
- ✅ **RBAC Bypass**: All endpoints check permissions
- ✅ **Slug Conflicts**: Unique slugs enforced per organization
- ✅ **Infinite Loops**: Max depth limit (10 levels)

### Validation Rules

- Category name required
- Slug auto-generated (cannot be manually set)
- Parent must exist before assignment
- No self-referencing (parentId === _id)
- Soft delete only (preserves data)

## 📊 Database Schema

### KBCategory Document

```json
{
  "_id": ObjectId("..."),
  "orgId": "org_123",
  "name": "Hardware Support",
  "slug": "hardware-support",
  "description": "Hardware troubleshooting guides",
  "icon": "HardDrive",
  "color": "#f59e0b",
  "parentId": "parent_id",
  "fullPath": "IT Support > Hardware Support",
  "order": 3,
  "isActive": true,
  "isPublic": false,
  "allowedRoles": ["role_admin"],
  "allowedUsers": ["user_123"],
  "permissions": {
    "view": ["kb.view"],
    "contribute": ["kb.create"],
    "manage": ["settings.edit"]
  },
  "createdBy": "user_123",
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:00:00Z")
}
```

### Recommended Indexes

```javascript
// Performance optimization
db.kb_categories.createIndex({ orgId: 1, slug: 1 }, { unique: true })
db.kb_categories.createIndex({ orgId: 1, parentId: 1 })
db.kb_categories.createIndex({ orgId: 1, isActive: 1 })
db.kb_categories.createIndex({ orgId: 1, order: 1, name: 1 })
db.kb_categories.createIndex({ orgId: 1, isPublic: 1 })
```

## 🐛 Troubleshooting

### Issue: "Category not found"
**Solution:** Ensure you're passing ObjectId string, not ObjectId object.

```typescript
// ❌ Wrong
const category = await getCategoryById(new ObjectId(id), orgId)

// ✅ Correct
const category = await getCategoryById(id, orgId)
```

### Issue: "Circular reference detected"
**Solution:** Cannot set descendant as parent. Reparent to root first.

```typescript
// Move to root first
await updateCategory(parentId, orgId, { parentId: undefined })

// Then set new parent
await updateCategory(parentId, orgId, { parentId: childId })
```

### Issue: "Cannot delete category: articles exist"
**Solution:** Move or delete articles first.

```typescript
// Get article count
const count = await KBCategoryService.getArticleCount(categoryId, orgId)

// Move articles to different category
await articlesCollection.updateMany(
  { orgId, category: oldCategoryId },
  { $set: { category: newCategoryId } }
)

// Now delete is allowed
await KBCategoryService.deleteCategory(categoryId, orgId)
```

### Issue: Slow tree building with many categories
**Solution:** Use filtered queries or pagination.

```typescript
// Instead of all categories
const tree = await KBCategoryService.getCategoryTree(orgId)

// Get user's accessible categories only
const categories = await KBCategoryService.getCategoriesForUser(userId, orgId)
const tree = KBCategoryService.buildCategoryTree(categories)
```

## 📚 Further Reading

- **KB_CATEGORIES_BACKEND.md** - Complete technical documentation
- **MIGRATION_KB_CATEGORIES.md** - Migration from string categories
- **CLAUDE.md** - Project conventions and architecture
- **RBAC_SETUP_GUIDE.md** - RBAC system documentation

## ✅ Checklist for Implementation

Before deploying to production:

- [ ] Seed default categories for all organizations
- [ ] Run migration script to convert existing articles
- [ ] Update frontend to use category IDs instead of strings
- [ ] Test RBAC permissions with different roles
- [ ] Verify circular reference prevention
- [ ] Test category deletion validation
- [ ] Add database indexes for performance
- [ ] Test tree building with large hierarchies
- [ ] Verify fullPath updates cascade correctly
- [ ] Test with nested categories (3+ levels deep)

## 🎯 Next Steps

### Frontend Implementation (TODO)

1. **Category Management UI**
   - Settings page for category CRUD
   - Drag-and-drop tree view
   - Permission editor

2. **Category Selector Component**
   - Dropdown with tree structure
   - Search/filter functionality
   - Visual indicators (icon, color)

3. **Category Navigation**
   - Sidebar category tree
   - Breadcrumb navigation
   - Category page with articles

4. **Article Editor Updates**
   - Replace string category with category selector
   - Display category path in article view
   - Category-based filtering

### Backend Enhancements (Future)

1. **Performance**
   - Redis caching for categories
   - Aggregation pipeline for article counts
   - Background job for recursive updates

2. **Features**
   - Category merge tool
   - Bulk article migration
   - Category templates
   - Analytics (views, articles per category)

3. **RBAC**
   - Time-based access
   - Approval workflows
   - Audit logging

## 🤝 Support

For help with implementation:
- Review documentation files in project root
- Check CLAUDE.md for code conventions
- Test with different user roles and permissions
- Verify MongoDB indexes are created

---

**Status:** ✅ Backend Infrastructure Complete

**Version:** 1.0.0

**Last Updated:** October 2024
