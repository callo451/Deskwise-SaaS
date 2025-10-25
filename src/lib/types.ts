import { ObjectId } from 'mongodb'

// ============================================
// Core Types
// ============================================

export interface BaseEntity {
  _id: ObjectId
  orgId: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// ============================================
// User & Organization
// ============================================

export type UserRole = 'admin' | 'technician' | 'user'

export interface User extends BaseEntity {
  email: string
  password: string // hashed
  firstName: string
  lastName: string
  role: UserRole
  roleId?: string // Reference to Role._id (optional for backward compatibility)
  avatar?: string
  phone?: string
  title?: string
  department?: string
  isActive: boolean
  lastLogin?: Date
  customPermissions?: string[] // Additional permissions beyond role
  permissionOverrides?: UserPermission[] // Explicit grant/revoke overrides
}

export interface Organization {
  _id: ObjectId
  name: string
  domain?: string
  logo?: string
  timezone: string
  currency: string
  mode: 'msp' | 'internal' // MSP mode or Internal IT mode
  createdAt: Date
  updatedAt: Date
  settings: {
    ticketPrefix?: string
    enableAI?: boolean
    allowPublicKB?: boolean
  }
  branding?: OrganizationBranding // White-label branding configuration
}

// ============================================
// White-Label Branding
// ============================================

export interface OrganizationBranding {
  // Logos and Icons
  logos: {
    primary: {
      light?: string // S3 key for light mode logo
      dark?: string // S3 key for dark mode logo
    }
    favicon?: string // S3 key for favicon
    loginScreen?: string // S3 key for login screen logo
  }

  // Color Palette (HSL format for CSS variables)
  colors: {
    primary: {
      h: number // Hue (0-360)
      s: number // Saturation (0-100)
      l: number // Lightness (0-100)
    }
    secondary: {
      h: number
      s: number
      l: number
    }
    accent: {
      h: number
      s: number
      l: number
    }
    background?: {
      h: number
      s: number
      l: number
    }
    surface?: {
      h: number
      s: number
      l: number
    }
  }

  // Typography
  typography: {
    fontFamily: string // e.g., 'Inter', 'Roboto', 'Custom Font'
    googleFontsUrl?: string // Google Fonts embed URL
    headingFontFamily?: string // Optional separate font for headings
  }

  // Brand Identity
  identity: {
    companyName: string // Brand name for display
    tagline?: string // Optional company tagline
    customDomain?: string // Custom domain (e.g., support.acme.com)
    subdomain?: string // Subdomain on Deskwise (e.g., acme.deskwise.net)
  }

  // Email and Notification Branding
  email: {
    fromName: string // "from" name in emails
    replyToEmail?: string // Reply-to address
    footerText?: string // Custom footer text
    logoUrl?: string // URL to logo for email (publicly accessible)
    headerColor?: string // Hex color for email header
  }

  // Metadata
  version: number // Version number for change tracking
  isActive: boolean // Whether branding is active
  lastModifiedBy?: string // User ID who last modified
  lastModifiedAt?: Date // When last modified
}

// Branding Version History
export interface BrandingVersion extends BaseEntity {
  version: number
  branding: OrganizationBranding
  modifiedBy: string
  modifiedByName: string
  changeDescription?: string
  isActive: boolean
}

// Branding configuration input (for API)
export interface UpdateBrandingInput {
  logos?: {
    primary?: {
      light?: string
      dark?: string
    }
    favicon?: string
    loginScreen?: string
  }
  colors?: {
    primary?: { h: number; s: number; l: number }
    secondary?: { h: number; s: number; l: number }
    accent?: { h: number; s: number; l: number }
    background?: { h: number; s: number; l: number }
    surface?: { h: number; s: number; l: number }
  }
  typography?: {
    fontFamily?: string
    googleFontsUrl?: string
    headingFontFamily?: string
  }
  identity?: {
    companyName?: string
    tagline?: string
    customDomain?: string
    subdomain?: string
  }
  email?: {
    fromName?: string
    replyToEmail?: string
    footerText?: string
    logoUrl?: string
    headerColor?: string
  }
}

// ============================================
// Tickets
// ============================================

export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical'

export interface TicketAttachment {
  id: string
  ticketId: string
  filename: string
  originalFilename: string
  fileSize: number // bytes
  contentType: string
  s3Key: string // S3 object key for storage
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date
  url?: string // Legacy field - use presigned URLs instead
  thumbnailUrl?: string // For images
}

export interface CSATRating {
  _id: ObjectId
  orgId: string
  ticketId: string
  ticketNumber: string
  rating: 1 | 2 | 3 | 4 | 5 // 1=Very Unsatisfied, 5=Very Satisfied
  feedback?: string
  submittedBy: string
  submittedByName?: string
  submittedAt: Date
}

export interface Ticket extends BaseEntity {
  ticketNumber: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  category: string
  assignedTo?: string
  clientId?: string
  requesterId: string
  tags: string[]
  linkedAssets?: string[] // Array of Asset IDs linked to this ticket
  attachments?: TicketAttachment[]
  sla?: {
    responseTime: number // minutes
    resolutionTime: number // minutes
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
  }
  csatRating?: CSATRating
  totalTimeSpent?: number // Total time in minutes (calculated from time entries)
  resolvedAt?: Date
  closedAt?: Date
}

// ============================================
// Time Tracking
// ============================================

export interface TimeEntry {
  _id: ObjectId
  orgId: string
  ticketId: string
  userId: string
  userName: string
  description: string
  startTime: Date
  endTime?: Date
  duration?: number // minutes (calculated when timer stops)
  isBillable: boolean
  isRunning: boolean // true if timer is currently active
  createdAt: Date
  updatedAt: Date
}

// Unified Ticket Time Tracking
export interface UnifiedTicketTimeEntry {
  _id: ObjectId
  ticketId: string
  orgId: string
  userId: string
  userName: string
  description: string
  hours: number
  minutes: number
  isBillable: boolean
  startTime?: Date
  endTime?: Date
  createdAt: Date
}

export interface ActiveTimer {
  _id: ObjectId
  ticketId: string
  orgId: string
  userId: string
  startTime: Date
  description?: string
}

// ============================================
// Unified Time Tracking (Tickets + Projects)
// ============================================

export type TimeEntryType = 'ticket' | 'project'

export interface TimeEntry extends BaseEntity {
  // WHAT: Link to either ticket OR project (mutually exclusive)
  type: TimeEntryType
  ticketId?: string               // For ticket time
  ticketNumber?: string           // Denormalized for performance
  projectId?: string              // For project time
  projectName?: string            // Denormalized for performance
  projectTaskId?: string          // Optional task link
  projectTaskName?: string        // Denormalized for performance

  // WHO
  userId: string
  userName: string

  // WHEN & HOW LONG
  description: string
  startTime?: Date                // For timer-based entries
  endTime?: Date                  // For timer-based entries
  hours: number                   // Manual hours
  minutes: number                 // Manual minutes
  totalMinutes: number            // Calculated total (for queries)

  // BILLING
  isBillable: boolean
  isRunning: boolean              // True if timer is active

  // METADATA
  source: 'manual' | 'timer' | 'import' | 'auto'
  tags?: string[]
}

export interface ActiveTimeTracker extends BaseEntity {
  type: TimeEntryType
  ticketId?: string
  projectId?: string
  projectTaskId?: string
  userId: string
  startTime: Date
  description?: string
}

// ============================================
// Canned Responses
// ============================================

export interface CannedResponse extends BaseEntity {
  name: string
  content: string
  category: string
  variables: string[] // e.g., ['{{ticketNumber}}', '{{requesterName}}']
  usageCount: number
  isActive: boolean
  tags?: string[]
}

// ============================================
// Service Requests
// ============================================

export type ServiceRequestStatus = 'submitted' | 'pending_approval' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled'
export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'critical'

export interface ServiceRequest extends BaseEntity {
  requestNumber: string
  title: string
  description: string
  status: ServiceRequestStatus
  priority: ServiceRequestPriority
  category: string
  requestedBy: string
  requestedByName?: string
  assignedTo?: string
  assignedToName?: string
  clientId?: string
  serviceId?: string // Reference to ServiceCatalogueItem
  formData?: Record<string, any> // Submitted form data from service catalog
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  rejectionReason?: string
  sla?: {
    responseTime: number // minutes
    resolutionTime: number // minutes
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
  }
  resolvedAt?: Date
  closedAt?: Date
  completedAt?: Date
}

// ============================================
// Incidents
// ============================================

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'
export type IncidentSeverity = 'minor' | 'major' | 'critical'
export type IncidentImpact = 'low' | 'medium' | 'high'
export type IncidentUrgency = 'low' | 'medium' | 'high'
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Incident extends BaseEntity {
  incidentNumber: string
  title: string
  description: string
  status: IncidentStatus
  severity: IncidentSeverity
  // Impact/Urgency/Priority Matrix
  impact: IncidentImpact // How many users/services affected
  urgency: IncidentUrgency // How quickly resolution is needed
  priority: IncidentPriority // Auto-calculated from Impact × Urgency
  affectedServices: string[]
  clientIds: string[] // Empty array for "All clients"
  isPublic: boolean
  assignedTo?: string // User ID of assigned technician
  startedAt: Date
  resolvedAt?: Date
}

export interface IncidentUpdate {
  _id: ObjectId
  incidentId: string
  orgId: string
  status: IncidentStatus
  message: string
  createdBy: string
  createdAt: Date
}

// ============================================
// Change Management
// ============================================

export type ChangeStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'scheduled' | 'implementing' | 'completed' | 'cancelled'
export type ChangeRisk = 'low' | 'medium' | 'high'
export type ChangeImpact = 'low' | 'medium' | 'high'

export interface ChangeRequest extends BaseEntity {
  changeNumber: string
  title: string
  description: string
  status: ChangeStatus
  risk: ChangeRisk
  impact: ChangeImpact
  category: string
  requestedBy: string
  assignedTo?: string
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate?: Date
  actualEndDate?: Date
  affectedAssets: string[]
  relatedTickets: string[]
  backoutPlan?: string
  testPlan?: string
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string
}

// ============================================
// Problem Management
// ============================================

export type ProblemStatus = 'open' | 'investigating' | 'known_error' | 'resolved' | 'closed'
export type ProblemPriority = 'low' | 'medium' | 'high' | 'critical'
export type ProblemImpact = 'low' | 'medium' | 'high'
export type ProblemUrgency = 'low' | 'medium' | 'high'

export interface Problem extends BaseEntity {
  problemNumber: string
  title: string
  description: string
  status: ProblemStatus
  priority: ProblemPriority
  category: string
  reportedBy: string
  assignedTo?: string
  // Root cause analysis
  rootCause?: string
  workaround?: string
  solution?: string
  // Related records
  relatedIncidents: string[] // Array of Incident IDs
  affectedServices: string[]
  clientIds: string[] // Empty array for "All clients"
  // Impact/Urgency
  impact: ProblemImpact
  urgency: ProblemUrgency
  // Visibility
  isPublic: boolean
  // Timestamps
  startedAt: Date
  resolvedAt?: Date
}

export interface ProblemUpdate {
  _id: ObjectId
  problemId: string
  orgId: string
  updateType: 'status' | 'root_cause' | 'workaround' | 'solution' | 'general'
  status?: ProblemStatus
  message: string
  createdBy: string
  createdAt: Date
}

// ============================================
// Unified Ticketing System
// ============================================

// Ticket Type Enum
export type TicketType = 'ticket' | 'incident' | 'service_request' | 'change' | 'problem'

// Unified Status Union (encompasses all type-specific statuses)
export type UnifiedTicketStatus =
  | TicketStatus
  | IncidentStatus
  | ServiceRequestStatus
  | ChangeStatus
  | ProblemStatus

// Type-specific metadata interfaces
export interface TicketMetadata {
  type: 'ticket'
  // Standard ticket has minimal additional metadata
  linkedTickets?: string[]
}

export interface IncidentMetadata {
  type: 'incident'
  severity: IncidentSeverity
  impact: IncidentImpact
  urgency: IncidentUrgency
  affectedServices: string[]
  clientIds: string[] // Empty array for "All clients"
  isPublic: boolean
  startedAt: Date
  relatedProblemId?: string
}

export interface ServiceRequestMetadata {
  type: 'service_request'
  serviceId?: string // Reference to ServiceCatalogueItem
  formData?: Record<string, any> // Submitted form data
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  rejectionReason?: string
  completedAt?: Date
}

export interface ChangeMetadata {
  type: 'change'
  risk: ChangeRisk
  impact: ChangeImpact
  plannedStartDate: Date
  plannedEndDate: Date
  actualStartDate?: Date
  actualEndDate?: Date
  affectedAssets: string[]
  relatedTickets: string[]
  backoutPlan?: string
  testPlan?: string
  implementationPlan?: string
  approvalStatus?: 'pending' | 'approved' | 'rejected'
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  rejectionReason?: string
  cabMembers?: string[] // Change Advisory Board members
  cabNotes?: string
}

export interface ProblemMetadata {
  type: 'problem'
  impact: ProblemImpact
  urgency: ProblemUrgency
  rootCause?: string
  workaround?: string
  solution?: string
  relatedIncidents: string[] // Array of Incident IDs
  affectedServices: string[]
  clientIds: string[] // Empty array for "All clients"
  isPublic: boolean
  startedAt: Date
  knownErrorDate?: Date
}

// Type metadata union
export type TypeMetadata =
  | TicketMetadata
  | IncidentMetadata
  | ServiceRequestMetadata
  | ChangeMetadata
  | ProblemMetadata

// Main Unified Ticket Interface
export interface UnifiedTicket extends BaseEntity {
  // Universal fields (all ticket types)
  ticketNumber: string // Universal identifier (can be TKT-001, INC-001, CHG-001, etc.)
  legacyNumber?: string // Original number from migration (incidentNumber, changeNumber, etc.)
  ticketType: TicketType
  title: string
  description: string
  status: UnifiedTicketStatus
  priority: TicketPriority | IncidentPriority | ServiceRequestPriority | ProblemPriority
  category: string

  // User references
  requesterId: string // Person who created/requested
  requesterName?: string
  assignedTo?: string
  assignedToName?: string

  // Client/organization
  clientId?: string
  clientName?: string

  // Tags and relationships
  tags: string[]
  linkedAssets?: string[] // Array of Asset IDs
  parentTicketId?: string // For hierarchical relationships
  childTicketIds?: string[] // Sub-tickets

  // Project integration
  projectId?: string // Link ticket to project
  projectName?: string // Denormalized for performance
  projectTaskId?: string // Link to specific project task
  projectTaskName?: string // Denormalized for performance

  // Attachments and comments
  attachments?: TicketAttachment[]

  // SLA tracking
  sla?: {
    responseTime: number // minutes
    resolutionTime: number // minutes
    responseDeadline: Date
    resolutionDeadline: Date
    breached: boolean
    pausedAt?: Date // For SLA pause functionality
    pausedDuration?: number // Total paused time in minutes
  }

  // Time tracking
  totalTimeSpent?: number // Total time in minutes

  // CSAT
  csatRating?: CSATRating

  // Timestamps
  resolvedAt?: Date
  closedAt?: Date

