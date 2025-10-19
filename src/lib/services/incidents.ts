import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '../mongodb'
import type { Incident, IncidentUpdate, IncidentStatus, IncidentSeverity } from '../types'

export interface CreateIncidentInput {
  title: string
  description: string
  severity: IncidentSeverity
  affectedServices: string[]
  clientIds: string[]
  isPublic: boolean
}

export interface UpdateIncidentInput {
  title?: string
  description?: string
  severity?: IncidentSeverity
  affectedServices?: string[]
  clientIds?: string[]
  isPublic?: boolean
  status?: IncidentStatus
  resolvedAt?: Date
}

export interface IncidentFilters {
  status?: IncidentStatus
  severity?: IncidentSeverity
  isPublic?: boolean
  search?: string
}

export class IncidentService {
  /**
   * Create a new incident
   */
  static async createIncident(
    orgId: string,
    input: CreateIncidentInput,
    createdBy: string
  ): Promise<Incident> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    // Generate incident number
    const count = await collection.countDocuments({ orgId })
    const incidentNumber = `INC-${String(count + 1).padStart(4, '0')}`

    const incident: Incident = {
      _id: new ObjectId(),
      orgId,
      incidentNumber,
      title: input.title,
      description: input.description,
      status: 'investigating',
      severity: input.severity,
      affectedServices: input.affectedServices,
      clientIds: input.clientIds,
      isPublic: input.isPublic,
      startedAt: new Date(),
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    }

    await collection.insertOne(incident)

    // Create initial update
    await this.addIncidentUpdate(
      incident._id.toString(),
      orgId,
      'investigating',
      `Incident created: ${input.title}`,
      createdBy
    )

    return incident
  }

  /**
   * Get all incidents with optional filters
   */
  static async getIncidents(
    orgId: string,
    filters?: IncidentFilters
  ): Promise<Incident[]> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const query: any = { orgId, isActive: true }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.severity) {
      query.severity = filters.severity
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

    const incidents = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return incidents
  }

  /**
   * Get public incidents for status page
   */
  static async getPublicIncidents(orgId: string): Promise<Incident[]> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const incidents = await collection
      .find({
        orgId,
        isPublic: true,
        isActive: true,
        status: { $ne: 'resolved' }, // Only show unresolved incidents
      })
      .sort({ severity: -1, createdAt: -1 })
      .toArray()

    return incidents
  }

  /**
   * Get incident by ID
   */
  static async getIncidentById(id: string, orgId: string): Promise<Incident | null> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const incident = await collection.findOne({
      _id: new ObjectId(id),
      orgId,
      isActive: true,
    })

    return incident
  }

  /**
   * Update incident
   */
  static async updateIncident(
    id: string,
    orgId: string,
    updates: UpdateIncidentInput,
    updatedBy: string
  ): Promise<Incident | null> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const updateData: any = {
      ...updates,
      updatedAt: new Date(),
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id), orgId, isActive: true },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    if (result && updates.status) {
      // Add status update
      await this.addIncidentUpdate(
        id,
        orgId,
        updates.status,
        `Status changed to ${updates.status}`,
        updatedBy
      )
    }

    return result
  }

  /**
   * Delete incident (soft delete)
   */
  static async deleteIncident(id: string, orgId: string): Promise<boolean> {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const result = await collection.updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          isActive: false,
          updatedAt: new Date(),
        },
      }
    )

    return result.modifiedCount > 0
  }

  /**
   * Add incident update
   */
  static async addIncidentUpdate(
    incidentId: string,
    orgId: string,
    status: IncidentStatus,
    message: string,
    createdBy: string
  ): Promise<IncidentUpdate> {
    const db = await getDatabase()
    const collection = db.collection<IncidentUpdate>(COLLECTIONS.INCIDENT_UPDATES)

    const update: IncidentUpdate = {
      _id: new ObjectId(),
      incidentId,
      orgId,
      status,
      message,
      createdBy,
      createdAt: new Date(),
    }

    await collection.insertOne(update)

    // Update the incident's updatedAt
    const incidentsCollection = db.collection<Incident>(COLLECTIONS.INCIDENTS)
    await incidentsCollection.updateOne(
      { _id: new ObjectId(incidentId), orgId },
      { $set: { updatedAt: new Date() } }
    )

    return update
  }

  /**
   * Get incident updates
   */
  static async getIncidentUpdates(incidentId: string): Promise<IncidentUpdate[]> {
    const db = await getDatabase()
    const collection = db.collection<IncidentUpdate>(COLLECTIONS.INCIDENT_UPDATES)

    const updates = await collection
      .find({ incidentId })
      .sort({ createdAt: 1 })
      .toArray()

    return updates
  }

  /**
   * Get incident statistics
   */
  static async getIncidentStats(orgId: string) {
    const db = await getDatabase()
    const collection = db.collection<Incident>(COLLECTIONS.INCIDENTS)

    const [
      totalIncidents,
      activeIncidents,
      criticalIncidents,
      resolvedLast30Days,
    ] = await Promise.all([
      collection.countDocuments({ orgId, isActive: true }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: { $ne: 'resolved' },
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        severity: 'critical',
        status: { $ne: 'resolved' },
      }),
      collection.countDocuments({
        orgId,
        isActive: true,
        status: 'resolved',
        resolvedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ])

    // Get incidents by severity
    const bySeverity = await collection
      .aggregate([
        { $match: { orgId, isActive: true, status: { $ne: 'resolved' } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ])
      .toArray()

    const severityStats = {
      minor: 0,
      major: 0,
      critical: 0,
    }

    bySeverity.forEach((item) => {
      if (item._id in severityStats) {
        severityStats[item._id as keyof typeof severityStats] = item.count
      }
    })

    return {
      total: totalIncidents,
      active: activeIncidents,
      critical: criticalIncidents,
      resolvedLast30Days,
      bySeverity: severityStats,
    }
  }
}
