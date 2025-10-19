# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Type checking**: `npm run typecheck`
- **Install dependencies**: `npm install`

### AI Development Commands
- **Start Genkit development**: `npm run genkit:dev`
- **Start Genkit with watch mode**: `npm run genkit:watch`

## Architecture Overview

This is a Next.js 15 application for **Deskwise**, an AI-powered Professional Services Automation (PSA) platform designed for Managed Service Providers (MSPs) and IT teams.

### Technology Stack
- **Frontend**: Next.js 15 with React 18, TypeScript, App Router
- **Build Tool**: Turbopack (for development)
- **AI Integration**: Google Genkit with Gemini 2.0 Flash model
- **UI Components**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS with custom design system
- **Database**: MongoDB Atlas with Node.js driver
- **Authentication**: Custom WorkOS User Management API integration with split-screen UI
- **Deployment**: Firebase App Hosting

### Project Structure

#### App Router Structure
- `src/app/(app)/`: Main application pages (dashboard, tickets, assets, etc.)
- `src/app/(marketing)/`: Marketing website pages (landing, pricing, features)
- `src/app/portal/`: Client portal interface
- Layout groups: `(app)`, `(marketing)`, `(portal)` with dedicated layouts

#### Key Directories
- `src/components/`: Reusable UI components organized by feature
- `src/lib/`: Utilities, types, placeholder data, and MongoDB connection
- `src/ai/`: Google Genkit AI integration and configuration
- `src/components/ui/`: Base UI components (shadcn/ui style)

### Core Features and Modules

The platform supports both **MSP mode** (multi-tenant) and **Internal IT mode** (single organization):

#### Core Modules (Available in both modes)
- Dashboard with personal/company views
- Tickets (IT service requests)
- Incidents (service disruptions)
- Projects (task management)
- Scheduling (technician calendar)
- Change Management (IT change approval)
- Assets (device/infrastructure tracking)
- Inventory (stock management)
- Knowledge Base (internal/public articles)
- Settings (configuration)

#### MSP-Specific Modules
- Clients (customer management)
- Contacts (client contact management)
- Quoting (sales proposals)
- Billing (contracts and recurring billing)
- Service Catalogue (service offerings)

### Key Architecture Patterns

#### Component Organization
- Feature-based component grouping (`components/layout/`, `components/ai/`, etc.)
- Shared UI components in `components/ui/`
- Page components follow Next.js App Router conventions

#### Type System
- Comprehensive TypeScript types in `src/lib/types.ts`
- Covers all entities: Tickets, Assets, Clients, Projects, etc.
- Includes complex types like permissions, SLA policies, and custom fields

#### AI Integration
- Google Genkit configured in `src/ai/genkit.ts`
- Uses Gemini 2.0 Flash model
- AI assistant component for ticket resolution and content generation

#### Design System
- Custom Tailwind configuration with brand colors
- Radix UI components for accessibility
- Consistent component patterns across the application
- Theme support (light/dark mode)

#### Data Management
- **MongoDB Atlas**: Connected via Node.js driver (`src/lib/mongodb.ts`)
- **Connection String**: Configured in `.env.local` environment file
- **Placeholder Data**: Currently uses placeholder data (`src/lib/placeholder-data.ts`) for development
- **Database Integration**: Ready for production data migration from placeholder to MongoDB collections
- **Authentication**: Custom WorkOS User Management API with secure HTTP-only cookies and split-screen authentication UI

### Development Notes

#### Page Routing
- Uses Next.js App Router with TypeScript
- Dynamic routes: `[id]/page.tsx` for detail views
- Nested routes for complex features
- Route groups for different application sections

#### Styling Approach
- Tailwind CSS with custom configuration
- Component-level styling with consistent patterns
- Responsive design with mobile-first approach
- Inter font family via Google Fonts

#### State Management
- React hooks and local state
- Context planned for authentication and global state
- No external state management library currently used

#### Performance
- Turbopack for fast development builds
- Next.js optimizations (Image, Link components)
- Component lazy loading where appropriate

## Environment Configuration

