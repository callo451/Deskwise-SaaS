# Tenant Deletion Implementation

## Overview

A comprehensive tenant deletion system has been implemented that allows application administrators to permanently delete an organization tenant, including all associated data from MongoDB and WorkOS.

## Features

✅ **Comprehensive Data Deletion**
- Deletes data from 50+ MongoDB collections
- Removes WorkOS organization
- Deletes all user accounts
- Complete audit trail

✅ **Multi-Step Safety Verification**
- Preview of what will be deleted
- Required confirmation text: "DELETE MY ORGANIZATION"
- Backup creation before deletion
- Multi-step confirmation flow

✅ **Automatic Backup System**
- Creates complete backup before deletion
- 30-day emergency recovery window
- Backup ID provided for restoration

✅ **Professional UI**
- Settings → Account Settings → Organization Account
- Danger zone with clear warnings
- Beautiful multi-step dialog with progress indicators
- Responsive design

## Implementation Details

### Service Layer

**File**: `src/lib/services/tenant-deletion.ts`

**Key Functions**:
- `deleteTenant()` - Main deletion orchestrator
- `getDeletionPreview()` - Shows what will be deleted
- `createBackup()` - Creates pre-deletion backup
- `restoreFromBackup()` - Emergency recovery
- `deleteMongoDBData()` - Removes all organization data
- `deleteWorkOSData()` - Removes WorkOS org and users

**Collections Covered** (50+):
```javascript
- tickets, schedule_items, incidents, change_requests
- projects, project_tasks, project_milestones
- kb_articles, kb_categories, kb_tags
- assets, inventory, stock_movements
- clients, contacts, quotes, contracts
- agents, workflows, reports
- And 30+ more...
```

### API Endpoints

#### Preview Deletion
**GET** `/api/admin/tenant-deletion/preview`
- Returns deletion preview
- Shows organization name
- Lists total records and breakdown by collection
- No authentication token required in request body

#### Execute Deletion
**POST** `/api/admin/tenant-deletion/execute`
```json
{
  "confirmationText": "DELETE MY ORGANIZATION",
  "reason": "Optional reason for audit trail",
  "createBackup": true
}
```
**Response**:
```json
{
  "success": true,
  "result": {
    "organizationName": "...",
    "deletedRecords": 1234,
    "deletedCollections": 42,
    "workosOrgDeleted": true,
    "workosUsersDeleted": 5,
    "backupCreated": true,
    "backupId": "...",
    "timestamp": "..."
  }
}
```

#### Restore from Backup
**POST** `/api/admin/tenant-deletion/restore`
```json
{
  "backupId": "backup_id_from_deletion_result"
}
```

### UI Components

#### Account Settings Page
**File**: `src/app/(app)/settings/account/page.tsx`
- Organization account information
- Danger zone with deletion button
- Clear warnings and data list

#### Tenant Deletion Dialog
**File**: `src/components/settings/tenant-deletion-dialog.tsx`

**Steps**:
1. **Preview**: Shows organization details and data breakdown
2. **Confirm**: Requires typing "DELETE MY ORGANIZATION"
3. **Executing**: Progress indicator with status messages
4. **Complete**: Success confirmation with deletion statistics

**Features**:
- Auto-closes when complete
- Redirects to sign-in after 5 seconds
- Shows backup ID for recovery
- Real-time progress updates

### Database Schema

#### Backup Collection
**Collection**: `tenant_deletion_backups`
```javascript
{
  _id: ObjectId,
  orgId: string,
  workosOrgId: string,
  timestamp: Date,
  collections: {
    [collectionName]: Document[]
  },
  metadata: {
    organizationName: string,
    deletedBy: string,
    reason?: string
  }
}
```

#### Audit Collection
**Collection**: `tenant_deletion_audit`
```javascript
{
  orgId: string,
  workosOrgId: string,
  deletedBy: string,
  result: DeletionResult,
  timestamp: Date
}
```

## Access & Security

### Where to Find It

1. **Navigate to Settings**
   - Click "Settings" in sidebar
   - Expand "Account Settings" category
   - Click "Organization Account"

2. **Alternative**: Direct URL
   - Go to `/settings/account`

3. **Danger Zone**
   - Scroll to "Danger Zone" section
   - Click "Delete Organization" button

### Security Measures

✅ **Authentication Required**
- Must be logged in with valid WorkOS session
- Uses existing authentication context

✅ **Confirmation Required**
- Must type exact text: "DELETE MY ORGANIZATION"
- Case-sensitive validation