  // Type-specific metadata (discriminated union)
  metadata: TypeMetadata
}

// Unified ticket update (for incidents and problems)
export interface UnifiedTicketUpdate {
  _id: ObjectId
  ticketId: string
  ticketType: TicketType
  orgId: string
  updateType: 'status' | 'root_cause' | 'workaround' | 'solution' | 'general' | 'incident_update'
  status?: UnifiedTicketStatus
  message: string
  createdBy: string
  createdByName?: string
  createdAt: Date
  isPublic?: boolean // For public incident updates
}

// Unified ticket comment (for all ticket types)
export interface UnifiedTicketComment {
  _id: ObjectId
  ticketId: string
  orgId: string
  content: string
  isInternal: boolean // Internal comments only visible to technicians/admins
  createdBy: string
  createdByName: string
  createdByAvatar?: string
  createdAt: Date
  updatedAt?: Date
  editedBy?: string
  editedByName?: string
  isDeleted?: boolean // Soft delete flag
}

// Workflow configuration type
export interface TicketTypeWorkflow {
  type: TicketType
  availableStatuses: string[]
  requiredFields: string[]
  optionalFields: string[]
  requiresApproval: boolean
  allowPublic: boolean
  slaCalculationMethod: 'priority' | 'impact_urgency_matrix' | 'change_impact' | 'service_catalog'
  allowedTransitions: Record<string, string[]> // status -> allowed next statuses
  notificationTriggers: string[] // Which events trigger notifications
}

// Ticket creation input types
export interface CreateTicketInput {
  type: 'ticket'
  title: string
  description: string
  priority: TicketPriority
  category: string
  requesterId: string
  clientId?: string
  assignedTo?: string
  tags?: string[]
  linkedAssets?: string[]
  projectId?: string // Link to project
  projectTaskId?: string // Link to specific task
}

export interface CreateIncidentInput {
  type: 'incident'
  title: string
  description: string
  severity: IncidentSeverity
  impact: IncidentImpact
  urgency: IncidentUrgency
  affectedServices: string[]
  clientIds?: string[]
  isPublic: boolean
  assignedTo?: string
  tags?: string[]
}

export interface CreateServiceRequestInput {
  type: 'service_request'
  title: string
  description: string
  priority: ServiceRequestPriority
  category: string
  requesterId: string
  clientId?: string
  serviceId?: string
  formData?: Record<string, any>
  tags?: string[]
  projectId?: string // Link to project
  projectTaskId?: string // Link to specific task
}

export interface CreateChangeInput {
  type: 'change'
  title: string
  description: string
  risk: ChangeRisk
  impact: ChangeImpact
  category: string
  requestedBy: string
  plannedStartDate: Date
  plannedEndDate: Date
  affectedAssets?: string[]
  backoutPlan: string
  testPlan?: string
  implementationPlan?: string
  tags?: string[]
}

export interface CreateProblemInput {
  type: 'problem'
  title: string
  description: string
  priority: ProblemPriority
  impact: ProblemImpact
  urgency: ProblemUrgency
  category: string
  reportedBy: string
  affectedServices?: string[]
  clientIds?: string[]
  isPublic: boolean
  relatedIncidents?: string[]
  tags?: string[]
}

export type CreateUnifiedTicketInput =
  | CreateTicketInput
  | CreateIncidentInput
  | CreateServiceRequestInput
  | CreateChangeInput
  | CreateProblemInput

// ============================================
// Projects
// ============================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'completed'

// Phase 1 Enhancements
export type ProjectStage = 'pre_initiation' | 'initiation' | 'planning' | 'execution' | 'monitoring_control' | 'closure'
export type ProjectHealth = 'green' | 'amber' | 'red'
export type ProjectMethodology = 'waterfall' | 'agile' | 'hybrid' | 'prince2' | 'custom'
export type ProjectType = 'internal' | 'client' | 'product' | 'service'

export interface Project extends BaseEntity {
  projectNumber: string
  name: string
  code?: string // Short code for project (e.g., "WEB-REDESIGN")
  description: string
  status: ProjectStatus

  // Phase 1: New fields (backward compatible)
  stage?: ProjectStage // Project lifecycle stage
  health?: ProjectHealth // Overall project health
  healthScore?: number // Numeric health score 0-100
  healthMetrics?: {
    overall: {
      health: ProjectHealth
      score: number
      timestamp: Date
    }
    schedule: {
      health: ProjectHealth
      score: number
      details: {
        timeElapsed: number
        progressCompleted: number
        variance: number
        daysRemaining: number
        estimatedCompletionDate?: Date
      }
    }
    budget: {
      health: ProjectHealth
      score: number
      details: {
        budgetTotal: number
        budgetSpent: number
        budgetRemaining: number
        spentPercentage: number
        progressPercentage: number
        variance: number
        burnRate: number
        projectedSpend: number
      }
    }
    scope: {
      health: ProjectHealth
      score: number
      details: {
        totalChanges: number
        approvedChanges: number
        pendingChanges: number
        rejectedChanges: number
        scopeCreep: number
      }
    }
    risk: {
      health: ProjectHealth
      score: number
      details: {
        totalRisks: number
        highRisks: number
        mediumRisks: number
        lowRisks: number
        openRisks: number
        mitigatedRisks: number
      }
    }
    quality: {
      health: ProjectHealth
      score: number
      details: {
        totalTasks: number
        completedTasks: number
        overdueTasksCount: number
        overdueTasks: string[]
        averageTaskCompletionRate: number
        defectRate: number
      }
    }
  }
  methodology?: ProjectMethodology
  type?: ProjectType

  // Hierarchy
  portfolioId?: string // Parent portfolio
  parentProjectId?: string // For sub-projects

  // Client/MSP
  clientId?: string
  contractId?: string // Link to contract/agreement
  clientVisible?: boolean // Show in client portal

  // Team
  projectManager: string
  teamMembers: string[]

  // Scheduling (keep old fields for backward compatibility)
  startDate: Date // Legacy field
  endDate: Date // Legacy field
  plannedStartDate?: Date // New field
  plannedEndDate?: Date // New field
  actualStartDate?: Date
  actualEndDate?: Date
  baselineStartDate?: Date // Locked baseline
  baselineEndDate?: Date

  // Financial
  budget?: number
  usedBudget?: number
  forecastBudget?: number

  // Progress
  progress: number // 0-100

  // Metadata
  tags: string[]

  // EVM (Earned Value Management) - calculated fields
  evm?: {
    plannedValue: number // PV (budgeted cost of work scheduled)
    earnedValue: number // EV (budgeted cost of work performed)
    actualCost: number // AC (actual cost of work performed)
    costVariance: number // CV = EV - AC
    scheduleVariance: number // SV = EV - PV
    costPerformanceIndex: number // CPI = EV / AC
    schedulePerformanceIndex: number // SPI = EV / PV
    estimateAtCompletion: number // EAC
    estimateToComplete: number // ETC
    varianceAtCompletion: number // VAC = BAC - EAC
  }
}

// Task dependency types
export type DependencyType = 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
export type TaskType = 'task' | 'milestone' | 'summary'

export interface TaskDependency {
  taskId: string
  type: DependencyType
  lag: number // Days of lag/lead time (negative for lead)
}

export interface ProjectTask {
  _id: ObjectId
  projectId: string
  orgId: string
  title: string
  description: string
  status: TaskStatus

  // Phase 1: New fields
  taskNumber?: string // TSK-001
  wbsCode?: string // Work Breakdown Structure code (e.g., "1.2.3")
  level?: number // Indentation level (0 = root)
  parentTaskId?: string // Parent task for hierarchy
  taskType?: TaskType
  isCriticalPath?: boolean // Is this task on critical path?
  slack?: number // Float time in hours (0 for critical path tasks)

  // Assignment
  assignedTo?: string
  assignedToName?: string

  // Scheduling
  plannedStartDate?: Date
  plannedEndDate?: Date
  dueDate?: Date // Legacy field
  actualStartDate?: Date
  actualEndDate?: Date
  completedAt?: Date

  // Effort
  estimatedHours?: number
  actualHours?: number
  remainingHours?: number

  // Dependencies (enhanced)
  dependencies: string[] | TaskDependency[] // Support both old and new format

  // Progress
  percentComplete?: number // 0-100

  // Metadata
  tags?: string[]
  priority?: 'low' | 'medium' | 'high' | 'critical'

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Milestone Types
export type MilestoneType = 'gate' | 'deliverable' | 'event' | 'decision_point'
export type MilestoneStatus = 'planned' | 'at_risk' | 'achieved' | 'missed' | 'cancelled'
export type GateType = 'initiation' | 'planning' | 'stage_boundary' | 'closure'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional'
export type DeliverableStatus = 'not_started' | 'in_progress' | 'completed'
export type GateArtifactStatus = 'pending' | 'submitted' | 'approved'

export interface GateArtifact {
  name: string
  required: boolean
  documentId?: string
  status: GateArtifactStatus
}

export interface MilestoneDeliverable {
  name: string
  description: string
  status: DeliverableStatus
  acceptedBy?: string
  acceptedAt?: Date
}

export interface ProjectMilestone extends BaseEntity {
  projectId: string

  // Identification
  name: string
  description: string
  type: MilestoneType

  // Scheduling
  plannedDate: Date
  baselineDate?: Date
  actualDate?: Date

  // Status
  status: MilestoneStatus

  // Gate Review (PRINCE2/PMBOK)
  isGate: boolean
  gateType?: GateType
  gateArtifacts?: GateArtifact[]
  approvalRequired: boolean
  approvers?: string[]
  approvalStatus?: ApprovalStatus
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string

  // Deliverables
  deliverables?: MilestoneDeliverable[]

  // Dependencies
  dependsOnMilestones: string[]
  dependsOnTasks: string[]

  // Progress
  progressWeight: number

  // Notifications
  reminderDays: number
  notifyUsers: string[]
}

// ============================================
// Project Management - Phase 1 New Entities
// ============================================

// Portfolio
export type PortfolioType = 'strategic' | 'operational' | 'client' | 'internal'
export type PortfolioStatus = 'active' | 'planning' | 'archived'

export interface PortfolioKPI {
  name: string
  target: number
  actual: number
  unit: string // e.g., "%", "$", "hours"
}

export interface Portfolio extends BaseEntity {
  // Basic Info
  name: string
  code: string // Short code: "DT2025"
  description: string
  type: PortfolioType

  // MSP Specifics
  clientId?: string // MSP mode: Client portfolio

  // Strategy Alignment
  strategicObjectives: string[] // Link to org strategic goals
  kpis: PortfolioKPI[]

  // Portfolio Management
  status: PortfolioStatus
  manager: string // User ID
  stakeholders: string[] // User IDs

  // Financial
  totalBudget: number
  allocatedBudget: number // Sum of project budgets
  spentBudget: number // Sum of project actuals

  // Health & Metrics
  projectCount: number // Calculated
  healthScore: number // 0-100, calculated
  riskScore: number // 0-100, calculated

  // Settings
  allowedProjectManagers: string[] // Restrict who can create projects
  requiresApproval: boolean // Gate review required
  approvalWorkflow?: string // Workflow ID

  // Soft delete
  isActive: boolean
}

// Resource Allocation
export type AllocationType = 'full_time' | 'part_time' | 'as_needed'
export type AllocationStatus = 'planned' | 'active' | 'completed' | 'removed'

export interface ProjectResourceAllocation extends BaseEntity {
  projectId: string

  // Resource
  userId: string
  userName: string // Denormalized

  // Role on Project
  role: string // 'Developer', 'QA', 'Designer', etc.
  isPrimary: boolean // Primary resource for this role

  // Allocation
  allocationType: AllocationType
  allocationPercentage: number // 0-100 (50 = half time)
  hoursPerWeek: number // Calculated from percentage

  // Schedule
  startDate: Date
  endDate: Date

  // Cost
  hourlyRate?: number // Billing rate for this project
  costRate?: number // Internal cost rate

  // Skills
  requiredSkills: string[] // Skills needed for this role
  userSkills: string[] // Skills user has
  skillMatch: number // 0-100 match percentage

  // Status
  status: AllocationStatus
}

// RAID - Risk Register
export type RiskProbability = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type RiskImpact = 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
export type RiskResponseStrategy = 'avoid' | 'mitigate' | 'transfer' | 'accept'
export type RiskStatus = 'identified' | 'assessed' | 'mitigated' | 'closed' | 'occurred'

export interface ProjectRisk extends BaseEntity {
  projectId: string

  // Identification
  riskNumber: string // RSK-001
  title: string
  description: string
  category: string // 'technical', 'resource', 'budget', 'schedule'

  // Assessment
  probability: RiskProbability
  probabilityScore: number // 1-5
  impact: RiskImpact
  impactScore: number // 1-5
  riskScore: number // probability × impact (1-25)

  // Response Strategy
  responseStrategy: RiskResponseStrategy
  mitigationPlan?: string
  contingencyPlan?: string

  // Ownership
  owner: string // User ID responsible for managing

  // Status
  status: RiskStatus

  // Dates
  identifiedDate: Date
  targetResolutionDate?: Date
  closedDate?: Date
}

// RAID - Issue Register
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical'
export type IssueStatus = 'open' | 'investigating' | 'resolved' | 'closed'

export interface ProjectIssue extends BaseEntity {
  projectId: string

  // Identification
  issueNumber: string // ISS-001
  title: string
  description: string
  category: string

  // Severity
  severity: IssueSeverity
  priority: IssuePriority

  // Resolution
  status: IssueStatus
  resolution?: string

  // Ownership
  reportedBy: string
  assignedTo?: string

  // Related Items
  relatedRiskId?: string // If issue came from realized risk
  relatedTaskIds: string[] // Affected tasks

  // Dates
  reportedDate: Date
  targetResolutionDate?: Date
  resolvedDate?: Date
  closedDate?: Date
}

// RAID - Decision Log
export type DecisionStatus = 'pending' | 'approved' | 'implemented' | 'reversed'

export interface DecisionOption {
  option: string
  pros: string[]
  cons: string[]
  cost?: number
  timeline?: string
}

export interface ProjectDecision extends BaseEntity {
  projectId: string

  // Identification
  decisionNumber: string // DEC-001
  title: string
  description: string
  category: string

  // Decision
  options: DecisionOption[]
  selectedOption: string
  rationale: string

  // Governance
  decisionMaker: string // User ID
  stakeholdersConsulted: string[] // User IDs
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: Date

  // Impact
  impactedAreas: string[] // 'scope', 'schedule', 'budget', 'quality'

  // Status
  status: DecisionStatus

  // Dates
  decisionDate: Date
  implementationDate?: Date
}

// RAID - Assumptions Log
export type AssumptionStatus = 'active' | 'validated' | 'invalidated' | 'expired'

export interface ProjectAssumption extends BaseEntity {
  projectId: string

  // Identification
  assumptionNumber: string // ASM-001
  title: string
  description: string
  category: string

  // Validation
  validated: boolean
  validatedBy?: string
  validatedAt?: Date
  validationNotes?: string

  // Risk Assessment
  riskIfInvalid: string // What happens if assumption proves false
  impactIfInvalid: RiskImpact

  // Ownership
  owner: string // User ID

  // Status
  status: AssumptionStatus

