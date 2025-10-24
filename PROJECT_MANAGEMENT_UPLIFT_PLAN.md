# Deskwise ITSM - Project Management Module Uplift Plan

**Version:** 1.0
**Date:** October 24, 2025
**Status:** Design & Planning Phase
**Author:** System Architecture Team

---

## Executive Summary

This document presents a comprehensive plan to evolve Deskwise's Projects module from its current Phase 1 implementation into a **feature-rich, ITIL-aligned Project Portfolio Management (PPM) capability** suitable for both internal IT teams and MSP-mode organizations. The uplift will transform basic project tracking into an enterprise-grade PPM platform with full lifecycle management, seamless integration with existing ITSM modules, and MSP-specific features including client portfolios, contract awareness, and multi-tenant operations.

### Current State Assessment

**Strengths:**
- Solid foundational CRUD operations for projects and tasks
- Sophisticated analytics backend with comprehensive metrics
- Multi-tenant architecture with proper data isolation
- Auto-calculated progress tracking and budget monitoring
- Status workflow and team member assignment

**Critical Gaps:**
- ❌ No RBAC enforcement on API endpoints (security risk)
- ❌ Milestone implementation incomplete (collection exists, no UI/CRUD)
- ❌ No project-ticket integration (major workflow gap)
- ❌ Time tracking only supports tickets, not projects (billing blocker)
- ❌ Limited UI features (no edit, delete, task management interface)
- ❌ No resource management, capacity planning, or workload balancing
- ❌ No financial features (invoice generation, profitability analysis)
- ❌ No collaboration tools (comments, files, activity feeds)
- ❌ No project templates or portfolio management
- ❌ No ITIL/PRINCE2 lifecycle gates or governance artifacts

### Target State Vision

A **world-class PPM platform** that delivers:

1. **ITIL 4 & PMBOK Alignment**: Full project lifecycle with gates, artifacts, and governance
2. **MSP Excellence**: Per-client portfolios, contract awareness, cross-client resource planning
3. **Seamless Integration**: Bidirectional links with Tickets, Changes, Assets, Time, Billing
4. **Advanced Planning**: Gantt charts, dependencies, critical path, resource leveling
5. **Financial Control**: Budgets, forecasts, EVM (Earned Value Management), profitability
6. **Governance & Risk**: RAID registers, stage gates, approvals, audit trails
7. **Modern UX**: Multiple views (Gantt/Kanban/List), drag-drop, inline edits, real-time updates
8. **AI-Assisted**: Auto-scheduling, risk prediction, scope impact analysis
9. **Comprehensive Reporting**: Dashboards for PMs, execs, MSP roll-ups, benefits realization

---

## Table of Contents

