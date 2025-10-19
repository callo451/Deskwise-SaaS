# Service Catalog Form Builder - Complete Documentation

## Overview

The Deskwise ITSM Service Catalog now includes a **comprehensive form builder system** that allows administrators to create custom service request forms with conditional logic, validation, versioning, and templates. This system is inspired by JIRA Service Management and follows ITIL/ITSM best practices.

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [User Guide](#user-guide)
4. [Technical Implementation](#technical-implementation)
5. [API Reference](#api-reference)
6. [Integration with Modules](#integration-with-modules)
7. [Best Practices](#best-practices)

---

## Features

### Core Capabilities

✅ **25+ Field Types**
- Text inputs (short text, long text, rich text)
- Numeric inputs (number, phone)
- Selection fields (dropdown, multi-select, radio, checkbox)
- Date/time pickers
- File uploads
- User and asset pickers
- ITSM-specific fields (priority, impact, urgency)
- Layout elements (divider, heading, description)

✅ **Conditional Logic (If/Then)**
- 10 operators: equals, not-equals, contains, greater-than, less-than, is-empty, is-not-empty, in, not-in
- 6 actions: show, hide, require, set-value, disable, enable
- Target multiple fields with single rule
- Runtime evaluation

✅ **Form Versioning**
- Git-like version history
- Changelog for each version
- Publish/unpublish versions
- Rollback capability
- Draft and published states

✅ **Reusable Templates**
- System templates (built-in)
- Custom templates (organization-specific)
- Quick service creation from templates
- Template usage tracking

✅ **Validation System**
- Required field validation
- Min/max length for text
- Min/max value for numbers
- Regex pattern matching
- Email and URL validation
- Custom validation rules

✅ **Request Type Routing**
- Automatic routing to appropriate module:
  - Service Request → Service Requests module
  - Incident → Incidents module
  - Problem → Problems module
  - Change → Change Management module
  - General → Tickets module

✅ **Visual Form Builder**
- Drag-and-drop field management (conceptual, uses click-to-add)
- Live preview
- 3-column layout: Field Types | Form Canvas | Properties
- Real-time validation

---

## Architecture

### Data Model

```typescript
interface ServiceCatalogueItem {
  // Basic Info
  name: string
  description: string
  category: string
  icon: string

  // Form Builder
  currentVersion: number
  formVersions: FormSchemaVersion[]
  templateId?: string

  // Request Routing
  itilCategory: 'service-request' | 'incident' | 'problem' | 'change' | 'general'

  // Approval & SLA
  requiresApproval: boolean
  slaResponseTime?: number
  slaResolutionTime?: number
}

interface FormSchemaVersion {
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

interface FormField {
  id: string
  type: FormFieldType // 25+ types
  label: string
  description?: string
  required: boolean
  config?: FieldConfig // Type-specific configuration
  validations?: ValidationRule[]
  conditionalRules?: ConditionalRule[]
  order: number
  sectionId?: string
  itilMapping?: {
    category: string
    standardField?: string // Maps to ITSM fields
  }
}
```

### Service Layer

**FormBuilderService** (`src/lib/services/form-builder.ts`)
- Creates and manages services
- Handles form schema versioning
- Evaluates conditional logic
- Validates form submissions
- Manages templates

**ServiceCatalogSubmissionService** (`src/lib/services/service-catalog-submissions.ts`)
- Routes submissions to appropriate modules
- Extracts mapped ITIL fields
- Calculates priority from impact × urgency
- Handles SLA configuration
- Increments service popularity

### API Routes

```
/api/service-catalog
  GET  - List all services with filters
  POST - Create new service

/api/service-catalog/[id]
  GET    - Get service details
  PUT    - Update service
  DELETE - Delete service

/api/service-catalog/[id]/form-schema
  PUT  - Update form schema (creates new version)
  POST - Publish form version

/api/service-catalog/[id]/submit
  POST - Submit service request form

/api/service-catalog/templates
  GET  - List all templates
  POST - Create new template

/api/service-catalog/categories
  GET  - List categories
  POST - Create category

/api/service-catalog/categories/seed
  POST - Create default categories
```

---

## User Guide

### Creating a Service with Custom Form

1. **Navigate to Service Catalog Settings**
   - Settings → Service Catalog → "New Service" button

2. **Basic Information Tab**
   - Enter service name (e.g., "New Laptop Request")
   - Select category from dropdown
   - Choose icon from visual icon picker (130+ icons)
   - Add short and full descriptions
   - Add tags for categorization

3. **Request Settings Tab**
   - Select request category:
     - **Service Request**: Standard requests (laptop, access, software)
     - **Incident**: Service disruptions requiring immediate attention
     - **Problem**: Root cause investigation for recurring incidents
     - **Change**: Infrastructure or application changes
     - **General**: Generic tickets
   - Set estimated time (e.g., "2-4 hours")
   - Enable approval if needed
   - Configure SLA times

4. **Form Builder Tab**
   - **Left Panel**: Click field types to add to form
   - **Middle Panel**: View and select fields
   - **Right Panel**: Configure field properties
     - Label and description
     - Placeholder text
     - Required toggle
     - Type-specific options

5. **Preview Tab**
   - See how the form will appear to end users
   - Test field layout and descriptions

6. **Save**
   - Creates service with version 1 (unpublished)
   - Redirects to service catalog list

### Managing Form Versions

**Creating New Version:**
- Edit service form
- Make changes to fields
- Add changelog note
- Save → Creates version 2

**Publishing Version:**
- API call to `/api/service-catalog/[id]/form-schema` with `POST`
- Sets `isPublished: true`
- Unpublishes previous version

**Rollback:**
- Publish older version
- Previous version becomes active

### Using Templates

**Creating Template:**
- Build form schema
- Save as template via API
- Template appears in templates list

**Using Template:**
- Select template when creating new service
- Form fields auto-populated
- Customize as needed

---

## Technical Implementation

### Field Type Configuration Examples

**Short Text Field:**
```typescript
{
  id: 'field_001',
  type: 'text',
  label: 'Employee Name',
  required: true,
  config: {
    minLength: 2,
    maxLength: 100
  },
  validations: [
    { type: 'required', message: 'Name is required' },
    { type: 'min-length', value: 2, message: 'Name must be at least 2 characters' }
  ]
}
```

**Dropdown with Options:**
```typescript
{
  id: 'field_002',
  type: 'select',
  label: 'Department',
  required: true,
  config: {
    options: [
      { value: 'engineering', label: 'Engineering', description: 'Dev team' },
      { value: 'sales', label: 'Sales' },
      { value: 'hr', label: 'Human Resources' }
    ]
  }
}
```

**Priority Field (ITSM):**
```typescript
{
  id: 'field_003',
  type: 'priority',
  label: 'Priority',
  required: true,
  itilMapping: {
    category: 'incident',
    standardField: 'priority'
  }
}
```

### Conditional Logic Example

**Show Field B when Field A equals "yes":**
```typescript
{
  id: 'field_a',
  type: 'boolean',
  label: 'Need manager approval?',
  conditionalRules: [
    {
      id: 'rule_001',
      fieldId: 'field_a',
      operator: 'equals',
      value: true,
      action: 'show',
      targetFieldIds: ['field_b']
    }
  ]
}
```

**Require Field C when Priority is High or Critical:**
```typescript
{
  id: 'priority_field',
  type: 'priority',
  label: 'Priority',
  conditionalRules: [
    {
      id: 'rule_002',
      fieldId: 'priority_field',
      operator: 'in',
      value: ['high', 'critical'],
      action: 'require',
      targetFieldIds: ['field_c']
    }
  ]
}
```

### Priority Calculation

Automatic priority calculation from Impact × Urgency:

```typescript
// Matrix (ITIL Standard)
const matrix = {
  high: {
    high: 'critical',
    medium: 'high',
    low: 'medium',
  },
  medium: {
    high: 'high',
    medium: 'medium',
    low: 'low',
  },
  low: {
    high: 'medium',
    medium: 'low',
    low: 'low',
  },
}

// Usage
const priority = FormBuilderService.calculatePriority('high', 'high')
// Returns: 'critical'
```

---

## API Reference

### Submit Service Request

**Endpoint:** `POST /api/service-catalog/[id]/submit`

**Request Body:**
```json
{
  "formData": {
    "title": "New Laptop Request",
    "description": "Need a development laptop",
    "priority": "high",
    "department": "engineering",
    "impact": "high",
    "urgency": "medium",
    "justification": "Current laptop is 5 years old"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request submitted successfully",
  "itemType": "service-request",
  "itemId": "507f1f77bcf86cd799439011",
  "itemNumber": "SR-00042",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "requestNumber": "SR-00042",
    "title": "New Laptop Request",
    "status": "pending_approval",
    "priority": "high",
    "serviceId": "507f191e810c19729de860ea",
    "formData": { ... },
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

### Create Service

**Endpoint:** `POST /api/service-catalog`

**Request Body:**
```json
{
  "name": "Password Reset",
  "description": "Reset user password",
  "category": "Access Management",
  "icon": "Lock",
  "itilCategory": "service-request",
  "requiresApproval": false,
  "slaResponseTime": 60,
  "slaResolutionTime": 120
}
```

### Update Form Schema

**Endpoint:** `PUT /api/service-catalog/[id]/form-schema`

**Request Body:**
```json
{
  "fields": [
    {
      "id": "field_001",
      "type": "text",
      "label": "Username",
      "required": true,
      "order": 0
    }
  ],
  "sections": [],
  "changelog": "Added username field"
}
```

---

## Integration with Modules

### Service Request Flow

1. User fills out service catalog form
2. Form data submitted to `/api/service-catalog/[id]/submit`
3. `ServiceCatalogSubmissionService` validates and routes
4. Based on `itilCategory`:
   - `service-request` → Creates `ServiceRequest`
   - `incident` → Creates `Incident`
   - `problem` → Creates `Problem`
   - `change` → Creates `ChangeRequest`
   - `general` → Creates `Ticket`
5. Form fields mapped to module fields via `itilMapping`
6. User redirected to created item

### Field Mapping

Form fields can be mapped to standard ITSM fields:

```typescript
{
  id: 'impact_field',
  type: 'impact',
  label: 'Business Impact',
  itilMapping: {
    category: 'incident',
    standardField: 'impact'
  }
}
```

When submitted:
- Form field value → ITSM module field
- Automatic priority calculation if impact + urgency present
- SLA configuration applied from service settings

---

## Best Practices

### Form Design

1. **Group Related Fields**
   - Use sections to organize long forms
   - Logical grouping improves completion rates

2. **Clear Labels**
   - Use descriptive, user-friendly labels
   - Add descriptions for complex fields
   - Include placeholder text with examples

3. **Progressive Disclosure**
   - Use conditional logic to show fields only when needed
   - Reduces form complexity
   - Improves user experience

4. **Validation**
   - Validate on submit, not on every keystroke
   - Clear error messages
   - Required fields marked with asterisk

### Service Configuration

1. **Choose Appropriate Request Type**
   - **Service Request**: Standard fulfillment (new equipment, access)
   - **Incident**: Service disruption (outage, error)
   - **Problem**: Recurring issues (needs root cause analysis)
   - **Change**: Infrastructure changes (deployments, upgrades)

2. **Set Realistic SLAs**
   - Response time: Time to first acknowledgment
   - Resolution time: Time to complete request
   - Consider business hours vs. 24/7

3. **Approval Workflows**
   - Enable for high-value requests (>$1000)
   - Manager approval for access requests
   - Change Advisory Board for critical changes

### Version Management

1. **Frequent Versions**
   - Create new version for any field change
   - Document changes in changelog
   - Don't edit published versions

2. **Testing Before Publishing**
   - Preview form before publishing
   - Test conditional logic
   - Verify validation rules

3. **Communication**
   - Notify users of major form changes
   - Provide training for complex forms
   - Update documentation

---

## Components Created

### Backend

| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/types.ts` | Type definitions for form builder | 275+ |
| `src/lib/services/form-builder.ts` | Form builder service layer | 469 |
| `src/lib/services/service-catalog-submissions.ts` | Submission routing service | 252 |
| `src/app/api/service-catalog/route.ts` | Main API routes | 84 |
| `src/app/api/service-catalog/[id]/route.ts` | Individual service routes | - |
| `src/app/api/service-catalog/[id]/form-schema/route.ts` | Form schema management | 90 |
| `src/app/api/service-catalog/[id]/submit/route.ts` | Form submission endpoint | 48 |
| `src/app/api/service-catalog/templates/route.ts` | Template management | 67 |

### Frontend

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/(app)/settings/service-catalog/page.tsx` | Service catalog list page | 332 |
| `src/app/(app)/settings/service-catalog/new/page.tsx` | Form builder page | 632 |
| `src/components/service-catalog/icon-picker.tsx` | Visual icon picker | 207 |
| `src/components/ui/popover.tsx` | Popover component | 32 |
| `src/components/ui/scroll-area.tsx` | Scroll area component | 50 |

---

## Future Enhancements

### Planned Features

- [ ] **Drag-and-drop field reordering** (currently click-based)
- [ ] **Form analytics** (completion rates, abandonment points)
- [ ] **Multi-page forms** with progress indicator
- [ ] **File upload preview** with size limits
- [ ] **Approval workflow builder** (visual designer)
- [ ] **Email notifications** (on submission, approval, completion)
- [ ] **Form templates marketplace** (share templates between orgs)
- [ ] **AI-powered form suggestions** (recommend fields based on category)
- [ ] **Mobile form optimization** (responsive design improvements)
- [ ] **Signature fields** for approvals
- [ ] **Calculated fields** (sum, product, concatenation)
- [ ] **Lookup fields** (reference data from other modules)
- [ ] **Integration with external systems** (Active Directory, HR systems)

---

## Support

For questions or issues:
- Check CLAUDE.md for technical details
- Review type definitions in `src/lib/types.ts`
- Examine existing services in `src/lib/services/`
- Follow patterns from tickets module

---

**Last Updated:** January 2025
**Version:** 1.0
**Author:** Deskwise Development Team