  // Dates
  dateRecorded: Date
  expiryDate?: Date
}

// Project Documents
export type DocumentType =
  | 'charter'
  | 'plan'
  | 'wbs'
  | 'schedule'
  | 'budget'
  | 'risk_register'
  | 'quality_plan'
  | 'communication_plan'
  | 'scope_statement'
  | 'lessons_learned'
  | 'other'

export type DocumentStatus = 'draft' | 'review' | 'approved' | 'archived'
export type DocumentVisibility = 'team' | 'stakeholders' | 'client' | 'private'

export interface ProjectDocument extends BaseEntity {
  projectId: string

  // Identification
  name: string
  description?: string
  type: DocumentType

  // File Info
  filename: string
  fileSize: number // bytes
  contentType: string // MIME type
  s3Key: string // S3 storage key
  url?: string // Presigned URL (temporary)

  // Versioning
  version: number
  previousVersionId?: string // Previous version document ID
  isLatestVersion: boolean

  // Categorization
  category: string
  tags: string[]

  // Access Control
  visibility: DocumentVisibility

  // Metadata
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date

  // Status
  status: DocumentStatus
  approvedBy?: string
  approvedAt?: Date
}

// Project Time Entry
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'

export interface ProjectTimeEntry extends BaseEntity {
  projectId: string
  taskId?: string // Optional: link to specific task

  // User
  userId: string
  userName: string // Denormalized

  // Time
  date: Date // Work date
  startTime?: Date // Optional: specific start time
  endTime?: Date // Optional: specific end time
  hours: number // Total hours
  minutes: number // Additional minutes
  totalMinutes: number // Calculated: hours * 60 + minutes

  // Description
  description: string
  activityType: string // 'development', 'testing', 'meetings', etc.

  // Billing
  isBillable: boolean
  hourlyRate?: number // Rate for this entry
  billableAmount?: number // Calculated: totalMinutes / 60 * hourlyRate

  // Status
  status: TimeEntryStatus
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string

  // Invoice Link
  invoiceId?: string // If already invoiced
  invoiceLineItemId?: string
}

// Project Change Request
export type ChangeRequestType = 'scope' | 'schedule' | 'budget' | 'resources' | 'quality' | 'other'
export type ChangeRequestStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'implemented'

export interface ScheduleImpact {
  delayDays: number
  affectedMilestones: string[]
  affectedTasks: string[]
}

export interface BudgetImpact {
  additionalCost: number
  costSavings: number
  netImpact: number
}

export interface ApprovalVote {
  userId: string
  vote: 'approve' | 'reject' | 'conditional'
  comments?: string
  votedAt: Date
}

export interface ProjectChangeRequest extends BaseEntity {
  projectId: string

  // Identification
  changeNumber: string // PCR-001
  title: string
  description: string

  // Change Type
  changeType: ChangeRequestType

  // Impact Assessment
  scopeImpact?: string
  scheduleImpact?: ScheduleImpact
  budgetImpact?: BudgetImpact
  resourceImpact?: string
  qualityImpact?: string

  // Justification
  businessJustification: string
  alternatives?: string
  riskOfNotImplementing?: string

  // Status
  status: ChangeRequestStatus
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Approval
  approvers: string[] // User IDs
  approvalVotes: ApprovalVote[]
  finalDecision?: 'approved' | 'rejected'
  decisionDate?: Date
  decisionBy?: string
  decisionRationale?: string

  // Implementation
  implementationPlan?: string
  implementedDate?: Date
  implementedBy?: string

  // Timestamps
  requestedBy: string
  requestedDate: Date
}

// Project Template
export type TemplateTaskData = {
  title: string
  description: string
  level: number
  wbsCode: string
  estimatedHours: number
  taskType: TaskStatus
  dependencies: string[] // WBS codes of dependencies
}

export type TemplateMilestoneData = {
  name: string
  description: string
  type: MilestoneType
  isGate: boolean
  daysFromStart: number // Offset from project start
}

export type TemplateRoleData = {
  role: string
  allocationType: string
  allocationPercentage: number
}

export type TemplateDocumentData = {
  name: string
  type: DocumentType
  templateS3Key?: string // Template file to copy
}

export interface ProjectTemplate extends BaseEntity {
  // Identification
  name: string
  description: string
  category: string
  icon?: string
  color?: string

  // Template Data
  templateData: {
    // Project fields to copy
    type: ProjectType
    category: string
    methodology: ProjectMethodology
    tags: string[]

    // Tasks to create
    tasks: TemplateTaskData[]

    // Milestones to create
    milestones: TemplateMilestoneData[]

    // Default roles to add
    roles: TemplateRoleData[]

    // Documents to include
    documents: TemplateDocumentData[]
  }

  // Usage
  isSystemTemplate: boolean // Built-in vs custom
  usageCount: number
  lastUsedAt?: Date

  // Visibility
  isPublic: boolean // Available to all in org

  // Status
  isActive: boolean
}

// ============================================
// Scheduling
// ============================================

export type AppointmentType = 'onsite' | 'remote' | 'meeting' | 'maintenance'
export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export interface ScheduleItem extends BaseEntity {
  title: string
  description?: string
  type: AppointmentType
  status: AppointmentStatus
  assignedTo: string
  clientId?: string
  ticketId?: string
  location?: string
  startTime: Date
  endTime: Date
  isRecurring: boolean
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
    daysOfWeek?: number[]
  }
}

// ============================================
// Assets
// ============================================

export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'disposed'

export interface Asset extends BaseEntity {
  assetTag: string
  name: string
  category: string
  manufacturer?: string
  model?: string
  serialNumber?: string
  purchaseDate?: Date
  warrantyExpiry?: Date
  assignedTo?: string
  clientId?: string
  location?: string
  status: AssetStatus
  purchaseCost?: number
  specifications?: Record<string, string>
  maintenanceSchedule?: string
  lastMaintenanceDate?: Date
  // System Information (collected by agent)
  systemInfo?: {
    osName?: string
    osVersion?: string
    osBuild?: string
    kernelVersion?: string
    kernelArch?: string
    platform?: string
    platformFamily?: string
    platformVersion?: string
    virtualizationSystem?: string
    virtualizationRole?: string
  }
  // Hardware Information (collected by agent)
  hardwareInfo?: {
    manufacturer?: string
    model?: string
    serialNumber?: string
    uuid?: string
    biosVersion?: string
    biosVendor?: string
    biosDate?: string
    cpuModel?: string
    cpuCores?: number
    cpuThreads?: number
    totalMemoryGB?: number
    totalDiskGB?: number
  }
  // Network Information (collected by agent)
  networkInfo?: {
    primaryMac?: string
    macAddresses?: string[]
    ipAddresses?: string[]
    primaryIp?: string
    fqdn?: string
  }
  // Agent Capabilities (collected by agent)
  capabilities?: RemoteControlCapabilities
  lastSeen?: Date
}

// ============================================
// Asset Categories
// ============================================

export interface AssetCategory extends BaseEntity {
  name: string
  code: string // Short code for asset tag generation (e.g., "COMP", "LPTOP", "SRV")
  icon?: string
  color?: string
  description?: string
  isSystem: boolean // True for system-defined categories, false for custom
  isActive: boolean
  parentId?: string // For hierarchical categories
  customFields?: Array<{
    name: string
    type: 'text' | 'number' | 'date' | 'dropdown'
    required: boolean
    options?: string[] // For dropdown type
  }>
}

// ============================================
// Asset Locations
// ============================================

export interface AssetLocation extends BaseEntity {
  name: string
  code: string // Short code for reporting (e.g., "HQ", "DC1", "BR-NYC")
  type: 'site' | 'building' | 'floor' | 'room' | 'rack' | 'remote'
  parentId?: string // For hierarchical structure
  fullPath?: string // Auto-generated: "Site > Building > Floor > Room"
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
    country?: string
  }
  coordinates?: {
    latitude: number
    longitude: number
  }
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  isActive: boolean
}

// ============================================
// Organization Asset Settings
// ============================================

export interface OrganizationAssetSettings extends BaseEntity {
  assetTagFormat: {
    prefix?: string // e.g., "ACME-"
    includeCategoryCode: boolean // Include category code in tag
    sequenceLength: number // Number of digits for sequence (e.g., 4 = 0001)
    suffix?: string // e.g., "-2024"
    separator: string // Character between parts (e.g., "-")
    example?: string // Auto-generated example
  }
  lifecycleStatuses: Array<{
    value: string
    label: string
    color: string
    isActive: boolean
  }>
  defaultCategory?: string // Default category ID for new assets
  requireApprovalForAssignment: boolean
  trackAssignmentHistory: boolean
  enableAutoDiscovery: boolean // Allow agent auto-enrollment
  maintenanceReminderDays: number // Days before warranty expiry to remind
}

// ============================================
// Knowledge Base
// ============================================

export type ArticleVisibility = 'internal' | 'public'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface KBArticle extends BaseEntity {
  title: string
  content: string
  category: string
  tags: string[]
  visibility: ArticleVisibility
  status: ArticleStatus // Draft/Published/Archived workflow
  author: string
  views: number
  helpful: number
  notHelpful: number
  isArchived: boolean
  autoGenerated: boolean
  recordingMetadata?: {
    sessionId: string // Reference to RecordingSession
    stepCount: number
    duration?: number
    url?: string
    recordedAt?: Date
  }
}

// ============================================
// Knowledge Base Categories
// ============================================

export interface KBCategory extends BaseEntity {
  name: string
  slug: string // URL-friendly identifier (auto-generated from name)
  description?: string
  icon?: string // Lucide icon name
  color?: string // Hex color for UI
  parentId?: string // For nested categories (reference to parent KBCategory._id)
  fullPath?: string // Auto-generated: "Parent > Child > Grandchild"
  order: number // Display order within parent (for sorting)
  isActive: boolean
  articleCount?: number // Calculated field: number of articles in this category

  // RBAC - Role-based access control
  allowedRoles?: string[] // Role IDs that can view articles in this category
  allowedUsers?: string[] // Specific user IDs (overrides - grants access)
  isPublic: boolean // If true, visible in public portal (for public KB articles)

  // Permission-based access control (integrates with RBAC system)
  permissions?: {
    view?: string[] // Permission keys required to view (e.g., ['kb.view'])
    contribute?: string[] // Permission keys required to create articles (e.g., ['kb.create'])
    manage?: string[] // Permission keys required to manage category (e.g., ['kb.manage', 'settings.edit'])
  }
}

// ============================================
// Knowledge Base Recording
// ============================================

export type RecordingSessionStatus = 'recording' | 'paused' | 'completed' | 'archived'
export type RecordingActionType = 'click' | 'type' | 'navigate' | 'scroll' | 'select' | 'hover'

export interface RecordingSession extends BaseEntity {
  sessionId: string // Unique session ID from extension (e.g., session_1234567890)
  userId: string // Creator/operator
  url: string // Page being recorded
  title: string
  description?: string
  status: RecordingSessionStatus
  stepCount: number
  duration?: number // Milliseconds
  articleId?: string // Generated article reference
  isActive: boolean
}

export interface RecordingStep {
  _id: ObjectId
  sessionId: string
  orgId: string
  stepNumber: number
  action: RecordingActionType
  description: string
  selector?: string // CSS/XPath selector
  value?: string // Input value for 'type' actions
  element?: {
    tagName: string
    text?: string
    id?: string
    className?: string
    attributes?: Record<string, string>
  }
  viewport?: {
    width: number
    height: number
    scrollTop: number
    scrollLeft: number
  }
  coordinates?: {
    x: number
    y: number
    pageX: number
    pageY: number
  }
  screenshotId?: string // Reference to RecorderScreenshot
  timestamp: number // Milliseconds relative to session start
  url?: string // Page URL at time of action
  createdAt: Date
}

export interface RecorderScreenshot {
  _id: ObjectId
  sessionId: string
  stepNumber: number
  orgId: string
  filename: string
  url: string // Storage path or public URL
  width: number
  height: number
  contentType: string // 'image/png' or 'image/jpeg'
  size: number // File size in bytes
  annotations?: Array<{
    type: 'arrow' | 'highlight' | 'text' | 'blur' | 'circle'
    x: number
    y: number
    width?: number
    height?: number
    text?: string
    color?: string
    radius?: number
  }>
  createdAt: Date
}

// ============================================
// Clients (MSP Mode)
// ============================================

export type ClientStatus = 'active' | 'inactive' | 'onboarding'

export interface Client extends BaseEntity {
  name: string
  domain?: string
  industry?: string
  status: ClientStatus
  primaryContact: {
    name: string
    email: string
    phone?: string
  }
  address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  notes?: string
  contractStartDate?: Date
  contractEndDate?: Date
}

// ============================================
// Quoting & Contracts
// ============================================

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected'
export type ServiceType = 'fixed' | 'recurring' | 'hourly'

export interface Quote extends BaseEntity {
  quoteNumber: string
  clientId: string
  title: string
  description: string
  status: QuoteStatus
  validUntil: Date
  lineItems: Array<{
    serviceId: string
    description: string
    quantity: number
    rate: number
    total: number
  }>
  subtotal: number
  tax?: number
  total: number
  notes?: string
  acceptedAt?: Date
}

export interface Contract extends BaseEntity {
  contractNumber: string
  clientId: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  services: Array<{
    serviceId: string
    description: string
    type: ServiceType
    quantity: number
    rate: number
    billingFrequency?: 'monthly' | 'quarterly' | 'annually'
  }>
  monthlyRecurringRevenue: number
  status: 'active' | 'expired' | 'cancelled'
  autoRenew: boolean
}

// ============================================
// Service Catalogue - Form Builder System
// ============================================

// Field Types supported by the form builder
export type FormFieldType =
  | 'text' // Single line text
  | 'textarea' // Multi-line text
  | 'number' // Numeric input
  | 'email' // Email input with validation
  | 'phone' // Phone number with formatting
  | 'url' // URL with validation
  | 'date' // Date picker
  | 'datetime' // Date and time picker
  | 'time' // Time picker
  | 'select' // Dropdown select
  | 'multi-select' // Multiple selection dropdown
  | 'radio' // Radio buttons
  | 'checkbox' // Checkbox group
  | 'boolean' // Single checkbox/toggle
  | 'file' // File upload
  | 'user-select' // User picker
  | 'asset-select' // Asset picker
  | 'priority' // Priority selector (Low/Medium/High/Critical)
  | 'impact' // Impact selector (Low/Medium/High)
  | 'urgency' // Urgency selector (Low/Medium/High)
  | 'rich-text' // Rich text editor
  | 'divider' // Visual divider (not a field)
  | 'heading' // Section heading (not a field)
  | 'description' // Description text (not a field)

// Validation rule types
export type ValidationRuleType =
  | 'required'
  | 'min-length'
  | 'max-length'
  | 'min-value'
  | 'max-value'
  | 'pattern' // Regex pattern
  | 'email'
  | 'url'
  | 'custom' // Custom JavaScript validation

// Conditional logic operators
export type ConditionalOperator =
  | 'equals'
  | 'not-equals'
  | 'contains'
  | 'not-contains'
  | 'greater-than'
  | 'less-than'
  | 'is-empty'
  | 'is-not-empty'
  | 'in' // Value in array
  | 'not-in' // Value not in array

// Conditional action types
export type ConditionalActionType =
  | 'show' // Show field/section
  | 'hide' // Hide field/section
  | 'require' // Make field required
  | 'set-value' // Set field value
  | 'disable' // Disable field
  | 'enable' // Enable field

/**
 * Form Field Validation Rule
 */
