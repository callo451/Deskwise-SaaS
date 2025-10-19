import { clientPromise } from '../mongodb'
import {
  ServiceAgreement,
  AgreementTemplate,
  SLABreach,
  AgreementMetrics,
  SLATier,
  BusinessHours,
  BusinessHoursDay,
  SLATarget,
  AgreementStatus,
} from '../types'
import { ObjectId } from 'mongodb'

/**
 * Default SLA Tiers (Industry Standard for MSP)
 */
const DEFAULT_SLA_TIERS: Record<
  SLATier,
  {
    responseTime: SLATarget
    resolutionTime: SLATarget
    availability: number
  }
> = {
  platinum: {
    responseTime: { critical: 15, high: 30, medium: 120, low: 480 }, // minutes
    resolutionTime: { critical: 240, high: 480, medium: 1440, low: 2880 }, // minutes (4h, 8h, 24h, 48h)
    availability: 99.9,
  },
  gold: {
    responseTime: { critical: 30, high: 60, medium: 240, low: 720 },
    resolutionTime: { critical: 480, high: 960, medium: 2880, low: 5760 }, // 8h, 16h, 48h, 96h
    availability: 99.5,
  },
  silver: {
    responseTime: { critical: 60, high: 120, medium: 480, low: 1440 },
    resolutionTime: { critical: 960, high: 1920, medium: 5760, low: 11520 }, // 16h, 32h, 96h, 192h
    availability: 99.0,
  },
  bronze: {
    responseTime: { critical: 120, high: 240, medium: 960, low: 2880 },
    resolutionTime: { critical: 1920, high: 3840, medium: 11520, low: 23040 }, // 32h, 64h, 192h, 384h
    availability: 98.0,
  },
  custom: {
    responseTime: { critical: 60, high: 120, medium: 480, low: 1440 },
    resolutionTime: { critical: 480, high: 960, medium: 2880, low: 5760 },
    availability: 99.0,
  },
}

/**
 * Default Business Hours (8 AM - 5 PM, Mon-Fri)
 */
const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  timezone: 'America/New_York',
  monday: { enabled: true, start: '08:00', end: '17:00' },
  tuesday: { enabled: true, start: '08:00', end: '17:00' },
  wednesday: { enabled: true, start: '08:00', end: '17:00' },
  thursday: { enabled: true, start: '08:00', end: '17:00' },
  friday: { enabled: true, start: '08:00', end: '17:00' },
  saturday: { enabled: false, start: '08:00', end: '17:00' },
  sunday: { enabled: false, start: '08:00', end: '17:00' },
}

