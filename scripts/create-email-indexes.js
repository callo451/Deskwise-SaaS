/**
 * Database Index Creation Script for Email Notification System
 *
 * This script creates optimized indexes for the email notification system:
 * - Email Settings
 * - Notification Templates
 * - Notification Rules
 * - User Notification Preferences
 * - Email Delivery Logs
 * - Email Queue
 *
 * Run this script after deploying the email notification features.
 *
 * Usage:
 *   node scripts/create-email-indexes.js
 *
 * Or use MongoDB shell:
 *   mongosh <connection-string> --file scripts/create-email-indexes.js
 */

// MongoDB connection (update with your connection string)
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'deskwise';

const indexes = {
  // Email Settings Collection
  email_settings: [
    {
      keys: { orgId: 1 },
      options: {
        name: 'org_idx',
        unique: true,
        background: true,
        comment: 'One email settings document per organization'
      }
    },
    {
      keys: { isEnabled: 1, isConfigured: 1 },
      options: {
        name: 'enabled_configured_idx',
        background: true,
        comment: 'Query enabled and configured organizations'
      }
    }
  ],

  // Notification Templates Collection
  notification_templates: [
    {
      keys: { orgId: 1, event: 1 },
      options: {
        name: 'org_event_idx',
        background: true,
        comment: 'Query templates by organization and event type'
      }
    },
    {
      keys: { orgId: 1, isActive: 1, isSystem: 1 },
      options: {
        name: 'org_active_system_idx',
        background: true,
        comment: 'Filter active templates and system templates'
      }
    },
    {
      keys: { orgId: 1, name: 1 },
      options: {
        name: 'org_name_idx',
        background: true,
        comment: 'Search templates by name'
      }
    },
    {
      keys: { createdAt: 1 },
      options: {
        name: 'created_at_idx',
        background: true,
        comment: 'Sort templates by creation date'
      }
    }
  ],

  // Notification Rules Collection
  notification_rules: [
    {
      keys: { orgId: 1, event: 1, isEnabled: 1 },
      options: {
        name: 'org_event_enabled_idx',
        background: true,
        comment: 'Query active rules by organization and event'
      }
    },
    {
      keys: { orgId: 1, priority: 1 },
      options: {
        name: 'org_priority_idx',
        background: true,
        comment: 'Sort rules by priority for execution'
      }
    },
    {
      keys: { orgId: 1, isEnabled: 1 },
      options: {
        name: 'org_enabled_idx',
        background: true,
        comment: 'Filter enabled rules'
      }
    },
    {
      keys: { templateId: 1 },
      options: {
        name: 'template_idx',
        background: true,
        comment: 'Find rules using a specific template'
      }
    }
  ],

  // User Notification Preferences Collection
  user_notification_preferences: [
    {
      keys: { userId: 1, orgId: 1 },
      options: {
        name: 'user_org_idx',
        unique: true,
        background: true,
        comment: 'One preferences document per user per organization'
      }
    },
    {
      keys: { orgId: 1, emailNotificationsEnabled: 1 },
      options: {
        name: 'org_email_enabled_idx',
        background: true,
        comment: 'Query users with email notifications enabled'
      }
    },
    {
      keys: { doNotDisturb: 1, doNotDisturbUntil: 1 },
      options: {
        name: 'dnd_idx',
        sparse: true,
        background: true,
        comment: 'Query users in do-not-disturb mode'
      }
    }
  ],

  // Email Delivery Logs Collection
  email_delivery_logs: [
    {
      keys: { orgId: 1, status: 1, queuedAt: -1 },
      options: {
        name: 'org_status_queued_idx',
        background: true,
        comment: 'Query logs by status and date'
      }
    },
    {
      keys: { orgId: 1, event: 1, queuedAt: -1 },
      options: {
        name: 'org_event_queued_idx',
        background: true,
        comment: 'Query logs by event type'
      }
    },
    {
      keys: { orgId: 1, ruleId: 1, queuedAt: -1 },
      options: {
        name: 'org_rule_queued_idx',
        background: true,
        comment: 'Query logs by rule'
      }
    },
    {
      keys: { status: 1, retryCount: 1, maxRetries: 1 },
      options: {
        name: 'retry_idx',
        background: true,
        comment: 'Find failed emails eligible for retry'
      }
    },
    {
      keys: { sesMessageId: 1 },
      options: {
        name: 'ses_message_id_idx',
        sparse: true,
        background: true,
        comment: 'Track SES message IDs'
      }
    },
    {
      keys: { queuedAt: 1 },
      options: {
        name: 'queued_ttl_idx',
        background: true,
        expireAfterSeconds: 7776000, // 90 days TTL
        comment: 'TTL index for automatic cleanup of old logs'
      }
    }
  ],

  // Email Queue Collection (for future async processing)
  email_queue: [
    {
      keys: { orgId: 1, status: 1, scheduledFor: 1 },
      options: {
        name: 'org_status_scheduled_idx',
        background: true,
        comment: 'Query queued emails by status and schedule'
      }
    },
    {
      keys: { status: 1, priority: 1, scheduledFor: 1 },
      options: {
        name: 'processing_idx',
        background: true,
        comment: 'Process queued emails by priority and schedule'
      }
    },
    {
      keys: { createdAt: 1 },
      options: {
        name: 'created_ttl_idx',
        background: true,
        expireAfterSeconds: 604800, // 7 days TTL
        comment: 'TTL index for automatic cleanup of processed queue items'
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
