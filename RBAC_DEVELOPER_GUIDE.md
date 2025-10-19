# RBAC Developer Guide

Quick reference for developers using the RBAC system in Deskwise ITSM.

## Setup (One-Time)

```typescript
// Call as admin user to initialize RBAC
POST /api/rbac/seed
```

## Permission Checks in API Routes

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission, requireAnyPermission, requireAllPermissions } from '@/lib/middleware/permissions'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Single permission
  if (!await requirePermission(session, 'tickets.view.all')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Any permission (OR)
  if (!await requireAnyPermission(session, ['tickets.edit.all', 'tickets.edit.own'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // All permissions (AND)
  if (!await requireAllPermissions(session, ['users.view', 'users.edit'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}
```

## Permission Checks in Frontend

```typescript
// Session already includes permissions
const { data: session } = useSession()

// Single permission
if (session?.user?.permissions?.includes('tickets.create')) {
  // Show button
}

// Any permission (OR)
const canEdit = session?.user?.permissions?.some(p =>
  ['tickets.edit.all', 'tickets.edit.own'].includes(p)
)

// All permissions (AND)
const canManageUsers = ['users.view', 'users.edit'].every(p =>
  session?.user?.permissions?.includes(p)
)
```

## Common Permission Keys

### Tickets
```
tickets.view.own         tickets.view.all
tickets.create           tickets.edit.own
tickets.edit.all         tickets.delete
tickets.assign           tickets.close
tickets.reopen           tickets.comment
```

### Assets
```
assets.view              assets.create
assets.edit              assets.delete
assets.manage            assets.remoteControl
```

### Users
```
users.view               users.create
users.edit               users.delete
users.manage
```

### Roles
```
roles.view               roles.create
roles.edit               roles.delete
roles.assign
```

### Settings
```
settings.view            settings.edit
settings.manage
```

## API Endpoints

### List Permissions
```bash
GET /api/rbac/permissions
GET /api/rbac/permissions?groupByModule=true
```

### List Roles
```bash
GET /api/rbac/roles
GET /api/rbac/roles?includeInactive=true
```

### Create Role
```bash
POST /api/rbac/roles
{
  "name": "custom_role",
  "displayName": "Custom Role",
  "description": "Description",
  "permissions": ["tickets.view.all", "assets.view"],
  "color": "#3b82f6",
  "icon": "Star"
}
```

### Update Role
```bash
PUT /api/rbac/roles/[id]
{
  "displayName": "Updated Name",
  "permissions": ["tickets.view.all", "tickets.create"]
}
```

### Clone Role
```bash
POST /api/rbac/roles/[id]/clone
{
  "name": "new_role_name",
  "displayName": "New Role Display Name"
}
```

### Assign Role to User
```bash
PUT /api/users/[userId]/role
{
  "roleId": "role_id_here",
  "reason": "Promotion to senior technician"
}
```

### Grant Permission Override
```bash
PUT /api/users/[userId]/permissions
{
  "permissionKey": "tickets.delete",
  "granted": true,
  "expiresAt": "2024-12-31T23:59:59Z",
  "reason": "Temporary cleanup access"
}
```

### Revoke Permission Override
```bash
PUT /api/users/[userId]/permissions
{
  "permissionKey": "tickets.delete",
  "granted": false,
  "reason": "Cleanup complete"
}
```

### Get User Permissions
```bash
GET /api/users/[userId]/permissions
```

## Service Layer Usage

```typescript
import { PermissionService } from '@/lib/services/permissions'
import { RoleService } from '@/lib/services/roles'

// Check permission programmatically
const hasPermission = await PermissionService.hasPermission(
  userId,
  orgId,
  'tickets.view.all'
)

// Get all user permissions
const permissions = await PermissionService.getUserPermissions(userId, orgId)

// Get all roles
const roles = await RoleService.getAllRoles(orgId)

// Create custom role
const role = await RoleService.createRole(orgId, createdBy, {
  name: 'custom_role',
  displayName: 'Custom Role',
  description: 'Description',
  permissions: ['tickets.view.all', 'assets.view']
})

// Assign role
await RoleService.assignRoleToUser(userId, orgId, roleId, assignedBy)
```

## Default Roles

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Administrator** | All 90+ permissions | Full system access |
| **Technician** | 40+ operational permissions | Day-to-day IT operations |
| **End User** | 9 basic permissions | Submit and view own tickets |

## Permission Scopes

- **`.own`** - Only own resources (created by or assigned to user)
- **`.all`** - All resources in organization
- **No scope** - General action without ownership

Examples:
- `tickets.view.own` - View only my tickets
- `tickets.view.all` - View all tickets
- `tickets.create` - Create tickets (no scope needed)

## Backward Compatibility

The system supports legacy roles during transition:

```typescript
// Legacy check (still works)
if (session.user.role === 'admin') {
  // Admin logic
}

// New RBAC check (recommended)
if (await requirePermission(session, 'users.manage')) {
  // Admin logic
}
```

## Common Patterns

### Resource Ownership Check
```typescript
// User can edit if they have .all permission OR .own permission and own the resource
const canEditAll = await requirePermission(session, 'tickets.edit.all')
const canEditOwn = await requirePermission(session, 'tickets.edit.own')

if (canEditAll || (canEditOwn && ticket.createdBy === session.user.id)) {
  // Allow edit
}
```

### Admin-Only Endpoint
```typescript
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Admin only' }, { status: 403 })
}
```

### Permission-Based Endpoint
```typescript
if (!await requirePermission(session, 'settings.manage')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Troubleshooting

**Problem:** Permissions not updating
**Fix:** User must log out and log back in (JWT token refresh)

**Problem:** Permission denied but role has permission
**Fix:** Check for permission overrides that revoke the permission

**Problem:** Cannot delete role
**Fix:** Ensure no users assigned to role and it's not a system role

**Problem:** Too many permissions warning
**Fix:** Limit custom roles to ~100-150 permissions max

## Best Practices

1. ✅ Use `requirePermission()` in API routes
2. ✅ Check permissions server-side, never trust client
3. ✅ Use role assignment for most users
4. ✅ Use permission overrides for exceptions only
5. ✅ Document custom roles with clear descriptions
6. ✅ Regular audit of permissions and roles
7. ❌ Don't modify system roles (admin, technician, user)
8. ❌ Don't grant permissions client-side
9. ❌ Don't skip permission checks for "trusted" users

## Example: Complete CRUD with Permissions

```typescript
// List (requires view permission)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!await requirePermission(session, 'tickets.view.all')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const tickets = await TicketService.getAll(session.user.orgId)
  return NextResponse.json({ success: true, data: tickets })
}

// Create (requires create permission)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!await requirePermission(session, 'tickets.create')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const ticket = await TicketService.create(session.user.orgId, body)
  return NextResponse.json({ success: true, data: ticket })
}

// Update (requires edit permission)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  // Check if user can edit all OR can edit own and owns this ticket
  const canEditAll = await requirePermission(session, 'tickets.edit.all')
  const canEditOwn = await requirePermission(session, 'tickets.edit.own')

  if (!canEditAll) {
    const ticket = await TicketService.getById(params.id, session.user.orgId)
    if (!ticket || (canEditOwn && ticket.createdBy !== session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const updated = await TicketService.update(params.id, session.user.orgId, body)
  return NextResponse.json({ success: true, data: updated })
}

// Delete (requires delete permission)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!await requirePermission(session, 'tickets.delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await TicketService.delete(params.id, session.user.orgId)
  return NextResponse.json({ success: true })
}
```

## Need More Help?

- Full documentation: `RBAC_IMPLEMENTATION.md`
- Seed data details: `RBAC_SEED_DATA.md`
- Service layer: `src/lib/services/permissions.ts` and `src/lib/services/roles.ts`
- Middleware helpers: `src/lib/middleware/permissions.ts`
