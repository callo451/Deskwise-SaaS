import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { ServiceRequest, ServiceRequestStatus, ServiceRequestPriority } from '@/lib/types'

export interface CreateServiceRequestInput {
  title: string
  description: string
  priority: ServiceRequestPriority
  category: string
  assignedTo?: string
  clientId?: string
  serviceId?: string
  formData?: Record<string, any>
  sla?: {
    responseTime: number // minutes
    resolutionTime: number // minutes
  }
}

export interface UpdateServiceRequestInput {
  title?: string
  description?: string
  status?: ServiceRequestStatus
  priority?: ServiceRequestPriority
  category?: string
  assignedTo?: string
  formData?: Record<string, any>
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus | ServiceRequestStatus[]
  priority?: ServiceRequestPriority | ServiceRequestPriority[]
  category?: string
  assignedTo?: string
  requestedBy?: string
  clientId?: string
  search?: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
}

export interface ServiceRequestComment {
  _id: ObjectId
  serviceRequestId: string
  content: string
  createdBy: string
  createdAt: Date
  isInternal: boolean
}

export class ServiceRequestService {
  /**
   * Create a new service request
   */
  static async createServiceRequest(
    orgId: string,
    input: CreateServiceRequestInput,
    requestedBy: string
  ): Promise<ServiceRequest> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    // Generate request number
    const count = await serviceRequestsCollection.countDocuments({ orgId })
    const requestNumber = `SR-${(count + 1).toString().padStart(5, '0')}`

    const now = new Date()
    const serviceRequest: Omit<ServiceRequest, '_id'> = {
      orgId,
      requestNumber,
      title: input.title,
      description: input.description,
      status: 'submitted',
      priority: input.priority,
      category: input.category,
      requestedBy,
      assignedTo: input.assignedTo,
      clientId: input.clientId,
      serviceId: input.serviceId,
      formData: input.formData,
      createdBy: requestedBy,
      createdAt: now,
      updatedAt: now,
    }

    // Calculate SLA deadlines if provided
    if (input.sla) {
      const responseDeadline = new Date(now.getTime() + input.sla.responseTime * 60000)
      const resolutionDeadline = new Date(now.getTime() + input.sla.resolutionTime * 60000)

      serviceRequest.sla = {
        responseTime: input.sla.responseTime,
        resolutionTime: input.sla.resolutionTime,
        responseDeadline,
        resolutionDeadline,
        breached: false,
      }
    }

    const result = await serviceRequestsCollection.insertOne(serviceRequest as ServiceRequest)

