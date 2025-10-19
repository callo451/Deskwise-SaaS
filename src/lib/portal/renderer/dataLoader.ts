/**
 * Data Loader for Portal Page Renderer
 * Handles fetching and caching data sources for portal pages
 */

import clientPromise from '@/lib/mongodb'
import type { DataSource, Ticket, Incident, KBArticle, ServiceCatalogueItem } from '@/lib/types'
import { ObjectId } from 'mongodb'

// Cache for data source responses (simple in-memory cache)
const dataCache = new Map<string, { data: any; expiresAt: number }>()

export class DataLoader {
  private orgId: string
  private userId?: string

  constructor(orgId: string, userId?: string) {
    this.orgId = orgId
    this.userId = userId
  }

  /**
   * Load multiple data sources in parallel
   */
  async loadDataSources(
    sources: DataSource[]
  ): Promise<Record<string, any>> {
    const results: Record<string, any> = {}

    // Load all sources in parallel
    const promises = sources.map(async (source) => {
      try {
        const data = await this.loadDataSource(source)
        results[source.id] = data
      } catch (error) {
        console.error(`Failed to load data source ${source.id}:`, error)
        results[source.id] = null
      }
    })

    await Promise.all(promises)

    return results
  }

  /**
   * Load a single data source
   */
  private async loadDataSource(source: DataSource): Promise<any> {
    // Check cache first
    if (source.cache?.enabled) {
      const cacheKey = this.getCacheKey(source)
      const cached = dataCache.get(cacheKey)

      if (cached && cached.expiresAt > Date.now()) {
        return cached.data
      }
    }

    let data: any = null

    // Load based on source type
    switch (source.type) {
      case 'internal':
        data = await this.loadInternalDataSource(source)
        break
      case 'external':
      case 'api':
        data = await this.loadExternalDataSource(source)
        break
      case 'static':
        data = source.static?.data || null
        break
      default:
        throw new Error(`Unknown data source type: ${source.type}`)
    }

    // Cache the result
    if (source.cache?.enabled && data !== null) {
      const cacheKey = this.getCacheKey(source)
      const ttl = source.cache.ttl || 300 // Default 5 minutes
      dataCache.set(cacheKey, {
        data,
        expiresAt: Date.now() + ttl * 1000
      })
    }

    return data
  }

  /**
   * Load internal Deskwise data
   */
  private async loadInternalDataSource(source: DataSource): Promise<any> {
    if (!source.internal) {
      throw new Error('Internal data source configuration is missing')
    }

    const { entity, filters = {}, sortBy, sortOrder = 'desc', limit = 50 } = source.internal

    switch (entity) {
      case 'tickets':
        return await this.loadTickets(filters, sortBy, sortOrder as 'asc' | 'desc', limit)
      case 'incidents':
        return await this.loadIncidents(filters, sortBy, sortOrder as 'asc' | 'desc', limit)
      case 'kb-articles':
        return await this.loadKBArticles(filters, sortBy, sortOrder as 'asc' | 'desc', limit)
      case 'service-catalog':
        return await this.loadServiceCatalog(filters, sortBy, sortOrder as 'asc' | 'desc', limit)
      default:
        throw new Error(`Unknown internal entity: ${entity}`)
    }
  }

  /**
   * Load tickets
   */
  private async loadTickets(
    filters: Record<string, any>,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 50
  ): Promise<Ticket[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query with org isolation
    const query: any = { orgId: this.orgId, ...filters }

    // If user-specific, filter by requester
    if (this.userId && filters.onlyMine) {
      query.requesterId = this.userId
    }

    // Remove non-MongoDB fields
    delete query.onlyMine

    // Build sort
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.createdAt = -1 // Default: newest first
    }

    const tickets = await db.collection('tickets')
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray()

