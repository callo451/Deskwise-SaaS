import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register fonts if needed (optional)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxP.ttf',
// })

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
    borderBottomColor: '#2563eb',
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
  quoteNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
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
    borderTopColor: '#2563eb',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2563eb',
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
  statusAccepted: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
})

interface QuotePDFProps {
  quote: any
  client: any
  organization: any
}

export const QuotePDF: React.FC<QuotePDFProps> = ({ quote, client, organization }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: quote.currency || 'USD',
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
      case 'viewed':
        return styles.statusSent
      case 'accepted':
        return styles.statusAccepted
      default:
        return styles.statusDraft
    }
  }

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

        {/* Quote Number and Status */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={styles.quoteNumber}>Quote #{quote.quoteNumber}</Text>
          <View style={[styles.statusBadge, getStatusStyle(quote.status)]}>
            <Text>{quote.status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Client and Quote Info */}
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
                <Text style={styles.label}>Quote Date</Text>
                <Text style={styles.value}>{formatDate(quote.createdAt)}</Text>
              </View>
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.label}>Valid Until</Text>
                <Text style={styles.value}>{formatDate(quote.validUntil)}</Text>
              </View>
              {quote.title && (
                <View>
                  <Text style={styles.label}>Subject</Text>
                  <Text style={styles.value}>{quote.title}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        {quote.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.termsText}>{quote.description}</Text>
          </View>
        )}

        {/* Line Items Table */}
        <View style={styles.table}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>
          {quote.lineItems.map((item: any, index: number) => (
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
            <Text style={styles.totalValue}>{formatCurrency(quote.subtotal)}</Text>
          </View>
          {quote.discountValue > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Discount ({quote.discountType === 'percentage' ? `${quote.discountValue}%` : 'Fixed'})
              </Text>
              <Text style={styles.totalValue}>
                -{formatCurrency(
                  quote.discountType === 'percentage'
                    ? (quote.subtotal * quote.discountValue) / 100
                    : quote.discountValue
                )}
              </Text>
            </View>
          )}
          {quote.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({quote.taxRate}%)</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(
                  ((quote.subtotal - (quote.discountType === 'percentage'
                    ? (quote.subtotal * quote.discountValue) / 100
                    : quote.discountValue)) * quote.taxRate) / 100
                )}
              </Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(quote.total)}</Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        {quote.termsAndConditions && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions</Text>
            <Text style={styles.termsText}>{quote.termsAndConditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            This quote is valid until {formatDate(quote.validUntil)}. All prices are in {quote.currency || 'USD'}.
          </Text>
          <Text style={{ marginTop: 4 }}>
            Thank you for your business!
          </Text>
        </View>
      </Page>
    </Document>
  )
}
