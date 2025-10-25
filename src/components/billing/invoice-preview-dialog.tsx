'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface InvoicePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any
  client: any
  organization: any
  branding: any
}

export function InvoicePreviewDialog({
  open,
  onOpenChange,
  invoice,
  client,
  organization,
  branding,
}: InvoicePreviewDialogProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice?.currency || 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const companyName = branding?.identity?.companyName || organization?.name || 'Your Company'
  const primaryColor = branding?.email?.headerColor || '#16a34a'

  if (!invoice) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg p-8 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {branding?.email?.logoUrl ? (
                <img
                  src={branding.email.logoUrl}
                  alt={companyName}
                  className="h-12 object-contain mb-2"
                />
              ) : (
                <h2 className="text-2xl font-bold" style={{ color: primaryColor }}>
                  {companyName}
                </h2>
              )}
              {branding?.identity?.tagline && (
                <p className="text-sm text-muted-foreground">{branding.identity.tagline}</p>
              )}
            </div>

            <div className="text-right">
              <h3 className="text-xl font-bold mb-2" style={{ color: primaryColor }}>
                Invoice #{invoice.invoiceNumber}
              </h3>
              <Badge variant="outline" className="text-xs">
                {invoice.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          <Separator className="my-6" style={{ borderColor: primaryColor }} />

          {/* Company and Client Info */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h4 className="font-semibold mb-2">From:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{companyName}</p>
                {organization?.address && (
                  <>
                    <p>{organization.address.street}</p>
                    <p>
                      {organization.address.city}, {organization.address.state} {organization.address.postalCode}
                    </p>
                    <p>{organization.address.country}</p>
                  </>
                )}
                {organization?.email && <p>{organization.email}</p>}
                {organization?.phone && <p>{organization.phone}</p>}
                {organization?.taxId && (
                  <p>
                    {organization.taxIdLabel || 'Tax ID'}: {organization.taxId}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Bill To:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">{client?.name || 'N/A'}</p>
                {client?.billingAddress && (
                  <>
                    <p>{client.billingAddress.street}</p>
                    <p>
                      {client.billingAddress.city}, {client.billingAddress.state}{' '}
                      {client.billingAddress.postalCode}
                    </p>
                    <p>{client.billingAddress.country}</p>
                  </>
                )}
                {client?.contacts?.[0] && (
                  <>
                    <p>{client.contacts[0].name}</p>
                    <p>{client.contacts[0].email}</p>
                    {client.contacts[0].phone && <p>{client.contacts[0].phone}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <p className="text-muted-foreground">Issue Date</p>
              <p className="font-medium">{formatDate(invoice.issueDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Terms</p>
              <p className="font-medium">NET {invoice.paymentTerms}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Items</h4>
            <div className="border rounded">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-sm">
                    <th className="text-left p-3">Description</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Unit Price</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lineItems.map((item: any, index: number) => (
                    <tr key={index} className="border-t text-sm">
                      <td className="p-3">{item.description}</td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right p-3 font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>

              {invoice.discountValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Discount ({invoice.discountType === 'percentage' ? `${invoice.discountValue}%` : 'Fixed'})
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(invoice.discountAmount)}
                  </span>
                </div>
              )}

              {invoice.taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                  <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-bold" style={{ color: primaryColor }}>
                <span>Total</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>

              {invoice.amountPaid > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount Paid</span>
                    <span className="font-medium text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Amount Due</span>
                    <span className="text-orange-600">{formatCurrency(invoice.amountDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Payment Instructions */}
          {organization?.paymentInstructions && invoice.status !== 'paid' && (
            <div className="bg-muted/30 p-4 rounded mb-6 text-sm">
              <h4 className="font-semibold mb-2">Payment Instructions</h4>
              <div className="space-y-1 text-muted-foreground">
                {organization.paymentInstructions.bankName && (
                  <p>Bank: {organization.paymentInstructions.bankName}</p>
                )}
                {organization.paymentInstructions.accountName && (
                  <p>Account Name: {organization.paymentInstructions.accountName}</p>
                )}
                {organization.paymentInstructions.accountNumber && (
                  <p>Account: ****{organization.paymentInstructions.accountNumber}</p>
                )}
                {organization.paymentInstructions.routingNumber && (
                  <p>Routing: {organization.paymentInstructions.routingNumber}</p>
                )}
                {organization.paymentInstructions.onlinePaymentUrl && (
                  <p>Pay online: {organization.paymentInstructions.onlinePaymentUrl}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground border-t pt-4">
            {organization?.invoiceDefaults?.footerText || 'Thank you for your business!'}
            {branding?.email?.footerText && (
              <p className="mt-2">{branding.email.footerText}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
