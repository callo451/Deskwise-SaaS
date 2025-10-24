/**
 * Project Management Migration Rollback Script
 *
 * Rolls back the Project Management Uplift Phase 1 migration by:
 * 1. Dropping new collections created in Phase 1
 * 2. Restoring original collections from backup (if Phase 2 was run)
 * 3. Cleaning up migration metadata
 *
 * Usage:
 *   npx ts-node scripts/rollback-projects-migration.ts --timestamp=<backup_timestamp>
 *   npx ts-node scripts/rollback-projects-migration.ts --latest  # Use most recent backup
 *   npx ts-node scripts/rollback-projects-migration.ts --dry-run --latest  # Preview rollback
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

interface RollbackStats {
  collectionsDropped: number
  collectionsRestored: number
  errors: number
  errorMessages: string[]
}

interface RollbackOptions {
  timestamp?: string
  useLatest: boolean
  dryRun: boolean
}

/**
 * Find backup metadata
 */
async function findBackupMetadata(db: any, timestamp?: string): Promise<any> {
  if (timestamp) {
    // Find specific backup
    const metadata = await db
      .collection('backup_metadata')
      .findOne({ timestampString: timestamp })

    if (!metadata) {
      throw new Error(`Backup with timestamp '${timestamp}' not found`)
    }

    return metadata
  } else {
    // Find most recent backup
    const metadata = await db
      .collection('backup_metadata')
      .find({ backupType: 'project_management_uplift_phase1' })
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray()

    if (metadata.length === 0) {
      throw new Error('No backups found')
    }

    return metadata[0]
  }
}

/**
 * Drop new collections created in Phase 1
 */
async function dropNewCollections(db: any, dryRun: boolean): Promise<number> {
  const collectionsToRemove = [
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

  let dropped = 0

  console.log('🗑️  Dropping new collections...\n')

  for (const collectionName of collectionsToRemove) {
    try {
      const collections = await db.listCollections({ name: collectionName }).toArray()
      if (collections.length === 0) {
        console.log(`  ⚠️  Collection '${collectionName}' does not exist - skipping`)
        continue
      }

      if (dryRun) {
        console.log(`  ✓ Would drop collection: ${collectionName}`)
        dropped++
      } else {
        await db.collection(collectionName).drop()
        console.log(`  ✅ Dropped collection: ${collectionName}`)
        dropped++
      }
    } catch (error: any) {
      // Ignore collection not found errors
      if (error.message.includes('ns not found')) {
        console.log(`  ⚠️  Collection '${collectionName}' not found - skipping`)
      } else {
        console.error(`  ❌ Error dropping collection '${collectionName}':`, error.message)
        throw error
      }
    }
  }

  return dropped
}

/**
 * Restore collections from backup
 */
async function restoreCollections(
  db: any,
  backupMetadata: any,
  dryRun: boolean
): Promise<number> {
  let restored = 0

  if (!backupMetadata.backupCollections || backupMetadata.backupCollections.length === 0) {
    console.log('\n⚠️  No backup collections found in metadata - skipping restore')
    return 0
  }

  console.log('\n📦 Restoring collections from backup...\n')

  for (const {
    original,
    backup,
    documentCount,
  } of backupMetadata.backupCollections) {
    try {
      // Check if backup collection exists
      const backupCollections = await db.listCollections({ name: backup }).toArray()
      if (backupCollections.length === 0) {
        console.log(`  ⚠️  Backup collection '${backup}' not found - skipping`)
        continue
      }

      if (dryRun) {
        console.log(`  ✓ Would restore '${original}' from '${backup}' (${documentCount} docs)`)
        restored++
      } else {
        // Drop current collection if exists
        const currentCollections = await db.listCollections({ name: original }).toArray()
        if (currentCollections.length > 0) {
          await db.collection(original).drop()
          console.log(`  🗑️  Dropped current '${original}'`)
        }

        // Restore from backup
        const backupDocs = await db.collection(backup).find({}).toArray()
        if (backupDocs.length > 0) {
          await db.collection(original).insertMany(backupDocs)
        } else {
          // Create empty collection
          await db.createCollection(original)
        }

        console.log(`  ✅ Restored '${original}' from '${backup}' (${backupDocs.length} docs)`)
        restored++
      }
    } catch (error: any) {
      console.error(`  ❌ Error restoring collection '${original}':`, error.message)
      throw error
    }
  }

  return restored
}

/**
 * Clean up backup collections (optional)
 */
async function cleanupBackupCollections(
  db: any,
  backupMetadata: any,
  dryRun: boolean
): Promise<void> {
  if (!backupMetadata.backupCollections) {
    return
  }

  console.log('\n🧹 Cleaning up backup collections...\n')

  for (const { backup } of backupMetadata.backupCollections) {
    try {
      const collections = await db.listCollections({ name: backup }).toArray()
      if (collections.length === 0) {
        continue
      }

      if (dryRun) {
        console.log(`  ✓ Would drop backup collection: ${backup}`)
      } else {
        await db.collection(backup).drop()
        console.log(`  ✅ Dropped backup collection: ${backup}`)
      }
    } catch (error: any) {
      console.error(`  ⚠️  Could not drop backup collection '${backup}':`, error.message)
      // Don't throw - this is cleanup, not critical
    }
  }
}

/**
 * Update migration metadata to mark as rolled back
 */
async function updateMigrationMetadata(
  db: any,
  backupTimestamp: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log('\n  ✓ Would update migration metadata to mark as rolled back')
    return
  }

  await db.collection('migration_metadata').updateMany(
    { version: '1.0', phase: 1 },
    {
      $set: {
        status: 'rolled_back',
        rolledBackAt: new Date(),
        rolledBackFromBackup: backupTimestamp,
      },
    }
  )

  console.log('\n  ✅ Updated migration metadata')
}

