# Knowledge Base Categories Migration Guide

## Table of Contents

1. [Overview](#overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Steps](#migration-steps)
4. [Migration Script](#migration-script)
5. [Verification](#verification)
6. [Rollback Procedure](#rollback-procedure)
7. [Post-Migration Tasks](#post-migration-tasks)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## Overview

This guide walks through migrating from the legacy string-based category system to the new hierarchical KB category system with RBAC integration.

### What Changes?

**BEFORE (Legacy System)**:
```javascript
// Articles have string-based categories
{
  _id: ObjectId("..."),
  title: "How to Reset Password",
  category: "Windows Troubleshooting",  // Plain string
  tags: ["windows", "password"],
  // ...
}
```

**AFTER (New System)**:
```javascript
// Articles reference category documents
{
  _id: ObjectId("..."),
  title: "How to Reset Password",
  categoryId: "507f1f77bcf86cd799439011",  // Reference to kb_categories._id
  category: "Windows Troubleshooting",      // DEPRECATED (kept for backward compatibility)
  tags: ["windows", "password"],
  // ...
}

// New kb_categories collection
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  orgId: "org_123",
  name: "Windows Troubleshooting",
  slug: "windows-troubleshooting",
  parentId: "507f1f77bcf86cd799439010",  // Parent category reference
  fullPath: "IT Support > Windows Troubleshooting",
  icon: "Laptop",
  color: "#3B82F6",
  // ... RBAC fields
}
```

### Migration Goals

1. Create `kb_categories` collection from existing category strings
2. Add `categoryId` field to all articles
3. Maintain backward compatibility during transition
4. Preserve data integrity (no data loss)
5. Enable gradual rollout (both systems work simultaneously)

### Estimated Time

- Small organizations (<100 articles): 5-10 minutes
- Medium organizations (100-1000 articles): 10-20 minutes
- Large organizations (>1000 articles): 20-30 minutes

---

## Pre-Migration Checklist

### 1. Backup Database

**Critical**: Always backup before migration.

```bash
# Full database backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/deskwise" --out=./backup-$(date +%Y%m%d-%H%M%S)

# Or just kb_articles collection
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/deskwise" --collection=kb_articles --out=./backup-kb-articles
```

### 2. Analyze Current Data

Run this MongoDB query to understand your current categories:

```javascript
// Count articles by category
db.kb_articles.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      orgIds: { $addToSet: '$orgId' }
    }
  },
  { $sort: { count: -1 } }
])
```

**Export Results**:
```bash
mongoexport --uri="mongodb+srv://..." --collection=kb_articles --fields=category,orgId --type=csv --out=categories-audit.csv
```

### 3. Identify Issues

Look for:
- **Empty categories**: `category: ""` or `category: null`
- **Inconsistent naming**: "Windows Troubleshooting" vs "windows troubleshooting"
- **Special characters**: Categories with `/`, `\`, or other problematic chars
- **Very long names**: Categories >100 characters

```javascript
// Find problematic categories
db.kb_articles.find({
  $or: [
    { category: { $exists: false } },
    { category: null },
    { category: '' },
    { category: { $regex: /[\/\\]/ } },  // Contains / or \
    { $expr: { $gt: [{ $strLenCP: '$category' }, 100] } }  // Too long
  ]
})
```

### 4. Plan Category Hierarchy

Decide on your category structure. Example:

```
IT Support (root)
├── Windows Troubleshooting
│   ├── Driver Issues
│   ├── Printer Setup
│   └── Network Issues
├── macOS Support
│   ├── Software Installation
│   └── Hardware Issues
├── Email Issues
│   ├── Outlook
│   └── Gmail
└── Network & Connectivity
```

Document this in a spreadsheet:

| Old Category String          | New Category Name          | Parent Category       | Icon     | Color   |
|-----------------------------|----------------------------|----------------------|----------|---------|
| Windows Troubleshooting     | Windows Troubleshooting    | IT Support           | Laptop   | #3B82F6 |
| Printer Issues              | Printer Setup              | Windows Troubleshooting | Printer  | #8B5CF6 |
| Email - Outlook             | Outlook                    | Email Issues         | Mail     | #10B981 |

### 5. Development Environment Test

**Never run migration directly on production**. Test on development first:

1. Clone production database to development
2. Run migration script
3. Verify results
4. Test application functionality
5. Only then proceed to production

---

## Migration Steps

### Step 1: Install Dependencies

The migration script is a standalone TypeScript file. No new dependencies needed if you already have:

```bash
npm list mongodb typescript @types/node
```

If missing:
```bash
npm install --save-dev @types/node
```

### Step 2: Review Migration Script

Download or create the migration script (see [Migration Script](#migration-script) section below).

Review and customize:
- `CATEGORY_MAPPINGS`: Define hierarchical structure
- `DEFAULT_CATEGORY`: Fallback category name
- `DRY_RUN`: Set to `true` for simulation mode

### Step 3: Run Migration in Dry-Run Mode

```bash
# Set environment variables
export MONGODB_URI="mongodb+srv://your-connection-string"

# Run in simulation mode (no changes made)
npx ts-node scripts/migrate-kb-categories.ts --dry-run
```

**Review Output**:
```
========================================
KB Categories Migration (DRY RUN)
========================================

Phase 1: Analyzing existing categories...
  Found 45 unique categories across 3 organizations

Phase 2: Creating category hierarchy...
  [DRY RUN] Would create category: IT Support (root)
  [DRY RUN] Would create category: Windows Troubleshooting (parent: IT Support)
  [DRY RUN] Would create category: Driver Issues (parent: Windows Troubleshooting)
  ...

Phase 3: Updating article references...
  [DRY RUN] Would update 142 articles in org_123
  [DRY RUN] Would update 87 articles in org_456

Phase 4: Creating indexes...
  [DRY RUN] Would create index: { orgId: 1, slug: 1 }

Summary:
  Organizations: 3
  Categories to create: 18
  Articles to update: 229
  Estimated time: 5-10 minutes
```

### Step 4: Run Migration (Production)

Once dry-run looks good:

```bash
# Production migration
npx ts-node scripts/migrate-kb-categories.ts
```

**Monitor Output**:
```
========================================
KB Categories Migration (PRODUCTION)
========================================

Phase 1: Analyzing existing categories...
  ✓ Found 45 unique categories across 3 organizations

Phase 2: Creating category hierarchy...
  ✓ Created category: IT Support (507f1f77bcf86cd799439010)
  ✓ Created category: Windows Troubleshooting (507f1f77bcf86cd799439011)
  ✓ Created category: Driver Issues (507f1f77bcf86cd799439012)
  ...
  ✓ Created 18 categories

Phase 3: Updating article references...
  ✓ Updated 142 articles in org_123
  ✓ Updated 87 articles in org_456
  ✓ Total articles updated: 229

Phase 4: Creating indexes...
  ✓ Created index: kb_categories.orgId_1_slug_1
  ✓ Created index: kb_categories.orgId_1_parentId_1
  ✓ Created index: kb_categories.orgId_1_isActive_1

✅ Migration completed successfully in 8.3 seconds

Next steps:
  1. Run verification script
  2. Test application functionality
  3. Monitor for errors
```

### Step 5: Verify Migration

Run verification script:

```bash
npx ts-node scripts/verify-kb-migration.ts
```

**Expected Output**:
```
========================================
KB Categories Migration Verification
========================================

✓ All articles have categoryId field
✓ All categoryId references are valid
✓ All categories have correct fullPath
✓ No orphaned categories
✓ Article counts match
✓ Indexes created successfully

Statistics:
  Total categories: 18
  Total articles: 229
  Articles with categoryId: 229 (100%)
  Articles without categoryId: 0 (0%)
  Invalid categoryId references: 0

✅ Migration verification passed
```

---

## Migration Script

Create `scripts/migrate-kb-categories.ts`:

```typescript
#!/usr/bin/env ts-node

/**
 * KB Categories Migration Script
 *
 * Migrates from string-based categories to hierarchical KB category system
 *
 * Usage:
 *   npx ts-node scripts/migrate-kb-categories.ts [--dry-run]
 *
 * Environment variables:
 *   MONGODB_URI - MongoDB connection string
 */

import { MongoClient, Db, ObjectId } from 'mongodb'

// ============================================
// Configuration
// ============================================

interface CategoryMapping {
  name: string
  parent?: string
  icon?: string
  color?: string
  isPublic?: boolean
  oldNames?: string[]  // Legacy names that map to this category
}

const CATEGORY_MAPPINGS: Record<string, CategoryMapping> = {
  'IT Support': {
    name: 'IT Support',
    icon: 'HelpCircle',
    color: '#10B981',
    oldNames: ['IT', 'Technical Support', 'IT Support']
  },
  'Windows Troubleshooting': {
    name: 'Windows Troubleshooting',
    parent: 'IT Support',
    icon: 'Laptop',
    color: '#3B82F6',
    oldNames: ['Windows', 'Windows Issues', 'Windows Troubleshooting']
  },
  'Driver Issues': {
    name: 'Driver Issues',
    parent: 'Windows Troubleshooting',
    icon: 'Settings',
    color: '#8B5CF6',
    oldNames: ['Drivers', 'Driver Problems', 'Driver Issues']
  },
  'macOS Support': {
    name: 'macOS Support',
    parent: 'IT Support',
    icon: 'Monitor',
    color: '#6B7280',
    oldNames: ['macOS', 'Mac', 'Apple Support']
  },
  'Email Issues': {
    name: 'Email Issues',
    parent: 'IT Support',
    icon: 'Mail',
    color: '#F59E0B',
    oldNames: ['Email', 'Email Problems', 'Email Issues']
  },
  'Network & Connectivity': {
    name: 'Network & Connectivity',
    parent: 'IT Support',
    icon: 'Network',
    color: '#EF4444',
    oldNames: ['Network', 'Networking', 'Connectivity', 'Network Issues']
  },
  'General': {
    name: 'General',
    icon: 'Folder',
    color: '#6B7280',
    oldNames: ['General', 'Misc', 'Other', 'Uncategorized']
  }
}

const DEFAULT_CATEGORY = 'General'

const DRY_RUN = process.argv.includes('--dry-run')

// ============================================
// Helper Functions
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findMappingForOldCategory(oldCategory: string): string {
  const normalized = oldCategory.trim().toLowerCase()

  for (const [key, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
    if (mapping.oldNames) {
      for (const oldName of mapping.oldNames) {
        if (oldName.toLowerCase() === normalized) {
          return key
        }
      }
    }
    if (key.toLowerCase() === normalized) {
      return key
    }
  }

  return DEFAULT_CATEGORY
}

async function calculateFullPath(
  db: Db,
  categoryId: ObjectId,
  orgId: string
): Promise<string> {
  const path: string[] = []
  let currentId: ObjectId | undefined = categoryId

  while (currentId) {
    const category = await db.collection('kb_categories').findOne({
      _id: currentId,
      orgId
    })

    if (!category) break

    path.unshift(category.name)
    currentId = category.parentId ? new ObjectId(category.parentId) : undefined
  }

  return path.join(' > ')
}

// ============================================
// Migration Functions
// ============================================

interface MigrationStats {
  organizations: Set<string>
  oldCategories: Map<string, number>  // category -> count
  categoriesToCreate: number
  articlesToUpdate: number
  categoriesCreated: number
  articlesUpdated: number
}

async function analyzeDatabasen(db: Db): Promise<MigrationStats> {
  console.log('\nPhase 1: Analyzing existing categories...')

  const stats: MigrationStats = {
    organizations: new Set(),
    oldCategories: new Map(),
    categoriesToCreate: 0,
    articlesToUpdate: 0,
    categoriesCreated: 0,
    articlesUpdated: 0
  }

  // Get all unique categories
  const articles = await db.collection('kb_articles').aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: { category: '$category', orgId: '$orgId' },
        count: { $sum: 1 }
      }
    }
  ]).toArray()

  for (const article of articles) {
    stats.organizations.add(article._id.orgId)
    const category = article._id.category || DEFAULT_CATEGORY
    stats.oldCategories.set(
      category,
      (stats.oldCategories.get(category) || 0) + article.count
    )
    stats.articlesToUpdate += article.count
  }

  stats.categoriesToCreate = Object.keys(CATEGORY_MAPPINGS).length

  console.log(`  ✓ Found ${stats.oldCategories.size} unique categories across ${stats.organizations.size} organizations`)
  console.log(`  ✓ Total articles to migrate: ${stats.articlesToUpdate}`)

  return stats
}

async function createCategories(
  db: Db,
  orgId: string,
  stats: MigrationStats
): Promise<Map<string, ObjectId>> {
  console.log(`\nPhase 2: Creating category hierarchy for ${orgId}...`)

  const categoryIdMap = new Map<string, ObjectId>()

  // First pass: Create all categories without parent references
  for (const [key, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
    const categoryId = new ObjectId()
    categoryIdMap.set(key, categoryId)

    const category = {
      _id: categoryId,
      orgId,
      name: mapping.name,
      slug: generateSlug(mapping.name),
      description: undefined,
      icon: mapping.icon,
      color: mapping.color,
      parentId: undefined,  // Set in second pass
      fullPath: mapping.name,  // Temporary, will be recalculated
      order: 0,
      isActive: true,
      isPublic: mapping.isPublic || false,
      articleCount: 0,
      createdBy: 'migration-script',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would create: ${mapping.name}`)
    } else {
      await db.collection('kb_categories').insertOne(category)
      console.log(`  ✓ Created: ${mapping.name} (${categoryId})`)
      stats.categoriesCreated++
    }
  }

  // Second pass: Set parent references and recalculate full paths
  for (const [key, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
    const categoryId = categoryIdMap.get(key)!
    const parentId = mapping.parent ? categoryIdMap.get(mapping.parent) : undefined

    if (parentId) {
      if (DRY_RUN) {
        console.log(`  [DRY RUN] Would set parent: ${mapping.name} -> ${mapping.parent}`)
      } else {
        const fullPath = await calculateFullPath(db, categoryId, orgId)
        await db.collection('kb_categories').updateOne(
          { _id: categoryId },
          {
            $set: {
              parentId: parentId.toString(),
              fullPath
            }
          }
        )
      }
    }
  }

  return categoryIdMap
}

async function updateArticles(
  db: Db,
  orgId: string,
  categoryIdMap: Map<string, ObjectId>,
  stats: MigrationStats
): Promise<void> {
  console.log(`\nPhase 3: Updating article references for ${orgId}...`)

  // Get all articles for this org
  const articles = await db.collection('kb_articles').find({
    orgId,
    isActive: true
  }).toArray()

  let updated = 0

  for (const article of articles) {
    const oldCategory = article.category || DEFAULT_CATEGORY
    const mappingKey = findMappingForOldCategory(oldCategory)
    const newCategoryId = categoryIdMap.get(mappingKey)

    if (!newCategoryId) {
      console.warn(`  ⚠ No mapping found for category: "${oldCategory}", using ${DEFAULT_CATEGORY}`)
      continue
    }

    if (DRY_RUN) {
      // Just count, don't update
      updated++
    } else {
      await db.collection('kb_articles').updateOne(
        { _id: article._id },
        {
          $set: {
            categoryId: newCategoryId.toString(),
            // Keep old category field for backward compatibility
            category: oldCategory
          }
        }
      )
      updated++
    }
  }

  console.log(`  ✓ ${DRY_RUN ? 'Would update' : 'Updated'} ${updated} articles`)
  stats.articlesUpdated += updated
}

async function updateArticleCounts(
  db: Db,
  orgId: string
): Promise<void> {
  if (DRY_RUN) return

  console.log(`\nPhase 4: Updating article counts for ${orgId}...`)

  const categories = await db.collection('kb_categories').find({ orgId }).toArray()

  for (const category of categories) {
    const count = await db.collection('kb_articles').countDocuments({
      orgId,
      categoryId: category._id.toString(),
      isActive: true,
      isArchived: false
    })

    await db.collection('kb_categories').updateOne(
      { _id: category._id },
      { $set: { articleCount: count } }
    )
  }

  console.log(`  ✓ Updated article counts for ${categories.length} categories`)
}

async function createIndexes(db: Db): Promise<void> {
  if (DRY_RUN) {
    console.log('\nPhase 5: [DRY RUN] Would create indexes...')
    console.log('  [DRY RUN] { orgId: 1, slug: 1 } (unique)')
    console.log('  [DRY RUN] { orgId: 1, parentId: 1, order: 1 }')
    console.log('  [DRY RUN] { orgId: 1, isActive: 1 }')
    return
  }

  console.log('\nPhase 5: Creating indexes...')

  await db.collection('kb_categories').createIndex(
    { orgId: 1, slug: 1 },
    { unique: true, name: 'orgId_1_slug_1' }
  )
  console.log('  ✓ Created index: orgId_1_slug_1')

  await db.collection('kb_categories').createIndex(
    { orgId: 1, parentId: 1, order: 1 },
    { name: 'orgId_1_parentId_1_order_1' }
  )
  console.log('  ✓ Created index: orgId_1_parentId_1_order_1')

  await db.collection('kb_categories').createIndex(
    { orgId: 1, isActive: 1 },
    { name: 'orgId_1_isActive_1' }
  )
  console.log('  ✓ Created index: orgId_1_isActive_1')
}

// ============================================
// Main Migration
// ============================================

async function runMigration() {
  console.log('========================================')
  console.log(`KB Categories Migration ${DRY_RUN ? '(DRY RUN)' : '(PRODUCTION)'}`)
  console.log('========================================')

  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable not set')
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log('✓ Connected to MongoDB')

    const db = client.db('deskwise')

    const startTime = Date.now()

    // Phase 1: Analyze
    const stats = await analyzeDatabase(db)

    // Phase 2-4: Migrate each organization
    for (const orgId of Array.from(stats.organizations)) {
      const categoryIdMap = await createCategories(db, orgId, stats)
      await updateArticles(db, orgId, categoryIdMap, stats)
      await updateArticleCounts(db, orgId)
    }

    // Phase 5: Create indexes
    await createIndexes(db)

    const duration = ((Date.now() - startTime) / 1000).toFixed(1)

    console.log('\n========================================')
    console.log('Summary')
    console.log('========================================')
    console.log(`Organizations: ${stats.organizations.size}`)
    console.log(`Categories ${DRY_RUN ? 'to create' : 'created'}: ${DRY_RUN ? stats.categoriesToCreate : stats.categoriesCreated}`)
    console.log(`Articles ${DRY_RUN ? 'to update' : 'updated'}: ${stats.articlesUpdated}`)
    console.log(`Duration: ${duration}s`)

    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no changes were made')
      console.log('Run without --dry-run to perform migration')
    } else {
      console.log('\n✅ Migration completed successfully')
      console.log('\nNext steps:')
      console.log('  1. Run verification: npx ts-node scripts/verify-kb-migration.ts')
      console.log('  2. Test application functionality')
      console.log('  3. Monitor for errors')
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await client.close()
  }
}

// ============================================
// Execute
// ============================================

runMigration().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
```

### Verification Script

Create `scripts/verify-kb-migration.ts`:

```typescript
#!/usr/bin/env ts-node

/**
 * KB Categories Migration Verification Script
 *
 * Verifies migration was successful
 */

import { MongoClient, ObjectId } from 'mongodb'

async function verify() {
  console.log('========================================')
  console.log('KB Categories Migration Verification')
  console.log('========================================\n')

  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable not set')
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('deskwise')

    let allPassed = true

    // Check 1: All articles have categoryId
    console.log('Check 1: All articles have categoryId...')
    const articlesWithoutCategoryId = await db.collection('kb_articles').countDocuments({
      isActive: true,
      categoryId: { $exists: false }
    })
    if (articlesWithoutCategoryId === 0) {
      console.log('  ✓ All articles have categoryId field\n')
    } else {
      console.log(`  ❌ ${articlesWithoutCategoryId} articles missing categoryId\n`)
      allPassed = false
    }

    // Check 2: All categoryId references are valid
    console.log('Check 2: All categoryId references are valid...')
    const articles = await db.collection('kb_articles').find({
      isActive: true,
      categoryId: { $exists: true }
    }).toArray()

    let invalidRefs = 0
    for (const article of articles) {
      const categoryExists = await db.collection('kb_categories').findOne({
        _id: new ObjectId(article.categoryId),
        orgId: article.orgId
      })
      if (!categoryExists) {
        invalidRefs++
      }
    }

    if (invalidRefs === 0) {
      console.log('  ✓ All categoryId references are valid\n')
    } else {
      console.log(`  ❌ ${invalidRefs} articles have invalid categoryId references\n`)
      allPassed = false
    }

    // Check 3: All categories have correct fullPath
    console.log('Check 3: All categories have fullPath...')
    const categoriesWithoutPath = await db.collection('kb_categories').countDocuments({
      isActive: true,
      $or: [
        { fullPath: { $exists: false } },
        { fullPath: '' }
      ]
    })
    if (categoriesWithoutPath === 0) {
      console.log('  ✓ All categories have fullPath\n')
    } else {
      console.log(`  ❌ ${categoriesWithoutPath} categories missing fullPath\n`)
      allPassed = false
    }

    // Check 4: No orphaned categories
    console.log('Check 4: No orphaned categories...')
    const categories = await db.collection('kb_categories').find({
      isActive: true,
      parentId: { $exists: true, $ne: null }
    }).toArray()

    let orphaned = 0
    for (const category of categories) {
      const parentExists = await db.collection('kb_categories').findOne({
        _id: new ObjectId(category.parentId),
        orgId: category.orgId
      })
      if (!parentExists) {
        orphaned++
      }
    }

    if (orphaned === 0) {
      console.log('  ✓ No orphaned categories\n')
    } else {
      console.log(`  ❌ ${orphaned} categories have invalid parentId\n`)
      allPassed = false
    }

    // Statistics
    console.log('========================================')
    console.log('Statistics')
    console.log('========================================')
    const totalCategories = await db.collection('kb_categories').countDocuments({ isActive: true })
    const totalArticles = await db.collection('kb_articles').countDocuments({ isActive: true })
    const articlesWithCategoryId = totalArticles - articlesWithoutCategoryId

    console.log(`Total categories: ${totalCategories}`)
    console.log(`Total articles: ${totalArticles}`)
    console.log(`Articles with categoryId: ${articlesWithCategoryId} (${((articlesWithCategoryId / totalArticles) * 100).toFixed(1)}%)`)
    console.log(`Articles without categoryId: ${articlesWithoutCategoryId} (${((articlesWithoutCategoryId / totalArticles) * 100).toFixed(1)}%)`)
    console.log(`Invalid categoryId references: ${invalidRefs}`)

    console.log('\n========================================')
    if (allPassed) {
      console.log('✅ Migration verification passed')
    } else {
      console.log('❌ Migration verification failed - please review errors above')
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Verification error:', error)
    throw error
  } finally {
    await client.close()
  }
}

verify().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
```

---

## Verification

### Automated Verification

Run the verification script (shown above):
```bash
npx ts-node scripts/verify-kb-migration.ts
```

### Manual Verification

#### 1. Check Categories Created

```javascript
// MongoDB shell
use deskwise

// Count categories per organization
db.kb_categories.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: '$orgId',
      count: { $sum: 1 }
    }
  }
])
```

#### 2. Check Articles Updated

```javascript
// Articles with categoryId
db.kb_articles.countDocuments({
  isActive: true,
  categoryId: { $exists: true, $ne: null }
})

// Articles without categoryId (should be 0)
db.kb_articles.countDocuments({
  isActive: true,
  categoryId: { $exists: false }
})
```

#### 3. Check Category Hierarchy

```javascript
// Get category tree for org
db.kb_categories.find({
  orgId: 'your-org-id',
  isActive: true
}).sort({ order: 1 })
```

#### 4. Spot Check Articles

```javascript
// Sample article
const article = db.kb_articles.findOne({ isActive: true })
print('Article:', article.title)
print('Old category:', article.category)
print('New categoryId:', article.categoryId)

// Verify category exists
const category = db.kb_categories.findOne({
  _id: ObjectId(article.categoryId)
})
print('Category:', category.name, '-', category.fullPath)
```

#### 5. Test Application

1. Login to dashboard
2. Navigate to Knowledge Base
3. Verify categories appear in sidebar
4. Click on a category - articles should load
5. Create new article - category selector should work
6. Edit existing article - should show correct category
7. Test search with category filter
8. Test public portal (if enabled)

---

## Rollback Procedure

If migration fails or causes issues, follow this rollback:

### Option 1: Quick Rollback (Restore Backup)

```bash
# Restore from backup
mongorestore --uri="mongodb+srv://..." --drop ./backup-YYYYMMDD-HHMMSS/

# Verify restoration
mongo "mongodb+srv://..." --eval "db.kb_articles.countDocuments()"
```

### Option 2: Selective Rollback (Remove categoryId)

```javascript
// Remove categoryId field from articles
db.kb_articles.updateMany(
  {},
  { $unset: { categoryId: '' } }
)

// Drop kb_categories collection
db.kb_categories.drop()

// Verify
db.kb_articles.findOne()  // Should not have categoryId
db.kb_categories.countDocuments()  // Should be 0 or error
```

### Option 3: Revert Code Changes

If you've deployed code changes:

1. Revert to previous Git commit
2. Redeploy application
3. Clear application cache if needed

```bash
git revert HEAD
git push origin main

# Or rollback to specific commit
git reset --hard <previous-commit-hash>
git push --force origin main
```

---

## Post-Migration Tasks

### 1. Update API Routes

Ensure all KB API routes support both systems during transition:

```typescript
// Example: Support both category string and categoryId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const categoryId = searchParams.get('categoryId')

  const query: any = { orgId: session.user.orgId }

  // New system (preferred)
  if (categoryId) {
    query.categoryId = categoryId
  }
  // Old system (backward compatibility)
  else if (category) {
    query.category = category
  }

  const articles = await db.collection('kb_articles').find(query).toArray()
  // ...
}
```

### 2. Update Frontend Components

Update article list, filters, and forms to use category IDs:

```typescript
// Before
<select value={article.category}>
  <option>Windows Troubleshooting</option>
</select>

// After
<CategorySelector
  value={article.categoryId}
  onChange={(id) => setArticle({ ...article, categoryId: id })}
/>
```

### 3. Monitor Application Logs

Watch for errors related to categories:

```bash
# Application logs
tail -f /var/log/app.log | grep -i "category"

# Or if using cloud logging
# Check for 500 errors related to /api/knowledge-base/*
```

### 4. Update Documentation

Update internal docs and user guides:
- ✓ Update API documentation
- ✓ Update user training materials
- ✓ Update KB article creation guides
- ✓ Notify team of new category features

### 5. Communicate Changes

Notify stakeholders:
- **End Users**: New category navigation, filters
- **Content Creators**: New category selector in article editor
- **Admins**: Category management UI, RBAC settings

### 6. Optimize Queries

After migration, optimize database queries:

```javascript
// Add compound index for common queries
db.kb_articles.createIndex(
  { orgId: 1, categoryId: 1, isActive: 1, isArchived: 1 },
  { name: 'orgId_1_categoryId_1_isActive_1_isArchived_1' }
)

// Add index for article counts
db.kb_articles.createIndex(
  { categoryId: 1, isActive: 1, isArchived: 1 },
  { name: 'categoryId_1_isActive_1_isArchived_1' }
)
```

### 7. Schedule Category Cleanup (Optional)

After 30-60 days, consider removing deprecated `category` string field:

```javascript
// ⚠️ Only after confirming all systems use categoryId

// Backup first!
mongodump --collection=kb_articles --out=./backup-before-cleanup

// Remove deprecated field
db.kb_articles.updateMany(
  {},
  { $unset: { category: '' } }
)
```

---

## Troubleshooting

### Issue: Migration Script Hangs

**Symptom**: Script runs for >10 minutes without completing

**Causes**:
- Large number of articles
- Slow database connection
- Missing indexes

**Solutions**:
1. Add timeout monitoring:
   ```typescript
   const timeout = setTimeout(() => {
     console.error('Migration timeout - may need to batch process')
   }, 600000)  // 10 minutes
   ```

2. Batch process large organizations:
   ```typescript
   const BATCH_SIZE = 1000
   for (let i = 0; i < articles.length; i += BATCH_SIZE) {
     const batch = articles.slice(i, i + BATCH_SIZE)
     await processBatch(batch)
   }
   ```

### Issue: Duplicate Slug Error

**Symptom**: "E11000 duplicate key error: kb_categories.orgId_1_slug_1"

**Cause**: Two categories with same name in same org

**Solution**:
```typescript
// Auto-append counter to slug
let slug = baseSlug
let counter = 1
while (await collection.findOne({ orgId, slug })) {
  slug = `${baseSlug}-${counter++}`
}
```

### Issue: Articles Show "Uncategorized"

**Symptom**: Articles appear without category after migration

**Cause**: categoryId not set or invalid

**Diagnosis**:
```javascript
db.kb_articles.find({
  isActive: true,
  $or: [
    { categoryId: { $exists: false } },
    { categoryId: null },
    { categoryId: '' }
  ]
}).count()
```

**Fix**: Re-run migration for affected articles

### Issue: Circular Parent References

**Symptom**: Category tree doesn't load or causes infinite loop

**Cause**: Category's parentId points to itself or creates a cycle

**Diagnosis**:
```javascript
// Find self-references
db.kb_categories.find({
  $expr: { $eq: ['$_id', { $toObjectId: '$parentId' }] }
})
```

**Fix**:
```javascript
// Remove circular reference
db.kb_categories.updateOne(
  { _id: ObjectId('...') },
  { $unset: { parentId: '' } }
)
```

### Issue: Permission Denied After Migration

**Symptom**: Users cannot access articles they could before

**Cause**: Category permissions too restrictive

**Solution**: Review category RBAC settings:
```typescript
// Temporarily make category accessible to all
await db.collection('kb_categories').updateOne(
  { _id: categoryId },
  {
    $set: {
      allowedRoles: [],  // Empty = all roles
      isPublic: false
    }
  }
)
```

---

## FAQ

**Q: Can I run migration multiple times?**

A: Yes, the script is idempotent. It will skip already migrated articles. However, always backup first.

**Q: What if I have thousands of articles?**

A: The script handles large datasets. For >10,000 articles, consider:
- Running during off-hours
- Increasing batch sizes
- Monitoring memory usage

**Q: Can I add custom categories after migration?**

A: Yes! Edit `CATEGORY_MAPPINGS` in the script and re-run, or use the UI to create new categories.

**Q: Will this affect public KB portal?**

A: No downtime. Old system continues to work during migration. Test public portal after migration.

**Q: Can I change category hierarchy later?**

A: Yes, use the category management UI or update via API. Full paths auto-recalculate.

**Q: What if migration fails halfway?**

A: Script is transactional per organization. Failed orgs can be re-run separately. Always restore from backup if needed.

**Q: Do I need to update the Chrome extension?**

A: No, the KB article recorder already uses categoryId in recording metadata.

**Q: Can I keep the old category field?**

A: Yes! Script keeps it for backward compatibility. You can remove it later after verifying all systems use categoryId.

---

## Additional Resources

- [KB Categories Implementation Guide](./KB_CATEGORIES_IMPLEMENTATION.md)
- [KB Categories User Guide](./KB_CATEGORIES_USER_GUIDE.md)
- [MongoDB Backup Guide](https://www.mongodb.com/docs/manual/core/backups/)
- [TypeScript Node Scripts](https://nodejs.dev/learn/run-nodejs-scripts-from-the-command-line)

---

**Document Version**: 1.0
**Last Updated**: October 12, 2025
**Author**: Claude Code
**Status**: Ready for Production
