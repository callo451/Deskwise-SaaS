import { clientPromise } from '../mongodb'
import { Quote, QuoteLineItem, QuoteTemplate } from '../types'
import { ObjectId } from 'mongodb'

export class QuoteService {
  /**
   * Generate next quote number for organization
   */
  private static async generateQuoteNumber(orgId: string): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Find the latest quote number
    const latestQuote = await db
      .collection('quotes')
      .find({ orgId })
      .sort({ quoteNumber: -1 })
      .limit(1)
      .toArray()

    if (latestQuote.length === 0) {
      return `Q-${new Date().getFullYear()}-0001`
    }

    // Extract number from last quote and increment
    const lastNumber = latestQuote[0].quoteNumber
    const match = lastNumber.match(/(\d+)$/)
    const nextNum = match ? parseInt(match[1]) + 1 : 1
    const paddedNum = nextNum.toString().padStart(4, '0')

    return `Q-${new Date().getFullYear()}-${paddedNum}`
  }

  /**
   * Calculate quote totals
   */
  private static calculateTotals(
    lineItems: QuoteLineItem[],
    discountType: 'percentage' | 'fixed',
    discountValue: number,
    taxRate: number
  ) {
    const subtotal = lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const discountAmount =
      discountType === 'percentage'
        ? (subtotal * discountValue) / 100
        : discountValue

    const taxableAmount = subtotal - discountAmount
    const taxAmount = (taxableAmount * taxRate) / 100
    const total = taxableAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
    }
  }

  /**
   * Get all quotes for an organization
   */
  static async getQuotes(
    orgId: string,
    filters?: {
      status?: string
      clientId?: string
      search?: string
    }
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.clientId) {
      query.clientId = filters.clientId
    }

    if (filters?.search) {
      query.$or = [
        { quoteNumber: { $regex: filters.search, $options: 'i' } },
        { title: { $regex: filters.search, $options: 'i' } },
        { 'client.name': { $regex: filters.search, $options: 'i' } },
      ]
    }

    const quotes = await db
      .collection('quotes')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return quotes
  }

  /**
   * Get quote by ID
   */
  static async getQuoteById(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('quotes').findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Create new quote
   */
  static async createQuote(
    orgId: string,
    data: Partial<Quote>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const quoteNumber = await this.generateQuoteNumber(orgId)

    // Calculate totals
    const lineItems = (data.lineItems || []) as QuoteLineItem[]
    const { subtotal, discountAmount, taxAmount, total } = this.calculateTotals(
      lineItems,
      data.discountType || 'percentage',
      data.discountValue || 0,
      data.taxRate || 0
    )

    const newQuote = {
      ...data,
      orgId,
      quoteNumber,
      lineItems,
      status: data.status || 'draft',
      version: 1,
      subtotal,
      discountAmount,
      taxAmount,
      total,
      currency: data.currency || 'USD',
      validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('quotes').insertOne(newQuote)
    return { ...newQuote, _id: result.insertedId }
  }

  /**
   * Update quote
   */
  static async updateQuote(
    id: string,
    orgId: string,
    data: Partial<Quote>,
    updatedBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    // Recalculate totals if line items changed
    let updates: any = { ...data, updatedAt: new Date(), updatedBy }

    if (data.lineItems) {
      const { subtotal, discountAmount, taxAmount, total } = this.calculateTotals(
        data.lineItems,
        data.discountType || 'percentage',
        data.discountValue || 0,
        data.taxRate || 0
      )
      updates = {
        ...updates,
        subtotal,
        discountAmount,
        taxAmount,
        total,
      }
    }

    const result = await db.collection('quotes').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete quote
   */
  static async deleteQuote(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('quotes').deleteOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Clone quote (create new version)
   */
  static async cloneQuote(
    id: string,
    orgId: string,
    createdBy: string
  ): Promise<any> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const originalQuote = await this.getQuoteById(id, orgId)
    if (!originalQuote) {
      throw new Error('Quote not found')
    }

    const now = new Date()
    const quoteNumber = await this.generateQuoteNumber(orgId)

    const clonedQuote = {
      ...originalQuote,
      _id: undefined,
      quoteNumber,
      status: 'draft',
      version: (originalQuote.version || 1) + 1,
      parentQuoteId: id,
      sentAt: undefined,
      viewedAt: undefined,
      acceptedAt: undefined,
      declinedAt: undefined,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('quotes').insertOne(clonedQuote)
    return { ...clonedQuote, _id: result.insertedId }
  }

  /**
   * Mark quote as sent
   */
  static async markAsSent(id: string, orgId: string, sentBy: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('quotes').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'sent',
          sentAt: new Date(),
          sentBy,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Mark quote as accepted
   */
  static async markAsAccepted(id: string, orgId: string, acceptedBy?: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('quotes').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'accepted',
          acceptedAt: new Date(),
          acceptedBy,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Mark quote as declined
   */
  static async markAsDeclined(
    id: string,
    orgId: string,
    reason?: string,
    declinedBy?: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('quotes').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'declined',
          declinedAt: new Date(),
          declinedBy,
          declineReason: reason,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Convert quote to invoice
   */
  static async convertToInvoice(
    id: string,
    orgId: string,
    convertedBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const quote = await this.getQuoteById(id, orgId)
    if (!quote) {
      throw new Error('Quote not found')
    }

    if (quote.status !== 'accepted') {
      throw new Error('Only accepted quotes can be converted to invoices')
    }

    // Mark quote as converted
    await db.collection('quotes').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'converted',
          convertedToInvoice: true,
          convertedAt: new Date(),
          convertedBy,
          updatedAt: new Date(),
        },
      }
    )

    return { success: true, quoteId: id }
  }

  /**
   * Get quote metrics
   */
  static async getQuoteMetrics(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const metrics = await db
      .collection('quotes')
      .aggregate([
        { $match: { orgId } },
        {
          $group: {
            _id: null,
            totalQuotes: { $sum: 1 },
            draftQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
            },
            sentQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] },
            },
            acceptedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] },
            },
            declinedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'declined'] }, 1, 0] },
            },
            convertedQuotes: {
              $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] },
            },
            totalValue: { $sum: '$total' },
            acceptedValue: {
              $sum: {
                $cond: [{ $eq: ['$status', 'accepted'] }, '$total', 0],
              },
            },
          },
        },
      ])
      .toArray()

    const result = metrics[0] || {
      totalQuotes: 0,
      draftQuotes: 0,
      sentQuotes: 0,
      acceptedQuotes: 0,
      declinedQuotes: 0,
      convertedQuotes: 0,
      totalValue: 0,
      acceptedValue: 0,
    }

    // Calculate acceptance rate
    const acceptanceRate =
      result.sentQuotes + result.acceptedQuotes + result.convertedQuotes > 0
        ? ((result.acceptedQuotes + result.convertedQuotes) /
            (result.sentQuotes +
              result.acceptedQuotes +
              result.declinedQuotes +
              result.convertedQuotes)) *
          100
        : 0

    return {
      ...result,
      acceptanceRate: Math.round(acceptanceRate * 10) / 10,
    }
  }

  /**
   * Get quote templates
   */
  static async getTemplates(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db
      .collection('quote_templates')
      .find({ orgId })
      .sort({ name: 1 })
      .toArray()
  }

  /**
   * Create quote template
   */
  static async createTemplate(
    orgId: string,
    data: Partial<QuoteTemplate>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newTemplate = {
      ...data,
      orgId,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('quote_templates').insertOne(newTemplate)
    return { ...newTemplate, _id: result.insertedId }
  }

  /**
   * Create quote from template
   */
  static async createFromTemplate(
    templateId: string,
    orgId: string,
    clientId: string,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const template = await db.collection('quote_templates').findOne({
      _id: new ObjectId(templateId),
      orgId,
    })

    if (!template) {
      throw new Error('Template not found')
    }

    // Create quote from template
    const quoteData = {
      clientId,
      title: template.name,
      description: template.description,
      lineItems: template.defaultLineItems,
      terms: template.terms,
      notes: template.notes,
      discountType: template.defaultDiscountType || 'percentage',
      discountValue: template.defaultDiscountValue || 0,
      taxRate: 0, // Will be set based on client settings
      currency: 'USD', // Will be set based on client settings
    }

    return await this.createQuote(orgId, quoteData, createdBy)
  }
}
