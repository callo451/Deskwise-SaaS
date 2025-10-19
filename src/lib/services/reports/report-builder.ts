import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export type DataSource =
  | 'tickets'
  | 'incidents'
  | 'assets'
  | 'projects'
  | 'changes'
  | 'service_requests'

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'

export type ConjunctionOperator = 'AND' | 'OR'

export interface FilterRule {
  field: string
  operator: FilterOperator
  value: any
  conjunction?: ConjunctionOperator
}

export interface ReportQuery {
  dataSource: DataSource
  filters: FilterRule[]
  columns: string[]
  groupBy?: string[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  limit?: number
  offset?: number
}

export interface ReportResult {
  data: any[]
  total: number
  columns: string[]
  generatedAt: Date
  executionTimeMs: number
}

/**
 * Report Builder Service
 * Provides flexible querying and filtering for custom reports
 */
export class ReportBuilderService {
  /**
   * Execute a custom report query
   */
  static async executeQuery(
    orgId: string,
    query: ReportQuery
  ): Promise<ReportResult> {
    const startTime = Date.now()
    const db = await getDatabase()

    // Get collection based on data source
    const collectionName = this.getCollectionName(query.dataSource)
    const collection = db.collection(collectionName)

    // Build MongoDB query from filter rules
    const mongoQuery = this.buildMongoQuery(orgId, query.filters)

    // Build projection (select specific columns)
    const projection = this.buildProjection(query.columns)

    // Build aggregation pipeline
    const pipeline: any[] = []

    // Match stage (filters)
    pipeline.push({ $match: mongoQuery })

    // Group stage (if groupBy is specified)
    if (query.groupBy && query.groupBy.length > 0) {
      const groupStage = this.buildGroupStage(query.groupBy, query.columns)
      pipeline.push(groupStage)
    } else if (Object.keys(projection).length > 0) {
      // Project stage (select columns)
      pipeline.push({ $project: projection })
    }

    // Sort stage (if orderBy is specified)
    if (query.orderBy && query.orderBy.length > 0) {
      const sortStage: any = {}
      query.orderBy.forEach((order) => {
        sortStage[order.field] = order.direction === 'asc' ? 1 : -1
      })
      pipeline.push({ $sort: sortStage })
    }

    // Count total (before pagination)
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await collection.aggregate(countPipeline).toArray()
    const total = countResult[0]?.total || 0

    // Pagination
    if (query.offset) {
      pipeline.push({ $skip: query.offset })
    }

    if (query.limit) {
      pipeline.push({ $limit: query.limit })
    }

    // Execute query
    const data = await collection.aggregate(pipeline).toArray()

    const executionTimeMs = Date.now() - startTime

    return {
      data,
      total,
      columns: query.columns,
      generatedAt: new Date(),
      executionTimeMs,
    }
  }

  /**
   * Get collection name from data source
   */
  private static getCollectionName(dataSource: DataSource): string {
    const mapping: Record<DataSource, string> = {
      tickets: COLLECTIONS.TICKETS,
      incidents: COLLECTIONS.INCIDENTS,
      assets: COLLECTIONS.ASSETS,
      projects: COLLECTIONS.PROJECTS,
      changes: COLLECTIONS.CHANGE_REQUESTS,
      service_requests: COLLECTIONS.SERVICE_REQUESTS,
    }

    return mapping[dataSource]
  }

  /**
   * Build MongoDB query from filter rules
   */
  private static buildMongoQuery(orgId: string, filters: FilterRule[]): any {
    const query: any = { orgId }

    if (!filters || filters.length === 0) {
      return query
    }

    // Group filters by conjunction
    const andFilters: any[] = []
    const orFilters: any[] = []

    filters.forEach((filter, index) => {
      const filterQuery = this.buildFilterQuery(filter)

      // First filter or AND conjunction
      if (index === 0 || filter.conjunction === 'AND') {
        andFilters.push(filterQuery)
      } else if (filter.conjunction === 'OR') {
        orFilters.push(filterQuery)
      }
    })

    // Combine filters
    if (andFilters.length > 0) {
      query.$and = andFilters
    }

    if (orFilters.length > 0) {
      if (query.$and) {
        query.$and.push({ $or: orFilters })
      } else {
        query.$or = orFilters
      }
    }

    return query
  }

  /**
   * Build MongoDB query for a single filter rule
   */
  private static buildFilterQuery(filter: FilterRule): any {
    const { field, operator, value } = filter

    switch (operator) {
      case 'equals':
        return { [field]: value }

      case 'not_equals':
        return { [field]: { $ne: value } }

      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } }

      case 'not_contains':
        return { [field]: { $not: { $regex: value, $options: 'i' } } }

