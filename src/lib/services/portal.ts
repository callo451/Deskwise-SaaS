import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  PortalPage,
  PortalPageVersion,
  PortalTheme,
  PortalDataSource,
  PortalAuditLog,
  PortalAuditAction,
  BlockInstance,
  PortalPageStatus,
  DataSource,
} from '@/lib/types'

// ============================================
// Portal Page Service
// ============================================

export interface CreatePageInput {
  title: string
  slug: string
  description?: string
  blocks?: BlockInstance[]
  dataSources?: DataSource[]
  themeId?: string
  isHomePage?: boolean
  isPublic?: boolean
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
  }
}

export interface UpdatePageInput {
  title?: string
  slug?: string
  description?: string
  blocks?: BlockInstance[]
  dataSources?: DataSource[]
  themeId?: string
  isHomePage?: boolean
  isPublic?: boolean
  seo?: any
}

export interface PageFilters {
  status?: PortalPageStatus | PortalPageStatus[]
  isPublic?: boolean
  isHomePage?: boolean
  search?: string
}

export class PortalPageService {
  /**
   * Create a new portal page
   */
  static async createPage(
    orgId: string,
    input: CreatePageInput,
    createdBy: string
  ): Promise<PortalPage> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Check if slug already exists
    const existing = await pagesCollection.findOne({ orgId, slug: input.slug })
    if (existing) {
      throw new Error(`A page with slug "${input.slug}" already exists`)
    }

    const now = new Date()
    const page: Omit<PortalPage, '_id'> = {
      orgId,
      title: input.title,
      slug: input.slug,
      description: input.description,
      status: 'draft',
      blocks: input.blocks || [],
      dataSources: input.dataSources || [],
      themeId: input.themeId,
      isPublic: input.isPublic ?? false,
      isHomePage: input.isHomePage ?? false,
      version: 1,
      order: 0,
      showInNav: true,
      viewCount: 0,
      seo: input.seo,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await pagesCollection.insertOne(page as PortalPage)

    // Log audit entry
    await this.logAudit(orgId, 'page_create', 'page', result.insertedId.toString(), input.title, createdBy, createdBy)

    return {
      ...page,
      _id: result.insertedId,
    } as PortalPage
  }

