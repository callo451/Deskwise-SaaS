import { clientPromise } from '../mongodb'
import { Client, ClientContact, ClientAgreement } from '../types'
import { ObjectId } from 'mongodb'

export class ClientService {
  /**
   * Get all clients for an organization
   */
  static async getClients(
    orgId: string,
    filters?: {
      status?: string
      parentClientId?: string
      search?: string
    }
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.parentClientId) {
      query.parentClientId = filters.parentClientId
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { displayName: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const clients = await db
      .collection('clients')
      .find(query)
      .sort({ name: 1 })
      .toArray()

    return clients
  }

  /**
   * Get client by ID
   */
  static async getClientById(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('clients').findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Create new client
   */
  static async createClient(
    orgId: string,
    data: Partial<Client>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newClient = {
      ...data,
      orgId,
      isParent: data.isParent || false,
      contacts: data.contacts || [],
      status: data.status || 'prospect',
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      lifetimeValue: 0,
      healthScore: 50,
      currency: data.currency || 'USD',
      paymentTerms: data.paymentTerms || 30,
      taxRate: data.taxRate || 0,
      timezone: data.timezone || 'America/New_York',
      language: data.language || 'en',
      preferences: data.preferences || {
        portalEnabled: false,
        autoTicketCreation: true,
        billingNotifications: true,
      },
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('clients').insertOne(newClient)
    return { ...newClient, _id: result.insertedId }
  }

  /**
   * Update client
   */
  static async updateClient(
    id: string,
    orgId: string,
    data: Partial<Client>,
    updatedBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('clients').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
          updatedBy,
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete client
   */
  static async deleteClient(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').deleteOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get client metrics
   */
  static async getClientMetrics(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const metrics = await db
      .collection('clients')
      .aggregate([
        { $match: { orgId } },
        {
          $group: {
            _id: null,
            totalClients: { $sum: 1 },
            activeClients: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
            },
            prospectClients: {
              $sum: { $cond: [{ $eq: ['$status', 'prospect'] }, 1, 0] },
            },
            inactiveClients: {
              $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
            },
            totalMRR: { $sum: '$monthlyRecurringRevenue' },
            totalRevenue: { $sum: '$totalRevenue' },
            averageHealthScore: { $avg: '$healthScore' },
          },
        },
      ])
      .toArray()

    return (
      metrics[0] || {
        totalClients: 0,
        activeClients: 0,
        prospectClients: 0,
        inactiveClients: 0,
        totalMRR: 0,
        totalRevenue: 0,
        averageHealthScore: 0,
      }
    )
  }

  /**
   * Add contact to client
   */
  static async addContact(
    clientId: string,
    orgId: string,
    contact: ClientContact
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    // If this is primary contact, unset other primary contacts
    if (contact.isPrimary) {
      await db.collection('clients').updateOne(
        { _id: new ObjectId(clientId), orgId },
        {
          $set: { 'contacts.$[].isPrimary': false },
        }
      )
    }

    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), orgId },
      {
        $push: { contacts: contact },
        $set: { updatedAt: new Date() },
      }
    )
  }

  /**
   * Update contact
   */
  static async updateContact(
    clientId: string,
    orgId: string,
    contactId: string,
    contactData: Partial<ClientContact>
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Get current client to merge contact data
    const currentClient = await db.collection('clients').findOne({
      _id: new ObjectId(clientId),
      orgId,
    })

    if (!currentClient) {
      throw new Error('Client not found')
    }

    const currentContact = currentClient.contacts?.find((c: any) => c.id === contactId)
    if (!currentContact) {
      throw new Error('Contact not found')
    }

    // If setting as primary, unset other primary contacts first
    if (contactData.isPrimary) {
      await db.collection('clients').updateOne(
        { _id: new ObjectId(clientId), orgId },
        {
          $set: { 'contacts.$[].isPrimary': false },
        }
      )
    }

    // Merge the contact data
    const updatedContact = {
      ...currentContact,
      ...contactData,
      id: contactId,
      updatedAt: new Date(),
    }

    await db.collection('clients').updateOne(
      {
        _id: new ObjectId(clientId),
        orgId,
        'contacts.id': contactId,
      },
      {
        $set: {
          'contacts.$': updatedContact,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Remove contact
   */
  static async removeContact(
    clientId: string,
    orgId: string,
    contactId: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), orgId },
      {
        $pull: { contacts: { id: contactId } },
        $set: { updatedAt: new Date() },
      }
    )
  }

  /**
   * Get client agreements
   */
  static async getClientAgreements(clientId: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db
      .collection('client_agreements')
      .find({ clientId, orgId })
      .sort({ startDate: -1 })
      .toArray()
  }

  /**
   * Create client agreement
   */
  static async createAgreement(
    orgId: string,
    data: Partial<ClientAgreement>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newAgreement = {
      ...data,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('client_agreements').insertOne(newAgreement)
    return { ...newAgreement, _id: result.insertedId }
  }

  /**
   * Update client agreement
   */
  static async updateAgreement(
    id: string,
    orgId: string,
    data: Partial<ClientAgreement>,
    updatedBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('client_agreements').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
          updatedBy,
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete client agreement
   */
  static async deleteAgreement(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('client_agreements').deleteOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Update client health score
   */
  static async updateHealthScore(clientId: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Calculate health score based on:
    // - Payment history (30%)
    // - Ticket resolution time (25%)
    // - Contract status (20%)
    // - Communication frequency (15%)
    // - Renewal likelihood (10%)

    // This is a simplified version - expand based on your criteria
    const clientData = await this.getClientById(clientId, orgId)
    if (!clientData) return

    let score = 50 // Base score

    // Active status = +20
    if (clientData.status === 'active') score += 20

    // Has active agreement = +10
    const agreements = await this.getClientAgreements(clientId, orgId)
    const hasActiveAgreement = agreements.some((a: any) => a.status === 'active')
    if (hasActiveAgreement) score += 10

    // MRR contribution = up to +20
    if (clientData.monthlyRecurringRevenue > 1000) score += 10
    if (clientData.monthlyRecurringRevenue > 5000) score += 10

    // Ensure score is between 0-100
    score = Math.max(0, Math.min(100, score))

    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), orgId },
      {
        $set: {
          healthScore: score,
          updatedAt: new Date(),
        },
      }
    )

    return score
  }

  /**
   * Get child clients (for parent organizations)
   */
  static async getChildClients(parentClientId: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db
      .collection('clients')
      .find({ parentClientId, orgId })
      .sort({ name: 1 })
      .toArray()
  }
}
