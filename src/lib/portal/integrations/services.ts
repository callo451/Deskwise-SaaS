/**
 * Portal Integration Services
 *
 * This module provides integration functions for portal blocks to interact
 * with existing ITSM services. All functions are organization-scoped and
 * follow existing service layer patterns.
 */

import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  Incident,
  IncidentStatus,
  IncidentSeverity,
  KBArticle,
  ServiceCatalogueItem,
  ServiceRequest,
  ServiceRequestStatus,
  User,
} from '@/lib/types'

// ============================================
// Service Catalog Integration
// ============================================

export interface ServiceCatalogFilters {
  category?: string
  search?: string
  isActive?: boolean
  itilCategory?: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
  tags?: string[]
}

/**
 * Get service catalog items with optional filters
 * @param orgId - Organization ID
 * @param filters - Optional filters for catalog items
 * @returns Array of service catalog items
 */
export async function getServiceCatalogItems(
  orgId: string,
  filters?: ServiceCatalogFilters
): Promise<ServiceCatalogueItem[]> {
  const db = await getDatabase()
  const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

  const query: any = { orgId, isActive: true }

  if (filters?.category) {
    query.category = filters.category
  }

  if (filters?.isActive !== undefined) {
    query.isActive = filters.isActive
  }

  if (filters?.itilCategory) {
    query.itilCategory = filters.itilCategory
  }

  if (filters?.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }

  if (filters?.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { shortDescription: { $regex: filters.search, $options: 'i' } },
      { tags: { $regex: filters.search, $options: 'i' } },
    ]
  }

  return await collection
    .find(query)
    .sort({ popularity: -1, name: 1 })
    .toArray()
}

/**
 * Get service catalog categories
 * @param orgId - Organization ID
 * @returns Array of categories with counts
 */
