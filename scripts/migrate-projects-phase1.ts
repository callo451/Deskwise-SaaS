/**
 * Project Management Uplift - Phase 1 Migration Script
 *
 * Creates new collections and indexes for the enhanced Project Management module.
 * This is a NON-BREAKING migration that adds new collections without modifying existing data.
 *
 * New Collections Created:
 * - portfolios
 * - project_resources
 * - project_risks
 * - project_issues
 * - project_decisions
 * - project_assumptions
 * - project_documents
 * - project_time_entries
 * - project_change_requests
 * - project_gate_reviews
 * - project_templates
 * - project_audit_logs
 *
 * Usage:
 *   npx ts-node scripts/migrate-projects-phase1.ts --dry-run  # Preview migration
 *   npx ts-node scripts/migrate-projects-phase1.ts            # Execute migration
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

interface MigrationStats {
  collectionsCreated: number
  indexesCreated: number
  errors: number
  errorMessages: string[]
  collections: string[]
}

interface MigrationOptions {
  dryRun: boolean
}

/**
 * Create new collections for Phase 1
 */
async function createNewCollections(db: any, dryRun: boolean): Promise<string[]> {
  const newCollections = [
    'portfolios',
    'project_resources',
    'project_risks',
    'project_issues',
    'project_decisions',
    'project_assumptions',
    'project_documents',
    'project_time_entries',
    'project_change_requests',
    'project_gate_reviews',
    'project_templates',
    'project_audit_logs',
  ]

  const created: string[] = []

  for (const collectionName of newCollections) {
    try {
      // Check if collection already exists
      const collections = await db.listCollections({ name: collectionName }).toArray()
      const exists = collections.length > 0

      if (exists) {
        console.log(`  ⚠️  Collection '${collectionName}' already exists - skipping`)
        continue
      }

      if (dryRun) {
        console.log(`  ✓ Would create collection: ${collectionName}`)
        created.push(collectionName)
      } else {
        await db.createCollection(collectionName)
        console.log(`  ✅ Created collection: ${collectionName}`)
        created.push(collectionName)
      }
    } catch (error: any) {
      console.error(`  ❌ Error creating collection '${collectionName}':`, error.message)
      throw error
    }
  }

  return created
}

/**
 * Create indexes for all project-related collections
 */