export class AgreementService {
  /**
   * Get all agreements for an organization
   */
  static async getAgreements(
    orgId: string,
    filters?: {
      clientId?: string
      status?: AgreementStatus | AgreementStatus[]
      type?: string
      search?: string
    }
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query.status = { $in: filters.status }
      } else {
        query.status = filters.status
      }
    }

    if (filters?.type) {
      query.type = filters.type
    }

    if (filters?.search) {
      query.$or = [
        { agreementNumber: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { clientName: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const agreements = await db
      .collection('service_agreements')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return agreements
  }

  /**
   * Get agreement by ID
   */
  static async getAgreementById(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('service_agreements').findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Get agreement by number
   */
  static async getAgreementByNumber(agreementNumber: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('service_agreements').findOne({
      agreementNumber,
      orgId,
    })
  }

  /**
   * Generate next agreement number
   */
  static async generateAgreementNumber(orgId: string): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const year = new Date().getFullYear()
    const prefix = `AGR-${year}-`

    // Find the highest number for this year
    const lastAgreement = await db
      .collection('service_agreements')
      .find({
        orgId,
        agreementNumber: { $regex: `^${prefix}` },
      })
      .sort({ agreementNumber: -1 })
      .limit(1)
      .toArray()

    let nextNumber = 1
    if (lastAgreement.length > 0) {
      const lastNumber = parseInt(
        lastAgreement[0].agreementNumber.replace(prefix, '')
      )
      nextNumber = lastNumber + 1
    }

    return `${prefix}${String(nextNumber).padStart(4, '0')}`
  }

  /**
   * Create new agreement
   */
  static async createAgreement(
    orgId: string,
    data: Partial<ServiceAgreement>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()

    // Generate agreement number if not provided
    const agreementNumber = await this.generateAgreementNumber(orgId)

    // Get default SLA if tier is provided but no custom SLA
    let slaConfig = data.sla
    if (!slaConfig && data.sla?.tier) {
      const tierDefaults = DEFAULT_SLA_TIERS[data.sla.tier]
      slaConfig = {
        tier: data.sla.tier,
        responseTime: tierDefaults.responseTime,
        resolutionTime: tierDefaults.resolutionTime,
        availability: tierDefaults.availability,
        businessHours: DEFAULT_BUSINESS_HOURS,
        excludeHolidays: true,
      }
    }

    const newAgreement = {
      ...data,
      orgId,
      agreementNumber,
      status: data.status || 'draft',
      coveredServices: data.coveredServices || [],
      documents: data.documents || [],
      tags: data.tags || [],
      sla: slaConfig || {
        tier: 'bronze',
        ...DEFAULT_SLA_TIERS.bronze,
        businessHours: DEFAULT_BUSINESS_HOURS,
        excludeHolidays: true,
      },
      renewal: data.renewal || {
        autoRenew: false,
        renewalNoticeDays: 30,
        renewalTermMonths: 12,
        renewalHistory: [],
      },
      notificationSettings: data.notificationSettings || {
        breachNotifications: true,
        expiryNotifications: true,
        renewalNotifications: true,
        monthlyReports: true,
        notifyEmails: [],
      },
      approvalHistory: data.approvalHistory || [],
      createdAt: now,
      updatedAt: now,
      createdBy,
    }

    const result = await db
      .collection('service_agreements')
      .insertOne(newAgreement)
    return { ...newAgreement, _id: result.insertedId }
  }

  /**
   * Update agreement
   */
  static async updateAgreement(
    id: string,
    orgId: string,
    updates: Partial<ServiceAgreement>
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const { _id, createdAt, createdBy, ...updateData } = updates as any

    const result = await db.collection('service_agreements').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId,
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete agreement (soft delete by setting status to 'terminated')
   */
  static async deleteAgreement(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('service_agreements').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId,
      },
      {
        $set: {
          status: 'terminated',
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Change agreement status
   */
  static async changeStatus(
    id: string,
    orgId: string,
    newStatus: AgreementStatus,
    userId: string,
    comments?: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const agreement = await this.getAgreementById(id, orgId)
    if (!agreement) {
      throw new Error('Agreement not found')
    }

    // Get user info for approval history
    const user = await db.collection('users').findOne({
      _id: new ObjectId(userId),
      orgId,
    })

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    }

    // If moving to active, set signedDate if not already set
    if (newStatus === 'active' && !agreement.signedDate) {
      updateData.signedDate = new Date()
    }

    // Add to approval history if applicable
    if (
      ['pending_review', 'pending_approval', 'active'].includes(newStatus)
    ) {
      updateData.$push = {
        approvalHistory: {
          approvedBy: userId,
          approvedByName: user?.firstName
            ? `${user.firstName} ${user.lastName}`
            : user?.email || 'Unknown',
          approvedAt: new Date(),
          comments: comments || '',
        },
      }
    }

    const result = await db.collection('service_agreements').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId,
      },
      updateData.$push ? updateData : { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Get SLA breaches for an agreement
   */
  static async getSLABreaches(
    agreementId: string,
    orgId: string,
    filters?: {
      status?: string
      severity?: string
      breachType?: string
    }
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId, agreementId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.severity) {
      query.severity = filters.severity
    }

    if (filters?.breachType) {
      query.breachType = filters.breachType
    }

    const breaches = await db
      .collection('sla_breaches')
      .find(query)
      .sort({ detectedAt: -1 })
      .toArray()

    return breaches
  }

  /**
   * Record SLA breach
   */
  static async recordSLABreach(
    orgId: string,
    breachData: Partial<SLABreach>
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newBreach = {
      ...breachData,
      orgId,
      status: breachData.status || 'open',
      creditIssued: false,
      escalated: false,
      clientNotified: false,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection('sla_breaches').insertOne(newBreach)
    return { ...newBreach, _id: result.insertedId }
  }

  /**
   * Calculate agreement metrics
   */
  static async calculateMetrics(
    agreementId: string,
    orgId: string,
    periodStart?: Date,
    periodEnd?: Date
  ): Promise<AgreementMetrics> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const agreement = await this.getAgreementById(agreementId, orgId)
    if (!agreement) {
      throw new Error('Agreement not found')
    }

    // Default to current month if no period specified
    const start =
      periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const end = periodEnd || new Date()

    // Get tickets associated with this client in the period
    const tickets = await db
      .collection('tickets')
      .find({
        orgId,
        clientId: agreement.clientId,
        createdAt: { $gte: start, $lte: end },
      })
      .toArray()

    // Calculate ticket metrics
    const totalTickets = tickets.length
    const ticketsWithinSLA = tickets.filter(
      (t) => t.sla && !t.sla.breached
    ).length
    const ticketsBreachedSLA = tickets.filter(
      (t) => t.sla && t.sla.breached
    ).length
    const slaComplianceRate =
      totalTickets > 0
        ? Math.round((ticketsWithinSLA / totalTickets) * 100 * 100) / 100
        : 100

    // Calculate average response/resolution times
    const ticketsWithSLA = tickets.filter((t) => t.sla)
    const avgResponseTime =
      ticketsWithSLA.length > 0
        ? Math.round(
            ticketsWithSLA.reduce((sum, t) => sum + (t.sla?.responseTime || 0), 0) /
              ticketsWithSLA.length
          )
        : 0
    const avgResolutionTime =
      ticketsWithSLA.length > 0
        ? Math.round(
            ticketsWithSLA.reduce(
              (sum, t) => sum + (t.sla?.resolutionTime || 0),
              0
            ) / ticketsWithSLA.length
          )
        : 0

    // Get time entries for this client in the period
    const timeEntries = await db
      .collection('time_entries')
      .find({
        orgId,
        startTime: { $gte: start, $lte: end },
      })
      .toArray()

    // Filter time entries for tickets belonging to this client
    const clientTicketIds = new Set(tickets.map((t) => t._id.toString()))
    const clientTimeEntries = timeEntries.filter((te) =>
      clientTicketIds.has(te.ticketId)
    )

    // Calculate hours used
    const totalMinutesUsed = clientTimeEntries.reduce(
      (sum, te) => sum + (te.duration || 0),
      0
    )
    const hoursUsed = Math.round((totalMinutesUsed / 60) * 100) / 100

    // Calculate included hours and overage
    const includedHoursPerMonth =
      agreement.coveredServices.reduce(
        (sum, s) => sum + (s.includedHours || 0),
        0
      ) || 0
    const includedHoursRemaining = Math.max(0, includedHoursPerMonth - hoursUsed)
    const overageHours = Math.max(0, hoursUsed - includedHoursPerMonth)

    // Calculate overage revenue
    const avgOverageRate =
      agreement.coveredServices
        .filter((s) => s.overageRate)
        .reduce((sum, s) => sum + (s.overageRate || 0), 0) /
        agreement.coveredServices.filter((s) => s.overageRate).length || 0
    const overageRevenue = Math.round(overageHours * avgOverageRate * 100) / 100

    // Get invoices for this client in the period
    const invoices = await db
      .collection('invoices')
      .find({
        orgId,
        clientId: agreement.clientId,
        invoiceDate: { $gte: start, $lte: end },
        status: { $in: ['paid', 'partial'] },
      })
      .toArray()

    const totalRevenue =
      Math.round(
        invoices.reduce((sum, inv) => sum + inv.amountPaid, 0) * 100
      ) / 100

    // Get SLA breaches in the period
    const breaches = await db
      .collection('sla_breaches')
      .find({
        orgId,
        agreementId,
        detectedAt: { $gte: start, $lte: end },
      })
      .toArray()

    const totalBreaches = breaches.length
    const criticalBreaches = breaches.filter((b) => b.severity === 'critical')
      .length
    const creditsIssued = breaches.filter((b) => b.creditIssued).length
    const totalCreditAmount =
      Math.round(
        breaches.reduce((sum, b) => sum + (b.creditAmount || 0), 0) * 100
      ) / 100

    return {
      totalTickets,
      ticketsWithinSLA,
      ticketsBreachedSLA,
      slaComplianceRate,
      avgResponseTime,
      avgResolutionTime,
      totalRevenue,
      includedHoursUsed: hoursUsed,
      includedHoursRemaining,
      overageHours,
      overageRevenue,
      totalBreaches,
      criticalBreaches,
      creditsIssued,
      totalCreditAmount,
      lastCalculatedAt: new Date(),
      periodStart: start,
      periodEnd: end,
    }
  }

  /**
   * Update agreement metrics
   */
  static async updateMetrics(
    agreementId: string,
    orgId: string,
    periodStart?: Date,
    periodEnd?: Date
  ) {
    const metrics = await this.calculateMetrics(
      agreementId,
      orgId,
      periodStart,
      periodEnd
    )

    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('service_agreements').updateOne(
      {
        _id: new ObjectId(agreementId),
        orgId,
      },
      {
        $set: {
          metrics,
          updatedAt: new Date(),
        },
      }
    )

    return metrics
  }

  /**
   * Get expiring agreements (within X days)
   */
  static async getExpiringAgreements(orgId: string, withinDays: number = 30) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + withinDays)

    const agreements = await db
      .collection('service_agreements')
      .find({
        orgId,
        status: 'active',
        endDate: {
          $gte: now,
          $lte: futureDate,
        },
      })
      .sort({ endDate: 1 })
      .toArray()

    return agreements
  }

  /**
   * Renew agreement
   */
  static async renewAgreement(
    id: string,
    orgId: string,
    userId: string,
    renewalData?: {
      newEndDate?: Date
      priceChange?: number
      notes?: string
    }
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const agreement = await this.getAgreementById(id, orgId)
    if (!agreement) {
      throw new Error('Agreement not found')
    }

    const now = new Date()
    const previousEndDate = agreement.endDate || now
    const renewalTermMonths = agreement.renewal?.renewalTermMonths || 12

    // Calculate new end date
    const newEndDate =
      renewalData?.newEndDate ||
      new Date(
        previousEndDate.getFullYear(),
        previousEndDate.getMonth() + renewalTermMonths,
        previousEndDate.getDate()
      )

    // Calculate price change
    const priceChangePercent =
      renewalData?.priceChange ||
      agreement.renewal?.priceIncreasePercent ||
      0
    const newPrice =
      agreement.billing.amount * (1 + priceChangePercent / 100)

    // Update agreement
    const result = await db.collection('service_agreements').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId,
      },
      {
        $set: {
          endDate: newEndDate,
          status: 'active',
          'billing.amount': Math.round(newPrice * 100) / 100,
          'renewal.nextRenewalDate': newEndDate,
          updatedAt: now,
        },
        $push: {
          'renewal.renewalHistory': {
            renewedAt: now,
            renewedBy: userId,
            previousEndDate,
            newEndDate,
            priceChange: Math.round((newPrice - agreement.billing.amount) * 100) / 100,
            priceChangePercent,
            notes: renewalData?.notes || '',
          },
        },
      },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Get agreement templates
   */
  static async getTemplates(orgId: string, filters?: { type?: string }) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId, isActive: true }

    if (filters?.type) {
      query.type = filters.type
    }

    const templates = await db
      .collection('agreement_templates')
      .find(query)
      .sort({ name: 1 })
      .toArray()

    return templates
  }

  /**
   * Create agreement from template
   */
  static async createFromTemplate(
    templateId: string,
    orgId: string,
    clientData: {
      clientId: string
      clientName: string
      startDate: Date
      endDate?: Date
    },
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const template = await db.collection('agreement_templates').findOne({
      _id: new ObjectId(templateId),
      orgId,
    })

    if (!template) {
      throw new Error('Template not found')
    }

    // Create agreement from template
    const agreementData: Partial<ServiceAgreement> = {
      clientId: clientData.clientId,
      clientName: clientData.clientName,
      name: template.name,
      description: template.description,
      type: template.type,
      startDate: clientData.startDate,
      endDate: clientData.endDate,
      sla: template.defaultSLA,
      coveredServices: template.defaultServices.map((s: any, index: number) => ({
        ...s,
        id: `service_${index + 1}`,
      })),
      billing: {
        ...template.defaultBilling,
        nextBillingDate: clientData.startDate,
      },
      termsAndConditions: template.termsAndConditions,
      customTerms: template.customTerms,
    }

    // Update template usage
    await db.collection('agreement_templates').updateOne(
      { _id: new ObjectId(templateId) },
      {
        $inc: { timesUsed: 1 },
        $set: { lastUsedAt: new Date() },
      }
    )

    return this.createAgreement(orgId, agreementData, createdBy)
  }

  /**
   * Get default SLA tier configuration
   */
  static getDefaultSLATier(tier: SLATier) {
    return DEFAULT_SLA_TIERS[tier]
  }

  /**
   * Get default business hours
   */
  static getDefaultBusinessHours() {
    return DEFAULT_BUSINESS_HOURS
  }
}
