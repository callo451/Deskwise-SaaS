# RBAC Seed Data Documentation

This document describes the default permissions and roles that are seeded when setting up the RBAC system for a new organization.

## How to Seed RBAC Data

### Via API Endpoint
```bash
POST /api/rbac/seed
Authorization: Bearer <admin-session-token>
```

### Via Code
```typescript
import { PermissionService } from '@/lib/services/permissions'
import { RoleService } from '@/lib/services/roles'

// Seed permissions
await PermissionService.seedDefaultPermissions(orgId)

// Seed roles
await RoleService.seedDefaultRoles(orgId)

// Migrate existing users
await RoleService.migrateUsersToRBAC(orgId)
```

## Default Permissions

### Tickets Module
| Permission Key | Description |
|---|---|
| `tickets.view.own` | View own tickets |
| `tickets.view.all` | View all tickets |
| `tickets.create` | Create tickets |
| `tickets.edit.own` | Edit own tickets |
| `tickets.edit.all` | Edit all tickets |
| `tickets.delete` | Delete tickets |
| `tickets.assign` | Assign tickets to users |
| `tickets.close` | Close tickets |
| `tickets.reopen` | Reopen closed tickets |
| `tickets.comment` | Add comments to tickets |

### Incidents Module
| Permission Key | Description |
|---|---|
| `incidents.view` | View incidents |
| `incidents.create` | Create incidents |
| `incidents.edit` | Edit incidents |
| `incidents.delete` | Delete incidents |
| `incidents.manage` | Manage incident status and updates |
| `incidents.publish` | Publish public incident updates |

### Change Requests Module
| Permission Key | Description |
|---|---|
| `changes.view` | View change requests |
| `changes.create` | Create change requests |
| `changes.edit` | Edit change requests |
| `changes.delete` | Delete change requests |
| `changes.approve` | Approve change requests |
| `changes.implement` | Implement approved changes |

### Assets Module
| Permission Key | Description |
|---|---|
| `assets.view` | View assets |
| `assets.create` | Create assets |
| `assets.edit` | Edit assets |
| `assets.delete` | Delete assets |
| `assets.manage` | Manage asset lifecycle |
| `assets.remoteControl` | Use remote control on assets |

### Projects Module
| Permission Key | Description |
|---|---|
| `projects.view.own` | View own projects |
| `projects.view.all` | View all projects |
| `projects.create` | Create projects |
| `projects.edit.own` | Edit own projects |
| `projects.edit.all` | Edit all projects |
| `projects.delete` | Delete projects |
| `projects.manage` | Manage project tasks and milestones |

### Knowledge Base Module
| Permission Key | Description |
|---|---|
| `kb.view` | View knowledge base articles |
| `kb.create` | Create knowledge base articles |
| `kb.edit.own` | Edit own knowledge base articles |
| `kb.edit.all` | Edit all knowledge base articles |
| `kb.delete` | Delete knowledge base articles |
| `kb.publish` | Publish articles as public |

### Users Module
| Permission Key | Description |
|---|---|
| `users.view` | View users |
| `users.create` | Create users |
| `users.edit` | Edit users |
| `users.delete` | Delete users |
| `users.manage` | Manage user roles and permissions |

### Roles Module
| Permission Key | Description |
|---|---|
| `roles.view` | View roles |
| `roles.create` | Create custom roles |
| `roles.edit` | Edit custom roles |
| `roles.delete` | Delete custom roles |
| `roles.assign` | Assign roles to users |

### Clients Module (MSP Mode)
| Permission Key | Description |
|---|---|
| `clients.view` | View clients |
| `clients.create` | Create clients |
| `clients.edit` | Edit clients |
| `clients.delete` | Delete clients |
| `clients.manage` | Manage client contracts and quotes |

### Schedule Module
| Permission Key | Description |
|---|---|
| `schedule.view.own` | View own schedule |
| `schedule.view.all` | View all schedules |
| `schedule.create` | Create schedule items |
| `schedule.edit` | Edit schedule items |
| `schedule.delete` | Delete schedule items |

### Reports Module
| Permission Key | Description |
|---|---|
| `reports.view` | View reports |
| `reports.create` | Create custom reports |
| `reports.export` | Export reports |

### Settings Module
| Permission Key | Description |
|---|---|
| `settings.view` | View organization settings |
| `settings.edit` | Edit organization settings |
| `settings.manage` | Manage advanced settings |

## Default Roles

### Administrator
- **Name:** `admin`
- **Display Name:** Administrator
- **Description:** Full access to all features and settings
- **Color:** `#ef4444` (red)
- **Icon:** `ShieldCheck`
- **Permissions:** ALL permissions listed above

### Technician
- **Name:** `technician`
- **Display Name:** Technician
- **Description:** Access to tickets, assets, and projects
- **Color:** `#3b82f6` (blue)
- **Icon:** `Wrench`
- **Permissions:**
  - All ticket permissions (view.all, create, edit.all, assign, close, reopen, comment)
  - Incident permissions (view, create, edit, manage)
  - Change request permissions (view, create, edit, implement)
  - Asset permissions (view, create, edit, manage, remoteControl)
  - Project permissions (view.all, create, edit.own, manage)
  - Knowledge base (view, create, edit.own)
  - Users (view)
  - Clients (view)
  - Schedule (view.all, create, edit)
  - Reports (view)
  - Settings (view)

