# ITSM RBAC System - Complete Documentation

## Overview

Deskwise now includes a comprehensive Role-Based Access Control (RBAC) system designed specifically for ITSM/SaaS platforms. The system provides 11 specialized roles with granular permissions aligned with ITIL best practices.

## ITSM Roles (11 Roles)

### 1. System Administrator
**Role Name:** `system_administrator`
**Display Name:** System Administrator
**Color:** Red (#dc2626)
**Icon:** ShieldCheck

**Description:** Full administrative access to all platform features, settings, and user management

**Permissions:** 69 permissions including:
- Full ticket management (all types: tickets, incidents, changes, service requests, problems)
- Complete asset lifecycle management including remote control
- Full project management capabilities
- Knowledge base management and publishing
- User and role management
- Client management (MSP mode)
- Scheduling and reporting
- Platform settings and portal customization

**Use Case:** Organization owners, platform administrators

---

### 2. Service Desk Manager
**Role Name:** `service_desk_manager`
**Display Name:** Service Desk Manager
**Color:** Violet (#7c3aed)
**Icon:** Users

**Description:** Manages service desk operations, teams, queues, SLAs, and workflow approvals

**Permissions:** 47 permissions including:
- Full ticket management with approvals
- Incident management and publishing
- Change approval authority
- Service request approval authority
- Problem management
- Team and user management
- Client management
- Reporting and analytics

**Use Case:** Service desk team leads, support managers

---

### 3. Service Desk Agent
**Role Name:** `service_desk_agent`
**Display Name:** Service Desk Agent
**Color:** Blue (#2563eb)
**Icon:** Headphones

**Description:** Front-line support agent handling tickets, incidents, and service requests

**Permissions:** 29 permissions including:
- Full ticket handling (view all, create, edit, assign, close)
- Incident creation and management
- Change implementation
- Service request creation
- Problem creation
- Asset management and remote control
- Knowledge base contribution
- Schedule management

**Use Case:** Help desk agents, support technicians

---

### 4. Technical Lead
**Role Name:** `technical_lead`
**Display Name:** Technical Lead
**Color:** Cyan (#0891b2)
**Icon:** Cpu

**Description:** Advanced technical support for escalations, complex issues, and knowledge creation

**Permissions:** 34 permissions including:
- Advanced ticket management
- Incident publishing
- Problem management with KEDB access
- Full asset lifecycle and remote control
- Project management
- Knowledge base publishing
- Report creation

**Use Case:** Senior technicians, escalation specialists

---

### 5. Problem Manager
**Role Name:** `problem_manager`
**Display Name:** Problem Manager
**Color:** Orange (#ea580c)
**Icon:** SearchCheck

**Description:** Problem management specialist focused on root cause analysis and KEDB maintenance

**Permissions:** 18 permissions including:
- Problem management and KEDB
- Incident correlation
- Knowledge base publishing
- Analytics and reporting
- Trend analysis

**Use Case:** Problem management specialists, quality analysts

---

### 6. Change Manager
**Role Name:** `change_manager`
**Display Name:** Change Manager
**Color:** Fuchsia (#c026d3)
**Icon:** GitBranch

**Description:** Change management specialist for CAB coordination, approvals, and change control

**Permissions:** 21 permissions including:
- Change approval authority
- Change implementation
- CAB coordination
- Project management
- Schedule management
- Reporting

**Use Case:** Change Advisory Board members, change coordinators

---

### 7. Asset Manager
**Role Name:** `asset_manager`
**Display Name:** Asset Manager
**Color:** Lime (#65a30d)
**Icon:** Package

**Description:** IT asset management specialist responsible for inventory and asset lifecycle

**Permissions:** 17 permissions including:
- Full asset lifecycle management
- Asset deletion authority
- Remote control access
- Inventory reporting
- Service request creation

**Use Case:** IT asset managers, inventory specialists

---

### 8. Project Manager
**Role Name:** `project_manager`
**Display Name:** Project Manager
**Color:** Teal (#0d9488)
**Icon:** Briefcase

**Description:** Project management specialist for planning, execution, and resource allocation

**Permissions:** 19 permissions including:
- Full project lifecycle management
- Project deletion authority
- Resource scheduling
- Client management
- Reporting

**Use Case:** Project managers, delivery managers

---

### 9. Knowledge Manager
**Role Name:** `knowledge_manager`
**Display Name:** Knowledge Manager
**Color:** Sky Blue (#0369a1)
**Icon:** BookOpen

**Description:** Knowledge base specialist for content curation, approval, and portal management

**Permissions:** 13 permissions including:
- Full knowledge base management
- Article deletion authority
- Publishing authority
- Portal content management
- Content reporting

**Use Case:** Knowledge managers, content curators

---

### 10. End User
**Role Name:** `end_user`
**Display Name:** End User
**Color:** Green (#16a34a)
**Icon:** User

**Description:** Standard user with basic access to create tickets and view own items

**Permissions:** 9 permissions including:
- View own tickets
- Create tickets and service requests
- Comment on tickets
- View own projects and schedule
- View knowledge base

**Use Case:** Standard employees, internal users

---

### 11. Read Only
**Role Name:** `read_only`
**Display Name:** Read Only
**Color:** Slate (#64748b)
**Icon:** Eye

**Description:** View-only access for auditors, observers, and reporting purposes

**Permissions:** 9 permissions including:
- View all tickets
- View all assets, projects, users, clients
- View schedules and reports
- View settings
- No create/edit/delete access

**Use Case:** Auditors, compliance officers, stakeholders

---

## Permission Categories

The system includes **69 unique permissions** across 12 modules:

### Tickets Module (23 permissions)
- View (own/assigned/all)
- Create, Edit (own/all), Delete
- Assign, Close, Reopen, Comment
- Type-specific: Incident, Change, Service Request, Problem management

### Assets Module (6 permissions)
- View, Create, Edit, Delete
- Manage lifecycle
- Remote control access

### Projects Module (7 permissions)
- View (own/all)
- Create, Edit (own/all), Delete
- Manage tasks and milestones

### Knowledge Base Module (7 permissions)
- View, Create, Edit (own/all), Delete
- Publish as public

### Users Module (5 permissions)
- View, Create, Edit, Delete
- Manage roles and permissions

### Roles Module (5 permissions)
- View, Create, Edit, Delete
- Assign to users

### Clients Module (5 permissions)
- View, Create, Edit, Delete
- Manage contracts

### Schedule Module (5 permissions)
- View (own/all)
- Create, Edit, Delete

### Reports Module (3 permissions)
- View, Create, Export

### Settings Module (3 permissions)
- View, Edit, Manage advanced

### Portal Module (7 permissions)
- View, Create, Edit, Publish, Delete
- Theme editing, Data source management

---

## Automatic Role Seeding

### For New Organizations
When a new organization signs up:
1. **11 ITSM roles are automatically created** for the organization
2. **First user is assigned System Administrator role** with full permissions
3. Roles are immediately available in User Management

### For Existing Organizations
A migration script has been run to:
1. Delete legacy roles (admin, technician, user)
2. Create all 11 ITSM roles
3. Migrate existing users:
   - `admin` → `system_administrator`
   - `technician` → `service_desk_agent`
   - `user` → `end_user`

---

## Implementation Details

### Signup Flow
File: `src/app/api/auth/signup/route.ts`

```typescript
// Automatically seed RBAC roles for the new organization
await RoleService.seedDefaultRoles(orgId)

// Get the System Administrator role ID
systemAdminRoleId = await RoleService.getDefaultRoleId(orgId, 'system_administrator')

// Create admin user with System Administrator role
const user = await UserService.createUser({
  email: validatedData.email,
  password: validatedData.password,
  firstName: validatedData.firstName,
  lastName: validatedData.lastName,
  role: 'admin', // Legacy role for backward compatibility
  roleId: systemAdminRoleId, // RBAC role ID (System Administrator)
  orgId,
  createdBy: 'system',
})
```

### Permission Service
File: `src/lib/services/permissions.ts`

- **getITSMRolePermissions()** - Returns all permissions for a specific ITSM role
- **getLegacyRolePermissions()** - Backward compatibility mapper
- **getUserPermissions()** - Fetches user's effective permissions from role + overrides

### Role Service
File: `src/lib/services/roles.ts`

- **getDefaultRoles()** - Returns all 11 ITSM roles for seeding
- **seedDefaultRoles()** - Creates ITSM roles for an organization
- **migrateUsersToRBAC()** - Migrates legacy users to ITSM roles

### Authentication
File: `src/lib/auth.ts`

Permissions are **cached in JWT token** during login:
```typescript
async jwt({ token, user }) {
  if (user) {
    // Fetch and cache user permissions in JWT token
    const permissions = await PermissionService.getUserPermissions(
      user.id,
      user.orgId
    )
    token.permissions = permissions
  }
  return token
}
```

**Important:** Users must **log out and log back in** after role changes to refresh their JWT token with updated permissions.

---

## Permission Checking

### In API Routes
```typescript
import { requirePermission, requireAnyPermission } from '@/lib/middleware/permissions'

// Check single permission
if (!await requirePermission(session, 'tickets.view.all')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Check any of multiple permissions
if (!await requireAnyPermission(session, ['tickets.view.all', 'tickets.view.own'])) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### Permission Format
Format: `{module}.{action}.{scope?}`

Examples:
- `tickets.view.all` - View all tickets
- `tickets.view.own` - View only own tickets
- `tickets.create` - Create tickets
- `assets.remoteControl` - Remote control assets
- `users.manage` - Manage users

---

## User Management UI

The User Management page (`/settings/users`) displays:
- **Roles & Permissions tab** showing all 11 ITSM roles
- Color-coded role badges
- Permission counts per role
- User assignment capabilities
- Role cloning for custom roles

---

## Migration Scripts

### migrate-to-itsm-roles.ts
Located in: `scripts/migrate-to-itsm-roles.ts`

Purpose: Migrate existing organizations from legacy 3-role system to new 11-role ITSM structure

```bash
npx tsx scripts/migrate-to-itsm-roles.ts
```

Actions:
1. Deletes legacy roles (admin, technician, user)
2. Creates 11 ITSM roles with proper permissions
3. Migrates all users to equivalent ITSM roles
4. Updates roleId field on all user documents

---

## ITIL Compliance

The RBAC system aligns with ITIL v4 practices:

- **Incident Management:** Service Desk Agent, Technical Lead
- **Problem Management:** Problem Manager with KEDB access
- **Change Management:** Change Manager with CAB coordination
- **Service Request Fulfillment:** Service Desk Agent with approval workflows
- **Asset Management:** Asset Manager with lifecycle tracking
- **Knowledge Management:** Knowledge Manager with publishing authority

---

## Best Practices

### Role Assignment
1. **System Administrator:** Only for organization owners and platform admins
2. **Service Desk Manager:** For team leads who manage queues and SLAs
3. **Service Desk Agent:** For front-line support staff
4. **Technical Lead:** For senior technicians handling escalations
5. **Specialists:** Assign specialized roles (Problem Manager, Change Manager, etc.) based on ITIL functions
6. **End User:** For all standard employees
7. **Read Only:** For stakeholders, auditors, compliance officers

### Permission Overrides
- Use sparingly - roles should cover most scenarios
- Document reason for override
- Set expiration dates for temporary access
- Review overrides regularly

### Custom Roles
- Clone existing roles as starting point
- Follow naming convention: `custom_{purpose}`
- Document custom role purpose
- Review custom roles quarterly

---

## Troubleshooting

### User can't view tickets after creation
**Cause:** Session JWT token has old permissions
**Fix:** Log out and log back in to refresh JWT token

### Permission denied despite having role
**Cause:** Role might not have the specific permission
**Fix:** Check role permissions in User Management, add permission if needed

### Roles not showing in dropdown
**Cause:** Roles not seeded for organization
**Fix:** Run `npx tsx scripts/migrate-to-itsm-roles.ts`

### First signup user doesn't have full access
**Cause:** Role seeding failed during signup
**Fix:** Manually assign System Administrator role in User Management

---

## Database Collections

### roles
- `orgId` - Organization ID
- `name` - Internal role name (e.g., `system_administrator`)
- `displayName` - User-facing name (e.g., "System Administrator")
- `description` - Role description
- `permissions` - Array of permission keys
- `isSystem` - System role (cannot be deleted)
- `isActive` - Soft delete flag
- `color` - Display color (hex)
- `icon` - Lucide icon name

### users
- `roleId` - Reference to roles collection (RBAC)
- `role` - Legacy role field (admin/technician/user)
- `permissionOverrides` - User-specific permission grants/revokes

---

## Migration Summary

**Date:** January 2025
**Organizations Migrated:** 7
**Users Migrated:** 3
**Roles Created:** 77 total (11 roles × 7 orgs)

**Migration Mapping:**
- admin (legacy) → system_administrator (ITSM)
- technician (legacy) → service_desk_agent (ITSM)
- user (legacy) → end_user (ITSM)

**Permission Expansion:**
- Legacy admin: ~60 permissions → System Administrator: 69 permissions
- Legacy technician: ~35 permissions → Service Desk Agent: 29 permissions (more focused)
- Legacy user: ~9 permissions → End User: 9 permissions (same)

---

## Future Enhancements

### Planned Features
- [ ] Role templates for different organization types (MSP vs Internal IT)
- [ ] Permission bundles for quick role customization
- [ ] Role analytics and usage reporting
- [ ] Automated role suggestions based on user activity
- [ ] Time-based role activation (e.g., on-call rotation)
- [ ] Multi-role support (users can have multiple roles)
- [ ] Department-scoped roles
- [ ] Client-specific role restrictions (MSP mode)

### Advanced RBAC
- [ ] Resource-based permissions (per-client, per-project)
- [ ] Conditional permissions (time-based, location-based)
- [ ] Delegation workflows
- [ ] Approval chains per role
- [ ] SLA enforcement per role
- [ ] Queue-based routing per role

---

## Support

For questions or issues with the RBAC system:
1. Check this documentation first
2. Review permission mappings in `src/lib/services/permissions.ts`
3. Check role definitions in `src/lib/services/roles.ts`
4. Test with System Administrator role to isolate permission issues

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Status:** Production Ready ✅
