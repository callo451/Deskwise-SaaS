# MSP CRM Module - Implementation Guide

## ✅ Completed

### 1. Data Models (COMPLETE)
All CRM types have been defined in `src/lib/types.ts` (lines 2562-3001):

- **Client Management**:
  - `ClientContact` - Contact persons at client organizations
  - `ClientAgreement` - Service agreements and SLAs
  - `Client` - Main client entity with hierarchy support

- **Quoting**:
  - `QuoteLineItem` - Individual quote line items
  - `Quote` - Main quote entity
  - `QuoteTemplate` - Reusable quote templates

- **Billing**:
  - `InvoiceLineItem` - Invoice line items
  - `Payment` - Payment records
  - `Invoice` - Main invoice entity
  - `RecurringBillingSchedule` - Automated recurring billing

### 2. Conditional Sidebar (COMPLETE)
The sidebar now conditionally shows the "Business" section only for MSP organizations:

- Updated `src/components/layout/Sidebar.tsx`
- Added `mspOnly` flag to navigation categories
- Updated `src/lib/auth.ts` to include `orgMode` in session
- Business section only visible when `orgMode === 'msp'`

### 3. Client Management Module (COMPLETE ✅)

**Backend Service** (`src/lib/services/clients.ts`):
- Complete ClientService with all CRUD operations
- Client metrics and aggregation
- Contact management (add, update, remove)
- Agreement management (create, update, delete)
- Health score calculation
- Child client retrieval

**API Routes**:
- ✅ `src/app/api/clients/route.ts` - GET (list), POST (create)
- ✅ `src/app/api/clients/[id]/route.ts` - GET, PUT, DELETE
- ✅ `src/app/api/clients/[id]/contacts/route.ts` - POST, PUT, DELETE contacts
- ✅ `src/app/api/clients/[id]/agreements/route.ts` - GET, POST agreements
- ✅ `src/app/api/clients/agreements/[agreementId]/route.ts` - PUT, DELETE
- ✅ `src/app/api/clients/stats/route.ts` - GET metrics

**Frontend Pages**:
- ✅ `src/app/(app)/clients/page.tsx` - Clients list with metrics, search, filtering
- ✅ `src/app/(app)/clients/[id]/page.tsx` - Client details with tabbed interface
- ✅ `src/components/clients/client-form-modal.tsx` - Multi-step client form

### 4. Quoting Module (COMPLETE ✅)

**Backend Service** (`src/lib/services/quotes.ts`):
- Complete QuoteService with lifecycle management
- Quote number generation
- Automatic totals calculation
- Quote cloning and versioning
- Status transitions (draft → sent → accepted → converted)
- Quote metrics and analytics
- Template management

**API Routes**:
- ✅ `src/app/api/quotes/route.ts` - GET (list), POST (create)
- ✅ `src/app/api/quotes/[id]/route.ts` - GET, PUT, DELETE
- ✅ `src/app/api/quotes/[id]/send/route.ts` - POST (mark as sent)
- ✅ `src/app/api/quotes/[id]/accept/route.ts` - POST (mark as accepted)
- ✅ `src/app/api/quotes/[id]/decline/route.ts` - POST (mark as declined)
- ✅ `src/app/api/quotes/[id]/convert/route.ts` - POST (convert to invoice)
- ✅ `src/app/api/quotes/[id]/clone/route.ts` - POST (create new version)
- ✅ `src/app/api/quotes/stats/route.ts` - GET metrics
- ✅ `src/app/api/quotes/templates/route.ts` - GET, POST templates

**Frontend Pages**:
- ✅ `src/app/(app)/quotes/page.tsx` - Quotes list with metrics, acceptance rate

### 5. Billing Module (COMPLETE ✅)

