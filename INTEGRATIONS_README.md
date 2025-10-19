# Accounting Integrations - UI Documentation

## Overview

This document describes the comprehensive accounting integrations UI built for Deskwise MSP. The system provides a complete interface for connecting and managing integrations with **Xero**, **QuickBooks**, and **MYOB** accounting platforms.

## Location

- **Settings Page**: `/settings/integrations`
- **Main Page Component**: `src/app/(app)/settings/integrations/page.tsx`
- **Components Directory**: `src/components/integrations/`
- **Type Definitions**: `src/lib/types/integrations.ts`

## Features

### 1. Main Integration Settings Page

**File**: `src/app/(app)/settings/integrations/page.tsx`

Features:
- **Three-tab interface**:
  - **Platforms**: View and manage all three accounting platform connections
  - **Sync Status**: Real-time sync monitoring dashboard
  - **Logs**: Detailed sync history and error tracking
- **Admin-only access** with permission checking
- **Real-time loading states** with skeleton loaders
- **Error handling** with user-friendly alerts

### 2. Integration Cards

**File**: `src/components/integrations/integration-card.tsx`

Each platform (Xero, QuickBooks, MYOB) displays:
- **Platform logo** and name
- **Connection status** badge (Connected, Not Connected, Error, Pending)
- **Company name** (when connected)
- **Last sync timestamp** (relative time)
- **Connected timestamp** (relative time)
- **Error messages** (when status is error)
- **Action buttons**:
  - Connect/Disconnect
  - Configure (opens platform-specific config dialog)
  - Test Connection

Status Badges:
- 🟢 **Connected**: Green badge with checkmark
- 🔴 **Error**: Red badge with X icon
- ⏱️ **Pending**: Gray badge with clock icon
- ⚪ **Not Connected**: Outline badge

### 3. OAuth Connection Flow

**File**: `src/components/integrations/connect-dialog.tsx`

Features:
- **Step-by-step instructions** for each platform
- **Popup-based OAuth flow** (600x700 centered window)
- **Polling mechanism** to detect completion
- **Success/error feedback** with toast notifications
- **Automatic page reload** on successful connection

OAuth Flow:
1. User clicks "Connect to [Platform]"
2. System initiates OAuth request to `/api/integrations/{platform}/auth`
3. Popup window opens with platform's OAuth page
4. User authorizes in popup
5. System polls for connection status
6. Success notification and dialog closes
7. Parent page refreshes with new connection data

### 4. Platform Configuration Dialogs

Three separate configuration dialogs (one per platform):

**Files**:
- `src/components/integrations/xero-config-dialog.tsx`
- `src/components/integrations/quickbooks-config-dialog.tsx`
- `src/components/integrations/myob-config-dialog.tsx`

Each dialog provides **three tabs**:

#### Tab 1: Sync Settings
- **Entity toggles**:
  - ✅ Invoices
  - ✅ Quotes
  - ✅ Customers
  - ✅ Products
  - ✅ Payments
- **Sync frequency** dropdown:
  - Real-time (immediate)
  - Hourly
  - Daily
  - Manual only
- **Auto-sync toggle**

#### Tab 2: Account Mappings
- **Revenue/Income Account** selector (platform-specific accounts loaded via API)
- **Accounts Receivable** selector
- **Tax Settings**:
  - Include Tax toggle
  - Default Tax Rate/Code selector (platform-specific tax rates)

#### Tab 3: Advanced Settings
- **Data Handling**:
  - Skip Duplicates toggle
  - Update Existing toggle
- **Notifications**:
  - Notify on Error toggle
  - Notify on Success toggle
- **Test Connection** button
- **Platform-specific notes** (e.g., MYOB company file locks)

Platform-Specific Features:
- **Xero**: Tenant selection, tax rates
- **QuickBooks**: Realm ID, tax codes, estimates (quotes)
- **MYOB**: Company file ID, GST tax codes

### 5. Sync Status Dashboard

**File**: `src/components/integrations/sync-status-dashboard.tsx`

Features:
- **Per-platform statistics**:
  - Total syncs count
  - Success rate percentage (with color-coded icons)
  - Last sync timestamp
  - Failed syncs count
- **Entity breakdown cards** (5 cards per platform):
  - Invoices, Quotes, Customers, Products, Payments
  - Synced count per entity
  - Manual sync button per entity
- **Sync All button** (syncs all entity types)
- **Real-time sync status** with animated spinner
- **Refresh button** to reload stats

Visual Indicators:
- 🟢 Success Rate ≥90%: Green checkmark
- 🟡 Success Rate 70-89%: Yellow clock
- 🔴 Success Rate <70%: Red X

### 6. Sync Logs Viewer

**File**: `src/components/integrations/sync-logs-viewer.tsx`

Features:
- **Advanced filtering**:
  - Search by entity ID, error message, platform ID, Deskwise ID
  - Filter by platform (Xero, QuickBooks, MYOB)
  - Filter by entity type (Invoice, Quote, Customer, Product, Payment)
  - Filter by status (Success, Failed, Partial, Pending)