/**
 * Main rollback function
 */
async function rollbackProjectsMigration(options: RollbackOptions) {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')

  const stats: RollbackStats = {
    collectionsDropped: 0,
    collectionsRestored: 0,
    errors: 0,
    errorMessages: [],
  }

  try {
    console.log('\n🔄 Project Management Migration Rollback')
    console.log('=========================================\n')

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }

    // Step 1: Find backup metadata
    console.log('📋 Step 1: Finding backup metadata...\n')
    const backupMetadata = await findBackupMetadata(db, options.timestamp)
    console.log(`  ✅ Found backup: ${backupMetadata.timestampString}`)
    console.log(`  📅 Created: ${backupMetadata.createdAt}`)
    console.log(`  📦 Collections: ${backupMetadata.collectionsBackedUp}`)
    console.log(`  📄 Documents: ${backupMetadata.totalDocuments}\n`)

    // Confirm rollback
    if (!options.dryRun) {
      console.log('⚠️  WARNING: This will permanently delete data created after backup!')
      console.log('⚠️  Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
      await new Promise((resolve) => setTimeout(resolve, 5000))
      console.log('Proceeding with rollback...\n')
    }

    // Step 2: Drop new collections
    console.log('📝 Step 2: Dropping new collections...')
    const dropped = await dropNewCollections(db, options.dryRun)
    stats.collectionsDropped = dropped

    // Step 3: Restore from backup
    console.log('\n📝 Step 3: Restoring collections from backup...')
    const restored = await restoreCollections(db, backupMetadata, options.dryRun)
    stats.collectionsRestored = restored

    // Step 4: Update migration metadata
    console.log('\n📝 Step 4: Updating migration metadata...')
    await updateMigrationMetadata(db, backupMetadata.timestampString, options.dryRun)

    // Step 5: Optional cleanup of backup collections
    const shouldCleanup = !options.dryRun && process.env.CLEANUP_BACKUPS === 'true'
    if (shouldCleanup) {
      await cleanupBackupCollections(db, backupMetadata, options.dryRun)
    }

    // Summary
    console.log('\n✅ Rollback Complete!')
    console.log('======================\n')
    console.log('Summary:')
    console.log(`  ├─ Backup used: ${backupMetadata.timestampString}`)
    console.log(`  ├─ Collections dropped: ${stats.collectionsDropped}`)
    console.log(`  ├─ Collections restored: ${stats.collectionsRestored}`)
    console.log(`  └─ Errors: ${stats.errors}`)

    if (options.dryRun) {
      console.log('\n💡 This was a dry run. Run without --dry-run to execute rollback.\n')
    } else {
      console.log('\n📝 Next Steps:')
      console.log('  1. Verify data in MongoDB')
      console.log('  2. Restart application to clear caches')
      console.log('  3. Test application functionality')
      console.log('  4. Backup collections can be manually removed if rollback successful\n')
    }

    if (stats.errors > 0) {
      console.log(`\n⚠️  ${stats.errors} errors occurred during rollback:`)
      stats.errorMessages.slice(0, 10).forEach((msg) => console.log(`  - ${msg}`))
      if (stats.errorMessages.length > 10) {
        console.log(`  ... and ${stats.errorMessages.length - 10} more`)
      }
    }
  } catch (error: any) {
    console.error('\n❌ Rollback failed:', error)
    stats.errors++
    stats.errorMessages.push(error.message)
    throw error
  } finally {
    await client.close()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const timestampArg = args.find((arg) => arg.startsWith('--timestamp='))
const timestamp = timestampArg?.split('=')[1]

const options: RollbackOptions = {
  timestamp,
  useLatest: args.includes('--latest'),
  dryRun: args.includes('--dry-run'),
}

// Validate options
if (!options.timestamp && !options.useLatest) {
  console.error('❌ Error: Must specify either --timestamp=<timestamp> or --latest')
  console.error('\nUsage:')
  console.error('  npx ts-node scripts/rollback-projects-migration.ts --timestamp=<timestamp>')
  console.error('  npx ts-node scripts/rollback-projects-migration.ts --latest')
  console.error('  npx ts-node scripts/rollback-projects-migration.ts --latest --dry-run')
  process.exit(1)
}

// Run rollback
rollbackProjectsMigration(options)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