**Backend Service** (`src/lib/services/invoices.ts`):
- Complete InvoiceService with lifecycle management
- Invoice number generation (INV-YYYY-####)
- Automatic totals calculation
- Payment tracking and recording
- Invoice status management (draft → sent → paid/partial/overdue)
- Void invoice support
- Aging report calculation (current, 30, 60, 90, 90+ days)
- Recurring billing schedule management
- Automatic recurring invoice generation
- Create invoice from quote

**API Routes**:
- ✅ `src/app/api/billing/invoices/route.ts` - GET (list), POST (create)
- ✅ `src/app/api/billing/invoices/[id]/route.ts` - GET, PUT, DELETE
- ✅ `src/app/api/billing/invoices/[id]/send/route.ts` - POST (mark as sent)
- ✅ `src/app/api/billing/invoices/[id]/payments/route.ts` - POST (record payment)
- ✅ `src/app/api/billing/invoices/[id]/void/route.ts` - POST (void invoice)
- ✅ `src/app/api/billing/stats/route.ts` - GET metrics
- ✅ `src/app/api/billing/aging/route.ts` - GET aging report
- ✅ `src/app/api/billing/recurring/route.ts` - GET, POST recurring schedules

**Frontend Pages**:
- ✅ `src/app/(app)/billing/page.tsx` - Invoices list with metrics, aging report, collection tracking

## 🚧 Implementation Roadmap

### Phase 1: Client Management Module

#### Backend Implementation

**1. Create Client Service** (`src/lib/services/clients.ts`)

```typescript
import { clientPromise } from '../mongodb'
import { Client, ClientContact, ClientAgreement } from '../types'
import { ObjectId } from 'mongodb'

export class ClientService {
  /**
   * Get all clients for an organization
   */
  static async getClients(orgId: string, filters?: {
    status?: string
    parentClientId?: string
    search?: string
  }) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const query: any = { orgId }

    if (filters?.status) {
      query.status = filters.status
    }

    if (filters?.parentClientId) {
      query.parentClientId = filters.parentClientId
    }

    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
      ]
    }

    const clients = await db.collection('clients')
      .find(query)
      .sort({ name: 1 })
      .toArray()

    return clients
  }

  /**
   * Get client by ID
   */
  static async getClientById(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    return await db.collection('clients').findOne({
      _id: new ObjectId(id),
      orgId
    })
  }

  /**
   * Create new client
   */
  static async createClient(orgId: string, data: Partial<Client>, createdBy: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const now = new Date()
    const newClient = {
      ...data,
      orgId,
      isParent: data.isParent || false,
      contacts: data.contacts || [],
      status: data.status || 'prospect',
      totalRevenue: 0,
      monthlyRecurringRevenue: 0,
      lifetimeValue: 0,
      healthScore: 50,
      currency: data.currency || 'USD',
      paymentTerms: data.paymentTerms || 30,
      taxRate: data.taxRate || 0,
      timezone: data.timezone || 'America/New_York',
      language: data.language || 'en',
      preferences: data.preferences || {
        portalEnabled: false,
        autoTicketCreation: true,
        billingNotifications: true,
      },
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
      createdBy,
      updatedBy: createdBy,
    }

    const result = await db.collection('clients').insertOne(newClient)
    return { ...newClient, _id: result.insertedId }
  }

  /**
   * Update client
   */
  static async updateClient(id: string, orgId: string, data: Partial<Client>, updatedBy: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('clients').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          ...data,
          updatedAt: new Date(),
          updatedBy,
        }
      },
      { returnDocument: 'after' }
    )

    return result.value
  }

  /**
   * Delete client
   */
  static async deleteClient(id: string, orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').deleteOne({
      _id: new ObjectId(id),
      orgId
    })
  }

  /**
   * Get client metrics
   */
  static async getClientMetrics(orgId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    const metrics = await db.collection('clients').aggregate([
      { $match: { orgId } },
      {
        $group: {
          _id: null,
          totalClients: { $sum: 1 },
          activeClients: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalMRR: { $sum: '$monthlyRecurringRevenue' },
          totalRevenue: { $sum: '$totalRevenue' },
          averageHealthScore: { $avg: '$healthScore' },
        }
      }
    ]).toArray()

    return metrics[0] || {
      totalClients: 0,
      activeClients: 0,
      totalMRR: 0,
      totalRevenue: 0,
      averageHealthScore: 0,
    }
  }

  /**
   * Add contact to client
   */
  static async addContact(clientId: string, orgId: string, contact: ClientContact) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), orgId },
      {
        $push: { contacts: contact },
        $set: { updatedAt: new Date() }
      }
    )
  }

  /**
   * Update contact
   */
  static async updateContact(clientId: string, orgId: string, contactId: string, contact: Partial<ClientContact>) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').updateOne(
      {
        _id: new ObjectId(clientId),
        orgId,
        'contacts.id': contactId
      },
      {
        $set: {
          'contacts.$': { ...contact, updatedAt: new Date() },
          updatedAt: new Date()
        }
      }
    )
  }

  /**
   * Remove contact
   */
  static async removeContact(clientId: string, orgId: string, contactId: string) {
    const client = await clientPromise
    const db = client.db('deskwise')

    await db.collection('clients').updateOne(
      { _id: new ObjectId(clientId), orgId },
      {
        $pull: { contacts: { id: contactId } },
        $set: { updatedAt: new Date() }
      }
    )
  }
}
```

**2. Create API Routes**

Create the following API route files:

- `src/app/api/clients/route.ts` - GET (list), POST (create)
- `src/app/api/clients/[id]/route.ts` - GET, PUT, DELETE
- `src/app/api/clients/[id]/contacts/route.ts` - Manage contacts
- `src/app/api/clients/stats/route.ts` - Get client metrics

**Example: `src/app/api/clients/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ClientService } from '@/lib/services/clients'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json({ error: 'Feature only available for MSP organizations' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const filters = {
    status: searchParams.get('status') || undefined,
    search: searchParams.get('search') || undefined,
  }

  try {
    const clients = await ClientService.getClients(session.user.orgId, filters)
    return NextResponse.json({ success: true, data: clients })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch clients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if org is MSP mode
  if ((session.user as any).orgMode !== 'msp') {
    return NextResponse.json({ error: 'Feature only available for MSP organizations' }, { status: 403 })
  }

  try {
    const data = await request.json()
    const client = await ClientService.createClient(
      session.user.orgId,
      data,
      session.user.id
    )

    return NextResponse.json({ success: true, data: client }, { status: 201 })
  } catch (error) {
    console.error('Create client error:', error)
    return NextResponse.json({ success: false, error: 'Failed to create client' }, { status: 500 })
  }
}
```

#### Frontend Implementation

**1. Clients List Page** (`src/app/(app)/clients/page.tsx`)

Create a page that displays:
- List of clients in table/card view
- Search and filter capabilities
- Quick stats cards (total clients, active, MRR, etc.)
- "Add Client" button

**2. Client Details Page** (`src/app/(app)/clients/[id]/page.tsx`)

Create a tabbed interface with:
- Overview tab: Client info, health score, key metrics
- Contacts tab: List and manage contacts
- Agreements tab: Service agreements and SLAs
- Billing tab: Billing history and settings
- Tickets tab: Related tickets
- Assets tab: Related assets

**3. Client Modal Component** (`src/components/clients/client-modal.tsx`)

Multi-step wizard for creating/editing clients.

### Phase 2: Quoting Module

Follow similar pattern as Client Management:

1. Create `QuoteService` in `src/lib/services/quotes.ts`
2. Create API routes in `src/app/api/quotes/`
3. Create UI pages in `src/app/(app)/quotes/`

**Key Features**:
- Visual quote builder with line items
- Quote templates
- PDF generation
- Email sending
- Approval workflow
- Convert to invoice

### Phase 3: Billing Module

1. Create `InvoiceService` in `src/lib/services/invoices.ts`
2. Create API routes in `src/app/api/billing/`
3. Create UI pages in `src/app/(app)/billing/`

**Key Features**:
- Invoice generation (manual and from quotes)
- Recurring billing schedules
- Payment tracking
- Aging reports
- Email invoices
- PDF generation
- Credit notes

## Database Indexes

Create indexes for optimal performance:

```javascript
// Clients
db.clients.createIndex({ orgId: 1, status: 1 })
db.clients.createIndex({ orgId: 1, name: 1 })
db.clients.createIndex({ orgId: 1, parentClientId: 1 })
db.clients.createIndex({ orgId: 1, 'contacts.email': 1 })

// Quotes
db.quotes.createIndex({ orgId: 1, status: 1 })
db.quotes.createIndex({ orgId: 1, clientId: 1 })
db.quotes.createIndex({ orgId: 1, quoteNumber: 1 }, { unique: true })
db.quotes.createIndex({ orgId: 1, validUntil: 1 })

// Invoices
db.invoices.createIndex({ orgId: 1, status: 1 })
db.invoices.createIndex({ orgId: 1, clientId: 1 })
db.invoices.createIndex({ orgId: 1, invoiceNumber: 1 }, { unique: true })
db.invoices.createIndex({ orgId: 1, dueDate: 1 })
db.invoices.createIndex({ orgId: 1, isRecurring: 1 })

// Recurring Billing Schedules
db.recurring_billing_schedules.createIndex({ orgId: 1, status: 1 })
db.recurring_billing_schedules.createIndex({ orgId: 1, clientId: 1 })
db.recurring_billing_schedules.createIndex({ orgId: 1, nextInvoiceDate: 1 })
```

## Integration Points

### 1. Ticket System Integration
- Link tickets to clients
- Auto-create tickets from client portal
- Track time spent per client
- Client-specific SLA targets

### 2. Project Integration
- Link projects to clients
- Project billing to invoices
- Budget tracking per client

### 3. Asset Integration
- Assign assets to clients
- Track assets in quotes/invoices
- Asset-based billing

### 4. Time Tracking Integration
- Convert billable hours to invoices
- Track time per client/project
- Hourly rate billing

## Security & Permissions

All CRM features should check for:
1. MSP mode: `(session.user as any).orgMode === 'msp'`
2. Permissions: Use RBAC for fine-grained control
3. Data isolation: Always filter by `orgId`

Recommended permissions:
- `clients.view`
- `clients.create`
- `clients.edit`
- `clients.delete`
- `quotes.view`
- `quotes.create`
- `quotes.send`
- `quotes.approve`
- `billing.view`
- `billing.create`
- `billing.manage_payments`
- `billing.view_financials`

## Testing Checklist

- [ ] Create MSP organization during signup
- [ ] Verify Business section appears in sidebar
- [ ] Create internal IT organization
- [ ] Verify Business section is hidden
- [ ] Test client CRUD operations
- [ ] Test quote creation and conversion
- [ ] Test invoice generation
- [ ] Test recurring billing
- [ ] Test payment tracking
- [ ] Test client portal access

## Next Steps

1. **Immediate**: Implement Client Management module (highest priority)
2. **Next**: Implement Quoting module
3. **Then**: Implement Billing module
4. **Finally**: Add advanced features (PDF generation, email integration, payment gateway integration)

## Resources

- ConnectWise PSA: https://www.connectwise.com/
- Autotask PSA: https://www.datto.com/products/autotask-psa
- Kaseya BMS: https://www.kaseya.com/products/bms/
- FreshBooks: https://www.freshbooks.com/
- QuickBooks: https://quickbooks.intuit.com/

## Questions?

Refer to the comprehensive type definitions in `src/lib/types.ts` (lines 2562-3001) for detailed data structures and relationships.