- **Sortable table** with columns:
  - Timestamp (date/time format)
  - Platform (badge)
  - Entity Type
  - Status (color-coded badge)
  - Records (successful/failed/total)
  - Duration (in seconds)
  - View Details button
- **Pagination** (20 logs per page)
- **Export to CSV** functionality
- **Detailed log viewer** dialog showing:
  - Basic info (platform, status, entity type, initiated by)
  - Timing (started at, completed at, duration)
  - Record counts (processed, successful, failed)
  - Record IDs (Deskwise ID, Platform ID)
  - Error details (message, details, stack trace)

Status Badge Colors:
- 🟢 **Success**: Green
- 🔴 **Failed**: Red/Destructive
- 🟡 **Partial**: Yellow/Warning
- ⏱️ **Pending**: Gray/Outline

### 7. Sync Badge Component (For Billing Pages)

**File**: `src/components/integrations/sync-badge.tsx`

Designed for use on **Invoice** and **Quote** detail pages.

Features:
- **Platform badge** with status
- **Last synced timestamp** (tooltip)
- **Platform ID** display (tooltip)
- **View in Platform** button (opens external link)
- **Sync Now** button (manual sync trigger)
- **Re-sync** button (for already synced items)
- **Loading states** with spinner
- **Toast notifications** on sync success/failure

Usage Example:
```tsx
<SyncBadge
  entityType="invoice"
  entityId="inv_123"
  platform="xero"
  platformId="abc-def-123"
  lastSyncedAt={new Date('2025-01-15T10:30:00Z')}
  syncStatus="synced"
  platformUrl="https://go.xero.com/invoices/abc-def-123"
/>
```

Props:
- `entityType`: 'invoice' | 'quote'
- `entityId`: Deskwise entity ID
- `platform?`: 'xero' | 'quickbooks' | 'myob'
- `platformId?`: Platform's entity ID
- `lastSyncedAt?`: Date | string
- `syncStatus?`: 'synced' | 'pending' | 'failed' | 'not_synced'
- `platformUrl?`: External platform URL
- `onSync?`: Custom sync handler

## Type Definitions

**File**: `src/lib/types/integrations.ts`

Key Types:
```typescript
export type IntegrationPlatform = 'xero' | 'quickbooks' | 'myob'
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'pending'
export type SyncFrequency = 'realtime' | 'hourly' | 'daily' | 'manual'
export type SyncStatus = 'success' | 'failed' | 'partial' | 'pending'
export type SyncDirection = 'deskwise_to_platform' | 'platform_to_deskwise' | 'bidirectional'
export type SyncEntityType = 'invoice' | 'quote' | 'customer' | 'product' | 'payment'

interface IntegrationConnection {
  _id: string
  orgId: string
  platform: IntegrationPlatform
  status: IntegrationStatus
  connectedAt?: Date
  lastSyncAt?: Date
  companyName?: string
  // ... platform-specific fields
}

interface IntegrationConfig {
  _id: string
  orgId: string
  platform: IntegrationPlatform
  syncPreferences: {
    invoices: boolean
    quotes: boolean
    customers: boolean
    products: boolean
    payments: boolean
  }
  syncFrequency: SyncFrequency
  taxSettings: { includeTax: boolean; defaultTaxRate?: string }
  accountMappings?: { revenueAccount?: string; receivablesAccount?: string }
  advancedSettings: {
    skipDuplicates: boolean
    updateExisting: boolean
    notifyOnError: boolean
    notifyOnSuccess: boolean
  }
}

interface SyncLog {
  _id: string
  orgId: string
  platform: IntegrationPlatform
  entityType: SyncEntityType
  entityId: string
  status: SyncStatus
  recordsProcessed: number
  recordsSuccessful: number
  recordsFailed: number
  errorMessage?: string
  startedAt: Date
  completedAt?: Date
  duration?: number
}
```

## API Endpoints (Expected)

The UI assumes these API endpoints exist (backend implementation required):

### Connection Management
- `GET /api/integrations/connections` - List all connections
- `POST /api/integrations/connections` - Create connection
- `DELETE /api/integrations/connections/:id` - Disconnect
- `POST /api/integrations/connections/:id/test` - Test connection
- `GET /api/integrations/connections/latest?platform=xero` - Get latest connection

### OAuth Flow
- `POST /api/integrations/xero/auth` - Initiate Xero OAuth
- `POST /api/integrations/quickbooks/auth` - Initiate QuickBooks OAuth
- `POST /api/integrations/myob/auth` - Initiate MYOB OAuth

### Configuration
- `GET /api/integrations/configs` - List all configs
- `POST /api/integrations/configs` - Create config
- `PUT /api/integrations/configs` - Update config

### Platform Data (Account/Tax Lists)
- `GET /api/integrations/xero/:connectionId/accounts`
- `GET /api/integrations/xero/:connectionId/tax-rates`
- `GET /api/integrations/quickbooks/:connectionId/accounts`
- `GET /api/integrations/quickbooks/:connectionId/tax-codes`
- `GET /api/integrations/myob/:connectionId/accounts`
- `GET /api/integrations/myob/:connectionId/tax-codes`

