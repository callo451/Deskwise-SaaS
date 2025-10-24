/**
 * Project Data Backup Script
 *
 * Creates a timestamped backup of all project-related collections before migration.
 * This allows for rollback in case of issues during Phase 2 (data transformation).
 *
 * Backup includes:
 * - projects
 * - project_tasks
 * - project_milestones
 * - All new Phase 1 collections (if they contain data)
 *
 * Usage:
 *   npx ts-node scripts/backup-projects-data.ts
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

interface BackupStats {
  collectionsBackedUp: number
  totalDocuments: number
  backupTimestamp: string
  backupCollections: Array<{
    original: string
    backup: string
    documentCount: number
  }>
}

/**
 * Create backup of project-related collections
 */
async function backupProjectsData() {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')

  const stats: BackupStats = {
    collectionsBackedUp: 0,
    totalDocuments: 0,
    backupTimestamp: '',
    backupCollections: [],
  }

  try {
    console.log('\n🔒 Project Data Backup Script')
    console.log('==============================\n')

    // Create timestamp for backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]
    stats.backupTimestamp = timestamp

    console.log(`📅 Backup timestamp: ${timestamp}\n`)

    // Collections to backup
    const collectionsToBackup = [
      'projects',
      'project_tasks',
      'project_milestones',
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

    console.log('📦 Backing up collections...\n')

    for (const collectionName of collectionsToBackup) {
      try {
        // Check if collection exists
        const collections = await db.listCollections({ name: collectionName }).toArray()
        if (collections.length === 0) {
          console.log(`  ⚠️  Collection '${collectionName}' does not exist - skipping`)
          continue
        }

        const collection = db.collection(collectionName)
        const count = await collection.countDocuments({})

        if (count === 0) {
          console.log(`  ⚠️  Collection '${collectionName}' is empty - skipping`)
          continue
        }

        const backupName = `${collectionName}_backup_${timestamp}`

        // Check if backup already exists
        const backupExists = await db.listCollections({ name: backupName }).toArray()
        if (backupExists.length > 0) {
          console.log(`  ⚠️  Backup '${backupName}' already exists - skipping`)
          continue
        }

        // Get all documents
        const docs = await collection.find({}).toArray()

        // Create backup collection and insert documents
        const backupCollection = db.collection(backupName)
        if (docs.length > 0) {
          await backupCollection.insertMany(docs)
        }

        console.log(`  ✅ Backed up '${collectionName}' → '${backupName}' (${count} documents)`)

        stats.collectionsBackedUp++
        stats.totalDocuments += count
        stats.backupCollections.push({
          original: collectionName,
          backup: backupName,
          documentCount: count,
        })
      } catch (error: any) {
        console.error(`  ❌ Error backing up '${collectionName}':`, error.message)
        throw error
      }
    }

    // Store backup metadata
    console.log('\n📝 Storing backup metadata...')
    const metadata = {
      backupType: 'project_management_uplift_phase1',
      timestamp: new Date(timestamp),
      timestampString: timestamp,
      collectionsBackedUp: stats.collectionsBackedUp,
      totalDocuments: stats.totalDocuments,
      backupCollections: stats.backupCollections,
      createdAt: new Date(),
      status: 'completed',
    }

    await db.collection('backup_metadata').insertOne(metadata)
    console.log('  ✅ Backup metadata stored\n')

    // Summary
    console.log('✅ Backup Complete!')
    console.log('===================\n')
    console.log('Summary:')
    console.log(`  ├─ Timestamp: ${timestamp}`)
    console.log(`  ├─ Collections backed up: ${stats.collectionsBackedUp}`)
    console.log(`  └─ Total documents: ${stats.totalDocuments}`)

    if (stats.backupCollections.length > 0) {
      console.log('\nBackup Collections:')
      stats.backupCollections.forEach(({ original, backup, documentCount }) => {
        console.log(`  - ${backup} (${documentCount} docs from ${original})`)
      })
    }

    console.log('\n📝 Next Steps:')
    console.log('  1. Verify backup collections in MongoDB')
    console.log('  2. Note the timestamp for rollback: ' + timestamp)
    console.log('  3. Proceed with data transformation (Phase 2)')
    console.log('  4. Use rollback script if needed\n')

    return stats
  } catch (error: any) {
    console.error('\n❌ Backup failed:', error)
    throw error
  } finally {
    await client.close()
  }
}

// Run backup
backupProjectsData()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
