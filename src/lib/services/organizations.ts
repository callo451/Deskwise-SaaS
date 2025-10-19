import { ObjectId } from 'mongodb'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { Organization } from '@/lib/types'
import { TemplateService } from '@/lib/services/email-templates'

export interface CreateOrganizationInput {
  name: string
  domain?: string
  mode: 'msp' | 'internal'
  timezone?: string
  currency?: string
}

export class OrganizationService {
  /**
   * Create a new organization
   */
  static async createOrganization(
    input: CreateOrganizationInput
  ): Promise<Organization> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    // Check if organization with same domain exists
    if (input.domain) {
      const existing = await orgsCollection.findOne({ domain: input.domain })
      if (existing) {
        throw new Error('Organization with this domain already exists')
      }
    }

    const now = new Date()
    const organization: Omit<Organization, '_id'> = {
      name: input.name,
      domain: input.domain,
      mode: input.mode,
      timezone: input.timezone || 'America/New_York',
      currency: input.currency || 'USD',
      createdAt: now,
      updatedAt: now,
      settings: {
        ticketPrefix: 'TKT',
        enableAI: true,
        allowPublicKB: true,
      },
    }

    const result = await orgsCollection.insertOne(organization as Organization)

    const createdOrg = {
      ...organization,
      _id: result.insertedId,
    } as Organization

    // Automatically seed default email templates for the new organization
    try {
      await TemplateService.seedDefaultTemplates(result.insertedId.toString())
    } catch (error) {
      console.error('Failed to seed email templates for new organization:', error)
      // Don't fail organization creation if template seeding fails
    }

    return createdOrg
  }

  /**
   * Get organization by ID
   */
  static async getOrganizationById(id: string): Promise<Organization | null> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    return await orgsCollection.findOne({ _id: new ObjectId(id) })
  }

  /**
   * Get organization by domain
   */
  static async getOrganizationByDomain(
    domain: string
  ): Promise<Organization | null> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    return await orgsCollection.findOne({ domain: domain.toLowerCase() })
  }

  /**
   * Update organization
   */
  static async updateOrganization(
    id: string,
    updates: Partial<Omit<Organization, '_id' | 'createdAt'>>
  ): Promise<Organization | null> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    const result = await orgsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
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
   * Get all organizations (admin only)
   */
  static async getAllOrganizations(): Promise<Organization[]> {
    const db = await getDatabase()
    const orgsCollection = db.collection<Organization>(COLLECTIONS.ORGANIZATIONS)

    return await orgsCollection.find({}).sort({ createdAt: -1 }).toArray()
  }
}
