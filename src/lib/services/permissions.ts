import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Permission, User, Role, UserPermission } from '@/lib/types'

/**
 * PermissionService
 *
 * Manages permissions and permission checks for the RBAC system.
 * Handles permission evaluation based on roles, custom permissions, and overrides.
 */
export class PermissionService {
  /**
   * Get all permissions for a user (role permissions + custom permissions - overrides)
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @returns Array of permission keys the user has
   */
  static async getUserPermissions(userId: string, orgId: string): Promise<string[]> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    // Get user
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      orgId,
      isActive: true,
    })

    if (!user) {
      return []
    }

    const permissionSet = new Set<string>()

    // 1. Add permissions from role (if roleId exists)
    if (user.roleId) {
      const role = await rolesCollection.findOne({
        _id: new ObjectId(user.roleId),
        orgId,
        isActive: true,
      })

      if (role && role.permissions) {
        role.permissions.forEach((perm) => permissionSet.add(perm))
      }
    } else {
      // Fallback: Use legacy role system for backward compatibility
      const legacyPermissions = this.getLegacyRolePermissions(user.role)
      legacyPermissions.forEach((perm) => permissionSet.add(perm))
    }

    // 2. Add custom permissions
    if (user.customPermissions && Array.isArray(user.customPermissions)) {
      user.customPermissions.forEach((perm) => permissionSet.add(perm))
    }

    // 3. Apply permission overrides (grant or revoke)
    if (user.permissionOverrides && Array.isArray(user.permissionOverrides)) {
      const now = new Date()
      user.permissionOverrides.forEach((override: UserPermission) => {
        // Check if override is expired
        if (override.expiresAt && new Date(override.expiresAt) < now) {
          return
        }

        if (override.granted) {
          permissionSet.add(override.permissionKey)
        } else {
          permissionSet.delete(override.permissionKey)
        }
      })
    }

    return Array.from(permissionSet)
  }

  /**
   * Check if user has a specific permission
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param permission - Permission key (e.g., 'tickets.view')
   * @returns True if user has the permission
   */
  static async hasPermission(
    userId: string,
    orgId: string,
    permission: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, orgId)
    return permissions.includes(permission)
  }

  /**
   * Check if user has all of the specified permissions (AND logic)
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param permissions - Array of permission keys
   * @returns True if user has all permissions
   */
  static async hasAllPermissions(
    userId: string,
    orgId: string,
    permissions: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, orgId)
    const userPermSet = new Set(userPermissions)

    return permissions.every((perm) => userPermSet.has(perm))
  }

  /**
   * Check if user has any of the specified permissions (OR logic)
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param permissions - Array of permission keys
   * @returns True if user has at least one permission
   */
  static async hasAnyPermission(
    userId: string,
    orgId: string,
    permissions: string[]
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, orgId)
    const userPermSet = new Set(userPermissions)

    return permissions.some((perm) => userPermSet.has(perm))
  }

  /**
   * Get all available permissions in the system
   *
   * @param orgId - Organization ID
   * @returns Array of all permissions
   */
  static async getAllPermissions(orgId: string): Promise<Permission[]> {
    const db = await getDatabase()
    const permissionsCollection = db.collection<Permission>(COLLECTIONS.PERMISSIONS)

    return await permissionsCollection.find({ orgId }).sort({ module: 1, action: 1 }).toArray()
  }

  /**
   * Get permissions grouped by module
   *
   * @param orgId - Organization ID
   * @returns Object with modules as keys and permissions as values
   */
  static async getPermissionsByModule(
    orgId: string
  ): Promise<Record<string, Permission[]>> {
    const permissions = await this.getAllPermissions(orgId)

    const grouped: Record<string, Permission[]> = {}
    permissions.forEach((perm) => {
      if (!grouped[perm.module]) {
        grouped[perm.module] = []
      }
      grouped[perm.module].push(perm)
    })

    return grouped
  }

  /**
   * Create a custom permission
   *
   * @param orgId - Organization ID
   * @param createdBy - User ID who created the permission
   * @param permissionData - Permission data
   * @returns Created permission
   */
  static async createPermission(
    orgId: string,
    createdBy: string,
    permissionData: {
      module: string
      action: string
      resource?: string
      description: string
    }
  ): Promise<Permission> {
    const db = await getDatabase()
    const permissionsCollection = db.collection<Permission>(COLLECTIONS.PERMISSIONS)

    const permissionKey = permissionData.resource
      ? `${permissionData.module}.${permissionData.action}.${permissionData.resource}`
      : `${permissionData.module}.${permissionData.action}`

    // Check if permission already exists
    const existing = await permissionsCollection.findOne({
      orgId,
      permissionKey,
    })

    if (existing) {
      throw new Error('Permission with this key already exists')
    }

    const now = new Date()
    const permission: Omit<Permission, '_id'> = {
      orgId,
      module: permissionData.module,
      action: permissionData.action,
      resource: permissionData.resource,
      permissionKey,
      description: permissionData.description,
      isSystem: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await permissionsCollection.insertOne(permission as Permission)

    return {
      ...permission,
      _id: result.insertedId,
    } as Permission
  }

  /**
   * Seed default permissions for an organization
   *
   * @param orgId - Organization ID
   * @returns Number of permissions created
   */
  static async seedDefaultPermissions(orgId: string): Promise<number> {
    const db = await getDatabase()
    const permissionsCollection = db.collection<Permission>(COLLECTIONS.PERMISSIONS)

    // Check if permissions already exist
    const existingCount = await permissionsCollection.countDocuments({ orgId })
    if (existingCount > 0) {
      throw new Error('Permissions already exist for this organization')
    }

    const defaultPermissions = this.getDefaultPermissions(orgId)

    const result = await permissionsCollection.insertMany(defaultPermissions as Permission[])

    return result.insertedCount
  }

  /**
   * Get default permissions seed data
   *
   * @param orgId - Organization ID
   * @returns Array of default permissions
   */
  static getDefaultPermissions(orgId: string): Omit<Permission, '_id'>[] {
    const now = new Date()
    const permissions: Omit<Permission, '_id'>[] = []

    // Helper function to create permission
    const createPerm = (
      module: string,
      action: string,
      description: string,
      resource?: string
    ): Omit<Permission, '_id'> => ({
      orgId,
      module,
      action,
      resource,
      permissionKey: resource ? `${module}.${action}.${resource}` : `${module}.${action}`,
      description,
      isSystem: true,
      createdAt: now,
      updatedAt: now,
    })

    // Unified Tickets (includes Tickets, Incidents, Changes, Service Requests, Problems)
    permissions.push(
      // Basic ticket permissions
      createPerm('tickets', 'view', 'View tickets', 'own'),
      createPerm('tickets', 'view', 'View all tickets', 'all'),
      createPerm('tickets', 'create', 'Create tickets'),
      createPerm('tickets', 'edit', 'Edit tickets', 'own'),
      createPerm('tickets', 'edit', 'Edit all tickets', 'all'),
      createPerm('tickets', 'delete', 'Delete tickets'),
      createPerm('tickets', 'assign', 'Assign tickets to users'),
      createPerm('tickets', 'close', 'Close tickets'),
      createPerm('tickets', 'reopen', 'Reopen closed tickets'),
      createPerm('tickets', 'comment', 'Add comments to tickets'),

      // Type-specific permissions (ITIL compliance)
      createPerm('tickets', 'createIncident', 'Create incident tickets'),
      createPerm('tickets', 'manageIncident', 'Manage incident status and updates'),
      createPerm('tickets', 'publishIncident', 'Publish public incident status updates'),

      createPerm('tickets', 'createChange', 'Create change request tickets'),
      createPerm('tickets', 'approveChange', 'Approve change requests'),
      createPerm('tickets', 'implementChange', 'Implement approved changes'),

      createPerm('tickets', 'createServiceRequest', 'Create service request tickets'),
      createPerm('tickets', 'approveServiceRequest', 'Approve service requests'),

      createPerm('tickets', 'createProblem', 'Create problem tickets'),
      createPerm('tickets', 'manageProblem', 'Manage problem records and KEDB')
    )

    // Assets
    permissions.push(
      createPerm('assets', 'view', 'View assets'),
      createPerm('assets', 'create', 'Create assets'),
      createPerm('assets', 'edit', 'Edit assets'),
      createPerm('assets', 'delete', 'Delete assets'),
      createPerm('assets', 'manage', 'Manage asset lifecycle'),
      createPerm('assets', 'remoteControl', 'Use remote control on assets')
    )

    // Projects (Enhanced for Project Management Uplift - Phase 1)
    permissions.push(
      // Basic project permissions
      createPerm('projects', 'view', 'View projects', 'own'),
      createPerm('projects', 'view', 'View assigned projects', 'assigned'),
      createPerm('projects', 'view', 'View all projects', 'all'),
      createPerm('projects', 'create', 'Create projects'),
      createPerm('projects', 'edit', 'Edit own projects', 'own'),
      createPerm('projects', 'edit', 'Edit all projects', 'all'),
      createPerm('projects', 'delete', 'Delete projects'),
      createPerm('projects', 'manage', 'Full project management (tasks, milestones, resources)'),

      // Portfolio permissions
      createPerm('portfolios', 'view', 'View all portfolios', 'all'),
      createPerm('portfolios', 'view', 'View portfolios where user is manager', 'own'),
      createPerm('portfolios', 'create', 'Create new portfolios'),
      createPerm('portfolios', 'edit', 'Edit all portfolios', 'all'),
      createPerm('portfolios', 'edit', 'Edit own portfolios', 'own'),
      createPerm('portfolios', 'delete', 'Delete portfolios'),
      createPerm('portfolios', 'manage', 'Full portfolio management (rebalancing, prioritization)'),

      // Task permissions
      createPerm('projects', 'tasks', 'View project tasks', 'view'),
      createPerm('projects', 'tasks', 'Create tasks', 'create'),
      createPerm('projects', 'tasks', 'Edit all tasks', 'edit.all'),
      createPerm('projects', 'tasks', 'Edit assigned tasks', 'edit.assigned'),
      createPerm('projects', 'tasks', 'Delete tasks', 'delete'),

      // Resource allocation permissions
      createPerm('projects', 'resources', 'View resource allocations', 'view'),
      createPerm('projects', 'resources', 'Allocate resources to projects', 'allocate'),
      createPerm('projects', 'resources', 'Manage all resource allocations', 'manage'),

      // Financial permissions
      createPerm('projects', 'budget', 'View project budgets', 'view'),
      createPerm('projects', 'budget', 'Edit project budgets', 'edit'),
      createPerm('projects', 'financials', 'Manage financial tracking (EVM, invoicing)', 'manage'),

      // RAID register permissions
      createPerm('projects', 'raid', 'View RAID register', 'view'),
      createPerm('projects', 'raid', 'Manage risks, issues, assumptions, decisions', 'manage'),

      // Gate review permissions
      createPerm('projects', 'gates', 'View gate reviews', 'view'),
      createPerm('projects', 'gates', 'Approve gate reviews', 'approve'),

      // Document permissions
      createPerm('projects', 'documents', 'View project documents', 'view'),
      createPerm('projects', 'documents', 'Upload documents', 'upload'),
      createPerm('projects', 'documents', 'Delete documents', 'delete'),

      // Time tracking permissions
      createPerm('projects', 'time', 'Log time to projects', 'log'),
      createPerm('projects', 'time', 'Approve time entries', 'approve'),
      createPerm('projects', 'time', 'View all time entries', 'view.all'),

      // Analytics permissions
      createPerm('projects', 'analytics', 'View project analytics', 'view'),
      createPerm('projects', 'reports', 'Generate custom reports', 'generate')
    )

    // Knowledge Base
    permissions.push(
      createPerm('kb', 'view', 'View knowledge base articles'),
      createPerm('kb', 'create', 'Create knowledge base articles'),
      createPerm('kb', 'edit', 'Edit knowledge base articles', 'own'),
      createPerm('kb', 'edit', 'Edit all knowledge base articles', 'all'),
      createPerm('kb', 'delete', 'Delete knowledge base articles'),
      createPerm('kb', 'publish', 'Publish articles as public')
    )

    // Users
    permissions.push(
      createPerm('users', 'view', 'View users'),
      createPerm('users', 'create', 'Create users'),
      createPerm('users', 'edit', 'Edit users'),
      createPerm('users', 'delete', 'Delete users'),
      createPerm('users', 'manage', 'Manage user roles and permissions')
    )

    // Roles
    permissions.push(
      createPerm('roles', 'view', 'View roles'),
      createPerm('roles', 'create', 'Create custom roles'),
      createPerm('roles', 'edit', 'Edit custom roles'),
      createPerm('roles', 'delete', 'Delete custom roles'),
      createPerm('roles', 'assign', 'Assign roles to users')
    )

    // Clients (MSP mode)
    permissions.push(
      createPerm('clients', 'view', 'View clients'),
      createPerm('clients', 'create', 'Create clients'),
      createPerm('clients', 'edit', 'Edit clients'),
      createPerm('clients', 'delete', 'Delete clients'),
      createPerm('clients', 'manage', 'Manage client contracts and quotes')
    )

    // Schedule
    permissions.push(
      createPerm('schedule', 'view', 'View schedule', 'own'),
      createPerm('schedule', 'view', 'View all schedules', 'all'),
      createPerm('schedule', 'create', 'Create schedule items'),
      createPerm('schedule', 'edit', 'Edit schedule items'),
      createPerm('schedule', 'delete', 'Delete schedule items')
    )

    // Reports
    permissions.push(
      createPerm('reports', 'view', 'View reports'),
      createPerm('reports', 'create', 'Create custom reports'),
      createPerm('reports', 'export', 'Export reports')
    )

    // Settings
    permissions.push(
      createPerm('settings', 'view', 'View organization settings'),
      createPerm('settings', 'edit', 'Edit organization settings'),
      createPerm('settings', 'manage', 'Manage advanced settings')
    )

    // Portal Composer
    permissions.push(
      createPerm('portal', 'view', 'View portal pages'),
      createPerm('portal', 'create', 'Create new portal pages'),
      createPerm('portal', 'edit', 'Edit portal pages'),
      createPerm('portal', 'publish', 'Publish portal pages'),
      createPerm('portal', 'delete', 'Delete portal pages'),
      createPerm('portal', 'theme', 'Edit portal themes', 'edit'),
      createPerm('portal', 'datasource', 'Manage data sources', 'edit')
    )

    return permissions
  }

  /**
   * Get ITSM role permissions mapping
   * Defines comprehensive permission sets for each ITSM role
   *
   * @param roleName - Role name
   * @returns Array of permission keys
   */
  static getITSMRolePermissions(roleName: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      'system_administrator': [
        // Full access to everything - highest privilege
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.delete',
        'tickets.assign',
        'tickets.close',
        'tickets.reopen',
        'tickets.comment',
        'tickets.createIncident',
        'tickets.manageIncident',
        'tickets.publishIncident',
        'tickets.createChange',
        'tickets.approveChange',
        'tickets.implementChange',
        'tickets.createServiceRequest',
        'tickets.approveServiceRequest',
        'tickets.createProblem',
        'tickets.manageProblem',
        'assets.view',
        'assets.create',
        'assets.edit',
        'assets.delete',
        'assets.manage',
        'assets.remoteControl',

        // All project permissions
        'projects.view.all',
        'projects.view.assigned',
        'projects.view.own',
        'projects.create',
        'projects.edit.all',
        'projects.edit.own',
        'projects.delete',
        'projects.manage',

        // All portfolio permissions
        'portfolios.view.all',
        'portfolios.view.own',
        'portfolios.create',
        'portfolios.edit.all',
        'portfolios.edit.own',
        'portfolios.delete',
        'portfolios.manage',

        // All task permissions
        'projects.tasks.view',
        'projects.tasks.create',
        'projects.tasks.edit.all',
        'projects.tasks.edit.assigned',
        'projects.tasks.delete',

        // All resource permissions
        'projects.resources.view',
        'projects.resources.allocate',
        'projects.resources.manage',

        // All financial permissions
        'projects.budget.view',
        'projects.budget.edit',
        'projects.financials.manage',

        // All RAID permissions
        'projects.raid.view',
        'projects.raid.manage',

        // All gate permissions
        'projects.gates.view',
        'projects.gates.approve',

        // All document permissions
        'projects.documents.view',
        'projects.documents.upload',
        'projects.documents.delete',

        // All time tracking permissions
        'projects.time.log',
        'projects.time.approve',
        'projects.time.view.all',

        // All analytics permissions
        'projects.analytics.view',
        'projects.reports.generate',

        'kb.view',
        'kb.create',
        'kb.edit.all',
        'kb.delete',
        'kb.publish',
        'users.view',
        'users.create',
        'users.edit',
        'users.delete',
        'users.manage',
        'roles.view',
        'roles.create',
        'roles.edit',
        'roles.delete',
        'roles.assign',
        'clients.view',
        'clients.create',
        'clients.edit',
        'clients.delete',
        'clients.manage',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'schedule.delete',
        'reports.view',
        'reports.create',
        'reports.export',
        'settings.view',
        'settings.edit',
        'settings.manage',
        'portal.view',
        'portal.create',
        'portal.edit',
        'portal.publish',
        'portal.delete',
        'portal.theme.edit',
        'portal.datasource.edit',
      ],
      'service_desk_manager': [
        // Manages service desk operations, teams, queues, SLAs
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.delete',
        'tickets.assign',
        'tickets.close',
        'tickets.reopen',
        'tickets.comment',
        'tickets.createIncident',
        'tickets.manageIncident',
        'tickets.publishIncident',
        'tickets.createChange',
        'tickets.approveChange',
        'tickets.createServiceRequest',
        'tickets.approveServiceRequest',
        'tickets.createProblem',
        'tickets.manageProblem',
        'assets.view',
        'assets.create',
        'assets.edit',
        'projects.view.all',
        'projects.create',
        'projects.edit.all',
        'kb.view',
        'kb.create',
        'kb.edit.all',
        'kb.publish',
        'users.view',
        'users.create',
        'users.edit',
        'roles.view',
        'clients.view',
        'clients.create',
        'clients.edit',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'schedule.delete',
        'reports.view',
        'reports.create',
        'reports.export',
        'settings.view',
        'portal.view',
        'portal.edit',
      ],
      'service_desk_agent': [
        // Front-line support - handles tickets, incidents, service requests
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.assign',
        'tickets.close',
        'tickets.reopen',
        'tickets.comment',
        'tickets.createIncident',
        'tickets.manageIncident',
        'tickets.createChange',
        'tickets.implementChange',
        'tickets.createServiceRequest',
        'tickets.createProblem',
        'assets.view',
        'assets.create',
        'assets.edit',
        'assets.remoteControl',

        // Project permissions for assigned projects
        'projects.view.assigned',
        'projects.view.own',
        'projects.create',
        'projects.edit.own',

        // Task permissions
        'projects.tasks.view',
        'projects.tasks.edit.assigned',

        // Time tracking
        'projects.time.log',

        // Documents
        'projects.documents.view',

        // RAID (view only)
        'projects.raid.view',

        'kb.view',
        'kb.create',
        'kb.edit.own',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'reports.view',
        'settings.view',
      ],
      'technical_lead': [
        // Advanced technical support - escalations, complex issues
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.assign',
        'tickets.close',
        'tickets.reopen',
        'tickets.comment',
        'tickets.createIncident',
        'tickets.manageIncident',
        'tickets.publishIncident',
        'tickets.createChange',
        'tickets.implementChange',
        'tickets.createServiceRequest',
        'tickets.createProblem',
        'tickets.manageProblem',
        'assets.view',
        'assets.create',
        'assets.edit',
        'assets.manage',
        'assets.remoteControl',
        'projects.view.all',
        'projects.create',
        'projects.edit.all',
        'projects.manage',
        'kb.view',
        'kb.create',
        'kb.edit.all',
        'kb.publish',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'reports.view',
        'reports.create',
        'settings.view',
      ],
      'problem_manager': [
        // Problem management specialist - root cause analysis, KEDB
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.comment',
        'tickets.createIncident',
        'tickets.createProblem',
        'tickets.manageProblem',
        'assets.view',
        'kb.view',
        'kb.create',
        'kb.edit.all',
        'kb.publish',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'reports.view',
        'reports.create',
        'reports.export',
        'settings.view',
      ],
      'change_manager': [
        // Change management specialist - CAB, approvals, change control
        'tickets.view.all',
        'tickets.create',
        'tickets.edit.all',
        'tickets.comment',
        'tickets.createChange',
        'tickets.approveChange',
        'tickets.implementChange',
        'tickets.createIncident',
        'assets.view',
        'projects.view.all',
        'projects.create',
        'projects.edit.all',
        'kb.view',
        'kb.create',
        'kb.edit.own',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'reports.view',
        'reports.create',
        'settings.view',
      ],
      'asset_manager': [
        // IT asset management specialist
        'tickets.view.all',
        'tickets.create',
        'tickets.comment',
        'tickets.createServiceRequest',
        'assets.view',
        'assets.create',
        'assets.edit',
        'assets.delete',
        'assets.manage',
        'assets.remoteControl',
        'projects.view.all',
        'kb.view',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'reports.view',
        'reports.create',
        'settings.view',
      ],
      'project_manager': [
        // Project management specialist - full project/portfolio management
        'tickets.view.all',
        'tickets.create',
        'tickets.comment',
        'tickets.createServiceRequest',
        'assets.view',

        // Enhanced project permissions
        'projects.view.all',
        'projects.view.assigned',
        'projects.create',
        'projects.edit.all',
        'projects.delete',
        'projects.manage',

        // Portfolio permissions
        'portfolios.view.all',
        'portfolios.view.own',
        'portfolios.create',
        'portfolios.edit.own',
        'portfolios.manage',

        // Task management
        'projects.tasks.view',
        'projects.tasks.create',
        'projects.tasks.edit.all',
        'projects.tasks.delete',

        // Resource management
        'projects.resources.view',
        'projects.resources.allocate',
        'projects.resources.manage',

        // Financial management
        'projects.budget.view',
        'projects.budget.edit',
        'projects.financials.manage',

        // RAID management
        'projects.raid.view',
        'projects.raid.manage',

        // Gate reviews
        'projects.gates.view',
        'projects.gates.approve',

        // Documents
        'projects.documents.view',
        'projects.documents.upload',
        'projects.documents.delete',

        // Time tracking
        'projects.time.log',
        'projects.time.approve',
        'projects.time.view.all',

        // Analytics
        'projects.analytics.view',
        'projects.reports.generate',

        'kb.view',
        'users.view',
        'clients.view',
        'clients.create',
        'clients.edit',
        'schedule.view.all',
        'schedule.create',
        'schedule.edit',
        'schedule.delete',
        'reports.view',
        'reports.create',
        'settings.view',
      ],
      'portfolio_manager': [
        // Portfolio management specialist - oversees multiple projects
        'tickets.view.all',
        'tickets.create',
        'tickets.comment',
        'assets.view',

        // Portfolio-focused permissions
        'portfolios.view.all',
        'portfolios.create',
        'portfolios.edit.all',
        'portfolios.delete',
        'portfolios.manage',

        // Project visibility (all projects in portfolio)
        'projects.view.all',
        'projects.create',
        'projects.edit.all',

        // Analytics and reporting
        'projects.analytics.view',
        'projects.reports.generate',

        // Resource planning
        'projects.resources.view',
        'projects.resources.allocate',

        // Budget oversight
        'projects.budget.view',

        // RAID visibility
        'projects.raid.view',

        // Gate approvals
        'projects.gates.view',
        'projects.gates.approve',

        'kb.view',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'reports.view',
        'reports.create',
        'reports.export',
        'settings.view',
      ],
      'knowledge_manager': [
        // Knowledge base specialist - content curation
        'tickets.view.all',
        'tickets.create',
        'tickets.comment',
        'kb.view',
        'kb.create',
        'kb.edit.all',
        'kb.delete',
        'kb.publish',
        'assets.view',
        'users.view',
        'clients.view',
        'schedule.view.own',
        'reports.view',
        'settings.view',
        'portal.view',
        'portal.edit',
      ],
      'end_user': [
        // Basic user - create tickets, view own items
        'tickets.view.own',
        'tickets.create',
        'tickets.edit.own',
        'tickets.comment',
        'tickets.createServiceRequest',
        'assets.view',
        'projects.view.own',
        'kb.view',
        'schedule.view.own',
      ],
      'read_only': [
        // View-only access - auditors, observers
        'tickets.view.all',
        'assets.view',
        'projects.view.all',
        'kb.view',
        'users.view',
        'clients.view',
        'schedule.view.all',
        'reports.view',
        'settings.view',
      ],
    }

    return rolePermissions[roleName] || []
  }

  /**
   * Get legacy role permissions for backward compatibility
   *
   * @param role - Legacy role name
   * @returns Array of permission keys
   */
  static getLegacyRolePermissions(role: string): string[] {
    // Map legacy roles to ITSM roles
    const legacyToITSM: Record<string, string> = {
      admin: 'system_administrator',
      technician: 'service_desk_agent',
      user: 'end_user',
    }

    const itsmRole = legacyToITSM[role] || role
    return this.getITSMRolePermissions(itsmRole)
  }

  /**
   * Grant a permission to a user (override)
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param permissionKey - Permission key to grant
   * @param grantedBy - User ID who granted the permission
   * @param expiresAt - Optional expiration date
   * @param reason - Optional reason for granting
   */
  static async grantPermissionToUser(
    userId: string,
    orgId: string,
    permissionKey: string,
    grantedBy: string,
    expiresAt?: Date,
    reason?: string
  ): Promise<void> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const override: UserPermission = {
      userId,
      permissionKey,
      granted: true,
      grantedBy,
      grantedAt: new Date(),
      expiresAt,
      reason,
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId), orgId },
      {
        $push: { permissionOverrides: override },
        $set: { updatedAt: new Date() },
      }
    )
  }

  /**
   * Revoke a permission from a user (override)
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param permissionKey - Permission key to revoke
   * @param revokedBy - User ID who revoked the permission
   * @param reason - Optional reason for revoking
   */
  static async revokePermissionFromUser(
    userId: string,
    orgId: string,
    permissionKey: string,
    revokedBy: string,
    reason?: string
  ): Promise<void> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const override: UserPermission = {
      userId,
      permissionKey,
      granted: false,
      grantedBy: revokedBy,
      grantedAt: new Date(),
      reason,
    }

    await usersCollection.updateOne(
      { _id: new ObjectId(userId), orgId },
      {
        $push: { permissionOverrides: override },
        $set: { updatedAt: new Date() },
      }
    )
  }

  /**
   * Remove all permission overrides for a user
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   */
  static async clearUserPermissionOverrides(
    userId: string,
    orgId: string
  ): Promise<void> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    await usersCollection.updateOne(
      { _id: new ObjectId(userId), orgId },
      {
        $set: {
          permissionOverrides: [],
          updatedAt: new Date(),
        },
      }
    )
  }
}
