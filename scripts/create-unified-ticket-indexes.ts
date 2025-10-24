/**
 * Create MongoDB Indexes for Unified Ticket Features
 *
 * This script creates all required indexes for:
 * - unified_ticket_comments
 * - unified_ticket_time_entries
 * - active_timers
 * - unified_ticket_attachments
 *
 * Run with: npx tsx scripts/create-unified-ticket-indexes.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI!)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db('deskwise')

    // ========================================
    // 1. unified_ticket_comments
    // ========================================
    console.log('\n📝 Creating indexes for unified_ticket_comments...')
    const commentsCollection = db.collection('unified_ticket_comments')

    await commentsCollection.createIndex(
      { ticketId: 1, createdAt: -1 },
      { name: 'idx_ticket_comments' }
    )
    console.log('  ✅ idx_ticket_comments')

    await commentsCollection.createIndex(
      { orgId: 1, ticketId: 1 },
      { name: 'idx_org_ticket_comments' }
    )
    console.log('  ✅ idx_org_ticket_comments')

    await commentsCollection.createIndex(
      { ticketId: 1, isInternal: 1, createdAt: -1 },
      { name: 'idx_ticket_comments_visibility' }
    )
    console.log('  ✅ idx_ticket_comments_visibility')

    await commentsCollection.createIndex(
      { isDeleted: 1, createdAt: 1 },
      { name: 'idx_deleted_comments_cleanup' }
    )
    console.log('  ✅ idx_deleted_comments_cleanup')

    await commentsCollection.createIndex(
      { orgId: 1, createdBy: 1, createdAt: -1 },
      { name: 'idx_user_comments' }
    )
    console.log('  ✅ idx_user_comments')

    // ========================================
    // 2. unified_ticket_time_entries
    // ========================================
    console.log('\n⏱️  Creating indexes for unified_ticket_time_entries...')
    const timeEntriesCollection = db.collection('unified_ticket_time_entries')

    await timeEntriesCollection.createIndex(
      { ticketId: 1, createdAt: -1 },
      { name: 'idx_ticket_time_entries' }
    )
    console.log('  ✅ idx_ticket_time_entries')

    await timeEntriesCollection.createIndex(
      { orgId: 1, ticketId: 1 },
      { name: 'idx_org_ticket_time' }
    )
    console.log('  ✅ idx_org_ticket_time')

    await timeEntriesCollection.createIndex(
      { orgId: 1, userId: 1, startTime: -1 },
      { name: 'idx_user_time_entries' }
    )
    console.log('  ✅ idx_user_time_entries')

    await timeEntriesCollection.createIndex(
      { orgId: 1, isBillable: 1, createdAt: -1 },
      { name: 'idx_billable_time' }
    )
    console.log('  ✅ idx_billable_time')

    await timeEntriesCollection.createIndex(
      { orgId: 1, startTime: 1, endTime: 1 },
      { name: 'idx_time_range' }
    )
    console.log('  ✅ idx_time_range')

    // ========================================
    // 3. active_timers
    // ========================================
    console.log('\n⏲️  Creating indexes for active_timers...')
    const activeTimersCollection = db.collection('active_timers')

    await activeTimersCollection.createIndex(
      { userId: 1, ticketId: 1 },
      { unique: true, name: 'idx_unique_user_ticket_timer' }
    )
    console.log('  ✅ idx_unique_user_ticket_timer (UNIQUE)')

    await activeTimersCollection.createIndex(
      { orgId: 1, userId: 1 },
      { name: 'idx_user_timers' }
    )
    console.log('  ✅ idx_user_timers')

    await activeTimersCollection.createIndex(
      { startTime: 1 },
      { expireAfterSeconds: 86400, name: 'idx_timer_ttl' }
    )
    console.log('  ✅ idx_timer_ttl (TTL: 24 hours)')

    // ========================================
    // 4. unified_ticket_attachments
    // ========================================
    console.log('\n📎 Creating indexes for unified_ticket_attachments...')
    const attachmentsCollection = db.collection('unified_ticket_attachments')

    await attachmentsCollection.createIndex(
      { orgId: 1, ticketId: 1 },
      { name: 'idx_org_ticket_attachments' }
    )
    console.log('  ✅ idx_org_ticket_attachments')

    await attachmentsCollection.createIndex(
      { orgId: 1, id: 1 },
      { unique: true, name: 'idx_unique_attachment_id' }
    )
    console.log('  ✅ idx_unique_attachment_id (UNIQUE)')

    await attachmentsCollection.createIndex(
      { s3Key: 1 },
      { name: 'idx_s3_key' }
    )
    console.log('  ✅ idx_s3_key')

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL INDEXES CREATED SUCCESSFULLY')
    console.log('='.repeat(60))
    console.log('\n📊 Summary:')
    console.log('  • unified_ticket_comments: 5 indexes')
    console.log('  • unified_ticket_time_entries: 5 indexes')
    console.log('  • active_timers: 3 indexes (1 unique, 1 TTL)')
    console.log('  • unified_ticket_attachments: 3 indexes (1 unique)')
    console.log('  • Total: 16 indexes created')

    // List all indexes for verification
    console.log('\n🔍 Verifying indexes...')

    const commentsIndexes = await commentsCollection.indexes()
    console.log(`\n  unified_ticket_comments: ${commentsIndexes.length} indexes`)
    commentsIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`)
    })

    const timeIndexes = await timeEntriesCollection.indexes()
    console.log(`\n  unified_ticket_time_entries: ${timeIndexes.length} indexes`)
    timeIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`)
    })

    const timerIndexes = await activeTimersCollection.indexes()
    console.log(`\n  active_timers: ${timerIndexes.length} indexes`)
    timerIndexes.forEach(idx => {
      console.log(`    - ${idx.name}${idx.unique ? ' (UNIQUE)' : ''}${idx.expireAfterSeconds ? ' (TTL)' : ''}`)
    })

    const attachIndexes = await attachmentsCollection.indexes()
    console.log(`\n  unified_ticket_attachments: ${attachIndexes.length} indexes`)
    attachIndexes.forEach(idx => {
      console.log(`    - ${idx.name}${idx.unique ? ' (UNIQUE)' : ''}`)
    })

    console.log('\n✅ Database is ready for production!')

  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n📤 Disconnected from MongoDB')
  }
}

// Run the script
console.log('🚀 Starting index creation...\n')
createIndexes()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
