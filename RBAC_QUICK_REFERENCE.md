# RBAC System Quick Reference

This is a concise reference guide for the Deskwise ITSM RBAC system. For complete details, see [RBAC_SYSTEM_DESIGN.md](./RBAC_SYSTEM_DESIGN.md).

---

## Quick Stats

- **15 Modules** (Dashboard, Tickets, Incidents, Projects, Assets, etc.)
- **120+ Granular Permissions**
- **3 System Roles** + Unlimited Custom Roles
- **4 Permission Scopes** (own, assigned, team, all)
- **Sub-5ms Permission Checks** (JWT-cached)

---

## Permission Key Format

```
{module}.{action}.{scope}

Examples:
✓ tickets.view.all       → View all tickets
✓ tickets.view.assigned  → View assigned tickets only
✓ tickets.view.own       → View own tickets only
✓ tickets.create         → Create tickets
✓ tickets.delete         → Delete tickets
✓ *.*                    → All permissions (admin wildcard)
```

---

## System Roles

### Admin
- **Permissions:** `*.*` (wildcard = all permissions)
- **Use Case:** IT Managers, System Administrators
- **Cannot Delete:** Yes

### Technician
- **Permissions:** ~80 permissions (service desk operations)
- **Use Case:** Help Desk Technicians, Field Engineers
- **Key Permissions:**
  - View/Edit/Assign tickets
  - Manage incidents
  - View/Create projects
  - Manage assets
  - Remote control access
- **Cannot Delete:** Yes

### User
- **Permissions:** ~25 permissions (end user access)
- **Use Case:** Employees, End Users
- **Key Permissions:**
  - Create/View own tickets
  - Submit service requests
  - View public incidents & KB articles
  - View own profile
- **Cannot Delete:** Yes

---

## Permission Evaluation Flow

```
1. User-Level Override → GRANTED or DENIED
   ↓ (if not present)
2. Custom Permissions → GRANTED
   ↓ (if not present)
3. Role Permissions → GRANTED
   ↓ (if not present)
4. Default → DENIED (Least Privilege)
```

---

## Code Snippets

### API Route Protection

```typescript
import { requirePermission } from '@/lib/rbac/middleware'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Permission check
  if (!await requirePermission('tickets.delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ... proceed with operation
}
```

### Frontend Permission Check

```typescript
import { usePermission } from '@/lib/rbac/hooks'

function TicketActions() {
  const canDelete = usePermission('tickets.delete')

  return (
    <div>
      {canDelete && (
        <Button onClick={handleDelete}>Delete</Button>
      )}
    </div>
  )
}
```

### Protected Component

```typescript
import { ProtectedComponent } from '@/components/rbac/protected'

<ProtectedComponent permission="users.create">
  <CreateUserButton />
</ProtectedComponent>
```

---

## Common Permission Patterns

### Module-Level Wildcard
```typescript
'tickets.*'  → All ticket permissions
'assets.*'   → All asset permissions
```

### View Permissions by Scope
```typescript
'tickets.view.all'       → View all tickets
'tickets.view.assigned'  → View assigned tickets
'tickets.view.own'       → View own tickets
```

### Create/Edit/Delete
```typescript
'tickets.create'      → Create tickets
'tickets.edit.all'    → Edit any ticket
'tickets.edit.own'    → Edit own tickets
'tickets.delete'      → Delete tickets
```

---

## Database Collections

```
RBAC Collections:
├── roles                    (System + Custom roles)
├── permissions              (All available permissions)
├── user_permissions         (User-level overrides)
└── role_assignment_history  (Audit trail)

Modified:
└── users (added roleId, customPermissions fields)
```

---

## Permission Service Methods

```typescript
// Check permission
PermissionService.checkPermission(userId, orgId, 'tickets.delete')

// Get all user permissions (for JWT)
PermissionService.getUserPermissions(userId, orgId)

// Grant temporary permission
PermissionService.grantPermission(userId, orgId, 'tickets.delete', adminId, {
  expiresAt: new Date('2024-12-31'),
  reason: 'Temporary cleanup project'
})

// Revoke permission
PermissionService.revokePermission(userId, orgId, 'changes.approve', adminId)

// Assign role
PermissionService.assignRole(userId, orgId, roleId, adminId, 'Promotion')

// Create custom role
PermissionService.createRole(orgId, {
  name: 'senior_tech',
  displayName: 'Senior Technician',
  description: 'Technician with approval rights',
  permissions: ['tickets.*', 'changes.approve']
}, adminId)
```

---

## Permission Matrix by Role

