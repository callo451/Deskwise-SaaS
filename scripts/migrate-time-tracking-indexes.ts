import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

/**
 * Migration Script: Add Unified Time Tracking Indexes
 *
 * This script adds database indexes to support efficient querying
 * of time entries for both tickets and projects.
 *
 * Usage:
 *   npx tsx scripts/migrate-time-tracking-indexes.ts [--dry-run]
 */

interface IndexSpec {
  collection: string
  name: string
  keys: Record<string, 1 | -1>
  options?: {
    unique?: boolean
    sparse?: boolean
    partialFilterExpression?: any
  }
}

const INDEXES: IndexSpec[] = [
  // Query time entries by type
  {
    collection: 'time_entries',
    name: 'idx_orgId_type',
    keys: { orgId: 1, type: 1 },
  },
  // Query time entries by ticket
  {
    collection: 'time_entries',
    name: 'idx_orgId_ticketId',
    keys: { orgId: 1, ticketId: 1 },
    options: { sparse: true },
  },
  // Query time entries by project
  {
    collection: 'time_entries',
    name: 'idx_orgId_projectId',
    keys: { orgId: 1, projectId: 1 },
    options: { sparse: true },
  },
  // Query time entries by project task
  {
    collection: 'time_entries',
    name: 'idx_orgId_projectTaskId',
    keys: { orgId: 1, projectTaskId: 1 },
    options: { sparse: true },
  },
  // Query time entries by user
  {
    collection: 'time_entries',
    name: 'idx_orgId_userId_createdAt',
    keys: { orgId: 1, userId: 1, createdAt: -1 },
  },
  // Query time entries by date range
  {
    collection: 'time_entries',
    name: 'idx_orgId_createdAt',
    keys: { orgId: 1, createdAt: -1 },
  },
  // Query billable time
  {
    collection: 'time_entries',
    name: 'idx_orgId_isBillable',
    keys: { orgId: 1, isBillable: 1 },
  },
  // Active time trackers (one per user)
  {
    collection: 'active_time_trackers',
    name: 'idx_orgId_userId_unique',
    keys: { orgId: 1, userId: 1 },
    options: { unique: true },
  },
  // Query active trackers by ticket
  {
    collection: 'active_time_trackers',
    name: 'idx_orgId_ticketId',
    keys: { orgId: 1, ticketId: 1 },
    options: { sparse: true },
  },
  // Query active trackers by project
  {
    collection: 'active_time_trackers',
    name: 'idx_orgId_projectId',
    keys: { orgId: 1, projectId: 1 },
    options: { sparse: true },
  },
]

async function migrate(dryRun = false) {
  console.log('🚀 Unified Time Tracking Index Migration\n')
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'PRODUCTION'}\n`)

  let client: MongoClient | null = null

  try {
    console.log('📡 Connecting to MongoDB...')
    client = new MongoClient(MONGODB_URI)
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db('deskwise')

    // Get existing indexes
    const existingIndexes: Record<string, string[]> = {}
    for (const indexSpec of INDEXES) {
      const collectionName = indexSpec.collection
      try {
        const collection = db.collection(collectionName)
        const indexes = await collection.indexes()
        existingIndexes[collectionName] = indexes.map((idx) => idx.name)
      } catch (error) {
        // Collection might not exist yet
        existingIndexes[collectionName] = []
      }
    }

    // Create indexes
    console.log('📊 Creating indexes...\n')
    for (const indexSpec of INDEXES) {
      const { collection: collectionName, name, keys, options } = indexSpec

      // Check if index already exists
      if (existingIndexes[collectionName]?.includes(name)) {
        console.log(`⏭️  Index ${name} on ${collectionName} already exists, skipping`)
        continue
      }

      console.log(`📌 Creating index: ${name}`)
      console.log(`   Collection: ${collectionName}`)
      console.log(`   Keys: ${JSON.stringify(keys)}`)
      if (options) {
        console.log(`   Options: ${JSON.stringify(options)}`)
      }

      if (!dryRun) {
        const collection = db.collection(collectionName)
        await collection.createIndex(keys, { name, ...options })
        console.log('   ✅ Created\n')
      } else {
        console.log('   ⏭️  Skipped (dry run)\n')
      }
    }

    // Collection statistics
    console.log('📈 Collection statistics:\n')

    try {
      const timeEntriesCollection = db.collection('time_entries')
      const totalEntries = await timeEntriesCollection.countDocuments({})
      const ticketEntries = await timeEntriesCollection.countDocuments({ type: 'ticket' })
      const projectEntries = await timeEntriesCollection.countDocuments({ type: 'project' })

      console.log('time_entries:')
      console.log(`  Total entries: ${totalEntries}`)
      console.log(`  Ticket entries: ${ticketEntries}`)
      console.log(`  Project entries: ${projectEntries}`)
    } catch (error) {
      console.log('time_entries: Collection not found (will be created on first entry)')
    }

    console.log()

    try {
      const trackersCollection = db.collection('active_time_trackers')
      const activeTrackers = await trackersCollection.countDocuments({})
      console.log('active_time_trackers:')
      console.log(`  Active trackers: ${activeTrackers}`)
    } catch (error) {
      console.log('active_time_trackers: Collection not found (will be created on first timer)')
    }

    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    if (client) {
      await client.close()
      console.log('\n📡 MongoDB connection closed')
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Run migration
migrate(dryRun)
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