1. [Research Findings & Industry Best Practices](#1-research-findings--industry-best-practices)
2. [Target Architecture](#2-target-architecture)
3. [Data Model Design](#3-data-model-design)
4. [Workflow Design & Lifecycle Gates](#4-workflow-design--lifecycle-gates)
5. [Integration Specifications](#5-integration-specifications)
6. [API Specifications](#6-api-specifications)
7. [UI/UX Design](#7-uiux-design)
8. [Security & RBAC](#8-security--rbac)
9. [MSP-Specific Features](#9-msp-specific-features)
10. [AI & Automation](#10-ai--automation)
11. [Reporting & Analytics](#11-reporting--analytics)
12. [Migration Plan](#12-migration-plan)
13. [Testing Strategy](#13-testing-strategy)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Success Metrics & KPIs](#15-success-metrics--kpis)
16. [Risk Register & Mitigations](#16-risk-register--mitigations)

---

## 1. Research Findings & Industry Best Practices

### 1.1 ITIL 4 Portfolio & Project Management

**Source:** [ITIL 4 Practice Guide - Portfolio Management](https://www.axelos.com/resource-hub/practice/portfolio-management-itil-4-practice-guide)

**Key Principles:**
- **Strategic Alignment**: Portfolio management ensures the organization has the right mix of programs, projects, products, and services to fulfill strategic goals within funding and resource constraints
- **Prioritization**: Prioritize based on contribution to business objectives, value, and strategic alignment
- **Risk-Return Balance**: Assess and manage risks while maximizing value returns
- **Continual Evaluation**: Regular reviews and adjustments to adapt to changing customer needs and market conditions
- **Portfolio Optimization**: Generate highest value return by selecting the most appropriate investments

**Integration Points:**
- Intricately linked with Service Financial Management
- Plays a crucial role across the service value chain from strategy to execution
- Provides structured fiscal oversight across product/service lifecycles

**Practice Success Factors:**
1. Establishing and maintaining an effective approach to program and project management across the organization
2. Ensuring the successful realization of programs and projects

**Adopted Patterns:**
- ✅ Strategic alignment scoring for project prioritization
- ✅ Value-based portfolio balancing
- ✅ Continuous portfolio health monitoring
- ✅ Financial integration for resource allocation
- ✅ Risk-adjusted portfolio optimization

### 1.2 PRINCE2 Project Lifecycle & Gates

**Source:** [PRINCE2 Project Stages](https://www.prince2-online.co.uk/prince2-project-stages)

**7 PRINCE2 Processes:**
1. Starting up a Project (Pre-project initiation)
2. Initiating a Project (Detailed planning)
3. Directing a Project (Board oversight)
4. Controlling a Stage (Day-to-day management)
5. Managing Product Delivery (Work packages)
6. Managing Stage Boundaries (Gate reviews)
7. Closing a Project (Handover & lessons learned)

**Stage Gate Model:**
- Minimum of 2 management stages: Initiation + Delivery
- Each stage end serves as decision gate where project board:
  - **Looks Back**: Verify current stage completion
  - **Reviews Big Picture**: Validate business case viability, schedule, risks
  - **Looks Forward**: Approve Stage Plan for next phase

**Key Artifacts:**
- **Project Initiation Document (PID)**: Charter, objectives, scope, approach
- **Stage Plans**: Detailed plans for each management stage
- **Risk Register**: Risks, impacts, mitigations (RAID)
- **Quality Management Plan**: Quality criteria and review processes
- **Change Control Approach**: Scope change management

**Adopted Patterns:**
- ✅ Stage-based project structure with mandatory gates
- ✅ PID as comprehensive project charter
- ✅ RAID (Risks, Assumptions, Issues, Decisions) register
- ✅ Change control process for scope management
- ✅ Benefits realization tracking post-closure

### 1.3 ServiceNow & Jira PPM Features

**Sources:**
- [ServiceNow Strategic Portfolio Management](https://www.cloudnuro.ai/blog/top-10-project-portfolio-management-ppm-solutions-for-it-projects-2025)
- [Jira vs ServiceNow Comparison](https://www.peerspot.com/products/comparisons/jira_vs_servicenow-strategic-portfolio-management)

**ServiceNow PPM:**
- **Portfolio Management**: Define and manage project portfolios aligned with business goals
- **Resource Management**: Allocate and track resources across projects, balance workloads
- **Financial Planning**: Manage budgets, expenses, and track spending
- **Built-in Gantt Charts**: No plugins needed for timeline visualization
- **Extensive Integration**: Native ITSM integration (Incidents, Changes, Assets, CMDB)
- **Real-time Analytics**: Dashboards with project health, resource utilization, financials
- **Stability & Scalability**: Enterprise-grade performance

**Jira (with plugins):**
- **Agile Focus**: Excellent for Scrum/Kanban workflows
- **Advanced Roadmaps**: Portfolio planning with dependencies (plugin)
- **BigPicture Plugin**: Gantt charts and program management
- **Simple Licensing**: Transparent pricing with complete ITSM functionality
- **97% User Recommendation**: Very high user satisfaction

**Best Practices from Both:**
- ✅ Multi-view support (Gantt, Board, List, Calendar)
- ✅ Drag-and-drop timeline editing
- ✅ Real-time collaboration and commenting
- ✅ Native ITSM integration for seamless workflows
- ✅ Capacity planning with visual workload balancing
- ✅ Financial tracking integrated with project execution

### 1.4 MSP Software Project Management Features

**Source:** [Best MSP Software 2025](https://guardz.com/blog/10-best-msp-software-you-must-have-in-2025/)

**Multi-Tenant Management:**
- Single platform to manage multiple client environments
- Centralized view of top-level data with per-client drill-down
- Client isolation with shared resource pools

**Client Portal Features:**
- White-labeled portals with client-specific branding
- Real-time visibility into project health scores, budgets, roadmaps
- Self-service access for co-managed environments
- Ticketing and service catalog integration

**Project Management Integration:**
- PSA (Professional Services Automation) with project, time, expense tracking
- Automated billing and invoicing from project time entries
- Resource management across multiple client projects
- KPI reporting with client-specific dashboards

**Key MSP Platforms:**
- **ConnectWise PSA**: Centralized project management with structure from kickoff to billing
- **Teamwork.com**: Resource management, multi-project workflows, AI automations
- **Syncro**: Integrated RMM, PSA, and billing in one platform

**Adopted MSP Patterns:**
- ✅ Per-client project portfolios with aggregated MSP views
- ✅ Contract/agreement awareness for project entitlements
- ✅ Cross-client resource allocation and capacity planning
- ✅ Automated billing from project time with client rate cards
- ✅ White-label client dashboards with project status
- ✅ Role-segregated visibility (MSP staff vs. client users)

### 1.5 Modern SaaS UX Patterns

**Source:** [Modern SaaS Project Management UX 2025](https://asana.com/features/project-management/project-views)

**Multi-View Architecture:**
- **Gantt/Timeline**: Visualize dependencies, critical path, milestones
- **Kanban Board**: Drag-drop task workflow (To Do → In Progress → Done)
- **List View**: Spreadsheet-like view with inline editing, sorting, filtering
- **Calendar View**: Schedule-based visualization with drag-drop rescheduling
- **Workload View**: Resource capacity heatmaps with utilization percentages

**UX Best Practices:**
- **View Switching**: Toggle between views in one click without data re-entry
- **Drag-and-Drop**: Universal interaction pattern for scheduling, prioritization
- **Inline Editing**: Double-click to edit, auto-save on blur
- **Real-time Updates**: WebSocket for multi-user collaboration
- **Contextual Side Panels**: Task details in slide-out panel, keep context
- **Keyboard Shortcuts**: Power-user features (Cmd+K search, arrow navigation)
- **Smart Defaults**: Auto-populate fields based on context and history

**Performance Targets:**
- **View Switching**: < 200ms
- **Drag-and-Drop**: < 50ms response time
- **Search**: < 100ms for 10,000+ projects
- **Gantt Rendering**: < 500ms for 200+ tasks

**Adopted UX Patterns:**
- ✅ Multiple view modes with instant switching
- ✅ Drag-and-drop everywhere (tasks, timeline bars, resources)
- ✅ Sticky headers with action bars
- ✅ Collapsible side panels for task details
- ✅ Global search with fuzzy matching
- ✅ Mobile-responsive layouts
- ✅ Accessibility (WCAG 2.1 AA compliance)

### 1.6 Resource Capacity Planning Best Practices

**Source:** [Resource Capacity Planning 2025](https://birdviewpsa.com/blog/adefinitive-guide-to-resource-capacity-planning/)

**Key Statistics:**
- **37% of projects fail** due to inaccurate resource forecasting (PMI)
- **83% of executives** identify resource allocation as most critical growth lever
- **77% of professionals** have experienced burnout, with 30% citing unrealistic deadlines
- **88% of spreadsheets** have 1%+ errors in formulas

**Best Practices:**
- **Build in Buffer Time**: Book employees at 80% billable capacity for flexibility
- **Continuous Monitoring**: Track actual usage vs. plan, not one-time planning
- **Stakeholder Communication**: Regular sync with PMs, resources, and operations teams
- **Technology Over Spreadsheets**: Avoid error-prone manual calculations
- **Skill-Based Allocation**: Match skills and interests with project needs
- **Workload Leveling**: Prevent over-allocation and burnout

**Capacity Planning Formula:**
```
Available Capacity = (Total Hours - PTO - Meetings - Administrative) × 0.8 (buffer)
Project Capacity = Available Capacity - BAU Work
```

**Adopted Patterns:**
- ✅ 80% utilization target with 20% buffer for unplanned work
- ✅ Real-time capacity dashboards with allocation percentages
- ✅ Skill-based resource matching
- ✅ Automatic over-allocation warnings
- ✅ What-if scenario planning for resource changes
- ✅ Integration with scheduling for time-off awareness

---

## 2. Target Architecture

### 2.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Web App (React/Next.js 15)  │  Mobile Web  │  Client Portal (MSP)  │
│  - Gantt View                │  - Timeline  │  - Project Status     │
│  - Kanban Board              │  - Tasks     │  - Billing View       │
│  - Resource Planner          │  - Approve   │  - Milestones         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  Next.js API Routes (with RBAC Middleware)                          │
│  - Authentication (NextAuth.js)                                      │
│  - Authorization (Permission Checks)                                 │
│  - Rate Limiting                                                     │
│  - Request Validation (Zod Schemas)                                  │
│  - Audit Logging                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Service Classes (TypeScript)                                        │
├──────────────────────┬──────────────────────┬──────────────────────┤
│  Portfolio Service   │  Project Service     │  Resource Service    │
│  - Portfolio CRUD    │  - Project CRUD      │  - Allocation        │
│  - Prioritization    │  - Progress Calc     │  - Capacity Plan     │
│  - Balancing         │  - Health Score      │  - Skill Matching    │
├──────────────────────┼──────────────────────┼──────────────────────┤
│  Task Service        │  Milestone Service   │  Financial Service   │
│  - Task CRUD         │  - Milestone CRUD    │  - Budget Tracking   │
│  - Dependencies      │  - Gate Review       │  - EVM Calculation   │
│  - Critical Path     │  - Deliverables      │  - Invoice Gen       │
├──────────────────────┼──────────────────────┼──────────────────────┤
│  RAID Service        │  Document Service    │  Integration Service │
│  - Risk Register     │  - File Mgmt         │  - Ticket Link       │
│  - Issue Tracking    │  - Version Control   │  - Change Link       │
│  - Decision Log      │  - Templates         │  - Time Tracking     │
└──────────────────────┴──────────────────────┴──────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Event Bus (Internal)                                                │
│  - project.created → Workflow Trigger                                │
│  - milestone.reached → Notification                                  │
│  - budget.threshold → Alert                                          │
│  - resource.overallocated → Warning                                  │
├─────────────────────────────────────────────────────────────────────┤
│  Webhook System (External)                                           │
│  - API endpoints for external systems                                │
│  - Signature verification                                            │
│  - Retry logic with exponential backoff                              │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────┤
│  MongoDB Collections                                                 │
│  - portfolios (new)                                                  │
│  - projects (enhanced)                                               │
│  - project_tasks (enhanced)                                          │
│  - project_milestones (complete implementation)                      │
│  - project_resources (new)                                           │
│  - project_risks (new - RAID)                                        │
│  - project_issues (new - RAID)                                       │
│  - project_decisions (new - RAID)                                    │
│  - project_documents (new)                                           │
│  - project_time_entries (new)                                        │
│  - project_financials (new)                                          │
│  - project_dependencies (new)                                        │
│  - project_stage_gates (new)                                         │
│  - project_templates (new)                                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ANALYTICS LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Analytics Services (enhanced existing)                              │
│  - Portfolio Analytics                                               │
│  - Project Health Scoring                                            │
│  - Resource Utilization                                              │
│  - Financial Performance (EVM, ROI, Profitability)                   │
│  - Benefits Realization Tracking                                     │
│  - MSP Client Roll-ups                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Architecture Principles

1. **Service-Oriented Architecture (SOA)**
   - Each major domain (Portfolio, Project, Resource, Financial) has dedicated service class
   - Services encapsulate business logic, validation, and calculations
   - API routes remain thin, delegating to services

2. **Event-Driven Integration**
   - Internal event bus for loose coupling between modules
   - Webhooks for external system integration
   - Asynchronous processing for heavy operations (Gantt recalculation, EVM)

3. **Multi-Tenant by Design**
   - All data scoped to `orgId`
   - MSP mode: Additional `clientId` scoping for per-client views
   - Row-level security in all queries

4. **Scalability & Performance**
   - Database indexes on common query patterns
   - Caching layer for computed fields (progress, health score)
   - Lazy loading for large datasets (paginated APIs)
   - Background jobs for analytics aggregation

5. **Security First**
   - RBAC enforcement at API gateway layer
   - Permission checks before all mutations
   - Audit logging for all project changes
   - Encryption at rest for sensitive documents

### 2.3 Technology Stack Enhancements

**No new external dependencies required** - leverage existing stack:

- **Frontend**: Next.js 15, React 18, TypeScript (existing)
- **UI Components**: Radix UI, Tailwind CSS (existing)
- **Gantt Chart**: Build custom component using `react-gantt-chart` or D3.js
- **Kanban Board**: Build using `@hello-pangea/dnd` (React DnD successor)
- **Data Visualization**: Recharts (already used in analytics)
- **Backend**: Next.js API Routes, MongoDB (existing)
- **Real-time**: WebSocket via Next.js or Pusher (optional for collaboration)
- **AI**: Google Gemini 2.0 Flash (existing integration)
- **File Storage**: S3-compatible storage (existing implementation)

---

## 3. Data Model Design

### 3.1 Enhanced Core Entities

#### 3.1.1 Portfolio

```typescript
export interface Portfolio extends BaseEntity {
  _id: ObjectId
  orgId: string

  // Basic Info
  name: string                      // e.g., "2025 Digital Transformation"
  code: string                      // Short code: "DT2025"
  description: string
  type: 'strategic' | 'operational' | 'client' | 'internal'

  // MSP Specifics
  clientId?: string                 // MSP mode: Client portfolio

  // Strategy Alignment
  strategicObjectives: string[]     // Link to org strategic goals
  kpis: Array<{
    name: string
    target: number
    actual: number
    unit: string                    // e.g., "%", "$", "hours"
  }>

  // Portfolio Management
  status: 'active' | 'planning' | 'archived'
  manager: string                   // User ID
  stakeholders: string[]            // User IDs

  // Financial
  totalBudget: number
  allocatedBudget: number           // Sum of project budgets
  spentBudget: number               // Sum of project actuals

  // Health & Metrics
  projectCount: number              // Calculated
  healthScore: number               // 0-100, calculated
  riskScore: number                 // 0-100, calculated

  // Settings
  allowedProjectManagers: string[]  // Restrict who can create projects
  requiresApproval: boolean         // Gate review required
  approvalWorkflow?: string         // Workflow ID

  // Timestamps
  createdAt: Date
  createdBy: string
  updatedAt: Date

  // Soft delete
  isActive: boolean
}
```

#### 3.1.2 Enhanced Project

```typescript
export interface Project extends BaseEntity {
  _id: ObjectId
  orgId: string

  // Identification
  projectNumber: string             // PRJ-0001 (existing)
  name: string
  code?: string                     // Short code: "WEB-REDESIGN"
  description: string

  // Hierarchy
  portfolioId?: string              // Parent portfolio
  parentProjectId?: string          // Program/sub-project structure

  // Classification
  type: 'internal' | 'client' | 'product' | 'service'
  category: string                  // IT Infrastructure, Software Dev, etc.
  priority: 'low' | 'medium' | 'high' | 'critical'

  // MSP Specifics
  clientId?: string                 // Client reference
  contractId?: string               // Contract/agreement reference
  clientVisible: boolean            // Show in client portal

  // Lifecycle & Status
  status: ProjectStatus             // See below
  stage: ProjectStage               // See below
  health: 'green' | 'yellow' | 'red' // RAG status

  // People
  projectManager: string            // User ID (existing)
  projectSponsor?: string           // Executive sponsor
  teamMembers: string[]             // User IDs (existing)
  stakeholders: Array<{
    userId: string
    role: string                    // 'approver', 'informed', 'consulted'
    influence: 'high' | 'medium' | 'low'
    interest: 'high' | 'medium' | 'low'
  }>

  // Scheduling
  plannedStartDate: Date            // Was startDate
  plannedEndDate: Date              // Was endDate
  actualStartDate?: Date            // Existing
  actualEndDate?: Date              // Existing
  baselineStartDate?: Date          // Locked baseline
  baselineEndDate?: Date            // Locked baseline

  // Progress
  progress: number                  // 0-100 (existing, auto-calculated)
  progressCalculationMethod: 'task_completion' | 'milestone_weighted' | 'manual'

  // Financial
  budget?: number                   // Planned budget (existing)
  baselineBudget?: number           // Locked baseline
  usedBudget?: number               // Actual spend (existing)
  forecastBudget?: number           // ETC (Estimate To Complete)

  // EVM (Earned Value Management)
  evm?: {
    plannedValue: number            // PV - budgeted cost of work scheduled
    earnedValue: number             // EV - budgeted cost of work performed
    actualCost: number              // AC - actual cost of work performed

    // Calculated metrics
    costVariance: number            // CV = EV - AC
    scheduleVariance: number        // SV = EV - PV
    costPerformanceIndex: number    // CPI = EV / AC
    schedulePerformanceIndex: number // SPI = EV / PV
    estimateAtCompletion: number    // EAC = BAC / CPI
    estimateToComplete: number      // ETC = EAC - AC
    varianceAtCompletion: number    // VAC = BAC - EAC

    lastUpdated: Date
  }

  // Benefits Realization
  expectedBenefits: Array<{
    id: string
    category: 'cost_saving' | 'revenue_increase' | 'efficiency' | 'quality' | 'strategic'
    description: string
    quantifiable: boolean
    targetValue?: number
    unit?: string                   // '$', '%', 'hours'
    realizationDate?: Date
    actualValue?: number
    status: 'not_started' | 'in_progress' | 'realized' | 'not_realized'
  }>

  // Quality
  qualityMetrics?: Array<{
    name: string
    target: number
    actual?: number
    unit: string
  }>

  // Governance
  nextGateDate?: Date
  nextGateType?: 'initiation' | 'planning' | 'execution' | 'closure'
  gateReviewStatus?: 'pending' | 'approved' | 'conditional' | 'rejected'

  // Templates & Methodology
  templateId?: string               // Project template used
  methodology: 'waterfall' | 'agile' | 'hybrid' | 'prince2' | 'pmbok'

  // Tags & Metadata
  tags: string[]                    // Existing
  customFields?: Record<string, any> // Organization-specific fields

  // Timestamps
  createdAt: Date
  createdBy: string
  updatedAt: Date

  // Soft delete
  isActive: boolean                 // Existing
}

// Enhanced status types
export type ProjectStatus =
  | 'draft'           // Initial planning
  | 'pending_approval' // Awaiting gate approval
  | 'approved'        // Approved, not started
  | 'active'          // In execution (existing)
  | 'on_hold'         // Paused (existing)
  | 'completed'       // Successfully completed (existing)
  | 'cancelled'       // Terminated (existing)
  | 'closed'          // Formally closed with handover

// Project stages (PRINCE2-inspired)
export type ProjectStage =
  | 'pre_initiation'  // Concept/feasibility
  | 'initiation'      // Charter, planning
  | 'planning'        // Detailed planning (existing)
  | 'execution'       // Delivery work
  | 'monitoring'      // Ongoing tracking
  | 'closure'         // Handover, lessons learned
```

#### 3.1.3 Enhanced Project Task

```typescript
export interface ProjectTask extends BaseEntity {
  _id: ObjectId
  projectId: string               // Existing
  orgId: string                   // Existing

  // Identification
  taskNumber: string              // TSK-001
  title: string                   // Existing
  description: string             // Existing

  // Hierarchy
  parentTaskId?: string           // Epic/parent task
  level: number                   // 0 = Epic, 1 = Story, 2 = Sub-task
  wbsCode?: string                // Work Breakdown Structure code: 1.2.3

  // Status & Workflow
  status: TaskStatus              // Existing + enhanced
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Assignment
  assignedTo?: string             // User ID (existing)
  assignedToName?: string         // Denormalized for performance
  reviewedBy?: string             // For 'review' status

  // Scheduling
  plannedStartDate?: Date
  plannedEndDate?: Date
  dueDate?: Date                  // Existing
  actualStartDate?: Date
  completedAt?: Date              // Existing

  // Effort Tracking
  estimatedHours?: number         // Existing
  actualHours?: number            // Existing (sum of time entries)
  remainingHours?: number         // ETC for this task

  // Dependencies
  dependencies: TaskDependency[]  // Enhanced from string[]

  // Critical Path
  isCriticalPath: boolean         // Calculated
  slack?: number                  // Float time in hours

  // Progress
  percentComplete: number         // 0-100, manual or auto

  // Task Type
  taskType: 'task' | 'milestone' | 'epic' | 'bug' | 'story'

  // Milestone Link
  milestoneId?: string            // Link to project milestone

  // Deliverables
  deliverables?: Array<{
    name: string
    status: 'not_started' | 'in_progress' | 'completed'
    dueDate?: Date
    completedAt?: Date
  }>

  // Attachments
  attachments?: Array<{
    id: string
    filename: string
    url: string
    uploadedBy: string
    uploadedAt: Date
  }>

  // Comments
  commentCount: number            // Denormalized

  // Timestamps
  createdBy: string               // Existing
  createdAt: Date                 // Existing
  updatedAt: Date                 // Existing
}

// Enhanced task status
export type TaskStatus =
  | 'backlog'       // Not yet scheduled
  | 'todo'          // Ready to start (existing)
  | 'in_progress'   // Active work (existing)
  | 'blocked'       // Cannot proceed (new)
  | 'review'        // Awaiting review (existing)
  | 'completed'     // Done (existing)
  | 'cancelled'     // Cancelled (new)

// Task dependency types
export interface TaskDependency {
  taskId: string                  // Dependent task ID
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish'
  lag: number                     // Lag time in hours (can be negative for lead)
}
```

#### 3.1.4 Project Milestone (Complete Implementation)

```typescript
export interface ProjectMilestone extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  name: string
  description: string
  type: 'gate' | 'deliverable' | 'event' | 'decision_point'

  // Scheduling
  plannedDate: Date
  baselineDate?: Date             // Locked baseline
  actualDate?: Date               // When actually achieved

  // Status
  status: 'planned' | 'at_risk' | 'achieved' | 'missed' | 'cancelled'

  // Gate Review (PRINCE2/PMBOK)
  isGate: boolean
  gateType?: 'initiation' | 'planning' | 'stage_boundary' | 'closure'
  gateArtifacts?: Array<{
    name: string                  // e.g., "Project Charter", "Stage Plan"
    required: boolean
    documentId?: string           // Reference to project_documents
    status: 'pending' | 'submitted' | 'approved'
  }>
  approvalRequired: boolean
  approvers?: string[]            // User IDs
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'conditional'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string

  // Deliverables
  deliverables?: Array<{
    name: string
    description: string
    status: 'not_started' | 'in_progress' | 'completed'
    acceptedBy?: string
    acceptedAt?: Date
  }>

  // Dependencies
  dependsOnMilestones: string[]   // Must complete before this
  dependsOnTasks: string[]        // Tasks that must complete

  // Progress
  progressWeight: number          // 0-100 (for weighted project progress calc)

  // Notifications
  reminderDays: number            // Days before due to remind
  notifyUsers: string[]           // Who to notify

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### 3.2 New Supporting Entities

#### 3.2.1 Project Resource Allocation

```typescript
export interface ProjectResourceAllocation extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Resource
  userId: string
  userName: string                // Denormalized

  // Role on Project
  role: string                    // 'Developer', 'QA', 'Designer', etc.
  isPrimary: boolean              // Primary resource for this role

  // Allocation
  allocationType: 'full_time' | 'part_time' | 'as_needed'
  allocationPercentage: number    // 0-100 (50 = half time)
  hoursPerWeek: number            // Calculated from percentage

  // Schedule
  startDate: Date
  endDate: Date

  // Cost
  hourlyRate?: number             // Billing rate for this project
  costRate?: number               // Internal cost rate

  // Skills
  requiredSkills: string[]        // Skills needed for this role
  userSkills: string[]            // Skills user has
  skillMatch: number              // 0-100 match percentage

  // Status
  status: 'planned' | 'active' | 'completed' | 'removed'

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.2 RAID (Risks, Assumptions, Issues, Decisions)

```typescript
// Risk Register
export interface ProjectRisk extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  riskNumber: string              // RSK-001
  title: string
  description: string
  category: string                // 'technical', 'resource', 'budget', 'schedule'

  // Assessment
  probability: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  probabilityScore: number        // 1-5
  impact: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  impactScore: number             // 1-5
  riskScore: number               // probability × impact (1-25)

  // Response Strategy
  responseStrategy: 'avoid' | 'mitigate' | 'transfer' | 'accept'
  mitigationPlan?: string
  contingencyPlan?: string

  // Ownership
  owner: string                   // User ID responsible for managing

  // Status
  status: 'identified' | 'assessed' | 'mitigated' | 'closed' | 'occurred'

  // Dates
  identifiedDate: Date
  targetResolutionDate?: Date
  closedDate?: Date

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Issue Register
export interface ProjectIssue extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  issueNumber: string             // ISS-001
  title: string
  description: string
  category: string

  // Severity
  severity: 'low' | 'medium' | 'high' | 'critical'
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Resolution
  status: 'open' | 'investigating' | 'resolved' | 'closed'
  resolution?: string

  // Ownership
  reportedBy: string
  assignedTo?: string

  // Related Items
  relatedRiskId?: string          // If issue came from realized risk
  relatedTaskIds: string[]        // Affected tasks

  // Dates
  reportedDate: Date
  targetResolutionDate?: Date
  resolvedDate?: Date
  closedDate?: Date

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Decision Log
export interface ProjectDecision extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  decisionNumber: string          // DEC-001
  title: string
  description: string
  category: string

  // Decision
  options: Array<{
    option: string
    pros: string[]
    cons: string[]
    cost?: number
    timeline?: string
  }>
  selectedOption: string
  rationale: string

  // Governance
  decisionMaker: string           // User ID
  stakeholdersConsulted: string[] // User IDs
  approvalRequired: boolean
  approvedBy?: string
  approvedAt?: Date

  // Impact
  impactedAreas: string[]         // 'scope', 'schedule', 'budget', 'quality'

  // Status
  status: 'pending' | 'approved' | 'implemented' | 'reversed'

  // Dates
  decisionDate: Date
  implementationDate?: Date

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Assumptions Log
export interface ProjectAssumption extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  assumptionNumber: string        // ASM-001
  title: string
  description: string

  // Validation
  validated: boolean
  validatedDate?: Date
  validatedBy?: string
  validationResult?: 'confirmed' | 'refuted' | 'modified'

  // Risk Link
  becameRisk: boolean
  linkedRiskId?: string

  // Status
  status: 'active' | 'validated' | 'invalidated' | 'closed'

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.3 Project Documents

```typescript
export interface ProjectDocument extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  name: string
  description?: string
  type: 'charter' | 'plan' | 'wbs' | 'schedule' | 'budget' | 'risk_register' |
        'quality_plan' | 'communication_plan' | 'scope_statement' | 'lessons_learned' | 'other'

  // File Info
  filename: string
  fileSize: number                // bytes
  contentType: string             // MIME type
  s3Key: string                   // S3 storage key
  url?: string                    // Presigned URL (temporary)

  // Versioning
  version: number
  previousVersionId?: string      // Previous version document ID
  isLatestVersion: boolean

  // Categorization
  category: string
  tags: string[]

  // Access Control
  visibility: 'team' | 'stakeholders' | 'client' | 'private'

  // Metadata
  uploadedBy: string
  uploadedByName: string
  uploadedAt: Date

  // Status
  status: 'draft' | 'review' | 'approved' | 'archived'
  approvedBy?: string
  approvedAt?: Date

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.4 Project Time Entry

```typescript
export interface ProjectTimeEntry extends BaseEntity {
  _id: ObjectId
  projectId: string
  taskId?: string                 // Optional: link to specific task
  orgId: string

  // User
  userId: string
  userName: string                // Denormalized

  // Time
  date: Date                      // Work date
  startTime?: Date                // Optional: specific start time
  endTime?: Date                  // Optional: specific end time
  hours: number                   // Total hours
  minutes: number                 // Additional minutes
  totalMinutes: number            // Calculated: hours * 60 + minutes

  // Description
  description: string
  activityType: string            // 'development', 'testing', 'meetings', etc.

  // Billing
  isBillable: boolean
  hourlyRate?: number             // Rate for this entry
  billableAmount?: number         // Calculated: totalMinutes / 60 * hourlyRate

  // Status
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'
  approvedBy?: string
  approvedAt?: Date
  rejectionReason?: string

  // Invoice Link
  invoiceId?: string              // If already invoiced
  invoiceLineItemId?: string

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

#### 3.2.5 Project Template

```typescript
export interface ProjectTemplate extends BaseEntity {
  _id: ObjectId
  orgId: string

  // Identification
  name: string
  description: string
  category: string
  icon?: string
  color?: string

  // Template Data
  templateData: {
    // Project fields to copy
    type: Project['type']
    category: string
    methodology: Project['methodology']
    tags: string[]

    // Tasks to create
    tasks: Array<{
      title: string
      description: string
      level: number
      wbsCode: string
      estimatedHours: number
      taskType: TaskStatus
      dependencies: string[]       // WBS codes of dependencies
    }>

    // Milestones to create
    milestones: Array<{
      name: string
      description: string
      type: ProjectMilestone['type']
      isGate: boolean
      daysFromStart: number        // Offset from project start
    }>

    // Default roles to add
    roles: Array<{
      role: string
      allocationType: string
      allocationPercentage: number
    }>

    // Documents to include
    documents: Array<{
      name: string
      type: ProjectDocument['type']
      templateS3Key?: string       // Template file to copy
    }>
  }

  // Usage
  isSystemTemplate: boolean       // Built-in vs custom
  usageCount: number
  lastUsedAt?: Date

  // Visibility
  isPublic: boolean               // Available to all in org
  createdBy: string

  // Timestamps
  createdAt: Date
  updatedAt: Date

  // Status
  isActive: boolean
}
```

#### 3.2.6 Project Change Request

```typescript
export interface ProjectChangeRequest extends BaseEntity {
  _id: ObjectId
  projectId: string
  orgId: string

  // Identification
  changeNumber: string            // PCR-001
  title: string
  description: string

  // Change Type
  changeType: 'scope' | 'schedule' | 'budget' | 'resources' | 'quality' | 'other'

  // Impact Assessment
  scopeImpact?: string
  scheduleImpact?: {
    delayDays: number
    affectedMilestones: string[]
    affectedTasks: string[]
  }
  budgetImpact?: {
    additionalCost: number
    costSavings: number
    netImpact: number
  }
  resourceImpact?: string
  qualityImpact?: string

  // Justification
  businessJustification: string
  alternatives?: string
  riskOfNotImplementing?: string

  // Status
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'implemented'
  priority: 'low' | 'medium' | 'high' | 'critical'

  // Approval
  approvers: string[]             // User IDs
  approvalVotes: Array<{
    userId: string
    vote: 'approve' | 'reject' | 'conditional'
    comments?: string
    votedAt: Date
  }>
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
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

### 3.3 Integration Entity Enhancements

#### 3.3.1 Enhanced Unified Ticket (Link to Projects)

```typescript
// Add to existing UnifiedTicket interface
export interface UnifiedTicket extends BaseEntity {
  // ... existing fields ...

  // PROJECT INTEGRATION - NEW
  projectId?: string              // Link ticket to project
  projectName?: string            // Denormalized for performance
  projectTaskId?: string          // Link to specific project task

  // ... rest of existing fields ...
}
```

#### 3.3.2 Enhanced Time Entry (Support Projects)

```typescript
// Replace existing TimeEntry with unified version
export interface TimeEntry {
  _id: ObjectId
  orgId: string

  // WHAT: Link to either ticket OR project
  ticketId?: string               // Existing
  projectId?: string              // NEW - mutually exclusive with ticketId
  projectTaskId?: string          // NEW - optional task link

  // WHO
  userId: string
  userName: string

  // WHEN
  description: string
  startTime: Date
  endTime?: Date
  duration?: number               // minutes

  // BILLING
  isBillable: boolean
  isRunning: boolean

  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

#### 3.3.3 Enhanced Invoice Line Item (Project Support)

```typescript
// Already has projectId field, enhance with task support
export interface InvoiceLineItem {
  // ... existing fields ...

  projectId?: string              // Existing
  projectTaskId?: string          // NEW - specific task billing

  // ... rest of existing fields ...
}
```

#### 3.3.4 Enhanced Schedule Item (Project Meetings)

```typescript
export interface ScheduleItem extends BaseEntity {
  // ... existing fields ...

  projectId?: string              // NEW - link to project
  projectMilestoneId?: string     // NEW - link to milestone

  // ... rest of existing fields ...
}
```

### 3.4 Database Indexes

```javascript
// Portfolios
db.portfolios.createIndex({ orgId: 1, isActive: 1 })
db.portfolios.createIndex({ orgId: 1, clientId: 1 })
db.portfolios.createIndex({ orgId: 1, manager: 1 })

// Projects
db.projects.createIndex({ orgId: 1, isActive: 1 })
db.projects.createIndex({ orgId: 1, portfolioId: 1 })
db.projects.createIndex({ orgId: 1, clientId: 1 })
db.projects.createIndex({ orgId: 1, projectManager: 1 })
db.projects.createIndex({ orgId: 1, status: 1 })
db.projects.createIndex({ projectNumber: 1, orgId: 1 }, { unique: true })

// Tasks
db.project_tasks.createIndex({ projectId: 1, orgId: 1 })
db.project_tasks.createIndex({ orgId: 1, assignedTo: 1, status: 1 })
db.project_tasks.createIndex({ projectId: 1, parentTaskId: 1 })
db.project_tasks.createIndex({ projectId: 1, 'dependencies.taskId': 1 })

// Milestones
db.project_milestones.createIndex({ projectId: 1, orgId: 1 })
db.project_milestones.createIndex({ orgId: 1, plannedDate: 1 })
db.project_milestones.createIndex({ projectId: 1, isGate: 1 })

// Resources
db.project_resources.createIndex({ projectId: 1, orgId: 1 })
db.project_resources.createIndex({ orgId: 1, userId: 1, status: 'active' })
db.project_resources.createIndex({ orgId: 1, startDate: 1, endDate: 1 })

// RAID
db.project_risks.createIndex({ projectId: 1, orgId: 1 })
db.project_risks.createIndex({ orgId: 1, status: 1 })
db.project_issues.createIndex({ projectId: 1, orgId: 1 })
db.project_decisions.createIndex({ projectId: 1, orgId: 1 })
db.project_assumptions.createIndex({ projectId: 1, orgId: 1 })

// Documents
db.project_documents.createIndex({ projectId: 1, orgId: 1 })
db.project_documents.createIndex({ orgId: 1, type: 1 })

// Time Entries
db.project_time_entries.createIndex({ projectId: 1, orgId: 1 })
db.project_time_entries.createIndex({ orgId: 1, userId: 1, date: -1 })
db.project_time_entries.createIndex({ projectId: 1, taskId: 1 })
db.project_time_entries.createIndex({ invoiceId: 1 })

// Templates
db.project_templates.createIndex({ orgId: 1, isActive: 1 })

// Change Requests
db.project_change_requests.createIndex({ projectId: 1, orgId: 1 })
db.project_change_requests.createIndex({ orgId: 1, status: 1 })
```

---

## 4. Workflow Design & Lifecycle Gates

### 4.1 PRINCE2-Inspired Project Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PROJECT LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────┘

Phase 1: PRE-INITIATION
├─ Trigger: Idea/Request submitted
├─ Artifacts:
│  └─ Project Concept Brief
│  └─ Feasibility Study (optional)
├─ Gate: Initiation Approval
│  ├─ Approve → Create full project
│  ├─ Reject → Archive concept
│  └─ Hold → Request more info
└─ Approvers: Portfolio Manager, Sponsor

    ↓ [APPROVED]

Phase 2: INITIATION
├─ Trigger: Gate 1 approved
├─ Artifacts:
│  ├─ Project Charter (PID)
│  ├─ Stakeholder Register
│  ├─ Initial Risk Register
│  ├─ High-Level Schedule
│  ├─ High-Level Budget
│  └─ Communication Plan
├─ Gate: Planning Approval
│  ├─ Approve → Move to planning
│  ├─ Reject → Back to pre-init
│  └─ Conditional → Address concerns
└─ Approvers: Sponsor, Project Board

    ↓ [APPROVED]

Phase 3: PLANNING
├─ Trigger: Gate 2 approved
├─ Artifacts:
│  ├─ Detailed Work Breakdown Structure (WBS)
│  ├─ Detailed Schedule with Dependencies
│  ├─ Resource Plan & Assignments
│  ├─ Detailed Budget & Cash Flow
│  ├─ Quality Management Plan
│  ├─ Risk Management Plan
│  ├─ Change Management Plan
│  └─ Procurement Plan (if needed)
├─ Gate: Execution Approval
│  ├─ Approve → Baseline & start work
│  ├─ Reject → Revise plans
│  └─ Conditional → Minor adjustments
└─ Approvers: Sponsor, Project Manager, Finance

    ↓ [APPROVED & BASELINED]

Phase 4: EXECUTION
├─ Trigger: Gate 3 approved + baseline locked
├─ Activities:
│  ├─ Task execution & tracking
│  ├─ Resource management
│  ├─ Quality assurance
│  ├─ Risk monitoring & mitigation
│  ├─ Issue resolution
│  ├─ Change request processing
│  └─ Stakeholder communication
├─ Stage Gates (Optional):
│  └─ Review at major milestones
│     ├─ Continue → Proceed
│     ├─ Pause → Address issues
│     └─ Terminate → Cancel project
└─ Ongoing: Weekly status, monthly reviews

    ↓ [ALL DELIVERABLES COMPLETE]

Phase 5: CLOSURE
├─ Trigger: All deliverables accepted
├─ Artifacts:
│  ├─ Final Project Report
│  ├─ Lessons Learned Document
│  ├─ Handover Documentation
│  ├─ Final Budget Report
│  ├─ Benefits Realization Plan
│  └─ Archive Package
├─ Gate: Formal Closure
│  ├─ Approve → Close & archive
│  ├─ Reject → Complete missing items
└─ Approvers: Sponsor, Stakeholders

    ↓ [CLOSED]

Phase 6: POST-CLOSURE (Benefits Realization)
├─ Trigger: Project closed
├─ Activities:
│  ├─ Monitor expected benefits (3, 6, 12 months)
│  ├─ Benefits reporting
│  └─ Post-implementation review
└─ Artifacts:
   └─ Benefits Realization Report
```

### 4.2 Gate Review Process

#### 4.2.1 Gate Definition

```typescript
export interface GateReview {
  gateNumber: number              // 1, 2, 3, etc.
  gateType: 'initiation' | 'planning' | 'execution' | 'stage_boundary' | 'closure'
  requiredArtifacts: GateArtifact[]
  approvers: string[]             // User IDs
  criteria: GateCriteria[]
}

export interface GateArtifact {
  name: string
  description: string
  type: ProjectDocument['type']
  required: boolean
  templateId?: string             // Document template
}

export interface GateCriteria {
  category: 'business_case' | 'risk' | 'schedule' | 'budget' | 'resources' | 'quality'
  question: string
  passingCondition: string
  assessedBy: string              // Role: PM, Sponsor, Finance
}
```

#### 4.2.2 Gate Review Workflow

```typescript
// Gate review service logic
export class GateReviewService {
  static async initiateGateReview(projectId: string, gateType: string) {
    // 1. Check all required artifacts submitted
    const artifacts = await this.checkArtifacts(projectId, gateType)
    if (!artifacts.allSubmitted) {
      throw new Error('Missing required artifacts')
    }

    // 2. Create gate review session
    const review = await db.collection('project_gate_reviews').insertOne({
      projectId,
      gateType,
      status: 'in_review',
      artifacts: artifacts.list,
      criteria: this.getGateCriteria(gateType),
      approvers: this.getApprovers(projectId, gateType),
      votes: [],
      startedAt: new Date()
    })

    // 3. Notify approvers
    await NotificationService.send({
      users: review.approvers,
      type: 'gate_review_requested',
      data: { projectId, gateType }
    })

    return review
  }

  static async submitGateVote(reviewId: string, userId: string, vote: GateVote) {
    // 1. Record vote
    await db.collection('project_gate_reviews').updateOne(
      { _id: reviewId },
      {
        $push: {
          votes: {
            userId,
            decision: vote.decision, // 'approve' | 'reject' | 'conditional'
            comments: vote.comments,
            conditions: vote.conditions, // If conditional approval
            votedAt: new Date()
          }
        }
      }
    )

    // 2. Check if all approvers voted
    const review = await db.collection('project_gate_reviews').findOne({ _id: reviewId })
    const allVoted = review.approvers.every(a =>
      review.votes.some(v => v.userId === a)
    )

    if (allVoted) {
      await this.finalizeGateDecision(reviewId)
    }
  }

  static async finalizeGateDecision(reviewId: string) {
    const review = await db.collection('project_gate_reviews').findOne({ _id: reviewId })

    // Determine outcome (all approve = pass, any reject = fail)
    const rejected = review.votes.some(v => v.decision === 'reject')
    const hasConditions = review.votes.some(v => v.decision === 'conditional')

    let outcome: 'approved' | 'rejected' | 'conditional'
    if (rejected) {
      outcome = 'rejected'
    } else if (hasConditions) {
      outcome = 'conditional'
    } else {
      outcome = 'approved'
    }

    // Update gate review
    await db.collection('project_gate_reviews').updateOne(
      { _id: reviewId },
      {
        $set: {
          status: 'completed',
          outcome,
          completedAt: new Date()
        }
      }
    )

    // Update project status based on outcome
    if (outcome === 'approved') {
      await this.progressProjectStage(review.projectId, review.gateType)
    }

    // Notify PM and team
    await NotificationService.send({
      projectId: review.projectId,
      type: 'gate_review_completed',
      data: { outcome, gateType: review.gateType }
    })
  }

  static progressProjectStage(projectId: string, completedGate: string) {
    const stageMap = {
      'initiation': 'planning',
      'planning': 'execution',
      'execution': 'closure',
      'closure': 'closed'
    }

    const nextStage = stageMap[completedGate]

    return db.collection('projects').updateOne(
      { _id: projectId },
      {
        $set: {
          stage: nextStage,
          status: nextStage === 'execution' ? 'active' : undefined,
          [`gates.${completedGate}`]: {
            passed: true,
            passedAt: new Date()
          }
        }
      }
    )
  }
}
```

### 4.3 Standard Artifacts by Phase

```typescript
const PHASE_ARTIFACTS = {
  pre_initiation: [
    { name: 'Project Concept Brief', required: true },
    { name: 'Feasibility Study', required: false }
  ],

  initiation: [
    { name: 'Project Charter (PID)', required: true },
    { name: 'Stakeholder Register', required: true },
    { name: 'Initial Risk Register', required: true },
    { name: 'High-Level Schedule', required: true },
    { name: 'High-Level Budget', required: true },
    { name: 'Communication Plan', required: true }
  ],

  planning: [
    { name: 'Work Breakdown Structure (WBS)', required: true },
    { name: 'Detailed Schedule', required: true },
    { name: 'Resource Management Plan', required: true },
    { name: 'Detailed Budget', required: true },
    { name: 'Quality Management Plan', required: true },
    { name: 'Risk Management Plan', required: true },
    { name: 'Change Management Plan', required: true },
    { name: 'Procurement Plan', required: false }
  ],

  execution: [
    { name: 'Weekly Status Reports', required: true },
    { name: 'Monthly Project Reviews', required: true },
    { name: 'Change Request Log', required: true },
    { name: 'Issue Log', required: true },
    { name: 'Risk Updates', required: true }
  ],

  closure: [
    { name: 'Final Project Report', required: true },
    { name: 'Lessons Learned Document', required: true },
    { name: 'Handover Documentation', required: true },
    { name: 'Final Budget Report', required: true },
    { name: 'Benefits Realization Plan', required: true },
    { name: 'Project Archive Package', required: true }
  ]
}
```

### 4.4 Change Control Workflow

```typescript
export class ProjectChangeControlService {
  static async submitChangeRequest(projectId: string, change: ChangeRequestInput) {
    // 1. Create change request
    const cr = await db.collection('project_change_requests').insertOne({
      ...change,
      projectId,
      changeNumber: await this.generateChangeNumber(projectId),
      status: 'submitted',
      requestedDate: new Date(),
      createdAt: new Date()
    })

    // 2. Perform impact analysis
    const impact = await this.analyzeImpact(projectId, change)

    await db.collection('project_change_requests').updateOne(
      { _id: cr.insertedId },
      { $set: {
        scopeImpact: impact.scope,
        scheduleImpact: impact.schedule,
        budgetImpact: impact.budget,
        resourceImpact: impact.resources
      }}
    )

    // 3. Route to approvers based on impact
    const approvers = this.determineApprovers(impact)

    await db.collection('project_change_requests').updateOne(
      { _id: cr.insertedId },
      { $set: { approvers, status: 'under_review' }}
    )

    // 4. Notify approvers
    await NotificationService.send({
      users: approvers,
      type: 'change_request_approval_needed',
      data: { changeRequestId: cr.insertedId }
    })

    return cr
  }

  static determineApprovers(impact: ImpactAnalysis) {
    const approvers = []

    // Always need PM
    approvers.push('project_manager')

    // Budget impact > 10% needs sponsor
    if (impact.budget.netImpact > (impact.budget.baselineBudget * 0.1)) {
      approvers.push('sponsor')
    }

    // Schedule impact > 5% needs sponsor
    if (impact.schedule.delayDays > (impact.schedule.totalDays * 0.05)) {
      approvers.push('sponsor')
    }

    // High budget impact needs finance approval
    if (impact.budget.netImpact > 10000) {
      approvers.push('finance')
    }

    return approvers
  }

  static async analyzeImpact(projectId: string, change: ChangeRequestInput) {
    const project = await db.collection('projects').findOne({ _id: projectId })

    // Schedule impact: analyze affected tasks
    const scheduleImpact = await this.analyzeScheduleImpact(project, change)

    // Budget impact: estimate additional costs
    const budgetImpact = this.analyzeBudgetImpact(project, change)

    // Resource impact: check if new resources needed
    const resourceImpact = this.analyzeResourceImpact(project, change)

    return {
      scope: change.scopeImpact,
      schedule: scheduleImpact,
      budget: budgetImpact,
      resources: resourceImpact
    }
  }
}
```

---

## 5. Integration Specifications

### 5.1 Project-Ticket Integration

#### 5.1.1 Linking Mechanism

**Bidirectional Links:**
- Tickets can link to ONE project (many-to-one)
- Projects can have MANY tickets (one-to-many)
- Tickets can optionally link to a specific project task

**Use Cases:**
- **Bug Tracking**: Link defect tickets to development projects
- **Support Requests**: Link client tickets to delivery projects
- **Change Requests**: Link change tickets to infrastructure projects
- **Service Requests**: Link service catalog requests to fulfillment projects

#### 5.1.2 Implementation

```typescript
// Service method to link ticket to project
export class ProjectTicketIntegrationService {
  static async linkTicketToProject(
    ticketId: string,
    projectId: string,
    taskId?: string
  ) {
    // 1. Update ticket
    await db.collection('unified_tickets').updateOne(
      { _id: ticketId },
      {
        $set: {
          projectId,
          projectTaskId: taskId,
          updatedAt: new Date()
        }
      }
    )

    // 2. If linked to task, add ticket reference to task
    if (taskId) {
      await db.collection('project_tasks').updateOne(
        { _id: taskId },
        {
          $addToSet: { linkedTickets: ticketId },
          $set: { updatedAt: new Date() }
        }
      )
    }

    // 3. Emit event for workflow triggers
    await EventBus.emit('ticket.linked_to_project', {
      ticketId,
      projectId,
      taskId
    })

    // 4. Create activity log
    await this.logActivity({
      projectId,
      action: 'ticket_linked',
      data: { ticketId, taskId }
    })
  }

  static async syncTicketTimeToProject(ticketId: string) {
    // Get ticket and verify project link
    const ticket = await db.collection('unified_tickets').findOne({ _id: ticketId })
    if (!ticket.projectId) return

    // Get all time entries for this ticket
    const timeEntries = await db.collection('time_entries').find({
      ticketId
    }).toArray()

    // Aggregate total time
    const totalMinutes = timeEntries.reduce((sum, entry) =>
      sum + (entry.duration || 0), 0
    )

    // Update project task actual hours
    if (ticket.projectTaskId) {
      await db.collection('project_tasks').updateOne(
        { _id: ticket.projectTaskId },
        {
          $set: {
            actualHours: totalMinutes / 60,
            updatedAt: new Date()
          }
        }
      )

      // Trigger project progress recalculation
      await ProjectService.updateProjectProgress(ticket.projectId)
    }
  }

  static async getProjectTickets(projectId: string) {
    return db.collection('unified_tickets').find({
      projectId,
      orgId: session.user.orgId
    }).toArray()
  }

  static async getTaskTickets(taskId: string) {
    return db.collection('unified_tickets').find({
      projectTaskId: taskId,
      orgId: session.user.orgId
    }).toArray()
  }
}
```

#### 5.1.3 UI Components

**Project Detail Page:**
- New "Related Tickets" tab showing all linked tickets
- Table with: Ticket #, Type, Title, Status, Priority, Assigned To
- Actions: View, Unlink, Create New Ticket

**Ticket Detail Page:**
- New "Project Link" section in sidebar
- Shows: Project name, Task (if linked), Progress
- Actions: Link to Project, Change Project, Unlink, View Project

**Ticket List Filters:**
- Add filter: "Linked to Project" (Yes/No/Specific Project)

### 5.2 Project-Time Tracking Integration

#### 5.2.1 Unified Time Entry

**Current Problem:**
- TimeEntry only supports `ticketId`
- Cannot log time directly to projects
- Billing difficult for project work without tickets

**Solution:**
- Enhance TimeEntry to support EITHER `ticketId` OR `projectId`
- Add optional `projectTaskId` for task-level tracking
- Maintain backward compatibility

#### 5.2.2 Implementation

```typescript
// Enhanced Time Entry Service
export class TimeTrackingService {
  static async startTimer(input: StartTimerInput) {
    // Validate: must have either ticketId OR projectId, not both
    if (input.ticketId && input.projectId) {
      throw new Error('Cannot log time to both ticket and project')
    }
    if (!input.ticketId && !input.projectId) {
      throw new Error('Must specify either ticketId or projectId')
    }

    // Create time entry
    const entry = await db.collection('time_entries').insertOne({
      orgId: input.orgId,
      ticketId: input.ticketId,
      projectId: input.projectId,
      projectTaskId: input.projectTaskId,
      userId: input.userId,
      userName: input.userName,
      description: input.description,
      startTime: new Date(),
      isRunning: true,
      isBillable: input.isBillable,
      createdAt: new Date()
    })

    return entry
  }

  static async stopTimer(entryId: string) {
    const entry = await db.collection('time_entries').findOne({ _id: entryId })
    const endTime = new Date()
    const duration = (endTime - entry.startTime) / (1000 * 60) // minutes

    await db.collection('time_entries').updateOne(
      { _id: entryId },
      {
        $set: {
          endTime,
          duration,
          isRunning: false,
          updatedAt: new Date()
        }
      }
    )

    // Update project task actual hours
    if (entry.projectTaskId) {
      await this.updateTaskActualHours(entry.projectTaskId)
    }

    // Update project used budget
    if (entry.projectId && entry.isBillable) {
      await this.updateProjectBudget(entry.projectId)
    }

    return duration
  }

  static async updateTaskActualHours(taskId: string) {
    // Aggregate all time entries for this task
    const result = await db.collection('time_entries').aggregate([
      { $match: { projectTaskId: taskId } },
      { $group: {
        _id: null,
        totalMinutes: { $sum: '$duration' }
      }}
    ]).toArray()

    const totalHours = result[0]?.totalMinutes / 60 || 0

    await db.collection('project_tasks').updateOne(
      { _id: taskId },
      { $set: { actualHours: totalHours }}
    )
  }

  static async updateProjectBudget(projectId: string) {
    // Aggregate all billable time entries for this project
    const result = await db.collection('time_entries').aggregate([
      {
        $match: {
          projectId,
          isBillable: true
        }
      },
      {
        $lookup: {
          from: 'project_resources',
          localField: 'userId',
          foreignField: 'userId',
          as: 'resource'
        }
      },
      {
        $project: {
          cost: {
            $multiply: [
              { $divide: ['$duration', 60] }, // hours
              { $arrayElemAt: ['$resource.hourlyRate', 0] } // rate
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$cost' }
        }
      }
    ]).toArray()

    const usedBudget = result[0]?.totalCost || 0

    await db.collection('projects').updateOne(
      { _id: projectId },
      { $set: { usedBudget }}
    )
  }

  static async getProjectTimeEntries(projectId: string) {
    return db.collection('time_entries').find({
      projectId
    }).sort({ startTime: -1 }).toArray()
  }

  static async getTaskTimeEntries(taskId: string) {
    return db.collection('time_entries').find({
      projectTaskId: taskId
    }).sort({ startTime: -1 }).toArray()
  }
}
```

#### 5.2.3 UI Components

**Project Time Tracking Tab:**
- Timer widget: Start/Stop timer for project
- Time entry list: All time logged to project
- Task breakdown: Time per task
- User breakdown: Time per team member
- Filters: Date range, User, Task, Billable/Non-billable

**Task Detail Time Section:**
- Quick timer start for this task
- Time entries for this task
- Estimated vs Actual hours chart

### 5.3 Project-Billing Integration

#### 5.3.1 Invoice Generation from Project

```typescript
export class ProjectBillingService {
  static async generateProjectInvoice(
    projectId: string,
    input: GenerateInvoiceInput
  ) {
    const project = await db.collection('projects').findOne({ _id: projectId })
    if (!project.clientId) {
      throw new Error('Project must have clientId to generate invoice')
    }

    const client = await db.collection('clients').findOne({ _id: project.clientId })

    // Get billable time entries
    const timeEntries = await db.collection('time_entries').find({
      projectId,
      isBillable: true,
      status: { $ne: 'invoiced' }, // Not already invoiced
      date: {
        $gte: input.startDate,
        $lte: input.endDate
      }
    }).toArray()

    // Group time by task and user
    const lineItems = await this.buildInvoiceLineItems(
      project,
      timeEntries,
      input.groupBy
    )

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (input.taxRate || 0)
    const total = subtotal + taxAmount

    // Create invoice
    const invoice = await db.collection('invoices').insertOne({
      invoiceNumber: await this.generateInvoiceNumber(),
      orgId: project.orgId,
      clientId: project.clientId,
      clientName: client.name,
      billingAddress: client.address,

      status: 'draft',
      type: 'standard',

      lineItems,
      subtotal,
      taxAmount,
      total,
      amountPaid: 0,
      amountDue: total,
      currency: 'USD',

      // Project reference
      projectId: project._id,
      projectName: project.name,

      // Date range
      serviceStartDate: input.startDate,
      serviceEndDate: input.endDate,

      // Dates
      issueDate: new Date(),
      dueDate: input.dueDate,

      createdAt: new Date(),
      createdBy: input.userId
    })

    // Mark time entries as invoiced
    await db.collection('time_entries').updateMany(
      { _id: { $in: timeEntries.map(e => e._id) } },
      {
        $set: {
          status: 'invoiced',
          invoiceId: invoice.insertedId
        }
      }
    )

    return invoice
  }

  static async buildInvoiceLineItems(
    project: Project,
    timeEntries: TimeEntry[],
    groupBy: 'task' | 'user' | 'date'
  ) {
    if (groupBy === 'task') {
      // Group by task
      const taskGroups = _.groupBy(timeEntries, 'projectTaskId')

      return Promise.all(
        Object.entries(taskGroups).map(async ([taskId, entries]) => {
          const task = taskId
            ? await db.collection('project_tasks').findOne({ _id: taskId })
            : null

          const totalHours = entries.reduce((sum, e) =>
            sum + (e.duration / 60), 0
          )

          const avgRate = entries.reduce((sum, e) =>
            sum + (e.hourlyRate || 0), 0
          ) / entries.length

          return {
            id: crypto.randomUUID(),
            type: 'labor',
            name: task ? task.title : 'General Project Work',
            description: `${totalHours.toFixed(2)} hours`,
            quantity: totalHours,
            unitPrice: avgRate,
            discount: 0,
            discountType: 'fixed',
            taxable: true,
            taxRate: 0,
            total: totalHours * avgRate,
            projectId: project._id,
            projectTaskId: taskId,
            timeEntryIds: entries.map(e => e._id),
            order: 0
          }
        })
      )
    } else if (groupBy === 'user') {
      // Similar logic for user grouping
      // ... implementation ...
    } else {
      // Date grouping
      // ... implementation ...
    }
  }

  static async getProjectBillingSummary(projectId: string) {
    const timeEntries = await db.collection('time_entries').find({
      projectId,
      isBillable: true
    }).toArray()

    const totalBillableHours = timeEntries.reduce((sum, e) =>
      sum + (e.duration / 60), 0
    )

    const totalBillableAmount = timeEntries.reduce((sum, e) =>
      sum + ((e.duration / 60) * (e.hourlyRate || 0)), 0
    )

    const invoiced = timeEntries.filter(e => e.status === 'invoiced')
    const invoicedAmount = invoiced.reduce((sum, e) =>
      sum + ((e.duration / 60) * (e.hourlyRate || 0)), 0
    )

    const uninvoiced = timeEntries.filter(e => e.status !== 'invoiced')
    const uninvoicedAmount = uninvoiced.reduce((sum, e) =>
      sum + ((e.duration / 60) * (e.hourlyRate || 0)), 0
    )

    return {
      totalBillableHours,
      totalBillableAmount,
      invoicedAmount,
      uninvoicedAmount,
      invoicedHours: invoiced.reduce((sum, e) => sum + (e.duration / 60), 0),
      uninvoicedHours: uninvoiced.reduce((sum, e) => sum + (e.duration / 60), 0)
    }
  }
}
```

### 5.4 Project-Asset Integration

#### 5.4.1 Asset Assignment to Projects

```typescript
export interface ProjectAssetAssignment extends BaseEntity {
  _id: ObjectId
  projectId: string
  assetId: string
  orgId: string

  // Assignment details
  assignmentType: 'allocated' | 'deployed' | 'consumed'
  purpose: string                 // Why asset assigned to project

  // Dates
  startDate: Date
  endDate?: Date                  // For temporary allocations
  returnedDate?: Date

  // Status
  status: 'assigned' | 'in_use' | 'returned'

  // Timestamps
  assignedBy: string
  createdAt: Date
  updatedAt: Date
}

export class ProjectAssetService {
  static async assignAssetToProject(
    projectId: string,
    assetId: string,
    input: AssetAssignmentInput
  ) {
    // 1. Check asset availability
    const asset = await db.collection('assets').findOne({ _id: assetId })
    if (asset.status !== 'active') {
      throw new Error('Asset must be active to assign to project')
    }

    // 2. Create assignment
    const assignment = await db.collection('project_asset_assignments').insertOne({
      projectId,
      assetId,
      orgId: input.orgId,
      assignmentType: input.assignmentType,
      purpose: input.purpose,
      startDate: input.startDate || new Date(),
      endDate: input.endDate,
      status: 'assigned',
      assignedBy: input.userId,
      createdAt: new Date()
    })

    // 3. Update asset status if deployed
    if (input.assignmentType === 'deployed') {
      await db.collection('assets').updateOne(
        { _id: assetId },
        { $set: { status: 'deployed', assignedToProject: projectId } }
      )
    }

    // 4. Log activity
    await this.logActivity({
      projectId,
      action: 'asset_assigned',
      data: { assetId, assignmentType: input.assignmentType }
    })

    return assignment
  }

  static async getProjectAssets(projectId: string) {
    return db.collection('project_asset_assignments').aggregate([
      { $match: { projectId, status: { $ne: 'returned' } } },
      {
        $lookup: {
          from: 'assets',
          localField: 'assetId',
          foreignField: '_id',
          as: 'asset'
        }
      },
      { $unwind: '$asset' }
    ]).toArray()
  }
}
```

### 5.5 Project-Change Management Integration

#### 5.5.1 Link Changes to Projects

```typescript
// Enhance Change Request to link to project
export interface ChangeRequest extends BaseEntity {
  // ... existing fields ...

  // PROJECT INTEGRATION - NEW
  projectId?: string              // Link change to project
  projectImpact?: {
    scheduleDelay: number         // Days
    budgetIncrease: number        // Currency
    scopeChange: 'minor' | 'major'
    affectedMilestones: string[]
    affectedTasks: string[]
  }

  // ... rest of fields ...
}

export class ChangeProjectIntegrationService {
  static async linkChangeToProject(
    changeId: string,
    projectId: string
  ) {
    // Analyze project impact
    const change = await db.collection('change_requests').findOne({ _id: changeId })
    const project = await db.collection('projects').findOne({ _id: projectId })

    const impact = await this.assessProjectImpact(change, project)

    // Update change request
    await db.collection('change_requests').updateOne(
      { _id: changeId },
      {
        $set: {
          projectId,
          projectImpact: impact
        }
      }
    )

    // Create project change request
    await db.collection('project_change_requests').insertOne({
      projectId,
      linkedChangeId: changeId,
      title: `Infrastructure Change: ${change.title}`,
      description: `Related to change request ${change.changeNumber}`,
      changeType: 'resources',
      scheduleImpact: impact,
      status: 'submitted',
      createdAt: new Date()
    })
  }
}
```

### 5.6 Event Bus & Webhooks

#### 5.6.1 Internal Events

```typescript
export const PROJECT_EVENTS = {
  // Lifecycle events
  'project.created': { data: { projectId, portfolioId, clientId } },
  'project.updated': { data: { projectId, changes } },
  'project.status_changed': { data: { projectId, oldStatus, newStatus } },
  'project.deleted': { data: { projectId } },

  // Gate events
  'project.gate_review_started': { data: { projectId, gateType } },
  'project.gate_approved': { data: { projectId, gateType } },
  'project.gate_rejected': { data: { projectId, gateType } },

  // Milestone events
  'project.milestone_reached': { data: { projectId, milestoneId } },
  'project.milestone_missed': { data: { projectId, milestoneId } },
  'project.milestone_at_risk': { data: { projectId, milestoneId, daysToDeadline } },

  // Financial events
  'project.budget_threshold': { data: { projectId, percentage, remaining } },
  'project.budget_overrun': { data: { projectId, overrunAmount } },

  // Resource events
  'project.resource_assigned': { data: { projectId, userId, role } },
  'project.resource_overallocated': { data: { userId, percentage, projects } },

  // Task events
  'project.task_completed': { data: { projectId, taskId } },
  'project.task_overdue': { data: { projectId, taskId, daysPastDue } },

  // Risk events
  'project.risk_identified': { data: { projectId, riskId, riskScore } },
  'project.risk_occurred': { data: { projectId, riskId } },

  // Change events
  'project.change_requested': { data: { projectId, changeRequestId } },
  'project.change_approved': { data: { projectId, changeRequestId } },

  // Health events
  'project.health_degraded': { data: { projectId, oldHealth, newHealth } }
}

export class ProjectEventBus {
  static async emit(eventType: string, data: any) {
    // 1. Trigger internal subscriptions
    await this.notifySubscribers(eventType, data)

    // 2. Trigger workflows
    await WorkflowService.processEvent(eventType, data)

    // 3. Send webhooks
    await WebhookService.dispatch(eventType, data)

    // 4. Log event
    await db.collection('project_events').insertOne({
      eventType,
      data,
      timestamp: new Date()
    })
  }

  static subscribe(eventType: string, handler: EventHandler) {
    // Register internal event handlers
    this.handlers[eventType] = this.handlers[eventType] || []
    this.handlers[eventType].push(handler)
  }
}

// Example usage
ProjectEventBus.subscribe('project.budget_threshold', async (data) => {
  // Send alert notification
  await NotificationService.send({
    users: [data.projectManager, data.sponsor],
    type: 'budget_alert',
    priority: 'high',
    message: `Project ${data.projectName} has reached ${data.percentage}% of budget`
  })
})
```

#### 5.6.2 Webhook System

```typescript
export interface WebhookSubscription extends BaseEntity {
  _id: ObjectId
  orgId: string

  // Configuration
  name: string
  url: string                     // Webhook endpoint URL
  secret: string                  // For signature verification
  events: string[]                // Event types to subscribe to

  // Filters
  filters?: {
    portfolioId?: string
    projectId?: string
    clientId?: string
  }

  // Status
  isActive: boolean
  lastTriggered?: Date
  failureCount: number

  // Retry settings
  retryCount: number              // Max retries
  retryDelay: number              // Seconds between retries

  // Timestamps
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export class WebhookService {
  static async dispatch(eventType: string, data: any) {
    // Get active webhooks for this event
    const webhooks = await db.collection('webhook_subscriptions').find({
      events: eventType,
      isActive: true,
      orgId: data.orgId
    }).toArray()

    // Dispatch to each webhook
    for (const webhook of webhooks) {
      // Check filters
      if (!this.matchesFilters(webhook, data)) continue

      // Send webhook with retry logic
      await this.sendWithRetry(webhook, eventType, data)
    }
  }

  static async sendWithRetry(
    webhook: WebhookSubscription,
    eventType: string,
    data: any,
    attempt: number = 1
  ) {
    try {
      const payload = {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
        webhookId: webhook._id
      }

      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret)

      // Send HTTP POST
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': eventType
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000) // 10s timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Log success
      await db.collection('webhook_subscriptions').updateOne(
        { _id: webhook._id },
        {
          $set: {
            lastTriggered: new Date(),
            failureCount: 0
          }
        }
      )

      await this.logWebhookExecution(webhook._id, eventType, 'success', attempt)

    } catch (error) {
      // Retry logic
      if (attempt < webhook.retryCount) {
        await new Promise(resolve =>
          setTimeout(resolve, webhook.retryDelay * 1000 * attempt)
        )
        await this.sendWithRetry(webhook, eventType, data, attempt + 1)
      } else {
        // Max retries reached
        await db.collection('webhook_subscriptions').updateOne(
          { _id: webhook._id },
          { $inc: { failureCount: 1 } }
        )

        await this.logWebhookExecution(webhook._id, eventType, 'failed', attempt, error.message)
      }
    }
  }

  static generateSignature(payload: any, secret: string) {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return hmac.digest('hex')
  }
}
```

---

## 6. API Specifications

### 6.1 REST API Endpoints

#### 6.1.1 Portfolio Endpoints

```typescript
// Portfolio CRUD
GET    /api/portfolios                     // List all portfolios
GET    /api/portfolios/:id                 // Get single portfolio
POST   /api/portfolios                     // Create portfolio
PUT    /api/portfolios/:id                 // Update portfolio
DELETE /api/portfolios/:id                 // Delete portfolio (soft)

// Portfolio Analytics
GET    /api/portfolios/:id/analytics       // Portfolio health, metrics
GET    /api/portfolios/:id/projects        // Projects in portfolio
GET    /api/portfolios/:id/budget          // Budget summary
GET    /api/portfolios/:id/timeline        // Timeline view

// Portfolio Management
POST   /api/portfolios/:id/rebalance       // Rebalance portfolio
POST   /api/portfolios/:id/prioritize      // Re-prioritize projects
GET    /api/portfolios/:id/health-score    // Calculate health score
```

#### 6.1.2 Enhanced Project Endpoints

```typescript
// Project CRUD (existing + enhanced)
GET    /api/projects                       // List projects with filters
GET    /api/projects/:id                   // Get project detail
POST   /api/projects                       // Create project
PUT    /api/projects/:id                   // Update project
DELETE /api/projects/:id                   // Delete project (soft)

// Project Lifecycle
POST   /api/projects/:id/baseline          // Lock baseline
POST   /api/projects/:id/status            // Change status/stage
GET    /api/projects/:id/health            // Calculate health score

// Tasks (existing + enhanced)
GET    /api/projects/:id/tasks             // List tasks
POST   /api/projects/:id/tasks             // Create task
PUT    /api/projects/:id/tasks/:taskId     // Update task
DELETE /api/projects/:id/tasks/:taskId     // Delete task
POST   /api/projects/:id/tasks/:taskId/start    // Start task
POST   /api/projects/:id/tasks/:taskId/complete // Complete task
GET    /api/projects/:id/tasks/dependencies     // Dependency graph
POST   /api/projects/:id/tasks/reorder          // Reorder tasks
GET    /api/projects/:id/tasks/critical-path    // Critical path calc

// Milestones (NEW - full implementation)
GET    /api/projects/:id/milestones        // List milestones
POST   /api/projects/:id/milestones        // Create milestone
PUT    /api/projects/:id/milestones/:milestoneId // Update milestone
DELETE /api/projects/:id/milestones/:milestoneId // Delete milestone
POST   /api/projects/:id/milestones/:milestoneId/achieve // Mark achieved
GET    /api/projects/:id/milestones/:milestoneId/deliverables // Deliverables

// Gate Reviews (NEW)
POST   /api/projects/:id/gates/:gateType/initiate // Start gate review
POST   /api/projects/:id/gates/:gateId/vote       // Submit vote
GET    /api/projects/:id/gates/:gateId            // Get gate status
PUT    /api/projects/:id/gates/:gateId/artifacts  // Submit artifacts

// Resources (NEW)
GET    /api/projects/:id/resources         // List resource allocations
POST   /api/projects/:id/resources         // Assign resource
PUT    /api/projects/:id/resources/:resourceId // Update allocation
DELETE /api/projects/:id/resources/:resourceId // Remove resource
GET    /api/projects/:id/resources/capacity     // Capacity view

// RAID (NEW)
GET    /api/projects/:id/risks             // List risks
POST   /api/projects/:id/risks             // Add risk
PUT    /api/projects/:id/risks/:riskId     // Update risk
DELETE /api/projects/:id/risks/:riskId     // Delete risk

GET    /api/projects/:id/issues            // List issues
POST   /api/projects/:id/issues            // Add issue
PUT    /api/projects/:id/issues/:issueId   // Update issue
DELETE /api/projects/:id/issues/:issueId   // Delete issue

GET    /api/projects/:id/decisions         // List decisions
POST   /api/projects/:id/decisions         // Add decision
PUT    /api/projects/:id/decisions/:decisionId // Update decision

GET    /api/projects/:id/assumptions       // List assumptions
POST   /api/projects/:id/assumptions       // Add assumption
PUT    /api/projects/:id/assumptions/:assumptionId // Update assumption

// Change Requests (NEW)
GET    /api/projects/:id/changes           // List change requests
POST   /api/projects/:id/changes           // Submit change request
PUT    /api/projects/:id/changes/:changeId // Update change request
POST   /api/projects/:id/changes/:changeId/vote // Vote on change
POST   /api/projects/:id/changes/:changeId/implement // Implement change

// Documents (NEW)
GET    /api/projects/:id/documents         // List documents
POST   /api/projects/:id/documents         // Upload document
GET    /api/projects/:id/documents/:docId  // Get document
DELETE /api/projects/:id/documents/:docId  // Delete document
GET    /api/projects/:id/documents/:docId/versions // Version history

// Time Tracking (NEW)
GET    /api/projects/:id/time              // List time entries
POST   /api/projects/:id/time              // Log time
GET    /api/projects/:id/time/summary      // Time summary
GET    /api/projects/:id/tasks/:taskId/time // Task time entries

// Financials (NEW)
GET    /api/projects/:id/budget            // Budget details
PUT    /api/projects/:id/budget            // Update budget
GET    /api/projects/:id/budget/forecast   // Forecast & EVM
POST   /api/projects/:id/budget/baseline   // Lock budget baseline
GET    /api/projects/:id/invoices          // Project invoices
POST   /api/projects/:id/invoices          // Generate invoice

// Integration
GET    /api/projects/:id/tickets           // Linked tickets
POST   /api/projects/:id/tickets/:ticketId/link // Link ticket
DELETE /api/projects/:id/tickets/:ticketId/unlink // Unlink ticket

GET    /api/projects/:id/assets            // Assigned assets
POST   /api/projects/:id/assets/:assetId/assign // Assign asset

// Analytics
GET    /api/projects/:id/analytics         // Project analytics
GET    /api/projects/:id/progress          // Progress tracking
GET    /api/projects/:id/burndown          // Burndown chart
GET    /api/projects/:id/timeline          // Timeline view

// Templates (NEW)
GET    /api/project-templates              // List templates
POST   /api/project-templates              // Create template
POST   /api/projects/from-template/:templateId // Create from template
```

#### 6.1.3 Resource Management Endpoints

```typescript
// Resource Capacity
GET    /api/resources/capacity             // Org-wide capacity view
GET    /api/resources/capacity/:userId     // User capacity
GET    /api/resources/utilization          // Utilization metrics
GET    /api/resources/availability         // Availability calendar

// Resource Allocation
GET    /api/resources/allocations          // All allocations
GET    /api/resources/allocations/:userId  // User allocations
POST   /api/resources/allocations/optimize // AI-based optimization

// Skills Management
GET    /api/resources/skills               // Available skills
GET    /api/resources/skills/:skill/users  // Users with skill
POST   /api/resources/match                // Skill-based matching
```

### 6.2 API Request/Response Examples

#### 6.2.1 Create Project

**Request:**
```http
POST /api/projects
Content-Type: application/json

{
  "name": "Website Redesign Project",
  "code": "WEB-2025",
  "description": "Complete redesign of corporate website",
  "type": "client",
  "category": "Web Development",
  "priority": "high",

  "portfolioId": "6501234567890abcdef12345",
  "clientId": "6501234567890abcdef12346",

  "projectManager": "6501234567890abcdef12347",
  "teamMembers": [
    "6501234567890abcdef12348",
    "6501234567890abcdef12349"
  ],

  "plannedStartDate": "2025-02-01",
  "plannedEndDate": "2025-06-30",

  "budget": 50000,
  "methodology": "agile",

  "templateId": "6501234567890abcdef12350",

  "tags": ["web", "redesign", "marketing"]
}
```

**Response:**
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "_id": "6501234567890abcdef12351",
    "orgId": "6501234567890abcdef12352",
    "projectNumber": "PRJ-0042",
    "name": "Website Redesign Project",
    "code": "WEB-2025",
    "description": "Complete redesign of corporate website",

    "type": "client",
    "category": "Web Development",
    "priority": "high",
    "status": "draft",
    "stage": "pre_initiation",
    "health": "green",

    "portfolioId": "6501234567890abcdef12345",
    "clientId": "6501234567890abcdef12346",

    "projectManager": "6501234567890abcdef12347",
    "teamMembers": [
      "6501234567890abcdef12348",
      "6501234567890abcdef12349"
    ],

    "plannedStartDate": "2025-02-01T00:00:00.000Z",
    "plannedEndDate": "2025-06-30T00:00:00.000Z",

    "budget": 50000,
    "usedBudget": 0,
    "progress": 0,
    "methodology": "agile",

    "tags": ["web", "redesign", "marketing"],

    "createdBy": "6501234567890abcdef12347",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "isActive": true
  },
  "message": "Project created successfully. Template tasks and milestones have been added."
}
```

#### 6.2.2 Get Project with Full Detail

**Request:**
```http
GET /api/projects/6501234567890abcdef12351?include=tasks,milestones,resources,risks,budget
```

**Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "project": {
      "_id": "6501234567890abcdef12351",
      "projectNumber": "PRJ-0042",
      "name": "Website Redesign Project",
      // ... all project fields ...
    },

    "tasks": [
      {
        "_id": "6501234567890abcdef12360",
        "taskNumber": "TSK-001",
        "title": "Requirements Gathering",
        "status": "completed",
        "progress": 100,
        "estimatedHours": 40,
        "actualHours": 38,
        "assignedTo": "6501234567890abcdef12348",
        "assignedToName": "John Doe",
        "isCriticalPath": true,
        "completedAt": "2025-02-15T17:00:00.000Z"
      }
      // ... more tasks ...
    ],

    "milestones": [
      {
        "_id": "6501234567890abcdef12370",
        "name": "Design Approval",
        "type": "gate",
        "isGate": true,
        "plannedDate": "2025-03-31T00:00:00.000Z",
        "status": "planned",
        "approvalRequired": true,
        "approvers": ["6501234567890abcdef12380"]
      }
      // ... more milestones ...
    ],

    "resources": [
      {
        "_id": "6501234567890abcdef12390",
        "userId": "6501234567890abcdef12348",
        "userName": "John Doe",
        "role": "Lead Developer",
        "allocationType": "full_time",
        "allocationPercentage": 100,
        "hoursPerWeek": 40,
        "hourlyRate": 125,
        "status": "active"
      }
      // ... more resources ...
    ],

    "risks": [
      {
        "_id": "6501234567890abcdef12400",
        "riskNumber": "RSK-001",
        "title": "Third-party API delays",
        "probability": "medium",
        "probabilityScore": 3,
        "impact": "high",
        "impactScore": 4,
        "riskScore": 12,
        "status": "identified",
        "owner": "6501234567890abcdef12347"
      }
      // ... more risks ...
    ],

    "budget": {
      "planned": 50000,
      "baseline": 50000,
      "used": 12500,
      "forecast": 48000,
      "remaining": 37500,
      "utilizationPercentage": 25,

      "evm": {
        "plannedValue": 15000,
        "earnedValue": 12500,
        "actualCost": 12500,
        "costVariance": 0,
        "scheduleVariance": -2500,
        "costPerformanceIndex": 1.0,
        "schedulePerformanceIndex": 0.83,
        "estimateAtCompletion": 48000,
        "varianceAtCompletion": 2000
      }
    },

    "health": {
      "overall": "yellow",
      "schedule": "red",
      "budget": "green",
      "scope": "green",
      "risk": "yellow",
      "quality": "green"
    }
  }
}
```

### 6.3 GraphQL API (Optional Future Enhancement)

For complex queries with nested relationships, consider adding GraphQL:

```graphql
type Project {
  id: ID!
  projectNumber: String!
  name: String!
  status: ProjectStatus!
  progress: Int!

  # Relations
  portfolio: Portfolio
  client: Client
  manager: User!
  team: [User!]!

  # Nested data
  tasks(status: TaskStatus): [Task!]!
  milestones(upcoming: Boolean): [Milestone!]!
  risks(status: RiskStatus): [Risk!]!

  # Computed
  health: ProjectHealth!
  budget: BudgetSummary!
  timeline: TimelineSummary!
}

type Query {
  project(id: ID!): Project
  projects(
    portfolioId: ID
    clientId: ID
    status: ProjectStatus
    managerId: ID
    search: String
    limit: Int
    offset: Int
  ): ProjectConnection!

  # Complex queries
  projectsByHealth(health: HealthStatus!): [Project!]!
  atRiskProjects: [Project!]!
  overdueProjects: [Project!]!
}

type Mutation {
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!

  # Lifecycle
  baselineProject(id: ID!): Project!
  completeProject(id: ID!): Project!

  # Tasks
  createTask(projectId: ID!, input: CreateTaskInput!): Task!
  updateTaskStatus(taskId: ID!, status: TaskStatus!): Task!
}
```

---

**(This is Part 1 of the document. Continuing in next message due to length...)**