export interface FormFieldValidation {
  id: string
  type: ValidationRuleType
  value?: string | number // e.g., min-length: 5, pattern: '^[A-Z]'
  message: string // Custom error message
}

/**
 * Conditional Logic Rule
 * Defines when to show/hide/require fields based on other field values
 */
export interface ConditionalRule {
  id: string
  fieldId: string // Field that triggers the condition
  operator: ConditionalOperator
  value: any // Value to compare against
  action: ConditionalActionType
  targetFieldIds: string[] // Fields affected by this rule
}

/**
 * Form Field Definition
 * Core building block of the form builder
 */
export interface FormField {
  id: string // Unique field ID
  type: FormFieldType
  label: string
  description?: string
  placeholder?: string
  defaultValue?: any
  required: boolean
  // Field configuration based on type
  config?: {
    // Text/Textarea
    minLength?: number
    maxLength?: number
    // Number
    min?: number
    max?: number
    step?: number
    // Select/Radio/Checkbox/Multi-select
    options?: Array<{
      value: string
      label: string
      description?: string
    }>
    allowCustomOption?: boolean // Allow "Other" option with text input
    // File upload
    acceptedFileTypes?: string[] // e.g., ['image/*', '.pdf', '.docx']
    maxFileSize?: number // In bytes
    maxFiles?: number
    // User/Asset select
    filterBy?: Record<string, any> // Filter criteria for dynamic options
    // Rich text
    allowImages?: boolean
    allowLinks?: boolean
    allowFormatting?: boolean
    // Date/Time
    minDate?: string
    maxDate?: string
    // Layout
    width?: 'full' | 'half' | 'third' | 'two-thirds' // Column width
    // Priority calculation
    calculatePriorityFrom?: { // Auto-calculate Priority from Impact × Urgency
      impactFieldId?: string
      urgencyFieldId?: string
    }
  }
  // Validation rules
  validations?: FormFieldValidation[]
  // Conditional logic (when this field triggers conditions)
  conditionalRules?: ConditionalRule[]
  // Field metadata
  order: number // Display order in form
  sectionId?: string // Section this field belongs to
  // Request type mapping
  itilMapping?: {
    category: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
    standardField?: string // Maps to standard fields (e.g., 'impact', 'urgency', 'ci')
  }
}

/**
 * Form Section
 * Groups related fields together
 */
export interface FormSection {
  id: string
  title: string
  description?: string
  order: number
  collapsible?: boolean
  defaultCollapsed?: boolean
  // Conditional visibility
  conditionalDisplay?: {
    fieldId: string
    operator: ConditionalOperator
    value: any
  }
}

/**
 * Form Schema Version
 * Maintains version history of form schemas
 */
export interface FormSchemaVersion {
  version: number
  createdAt: Date
  createdBy: string
  changelog?: string
  schema: {
    fields: FormField[]
    sections: FormSection[]
  }
  isPublished: boolean
  publishedAt?: Date
}

/**
 * Service Catalog Item (Comprehensive Form Builder)
 */
export interface ServiceCatalogueItem extends BaseEntity {
  // Basic Information
  name: string
  description: string
  shortDescription?: string
  category: string
  icon?: string // Lucide icon name
  tags: string[]
  isActive: boolean

  // Service Details
  type: ServiceType
  defaultRate: number
  currency: string
  estimatedTime?: string // e.g., "2-4 hours", "1-2 days"

  // Access Control
  availableFor?: UserRole[] // Which roles can request this service
  requiresApproval: boolean
  approvalWorkflow?: {
    type: 'single' | 'multi' | 'conditional'
    approvers?: string[] // User IDs
    conditions?: Array<{
      fieldId: string
      operator: ConditionalOperator
      value: any
      approvers: string[] // Different approvers based on conditions
    }>
  }

  // SLA Configuration
  slaResponseTime?: number // in hours
  slaResolutionTime?: number // in hours

  // Form Builder
  formSchemaId?: string // Reference to current active form schema
  currentVersion: number // Current form version
  formVersions: FormSchemaVersion[] // Version history

  // Form Template
  templateId?: string // Reference to template if created from one

  // Request Routing
  itilCategory: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
  requestType?: string // Specific request type within category

  // Analytics
  popularity: number
  avgResolutionTime?: number // in hours
  successRate?: number // percentage
  totalRequests?: number
}

export interface ServiceCatalogCategory extends BaseEntity {
  name: string
  description: string
  icon: string // Lucide icon name
  color: string // hex color
  order: number
  isActive: boolean
  serviceCount?: number // calculated field
}

/**
 * Form Template
 * Reusable form templates for quick service creation
 */
export interface FormTemplate extends BaseEntity {
  name: string
  description: string
  category: string
  icon?: string
  // Request type
  itilCategory: 'service-request' | 'incident' | 'problem' | 'change' | 'general'
  // Template schema
  schema: {
    fields: FormField[]
    sections: FormSection[]
  }
  // Template metadata
  isSystemTemplate: boolean // True for built-in templates
  usageCount?: number // How many services use this template
  tags: string[]
  // Preview/thumbnail
  previewImage?: string
}

export interface SelfServicePortalSettings extends BaseEntity {
  enabled: boolean
  welcomeMessage?: string
  customBranding?: {
    logo?: string
    primaryColor?: string
    accentColor?: string
  }
  showKnowledgeBase: boolean
  showIncidentStatus: boolean
  allowGuestSubmissions: boolean
  guestSubmissionEmail?: string
  autoAssignment: boolean
  defaultAssignee?: string
  notificationSettings: {
    emailOnSubmission: boolean
    emailOnStatusChange: boolean
    emailOnComment: boolean
  }
  customAnnouncement?: {
    enabled: boolean
    message: string
    type: 'info' | 'warning' | 'success'
  }
}

// ============================================
// Inventory
// ============================================

export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued'

export interface InventoryItem extends BaseEntity {
  sku: string
  name: string
  description: string
  category: string
  manufacturer?: string
  quantityInStock: number
  reorderLevel: number
  reorderQuantity: number
  unitCost: number
  location?: string
  status: InventoryStatus
  serialNumbers?: string[]
  lastRestocked?: Date
}

// ============================================
// Remote Control
// ============================================

export type RemoteControlSessionStatus = 'pending' | 'active' | 'ended' | 'failed'
export type RemoteControlAction = 'session_start' | 'session_end' | 'input_mouse' | 'input_keyboard' | 'consent_granted' | 'consent_denied' | 'agent_connected'

export interface RemoteControlSession extends BaseEntity {
  sessionId: string
  assetId: string
  operatorUserId: string
  operatorName: string
  status: RemoteControlSessionStatus
  startedAt: Date
  endedAt?: Date
  duration?: number // seconds
  consentRequired: boolean
  consentGranted?: boolean
  consentGrantedBy?: string
  consentGrantedAt?: Date
  ipAddress?: string
  userAgent?: string
  qualityMetrics?: {
    avgFps?: number
    avgLatency?: number
    packetsLost?: number
    bandwidth?: number
  }
  policySnapshot: {
    idleTimeout: number // minutes
    requireConsent: boolean
    allowClipboard: boolean
    allowFileTransfer: boolean
  }
}

export interface RemoteControlAuditLog {
  _id: ObjectId
  orgId: string
  sessionId: string
  assetId: string
  operatorUserId: string
  action: RemoteControlAction
  timestamp: Date
  details?: Record<string, unknown>
  ipAddress?: string
}

export interface RemoteControlPolicy {
  _id: ObjectId
  orgId: string
  enabled: boolean
  requireConsent: boolean
  idleTimeout: number // minutes
  allowClipboard: boolean
  allowFileTransfer: boolean
  allowedRoles: UserRole[]
  consentMessage?: string
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

export interface RemoteControlCapabilities {
  remoteControl: boolean
  screenCapture: boolean
  inputInjection: boolean
  webrtcSupported: boolean
  platform: string
  agentVersion: string
}

export interface RemoteControlSessionToken {
  sessionId: string
  assetId: string
  orgId: string
  userId: string
  permissions: string[]
  iat: number
  exp: number
}

export interface ICEServerConfig {
  urls: string | string[]
  username?: string
  credential?: string
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// RBAC (Role-Based Access Control)
// ============================================

/**
 * Permission structure
 * Represents a granular permission in the system
 */
export interface Permission {
  _id: ObjectId
  orgId: string
  module: string // e.g., 'tickets', 'assets', 'users', 'settings'
  action: string // e.g., 'view', 'create', 'edit', 'delete', 'manage'
  resource?: string // Optional: specific resource type (e.g., 'own', 'all', 'assigned')
  permissionKey: string // Composite key: 'module.action' or 'module.action.resource'
  description: string
  isSystem: boolean // true for system-defined, false for custom
  createdAt: Date
  updatedAt: Date
}

/**
 * Role structure
 * Defines a role with a set of permissions
 */
export interface Role extends BaseEntity {
  name: string // Internal name (e.g., 'custom_technician')
  displayName: string // Display name (e.g., 'Senior Technician')
  description: string
  permissions: string[] // Array of permission keys (e.g., ['tickets.view', 'tickets.create'])
  isSystem: boolean // true for admin/technician/user, false for custom roles
  isActive: boolean
  userCount?: number // Calculated field: number of users with this role
  color?: string // Optional color for UI display
  icon?: string // Optional icon for UI display
}

/**
 * User permission override
 * Allows granting or revoking specific permissions for individual users
 */
export interface UserPermission {
  userId: string
  permissionKey: string // e.g., 'tickets.viewAll'
  granted: boolean // true = grant permission, false = revoke permission
  grantedBy: string // User ID who granted/revoked the permission
  grantedAt: Date
  expiresAt?: Date // Optional expiration date for temporary permissions
  reason?: string // Optional reason for the override
}

/**
 * Permission check result
 * Used for debugging and auditing permission checks
 */
export interface PermissionCheckResult {
  hasPermission: boolean
  source: 'role' | 'custom' | 'override' | 'denied' // Where the permission came from
  permissionKey: string
  userId: string
  roleId?: string
  roleName?: string
  timestamp: Date
}

/**
 * Role assignment history
 * Tracks role changes for audit purposes
 */
export interface RoleAssignmentHistory {
  _id: ObjectId
  orgId: string
  userId: string
  previousRoleId?: string
  newRoleId: string
  changedBy: string
  changedAt: Date
  reason?: string
}

// ============================================
// Workflow Automation
// ============================================

/**
 * Workflow Node Types
 */
export type WorkflowNodeType =
  | 'trigger'       // Workflow entry point
  | 'condition'     // Decision/branching logic
  | 'action'        // API operations
  | 'approval'      // Human approval requests
  | 'delay'         // Wait/schedule
  | 'notification'  // Alerts and notifications
  | 'assignment'    // Auto-routing
  | 'sla'           // SLA management
  | 'transform'     // Data processing
  | 'loop'          // Iteration
  | 'merge'         // Branch convergence
  | 'end'           // Termination

/**
 * Workflow Status
 */
export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived'

/**
 * Workflow Category
 */
export type WorkflowCategory = 'incident' | 'service-request' | 'change' | 'problem' | 'ticket' | 'asset' | 'approval' | 'notification' | 'custom'

/**
 * Trigger Types
 */
export type TriggerType = 'manual' | 'event' | 'schedule' | 'webhook'

/**
 * Workflow Module Types
 */
export type WorkflowModule = 'tickets' | 'assets' | 'users' | 'projects' | 'knowledge-base'

/**
 * Workflow Event Types
 */
export type WorkflowEvent = 'created' | 'updated' | 'deleted' | 'status_changed' | 'assigned' | 'commented' | 'approved' | 'rejected'

/**
 * Filter Condition
 */
export interface FilterCondition {
  field: string
  operator: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater-than' | 'less-than' | 'in' | 'not-in' | 'is-empty' | 'is-not-empty'
  value: any
}

/**
 * Trigger Configuration
 */
export interface TriggerConfig {
  // Event-based trigger
  module?: WorkflowModule
  event?: WorkflowEvent
  conditions?: FilterCondition[]

  // Schedule-based trigger
  schedule?: {
    type: 'once' | 'recurring'
    startDate?: Date
    cron?: string
    timezone?: string
  }

  // Webhook trigger
  webhook?: {
    url: string
    secret: string
    method: 'GET' | 'POST' | 'PUT'
  }
}

/**
 * Workflow Node Data
 */
export interface WorkflowNodeData {
  label: string
  description?: string
  icon: string
  color: string
  config: Record<string, any>
  errors?: string[]
}

/**
 * Workflow Node (simple type for database storage)
 * Note: UI components use the extended version from @/lib/stores/workflow-store
 */
export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: WorkflowNodeData
}

/**
 * Workflow Edge (simple type for database storage)
 * Note: UI components use the extended version from @/lib/stores/workflow-store
 */
export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
  type?: string
  data?: {
    label?: string
    condition?: string
  }
}

/**
 * Workflow Definition
 */
export interface Workflow extends BaseEntity {
  name: string
  description: string
  category: WorkflowCategory
  status: WorkflowStatus
  version: number

  // React Flow data
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport: { x: number; y: number; zoom: number }

  // Trigger configuration
  trigger: {
    type: TriggerType
    config: TriggerConfig
  }

  // Metadata
  templateId?: string
  lastExecutedAt?: Date
  executionCount: number

  // Settings
  settings: {
    enabled: boolean
    runAsync: boolean
    maxRetries: number
    timeout: number // milliseconds
    onError: 'stop' | 'continue' | 'notify'
    notifyOnFailure: boolean
    notifyEmails: string[]
  }

  // Analytics
  metrics: {
    averageExecutionTime: number
    successRate: number
    lastError?: string
  }
}

/**
 * Workflow Execution Status
 */
export type WorkflowExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Node Execution Status
 */
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/**
 * Execution Context (data passed between nodes)
 */
export interface ExecutionContext {
  // Original trigger data
  trigger: Record<string, any>

  // Current item being processed
  item: Record<string, any>

  // Variables set by nodes
  variables: Record<string, any>

  // User who triggered the workflow
  user: {
    id: string
    email: string
    name: string
    role: string
  }

  // Organization context
  orgId: string
}

/**
 * Node Execution Record
 */
export interface NodeExecution {
  nodeId: string
  nodeType: WorkflowNodeType
  status: NodeExecutionStatus
  startedAt: Date
  completedAt?: Date
  duration?: number
  input?: Record<string, any>
  output?: Record<string, any>
  error?: string
  retryCount: number
}

/**
 * Workflow Execution
 */
export interface WorkflowExecution extends BaseEntity {
  workflowId: string
  workflowName: string
  version: number

  // Trigger info
  triggeredBy: 'user' | 'event' | 'schedule' | 'webhook'
  triggeredByUser?: string
  triggerData: Record<string, any>

  // Execution state
  status: WorkflowExecutionStatus
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds

  // Node execution tracking
  nodeExecutions: NodeExecution[]

  // Results
  output?: Record<string, any>
  error?: {
    message: string
    stack?: string
    nodeId?: string
  }

  // Context (data passed between nodes)
  context: ExecutionContext
}

/**
 * Workflow Template
 */
export interface WorkflowTemplate extends BaseEntity {
  name: string
  description: string
  category: string
  icon: string
  tags: string[]

  // Template definition
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  trigger: TriggerConfig

  // Metadata
  isSystem: boolean // Built-in vs custom
  usageCount: number
  rating: number
}

