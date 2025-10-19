import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

/**
 * Portal Audit Action Types
 */
export type PortalAuditAction =
  | 'page_create'
  | 'page_update'
  | 'page_publish'
  | 'page_unpublish'
  | 'page_delete'
  | 'page_restore'
  | 'theme_create'
  | 'theme_update'
  | 'theme_delete'
  | 'theme_set_default'
  | 'datasource_create'
  | 'datasource_update'
  | 'datasource_delete'
  | 'access_denied'
  | 'unauthorized_access'

/**
 * Portal Audit Log Entry
 */
export interface PortalAuditLog {
  _id: ObjectId
  orgId: string
  userId: string
  userName: string
  action: PortalAuditAction
  entityType: 'page' | 'theme' | 'datasource'
  entityId?: string
  entityName?: string
  changes?: {
    before?: Record<string, any>
    after?: Record<string, any>
    fields?: string[]
  }
  metadata?: {
    ipAddress?: string
    userAgent?: string
    timestamp: Date
    duration?: number // milliseconds
  }
  createdAt: Date
}

/**
 * Portal Audit Service
 *
 * Logs all portal composer actions for compliance and debugging
 */
export class PortalAuditService {
  /**
   * Log a portal action
   */
  static async logAction(params: {
    orgId: string
    userId: string
    userName: string
    action: PortalAuditAction
    entityType: 'page' | 'theme' | 'datasource'
    entityId?: string
    entityName?: string
    changes?: {
      before?: Record<string, any>
      after?: Record<string, any>
      fields?: string[]
    }
    metadata?: {
      ipAddress?: string
      userAgent?: string
      duration?: number
    }
  }): Promise<void> {
    try {
      const db = await getDatabase()
      const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

      const auditLog: Omit<PortalAuditLog, '_id'> = {
        orgId: params.orgId,
        userId: params.userId,
        userName: params.userName,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        entityName: params.entityName,
        changes: params.changes,
        metadata: {
          ...params.metadata,
          timestamp: new Date(),
        },
        createdAt: new Date(),
      }

      await auditCollection.insertOne(auditLog as PortalAuditLog)
    } catch (error) {
      console.error('Failed to log portal audit action:', error)
      // Don't throw - audit logging should not break application flow
    }
  }

  /**
   * Log page creation
   */
  static async logPageCreate(params: {
    orgId: string
    userId: string
    userName: string
    pageId: string
    pageName: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'page_create',
      entityType: 'page',
      entityId: params.pageId,
      entityName: params.pageName,
    })
  }

  /**
   * Log page update
   */
  static async logPageUpdate(params: {
    orgId: string
    userId: string
    userName: string
    pageId: string
    pageName: string
    changes: {
      before?: Record<string, any>
      after?: Record<string, any>
      fields: string[]
    }
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'page_update',
      entityType: 'page',
      entityId: params.pageId,
      entityName: params.pageName,
    })
  }

  /**
   * Log page publish
   */
  static async logPagePublish(params: {
    orgId: string
    userId: string
    userName: string
    pageId: string
    pageName: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'page_publish',
      entityType: 'page',
      entityId: params.pageId,
      entityName: params.pageName,
    })
  }

  /**
   * Log page unpublish
   */
  static async logPageUnpublish(params: {
    orgId: string
    userId: string
    userName: string
    pageId: string
    pageName: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'page_unpublish',
      entityType: 'page',
      entityId: params.pageId,
      entityName: params.pageName,
    })
  }

  /**
   * Log page deletion
   */
  static async logPageDelete(params: {
    orgId: string
    userId: string
    userName: string
    pageId: string
    pageName: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'page_delete',
      entityType: 'page',
      entityId: params.pageId,
      entityName: params.pageName,
    })
  }

  /**
   * Log theme changes
   */
  static async logThemeUpdate(params: {
    orgId: string
    userId: string
    userName: string
    themeId: string
    themeName: string
    changes: {
      before?: Record<string, any>
      after?: Record<string, any>
      fields: string[]
    }
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'theme_update',
      entityType: 'theme',
      entityId: params.themeId,
      entityName: params.themeName,
    })
  }

  /**
   * Log data source changes
   */
  static async logDataSourceUpdate(params: {
    orgId: string
    userId: string
    userName: string
    dataSourceId: string
    dataSourceName: string
    changes: {
      before?: Record<string, any>
      after?: Record<string, any>
      fields: string[]
    }
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'datasource_update',
      entityType: 'datasource',
      entityId: params.dataSourceId,
      entityName: params.dataSourceName,
    })
  }

  /**
   * Log unauthorized access attempts
   */
  static async logUnauthorizedAccess(params: {
    orgId: string
    userId: string
    userName: string
    entityType: 'page' | 'theme' | 'datasource'
    entityId?: string
    ipAddress?: string
    userAgent?: string
  }): Promise<void> {
    await this.logAction({
      ...params,
      action: 'unauthorized_access',
    })
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(params: {
    orgId: string
    entityType: 'page' | 'theme' | 'datasource'
    entityId: string
    limit?: number
  }): Promise<PortalAuditLog[]> {
    const db = await getDatabase()
    const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

    return await auditCollection
      .find({
        orgId: params.orgId,
        entityType: params.entityType,
        entityId: params.entityId,
      })
      .sort({ createdAt: -1 })
      .limit(params.limit || 50)
      .toArray()
  }

  /**
   * Get audit logs for an organization
   */
  static async getOrganizationAuditLogs(params: {
    orgId: string
    startDate?: Date
    endDate?: Date
    action?: PortalAuditAction
    userId?: string
    limit?: number
    skip?: number
  }): Promise<{ logs: PortalAuditLog[]; total: number }> {
    const db = await getDatabase()
    const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

    const filter: any = { orgId: params.orgId }

    if (params.startDate || params.endDate) {
      filter.createdAt = {}
      if (params.startDate) {
        filter.createdAt.$gte = params.startDate
      }
      if (params.endDate) {
        filter.createdAt.$lte = params.endDate
      }
    }

    if (params.action) {
      filter.action = params.action
    }

    if (params.userId) {
      filter.userId = params.userId
    }

    const total = await auditCollection.countDocuments(filter)

    const logs = await auditCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(params.limit || 50)
      .skip(params.skip || 0)
      .toArray()

    return { logs, total }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivitySummary(params: {
    orgId: string
    userId: string
    startDate?: Date
    endDate?: Date
  }): Promise<{
    totalActions: number
    actionsByType: Record<PortalAuditAction, number>
    recentActions: PortalAuditLog[]
  }> {
    const db = await getDatabase()
    const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

    const filter: any = {
      orgId: params.orgId,
      userId: params.userId,
    }

    if (params.startDate || params.endDate) {
      filter.createdAt = {}
      if (params.startDate) {
        filter.createdAt.$gte = params.startDate
      }
      if (params.endDate) {
        filter.createdAt.$lte = params.endDate
      }
    }

    const totalActions = await auditCollection.countDocuments(filter)

    const actionsByType: Record<string, number> = {}
    const logs = await auditCollection.find(filter).toArray()

    logs.forEach((log) => {
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1
    })

    const recentActions = await auditCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    return {
      totalActions,
      actionsByType: actionsByType as Record<PortalAuditAction, number>,
      recentActions,
    }
  }
}