  /**
   * Get page by ID
   */
  static async getPageById(id: string, orgId: string): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    return await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get page by slug
   */
  static async getPageBySlug(slug: string, orgId: string): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    return await pagesCollection.findOne({
      slug,
      orgId,
    })
  }

  /**
   * List all pages for organization
   */
  static async listPages(orgId: string, filters?: PageFilters): Promise<PortalPage[]> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    const query: any = { orgId }

    if (filters?.status) {
      query.status = Array.isArray(filters.status)
        ? { $in: filters.status }
        : filters.status
    }

    if (filters?.isPublic !== undefined) {
      query.isPublic = filters.isPublic
    }

    if (filters?.isHomePage !== undefined) {
      query.isHomePage = filters.isHomePage
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { slug: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ]
    }

    return await pagesCollection
      .find(query)
      .sort({ order: 1, createdAt: -1 })
      .toArray()
  }

  /**
   * Update page draft
   */
  static async updatePage(
    id: string,
    orgId: string,
    updates: UpdatePageInput,
    updatedBy: string
  ): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Get current page for audit
    const currentPage = await this.getPageById(id, orgId)
    if (!currentPage) {
      throw new Error('Page not found')
    }

    // Check slug uniqueness if changing
    if (updates.slug && updates.slug !== currentPage.slug) {
      const existing = await pagesCollection.findOne({
        orgId,
        slug: updates.slug,
        _id: { $ne: new ObjectId(id) },
      })
      if (existing) {
        throw new Error(`A page with slug "${updates.slug}" already exists`)
      }
    }

    const now = new Date()
    const updateData: any = {
      ...updates,
      updatedAt: now,
    }

    // Increment version if blocks changed
    if (updates.blocks) {
      updateData.version = (currentPage.version || 1) + 1
    }

    const result = await pagesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result) {
      // Log audit entry
      await this.logAudit(
        orgId,
        'page_update',
        'page',
        id,
        result.title,
        updatedBy,
        updatedBy,
        {
          before: currentPage,
          after: result,
          fields: Object.keys(updates),
        }
      )
    }

    return result || null
  }

  /**
   * Publish page (move draft to published)
   */
  static async publishPage(
    id: string,
    orgId: string,
    publishedBy: string
  ): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)
    const versionsCollection = db.collection<PortalPageVersion>(COLLECTIONS.PORTAL_PAGE_VERSIONS)

    const page = await this.getPageById(id, orgId)
    if (!page) {
      throw new Error('Page not found')
    }

    const now = new Date()

    // Save version history
    const version: Omit<PortalPageVersion, '_id'> = {
      orgId,
      pageId: id,
      version: page.version,
      title: page.title,
      blocks: page.blocks,
      dataSources: page.dataSources,
      createdBy: publishedBy,
      createdAt: now,
      updatedAt: now,
    }
    await versionsCollection.insertOne(version as PortalPageVersion)

    // Update page status
    const result = await pagesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'published' as PortalPageStatus,
          publishedAt: now,
          publishedBy,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.logAudit(orgId, 'page_publish', 'page', id, result.title, publishedBy, publishedBy)
    }

    return result || null
  }

  /**
   * Unpublish page (revert to draft)
   */
  static async unpublishPage(
    id: string,
    orgId: string,
    unpublishedBy: string
  ): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    const now = new Date()
    const result = await pagesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'draft' as PortalPageStatus,
          updatedAt: now,
        },
        $unset: {
          publishedAt: '',
          publishedBy: '',
        },
      },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.logAudit(orgId, 'page_unpublish', 'page', id, result.title, unpublishedBy, unpublishedBy)
    }

    return result || null
  }

  /**
   * Delete page
   */
  static async deletePage(id: string, orgId: string, deletedBy: string): Promise<boolean> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    const page = await this.getPageById(id, orgId)
    if (!page) {
      return false
    }

    const result = await pagesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (result.deletedCount > 0) {
      await this.logAudit(orgId, 'page_delete', 'page', id, page.title, deletedBy, deletedBy)
    }

    return result.deletedCount > 0
  }

  /**
   * Get page version history
   */
  static async getPageVersions(pageId: string, orgId: string): Promise<PortalPageVersion[]> {
    const db = await getDatabase()
    const versionsCollection = db.collection<PortalPageVersion>(COLLECTIONS.PORTAL_PAGE_VERSIONS)

    return await versionsCollection
      .find({ pageId, orgId })
      .sort({ version: -1 })
      .toArray()
  }

  /**
   * Restore page from version
   */
  static async restoreVersion(
    pageId: string,
    versionNumber: number,
    orgId: string,
    restoredBy: string
  ): Promise<PortalPage | null> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)
    const versionsCollection = db.collection<PortalPageVersion>(COLLECTIONS.PORTAL_PAGE_VERSIONS)

    const version = await versionsCollection.findOne({
      pageId,
      orgId,
      version: versionNumber,
    })

    if (!version) {
      throw new Error('Version not found')
    }

    const now = new Date()
    const result = await pagesCollection.findOneAndUpdate(
      { _id: new ObjectId(pageId), orgId },
      {
        $set: {
          blocks: version.blocks,
          dataSources: version.dataSources,
          version: (version.version || 1) + 1,
          previousVersionId: version._id.toString(),
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    if (result) {
      await this.logAudit(
        orgId,
        'page_update',
        'page',
        pageId,
        result.title,
        restoredBy,
        restoredBy,
        { after: { restoredFromVersion: versionNumber } }
      )
    }

    return result || null
  }

  /**
   * Increment page view count
   */
  static async incrementViewCount(id: string, orgId: string): Promise<void> {
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    await pagesCollection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $inc: { viewCount: 1 },
        $set: { lastViewedAt: new Date() },
      }
    )
  }

  /**
   * Log audit entry
   */
  private static async logAudit(
    orgId: string,
    action: PortalAuditAction,
    resourceType: 'page' | 'theme' | 'datasource',
    resourceId: string,
    resourceName: string,
    userId: string,
    userName: string,
    changes?: any
  ): Promise<void> {
    const db = await getDatabase()
    const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

    const log: Omit<PortalAuditLog, '_id'> = {
      orgId,
      action,
      resourceType,
      resourceId,
      resourceName,
      userId,
      userName,
      timestamp: new Date(),
      changes,
    }

    await auditCollection.insertOne(log as PortalAuditLog)
  }
}

// ============================================
// Portal Theme Service
// ============================================

export interface CreateThemeInput {
  name: string
  description?: string
  colors: any
  typography: any
  spacing: any
  borderRadius: any
  shadows: any
  isDefault?: boolean
  customCss?: string
}