// ============================================
// Portal Page Builder
// ============================================

/**
 * Portal Page Block Types
 */
export type PortalBlockType =
  | 'container'       // Layout container (row/column/grid)
  | 'hero'           // Hero section with image/text
  | 'heading'        // Text heading (H1-H6)
  | 'paragraph'      // Rich text paragraph
  | 'button'         // Call-to-action button
  | 'image'          // Image block
  | 'video'          // Video embed
  | 'divider'        // Visual separator
  | 'spacer'         // Vertical spacing
  | 'card'           // Card container
  | 'card-grid'      // Grid of cards
  | 'accordion'      // Accordion/collapsible
  | 'tabs'           // Tabbed content
  | 'form'           // Form builder integration
  | 'ticket-list'    // Dynamic ticket list
  | 'incident-list'  // Dynamic incident list
  | 'kb-article-list' // Knowledge base articles
  | 'service-catalog' // Service catalog grid
  | 'announcement-bar' // Alert/announcement banner
  | 'stats-grid'     // Statistics display
  | 'icon-grid'      // Icon grid with text
  | 'testimonial'    // Testimonial block
  | 'faq'            // FAQ block
  | 'custom-html'    // Custom HTML (sanitized)

/**
 * Portal Page Status
 */
export type PortalPageStatus = 'draft' | 'published' | 'archived'

/**
 * Visibility Guard Type
 */
export type VisibilityGuardType = 'authenticated' | 'role' | 'permission' | 'custom'

/**
 * Visibility Guard Configuration
 */
export interface VisibilityGuard {
  type: VisibilityGuardType
  // Role-based
  roles?: UserRole[]
  // Permission-based
  permissions?: string[]
  // Custom expression (evaluated server-side)
  expression?: string
  // Fallback content for unauthorized users
  fallbackContent?: string
}

/**
 * Data Binding Configuration
 */
export interface DataBinding {
  sourceId: string // Data source ID
  field: string // Field path (e.g., 'tickets.length', 'user.firstName')
  transform?: string // Optional transformation expression
  fallback?: any // Fallback value if binding fails
}

/**
 * Block Instance Props
 */
export interface BlockProps {
  // Layout props
  layout?: {
    container?: 'fixed' | 'fluid' | 'full'
    direction?: 'row' | 'column'
    gap?: number
    padding?: number
    margin?: number
    align?: 'start' | 'center' | 'end' | 'stretch'
    justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  }

  // Typography props
  text?: {
    content?: string
    level?: 1 | 2 | 3 | 4 | 5 | 6
    align?: 'left' | 'center' | 'right'
    size?: string
    weight?: string
    color?: string
  }

  // Image props
  image?: {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  }

  // Button props
  button?: {
    text?: string
    href?: string
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    icon?: string
    openInNewTab?: boolean
  }

  // Video props
  video?: {
    src?: string
    provider?: 'youtube' | 'vimeo' | 'custom'
    autoplay?: boolean
    controls?: boolean
    loop?: boolean
  }

  // Divider props
  divider?: {
    orientation?: 'horizontal' | 'vertical'
    thickness?: number
    color?: string
  }

  // Spacer props
  spacer?: {
    height?: number
    width?: number
  }

  // Card props
  card?: {
    title?: string
    description?: string
    image?: string
    href?: string
    variant?: 'default' | 'bordered' | 'elevated'
  }

  // Accordion props
  accordion?: {
    items?: Array<{
      title: string
      content: string
      defaultOpen?: boolean
    }>
    allowMultiple?: boolean
  }

  // Tabs props
  tabs?: {
    items?: Array<{
      label: string
      content: string
      icon?: string
    }>
    defaultTab?: number
  }

  // Form props
  form?: {
    serviceId?: string // Service catalog item ID
    title?: string
    description?: string
    submitButtonText?: string
  }

  // Dynamic list props
  list?: {
    dataSource?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    showPagination?: boolean
    columns?: Array<{
      field: string
      label: string
      type?: 'text' | 'date' | 'status' | 'badge'
    }>
  }

  // Announcement bar props
  announcement?: {
    message?: string
    type?: 'info' | 'warning' | 'success' | 'error'
    dismissible?: boolean
  }

  // Stats props
  stats?: {
    items?: Array<{
      label: string
      value: string | number
      icon?: string
      trend?: 'up' | 'down' | 'neutral'
      trendValue?: string
    }>
  }

  // Icon grid props
  iconGrid?: {
    items?: Array<{
      icon: string
      title: string
      description: string
      href?: string
    }>
    columns?: 2 | 3 | 4
  }

  // Testimonial props
  testimonial?: {
    quote?: string
    author?: string
    role?: string
    avatar?: string
  }

  // FAQ props
  faq?: {
    items?: Array<{
      question: string
      answer: string
    }>
  }

  // Custom HTML props
  customHtml?: {
    html?: string
    css?: string
  }

  // Style overrides
  style?: {
    backgroundColor?: string
    backgroundImage?: string
    borderRadius?: number
    border?: string
    boxShadow?: string
    className?: string
  }

  // Data bindings for dynamic content
  bindings?: Record<string, DataBinding>
}

/**
 * Block Instance (tree node)
 */
export interface BlockInstance {
  id: string
  type: PortalBlockType
  props: BlockProps
  children?: BlockInstance[]
  visibilityGuards?: VisibilityGuard[]
  order: number
}

/**
 * Portal Theme Configuration
 */
export interface PortalTheme extends BaseEntity {
  name: string
  description?: string
  isDefault: boolean

  // Design tokens
  colors: {
    primary: string
    primaryForeground: string
    secondary: string
    secondaryForeground: string
    accent: string
    accentForeground: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    card: string
    cardForeground: string
    popover: string
    popoverForeground: string
    border: string
    input: string
    ring: string
    destructive: string
    destructiveForeground: string
  }

  // Typography
  typography: {
    fontFamily: string
    headingFontFamily?: string
    fontSize: {
      xs: string
      sm: string
      base: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
      '4xl': string
    }
    fontWeight: {
      normal: number
      medium: number
      semibold: number
      bold: number
    }
    lineHeight: {
      tight: number
      normal: number
      relaxed: number
    }
  }

  // Spacing
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    '2xl': string
  }

  // Border radius
  borderRadius: {
    none: string
    sm: string
    md: string
    lg: string
    full: string
  }

  // Shadows
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }

  // Custom CSS
  customCss?: string
}

/**
 * Data Source Configuration
 */
export interface DataSource {
  id: string
  name: string
  type: 'internal' | 'external' | 'api' | 'static'

  // Internal data source (Deskwise entities)
  internal?: {
    entity: 'tickets' | 'incidents' | 'kb-articles' | 'service-catalog' | 'announcements'
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
  }

  // External API data source
  external?: {
    url: string
    method: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: Record<string, any>
    transformResponse?: string // JavaScript expression to transform response
  }

  // Static data
  static?: {
    data: any
  }

  // Caching
  cache?: {
    enabled: boolean
    ttl: number // seconds
  }
}

/**
 * Portal Page
 */
export interface PortalPage extends BaseEntity {
  // Basic info
  title: string
  slug: string // URL-friendly path (e.g., 'home', 'support', 'about')
  description?: string

  // Status
  status: PortalPageStatus
  publishedAt?: Date
  publishedBy?: string

  // Page structure
  blocks: BlockInstance[]

  // Data sources
  dataSources?: DataSource[]

  // Theme
  themeId?: string // Reference to PortalTheme._id
  themeOverrides?: Partial<PortalTheme> // Page-specific theme overrides

  // SEO
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
    ogImage?: string
    canonicalUrl?: string
    noIndex?: boolean
    noFollow?: boolean
  }

  // Access control
  isPublic: boolean // If true, accessible without authentication
  allowedRoles?: UserRole[]
  requiredPermissions?: string[]

  // Layout settings
  layout?: {
    header?: boolean
    footer?: boolean
    sidebar?: boolean
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  }

  // Metadata
  version: number
  previousVersionId?: string // Reference to previous version
  isHomePage: boolean // If true, this is the default portal landing page
  parentPageId?: string // For hierarchical navigation
  order: number // Display order in navigation
  showInNav: boolean // Show in navigation menu
  navLabel?: string // Override label in navigation

  // Analytics
  viewCount: number
  lastViewedAt?: Date

  // Portal Settings (per-page configuration)
  pageSettings?: {
    // General
    enabled?: boolean
    welcomeMessage?: string
    showKnowledgeBase?: boolean
    showIncidentStatus?: boolean

    // Ticket Management
    allowGuestSubmissions?: boolean
    guestSubmissionEmail?: string
    autoAssignment?: boolean
    defaultAssignee?: string

    // Notifications
    notificationSettings?: {
      emailOnSubmission: boolean
      emailOnStatusChange: boolean
      emailOnComment: boolean
    }

    // Custom Announcement
    customAnnouncement?: {
      enabled: boolean
      message: string
      type: 'info' | 'warning' | 'success'
    }
  }
}

/**
 * Portal Page Version (for version history)
 */
export interface PortalPageVersion extends BaseEntity {
  pageId: string
  version: number
  title: string
  blocks: BlockInstance[]
  dataSources?: DataSource[]
  changeMessage?: string
  restoredFromVersion?: number
}

/**
 * Preview Token (for preview mode)
 */
export interface PortalPreviewToken {
  token: string
  pageId: string
  userId: string
  expiresAt: Date
  createdAt: Date
}

// ============================================
// Email Notification System
// ============================================

/**
 * Email Provider Type
 */
export type EmailProvider = 'platform' | 'smtp'

/**
 * SMTP Configuration (encrypted)
 */
export interface SmtpConfig {
  host: string // e.g., 'smtp.gmail.com'
  port: number // e.g., 587 or 465
  secure: boolean // true for 465, false for other ports (use STARTTLS)
  username: string // SMTP username
  password: string // Encrypted SMTP password
  requireTLS?: boolean // Force TLS (optional, default: true)
}

/**
 * Email Settings (Per Organization)
 *
 * Organizations can choose between:
 * 1. Platform Email - Uses Deskwise's AWS SES (from .env), no config needed
 * 2. Custom SMTP - Uses organization's own SMTP server (Gmail, Outlook, SendGrid, etc.)
 */
export interface EmailSettings extends BaseEntity {
  // Provider Selection
  provider: EmailProvider // 'platform' (default) or 'smtp'

  // SMTP Configuration (only if provider = 'smtp')
  smtp?: SmtpConfig

  // Email Identity (required for both providers)
  fromEmail: string // Sender email address
  fromName: string // Display name
  replyToEmail?: string // Optional reply-to address

  // Status
  isEnabled: boolean
  isConfigured: boolean // true if provider is set up
  lastTestedAt?: Date
  lastTestResult?: {
    success: boolean
    message: string
    timestamp: Date
  }

  // Rate Limits (organization-level)
  maxEmailsPerHour: number // Default: 100
  maxEmailsPerDay: number // Default: 1000
  currentHourCount: number
  currentDayCount: number
  lastResetHour: Date
  lastResetDay: Date
}

/**
 * Notification Event Types (Enum)
 */
export enum NotificationEvent {
  // Tickets
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_ASSIGNED = 'ticket.assigned',
  TICKET_STATUS_CHANGED = 'ticket.status_changed',
  TICKET_RESOLVED = 'ticket.resolved',
  TICKET_CLOSED = 'ticket.closed',
  TICKET_COMMENT_ADDED = 'ticket.comment_added',
  TICKET_ESCALATED = 'ticket.escalated',
  TICKET_SLA_WARNING = 'ticket.sla_warning',
  // Incidents
  INCIDENT_CREATED = 'incident.created',
  INCIDENT_UPDATED = 'incident.updated',
  INCIDENT_STATUS_CHANGED = 'incident.status_changed',
  INCIDENT_RESOLVED = 'incident.resolved',
  INCIDENT_ASSIGNED = 'incident.assigned',
  // Change Requests
  CHANGE_CREATED = 'change.created',
  CHANGE_UPDATED = 'change.updated',
  CHANGE_APPROVED = 'change.approved',
  CHANGE_REJECTED = 'change.rejected',
  CHANGE_SCHEDULED = 'change.scheduled',
  CHANGE_COMPLETED = 'change.completed',
  // Projects
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_ASSIGNED = 'project.assigned',
  PROJECT_TASK_ASSIGNED = 'project.task_assigned',
  PROJECT_MILESTONE_REACHED = 'project.milestone_reached',
  // Service Requests
  SERVICE_REQUEST_CREATED = 'service_request.created',
  SERVICE_REQUEST_APPROVED = 'service_request.approved',
  SERVICE_REQUEST_REJECTED = 'service_request.rejected',
  SERVICE_REQUEST_COMPLETED = 'service_request.completed',
  // Users
  USER_ASSIGNED = 'user.assigned',
  USER_MENTIONED = 'user.mentioned',
  // Assets
  ASSET_ASSIGNED = 'asset.assigned',
  ASSET_WARRANTY_EXPIRING = 'asset.warranty_expiring',
  ASSET_MAINTENANCE_DUE = 'asset.maintenance_due',
}

/**
 * Notification Event Type (for backward compatibility)
 */
export type NotificationEventType = `${NotificationEvent}`

/**
 * Recipient Type for Notification Rules
 */
export type NotificationRecipientType =
  | 'requester' // Person who created the item
  | 'assignee' // Person assigned to the item
  | 'watcher' // People watching the item
  | 'role' // All users with specific role
  | 'user' // Specific user(s)
  | 'email' // Static email address(es)
  | 'custom' // Custom expression

/**
 * Notification Template
 * Customizable email templates using Handlebars
 */
export interface NotificationTemplate extends BaseEntity {
  name: string
  description: string

  // Template Content
  subject: string // Handlebars template for subject
  htmlBody: string // Handlebars template for HTML body
  textBody?: string // Optional plain text version

  // Template Variables
  availableVariables: string[] // e.g., ['ticketNumber', 'title', 'assigneeName']

  // Event Association
  event: NotificationEvent

  // Metadata
  isSystem: boolean // True for default templates, false for custom
  isActive: boolean
  usageCount: number // How many times this template has been used
  lastUsedAt?: Date

  // Preview
  previewData?: Record<string, any> // Sample data for preview
}

/**
 * Notification Rule
 * Defines what triggers what notification to whom
 */
export interface NotificationRule extends BaseEntity {
  name: string
  description: string

  // Trigger Configuration
  event: NotificationEvent
  conditions?: FilterCondition[] // Optional conditions (e.g., priority = high)

  // Recipients
  recipients: Array<{
    type: NotificationRecipientType
    value?: string | string[] // User IDs, role IDs, or email addresses
    expression?: string // For custom recipient logic
  }>

  // Template
  templateId: string // Reference to NotificationTemplate._id

  // Settings
  isEnabled: boolean
  priority: number // Execution order (lower = higher priority)

  // Throttling
  throttle?: {
    enabled: boolean
    maxPerHour: number // Max emails per recipient per hour
    maxPerDay: number // Max emails per recipient per day
  }

  // Analytics
  executionCount: number
  lastExecutedAt?: Date
  successCount: number
  failureCount: number
}

/**
 * User Notification Preferences
 * User-level settings for email notifications
 */
export interface UserNotificationPreferences {
  _id: ObjectId
  userId: string
  orgId: string