    return tickets as any[]
  }

  /**
   * Load incidents
   */
  private async loadIncidents(
    filters: Record<string, any>,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 50
  ): Promise<Incident[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query with org isolation
    const query: any = { orgId: this.orgId, ...filters }

    // Only show public incidents for end users
    if (this.userId && !filters.includePrivate) {
      query.isPublic = true
    }

    // Remove non-MongoDB fields
    delete query.includePrivate

    // Build sort
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.startedAt = -1 // Default: newest first
    }

    const incidents = await db.collection('incidents')
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray()

    return incidents as any[]
  }

  /**
   * Load knowledge base articles
   */
  private async loadKBArticles(
    filters: Record<string, any>,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 50
  ): Promise<KBArticle[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query with org isolation
    const query: any = {
      orgId: this.orgId,
      status: 'published', // Only published articles
      isArchived: false,
      ...filters
    }

    // Only show public articles for end users (unless authenticated)
    if (!this.userId || filters.publicOnly) {
      query.visibility = 'public'
    }

    // Remove non-MongoDB fields
    delete query.publicOnly

    // Build sort
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.views = -1 // Default: most viewed first
    }

    const articles = await db.collection('kb_articles')
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray()

    return articles as any[]
  }

  /**
   * Load service catalog items
   */
  private async loadServiceCatalog(
    filters: Record<string, any>,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
    limit = 50
  ): Promise<ServiceCatalogueItem[]> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Build query with org isolation
    const query: any = {
      orgId: this.orgId,
      isActive: true,
      ...filters
    }

    // Build sort
    const sort: any = {}
    if (sortBy) {
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1
    } else {
      sort.popularity = -1 // Default: most popular first
    }

    const items = await db.collection('service_catalogue_items')
      .find(query)
      .sort(sort)
      .limit(limit)
      .toArray()

    return items as any[]
  }

  /**
   * Load external API data source
   */
  private async loadExternalDataSource(source: DataSource): Promise<any> {
    if (!source.external) {
      throw new Error('External data source configuration is missing')
    }

    const { url, method = 'GET', headers = {}, body } = source.external

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(url, options)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      let data = await response.json()

      // Apply transformation if provided
      if (source.external.transformResponse) {
        data = this.transformData(data, source.external.transformResponse)
      }

      return data
    } catch (error) {
      console.error('Failed to load external data source:', error)
      return null
    }
  }

  /**
   * Transform data using a JavaScript expression
   * IMPORTANT: This uses eval() which should be restricted to trusted sources only
   */
  private transformData(data: any, expression: string): any {
    try {
      // Create a safe sandbox for transformation
      const transformFn = new Function('data', `return ${expression}`)
      return transformFn(data)
    } catch (error) {
      console.error('Failed to transform data:', error)
      return data
    }
  }

  /**
   * Generate cache key for a data source
   */
  private getCacheKey(source: DataSource): string {
    const sourceConfig = JSON.stringify({
      type: source.type,
      internal: source.internal,
      external: source.external,
      static: source.static,
      orgId: this.orgId,
      userId: this.userId
    })

    return `${source.id}:${sourceConfig}`
  }

  /**
   * Clear cache for a specific data source or all cache
   */
  static clearCache(dataSourceId?: string): void {
    if (dataSourceId) {
      // Clear specific data source cache
      for (const key of dataCache.keys()) {
        if (key.startsWith(dataSourceId)) {
          dataCache.delete(key)
        }
      }
    } else {
      // Clear all cache
      dataCache.clear()
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: dataCache.size,
      keys: Array.from(dataCache.keys())
    }
  }
}

/**
 * Resolve data bindings in block props
 */
export function resolveDataBindings(
  props: Record<string, any>,
  dataContext: Record<string, any>
): Record<string, any> {
  const resolved = { ...props }

  // Check if props has bindings
  if (resolved.bindings) {
    const bindings = resolved.bindings

    // Process each binding
    for (const [propKey, binding] of Object.entries(bindings)) {
      try {
        // Get the data source
        const sourceData = dataContext[binding.sourceId]

        if (sourceData !== undefined && sourceData !== null) {
          // Extract the field value using dot notation
          const value = getNestedValue(sourceData, binding.field)

          // Apply transformation if provided
          let finalValue = value
          if (binding.transform) {
            finalValue = transformValue(value, binding.transform)
          }

          // Set the value or use fallback
          setNestedValue(resolved, propKey, finalValue !== undefined ? finalValue : binding.fallback)
        } else if (binding.fallback !== undefined) {
          // Use fallback if source data is not available
          setNestedValue(resolved, propKey, binding.fallback)
        }
      } catch (error) {
        console.error(`Failed to resolve binding for ${propKey}:`, error)
        if (binding.fallback !== undefined) {
          setNestedValue(resolved, propKey, binding.fallback)
        }
      }
    }

    // Remove bindings from resolved props (not needed in runtime)
    delete resolved.bindings
  }

  return resolved
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  const keys = path.split('.')
  let value = obj

  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }

    // Handle array index notation
    const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayKey, index] = arrayMatch
      value = value[arrayKey]
      if (Array.isArray(value)) {
        value = value[parseInt(index, 10)]
      } else {
        return undefined
      }
    } else {
      value = value[key]
    }
  }

  return value
}

/**
 * Set nested value in object using dot notation
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
}

/**
 * Transform a value using a JavaScript expression
 */
function transformValue(value: any, expression: string): any {
  try {
    const transformFn = new Function('value', `return ${expression}`)
    return transformFn(value)
  } catch (error) {
    console.error('Failed to transform value:', error)
    return value
  }
}
