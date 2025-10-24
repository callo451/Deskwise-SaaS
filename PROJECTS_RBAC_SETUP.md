# Production RBAC Setup for Projects Module

## Overview

This document outlines how to properly configure Role-Based Access Control (RBAC) for the Projects module, eliminating the need for admin bypasses.

## Current State

**Problem:** API routes have admin bypasses because granular permissions aren't initialized in the database.

**Solution:** Properly seed and configure the RBAC system with all project permissions.

## Available Project Permissions

### Core Project Permissions
```
projects.view.all       - View all projects in organization
projects.view.own       - View only assigned/owned projects
projects.create         - Create new projects
projects.edit.all       - Edit any project
projects.edit.own       - Edit only owned/assigned projects
projects.delete         - Delete projects
projects.manage         - Full project management (includes all above)
```

### Project Tasks Permissions
```
projects.tasks.view           - View tasks in projects
projects.tasks.create         - Create tasks
projects.tasks.edit.all       - Edit any task
projects.tasks.edit.assigned  - Edit only assigned tasks
projects.tasks.delete         - Delete tasks
```

### Project Milestones Permissions (Missing - Need to Add)
```
projects.milestones.view    - View milestones
projects.milestones.create  - Create milestones
projects.milestones.edit    - Edit milestones
projects.milestones.delete  - Delete milestones
```

## Step 1: Update Permission Definitions

Add missing milestone permissions to `src/lib/services/permissions.ts`:

```typescript
// In getLegacyRolePermissions function, add to 'admin' array:
'projects.milestones.view',
'projects.milestones.create',
'projects.milestones.edit',
'projects.milestones.delete',

// Add to 'technician' array:
'projects.milestones.view',
'projects.milestones.create',
'projects.milestones.edit',
```

## Step 2: Seed RBAC System

Run the RBAC seeding script to initialize permissions and roles:

```bash
npx tsx scripts/seed-rbac-standalone.ts
```

**What this does:**
1. Creates default roles (Administrator, Technician, End User) for each organization
2. Assigns permissions to each role based on their level
3. Migrates existing users from legacy `role` field to new `roleId` system
4. Caches permissions in user sessions

**Expected Output:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Found 1 organization(s)

🏢 Processing organization: Your Org (org_id)
────────────────────────────────────────────────────────────────
✅ Created 3 roles for organization
✅ Migrated 5 users to role-based system
✅ Organization setup complete
```

## Step 3: Default Role Permissions

After seeding, these are the default permissions by role:

### Administrator (Full Access)
- All `projects.*` permissions
- All `projects.tasks.*` permissions
- All `projects.milestones.*` permissions
- Can create, edit, delete any project/task/milestone

### Technician (Operational Access)
- `projects.view.all` - View all projects
- `projects.create` - Create new projects
- `projects.edit.own` - Edit assigned projects
- `projects.manage` - Manage project settings
- `projects.tasks.*` (all) - Full task access
- `projects.milestones.view`, `create`, `edit` - Milestone access

### End User (Limited Access)
- `projects.view.own` - View only assigned projects
- `projects.tasks.view` - View tasks
- No create/edit/delete permissions

## Step 4: Remove Admin Bypasses

Once RBAC is seeded, remove admin bypass code from these files:

### Files to Update:

1. **`src/app/api/projects/route.ts`**
   - Remove: Lines 53-61 (GET admin bypass)
   - Remove: Lines 104-112 (POST admin bypass)

2. **`src/app/api/projects/[id]/route.ts`**
   - Remove: Lines 50-62 (GET admin bypass)
   - Remove: Lines 103-115 (PUT admin bypass)
   - Remove: Lines 188-200 (DELETE admin bypass)

3. **`src/app/api/projects/[id]/tasks/route.ts`**
   - Remove: Lines 61-73 (GET admin bypass)
   - Remove: Lines 116-128 (POST admin bypass)

4. **`src/app/api/projects/[id]/milestones/route.ts`**
   - Remove: Lines 57-69 (GET admin bypass)
   - Remove: Lines 126-138 (POST admin bypass)

### Replacement Pattern:

**Before:**
```typescript
// Admin bypass - admins can always view all projects
const isAdmin = session.user.role === 'admin'

