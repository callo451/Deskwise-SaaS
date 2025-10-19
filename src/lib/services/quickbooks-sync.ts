import { clientPromise } from '../mongodb'
import { ObjectId } from 'mongodb'
import {
  Invoice,
  Quote,
  Client,
  Product,
  Payment,
  QuickBooksEntityType,
} from '../types'
import { QuickBooksIntegrationService } from './quickbooks-integration'

/**
 * QuickBooks Sync Service
 * Handles data synchronization between Deskwise and QuickBooks Online
 */
export class QuickBooksSyncService {
  /**
   * Sync Invoice to QuickBooks
   * Creates or updates an invoice in QuickBooks Online
   */
  static async syncInvoice(
    orgId: string,
    invoiceId: string,
    userId: string
  ): Promise<{ success: boolean; qboInvoiceId?: string; error?: string }> {
    let syncLogId: string | null = null

    try {
      console.log('[QBO Sync] Starting invoice sync:', invoiceId)

      // Get integration
      const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
      if (!integration) {
        throw new Error('QuickBooks integration not found')
      }

      // Get invoice
      const client = await clientPromise
      const db = client.db('deskwise')

      const invoice = await db.collection('invoices').findOne({
        _id: new ObjectId(invoiceId),
        orgId,
      }) as unknown as Invoice | null

      if (!invoice) {
        throw new Error('Invoice not found')
      }

      // Create sync log
      syncLogId = await QuickBooksIntegrationService.createSyncLog(
        orgId,
        integration._id.toString(),
        {
          entityType: 'Invoice',
          direction: 'deskwise_to_qbo',
          deskwiseEntityId: invoiceId,
          deskwiseEntityType: 'invoice',
        },
        userId
      )

      // Update log to syncing
      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'syncing',
      })

