import { Session } from 'next-auth'
import { PermissionService } from './permissions'

/**
 * ProjectPermissionService
 *
 * Helper service for common project management permission checks.
 * Provides convenient methods for checking project-related permissions.
 */
export class ProjectPermissionService {
  /**
   * Check if user can view all projects in the organization
   */
  static async canViewAllProjects(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.id,
      session.user.orgId,
      'projects.view.all'
    )
  }

  /**
   * Check if user can view a specific project
   *
   * @param session - User session
   * @param project - Project object with projectManager and teamMembers
   */
  static async canViewProject(
    session: Session | null,
    project: { projectManager: string; teamMembers?: string[] }
  ): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    const userId = session.user.id

    // Check if user has permission to view all projects
    const canViewAll = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.view.all'
    )
    if (canViewAll) return true

    // Check if user has permission to view own projects and is the PM
    const canViewOwn = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.view.own'
    )
    if (canViewOwn && project.projectManager === userId) return true

    // Check if user has permission to view assigned projects and is a team member
    const canViewAssigned = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.view.assigned'
    )
    if (canViewAssigned && project.teamMembers?.includes(userId)) return true

    return false
  }

  /**
   * Check if user can edit a specific project
   */
  static async canEditProject(
    session: Session | null,
    project: { projectManager: string }
  ): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    const userId = session.user.userId

    // Check if user has permission to edit all projects
    const canEditAll = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.edit.all'
    )
    if (canEditAll) return true

    // Check if user has permission to edit own projects and is the PM
    const canEditOwn = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.edit.own'
    )
    if (canEditOwn && project.projectManager === userId) return true

    return false
  }

  /**
   * Check if user can manage project (tasks, milestones, resources)
   */
  static async canManageProject(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.manage'
    )
  }

  /**
   * Check if user can delete projects
   */
  static async canDeleteProjects(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.delete'
    )
  }

  /**
   * Check if user can view portfolios
   */
  static async canViewPortfolios(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasAnyPermission(
      session.user.userId,
      session.user.orgId,
      ['portfolios.view.all', 'portfolios.view.own']
    )
  }

  /**
   * Check if user can manage portfolios
   */
  static async canManagePortfolios(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'portfolios.manage'
    )
  }

  /**
   * Check if user can edit a task
   */
  static async canEditTask(
    session: Session | null,
    task: { assignedTo?: string }
  ): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    const userId = session.user.userId

    // Check if user has permission to edit all tasks
    const canEditAll = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.tasks.edit.all'
    )
    if (canEditAll) return true

    // Check if user has permission to edit assigned tasks and is the assignee
    const canEditAssigned = await PermissionService.hasPermission(
      userId,
      session.user.orgId,
      'projects.tasks.edit.assigned'
    )
    if (canEditAssigned && task.assignedTo === userId) return true

    return false
  }

  /**
   * Check if user can allocate resources
   */
  static async canAllocateResources(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasAnyPermission(
      session.user.userId,
      session.user.orgId,
      ['projects.resources.allocate', 'projects.resources.manage']
    )
  }

  /**
   * Check if user can view budgets
   */
  static async canViewBudgets(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.budget.view'
    )
  }

  /**
   * Check if user can edit budgets
   */
  static async canEditBudgets(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.budget.edit'
    )
  }

  /**
   * Check if user can manage financials (EVM, invoicing)
   */
  static async canManageFinancials(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.financials.manage'
    )
  }

  /**
   * Check if user can manage RAID register
   */
  static async canManageRAID(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.raid.manage'
    )
  }

  /**
   * Check if user can approve gate reviews
   */
  static async canApproveGates(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.gates.approve'
    )
  }

  /**
   * Check if user can upload documents
   */
  static async canUploadDocuments(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.documents.upload'
    )
  }

  /**
   * Check if user can log time
   */
  static async canLogTime(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.time.log'
    )
  }

  /**
   * Check if user can approve time entries
   */
  static async canApproveTime(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.time.approve'
    )
  }

  /**
   * Check if user can view analytics
   */
  static async canViewAnalytics(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.analytics.view'
    )
  }

  /**
   * Check if user can generate reports
   */
  static async canGenerateReports(session: Session | null): Promise<boolean> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return false
    }

    return await PermissionService.hasPermission(
      session.user.userId,
      session.user.orgId,
      'projects.reports.generate'
    )
  }

  /**
   * Get all project-related permissions for a user
   * Useful for determining what UI elements to show/hide
   */
  static async getProjectPermissions(session: Session | null): Promise<{
    canViewAll: boolean
    canViewOwn: boolean
    canViewAssigned: boolean
    canCreate: boolean
    canEditAll: boolean
    canEditOwn: boolean
    canDelete: boolean
    canManage: boolean
    canViewBudgets: boolean
    canEditBudgets: boolean
    canManageFinancials: boolean
    canAllocateResources: boolean
    canManageRAID: boolean
    canApproveGates: boolean
    canViewAnalytics: boolean
    canGenerateReports: boolean
  }> {
    if (!session?.user?.id || !session?.user?.orgId) {
      return {
        canViewAll: false,
        canViewOwn: false,
        canViewAssigned: false,
        canCreate: false,
        canEditAll: false,
        canEditOwn: false,
        canDelete: false,
        canManage: false,
        canViewBudgets: false,
        canEditBudgets: false,
        canManageFinancials: false,
        canAllocateResources: false,
        canManageRAID: false,
        canApproveGates: false,
        canViewAnalytics: false,
        canGenerateReports: false,
      }
    }

    const userId = session.user.userId
    const orgId = session.user.orgId

    // Batch check all permissions at once
    const [
      canViewAll,
      canViewOwn,
      canViewAssigned,
      canCreate,
      canEditAll,
      canEditOwn,
      canDelete,
      canManage,
      canViewBudgets,
      canEditBudgets,
      canManageFinancials,
      canAllocateResources,
      canManageRAID,
      canApproveGates,
      canViewAnalytics,
      canGenerateReports,
    ] = await Promise.all([
      PermissionService.hasPermission(userId, orgId, 'projects.view.all'),
      PermissionService.hasPermission(userId, orgId, 'projects.view.own'),
      PermissionService.hasPermission(userId, orgId, 'projects.view.assigned'),
      PermissionService.hasPermission(userId, orgId, 'projects.create'),
      PermissionService.hasPermission(userId, orgId, 'projects.edit.all'),
      PermissionService.hasPermission(userId, orgId, 'projects.edit.own'),
      PermissionService.hasPermission(userId, orgId, 'projects.delete'),
      PermissionService.hasPermission(userId, orgId, 'projects.manage'),
      PermissionService.hasPermission(userId, orgId, 'projects.budget.view'),
      PermissionService.hasPermission(userId, orgId, 'projects.budget.edit'),
      PermissionService.hasPermission(userId, orgId, 'projects.financials.manage'),
      PermissionService.hasAnyPermission(userId, orgId, [
        'projects.resources.allocate',
        'projects.resources.manage',
      ]),
      PermissionService.hasPermission(userId, orgId, 'projects.raid.manage'),
      PermissionService.hasPermission(userId, orgId, 'projects.gates.approve'),
      PermissionService.hasPermission(userId, orgId, 'projects.analytics.view'),
      PermissionService.hasPermission(userId, orgId, 'projects.reports.generate'),
    ])

    return {
      canViewAll,
      canViewOwn,
      canViewAssigned,
      canCreate,
      canEditAll,
      canEditOwn,
      canDelete,
      canManage,
      canViewBudgets,
      canEditBudgets,
      canManageFinancials,
      canAllocateResources,
      canManageRAID,
      canApproveGates,
      canViewAnalytics,
      canGenerateReports,
    }
  }
}
