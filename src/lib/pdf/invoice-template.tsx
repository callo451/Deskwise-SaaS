import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { OrganizationBranding } from '@/lib/types'

interface InvoicePDFProps {
  invoice: any
  client: any
  organization: any
  branding?: OrganizationBranding
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  client,
  organization,
  branding
}) => {
  // Helper function to convert HSL to hex for PDF rendering
  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100
    const a = (s * Math.min(l, 1 - l)) / 100
    const f = (n: number) => {
      const k = (n + h / 30) % 12
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
      return Math.round(255 * color).toString(16).padStart(2, '0')
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  // Get branding colors or use defaults
  const primaryColor = branding?.colors?.primary
    ? hslToHex(branding.colors.primary.h, branding.colors.primary.s, branding.colors.primary.l)
    : '#16a34a'

  const headerColor = branding?.email?.headerColor || primaryColor

  const companyName = branding?.identity?.companyName || organization?.name || 'Your Company'
  const fontFamily = branding?.typography?.fontFamily || 'Helvetica'

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 10,
      fontFamily: fontFamily,
    },
    header: {
      marginBottom: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      alignItems: 'flex-end',
    },
    logo: {
      width: 120,
      height: 40,
      marginBottom: 10,
      objectFit: 'contain',
    },
    companyName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
      color: primaryColor,
    },
    tagline: {
      fontSize: 10,
      color: '#6b7280',
      marginBottom: 8,
    },
    companyInfo: {
      fontSize: 9,
      color: '#666',
      marginBottom: 2,
    },
    divider: {
      borderBottomWidth: 2,
      borderBottomColor: headerColor,
      marginVertical: 20,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 11,
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
      color: primaryColor,
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
      borderTopColor: primaryColor,
    },
    grandTotalLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: primaryColor,
    },
    grandTotalValue: {
      fontSize: 12,
      fontWeight: 'bold',
      color: primaryColor,
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
      color: primaryColor,
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
    paymentInstructionsSection: {
      marginTop: 20,
      padding: 12,
      backgroundColor: '#f9fafb',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: '#e5e7eb',
    },
    paymentInstructionsTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      marginBottom: 8,
      color: '#1f2937',
    },
    paymentInstructionsText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginBottom: 4,
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
      color: primaryColor,
    },
  })

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
        {/* Header with Logo and Company Info */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {branding?.logos?.primary?.light && (
              <Image src={branding.logos.primary.light} style={styles.logo} />
            )}
            {!branding?.logos?.primary?.light && (
              <Text style={styles.companyName}>{companyName}</Text>
            )}
            {branding?.identity?.tagline && (
              <Text style={styles.tagline}>{branding.identity.tagline}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
              <Text>{invoice.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* MSP and Client Information */}
        <View style={styles.row}>
          {/* MSP Information */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>From:</Text>
              <Text style={styles.value}>{companyName}</Text>
              {organization?.address && (
                <>
                  <Text style={styles.companyInfo}>{organization.address.street}</Text>
                  <Text style={styles.companyInfo}>
                    {organization.address.city}, {organization.address.state} {organization.address.postalCode}
                  </Text>
                  <Text style={styles.companyInfo}>{organization.address.country}</Text>
                </>
              )}
              {organization?.email && (
                <Text style={styles.companyInfo}>{organization.email}</Text>
              )}
              {organization?.phone && (
                <Text style={styles.companyInfo}>{organization.phone}</Text>
              )}
              {organization?.website && (
                <Text style={styles.companyInfo}>{organization.website}</Text>
              )}
              {organization?.taxId && (
                <Text style={styles.companyInfo}>
                  {organization.taxIdLabel || 'Tax ID'}: {organization.taxId}
                </Text>
              )}
              {organization?.registrationNumber && (
                <Text style={styles.companyInfo}>
                  Registration #: {organization.registrationNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Client Information */}
          <View style={styles.column}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.value}>{client?.name || 'N/A'}</Text>
              {client?.billingAddress && (
                <>
                  <Text style={styles.companyInfo}>{client.billingAddress.street}</Text>
                  <Text style={styles.companyInfo}>
                    {client.billingAddress.city}, {client.billingAddress.state} {client.billingAddress.postalCode}
                  </Text>
                  <Text style={styles.companyInfo}>{client.billingAddress.country}</Text>
                </>
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
        </View>

        {/* Invoice Details */}
        <View style={styles.row}>
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
            </View>
          </View>
          <View style={styles.column}>
            <View style={styles.section}>
              {invoice.paymentTerms && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={styles.label}>Payment Terms</Text>
                  <Text style={styles.value}>NET {invoice.paymentTerms}</Text>
                </View>
              )}
              {invoice.isRecurring && (
                <View>
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
                -{formatCurrency(invoice.discountAmount)}
              </Text>
            </View>
          )}
          {invoice.taxRate > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
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

        {/* Payment Instructions */}
        {organization?.paymentInstructions && !isPaid && (
          <View style={styles.paymentInstructionsSection}>
            <Text style={styles.paymentInstructionsTitle}>Payment Instructions</Text>

            {organization.paymentInstructions.bankName && (
              <Text style={styles.paymentInstructionsText}>
                Bank: {organization.paymentInstructions.bankName}
              </Text>
            )}

            {organization.paymentInstructions.accountName && (
              <Text style={styles.paymentInstructionsText}>
                Account Name: {organization.paymentInstructions.accountName}
              </Text>
            )}

            {organization.paymentInstructions.accountNumber && (
              <Text style={styles.paymentInstructionsText}>
                Account: ****{organization.paymentInstructions.accountNumber}
              </Text>
            )}

            {organization.paymentInstructions.routingNumber && (
              <Text style={styles.paymentInstructionsText}>
                Routing: {organization.paymentInstructions.routingNumber}
              </Text>
            )}

            {organization.paymentInstructions.swiftCode && (
              <Text style={styles.paymentInstructionsText}>
                SWIFT: {organization.paymentInstructions.swiftCode}
              </Text>
            )}

            {organization.paymentInstructions.iban && (
              <Text style={styles.paymentInstructionsText}>
                IBAN: {organization.paymentInstructions.iban}
              </Text>
            )}

            {organization.paymentInstructions.bsb && (
              <Text style={styles.paymentInstructionsText}>
                BSB: {organization.paymentInstructions.bsb}
              </Text>
            )}

            {organization.paymentInstructions.onlinePaymentUrl && (
              <Text style={styles.paymentInstructionsText}>
                Pay online: {organization.paymentInstructions.onlinePaymentUrl}
              </Text>
            )}

            {organization.paymentInstructions.additionalInstructions && (
              <Text style={styles.paymentInstructionsText}>
                {organization.paymentInstructions.additionalInstructions}
              </Text>
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
        {(invoice.termsAndConditions || organization?.invoiceDefaults?.termsAndConditions) && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Terms and Conditions</Text>
            <Text style={styles.termsText}>
              {invoice.termsAndConditions || organization.invoiceDefaults.termsAndConditions}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.termsSection}>
            <Text style={styles.termsTitle}>Notes</Text>
            <Text style={styles.termsText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {organization?.invoiceDefaults?.footerText ? (
            <Text>{organization.invoiceDefaults.footerText}</Text>
          ) : (
            <>
              <Text>
                {isPaid
                  ? `This invoice was paid in full on ${formatDate(invoice.paidAt || invoice.updatedAt)}.`
                  : `Payment is due by ${formatDate(invoice.dueDate)}. All prices are in ${invoice.currency || 'USD'}.`
                }
              </Text>
              <Text style={{ marginTop: 4 }}>
                Thank you for your business!
              </Text>
            </>
          )}
          {branding?.email?.footerText && (
            <Text style={{ marginTop: 4 }}>{branding.email.footerText}</Text>
          )}
        </View>
      </Page>
    </Document>
  )
}