    return {
      ...serviceRequest,
      _id: result.insertedId,
    } as ServiceRequest
  }

  /**
   * Get service request by ID
   */
  static async getServiceRequestById(id: string, orgId: string): Promise<ServiceRequest | null> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    return await serviceRequestsCollection.findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get service requests with filters
   */
  static async getServiceRequests(
    orgId: string,
    filters?: ServiceRequestFilters
  ): Promise<ServiceRequest[]> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

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

    if (filters?.requestedBy) {
      query.requestedBy = filters.requestedBy
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.approvalStatus) {
      query.approvalStatus = filters.approvalStatus
    }

    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { requestNumber: { $regex: filters.search, $options: 'i' } },
      ]
    }

    return await serviceRequestsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Update service request
   */
  static async updateServiceRequest(
    id: string,
    orgId: string,
    updates: UpdateServiceRequestInput
  ): Promise<ServiceRequest | null> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    // If status is being changed to completed, set the timestamp
    if (updates.status === 'completed') {
      updateData.completedAt = new Date()
    }

    const result = await serviceRequestsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Delete service request
   */
  static async deleteServiceRequest(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const result = await serviceRequestsCollection.deleteOne({
      _id: new ObjectId(id),
      orgId,
    })

    return result.deletedCount > 0
  }

  /**
   * Update service request status
   */
  static async updateStatus(
    id: string,
    orgId: string,
    status: ServiceRequestStatus
  ): Promise<ServiceRequest | null> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const updateData: any = {
      status,
      updatedAt: new Date(),
    }

    // Set timestamps based on status
    if (status === 'completed') {
      updateData.completedAt = new Date()
    }

    const result = await serviceRequestsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Approve service request
   */
  static async approveServiceRequest(
    id: string,
    orgId: string,
    approvedBy: string,
    approvedByName: string
  ): Promise<ServiceRequest | null> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const now = new Date()
    const result = await serviceRequestsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          approvalStatus: 'approved',
          approvedBy,
          approvedByName,
          approvedAt: now,
          status: 'approved',
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Reject service request
   */
  static async rejectServiceRequest(
    id: string,
    orgId: string,
    approvedBy: string,
    approvedByName: string,
    rejectionReason: string
  ): Promise<ServiceRequest | null> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const now = new Date()
    const result = await serviceRequestsCollection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          approvalStatus: 'rejected',
          approvedBy,
          approvedByName,
          approvedAt: now,
          status: 'rejected',
          rejectionReason,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    )

    return result || null
  }

  /**
   * Get service request statistics
   */
  static async getServiceRequestStats(orgId: string) {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const [
      total,
      submitted,
      pendingApproval,
      approved,
      rejected,
      inProgress,
      completed,
      cancelled,
      criticalRequests,
      highRequests,
      slaBreached,
    ] = await Promise.all([
      serviceRequestsCollection.countDocuments({ orgId }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'submitted' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'pending_approval' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'approved' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'rejected' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'in_progress' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'completed' }),
      serviceRequestsCollection.countDocuments({ orgId, status: 'cancelled' }),
      serviceRequestsCollection.countDocuments({ orgId, priority: 'critical' }),
      serviceRequestsCollection.countDocuments({ orgId, priority: 'high' }),
      serviceRequestsCollection.countDocuments({ orgId, 'sla.breached': true }),
    ])

    const active = submitted + pendingApproval + approved + inProgress

    return {
      total,
      active,
      byStatus: {
        submitted,
        pendingApproval,
        approved,
        rejected,
        inProgress,
        completed,
        cancelled,
      },
      byPriority: {
        critical: criticalRequests,
        high: highRequests,
      },
      slaBreached,
    }
  }

  /**
   * Get user's service requests
   */
  static async getMyServiceRequests(
    orgId: string,
    userId: string
  ): Promise<ServiceRequest[]> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    return await serviceRequestsCollection
      .find({
        orgId,
        $or: [{ assignedTo: userId }, { requestedBy: userId }],
        status: { $in: ['submitted', 'pending_approval', 'approved', 'in_progress'] },
      })
      .sort({ createdAt: -1 })
      .toArray()
  }

  /**
   * Add comment to service request
   */
  static async addComment(
    serviceRequestId: string,
    orgId: string,
    content: string,
    createdBy: string,
    isInternal: boolean = false
  ): Promise<ServiceRequestComment> {
    const db = await getDatabase()
    const commentsCollection = db.collection<ServiceRequestComment>('service_request_comments')

    const comment: Omit<ServiceRequestComment, '_id'> = {
      serviceRequestId,
      content,
      createdBy,
      createdAt: new Date(),
      isInternal,
    }

    const result = await commentsCollection.insertOne(comment as ServiceRequestComment)

    // Update service request's updatedAt
    await db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS).updateOne(
      { _id: new ObjectId(serviceRequestId), orgId },
      { $set: { updatedAt: new Date() } }
    )

    return {
      ...comment,
      _id: result.insertedId,
    } as ServiceRequestComment
  }

  /**
   * Get service request comments
   */
  static async getComments(serviceRequestId: string): Promise<ServiceRequestComment[]> {
    const db = await getDatabase()
    const commentsCollection = db.collection<ServiceRequestComment>('service_request_comments')

    return await commentsCollection
      .find({ serviceRequestId })
      .sort({ createdAt: 1 })
      .toArray()
  }

  /**
   * Check and update SLA breaches
   */
  static async checkSLABreaches(orgId: string): Promise<number> {
    const db = await getDatabase()
    const serviceRequestsCollection = db.collection<ServiceRequest>(COLLECTIONS.SERVICE_REQUESTS)

    const now = new Date()

    const result = await serviceRequestsCollection.updateMany(
      {
        orgId,
        status: { $in: ['submitted', 'pending_approval', 'approved', 'in_progress'] },
        'sla.breached': false,
        $or: [
          { 'sla.responseDeadline': { $lt: now } },
          { 'sla.resolutionDeadline': { $lt: now } },
        ],
      },
      {
        $set: {
          'sla.breached': true,
          updatedAt: now,
        },
      }
    )

    return result.modifiedCount
  }
}
