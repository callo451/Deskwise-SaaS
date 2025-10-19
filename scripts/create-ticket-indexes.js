/**
 * Database Index Creation Script for Ticket System Features
 *
 * This script creates optimized indexes for the new ticket system features:
 * - Time Tracking
 * - CSAT Ratings
 * - SLA Management
 * - Audit Logs
 * - User Assignments
 *
 * Run this script after deploying the new ticket system features.
 *
 * Usage:
 *   node scripts/create-ticket-indexes.js
 *
 * Or use MongoDB shell:
 *   mongosh <connection-string> --file scripts/create-ticket-indexes.js
 */

// MongoDB connection (update with your connection string)
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'deskwise';

const indexes = {
  // Time Entries Collection
  time_entries: [
    {
      keys: { orgId: 1, ticketId: 1, isRunning: 1 },
      options: {
        name: 'org_ticket_running_idx',
        background: true,
        comment: 'Query active timers by organization and ticket'
      }
    },
    {
      keys: { orgId: 1, userId: 1, isRunning: 1 },
      options: {
        name: 'org_user_running_idx',
        background: true,
        comment: 'Query user active timers'
      }
    },
    {
      keys: { orgId: 1, userId: 1, startTime: -1 },
      options: {
        name: 'org_user_time_idx',
        background: true,
        comment: 'Query user time entries sorted by date'
      }
    },
    {
      keys: { orgId: 1, isBillable: 1, startTime: -1 },
      options: {
        name: 'org_billable_idx',
        background: true,
        comment: 'Filter billable/non-billable time entries'
      }
    },
    {
      keys: { ticketId: 1, isRunning: 1 },
      options: {
        name: 'ticket_running_idx',
        background: true,
        comment: 'Prevent duplicate timers on same ticket'
      }
    },
    {
      keys: { createdAt: 1 },
      options: {
        name: 'created_at_idx',
        background: true,
        expireAfterSeconds: 31536000, // 1 year TTL (optional)
        comment: 'TTL index for automatic cleanup of old entries'
      }
    }
  ],

  // CSAT Ratings Collection
  csat_ratings: [
    {
      keys: { orgId: 1, submittedAt: -1 },
      options: {
        name: 'org_submitted_idx',
        background: true,
        comment: 'Query ratings by organization and date'
      }
    },
    {
      keys: { orgId: 1, rating: 1 },
      options: {
        name: 'org_rating_idx',
        background: true,
        comment: 'Filter by rating score'
      }
    },
    {
      keys: { ticketId: 1 },
      options: {
        name: 'ticket_idx',
        unique: true,
        background: true,
        comment: 'Prevent duplicate ratings per ticket'
      }
    },
    {
      keys: { submittedBy: 1, submittedAt: -1 },
      options: {
        name: 'user_submitted_idx',
        background: true,
        comment: 'Query user rating history'
      }
    }
  ],

  // Tickets Collection (Enhanced Indexes)
  tickets: [
    {
      keys: { orgId: 1, 'sla.breached': 1, status: 1 },
      options: {
        name: 'sla_breach_status_idx',
        background: true,
        comment: 'Query SLA-breached tickets by status'
      }
    },
    {
      keys: { orgId: 1, 'sla.resolutionDeadline': 1, status: 1 },
      options: {
        name: 'sla_deadline_idx',
        background: true,
        comment: 'Query tickets approaching SLA deadline'
      }
    },
    {
      keys: { orgId: 1, assignedTo: 1, status: 1 },
      options: {
        name: 'assigned_status_idx',
        background: true,
        comment: 'Query assigned tickets by status'
      }
    },
    {
      keys: { orgId: 1, requesterId: 1, status: 1 },
      options: {
        name: 'requester_status_idx',
        background: true,
        comment: 'Query requester tickets'
      }
    },
    {
      keys: { linkedAssets: 1 },
      options: {
        name: 'linked_assets_idx',
        sparse: true,
        background: true,
        comment: 'Query tickets by linked asset'
      }
    },
    {
      keys: { orgId: 1, csatRating: 1 },
      options: {
        name: 'csat_exists_idx',
        sparse: true,
        background: true,
        comment: 'Query tickets with CSAT ratings'
      }
    }
  ],

  // Audit Logs Collection
  audit_logs: [
    {
      keys: { orgId: 1, entityType: 1, entityId: 1, timestamp: -1 },
      options: {
        name: 'entity_audit_idx',
        background: true,
        comment: 'Query audit history for specific entities'
      }
    },
    {
      keys: { orgId: 1, action: 1, timestamp: -1 },
      options: {
        name: 'action_audit_idx',
        background: true,
        comment: 'Query audits by action type'
      }
    },
    {
      keys: { orgId: 1, userId: 1, timestamp: -1 },
      options: {
        name: 'user_audit_idx',
        background: true,
        comment: 'Query user activity history'
      }
    },
    {
      keys: { timestamp: 1 },
      options: {
        name: 'timestamp_ttl_idx',
        background: true,
        expireAfterSeconds: 63072000, // 2 years TTL
        comment: 'TTL index for automatic cleanup'
      }
    }
  ],

  // Canned Responses Collection
  canned_responses: [
    {
      keys: { orgId: 1, category: 1, isActive: 1 },
      options: {
        name: 'category_active_idx',
        background: true,
        comment: 'Query active responses by category'
      }
    },
    {
      keys: { orgId: 1, tags: 1 },
      options: {
        name: 'tags_idx',
        background: true,
        comment: 'Search responses by tags'
      }
    },
    {
      keys: { orgId: 1, name: 'text', content: 'text' },
      options: {
        name: 'text_search_idx',
        background: true,
        comment: 'Full-text search on name and content'
      }
    }
  ]
};