      // Get QuickBooks client
      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      // Check if customer exists in QuickBooks
      let qboCustomerId: string | null = null
      const customerRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        invoice.clientId,
        'client'
      )

      if (!customerRef) {
        // Sync customer first
        console.log('[QBO Sync] Customer not synced, syncing customer first')
        const customerResult = await this.syncCustomer(orgId, invoice.clientId, userId)

        if (!customerResult.success) {
          throw new Error(`Failed to sync customer: ${customerResult.error}`)
        }

        qboCustomerId = customerResult.qboCustomerId!
      } else {
        qboCustomerId = customerRef.quickbooksEntityId
      }

      // Transform invoice to QuickBooks format
      const qboInvoice = await this.transformInvoiceToQBO(invoice, qboCustomerId, orgId)

      // Check if invoice already synced
      const existingRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        invoiceId,
        'invoice'
      )

      let qboInvoiceId: string
      let qboInvoiceData: any

      if (existingRef) {
        // Update existing invoice
        console.log('[QBO Sync] Updating existing invoice:', existingRef.quickbooksEntityId)

        // Fetch current invoice to get SyncToken
        const currentInvoice: any = await new Promise((resolve, reject) => {
          qbo.getInvoice(existingRef.quickbooksEntityId, (err: any, inv: any) => {
            if (err) reject(err)
            else resolve(inv)
          })
        })

        // Add required fields for update
        qboInvoice.Id = existingRef.quickbooksEntityId
        qboInvoice.SyncToken = currentInvoice.SyncToken

        // Update invoice
        qboInvoiceData = await new Promise((resolve, reject) => {
          qbo.updateInvoice(qboInvoice, (err: any, inv: any) => {
            if (err) reject(err)
            else resolve(inv)
          })
        })

        qboInvoiceId = qboInvoiceData.Id
      } else {
        // Create new invoice
        console.log('[QBO Sync] Creating new invoice')

        qboInvoiceData = await new Promise((resolve, reject) => {
          qbo.createInvoice(qboInvoice, (err: any, inv: any) => {
            if (err) reject(err)
            else resolve(inv)
          })
        })

        qboInvoiceId = qboInvoiceData.Id
      }

      // Save entity reference
      await QuickBooksIntegrationService.upsertEntityReference(
        orgId,
        integration._id.toString(),
        invoiceId,
        'invoice',
        qboInvoiceId,
        'Invoice',
        qboInvoiceData.SyncToken
      )

      // Update sync log
      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        quickbooksEntityId: qboInvoiceId,
        quickbooksEntityType: 'Invoice',
        responseData: qboInvoiceData,
      })

      // Update integration stats
      await client.db('deskwise').collection('quickbooks_integrations').updateOne(
        { _id: integration._id },
        {
          $inc: { totalInvoicesSynced: 1 },
          $set: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        }
      )

      console.log('[QBO Sync] Invoice synced successfully:', qboInvoiceId)
      return { success: true, qboInvoiceId }
    } catch (error: any) {
      console.error('[QBO Sync] Error syncing invoice:', error)

      if (syncLogId) {
        await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { stack: error.stack },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Transform Deskwise Invoice to QuickBooks Invoice format
   */
  private static async transformInvoiceToQBO(
    invoice: Invoice,
    qboCustomerId: string,
    orgId: string
  ): Promise<any> {
    const lineItems = await Promise.all(
      invoice.lineItems.map(async (item, index) => {
        // Get income account (default or from settings)
        const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
        const incomeAccountRef = integration?.defaultIncomeAccount || '1' // Default sales income

        return {
          DetailType: 'SalesItemLineDetail',
          Amount: item.total,
          Description: item.description || item.name,
          SalesItemLineDetail: {
            Qty: item.quantity,
            UnitPrice: item.unitPrice,
            ItemRef: {
              value: '1', // Use "Services" default item or sync products first
              name: item.name,
            },
            TaxCodeRef: item.taxable ? { value: 'TAX' } : { value: 'NON' },
          },
          LineNum: index + 1,
        }
      })
    )

    return {
      CustomerRef: {
        value: qboCustomerId,
      },
      Line: lineItems,
      TxnDate: invoice.invoiceDate.toISOString().split('T')[0],
      DueDate: invoice.dueDate.toISOString().split('T')[0],
      DocNumber: invoice.invoiceNumber,
      PrivateNote: `Synced from Deskwise - Invoice ${invoice.invoiceNumber}`,
      CustomerMemo: {
        value: invoice.notes || '',
      },
      BillAddr: {
        Line1: invoice.billingAddress.street,
        City: invoice.billingAddress.city,
        CountrySubDivisionCode: invoice.billingAddress.state,
        PostalCode: invoice.billingAddress.postalCode,
        Country: invoice.billingAddress.country,
      },
      TxnTaxDetail: {
        TotalTax: invoice.taxAmount,
      },
    }
  }

  /**
   * Sync Quote to QuickBooks as Estimate
   */
  static async syncEstimate(
    orgId: string,
    quoteId: string,
    userId: string
  ): Promise<{ success: boolean; qboEstimateId?: string; error?: string }> {
    let syncLogId: string | null = null

    try {
      console.log('[QBO Sync] Starting estimate sync:', quoteId)

      const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
      if (!integration) {
        throw new Error('QuickBooks integration not found')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      const quote = await db.collection('quotes').findOne({
        _id: new ObjectId(quoteId),
        orgId,
      }) as unknown as Quote | null

      if (!quote) {
        throw new Error('Quote not found')
      }

      syncLogId = await QuickBooksIntegrationService.createSyncLog(
        orgId,
        integration._id.toString(),
        {
          entityType: 'Estimate',
          direction: 'deskwise_to_qbo',
          deskwiseEntityId: quoteId,
          deskwiseEntityType: 'quote',
        },
        userId
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'syncing',
      })

      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      // Get or sync customer
      let qboCustomerId: string | null = null
      const customerRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        quote.clientId,
        'client'
      )

      if (!customerRef) {
        const customerResult = await this.syncCustomer(orgId, quote.clientId, userId)
        if (!customerResult.success) {
          throw new Error(`Failed to sync customer: ${customerResult.error}`)
        }
        qboCustomerId = customerResult.qboCustomerId!
      } else {
        qboCustomerId = customerRef.quickbooksEntityId
      }

      // Transform quote to estimate
      const qboEstimate = await this.transformQuoteToQBO(quote, qboCustomerId, orgId)

      const existingRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        quoteId,
        'quote'
      )

      let qboEstimateId: string
      let qboEstimateData: any

      if (existingRef) {
        const currentEstimate: any = await new Promise((resolve, reject) => {
          qbo.getEstimate(existingRef.quickbooksEntityId, (err: any, est: any) => {
            if (err) reject(err)
            else resolve(est)
          })
        })

        qboEstimate.Id = existingRef.quickbooksEntityId
        qboEstimate.SyncToken = currentEstimate.SyncToken

        qboEstimateData = await new Promise((resolve, reject) => {
          qbo.updateEstimate(qboEstimate, (err: any, est: any) => {
            if (err) reject(err)
            else resolve(est)
          })
        })

        qboEstimateId = qboEstimateData.Id
      } else {
        qboEstimateData = await new Promise((resolve, reject) => {
          qbo.createEstimate(qboEstimate, (err: any, est: any) => {
            if (err) reject(err)
            else resolve(est)
          })
        })

        qboEstimateId = qboEstimateData.Id
      }

      await QuickBooksIntegrationService.upsertEntityReference(
        orgId,
        integration._id.toString(),
        quoteId,
        'quote',
        qboEstimateId,
        'Estimate',
        qboEstimateData.SyncToken
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        quickbooksEntityId: qboEstimateId,
        quickbooksEntityType: 'Estimate',
        responseData: qboEstimateData,
      })

      console.log('[QBO Sync] Estimate synced successfully:', qboEstimateId)
      return { success: true, qboEstimateId }
    } catch (error: any) {
      console.error('[QBO Sync] Error syncing estimate:', error)

      if (syncLogId) {
        await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { stack: error.stack },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Transform Quote to QuickBooks Estimate
   */
  private static async transformQuoteToQBO(
    quote: Quote,
    qboCustomerId: string,
    orgId: string
  ): Promise<any> {
    const lineItems = quote.lineItems.map((item, index) => ({
      DetailType: 'SalesItemLineDetail',
      Amount: item.total,
      Description: item.description,
      SalesItemLineDetail: {
        Qty: item.quantity,
        UnitPrice: item.rate,
        ItemRef: {
          value: '1',
          name: item.description,
        },
      },
      LineNum: index + 1,
    }))

    return {
      CustomerRef: {
        value: qboCustomerId,
      },
      Line: lineItems,
      TxnDate: new Date().toISOString().split('T')[0],
      ExpirationDate: quote.validUntil.toISOString().split('T')[0],
      DocNumber: quote.quoteNumber,
      PrivateNote: `Synced from Deskwise - Quote ${quote.quoteNumber}`,
      CustomerMemo: {
        value: quote.notes || '',
      },
    }
  }

  /**
   * Sync Customer to QuickBooks
   */
  static async syncCustomer(
    orgId: string,
    clientId: string,
    userId: string
  ): Promise<{ success: boolean; qboCustomerId?: string; error?: string }> {
    let syncLogId: string | null = null

    try {
      console.log('[QBO Sync] Starting customer sync:', clientId)

      const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
      if (!integration) {
        throw new Error('QuickBooks integration not found')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      const deskwiseClient = await db.collection('clients').findOne({
        _id: new ObjectId(clientId),
        orgId,
      }) as unknown as Client | null

      if (!deskwiseClient) {
        throw new Error('Client not found')
      }

      syncLogId = await QuickBooksIntegrationService.createSyncLog(
        orgId,
        integration._id.toString(),
        {
          entityType: 'Customer',
          direction: 'deskwise_to_qbo',
          deskwiseEntityId: clientId,
          deskwiseEntityType: 'client',
        },
        userId
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'syncing',
      })

      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      // Transform client to customer
      const qboCustomer = this.transformClientToQBO(deskwiseClient)

      const existingRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        clientId,
        'client'
      )

      let qboCustomerId: string
      let qboCustomerData: any

      if (existingRef) {
        const currentCustomer: any = await new Promise((resolve, reject) => {
          qbo.getCustomer(existingRef.quickbooksEntityId, (err: any, cust: any) => {
            if (err) reject(err)
            else resolve(cust)
          })
        })

        qboCustomer.Id = existingRef.quickbooksEntityId
        qboCustomer.SyncToken = currentCustomer.SyncToken

        qboCustomerData = await new Promise((resolve, reject) => {
          qbo.updateCustomer(qboCustomer, (err: any, cust: any) => {
            if (err) reject(err)
            else resolve(cust)
          })
        })

        qboCustomerId = qboCustomerData.Id
      } else {
        qboCustomerData = await new Promise((resolve, reject) => {
          qbo.createCustomer(qboCustomer, (err: any, cust: any) => {
            if (err) reject(err)
            else resolve(cust)
          })
        })

        qboCustomerId = qboCustomerData.Id
      }

      await QuickBooksIntegrationService.upsertEntityReference(
        orgId,
        integration._id.toString(),
        clientId,
        'client',
        qboCustomerId,
        'Customer',
        qboCustomerData.SyncToken
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        quickbooksEntityId: qboCustomerId,
        quickbooksEntityType: 'Customer',
        responseData: qboCustomerData,
      })

      await client.db('deskwise').collection('quickbooks_integrations').updateOne(
        { _id: integration._id },
        {
          $inc: { totalCustomersSynced: 1 },
          $set: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        }
      )

      console.log('[QBO Sync] Customer synced successfully:', qboCustomerId)
      return { success: true, qboCustomerId }
    } catch (error: any) {
      console.error('[QBO Sync] Error syncing customer:', error)

      if (syncLogId) {
        await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { stack: error.stack },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Transform Client to QuickBooks Customer
   */
  private static transformClientToQBO(client: Client): any {
    return {
      DisplayName: client.name,
      CompanyName: client.name,
      PrimaryEmailAddr: {
        Address: client.primaryContact.email,
      },
      PrimaryPhone: client.primaryContact.phone
        ? {
            FreeFormNumber: client.primaryContact.phone,
          }
        : undefined,
      BillAddr: client.address
        ? {
            Line1: client.address.street,
            City: client.address.city,
            CountrySubDivisionCode: client.address.state,
            PostalCode: client.address.zip,
            Country: client.address.country,
          }
        : undefined,
      Notes: client.notes,
      Active: client.status === 'active',
    }
  }

  /**
   * Sync Product/Service to QuickBooks as Item
   */
  static async syncItem(
    orgId: string,
    productId: string,
    userId: string
  ): Promise<{ success: boolean; qboItemId?: string; error?: string }> {
    let syncLogId: string | null = null

    try {
      console.log('[QBO Sync] Starting item sync:', productId)

      const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
      if (!integration) {
        throw new Error('QuickBooks integration not found')
      }

      const client = await clientPromise
      const db = client.db('deskwise')

      const product = await db.collection('products').findOne({
        _id: new ObjectId(productId),
        orgId,
      }) as unknown as Product | null

      if (!product) {
        throw new Error('Product not found')
      }

      syncLogId = await QuickBooksIntegrationService.createSyncLog(
        orgId,
        integration._id.toString(),
        {
          entityType: 'Item',
          direction: 'deskwise_to_qbo',
          deskwiseEntityId: productId,
          deskwiseEntityType: 'product',
        },
        userId
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'syncing',
      })

      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      // Transform product to item
      const qboItem = this.transformProductToQBO(product, integration.defaultIncomeAccount)

      const existingRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        productId,
        'product'
      )

      let qboItemId: string
      let qboItemData: any

      if (existingRef) {
        const currentItem: any = await new Promise((resolve, reject) => {
          qbo.getItem(existingRef.quickbooksEntityId, (err: any, item: any) => {
            if (err) reject(err)
            else resolve(item)
          })
        })

        qboItem.Id = existingRef.quickbooksEntityId
        qboItem.SyncToken = currentItem.SyncToken

        qboItemData = await new Promise((resolve, reject) => {
          qbo.updateItem(qboItem, (err: any, item: any) => {
            if (err) reject(err)
            else resolve(item)
          })
        })

        qboItemId = qboItemData.Id
      } else {
        qboItemData = await new Promise((resolve, reject) => {
          qbo.createItem(qboItem, (err: any, item: any) => {
            if (err) reject(err)
            else resolve(item)
          })
        })

        qboItemId = qboItemData.Id
      }

      await QuickBooksIntegrationService.upsertEntityReference(
        orgId,
        integration._id.toString(),
        productId,
        'product',
        qboItemId,
        'Item',
        qboItemData.SyncToken
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        quickbooksEntityId: qboItemId,
        quickbooksEntityType: 'Item',
        responseData: qboItemData,
      })

      await client.db('deskwise').collection('quickbooks_integrations').updateOne(
        { _id: integration._id },
        {
          $inc: { totalProductsSynced: 1 },
          $set: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        }
      )

      console.log('[QBO Sync] Item synced successfully:', qboItemId)
      return { success: true, qboItemId }
    } catch (error: any) {
      console.error('[QBO Sync] Error syncing item:', error)

      if (syncLogId) {
        await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { stack: error.stack },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Transform Product to QuickBooks Item
   */
  private static transformProductToQBO(product: Product, incomeAccountRef?: string): any {
    return {
      Name: product.name,
      Description: product.description,
      Type: product.type === 'recurring' ? 'Service' : 'NonInventory',
      UnitPrice: product.unitPrice,
      IncomeAccountRef: {
        value: incomeAccountRef || '1', // Default income account
      },
      ExpenseAccountRef: product.cost
        ? {
            value: '80', // Default COGS account
          }
        : undefined,
      PurchaseCost: product.cost,
      Taxable: product.isTaxable,
      Active: product.isActive,
      TrackQtyOnHand: product.stockQuantity !== undefined,
      QtyOnHand: product.stockQuantity,
    }
  }

  /**
   * Record payment in QuickBooks
   */
  static async syncPayment(
    orgId: string,
    invoiceId: string,
    payment: Payment,
    userId: string
  ): Promise<{ success: boolean; qboPaymentId?: string; error?: string }> {
    let syncLogId: string | null = null

    try {
      console.log('[QBO Sync] Starting payment sync for invoice:', invoiceId)

      const integration = await QuickBooksIntegrationService.getIntegrationStatus(orgId)
      if (!integration) {
        throw new Error('QuickBooks integration not found')
      }

      // Get invoice reference
      const invoiceRef = await QuickBooksIntegrationService.getEntityReference(
        orgId,
        invoiceId,
        'invoice'
      )

      if (!invoiceRef) {
        throw new Error('Invoice not synced to QuickBooks')
      }

      syncLogId = await QuickBooksIntegrationService.createSyncLog(
        orgId,
        integration._id.toString(),
        {
          entityType: 'Payment',
          direction: 'deskwise_to_qbo',
          deskwiseEntityId: payment.id,
          deskwiseEntityType: 'payment',
        },
        userId
      )

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'syncing',
      })

      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      // Get invoice to get customer reference
      const qboInvoice: any = await new Promise((resolve, reject) => {
        qbo.getInvoice(invoiceRef.quickbooksEntityId, (err: any, inv: any) => {
          if (err) reject(err)
          else resolve(inv)
        })
      })

      // Create payment
      const qboPayment = {
        CustomerRef: qboInvoice.CustomerRef,
        TotalAmt: payment.amount,
        Line: [
          {
            Amount: payment.amount,
            LinkedTxn: [
              {
                TxnId: invoiceRef.quickbooksEntityId,
                TxnType: 'Invoice',
              },
            ],
          },
        ],
        PrivateNote: payment.notes || 'Payment synced from Deskwise',
        TxnDate: payment.paidAt.toISOString().split('T')[0],
      }

      const qboPaymentData: any = await new Promise((resolve, reject) => {
        qbo.createPayment(qboPayment, (err: any, pmt: any) => {
          if (err) reject(err)
          else resolve(pmt)
        })
      })

      await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
        status: 'completed',
        completedAt: new Date(),
        quickbooksEntityId: qboPaymentData.Id,
        quickbooksEntityType: 'Payment',
        responseData: qboPaymentData,
      })

      const client = await clientPromise
      await client.db('deskwise').collection('quickbooks_integrations').updateOne(
        { _id: integration._id },
        {
          $inc: { totalPaymentsSynced: 1 },
          $set: {
            lastSyncAt: new Date(),
            lastSyncStatus: 'success',
          },
        }
      )

      console.log('[QBO Sync] Payment synced successfully:', qboPaymentData.Id)
      return { success: true, qboPaymentId: qboPaymentData.Id }
    } catch (error: any) {
      console.error('[QBO Sync] Error syncing payment:', error)

      if (syncLogId) {
        await QuickBooksIntegrationService.updateSyncLog(syncLogId, {
          status: 'failed',
          completedAt: new Date(),
          errorMessage: error.message,
          errorDetails: { stack: error.stack },
        })
      }

      return { success: false, error: error.message }
    }
  }

  /**
   * Fetch tax rates from QuickBooks
   */
  static async fetchTaxRates(orgId: string): Promise<any[]> {
    try {
      const qbo = await QuickBooksIntegrationService.getQuickBooksClient(orgId)

      const taxRates: any = await new Promise((resolve, reject) => {
        qbo.findTaxRates((err: any, rates: any) => {
          if (err) reject(err)
          else resolve(rates)
        })
      })

      return taxRates.QueryResponse?.TaxRate || []
    } catch (error: any) {
      console.error('[QBO Sync] Error fetching tax rates:', error)
      throw new Error(`Failed to fetch tax rates: ${error.message}`)
    }
  }
}

export default QuickBooksSyncService