export class PortalThemeService {
  /**
   * Create a new theme
   */
  static async createTheme(
    orgId: string,
    input: CreateThemeInput,
    createdBy: string
  ): Promise<PortalTheme> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)

    // If this is default, unset other defaults
    if (input.isDefault) {
      await themesCollection.updateMany(
        { orgId, isDefault: true },
        { $set: { isDefault: false } }
      )
    }

    const now = new Date()
    const theme: Omit<PortalTheme, '_id'> = {
      orgId,
      name: input.name,
      description: input.description,
      colors: input.colors,
      typography: input.typography,
      spacing: input.spacing,
      borderRadius: input.borderRadius,
      shadows: input.shadows,
      isDefault: input.isDefault ?? false,
      customCss: input.customCss,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await themesCollection.insertOne(theme as PortalTheme)

    await PortalPageService['logAudit'](
      orgId,
      'theme_create',
      'theme',
      result.insertedId.toString(),
      input.name,
      createdBy,
      createdBy
    )

    return {
      ...theme,
      _id: result.insertedId,
    } as PortalTheme
  }

  /**
   * Get theme by ID
   */
  static async getThemeById(id: string, orgId: string): Promise<PortalTheme | null> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)

    return await themesCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get default theme
   */
  static async getDefaultTheme(orgId: string): Promise<PortalTheme | null> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)

    return await themesCollection.findOne({
      orgId,
      isDefault: true,
    })
  }

  /**
   * List all themes
   */
  static async listThemes(orgId: string): Promise<PortalTheme[]> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)

    return await themesCollection
      .find({ orgId })
      .sort({ isDefault: -1, createdAt: -1 })
      .toArray()
  }

  /**
   * Update theme
   */
  static async updateTheme(
    id: string,
    orgId: string,
    updates: Partial<CreateThemeInput>,
    updatedBy: string
  ): Promise<PortalTheme | null> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)

    // Get current theme
    const currentTheme = await this.getThemeById(id, orgId)
    if (!currentTheme) {
      throw new Error('Theme not found')
    }

    // If setting as default, unset other defaults
    if (updates.isDefault) {
      await themesCollection.updateMany(
        { orgId, isDefault: true, _id: { $ne: new ObjectId(id) } },
        { $set: { isDefault: false } }
      )
    }

    const now = new Date()
    const result = await themesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    )

    if (result) {
      await PortalPageService['logAudit'](
        orgId,
        'theme_update',
        'theme',
        id,
        result.name,
        updatedBy,
        updatedBy,
        {
          before: currentTheme,
          after: result,
          fields: Object.keys(updates),
        }
      )
    }

    return result || null
  }

  /**
   * Delete theme
   */
  static async deleteTheme(id: string, orgId: string, deletedBy: string): Promise<boolean> {
    const db = await getDatabase()
    const themesCollection = db.collection<PortalTheme>(COLLECTIONS.PORTAL_THEMES)
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    const theme = await this.getThemeById(id, orgId)
    if (!theme) {
      return false
    }

    // Check if theme is in use
    const pagesUsingTheme = await pagesCollection.countDocuments({
      orgId,
      themeId: id,
    })

    if (pagesUsingTheme > 0) {
      throw new Error(`Cannot delete theme: ${pagesUsingTheme} page(s) are using it`)
    }

    // Cannot delete default theme
    if (theme.isDefault) {
      throw new Error('Cannot delete the default theme')
    }

    const result = await themesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (result.deletedCount > 0) {
      await PortalPageService['logAudit'](
        orgId,
        'theme_delete',
        'theme',
        id,
        theme.name,
        deletedBy,
        deletedBy
      )
    }

    return result.deletedCount > 0
  }
}

// ============================================
// Portal Data Source Service
// ============================================

export interface CreateDataSourceInput {
  name: string
  description?: string
  type: 'rest' | 'graphql' | 'internal'
  config: any
  isActive?: boolean
}

export class PortalDataSourceService {
  /**
   * Create a new data source
   */
  static async createDataSource(
    orgId: string,
    input: CreateDataSourceInput,
    createdBy: string
  ): Promise<PortalDataSource> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    const now = new Date()
    const dataSource: Omit<PortalDataSource, '_id'> = {
      orgId,
      name: input.name,
      description: input.description,
      type: input.type,
      config: input.config,
      isActive: input.isActive ?? true,
      usageCount: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
    }

    const result = await dataSourcesCollection.insertOne(dataSource as PortalDataSource)

    await PortalPageService['logAudit'](
      orgId,
      'datasource_create',
      'datasource',
      result.insertedId.toString(),
      input.name,
      createdBy,
      createdBy
    )

