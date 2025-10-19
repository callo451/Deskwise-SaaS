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
    const category: any = await db.collection('kb_categories').findOne({
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

async function analyzeDatabase(db: Db): Promise<MigrationStats> {
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