| Module | Permission | Admin | Tech | User |
|--------|-----------|-------|------|------|
| **Tickets** |
| | view.all | ✓ | ✓ | ✗ |
| | view.own | ✓ | ✓ | ✓ |
| | create | ✓ | ✓ | ✓ |
| | edit.all | ✓ | ✓ | ✗ |
| | delete | ✓ | ✗ | ✗ |
| | assign | ✓ | ✓ | ✗ |
| **Changes** |
| | view.all | ✓ | ✓ | ✗ |
| | create | ✓ | ✓ | ✗ |
| | approve | ✓ | ✗ | ✗ |
| | reject | ✓ | ✗ | ✗ |
| **Assets** |
| | view.all | ✓ | ✓ | ✗ |
| | create | ✓ | ✓ | ✗ |
| | delete | ✓ | ✗ | ✗ |
| **Users** |
| | view.all | ✓ | ✓ | ✗ |
| | create | ✓ | ✗ | ✗ |
| | delete | ✓ | ✗ | ✗ |
| | manageRoles | ✓ | ✗ | ✗ |

**Full matrix:** See [RBAC_SYSTEM_DESIGN.md](./RBAC_SYSTEM_DESIGN.md#41-complete-permission-list)

---

## Implementation Checklist

### Phase 1: Database & Core (Week 1)
- [ ] Create collections (`roles`, `permissions`, `user_permissions`, `role_assignment_history`)
- [ ] Add indexes for performance
- [ ] Seed system permissions (120+)
- [ ] Seed system roles (admin, technician, user)
- [ ] Implement `PermissionService`
- [ ] Write unit tests (90%+ coverage)

### Phase 2: NextAuth Integration (Week 2)
- [ ] Enhance JWT with permissions
- [ ] Update session callback
- [ ] Implement permission caching
- [ ] Test session generation

### Phase 3: API Protection (Week 2-3)
- [ ] Create middleware functions
- [ ] Update API routes (40+ files)
- [ ] Add resource-scoped checks
- [ ] Test all endpoints

### Phase 4: Frontend (Week 3)
- [ ] Create `usePermission()` hook
- [ ] Create `ProtectedComponent`
- [ ] Update UI components
- [ ] Test responsive behavior

### Phase 5: Admin UI (Week 4)
- [ ] Role management page
- [ ] Permission management page
- [ ] User assignment interface
- [ ] Audit log viewer

### Phase 6: Testing (Week 5)
- [ ] E2E tests
- [ ] Performance benchmarks
- [ ] Security audit
- [ ] Documentation

---

## Performance Targets

- **Permission Check Latency:** <5ms (p95, JWT-cached)
- **Cache Hit Rate:** >95%
- **Database Query Time:** <10ms (p95, for cache miss)
- **JWT Token Size:** <2KB (includes 50+ permissions)

---

## Security Checklist

- [x] Multi-tenant isolation (orgId filter on all queries)
- [x] JWT-based permission caching
- [x] Permission version tracking (cache invalidation)
- [x] System role protection (cannot delete/modify)
- [x] Permission validation (against available permissions)
- [x] Role assignment audit trail
- [x] Override expiration support
- [x] Least privilege default (deny unknown permissions)
- [x] Input validation (permission keys, role names)
- [x] Audit logging (90-day retention)

---

## Migration Steps

1. **Backup Database**
   ```bash
   mongodump --uri="$MONGODB_URI" --out=./backup
   ```

2. **Run Migration Script**
   ```bash
   npm run migrate:rbac
   ```

3. **Seed System Data**
   ```bash
   npm run seed:rbac
   ```

4. **Migrate Existing Users**
   ```bash
   npm run migrate:users-to-rbac
   ```

5. **Verify Migration**
   ```bash
   npm run verify:rbac
   ```

6. **Enable RBAC Feature Flag**
   ```bash
   RBAC_ENABLED=true
   ```

---

## Troubleshooting

### Permission Check Returning False

1. Check user's role assignment:
   ```typescript
   const user = await db.collection('users').findOne({ _id: userId })
   console.log('User roleId:', user.roleId)
   ```

2. Check role permissions:
   ```typescript
   const role = await db.collection('roles').findOne({ _id: user.roleId })
   console.log('Role permissions:', role.permissions)
   ```

3. Check user overrides:
   ```typescript
   const overrides = await db.collection('user_permissions').find({ userId }).toArray()
   console.log('User overrides:', overrides)
   ```

### JWT Token Too Large

- Reduce number of custom permissions
- Use wildcard permissions (`tickets.*` instead of listing all)
- Consider Redis caching for large permission sets

### Permission Check Slow

- Verify JWT contains cached permissions
- Check database indexes are created
- Monitor cache hit rate
- Consider adding Redis layer

---

## Support Resources

- **Full Design Doc:** [RBAC_SYSTEM_DESIGN.md](./RBAC_SYSTEM_DESIGN.md)
- **Permission Matrix:** Section 4.1 in design doc
- **Code Examples:** Section 8 in design doc
- **Testing Guide:** Section 10 in design doc

---

**Last Updated:** 2025-10-12
**Version:** 1.0