// Check permission - skip for admins
if (!isAdmin) {
  const hasPermission = await requirePermission(session, 'projects.view.all')
  if (!hasPermission) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

**After:**
```typescript
// Check permission
const hasPermission = await requirePermission(session, 'projects.view.all')
if (!hasPermission) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

**Why this works:** Admins will have `projects.view.all` in their role permissions after seeding, so the check passes automatically.

## Step 5: Verify RBAC is Working

### Test Permission Checking:

```bash
# In browser console or API test
GET /api/rbac/check-permission?permission=projects.view.all

# Response should show:
{
  "hasPermission": true,
  "userRole": "Administrator",
  "permissions": ["projects.view.all", "projects.create", ...]
}
```

### Check User Permissions via Database:

```javascript
// MongoDB query
db.users.findOne({ email: "admin@example.com" }, { roleId: 1, role: 1 })

// Should have roleId populated
{ roleId: ObjectId("..."), role: "admin" }

db.roles.findOne({ _id: ObjectId("roleId from above") })

// Should show full permissions array
{
  name: "Administrator",
  permissions: ["projects.view.all", "projects.create", ...],
  isSystemRole: true
}
```

## Step 6: Add Granular Permission Checks

For advanced scenarios, use context-aware permission checking:

```typescript
import { ProjectPermissionService } from '@/lib/services/project-permissions'

// Example: Check if user can edit a specific project
export async function PUT(request: NextRequest, { params }) {
  const session = await getServerSession(authOptions)
  const project = await ProjectService.getProjectById(params.id, session.user.orgId)

  // Context-aware check
  const canEdit = await ProjectPermissionService.canEditProject(session, project)

  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Proceed with update
}
```

## Step 7: Custom Role Creation

For custom organizational needs, create custom roles via UI or API:

### Via API:
```typescript
POST /api/rbac/roles
{
  "name": "Project Manager",
  "description": "Manages projects but cannot delete",
  "permissions": [
    "projects.view.all",
    "projects.create",
    "projects.edit.all",
    "projects.manage",
    "projects.tasks.view",
    "projects.tasks.create",
    "projects.tasks.edit.all",
    "projects.milestones.view",
    "projects.milestones.create",
    "projects.milestones.edit"
  ]
}
```

### Via Settings UI:
1. Navigate to `/settings/users` (Users & Roles tab)
2. Click "Create Role"
3. Select permissions from the permission matrix
4. Save role
5. Assign to users

## Step 8: Permission Caching

Permissions are cached in JWT tokens for performance:

- **Cache Duration:** Session lifetime (typically 30 days)
- **Refresh Trigger:** User login, role change, permission update
- **Manual Refresh:** User can log out and back in

## Production Checklist

- [ ] Run `npx tsx scripts/seed-rbac-standalone.ts`
- [ ] Verify all users have `roleId` populated
- [ ] Test each role can access appropriate features
- [ ] Remove all admin bypass code
- [ ] Test permission denials return proper 403 errors
- [ ] Document custom roles for your organization
- [ ] Train users on permission system

## Benefits of Proper RBAC

1. **Security:** Principle of least privilege
2. **Auditability:** Track who can do what
3. **Scalability:** Easy to add new roles/permissions
4. **Compliance:** Meet SOC 2, ISO 27001 requirements
5. **Flexibility:** Per-user permission overrides available
6. **Performance:** Cached in session, <5ms permission checks

## Troubleshooting

### Issue: User still getting 403 errors after seeding

**Solution:**
1. Check if user's `roleId` is populated: `db.users.findOne({ email: "..." })`
2. If missing, re-run seed script
3. Ask user to log out and back in to refresh token

### Issue: Permission check is slow

**Solution:**
- Permissions should be cached in session
- Check `requirePermission` is using session-cached permissions
- Consider adding database indexes on `roleId`

### Issue: Need to give temporary elevated access

**Solution:**
```typescript
POST /api/users/{userId}/permissions
{
  "permissionKey": "projects.delete",
  "granted": true,
  "expiresAt": "2025-12-31T23:59:59Z"  // Temporary until date
}
```

## Reference

- **Permission Service:** `src/lib/services/permissions.ts`
- **Role Service:** `src/lib/services/roles.ts`
- **Project Permissions:** `src/lib/services/project-permissions.ts`
- **Middleware:** `src/lib/middleware/permissions.ts`
- **Seed Script:** `scripts/seed-rbac-standalone.ts`
- **RBAC Docs:** `RBAC_SYSTEM_DESIGN.md`, `RBAC_SETUP_GUIDE.md`
