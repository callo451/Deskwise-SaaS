# Database Migration Guide - Ticket System Features

**Version:** 1.0.0
**Date:** 2025-01-18
**Impact:** Low (additive only, no breaking changes)

---

## Overview

This migration adds database indexes to support the 7 new ticket system features:

1. **SLA Escalation & Alerts**
2. **Internal Notes & Private Comments**
3. **User Assignment**
4. **Asset Linking**
5. **Time Tracking**
6. **CSAT Rating System**
7. **Enhanced UI/UX**

**Migration Type:** Index creation only (non-breaking)
**Estimated Time:** 5-15 minutes (depends on data volume)
**Downtime Required:** None (background indexes)

---

## Prerequisites

### 1. Backup Database ⚠️

**CRITICAL:** Always backup your database before running migrations.

```bash
# MongoDB Atlas - Use built-in backup
# Or create a manual snapshot

# Self-hosted MongoDB
mongodump --uri="mongodb://your-connection-string" --out=/backup/deskwise-$(date +%Y%m%d)
```

### 2. Check MongoDB Version

**Required:** MongoDB 4.4 or higher (for background index building)

```bash
mongosh "mongodb://your-connection-string" --eval "db.version()"
```

### 3. Verify Disk Space

Ensure sufficient disk space for index creation (approximately 10-20% of current data size).

```bash
# Check current database size
mongosh "mongodb://your-connection-string" --eval "db.stats()"
```

---

## Migration Steps

### Option 1: Node.js Script (Recommended)

**Best for:** Automated deployments, CI/CD pipelines

```bash
# 1. Ensure MongoDB URI is set in environment
export MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/deskwise"

# Or update .env.local
# MONGODB_URI=mongodb+srv://...

# 2. Run the index creation script
node scripts/create-ticket-indexes.js
```

**Expected Output:**
```
Connecting to MongoDB...
✓ Connected successfully

📁 Collection: time_entries
  ✓ org_ticket_running_idx - Created
  ✓ org_user_running_idx - Created
  ✓ org_user_time_idx - Created
  ✓ org_billable_idx - Created
  ✓ ticket_running_idx - Created
  ✓ created_at_ttl_idx - Created

📁 Collection: csat_ratings
  ✓ org_submitted_idx - Created
  ✓ org_rating_idx - Created
  ✓ ticket_unique_idx - Created
  ✓ user_submitted_idx - Created

... (continues for all collections)

═══════════════════════════════════════
Total indexes created: 23
Total indexes skipped: 0
═══════════════════════════════════════

✅ Index creation complete!
```

---

### Option 2: MongoDB Shell

**Best for:** Manual execution, one-time setup

```bash
# Connect to your database
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/deskwise"

# Load and execute the script
load('scripts/create-ticket-indexes.mongodb.js')
```

**Or copy-paste the script content directly into mongosh**

---

### Option 3: MongoDB Compass

**Best for:** Visual verification, GUI users

1. Open MongoDB Compass
2. Connect to your database
3. Navigate to the `deskwise` database
4. Open the **mongosh** tab at the bottom
5. Copy the contents of `scripts/create-ticket-indexes.mongodb.js`
6. Paste and press Enter
7. Verify indexes in the GUI under each collection's "Indexes" tab

---

## Index Details

### Time Entries Collection (6 indexes)

| Index Name | Keys | Type | Purpose |
|------------|------|------|---------|
| `org_ticket_running_idx` | `{ orgId: 1, ticketId: 1, isRunning: 1 }` | Compound | Query active timers by ticket |
| `org_user_running_idx` | `{ orgId: 1, userId: 1, isRunning: 1 }` | Compound | Find user's active timers |
| `org_user_time_idx` | `{ orgId: 1, userId: 1, startTime: -1 }` | Compound | User time entry history |
| `org_billable_idx` | `{ orgId: 1, isBillable: 1, startTime: -1 }` | Compound | Filter billable entries |
| `ticket_running_idx` | `{ ticketId: 1, isRunning: 1 }` | Compound | Prevent duplicate timers |
| `created_at_ttl_idx` | `{ createdAt: 1 }` | TTL | Auto-delete after 1 year (optional) |

### CSAT Ratings Collection (4 indexes)

| Index Name | Keys | Type | Purpose |
|------------|------|------|---------|
| `org_submitted_idx` | `{ orgId: 1, submittedAt: -1 }` | Compound | Query ratings by date |
| `org_rating_idx` | `{ orgId: 1, rating: 1 }` | Compound | Filter by rating score |
| `ticket_unique_idx` | `{ ticketId: 1 }` | Unique | One rating per ticket |
| `user_submitted_idx` | `{ submittedBy: 1, submittedAt: -1 }` | Compound | User rating history |

### Tickets Collection (6 enhanced indexes)

| Index Name | Keys | Type | Purpose |
|------------|------|------|---------|
| `sla_breach_status_idx` | `{ orgId: 1, 'sla.breached': 1, status: 1 }` | Compound | Find SLA-breached tickets |
| `sla_deadline_idx` | `{ orgId: 1, 'sla.resolutionDeadline': 1, status: 1 }` | Compound | At-risk tickets query |
| `assigned_status_idx` | `{ orgId: 1, assignedTo: 1, status: 1 }` | Compound | User workload queries |
| `requester_status_idx` | `{ orgId: 1, requesterId: 1, status: 1 }` | Compound | User's tickets |
| `linked_assets_idx` | `{ linkedAssets: 1 }` | Sparse | Tickets by asset |
| `csat_exists_idx` | `{ orgId: 1, csatRating: 1 }` | Sparse | Tickets with ratings |

### Audit Logs Collection (4 indexes)