  // Global Settings
  emailNotificationsEnabled: boolean
  digestMode: boolean // If true, send daily digest instead of immediate emails
  digestTime?: string // Time of day for digest (e.g., '09:00')

  // Event Preferences
  preferences: Record<NotificationEvent, {
    enabled: boolean
    frequency: 'immediate' | 'digest' | 'never'
  }>

  // Quiet Hours
  quietHours?: {
    enabled: boolean
    startTime: string // e.g., '22:00'
    endTime: string // e.g., '08:00'
    timezone: string
  }

  // Do Not Disturb
  doNotDisturb: boolean
  doNotDisturbUntil?: Date

  createdAt: Date
  updatedAt: Date
}

/**
 * Email Delivery Status
 */
export type EmailDeliveryStatus =
  | 'queued' // Email queued for sending
  | 'sending' // Currently being sent
  | 'sent' // Successfully sent to SES
  | 'delivered' // Confirmed delivery
  | 'bounced' // Hard or soft bounce
  | 'complained' // Recipient marked as spam
  | 'failed' // Failed to send
  | 'rejected' // Rejected by SES

/**
 * Email Delivery Log
 * Audit trail for all email notifications
 */
export interface EmailDeliveryLog {
  _id: ObjectId
  orgId: string

  // Email Details
  to: string[]
  cc?: string[]
  bcc?: string[]
  from: string
  replyTo?: string
  subject: string

  // Content
  htmlBody: string
  textBody?: string

  // Context
  event: NotificationEvent
  ruleId?: string // Reference to NotificationRule._id
  templateId?: string // Reference to NotificationTemplate._id

  // Related Entity
  relatedEntity?: {
    type: 'ticket' | 'incident' | 'change' | 'project' | 'service_request'
    id: string
    number: string // Ticket number, incident number, etc.
  }

  // Delivery Status
  status: EmailDeliveryStatus
  statusHistory: Array<{
    status: EmailDeliveryStatus
    timestamp: Date
    message?: string
    details?: Record<string, any>
  }>

  // SES Details
  sesMessageId?: string // Amazon SES message ID
  sesResponse?: Record<string, any> // Raw SES response

  // Error Tracking
  error?: {
    message: string
    code?: string
    details?: Record<string, any>
    timestamp: Date
  }

  // Retry Information
  retryCount: number
  maxRetries: number
  nextRetryAt?: Date

  // Timestamps
  queuedAt: Date
  sentAt?: Date
  deliveredAt?: Date
  failedAt?: Date

  // Metadata
  metadata?: Record<string, any> // Additional context
}

/**
 * Email Queue Item (for batch processing)
 */
export interface EmailQueueItem {
  _id: ObjectId
  orgId: string

  // Email Details
  to: string
  subject: string
  htmlBody: string
  textBody?: string

  // Context
  event: NotificationEvent
  ruleId: string
  templateId: string
  variables: Record<string, any>

  // Related Entity
  relatedEntity?: {
    type: 'ticket' | 'incident' | 'change' | 'project' | 'service_request'
    id: string
  }

  // Queue Status
  status: 'pending' | 'processing' | 'completed' | 'failed'
  priority: number // Lower = higher priority

  // Scheduling
  scheduledFor?: Date // Delayed delivery
  processAfter: Date

  // Retry
  retryCount: number
  lastError?: string

  // Timestamps
  createdAt: Date
  processedAt?: Date
}

// ============================================
// Inbound Email Integration
// ============================================

/**
 * IMAP Configuration (encrypted)
 */
export interface ImapConfig {
  host: string // e.g., 'imap.gmail.com'
  port: number // e.g., 993
  secure: boolean // true for SSL
  username: string // IMAP username
  password: string // Encrypted IMAP password
}

/**
 * Auto-Assignment Rule for Inbound Emails
 */
export interface EmailAssignmentRule {
  condition: 'subject_contains' | 'from_domain' | 'body_contains'
  value: string // The value to match
  assignTo: string // User ID or team ID to assign to
}

/**
 * Inbound Email Account
 * Configuration for email accounts that receive emails and create tickets
 */
export interface InboundEmailAccount extends BaseEntity {
  name: string // Display name: "Support Mailbox"
  email: string // support@company.com

  // IMAP Configuration
  imap: ImapConfig

  // Settings
  isActive: boolean
  pollingInterval: number // seconds (default: 60)
  deleteAfterProcessing: boolean // or move to folder
  processedFolder?: string // "Processed" or "Archive"

  // Auto-Assignment Rules
  defaultAssignee?: string // User ID
  autoAssignmentEnabled: boolean
  assignmentRules: EmailAssignmentRule[]

  // Stats
  lastPolledAt?: Date
  emailsProcessed: number
  ticketsCreated: number
  lastError?: string
}

/**
 * Processed Email Action Type
 */
export type ProcessedEmailAction =
  | 'ticket_created' // Created a new ticket
  | 'comment_added' // Added comment to existing ticket
  | 'ignored' // Email was ignored (auto-reply, bounce, etc.)
  | 'error' // Error processing email

/**
 * Email Attachment Info
 */
export interface EmailAttachmentInfo {
  filename: string
  contentType: string
  size: number // bytes
  attachmentId?: string // MongoDB GridFS reference
}

/**
 * Processed Email
 * Log of emails that have been processed by the inbound email system
 */
export interface ProcessedEmail {
  _id: ObjectId
  orgId: string
  accountId: string // Reference to inbound_email_account

  // Email Data
  messageId: string // Email Message-ID header (unique)
  inReplyTo?: string // In-Reply-To header for threading
  from: string
  to: string[]
  subject: string
  bodyHtml?: string
  bodyText?: string

  // Processing Result
  action: ProcessedEmailAction
  ticketId?: string // Reference to created/updated ticket
  commentId?: string // Reference to added comment
  errorMessage?: string

  // Attachments
  attachments: EmailAttachmentInfo[]

  // Metadata
  receivedAt: Date
  processedAt: Date
  processingTime: number // milliseconds
}

// ============================================
// Analytics & Reporting
// ============================================

/**
 * Analytics Metric
 * Represents a single metric with trend data
 */
export interface AnalyticsMetric {
  label: string
  value: number | string
  unit?: string
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    value: string
    period: string
  }
  status: 'success' | 'warning' | 'danger' | 'neutral'
}

/**
 * Chart Data Configuration
 * Generic chart data structure for various chart types
 */
export interface ChartData {
  chartType: 'line' | 'bar' | 'pie' | 'donut' | 'area' | 'heatmap'
  data: any[]
  config?: {
    xAxis?: string
    yAxis?: string
    series?: string[]
    colors?: string[]
    legend?: boolean
    tooltip?: boolean
  }
}

/**
 * Filter Rule for Report Builder
 */
export interface FilterRule {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'greater_than' | 'less_than' | 'between' | 'in'
  value: any
  conjunction?: 'AND' | 'OR'
}

/**
 * Saved Report
 * Custom reports saved by users
 */
export interface SavedReport extends BaseEntity {
  name: string
  description?: string
  category: string
  dataSource: 'tickets' | 'incidents' | 'assets' | 'projects' | 'changes' | 'service_requests'
  filters: FilterRule[]
  columns: string[]
  groupBy?: string[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }[]
  chartType?: string
  schedule?: ReportSchedule
  visibility: 'private' | 'team' | 'organization'
  lastRun?: Date
  runCount?: number
}

/**
 * Report Schedule Configuration
 */
export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly'
  dayOfWeek?: number  // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  time: string        // HH:mm format
  recipients: string[]
  formats: ('pdf' | 'excel' | 'csv')[]
  enabled: boolean
}

/**
 * Report Execution History
 */
export interface ReportExecution extends BaseEntity {
  reportId: string
  reportName: string
  status: 'success' | 'failed'
  executedAt: Date
  executionTimeMs: number
  resultCount: number
  error?: string
  recipientCount?: number
}

// ============================================
// MSP CRM - Client Management
// ============================================

/**
 * Client Contact
 * Individual contact person at a client organization
 */
export interface ClientContact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  mobile?: string
  role?: string
  department?: string
  isPrimary: boolean
  portalAccess: boolean
  notifications: {
    email: boolean
    sms: boolean
  }
  createdAt: Date
  updatedAt: Date
}

/**
 * Client Agreement/Contract
 * Service level agreement or contract terms
 */
export interface ClientAgreement extends BaseEntity {
  clientId: string
  name: string
  type: 'msp' | 'project' | 'retainer' | 'ad-hoc'
  status: 'draft' | 'active' | 'expired' | 'cancelled'
  startDate: Date
  endDate?: Date
  autoRenew: boolean

  // Service terms
  serviceHours: {
    timezone: string
    monday: { start: string; end: string; enabled: boolean }
    tuesday: { start: string; end: string; enabled: boolean }
    wednesday: { start: string; end: string; enabled: boolean }
    thursday: { start: string; end: string; enabled: boolean }
    friday: { start: string; end: string; enabled: boolean }
    saturday: { start: string; end: string; enabled: boolean }
    sunday: { start: string; end: string; enabled: boolean }
  }

  // SLA targets
  sla: {
    responseTime: { critical: number; high: number; medium: number; low: number } // in minutes
    resolutionTime: { critical: number; high: number; medium: number; low: number } // in hours
  }

  // Pricing
  billingType: 'fixed' | 'hourly' | 'per-user' | 'tiered'
  monthlyValue: number
  currency: string

  // Included services
  includedHours?: number // Monthly included hours
  services: string[] // Service catalog item IDs

  documents: {
    id: string
    name: string
    url: string
    uploadedAt: Date
  }[]

  notes?: string
}

/**
 * Client
 * MSP client/customer organization
 */
export interface Client extends BaseEntity {
  name: string
  displayName?: string

  // Hierarchy
  parentClientId?: string // For multi-site clients
  isParent: boolean

  // Contact info
  email?: string
  phone?: string
  website?: string

  // Address
  address: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }

  // Business info
  industry?: string
  taxId?: string // EIN, VAT, etc.
  companySize?: string // '1-10', '11-50', '51-200', etc.

  // Contacts
  contacts: ClientContact[]

  // Billing
  billingAddress?: {
    street: string
    city: string
    state: string
    postalCode: string
    country: string
    sameAsPhysical: boolean
  }
  billingEmail?: string
  paymentTerms: number // days (e.g., 30, 60, 90)
  currency: string
  taxRate: number // percentage

  // Settings
  timezone: string
  language: string

  // Status
  status: 'prospect' | 'active' | 'inactive' | 'churned'
  accountManager?: string // User ID

  // Metrics
  totalRevenue: number
  monthlyRecurringRevenue: number
  lifetimeValue: number
  healthScore: number // 0-100

  // Preferences
  preferences: {
    portalEnabled: boolean
    autoTicketCreation: boolean
    billingNotifications: boolean
  }

  // Metadata
  tags: string[]
  customFields?: Record<string, any>

  // Timestamps
  onboardedAt?: Date
  lastActivityAt?: Date
}

// ============================================
// MSP CRM - Service Agreements (Comprehensive)
// ============================================

/**
 * Agreement Type
 */
export type AgreementType =
  | 'msa'         // Master Service Agreement
  | 'sla'         // Service Level Agreement
  | 'sow'         // Statement of Work
  | 'maintenance' // Maintenance Agreement

/**
 * Agreement Status
 */
export type AgreementStatus =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'pending_signature'
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'terminated'
  | 'renewed'

/**
 * SLA Tier
 * Industry-standard MSP SLA tiers
 */
export type SLATier = 'platinum' | 'gold' | 'silver' | 'bronze' | 'custom'

/**
 * Business Hours Day Configuration
 */
export interface BusinessHoursDay {
  enabled: boolean
  start: string // HH:mm format (e.g., "08:00")
  end: string   // HH:mm format (e.g., "17:00")
}

/**
 * Business Hours Configuration
 */
export interface BusinessHours {
  timezone: string
  monday: BusinessHoursDay
  tuesday: BusinessHoursDay
  wednesday: BusinessHoursDay
  thursday: BusinessHoursDay
  friday: BusinessHoursDay
  saturday: BusinessHoursDay
  sunday: BusinessHoursDay
}

/**
 * SLA Target (Response/Resolution Time)
 */
export interface SLATarget {
  critical: number  // in minutes
  high: number      // in minutes
  medium: number    // in minutes
  low: number       // in minutes
}

/**
 * SLA Configuration
 * Complete SLA definition with response/resolution targets
 */
export interface SLAConfig {
  tier: SLATier
  responseTime: SLATarget    // Response SLA in minutes
  resolutionTime: SLATarget  // Resolution SLA in hours (stored as minutes for consistency)
  availability?: number       // Uptime % (e.g., 99.9)
  businessHours: BusinessHours
  excludeHolidays: boolean
  holidayCalendarId?: string
}

/**
 * Covered Service
 * Services included in the agreement
 */
export interface CoveredService {
  id: string
  serviceId?: string // Reference to service catalog item
  name: string
  description?: string
  includedHours?: number  // Monthly included hours (0 = unlimited)
  overageRate?: number    // Hourly rate for overage
  isActive: boolean
}

/**
 * Billing Schedule
 */
export interface BillingSchedule {
  frequency: 'monthly' | 'quarterly' | 'annually'
  amount: number
  currency: string
  dayOfMonth?: number     // For monthly (1-31)
  monthsInAdvance?: number // Bill N months in advance
  autoRenewal: boolean
  nextBillingDate: Date
}

/**
 * SLA Breach Severity
 */
export type BreachSeverity = 'minor' | 'major' | 'critical'

/**
 * SLA Breach Status
 */
export type BreachStatus = 'open' | 'acknowledged' | 'resolved' | 'credited'

/**
 * SLA Breach
 * Record of SLA breach incident
 */
export interface SLABreach {
  _id: ObjectId
  orgId: string
  agreementId: string
  clientId: string

  // Breach details
  ticketId?: string
  incidentId?: string
  breachType: 'response' | 'resolution' | 'availability'
  severity: BreachSeverity

  // Timing
  targetTime: number        // Target in minutes
  actualTime: number        // Actual time in minutes
  breachAmount: number      // How much over target (minutes)
  breachPercentage: number  // % over target

  // Status
  status: BreachStatus
  detectedAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  resolvedAt?: Date

  // Impact
  creditIssued: boolean
  creditAmount?: number
  escalated: boolean
  escalatedTo?: string

  // Notes
  rootCause?: string
  preventiveMeasures?: string
  clientNotified: boolean
  clientNotifiedAt?: Date

  createdAt: Date
  updatedAt: Date
}

/**
 * Agreement Document
 * Attached documents (contracts, amendments, etc.)
 */
export interface AgreementDocument {
  id: string
  name: string
  type: 'contract' | 'amendment' | 'sow' | 'msa' | 'exhibit' | 'other'
  fileUrl: string
  fileSize: number
  uploadedBy: string
  uploadedAt: Date
  version?: number

  // E-signature
  requiresSignature: boolean
  signedBy?: Array<{
    name: string
    email: string
    role: 'client' | 'provider'
    signedAt: Date
    ipAddress: string
    signatureId?: string // External e-signature platform ID
  }>
}

/**
 * Agreement Renewal
 * Renewal history and settings
 */
export interface AgreementRenewal {
  autoRenew: boolean
  renewalNoticeDays: number // Days before expiry to send renewal notice
  renewalTermMonths: number // Length of renewal term
  priceIncreasePercent?: number
  nextRenewalDate?: Date

