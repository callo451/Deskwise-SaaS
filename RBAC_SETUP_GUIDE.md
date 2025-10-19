# RBAC System Setup Guide

This guide provides step-by-step instructions for initializing and using the new RBAC (Role-Based Access Control) system in Deskwise ITSM.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Verifying Installation](#verifying-installation)
4. [User Management](#user-management)
5. [Role Management](#role-management)
6. [Permission Management](#permission-management)
7. [API Integration](#api-integration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Next.js application running (dev or production)
- MongoDB database connected
- Admin user authenticated with valid session
- Environment variables configured

---

## Initial Setup

### Step 1: Seed the RBAC System

The RBAC system needs to be initialized before first use. This creates default permissions, roles, and migrates existing users.

**Using cURL:**
```bash
curl -X POST http://localhost:9002/api/rbac/seed \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-session-token"
```

**Using the Browser Console:**
```javascript
fetch('/api/rbac/seed', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "permissionsCreated": 125,
    "rolesCreated": 3,
    "usersMigrated": 15
  },
  "message": "RBAC system seeded successfully"
}
```

### Step 2: Verify Seeding

Check that all components were created:

**List Permissions:**
```bash
curl http://localhost:9002/api/rbac/permissions \
  -H "Cookie: next-auth.session-token=your-token"
```

**List Roles:**
```bash
curl http://localhost:9002/api/rbac/roles \
  -H "Cookie: next-auth.session-token=your-token"
```

### Step 3: Assign Initial Roles

After seeding, your admin user should automatically have the Administrator role. Verify by checking the user management page at `/settings/users`.

---

## Verifying Installation

### Check Database Collections

Open MongoDB Compass or your database client and verify these collections exist:

1. **`permissions`** - Should contain 120+ documents
   ```javascript
   db.permissions.countDocuments({ orgId: "your-org-id" })
   // Expected: 120+
   ```

2. **`roles`** - Should contain 3 default roles
   ```javascript
   db.roles.find({ orgId: "your-org-id", isSystem: true })
   // Expected: Administrator, Technician, End User
   ```

3. **`users`** - Should have `roleId` populated
   ```javascript
   db.users.find({ roleId: { $exists: true } })
   ```

### Check User Permissions

Navigate to `/settings/users` and verify:
- ✅ Users table displays with role badges
- ✅ "Roles & Permissions" tab is visible
- ✅ 3 default roles are listed in the roles table
- ✅ Permission matrix shows data

---

## User Management

### Creating a New User with Role

1. Navigate to `/settings/users`
2. Click "Add User"
3. Fill in user details
4. Select a role from the "Role" dropdown
5. Click "Create User"

**Via API:**
```bash
curl -X POST http://localhost:9002/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "secure-password",
    "roleId": "role-id-here"
  }'
```

### Editing User Role

1. Navigate to `/settings/users`
2. Click the dropdown menu (⋮) next to a user
3. Select "Edit User"
4. Change the role in the dropdown
5. Click "Save Changes"

**Via API:**
```bash
curl -X PUT http://localhost:9002/api/users/{userId}/role \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{
    "roleId": "new-role-id"
  }'
```

### Managing User Permission Overrides

Permission overrides allow you to grant or revoke specific permissions for individual users.

1. Navigate to `/settings/users`
2. Click dropdown menu (⋮) → "Manage Permissions"
3. Use the PermissionSelector to:
   - ✅ Green checkbox = Permission granted via role
   - 🟡 Yellow background = Permission override applied
   - ⬜ Unchecked = Permission not granted
4. Click "Save Changes"

**Via API:**
```bash
curl -X PUT http://localhost:9002/api/users/{userId}/permissions \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{
    "overrides": [
      {
        "permissionKey": "tickets.delete",
        "granted": false,
        "reason": "Temporary restriction"
      }
    ]
  }'
```

---

## Role Management

### Creating a Custom Role

1. Navigate to `/settings/users`
2. Click "Roles & Permissions" tab
3. Click "Create Role"
4. Fill in:
   - **Name**: Internal identifier (e.g., `project_manager`)
   - **Display Name**: User-facing name (e.g., "Project Manager")
   - **Description**: Role purpose
   - **Permissions**: Select permissions from the list
5. Click "Create Role"

**Via API:**
```bash
curl -X POST http://localhost:9002/api/rbac/roles \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{
    "name": "project_manager",
    "displayName": "Project Manager",
    "description": "Manages projects and assigns tasks",
    "permissions": [
      "projects.view.all",
      "projects.create",
      "projects.edit.all",
      "projects.manage-tasks",
      "projects.manage-members",
      "tickets.view.all",
      "tickets.assign"
    ]
  }'
```

### Cloning a Role

Use this to create a new role based on an existing one:

1. Navigate to `/settings/users` → "Roles & Permissions" tab
2. Click dropdown (⋮) next to a role
3. Select "Clone Role"
4. Enter new name and display name
5. Click "Clone Role"
6. Edit the cloned role to modify permissions

**Via API:**
```bash
curl -X POST http://localhost:9002/api/rbac/roles/{roleId}/clone \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{
    "name": "senior_technician",
    "displayName": "Senior Technician"
  }'
```

### Editing a Role

1. Navigate to `/settings/users` → "Roles & Permissions" tab
2. Click dropdown (⋮) next to a role
3. Select "Edit Role"
4. Modify permissions or details
5. Click "Save Changes"

**Note:** System roles (Administrator, Technician, End User) cannot be deleted but can be deactivated.

### Deleting a Role

1. Navigate to `/settings/users` → "Roles & Permissions" tab
2. Click dropdown (⋮) next to a role
3. Select "Delete Role"
4. Confirm deletion

**Requirements:**
- ❌ Cannot delete system roles
- ❌ Cannot delete roles with assigned users (reassign first)

---

## Permission Management

### Permission Structure

Permissions follow the format: `{module}.{action}.{scope}`

**Examples:**
```
tickets.view.own        - View only your own tickets
tickets.view.assigned   - View tickets assigned to you
tickets.view.all        - View all tickets
tickets.create          - Create new tickets
tickets.edit.all        - Edit any ticket
assets.manage           - Full asset management
users.create            - Create new users
roles.manage-permissions - Modify role permissions
```

### Available Modules

| Module | Description | Permissions |
|--------|-------------|-------------|
| `tickets` | Ticket management | 14 permissions |
| `incidents` | Incident tracking | 7 permissions |
| `changes` | Change requests | 10 permissions |
| `assets` | Asset management | 9 permissions |
| `knowledge-base` | KB articles | 7 permissions |
| `projects` | Project management | 9 permissions |
| `scheduling` | Calendar/scheduling | 7 permissions |
| `users` | User management | 6 permissions |
| `roles` | Role management | 6 permissions |
| `clients` | Client management | 5 permissions |
| `billing` | Billing/invoicing | 6 permissions |
| `quoting` | Quote management | 5 permissions |
| `settings` | System settings | 7 permissions |
| `reports` | Reporting | 4 permissions |
| `audit-logs` | Audit trail | 3 permissions |

### Viewing All Permissions

**Via UI:**
- Navigate to `/settings/users` → "Roles & Permissions" tab
- Create/Edit a role to see all permissions grouped by module

**Via API:**
```bash
# Get all permissions grouped by module
curl http://localhost:9002/api/rbac/permissions?groupByModule=true \
  -H "Cookie: next-auth.session-token=your-token"
```

---

## API Integration

### Protecting API Routes

#### Method 1: Using Permission Middleware

```typescript
import { requirePermission } from '@/lib/middleware/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check permission
  if (!await requirePermission(session, 'tickets.delete')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Proceed with delete
  // ...
}
```

#### Method 2: Checking Multiple Permissions

```typescript
import { requireAllPermissions, requireAnyPermission } from '@/lib/middleware/permissions'

// User must have ALL specified permissions
if (!await requireAllPermissions(session, [
  'projects.view.all',
  'projects.edit.all'
])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// User must have ANY of the specified permissions
if (!await requireAnyPermission(session, [
  'tickets.view.all',
  'tickets.view.assigned',
  'tickets.view.own'
])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

#### Method 3: Backward Compatibility Helpers

```typescript
import { isAdmin, isAdminOrTechnician } from '@/lib/middleware/permissions'

// Quick admin check
if (!isAdmin(session)) {
  return NextResponse.json({ error: 'Admin required' }, { status: 403 })
}

// Admin or technician check
if (!isAdminOrTechnician(session)) {
  return NextResponse.json({ error: 'Staff access required' }, { status: 403 })
}
```

### Client-Side Permission Checks

Access permissions from the session:

```typescript
'use client'

import { useSession } from 'next-auth/react'

export default function MyComponent() {
  const { data: session } = useSession()

  const hasPermission = (permission: string) => {
    return session?.user?.permissions?.includes(permission) || false
  }

  const canDeleteTickets = hasPermission('tickets.delete')
  const canEditAllProjects = hasPermission('projects.edit.all')

  return (
    <div>
      {canDeleteTickets && (
        <button onClick={handleDelete}>Delete Ticket</button>
      )}

      {canEditAllProjects && (
        <button onClick={handleEdit}>Edit Project</button>
      )}
    </div>
  )
}
```

### Using Permission Hooks

```typescript
'use client'

import { usePermissions } from '@/hooks/use-permissions'

export default function FeatureComponent() {
  const { checkPermission, loading } = usePermissions()

  if (loading) return <div>Loading permissions...</div>

  return (
    <div>
      {checkPermission('users.create') && (
        <CreateUserButton />
      )}
    </div>
  )
}
```

---

## Troubleshooting

### Issue: "Insufficient permissions" error

**Cause:** User doesn't have required permission

**Solutions:**
1. Check user's assigned role in `/settings/users`
2. Verify role has the required permission
3. Check for permission overrides (yellow background in UI)
4. Ensure user roleId is set correctly in database

### Issue: Permissions not updating immediately

**Cause:** Permissions are cached in JWT token

**Solutions:**
1. Log out and log back in to refresh token
2. Wait for token expiration (default: 30 days)
3. Implement token refresh endpoint (recommended)

### Issue: "Role not found" when assigning role

**Cause:** Role was deleted or doesn't exist for organization

**Solutions:**
1. Run RBAC seed again: `POST /api/rbac/seed`
2. Check role exists: `GET /api/rbac/roles`
3. Verify orgId matches user's organization

### Issue: Cannot delete role with assigned users

**Cause:** Safety feature to prevent orphaned users

**Solutions:**
1. Reassign users to different role first
2. Check role's userCount in `/settings/users` → Roles tab
3. Use API to verify: `GET /api/rbac/roles/{roleId}`

### Issue: RBAC seed failing

**Cause:** Permissions or roles already exist

**Solutions:**
1. Check if seed was already run successfully
2. Verify database collections: `permissions`, `roles`
3. If needed, manually delete collections and re-seed

**Delete and Re-seed:**
```javascript
// In MongoDB shell
db.permissions.deleteMany({ orgId: "your-org-id" })
db.roles.deleteMany({ orgId: "your-org-id" })

// Then re-run seed
POST /api/rbac/seed
```

### Issue: Old role field conflicts with new roleId

**Cause:** Legacy data not migrated

**Solutions:**
1. Run migration: Included in seed command
2. Manually update users:
```javascript
// In MongoDB shell
db.users.updateMany(
  { role: 'admin', roleId: { $exists: false } },
  { $set: { roleId: adminRoleId } }
)
```

---

## Best Practices

### Security
- ✅ Always check permissions at the API level (never trust client-side checks alone)
- ✅ Use specific permissions instead of broad wildcards
- ✅ Regularly audit user roles and permissions
- ✅ Document custom roles and their purpose
- ✅ Use permission overrides sparingly (log reason)

### Performance
- ✅ Permissions are cached in JWT (fast checks)
- ✅ Avoid checking permissions in loops
- ✅ Use bulk permission checks when possible
- ✅ Consider implementing permission-based routing

### Organization
- ✅ Create custom roles for specific job functions
- ✅ Use descriptive role names (e.g., `project_lead`, `billing_admin`)
- ✅ Group related permissions together
- ✅ Clone existing roles instead of starting from scratch
- ✅ Document custom permission overrides

### Maintenance
- ✅ Review and update roles quarterly
- ✅ Audit permission usage with audit logs
- ✅ Remove unused custom roles
- ✅ Keep system roles (Administrator, Technician, End User) active
- ✅ Test permission changes in development first

---

## API Reference Summary

### Permission APIs
- `GET /api/rbac/permissions` - List all permissions
- `POST /api/rbac/permissions` - Seed default permissions
- `GET /api/users/{id}/permissions` - Get user permissions
- `PUT /api/users/{id}/permissions` - Update user overrides
- `DELETE /api/users/{id}/permissions` - Clear overrides

### Role APIs
- `GET /api/rbac/roles` - List all roles
- `POST /api/rbac/roles` - Create role
- `GET /api/rbac/roles/{id}` - Get role details
- `PUT /api/rbac/roles/{id}` - Update role
- `DELETE /api/rbac/roles/{id}` - Delete role
- `POST /api/rbac/roles/{id}/clone` - Clone role
- `PUT /api/users/{id}/role` - Assign role to user

### System APIs
- `POST /api/rbac/seed` - Initialize RBAC system

---

## Additional Resources

- **RBAC_SYSTEM_DESIGN.md** - Complete system architecture
- **RBAC_QUICK_REFERENCE.md** - Permission lookup guide
- **RBAC_DEVELOPER_GUIDE.md** - Integration examples
- **RBAC_IMPLEMENTATION.md** - Technical implementation details

---

**Need Help?**
- Check the documentation files listed above
- Review API route implementations in `src/app/api/rbac/`
- Inspect service layer code in `src/lib/services/permissions.ts` and `roles.ts`
- Test in development environment first

---

**Last Updated:** October 12, 2025
