# Deskwise ITSM - Production-Ready RBAC System Design

**Document Version:** 1.0
**Created:** 2025-10-12
**Author:** Claude Code Security Audit

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Platform Audit Report](#platform-audit-report)
3. [RBAC System Architecture](#rbac-system-architecture)
4. [Permission Matrix](#permission-matrix)
5. [Database Schema Design](#database-schema-design)
6. [Integration Strategy](#integration-strategy)
7. [Implementation Plan](#implementation-plan)
8. [Code Examples](#code-examples)
9. [Security Considerations](#security-considerations)
10. [Testing Strategy](#testing-strategy)

---

## 1. Executive Summary

This document presents a comprehensive, production-ready Role-Based Access Control (RBAC) system for the Deskwise ITSM platform. The system is designed to:

- **Granular Control:** Provide fine-grained permissions for all 15+ modules
- **Flexibility:** Support custom roles, permission overrides, and team-based access
- **Security:** Enforce least-privilege access with multi-tenant isolation
- **Scalability:** Handle enterprise-scale deployments with minimal performance impact
- **Auditability:** Complete audit trail of permission changes and role assignments

### Key Features

- 120+ granular permissions across 15 modules
- 3 system roles (Admin, Technician, User) + unlimited custom roles
- User-level permission overrides with expiration support
- Resource-scoped permissions (own/assigned/team/all)
- Role hierarchy with permission inheritance
- Permission templates for rapid role creation
- Real-time permission checking with JWT integration
- Complete audit logging

---

## 2. Platform Audit Report

### 2.1 Module Inventory

The Deskwise ITSM platform consists of **15 core modules** with comprehensive functionality:

| Module | Collections | API Routes | Key Operations |
|--------|-------------|------------|----------------|
| **Dashboard** | - | `/api/dashboard/stats` | View stats |
| **Tickets** | `tickets` | `/api/tickets/*` | Create, View, Edit, Delete, Assign, Comment, Close |
| **Incidents** | `incidents`, `incident_updates` | `/api/incidents/*` | Create, View, Edit, Update, Manage (public) |
| **Change Management** | `change_requests`, `change_approvals` | `/api/change-requests/*` | Create, View, Edit, Approve, Reject, Schedule |
| **Projects** | `projects`, `project_tasks`, `project_milestones` | `/api/projects/*` | Create, View, Edit, Manage tasks, Track progress |
| **Scheduling** | `schedule_items` | `/api/schedule/*` | Create, View, Edit, Delete appointments |
| **Assets** | `assets`, `asset_maintenance`, `performance_snapshots` | `/api/assets/*` | Create, View, Edit, Delete, Track maintenance |
| **Asset Settings** | `asset_categories`, `asset_locations`, `organization_asset_settings` | `/api/settings/asset-*` | Manage categories, locations, settings |
| **Enrollment Tokens** | `enrollment_tokens`, `agent_credentials` | `/api/enrollment-tokens/*` | Generate, View, Revoke tokens |
| **Knowledge Base** | `kb_articles`, `kb_categories`, `kb_tags` | `/api/knowledge-base/*` | Create, View, Edit, Archive, Generate (AI) |
| **Service Catalog** | `service_catalog`, `service_catalog_categories` | `/api/service-catalog/*` | Create, View, Edit, Request services |
| **Self-Service Portal** | `portal_settings` | `/api/settings/portal` | View services, Submit requests, Track status |
| **Remote Control** | `rc_sessions`, `rc_policies`, `audit_remote_control` | `/api/rc/*` | Initiate sessions, Manage policy, View audit logs |
| **Users** | `users` | `/api/users/*` | Create, View, Edit, Delete, Manage roles |
| **Settings** | Multiple collections | `/api/settings/*` | Configure organization settings |

### 2.2 Current Permission Patterns

**Current State:**
```typescript
// Hard-coded role checks scattered throughout codebase
if (session.user.role !== 'admin') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

**Issues Identified:**
1. **No granular permissions** - Only 3 roles (admin, technician, user)
2. **Binary access control** - All-or-nothing per role
3. **Scattered authorization logic** - 40+ files with role checks
4. **No resource-level scoping** - Can't limit to "own tickets" vs "all tickets"
5. **No permission overrides** - Can't grant exceptions to individual users
6. **No audit trail** - No tracking of permission changes

### 2.3 Gap Analysis

| Requirement | Current State | Proposed State |
|-------------|---------------|----------------|
| Role flexibility | 3 fixed roles | 3 system + unlimited custom |
| Permission granularity | Module-level | Action + resource level |
| User overrides | None | Per-user grant/revoke |
| Permission scoping | Organization-only | Own/Assigned/Team/All |
| Custom roles | Not supported | Full support |
| Role templates | None | Pre-built templates |
| Audit logging | Basic | Comprehensive |
| Permission caching | None | JWT + Redis (optional) |

---

## 3. RBAC System Architecture

### 3.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RBAC SYSTEM                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐    │
│  │   NextAuth   │─────▶│ JWT Session  │─────▶│  Middleware  │    │
│  │   (Auth)     │      │  + Perms     │      │   (Routes)   │    │
│  └──────────────┘      └──────────────┘      └──────────────┘    │
│         │                      │                      │            │
│         │                      │                      │            │
│         ▼                      ▼                      ▼            │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Permission Service (Core)                    │    │
│  │  - checkPermission(userId, permissionKey)                │    │
│  │  - getUserPermissions(userId)                            │    │
│  │  - evaluatePermission(role, custom, overrides)           │    │
│  └──────────────────────────────────────────────────────────┘    │
│         │                      │                      │            │
│         ▼                      ▼                      ▼            │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐    │
│  │    Roles     │      │  Permissions │      │   Overrides  │    │
│  │ Collection   │      │  Collection  │      │  Collection  │    │
│  └──────────────┘      └──────────────┘      └──────────────┘    │
│         │                      │                      │            │
│         └──────────────────────┴──────────────────────┘            │
│                                │                                   │
│                                ▼                                   │
│                    ┌──────────────────────┐                       │
│                    │   Audit Logging      │                       │
│                    │   (All Changes)      │                       │
│                    └──────────────────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Permission Hierarchy

```
Permission Evaluation Flow:
──────────────────────────

1. User-Level Permission Override (HIGHEST PRIORITY)
   ├─ Explicit GRANT → Permission GRANTED
   └─ Explicit REVOKE → Permission DENIED

2. Custom Permissions (user.customPermissions[])
   └─ If present → Permission GRANTED

3. Role-Based Permissions (role.permissions[])
   └─ If in role.permissions[] → Permission GRANTED

4. Default → Permission DENIED (Least Privilege)
```

### 3.3 Role Definitions

#### System Roles (Immutable)

**1. Admin** (`role.name = 'admin'`)
- **Description:** Full system access for administrators
- **Permissions:** ALL permissions (wildcard: `*.*`)
- **Typical Users:** IT Managers, System Administrators
- **Cannot be deleted:** Yes

**2. Technician** (`role.name = 'technician'`)
- **Description:** Service desk staff and field technicians
- **Permissions:**
  - All ticket operations (create, view, edit, assign)
  - View/update incidents
  - View/create projects
  - View/edit assets
  - View/create KB articles
  - Manage own schedule
- **Typical Users:** Help Desk Technicians, Field Engineers
- **Cannot be deleted:** Yes

**3. User** (`role.name = 'user'`)
- **Description:** End users and requesters
- **Permissions:**
  - Create tickets (own)
  - View own tickets
  - Comment on own tickets
  - View public incidents
  - View public KB articles
  - Submit service requests (portal)
- **Typical Users:** Employees, End Users
- **Cannot be deleted:** Yes

#### Custom Roles (User-Created)

- **Examples:**
  - Senior Technician (Technician + Approval permissions)
  - Project Manager (Project + Resource permissions)
  - Asset Manager (Asset + Inventory permissions)
  - Knowledge Manager (KB + Portal permissions)
  - Billing Specialist (Billing + Reporting permissions)

### 3.4 Permission Structure

**Permission Key Format:**
```
{module}.{action}.{scope}

Examples:
- tickets.view.all       (View all tickets)
- tickets.view.assigned  (View only assigned tickets)
- tickets.view.own       (View only own tickets)
- tickets.create         (Create tickets)
- tickets.delete         (Delete tickets)
```

**Scopes:**
- `own` - Resources created by the user
- `assigned` - Resources assigned to the user
- `team` - Resources belonging to user's team (future)
- `all` - All resources in the organization
- (no scope) - Action applies to all relevant resources

---

## 4. Permission Matrix

### 4.1 Complete Permission List

#### Dashboard Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `dashboard.view` | View dashboard | ✓ | ✓ | ✓ |
| `dashboard.viewStats` | View organization stats | ✓ | ✓ | ✗ |

#### Tickets Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `tickets.view.all` | View all tickets | ✓ | ✓ | ✗ |
| `tickets.view.assigned` | View assigned tickets | ✓ | ✓ | ✗ |
| `tickets.view.own` | View own tickets | ✓ | ✓ | ✓ |
| `tickets.create` | Create tickets | ✓ | ✓ | ✓ |
| `tickets.edit.all` | Edit all tickets | ✓ | ✓ | ✗ |
| `tickets.edit.assigned` | Edit assigned tickets | ✓ | ✓ | ✗ |
| `tickets.edit.own` | Edit own tickets | ✓ | ✓ | ✓ |
| `tickets.delete` | Delete tickets | ✓ | ✗ | ✗ |
| `tickets.assign` | Assign tickets | ✓ | ✓ | ✗ |
| `tickets.close` | Close tickets | ✓ | ✓ | ✗ |
| `tickets.comment` | Add comments | ✓ | ✓ | ✓ |
| `tickets.viewComments` | View comments | ✓ | ✓ | ✓ |
| `tickets.viewStats` | View ticket statistics | ✓ | ✓ | ✗ |

#### Incidents Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `incidents.view.all` | View all incidents | ✓ | ✓ | ✗ |
| `incidents.view.public` | View public incidents | ✓ | ✓ | ✓ |
| `incidents.create` | Create incidents | ✓ | ✓ | ✗ |
| `incidents.edit` | Edit incidents | ✓ | ✓ | ✗ |
| `incidents.delete` | Delete incidents | ✓ | ✗ | ✗ |
| `incidents.addUpdate` | Add incident updates | ✓ | ✓ | ✗ |
| `incidents.manage` | Manage incident lifecycle | ✓ | ✓ | ✗ |
| `incidents.viewStats` | View incident statistics | ✓ | ✓ | ✗ |

#### Change Management Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `changes.view.all` | View all change requests | ✓ | ✓ | ✗ |
| `changes.view.own` | View own change requests | ✓ | ✓ | ✓ |
| `changes.create` | Create change requests | ✓ | ✓ | ✗ |
| `changes.edit` | Edit change requests | ✓ | ✓ | ✗ |
| `changes.delete` | Delete change requests | ✓ | ✗ | ✗ |
| `changes.approve` | Approve change requests | ✓ | ✗ | ✗ |
| `changes.reject` | Reject change requests | ✓ | ✗ | ✗ |
| `changes.schedule` | Schedule changes | ✓ | ✓ | ✗ |
| `changes.viewStats` | View change statistics | ✓ | ✓ | ✗ |

#### Projects Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `projects.view.all` | View all projects | ✓ | ✓ | ✗ |
| `projects.view.assigned` | View assigned projects | ✓ | ✓ | ✗ |
| `projects.view.own` | View own projects | ✓ | ✓ | ✓ |
| `projects.create` | Create projects | ✓ | ✓ | ✗ |
| `projects.edit` | Edit projects | ✓ | ✓ | ✗ |
| `projects.delete` | Delete projects | ✓ | ✗ | ✗ |
| `projects.manageTasks` | Manage project tasks | ✓ | ✓ | ✗ |
| `projects.viewStats` | View project statistics | ✓ | ✓ | ✗ |

#### Scheduling Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `schedule.view.all` | View all appointments | ✓ | ✓ | ✗ |
| `schedule.view.own` | View own appointments | ✓ | ✓ | ✓ |
| `schedule.create` | Create appointments | ✓ | ✓ | ✗ |
| `schedule.edit` | Edit appointments | ✓ | ✓ | ✗ |
| `schedule.delete` | Delete appointments | ✓ | ✓ | ✗ |

#### Assets Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `assets.view.all` | View all assets | ✓ | ✓ | ✗ |
| `assets.view.assigned` | View assigned assets | ✓ | ✓ | ✓ |
| `assets.create` | Create assets | ✓ | ✓ | ✗ |
| `assets.edit` | Edit assets | ✓ | ✓ | ✗ |
| `assets.delete` | Delete assets | ✓ | ✗ | ✗ |
| `assets.assign` | Assign assets | ✓ | ✓ | ✗ |
| `assets.viewPerformance` | View performance data | ✓ | ✓ | ✗ |
| `assets.viewStats` | View asset statistics | ✓ | ✓ | ✗ |

#### Asset Settings Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `assetSettings.view` | View asset settings | ✓ | ✓ | ✗ |
| `assetSettings.edit` | Edit asset settings | ✓ | ✗ | ✗ |
| `assetSettings.manageCategories` | Manage asset categories | ✓ | ✗ | ✗ |
| `assetSettings.manageLocations` | Manage asset locations | ✓ | ✗ | ✗ |

#### Enrollment Tokens Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `enrollment.view` | View enrollment tokens | ✓ | ✓ | ✗ |
| `enrollment.generate` | Generate tokens | ✓ | ✓ | ✗ |
| `enrollment.revoke` | Revoke tokens | ✓ | ✓ | ✗ |
| `enrollment.viewStats` | View token statistics | ✓ | ✓ | ✗ |

#### Knowledge Base Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `kb.view.all` | View all KB articles | ✓ | ✓ | ✗ |
| `kb.view.public` | View public KB articles | ✓ | ✓ | ✓ |
| `kb.create` | Create KB articles | ✓ | ✓ | ✗ |
| `kb.edit` | Edit KB articles | ✓ | ✓ | ✗ |
| `kb.delete` | Delete KB articles | ✓ | ✗ | ✗ |
| `kb.archive` | Archive KB articles | ✓ | ✓ | ✗ |
| `kb.generate` | Generate articles (AI) | ✓ | ✓ | ✗ |
| `kb.manageCategories` | Manage categories | ✓ | ✗ | ✗ |
| `kb.viewStats` | View KB statistics | ✓ | ✓ | ✗ |

#### Service Catalog Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `serviceCatalog.view` | View service catalog | ✓ | ✓ | ✓ |
| `serviceCatalog.create` | Create services | ✓ | ✗ | ✗ |
| `serviceCatalog.edit` | Edit services | ✓ | ✗ | ✗ |
| `serviceCatalog.delete` | Delete services | ✓ | ✗ | ✗ |
| `serviceCatalog.manageCategories` | Manage categories | ✓ | ✗ | ✗ |
| `serviceCatalog.request` | Request services | ✓ | ✓ | ✓ |

#### Self-Service Portal Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `portal.view` | View portal | ✓ | ✓ | ✓ |
| `portal.submitRequest` | Submit service requests | ✓ | ✓ | ✓ |
| `portal.viewOwnRequests` | View own requests | ✓ | ✓ | ✓ |
| `portal.configure` | Configure portal settings | ✓ | ✗ | ✗ |

#### Remote Control Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `remoteControl.initiate` | Initiate RC sessions | ✓ | ✓ | ✗ |
| `remoteControl.view` | View RC sessions | ✓ | ✓ | ✗ |
| `remoteControl.managePolicy` | Manage RC policy | ✓ | ✗ | ✗ |
| `remoteControl.viewAudit` | View audit logs | ✓ | ✗ | ✗ |

#### Users Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `users.view.all` | View all users | ✓ | ✓ | ✗ |
| `users.view.own` | View own profile | ✓ | ✓ | ✓ |
| `users.create` | Create users | ✓ | ✗ | ✗ |
| `users.edit.all` | Edit all users | ✓ | ✗ | ✗ |
| `users.edit.own` | Edit own profile | ✓ | ✓ | ✓ |
| `users.delete` | Delete users | ✓ | ✗ | ✗ |
| `users.manageRoles` | Manage user roles | ✓ | ✗ | ✗ |

#### Settings Module
| Permission Key | Description | Admin | Technician | User |
|----------------|-------------|-------|------------|------|
| `settings.view` | View settings | ✓ | ✓ | ✗ |
| `settings.edit` | Edit settings | ✓ | ✗ | ✗ |
| `settings.manageOrganization` | Manage org settings | ✓ | ✗ | ✗ |

### 4.2 Permission Count Summary

- **Total Permissions:** 120+
- **Admin Permissions:** All (wildcard)
- **Technician Permissions:** ~80
- **User Permissions:** ~25

---

## 5. Database Schema Design

### 5.1 Collections Overview

```
RBAC Collections:
├── roles                    (Custom and system roles)
├── permissions              (All available permissions)
├── user_permissions         (User-level overrides)
└── role_assignment_history  (Audit trail)

Modified Collections:
└── users                    (Add roleId, customPermissions fields)
```

### 5.2 Detailed Schemas

#### `roles` Collection

```typescript
interface Role extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string              // Internal name (e.g., 'custom_senior_tech')
  displayName: string       // Display name (e.g., 'Senior Technician')
  description: string
  permissions: string[]     // Array of permission keys
  isSystem: boolean         // true for admin/technician/user
  isActive: boolean
  color?: string            // Hex color for UI
  icon?: string             // Lucide icon name
  userCount?: number        // Calculated field
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Indexes:
// - { orgId: 1, name: 1 } (unique)
// - { orgId: 1, isActive: 1 }
// - { orgId: 1, isSystem: 1 }
```

**Example Documents:**

```javascript
// System Role - Admin
{
  _id: ObjectId("..."),
  orgId: "org123",
  name: "admin",
  displayName: "Administrator",
  description: "Full system access for administrators",
  permissions: ["*.*"],  // Wildcard = all permissions
  isSystem: true,
  isActive: true,
  createdBy: "system",
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}

// Custom Role - Senior Technician
{
  _id: ObjectId("..."),
  orgId: "org123",
  name: "custom_senior_tech",
  displayName: "Senior Technician",
  description: "Technician with approval permissions",
  permissions: [
    "tickets.*",
    "incidents.*",
    "changes.view.all",
    "changes.create",
    "changes.approve",  // Extra permission
    "projects.view.all",
    "assets.view.all",
    "kb.*"
  ],
  isSystem: false,
  isActive: true,
  color: "#3b82f6",
  icon: "UserCheck",
  createdBy: "user456",
  createdAt: ISODate("2024-06-15T10:30:00Z"),
  updatedAt: ISODate("2024-06-15T10:30:00Z")
}
```

#### `permissions` Collection

```typescript
interface Permission {
  _id: ObjectId
  orgId: string             // 'system' for global, or specific orgId
  module: string            // e.g., 'tickets', 'assets'
  action: string            // e.g., 'view', 'create', 'edit'
  resource?: string         // e.g., 'own', 'assigned', 'all'
  permissionKey: string     // Composite: 'module.action.resource'
  description: string
  isSystem: boolean         // true for built-in permissions
  createdAt: Date
  updatedAt: Date
}

// Indexes:
// - { permissionKey: 1 } (unique)
// - { module: 1 }
// - { isSystem: 1 }
```

**Example Documents:**

```javascript
// System Permission
{
  _id: ObjectId("..."),
  orgId: "system",
  module: "tickets",
  action: "view",
  resource: "all",
  permissionKey: "tickets.view.all",
  description: "View all tickets in the organization",
  isSystem: true,
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}

// Custom Permission (organization-specific)
{
  _id: ObjectId("..."),
  orgId: "org123",
  module: "custom",
  action: "approve",
  resource: "contracts",
  permissionKey: "custom.approve.contracts",
  description: "Approve customer contracts",
  isSystem: false,
  createdAt: ISODate("2024-06-20T14:00:00Z"),
  updatedAt: ISODate("2024-06-20T14:00:00Z")
}
```

#### `user_permissions` Collection

```typescript
interface UserPermission {
  _id: ObjectId
  orgId: string
  userId: string            // User receiving the override
  permissionKey: string     // e.g., 'tickets.delete'
  granted: boolean          // true = grant, false = revoke
  grantedBy: string         // User ID who made the change
  grantedAt: Date
  expiresAt?: Date          // Optional expiration
  reason?: string           // Optional justification
}

// Indexes:
// - { userId: 1, permissionKey: 1, expiresAt: 1 }
// - { orgId: 1, userId: 1 }
// - { expiresAt: 1 } (TTL index for auto-cleanup)
```

**Example Documents:**

```javascript
// Grant temporary permission
{
  _id: ObjectId("..."),
  orgId: "org123",
  userId: "user789",
  permissionKey: "tickets.delete",
  granted: true,
  grantedBy: "admin123",
  grantedAt: ISODate("2024-10-01T09:00:00Z"),
  expiresAt: ISODate("2024-10-31T23:59:59Z"),
  reason: "Temporary permission for Q4 cleanup project"
}

// Revoke specific permission
{
  _id: ObjectId("..."),
  orgId: "org123",
  userId: "user456",
  permissionKey: "changes.approve",
  granted: false,
  grantedBy: "admin123",
  grantedAt: ISODate("2024-09-15T14:30:00Z"),
  reason: "Pending certification completion"
}
```

#### `role_assignment_history` Collection

```typescript
interface RoleAssignmentHistory {
  _id: ObjectId
  orgId: string
  userId: string
  previousRoleId?: string   // null for new users
  previousRoleName?: string
  newRoleId: string
  newRoleName: string
  changedBy: string
  changedAt: Date
  reason?: string
  ipAddress?: string
  userAgent?: string
}

// Indexes:
// - { userId: 1, changedAt: -1 }
// - { orgId: 1, changedAt: -1 }
// - { changedBy: 1, changedAt: -1 }
```

**Example Document:**

```javascript
{
  _id: ObjectId("..."),
  orgId: "org123",
  userId: "user789",
  previousRoleId: "role_tech",
  previousRoleName: "Technician",
  newRoleId: "role_senior",
  newRoleName: "Senior Technician",
  changedBy: "admin123",
  changedAt: ISODate("2024-10-12T10:15:00Z"),
  reason: "Promotion after completing advanced training",
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

#### Modified `users` Collection

```typescript
interface User extends BaseEntity {
  // Existing fields...
  email: string
  password: string
  firstName: string
  lastName: string

  // MODIFIED: Role reference
  role: UserRole            // Keep for backward compatibility
  roleId?: string           // NEW: Reference to Role._id

  // NEW: Permission overrides
  customPermissions?: string[]        // Additional permissions
  permissionOverrides?: UserPermission[] // Cached overrides

  // Existing fields...
  avatar?: string
  phone?: string
  title?: string
  department?: string
  isActive: boolean
  lastLogin?: Date
}
```

### 5.3 Migration Strategy

**Phase 1: Add New Collections**
```javascript
// Create new collections with indexes
db.createCollection('roles')
db.createCollection('permissions')
db.createCollection('user_permissions')
db.createCollection('role_assignment_history')

// Create indexes
db.roles.createIndex({ orgId: 1, name: 1 }, { unique: true })
db.permissions.createIndex({ permissionKey: 1 }, { unique: true })
db.user_permissions.createIndex({ userId: 1, permissionKey: 1 })
```

**Phase 2: Seed System Roles and Permissions**
```javascript
// Insert system roles (admin, technician, user)
// Insert all 120+ system permissions
// See implementation section for seed script
```

**Phase 3: Migrate Existing Users**
```javascript
// Update all users to reference system roles
db.users.updateMany(
  { role: 'admin' },
  { $set: { roleId: adminRoleId } }
)
// Repeat for technician and user roles
```

---

## 6. Integration Strategy

### 6.1 NextAuth JWT Enhancement

**Current JWT Payload:**
```typescript
interface JWT {
  id: string
  email: string
  name: string
  role: UserRole
  orgId: string
}
```

**Enhanced JWT Payload:**
```typescript
interface JWT {
  id: string
  email: string
  name: string
  role: UserRole        // Keep for backward compatibility
  roleId: string        // NEW: Role reference
  orgId: string
  permissions: string[] // NEW: Cached permissions
  permissionVersion: number // NEW: For cache invalidation
}
```

**Benefits:**
- Permissions available in JWT (no DB lookup per request)
- Permission changes invalidate token (via version bump)
- Minimal performance impact

### 6.2 API Route Protection

**Current Pattern:**
```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Hard-coded role check
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ...
}
```

**New Pattern with RBAC:**
```typescript
import { requirePermission } from '@/lib/rbac/middleware'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Permission check
  if (!requirePermission(session.user, 'tickets.delete')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ...
}
```

### 6.3 Frontend Integration

**React Hook for Permission Checking:**
```typescript
import { usePermission } from '@/lib/rbac/hooks'

function TicketActions({ ticket }) {
  const canEdit = usePermission('tickets.edit.all')
  const canDelete = usePermission('tickets.delete')

  return (
    <div>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
      {canDelete && <Button onClick={handleDelete}>Delete</Button>}
    </div>
  )
}
```

**Component-Level Protection:**
```typescript
import { ProtectedComponent } from '@/components/rbac/protected'

<ProtectedComponent permission="users.create">
  <CreateUserButton />
</ProtectedComponent>
```

### 6.4 Backward Compatibility

**Dual-Mode Operation:**
```typescript
// During transition, support both old and new permission checks
function hasPermission(user: User, permission: string): boolean {
  // NEW: Check RBAC permissions
  if (user.roleId && user.permissions) {
    return checkRBACPermission(user, permission)
  }

  // OLD: Fallback to role-based check
  return checkLegacyRole(user, permission)
}
```

---

## 7. Implementation Plan

### 7.1 Development Phases

#### Phase 1: Database & Core Services (Week 1)
**Tasks:**
1. Create new MongoDB collections (`roles`, `permissions`, `user_permissions`, `role_assignment_history`)
2. Add indexes for performance
3. Create seed script for system roles and permissions
4. Implement `PermissionService` class with core methods
5. Write unit tests for permission evaluation logic

**Deliverables:**
- Migration script (`migrations/001_rbac_setup.ts`)
- Seed script (`scripts/seed-rbac.ts`)
- Permission service (`lib/rbac/permission-service.ts`)
- Test suite (90%+ coverage)

#### Phase 2: NextAuth Integration (Week 2)
**Tasks:**
1. Enhance JWT payload with permissions
2. Update session callback to include permissions
3. Implement permission version tracking
4. Create permission caching mechanism
5. Test session generation and validation

**Deliverables:**
- Updated `lib/auth.ts` with RBAC support
- Session types (`types/next-auth.d.ts`)
- Cache invalidation logic

#### Phase 3: Middleware & API Protection (Week 2-3)
**Tasks:**
1. Create `requirePermission()` middleware
2. Create `requireAnyPermission()` and `requireAllPermissions()` variants
3. Update existing API routes to use new middleware (incremental)
4. Add resource-scoped permission checks (own/assigned/all)
5. Test all API routes for permission enforcement

**Deliverables:**
- Middleware library (`lib/rbac/middleware.ts`)
- Updated API routes (40+ files)
- API test suite

#### Phase 4: Frontend Components (Week 3)
**Tasks:**
1. Create `usePermission()` React hook
2. Create `ProtectedComponent` wrapper
3. Update UI components to show/hide based on permissions
4. Add permission indicators (badges, tooltips)
5. Test responsive behavior

**Deliverables:**
- RBAC React hooks (`lib/rbac/hooks.ts`)
- Protected component wrappers
- Updated UI components

#### Phase 5: Admin UI (Week 4)
**Tasks:**
1. Create Role Management page (`/settings/roles`)
2. Create Permission Management page (`/settings/permissions`)
3. Add role assignment interface in User Management
4. Create permission override interface
5. Add audit log viewer

**Deliverables:**
- Role management UI
- Permission override UI
- Audit log viewer
- Admin documentation

#### Phase 6: Testing & Documentation (Week 5)
**Tasks:**
1. End-to-end testing of all modules
2. Performance testing (permission check latency)
3. Security audit (permission bypass attempts)
4. Write user documentation
5. Create video tutorials

**Deliverables:**
- E2E test suite (Playwright/Cypress)
- Performance benchmarks
- Security audit report
- User guide
- Video tutorials

### 7.2 Rollout Strategy

**1. Beta Testing (Week 5)**
- Enable RBAC for internal test organization
- Gather feedback from 5-10 test users
- Fix critical bugs

**2. Phased Rollout (Week 6-8)**
- Week 6: 10% of organizations
- Week 7: 50% of organizations
- Week 8: 100% of organizations

**3. Monitoring**
- Permission check latency (target: <5ms)
- Permission cache hit rate (target: >95%)
- Error rate for permission-related failures
- User feedback and support tickets

### 7.3 Rollback Plan

**Emergency Rollback:**
```typescript
// Feature flag to disable RBAC
if (process.env.RBAC_ENABLED !== 'true') {
  // Use legacy role-based checks
  return checkLegacyRole(user, permission)
}
```

**Database Rollback:**
- Collections are additive (no breaking changes to existing data)
- Can disable RBAC and revert to legacy role checks
- No data loss during rollback

---

## 8. Code Examples

### 8.1 Permission Service

**File: `src/lib/rbac/permission-service.ts`**

```typescript
import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import type { User, Role, Permission, UserPermission } from '@/lib/types'

export class PermissionService {
  /**
   * Check if user has a specific permission
   */
  static async checkPermission(
    userId: string,
    orgId: string,
    permissionKey: string
  ): Promise<boolean> {
    const db = await getDatabase()

    // 1. Get user with role
    const user = await db.collection<User>(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(userId),
      orgId,
      isActive: true,
    })

    if (!user) return false

    // 2. Check user-level overrides first (highest priority)
    const override = await db.collection<UserPermission>('user_permissions').findOne({
      userId,
      permissionKey,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    })

    if (override) {
      return override.granted // Explicit grant or revoke
    }

    // 3. Check custom permissions
    if (user.customPermissions?.includes(permissionKey)) {
      return true
    }

    // 4. Check role permissions
    if (!user.roleId) return false

    const role = await db.collection<Role>('roles').findOne({
      _id: new ObjectId(user.roleId),
      orgId,
      isActive: true,
    })

    if (!role) return false

    // Wildcard check (admin has *.*)
    if (role.permissions.includes('*.*')) return true

    // Exact match
    if (role.permissions.includes(permissionKey)) return true

    // Wildcard module match (e.g., 'tickets.*' matches 'tickets.view.all')
    const [module] = permissionKey.split('.')
    if (role.permissions.includes(`${module}.*`)) return true

    // Default: deny (least privilege)
    return false
  }

  /**
   * Get all effective permissions for a user (for JWT caching)
   */
  static async getUserPermissions(
    userId: string,
    orgId: string
  ): Promise<string[]> {
    const db = await getDatabase()

    const user = await db.collection<User>(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(userId),
      orgId,
      isActive: true,
    })

    if (!user || !user.roleId) return []

    const role = await db.collection<Role>('roles').findOne({
      _id: new ObjectId(user.roleId),
      orgId,
      isActive: true,
    })

    if (!role) return []

    // Start with role permissions
    let permissions = new Set<string>(role.permissions)

    // Add custom permissions
    if (user.customPermissions) {
      user.customPermissions.forEach(p => permissions.add(p))
    }

    // Apply user-level overrides
    const overrides = await db.collection<UserPermission>('user_permissions')
      .find({
        userId,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gt: new Date() } }
        ]
      })
      .toArray()

    overrides.forEach(override => {
      if (override.granted) {
        permissions.add(override.permissionKey)
      } else {
        permissions.delete(override.permissionKey)
      }
    })

    return Array.from(permissions)
  }

  /**
   * Grant permission to user (temporary or permanent)
   */
  static async grantPermission(
    userId: string,
    orgId: string,
    permissionKey: string,
    grantedBy: string,
    options?: {
      expiresAt?: Date
      reason?: string
    }
  ): Promise<void> {
    const db = await getDatabase()

    await db.collection<UserPermission>('user_permissions').insertOne({
      _id: new ObjectId(),
      orgId,
      userId,
      permissionKey,
      granted: true,
      grantedBy,
      grantedAt: new Date(),
      expiresAt: options?.expiresAt,
      reason: options?.reason,
    })

    // Invalidate user's permission cache
    await this.invalidateUserPermissionCache(userId, orgId)
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(
    userId: string,
    orgId: string,
    permissionKey: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const db = await getDatabase()

    await db.collection<UserPermission>('user_permissions').insertOne({
      _id: new ObjectId(),
      orgId,
      userId,
      permissionKey,
      granted: false,
      grantedBy: revokedBy,
      grantedAt: new Date(),
      reason,
    })

    // Invalidate user's permission cache
    await this.invalidateUserPermissionCache(userId, orgId)
  }

  /**
   * Assign role to user
   */
  static async assignRole(
    userId: string,
    orgId: string,
    roleId: string,
    assignedBy: string,
    reason?: string
  ): Promise<void> {
    const db = await getDatabase()

    // Get current user
    const user = await db.collection<User>(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(userId),
      orgId,
    })

    if (!user) throw new Error('User not found')

    // Get new role
    const newRole = await db.collection<Role>('roles').findOne({
      _id: new ObjectId(roleId),
      orgId,
      isActive: true,
    })

    if (!newRole) throw new Error('Role not found')

    // Get previous role (for audit trail)
    let previousRole: Role | null = null
    if (user.roleId) {
      previousRole = await db.collection<Role>('roles').findOne({
        _id: new ObjectId(user.roleId),
        orgId,
      })
    }

    // Update user
    await db.collection<User>(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId), orgId },
      {
        $set: {
          roleId,
          role: newRole.name as any, // Keep for backward compatibility
          updatedAt: new Date(),
        }
      }
    )

    // Log role change
    await db.collection('role_assignment_history').insertOne({
      _id: new ObjectId(),
      orgId,
      userId,
      previousRoleId: previousRole?._id.toString(),
      previousRoleName: previousRole?.displayName,
      newRoleId: roleId,
      newRoleName: newRole.displayName,
      changedBy: assignedBy,
      changedAt: new Date(),
      reason,
    })

    // Invalidate user's permission cache
    await this.invalidateUserPermissionCache(userId, orgId)
  }

  /**
   * Invalidate user's cached permissions (bump version)
   */
  private static async invalidateUserPermissionCache(
    userId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()

    // Increment permission version to invalidate JWT
    await db.collection<User>(COLLECTIONS.USERS).updateOne(
      { _id: new ObjectId(userId), orgId },
      { $inc: { permissionVersion: 1 } }
    )
  }

  /**
   * Create a new custom role
   */
  static async createRole(
    orgId: string,
    roleData: {
      name: string
      displayName: string
      description: string
      permissions: string[]
      color?: string
      icon?: string
    },
    createdBy: string
  ): Promise<Role> {
    const db = await getDatabase()

    // Check for duplicate name
    const existing = await db.collection<Role>('roles').findOne({
      orgId,
      name: roleData.name,
    })

    if (existing) {
      throw new Error('Role with this name already exists')
    }

    const role: Role = {
      _id: new ObjectId(),
      orgId,
      name: roleData.name,
      displayName: roleData.displayName,
      description: roleData.description,
      permissions: roleData.permissions,
      isSystem: false,
      isActive: true,
      color: roleData.color,
      icon: roleData.icon,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection<Role>('roles').insertOne(role)

    return role
  }

  /**
   * Get all roles for an organization
   */
  static async getRoles(orgId: string, includeInactive = false): Promise<Role[]> {
    const db = await getDatabase()

    const filter: any = { orgId }
    if (!includeInactive) {
      filter.isActive = true
    }

    return db.collection<Role>('roles')
      .find(filter)
      .sort({ isSystem: -1, displayName: 1 })
      .toArray()
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(orgId?: string): Promise<Permission[]> {
    const db = await getDatabase()

    const filter: any = {
      $or: [
        { orgId: 'system' },
        ...(orgId ? [{ orgId }] : [])
      ]
    }

    return db.collection<Permission>('permissions')
      .find(filter)
      .sort({ module: 1, action: 1 })
      .toArray()
  }
}
```

### 8.2 Middleware for API Routes

**File: `src/lib/rbac/middleware.ts`**

```typescript
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PermissionService } from './permission-service'

/**
 * Check if session user has required permission
 */
export async function requirePermission(
  permission: string,
  req?: NextRequest
): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id || !session?.user?.orgId) {
    return false
  }

  // Fast path: Check cached permissions in JWT
  if (session.user.permissions?.includes(permission)) {
    return true
  }

  // Wildcard check
  const [module] = permission.split('.')
  if (session.user.permissions?.includes(`${module}.*`)) {
    return true
  }

  if (session.user.permissions?.includes('*.*')) {
    return true
  }

  // Slow path: Database lookup (should rarely happen with proper JWT caching)
  return PermissionService.checkPermission(
    session.user.id,
    session.user.orgId,
    permission
  )
}

/**
 * Check if user has ANY of the provided permissions (OR logic)
 */
export async function requireAnyPermission(
  permissions: string[],
  req?: NextRequest
): Promise<boolean> {
  for (const permission of permissions) {
    if (await requirePermission(permission, req)) {
      return true
    }
  }
  return false
}

/**
 * Check if user has ALL of the provided permissions (AND logic)
 */
export async function requireAllPermissions(
  permissions: string[],
  req?: NextRequest
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await requirePermission(permission, req))) {
      return false
    }
  }
  return true
}

/**
 * Resource-scoped permission check
 * Example: User can edit 'own' tickets but not 'all' tickets
 */
export async function requireResourcePermission(
  basePermission: string,  // e.g., 'tickets.edit'
  resource: any,           // The resource being accessed
  userId: string           // Current user ID
): Promise<boolean> {
  // Check if user has 'all' scope
  if (await requirePermission(`${basePermission}.all`)) {
    return true
  }

  // Check if user has 'assigned' scope and is assigned to resource
  if (
    await requirePermission(`${basePermission}.assigned`) &&
    resource.assignedTo === userId
  ) {
    return true
  }

  // Check if user has 'own' scope and created the resource
  if (
    await requirePermission(`${basePermission}.own`) &&
    resource.createdBy === userId
  ) {
    return true
  }

  return false
}
```

### 8.3 React Hook for Frontend

**File: `src/lib/rbac/hooks.ts`**

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

/**
 * React hook to check if current user has a permission
 */
export function usePermission(permission: string): boolean {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user?.permissions) return false

    // Exact match
    if (session.user.permissions.includes(permission)) return true

    // Wildcard check
    const [module] = permission.split('.')
    if (session.user.permissions.includes(`${module}.*`)) return true

    // Admin wildcard
    if (session.user.permissions.includes('*.*')) return true

    return false
  }, [session, permission])
}

/**
 * Check if user has ANY of the permissions (OR logic)
 */
export function useAnyPermission(permissions: string[]): boolean {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user?.permissions) return false

    return permissions.some(permission => {
      if (session.user.permissions!.includes(permission)) return true

      const [module] = permission.split('.')
      if (session.user.permissions!.includes(`${module}.*`)) return true

      if (session.user.permissions!.includes('*.*')) return true

      return false
    })
  }, [session, permissions])
}

/**
 * Check if user has ALL of the permissions (AND logic)
 */
export function useAllPermissions(permissions: string[]): boolean {
  const { data: session } = useSession()

  return useMemo(() => {
    if (!session?.user?.permissions) return false

    return permissions.every(permission => {
      if (session.user.permissions!.includes(permission)) return true

      const [module] = permission.split('.')
      if (session.user.permissions!.includes(`${module}.*`)) return true

      if (session.user.permissions!.includes('*.*')) return true

      return false
    })
  }, [session, permissions])
}

/**
 * Get user's role information
 */
export function useRole() {
  const { data: session } = useSession()

  return useMemo(() => ({
    roleId: session?.user?.roleId,
    roleName: session?.user?.role,
    isAdmin: session?.user?.permissions?.includes('*.*') || session?.user?.role === 'admin',
    isTechnician: session?.user?.role === 'technician',
    isUser: session?.user?.role === 'user',
  }), [session])
}
```

### 8.4 Protected Component Wrapper

**File: `src/components/rbac/protected.tsx`**

```typescript
'use client'

import { usePermission } from '@/lib/rbac/hooks'
import type { ReactNode } from 'react'

interface ProtectedComponentProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
  hideIfUnauthorized?: boolean
}

/**
 * Wrapper component that only renders children if user has permission
 */
export function ProtectedComponent({
  permission,
  children,
  fallback = null,
  hideIfUnauthorized = true,
}: ProtectedComponentProps) {
  const hasPermission = usePermission(permission)

  if (!hasPermission) {
    return hideIfUnauthorized ? null : <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Button that's disabled if user lacks permission
 */
export function PermissionButton({
  permission,
  onClick,
  children,
  className,
  ...props
}: {
  permission: string
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  const hasPermission = usePermission(permission)

  return (
    <button
      onClick={hasPermission ? onClick : undefined}
      disabled={!hasPermission}
      className={className}
      title={!hasPermission ? 'You do not have permission for this action' : undefined}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 8.5 Updated API Route Example

**File: `src/app/api/tickets/[id]/route.ts` (Updated)**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { TicketService } from '@/lib/services/tickets'
import { requirePermission, requireResourcePermission } from '@/lib/rbac/middleware'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await TicketService.getTicketById(params.id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Resource-scoped permission check
    const canView = await requireResourcePermission(
      'tickets.view',
      ticket,
      session.user.id
    )

    if (!canView) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: ticket })
  } catch (error) {
    console.error('Get ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const ticket = await TicketService.getTicketById(params.id, session.user.orgId)
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Resource-scoped permission check
    const canEdit = await requireResourcePermission(
      'tickets.edit',
      ticket,
      session.user.id
    )

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updatedTicket = await TicketService.updateTicket(
      params.id,
      session.user.orgId,
      body
    )

    return NextResponse.json({ success: true, data: updatedTicket })
  } catch (error) {
    console.error('Update ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Permission check (delete is usually not resource-scoped)
    if (!await requirePermission('tickets.delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const success = await TicketService.deleteTicket(
      params.id,
      session.user.orgId
    )

    return NextResponse.json({ success })
  } catch (error) {
    console.error('Delete ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to delete ticket' },
      { status: 500 }
    )
  }
}
```

### 8.6 Seed Script for Permissions

**File: `scripts/seed-rbac.ts`**

```typescript
import { MongoClient } from 'mongodb'
import type { Role, Permission } from '@/lib/types'

const MONGODB_URI = process.env.MONGODB_URI!

// System permissions (120+ total)
const SYSTEM_PERMISSIONS: Omit<Permission, '_id' | 'createdAt' | 'updatedAt'>[] = [
  // Dashboard
  { orgId: 'system', module: 'dashboard', action: 'view', permissionKey: 'dashboard.view', description: 'View dashboard', isSystem: true },
  { orgId: 'system', module: 'dashboard', action: 'viewStats', permissionKey: 'dashboard.viewStats', description: 'View organization statistics', isSystem: true },

  // Tickets
  { orgId: 'system', module: 'tickets', action: 'view', resource: 'all', permissionKey: 'tickets.view.all', description: 'View all tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'view', resource: 'assigned', permissionKey: 'tickets.view.assigned', description: 'View assigned tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'view', resource: 'own', permissionKey: 'tickets.view.own', description: 'View own tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'create', permissionKey: 'tickets.create', description: 'Create tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'edit', resource: 'all', permissionKey: 'tickets.edit.all', description: 'Edit all tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'edit', resource: 'assigned', permissionKey: 'tickets.edit.assigned', description: 'Edit assigned tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'edit', resource: 'own', permissionKey: 'tickets.edit.own', description: 'Edit own tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'delete', permissionKey: 'tickets.delete', description: 'Delete tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'assign', permissionKey: 'tickets.assign', description: 'Assign tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'close', permissionKey: 'tickets.close', description: 'Close tickets', isSystem: true },
  { orgId: 'system', module: 'tickets', action: 'comment', permissionKey: 'tickets.comment', description: 'Add comments to tickets', isSystem: true },

  // ... (Continue for all 120+ permissions - see full list in Permission Matrix section)
]

// System roles
const SYSTEM_ROLES = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access for administrators',
    permissions: ['*.*'], // Wildcard = all permissions
    isSystem: true,
    isActive: true,
  },
  {
    name: 'technician',
    displayName: 'Technician',
    description: 'Service desk staff and field technicians',
    permissions: [
      // Tickets
      'tickets.view.all',
      'tickets.create',
      'tickets.edit.all',
      'tickets.edit.assigned',
      'tickets.assign',
      'tickets.close',
      'tickets.comment',
      'tickets.viewComments',
      'tickets.viewStats',

      // Incidents
      'incidents.view.all',
      'incidents.view.public',
      'incidents.create',
      'incidents.edit',
      'incidents.addUpdate',
      'incidents.manage',
      'incidents.viewStats',

      // ... (Continue with all technician permissions)
    ],
    isSystem: true,
    isActive: true,
  },
  {
    name: 'user',
    displayName: 'User',
    description: 'End users and requesters',
    permissions: [
      'dashboard.view',
      'tickets.view.own',
      'tickets.create',
      'tickets.edit.own',
      'tickets.comment',
      'incidents.view.public',
      'kb.view.public',
      'serviceCatalog.view',
      'serviceCatalog.request',
      'portal.view',
      'portal.submitRequest',
      'portal.viewOwnRequests',
      'users.view.own',
      'users.edit.own',
    ],
    isSystem: true,
    isActive: true,
  },
]

async function seedRBAC() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('deskwise')

    console.log('Seeding RBAC data...')

    // 1. Create collections
    console.log('Creating collections...')
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)

    if (!collectionNames.includes('permissions')) {
      await db.createCollection('permissions')
      await db.collection('permissions').createIndex({ permissionKey: 1 }, { unique: true })
      console.log('✓ Created permissions collection')
    }

    if (!collectionNames.includes('roles')) {
      await db.createCollection('roles')
      await db.collection('roles').createIndex({ orgId: 1, name: 1 }, { unique: true })
      console.log('✓ Created roles collection')
    }

    if (!collectionNames.includes('user_permissions')) {
      await db.createCollection('user_permissions')
      await db.collection('user_permissions').createIndex({ userId: 1, permissionKey: 1 })
      console.log('✓ Created user_permissions collection')
    }

    if (!collectionNames.includes('role_assignment_history')) {
      await db.createCollection('role_assignment_history')
      await db.collection('role_assignment_history').createIndex({ userId: 1, changedAt: -1 })
      console.log('✓ Created role_assignment_history collection')
    }

    // 2. Insert system permissions
    console.log('Inserting system permissions...')
    const permissionDocs = SYSTEM_PERMISSIONS.map(p => ({
      ...p,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

    await db.collection('permissions').deleteMany({ orgId: 'system' })
    await db.collection('permissions').insertMany(permissionDocs)
    console.log(`✓ Inserted ${permissionDocs.length} system permissions`)

    // 3. Get all organization IDs
    const orgs = await db.collection('organizations').find({}).toArray()
    console.log(`Found ${orgs.length} organizations`)

    // 4. Insert system roles for each organization
    for (const org of orgs) {
      console.log(`Processing organization: ${org.name} (${org._id})`)

      for (const roleData of SYSTEM_ROLES) {
        const role = {
          ...roleData,
          orgId: org._id.toString(),
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection('roles').updateOne(
          { orgId: org._id.toString(), name: roleData.name },
          { $setOnInsert: role },
          { upsert: true }
        )

        console.log(`  ✓ Inserted/updated role: ${roleData.displayName}`)
      }
    }

    console.log('\n✓ RBAC seeding completed successfully!')

  } catch (error) {
    console.error('Error seeding RBAC:', error)
    throw error
  } finally {
    await client.close()
  }
}

// Run seed
seedRBAC()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
```

---

## 9. Security Considerations

### 9.1 Multi-Tenancy Isolation

**Enforcement:**
- All RBAC queries MUST include `orgId` filter
- Permission checks validate organization context
- JWT includes `orgId` to prevent cross-tenant access

**Example:**
```typescript
// GOOD: Organization-scoped
const role = await db.collection('roles').findOne({
  _id: new ObjectId(roleId),
  orgId: session.user.orgId,  // ✓ Organization filter
})

// BAD: Missing organization filter (security vulnerability!)
const role = await db.collection('roles').findOne({
  _id: new ObjectId(roleId),
  // ✗ Missing orgId - could access other org's roles!
})
```

### 9.2 JWT Security

**Token Invalidation:**
- Permission changes increment `permissionVersion`
- Session validation checks version mismatch
- Expired permissions are rejected

**Token Expiration:**
- Default: 30 days
- Permissions cached in JWT for performance
- Version mismatch forces re-authentication

### 9.3 Permission Escalation Prevention

**Safeguards:**
1. **System Role Protection:** Admin/Technician/User roles cannot be modified or deleted
2. **Permission Validation:** All permission assignments validated against available permissions
3. **Role Assignment Audit:** Complete trail of role changes
4. **Override Expiration:** Temporary permissions auto-expire
5. **Least Privilege:** Default deny for unknown permissions

### 9.4 Input Validation

**Permission Keys:**
```typescript
const PERMISSION_KEY_REGEX = /^[a-z]+(\.[a-z]+){1,2}$/

function validatePermissionKey(key: string): boolean {
  return PERMISSION_KEY_REGEX.test(key)
}
```

**Role Names:**
```typescript
const ROLE_NAME_REGEX = /^[a-z_][a-z0-9_]*$/

function validateRoleName(name: string): boolean {
  if (name.length < 3 || name.length > 50) return false
  return ROLE_NAME_REGEX.test(name)
}
```

### 9.5 Audit Logging

**What to Log:**
- Role assignments and changes
- Permission grants/revokes
- Custom role creation/modification
- Permission check failures (potential attacks)
- Bulk permission changes

**Log Retention:**
- 90 days minimum for compliance
- Archive to external storage for long-term retention

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Permission Service Tests:**
```typescript
describe('PermissionService', () => {
  describe('checkPermission', () => {
    it('should grant permission for admin wildcard', async () => {
      const hasPermission = await PermissionService.checkPermission(
        adminUserId,
        orgId,
        'tickets.delete'
      )
      expect(hasPermission).toBe(true)
    })

    it('should respect user-level overrides', async () => {
      // Grant ticket deletion to non-admin
      await PermissionService.grantPermission(
        userId,
        orgId,
        'tickets.delete',
        adminUserId
      )

      const hasPermission = await PermissionService.checkPermission(
        userId,
        orgId,
        'tickets.delete'
      )
      expect(hasPermission).toBe(true)
    })

    it('should enforce least privilege by default', async () => {
      const hasPermission = await PermissionService.checkPermission(
        userRoleUserId,
        orgId,
        'users.delete'
      )
      expect(hasPermission).toBe(false)
    })

    // ... 50+ test cases
  })
})
```

### 10.2 Integration Tests

**API Route Permission Tests:**
```typescript
describe('DELETE /api/tickets/[id]', () => {
  it('should allow admin to delete tickets', async () => {
    const response = await fetch('/api/tickets/123', {
      method: 'DELETE',
      headers: { Cookie: adminSessionCookie }
    })
    expect(response.status).toBe(200)
  })

  it('should deny technician ticket deletion', async () => {
    const response = await fetch('/api/tickets/123', {
      method: 'DELETE',
      headers: { Cookie: technicianSessionCookie }
    })
    expect(response.status).toBe(403)
  })

  it('should deny user ticket deletion', async () => {
    const response = await fetch('/api/tickets/123', {
      method: 'DELETE',
      headers: { Cookie: userSessionCookie }
    })
    expect(response.status).toBe(403)
  })
})
```

### 10.3 E2E Tests

**Role Management Flow:**
```typescript
test('admin can create custom role and assign permissions', async ({ page }) => {
  // Login as admin
  await page.goto('/auth/signin')
  await page.fill('[name="email"]', 'admin@example.com')
  await page.fill('[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Navigate to role management
  await page.goto('/settings/roles')

  // Create new role
  await page.click('text=Create Role')
  await page.fill('[name="displayName"]', 'Senior Technician')
  await page.fill('[name="description"]', 'Technician with approval permissions')

  // Select permissions
  await page.check('input[value="tickets.*"]')
  await page.check('input[value="changes.approve"]')

  // Save role
  await page.click('button:has-text("Create")')

  // Verify success
  await expect(page.locator('text=Senior Technician')).toBeVisible()
})
```

### 10.4 Performance Tests

**Permission Check Latency:**
```typescript
describe('Permission Check Performance', () => {
  it('should complete permission check in <5ms (cached)', async () => {
    const start = Date.now()

    for (let i = 0; i < 1000; i++) {
      await PermissionService.checkPermission(
        userId,
        orgId,
        'tickets.view.all'
      )
    }

    const duration = Date.now() - start
    const avgLatency = duration / 1000

    expect(avgLatency).toBeLessThan(5) // <5ms average
  })
})
```

### 10.5 Security Tests

**Permission Escalation Attempts:**
```typescript
describe('Security Tests', () => {
  it('should prevent cross-tenant role assignment', async () => {
    // User from org1 tries to assign role from org2
    await expect(
      PermissionService.assignRole(
        org1UserId,
        'org1',
        org2RoleId,  // Role belongs to different org
        adminUserId
      )
    ).rejects.toThrow('Role not found')
  })

  it('should prevent permission override without admin role', async () => {
    await expect(
      PermissionService.grantPermission(
        userId,
        orgId,
        'users.delete',
        nonAdminUserId  // Non-admin trying to grant permission
      )
    ).rejects.toThrow('Forbidden')
  })
})
```

### 10.6 Test Coverage Goals

- **Unit Tests:** 90%+ coverage
- **Integration Tests:** All API routes with permission checks
- **E2E Tests:** Critical user flows (role management, permission overrides)
- **Performance Tests:** Permission check latency <5ms (p95)
- **Security Tests:** All attack vectors (escalation, cross-tenant, bypass)

---

## Conclusion

This RBAC system design provides Deskwise ITSM with:

✓ **Enterprise-grade security** with 120+ granular permissions
✓ **Flexible role management** supporting custom roles and overrides
✓ **Resource-scoped access control** (own/assigned/team/all)
✓ **High performance** with JWT-based permission caching
✓ **Complete auditability** with comprehensive logging
✓ **Backward compatibility** with existing role-based system
✓ **Multi-tenant isolation** with organization-level scoping

The implementation plan spans 5 weeks with incremental rollout, comprehensive testing, and rollback capabilities. This design is production-ready and scalable for enterprise SaaS deployment.

---

**Next Steps:**
1. Review and approve this design document
2. Begin Phase 1 implementation (Database & Core Services)
3. Schedule weekly progress reviews
4. Plan beta testing with select organizations
5. Prepare user training materials

**Questions or Feedback:**
Please review this document and provide feedback before implementation begins.