async function createIndexes(db: any, dryRun: boolean): Promise<number> {
  let indexCount = 0

  const indexDefinitions = [
    // ========================================
    // PORTFOLIOS
    // ========================================
    {
      collection: 'portfolios',
      indexes: [
        { keys: { orgId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, code: 1 }, options: { unique: true, sparse: true } },
        { keys: { orgId: 1, clientId: 1 }, options: {} },
        { keys: { orgId: 1, manager: 1 }, options: {} },
        { keys: { orgId: 1, type: 1 }, options: {} },
        { keys: { orgId: 1, isActive: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECTS (Enhanced - add new indexes to existing collection)
    // ========================================
    {
      collection: 'projects',
      indexes: [
        { keys: { orgId: 1, portfolioId: 1 }, options: {} },
        { keys: { orgId: 1, stage: 1 }, options: {} },
        { keys: { orgId: 1, health: 1 }, options: {} },
        { keys: { orgId: 1, methodology: 1 }, options: {} },
        { keys: { orgId: 1, type: 1 }, options: {} },
        { keys: { orgId: 1, contractId: 1 }, options: {} },
        { keys: { orgId: 1, clientVisible: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_TASKS (Enhanced - add new indexes)
    // ========================================
    {
      collection: 'project_tasks',
      indexes: [
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, wbsCode: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, isCriticalPath: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, parentTaskId: 1 }, options: {} },
        { keys: { orgId: 1, assignedTo: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, taskType: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_MILESTONES (Complete implementation)
    // ========================================
    {
      collection: 'project_milestones',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, plannedDate: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, isGate: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, type: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_RESOURCES
    // ========================================
    {
      collection: 'project_resources',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, userId: 1 }, options: {} },
        { keys: { orgId: 1, userId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, userId: 1, startDate: 1, endDate: 1 }, options: {} },
        { keys: { orgId: 1, role: 1 }, options: {} },
        { keys: { orgId: 1, status: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_RISKS (RAID)
    // ========================================
    {
      collection: 'project_risks',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, riskScore: -1 }, options: {} },
        { keys: { orgId: 1, owner: 1 }, options: {} },
        { keys: { orgId: 1, riskNumber: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_ISSUES (RAID)
    // ========================================
    {
      collection: 'project_issues',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, severity: 1 }, options: {} },
        { keys: { orgId: 1, assignedTo: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, issueNumber: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_DECISIONS (RAID)
    // ========================================
    {
      collection: 'project_decisions',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, decisionDate: -1 }, options: {} },
        { keys: { orgId: 1, decisionMaker: 1 }, options: {} },
        { keys: { orgId: 1, decisionNumber: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_ASSUMPTIONS (RAID)
    // ========================================
    {
      collection: 'project_assumptions',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, validated: 1 }, options: {} },
        { keys: { orgId: 1, assumptionNumber: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_DOCUMENTS
    // ========================================
    {
      collection: 'project_documents',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, type: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, isLatestVersion: 1 }, options: {} },
        { keys: { orgId: 1, uploadedBy: 1 }, options: {} },
        { keys: { s3Key: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_TIME_ENTRIES
    // ========================================
    {
      collection: 'project_time_entries',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, taskId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, userId: 1 }, options: {} },
        { keys: { orgId: 1, userId: 1, date: -1 }, options: {} },
        { keys: { orgId: 1, date: -1 }, options: {} },
        { keys: { orgId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, isBillable: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, invoiceId: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_CHANGE_REQUESTS
    // ========================================
    {
      collection: 'project_change_requests',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, changeType: 1 }, options: {} },
        { keys: { orgId: 1, changeNumber: 1 }, options: {} },
        { keys: { orgId: 1, requestedBy: 1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_GATE_REVIEWS
    // ========================================
    {
      collection: 'project_gate_reviews',
      indexes: [
        { keys: { orgId: 1, projectId: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, gateType: 1 }, options: {} },
        { keys: { orgId: 1, projectId: 1, status: 1 }, options: {} },
        { keys: { orgId: 1, milestoneId: 1 }, options: {} },
        { keys: { orgId: 1, reviewDate: -1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_TEMPLATES
    // ========================================
    {
      collection: 'project_templates',
      indexes: [
        { keys: { orgId: 1, isActive: 1 }, options: {} },
        { keys: { orgId: 1, category: 1 }, options: {} },
        { keys: { orgId: 1, isSystemTemplate: 1 }, options: {} },
        { keys: { orgId: 1, isPublic: 1 }, options: {} },
        { keys: { orgId: 1, usageCount: -1 }, options: {} },
      ],
    },

    // ========================================
    // PROJECT_AUDIT_LOGS
    // ========================================
    {
      collection: 'project_audit_logs',
      indexes: [
        { keys: { orgId: 1, projectId: 1, timestamp: -1 }, options: {} },
        { keys: { orgId: 1, userId: 1, timestamp: -1 }, options: {} },
        { keys: { orgId: 1, action: 1, timestamp: -1 }, options: {} },
        { keys: { orgId: 1, entityType: 1, entityId: 1 }, options: {} },
      ],
    },
  ]

  for (const { collection, indexes } of indexDefinitions) {
    // Check if collection exists
    const collections = await db.listCollections({ name: collection }).toArray()
    if (collections.length === 0) {
      console.log(`  ⚠️  Collection '${collection}' does not exist - skipping indexes`)
      continue
    }

    const coll = db.collection(collection)

    for (const { keys, options } of indexes) {
      try {
        // Check if index already exists
        const existingIndexes = await coll.indexes()
        const keyString = JSON.stringify(keys)
        const indexExists = existingIndexes.some((idx: any) => {
          const idxKeyString = JSON.stringify(idx.key)
          return idxKeyString === keyString
        })

        if (indexExists) {
          console.log(`  ⚠️  Index ${keyString} on '${collection}' already exists - skipping`)
          continue
        }

        if (dryRun) {
          console.log(`  ✓ Would create index on '${collection}': ${keyString}`)
          indexCount++
        } else {
          await coll.createIndex(keys, options)
          console.log(`  ✅ Created index on '${collection}': ${keyString}`)
          indexCount++
        }
      } catch (error: any) {
        // Ignore duplicate index errors
        if (error.code === 85 || error.message.includes('already exists')) {
          console.log(`  ⚠️  Index already exists on '${collection}' - skipping`)
        } else {
          console.error(`  ❌ Error creating index on '${collection}':`, error.message)
          throw error
        }
      }
    }
  }

  return indexCount
}

/**
 * Store migration metadata for tracking and rollback
 */
async function storeMigrationMetadata(db: any, stats: MigrationStats, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log('\n  ✓ Would store migration metadata')
    return
  }

  const metadata = {
    version: '1.0',
    phase: 1,
    description: 'Project Management Uplift - Phase 1: New Collections and Indexes',
    executedAt: new Date(),
    status: 'completed',
    stats: {
      collectionsCreated: stats.collectionsCreated,
      indexesCreated: stats.indexesCreated,
      errors: stats.errors,
    },
    collections: stats.collections,
  }

  await db.collection('migration_metadata').insertOne(metadata)
  console.log('\n  ✅ Stored migration metadata')
}

/**
 * Main migration function
 */
async function migrateProjectsPhase1(options: MigrationOptions) {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')

  const stats: MigrationStats = {
    collectionsCreated: 0,
    indexesCreated: 0,
    errors: 0,
    errorMessages: [],
    collections: [],
  }

  try {
    console.log('\n🚀 Project Management Uplift - Phase 1 Migration')
    console.log('===================================================\n')

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }

    // Step 1: Create new collections
    console.log('📦 Step 1: Creating new collections...\n')
    const created = await createNewCollections(db, options.dryRun)
    stats.collectionsCreated = created.length
    stats.collections = created

    // Step 2: Create indexes
    console.log('\n🔍 Step 2: Creating indexes...\n')
    const indexCount = await createIndexes(db, options.dryRun)
    stats.indexesCreated = indexCount

    // Step 3: Store migration metadata
    console.log('\n📝 Step 3: Storing migration metadata...')
    await storeMigrationMetadata(db, stats, options.dryRun)

    // Summary
    console.log('\n✅ Migration Complete!')
    console.log('======================\n')
    console.log('Summary:')
    console.log(`  ├─ Collections created: ${stats.collectionsCreated}`)
    console.log(`  ├─ Indexes created: ${stats.indexesCreated}`)
    console.log(`  └─ Errors: ${stats.errors}`)

    if (stats.collections.length > 0) {
      console.log('\nNew Collections:')
      stats.collections.forEach((c) => console.log(`  - ${c}`))
    }

    if (options.dryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to execute migration.\n')
    } else {
      console.log('\n📝 Next Steps:')
      console.log('  1. Verify collections in MongoDB')
      console.log('  2. Run backup script before Phase 2 (data transformation)')
      console.log('  3. Update TypeScript types in src/lib/types.ts')
      console.log('  4. Implement API routes for new entities\n')
    }

    if (stats.errors > 0) {
      console.log(`\n⚠️  ${stats.errors} errors occurred during migration:`)
      stats.errorMessages.slice(0, 10).forEach((msg) => console.log(`  - ${msg}`))
      if (stats.errorMessages.length > 10) {
        console.log(`  ... and ${stats.errorMessages.length - 10} more`)
      }
    }
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error)
    stats.errors++
    stats.errorMessages.push(error.message)
    throw error
  } finally {
    await client.close()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
}

// Run migration
migrateProjectsPhase1(options)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