### Sync Operations
- `GET /api/integrations/sync/stats` - Get sync statistics
- `POST /api/integrations/sync/manual` - Trigger manual sync
  - Body: `{ platform: 'xero', entityType?: 'invoice' }`
- `POST /api/integrations/sync/invoice/:id` - Sync specific invoice
- `POST /api/integrations/sync/quote/:id` - Sync specific quote

### Logs
- `GET /api/integrations/sync/logs` - List all sync logs
- `POST /api/integrations/sync/logs/export` - Export logs to CSV
  - Body: `{ filters: { platform, entityType, status, search } }`

## Navigation Updates

Added to **Settings Main Page** (`src/app/(app)/settings/page.tsx`):

New section: **Integrations**
- Card: "Accounting Integrations"
- Icon: Webhook (blue)
- Link: `/settings/integrations`
- Description: "Connect and sync data with Xero, QuickBooks, and MYOB accounting platforms"
- Admin-only access

## UI/UX Best Practices Implemented

1. **Loading States**: Skeleton loaders on all async operations
2. **Error Handling**: User-friendly error messages with recovery actions
3. **Confirmation Dialogs**: For destructive actions (disconnect, delete)
4. **Toast Notifications**: Success/error feedback for all operations
5. **Real-time Updates**: Automatic refresh after sync operations
6. **Accessibility**:
   - ARIA labels on all interactive elements
   - Keyboard navigation support (Tab, Enter, Escape)
   - Screen reader friendly status messages
7. **Mobile Responsive**: Grid layouts adapt to screen size
8. **Visual Hierarchy**: Clear section headings and card groupings
9. **Consistent Icons**: Lucide React icons throughout
10. **Color-coded Status**: Intuitive green/red/yellow status indicators

## Component Dependencies

All components use shadcn/ui and Radix UI primitives:
- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Button`, `Badge`, `Input`, `Label`, `Switch`, `Select`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter`
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Alert`, `AlertDescription`
- `Tooltip`, `TooltipProvider`, `TooltipTrigger`, `TooltipContent`
- `Skeleton`, `Separator`

External dependencies:
- `date-fns` - For date formatting
- `lucide-react` - For icons
- `next-auth/react` - For session management

## Future Enhancements (Not Implemented)

The UI is designed to support these future features:
1. **Bidirectional Sync**: Currently only Deskwise → Platform
2. **Field Mapping UI**: Custom field mappings beyond basic accounts
3. **Sync Scheduling**: Cron-like scheduling interface
4. **Webhook Configuration**: Real-time sync via webhooks
5. **Bulk Operations**: Sync multiple records at once
6. **Sync Conflict Resolution**: UI for handling data conflicts
7. **Platform-specific Features**:
   - Xero: Tracking categories, custom fields
   - QuickBooks: Classes, locations
   - MYOB: Jobs, categories

## Testing Checklist

Before deploying, test:
- [ ] Admin user can access `/settings/integrations`
- [ ] Non-admin users see "Admin only" message
- [ ] All three platform cards render correctly
- [ ] Connect dialog opens and displays instructions
- [ ] OAuth popup opens (test with dummy URL)
- [ ] Configuration dialogs load platform data
- [ ] Sync status dashboard shows stats
- [ ] Sync logs table loads and filters work
- [ ] Manual sync buttons trigger API calls
- [ ] Export logs downloads CSV file
- [ ] Test connection buttons work
- [ ] Disconnect confirmation dialog works
- [ ] All loading states display correctly
- [ ] All error states display user-friendly messages
- [ ] Mobile responsive layouts work
- [ ] Keyboard navigation works throughout

## File Checklist

Created files:
- ✅ `src/lib/types/integrations.ts` - TypeScript type definitions
- ✅ `src/app/(app)/settings/integrations/page.tsx` - Main settings page
- ✅ `src/components/integrations/integration-card.tsx` - Platform connection card
- ✅ `src/components/integrations/connect-dialog.tsx` - OAuth connection flow
- ✅ `src/components/integrations/xero-config-dialog.tsx` - Xero configuration
- ✅ `src/components/integrations/quickbooks-config-dialog.tsx` - QuickBooks configuration
- ✅ `src/components/integrations/myob-config-dialog.tsx` - MYOB configuration
- ✅ `src/components/integrations/sync-status-dashboard.tsx` - Sync monitoring
- ✅ `src/components/integrations/sync-logs-viewer.tsx` - Sync history
- ✅ `src/components/integrations/sync-badge.tsx` - Invoice/quote sync badge
- ✅ `src/components/integrations/index.ts` - Component exports

Modified files:
- ✅ `src/app/(app)/settings/page.tsx` - Added Integrations navigation card

## Screenshots (Placeholder)

*(In production, add screenshots of each UI component here)*

1. Main integrations page (3 tabs)
2. Platform cards (Connected vs Not Connected)
3. Connect dialog with instructions
4. Xero configuration dialog (3 tabs)
5. Sync status dashboard with stats
6. Sync logs viewer with filters
7. Log details dialog
8. Sync badge on invoice page

## Support

For questions or issues:
- Check API endpoint implementation status
- Verify environment variables for OAuth credentials
- Review browser console for detailed error messages
- Check network tab for failed API requests
