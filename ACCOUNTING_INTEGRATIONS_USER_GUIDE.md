# Accounting Integrations User Guide

## Table of Contents
- [Overview](#overview)
- [Supported Platforms](#supported-platforms)
- [Getting Started](#getting-started)
- [Platform Setup Guides](#platform-setup-guides)
  - [Xero Integration](#xero-integration)
  - [QuickBooks Online Integration](#quickbooks-online-integration)
  - [MYOB Integration](#myob-integration)
- [Using Your Integration](#using-your-integration)
- [Data Synchronization](#data-synchronization)
- [Managing Sync Status](#managing-sync-status)
- [Disconnecting an Integration](#disconnecting-an-integration)
- [Troubleshooting](#troubleshooting)
- [Best Practices for MSPs](#best-practices-for-msps)

---

## Overview

### What are Accounting Integrations?

Accounting integrations connect Deskwise to your accounting platform (Xero, QuickBooks, or MYOB), enabling automatic synchronization of financial data between systems. This eliminates manual data entry, reduces errors, and provides real-time visibility into your MSP's financial performance.

### Why Use Accounting Integrations?

**Time Savings:**
- No manual re-entry of invoices, clients, or products
- Automatic payment reconciliation
- Instant sync of financial data

**Accuracy:**
- Eliminate data entry errors
- Ensure consistency across platforms
- Automatic validation of financial records

**Real-Time Insights:**
- Up-to-date financial reporting
- Accurate accounts receivable aging
- Real-time revenue tracking

**Streamlined Workflow:**
- Create invoices in Deskwise, automatically push to accounting
- Track project time and convert to billable invoices
- Manage client relationships without switching platforms

---

## Supported Platforms

### Xero
- **Region**: Global (with region-specific tax support)
- **Plan Requirements**: Any Xero subscription (Starter, Standard, Premium)
- **Features**: Invoices, quotes, contacts, payments, products/services, tax rates
- **Real-time Sync**: Yes
- **API Version**: Xero Accounting API 2.0

### QuickBooks Online
- **Region**: United States, Canada, United Kingdom, Australia
- **Plan Requirements**: QuickBooks Online Essentials or Plus (not Self-Employed)
- **Features**: Invoices, estimates, customers, payments, items, sales tax
- **Real-time Sync**: Yes
- **API Version**: QuickBooks Online API v3

### MYOB
- **Region**: Australia, New Zealand
- **Plan Requirements**: MYOB Business or AccountRight Plus/Premier
- **Features**: Sales invoices, quotes, customers, payments, inventory items, tax codes
- **Real-time Sync**: Yes
- **API Version**: MYOB AccountRight API v2

---

## Getting Started

### Prerequisites

Before connecting an accounting integration, ensure you have:

1. **Active Deskwise Account** with admin permissions
2. **Active Accounting Platform Subscription** (Xero, QuickBooks, or MYOB)
3. **Administrator Access** to your accounting platform
4. **Client/Customer Data** already set up in your accounting platform (optional, can sync from Deskwise)
5. **Chart of Accounts** configured in your accounting platform
6. **Tax Codes/Rates** configured (important for correct tax calculations)

### Permission Requirements

**Deskwise:**
- Admin or Billing Manager role required to connect integrations

**Accounting Platform:**
- Full administrator access recommended
- Minimum: Read/Write access to Invoices, Contacts/Customers, Products/Items, Payments

---

## Platform Setup Guides

## Xero Integration

### Step 1: Connect to Xero

1. Navigate to **Settings > Integrations > Accounting**
2. Click **Connect to Xero**
3. You'll be redirected to Xero's authorization page
4. Log in to your Xero account (if not already logged in)
5. Select the organization you want to connect
6. Review the permissions Deskwise is requesting:
   - Read and write contacts
   - Read and write invoices
   - Read and write quotes
   - Read and write items (products/services)
   - Read payments
   - Read tax rates
   - Read tracking categories
   - Read organization details
7. Click **Authorize** to grant access
8. You'll be redirected back to Deskwise

**[Screenshot placeholder: Xero authorization screen showing permission requests]**

### Step 2: Configure Sync Settings

After authorization, configure how Deskwise syncs with Xero:

#### General Settings
- **Organization**: Displays the connected Xero organization name
- **Default Account Code**: Select the default revenue account for services (e.g., "200 - Sales")
- **Tax Treatment**: Choose how tax is calculated
  - Use Xero tax rates (recommended)
  - Use Deskwise tax rates
  - No tax

#### Sync Preferences
- **Auto-sync invoices**: Automatically push new invoices to Xero when marked as "Sent"
- **Auto-sync payments**: Pull payment records from Xero every 30 minutes
- **Auto-sync contacts**: Sync new clients to Xero as Contacts
- **Sync direction for products**:
  - Deskwise → Xero (push products as Items)
  - Xero → Deskwise (pull Items as products)
  - Two-way sync (merge and update)

#### Invoice Settings
- **Branding Theme**: Select Xero branding theme for invoices (optional)
- **Invoice Status**: Choose initial status when syncing
  - Draft (requires manual approval in Xero)
  - Submitted/Awaiting Payment (sends to customer)
- **Reference Prefix**: Add prefix to invoice references (e.g., "DESKWISE-")

#### Mapping Settings
- **Client → Contact Mapping**: How Deskwise clients map to Xero contacts
- **Product → Item Mapping**: How Deskwise products map to Xero inventory items
- **Payment Terms**: Map Deskwise payment terms to Xero (Net 15, Net 30, etc.)

**[Screenshot placeholder: Xero configuration screen with sync settings]**

### Step 3: Initial Data Sync

After configuration, perform an initial sync:

1. Click **Start Initial Sync**
2. Select what to sync:
   - **Import from Xero**: Pull contacts, items, tax rates into Deskwise
   - **Export to Xero**: Push clients, products to Xero as contacts/items
   - **Two-way merge**: Intelligently merge data (detects duplicates)
3. Review the sync preview:
   - Shows what will be created/updated/skipped
   - Highlights potential duplicates
4. Click **Confirm and Sync**
5. Monitor progress in real-time
6. Review sync results and address any errors

**Estimated Time**: 5-15 minutes depending on data volume

### Step 4: Test the Integration

Create a test invoice to verify the integration:

1. Go to **Billing > Invoices > New Invoice**
2. Create an invoice for a test client
3. Add line items (products/services)
4. Click **Save and Send**
5. Verify sync status shows "Synced to Xero"
6. Log in to Xero and confirm the invoice appears correctly
7. Check that:
   - Contact name matches
   - Line items are correct
   - Tax rates applied properly
   - Total amounts match
   - Invoice number/reference is correct

### Common Xero Setup Issues

**Issue**: "Organization not found" error
- **Solution**: Ensure you selected the correct organization during authorization. Disconnect and reconnect.

**Issue**: Tax rates not syncing correctly
- **Solution**: Verify tax rates are configured in Xero first. Deskwise imports tax rates; it doesn't create them.

**Issue**: Duplicate contacts being created
- **Solution**: Use the "Match by email" option in sync settings to prevent duplicates.

**Issue**: Invoice sync fails with "Account code required"
- **Solution**: Set a default revenue account code in the integration settings.

---

## QuickBooks Online Integration

### Step 1: Connect to QuickBooks

1. Navigate to **Settings > Integrations > Accounting**
2. Click **Connect to QuickBooks Online**
3. You'll be redirected to Intuit's authorization page
4. Log in with your QuickBooks/Intuit account credentials
5. Select the QuickBooks company you want to connect
6. Review the permissions Deskwise is requesting:
   - Create, read, and update customers
   - Create, read, and update invoices
   - Create, read, and update estimates
   - Create, read, and update items (products/services)
   - Read payments
   - Read tax rates/codes
   - Read company information
7. Click **Authorize** to grant access
8. You'll be redirected back to Deskwise

**[Screenshot placeholder: QuickBooks OAuth authorization screen]**

### Step 2: Configure Sync Settings

#### General Settings
- **Company**: Displays connected QuickBooks company name
- **Default Income Account**: Select revenue account for services (e.g., "Services Income")
- **Default Expense Account**: For cost tracking (optional)
- **Sales Tax**:
  - Enable automatic sales tax calculation
  - Map Deskwise tax rates to QuickBooks tax codes

#### Sync Preferences
- **Auto-sync invoices**: Push invoices to QuickBooks when marked "Sent"
- **Auto-sync estimates**: Push quotes to QuickBooks as Estimates
- **Auto-sync payments**: Pull payment records every 30 minutes
- **Auto-sync customers**: Sync new clients as QuickBooks Customers
- **Sync products/items**:
  - One-way: Deskwise → QuickBooks
  - One-way: QuickBooks → Deskwise
  - Two-way sync

#### Invoice Settings
- **Invoice Template**: Select QuickBooks template to use
- **Email Delivery**:
  - Send via Deskwise only
  - Send via QuickBooks only
  - Send via both (not recommended)
- **Custom Fields**: Map Deskwise custom fields to QuickBooks custom fields
- **Invoice Numbering**:
  - Use Deskwise numbers
  - Use QuickBooks auto-numbering
  - Use hybrid (prefix + QuickBooks number)

#### Customer Mapping
- **Display Name Format**: How to format customer names
  - Company name only
  - Contact name + Company
  - Company (Contact name)
- **Duplicate Detection**: Match customers by
  - Email address (recommended)
  - Company name
  - Phone number

**[Screenshot placeholder: QuickBooks configuration dashboard]**

### Step 3: Chart of Accounts Mapping

Map Deskwise billing categories to QuickBooks accounts:

1. Go to **Integration Settings > Account Mapping**
2. For each Deskwise product category, select the QuickBooks income account:
   - **Managed Services** → "Managed Services Income"
   - **Professional Services** → "Consulting Income"
   - **Hardware Sales** → "Product Sales"
   - **Software Licenses** → "Software Income"
3. For expenses (if tracking costs):
   - **Managed Services** → "Cost of Services"
   - **Hardware** → "Cost of Goods Sold"
4. Click **Save Mappings**

### Step 4: Initial Data Sync

1. Click **Configure Initial Sync**
2. Choose sync direction:
   - **Import from QuickBooks**: Pull customers, items, tax codes
   - **Export to QuickBooks**: Push clients, products
   - **Merge**: Intelligently merge (recommended for existing data)
3. Select data types to sync:
   - ☑ Customers/Clients
   - ☑ Products/Items (Services)
   - ☑ Products/Items (Inventory)
   - ☑ Tax Codes
   - ☐ Historical Invoices (optional, use with caution)
4. Review sync preview
5. Click **Start Sync**
6. Monitor progress (typically 10-20 minutes for 1000 records)

### Step 5: Test the Integration

1. Create a test invoice in Deskwise
2. Add a known QuickBooks customer
3. Add line items using synced products
4. Apply sales tax if applicable
5. Click **Save and Send to QuickBooks**
6. Verify in QuickBooks:
   - Invoice appears in **Sales > Invoices**
   - Customer linked correctly
   - Line items match
   - Tax calculated correctly
   - Custom fields populated (if configured)

### Common QuickBooks Setup Issues

**Issue**: "Authentication expired" after 24 hours
- **Solution**: QuickBooks tokens expire. Deskwise auto-refreshes, but if you see this error, click "Reconnect" in integration settings.

**Issue**: Sales tax not calculating
- **Solution**: Ensure tax codes are configured in QuickBooks first. Enable "Automated Sales Tax" in QuickBooks settings.

**Issue**: Estimates not syncing
- **Solution**: Verify QuickBooks Online plan supports estimates (Essentials or Plus required, not Simple Start).

**Issue**: Item/Product sync fails
- **Solution**: Check that items have proper income accounts assigned in QuickBooks. Cannot sync items without account mappings.

---

## MYOB Integration

### Step 1: Connect to MYOB

1. Navigate to **Settings > Integrations > Accounting**
2. Click **Connect to MYOB**
3. You'll be redirected to MYOB's authorization page
4. Log in to your MYOB account
5. Select the company file to connect
6. Review the permissions Deskwise is requesting:
   - Read and write contacts (customers)
   - Read and write sales invoices
   - Read and write quotes
   - Read and write inventory items
   - Read payments
   - Read tax codes
   - Read general ledger accounts
   - Read company file information
7. Click **Authorize Access**
8. You'll be redirected back to Deskwise

**[Screenshot placeholder: MYOB authorization page]**

### Step 2: Configure Sync Settings

#### General Settings
- **Company File**: Displays connected MYOB company file name
- **Financial Year**: Current MYOB financial year
- **Default Income Account**: Select revenue account (e.g., "4-1100 Sales - Services")
- **Default Tax Code**: Default GST/tax code for sales (e.g., "GST" for Australia, "G15" for NZ)

#### Sync Preferences
- **Auto-sync invoices**: Push invoices to MYOB when finalized
- **Auto-sync quotes**: Push quotes to MYOB as Quotes
- **Auto-sync payments**: Pull payment records every 30 minutes
- **Auto-sync customers**: Sync new clients as MYOB Customers
- **Auto-sync items**: Sync products as MYOB Inventory Items or Services
  - Inventory items (tracked stock)
  - Service items (non-inventory)

#### Invoice Settings
- **Template**: Select MYOB invoice template/form
- **Terms**: Map payment terms
  - COD → Cash on Delivery
  - Net 7 → 7 Days
  - Net 14 → 14 Days
  - Net 30 → 30 Days
- **Invoice Layout**: Choose MYOB layout ID (if custom forms used)
- **Ship Via**: Default shipping method (if applicable)

#### Customer Settings
- **Card Type**: How to create customers in MYOB
  - Customer cards (standard)
  - Debtor cards (for AccountRight)
- **Display ID Format**: How to format customer IDs
  - Auto-generate in MYOB
  - Use Deskwise client ID
- **Address Format**:
  - Use billing address
  - Use primary contact address
  - Use both (billing as default, contact as shipping)

**[Screenshot placeholder: MYOB integration settings screen]**

### Step 3: Tax Code Mapping

Map Deskwise tax rates to MYOB tax codes:

1. Go to **Integration Settings > Tax Mapping**
2. Deskwise will list your configured tax rates
3. For each Deskwise tax rate, select the matching MYOB tax code:
   - **10% GST** → "GST" (Australia) or "G15" (NZ)
   - **0% GST-Free** → "FRE" (Free)
   - **15% GST** → "G15" (New Zealand)
   - **No Tax** → "N-T" (Not Reportable)
4. Set default tax code for new products
5. Click **Save Tax Mappings**

**Important**: MYOB has strict tax code requirements. Incorrect mappings will cause sync failures.

### Step 4: Account Code Mapping

Map Deskwise categories to MYOB general ledger accounts:

1. Go to **Integration Settings > Account Mapping**
2. Deskwise will display your product categories
3. For each category, select the MYOB income account:
   - **Managed Services** → "4-1100 Sales - Services"
   - **Professional Services** → "4-1200 Consulting Income"
   - **Hardware** → "4-2100 Sales - Hardware"
   - **Software** → "4-2200 Sales - Software"
4. For cost of sales (optional):
   - Map to expense accounts (5-xxxx series)
5. Click **Save Mappings**

### Step 5: Initial Data Sync

1. Click **Start Initial Sync**
2. Choose sync approach:
   - **Import from MYOB**: Pull customers, items, tax codes (recommended for existing MYOB data)
   - **Export to MYOB**: Push clients, products to MYOB (recommended for new MYOB files)
   - **Merge and Match**: Two-way intelligent merge
3. Select data to sync:
   - ☑ Customers/Contacts
   - ☑ Inventory Items
   - ☑ Service Items
   - ☑ Tax Codes
   - ☐ Historical Invoices (advanced users only)
4. Configure matching rules:
   - Match customers by: Email, Phone, or Company Name
   - Match items by: SKU, Name, or Item Number
5. Review sync preview
6. Click **Confirm and Sync**
7. Wait for completion (may take 15-30 minutes for large datasets)

### Step 6: Test the Integration

1. Create a test invoice:
   - Go to **Billing > Invoices > New**
   - Select a test customer
   - Add line items (products/services)
   - Apply appropriate tax codes
2. Click **Finalize and Sync to MYOB**
3. Verify sync status shows "Synced Successfully"
4. Log in to MYOB and check:
   - Invoice appears in **Sales > Invoices**
   - Customer card is correct
   - Line items match
   - Tax codes applied correctly
   - GST amount calculated correctly
   - Account codes assigned properly

### Common MYOB Setup Issues

**Issue**: "Invalid account code" error
- **Solution**: Ensure the account code exists in your MYOB chart of accounts and is an income account (4-xxxx series).

**Issue**: "Tax code not found"
- **Solution**: Tax codes in MYOB must match exactly (case-sensitive). Check your MYOB tax code list and update mappings.

**Issue**: "Customer card locked" error
- **Solution**: Customer is being edited in MYOB. Close MYOB or ask other users to close the customer card.

**Issue**: GST not calculating correctly
- **Solution**: Verify your MYOB tax code is configured correctly. For Australia, use "GST" (10%). For New Zealand, use "G15" (15%).

**Issue**: Item sync fails with "Inventory account required"
- **Solution**: If syncing as inventory items, you must have asset accounts configured in MYOB. Use service items if not tracking inventory.

---

## Using Your Integration

### Creating and Syncing Invoices

#### Automatic Sync (Recommended)
1. Create invoice in Deskwise as usual
2. Fill in all required fields
3. Review line items, tax, and total
4. Click **Save and Send**
5. Deskwise automatically:
   - Validates all data
   - Pushes invoice to your accounting platform
   - Updates sync status
   - Stores the external invoice ID for reference
6. Check the sync badge:
   - 🟢 **Synced** - Successfully synced
   - 🟡 **Pending** - Queued for sync
   - 🔴 **Failed** - Error occurred (click for details)

#### Manual Sync
1. Create invoice and click **Save as Draft**
2. Review and edit as needed
3. When ready, click **Sync to [Platform]** button
4. Monitor sync progress
5. Verify sync status updates to "Synced"

#### Bulk Sync
1. Go to **Billing > Invoices**
2. Select multiple invoices (checkbox)
3. Click **Bulk Actions > Sync to [Platform]**
4. Review summary of selected invoices
5. Click **Sync All**
6. Monitor bulk sync progress
7. Review results (success/failed count)

**[Screenshot placeholder: Invoice detail page showing sync status badge]**

### Creating and Syncing Quotes/Estimates

#### Xero (Quotes)
1. Create quote in Deskwise
2. Click **Save and Sync to Xero**
3. Quote synced as Xero Quote
4. When accepted:
   - Click **Convert to Invoice** in Deskwise
   - Invoice automatically synced to Xero
   - Linked to original Xero Quote

#### QuickBooks (Estimates)
1. Create quote in Deskwise
2. Click **Save and Sync to QuickBooks**
3. Quote synced as QuickBooks Estimate
4. When accepted:
   - Click **Convert to Invoice**
   - Invoice automatically created from Estimate in QuickBooks
   - Estimate marked as "Closed" in QuickBooks

#### MYOB (Quotes)
1. Create quote in Deskwise
2. Click **Save and Sync to MYOB**
3. Quote synced as MYOB Quote/Order
4. When accepted:
   - Click **Convert to Invoice**
   - Invoice created and linked to original Quote in MYOB

### Syncing Payments

Payments sync from your accounting platform to Deskwise (one-way sync):

#### Automatic Payment Sync
- Runs every 30 minutes
- Pulls payment records from accounting platform
- Matches payments to invoices
- Updates invoice status in Deskwise
- Records payment method, date, and amount

#### Manual Payment Sync
1. Go to **Billing > Invoices**
2. Click **Sync Payments** button
3. Deskwise pulls latest payment data
4. Review payment sync log
5. Invoices automatically marked as "Paid" or "Partially Paid"

#### Payment Reconciliation
- Deskwise displays payment source (e.g., "QuickBooks Payment")
- View payment details:
  - Payment date
  - Amount
  - Method (credit card, bank transfer, etc.)
  - Transaction ID (if available)
  - Bank account (if available)
- Cannot edit payments synced from accounting platform
- Edit payments in your accounting platform if changes needed

### Syncing Clients/Customers

#### Automatic Client Sync
When creating a new client in Deskwise:
1. Fill in client details (name, email, address, etc.)
2. Click **Save**
3. If auto-sync enabled, client immediately synced
4. Sync badge shows "Synced to [Platform]"
5. External customer ID stored for future reference

#### Importing Clients from Accounting Platform
1. Go to **Clients > Import from [Platform]**
2. Select customers to import
3. Preview imported data
4. Click **Import Selected**
5. Clients created in Deskwise
6. Linked to accounting platform customers

#### Updating Synced Clients
- Changes in Deskwise automatically sync to accounting platform (if two-way sync enabled)
- Changes in accounting platform sync to Deskwise during next sync cycle
- Conflicts resolved based on "last modified" timestamp

### Syncing Products/Services

#### Exporting Products to Accounting Platform
1. Go to **Products > Product Catalog**
2. Select products to sync
3. Click **Sync to [Platform]**
4. Products created as Items/Services in accounting platform
5. Mappings stored for future invoice sync

#### Importing Items from Accounting Platform
1. Go to **Products > Import from [Platform]**
2. Select items to import
3. Map to Deskwise product categories
4. Click **Import**
5. Products available for use in invoices/quotes

#### Product Sync Modes
- **One-way (Deskwise → Platform)**: Deskwise is master, changes flow to accounting
- **One-way (Platform → Deskwise)**: Accounting is master, changes flow to Deskwise
- **Two-way**: Changes sync in both directions (conflicts resolved by timestamp)

---

## Data Synchronization

### What Data Syncs?

#### Invoices
**Deskwise → Accounting Platform:**
- Invoice number
- Client/Customer reference
- Invoice date and due date
- Line items (description, quantity, rate, amount)
- Subtotal, tax, discounts, total
- Payment terms
- Notes/memo
- Status

**Accounting Platform → Deskwise:**
- Invoice status changes (Draft → Sent → Paid)
- Payment records
- External invoice number (if different)
- View/open timestamps

#### Quotes/Estimates
**Deskwise → Accounting Platform:**
- Quote number
- Client/Customer reference
- Valid until date
- Line items
- Totals
- Status (draft, sent, accepted, rejected)

**Accounting Platform → Deskwise:**
- Status changes
- Acceptance/rejection
- Converted to invoice

#### Clients/Customers
**Two-way sync:**
- Company/contact name
- Email address
- Phone number
- Billing address
- Shipping address (if different)
- Payment terms
- Tax registration number (ABN, VAT, EIN)
- Notes

#### Products/Services
**Two-way sync:**
- Product/Item name
- SKU/Item code
- Description
- Unit price
- Cost (if enabled)
- Tax code/category
- Income account
- Active/inactive status

#### Payments
**Accounting Platform → Deskwise (one-way):**
- Payment date
- Amount
- Method
- Reference/transaction ID
- Bank account
- Applied to invoice

#### Tax Codes/Rates
**Accounting Platform → Deskwise (one-way):**
- Tax code
- Tax rate percentage
- Tax type (GST, VAT, Sales Tax)
- Active status

### Sync Frequency

#### Real-time Sync (Immediate)
- Invoices (when marked as "Sent" or "Finalized")
- Quotes (when sent to client)
- New clients (when created with auto-sync enabled)
- New products (when auto-sync enabled)

#### Scheduled Sync (Every 30 minutes)
- Payment records
- Invoice status updates
- Customer updates (if two-way enabled)
- Product updates (if two-way enabled)

#### Manual Sync (On-demand)
- Bulk invoice sync
- Initial data import/export
- Historical data sync
- Troubleshooting/recovery

### Sync Direction

#### One-way Sync (Deskwise → Accounting)
- **Use case**: Deskwise is your primary billing system
- **Behavior**:
  - Create/update records in accounting platform
  - No updates pulled from accounting platform
  - Best for MSPs who manage everything in Deskwise
- **Example**: Create invoices in Deskwise, automatically appear in Xero for accounting purposes

#### One-way Sync (Accounting → Deskwise)
- **Use case**: Accounting platform is primary, Deskwise for operations
- **Behavior**:
  - Pull customers, items, invoices from accounting platform
  - Changes in Deskwise don't sync back
  - Best for businesses with established accounting workflows
- **Example**: Use QuickBooks for all financials, pull customer data into Deskwise for ticket management

#### Two-way Sync (Bidirectional)
- **Use case**: Need flexibility to update in either system
- **Behavior**:
  - Changes sync in both directions
  - Conflict resolution based on last modified timestamp
  - Requires careful data management
  - Best for teams using both systems actively
- **Example**: Sales team updates customers in QuickBooks, support team updates in Deskwise, changes sync both ways

### Conflict Resolution

When the same record is modified in both systems simultaneously:

**Winner**: Last modified timestamp wins
- System with most recent change overwrites the other
- Loser's changes are stored in conflict log

**Notification**: Admin receives conflict notification
- Shows what was overwritten
- Allows manual restoration if needed

**Prevention**:
- Designate one system as "master" for specific data types
- Use one-way sync when possible
- Train team on data entry best practices

---

## Managing Sync Status

### Sync Status Indicators

#### Invoice/Quote Sync Status
- 🟢 **Synced** - Successfully synced to accounting platform
- 🟡 **Pending** - Queued for sync (will sync within 5 minutes)
- 🔄 **Syncing** - Currently being synced
- 🔴 **Failed** - Sync error occurred (click to view details)
- ⚫ **Not Synced** - Not yet synced (draft or manual sync required)
- 🔗 **Linked** - Previously synced, external ID stored

#### Client Sync Status
- ✅ **Synced** - Linked to accounting platform customer
- ⏳ **Pending** - Will sync on next cycle
- ❌ **Failed** - Error occurred
- ➖ **Not Linked** - Not synced to accounting platform

### Viewing Sync Details

#### Invoice Sync Details
1. Open any invoice
2. Look for "Integration" section in sidebar
3. View:
   - Sync status
   - External invoice number
   - Platform (Xero/QuickBooks/MYOB)
   - Last sync date/time
   - Link to view in accounting platform
   - Sync history/log

**[Screenshot placeholder: Invoice detail showing integration sidebar]**

#### Sync History Log
1. Go to **Settings > Integrations > Accounting**
2. Click **Sync History**
3. View comprehensive sync log:
   - Date/time of each sync
   - Data type (invoice, client, product, etc.)
   - Record name/number
   - Status (success/failed)
   - Error message (if failed)
   - User who initiated sync
4. Filter by:
   - Date range
   - Status
   - Data type
   - User
5. Export log to CSV for analysis

### Handling Sync Errors

#### Common Error Types

**1. Validation Errors**
- **Cause**: Missing required fields
- **Example**: "Customer email is required"
- **Fix**: Edit record in Deskwise, add missing data, retry sync

**2. Mapping Errors**
- **Cause**: No mapping configured for product/account
- **Example**: "Income account not set for product category"
- **Fix**: Go to Integration Settings > Account Mapping, configure missing mapping

**3. Duplicate Errors**
- **Cause**: Record already exists in accounting platform
- **Example**: "Invoice number INV-001 already exists"
- **Fix**: Change invoice number in Deskwise or link to existing invoice in platform

**4. Permission Errors**
- **Cause**: Insufficient permissions in accounting platform
- **Example**: "User does not have permission to create invoices"
- **Fix**: Grant appropriate permissions in accounting platform or reconnect with admin account

**5. Tax Code Errors**
- **Cause**: Tax code doesn't exist or invalid
- **Example**: "Tax code 'GST' not found"
- **Fix**: Verify tax code exists in accounting platform, update mapping

**6. Connection Errors**
- **Cause**: Network issue or authentication expired
- **Example**: "Unable to connect to QuickBooks API"
- **Fix**: Check internet connection, try again, or reconnect integration if auth expired

#### Error Resolution Workflow

1. **Identify Error**: Click on failed sync status badge
2. **Read Error Message**: Understand what went wrong
3. **Fix Root Cause**: Edit data, update mappings, or reconnect integration
4. **Retry Sync**: Click "Retry" button
5. **Verify Success**: Confirm status changes to "Synced"
6. **Document**: If recurring issue, note in internal documentation

#### Bulk Error Handling

For multiple failed syncs:
1. Go to **Billing > Invoices**
2. Filter by sync status: "Failed"
3. Review common error patterns
4. Fix in bulk if possible (e.g., update mappings)
5. Select all failed invoices
6. Click **Bulk Actions > Retry Sync**
7. Monitor results

### Manual Sync Operations

#### Force Resync
If data appears out of sync:
1. Open record (invoice, client, etc.)
2. Click **Integration** dropdown
3. Select **Force Resync**
4. Confirm action
5. Deskwise will:
   - Pull latest data from accounting platform
   - Compare with Deskwise data
   - Show differences
   - Allow you to choose which version to keep

#### Unlink and Resync
To break current link and create new record:
1. Open record
2. Click **Integration** dropdown
3. Select **Unlink from [Platform]**
4. Confirm unlinking
5. Record marked as "Not Synced"
6. Click **Sync to [Platform]** to create new record

**Warning**: This creates a duplicate in the accounting platform. Use with caution.

---

## Disconnecting an Integration

### When to Disconnect

- Switching to a different accounting platform
- Integration causing too many conflicts
- No longer need accounting sync
- Migrating to manual processes
- Troubleshooting persistent issues

### Disconnection Process

1. Go to **Settings > Integrations > Accounting**
2. Click **Disconnect** next to your connected platform
3. Review impact warning:
   - Existing synced data remains in both systems
   - Future changes won't sync
   - Invoices will no longer auto-push
   - Payment sync will stop
4. Choose what happens to existing links:
   - **Keep links**: Maintain reference to external IDs (recommended)
   - **Remove links**: Clear all external ID references
5. Click **Confirm Disconnection**
6. Enter admin password to confirm
7. Integration disconnected

### After Disconnection

- All synced data remains in both systems
- No new syncs will occur
- Manual data entry required going forward
- Can reconnect later without data loss
- Historical sync logs preserved for 90 days

### Reconnecting

To reconnect the same or different platform:
1. Follow the connection steps for your platform
2. During initial sync, choose "Merge" option
3. Deskwise will attempt to match existing records
4. Review matches before confirming
5. Sync resumes normally

---

## Troubleshooting

### Sync Issues

**Problem**: Invoices not syncing automatically
**Checklist**:
- ✓ Check integration status (Settings > Integrations)
- ✓ Verify auto-sync is enabled in settings
- ✓ Confirm invoice is marked "Sent" (not "Draft")
- ✓ Check sync history for error messages
- ✓ Verify required fields are filled (client, line items, tax)
- ✓ Try manual sync to see specific error

**Problem**: Payments not appearing in Deskwise
**Checklist**:
- ✓ Verify payment sync is enabled
- ✓ Payments applied to invoice in accounting platform
- ✓ Invoice number matches between systems
- ✓ Wait for next sync cycle (30 minutes) or force manual sync
- ✓ Check payment date is recent (default: last 90 days)

**Problem**: Duplicate customers being created
**Checklist**:
- ✓ Check duplicate detection settings
- ✓ Verify email addresses match exactly (case-sensitive)
- ✓ Use "Merge duplicates" tool in client list
- ✓ Set matching rule to "Email" instead of "Name"

**Problem**: Tax calculating incorrectly
**Checklist**:
- ✓ Verify tax code mapping is correct
- ✓ Check tax rate percentage matches
- ✓ Ensure tax-inclusive vs. tax-exclusive setting matches
- ✓ Confirm customer tax status (taxable/exempt)
- ✓ Verify tax jurisdiction for customer address

### Authentication Issues

**Problem**: "Authentication expired" message
**Solution**:
1. Go to Settings > Integrations > Accounting
2. Click "Reconnect to [Platform]"
3. Authorize again
4. Settings and mappings are preserved
5. Sync resumes automatically

**Problem**: "Invalid credentials" on connection
**Solution**:
- Verify you're logging in with admin account
- Check if accounting subscription is active
- Ensure multi-factor authentication (MFA) is not blocking
- Try different browser or clear cookies
- Contact accounting platform support if persists

### Data Mapping Issues

**Problem**: Products not syncing, "Account code required"
**Solution**:
1. Go to Settings > Integrations > Account Mapping
2. Set default income account for each product category
3. Ensure accounts exist in accounting platform
4. Verify accounts are income accounts (not expenses)
5. Save mappings and retry sync

**Problem**: Tax codes not found
**Solution**:
1. Log in to accounting platform
2. Verify tax codes exist and are active
3. Note exact tax code names (case-sensitive)
4. Go to Settings > Integrations > Tax Mapping
5. Update mappings with correct tax code names
6. Save and retry

### Performance Issues

**Problem**: Sync taking too long
**Causes & Solutions**:
- **Large dataset**: Sync 1000+ records takes time, be patient
- **API rate limits**: Accounting platforms limit requests per minute, sync throttled automatically
- **Network issues**: Check internet connection, try during off-peak hours
- **Database performance**: Contact Deskwise support if repeatedly slow

**Problem**: Sync stuck at "Syncing" for hours
**Solution**:
1. Go to Settings > Integrations > Sync History
2. Check if sync actually completed (may be display bug)
3. If truly stuck, click "Cancel Sync"
4. Wait 5 minutes
5. Try manual sync again
6. If persists, contact support with sync ID

### Getting Help

#### Self-Service Resources
- **Knowledge Base**: Search Deskwise help center for integration articles
- **Platform Documentation**:
  - [Xero API Documentation](https://developer.xero.com/documentation/)
  - [QuickBooks API Documentation](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/)
  - [MYOB API Documentation](https://developer.myob.com/api/accountright/v2/)
- **Video Tutorials**: Watch setup videos in Deskwise learning center
- **Community Forum**: Ask questions and see solutions from other users

#### Contact Support
- **Email**: integrations@deskwise.com
- **Live Chat**: Available in-app during business hours
- **Phone**: Premium support plans only
- **Response Time**: 24-48 hours (Priority support: 4 hours)

**Include in Support Request**:
- Integration platform (Xero/QuickBooks/MYOB)
- Specific error message(s)
- Screenshots of error and settings
- Steps to reproduce issue
- Sync history log (export from Deskwise)
- Approximate time/date of issue

---

## Best Practices for MSPs

### 1. Data Hygiene

**Clean Data Before Syncing**
- Review all client records for completeness
- Ensure consistent naming conventions
- Validate email addresses and phone numbers
- Standardize address formats
- Remove duplicate records

**Maintain Clean Data**
- Set up validation rules in Deskwise
- Require fields: Email, Phone, Billing Address
- Use standardized product naming
- Regular data audits (quarterly)

### 2. Sync Strategy

**Choose the Right Sync Direction**
- **Established MSP with existing accounting**: Use two-way sync
- **New MSP or new accounting platform**: Use one-way (Deskwise → Accounting)
- **Outsourced accounting**: Use one-way (Accounting → Deskwise)

**Start with Manual Sync**
- Disable auto-sync initially
- Manually sync first 10-20 invoices
- Verify everything is working correctly
- Enable auto-sync after confirming reliability

**Schedule Regular Audits**
- Weekly: Review failed syncs
- Monthly: Reconcile invoice totals
- Quarterly: Full data audit
- Annually: Review integration settings and mappings

### 3. Team Training

**Who Needs Training**
- Billing/accounting staff (critical)
- Technicians who create quotes (important)
- Managers who approve invoices (important)
- Front-desk staff (nice to have)

**Training Topics**
- How to create invoices that sync correctly
- Understanding sync status indicators
- Handling sync errors
- When to use manual vs. auto-sync
- Best practices for data entry

**Create Internal Documentation**
- Screenshot-based guides
- Common error solutions
- Escalation procedures
- Contact information for support

### 4. Workflow Optimization

**Standardized Invoice Process**
1. Create invoice in Deskwise
2. Review for accuracy
3. Let auto-sync push to accounting
4. Accounting team reviews in accounting platform
5. Send to customer from accounting platform (with branding)
6. Payment received and recorded in accounting
7. Payment syncs back to Deskwise
8. Ticket/project automatically closed when paid

**Quote-to-Invoice Flow**
1. Create quote in Deskwise
2. Send to client from Deskwise (syncs to accounting as estimate)
3. Client accepts
4. Convert to invoice (one click)
5. Invoice automatically syncs to accounting
6. Send invoice to client
7. Track payment in accounting platform

**Product Management**
- Maintain product catalog in Deskwise
- Auto-sync to accounting platform
- Accounting team uses for financial reporting
- No duplicate data entry required

### 5. Financial Controls

**Separation of Duties**
- **Technicians**: Create quotes and time entries
- **Billing team**: Review and send invoices
- **Accounting**: Record payments and reconcile
- **Managers**: Approve large invoices

**Approval Workflows**
- Require approval for invoices over $X
- Approval required before auto-sync
- Audit trail of who approved what

**Reconciliation Procedures**
- Daily: Review sync failures
- Weekly: Reconcile invoice totals (Deskwise vs. Accounting)
- Monthly: Reconcile accounts receivable aging
- Quarterly: Full audit with accountant

### 6. Tax Compliance

**Get Tax Setup Right**
- Consult with accountant before configuring
- Map tax codes correctly from day one
- Understand tax-inclusive vs. tax-exclusive for your region
- Verify tax calculations on first 10 invoices

**Region-Specific Considerations**
- **Australia**: GST (10%), ensure ABN captured for clients
- **New Zealand**: GST (15%), ensure GST number captured
- **United States**: Sales tax varies by state, configure nexus correctly
- **Canada**: GST/HST/PST vary by province, complex mappings required
- **UK**: VAT (20%), ensure VAT number captured for B2B

**Audit Trail**
- All synced invoices include tax breakdown
- Tax reports available in accounting platform
- Historical tax code changes tracked
- Prepare for tax audits with complete records

### 7. Scalability Planning

**Current State (< 100 invoices/month)**
- Manual sync acceptable
- Simple mappings
- One admin manages integration

**Growth Stage (100-500 invoices/month)**
- Enable auto-sync
- Train billing team
- More complex product mappings
- Consider automation rules

**Enterprise Stage (500+ invoices/month)**
- Full automation required
- Dedicated integration admin
- Custom API integrations if needed
- Regular performance optimization

### 8. Backup and Disaster Recovery

**Before Major Changes**
- Export all invoices/clients from Deskwise
- Export all data from accounting platform
- Document current integration settings
- Take screenshots of mappings

**Regular Backups**
- Accounting platform typically handles backups
- Export Deskwise data monthly
- Test restore procedures annually

**Disaster Recovery Plan**
- If integration breaks, how to continue billing?
- Manual invoice creation process documented
- Emergency contacts for Deskwise and accounting support
- Rollback procedures

### 9. Cost Management

**Monitor API Usage**
- Most accounting platforms have API call limits
- Monitor usage in integration dashboard
- Optimize sync frequency if approaching limits
- Upgrade accounting plan if needed

**ROI Tracking**
- Calculate time saved on data entry
- Measure reduction in billing errors
- Track faster invoice turnaround
- Quantify improvement in cash flow

**Typical ROI**: 10-20 hours saved per month for MSPs with 100+ clients

### 10. Security and Compliance

**Access Control**
- Limit who can connect/disconnect integration
- Audit who accesses integration settings
- Use strong passwords for accounting platforms
- Enable multi-factor authentication

**Data Privacy**
- Ensure compliance with GDPR, CCPA, etc.
- Document data flows for privacy policies
- Understand where data is stored
- Client consent for data sync (if required by region)

**Compliance**
- SOC 2 compliance for accounting platforms
- Data encryption in transit and at rest
- Regular security audits
- Vendor risk assessments

---

## FAQ

**Q: Can I connect multiple accounting platforms simultaneously?**
A: No, Deskwise supports one accounting integration at a time. You can switch platforms by disconnecting and reconnecting.

**Q: What happens to historical data when I disconnect?**
A: All data remains in both systems. Only future syncs are stopped. You can reconnect later and resume syncing.

**Q: Can I sync historical invoices from before I connected the integration?**
A: Yes, but use caution. Select historical invoices and use manual sync. Verify dates and numbers don't conflict.

**Q: Will syncing create duplicate invoices?**
A: No, if invoices are already linked. Deskwise tracks external IDs to prevent duplicates. Only unlinked invoices will create new records in accounting.

**Q: How do I handle refunds?**
A: Create a credit note in your accounting platform. It will sync to Deskwise and be applied to the original invoice.

**Q: Can I customize which invoice fields sync?**
A: Field mapping is predefined, but you can use custom fields and notes for additional data. Contact support for advanced customization.

**Q: What if my client is in multiple currencies?**
A: Each invoice has a currency. Ensure your accounting platform supports multi-currency. Deskwise syncs the currency code with each invoice.

**Q: Do time entries sync?**
A: Time entries themselves don't sync. When you convert time entries to an invoice, the invoice line items sync to accounting.

**Q: Can I sync projects/jobs?**
A: Not in the current version. Projects in Deskwise are for task management. Link invoices to projects for financial tracking.

**Q: How long are sync logs retained?**
A: 90 days for all accounts. Premium accounts have 12-month retention. Export logs for longer-term storage if needed.

**Q: Is there an API for custom integrations?**
A: Yes, Deskwise provides a REST API. Contact support for API documentation and developer access.

**Q: What happens if I exceed my accounting platform's API limits?**
A: Deskwise will automatically throttle requests and retry later. You'll see "Rate limited" in sync status. Sync will complete once limits reset (usually hourly).

---

## Conclusion

Accounting integrations transform how MSPs manage billing by eliminating double data entry, reducing errors, and providing real-time financial visibility.

**Key Takeaways:**
- Choose the right platform and sync direction for your workflow
- Invest time in proper initial setup and mapping
- Train your team on best practices
- Monitor sync status regularly
- Maintain clean data for best results

**Next Steps:**
1. Review your current accounting platform and plan
2. Follow the setup guide for your platform (Xero, QuickBooks, or MYOB)
3. Perform initial sync and test thoroughly
4. Train your team
5. Enable auto-sync and monitor for first 30 days
6. Schedule regular audits and optimizations

For additional help, visit our Knowledge Base or contact support at integrations@deskwise.com.

---

*Last Updated: January 2025*
*Version: 1.0*