  // Renewal history
  renewalHistory: Array<{
    renewedAt: Date
    renewedBy: string
    previousEndDate: Date
    newEndDate: Date
    priceChange?: number
    priceChangePercent?: number
    notes?: string
  }>
}

/**
 * Agreement Metrics
 * Performance metrics for agreement
 */
export interface AgreementMetrics {
  // Ticket metrics
  totalTickets: number
  ticketsWithinSLA: number
  ticketsBreachedSLA: number
  slaComplianceRate: number // percentage

  // Response metrics
  avgResponseTime: number // minutes
  avgResolutionTime: number // minutes

  // Financial
  totalRevenue: number
  includedHoursUsed: number
  includedHoursRemaining: number
  overageHours: number
  overageRevenue: number

  // Breach tracking
  totalBreaches: number
  criticalBreaches: number
  creditsIssued: number
  totalCreditAmount: number

  // Period
  lastCalculatedAt: Date
  periodStart: Date
  periodEnd: Date
}

/**
 * Service Agreement (Comprehensive)
 * Complete service agreement with SLA, billing, and compliance tracking
 */
export interface ServiceAgreement extends BaseEntity {
  // Basic Information
  agreementNumber: string  // Auto-generated: AGR-2024-0001
  clientId: string
  clientName: string
  name: string
  description?: string
  type: AgreementType
  status: AgreementStatus

  // Dates
  startDate: Date
  endDate?: Date
  signedDate?: Date

  // Renewal
  renewal: AgreementRenewal

  // SLA Configuration
  sla: SLAConfig

  // Services
  coveredServices: CoveredService[]

  // Billing
  billing: BillingSchedule

  // Contacts
  clientSignatory?: {
    contactId?: string
    name: string
    email: string
    title: string
  }
  providerSignatory?: {
    userId?: string
    name: string
    email: string
    title: string
  }

  // Documents
  documents: AgreementDocument[]

  // Terms & Conditions
  termsAndConditions?: string
  customTerms?: string

  // Notifications
  notificationSettings: {
    breachNotifications: boolean
    expiryNotifications: boolean
    renewalNotifications: boolean
    monthlyReports: boolean
    notifyEmails: string[]
  }

  // Metrics (calculated)
  metrics?: AgreementMetrics

  // Workflow
  approvalHistory: Array<{
    approvedBy: string
    approvedByName: string
    approvedAt: Date
    comments?: string
  }>

  rejectionReason?: string

  // Parent/Child (for amendments)
  parentAgreementId?: string
  amendmentNumber?: number

  // Tags and custom fields
  tags: string[]
  customFields?: Record<string, any>

  // Activity tracking
  lastReviewedAt?: Date
  lastReviewedBy?: string
  nextReviewDate?: Date
}

/**
 * Agreement Template
 * Reusable agreement template
 */
export interface AgreementTemplate extends BaseEntity {
  name: string
  description: string
  type: AgreementType

  // Default SLA
  defaultSLA: SLAConfig

  // Default Services
  defaultServices: Omit<CoveredService, 'id'>[]

  // Default Billing
  defaultBilling: Omit<BillingSchedule, 'nextBillingDate'>

  // Document template
  termsAndConditions: string
  customTerms?: string

  // Usage
  timesUsed: number
  lastUsedAt?: Date
  isActive: boolean
}

// ============================================
// MSP CRM - Quoting
// ============================================

/**
 * Quote Line Item
 * Individual line in a quote
 */
export interface QuoteLineItem {
  id: string
  type: 'product' | 'service' | 'labor' | 'recurring'
  name: string
  description?: string
  quantity: number
  unitPrice: number
  discount: number // percentage or fixed amount
  discountType: 'percentage' | 'fixed'
  taxable: boolean
  total: number // calculated: (quantity * unitPrice - discount) * (1 + tax if taxable)

  // For recurring items
  recurringPeriod?: 'monthly' | 'quarterly' | 'annually'

  // References
  catalogItemId?: string // Reference to service catalog
  assetId?: string // Reference to asset if applicable

  order: number // Display order
}

/**
 * Quote
 * Sales quote/proposal for services
 */
export interface Quote extends BaseEntity {
  quoteNumber: string // Auto-generated: QT-2024-0001

  // Client info
  clientId: string
  clientName: string
  contactId?: string

  // Quote details
  title: string
  description?: string
  status: 'draft' | 'sent' | 'viewed' | 'approved' | 'declined' | 'expired' | 'converted'

  // Line items
  lineItems: QuoteLineItem[]

  // Pricing
  subtotal: number
  totalDiscount: number
  taxAmount: number
  total: number
  currency: string

  // Validity
  validUntil: Date

  // Terms
  paymentTerms: number // days
  terms?: string // Terms and conditions
  notes?: string // Internal notes

  // Approval
  approvedBy?: string // Client contact ID
  approvedAt?: Date
  declinedReason?: string

  // Conversion
  convertedToInvoiceId?: string
  convertedToContractId?: string
  convertedAt?: Date

  // Template
  templateId?: string

  // Versioning
  version: number
  previousVersionId?: string

  // Communication
  sentAt?: Date
  viewedAt?: Date
  lastViewedAt?: Date
  viewCount: number

  // Documents
  pdfUrl?: string
  attachments: {
    id: string
    name: string
    url: string
    size: number
  }[]

  // Owner
  createdByName?: string
  assignedTo?: string // User ID
}

/**
 * Quote Template
 * Reusable quote template
 */
export interface QuoteTemplate extends BaseEntity {
  name: string
  description?: string
  category?: string

  // Default values
  title: string
  lineItems: Omit<QuoteLineItem, 'id' | 'total'>[]
  terms?: string
  notes?: string
  validityDays: number // Quote valid for X days

  // Usage
  timesUsed: number
  lastUsedAt?: Date

  isActive: boolean
}

// ============================================
// MSP CRM - Billing & Invoicing
// ============================================

/**
 * Invoice Line Item
 * Individual line in an invoice
 */
export interface InvoiceLineItem {
  id: string
  type: 'product' | 'service' | 'labor' | 'subscription' | 'usage'
  name: string
  description?: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  taxable: boolean
  taxRate: number
  total: number

  // References
  quoteLineItemId?: string
  projectId?: string
  ticketId?: string
  timeEntryId?: string
  assetId?: string

  order: number
}

/**
 * Payment
 * Payment record for invoices
 */
export interface Payment {
  id: string
  amount: number
  currency: string
  method: 'credit_card' | 'bank_transfer' | 'check' | 'cash' | 'other'
  transactionId?: string // External payment processor ID
  paidAt: Date
  notes?: string
  processedBy?: string // User ID
}

/**
 * Invoice
 * Customer invoice for services/products
 */
export interface Invoice extends BaseEntity {
  invoiceNumber: string // Auto-generated: INV-2024-0001

  // Client info
  clientId: string
  clientName: string
  billingAddress: {
    name: string
    street: string
    city: string
    state: string
    postalCode: string
    country: string
  }

  // Invoice details
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
  type: 'standard' | 'recurring' | 'credit_note'

  // Line items
  lineItems: InvoiceLineItem[]

  // Pricing
  subtotal: number
  totalDiscount: number
  taxAmount: number
  total: number
  amountPaid: number
  amountDue: number
  currency: string

  // Dates
  invoiceDate: Date
  dueDate: Date

  // Payment
  paymentTerms: number // days
  payments: Payment[]

  // Late fees
  lateFeeApplied: number
  lateFeePercentage?: number

  // References
  quoteId?: string // If converted from quote
  contractId?: string // If part of contract
  projectId?: string // If project-based

  // Recurring
  isRecurring: boolean
  recurringScheduleId?: string
  billingPeriodStart?: Date
  billingPeriodEnd?: Date

  // Credit note
  creditNoteForInvoiceId?: string // If this is a credit note
  creditNotes: string[] // Invoice IDs of credit notes issued

  // Communication
  sentAt?: Date
  viewedAt?: Date
  paidAt?: Date

  // Documents
  pdfUrl?: string

  // Notes
  notes?: string // Internal notes
  memo?: string // Customer-visible memo

  // Owner
  createdByName?: string
}

/**
 * Recurring Billing Schedule
 * Schedule for automated recurring invoices
 */
export interface RecurringBillingSchedule extends BaseEntity {
  clientId: string
  contractId?: string

  name: string
  description?: string

  // Schedule
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually'
  startDate: Date
  endDate?: Date
  nextInvoiceDate: Date

  // Line items (template for invoices)
  lineItems: Omit<InvoiceLineItem, 'id' | 'total'>[]

  // Settings
  autoSend: boolean
  dayOfMonth?: number // For monthly/quarterly/annual
  dayOfWeek?: number // For weekly (0-6)

  // Status
  status: 'active' | 'paused' | 'completed' | 'cancelled'

  // History
  lastInvoiceDate?: Date
  invoicesGenerated: number
  totalRevenue: number

  // Notifications
  notifyClientDaysBefore?: number
}

// ============================================
// PRODUCT CATALOG (MSP Services & Products)
// ============================================

export type ProductCategory =
  | 'managed_service'
  | 'professional_service'
  | 'hardware'
  | 'software'
  | 'license'
  | 'support'
  | 'cloud_service'
  | 'security'
  | 'backup'
  | 'other'

export type ProductType = 'one_time' | 'recurring' | 'usage_based'

export type UnitOfMeasure =
  | 'hour'
  | 'day'
  | 'month'
  | 'year'
  | 'each'
  | 'user'
  | 'device'
  | 'license'
  | 'gb'
  | 'tb'
  | 'seat'

export type TaxCategory = 'taxable' | 'non_taxable' | 'exempt'

export interface Product extends BaseEntity {
  // Organization scoping
  orgId: string

  // Basic Information
  sku: string // Unique product code (e.g., "MSP-MON-001")
  name: string // Product/Service name
  description: string // Short description
  longDescription?: string // Detailed description

  // Categorization
  category: ProductCategory
  type: ProductType // One-time, Recurring, or Usage-based
  subcategory?: string // Custom subcategory

  // Pricing
  unitPrice: number // Selling price
  cost?: number // Cost price (for margin calculation)
  unitOfMeasure: UnitOfMeasure
  minimumQuantity?: number
  defaultQuantity?: number

  // Tax & Billing
  taxCategory: TaxCategory
  isTaxable: boolean
  recurringInterval?: 'monthly' | 'quarterly' | 'annually' // For recurring products

  // Vendor/Manufacturer Information
  vendor?: string
  manufacturer?: string
  partNumber?: string

  // Status & Availability
  isActive: boolean
  isArchived: boolean
  inStock?: boolean
  stockQuantity?: number

  // Additional Details
  imageUrl?: string
  internalNotes?: string
  tags?: string[]

  // Usage tracking
  timesUsed?: number // How many times this product has been added to quotes
  lastUsedAt?: Date
}

export interface ProductMetrics {
  totalProducts: number
  activeProducts: number
  inactiveProducts: number
  byCategory: Record<ProductCategory, number>
  byType: Record<ProductType, number>
  topUsedProducts: Array<{
    product: Product
    usageCount: number
  }>
}

// ============================================
// MYOB AccountRight Integration
// ============================================

export type MYOBEntityType = 'Invoice' | 'Quote' | 'Customer' | 'Item' | 'Payment' | 'TaxCode' | 'CompanyFile'
export type MYOBSyncDirection = 'deskwise_to_myob' | 'myob_to_deskwise' | 'bidirectional'
export type MYOBSyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'cancelled'
export type MYOBConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error'

/**
 * MYOB Company File
 * Represents an MYOB AccountRight company file
 */
export interface MYOBCompanyFile {
  id: string // Company File GUID
  name: string // Company name
  libraryPath?: string // Path to company file
  serialNumber?: string
  productVersion?: string
  productLevel?: {
    code: string
    name: string
  }
  checkoutStatus?: string
  uri?: string // API URI for this company file
}

/**
 * MYOB Integration Configuration
 * Stores connection details and settings for MYOB AccountRight integration
 */
export interface MYOBIntegration extends BaseEntity {
  // Connection Status
  status: MYOBConnectionStatus

  // Company File Selection
  companyFileId: string // Selected MYOB Company File GUID
  companyFileName: string
  companyFileUri?: string // Base URI for API calls

  // OAuth Tokens (encrypted)
  accessToken: string // Encrypted access token
  refreshToken: string // Encrypted refresh token
  tokenType: string // Usually 'Bearer'

  // Token Expiry
  accessTokenExpiresAt: Date // Expires after 20 minutes
  refreshTokenExpiresAt: Date // Expires after 1 week

  // API Credentials
  apiKey: string // MYOB API Key (client_id)
  apiSecret: string // Encrypted MYOB API Secret (client_secret)

  // Connection Metadata
  authorizationCode?: string // Temporary auth code
  environment: 'live' | 'sandbox'

  // Sync Settings
  syncSettings: {
    autoSync: boolean
    syncInterval: number // minutes
    syncDirection: MYOBSyncDirection
    enabledEntities: MYOBEntityType[]
  }

  // Field Mappings
  fieldMappings: Record<string, MYOBFieldMapping>

  // Last Sync
  lastSyncAt?: Date
  lastSyncStatus?: MYOBSyncStatus
  lastSyncError?: string

  // Connection Test
  lastTestedAt?: Date
  lastTestResult?: {
    success: boolean
    message: string
    timestamp: Date
    companyFiles?: MYOBCompanyFile[]
  }

  // Webhooks (if supported by MYOB)
  webhookUrl?: string
  webhookSecret?: string
}

/**
 * MYOB Field Mapping
 * Maps Deskwise fields to MYOB fields
 */
export interface MYOBFieldMapping {
  deskwiseField: string
  myobField: string
  direction: MYOBSyncDirection
  transform?: string // JavaScript expression for transformation
  required: boolean
}

/**
 * MYOB Sync Log
 * Audit trail for synchronization operations
 */
export interface MYOBSyncLog extends BaseEntity {
  integrationId: string // Reference to MYOBIntegration._id

  // Sync Details
  entityType: MYOBEntityType
  direction: MYOBSyncDirection
  status: MYOBSyncStatus

  // Sync Statistics
  totalRecords: number
  successCount: number
  failureCount: number
  skippedCount: number

  // Timing
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds

  // Results
  syncedRecords: Array<{
    deskwiseId: string
    myobId: string
    myobUid?: string // MYOB UID format
    entityType: MYOBEntityType
    action: 'create' | 'update' | 'skip'
    status: 'success' | 'failed'
    error?: string
  }>

  // Error Details
  errors: Array<{
    recordId: string
    error: string
    details?: Record<string, any>
  }>

  // Triggered By
  triggeredBy: 'manual' | 'scheduled' | 'webhook' | 'auto'
  triggeredByUser?: string
}

/**
 * MYOB Entity Mapping
 * Stores mapping between Deskwise and MYOB entities
 */
export interface MYOBMapping {
  _id: ObjectId
  orgId: string
  integrationId: string

  // Deskwise Entity
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment'
  deskwiseEntityId: string

  // MYOB Entity
  myobEntityType: MYOBEntityType
  myobEntityId: string // MYOB GUID
  myobUid?: string // MYOB UID (if applicable)
  myobRowVersion?: string // For update tracking

  // Sync Metadata
  lastSyncedAt: Date
  syncDirection: MYOBSyncDirection
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error'