export async function getServiceCatalogCategories(orgId: string) {
  const db = await getDatabase()
  const collection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

  const categories = await collection
    .aggregate([
      { $match: { orgId, isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray()

  return categories.map((cat) => ({
    name: cat._id,
    count: cat.count,
  }))
}

/**
 * Submit a service request from the portal
 * @param orgId - Organization ID
 * @param serviceId - Service catalog item ID
 * @param formData - Form submission data
 * @param requestedBy - User ID of requester
 * @returns Created service request
 */
export async function submitServiceRequest(
  orgId: string,
  serviceId: string,
  formData: Record<string, any>,
  requestedBy: string
): Promise<ServiceRequest> {
  const db = await getDatabase()
  const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)
  const serviceCatalogCollection = db.collection<ServiceCatalogueItem>(COLLECTIONS.SERVICE_CATALOGUE)

  // Get service details
  const service = await serviceCatalogCollection.findOne({
    _id: new ObjectId(serviceId),
    orgId,
  })

  if (!service) {
    throw new Error('Service not found')
  }

  // Generate request number
  const count = await serviceRequestsCollection.countDocuments({ orgId })
  const requestNumber = `SR-${(count + 1).toString().padStart(5, '0')}`

  const now = new Date()
  const serviceRequest: Omit<ServiceRequest, '_id'> = {
    orgId,
    requestNumber,
    title: formData.title || service.name,
    description: formData.description || service.description,
    status: service.requiresApproval ? 'pending_approval' : 'submitted',
    priority: formData.priority || 'medium',
    category: service.category,
    requestedBy,
    serviceId,
    formData,
    createdBy: requestedBy,
    createdAt: now,
    updatedAt: now,
  }

  // Calculate SLA deadlines if configured
  if (service.slaResponseTime || service.slaResolutionTime) {
    const responseTime = service.slaResponseTime || 60 // Default 1 hour
    const resolutionTime = service.slaResolutionTime || 480 // Default 8 hours

    serviceRequest.sla = {
      responseTime,
      resolutionTime,
      responseDeadline: new Date(now.getTime() + responseTime * 60000),
      resolutionDeadline: new Date(now.getTime() + resolutionTime * 60000),
      breached: false,
    }
  }

  const result = await serviceRequestsCollection.insertOne(serviceRequest as ServiceRequest)

  // Update service popularity
  await serviceCatalogCollection.updateOne(
    { _id: new ObjectId(serviceId) },
    { $inc: { popularity: 1, totalRequests: 1 } }
  )

  return {
    ...serviceRequest,
    _id: result.insertedId,
  } as ServiceRequest
}

// ============================================
// Ticket System Integration
// ============================================

export interface TicketFilters {
  status?: TicketStatus | TicketStatus[]
  priority?: TicketPriority | TicketPriority[]
  category?: string
  assignedTo?: string
  requesterId?: string
  clientId?: string
  search?: string
  limit?: number
}

/**
 * Get tickets with filters
 * @param orgId - Organization ID
 * @param filters - Optional filters for tickets
 * @returns Array of tickets
 */
export async function getTickets(
  orgId: string,
  filters?: TicketFilters
): Promise<Ticket[]> {
  const db = await getDatabase()
  const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

  const query: any = { orgId }

  if (filters?.status) {
    query.status = Array.isArray(filters.status)
      ? { $in: filters.status }
      : filters.status
  }

  if (filters?.priority) {
    query.priority = Array.isArray(filters.priority)
      ? { $in: filters.priority }
      : filters.priority
  }

  if (filters?.category) {
    query.category = filters.category
  }

  if (filters?.assignedTo) {
    query.assignedTo = filters.assignedTo
  }

  if (filters?.requesterId) {
    query.requesterId = filters.requesterId
  }

  if (filters?.clientId) {
    query.clientId = filters.clientId
  }

  if (filters?.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { ticketNumber: { $regex: filters.search, $options: 'i' } },
    ]
  }

  let queryBuilder = ticketsCollection
    .find(query)
    .sort({ createdAt: -1 })

  if (filters?.limit) {
    queryBuilder = queryBuilder.limit(filters.limit)
  }

  return await queryBuilder.toArray()
}

export interface CreateTicketInput {
  title: string
  description: string
  priority: TicketPriority
  category: string
  clientId?: string
  tags?: string[]
}

/**
 * Create a new ticket from the portal
 * @param orgId - Organization ID
 * @param input - Ticket data
 * @param requesterId - User ID of requester
 * @returns Created ticket
 */
export async function createTicket(
  orgId: string,
  input: CreateTicketInput,
  requesterId: string
): Promise<Ticket> {
  const db = await getDatabase()
  const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

  // Generate ticket number
  const count = await ticketsCollection.countDocuments({ orgId })
  const ticketNumber = `TKT-${(count + 1).toString().padStart(5, '0')}`

  const now = new Date()
  const ticket: Omit<Ticket, '_id'> = {
    orgId,
    ticketNumber,
    title: input.title,
    description: input.description,
    status: 'new',
    priority: input.priority,
    category: input.category,
    clientId: input.clientId,
    requesterId,
    tags: input.tags || [],
    createdBy: requesterId,
    createdAt: now,
    updatedAt: now,
  }

  const result = await ticketsCollection.insertOne(ticket as Ticket)

  return {
    ...ticket,
    _id: result.insertedId,
  } as Ticket
}

// ============================================
// Incident Management Integration
// ============================================

export interface IncidentFilters {
  status?: IncidentStatus | IncidentStatus[]
  severity?: IncidentSeverity | IncidentSeverity[]
  isPublic?: boolean
  search?: string
  limit?: number
}

/**
 * Get incidents with filters
 * @param orgId - Organization ID
 * @param filters - Optional filters for incidents
 * @returns Array of incidents
 */
export async function getIncidents(
  orgId: string,
  filters?: IncidentFilters
): Promise<Incident[]> {
  const db = await getDatabase()
  const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

  const query: any = { orgId, isActive: true }

  if (filters?.status) {
    query.status = Array.isArray(filters.status)
      ? { $in: filters.status }
      : filters.status
  }

  if (filters?.severity) {
    query.severity = Array.isArray(filters.severity)
      ? { $in: filters.severity }
      : filters.severity
  }

  if (filters?.isPublic !== undefined) {
    query.isPublic = filters.isPublic
  }

  if (filters?.search) {
    query.$or = [
      { incidentNumber: { $regex: filters.search, $options: 'i' } },
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ]
  }

  let queryBuilder = collection
    .find(query)
    .sort({ severity: -1, createdAt: -1 })

  if (filters?.limit) {
    queryBuilder = queryBuilder.limit(filters.limit)
  }

  return await queryBuilder.toArray()
}

/**
 * Get public incidents for status page display
 * @param orgId - Organization ID
 * @returns Array of public incidents
 */
export async function getPublicIncidents(orgId: string): Promise<Incident[]> {
  const db = await getDatabase()
  const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

  return await collection
    .find({
      orgId,
      isPublic: true,
      isActive: true,
      status: { $ne: 'resolved' },
    })
    .sort({ severity: -1, createdAt: -1 })
    .toArray()
}

export interface CreateIncidentInput {
  title: string
  description: string
  severity: IncidentSeverity
  affectedServices: string[]
  isPublic: boolean
}

/**
 * Create a new incident from the portal
 * @param orgId - Organization ID
 * @param input - Incident data
 * @param createdBy - User ID of creator
 * @returns Created incident
 */
export async function createIncident(
  orgId: string,
  input: CreateIncidentInput,
  createdBy: string
): Promise<Incident> {
  const db = await getDatabase()
  const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

  // Generate incident number
  const count = await collection.countDocuments({ orgId })
  const incidentNumber = `INC-${String(count + 1).padStart(4, '0')}`

  const now = new Date()
  const incident: Omit<Incident, '_id'> = {
    orgId,
    incidentNumber,
    title: input.title,
    description: input.description,
    status: 'investigating',
    severity: input.severity,
    impact: 'medium', // Default values
    urgency: 'medium',
    priority: 'medium',
    affectedServices: input.affectedServices,
    clientIds: [],
    isPublic: input.isPublic,
    startedAt: now,
    createdBy,
    createdAt: now,
    updatedAt: now,
  }

  const result = await collection.insertOne(incident as Incident)

  return {
    ...incident,
    _id: result.insertedId,
  } as Incident
}

// ============================================
// Knowledge Base Integration
// ============================================

export interface KBArticleFilters {
  category?: string
  tags?: string[]
  search?: string
  visibility?: 'public' | 'internal'
  status?: 'draft' | 'published' | 'archived'
  limit?: number
}

/**
 * Get knowledge base articles with filters
 * @param orgId - Organization ID
 * @param filters - Optional filters for articles
 * @returns Array of KB articles
 */
export async function getKBArticles(
  orgId: string,
  filters?: KBArticleFilters
): Promise<KBArticle[]> {
  const db = await getDatabase()
  const collection = db.collection<KBArticle>(COLLECTIONS.KB_ARTICLES)

  const query: any = { orgId, isActive: true, isArchived: false }

  // Default to published articles only
  query.status = filters?.status || 'published'

  if (filters?.category) {
    query.category = filters.category
  }

  if (filters?.visibility) {
    query.visibility = filters.visibility
  }

  if (filters?.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }

  if (filters?.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { content: { $regex: filters.search, $options: 'i' } },
      { tags: { $regex: filters.search, $options: 'i' } },
    ]
  }

  let queryBuilder = collection
    .find(query)
    .sort({ views: -1, createdAt: -1 })

  if (filters?.limit) {
    queryBuilder = queryBuilder.limit(filters.limit)
  }

  return await queryBuilder.toArray()
}

/**
 * Get knowledge base categories
 * @param orgId - Organization ID
 * @returns Array of categories with article counts
 */
export async function getKBCategories(orgId: string) {
  const db = await getDatabase()
  const collection = db.collection<KBArticle>(COLLECTIONS.KB_ARTICLES)

  const categories = await collection
    .aggregate([
      {
        $match: {
          orgId,
          isActive: true,
          isArchived: false,
          status: 'published'
        }
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ])
    .toArray()

  return categories.map((cat) => ({
    name: cat._id,
    count: cat.count,
  }))
}

/**
 * Search knowledge base articles (full-text search)
 * @param orgId - Organization ID
 * @param query - Search query string
 * @param visibility - Optional visibility filter
 * @returns Array of matching articles
 */
export async function searchKBArticles(
  orgId: string,
  query: string,
  visibility?: 'public' | 'internal'
): Promise<KBArticle[]> {
  const db = await getDatabase()
  const collection = db.collection<KBArticle>(COLLECTIONS.KB_ARTICLES)

  const searchQuery: any = {
    orgId,
    isActive: true,
    isArchived: false,
    status: 'published',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { tags: { $regex: query, $options: 'i' } },
    ],
  }

  if (visibility) {
    searchQuery.visibility = visibility
  }

  return await collection
    .find(searchQuery)
    .sort({ views: -1, createdAt: -1 })
    .limit(20)
    .toArray()
}

/**
 * Increment article view count
 * @param articleId - Article ID
 * @param orgId - Organization ID
 */
export async function incrementArticleViews(
  articleId: string,
  orgId: string
): Promise<void> {
  const db = await getDatabase()
  const collection = db.collection<KBArticle>(COLLECTIONS.KB_ARTICLES)

  await collection.updateOne(
    { _id: new ObjectId(articleId), orgId },
    { $inc: { views: 1 } }
  )
}

// ============================================
// User Profile Integration
// ============================================

/**
 * Get current user's tickets
 * @param orgId - Organization ID
 * @param userId - User ID
 * @returns Array of user's tickets
 */
export async function getCurrentUserTickets(
  orgId: string,
  userId: string
): Promise<Ticket[]> {
  const db = await getDatabase()
  const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

  return await ticketsCollection
    .find({
      orgId,
      $or: [{ assignedTo: userId }, { requesterId: userId }],
      status: { $in: ['new', 'open', 'pending'] },
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray()
}

/**
 * Get current user's service requests
 * @param orgId - Organization ID
 * @param userId - User ID
 * @returns Array of user's service requests
 */
export async function getCurrentUserRequests(
  orgId: string,
  userId: string
): Promise<ServiceRequest[]> {
  const db = await getDatabase()
  const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

  return await serviceRequestsCollection
    .find({
      orgId,
      requestedBy: userId,
      status: { $in: ['submitted', 'pending_approval', 'approved', 'in_progress'] },
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray()
}

/**
 * Get user profile information
 * @param userId - User ID
 * @param orgId - Organization ID
 * @returns User profile (excluding password)
 */
export async function getUserProfile(
  userId: string,
  orgId: string
): Promise<Omit<User, 'password'> | null> {
  const db = await getDatabase()
  const usersCollection = db.collection<User>(COLLECTIONS.USERS)

  const user = await usersCollection.findOne(
    { _id: new ObjectId(userId), orgId },
    { projection: { password: 0 } } // Exclude password
  )

  return user as Omit<User, 'password'> | null
}

// ============================================
// Analytics Integration
// ============================================

export interface PortalStats {
  tickets: {
    total: number
    open: number
    resolved: number
    byPriority: {
      critical: number
      high: number
      medium: number
      low: number
    }
  }
  serviceRequests: {
    total: number
    active: number
    completed: number
  }
  incidents: {
    total: number
    active: number
    critical: number
  }
  knowledgeBase: {
    totalArticles: number
    totalViews: number
    popularArticles: Array<{
      id: string
      title: string
      views: number
    }>
  }
}

/**
 * Get portal statistics for organization
 * @param orgId - Organization ID
 * @returns Portal analytics data
 */
export async function getPortalStats(orgId: string): Promise<PortalStats> {
  const db = await getDatabase()

  // Tickets stats
  const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)
  const [
    totalTickets,
    openTickets,
    resolvedTickets,
    criticalTickets,
    highTickets,
    mediumTickets,
    lowTickets,
  ] = await Promise.all([
    ticketsCollection.countDocuments({ orgId }),
    ticketsCollection.countDocuments({
      orgId,
      status: { $in: ['new', 'open', 'pending'] },
    }),
    ticketsCollection.countDocuments({ orgId, status: 'resolved' }),
    ticketsCollection.countDocuments({ orgId, priority: 'critical' }),
    ticketsCollection.countDocuments({ orgId, priority: 'high' }),
    ticketsCollection.countDocuments({ orgId, priority: 'medium' }),
    ticketsCollection.countDocuments({ orgId, priority: 'low' }),
  ])

  // Service requests stats
  const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)
  const [totalRequests, activeRequests, completedRequests] = await Promise.all([
    serviceRequestsCollection.countDocuments({ orgId }),
    serviceRequestsCollection.countDocuments({
      orgId,
      status: { $in: ['submitted', 'pending_approval', 'approved', 'in_progress'] },
    }),
    serviceRequestsCollection.countDocuments({ orgId, status: 'completed' }),
  ])

  // Incidents stats
  const incidentsCollection = db.collection<Incident>(COLLECTIONS.INCIDENTS)
  const [totalIncidents, activeIncidents, criticalIncidents] = await Promise.all([
    incidentsCollection.countDocuments({ orgId, isActive: true }),
    incidentsCollection.countDocuments({
      orgId,
      isActive: true,
      status: { $ne: 'resolved' },
    }),
    incidentsCollection.countDocuments({
      orgId,
      isActive: true,
      severity: 'critical',
      status: { $ne: 'resolved' },
    }),
  ])

  // Knowledge base stats
  const kbCollection = db.collection<KBArticle>(COLLECTIONS.KB_ARTICLES)
  const totalArticles = await kbCollection.countDocuments({
    orgId,
    isActive: true,
    isArchived: false,
    status: 'published',
  })

  const viewsStats = await kbCollection
    .aggregate([
      {
        $match: {
          orgId,
          isActive: true,
          status: 'published'
        }
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
    ])
    .toArray()

  const popularArticles = await kbCollection
    .find({
      orgId,
      isActive: true,
      isArchived: false,
      status: 'published',
    })
    .sort({ views: -1 })
    .limit(5)
    .toArray()

  return {
    tickets: {
      total: totalTickets,
      open: openTickets,
      resolved: resolvedTickets,
      byPriority: {
        critical: criticalTickets,
        high: highTickets,
        medium: mediumTickets,
        low: lowTickets,
      },
    },
    serviceRequests: {
      total: totalRequests,
      active: activeRequests,
      completed: completedRequests,
    },
    incidents: {
      total: totalIncidents,
      active: activeIncidents,
      critical: criticalIncidents,
    },
    knowledgeBase: {
      totalArticles,
      totalViews: viewsStats[0]?.totalViews || 0,
      popularArticles: popularArticles.map((article) => ({
        id: article._id.toString(),
        title: article.title,
        views: article.views,
      })),
    },
  }
}

/**
 * Track page view analytics
 * @param pageId - Portal page ID
 * @param orgId - Organization ID
 * @param userId - Optional user ID
 */
export async function trackPageView(
  pageId: string,
  orgId: string,
  userId?: string
): Promise<void> {
  const db = await getDatabase()
  const analyticsCollection = db.collection(COLLECTIONS.PORTAL_ANALYTICS)

  await analyticsCollection.insertOne({
    pageId,
    orgId,
    userId,
    timestamp: new Date(),
    type: 'page_view',
  })
}

/**
 * Get ticket statistics for organization
 * @param orgId - Organization ID
 * @returns Ticket statistics
 */
export async function getTicketStats(orgId: string) {
  const db = await getDatabase()
  const ticketsCollection = db.collection<Ticket>(COLLECTIONS.TICKETS)

  const [
    total,
    newTickets,
    openTickets,
    pendingTickets,
    resolvedTickets,
    closedTickets,
    criticalTickets,
    highTickets,
    slaBreached,
  ] = await Promise.all([
    ticketsCollection.countDocuments({ orgId }),
    ticketsCollection.countDocuments({ orgId, status: 'new' }),
    ticketsCollection.countDocuments({ orgId, status: 'open' }),
    ticketsCollection.countDocuments({ orgId, status: 'pending' }),
    ticketsCollection.countDocuments({ orgId, status: 'resolved' }),
    ticketsCollection.countDocuments({ orgId, status: 'closed' }),
    ticketsCollection.countDocuments({ orgId, priority: 'critical' }),
    ticketsCollection.countDocuments({ orgId, priority: 'high' }),
    ticketsCollection.countDocuments({ orgId, 'sla.breached': true }),
  ])

  const open = newTickets + openTickets + pendingTickets

  return {
    total,
    open,
    byStatus: {
      new: newTickets,
      open: openTickets,
      pending: pendingTickets,
      resolved: resolvedTickets,
      closed: closedTickets,
    },
    byPriority: {
      critical: criticalTickets,
      high: highTickets,
    },
    slaBreached,
  }
}
