/**
 * MongoDB Shell Script for Creating Ticket System Indexes
 *
 * This script can be run directly in MongoDB Shell (mongosh) or MongoDB Compass.
 *
 * Usage (MongoDB Shell):
 *   mongosh "mongodb://your-connection-string" --file scripts/create-ticket-indexes.mongodb.js
 *
 * Usage (MongoDB Compass):
 *   Open MongoDB Compass > Connect to database > Open mongosh tab
 *   Copy and paste this entire script
 */

// Switch to the deskwise database
use('deskwise');

print('Creating indexes for Ticket System features...\n');

// ============================================
// TIME ENTRIES COLLECTION
// ============================================
print('📁 Collection: time_entries');

db.time_entries.createIndex(
  { orgId: 1, ticketId: 1, isRunning: 1 },
  { name: 'org_ticket_running_idx', background: true }
);
print('  ✓ org_ticket_running_idx');

db.time_entries.createIndex(
  { orgId: 1, userId: 1, isRunning: 1 },
  { name: 'org_user_running_idx', background: true }
);
print('  ✓ org_user_running_idx');

db.time_entries.createIndex(
  { orgId: 1, userId: 1, startTime: -1 },
  { name: 'org_user_time_idx', background: true }
);
print('  ✓ org_user_time_idx');

db.time_entries.createIndex(
  { orgId: 1, isBillable: 1, startTime: -1 },
  { name: 'org_billable_idx', background: true }
);
print('  ✓ org_billable_idx');

db.time_entries.createIndex(
  { ticketId: 1, isRunning: 1 },
  { name: 'ticket_running_idx', background: true }
);
print('  ✓ ticket_running_idx');

// Optional: TTL index for automatic cleanup after 1 year
db.time_entries.createIndex(
  { createdAt: 1 },
  { name: 'created_at_ttl_idx', background: true, expireAfterSeconds: 31536000 }
);
print('  ✓ created_at_ttl_idx (1 year TTL)\n');

// ============================================
// CSAT RATINGS COLLECTION
// ============================================
print('📁 Collection: csat_ratings');

db.csat_ratings.createIndex(
  { orgId: 1, submittedAt: -1 },
  { name: 'org_submitted_idx', background: true }
);
print('  ✓ org_submitted_idx');

db.csat_ratings.createIndex(
  { orgId: 1, rating: 1 },
  { name: 'org_rating_idx', background: true }
);
print('  ✓ org_rating_idx');

db.csat_ratings.createIndex(
  { ticketId: 1 },
  { name: 'ticket_unique_idx', unique: true, background: true }
);
print('  ✓ ticket_unique_idx (unique)');

db.csat_ratings.createIndex(
  { submittedBy: 1, submittedAt: -1 },
  { name: 'user_submitted_idx', background: true }
);
print('  ✓ user_submitted_idx\n');

// ============================================
// TICKETS COLLECTION (ENHANCED)
// ============================================
print('📁 Collection: tickets (enhanced indexes)');

db.tickets.createIndex(
  { orgId: 1, 'sla.breached': 1, status: 1 },
  { name: 'sla_breach_status_idx', background: true }
);
print('  ✓ sla_breach_status_idx');

db.tickets.createIndex(
  { orgId: 1, 'sla.resolutionDeadline': 1, status: 1 },
  { name: 'sla_deadline_idx', background: true }
);
print('  ✓ sla_deadline_idx');

db.tickets.createIndex(
  { orgId: 1, assignedTo: 1, status: 1 },
  { name: 'assigned_status_idx', background: true }
);
print('  ✓ assigned_status_idx');

db.tickets.createIndex(
  { orgId: 1, requesterId: 1, status: 1 },
  { name: 'requester_status_idx', background: true }
);
print('  ✓ requester_status_idx');

db.tickets.createIndex(
  { linkedAssets: 1 },
  { name: 'linked_assets_idx', sparse: true, background: true }
);
print('  ✓ linked_assets_idx (sparse)');

db.tickets.createIndex(
  { orgId: 1, csatRating: 1 },
  { name: 'csat_exists_idx', sparse: true, background: true }
);
print('  ✓ csat_exists_idx (sparse)\n');

// ============================================
// AUDIT LOGS COLLECTION
// ============================================
print('📁 Collection: audit_logs');

db.audit_logs.createIndex(
  { orgId: 1, entityType: 1, entityId: 1, timestamp: -1 },
  { name: 'entity_audit_idx', background: true }
);
print('  ✓ entity_audit_idx');

db.audit_logs.createIndex(
  { orgId: 1, action: 1, timestamp: -1 },
  { name: 'action_audit_idx', background: true }
);
print('  ✓ action_audit_idx');

db.audit_logs.createIndex(
  { orgId: 1, userId: 1, timestamp: -1 },
  { name: 'user_audit_idx', background: true }
);
print('  ✓ user_audit_idx');

// Optional: TTL index for automatic cleanup after 2 years
db.audit_logs.createIndex(
  { timestamp: 1 },
  { name: 'timestamp_ttl_idx', background: true, expireAfterSeconds: 63072000 }
);
print('  ✓ timestamp_ttl_idx (2 year TTL)\n');

// ============================================
// CANNED RESPONSES COLLECTION
// ============================================
print('📁 Collection: canned_responses');

db.canned_responses.createIndex(
  { orgId: 1, category: 1, isActive: 1 },
  { name: 'category_active_idx', background: true }
);
print('  ✓ category_active_idx');

db.canned_responses.createIndex(
  { orgId: 1, tags: 1 },
  { name: 'tags_idx', background: true }
);
print('  ✓ tags_idx');

db.canned_responses.createIndex(
  { orgId: 1, name: 'text', content: 'text' },
  { name: 'text_search_idx', background: true }
);
print('  ✓ text_search_idx (full-text)\n');

// ============================================
// VERIFICATION
// ============================================
print('\n═══════════════════════════════════════');
print('📊 Verifying Indexes:\n');

print('time_entries:', db.time_entries.getIndexes().length, 'indexes');
print('csat_ratings:', db.csat_ratings.getIndexes().length, 'indexes');
print('tickets:', db.tickets.getIndexes().length, 'indexes');
print('audit_logs:', db.audit_logs.getIndexes().length, 'indexes');
print('canned_responses:', db.canned_responses.getIndexes().length, 'indexes');

print('\n✅ All indexes created successfully!');
print('═══════════════════════════════════════\n');

// Display collection stats
print('📈 Collection Statistics:\n');

const collections = ['time_entries', 'csat_ratings', 'tickets', 'audit_logs', 'canned_responses'];
collections.forEach(col => {
  const stats = db.getCollection(col).stats();
  print(`${col}:`);
  print(`  Documents: ${stats.count || 0}`);
  print(`  Size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB`);
  print('');
});