  // Conflict Resolution
  conflictDetails?: {
    deskwiseLastModified: Date
    myobLastModified: Date
    conflictFields: string[]
    resolution?: 'use_deskwise' | 'use_myob' | 'manual'
  }

  createdAt: Date
  updatedAt: Date
}

/**
 * MYOB Tax Code
 * Represents a tax code in MYOB
 */
export interface MYOBTaxCode {
  uid: string
  code: string
  description?: string
  rate: number // Tax rate percentage
  type: 'GST' | 'VAT' | 'Sales' | 'Other'
  isActive: boolean
}

/**
 * MYOB Customer (for sync)
 * Simplified customer structure for MYOB sync
 */
export interface MYOBCustomer {
  uid?: string
  displayId?: string
  companyName: string
  isIndividual: boolean
  firstName?: string
  lastName?: string
  isActive: boolean
  addresses?: Array<{
    location: number
    street: string
    city: string
    state: string
    postcode: string
    country: string
    phone1?: string
    phone2?: string
    email?: string
    website?: string
  }>
  notes?: string
  currentBalance?: number
  rowVersion?: string
}

/**
 * MYOB Item (for sync)
 * Simplified item structure for MYOB sync
 */
export interface MYOBItem {
  uid?: string
  number?: string
  name: string
  description?: string
  isActive: boolean
  isSold: boolean
  isBought: boolean
  isInventoried: boolean
  baseSellingPrice?: number
  sellingDetails?: {
    unitPrice: number
    taxCode?: {
      uid: string
    }
    account?: {
      uid: string
    }
  }
  buyingDetails?: {
    unitPrice: number
    taxCode?: {
      uid: string
    }
    account?: {
      uid: string
    }
  }
  currentValue?: number
  rowVersion?: string
}

/**
 * MYOB Invoice Line (for sync)
 */
export interface MYOBInvoiceLine {
  rowId?: number
  type: 'Transaction'
  description?: string
  account?: {
    uid: string
  }
  job?: {
    uid: string
  }
  taxCode?: {
    uid: string
  }
  total: number
  quantity?: number
  unitPrice?: number
  item?: {
    uid: string
    number?: string
    name?: string
  }
}

/**
 * MYOB Invoice (for sync)
 * Simplified invoice structure for MYOB sync
 */
export interface MYOBInvoice {
  uid?: string
  number?: string
  date: string // ISO date format
  customerPurchaseOrderNumber?: string
  customer: {
    uid: string
    displayId?: string
    name?: string
  }
  lines: MYOBInvoiceLine[]
  subtotal?: number
  freightAmount?: number
  freightTaxCode?: {
    uid: string
  }
  totalTax?: number
  totalAmount?: number
  category?: {
    uid: string
  }
  comment?: string
  shippingMethod?: string
  promisedDate?: string
  balanceDueAmount?: number
  status?: 'Open' | 'Closed'
  isTaxInclusive?: boolean
  rowVersion?: string
}

/**
 * MYOB Quote (for sync)
 * Similar structure to Invoice but for quotes
 */
export interface MYOBQuote {
  uid?: string
  number?: string
  date: string
  customer: {
    uid: string
    displayId?: string
    name?: string
  }
  lines: MYOBInvoiceLine[]
  subtotal?: number
  totalTax?: number
  totalAmount?: number
  expirationDate?: string
  status?: 'Open' | 'Accepted' | 'Declined' | 'Expired'
  comment?: string
  isTaxInclusive?: boolean
  rowVersion?: string
}

/**
 * MYOB Payment (for sync)
 */
export interface MYOBPayment {
  uid?: string
  paymentNumber?: string
  date: string
  customer?: {
    uid: string
  }
  account?: {
    uid: string
  }
  depositTo?: string
  amount: number
  memo?: string
  invoices?: Array<{
    uid: string
    number?: string
    amountApplied: number
  }>
  rowVersion?: string
}

// ============================================
// QuickBooks Integration
// ============================================

export type QuickBooksEntityType = 'Invoice' | 'Estimate' | 'Customer' | 'Item' | 'Payment' | 'TaxRate'
export type QuickBooksSyncDirection = 'deskwise_to_qbo' | 'qbo_to_deskwise' | 'bidirectional'
export type QuickBooksSyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'cancelled'
export type QuickBooksConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error'

/**
 * QuickBooks Integration Configuration
 * Stores connection details and settings for QuickBooks Online integration
 */
export interface QuickBooksIntegration extends BaseEntity {
  // Connection Status
  status: QuickBooksConnectionStatus
  realmId: string // QuickBooks Company ID

  // OAuth Tokens (encrypted)
  accessToken: string // Encrypted access token
  refreshToken: string // Encrypted refresh token
  tokenType: string // Usually 'Bearer'

  // Token Expiry
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date

  // Connection Metadata
  companyName?: string
  country?: string
  baseUrl?: string // Sandbox or Production URL
  environment: 'sandbox' | 'production'

  // Sync Settings
  autoSync: boolean
  syncDirection: QuickBooksSyncDirection
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual'

  // Entity Mapping Preferences
  defaultIncomeAccount?: string // QBO Account ID for revenue
  defaultExpenseAccount?: string // QBO Account ID for expenses
  defaultCustomerType?: string // QBO Customer Type
  defaultPaymentTerms?: string // QBO Payment Terms ID

  // Field Mapping Configuration
  fieldMappings: {
    invoice?: Record<string, string> // Deskwise field -> QBO field
    customer?: Record<string, string>
    product?: Record<string, string>
  }

  // Last Sync Information
  lastSyncAt?: Date
  lastSyncStatus?: 'success' | 'partial' | 'failed'
  lastSyncError?: string

  // Statistics
  totalInvoicesSynced: number
  totalCustomersSynced: number
  totalProductsSynced: number
  totalPaymentsSynced: number

  // Connection Health
  lastHealthCheckAt?: Date
  lastHealthCheckStatus?: 'healthy' | 'degraded' | 'unhealthy'

  // Disconnect Information
  disconnectedAt?: Date
  disconnectedBy?: string
  disconnectReason?: string
}

/**
 * QuickBooks Sync Log
 * Audit trail for all sync operations
 */
export interface QuickBooksSyncLog extends BaseEntity {
  integrationId: string // Reference to QuickBooksIntegration

  // Sync Operation Details
  syncType: 'manual' | 'auto' | 'scheduled' | 'webhook'
  entityType: QuickBooksEntityType
  direction: QuickBooksSyncDirection
  status: QuickBooksSyncStatus

  // Entity References
  deskwiseEntityId?: string // Invoice ID, Quote ID, Client ID, etc.
  deskwiseEntityType?: string // 'invoice', 'quote', 'client', 'product'
  quickbooksEntityId?: string // QBO Invoice ID, Customer ID, etc.
  quickbooksEntityType?: QuickBooksEntityType

  // Sync Metrics
  startedAt: Date
  completedAt?: Date
  duration?: number // milliseconds
  retryCount: number
  maxRetries: number

  // Data Snapshot (for debugging)
  requestPayload?: Record<string, any> // Data sent to QBO
  responseData?: Record<string, any> // Data received from QBO

  // Error Handling
  errorCode?: string
  errorMessage?: string
  errorDetails?: Record<string, any>

  // Conflict Resolution
  conflictDetected: boolean
  conflictResolution?: 'deskwise_wins' | 'qbo_wins' | 'manual' | 'skip'
  conflictNotes?: string

  // Initiated By
  triggeredBy: string // User ID who initiated sync
  triggeredByName?: string
}

/**
 * QuickBooks Field Mapping
 * Maps Deskwise fields to QuickBooks fields for each entity type
 */
export interface QuickBooksMapping extends BaseEntity {
  integrationId: string
  entityType: 'invoice' | 'estimate' | 'customer' | 'product' | 'payment'

  // Field Mappings
  mappings: Array<{
    deskwiseField: string // e.g., 'clientName'
    quickbooksField: string // e.g., 'DisplayName'
    transformFunction?: string // Optional transformation logic
    isRequired: boolean
    defaultValue?: any
  }>

  // Custom Mapping Logic
  customMappingScript?: string // JavaScript code for complex mappings

  // Validation Rules
  validationRules?: Array<{
    field: string
    rule: string
    message: string
  }>

  // Mapping Metadata
  isActive: boolean
  lastUsedAt?: Date
  usageCount: number
}

/**
 * QuickBooks Entity Reference
 * Tracks relationship between Deskwise entities and QuickBooks entities
 */
export interface QuickBooksEntityReference {
  _id: ObjectId
  orgId: string
  integrationId: string

  // Deskwise Entity
  deskwiseEntityId: string
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment'

  // QuickBooks Entity
  quickbooksEntityId: string
  quickbooksEntityType: QuickBooksEntityType
  quickbooksSyncToken?: string // Required for updates (sparse update pattern)

  // Sync Metadata
  lastSyncedAt: Date
  syncDirection: QuickBooksSyncDirection
  isSyncEnabled: boolean

  // Version Control
  deskwiseVersion: number
  quickbooksVersion: number

  createdAt: Date
  updatedAt: Date
}

/**
 * QuickBooks Webhook Event
 * Stores incoming webhook events from QuickBooks
 */
export interface QuickBooksWebhookEvent extends BaseEntity {
  integrationId: string

  // Event Details
  eventType: string // e.g., 'Invoice.Create', 'Customer.Update'
  realmId: string
  eventId: string // QBO event ID

  // Entity Information
  entityName: QuickBooksEntityType
  entityId: string // QBO entity ID
  lastUpdated: Date

  // Payload
  rawPayload: Record<string, any>

  // Processing Status
  processed: boolean
  processedAt?: Date
  processingError?: string

  // Webhook Metadata
  receivedAt: Date
  signature?: string // Webhook signature for verification
  verificationStatus?: 'verified' | 'failed' | 'skipped'
}

// ============================================
// Xero Integration
// ============================================

export type XeroEntityType = 'Invoice' | 'Quote' | 'Contact' | 'Item' | 'Payment' | 'TaxRate' | 'Account'
export type XeroSyncDirection = 'deskwise_to_xero' | 'xero_to_deskwise' | 'bidirectional'
export type XeroSyncStatus = 'pending' | 'syncing' | 'completed' | 'failed' | 'cancelled'
export type XeroConnectionStatus = 'connected' | 'disconnected' | 'expired' | 'error'

/**
 * Xero Integration Configuration
 * Stores connection details and settings for Xero integration
 */
export interface XeroIntegration extends BaseEntity {
  // Connection Status
  status: XeroConnectionStatus
  tenantId: string // Xero Organization/Tenant ID
  tenantName?: string // Xero Organization Name

  // OAuth Tokens (encrypted)
  accessToken: string // Encrypted access token
  refreshToken: string // Encrypted refresh token
  idToken?: string // Encrypted ID token (OpenID Connect)
  tokenType: string // Usually 'Bearer'

  // Token Expiry
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date

  // Connection Metadata
  organizationName?: string
  countryCode?: string
  baseCurrency?: string
  organizationType?: string // e.g., 'COMPANY', 'PARTNERSHIP'
  isDemoCompany?: boolean
  apiUrl?: string // API base URL

  // Sync Settings
  autoSync: boolean
  syncDirection: XeroSyncDirection
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual'

  // Entity Mapping Preferences
  defaultRevenueAccount?: string // Xero Account Code for revenue
  defaultExpenseAccount?: string // Xero Account Code for expenses
  defaultBankAccount?: string // Xero Account Code for payments
  defaultPaymentTerms?: string // Payment terms (e.g., 'NET30')
  defaultTaxType?: string // Default tax type code

  // Field Mapping Configuration
  fieldMappings: {
    invoice?: Record<string, string> // Deskwise field -> Xero field
    contact?: Record<string, string>
    item?: Record<string, string>
  }

  // Last Sync Information
  lastSyncAt?: Date
  lastSyncStatus?: XeroSyncStatus
  lastSyncError?: string
  lastHealthCheck?: Date

  // Feature Flags
  syncInvoices: boolean
  syncQuotes: boolean
  syncContacts: boolean
  syncProducts: boolean
  syncPayments: boolean

  // Webhook Configuration
  webhookKey?: string // Xero webhook key (encrypted)
  webhookUrl?: string

  // Error Tracking
  consecutiveFailures: number
  lastErrorAt?: Date

  // Metadata
  connectedBy: string // User ID who connected
  disconnectedAt?: Date
  disconnectedBy?: string
}

/**
 * Xero Sync Log
 * Tracks all sync operations for auditing
 */
export interface XeroSyncLog extends BaseEntity {
  integrationId: string

  // Sync Details
  syncType: 'full' | 'incremental' | 'manual'
  entityType: XeroEntityType
  syncDirection: XeroSyncDirection
  status: XeroSyncStatus

  // Metrics
  recordsProcessed: number
  recordsSucceeded: number
  recordsFailed: number
  duration: number // milliseconds

  // Errors
  errors: Array<{
    entityId: string
    entityName: string
    errorCode?: string
    errorMessage: string
    timestamp: Date
  }>

  // Timestamps
  startedAt: Date
  completedAt?: Date

  // Triggered By
  triggeredBy: string // User ID or 'system'
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'auto'
}

/**
 * Xero Field Mapping
 * Stores custom field mappings between Deskwise and Xero
 */
export interface XeroMapping extends BaseEntity {
  integrationId: string

  // Mapping Type
  entityType: XeroEntityType
  mappingName: string
  description?: string

  // Field Mappings
  mappings: Array<{
    deskwiseField: string
    xeroField: string
    direction: 'to_xero' | 'from_xero' | 'bidirectional'
    transform?: string // Optional transformation function name
    isRequired: boolean
    defaultValue?: any
  }>

  // Mapping Metadata
  isActive: boolean
  lastUsedAt?: Date
  usageCount: number
}

/**
 * Xero Entity Reference
 * Tracks relationship between Deskwise entities and Xero entities
 */
export interface XeroEntityReference {
  _id: ObjectId
  orgId: string
  integrationId: string

  // Deskwise Entity
  deskwiseEntityId: string
  deskwiseEntityType: 'invoice' | 'quote' | 'client' | 'product' | 'payment'

  // Xero Entity
  xeroEntityId: string
  xeroEntityType: XeroEntityType
  xeroStatus?: string // Xero entity status (e.g., 'DRAFT', 'AUTHORISED')

  // Sync Metadata
  lastSyncedAt: Date
  syncDirection: XeroSyncDirection
  isSyncEnabled: boolean

  // Version Control
  deskwiseVersion: number
  xeroVersion: number

  createdAt: Date
  updatedAt: Date
}

/**
 * Xero Webhook Event
 * Stores incoming webhook events from Xero
 */
export interface XeroWebhookEvent extends BaseEntity {
  integrationId: string

  // Event Details
  eventType: string // e.g., 'CREATE', 'UPDATE'
  eventCategory: string // e.g., 'INVOICE', 'CONTACT'
  resourceId: string // Xero resource ID
  tenantId: string

  // Entity Information
  entityType: XeroEntityType
  entityId: string // Xero entity ID

  // Payload
  rawPayload: Record<string, any>

  // Processing Status
  processed: boolean
  processedAt?: Date
  processingError?: string

  // Webhook Metadata
  receivedAt: Date
  signature?: string // Webhook signature for verification
  verificationStatus?: 'verified' | 'failed' | 'skipped'
}