async function createIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected successfully\n');

    const db = client.db(DB_NAME);

    // Get list of existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(c => c.name);

    let totalIndexesCreated = 0;
    let totalIndexesSkipped = 0;
    let totalCollectionsSkipped = 0;

    for (const [collectionName, collectionIndexes] of Object.entries(indexes)) {
      console.log(`📁 Collection: ${collectionName}`);

      // Check if collection exists
      if (!existingCollectionNames.includes(collectionName)) {
        console.log(`  ⊘ Collection doesn't exist yet - will be created when feature is first used`);
        console.log('');
        totalCollectionsSkipped++;
        continue;
      }

      const collection = db.collection(collectionName);

      // Get existing indexes
      const existingIndexes = await collection.indexes();
      const existingIndexNames = existingIndexes.map(idx => idx.name);

      for (const indexDef of collectionIndexes) {
        const indexName = indexDef.options.name;

        if (existingIndexNames.includes(indexName)) {
          console.log(`  ⊘ ${indexName} - Already exists, skipping`);
          totalIndexesSkipped++;
        } else {
          try {
            await collection.createIndex(indexDef.keys, indexDef.options);
            console.log(`  ✓ ${indexName} - Created`);
            totalIndexesCreated++;
          } catch (error) {
            console.error(`  ✗ ${indexName} - Error:`, error.message);
          }
        }
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════');
    console.log(`Total indexes created: ${totalIndexesCreated}`);
    console.log(`Total indexes skipped: ${totalIndexesSkipped}`);
    console.log(`Collections skipped: ${totalCollectionsSkipped} (will be created when features are used)`);
    console.log('═══════════════════════════════════════\n');

    // Display index statistics
    console.log('📊 Index Statistics:\n');
    for (const collectionName of Object.keys(indexes)) {
      // Only show stats for collections that exist
      if (!existingCollectionNames.includes(collectionName)) {
        continue;
      }

      const collection = db.collection(collectionName);

      try {
        const stats = await db.command({ collStats: collectionName });
        const indexCount = await collection.indexes().then(idx => idx.length);

        console.log(`${collectionName}:`);
        console.log(`  Documents: ${stats.count || 0}`);
        console.log(`  Indexes: ${indexCount}`);
        console.log(`  Size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
      } catch (error) {
        // Skip if collection stats can't be retrieved
      }
    }

  } catch (error) {
    console.error('Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✓ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createIndexes()
    .then(() => {
      console.log('\n✅ Index creation complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Index creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes, indexes };
