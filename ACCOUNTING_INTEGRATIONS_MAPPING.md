# Accounting Integrations Data Mapping Reference

## Table of Contents
- [Overview](#overview)
- [Invoice Mapping](#invoice-mapping)
- [Quote/Estimate Mapping](#quoteestimate-mapping)
- [Client/Customer Mapping](#clientcustomer-mapping)
- [Product/Item Mapping](#productitem-mapping)
- [Payment Mapping](#payment-mapping)
- [Tax Code Mapping](#tax-code-mapping)
- [Field-Level Mapping Details](#field-level-mapping-details)
- [Default Values and Transformations](#default-values-and-transformations)
- [Platform-Specific Considerations](#platform-specific-considerations)

---

## Overview

This document provides comprehensive field-by-field mapping specifications for how Deskwise entities map to each accounting platform (Xero, QuickBooks Online, MYOB).

### Mapping Principles

1. **Bidirectional Compatibility**: Where possible, mappings work both directions
2. **Required vs Optional**: Clearly marked fields are required by each platform
3. **Data Transformation**: Some fields require transformation (dates, currencies, enums)
4. **Default Values**: Fallback values when Deskwise field is empty
5. **Platform Differences**: Note where platforms differ significantly

### Notation

- **✓** = Supported and mapped
- **—** = Not supported by platform
- **⚠** = Supported with limitations/transformations
- **Required** = Must be provided
- **Optional** = Can be omitted

---

## Invoice Mapping

### Deskwise Invoice → Xero Invoice

| Deskwise Field | Xero Field | Type | Required | Notes |
|---|---|---|---|---|
| `invoiceNumber` | `InvoiceNumber` | String | Yes | Must be unique in Xero |
| `invoiceDate` | `Date` | Date | Yes | Format: YYYY-MM-DD |
| `dueDate` | `DueDate` | Date | Yes | Format: YYYY-MM-DD |
| `clientId` → `externalId` | `Contact.ContactID` | UUID | Yes | Client must be synced first |
| `clientName` | `Contact.Name` | String | No | Used for reference only |
| `status` | `Status` | Enum | Yes | See status mapping below |
| `lineItems[]` | `LineItems[]` | Array | Yes | At least one required |
| `lineItems[].description` | `LineItems[].Description` | String | Yes | Max 4000 chars |
| `lineItems[].quantity` | `LineItems[].Quantity` | Decimal | Yes | Must be > 0 |
| `lineItems[].rate` | `LineItems[].UnitAmount` | Decimal | Yes | Unit price |
| `lineItems[].total` | `LineItems[].LineAmount` | Decimal | Yes | quantity × rate |
| `lineItems[].category` | `LineItems[].AccountCode` | String | Yes | Via account mapping |
| `lineItems[].taxRate` | `LineItems[].TaxType` | String | Yes | Via tax mapping |
| `subtotal` | — | — | No | Calculated by Xero |
| `totalDiscount` | `TotalDiscount` | Decimal | No | If discount applied |
| `taxAmount` | `TotalTax` | Decimal | No | Calculated by Xero |
| `total` | `Total` | Decimal | No | Calculated by Xero |
| `amountDue` | `AmountDue` | Decimal | No | Calculated by Xero |
| `currency` | `CurrencyCode` | String | Yes | ISO 4217 (USD, AUD, etc.) |
| `notes` | — | — | No | Stored in Deskwise only |
| `memo` | `Reference` | String | No | Customer-visible note |
| `quoteId` | `Reference` | String | No | Prefixed "Quote: {id}" |
| `projectId` | — | — | No | Not mapped |
| `paymentTerms` (days) | `DueDate` | Calculated | Yes | invoiceDate + terms |
| `billingAddress` | — | — | No | From Contact |

**Status Mapping (Deskwise → Xero)**:
- `draft` → `DRAFT`
- `sent` → `SUBMITTED`
- `viewed` → `SUBMITTED`
- `partial` → `AUTHORISED`
- `paid` → `PAID`
- `overdue` → `AUTHORISED` (Xero auto-marks overdue)
- `cancelled` → `VOIDED`
- `refunded` → `VOIDED`

**Line Amount Type**:
- Configurable: `Exclusive` (tax added to line total) or `Inclusive` (tax included in line total)
- Set via integration config: `lineAmountTypes`

---

### Deskwise Invoice → QuickBooks Invoice

| Deskwise Field | QuickBooks Field | Type | Required | Notes |
|---|---|---|---|---|
| `invoiceNumber` | `DocNumber` | String | No | QB auto-generates if omitted |
| `invoiceDate` | `TxnDate` | Date | Yes | Format: YYYY-MM-DD |
| `dueDate` | `DueDate` | Date | Yes | Format: YYYY-MM-DD |
| `clientId` → `externalId` | `CustomerRef.value` | String | Yes | QB Customer ID |
| `clientName` | `CustomerRef.name` | String | No | Display name |
| `status` | `EmailStatus`, `Balance` | Complex | No | See status mapping |
| `lineItems[]` | `Line[]` | Array | Yes | DetailType: "SalesItemLineDetail" |
| `lineItems[].description` | `Line[].Description` | String | Yes | Max 4000 chars |
| `lineItems[].quantity` | `Line[].SalesItemLineDetail.Qty` | Decimal | Yes | Must be > 0 |
| `lineItems[].rate` | `Line[].SalesItemLineDetail.UnitPrice` | Decimal | Yes | Unit price |
| `lineItems[].total` | `Line[].Amount` | Decimal | Yes | quantity × rate |
| `lineItems[].product` → `externalId` | `Line[].SalesItemLineDetail.ItemRef.value` | String | Yes | QB Item ID |
| `lineItems[].taxRate` | `Line[].SalesItemLineDetail.TaxCodeRef.value` | String | No | QB Tax Code |
| `subtotal` | `TxnTaxDetail.TotalTax` | Calculated | No | Calculated by QB |
| `taxAmount` | `TxnTaxDetail.TotalTax` | Decimal | No | Calculated by QB |
| `total` | `TotalAmt` | Decimal | Yes | Grand total |
| `amountDue` | `Balance` | Decimal | No | Calculated by QB |
| `amountPaid` | — | Calculated | No | total - balance |
| `currency` | `CurrencyRef.value` | String | No | Requires multi-currency enabled |
| `memo` | `CustomerMemo.value` | String | No | Customer-visible |
| `notes` | `PrivateNote` | String | No | Internal note |
| `billingAddress` | `BillAddr` | Object | No | See address mapping |
| `paymentTerms` | `SalesTermRef.value` | String | No | Via terms mapping |

**Status Mapping (Deskwise → QuickBooks)**:
- QuickBooks doesn't have explicit draft/sent status
- Status inferred from:
  - `EmailStatus`: "NotSet", "NeedToSend", "EmailSent"
  - `Balance`: If 0, considered paid

**Tax Handling**:
- **Automated Sales Tax**: If enabled in QB, tax calculated automatically
- **Manual Tax**: Use `TxnTaxDetail.TxnTaxCodeRef` for manual tax codes

---

### Deskwise Invoice → MYOB Invoice

| Deskwise Field | MYOB Field | Type | Required | Notes |
|---|---|---|---|---|
| `invoiceNumber` | `Number` | String | Yes | Must be unique |
| `invoiceDate` | `Date` | Date | Yes | Format: YYYY-MM-DD |
| `dueDate` | `ShipDate` | Date | No | MYOB uses terms instead |
| `clientId` → `externalId` | `Customer.UID` | GUID | Yes | MYOB Customer UID |
| `clientName` | `Customer.Name` | String | No | Display name |
| `status` | `Status` | Enum | Yes | See status mapping |
| `lineItems[]` | `Lines[]` | Array | Yes | Type: "Transaction" |
| `lineItems[].description` | `Lines[].Description` | String | Yes | Max 255 chars ⚠ |
| `lineItems[].quantity` | `Lines[].ShipQuantity` | Decimal | Yes | Must be > 0 |
| `lineItems[].rate` | `Lines[].UnitPrice` | Decimal | Yes | Unit price |
| `lineItems[].total` | `Lines[].Total` | Decimal | Yes | quantity × rate |
| `lineItems[].category` | `Lines[].Account.UID` | GUID | Yes | MYOB Account UID |
| `lineItems[].taxRate` | `Lines[].TaxCode.UID` | GUID | Yes | MYOB Tax Code UID |
| `lineItems[].product` → `externalId` | `Lines[].Item.UID` | GUID | No | If inventory item |
| `subtotal` | `Subtotal` | Decimal | No | Calculated by MYOB |
| `totalDiscount` | `TotalDiscount` | Decimal | No | Sum of line discounts |
| `taxAmount` | `TotalTax` | Decimal | No | Calculated by MYOB |
| `total` | `TotalAmount` | Decimal | Yes | Grand total |
| `amountDue` | `BalanceDueAmount` | Decimal | No | Calculated by MYOB |
| `currency` | `ForeignCurrency.Code` | String | No | Requires multi-currency |
| `memo` | `Comment` | String | No | Customer-visible |
| `notes` | `JournalMemo` | String | No | Internal note |
| `billingAddress` | `Customer.Addresses[]` | Object | No | From Customer |
| `paymentTerms` | `Terms.PaymentIsDue`, `Terms.BalanceDueDate` | Complex | No | Days or date |

**Status Mapping (Deskwise → MYOB)**:
- `draft` → `Quote` (MYOB doesn't have draft invoices)
- `sent` → `Open`
- `paid` → `Closed`
- `cancelled` → `Deleted` (soft delete)

**Character Limits** ⚠:
- MYOB has stricter limits than Xero/QB
- Description: 255 chars (vs 4000 in others)
- Truncate if necessary

---

## Quote/Estimate Mapping

### Deskwise Quote → Xero Quote

| Deskwise Field | Xero Field | Type | Required | Notes |
|---|---|---|---|---|
| `quoteNumber` | `QuoteNumber` | String | Yes | Unique quote number |
| `title` | `Title` | String | Yes | Quote title |
| `description` | `Summary` | String | No | Quote description |
| `validUntil` | `ExpiryDate` | Date | Yes | Quote expiry |
| `clientId` → `externalId` | `Contact.ContactID` | UUID | Yes | Xero Contact |
| `status` | `Status` | Enum | Yes | DRAFT, SENT, ACCEPTED, DECLINED |
| `lineItems[]` | `LineItems[]` | Array | Yes | Same as invoice |
| `total` | `Total` | Decimal | No | Calculated by Xero |
| `acceptedAt` | `DateString` (custom) | Date | No | Custom field |

**Status Mapping (Deskwise → Xero)**:
- `draft` → `DRAFT`
- `sent` → `SENT`
- `accepted` → `ACCEPTED`
- `rejected` → `DECLINED`

**Converting to Invoice**:
When converting accepted quote to invoice:
1. Xero Quote ID stored in invoice `Reference` field
2. Line items copied directly
3. Quote status set to "INVOICED" (custom)

---

### Deskwise Quote → QuickBooks Estimate

| Deskwise Field | QuickBooks Field | Type | Required | Notes |
|---|---|---|---|---|
| `quoteNumber` | `DocNumber` | String | No | QB auto-generates |
| `title` | — | — | No | Not supported |
| `description` | `CustomerMemo.value` | String | No | Visible to customer |
| `validUntil` | `ExpirationDate` | Date | No | Estimate expiry |
| `clientId` → `externalId` | `CustomerRef.value` | String | Yes | QB Customer ID |
| `status` | `EmailStatus`, `TxnStatus` | Complex | No | See status mapping |
| `lineItems[]` | `Line[]` | Array | Yes | Same as invoice |
| `total` | `TotalAmt` | Decimal | No | Calculated by QB |
| `acceptedAt` | `MetaData.CreateTime` | Date | No | When created |

**Status Mapping**:
- QuickBooks Estimates have simpler status: "Pending", "Accepted", "Closed", "Rejected"
- Deskwise `status` maps to `TxnStatus`

**Converting to Invoice**:
1. Create invoice with `LinkedTxn` referencing Estimate
2. QB links estimate to invoice
3. Estimate marked as "Closed"

---

### Deskwise Quote → MYOB Quote

| Deskwise Field | MYOB Field | Type | Required | Notes |
|---|---|---|---|---|
| `quoteNumber` | `Number` | String | Yes | Unique quote number |
| `title` | — | — | No | Not supported |
| `description` | `Comment` | String | No | Customer-visible |
| `validUntil` | `PromisedDate` | Date | No | Closest equivalent |
| `clientId` → `externalId` | `Customer.UID` | GUID | Yes | MYOB Customer |
| `status` | `Status` | Enum | Yes | Quote, ConvertedToSale |
| `lineItems[]` | `Lines[]` | Array | Yes | Same as invoice |
| `total` | `TotalAmount` | Decimal | No | Calculated by MYOB |

**Status Mapping**:
- MYOB Quotes: "Quote", "Order", "ConvertedToSale"
- Deskwise `accepted` → "ConvertedToSale"

---

## Client/Customer Mapping

### Deskwise Client → Xero Contact

| Deskwise Field | Xero Field | Type | Required | Notes |
|---|---|---|---|---|
| `name` | `Name` | String | Yes | Company/contact name |
| `primaryContact.name` | `FirstName` + `LastName` | String | No | Split name |
| `primaryContact.email` | `EmailAddress` | String | Yes | Primary email |
| `primaryContact.phone` | `Phones[].PhoneNumber` | String | No | Type: "DEFAULT" |
| `address.street` | `Addresses[].AddressLine1` | String | No | Type: "POBOX" |
| `address.city` | `Addresses[].City` | String | No | — |
| `address.state` | `Addresses[].Region` | String | No | — |
| `address.zip` | `Addresses[].PostalCode` | String | No | — |
| `address.country` | `Addresses[].Country` | String | No | — |
| `domain` | `Website` | String | No | — |
| `industry` | — | — | No | Not supported |
| `status` | `ContactStatus` | Enum | No | ACTIVE, ARCHIVED |
| `notes` | — | — | No | Not supported |
| `contractStartDate` | — | — | No | Not supported |
| `contractEndDate` | — | — | No | Not supported |

**Contact Status**:
- `active` → `ACTIVE`
- `inactive` → `ARCHIVED`
- `onboarding` → `ACTIVE`

---

### Deskwise Client → QuickBooks Customer

| Deskwise Field | QuickBooks Field | Type | Required | Notes |
|---|---|---|---|---|
| `name` | `DisplayName` | String | Yes | Display name |
| `name` | `CompanyName` | String | No | Company name |
| `primaryContact.name` | `GivenName` + `FamilyName` | String | No | Split name |
| `primaryContact.email` | `PrimaryEmailAddr.Address` | String | No | Primary email |
| `primaryContact.phone` | `PrimaryPhone.FreeFormNumber` | String | No | Primary phone |
| `address.street` | `BillAddr.Line1` | String | No | Billing address |
| `address.city` | `BillAddr.City` | String | No | — |
| `address.state` | `BillAddr.CountrySubDivisionCode` | String | No | 2-letter code |
| `address.zip` | `BillAddr.PostalCode` | String | No | — |
| `address.country` | `BillAddr.Country` | String | No | — |
| `domain` | `WebAddr.URI` | String | No | Website |
| `industry` | — | — | No | Not supported |
| `status` | `Active` | Boolean | No | true/false |
| `notes` | `Notes` | String | No | Internal notes |
| `contractStartDate` | — | — | No | Not supported |
| `paymentTerms` | `SalesTermRef.value` | String | No | Via terms mapping |

**Active Status**:
- `active` → `true`
- `inactive` → `false`
- `onboarding` → `true`

---

### Deskwise Client → MYOB Customer

| Deskwise Field | MYOB Field | Type | Required | Notes |
|---|---|---|---|---|
| `name` | `CompanyName` | String | Yes | Company name |
| `primaryContact.name` | `FirstName` + `LastName` | String | No | Contact person |
| `primaryContact.email` | `Email` | String | No | Email |
| `primaryContact.phone` | `Phone` | String | No | Phone |
| `address.street` | `Addresses[].Street` | String | No | Location: "Business" |
| `address.city` | `Addresses[].City` | String | No | — |
| `address.state` | `Addresses[].State` | String | No | — |
| `address.zip` | `Addresses[].PostCode` | String | No | — |
| `address.country` | `Addresses[].Country` | String | No | — |
| `domain` | `Website` | String | No | — |
| `status` | `IsActive` | Boolean | No | true/false |
| `notes` | `Notes` | String | No | Internal notes |
| `paymentTerms` | `Terms.PaymentIsDue` | Enum | No | InAGivenNumberOfDays |

**Tax Registration**:
- MYOB requires `IdentificationNumber` for businesses (ABN in Australia)
- Map from Deskwise custom field if available

---

## Product/Item Mapping

### Deskwise Product → Xero Item

| Deskwise Field | Xero Field | Type | Required | Notes |
|---|---|---|---|---|
| `sku` | `Code` | String | Yes | Item code |
| `name` | `Name` | String | Yes | Item name |
| `description` | `Description` | String | No | Item description |
| `unitPrice` | `SalesDetails.UnitPrice` | Decimal | Yes | Selling price |
| `cost` | `PurchaseDetails.UnitPrice` | Decimal | No | Cost price |
| `category` | `SalesDetails.AccountCode` | String | Yes | Via account mapping |
| `taxCategory` → tax code | `SalesDetails.TaxType` | String | Yes | Via tax mapping |
| `isTaxable` | `SalesDetails.TaxType` | Calculated | Yes | If taxable, use GST code |
| `isActive` | `IsTrackedAsInventory` | Boolean | No | false for services |
| `inStock` | `QuantityOnHand` | Decimal | No | If tracked inventory |
| `stockQuantity` | `QuantityOnHand` | Decimal | No | Current stock |

**Item vs Service**:
- Services: `IsTrackedAsInventory: false`, `IsSold: true`, `IsPurchased: false`
- Inventory: `IsTrackedAsInventory: true`, `IsSold: true`

---

### Deskwise Product → QuickBooks Item

| Deskwise Field | QuickBooks Field | Type | Required | Notes |
|---|---|---|---|---|
| `sku` | `Sku` | String | No | SKU code |
| `name` | `Name` | String | Yes | Item name |
| `description` | `Description` | String | No | Item description |
| `unitPrice` | `UnitPrice` | Decimal | No | Selling price |
| `cost` | `PurchaseCost` | Decimal | No | Cost price |
| `category` | `IncomeAccountRef.value` | String | Yes | QB Account ID |
| `taxCategory` → tax code | `SalesTaxCodeRef.value` | String | No | QB Tax Code |
| `isTaxable` | `Taxable` | Boolean | No | true/false |
| `type` | `Type` | Enum | Yes | Service, Inventory, NonInventory |
| `isActive` | `Active` | Boolean | No | true/false |
| `inStock` | `QtyOnHand` | Decimal | No | For inventory items |
| `stockQuantity` | `QtyOnHand` | Decimal | No | Current stock |

**Item Types**:
- One-time services → `Service`
- Recurring services → `Service`
- Hardware with stock tracking → `Inventory`
- Software licenses → `NonInventory` or `Service`

---

### Deskwise Product → MYOB Item

| Deskwise Field | MYOB Field | Type | Required | Notes |
|---|---|---|---|---|
| `sku` | `Number` | String | Yes | Item number |
| `name` | `Name` | String | Yes | Item name |
| `description` | `Description` | String | No | Item description |
| `unitPrice` | `SellingDetails.UnitPrice` | Decimal | Yes | Selling price |
| `cost` | `BuyingDetails.UnitPrice` | Decimal | No | Cost price |
| `category` | `IncomeAccount.UID` | GUID | Yes | MYOB Account UID |
| `taxCategory` → tax code | `SellingDetails.TaxCode.UID` | GUID | Yes | MYOB Tax Code |
| `isTaxable` | `IsTaxInclusive` | Boolean | No | true/false |
| `type` | — | Inferred | No | Service vs Inventory |
| `isActive` | `IsActive` | Boolean | No | true/false |
| `inStock` | `QuantityOnHand` | Decimal | No | For inventory items |

**Item Type Detection**:
- MYOB infers type from whether `UseDescription` is set
- Services typically have `UseDescription: true`

---

## Payment Mapping

Payments sync **from accounting platform to Deskwise** (one-way).

### Xero Payment → Deskwise Payment

| Xero Field | Deskwise Field | Type | Notes |
|---|---|---|---|
| `PaymentID` | `integration.externalId` | UUID | Unique payment ID |
| `Invoice.InvoiceID` | Match to invoice `externalId` | UUID | Links to invoice |
| `Amount` | `amount` | Decimal | Payment amount |
| `CurrencyCode` | `currency` | String | ISO 4217 |
| `Date` | `paidAt` | Date | Payment date |
| `PaymentType` | `method` | Enum | See method mapping |
| `Reference` | `transactionId` | String | External reference |
| `BankAccount.Code` | — | String | Not stored |

**Payment Method Mapping (Xero → Deskwise)**:
- `ACCRECPAYMENT` → `bank_transfer`
- `ARCREDITPAYMENT` → `credit_card`
- `APCREDITPAYMENT` → `other`

---

### QuickBooks Payment → Deskwise Payment

| QuickBooks Field | Deskwise Field | Type | Notes |
|---|---|---|---|
| `Id` | `integration.externalId` | String | QB Payment ID |
| `LinkedTxn[].TxnId` | Match to invoice `externalId` | String | Links to invoice |
| `TotalAmt` | `amount` | Decimal | Payment amount |
| `CurrencyRef.value` | `currency` | String | Currency code |
| `TxnDate` | `paidAt` | Date | Payment date |
| `PaymentMethodRef.name` | `method` | String | See method mapping |
| `PaymentRefNum` | `transactionId` | String | Check/reference number |

**Payment Method Mapping (QB → Deskwise)**:
- "Cash" → `cash`
- "Check" → `check`
- "Credit Card" → `credit_card`
- "Bank Transfer" → `bank_transfer`

---

### MYOB Payment → Deskwise Payment

| MYOB Field | Deskwise Field | Type | Notes |
|---|---|---|---|
| `UID` | `integration.externalId` | GUID | Payment UID |
| `Invoice.UID` | Match to invoice `externalId` | GUID | Links to invoice |
| `Amount` | `amount` | Decimal | Payment amount |
| `Date` | `paidAt` | Date | Payment date |
| `PaymentMethod` | `method` | Enum | See method mapping |
| `Memo` | `notes` | String | Payment memo |

**Payment Method Mapping (MYOB → Deskwise)**:
- "Cash" → `cash`
- "Cheque" → `check`
- "CreditCard" → `credit_card`
- "Electronic" → `bank_transfer`

---

## Tax Code Mapping

### Common Tax Scenarios

#### Australia (GST 10%)

| Deskwise Tax Rate | Xero Tax Code | QuickBooks Tax Code | MYOB Tax Code |
|---|---|---|---|
| 10% GST | `OUTPUT` or `GST` | `TAX` (if configured) | `GST` |
| 0% GST-Free | `EXEMPTOUTPUT` or `FRE` | `NON` | `FRE` |
| 0% Input Taxed | `EXEMPTINPUT` | `NON` | `ITS` |
| No Tax | `NONE` | `NON` | `N-T` |

#### New Zealand (GST 15%)

| Deskwise Tax Rate | Xero Tax Code | QuickBooks Tax Code | MYOB Tax Code |
|---|---|---|---|
| 15% GST | `OUTPUT2` or `G15` | `TAX` | `G15` |
| 0% Zero-Rated | `ZERORATEDINPUT` | `NON` | `FRE` |
| No Tax | `NONE` | `NON` | `N-T` |

#### United States (Sales Tax - varies by state)

| Deskwise Tax Rate | Xero Tax Code | QuickBooks Tax Code | MYOB Tax Code |
|---|---|---|---|
| Variable % | Configure per state | Automated Sales Tax | Not applicable |
| 0% No Tax | `NONE` | `NON` | — |

**Note**: US sales tax is complex. Use QuickBooks Automated Sales Tax feature for accurate calculations.

#### United Kingdom (VAT 20%)

| Deskwise Tax Rate | Xero Tax Code | QuickBooks Tax Code | MYOB Tax Code |
|---|---|---|---|
| 20% VAT | `OUTPUT` | `20.0% S` | Not common |
| 0% Zero-Rated | `ZERORATEDOUTPUT` | `0.0% Z` | — |
| Exempt | `EXEMPTOUTPUT` | `E` | — |

---

## Field-Level Mapping Details

### Address Mapping

Accounting platforms have different address structures:

**Xero**:
```json
{
  "AddressType": "POBOX" | "STREET",
  "AddressLine1": "123 Main St",
  "AddressLine2": "Suite 100",
  "City": "New York",
  "Region": "NY",
  "PostalCode": "10001",
  "Country": "United States"
}
```

**QuickBooks**:
```json
{
  "Line1": "123 Main St",
  "Line2": "Suite 100",
  "City": "New York",
  "CountrySubDivisionCode": "NY",
  "PostalCode": "10001",
  "Country": "USA"
}
```

**MYOB**:
```json
{
  "Location": "Business" | "Postal",
  "Street": "123 Main St",
  "City": "New York",
  "State": "NY",
  "PostCode": "10001",
  "Country": "United States"
}
```

**Mapping Logic**:
- Deskwise `address.street` → `AddressLine1` / `Line1` / `Street`
- Deskwise `address.city` → `City`
- Deskwise `address.state` → `Region` / `CountrySubDivisionCode` / `State`
- Deskwise `address.zip` → `PostalCode` / `PostalCode` / `PostCode`
- Deskwise `address.country` → `Country`

---

### Date Formatting

All platforms accept ISO 8601 date format: `YYYY-MM-DD`

**Example**: January 19, 2025 → `2025-01-19`

**Timezone Handling**:
- Deskwise stores dates in UTC
- Convert to organization's timezone before syncing
- Platforms typically interpret dates in their configured timezone

---

### Currency Handling

**ISO 4217 Currency Codes**:
- USD (United States Dollar)
- AUD (Australian Dollar)
- NZD (New Zealand Dollar)
- GBP (British Pound)
- EUR (Euro)
- CAD (Canadian Dollar)

**Multi-Currency**:
- Requires multi-currency enabled in accounting platform
- Each invoice specifies currency
- Exchange rates managed by platform

---

## Default Values and Transformations

### When Deskwise Field is Empty

| Scenario | Default Value | Notes |
|---|---|---|
| Invoice without due date | `invoiceDate` + `paymentTerms` (days) | Calculate from terms |
| Line item without tax code | Organization default tax code | From integration config |
| Product without account code | Default income account | From integration config |
| Client without country | Organization country | From org settings |
| Invoice without currency | Organization default currency | From org settings |

### Data Transformations

**String Truncation**:
- MYOB line item description: Truncate to 255 chars
- Add "..." if truncated
- Full description in notes if needed

**Number Formatting**:
- Decimals: Round to 2 decimal places for currency
- Quantities: Round to 4 decimal places
- Percentages: Store as decimal (10% = 0.10)

**Enum Mapping**:
- Always use platform-specific enum values
- Case-sensitive in most platforms
- Validate before syncing

---

## Platform-Specific Considerations

### Xero

**Unique Requirements**:
- TenantId must be included in all API calls
- Line items use `AccountCode` (string) not account ID
- Tax types are predefined, cannot create new via API

**Best Practices**:
- Use `LineAmountTypes: Exclusive` for clarity
- Set branding theme for consistent invoicing
- Enable tracking categories for departmental reporting

---

### QuickBooks

**Unique Requirements**:
- Must include `SyncToken` for updates (optimistic locking)
- `DocNumber` is optional, QB auto-generates if omitted
- Tax calculation requires "Automated Sales Tax" feature for accuracy

**Best Practices**:
- Use ItemRef for products (better than just descriptions)
- Link estimates to invoices via `LinkedTxn`
- Set `GlobalTaxCalculation: TaxExcluded` for clarity

---

### MYOB

**Unique Requirements**:
- Uses GUIDs (UID) for all entity references, not integers
- Requires `RowVersion` for updates (concurrency control)
- Field length limits stricter than other platforms

**Best Practices**:
- Cache Account and TaxCode UIDs to avoid repeated lookups
- Use company file selector if customer has multiple files
- Handle "locked by another user" errors gracefully

---

## Example: Complete Invoice Mapping

### Deskwise Invoice (JSON)

```json
{
  "_id": "65a1b2c3d4e5f6789012345",
  "orgId": "org_123",
  "invoiceNumber": "INV-2025-0042",
  "invoiceDate": "2025-01-19",
  "dueDate": "2025-02-18",
  "clientId": "client_456",
  "clientName": "Acme Corporation",
  "status": "sent",
  "lineItems": [
    {
      "description": "Monthly Managed Services",
      "quantity": 1,
      "rate": 1200.00,
      "total": 1200.00,
      "category": "Managed Services",
      "taxRate": "10% GST"
    },
    {
      "description": "Additional Support Hours (5 hours)",
      "quantity": 5,
      "rate": 150.00,
      "total": 750.00,
      "category": "Professional Services",
      "taxRate": "10% GST"
    }
  ],
  "subtotal": 1950.00,
  "taxAmount": 195.00,
  "total": 2145.00,
  "amountDue": 2145.00,
  "currency": "AUD",
  "paymentTerms": 30,
  "memo": "Thank you for your business!"
}
```

### Xero Invoice (JSON)

```json
{
  "Type": "ACCREC",
  "InvoiceNumber": "INV-2025-0042",
  "Contact": {
    "ContactID": "contact-uuid-from-client-sync"
  },
  "Date": "2025-01-19",
  "DueDate": "2025-02-18",
  "Status": "SUBMITTED",
  "LineItems": [
    {
      "Description": "Monthly Managed Services",
      "Quantity": 1.0,
      "UnitAmount": 1200.00,
      "LineAmount": 1200.00,
      "AccountCode": "4-1100",
      "TaxType": "OUTPUT"
    },
    {
      "Description": "Additional Support Hours (5 hours)",
      "Quantity": 5.0,
      "UnitAmount": 150.00,
      "LineAmount": 750.00,
      "AccountCode": "4-1200",
      "TaxType": "OUTPUT"
    }
  ],
  "LineAmountTypes": "Exclusive",
  "Reference": "Thank you for your business!",
  "CurrencyCode": "AUD"
}
```

### QuickBooks Invoice (JSON)

```json
{
  "DocNumber": "INV-2025-0042",
  "TxnDate": "2025-01-19",
  "DueDate": "2025-02-18",
  "CustomerRef": {
    "value": "customer-id-from-client-sync",
    "name": "Acme Corporation"
  },
  "Line": [
    {
      "DetailType": "SalesItemLineDetail",
      "Description": "Monthly Managed Services",
      "Amount": 1200.00,
      "SalesItemLineDetail": {
        "Qty": 1,
        "UnitPrice": 1200.00,
        "ItemRef": {
          "value": "item-managed-services-id"
        },
        "TaxCodeRef": {
          "value": "TAX"
        }
      }
    },
    {
      "DetailType": "SalesItemLineDetail",
      "Description": "Additional Support Hours (5 hours)",
      "Amount": 750.00,
      "SalesItemLineDetail": {
        "Qty": 5,
        "UnitPrice": 150.00,
        "ItemRef": {
          "value": "item-support-hours-id"
        },
        "TaxCodeRef": {
          "value": "TAX"
        }
      }
    }
  ],
  "TotalAmt": 2145.00,
  "CustomerMemo": {
    "value": "Thank you for your business!"
  },
  "CurrencyRef": {
    "value": "AUD"
  }
}
```

### MYOB Invoice (JSON)

```json
{
  "Number": "INV-2025-0042",
  "Date": "2025-01-19",
  "Customer": {
    "UID": "customer-uid-from-client-sync"
  },
  "Terms": {
    "PaymentIsDue": "InAGivenNumberOfDays",
    "BalanceDueDate": 30
  },
  "Status": "Open",
  "Lines": [
    {
      "Type": "Transaction",
      "Description": "Monthly Managed Services",
      "ShipQuantity": 1.0,
      "UnitPrice": 1200.00,
      "Total": 1200.00,
      "Account": {
        "UID": "account-uid-for-managed-services"
      },
      "TaxCode": {
        "UID": "taxcode-uid-for-gst"
      }
    },
    {
      "Type": "Transaction",
      "Description": "Additional Support Hours (5 hours)",
      "ShipQuantity": 5.0,
      "UnitPrice": 150.00,
      "Total": 750.00,
      "Account": {
        "UID": "account-uid-for-professional-services"
      },
      "TaxCode": {
        "UID": "taxcode-uid-for-gst"
      }
    }
  ],
  "TotalAmount": 2145.00,
  "Comment": "Thank you for your business!",
  "ForeignCurrency": {
    "Code": "AUD"
  }
}
```

---

*Last Updated: January 2025*
*Version: 1.0*
