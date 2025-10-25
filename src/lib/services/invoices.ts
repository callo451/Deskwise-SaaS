import { clientPromise } from '../mongodb'
import { Invoice, InvoiceLineItem, Payment, RecurringBillingSchedule } from '../types'
import { ObjectId } from 'mongodb'

export class InvoiceService {
  /**
   * Generate next invoice number for organization
   */
  private static async generateInvoiceNumber(orgId: string): Promise<string> {
    const client = await clientPromise
    const db = client.db('deskwise')

    const latestInvoice = await db
      .collection('invoices')
      .find({ orgId })
      .sort({ invoiceNumber: -1 })
      .limit(1)
      .toArray()

    if (latestInvoice.length === 0) {
      return `INV-${new Date().getFullYear()}-0001`
    }

    const lastNumber = latestInvoice[0].invoiceNumber
    const match = lastNumber.match(/(\d+)$/)
    const nextNum = match ? parseInt(match[1]) + 1 : 1
    const paddedNum = nextNum.toString().padStart(4, '0')

    return `INV-${new Date().getFullYear()}-${paddedNum}`
  }

  /**
   * Calculate invoice totals
   */
  private static calculateTotals(
    lineItems: InvoiceLineItem[],
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
   * Get all invoices for an organization
   */
  static async getInvoices(
    orgId: string,
    filters?: {
      status?: string
      clientId?: string
      search?: string
      isRecurring?: boolean
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

    if (filters?.isRecurring !== undefined) {
      query.isRecurring = filters.isRecurring
    }

    if (filters?.search) {
      query.$or = [
        { invoiceNumber: { $regex: filters.search, $options: 'i' } },
        { 'client.name': { $regex: filters.search, $options: 'i' } },
      ]
    }

    const invoices = await db
      .collection('invoices')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()

    return invoices
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('invoices').findOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Create new invoice
   */
  static async createInvoice(
    orgId: string,
    data: Partial<Invoice>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const invoiceNumber = await this.generateInvoiceNumber(orgId)

    // Calculate due date if not provided
    const dueDate = data.dueDate || new Date(now.getTime() + (data.paymentTerms || 30) * 24 * 60 * 60 * 1000)

    // Calculate totals
    const lineItems = (data.lineItems || []) as InvoiceLineItem[]
    const { subtotal, discountAmount, taxAmount, total } = this.calculateTotals(
      lineItems,
      data.discountType || 'percentage',
      data.discountValue || 0,
      data.taxRate || 0
    )

    const newInvoice = {
      ...data,
      orgId,
      invoiceNumber,
      lineItems,
      status: data.status || 'draft',
      subtotal,
      discountAmount,
      taxAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      currency: data.currency || 'USD',
      issueDate: data.issueDate || now,
      dueDate,
      isRecurring: data.isRecurring || false,
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('invoices').insertOne(newInvoice)
    return { ...newInvoice, _id: result.insertedId }
  }

  /**
   * Update invoice
   */
  static async updateInvoice(
    id: string,
    orgId: string,
    data: Partial<Invoice>,
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

      // Get current invoice to check payments
      const currentInvoice = await this.getInvoiceById(id, orgId)
      const amountPaid = currentInvoice?.amountPaid || 0

      updates = {
        ...updates,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        amountDue: total - amountPaid,
      }
    }

    const result = await db.collection('invoices').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      { $set: updates },
      { returnDocument: 'after' }
    )

    return result
  }

  /**
   * Delete invoice
   */
  static async deleteInvoice(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('invoices').deleteOne({
      _id: new ObjectId(id),
      orgId,
    })
  }

  /**
   * Mark invoice as sent
   */
  static async markAsSent(id: string, orgId: string, sentBy: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('invoices').updateOne(
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
   * Record payment
   */
  static async recordPayment(
    invoiceId: string,
    orgId: string,
    payment: Partial<Payment>,
    recordedBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const invoice = await this.getInvoiceById(invoiceId, orgId)
    if (!invoice) {
      throw new Error('Invoice not found')
    }

    const now = new Date()
    const newPayment = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...payment,
      invoiceId,
      orgId,
      recordedAt: now,
      recordedBy,
    }

    // Calculate new amounts
    const amountPaid = (invoice.amountPaid || 0) + (payment.amount || 0)
    const amountDue = invoice.total - amountPaid

    // Determine new status
    let status = invoice.status
    if (amountDue <= 0) {
      status = 'paid'
    } else if (amountPaid > 0) {
      status = 'partial'
    }

    // Update invoice
    await db.collection('invoices').updateOne(
      { _id: new ObjectId(invoiceId), orgId },
      {
        $set: {
          amountPaid,
          amountDue,
          status,
          paidAt: amountDue <= 0 ? now : undefined,
          updatedAt: now,
        },
        $push: { payments: newPayment },
      }
    )

    return newPayment
  }

  /**
   * Mark invoice as overdue
   */
  static async markOverdueInvoices(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()

    await db.collection('invoices').updateMany(
      {
        orgId,
        status: { $in: ['sent', 'partial'] },
        dueDate: { $lt: now },
      },
      {
        $set: {
          status: 'overdue',
          updatedAt: now,
        },
      }
    )
  }

  /**
   * Void invoice
   */
  static async voidInvoice(id: string, orgId: string, voidedBy: string, reason?: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('invoices').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status: 'void',
          voidedAt: new Date(),
          voidedBy,
          voidReason: reason,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Update invoice status
   */
  static async updateInvoiceStatus(id: string, orgId: string, status: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('invoices').updateOne(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          status,
          updatedAt: new Date(),
        },
      }
    )
  }

  /**
   * Create invoice from quote
   */
  static async createFromQuote(
    quoteId: string,
    orgId: string,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const quote = await db.collection('quotes').findOne({
      _id: new ObjectId(quoteId),
      orgId,
    })

    if (!quote) {
      throw new Error('Quote not found')
    }

    const invoiceData = {
      clientId: quote.clientId,
      lineItems: quote.lineItems,
      subtotal: quote.subtotal,
      discountType: quote.discountType,
      discountValue: quote.discountValue,
      discountAmount: quote.discountAmount,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      total: quote.total,
      currency: quote.currency,
      terms: quote.terms,
      notes: quote.notes,
      quoteId: quoteId,
    }

    return await this.createInvoice(orgId, invoiceData, createdBy)
  }

  /**
   * Get invoice metrics
   */
  static async getInvoiceMetrics(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const metrics = await db
      .collection('invoices')
      .aggregate([
        { $match: { orgId } },
        {
          $group: {
            _id: null,
            totalInvoices: { $sum: 1 },
            draftInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] },
            },
            sentInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] },
            },
            paidInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] },
            },
            partialInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] },
            },
            overdueInvoices: {
              $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] },
            },
            totalRevenue: { $sum: '$total' },
            totalPaid: { $sum: '$amountPaid' },
            totalOutstanding: { $sum: '$amountDue' },
          },
        },
      ])
      .toArray()

    return (
      metrics[0] || {
        totalInvoices: 0,
        draftInvoices: 0,
        sentInvoices: 0,
        paidInvoices: 0,
        partialInvoices: 0,
        overdueInvoices: 0,
        totalRevenue: 0,
        totalPaid: 0,
        totalOutstanding: 0,
      }
    )
  }

  /**
   * Get aging report
   */
  static async getAgingReport(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const report = await db
      .collection('invoices')
      .aggregate([
        {
          $match: {
            orgId,
            status: { $in: ['sent', 'partial', 'overdue'] },
          },
        },
        {
          $group: {
            _id: null,
            current: {
              $sum: {
                $cond: [{ $gte: ['$dueDate', now] }, '$amountDue', 0],
              },
            },
            days30: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$dueDate', now] },
                      { $gte: ['$dueDate', thirtyDaysAgo] },
                    ],
                  },
                  '$amountDue',
                  0,
                ],
              },
            },
            days60: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$dueDate', thirtyDaysAgo] },
                      { $gte: ['$dueDate', sixtyDaysAgo] },
                    ],
                  },
                  '$amountDue',
                  0,
                ],
              },
            },
            days90: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $lt: ['$dueDate', sixtyDaysAgo] },
                      { $gte: ['$dueDate', ninetyDaysAgo] },
                    ],
                  },
                  '$amountDue',
                  0,
                ],
              },
            },
            days90Plus: {
              $sum: {
                $cond: [{ $lt: ['$dueDate', ninetyDaysAgo] }, '$amountDue', 0],
              },
            },
          },
        },
      ])
      .toArray()

    return (
      report[0] || {
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        days90Plus: 0,
      }
    )
  }

  /**
   * Get recurring billing schedules
   */
  static async getRecurringSchedules(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db
      .collection('recurring_billing_schedules')
      .find({ orgId })
      .sort({ nextInvoiceDate: 1 })
      .toArray()
  }

  /**
   * Create recurring billing schedule
   */
  static async createRecurringSchedule(
    orgId: string,
    data: Partial<RecurringBillingSchedule>,
    createdBy: string
  ) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newSchedule = {
      ...data,
      orgId,
      status: data.status || 'active',
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('recurring_billing_schedules').insertOne(newSchedule)
    return { ...newSchedule, _id: result.insertedId }
  }

  /**
   * Process recurring invoices (run daily via cron)
   */
  static async processRecurringInvoices(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()

    // Find schedules due for invoicing
    const schedules = await db
      .collection('recurring_billing_schedules')
      .find({
        orgId,
        status: 'active',
        nextInvoiceDate: { $lte: now },
      })
      .toArray()

    const invoices = []

    for (const schedule of schedules) {
      // Create invoice from schedule
      const invoice = await this.createInvoice(
        orgId,
        {
          clientId: schedule.clientId,
          lineItems: schedule.lineItems,
          isRecurring: true,
          recurringScheduleId: schedule._id.toString(),
          currency: schedule.currency,
          terms: schedule.terms,
          notes: schedule.notes,
        },
        'system'
      )

      invoices.push(invoice)

      // Calculate next invoice date
      let nextDate = new Date(schedule.nextInvoiceDate)
      switch (schedule.frequency) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7)
          break
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1)
          break
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3)
          break
        case 'annually':
          nextDate.setFullYear(nextDate.getFullYear() + 1)
          break
      }

      // Update schedule
      await db.collection('recurring_billing_schedules').updateOne(
        { _id: schedule._id },
        {
          $set: {
            nextInvoiceDate: nextDate,
            lastInvoiceDate: now,
            updatedAt: now,
          },
          $inc: { invoiceCount: 1 },
        }
      )
    }

    return invoices
  }
}
