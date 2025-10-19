# Agreements Module - Technical Specification

## Executive Summary

This document provides a comprehensive technical specification for implementing an MSP-grade Agreements module in the Deskwise ITSM platform. Based on industry research of leading PSA platforms (ConnectWise, Autotask, Datto) and MSP best practices, this specification covers data models, SLA structures, UI/UX design, and integration points.

**Market Context**: The managed services market is projected to expand from $260 billion in 2023 to $380 billion by 2028, with increasing demand for robust contract and SLA management capabilities.

---

## Table of Contents

1. [Agreement Types](#agreement-types)
2. [Data Models](#data-models)
3. [SLA Tier Structure](#sla-tier-structure)
4. [Priority Levels & Response Times](#priority-levels--response-times)
5. [Breach Management](#breach-management)
6. [Billing Integration](#billing-integration)
7. [Renewal Management](#renewal-management)
8. [UI/UX Design](#uiux-design)
9. [API Endpoints](#api-endpoints)
10. [Integration Points](#integration-points)
11. [E-Signature Integration](#e-signature-integration)
12. [Reporting & Analytics](#reporting--analytics)

---

## Agreement Types

MSPs typically manage four primary agreement types, each serving a distinct purpose:

### 1. Master Service Agreement (MSA)
**Purpose**: Establishes the long-term relationship framework between MSP and client.

**Characteristics**:
- Overarching contract governing all services
- Long-term (typically 1-3 years)
- Defines general terms, conditions, and obligations
- Does not include detailed pricing or specific project scopes
- Serves as parent agreement for SOWs and SLAs

**Key Use Cases**:
- New client onboarding
- Multi-service relationships
- Long-term partnerships with recurring revenue

### 2. Service Level Agreement (SLA)
**Purpose**: Defines measurable service expectations and performance metrics.

**Characteristics**:
- Specific performance targets (response times, uptime, resolution times)
- Tiered priority levels (Critical, High, Medium, Low)
- Penalty clauses for SLA breaches
- Exclusions and force majeure provisions
- Often embedded within MSA or standalone

**Key Use Cases**:
- Managed services with guaranteed uptime
- Help desk/support agreements
- Infrastructure monitoring and maintenance

### 3. Statement of Work (SOW)
**Purpose**: Defines specific project-based work with deliverables and timelines.

**Characteristics**:
- Project-specific scope and deliverables
- Fixed timelines and milestones
- Detailed pricing (fixed-fee or time-and-materials)
- Typically attached to parent MSA
- Finite duration with clear completion criteria

**Key Use Cases**:
- Infrastructure upgrades
- Migration projects
- Software implementation
- One-time consulting engagements

### 4. Maintenance Contract / Retainer
**Purpose**: Provides ongoing support with pre-paid hours or fixed monthly services.

**Characteristics**:
- Monthly or annual recurring fee
- Pre-allocated hours (e.g., 20 hours/month)
- Rollover or use-it-or-lose-it terms
- Defined service scope (e.g., patching, monitoring, basic support)
- Auto-renewal provisions

**Key Use Cases**:
- Monthly managed services
- Break-fix support with prepaid hours
- Ongoing maintenance agreements

---

## Data Models

### Base Agreement Interface

```typescript
import { ObjectId } from 'mongodb'

/**
 * Base interface for all agreement types
 * Extends BaseEntity from src/lib/types.ts
 */
interface BaseAgreement {
  // Core Identification
  _id: ObjectId
  orgId: string                         // Multi-tenant organization ID
  clientId: string                      // Reference to clients collection

  // Agreement Metadata
  agreementType: AgreementType          // MSA, SLA, SOW, Maintenance
  agreementNumber: string               // Auto-generated (e.g., "AGR-2025-0001")
  title: string                         // Human-readable title
  description?: string                  // Optional detailed description
  status: AgreementStatus               // Draft, Active, Expired, Terminated, Renewed

  // Date Management
  startDate: Date                       // Agreement effective date
  endDate: Date                         // Agreement expiration date
  signedDate?: Date                     // Date when fully executed
  terminatedDate?: Date                 // Date when terminated early

  // Renewal Configuration
  autoRenew: boolean                    // Auto-renew flag
  renewalTerm?: number                  // Renewal term in months
  renewalNotice?: number                // Notice period in days (30, 60, 90)
  renewalType?: RenewalType             // Auto, Manual, Evergreen

  // Stakeholders
  primaryContact?: string               // Client contact (userId)
  accountManager?: string               // Internal owner (userId)
  approvedBy?: string[]                 // Array of user IDs who approved

  // Financial Terms
  billingCycle?: BillingCycle           // Monthly, Quarterly, Annual
  billingType?: BillingType             // Fixed, T&M, Usage, Hybrid
  totalValue?: number                   // Total contract value
  currency: string                      // USD, EUR, GBP, etc.

  // Document Management
  documentUrl?: string                  // Link to signed PDF
  eSignatureProvider?: 'docusign' | 'adobe' | 'internal' | null
  eSignatureStatus?: 'pending' | 'completed' | 'declined' | null
  eSignatureRequestId?: string          // External provider request ID
  templateId?: string                   // Reference to agreement template

  // Parent/Child Relationships
  parentAgreementId?: string            // For SOWs under MSA
  childAgreementIds?: string[]          // For MSA with multiple SOWs

  // Compliance & Audit
  tags?: string[]                       // Categorization tags
  customFields?: Record<string, any>    // Extensible custom fields
  attachments?: AttachmentInfo[]        // Supporting documents

  // Standard Audit Fields
  createdAt: Date
  updatedAt: Date
  createdBy: string                     // userId
  lastModifiedBy: string                // userId
  isActive: boolean                     // Soft delete flag
}

/**
 * Master Service Agreement
 */
interface MasterServiceAgreement extends BaseAgreement {
  agreementType: 'MSA'

  // Scope of Services
  serviceScope: ServiceScope[]          // Array of service categories
  coveredLocations?: string[]           // Geographic coverage
  coveredAssets?: string[]              // Asset IDs covered

  // Legal Terms
  terminationClause: TerminationClause
  liabilityLimit?: number               // Liability cap amount
  liabilityType?: 'fixed' | 'percentage'
  insuranceRequirements?: string[]      // Required insurance policies
  confidentialityTerms?: string         // NDA provisions
  disputeResolution?: 'arbitration' | 'mediation' | 'litigation'
  governingLaw?: string                 // Jurisdiction (e.g., "State of California")

  // Performance Requirements
  generalKPIs?: KPIMetric[]             // High-level KPIs
  reportingFrequency?: 'weekly' | 'monthly' | 'quarterly'

  // Payment Terms
  paymentTerms: PaymentTerms
  lateFeePercentage?: number            // Late payment penalty

  // Force Majeure
  forceMajeureProvisions?: string       // Force majeure clause text
}

/**
 * Service Level Agreement
 */
interface ServiceLevelAgreement extends BaseAgreement {
  agreementType: 'SLA'

  // SLA Tier (Gold, Silver, Bronze)
  tier: SLATier

  // Service Hours
  supportHours: SupportHours            // 24x7, Business Hours, etc.
  excludedDays?: string[]               // Holidays excluded from SLA
  timezone: string                      // IANA timezone (e.g., "America/New_York")

  // Performance Metrics
  priorityLevels: PriorityLevel[]       // Array of priority definitions
  uptimeTarget?: number                 // Percentage (e.g., 99.9)
  uptimeCalculation?: 'monthly' | 'quarterly' | 'annual'

  // Breach Management
  breachPenalties: BreachPenalty[]      // Penalties for SLA violations
  serviceCredits?: ServiceCredit[]      // Credit structure
  breachEscalation?: EscalationProcedure[]
  maxPenaltyPerMonth?: number           // Cap on monthly penalties

  // Response & Resolution
  firstResponseSLA: boolean             // Track first response time
  resolutionSLA: boolean                // Track time to resolution

  // Exclusions
  exclusions?: string[]                 // What's NOT covered
  plannedMaintenanceNotice?: number     // Days notice required

  // Reporting
  reportingRequirements?: ReportingRequirement[]

  // Monitoring
  monitoringTools?: string[]            // Tools used for SLA tracking
  dashboardAccess?: boolean             // Client dashboard access
}

/**
 * Statement of Work
 */
interface StatementOfWork extends BaseAgreement {
  agreementType: 'SOW'

  // Project Details
  projectName: string
  projectObjectives: string
  deliverables: Deliverable[]           // Specific work products
  milestones: Milestone[]               // Payment milestones

  // Scope Management
  outOfScope?: string[]                 // Explicit exclusions
  changeOrderProcess?: string           // How to handle scope changes

  // Resource Allocation
  estimatedHours?: number
  resourcesAssigned?: string[]          // User IDs of assigned staff
  skillsRequired?: string[]             // Required competencies

  // Acceptance Criteria
  acceptanceCriteria: AcceptanceCriteria[]
  testingRequirements?: string

  // Dependencies
  clientResponsibilities?: string[]     // What client must provide
  thirdPartyDependencies?: string[]     // External dependencies

  // Risk Management
  risks?: RiskItem[]
  assumptions?: string[]
  constraints?: string[]
}

/**
 * Maintenance Contract / Retainer
 */
interface MaintenanceContract extends BaseAgreement {
  agreementType: 'Maintenance'

  // Service Allocation
  includedHours?: number                // Hours per month
  hourRollover: boolean                 // Unused hours rollover
  rolloverLimit?: number                // Max hours that can rollover
  rolloverExpiration?: number           // Months until rollover expires

  // Overage Handling
  overageRate?: number                  // Hourly rate for overage
  overageApprovalRequired: boolean      // Require approval for overage
  overageCap?: number                   // Max overage hours per month

  // Covered Services
  coveredServices: CoveredService[]     // What's included
  responseTime?: string                 // General response expectation

  // Asset Coverage
  coveredAssetCategories?: string[]     // Asset categories covered
  deviceCount?: number                  // Number of devices/users covered

  // Exclusions
  notCovered?: string[]                 // Explicit exclusions

  // Usage Tracking
  trackHourUsage: boolean               // Enable hour tracking
  currentHoursUsed?: number             // Current month usage
  previousMonthUsage?: number[]         // Historical usage
}

// ===========================
// Supporting Type Definitions
// ===========================

type AgreementType = 'MSA' | 'SLA' | 'SOW' | 'Maintenance'

type AgreementStatus =
  | 'draft'           // Being created/edited
  | 'pending_approval' // Awaiting internal approval
  | 'pending_signature' // Sent for e-signature
  | 'active'          // Currently in effect
  | 'expiring_soon'   // Within renewal notice period
  | 'expired'         // Past end date
  | 'terminated'      // Terminated early
  | 'renewed'         // Superseded by renewal
  | 'on_hold'         // Temporarily paused

type BillingCycle = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'one-time'

type BillingType =
  | 'fixed'           // Fixed price
  | 'time_materials'  // T&M billing
  | 'usage_based'     // Based on consumption
  | 'hybrid'          // Combination
  | 'retainer'        // Pre-paid hours

type RenewalType =
  | 'auto'            // Automatically renews
  | 'manual'          // Requires manual renewal
  | 'evergreen'       // Continuous until terminated

interface ServiceScope {
  category: string                      // e.g., "Help Desk Support", "Network Management"
  description: string
  includedActivities: string[]
  excludedActivities?: string[]
  metrics?: string[]                    // Associated KPIs
}

interface TerminationClause {
  terminationNoticeDays: number         // Days notice required
  terminationFee?: number               // Early termination fee
  terminationReasons: string[]          // Valid reasons for termination
  dataRetentionDays?: number            // How long data is kept post-termination
  transitionAssistanceDays?: number     // Days of transition support
}

interface PaymentTerms {
  paymentDueDays: number                // Net 15, Net 30, etc.
  acceptedPaymentMethods: string[]      // Credit card, ACH, Wire, Check
  advancePaymentRequired?: boolean      // Require upfront payment
  advancePaymentPercentage?: number     // Percentage of upfront payment
  invoicingSchedule?: string            // When invoices are sent
}

interface KPIMetric {
  name: string
  description: string
  target: number
  unit: string                          // %, hours, count, etc.
  measurementFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
}

// ===========================
// SLA-Specific Types
// ===========================

interface SLATier {
  name: string                          // "Gold", "Silver", "Bronze", "Platinum"
  displayName: string
  color: string                         // Hex color for UI
  level: number                         // 1 = highest, 3 = lowest
  monthlyPrice?: number                 // Optional tier pricing
}

interface SupportHours {
  type: '24x7' | 'business_hours' | 'extended_hours' | 'custom'
  customSchedule?: {
    monday?: { start: string; end: string }
    tuesday?: { start: string; end: string }
    wednesday?: { start: string; end: string }
    thursday?: { start: string; end: string }
    friday?: { start: string; end: string }
    saturday?: { start: string; end: string }
    sunday?: { start: string; end: string }
  }
  afterHoursRate?: number               // Multiplier for after-hours work
}

interface PriorityLevel {
  priority: 'critical' | 'high' | 'medium' | 'low'
  displayName: string                   // "P1 - Critical", "P2 - High", etc.
  description: string                   // Definition of priority
  responseTime: number                  // Minutes for first response
  resolutionTime?: number               // Minutes for resolution (optional)
  businessHoursOnly: boolean            // Count only business hours
  escalationTime?: number               // Minutes before escalation
  exampleScenarios?: string[]           // Examples of this priority
}

interface BreachPenalty {
  breachType: 'response' | 'resolution' | 'uptime' | 'general'
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  penaltyType: 'service_credit' | 'refund' | 'free_service' | 'contract_termination'
  penaltyAmount?: number                // Fixed amount or percentage
  penaltyUnit?: 'fixed' | 'percentage_monthly' | 'percentage_total'
  description: string
  triggers: string[]                    // Conditions that trigger penalty
  maxOccurrences?: number               // Max times before escalation
}

interface ServiceCredit {
  triggerCondition: string              // e.g., "Uptime below 99.9%"
  creditPercentage: number              // Percentage of monthly fee
  maxCreditPerMonth?: number            // Cap on credits
  cumulativeOverMonths?: number         // Credits can accumulate
  applicableTo: string[]                // Which services get credit
}

interface EscalationProcedure {
  level: number                         // 1, 2, 3, etc.
  triggerCondition: string              // What triggers this level
  escalationTarget: string              // Who gets notified
  escalationTime: number                // Minutes before this level
  requiredActions: string[]             // What must be done
}

interface ReportingRequirement {
  reportType: string                    // "Monthly Performance", "Incident Summary"
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual'
  deliveryMethod: 'email' | 'portal' | 'meeting'
  dueDate: string                       // e.g., "5th business day of month"
  includedMetrics: string[]
  format?: 'pdf' | 'excel' | 'dashboard'
}

// ===========================
// SOW-Specific Types
// ===========================

interface Deliverable {
  id: string
  name: string
  description: string
  dueDate: Date
  assignedTo?: string[]                 // User IDs
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
  acceptanceCriteria?: string
  dependencies?: string[]               // Other deliverable IDs
  attachments?: AttachmentInfo[]
}

interface Milestone {
  id: string
  name: string
  description: string
  targetDate: Date
  completionDate?: Date
  paymentAmount?: number                // Payment tied to milestone
  paymentPercentage?: number            // Percentage of total SOW value
  status: 'pending' | 'achieved' | 'missed' | 'waived'
  deliverableIds: string[]              // Associated deliverables
  approvalRequired: boolean
  approvedBy?: string
  approvedDate?: Date
}

interface AcceptanceCriteria {
  id: string
  description: string
  testMethod: string                    // How it will be verified
  acceptedBy?: string                   // Client contact
  acceptedDate?: Date
  status: 'pending' | 'met' | 'not_met' | 'waived'
}

interface RiskItem {
  id: string
  description: string
  probability: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation: string
  owner?: string                        // User ID responsible
  status: 'open' | 'mitigated' | 'realized' | 'closed'
}

// ===========================
// Maintenance-Specific Types
// ===========================

interface CoveredService {
  serviceName: string
  description: string
  includedInHours: boolean              // Counts against hour pool
  priority?: 'critical' | 'high' | 'medium' | 'low'
  estimatedHoursPerMonth?: number
}

// ===========================
// Common Types
// ===========================

interface AttachmentInfo {
  id: string
  fileName: string
  fileSize: number                      // Bytes
  mimeType: string
  uploadedBy: string                    // User ID
  uploadedAt: Date
  url: string                           // Storage URL
  category?: string                     // "signed_contract", "amendment", "exhibit"
}

// ===========================
// Agreement History & Amendments
// ===========================

interface AgreementAmendment {
  _id: ObjectId
  orgId: string
  agreementId: string                   // Parent agreement
  amendmentNumber: number               // Sequential (1, 2, 3...)
  amendmentDate: Date
  effectiveDate: Date
  description: string
  changedFields: FieldChange[]
  approvedBy: string[]
  documentUrl?: string
  createdBy: string
  createdAt: Date
}

interface FieldChange {
  fieldPath: string                     // JSONPath to field (e.g., "totalValue")
  oldValue: any
  newValue: any
  changeReason?: string
}

interface AgreementHistory {
  _id: ObjectId
  orgId: string
  agreementId: string
  action: 'created' | 'updated' | 'signed' | 'renewed' | 'terminated' | 'amended'
  performedBy: string                   // User ID
  performedAt: Date
  changes?: FieldChange[]
  notes?: string
  ipAddress?: string
}

// ===========================
// Agreement Templates
// ===========================

interface AgreementTemplate {
  _id: ObjectId
  orgId: string
  templateName: string
  agreementType: AgreementType
  description?: string
  isActive: boolean
  isDefault: boolean                    // Default template for this type

  // Template Content
  templateHtml?: string                 // HTML template with variables
  templateVariables?: string[]          // Available variables (e.g., {{clientName}})

  // Default Values
  defaultValues: Partial<BaseAgreement>

  // Sections
  sections?: TemplateSection[]

  // Usage Stats
  usageCount: number
  lastUsedAt?: Date

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface TemplateSection {
  id: string
  title: string
  content: string
  order: number
  required: boolean
  editable: boolean
}
```

---

## SLA Tier Structure

Based on industry research, MSPs typically offer 3-4 tiers of SLA support. Here's the recommended structure:

### Platinum Tier (Enterprise)
**Target Market**: Large enterprise clients, mission-critical systems
**Response Times**:
- Critical (P1): 15 minutes
- High (P2): 1 hour
- Medium (P3): 4 hours
- Low (P4): 24 hours

**Features**:
- 24x7x365 support
- 99.99% uptime guarantee (52.56 minutes/year downtime)
- Dedicated account manager
- Proactive monitoring and alerting
- Monthly QBRs (Quarterly Business Reviews)
- Priority resource allocation
- On-site support included

**Pricing**: Premium (3-4x Bronze)

---

### Gold Tier (Premium)
**Target Market**: Mid-size businesses, high-dependency clients
**Response Times**:
- Critical (P1): 30 minutes
- High (P2): 2 hours
- Medium (P3): 8 hours (next business day)
- Low (P4): 48 hours

**Features**:
- 24x7 support
- 99.9% uptime guarantee (8.76 hours/year downtime)
- Assigned account manager
- Proactive monitoring
- Quarterly business reviews
- Standard resource allocation
- Remote support (on-site additional)

**Pricing**: High (2-2.5x Bronze)

---

### Silver Tier (Standard)
**Target Market**: Small to mid-size businesses, standard needs
**Response Times**:
- Critical (P1): 1 hour
- High (P2): 4 hours
- Medium (P3): 24 hours
- Low (P4): 72 hours

**Features**:
- Business hours support (8AM-6PM, M-F)
- After-hours emergency line
- 99.5% uptime guarantee (43.8 hours/year downtime)
- Shared account management
- Reactive monitoring
- Semi-annual reviews
- Remote support only

**Pricing**: Medium (1.5x Bronze)

---

### Bronze Tier (Basic)
**Target Market**: Small businesses, budget-conscious clients
**Response Times**:
- Critical (P1): 4 hours
- High (P2): 8 hours (next business day)
- Medium (P3): 48 hours (2 business days)
- Low (P4): 5 business days

**Features**:
- Business hours support only (9AM-5PM, M-F)
- No after-hours support
- 99% uptime guarantee (87.6 hours/year downtime)
- Email/portal support
- Reactive support only
- Annual review
- Remote support only

**Pricing**: Base pricing

---

### Uptime Guarantee Reference Table

| SLA % | Daily Downtime | Monthly Downtime | Yearly Downtime | Typical Tier |
|-------|---------------|------------------|-----------------|--------------|
| 99.99% | 8.6 seconds | 4.38 minutes | 52.56 minutes | Platinum |
| 99.9% | 1 min 26 sec | 43.8 minutes | 8.76 hours | Gold |
| 99.5% | 7 min 12 sec | 3.65 hours | 43.8 hours | Silver |
| 99% | 14 min 24 sec | 7.3 hours | 87.6 hours | Bronze |

**Calculation Method**: `Downtime = Total Time × (1 - SLA%)`

---

## Priority Levels & Response Times

Industry-standard priority definitions for ticket classification:

### Priority 1 - Critical
**Definition**: Complete service outage affecting all users or critical business functions
**Examples**:
- Entire network down
- Email server outage affecting all users
- Core business application completely unavailable
- Security breach or active cyberattack
- Data loss event

**Response SLA**:
- Platinum: 15 minutes
- Gold: 30 minutes
- Silver: 1 hour
- Bronze: 4 hours

**Resolution Target**:
- Platinum: 2 hours
- Gold: 4 hours
- Silver: 8 hours (same business day)
- Bronze: 24 hours

**Escalation**: Immediate to senior engineers and management

---

### Priority 2 - High
**Definition**: Significant impact affecting multiple users or degraded critical services
**Examples**:
- Major application performance degradation
- Multiple users unable to access shared resources
- VPN down affecting remote workers
- Backup failure
- Critical patch deployment required

**Response SLA**:
- Platinum: 1 hour
- Gold: 2 hours
- Silver: 4 hours
- Bronze: 8 hours (next business day)

**Resolution Target**:
- Platinum: 4 hours
- Gold: 8 hours
- Silver: 24 hours
- Bronze: 48 hours

**Escalation**: After 50% of response time elapsed

---

### Priority 3 - Medium
**Definition**: Limited impact affecting individual users or non-critical services
**Examples**:
- Single user email issues
- Printer not working
- Software installation request
- Password reset
- Minor performance issues

**Response SLA**:
- Platinum: 4 hours
- Gold: 8 hours
- Silver: 24 hours
- Bronze: 48 hours

**Resolution Target**:
- Platinum: 24 hours
- Gold: 48 hours
- Silver: 5 business days
- Bronze: 10 business days

**Escalation**: After 75% of response time elapsed

---

### Priority 4 - Low
**Definition**: Minimal impact, requests, or informational queries
**Examples**:
- Feature requests
- General questions
- Scheduled maintenance
- Documentation requests
- Nice-to-have improvements

**Response SLA**:
- Platinum: 24 hours
- Gold: 48 hours
- Silver: 72 hours
- Bronze: 5 business days

**Resolution Target**:
- Platinum: 5 business days
- Gold: 10 business days
- Silver: 15 business days
- Bronze: 30 business days

**Escalation**: No automatic escalation

---

### Business Hours vs. 24x7 Calculation

**Business Hours Definition** (Typical):
- Monday-Friday: 8:00 AM - 6:00 PM (10 hours/day)
- Total: 50 hours/week
- Excludes holidays

**24x7 Calculation**:
- All hours count
- 168 hours/week
- Holidays included

**SLA Clock Rules**:
1. **Business Hours SLAs**: Clock stops outside business hours
2. **24x7 SLAs**: Clock never stops
3. **Scheduled Maintenance**: Clock paused during approved maintenance windows
4. **Force Majeure**: Clock paused during force majeure events

---

## Breach Management

### Breach Detection & Tracking

```typescript
interface SLABreach {
  _id: ObjectId
  orgId: string
  agreementId: string
  ticketId?: string                     // Associated ticket (if applicable)
  incidentId?: string                   // Associated incident

  // Breach Details
  breachType: 'response' | 'resolution' | 'uptime' | 'custom'
  priority: 'critical' | 'high' | 'medium' | 'low'
  breachedAt: Date
  detectedAt: Date

  // SLA Metrics
  targetTime: number                    // Target in minutes
  actualTime: number                    // Actual time taken
  variance: number                      // Difference (negative = breach)
  variancePercentage: number            // Percentage over target

  // Impact Assessment
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  usersAffected?: number
  businessImpact?: string

  // Root Cause
  rootCause?: string
  category?: string                     // "Staffing", "Technical", "Process", etc.
  preventable: boolean

  // Resolution
  status: 'open' | 'acknowledged' | 'resolved' | 'waived' | 'disputed'
  resolvedAt?: Date
  resolvedBy?: string                   // User ID
  resolutionNotes?: string

  // Penalties Applied
  penaltyApplied: boolean
  penaltyType?: 'service_credit' | 'refund' | 'free_service'
  penaltyAmount?: number
  creditIssued?: boolean
  creditAmount?: number
  creditAppliedToInvoice?: string       // Invoice ID

  // Escalation
  escalated: boolean
  escalationLevel?: number
  escalatedTo?: string[]                // User IDs
  escalatedAt?: Date

  // Client Communication
  clientNotified: boolean
  notifiedAt?: Date
  notificationMethod?: 'email' | 'phone' | 'portal'
  clientAcknowledged?: boolean

  // Audit
  createdAt: Date
  lastModifiedAt: Date
  lastModifiedBy: string
}
```

### Penalty Calculation Examples

**Example 1: Uptime Breach (Service Credit)**
```typescript
// Gold Tier: 99.9% uptime guarantee (43.8 min/month allowed)
// Actual: 99.5% uptime (3.65 hours downtime)
// Breach: 3.65 hours - 0.73 hours = 2.92 hours over

// Penalty Structure:
// - 0-1 hour over: 5% service credit
// - 1-4 hours over: 10% service credit
// - 4+ hours over: 15% service credit + escalation

// Calculation:
// Monthly fee: $5,000
// Breach: 2.92 hours over target
// Penalty: 10% service credit = $500

const breach: BreachPenalty = {
  breachType: 'uptime',
  severity: 'moderate',
  penaltyType: 'service_credit',
  penaltyAmount: 500,
  penaltyUnit: 'fixed',
  description: 'Uptime fell below 99.9% guarantee',
  triggers: ['uptime < 99.9%', 'downtime > 43.8 minutes'],
}
```

**Example 2: Response Time Breach (Escalating Penalties)**
```typescript
// Platinum Tier P1: 15-minute response required
// Actual: 45-minute response
// Breach: 30 minutes over SLA

// Penalty Structure (per occurrence):
// - 1st breach/month: Warning
// - 2nd breach/month: 5% credit
// - 3rd+ breach/month: 10% credit + executive escalation

// Monthly calculation:
// Total P1 tickets: 10
// Breached: 3
// Penalty: Warning + 5% + 10% = 15% total

const monthlyBreachTracking = {
  month: '2025-01',
  p1Breaches: 3,
  totalCredits: 0.15, // 15% of monthly fee
  escalationRequired: true,
  performanceReviewScheduled: true
}
```

### Escalation Procedures

**Level 1: Internal (Automatic)**
- Trigger: 50% of SLA time elapsed
- Action: Notify senior technician
- Auto-assign to higher skill level
- Update client with status

**Level 2: Management (Automatic)**
- Trigger: 75% of SLA time elapsed OR SLA breach
- Action: Notify team lead/manager
- Resource reallocation
- Client escalation notification

**Level 3: Executive (Manual/Auto)**
- Trigger: Multiple breaches, critical impact, or client request
- Action: VP/Director engagement
- Root cause analysis required
- Client executive communication
- Service improvement plan

**Level 4: Contract Review (Manual)**
- Trigger: Repeated Level 3 escalations, pattern of breaches
- Action: Executive review of agreement
- Potential contract renegotiation
- Performance improvement plan (PIP)
- Risk of termination clause invocation

---

## Billing Integration

### Agreement-Based Billing Models

```typescript
interface AgreementBilling {
  _id: ObjectId
  orgId: string
  agreementId: string
  clientId: string

  // Billing Configuration
  billingModel: BillingModel
  billingFrequency: BillingCycle
  billingStartDate: Date
  nextBillingDate: Date

  // Pricing
  recurringAmount?: number              // Fixed monthly/annual fee
  hourlyRate?: number                   // For T&M billing
  includedHours?: number                // Retainer hours
  overageRate?: number                  // Rate for hours over limit
  minimumMonthlyCharge?: number         // Floor for usage-based billing

  // Invoicing
  invoiceTemplateId?: string
  invoicePrefix?: string                // e.g., "SLA-", "MSA-"
  autoGenerateInvoices: boolean
  invoiceDayOfMonth?: number            // Day invoice is generated
  paymentTermsDays: number              // Net 15, 30, etc.

  // Usage Tracking (T&M and Retainer)
  trackTimeAgainstAgreement: boolean
  currentPeriodHours?: number           // Hours used this period
  currentPeriodAmount?: number          // Amount billed this period
  lifetimeHours?: number                // Total hours over agreement life
  lifetimeAmount?: number               // Total revenue from agreement

  // Credits & Adjustments
  pendingCredits?: number               // SLA credits to apply
  adjustments?: BillingAdjustment[]

  // Integration
  syncToQuickBooks?: boolean
  syncToXero?: boolean
  externalAccountingId?: string         // External system reference

  // Status
  billingStatus: 'active' | 'suspended' | 'pending' | 'cancelled'
  lastInvoiceDate?: Date
  lastInvoiceId?: string

  createdAt: Date
  updatedAt: Date
}

interface BillingAdjustment {
  id: string
  date: Date
  type: 'credit' | 'debit' | 'discount' | 'waiver'
  amount: number
  reason: string
  relatedBreachId?: string              // Link to SLA breach
  approvedBy: string
  appliedToInvoiceId?: string
}

type BillingModel =
  | 'fixed_recurring'    // Fixed monthly/annual fee
  | 'time_materials'     // Hourly billing
  | 'retainer'           // Pre-paid hours
  | 'usage_based'        // Metered usage (e.g., per device)
  | 'milestone'          // SOW milestone payments
  | 'hybrid'             // Combination (e.g., base + overage)
```

### Integration with Tickets and Time Tracking

**Scenario 1: Retainer Agreement with Hour Pool**
```typescript
// Agreement: 40 hours/month included, $150/hour overage
// Current month usage: 52 hours
// Billing calculation:
// - Included: 40 hours @ $0 (covered by retainer)
// - Overage: 12 hours @ $150 = $1,800
// - Base retainer fee: $5,000
// - Total invoice: $6,800

const invoice = {
  agreementId: 'agr_123',
  baseFee: 5000,
  includedHours: 40,
  usedHours: 52,
  overageHours: 12,
  overageRate: 150,
  overageCharge: 1800,
  totalAmount: 6800,
  lineItems: [
    { description: 'Managed Services Retainer', quantity: 1, rate: 5000, amount: 5000 },
    { description: 'Additional Hours (12 @ $150/hr)', quantity: 12, rate: 150, amount: 1800 }
  ]
}
```

**Scenario 2: Time & Materials with Agreement Cap**
```typescript
// Agreement: T&M not to exceed $10,000/month
// Current month:
// - Senior Engineer: 20 hours @ $200/hr = $4,000
// - Technician: 40 hours @ $125/hr = $5,000
// - Total: $9,000 (under cap)

const timeEntries = [
  { userId: 'user_1', ticketId: 'tkt_1', hours: 20, rate: 200, agreementId: 'agr_123' },
  { userId: 'user_2', ticketId: 'tkt_2', hours: 40, rate: 125, agreementId: 'agr_123' }
]

const monthlyTotal = calculateAgreementTime('agr_123', '2025-01')
// Returns: { hours: 60, amount: 9000, cap: 10000, underCap: true }
```

**Scenario 3: Fixed Fee with SLA Credits**
```typescript
// Agreement: $5,000/month fixed
// SLA breaches: 2 this month
// Credits: 5% + 10% = 15% = $750
// Invoice: $5,000 - $750 = $4,250

const invoice = {
  agreementId: 'agr_456',
  baseFee: 5000,
  slaCredits: -750,
  totalAmount: 4250,
  creditDetails: [
    { breachId: 'breach_1', creditPercent: 5, creditAmount: 250 },
    { breachId: 'breach_2', creditPercent: 10, creditAmount: 500 }
  ]
}
```

### Service Catalog Integration

Link agreements to Service Catalog items for standardized offerings:

```typescript
interface ServiceCatalogItem {
  _id: ObjectId
  orgId: string

  // Service Details
  serviceName: string
  serviceCode: string                   // e.g., "MS-GOLD-24x7"
  category: string
  description: string

  // Default Agreement Settings
  defaultAgreementType: AgreementType
  defaultTier?: string                  // "Gold", "Silver", etc.
  defaultTerm: number                   // Months
  defaultBillingCycle: BillingCycle

  // Pricing
  basePrice: number
  pricingModel: 'per_user' | 'per_device' | 'flat_fee' | 'tiered'
  pricingTiers?: PricingTier[]

  // SLA Defaults
  defaultPriorityLevels?: PriorityLevel[]
  defaultUptimeTarget?: number

  // Template Reference
  agreementTemplateId?: string

  isActive: boolean
  createdAt: Date
}

interface PricingTier {
  minQuantity: number
  maxQuantity?: number
  pricePerUnit: number
  flatFee?: number
}

// Example: Link service catalog to new agreement
async function createAgreementFromService(
  clientId: string,
  serviceId: string,
  customizations?: Partial<BaseAgreement>
): Promise<BaseAgreement> {
  const service = await getServiceCatalogItem(serviceId)
  const template = await getAgreementTemplate(service.agreementTemplateId)

  return {
    ...template.defaultValues,
    clientId,
    agreementType: service.defaultAgreementType,
    billingCycle: service.defaultBillingCycle,
    totalValue: service.basePrice,
    ...customizations
  }
}
```

---

## Renewal Management

### Automated Renewal Workflow

```typescript
interface RenewalConfiguration {
  _id: ObjectId
  orgId: string

  // Global Settings
  defaultRenewalNoticedays: number[]    // [90, 60, 30, 15, 7]
  autoRenewByDefault: boolean
  requireApprovalForAutoRenew: boolean

  // Notification Settings
  notificationChannels: ('email' | 'portal' | 'sms' | 'slack')[]
  notifyAccountManager: boolean
  notifyClient: boolean
  escalateIfNoResponse: boolean
  escalationDays: number

  // Renewal Terms
  allowTermChanges: boolean             // Can change term on renewal
  allowPriceIncrease: boolean
  maxPriceIncreasePercent?: number      // e.g., 10%
  requireClientApprovalForIncrease: boolean

  // Document Management
  regenerateDocumentOnRenew: boolean
  requireESignature: boolean

  createdAt: Date
  updatedAt: Date
}

interface RenewalProcess {
  _id: ObjectId
  orgId: string
  agreementId: string
  clientId: string

  // Renewal Details
  currentEndDate: Date
  proposedStartDate: Date
  proposedEndDate: Date
  renewalTerm: number                   // Months

  // Status Tracking
  status: RenewalStatus
  initiatedAt: Date
  completedAt?: Date

  // Notifications
  notificationsSent: RenewalNotification[]
  lastNotificationDate?: Date
  clientResponseDate?: Date

  // Terms
  currentTerms: AgreementTerms
  proposedTerms: AgreementTerms
  termsChanged: boolean
  changeDescription?: string

  // Approvals
  internalApprovalRequired: boolean
  internalApprovedBy?: string
  internalApprovedAt?: Date
  clientApprovalRequired: boolean
  clientApprovedBy?: string
  clientApprovedAt?: Date

  // Document
  renewalDocumentId?: string
  eSignatureStatus?: 'pending' | 'sent' | 'signed' | 'declined'

  // Outcome
  renewed: boolean
  renewedAgreementId?: string           // New agreement ID if renewed
  declinedReason?: string

  createdBy: string
  createdAt: Date
  updatedAt: Date
}

type RenewalStatus =
  | 'scheduled'          // Future renewal, not yet active
  | 'pending'            // In renewal window, awaiting action
  | 'client_review'      // Sent to client for review
  | 'awaiting_signature' // Sent for e-signature
  | 'approved'           // Approved, pending effective date
  | 'renewed'            // Successfully renewed
  | 'declined'           // Client declined renewal
  | 'expired'            // Agreement expired without renewal
  | 'cancelled'          // Renewal cancelled

interface RenewalNotification {
  sentAt: Date
  type: 'initial' | 'reminder' | 'final_notice' | 'expired'
  daysUntilExpiration: number
  sentTo: string[]                      // Email addresses
  channel: 'email' | 'portal' | 'sms' | 'slack'
  opened?: boolean
  openedAt?: Date
  responded?: boolean
  respondedAt?: Date
}

interface AgreementTerms {
  totalValue: number
  billingCycle: BillingCycle
  term: number
  tier?: string
  includedHours?: number
  autoRenew: boolean
}
```

### Renewal Timeline (90-Day Process)

**Day -90 (3 months before expiration)**
- Internal notification to Account Manager
- Review current agreement performance
- Identify upsell opportunities
- Prepare renewal proposal

**Day -60**
- First client notification
- Send renewal proposal
- Schedule renewal discussion meeting
- Update client on service performance

**Day -30**
- Second client notification (if no response)
- Escalate to Account Manager
- Follow-up call scheduled
- Prepare alternative terms if needed

**Day -15**
- Third notification (final reminder)
- Escalate to senior management
- Confirm renewal status
- Begin offboarding process if declining

**Day -7**
- Final notice
- Executive escalation
- Confirm decision required

**Day 0 (Expiration date)**
- If renewed: New agreement starts
- If not renewed: Agreement expires, services terminate
- Update billing system
- Archive expired agreement

---

## UI/UX Design

### Agreements Tab Layout

The Agreements tab on the client details page should provide comprehensive agreement management with an intuitive interface.

#### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Client: Acme Corporation                          [+ New Agreement] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Agreement Summary Cards ────────────────────────────────┐   │
│ │                                                           │   │
│ │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│ │  │    MSA     │  │    SLA     │  │    SOW     │         │   │
│ │  │  Active: 1 │  │  Active: 2 │  │  Active: 3 │         │   │
│ │  │  Total: 2  │  │  Total: 3  │  │  Total: 8  │         │   │
│ │  └────────────┘  └────────────┘  └────────────┘         │   │
│ │                                                           │   │
│ │  Total Contract Value: $156,000/year                     │   │
│ │  Expiring Soon: 2 agreements (within 60 days)            │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Filters & Search ────────────────────────────────────────┐   │
│ │ Type: [All ▾]  Status: [All ▾]  Expiring: [All ▾]        │   │
│ │ Search: [_________________________] [🔍]                  │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Active Agreements Table ────────────────────────────────┐   │
│ │                                                           │   │
│ │ Agreement #   │ Type │ Status │ Start    │ End      │ Value │ │
│ │───────────────┼──────┼────────┼──────────┼──────────┼────── │ │
│ │ AGR-2024-0123 │ MSA  │ Active │ 01/01/24 │ 12/31/26 │ $60K  │ │
│ │ AGR-2024-0124 │ SLA  │ Active │ 01/01/24 │ 12/31/24 │ $36K  │ │
│ │ AGR-2024-0156 │ SOW  │ Active │ 03/15/24 │ 06/15/24 │ $25K  │ │
│ │ AGR-2024-0189 │ SLA  │ Expiring│ 01/01/24 │ 12/31/24 │ $48K  │ │
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ [Show Inactive]  [Export to CSV]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Agreement Detail Modal

```
┌─────────────────────────────────────────────────────────────────┐
│ Agreement Details - AGR-2024-0124                    [✕ Close]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ ┌─ Tabs ──────────────────────────────────────────────────┐   │
│ │ [Overview] [SLA Metrics] [Billing] [Documents] [History] │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Overview Tab ─────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │ Agreement Type: Service Level Agreement                    │ │
│ │ Status: [🟢 Active]                                        │ │
│ │ SLA Tier: Gold (24x7 Support)                              │ │
│ │                                                             │ │
│ │ ┌─ Dates ────────────────────────────────────────────────┐ │ │
│ │ │ Start Date:     01/01/2024                             │ │ │
│ │ │ End Date:       12/31/2024                             │ │ │
│ │ │ Signed Date:    12/15/2023                             │ │ │
│ │ │ Days Remaining: 147 days ⚠️ Renewal Notice Period     │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ ┌─ Renewal ───────────────────────────────────────────────┐ │ │
│ │ │ Auto-Renew: ✓ Enabled                                  │ │ │
│ │ │ Renewal Term: 12 months                                │ │ │
│ │ │ Renewal Notice: 60 days                                │ │ │
│ │ │ Next Action: Client notification (30 days)             │ │ │
│ │ │ [Start Renewal Process]                                │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ ┌─ Financial ─────────────────────────────────────────────┐ │ │
│ │ │ Total Value:        $48,000/year                       │ │ │
│ │ │ Billing Cycle:      Monthly ($4,000)                   │ │ │
│ │ │ Payment Terms:      Net 15                             │ │ │
│ │ │ Current Period Usage: 32 hours / 40 included           │ │ │
│ │ │ YTD Revenue:        $28,000 (7 months)                 │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ ┌─ Stakeholders ──────────────────────────────────────────┐ │ │
│ │ │ Client Contact:    John Smith (john@acme.com)          │ │ │
│ │ │ Account Manager:   Jane Doe                            │ │ │
│ │ │ Approved By:       Sarah Johnson, Mike Chen            │ │ │
│ │ └────────────────────────────────────────────────────────┘ │ │
│ │                                                             │ │
│ │ [Edit Agreement] [Upload Document] [Terminate]            │ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### SLA Metrics Tab

```
┌─ SLA Performance ───────────────────────────────────────────────┐
│                                                                 │
│ ┌─ Current Month Performance ─────────────────────────────┐   │
│ │                                                           │   │
│ │  SLA Compliance: 94.2% ⚠️ Below Target (95%)            │   │
│ │  ┌──────────────────────────────────────────────────┐    │   │
│ │  │ [████████████████████░░░░] 94.2%                 │    │   │
│ │  └──────────────────────────────────────────────────┘    │   │
│ │                                                           │   │
│ │  Total Tickets: 127                                       │   │
│ │  SLA Met: 120 (94.2%)                                     │   │
│ │  SLA Breached: 7 (5.8%)                                   │   │
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Priority Level Performance ─────────────────────────────┐   │
│ │                                                           │   │
│ │  Priority │ Target  │ Avg Response │ Compliance │ Breaches│ │
│ │───────────┼─────────┼──────────────┼────────────┼─────────│ │
│ │  P1       │ 30 min  │ 28 min       │ 100% 🟢    │ 0       │ │
│ │  P2       │ 2 hours │ 1.8 hours    │ 95%  🟡    │ 2       │ │
│ │  P3       │ 8 hours │ 9.2 hours    │ 88%  🔴    │ 5       │ │
│ │  P4       │ 48 hours│ 24 hours     │ 100% 🟢    │ 0       │ │
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Recent SLA Breaches ─────────────────────────────────────┐   │
│ │                                                           │   │
│ │  Date     │ Ticket   │ Priority │ Target │ Actual │ Penalty│ │
│ │───────────┼──────────┼──────────┼────────┼────────┼────────│ │
│ │  07/15/24 │ TKT-1234 │ P3       │ 8hr    │ 12hr   │ Warning│ │
│ │  07/12/24 │ TKT-1189 │ P2       │ 2hr    │ 3.5hr  │ 5% Cr. │ │
│ │  07/08/24 │ TKT-1156 │ P3       │ 8hr    │ 10hr   │ Warning│ │
│ │                                                           │   │
│ │  [View All Breaches]                                      │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ Credits & Penalties ─────────────────────────────────────┐   │
│ │                                                           │   │
│ │  Pending Credits: $200 (5% of monthly fee)                │   │
│ │  Applied Credits YTD: $450                                │   │
│ │  Next Invoice Adjustment: -$200                           │   │
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─ 6-Month Trend Chart ─────────────────────────────────────┐   │
│ │                                                           │   │
│ │   100% │     ●────●────●                                  │   │
│ │    95% │ ───┼────┼────┼────●────●────●  ← Target        │   │
│ │    90% │                                                  │   │
│ │    85% │                                                  │   │
│ │        └────────────────────────────────────────          │   │
│ │         Jan  Feb  Mar  Apr  May  Jun  Jul                │   │
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Visual Design Elements

**Status Badges**:
- 🟢 Active (Green)
- 🟡 Expiring Soon (Yellow) - within renewal notice period
- 🔴 Expired (Red)
- ⚫ Terminated (Gray)
- 🔵 Draft (Blue)
- 🟣 Pending Signature (Purple)

**Tier Badges** (SLA):
- 💎 Platinum (Purple gradient)
- 🥇 Gold (Gold gradient)
- 🥈 Silver (Silver gradient)
- 🥉 Bronze (Bronze gradient)

**Priority Indicators**:
- P1 Critical: 🔴 Red circle with "P1"
- P2 High: 🟠 Orange circle with "P2"
- P3 Medium: 🟡 Yellow circle with "P3"
- P4 Low: 🔵 Blue circle with "P4"

**Action Buttons**:
- Primary: Blue gradient (New Agreement, Save, Renew)
- Secondary: Gray outline (Edit, View Details)
- Danger: Red (Terminate, Delete)
- Success: Green (Approve, Sign)

---

## API Endpoints

### Agreement Management

```typescript
// GET /api/agreements
// List all agreements for organization with filters
// Query params: clientId, type, status, expiring (boolean)
GET /api/agreements?clientId=client_123&status=active

// GET /api/agreements/[id]
// Get single agreement by ID
GET /api/agreements/agr_123

// POST /api/agreements
// Create new agreement
POST /api/agreements
Body: {
  agreementType: 'SLA',
  clientId: 'client_123',
  tier: { name: 'Gold', level: 2 },
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  // ... other fields
}

// PUT /api/agreements/[id]
// Update agreement
PUT /api/agreements/agr_123
Body: {
  totalValue: 50000,
  updatedBy: 'user_456'
}

// DELETE /api/agreements/[id]
// Soft delete agreement
DELETE /api/agreements/agr_123

// POST /api/agreements/[id]/terminate
// Terminate agreement early
POST /api/agreements/agr_123/terminate
Body: {
  terminationDate: '2024-07-15',
  terminationReason: 'Client request',
  terminatedBy: 'user_789'
}

// POST /api/agreements/[id]/renew
// Initiate renewal process
POST /api/agreements/agr_123/renew
Body: {
  renewalTerm: 12,
  proposedChanges: { totalValue: 55000 }
}

// GET /api/agreements/[id]/breaches
// Get SLA breaches for agreement
GET /api/agreements/agr_123/breaches?startDate=2024-01-01&endDate=2024-12-31

// POST /api/agreements/[id]/breaches
// Record SLA breach (usually automated)
POST /api/agreements/agr_123/breaches
Body: {
  breachType: 'response',
  ticketId: 'tkt_456',
  targetTime: 120,
  actualTime: 180,
  severity: 'moderate'
}

// GET /api/agreements/[id]/metrics
// Get SLA performance metrics
GET /api/agreements/agr_123/metrics?period=current_month

// POST /api/agreements/[id]/amendments
// Create amendment to agreement
POST /api/agreements/agr_123/amendments
Body: {
  description: 'Increase hourly rate',
  changedFields: [
    { fieldPath: 'hourlyRate', oldValue: 150, newValue: 175, changeReason: 'Annual increase' }
  ],
  effectiveDate: '2024-08-01'
}

// GET /api/agreements/expiring
// Get agreements expiring soon
GET /api/agreements/expiring?days=60

// POST /api/agreements/[id]/documents/upload
// Upload signed agreement document
POST /api/agreements/agr_123/documents/upload
Body: FormData with file

// POST /api/agreements/[id]/esignature/send
// Send for e-signature
POST /api/agreements/agr_123/esignature/send
Body: {
  provider: 'docusign',
  signers: [
    { name: 'John Smith', email: 'john@acme.com', role: 'client' },
    { name: 'Jane Doe', email: 'jane@msp.com', role: 'provider' }
  ]
}

// GET /api/agreements/[id]/esignature/status
// Check e-signature status
GET /api/agreements/agr_123/esignature/status
```

### Agreement Templates

```typescript
// GET /api/agreement-templates
// List all templates
GET /api/agreement-templates?type=SLA

// POST /api/agreement-templates
// Create new template
POST /api/agreement-templates
Body: {
  templateName: 'Standard Gold SLA',
  agreementType: 'SLA',
  defaultValues: { ... },
  templateHtml: '<html>...</html>'
}

// POST /api/agreements/from-template
// Create agreement from template
POST /api/agreements/from-template
Body: {
  templateId: 'tmpl_123',
  clientId: 'client_456',
  customizations: { totalValue: 48000 }
}
```

### Billing Integration

```typescript
// GET /api/agreements/[id]/billing
// Get billing configuration
GET /api/agreements/agr_123/billing

// PUT /api/agreements/[id]/billing
// Update billing configuration
PUT /api/agreements/agr_123/billing
Body: {
  billingFrequency: 'monthly',
  recurringAmount: 4000
}

// GET /api/agreements/[id]/usage
// Get current usage (hours, amount)
GET /api/agreements/agr_123/usage?period=current_month

// POST /api/agreements/[id]/credits
// Apply SLA credit
POST /api/agreements/agr_123/credits
Body: {
  breachId: 'breach_789',
  creditAmount: 200,
  reason: 'P2 response SLA breach'
}
```

### Renewal Management

```typescript
// GET /api/renewals
// Get pending renewals
GET /api/renewals?status=pending

// POST /api/renewals/[id]/approve
// Approve renewal
POST /api/renewals/ren_123/approve
Body: {
  approvedBy: 'user_456',
  notes: 'Approved with 5% price increase'
}

// POST /api/renewals/[id]/notify
// Send renewal notification
POST /api/renewals/ren_123/notify
Body: {
  notificationType: 'reminder',
  channel: 'email'
}
```

---

## Integration Points

### 1. Tickets Module Integration

**Auto-Link Tickets to Agreements**:
```typescript
// When creating ticket, auto-detect client's active SLA
async function createTicket(ticketData: Partial<Ticket>) {
  const clientSLA = await getActiveClientSLA(ticketData.clientId)

  if (clientSLA) {
    ticketData.agreementId = clientSLA._id
    ticketData.priority = determinePriorityFromSLA(ticketData, clientSLA)
    ticketData.slaTarget = calculateSLATarget(ticketData.priority, clientSLA)
  }

  return await insertTicket(ticketData)
}
```

**SLA Countdown Timer**:
```typescript
// Display SLA countdown on ticket detail page
interface SLACountdown {
  agreementId: string
  targetResponseTime: Date
  targetResolutionTime?: Date
  timeRemaining: number              // Minutes
  status: 'on_track' | 'at_risk' | 'breached'
  breachId?: string
}
```

**Breach Detection**:
```typescript
// Background job to detect SLA breaches
async function checkSLABreaches() {
  const activeTickets = await getTicketsWithSLA()

  for (const ticket of activeTickets) {
    const agreement = await getAgreement(ticket.agreementId)
    const priorityLevel = agreement.priorityLevels.find(p => p.priority === ticket.priority)

    // Check response time breach
    if (!ticket.firstResponseAt) {
      const minutesElapsed = (Date.now() - ticket.createdAt.getTime()) / 60000
      if (minutesElapsed > priorityLevel.responseTime) {
        await recordSLABreach({
          agreementId: agreement._id,
          ticketId: ticket._id,
          breachType: 'response',
          targetTime: priorityLevel.responseTime,
          actualTime: minutesElapsed
        })
      }
    }

    // Check resolution time breach
    if (!ticket.resolvedAt && priorityLevel.resolutionTime) {
      const minutesElapsed = (Date.now() - ticket.createdAt.getTime()) / 60000
      if (minutesElapsed > priorityLevel.resolutionTime) {
        await recordSLABreach({
          agreementId: agreement._id,
          ticketId: ticket._id,
          breachType: 'resolution',
          targetTime: priorityLevel.resolutionTime,
          actualTime: minutesElapsed
        })
      }
    }
  }
}

// Run every 5 minutes
setInterval(checkSLABreaches, 5 * 60 * 1000)
```

### 2. Billing Module Integration

**Agreement-Based Invoicing**:
```typescript
// Generate invoice from agreement
async function generateMonthlyInvoice(agreementId: string, month: string) {
  const agreement = await getAgreement(agreementId)
  const billing = await getAgreementBilling(agreementId)
  const usage = await getMonthlyUsage(agreementId, month)
  const credits = await getPendingCredits(agreementId)

  const invoice = {
    clientId: agreement.clientId,
    agreementId: agreement._id,
    invoiceDate: new Date(),
    dueDate: addDays(new Date(), billing.paymentTermsDays),
    lineItems: [],
    subtotal: 0,
    credits: 0,
    total: 0
  }

  // Add base recurring fee
  if (billing.recurringAmount) {
    invoice.lineItems.push({
      description: `${agreement.title} - Monthly Fee`,
      quantity: 1,
      rate: billing.recurringAmount,
      amount: billing.recurringAmount
    })
    invoice.subtotal += billing.recurringAmount
  }

  // Add usage overage (if retainer)
  if (agreement.agreementType === 'Maintenance' && usage.overageHours > 0) {
    const overageAmount = usage.overageHours * agreement.overageRate
    invoice.lineItems.push({
      description: `Additional Hours (${usage.overageHours} @ $${agreement.overageRate}/hr)`,
      quantity: usage.overageHours,
      rate: agreement.overageRate,
      amount: overageAmount
    })
    invoice.subtotal += overageAmount
  }

  // Apply SLA credits
  if (credits.length > 0) {
    const totalCredit = credits.reduce((sum, c) => sum + c.creditAmount, 0)
    invoice.lineItems.push({
      description: `SLA Credits (${credits.length} breaches)`,
      quantity: 1,
      rate: -totalCredit,
      amount: -totalCredit
    })
    invoice.credits = totalCredit
  }

  invoice.total = invoice.subtotal - invoice.credits

  return await createInvoice(invoice)
}
```

**Time Entry Tracking**:
```typescript
// Link time entries to agreements
interface TimeEntry {
  _id: ObjectId
  orgId: string
  userId: string
  ticketId?: string
  agreementId?: string              // Link to agreement
  clientId: string

  startTime: Date
  endTime?: Date
  duration: number                  // Minutes
  description: string

  billable: boolean
  hourlyRate?: number
  billedAmount?: number

  countsAgainstRetainer: boolean    // For retainer agreements
  invoiceId?: string                // Once invoiced

  createdAt: Date
}

// Aggregate time for agreement
async function getAgreementTimeUsage(agreementId: string, startDate: Date, endDate: Date) {
  const timeEntries = await db.collection('time_entries').find({
    agreementId,
    startTime: { $gte: startDate, $lte: endDate },
    billable: true
  }).toArray()

  return {
    totalHours: timeEntries.reduce((sum, t) => sum + t.duration / 60, 0),
    totalAmount: timeEntries.reduce((sum, t) => sum + (t.billedAmount || 0), 0),
    entriesCount: timeEntries.length
  }
}
```

### 3. Client Portal Integration

**Client-Facing Agreement Dashboard**:
```typescript
// Client can view their agreements
// Route: /portal/agreements

interface ClientAgreementView {
  agreement: Omit<BaseAgreement, 'internalNotes' | 'costData'>  // Hide sensitive fields
  currentPerformance: {
    slaCompliance: number
    averageResponseTime: number
    openTickets: number
    resolvedTickets: number
  }
  upcomingRenewal?: {
    daysUntilExpiration: number
    renewalInProgress: boolean
    actionRequired: boolean
  }
  documents: AttachmentInfo[]
  monthlyUsage?: {
    hoursUsed: number
    hoursIncluded: number
    overageHours: number
  }
}
```

**Self-Service Renewal**:
```typescript
// Client can initiate renewal from portal
// POST /api/portal/agreements/[id]/request-renewal

async function requestRenewal(agreementId: string, clientUserId: string) {
  const agreement = await getAgreement(agreementId)

  // Create renewal process
  const renewal = await createRenewalProcess({
    agreementId,
    initiatedBy: clientUserId,
    status: 'client_review',
    proposedTerms: agreement.currentTerms
  })

  // Notify account manager
  await sendNotification({
    to: agreement.accountManager,
    subject: `Renewal request from ${agreement.clientName}`,
    type: 'renewal_requested'
  })

  return renewal
}
```

### 4. Assets Module Integration

**Asset Coverage Tracking**:
```typescript
// Link agreements to covered assets
interface AssetCoverage {
  _id: ObjectId
  orgId: string
  agreementId: string
  assetId: string

  coverageType: 'full' | 'limited' | 'warranty_only'
  startDate: Date
  endDate: Date

  includedServices: string[]        // What's covered
  exclusions?: string[]             // What's not covered

  responseTime?: string             // Asset-specific SLA
  replacementGuarantee?: boolean

  isActive: boolean
}

// Query: Which agreements cover this asset?
async function getAssetAgreements(assetId: string) {
  return await db.collection('asset_coverage').find({
    assetId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  }).toArray()
}
```

### 5. Projects Module Integration

**SOW to Project Conversion**:
```typescript
// Convert SOW deliverables into project tasks
async function createProjectFromSOW(sowId: string) {
  const sow = await getAgreement(sowId) as StatementOfWork

  const project = {
    name: sow.projectName,
    description: sow.projectObjectives,
    clientId: sow.clientId,
    agreementId: sowId,
    startDate: sow.startDate,
    endDate: sow.endDate,
    budget: sow.totalValue,
    status: 'planning',
    tasks: [],
    milestones: []
  }

  // Convert deliverables to tasks
  for (const deliverable of sow.deliverables) {
    project.tasks.push({
      name: deliverable.name,
      description: deliverable.description,
      dueDate: deliverable.dueDate,
      assignedTo: deliverable.assignedTo,
      status: 'not_started',
      deliverableId: deliverable.id
    })
  }

  // Convert milestones
  for (const milestone of sow.milestones) {
    project.milestones.push({
      name: milestone.name,
      targetDate: milestone.targetDate,
      paymentAmount: milestone.paymentAmount,
      taskIds: [] // Link to tasks
    })
  }

  return await createProject(project)
}
```

### 6. Scheduling Module Integration

**Schedule Reviews and QBRs**:
```typescript
// Auto-schedule QBRs based on agreement
async function scheduleAgreementReviews(agreementId: string) {
  const agreement = await getAgreement(agreementId)

  if (agreement.agreementType === 'SLA' && agreement.reportingFrequency === 'quarterly') {
    // Schedule 4 QBRs for the year
    const qbrDates = [
      addMonths(agreement.startDate, 3),
      addMonths(agreement.startDate, 6),
      addMonths(agreement.startDate, 9),
      addMonths(agreement.startDate, 12)
    ]

    for (const date of qbrDates) {
      await createScheduleItem({
        title: `QBR - ${agreement.clientName}`,
        type: 'meeting',
        startTime: date,
        duration: 60,
        attendees: [agreement.accountManager, agreement.primaryContact],
        agreementId: agreement._id,
        description: 'Quarterly Business Review'
      })
    }
  }
}
```

### 7. Knowledge Base Integration

**Link KB Articles to Agreement Types**:
```typescript
// Tag KB articles relevant to agreement management
const agreementKBArticles = [
  { title: 'Understanding Your SLA', category: 'Agreements', tags: ['SLA', 'client-facing'] },
  { title: 'How to Request a Renewal', category: 'Agreements', tags: ['renewal', 'client-facing'] },
  { title: 'SLA Response Time Definitions', category: 'Agreements', tags: ['SLA', 'support'] }
]

// Display relevant articles in client portal agreements section
```

### 8. Audit Logs Integration

**Comprehensive Audit Trail**:
```typescript
// Log all agreement actions
async function logAgreementAction(
  action: string,
  agreementId: string,
  userId: string,
  details?: any
) {
  await db.collection('audit_logs').insertOne({
    orgId: session.user.orgId,
    module: 'agreements',
    action,
    resourceType: 'agreement',
    resourceId: agreementId,
    performedBy: userId,
    performedAt: new Date(),
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    details
  })
}

// Example usage:
await logAgreementAction('agreement_created', agreement._id, userId, { type: 'SLA', clientId })
await logAgreementAction('sla_breach_recorded', agreement._id, 'system', { ticketId, breachType })
await logAgreementAction('renewal_initiated', agreement._id, userId, { renewalTerm: 12 })
```

---

## E-Signature Integration

### Supported Providers

#### DocuSign Integration

```typescript
interface DocuSignConfig {
  accountId: string
  apiBaseUrl: string                    // e.g., "https://demo.docusign.net/restapi"
  integrationKey: string
  secretKey: string
  redirectUri: string
}

async function sendDocuSignEnvelope(
  agreementId: string,
  documentBase64: string,
  signers: SignerInfo[]
): Promise<EnvelopeStatus> {
  const envelope = {
    emailSubject: `Please sign: Agreement ${agreementId}`,
    documents: [{
      documentBase64,
      name: 'agreement.pdf',
      fileExtension: 'pdf',
      documentId: '1'
    }],
    recipients: {
      signers: signers.map((s, idx) => ({
        email: s.email,
        name: s.name,
        recipientId: String(idx + 1),
        routingOrder: String(idx + 1),
        tabs: {
          signHereTabs: [{
            documentId: '1',
            pageNumber: '1',
            xPosition: '100',
            yPosition: '150'
          }]
        }
      }))
    },
    status: 'sent'
  }

  const response = await fetch(`${config.apiBaseUrl}/v2.1/accounts/${config.accountId}/envelopes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getDocuSignAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(envelope)
  })

  const result = await response.json()

  // Update agreement
  await updateAgreement(agreementId, {
    eSignatureProvider: 'docusign',
    eSignatureStatus: 'sent',
    eSignatureRequestId: result.envelopeId,
    status: 'pending_signature'
  })

  return result
}

// Webhook handler for DocuSign events
async function handleDocuSignWebhook(event: DocuSignEvent) {
  const { envelopeId, event: eventType } = event

  const agreement = await db.collection('agreements').findOne({
    eSignatureRequestId: envelopeId
  })

  if (!agreement) return

  switch (eventType) {
    case 'envelope-completed':
      await updateAgreement(agreement._id, {
        eSignatureStatus: 'completed',
        status: 'active',
        signedDate: new Date()
      })
      await logAgreementAction('agreement_signed', agreement._id, 'system', { provider: 'docusign' })
      break

    case 'envelope-declined':
      await updateAgreement(agreement._id, {
        eSignatureStatus: 'declined',
        status: 'draft'
      })
      break

    case 'envelope-voided':
      await updateAgreement(agreement._id, {
        eSignatureStatus: null,
        status: 'draft'
      })
      break
  }
}
```

#### Adobe Sign Integration

```typescript
interface AdobeSignConfig {
  apiBaseUrl: string                    // e.g., "https://api.na1.adobesign.com/api/rest/v6"
  integrationKey: string
  clientId: string
  clientSecret: string
  redirectUri: string
}

async function sendAdobeSignAgreement(
  agreementId: string,
  documentUrl: string,
  signers: SignerInfo[]
): Promise<AgreementStatus> {
  // Upload document
  const transientDoc = await uploadTransientDocument(documentUrl)

  // Create agreement
  const agreementRequest = {
    fileInfos: [{
      transientDocumentId: transientDoc.transientDocumentId
    }],
    name: `Agreement ${agreementId}`,
    participantSetsInfo: [{
      memberInfos: signers.map(s => ({
        email: s.email,
        name: s.name
      })),
      order: 1,
      role: 'SIGNER'
    }],
    signatureType: 'ESIGN',
    state: 'IN_PROCESS'
  }

  const response = await fetch(`${config.apiBaseUrl}/agreements`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getAdobeSignAccessToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(agreementRequest)
  })

  const result = await response.json()

  await updateAgreement(agreementId, {
    eSignatureProvider: 'adobe',
    eSignatureStatus: 'sent',
    eSignatureRequestId: result.id,
    status: 'pending_signature'
  })

  return result
}
```

#### Internal E-Signature (Fallback)

For basic needs without external provider:

```typescript
interface InternalSignature {
  _id: ObjectId
  agreementId: string
  signerUserId: string
  signerName: string
  signerEmail: string
  signerRole: 'client' | 'provider'

  signedAt: Date
  ipAddress: string
  userAgent: string

  signatureMethod: 'typed' | 'drawn' | 'uploaded'
  signatureData?: string                // Base64 image if drawn/uploaded
  consentText: string                   // "I agree to the terms..."
  consentGiven: boolean
}

async function recordInternalSignature(
  agreementId: string,
  signerData: Partial<InternalSignature>
): Promise<void> {
  await db.collection('agreement_signatures').insertOne({
    ...signerData,
    agreementId,
    signedAt: new Date(),
    _id: new ObjectId()
  })

  // Check if all required signatures collected
  const requiredSigners = await getRequiredSigners(agreementId)
  const collectedSignatures = await db.collection('agreement_signatures')
    .countDocuments({ agreementId })

  if (collectedSignatures >= requiredSigners.length) {
    await updateAgreement(agreementId, {
      eSignatureStatus: 'completed',
      status: 'active',
      signedDate: new Date()
    })
  }
}
```

---

## Reporting & Analytics

### Agreement Performance Dashboard

```typescript
interface AgreementAnalytics {
  // Portfolio Overview
  totalActiveAgreements: number
  totalContractValue: number
  totalAnnualRecurringRevenue: number
  averageAgreementValue: number

  // By Type
  agreementsByType: {
    type: AgreementType
    count: number
    value: number
  }[]

  // By Status
  agreementsByStatus: {
    status: AgreementStatus
    count: number
    value: number
  }[]

  // Renewal Pipeline
  renewalPipeline: {
    next30Days: number
    next60Days: number
    next90Days: number
    atRisk: number                      // Declining performance, potential non-renewal
  }

  // SLA Performance
  overallSLACompliance: number          // Percentage across all SLAs
  slaBreachesThisMonth: number
  slaCreditsIssuedYTD: number

  // Financial Impact
  monthlyRecurringRevenue: number
  projectedAnnualRevenue: number
  averageDealSize: number
  revenueByClient: {
    clientId: string
    clientName: string
    totalValue: number
    agreements: number
  }[]

  // Trends
  newAgreementsThisMonth: number
  renewalsThisMonth: number
  churnThisMonth: number                // Lost agreements
  netNewARR: number                     // New ARR minus churned ARR
}

// API endpoint
GET /api/reports/agreements/analytics?period=current_month
```

### SLA Performance Report

```typescript
interface SLAPerformanceReport {
  agreementId: string
  agreementName: string
  clientName: string
  reportPeriod: {
    startDate: Date
    endDate: Date
  }

  // Overall Metrics
  totalTickets: number
  slaCompliance: number                 // Percentage
  averageResponseTime: number           // Minutes
  averageResolutionTime: number         // Minutes

  // By Priority
  performanceByPriority: {
    priority: string
    tickets: number
    avgResponseTime: number
    targetResponseTime: number
    compliance: number
    breaches: number
  }[]

  // Breaches
  totalBreaches: number
  breachRate: number                    // Percentage
  breachDetails: {
    breachType: string
    count: number
    totalPenalty: number
  }[]

  // Credits
  totalCreditsIssued: number
  creditsByReason: {
    reason: string
    count: number
    amount: number
  }[]

  // Trends
  complianceTrend: {
    month: string
    compliance: number
  }[]

  // Top Issues
  mostBreachedTicketTypes: {
    type: string
    breaches: number
  }[]

  // Recommendations
  recommendations: string[]             // AI-generated insights
}

// Generate PDF report
POST /api/reports/sla/[agreementId]/generate?format=pdf
```

### Financial Performance Report

```typescript
interface AgreementFinancialReport {
  agreementId: string

  // Revenue Summary
  totalContractValue: number
  recognizedRevenue: number             // To date
  remainingValue: number
  revenueRecognitionRate: number        // Monthly/annual

  // Billing Summary
  invoicesGenerated: number
  totalBilled: number
  totalPaid: number
  outstandingBalance: number
  averageDaysToPay: number

  // Usage (for T&M and Retainer)
  totalHoursBilled: number
  includedHours?: number
  overageHours?: number
  overageRevenue?: number
  averageHourlyRate: number

  // Credits & Adjustments
  totalCredits: number
  totalAdjustments: number
  netRevenue: number                    // Total billed - credits - adjustments

  // Profitability (requires cost tracking)
  directCosts?: number
  grossProfit?: number
  profitMargin?: number

  // Payment History
  paymentHistory: {
    invoiceId: string
    invoiceDate: Date
    amount: number
    paidDate?: Date
    daysToPayment?: number
    status: string
  }[]
}
```

### Renewal Forecast Report

```typescript
interface RenewalForecastReport {
  period: string                        // e.g., "Q1 2025"

  // Renewal Pipeline
  upForRenewal: {
    count: number
    totalValue: number
    averageValue: number
  }

  // Risk Assessment
  lowRisk: {
    count: number
    value: number
    accounts: string[]
  }
  mediumRisk: {
    count: number
    value: number
    accounts: string[]
  }
  highRisk: {
    count: number
    value: number
    accounts: string[]
    reasons: string[]                   // Poor SLA performance, payment issues, etc.
  }

  // Forecasted Outcomes
  projectedRenewals: number
  projectedChurn: number
  projectedUpsells: number
  projectedDownsells: number
  netProjectedARR: number

  // Actions Required
  actionsNeeded: {
    agreementId: string
    clientName: string
    expirationDate: Date
    action: string
    priority: string
    assignedTo: string
  }[]
}
```

---

## Database Indexes

For optimal query performance:

```typescript
// Agreements collection
db.agreements.createIndex({ orgId: 1, clientId: 1 })
db.agreements.createIndex({ orgId: 1, status: 1 })
db.agreements.createIndex({ orgId: 1, agreementType: 1 })
db.agreements.createIndex({ orgId: 1, endDate: 1 })                      // Expiration queries
db.agreements.createIndex({ orgId: 1, autoRenew: 1, endDate: 1 })       // Renewal queries
db.agreements.createIndex({ agreementNumber: 1 }, { unique: true })

// SLA Breaches collection
db.sla_breaches.createIndex({ orgId: 1, agreementId: 1, breachedAt: -1 })
db.sla_breaches.createIndex({ orgId: 1, ticketId: 1 })
db.sla_breaches.createIndex({ orgId: 1, status: 1 })

// Agreement Billing collection
db.agreement_billing.createIndex({ orgId: 1, agreementId: 1 }, { unique: true })
db.agreement_billing.createIndex({ orgId: 1, nextBillingDate: 1 })

// Renewal Processes collection
db.renewal_processes.createIndex({ orgId: 1, agreementId: 1 })
db.renewal_processes.createIndex({ orgId: 1, status: 1 })

// Time Entries (add agreement index)
db.time_entries.createIndex({ orgId: 1, agreementId: 1, startTime: 1 })
db.time_entries.createIndex({ orgId: 1, agreementId: 1, billable: 1 })
```

---

## Implementation Roadmap

### Phase 1: Core Agreement Management (MVP)
**Timeline**: 2-3 weeks

- [ ] Database schema setup
- [ ] Basic CRUD API routes
- [ ] Agreement list/detail UI
- [ ] Agreement creation form
- [ ] Client-agreement linking
- [ ] Simple billing configuration
- [ ] Document upload

### Phase 2: SLA Management
**Timeline**: 2-3 weeks

- [ ] SLA tier configuration
- [ ] Priority level definitions
- [ ] Ticket-to-SLA linking
- [ ] SLA countdown timers
- [ ] Breach detection (automated job)
- [ ] SLA performance dashboard
- [ ] Basic reporting

### Phase 3: Billing Integration
**Timeline**: 2 weeks

- [ ] Agreement-based invoicing
- [ ] Time tracking integration
- [ ] Usage/overage calculations
- [ ] SLA credit application
- [ ] Invoice generation from agreements

### Phase 4: Renewal Management
**Timeline**: 2 weeks

- [ ] Renewal workflow
- [ ] Automated notifications (30/60/90 days)
- [ ] Renewal approval process
- [ ] Renewal dashboard
- [ ] Expiration warnings

### Phase 5: Advanced Features
**Timeline**: 3-4 weeks

- [ ] E-signature integration (DocuSign/Adobe)
- [ ] Agreement templates
- [ ] SOW to project conversion
- [ ] Asset coverage tracking
- [ ] Advanced analytics
- [ ] Client portal views
- [ ] Automated QBR scheduling

### Phase 6: Optimization & Polish
**Timeline**: 1-2 weeks

- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] User training materials

---

## Security Considerations

### Role-Based Access Control (RBAC)

```typescript
// Permission requirements for agreement operations

const agreementPermissions = {
  'agreements.view': ['admin', 'technician', 'user'],           // Can view agreements
  'agreements.create': ['admin', 'technician'],                 // Can create agreements
  'agreements.edit': ['admin'],                                 // Can edit agreements
  'agreements.delete': ['admin'],                               // Can delete agreements
  'agreements.terminate': ['admin'],                            // Can terminate early
  'agreements.approve': ['admin'],                              // Can approve agreements
  'agreements.sign': ['admin'],                                 // Can initiate e-signature
  'agreements.view_financial': ['admin', 'billing'],            // Can view financial details
  'agreements.manage_billing': ['admin', 'billing'],            // Can update billing config
  'sla.view_breaches': ['admin', 'technician'],                // Can view SLA breaches
  'sla.waive_breach': ['admin'],                               // Can waive breach penalties
  'renewals.manage': ['admin'],                                // Can manage renewals
}

// Check permission before operation
async function requireAgreementPermission(
  session: Session,
  permission: string
): Promise<boolean> {
  return await requirePermission(session, permission)
}
```

### Data Protection

- **Multi-Tenancy**: All queries MUST filter by `orgId`
- **Sensitive Data**: Encrypt financial terms, liability limits, and pricing data at rest
- **Document Security**: Store signed PDFs in encrypted cloud storage with access logging
- **Audit Trail**: Log all agreement modifications, views, and signature events
- **Access Logs**: Track who accessed which agreements and when

### E-Signature Compliance

- **Legal Validity**: Ensure e-signatures meet ESIGN Act and UETA requirements
- **Audit Trail**: Maintain complete signature audit trail (who, when, IP, user agent)
- **Consent**: Record explicit consent to use electronic signatures
- **Non-Repudiation**: Cryptographic hashing of signed documents
- **Retention**: Retain signed documents for legal retention period (typically 7 years)

---

## Testing Strategy

### Unit Tests

```typescript
// Example: SLA breach calculation
describe('SLA Breach Detection', () => {
  it('should detect response time breach', async () => {
    const ticket = createTestTicket({ priority: 'high', createdAt: new Date('2024-01-01T10:00:00Z') })
    const agreement = createTestSLA({ tier: 'Gold' })

    // Gold P2 = 2 hours
    const currentTime = new Date('2024-01-01T12:30:00Z') // 2.5 hours later

    const breach = await detectSLABreach(ticket, agreement, currentTime)

    expect(breach).toBeDefined()
    expect(breach.breachType).toBe('response')
    expect(breach.variance).toBe(-30) // 30 minutes over
  })

  it('should not breach if within SLA', async () => {
    const ticket = createTestTicket({ priority: 'high', createdAt: new Date('2024-01-01T10:00:00Z') })
    const agreement = createTestSLA({ tier: 'Gold' })

    const currentTime = new Date('2024-01-01T11:30:00Z') // 1.5 hours later

    const breach = await detectSLABreach(ticket, agreement, currentTime)

    expect(breach).toBeNull()
  })
})

// Example: Billing calculation
describe('Agreement Billing', () => {
  it('should calculate retainer overage correctly', async () => {
    const agreement = createTestRetainer({ includedHours: 40, overageRate: 150 })
    const usage = { totalHours: 52 }

    const invoice = await calculateRetainerInvoice(agreement, usage)

    expect(invoice.overageHours).toBe(12)
    expect(invoice.overageCharge).toBe(1800)
  })
})
```

### Integration Tests

```typescript
// Test full agreement lifecycle
describe('Agreement Lifecycle', () => {
  it('should complete full agreement workflow', async () => {
    // 1. Create agreement
    const agreement = await createAgreement({
      agreementType: 'SLA',
      clientId: testClient._id,
      tier: { name: 'Gold', level: 2 },
      startDate: new Date(),
      endDate: addYears(new Date(), 1)
    })

    expect(agreement).toBeDefined()
    expect(agreement.status).toBe('draft')

    // 2. Send for signature
    await sendForSignature(agreement._id, [
      { email: 'client@test.com', role: 'client' },
      { email: 'msp@test.com', role: 'provider' }
    ])

    const updated = await getAgreement(agreement._id)
    expect(updated.status).toBe('pending_signature')

    // 3. Simulate signatures
    await recordSignature(agreement._id, 'client@test.com')
    await recordSignature(agreement._id, 'msp@test.com')

    const signed = await getAgreement(agreement._id)
    expect(signed.status).toBe('active')
    expect(signed.signedDate).toBeDefined()

    // 4. Generate invoice
    const invoice = await generateMonthlyInvoice(agreement._id, '2024-01')
    expect(invoice.agreementId).toBe(agreement._id)

    // 5. Initiate renewal
    const renewal = await initiateRenewal(agreement._id)
    expect(renewal.agreementId).toBe(agreement._id)
  })
})
```

---

## Best Practices Summary

### Agreement Management Best Practices

1. **Use Templates**: Create reusable templates for standard offerings
2. **Version Control**: Track all amendments and changes with full audit trail
3. **Client Communication**: Set clear expectations upfront, document everything
4. **Regular Reviews**: Schedule QBRs and performance reviews
5. **Proactive Renewal**: Start renewal process 90 days before expiration
6. **Penalty Caps**: Always include maximum penalty caps to limit exposure
7. **Force Majeure**: Include clear force majeure provisions
8. **Escalation Procedures**: Define clear escalation paths for SLA breaches
9. **Metrics-Driven**: Use measurable, objective metrics (avoid subjective SLAs)
10. **Documentation**: Maintain comprehensive documentation of all agreements

### SLA Best Practices

1. **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
2. **Conservative Targets**: Better to overperform than overpromise
3. **Clear Definitions**: Define priority levels with specific examples
4. **Business Hours Alignment**: Clearly define business hours and holidays
5. **Exclusions**: Explicitly list what's NOT covered
6. **Regular Monitoring**: Automate SLA tracking and breach detection
7. **Client Dashboards**: Provide real-time SLA performance visibility
8. **Continuous Improvement**: Review and adjust SLAs based on actual performance

### Financial Best Practices

1. **Clear Pricing**: Transparent pricing with no hidden fees
2. **Payment Terms**: Consistent payment terms (Net 15/30)
3. **Usage Tracking**: Accurate time tracking for T&M and retainer agreements
4. **Automated Billing**: Automate invoice generation from agreements
5. **Credit Management**: Apply SLA credits promptly and transparently
6. **Financial Reporting**: Provide clear financial reporting to clients

---

## Appendix: Industry References

### Leading PSA Platforms Studied

- **ConnectWise PSA (Manage)**: Industry leader with comprehensive agreement management
- **Autotask PSA**: Datto's PSA with robust contract and SLA tracking
- **Kaseya BMS**: Business management suite with agreement templates
- **SyncroMSP**: Modern MSP platform with integrated agreement management
- **HaloPSA**: UK-based PSA with advanced SLA capabilities

### Key Resources

- **ITIL 4 Framework**: Service Level Management best practices
- **MSP Association**: MSP contract templates and best practices
- **ESIGN Act**: Electronic Signatures in Global and National Commerce Act
- **UETA**: Uniform Electronic Transactions Act
- **ISO 20000**: IT Service Management standards

### Compliance Considerations

- **GDPR**: Data protection requirements for EU clients
- **SOC 2**: Security and availability commitments
- **HIPAA**: Healthcare client requirements (if applicable)
- **PCI DSS**: Payment card industry standards
- **State Contract Laws**: Varies by jurisdiction

---

## Conclusion

This specification provides a comprehensive foundation for implementing a production-grade Agreements module in Deskwise. The modular design allows for phased implementation while maintaining flexibility for future enhancements.

**Key Takeaways**:
- Support 4 agreement types (MSA, SLA, SOW, Maintenance)
- Implement 4-tier SLA structure (Platinum, Gold, Silver, Bronze)
- Automated SLA breach detection and penalty calculation
- Deep integration with Tickets, Billing, and Projects modules
- Comprehensive renewal management with 30/60/90-day notifications
- E-signature support for streamlined agreement execution
- Rich analytics and reporting capabilities

**Next Steps**:
1. Review and approve this specification
2. Begin Phase 1 implementation (Core Agreement Management)
3. Set up database collections and indexes
4. Develop API routes and service layer
5. Build UI components following design guidelines

---

**Document Version**: 1.0
**Last Updated**: 2024-07-15
**Author**: Claude Code AI
**Status**: Ready for Implementation
