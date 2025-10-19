import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  companyInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: '#16a34a',
    marginVertical: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 10,
    color: '#000',
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 10,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colPrice: {
    flex: 1.5,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1.5,
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#16a34a',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  paymentSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#16a34a',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 9,
    color: '#15803d',
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#15803d',
  },
  termsSection: {
    marginTop: 30,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#4b5563',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#9ca3af',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusDraft: {
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  statusSent: {
    backgroundColor: '#dbeafe',
    color: '#2563eb',
  },
  statusPaid: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  statusPartial: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },
  statusOverdue: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  paymentHistorySection: {
    marginTop: 20,
  },
  paymentHistoryTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  paymentHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    backgroundColor: '#f9fafb',
    marginBottom: 4,
    borderRadius: 4,
  },
  paymentDate: {
    fontSize: 9,
    color: '#666',
  },
  paymentAmount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#16a34a',
  },
})

interface InvoicePDFProps {
  invoice: any
  client: any
  organization: any
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, client, organization }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return styles.statusDraft
      case 'sent':
        return styles.statusSent
      case 'paid':
        return styles.statusPaid
      case 'partial':
        return styles.statusPartial
      case 'overdue':
        return styles.statusOverdue
      default:
        return styles.statusDraft
    }
  }

  const isPaid = invoice.status === 'paid'
  const isPartial = invoice.status === 'partial'
  const hasPayments = invoice.payments && invoice.payments.length > 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{organization?.name || 'Your Company'}</Text>
          {organization?.email && (
            <Text style={styles.companyInfo}>{organization.email}</Text>
          )}
          {organization?.phone && (
            <Text style={styles.companyInfo}>{organization.phone}</Text>
          )}
          {organization?.address && (
            <Text style={styles.companyInfo}>{organization.address}</Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Invoice Number and Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
          <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
            <Text>{invoice.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Client and Invoice Info */}
        <View style={styles.row}>
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.value}>{client?.name || 'N/A'}</Text>
              {client?.billingAddress && (
                <Text style={styles.companyInfo}>{client.billingAddress}</Text>
              )}
              {client?.contacts?.[0] && (
                <>
                  <Text style={styles.companyInfo}>{client.contacts[0].name}</Text>
                  <Text style={styles.companyInfo}>{client.contacts[0].email}</Text>
                  {client.contacts[0].phone && (
                    <Text style={styles.companyInfo}>{client.contacts[0].phone}</Text>
                  )}
                </>
              )}
            </View>
          </View>

          <View style={styles.column}>
            <View style={styles.section}>
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Invoice Date</Text>
                <Text style={styles.value}>{formatDate(invoice.issueDate)}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Due Date</Text>
                <Text style={styles.value}>{formatDate(invoice.dueDate)}</Text>
              </View>
              {invoice.paymentTerms && (
                <View>
                  <Text style={styles.label}>Payment Terms</Text>
                  <Text style={styles.value}>NET {invoice.paymentTerms}</Text>
                </View>
              )}
              {invoice.isRecurring && (
                <View style={{ marginTop: 8 }}>
                  <Text style={styles.label}>Recurring</Text>
                  <Text style={styles.value}>{invoice.recurringFrequency || 'Monthly'}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {invoice.lineItems.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.colDescription}>
                <Text>{item.description}</Text>
                {item.details && (
                  <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                    {item.details}
                  </Text>
                )}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
          </View>
          {invoice.discountValue > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'})
              </Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(
                  invoice.discountType === 'percentage'
                    ? (invoice.subtotal * invoice.discountValue) / 100
                    : invoice.discountValue
                )}
              </Text>
            </View>
          )}
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(
                  ((invoice.subtotal - (invoice.discountType === 'percentage'
                    ? (invoice.subtotal * invoice.discountValue) / 100
                    : invoice.discountValue)) * invoice.taxRate) / 100
                )}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(invoice.total)}</Text>
          </View>
        </View>

        {/* Payment Status Section */}
        {(isPaid || isPartial) && (
          <View style={styles.paymentSection}>
            <Text style={styles.paymentTitle}>Payment Status</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid</Text>
              <Text style={styles.paymentValue}>{formatCurrency(invoice.amountPaid || 0)}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Due</Text>
              <Text style={styles.paymentValue}>{formatCurrency(invoice.amountDue || 0)}</Text>
            </View>
            {isPaid && invoice.paidAt && (
              <View style={styles.paymentRow}>
                <Text style={styles.paymentLabel}>Paid On</Text>
                <Text style={styles.paymentValue}>{formatDate(invoice.paidAt)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Payment History */}
        {hasPayments && (
          <View style={styles.paymentHistorySection}>
            <Text style={styles.paymentHistoryTitle}>Payment History</Text>
            {invoice.payments.map((payment: any, index: number) => (
              <View key={index} style={styles.paymentHistoryItem}>
                <View>
                  <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
                    {payment.paymentMethod || 'Payment'}
                  </Text>
                  <Text style={styles.paymentDate}>
                    {formatDate(payment.paymentDate)}
                  </Text>
                  {payment.reference && (
                    <Text style={styles.paymentDate}>Ref: {payment.reference}</Text>
                  )}
                </View>
                <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Terms and Conditions */}
        {invoice.termsAndConditions && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions</Text>
            <Text style={styles.termsText}>{invoice.termsAndConditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {isPaid
              ? `This invoice was paid in full on ${formatDate(invoice.paidAt || invoice.updatedAt)}.`
              : `Payment is due by ${formatDate(invoice.dueDate)}. All prices are in ${invoice.currency || 'USD'}.`
            }
          </Text>
          <Text style={{ marginTop: 4 }}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  )
}