    return {
      ...dataSource,
      _id: result.insertedId,
    } as PortalDataSource
  }

  /**
   * Get data source by ID
   */
  static async getDataSourceById(id: string, orgId: string): Promise<PortalDataSource | null> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    return await dataSourcesCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * List all data sources
   */
  static async listDataSources(orgId: string, type?: 'rest' | 'graphql' | 'internal'): Promise<PortalDataSource[]> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    const query: any = { orgId }
    if (type) {
      query.type = type
    }

    return await dataSourcesCollection
      .find(query)
      .sort({ name: 1 })
      .toArray()
  }

  /**
   * Update data source
   */
  static async updateDataSource(
    id: string,
    orgId: string,
    updates: Partial<CreateDataSourceInput>,
    updatedBy: string
  ): Promise<PortalDataSource | null> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    const currentDataSource = await this.getDataSourceById(id, orgId)
    if (!currentDataSource) {
      throw new Error('Data source not found')
    }

    const now = new Date()
    const result = await dataSourcesCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: { ...updates, updatedAt: now } },
      { returnDocument: 'after' }
    )

    if (result) {
      await PortalPageService['logAudit'](
        orgId,
        'datasource_update',
        'datasource',
        id,
        result.name,
        updatedBy,
        updatedBy,
        {
          before: currentDataSource,
          after: result,
          fields: Object.keys(updates),
        }
      )
    }

    return result || null
  }

  /**
   * Delete data source
   */
  static async deleteDataSource(id: string, orgId: string, deletedBy: string): Promise<boolean> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    const dataSource = await this.getDataSourceById(id, orgId)
    if (!dataSource) {
      return false
    }

    // Check if data source is in use (by checking usageCount or pages)
    if (dataSource.usageCount && dataSource.usageCount > 0) {
      throw new Error(`Cannot delete data source: it is being used by ${dataSource.usageCount} page(s)`)
    }

    const result = await dataSourcesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (result.deletedCount > 0) {
      await PortalPageService['logAudit'](
        orgId,
        'datasource_delete',
        'datasource',
        id,
        dataSource.name,
        deletedBy,
        deletedBy
      )
    }

    return result.deletedCount > 0
  }

  /**
   * Test data source connection
   */
  static async testDataSource(
    id: string,
    orgId: string,
    testedBy: string
  ): Promise<{ success: boolean; error?: string }> {
    const db = await getDatabase()
    const dataSourcesCollection = db.collection<PortalDataSource>(COLLECTIONS.PORTAL_DATA_SOURCES)

    const dataSource = await this.getDataSourceById(id, orgId)
    if (!dataSource) {
      throw new Error('Data source not found')
    }

    let success = false
    let error: string | undefined

    try {
      // Test based on type
      if (dataSource.type === 'rest') {
        // Test REST API connection
        const baseUrl = dataSource.config.baseUrl
        if (!baseUrl) {
          throw new Error('Base URL is required for REST data source')
        }

        const response = await fetch(baseUrl, {
          method: 'GET',
          headers: dataSource.config.headers || {},
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        success = true
      } else if (dataSource.type === 'graphql') {
        // Test GraphQL endpoint
        const endpoint = dataSource.config.graphqlEndpoint
        if (!endpoint) {
          throw new Error('GraphQL endpoint is required')
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(dataSource.config.headers || {}),
          },
          body: JSON.stringify({
            query: '{ __typename }', // Introspection query
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        success = true
      } else if (dataSource.type === 'internal') {
        // Internal data sources are always valid
        success = true
      }
    } catch (err: any) {
      error = err.message
    }

    // Update test status
    await dataSourcesCollection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          lastTestedAt: new Date(),
          testStatus: success ? 'success' : 'failed',
          testError: error,
        },
      }
    )

    await PortalPageService['logAudit'](
      orgId,
      'datasource_test',
      'datasource',
      id,
      dataSource.name,
      testedBy,
      testedBy,
      { success, error }
    )

    return { success, error }
  }
}

// ============================================
// Portal Audit Service
// ============================================

export class PortalAuditService {
  /**
   * Get audit logs for organization
   */
  static async getAuditLogs(
    orgId: string,
    filters?: {
      action?: PortalAuditAction
      resourceType?: 'page' | 'theme' | 'datasource'
      resourceId?: string
      userId?: string
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<PortalAuditLog[]> {
    const db = await getDatabase()
    const auditCollection = db.collection<PortalAuditLog>(COLLECTIONS.PORTAL_AUDIT_LOGS)

    const query: any = { orgId }

    if (filters?.action) {
      query.action = filters.action
    }

    if (filters?.resourceType) {
      query.resourceType = filters.resourceType
    }

    if (filters?.resourceId) {
      query.resourceId = filters.resourceId
    }

    if (filters?.userId) {
      query.userId = filters.userId
    }

    if (filters?.startDate || filters?.endDate) {
      query.timestamp = {}
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate
      }
    }

    const limit = filters?.limit || 100

    return await auditCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()
  }
}