✅ **Multi-Step Process**
- Preview step (can cancel)
- Confirmation step (can go back)
- Execution (cannot stop)

✅ **Audit Trail**
- All deletions logged to `tenant_deletion_audit`
- Includes user ID, timestamp, and results

✅ **Backup Protection**
- Automatic backup before deletion
- 30-day recovery window
- Backup ID provided for support

## Testing Guidelines

### Manual Testing Steps

1. **Preview Test**
   ```bash
   # Navigate to:
   http://localhost:9002/settings/account

   # Click "Delete Organization"
   # Verify preview shows:
   - Organization name
   - Total record count
   - Collection breakdown
   - Backup warning
   ```

2. **Confirmation Test**
   ```bash
   # Click "Proceed to Confirmation"
   # Try typing incorrect text (should show error)
   # Type "DELETE MY ORGANIZATION" (should enable button)
   ```

3. **Validation Test**
   ```bash
   # Test API endpoint directly:
   curl http://localhost:9002/api/admin/tenant-deletion/preview

   # Should return preview data
   ```

### Important Notes for Testing

⚠️ **DO NOT RUN FULL DELETION IN PRODUCTION WITHOUT BACKUP**
⚠️ **Test on development/staging environments first**
⚠️ **Verify backup creation before enabling in production**

### What Gets Deleted

**MongoDB Data**:
- ✅ All tickets and service management data
- ✅ All projects, tasks, and milestones
- ✅ All knowledge base articles
- ✅ All assets and inventory
- ✅ All client and contact data
- ✅ All billing and contract data
- ✅ All agents and monitoring data
- ✅ All workflows and automation
- ✅ All reports and templates
- ✅ All settings and preferences

**WorkOS Data**:
- ✅ Organization entity
- ✅ All user accounts in organization
- ✅ All SSO connections

**Preserved** (for recovery):
- ✅ Complete backup in `tenant_deletion_backups`
- ✅ Audit trail in `tenant_deletion_audit`

## Recovery Process

If you need to restore a deleted tenant:

1. **Contact Support** with backup ID (provided after deletion)
2. **Within 30 days** of deletion
3. **Support will use restore API**:
   ```bash
   POST /api/admin/tenant-deletion/restore
   {
     "backupId": "your_backup_id_here"
   }
   ```

## Production Deployment Checklist

Before enabling in production:

- [ ] Test on staging environment
- [ ] Verify backup creation works
- [ ] Test restoration process
- [ ] Set up backup retention policy (30 days)
- [ ] Configure automated backup cleanup
- [ ] Add role-based access control (admin only)
- [ ] Set up deletion notifications (email, Slack, etc.)
- [ ] Document recovery process for support team
- [ ] Add rate limiting to prevent accidental rapid deletions
- [ ] Consider adding extra confirmation step for production

## Customization Options

### Add Email Notifications

In `src/lib/services/tenant-deletion.ts`, add to `logDeletion()`:
```typescript
// Send email notification
await sendEmail({
  to: 'admin@company.com',
  subject: `Organization Deleted: ${orgName}`,
  body: `Organization ${orgName} was deleted by ${deletedBy} at ${timestamp}`
})
```

### Add Role-Based Access Control

In API routes, add:
```typescript
// Check if user has admin role
const isAdmin = await checkUserRole(userId, 'admin')
if (!isAdmin) {
  return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
}
```

### Add Slack Notifications

```typescript
await fetch(process.env.SLACK_WEBHOOK_URL, {
  method: 'POST',
  body: JSON.stringify({
    text: `🗑️ Organization Deleted: ${orgName}\nDeleted by: ${userId}\nRecords: ${deletedRecords}`
  })
})
```

## Known Limitations

1. **WorkOS Organization Deletion**
   - Requires WorkOS API key with organization delete permissions
   - May fail if users have active sessions

2. **Backup Size**
   - Large organizations may have large backups
   - Consider implementing backup compression

3. **Deletion Time**
   - Large organizations may take several minutes
   - Consider implementing background job processing

## Future Enhancements

- [ ] Background job processing for large deletions
- [ ] Scheduled deletion (delete at specific time)
- [ ] Partial deletion (specific modules only)
- [ ] Deletion analytics and reporting
- [ ] Multi-factor authentication for deletion
- [ ] Webhook notifications
- [ ] Export backup as downloadable file

## Support

For issues or questions:
- Review logs in browser console and server output
- Check `tenant_deletion_audit` collection for deletion history
- Contact development team with backup ID for recovery

---

**Implementation Completed**: 2025-10-06
**Version**: 1.0.0
**Status**: ✅ Ready for staging testing
