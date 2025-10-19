import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Role, User, RoleAssignmentHistory } from '@/lib/types'
import { PermissionService } from './permissions'

/**
 * RoleService
 *
 * Manages roles in the RBAC system.
 * Handles role CRUD operations, assignment, and default role seeding.
 */
export class RoleService {
  /**
   * Create a new role
   *
   * @param orgId - Organization ID
   * @param createdBy - User ID who created the role
   * @param roleData - Role data
   * @returns Created role
   */
  static async createRole(
    orgId: string,
    createdBy: string,
    roleData: {
      name: string
      displayName: string
      description: string
      permissions: string[]
      color?: string
      icon?: string
    }
  ): Promise<Role> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    // Check if role name already exists
    const existing = await rolesCollection.findOne({
      orgId,
      name: roleData.name,
    })

    if (existing) {
      throw new Error('Role with this name already exists')
    }

    const now = new Date()
    const role: Omit<Role, '_id'> = {
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
      createdAt: now,
      updatedAt: now,
    }

    const result = await rolesCollection.insertOne(role as Role)

    return {
      ...role,
      _id: result.insertedId,
    } as Role
  }

  /**
   * Update a role
   *
   * @param orgId - Organization ID
   * @param roleId - Role ID to update
   * @param updates - Fields to update
   * @returns Updated role or null if not found
   */
  static async updateRole(
    orgId: string,
    roleId: string,
    updates: {
      displayName?: string
      description?: string
      permissions?: string[]
      isActive?: boolean
      color?: string
      icon?: string
    }
  ): Promise<Role | null> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    // Prevent updating system roles
    const role = await rolesCollection.findOne({
      _id: new ObjectId(roleId),
      orgId,
    })

    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot update system roles')
    }

    const result = await rolesCollection.findOneAndUpdate(
      { _id: new ObjectId(roleId), orgId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete a role
   *
   * @param orgId - Organization ID
   * @param roleId - Role ID to delete
   * @returns True if deleted successfully
   */
  static async deleteRole(orgId: string, roleId: string): Promise<boolean> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    // Prevent deleting system roles
    const role = await rolesCollection.findOne({
      _id: new ObjectId(roleId),
      orgId,
    })

    if (!role) {
      throw new Error('Role not found')
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles')
    }

    // Check if any users have this role
    const userCount = await usersCollection.countDocuments({
      orgId,
      roleId,
      isActive: true,
    })

    if (userCount > 0) {
      throw new Error(`Cannot delete role. ${userCount} user(s) are assigned to this role.`)
    }

    const result = await rolesCollection.deleteOne({
      _id: new ObjectId(roleId),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Get a role by ID
   *
   * @param orgId - Organization ID
   * @param roleId - Role ID
   * @returns Role or null if not found
   */
  static async getRole(orgId: string, roleId: string): Promise<Role | null> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    return await rolesCollection.findOne({
      _id: new ObjectId(roleId),
      orgId,
    })
  }

  /**
   * Get all roles for an organization
   *
   * @param orgId - Organization ID
   * @param includeInactive - Include inactive roles
   * @returns Array of roles with user counts
   */
  static async getAllRoles(
    orgId: string,
    includeInactive: boolean = false
  ): Promise<Role[]> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    const query: any = { orgId }
    if (!includeInactive) {
      query.isActive = true
    }

    const roles = await rolesCollection.find(query).sort({ isSystem: -1, displayName: 1 }).toArray()

    // Add user counts to each role
    const rolesWithCounts = await Promise.all(
      roles.map(async (role) => {
        const userCount = await usersCollection.countDocuments({
          orgId,
          roleId: role._id.toString(),
          isActive: true,
        })

        return {
          ...role,
          userCount,
        }
      })
    )

    return rolesWithCounts
  }

  /**
   * Clone a role (create a copy with a new name)
   *
   * @param orgId - Organization ID
   * @param sourceRoleId - Role ID to clone
   * @param newName - Name for the new role
   * @param newDisplayName - Display name for the new role
   * @param createdBy - User ID who created the clone
   * @returns Cloned role
   */
  static async cloneRole(
    orgId: string,
    sourceRoleId: string,
    newName: string,
    newDisplayName: string,
    createdBy: string
  ): Promise<Role> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    // Get source role
    const sourceRole = await rolesCollection.findOne({
      _id: new ObjectId(sourceRoleId),
      orgId,
    })

    if (!sourceRole) {
      throw new Error('Source role not found')
    }

    // Check if new name already exists
    const existing = await rolesCollection.findOne({
      orgId,
      name: newName,
    })

    if (existing) {
      throw new Error('Role with this name already exists')
    }

    const now = new Date()
    const newRole: Omit<Role, '_id'> = {
      orgId,
      name: newName,
      displayName: newDisplayName,
      description: `${sourceRole.description} (Copy)`,
      permissions: [...sourceRole.permissions],
      isSystem: false,
      isActive: true,
      color: sourceRole.color,
      icon: sourceRole.icon,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await rolesCollection.insertOne(newRole as Role)

    return {
      ...newRole,
      _id: result.insertedId,
    } as Role
  }

  /**
   * Assign a role to a user
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @param roleId - Role ID to assign
   * @param assignedBy - User ID who assigned the role
   * @param reason - Optional reason for the assignment
   * @returns True if assigned successfully
   */
  static async assignRoleToUser(
    userId: string,
    orgId: string,
    roleId: string,
    assignedBy: string,
    reason?: string
  ): Promise<boolean> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)
    const historyCollection = db.collection<RoleAssignmentHistory>(
      COLLECTIONS.ROLE_ASSIGNMENT_HISTORY
    )

    // Verify role exists
    const role = await rolesCollection.findOne({
      _id: new ObjectId(roleId),
      orgId,
      isActive: true,
    })

    if (!role) {
      throw new Error('Role not found or inactive')
    }

    // Get user's current role for history
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
      orgId,
    })

    if (!user) {
      throw new Error('User not found')
    }

    const previousRoleId = user.roleId

    // Update user's role
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId), orgId },
      {
        $set: {
          roleId,
          updatedAt: new Date(),
        },
        // Clear custom permissions and overrides when assigning new role
        $unset: {
          customPermissions: '',
          permissionOverrides: '',
        },
      }
    )

    // Record role assignment history
    if (result.modifiedCount > 0) {
      const historyRecord: Omit<RoleAssignmentHistory, '_id'> = {
        orgId,
        userId,
        previousRoleId,
        newRoleId: roleId,
        changedBy: assignedBy,
        changedAt: new Date(),
        reason,
      }

      await historyCollection.insertOne(historyRecord as RoleAssignmentHistory)
    }

    return result.modifiedCount > 0
  }

  /**
   * Get role permissions
   *
   * @param roleId - Role ID
   * @returns Array of permission keys
   */
  static async getRolePermissions(roleId: string): Promise<string[]> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    const role = await rolesCollection.findOne({
      _id: new ObjectId(roleId),
    })

    return role?.permissions || []
  }

  /**
   * Get role assignment history for a user
   *
   * @param userId - User ID
   * @param orgId - Organization ID
   * @returns Array of role assignment history
   */
  static async getRoleAssignmentHistory(
    userId: string,
    orgId: string
  ): Promise<RoleAssignmentHistory[]> {
    const db = await getDatabase()
    const historyCollection = db.collection<RoleAssignmentHistory>(
      COLLECTIONS.ROLE_ASSIGNMENT_HISTORY
    )

    return await historyCollection
      .find({ orgId, userId })
      .sort({ changedAt: -1 })
      .toArray()
  }

  /**
   * Seed default roles for an organization
   *
   * @param orgId - Organization ID
   * @returns Number of roles created
   */
  static async seedDefaultRoles(orgId: string): Promise<number> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    // Check if roles already exist
    const existingCount = await rolesCollection.countDocuments({ orgId })
    if (existingCount > 0) {
      throw new Error('Roles already exist for this organization')
    }

    const defaultRoles = this.getDefaultRoles(orgId)

    const result = await rolesCollection.insertMany(defaultRoles as Role[])

    return result.insertedCount
  }

  /**
   * Get default roles seed data
   *
   * @param orgId - Organization ID
   * @returns Array of default roles
   */
  static getDefaultRoles(orgId: string): Omit<Role, '_id'>[] {
    const now = new Date()

    return [
      {
        orgId,
        name: 'admin',
        displayName: 'Administrator',
        description: 'Full access to all features and settings',
        permissions: PermissionService.getLegacyRolePermissions('admin'),
        isSystem: true,
        isActive: true,
        color: '#ef4444', // red
        icon: 'ShieldCheck',
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        orgId,
        name: 'technician',
        displayName: 'Technician',
        description: 'Access to tickets, assets, and projects',
        permissions: PermissionService.getLegacyRolePermissions('technician'),
        isSystem: true,
        isActive: true,
        color: '#3b82f6', // blue
        icon: 'Wrench',
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
      {
        orgId,
        name: 'user',
        displayName: 'End User',
        description: 'Basic access to view and create tickets',
        permissions: PermissionService.getLegacyRolePermissions('user'),
        isSystem: true,
        isActive: true,
        color: '#22c55e', // green
        icon: 'User',
        createdBy: 'system',
        createdAt: now,
        updatedAt: now,
      },
    ]
  }

  /**
   * Get default role ID by name
   *
   * @param orgId - Organization ID
   * @param roleName - Role name (admin, technician, user)
   * @returns Role ID or null if not found
   */
  static async getDefaultRoleId(orgId: string, roleName: string): Promise<string | null> {
    const db = await getDatabase()
    const rolesCollection = db.collection<Role>(COLLECTIONS.ROLES)

    const role = await rolesCollection.findOne({
      orgId,
      name: roleName,
      isSystem: true,
    })

    return role?._id.toString() || null
  }

  /**
   * Migrate users from legacy role system to RBAC
   *
   * @param orgId - Organization ID
   * @returns Number of users migrated
   */
  static async migrateUsersToRBAC(orgId: string): Promise<number> {
    const db = await getDatabase()
    const usersCollection = db.collection<User>(COLLECTIONS.USERS)

    // Get default role IDs
    const adminRoleId = await this.getDefaultRoleId(orgId, 'admin')
    const technicianRoleId = await this.getDefaultRoleId(orgId, 'technician')
    const userRoleId = await this.getDefaultRoleId(orgId, 'user')

    if (!adminRoleId || !technicianRoleId || !userRoleId) {
      throw new Error('Default roles not found. Please seed roles first.')
    }

    // Map legacy roles to role IDs
    const roleMap: Record<string, string> = {
      admin: adminRoleId,
      technician: technicianRoleId,
      user: userRoleId,
    }

    // Update all users without roleId
    let migratedCount = 0

    const usersToMigrate = await usersCollection.find({ orgId, roleId: { $exists: false } }).toArray()

    for (const user of usersToMigrate) {
      const roleId = roleMap[user.role]
      if (roleId) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              roleId,
              updatedAt: new Date(),
            },
          }
        )
        migratedCount++
      }
    }

    return migratedCount
  }
}
