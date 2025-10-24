import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

/**
 * Migration Script: Add Project-Ticket Integration Indexes
 *
 * This script adds database indexes to support efficient querying
 * of tickets linked to projects and tasks.
 *
 * Usage:
 *   npx tsx scripts/migrate-project-ticket-indexes.ts [--dry-run]
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
  // Query tickets by project
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_projectId',
    keys: { orgId: 1, projectId: 1 },
    options: { sparse: true }, // Only index tickets with projectId
  },
  // Query tickets by project and task
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_projectId_projectTaskId',
    keys: { orgId: 1, projectId: 1, projectTaskId: 1 },
    options: { sparse: true },
  },
  // Query tickets by project and status (for stats)
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_projectId_status',
    keys: { orgId: 1, projectId: 1, status: 1 },
    options: { sparse: true },
  },
  // Query tickets by project and priority (for stats)
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_projectId_priority',
    keys: { orgId: 1, projectId: 1, priority: 1 },
    options: { sparse: true },
  },
  // Query tickets by task (for task-level operations)
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_projectTaskId',
    keys: { orgId: 1, projectTaskId: 1 },
    options: { sparse: true },
  },
  // Query unlinked tickets (for auto-linking)
  {
    collection: 'unified_tickets',
    name: 'idx_orgId_noProject_title',
    keys: { orgId: 1, title: 1 },
    options: {
      sparse: true,
      partialFilterExpression: { projectId: { $exists: false } },
    },
  },
]

async function migrate(dryRun = false) {
  console.log('🚀 Project-Ticket Integration Index Migration\n')
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
      const collection = db.collection(indexSpec.collection)
      const indexes = await collection.indexes()
      existingIndexes[indexSpec.collection] = indexes.map((idx) => idx.name)
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

    // Verify unified_tickets collection stats
    console.log('📈 Collection statistics:\n')
    const ticketsCollection = db.collection('unified_tickets')
    const totalTickets = await ticketsCollection.countDocuments({})
    const linkedTickets = await ticketsCollection.countDocuments({
      projectId: { $exists: true },
    })
    const taskLinkedTickets = await ticketsCollection.countDocuments({
      projectTaskId: { $exists: true },
    })

    console.log(`Total tickets: ${totalTickets}`)
    console.log(`Tickets linked to projects: ${linkedTickets}`)
    console.log(`Tickets linked to tasks: ${taskLinkedTickets}`)
    console.log(
      `Unlinked tickets: ${totalTickets - linkedTickets} (${Math.round(((totalTickets - linkedTickets) / totalTickets) * 100)}%)`
    )

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