      case 'starts_with':
        return { [field]: { $regex: `^${value}`, $options: 'i' } }

      case 'ends_with':
        return { [field]: { $regex: `${value}$`, $options: 'i' } }

      case 'greater_than':
        return { [field]: { $gt: value } }

      case 'less_than':
        return { [field]: { $lt: value } }

      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          return { [field]: { $gte: value[0], $lte: value[1] } }
        }
        return {}

      case 'in':
        return { [field]: { $in: Array.isArray(value) ? value : [value] } }

      case 'not_in':
        return { [field]: { $nin: Array.isArray(value) ? value : [value] } }

      case 'is_empty':
        return { $or: [{ [field]: null }, { [field]: { $exists: false } }] }

      case 'is_not_empty':
        return { [field]: { $ne: null, $exists: true } }

      default:
        return {}
    }
  }

  /**
   * Build projection (column selection)
   */
  private static buildProjection(columns: string[]): any {
    if (!columns || columns.length === 0) {
      return {} // Return all fields
    }

    const projection: any = {}
    columns.forEach((col) => {
      projection[col] = 1
    })

    return projection
  }

  /**
   * Build group stage for aggregation
   */
  private static buildGroupStage(groupBy: string[], columns: string[]): any {
    const groupStage: any = {
      _id: {},
    }

    // Group by fields
    groupBy.forEach((field) => {
      groupStage._id[field] = `$${field}`
    })

    // Aggregate other columns
    columns.forEach((col) => {
      if (!groupBy.includes(col)) {
        // Default aggregation: count or first value
        groupStage[col] = { $first: `$${col}` }
      }
    })

    // Always include count
    groupStage.count = { $sum: 1 }

    return { $group: groupStage }
  }

  /**
   * Get available fields for a data source
   */
  static getAvailableFields(dataSource: DataSource): string[] {
    const fields: Record<DataSource, string[]> = {
      tickets: [
        '_id',
        'ticketNumber',
        'title',
        'description',
        'status',
        'priority',
        'category',
        'assignedTo',
        'requesterId',
        'clientId',
        'createdAt',
        'updatedAt',
        'resolvedAt',
        'closedAt',
        'tags',
      ],
      incidents: [
        '_id',
        'incidentNumber',
        'title',
        'description',
        'status',
        'severity',
        'priority',
        'impact',
        'urgency',
        'affectedServices',
        'assignedTo',
        'startedAt',
        'resolvedAt',
        'createdAt',
        'updatedAt',
      ],
      assets: [
        '_id',
        'assetTag',
        'name',
        'category',
        'manufacturer',
        'model',
        'serialNumber',
        'status',
        'assignedTo',
        'clientId',
        'location',
        'purchaseDate',
        'warrantyExpiry',
        'purchaseCost',
        'createdAt',
        'updatedAt',
      ],
      projects: [
        '_id',
        'projectNumber',
        'name',
        'description',
        'status',
        'projectManager',
        'clientId',
        'startDate',
        'endDate',
        'actualStartDate',
        'actualEndDate',
        'budget',
        'usedBudget',
        'progress',
        'createdAt',
        'updatedAt',
      ],
      changes: [
        '_id',
        'changeNumber',
        'title',
        'description',
        'status',
        'risk',
        'impact',
        'category',
        'requestedBy',
        'assignedTo',
        'plannedStartDate',
        'plannedEndDate',
        'actualStartDate',
        'actualEndDate',
        'createdAt',
        'updatedAt',
      ],
      service_requests: [
        '_id',
        'requestNumber',
        'title',
        'description',
        'status',
        'priority',
        'category',
        'requestedBy',
        'assignedTo',
        'clientId',
        'serviceId',
        'createdAt',
        'updatedAt',
        'completedAt',
      ],
    }

    return fields[dataSource] || []
  }

  /**
   * Validate report query
   */
  static validateQuery(query: ReportQuery): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate data source
    if (!query.dataSource) {
      errors.push('Data source is required')
    }

    // Validate columns
    if (!query.columns || query.columns.length === 0) {
      errors.push('At least one column is required')
    }

    // Validate filters
    if (query.filters) {
      query.filters.forEach((filter, index) => {
        if (!filter.field) {
          errors.push(`Filter ${index + 1}: field is required`)
        }
        if (!filter.operator) {
          errors.push(`Filter ${index + 1}: operator is required`)
        }
        if (filter.value === undefined || filter.value === null) {
          if (
            filter.operator !== 'is_empty' &&
            filter.operator !== 'is_not_empty'
          ) {
            errors.push(`Filter ${index + 1}: value is required`)
          }
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