### End User
- **Name:** `user`
- **Display Name:** End User
- **Description:** Basic access to view and create tickets
- **Color:** `#22c55e` (green)
- **Icon:** `User`
- **Permissions:**
  - tickets.view.own
  - tickets.create
  - tickets.edit.own
  - tickets.comment
  - incidents.view
  - assets.view
  - projects.view.own
  - kb.view
  - schedule.view.own

## Permission Naming Convention

Permissions follow a consistent naming pattern:

```
<module>.<action>.<scope?>
```

**Examples:**
- `tickets.view.all` - View all tickets in the organization
- `tickets.view.own` - View only tickets created by or assigned to the user
- `tickets.create` - Create new tickets
- `assets.remoteControl` - Use remote control feature on assets

## Permission Scopes

Some permissions have scope modifiers to provide granular access control:

- **`own`** - Only resources created by or assigned to the user
- **`all`** - All resources in the organization
- **No scope** - General permission without ownership restrictions

## Migration Notes

When upgrading from the legacy role system to RBAC:

1. The system automatically maps legacy roles to new role IDs
2. Users with `role: 'admin'` get the Administrator role
3. Users with `role: 'technician'` get the Technician role
4. Users with `role: 'user'` get the End User role
5. Legacy permissions are still supported for backward compatibility

## Custom Roles

Organizations can create custom roles by:

1. Cloning an existing role and modifying permissions
2. Creating a new role from scratch
3. Using the API: `POST /api/rbac/roles`

Custom roles:
- Cannot modify system roles (admin, technician, user)
- Can combine any permissions
- Support visual customization (color, icon)
- Are organization-specific

## Permission Overrides

Individual users can have permission overrides that:
- **Grant** additional permissions beyond their role
- **Revoke** specific permissions from their role
- Have optional expiration dates
- Include audit trail (who, when, why)

## Best Practices

1. **Use roles first** - Assign permissions via roles rather than individual grants
2. **Minimize overrides** - Use permission overrides sparingly for exceptions
3. **Regular audits** - Review custom roles and overrides periodically
4. **Principle of least privilege** - Grant only necessary permissions
5. **Document custom roles** - Add clear descriptions for custom roles
6. **Test thoroughly** - Verify permissions work as expected before deploying

## Database Collections

RBAC system uses the following MongoDB collections:

- **`permissions`** - All available permissions
- **`roles`** - Role definitions with permission assignments
- **`role_assignment_history`** - Audit trail of role changes
- **`users`** - Extended with `roleId`, `customPermissions`, `permissionOverrides`

## API Endpoints

### Permissions
- `GET /api/rbac/permissions` - List all permissions
- `GET /api/rbac/permissions?groupByModule=true` - List permissions grouped by module

### Roles
- `GET /api/rbac/roles` - List all roles
- `POST /api/rbac/roles` - Create custom role
- `GET /api/rbac/roles/[id]` - Get role details
- `PUT /api/rbac/roles/[id]` - Update role
- `DELETE /api/rbac/roles/[id]` - Delete role
- `POST /api/rbac/roles/[id]/clone` - Clone role

### User Permissions
- `GET /api/users/[id]/permissions` - Get user's effective permissions
- `PUT /api/users/[id]/permissions` - Grant/revoke permission override
- `DELETE /api/users/[id]/permissions` - Clear all permission overrides
- `PUT /api/users/[id]/role` - Assign role to user

### Seeding
- `POST /api/rbac/seed` - Seed permissions, roles, and migrate users

## Example Usage

### Check Permission in API Route
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requirePermission } from '@/lib/middleware/permissions'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!await requirePermission(session, 'tickets.view.all')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Continue with authorized logic
}
```

### Check Multiple Permissions (OR)
```typescript
import { requireAnyPermission } from '@/lib/middleware/permissions'

if (!await requireAnyPermission(session, ['tickets.edit.all', 'tickets.edit.own'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Check Multiple Permissions (AND)
```typescript
import { requireAllPermissions } from '@/lib/middleware/permissions'

if (!await requireAllPermissions(session, ['users.view', 'users.edit'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Get User Permissions
```typescript
import { getUserPermissions } from '@/lib/middleware/permissions'

const permissions = await getUserPermissions(session)
console.log('User has', permissions.length, 'permissions')
```

## Security Considerations

1. **JWT Token Size** - Permissions are cached in JWT, keep role permissions reasonable
2. **Session Refresh** - Users must re-login to get updated permissions
3. **Permission Checks** - Always check permissions server-side, never trust client
4. **Audit Trail** - All permission changes are logged
5. **System Roles** - System roles cannot be deleted or renamed
6. **Role Deletion** - Roles with active users cannot be deleted

## Troubleshooting

**Problem:** Permissions not updating after role change
**Solution:** User needs to log out and log back in to refresh JWT token

**Problem:** Cannot delete role
**Solution:** Ensure no users are assigned to that role, or it's not a system role

**Problem:** Permission denied despite correct role
**Solution:** Check if user has permission overrides that revoke the permission

**Problem:** Too many permissions in JWT
**Solution:** Consider reducing role permissions or implementing permission caching strategy