Required environment variables (in `.env.local`):
- `MONGODB_URI`: MongoDB Atlas connection string for database access
- `WORKOS_API_KEY`: WorkOS API key for authentication
- `WORKOS_CLIENT_ID`: WorkOS client ID for your application
- `WORKOS_COOKIE_PASSWORD`: 32-character random string for cookie encryption
- `WORKOS_REDIRECT_URI`: Authentication callback URL (e.g., http://localhost:9002/auth/callback)
- `NEXTAUTH_SECRET`: NextAuth.js secret for JWT encryption (32-character random string)
- `NEXTAUTH_URL`: Base URL for NextAuth.js (e.g., http://localhost:9002)
- `CLIENT_PORTAL_JWT_SECRET`: JWT secret for client portal session management (optional, defaults to fallback)

## Database Usage

Import the MongoDB client in your API routes or server components:

```typescript
import clientPromise from '@/lib/mongodb'

// Example usage
const client = await clientPromise
const db = client.db('deskwise')
const collection = db.collection('tickets')
```

## Implemented MongoDB Modules

### **Tickets Module** ✅ **Complete**
- **Database Collection**: `deskwise.tickets`
- **Service Layer**: `src/lib/services/tickets.ts`
- **API Routes**: `/api/tickets`, `/api/tickets/[id]`, `/api/tickets/stats`, `/api/tickets/personal-stats`
- **Features**: Full CRUD operations, filtering, statistics, SLA tracking
- **Components Updated**: Ticket list, creation form, detail view, dashboard metrics

### **Scheduling Module** ✅ **Complete with Advanced Features**
- **Database Collection**: `deskwise.schedule_items`
- **Service Layer**: `src/lib/services/scheduling.ts` (enhanced with advanced scheduling algorithms)
- **API Routes**: 
  - Basic: `/api/schedule`, `/api/schedule/[id]`, `/api/schedule/by-date`
  - Advanced: `/api/schedule/recurring`, `/api/schedule/workload`, `/api/schedule/optimal-slot`, `/api/schedule/conflicts`
- **Advanced Features**:
  - **Recurring Events**: Daily, weekly, monthly, yearly patterns with end dates/occurrences
  - **Conflict Detection**: Real-time scheduling conflict identification
  - **Workload Analysis**: Technician utilization tracking and visualization with charts
  - **Optimal Time Slot Finding**: AI-powered scheduling recommendations based on availability
  - **Appointment Creation**: Comprehensive dialog with recurring support and conflict checking
- **Components**: 
  - Enhanced scheduling page with workload analysis and appointment creation
  - `AppointmentCreationDialog`: Multi-tab interface for creating appointments with recurring support
  - `WorkloadAnalysisPanel`: Visual dashboard for technician capacity planning with charts
- **Extended Types**: `RecurrencePattern`, enhanced `ScheduleItem` with status, priority, skills, equipment

### **Dashboard Module** ✅ **Complete**
- **Real-time Integration**: Uses live ticket data from MongoDB
- **API Integration**: `/api/tickets/stats` and `/api/tickets/personal-stats`
- **Features**: Company and personal dashboards with live metrics
- **Components Updated**: Both personal and company dashboard views

### **Incidents Module** ✅ **Complete**
- **Database Collections**: `deskwise.incidents`, `deskwise.incident_updates`
- **Service Layer**: `src/lib/services/incidents.ts` with comprehensive incident management
- **API Routes**: 
  - Basic: `/api/incidents`, `/api/incidents/[id]`, `/api/incidents/stats`
  - Updates: `/api/incidents/[id]/updates`, `/api/incidents/[id]/updates/[updateId]`
  - Public: `/api/incidents/public` (for status page)
- **Features**:
  - **Incident Management**: Full CRUD operations with status tracking
  - **Status Updates**: Timeline-based incident communication
  - **Multi-tenant Support**: Client-specific and "All clients" incident scoping
  - **Public Status Page**: Customer-facing incident visibility
  - **Service Impact Tracking**: Multi-service incident categorization
  - **Audit Trail**: Complete incident lifecycle tracking
- **Components Updated**: 
  - Incidents list page with real-time data and delete functionality
  - New incident creation with MongoDB persistence
  - Public status page with live incident feed
- **Database Schema**: Comprehensive incident and update tracking with audit fields

### **Change Management Module** ✅ **Complete**
- **Database Collections**: `deskwise.change_requests`, `deskwise.change_approvals`
- **Service Layer**: `src/lib/services/change-management.ts` with comprehensive change request management
- **API Routes**: 
  - Basic: `/api/change-requests`, `/api/change-requests/[id]`, `/api/change-requests/stats`
  - Workflow: `/api/change-requests/[id]/approve`, `/api/change-requests/[id]/reject`
  - Advanced: `/api/change-requests/upcoming` (scheduled changes)
- **Features**:
  - **Change Request Management**: Full CRUD operations with status tracking
  - **Approval Workflow**: Approve/reject changes with audit trail
  - **Risk and Impact Assessment**: Multi-level risk and impact categorization
  - **Timeline Tracking**: Planned vs actual dates for change execution
  - **Associated Resources**: Link changes to assets and tickets
  - **Upcoming Changes**: View scheduled changes within specified timeframes
  - **Statistics Dashboard**: Comprehensive analytics on change patterns
- **Components Updated**: 
  - Change Management list page with real-time data and approval actions
  - New change request creation with MongoDB persistence
  - Change request detail view with live data
  - Integrated approval/rejection workflow
- **Database Schema**: Complete change request lifecycle tracking with approval audit trail

### **Projects Module** ✅ **Complete**
- **Database Collections**: `deskwise.projects`, `deskwise.project_tasks`, `deskwise.project_milestones`
- **Service Layer**: `src/lib/services/projects.ts` with comprehensive project management
- **API Routes**: 
  - Basic: `/api/projects`, `/api/projects/[id]`, `/api/projects/stats`
  - Tasks: `/api/projects/[id]/tasks`, `/api/projects/[id]/tasks/[taskId]`
  - Milestones: `/api/projects/[id]/milestones`, `/api/projects/[id]/milestones/[milestoneId]`
  - Advanced: `/api/projects/upcoming` (scheduled projects)
- **Features**:
  - **Project Management**: Full CRUD operations with status and progress tracking
  - **Task Management**: Create, update, delete tasks with status tracking and progress calculation
  - **Milestone Tracking**: Project milestone management with completion status
  - **Budget Tracking**: Total and used budget monitoring with utilization metrics
  - **Team Management**: Team member assignment and collaboration
  - **Progress Automation**: Automatic progress calculation based on task completion
  - **Timeline Management**: Start/end date tracking with actual vs planned dates
  - **Multi-client Support**: Project organization by client with filtering
  - **Statistics Dashboard**: Comprehensive project analytics and reporting
- **Components Updated**: 
  - Projects list page with real-time data, statistics, and delete functionality
  - New project creation with MongoDB persistence and form validation
  - Project detail view with live task and milestone management
  - Interactive task status updates with progress recalculation
- **Database Schema**: Complete project lifecycle tracking with tasks, milestones, and audit trails

### **Knowledge Base Module** ✅ **Complete with Chrome Extension Recorder**
- **Database Collections**: `deskwise.kb_articles`, `deskwise.kb_categories`, `deskwise.kb_tags`, `deskwise.recorder_screenshots`
- **Service Layer**: `src/lib/services/knowledge-base.ts` with comprehensive article management
- **API Routes**: 
  - Basic: `/api/knowledge-base`, `/api/knowledge-base/[id]`, `/api/knowledge-base/stats`
  - Management: `/api/knowledge-base/[id]/archive`, `/api/knowledge-base/categories`, `/api/knowledge-base/tags`
  - Advanced: `/api/knowledge-base/search` (full-text search with validation)
  - **Extension Integration**: `/api/knowledge-base/recorder`, `/api/knowledge-base/recorder/screenshot/[id]`
- **Features**:
  - **Article Management**: Full CRUD operations with versioning and audit trail
  - **Content Search**: Full-text search across title, content, category, and tags with MongoDB regex
  - **Category System**: Hierarchical category structure with automatic article counting
  - **Tag Management**: Tag system with usage statistics and color coding
  - **Archive Functionality**: Soft deletion with archive/restore capabilities
  - **View Tracking**: Article view count analytics and engagement metrics
  - **Access Control**: Visibility permissions by user group with inheritance
  - **Content Types**: Support for Internal and Public article classifications
  - **Advanced Tiptap Editor**: Rich text editor with tables, images, code blocks, AI generation dialog
  - **Markdown Support**: Full markdown rendering and parsing with TiptapViewer
  - **AI Integration**: AI-powered article generation using Google Genkit with toolbar integration
  - **🆕 Chrome Extension Recorder**: Auto-generate guides from browser interactions with smart cropping
- **Components Updated**: 
  - Knowledge Base list page with real-time search, filtering, archive, and delete functionality
  - Article detail view with glassmorphic auto-generated article banners and enhanced navigation
  - **Advanced Tiptap Editor**: Professional rich text editing with comprehensive toolbar and AI features
  - **TiptapViewer**: Enhanced markdown/HTML viewer with proper styling and image support
  - New article creation with MongoDB persistence, AI generation, and form validation
  - Hierarchical category tree with article counts and filtering
- **Database Schema**: Complete article lifecycle with versioning, categories, tags, screenshot storage, and analytics

### **Clients Module** ✅ **Complete**
- **Database Collection**: `deskwise.clients`
- **Service Layer**: `src/lib/services/clients.ts` with comprehensive client management
- **API Routes**: 
  - Basic: `/api/clients`, `/api/clients/[id]`, `/api/clients/stats`
  - Advanced: Search, filtering by status, and client metrics
- **Features**:
  - **Client Management**: Full CRUD operations with organization-scoped access
  - **Client Statistics**: Real-time dashboard metrics (total, active, onboarding, inactive)
  - **Contact Management**: Primary contact information and relationship tracking
  - **Counter Management**: Automatic tracking of associated tickets and contacts
  - **Search Functionality**: Find clients by name or industry with MongoDB regex
  - **Status Management**: Active, Inactive, and Onboarding status tracking
  - **Client Metrics**: Associated data counts (tickets, assets, contacts, contracts)
  - **Multi-tenant Security**: Complete organization-based data isolation
- **Components Updated**: 
  - Clients list page with real-time data, statistics dashboard, and delete functionality
  - Client detail view with live data loading and associated entity placeholders
  - Interactive client management with loading states and error handling
- **Database Schema**: Complete client lifecycle tracking with contact info, status, and audit trails

### **Quoting Module** ✅ **Complete**
- **Database Collections**: `deskwise.quotes`, `deskwise.service_catalogue`
- **Service Layer**: `src/lib/services/quotes.ts` with comprehensive quote and service catalogue management
- **API Routes**: 
  - Basic: `/api/quotes`, `/api/quotes/[id]`, `/api/quotes/stats`
  - Service Catalogue: `/api/service-catalogue`, `/api/service-catalogue/[id]`, `/api/service-catalogue/seed`
  - Advanced: Filtering by status, client, search functionality
- **Features**:
  - **Quote Management**: Full CRUD operations with organization-scoped access
  - **Quote Statistics**: Real-time dashboard metrics (total, draft, sent, accepted, rejected quotes)
  - **Conversion Tracking**: Quote conversion rates and acceptance analytics
  - **Line Item Management**: Dynamic quote line items with quantity and pricing
  - **Service Catalogue**: Comprehensive service offerings management (Fixed, Recurring, Hourly)
  - **Client Integration**: Seamless integration with clients module for quote-client relationships
  - **Status Workflow**: Draft → Sent → Accepted/Rejected status management
  - **Financial Tracking**: Total quote values, accepted values, and average quote metrics
  - **Multi-tenant Security**: Complete organization-based data isolation
  - **Service Seeding**: Default service catalogue for new organizations
- **Components Updated**: 
  - Quoting list page with real-time data, statistics dashboard, filtering, and delete functionality
  - New quote creation form with client integration, service catalogue, and dynamic line items
  - Live statistics dashboard with conversion metrics and financial tracking
- **Database Schema**: Complete quote lifecycle tracking with line items, service catalogue, and audit trails

### **Billing Module** ✅ **Complete**
- **Database Collections**: `deskwise.contracts`, `deskwise.time_logs`, `deskwise.sla_policies`, `deskwise.invoices`
- **Service Layer**: `src/lib/services/billing.ts` with comprehensive billing, contract, and invoice management
- **API Routes**: 
  - Basic: `/api/billing`, `/api/billing/[id]`, `/api/billing/stats`
  - Time Logs: `/api/billing/[id]/time-logs` with GET and POST for billable hours tracking
  - Invoices: `/api/billing/[id]/invoices` with GET and POST for automated invoice generation
  - SLA Policies: `/api/sla-policies` with comprehensive SLA target management
- **Features**:
  - **Contract Management**: Full CRUD operations with recurring billing and service definitions
  - **Monthly Recurring Revenue (MRR)**: Automatic MRR calculation from contract services
  - **Time Logging**: Billable hours tracking with technician, category, and work description
  - **Invoice Generation**: Automated invoice creation from contract services and billing periods
  - **SLA Policy Management**: Service level agreements with response/resolution time targets
  - **Contract Statistics**: Real-time dashboard metrics (MRR, active contracts, renewals, ARR)
  - **Client Integration**: Seamless contract-client relationships with quote-to-contract conversion
  - **Service Management**: Dynamic contract services with quantity, rate, and total calculations
  - **Multi-tenant Security**: Complete organization-based data isolation for all billing data
  - **Audit Trail**: Complete contract lifecycle tracking with creation and modification history
- **Components Created**: 
  - `ContractFormDialog`: Comprehensive contract creation/editing with services, terms, and client selection
  - `TimeLogFormDialog`: Billable hours logging with category, description, and billable status
  - `SLAPolicyFormDialog`: SLA policy creation with priority-based response targets
  - `QuoteToContractDialog`: Convert accepted quotes directly into service contracts
  - `InvoiceManagement`: Invoice generation, viewing, and billing period management
- **Components Updated**: 
  - Billing list page with real-time contract data, statistics dashboard, filtering, and delete functionality
  - Contract detail page with live data, time logs, invoice management, and contract editing
  - Full integration with clients module for contract-client relationships
- **Database Schema**: Complete billing lifecycle with contracts, time logs, SLA policies, invoices, and audit trails

### **Service Catalogue Module** ✅ **Complete**
- **Database Collection**: `deskwise.service_catalogue`
- **Service Layer**: `src/lib/services/service-catalogue.ts` with comprehensive service management and analytics
- **API Routes**: 
  - Basic: `/api/service-catalogue`, `/api/service-catalogue/[id]`, `/api/service-catalogue/stats`
  - Management: `/api/service-catalogue/categories`, `/api/service-catalogue/tags`, `/api/service-catalogue/[id]/restore`
  - Seeding: `/api/service-catalogue/seed` with default service catalogue
- **Features**:
  - **Service Management**: Full CRUD operations with soft delete and restore functionality
  - **Advanced Service Types**: Fixed, Recurring, and Hourly services with specific configurations
  - **Enhanced Metadata**: Tags, billing frequency, minimum hours, setup fees, and popularity tracking
  - **Category Management**: Dynamic category creation and organization with usage statistics
  - **Popularity Analytics**: Service usage tracking from quotes and contracts for recommendations
  - **Service Statistics**: Comprehensive analytics including revenue potential, usage patterns, and category breakdowns
  - **Search and Filtering**: Full-text search across names, descriptions, categories, and tags
  - **Multi-tenant Security**: Complete organization-based data isolation
  - **Integration Ready**: Seamless integration with quotes and billing modules
- **Components Created**: 
  - `ServiceForm`: Comprehensive service creation/editing with conditional fields based on service type
  - `ServiceStatsDashboard`: Analytics dashboard with charts, popular services, and category insights
  - Enhanced service list with filtering, popularity display, and tag management
- **Components Updated**: 
  - Service Catalogue list page with real-time data, advanced filtering, seeding capability, and delete/restore functionality
  - New service creation page with full form integration and validation
  - Complete replacement of placeholder data with MongoDB-powered functionality
- **Integration Features**:
  - **Quote Integration**: Service popularity tracking when used in quotes
  - **Billing Integration**: Service usage analytics from contract creation
  - **Service Selection**: Optimized service selection for quotes and contracts
- **Database Schema**: Complete service lifecycle with tags, popularity metrics, billing configurations, and audit trails

### **Inventory Management Module** ✅ **Complete**
- **Database Collections**: `deskwise.inventory`, `deskwise.stock_movements`, `deskwise.purchase_orders`
- **Service Layer**: `src/lib/services/inventory.ts` with comprehensive inventory and stock management
- **API Routes**: 
  - Basic: `/api/inventory`, `/api/inventory/[id]`, `/api/inventory/stats`
  - Management: `/api/inventory/[id]/restore`, `/api/inventory/[id]/adjust`, `/api/inventory/[id]/deploy`
  - Tracking: `/api/inventory/movements`, `/api/inventory/low-stock`, `/api/inventory/out-of-stock`
  - Analytics: `/api/inventory/categories`, `/api/inventory/locations`
  - Deployment: `/api/inventory/[id]/deploy-asset` (asset creation integration)
- **Features**:
  - **Inventory Management**: Full CRUD operations with soft delete and restore capabilities
  - **Stock Tracking**: Real-time quantity tracking with automatic movement logging
  - **Reorder Management**: Low stock alerts and reorder point monitoring
  - **Purchase Tracking**: Purchase order integration with vendor and cost tracking
  - **Deployment Workflow**: Deploy inventory items as assets with automatic asset creation
  - **Serial Number Tracking**: Individual item tracking for high-value equipment
  - **Warranty Management**: Warranty information tracking with expiration alerts
  - **Multi-Location Support**: Location-based inventory organization and tracking
  - **Category Analytics**: Category-based statistics and stock analysis
  - **Owner Management**: MSP vs client-owned inventory differentiation
  - **Cost Tracking**: Unit cost and total value calculations with financial analytics
  - **Stock Movements**: Comprehensive audit trail for all inventory changes
- **Components Created**: 
  - `InventoryForm`: Comprehensive inventory creation/editing with all tracking fields
  - `InventoryStatsDashboard`: Analytics dashboard with charts, alerts, and stock metrics
  - Inventory list page with real-time API integration, filtering, and stock alerts
  - Inventory detail page with stock adjustment, deployment, and notes management
  - New inventory creation page with form integration
- **Integration Features**:
  - **Asset Integration**: Seamless deployment of inventory items as trackable assets
  - **Purchase Order Management**: Future purchase order workflow foundation
  - **Supplier Tracking**: Supplier information and SKU cross-referencing
- **Multi-Tenant Features**: Complete organization-scoped data isolation and security
- **Database Schema**: Comprehensive inventory lifecycle with stock movements, purchase tracking, and deployment history

## Database Collections

### **Core Collections**
- `tickets`: Service requests and issues with full activity tracking
- `schedule_items`: Technician scheduling and calendar appointments
- `incidents`: Major service disruptions and outage management
- `incident_updates`: Timeline updates for incident communication
- `change_requests`: IT change management and approval workflow
- `change_approvals`: Change request approval audit trail
- `projects`: Project management with budget and timeline tracking
- `project_tasks`: Individual project tasks with dependencies and progress
- `project_milestones`: Project milestones and deliverable tracking
- `articles`: Knowledge base articles with content, metadata, and access control
- `categories`: Hierarchical category structure for article organization
- `tags`: Tag system for article classification and search
- `assets`: IT assets with comprehensive tracking and monitoring data
- `asset_maintenance`: Asset maintenance records and scheduling
- `inventory`: Inventory items with stock tracking, purchase info, and deployment history
- `stock_movements`: Stock movement audit trail for inventory changes
- `purchase_orders`: Purchase order management for inventory procurement
- `clients`: Client organizations with contact info, status, and relationship tracking
- `quotes`: Sales quotes with line items, status tracking, and client relationships
- `service_catalogue`: Service offerings with pricing, categorization, tags, and popularity tracking
- `contracts`: Service contracts with recurring billing, client relationships, and MRR tracking
- `time_logs`: Billable hours tracking with technician, contract, and work categorization
- `sla_policies`: Service level agreements with priority-based response and resolution targets
- `invoices`: Generated invoices from contracts with billing periods and line items

### **Collection Structure**
All collections include:
- Standard document structure with `_id` as primary key
- `createdAt` and `updatedAt` timestamps for audit trails
- Optimized indexing for efficient queries
- Comprehensive field validation

## API Endpoints

### **Tickets API**
- `GET/POST /api/tickets` - List and create tickets
- `GET/PUT/DELETE /api/tickets/[id]` - Individual ticket operations
- `GET /api/tickets/stats` - Company-wide ticket statistics
- `GET /api/tickets/personal-stats` - User-specific ticket metrics

### **Scheduling API**
- `GET/POST /api/schedule` - List and create schedule items
- `GET/PUT/DELETE /api/schedule/[id]` - Individual schedule operations
- `GET /api/schedule/by-date` - Date-specific schedule queries
- `POST /api/schedule/recurring` - Create recurring appointment series
- `GET /api/schedule/workload` - Technician workload analysis
- `POST /api/schedule/optimal-slot` - Find optimal available time slots
- `GET /api/schedule/conflicts` - Check for scheduling conflicts

### **Change Management API**
- `GET/POST /api/change-requests` - List and create change requests
- `GET/PUT/DELETE /api/change-requests/[id]` - Individual change request operations
- `POST /api/change-requests/[id]/approve` - Approve change request
- `POST /api/change-requests/[id]/reject` - Reject change request
- `GET /api/change-requests/stats` - Change request statistics
- `GET /api/change-requests/upcoming` - Upcoming scheduled changes

### **Projects API**
- `GET/POST /api/projects` - List and create projects
- `GET/PUT/DELETE /api/projects/[id]` - Individual project operations
- `GET/POST /api/projects/[id]/tasks` - Project task management
- `PUT/DELETE /api/projects/[id]/tasks/[taskId]` - Individual task operations
- `GET/POST /api/projects/[id]/milestones` - Project milestone management
- `PUT/DELETE /api/projects/[id]/milestones/[milestoneId]` - Individual milestone operations
- `GET /api/projects/stats` - Project statistics and analytics
- `GET /api/projects/upcoming` - Upcoming scheduled projects

### **Knowledge Base API**
- `GET/POST /api/knowledge-base` - List and create knowledge base articles
- `GET/PUT/DELETE /api/knowledge-base/[id]` - Individual article operations
- `POST /api/knowledge-base/[id]/archive` - Archive article (soft delete)
- `GET /api/knowledge-base/search` - Full-text search with validation
- `GET/POST /api/knowledge-base/categories` - Category management
- `GET/POST /api/knowledge-base/tags` - Tag management and creation
- `GET /api/knowledge-base/stats` - Knowledge base statistics and analytics
- `POST /api/knowledge-base/recorder` - Create articles from Chrome extension recordings with screenshot processing
- `GET /api/knowledge-base/recorder` - List recorded sessions
- `GET /api/knowledge-base/recorder/screenshot/[id]` - Serve cropped screenshots with authentication

### **Clients API**
- `GET/POST /api/clients` - List and create clients
- `GET/PUT/DELETE /api/clients/[id]` - Individual client operations
- `GET /api/clients/stats` - Client statistics and analytics

### **Quoting API**
- `GET/POST /api/quotes` - List and create quotes with filtering (status, client)
- `GET/PUT/DELETE /api/quotes/[id]` - Individual quote operations
- `GET /api/quotes/stats` - Quote statistics and conversion metrics

### **Service Catalogue API**
- `GET/POST /api/service-catalogue` - List and create service catalogue items with filtering (category, type, search)
- `GET/PUT/DELETE /api/service-catalogue/[id]` - Individual service operations
- `GET /api/service-catalogue/stats` - Service catalogue statistics and analytics
- `GET /api/service-catalogue/categories` - List service categories
- `GET /api/service-catalogue/tags` - List service tags
- `POST /api/service-catalogue/[id]/restore` - Restore deleted service
- `POST /api/service-catalogue/seed` - Seed default services for organization

### **Billing API**
- `GET/POST /api/billing` - List and create contracts with filtering (status, client)
- `GET/PUT/DELETE /api/billing/[id]` - Individual contract operations
- `GET /api/billing/stats` - Contract statistics and MRR analytics
- `GET/POST /api/billing/[id]/time-logs` - Time log management for billable hours
- `GET/POST /api/billing/[id]/invoices` - Invoice generation and retrieval
- `GET/POST /api/sla-policies` - SLA policy management with response targets

## Multi-Tenancy Implementation ✅ **COMPLETE**

All implemented modules now feature **comprehensive multi-tenancy** for B2B SaaS deployment:

### **Multi-Tenant Architecture**
- **Organization ID (`orgId`)**: All database documents include organization identification
- **Data Isolation**: Complete separation of data between organizations
- **Security**: No cross-organization data access possible
- **Performance**: Optimized queries with organization-scoped indexes

### **Multi-Tenant Service Layer Pattern**
All service methods follow this pattern:
```typescript
// Example: Organization-first parameter pattern
static async getAll(orgId: string, filters?: FilterType): Promise<EntityType[]>
static async getById(id: string, orgId: string): Promise<EntityType | null>
static async create(orgId: string, data: CreateType, createdBy: string): Promise<EntityType>
```

### **Database Schema Multi-Tenancy**
All collections include:
- `orgId: string` field for organization identification
- Compound indexes on `(orgId, createdAt)`, `(orgId, status)`, etc.
- Organization-scoped aggregation pipelines with `{ $match: { orgId } }`

### **Multi-Tenant Features Implemented**
- ✅ **Tickets**: Organization-scoped ticket management and SLA tracking
- ✅ **Scheduling**: Organization-scoped technician schedules and workload analysis
- ✅ **Incidents**: Organization-scoped incident management and public status pages
- ✅ **Change Management**: Organization-scoped change requests and approval workflows
- ✅ **Projects**: Organization-scoped project, task, and milestone management
- ✅ **Knowledge Base**: Organization-scoped articles, categories, and tags
- ✅ **Clients**: Organization-scoped client management with contact tracking
- ✅ **Quoting**: Organization-scoped quote management with service catalogue integration
- ✅ **Billing**: Organization-scoped contract management with MRR tracking, time logs, and invoice generation
- ✅ **Service Catalogue**: Organization-scoped service management with popularity tracking and analytics

## Authentication Implementation ✅ **COMPLETE - Custom WorkOS Integration**

### **Custom WorkOS User Management API Integration**
- **Authentication Service**: Custom `WorkOSAuthService` class in `src/lib/services/auth-service.ts`
- **Direct API Integration**: Uses WorkOS User Management API instead of hosted AuthKit UI
- **Custom Authentication Context**: `src/contexts/auth-context.tsx` with React Context for state management
- **HTTP-Only Cookies**: Secure session management with automatic token refresh
- **Custom Middleware**: `middleware.ts` with custom token verification and route protection

### **Split-Screen Authentication UI** ✅ **NEW**
- **Modern Design**: Split-screen layout with branded left panel and authentication form on right
- **Branded Experience**: Animated Deskwise logo, taglines, and feature icons on left side
- **Enhanced Component**: `src/components/ui/enhanced-sign-in.tsx` with comprehensive features:
  - **Social Login**: Single-row layout with Google, GitHub, Apple icon buttons
  - **Dynamic Headers**: Context-aware titles ("Welcome back" vs "Create account")
  - **Password Strength**: Real-time password strength indicators with visual feedback
  - **Responsive Design**: Mobile-friendly with logo and form only on smaller screens
  - **Smooth Animations**: Framer Motion animations for professional user experience

### **Authentication Architecture**
- **Service Layer**: `src/lib/services/auth-service.ts` - WorkOS User Management integration
- **API Routes**: 
  - `POST /api/auth/custom/signin` - User authentication with secure cookie handling
  - `POST /api/auth/custom/signup` - User registration with email verification
  - `GET /api/auth/custom/me` - Current user profile with organization context
  - `POST /api/auth/custom/signout` - Secure logout with cookie clearing
- **Pages**: 
  - `/auth/signin` - Split-screen sign-in with branded experience
  - `/auth/signup` - Split-screen registration with terms of service
- **Context Provider**: React Context wrapping entire application for authentication state

### **Multi-Tenant Authentication**
- **Organization Context**: All authenticated users have organization ID (`orgId`) context
- **API Authentication**: All API routes extract `orgId` from custom authentication context
- **Session Management**: HTTP-only cookies with automatic refresh token handling
- **Route Protection**: Custom middleware with authentication state management

### **Security Features**
- **Enterprise-Grade Security**: WorkOS backend with custom frontend implementation
- **Secure Cookies**: HTTP-only, secure, SameSite cookie configuration
- **Token Refresh**: Automatic access token refresh with refresh token rotation
- **Organization Isolation**: Complete multi-tenant data separation
- **CSRF Protection**: Secure cookie handling prevents cross-site request forgery

### **Environment Configuration**
Required environment variables in `.env.local`:
```bash
# WorkOS API Integration
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# Custom Authentication (Legacy AuthKit variables still supported)
WORKOS_COOKIE_PASSWORD=your_32_char_random_string
WORKOS_REDIRECT_URI=http://localhost:9002/auth/callback
```

### **Migration from AuthKit to Custom Implementation** ✅ **COMPLETE**
- **AuthKit Removal**: Completely migrated from `@workos-inc/authkit-nextjs` to custom implementation
- **Component Updates**: All components now use custom `useAuth` hook from `@/contexts/auth-context`
- **Import Fixes**: Resolved all "AuthKitProvider" errors by updating import statements:
  - `src/app/(app)/dashboard/page.tsx` - Fixed useAuth import
  - `src/app/(app)/settings/users/page.tsx` - Fixed useAuth import  
  - `src/app/(app)/settings/company/page.tsx` - Fixed useAuth import
- **Build Cache Cleared**: Removed stale Next.js build cache to ensure clean implementation
- **Backward Compatibility**: Maintains same authentication interface while using custom backend

## Next Steps and Implementation Status

### **✅ Recently Completed**
- **Custom WorkOS Authentication**: Complete migration from AuthKit to custom WorkOS User Management API implementation
- **Split-Screen Authentication UI**: Modern branded authentication experience with animated Deskwise branding
- **Enhanced Security**: HTTP-only cookies, automatic token refresh, and secure session management
- **Component Migration**: Fixed all WorkOS AuthKit import issues and updated to custom authentication context
- **Build Optimization**: Cleared Next.js cache and resolved authentication provider errors

### **🔄 In Progress**
- **Database Optimization**: Creating compound indexes for multi-tenant query optimization

### **📋 Next Steps**
1. **Database Performance Optimization** (High Priority)
   - Create compound indexes: `(orgId, createdAt)`, `(orgId, status)`, etc.
   - Optimize aggregation pipelines for multi-tenant queries
   - Test query performance across organizations

2. **WorkOS Organization Management** (Medium Priority)
   - Configure WorkOS organizations for true multi-tenancy
   - Implement organization switching UI
   - Add organization member management

3. **Frontend Components** (Lower Priority)
   - Update remaining components to handle organization context
   - Add organization-scoped navigation
   - Implement organization dashboard

### **⏸️ Pending Implementation**
**Remaining Modules**: Other modules (Assets, Clients, Inventory, etc.) still use placeholder data and need MongoDB integration following the established multi-tenant patterns.

### **✅ Recent Accomplishments**
- **Custom Authentication System**: Complete WorkOS User Management API integration with split-screen UI
- **Modern Authentication UX**: Professional branded authentication experience with Deskwise branding
- **Enhanced Security**: HTTP-only cookies, automatic token refresh, and CSRF protection
- **Multi-Tenancy Security**: Implemented comprehensive data isolation across all core modules
- **Service Layer Refactoring**: All core modules now enforce organization boundaries with custom authentication
- **Component Migration**: Successfully updated all components from AuthKit to custom authentication context
- **Build Optimization**: Resolved all authentication provider errors and cleared build cache

## Chrome Extension: Deskwise Knowledge Recorder ✅ **COMPLETE**

### **Extension Overview**
A comprehensive Chrome/Edge extension that records mouse clicks and automatically generates step-by-step guides for the Deskwise knowledge base with intelligent screenshot cropping and AI content generation.

### **Extension Components**
- **Extension Directory**: `extension/deskwise-recorder/`
- **Core Files**:
  - `manifest.json`: Extension configuration with Manifest V3 and PNG icons
  - `background.js`: Service worker for screenshot capture, cropping, and session management
  - `content.js`: Content script for click detection and visual feedback
  - `popup.html/js`: Beautiful popup interface with recording controls
  - `recorder.css`: Comprehensive styling for recording indicators
  - `icons/`: PNG icon files (16x16, 48x48, 128x128) with recording theme
  - `README.md`: Complete installation and usage documentation

### **Key Features**
- **🎯 Click Recording**: Detects and records every mouse click with precise coordinates and element context
- **📸 Smart Screenshot Cropping**: Automatically crops screenshots around clicked areas with adaptive padding (150-300px)
- **🎨 Visual Click Indicators**: Red circles with white center dots show exact click locations on cropped images
- **🧠 Smart Element Detection**: Identifies buttons, links, inputs, and interactive elements with comprehensive metadata
- **👀 Visual Feedback**: Shows recording indicator badge, click animations, and step progress
- **⚡ Real-time Processing**: Live session management with step counting and duration tracking
- **🔒 Secure Integration**: Direct integration with Deskwise API using WorkOS authentication and multi-tenancy
- **🖼️ Image Storage**: MongoDB-based screenshot storage with organization-scoped access control

### **AI-Powered Content Generation**
- **Google Genkit Integration**: Uses Gemini 2.0 Flash model for enhanced step descriptions
- **Smart Content Enhancement**: Generates comprehensive how-to guides with introduction, prerequisites, and conclusion
- **Duplicate Content Removal**: Automatically removes duplicate titles and subtitles from generated content
- **Screenshot Integration**: Ensures all cropped screenshots are properly included in generated articles
- **Fallback Generation**: Robust fallback system for reliable content creation with manual screenshot inclusion

### **Technical Implementation**
- **Advanced Screenshot Processing**: 
  - Chrome's `captureVisibleTab` API for high-quality full-page screenshots
  - Canvas-based cropping with device pixel ratio support for high-DPI displays
  - Intelligent padding calculation based on viewport size
  - Visual click indicators with semi-transparent red circles and precise center dots
- **Image Storage Architecture**:
  - MongoDB storage in `recorder_screenshots` collection
  - Organization-scoped access with authentication verification
  - Efficient base64 to buffer conversion for serving
  - Secure image serving via `/api/knowledge-base/recorder/screenshot/[id]`
- **Session Management**: Chrome storage API for persistence across browser sessions
- **Multi-tenant Security**: Complete organization isolation for screenshots and articles
- **Error Handling**: Comprehensive error handling with fallback to full screenshots

### **Advanced Tiptap Editor Integration** ✅ **COMPLETE**
- **Rich Text Editor**: Professional Tiptap editor with comprehensive toolbar
- **Advanced Features**:
  - Text formatting (bold, italic, underline, subscript, superscript)
  - Headers (H1-H6), paragraphs, bullet points, numbered lists, task lists
  - Tables with row/column operations, merge cells, table styling
  - Code blocks with syntax highlighting (Lowlight integration)
  - Images with base64 support and drag-and-drop
  - Links with auto-detection and custom URLs
  - Blockquotes, horizontal rules, text alignment
- **AI Generation Dialog**: Integrated AI content generation with tone options (How-To Guide, SOP, Article, Custom)
- **Toolbar Organization**: Grouped tools with clear visual separation and tooltips
- **Content Viewer**: Enhanced TiptapViewer with markdown parsing and consistent styling

### **Article Display Enhancements** ✅ **COMPLETE**
- **Glassmorphic Auto-Generated Banners**: Beautiful translucent banners for extension-generated articles
- **Smart Metadata Display**: 
  - Step count from recording metadata
  - Estimated reading time based on word count
  - Creation date and author information
  - Visual indicators for auto-generated content
- **Responsive Layout**: 4-column grid (desktop) to 1-column (mobile) for metadata cards
- **Theme Integration**: Consistent with dashboard glassmorphic design using backdrop-blur and transparency

### **Chrome Extension Technical Fixes** ✅ **COMPLETE**
- **Icon Compatibility**: Replaced SVG icons with proper PNG icons to fix Chrome rendering issues
- **Variable Scope Fixes**: Fixed `ReferenceError: request is not defined` in screenshot capture
- **Recording State Indication**: Badge-based recording indicator instead of problematic icon updates
- **Error Resolution**: Comprehensive error handling and fallback mechanisms
- **Service Worker Optimization**: Proper async/await handling and content script injection

### **API Integration & Screenshot Pipeline** ✅ **COMPLETE**
- **Screenshot Processing API**: 
  - `POST /api/knowledge-base/recorder`: Processes extension data with screenshot storage
  - `GET /api/knowledge-base/recorder/screenshot/[id]`: Serves cropped images with authentication
- **Content Generation Pipeline**:
  1. Extension captures clicks and crops screenshots in content script
  2. API processes and stores screenshots in MongoDB with unique IDs
  3. AI generates comprehensive content with screenshot placeholders
  4. Content post-processing ensures all screenshots are included
  5. TiptapViewer renders final articles with proper image display
- **Multi-tenant Security**: Complete organization isolation at every level
- **Debug Logging**: Comprehensive logging throughout the pipeline for troubleshooting

### **User Experience**
1. **One-Click Recording**: Click extension icon to start/stop recording
2. **Visual Feedback**: Red "REC" badge on extension icon during recording
3. **Smart Cropping**: Automatically focused screenshots showing only relevant areas
4. **Click Precision**: Clear visual indicators showing exactly where clicks occurred
5. **Instant Articles**: Auto-generated knowledge base articles with professional formatting
6. **Glassmorphic Design**: Beautiful presentation for auto-generated content

### **Installation & Usage**
- **Developer Mode**: Load unpacked extension in Chrome developer mode
- **Permissions**: Active tab, desktop capture, storage, scripting, and host permissions
- **Icon Support**: Proper PNG icons for all extension interfaces
- **Configuration**: Connects to Deskwise instance (localhost:9002 or production)
- **Authentication**: Seamless integration with WorkOS authentication

### **Advanced Features**
- **Adaptive Screenshot Cropping**: Smart padding calculation based on screen size and content
- **High-DPI Support**: Proper device pixel ratio handling for crisp screenshots
- **Element Context Capture**: Comprehensive element data (tags, IDs, classes, text content, selectors)
- **Visual Enhancement**: Professional click indicators with transparency and borders
- **Content Intelligence**: Automatic duplicate removal and screenshot integration verification
- **Error Recovery**: Graceful fallback to full screenshots when cropping fails

## Client Portal Multi-Tenant SSO ✅ **COMPLETE**

### **NextAuth.js Integration with WorkOS**
The client portal now supports **multi-tenant SSO** using NextAuth.js with a custom WorkOS provider:

- **Multi-Step Authentication Flow**: Email identification → SSO or password fallback
- **WorkOS SSO Provider**: Custom NextAuth.js provider for enterprise SSO connections
- **Client Organization Lookup**: Email domain-based organization identification
- **Fallback Authentication**: Password-based login when SSO is not configured
- **Session Management**: NextAuth.js JWT sessions with client portal context

### **Key Components**
- **Login Flow**: `src/app/portal/login/page.tsx` - Multi-step authentication UI
- **NextAuth Configuration**: `src/app/api/auth/[...nextauth]/route.ts` - Credentials provider for password auth
- **WorkOS SSO Service**: `src/lib/auth/workos-sso.ts` - WorkOS SDK integration and organization management
- **WorkOS Callback**: `src/app/api/portal/auth/workos-callback/route.ts` - Handles WorkOS SSO callback
- **Session Management**: `src/lib/auth/portal-session.ts` - Unified session handling for both auth methods
- **Settings Interface**: `src/app/(app)/settings/portal-sso/page.tsx` - Admin interface for managing client SSO
- **API Routes**: 
  - `/api/portal/auth/sso-init` - SSO initiation with proper WorkOS SDK usage
  - `/api/portal/auth/workos-callback` - WorkOS SSO callback handler
  - `/api/auth/[...nextauth]` - NextAuth.js for password authentication
  - `/api/settings/portal-sso` - Client organization CRUD operations
  - `/api/settings/portal-sso/connection-status` - WorkOS connection validation
- **Middleware**: `src/middleware.client-portal-nextauth.ts` - Route protection for portal
- **Providers**: `src/components/providers/nextauth-portal-provider.tsx` - NextAuth session provider

### **Database Schema**
- **Collection**: `deskwise.client_organizations`
- **Fields**: `clientId`, `orgId`, `domain`, `workosOrganizationId`, `connectionId`, `name`, `isActive`
- **Indexes**: `domain` (unique), `orgId + isActive`

### **Authentication Flow**
1. **Email Identification**: User enters email address
2. **Domain Lookup**: System checks for SSO configuration using email domain
3. **SSO Redirect**: If SSO available, redirect to WorkOS authorization URL
4. **Password Fallback**: If no SSO, show password login form
5. **Session Creation**: NextAuth.js manages JWT sessions with client context

### **WorkOS Setup Requirements**
1. Create WorkOS organization for each client
2. Configure SAML/OIDC connections (Okta, Azure AD, etc.)
3. Map client domains to WorkOS organization IDs in database
4. Set up redirect URIs and environment variables

### **Environment Variables**
```bash
# WorkOS Configuration
WORKOS_API_KEY=your_workos_api_key
WORKOS_CLIENT_ID=your_workos_client_id

# NextAuth.js Configuration  
NEXTAUTH_SECRET=your_32_char_random_string
NEXTAUTH_URL=http://localhost:9002

# Client Portal (Legacy - Optional)
CLIENT_PORTAL_JWT_SECRET=your_client_portal_secret
```

### **Corrected Implementation Notes**
After reviewing the official WorkOS documentation and SDK:

1. **Proper WorkOS SDK Usage**: Now uses `workos.sso.getAuthorizationUrl()` and `workos.sso.getProfileAndToken()` correctly
2. **Custom Callback Handler**: Instead of forcing WorkOS into NextAuth's OAuth pattern, uses dedicated callback route
3. **Dual Authentication**: NextAuth handles password auth, WorkOS handles SSO directly
4. **Unified Session Management**: Custom session manager handles both authentication methods
5. **Correct Callback URL**: `${baseUrl}/api/portal/auth/workos-callback` (configure this in WorkOS dashboard)

### **Admin Settings Interface**
- **Settings Location**: Main app → Settings → Client Portal SSO
- **Features**:
  - Create/edit/delete client organizations
  - Map email domains to WorkOS organization IDs
  - View SSO connection status and health
  - Test SSO flows directly from admin interface
  - Bulk management of client SSO configurations
- **Security**: Admin-only access with organization-scoped data isolation
- **WorkOS Integration**: Real-time connection status validation

### **Multi-Tenant Security**
- **Organization Isolation**: All client data scoped by `orgId`
- **SSO Validation**: WorkOS handles enterprise authentication
- **Session Security**: NextAuth.js JWT with secure cookies
- **Route Protection**: Middleware ensures authenticated access
- **Client Verification**: Portal user validation against client organization
- **Admin Controls**: Full admin interface for managing client SSO configurations

This is a comprehensive PSA platform with **enterprise-grade multi-tenancy**, **complete authentication integration**, **multi-tenant SSO support**, and **revolutionary Chrome extension for automated guide generation** now implemented. The platform is ready for B2B SaaS deployment with secure, organization-isolated access to all core modules.