| Index Name | Keys | Type | Purpose |
|------------|------|------|---------|
| `entity_audit_idx` | `{ orgId: 1, entityType: 1, entityId: 1, timestamp: -1 }` | Compound | Entity audit trail |
| `action_audit_idx` | `{ orgId: 1, action: 1, timestamp: -1 }` | Compound | Filter by action type |
| `user_audit_idx` | `{ orgId: 1, userId: 1, timestamp: -1 }` | Compound | User activity history |
| `timestamp_ttl_idx` | `{ timestamp: 1 }` | TTL | Auto-delete after 2 years |

### Canned Responses Collection (3 indexes)

| Index Name | Keys | Type | Purpose |
|------------|------|------|---------|
| `category_active_idx` | `{ orgId: 1, category: 1, isActive: 1 }` | Compound | Filter by category |
| `tags_idx` | `{ orgId: 1, tags: 1 }` | Compound | Search by tags |
| `text_search_idx` | `{ orgId: 1, name: 'text', content: 'text' }` | Text | Full-text search |

**Total Indexes:** 23 (across 5 collections)

---

## Performance Impact

### During Migration
- **CPU Usage:** Moderate increase during index building
- **Disk I/O:** Moderate increase
- **Memory:** Minimal impact
- **Application:** No downtime (background indexes)

### After Migration
- **Query Performance:** 10-100x faster for indexed queries
- **Write Performance:** <5% overhead (acceptable)
- **Disk Usage:** +10-20% for index storage

---

## Verification

### 1. Check Index Creation

```javascript
// MongoDB Shell
use deskwise

// List all indexes for each collection
db.time_entries.getIndexes()
db.csat_ratings.getIndexes()
db.tickets.getIndexes()
db.audit_logs.getIndexes()
db.canned_responses.getIndexes()
```

**Expected:** Each collection should have the new indexes listed.

### 2. Verify Index Usage

```javascript
// Test a query with explain() to see if index is used
db.time_entries.find({
  orgId: "test-org-123",
  isRunning: true
}).explain("executionStats")

// Look for:
// - "executionStats.executionSuccess": true
// - "winningPlan.inputStage.indexName": "org_user_running_idx"
```

### 3. Check Index Size

```javascript
// Get collection stats
db.time_entries.stats()

// Look for:
// - "totalIndexSize": Size in bytes
// - "indexSizes": Breakdown by index
```

---

## Rollback Procedure

If you need to rollback (unlikely, but here's how):

```javascript
// MongoDB Shell
use deskwise

// Drop indexes by name
db.time_entries.dropIndex("org_ticket_running_idx")
db.time_entries.dropIndex("org_user_running_idx")
// ... (repeat for all created indexes)

// Or drop all non-_id indexes on a collection
db.time_entries.dropIndexes()
```

**Note:** Dropping indexes is safe and reversible. It only affects query performance, not data.

---

## Troubleshooting

### Issue: "Index build failed - disk space"

**Solution:**
1. Free up disk space
2. Run index creation one collection at a time
3. Consider using smaller TTL values

```javascript
// Create indexes one at a time
db.time_entries.createIndex({ orgId: 1, ticketId: 1, isRunning: 1 })
// Wait for completion, then next index...
```

### Issue: "Duplicate key error on unique index"

**Cause:** Duplicate data exists (e.g., multiple CSAT ratings for same ticket)

**Solution:**
1. Find duplicates:
```javascript
db.csat_ratings.aggregate([
  { $group: { _id: "$ticketId", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])
```

2. Clean up duplicates manually
3. Re-run index creation

### Issue: "Index build taking too long"

**Expected Times:**
- <10,000 documents: 1-2 minutes
- 10,000-100,000: 2-5 minutes
- 100,000-1,000,000: 5-15 minutes
- >1,000,000: 15+ minutes

**If it's stuck:**
1. Check MongoDB logs for errors
2. Verify server resources (CPU, RAM, Disk)
3. Consider running during off-peak hours

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] Database backup completed
- [ ] Migration script tested in staging
- [ ] Disk space verified (20% free)
- [ ] Team notified of maintenance window

### During Deployment
- [ ] Run migration script
- [ ] Monitor MongoDB metrics (CPU, disk, connections)
- [ ] Verify index creation progress

### Post-Deployment
- [ ] Verify all 23 indexes created
- [ ] Run test queries to confirm index usage
- [ ] Monitor application performance
- [ ] Check error logs for issues

### Monitoring (First 24 Hours)
- [ ] Query performance metrics
- [ ] Database disk usage
- [ ] Application error rates
- [ ] User feedback on performance

---

## FAQ

**Q: Will this cause downtime?**
A: No. All indexes are created with `background: true`, allowing normal operations to continue.

**Q: Can I run this on a production database?**
A: Yes, but preferably during off-peak hours. Test in staging first.

**Q: What if I already have some of these indexes?**
A: The script will skip existing indexes and only create missing ones.

**Q: Are TTL indexes required?**
A: No. They're optional for automatic data cleanup. Remove them if you want to keep data indefinitely.

**Q: How do I disable TTL indexes?**
A: Drop them: `db.time_entries.dropIndex("created_at_ttl_idx")`

**Q: Can I modify index definitions?**
A: Yes, but you'll need to drop the old index first, then create the new one.

---

## Support

If you encounter issues during migration:

1. Check MongoDB logs: `mongosh --eval "db.adminCommand({ getLog: 'global' })"`
2. Review error messages in the migration script output
3. Consult MongoDB documentation: https://docs.mongodb.com/manual/indexes/
4. Contact your database administrator

---

## Next Steps

After successful migration:

1. ✅ Deploy application code with new features
2. ✅ Run integration tests
3. ✅ Monitor query performance improvements
4. ✅ Gather user feedback

---

**Migration Created:** 2025-01-18
**Last Updated:** 2025-01-18
**Status:** Ready for Production
