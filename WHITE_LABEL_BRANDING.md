# White-Label Branding System

## Overview

The Deskwise ITSM platform includes a comprehensive white-label branding system that allows tenant administrators to fully customize the visual identity and user-facing assets of their instance without developer intervention. This document provides complete technical documentation for the branding system.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Database Schema](#database-schema)
4. [Backend Services](#backend-services)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Usage Guide](#usage-guide)
8. [Integration Points](#integration-points)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Architecture

### System Design

The white-label branding system follows a layered architecture:

```
┌─────────────────────────────────────────────┐
│          Frontend Components                │
│  (Settings UI, Preview, Theme Provider)     │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│            API Endpoints                    │
│  (REST APIs for CRUD operations)            │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│          Service Layer                      │
│  (BrandingService - business logic)         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│         Database Layer                      │
│  (MongoDB - organizations & versions)       │
└─────────────────────────────────────────────┘
```

### Key Components

1. **Database Layer**: MongoDB collections for organizations and branding versions
2. **Service Layer**: `BrandingService` for all branding operations
3. **API Layer**: RESTful endpoints for CRUD operations
4. **File Storage**: AWS S3 for logo and asset storage
5. **Frontend Layer**: React components for configuration UI
6. **Theme Provider**: Dynamic CSS variable injection
7. **Email Integration**: Branded email template generation

---

## Features

### 1. Logos and Icons

- **Light Mode Logo**: Primary logo for light theme
- **Dark Mode Logo**: Alternative logo for dark theme
- **Favicon**: Browser tab icon
- **Login Screen Logo**: Dedicated logo for authentication pages
- **Supported Formats**: PNG, JPEG, SVG, WebP, ICO
- **Max File Size**: 5MB per asset
- **Automatic Scaling**: Images optimized for various contexts
- **S3 Storage**: Secure cloud storage with presigned URLs

### 2. Color Palette

- **Primary Color**: Buttons, links, active states
- **Secondary Color**: Secondary UI elements
- **Accent Color**: Highlights and special elements
- **Background Color**: Page backgrounds (optional)
- **Surface Color**: Cards, modals, elevated surfaces (optional)
- **Format**: HSL (Hue, Saturation, Lightness)
- **Range**: H: 0-360°, S: 0-100%, L: 0-100%
- **Dynamic Application**: Real-time CSS variable updates
- **Dark Mode Support**: Automatic contrast adjustments

### 3. Typography

- **Primary Font**: Main text font family
- **Heading Font**: Optional separate font for headings
- **Google Fonts Integration**: Connect via URL or font name
- **13 Pre-selected Fonts**:
  - Inter, Roboto, Open Sans, Lato, Montserrat
  - Poppins, Source Sans Pro, Raleway, Nunito
  - Merriweather, Playfair Display, Work Sans, IBM Plex Sans
- **Custom Fonts**: Support for custom Google Fonts URLs
- **Global Application**: Applies to all UI components

### 4. Brand Identity

- **Company Name**: Used in titles, headers, emails
- **Tagline**: Optional company slogan (200 char limit)
- **Subdomain**: Custom subdomain on Deskwise domain
  - Format: `yourcompany.deskwise.net`
  - Validation: Real-time availability checking
  - Reserved names: www, admin, api, portal, etc.
- **Custom Domain**: Full custom domain mapping (premium feature)
  - Format: `support.yourcompany.com`
  - DNS validation required
  - Automatic SSL certificate provisioning

### 5. Email and Notification Branding

- **From Name**: Sender name in email headers
- **Reply-To Email**: Email address for replies
- **Footer Text**: Custom footer content (500 char limit)
- **Logo URL**: Publicly accessible logo for emails
- **Header Color**: Email header background color
- **Dynamic Templates**: All email templates use branding
- **Template Variables**: Handlebars syntax for dynamic content

### 6. Version History and Rollback

- **Automatic Versioning**: Every change creates a new version
- **Complete History**: Track all branding changes
- **Metadata**: User, timestamp, change description
- **Rollback**: Restore any previous version
- **Audit Trail**: Full compliance logging
- **Version Comparison**: Compare different versions

### 7. Export and Import

- **JSON Export**: Download complete branding configuration
- **File Format**: Structured JSON with all settings
- **Cross-Tenant**: Import branding to multiple organizations
- **Agency Support**: Agencies can duplicate branding
- **Filename**: `branding-{orgId}-{timestamp}.json`

---

## Database Schema

### Organization Collection

**Collection**: `organizations`

```typescript
interface Organization {
  _id: ObjectId
  name: string
  domain?: string
  logo?: string  // Legacy field (deprecated)
  timezone: string
  currency: string
  mode: 'msp' | 'internal'
  createdAt: Date
  updatedAt: Date
  settings: {
    ticketPrefix?: string
    enableAI?: boolean
    allowPublicKB?: boolean
  }
  branding?: OrganizationBranding  // White-label configuration
}
```

### Branding Configuration

```typescript
interface OrganizationBranding {
  // Logos and Icons
  logos: {
    primary: {
      light?: string  // S3 key for light mode logo
      dark?: string   // S3 key for dark mode logo
    }
    favicon?: string       // S3 key for favicon
    loginScreen?: string   // S3 key for login screen logo
  }

  // Color Palette (HSL format)
  colors: {
    primary: { h: number; s: number; l: number }
    secondary: { h: number; s: number; l: number }
    accent: { h: number; s: number; l: number }
    background?: { h: number; s: number; l: number }
    surface?: { h: number; s: number; l: number }
  }

  // Typography
  typography: {
    fontFamily: string           // Main font
    googleFontsUrl?: string      // Google Fonts embed URL
    headingFontFamily?: string   // Optional heading font
  }

  // Brand Identity
  identity: {
    companyName: string          // Brand name
    tagline?: string             // Company tagline
    customDomain?: string        // Custom domain
    subdomain?: string           // Deskwise subdomain
  }

  // Email Branding
  email: {
    fromName: string             // "from" name in emails
    replyToEmail?: string        // Reply-to address
    footerText?: string          // Email footer text
    logoUrl?: string             // Publicly accessible logo
    headerColor?: string         // Email header color (hex)
  }

  // Metadata
  version: number                // Version number
  isActive: boolean              // Active status
  lastModifiedBy?: string        // User ID
  lastModifiedAt?: Date          // Modification timestamp
}
```

### Branding Versions Collection

**Collection**: `branding_versions`

```typescript
interface BrandingVersion extends BaseEntity {
  version: number                      // Version number
  branding: OrganizationBranding       // Complete branding snapshot
  modifiedBy: string                   // User ID
  modifiedByName: string               // User display name
  changeDescription?: string           // Change description
  isActive: boolean                    // Currently active version
}
```

### Database Indexes

```javascript
// Unique branding version per organization
db.branding_versions.createIndex(
  { orgId: 1, version: 1 },
  { unique: true }
)

// Query by organization
db.branding_versions.createIndex({ orgId: 1, createdAt: -1 })

// Subdomain uniqueness
db.organizations.createIndex(
  { 'branding.identity.subdomain': 1 },
  { unique: true, sparse: true }
)
```

---

## Backend Services

### BrandingService

**Location**: `src/lib/services/branding.ts`

#### Methods

##### `getBranding(orgId: string): Promise<OrganizationBranding>`

Get current branding configuration for an organization.

```typescript
const branding = await BrandingService.getBranding(orgId)
// Returns organization's branding or DEFAULT_BRANDING
```

##### `updateBranding(orgId, updates, userId, userName, changeDescription): Promise<OrganizationBranding>`

Update branding configuration with version history.

```typescript
const updatedBranding = await BrandingService.updateBranding(
  orgId,
  {
    colors: {
      primary: { h: 220, s: 90, l: 55 }
    }
  },
  userId,
  userName,
  'Updated primary color to blue'
)
```

##### `resetBranding(orgId, userId, userName): Promise<OrganizationBranding>`

Reset branding to default Deskwise theme.

```typescript
const resetBranding = await BrandingService.resetBranding(
  orgId,
  userId,
  userName
)
```

##### `getBrandingHistory(orgId, limit): Promise<BrandingVersion[]>`

Get branding version history.

```typescript
const history = await BrandingService.getBrandingHistory(orgId, 20)
// Returns last 20 versions
```

##### `rollbackToVersion(orgId, versionNumber, userId, userName): Promise<OrganizationBranding>`

Rollback to a specific branding version.

```typescript
const rolledBack = await BrandingService.rollbackToVersion(
  orgId,
  5,  // Version number
  userId,
  userName
)
```

##### `exportBranding(orgId): Promise<ExportData>`

Export branding configuration as JSON.

```typescript
const exportData = await BrandingService.exportBranding(orgId)
// Returns: { organization, exportedAt, branding }
```

##### `importBranding(orgId, brandingData, userId, userName): Promise<OrganizationBranding>`

Import branding configuration from JSON.

```typescript
const imported = await BrandingService.importBranding(
  orgId,
  brandingData,
  userId,
  userName
)
```

##### `generateCSSVariables(branding): Record<string, string>`

Generate CSS variables from branding colors.

```typescript
const cssVars = BrandingService.generateCSSVariables(branding)
// Returns: { '--primary': '221.2 83.2% 53.3%', ... }
```

##### `validateSubdomain(subdomain, excludeOrgId?): Promise<ValidationResult>`

Validate subdomain availability.

```typescript
const validation = await BrandingService.validateSubdomain('acme')
// Returns: { available: true } or { available: false, message: 'Subdomain is taken' }
```

### Default Branding

```typescript
export const DEFAULT_BRANDING: OrganizationBranding = {
  logos: {
    primary: { light: undefined, dark: undefined },
    favicon: undefined,
    loginScreen: undefined,
  },
  colors: {
    primary: { h: 221.2, s: 83.2, l: 53.3 },    // Deskwise blue
    secondary: { h: 210, s: 40, l: 96.1 },
    accent: { h: 210, s: 40, l: 96.1 },
    background: { h: 0, s: 0, l: 100 },
    surface: { h: 0, s: 0, l: 100 },
  },
  typography: {
    fontFamily: 'Inter',
    googleFontsUrl: undefined,
    headingFontFamily: undefined,
  },
  identity: {
    companyName: 'Deskwise',
    tagline: undefined,
    customDomain: undefined,
    subdomain: undefined,
  },
  email: {
    fromName: 'Deskwise Support',
    replyToEmail: undefined,
    footerText: undefined,
    logoUrl: undefined,
    headerColor: '#667eea',
  },
  version: 1,
  isActive: true,
}
```

---

## API Endpoints

All endpoints require authentication. Admin-only endpoints require `settings.edit` or `settings.manage` permissions.

### GET /api/branding

Get current branding configuration.

**Authentication**: Required
**Permissions**: Any authenticated user
**Rate Limit**: None

**Response**:
```json
{
  "success": true,
  "data": {
    "logos": { ... },
    "colors": { ... },
    "typography": { ... },
    "identity": { ... },
    "email": { ... },
    "version": 1,
    "isActive": true
  }
}
```

### PUT /api/branding

Update branding configuration.

**Authentication**: Required
**Permissions**: `settings.edit` or `settings.manage`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "updates": {
    "colors": {
      "primary": { "h": 220, "s": 90, "l": 55 }
    },
    "identity": {
      "companyName": "Acme Corp"
    }
  },
  "changeDescription": "Updated company branding"
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* Updated branding */ },
  "message": "Branding updated successfully"
}
```

**Validation**:
- Color H: 0-360
- Color S: 0-100
- Color L: 0-100

### POST /api/branding/reset

Reset branding to default Deskwise theme.

**Authentication**: Required
**Permissions**: `settings.manage`

**Response**:
```json
{
  "success": true,
  "data": { /* Default branding */ },
  "message": "Branding reset to default successfully"
}
```

### GET /api/branding/history

Get branding version history.

**Authentication**: Required
**Permissions**: Any authenticated user
**Query Parameters**:
- `limit` (optional, default: 20): Number of versions to return

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "version": 2,
      "branding": { ... },
      "modifiedBy": "user_123",
      "modifiedByName": "John Doe",
      "changeDescription": "Updated colors",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### POST /api/branding/rollback

Rollback to a specific branding version.

**Authentication**: Required
**Permissions**: `settings.manage`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "version": 5
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* Rolled back branding */ },
  "message": "Branding rolled back to version 5 successfully"
}
```

### GET /api/branding/export

Export branding configuration as JSON file.

**Authentication**: Required
**Permissions**: `settings.view`, `settings.edit`, or `settings.manage`

**Response**: JSON file download
```json
{
  "organization": "Acme Corp",
  "exportedAt": "2025-01-15T10:30:00Z",
  "branding": { ... }
}
```

**Headers**:
```
Content-Type: application/json
Content-Disposition: attachment; filename="branding-{orgId}-{timestamp}.json"
```

### POST /api/branding/import

Import branding configuration from JSON.

**Authentication**: Required
**Permissions**: `settings.manage`
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "branding": {
    "logos": { ... },
    "colors": { ... },
    "typography": { ... },
    "identity": { ... },
    "email": { ... }
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": { /* Imported branding */ },
  "message": "Branding imported successfully"
}
```

### POST /api/branding/upload

Upload a branding asset (logo, favicon, etc.).

**Authentication**: Required
**Permissions**: `settings.edit` or `settings.manage`
**Content-Type**: `multipart/form-data`

**Form Data**:
- `file`: Image file (PNG, JPEG, SVG, WebP, ICO, max 5MB)
- `assetType`: `logo-light`, `logo-dark`, `favicon`, or `login`

**Response**:
```json
{
  "success": true,
  "data": {
    "s3Key": "org123/branding/logo-light-1234567890-abcd1234.png",
    "url": "https://presigned-url.s3.amazonaws.com/...",
    "size": 45678,
    "contentType": "image/png",
    "assetType": "logo-light"
  },
  "message": "Branding asset uploaded successfully"
}
```

**S3 Key Format**: `{orgId}/branding/{assetType}-{timestamp}-{uniqueId}.{ext}`

### POST /api/branding/validate-subdomain

Validate subdomain availability.

**Authentication**: Required
**Permissions**: Any authenticated user
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "subdomain": "acme"
}
```

**Response (Available)**:
```json
{
  "success": true,
  "data": {
    "available": true
  }
}
```

**Response (Taken)**:
```json
{
  "success": true,
  "data": {
    "available": false,
    "message": "This subdomain is already in use"
  }
}
```

**Validation Rules**:
- 3-63 characters
- Alphanumeric and hyphens only
- Must start and end with alphanumeric
- Reserved: www, mail, admin, api, app, portal, support, help, docs, status, blog, deskwise

### GET /api/branding/asset/[key]

Retrieve a branding asset from S3.

**Authentication**: Not required (public endpoint)
**Path Parameters**:
- `key`: S3 object key (URL-encoded)

**Response**: Redirect to presigned S3 URL (302)

**Example**:
```
GET /api/branding/asset/org123%2Fbranding%2Flogo-light-1234.png
→ 302 Redirect to https://s3.amazonaws.com/bucket/org123/branding/logo-light-1234.png?signature=...
```

---

## Frontend Components

### BrandingProvider

**Location**: `src/components/providers/BrandingProvider.tsx`

React context provider that fetches and applies organization branding.

**Features**:
- Fetches branding on mount
- Injects CSS variables
- Loads Google Fonts
- Updates favicon
- Updates page title

**Usage**:
```typescript
import { BrandingProvider } from '@/components/providers/BrandingProvider'

<BrandingProvider>
  {children}
</BrandingProvider>
```

**Hook**:
```typescript
import { useBranding } from '@/components/providers/BrandingProvider'

function MyComponent() {
  const { branding, isLoading, error, refreshBranding } = useBranding()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return <div>{branding.identity.companyName}</div>
}
```

### Settings → Branding Page

**Location**: `src/app/(app)/settings/branding/page.tsx`

Main branding settings page with 7 tabs:

1. **Logos**: Upload logos for light/dark modes, favicon, login screen
2. **Colors**: Color palette editor with HSL sliders
3. **Typography**: Font selector with Google Fonts integration
4. **Identity**: Company name, tagline, subdomain, custom domain
5. **Email**: Email branding configuration
6. **Preview**: Live preview of branding changes
7. **History**: Version history with rollback functionality

**Access**: Admin only (`settings.edit` or `settings.manage`)

### Component Files

| Component | Location | Purpose |
|-----------|----------|---------|
| LogoUploadSection | `_components/LogoUploadSection.tsx` | Upload and preview logos |
| ColorPaletteEditor | `_components/ColorPaletteEditor.tsx` | Edit color palette with HSL sliders |
| TypographySelector | `_components/TypographySelector.tsx` | Select and preview fonts |
| CompanyIdentitySection | `_components/CompanyIdentitySection.tsx` | Configure company identity |
| EmailBrandingSection | `_components/EmailBrandingSection.tsx` | Configure email branding |
| LivePreviewPane | `_components/LivePreviewPane.tsx` | Live preview of changes |
| BrandingHistory | `_components/BrandingHistory.tsx` | Version history and rollback |

---

## Usage Guide

### For Administrators

#### Initial Setup

1. **Navigate to Settings**:
   - Go to Dashboard → Settings
   - Click on "Branding" card (pink color)

2. **Upload Logos**:
   - Switch to "Logos" tab
   - Drag and drop or click to upload:
     - Light mode logo (shown in light theme)
     - Dark mode logo (shown in dark theme)
     - Favicon (browser tab icon)
     - Login screen logo (authentication pages)
   - Supported formats: PNG, JPEG, SVG, WebP, ICO
   - Max file size: 5MB

3. **Customize Colors**:
   - Switch to "Colors" tab
   - Use HSL sliders to adjust:
     - Primary color (buttons, links)
     - Secondary color (secondary UI)
     - Accent color (highlights)
     - Background color (page background)
     - Surface color (cards, modals)
   - Preview changes in real-time
   - Click "Save Changes"

4. **Select Typography**:
   - Switch to "Typography" tab
   - Choose from 13 pre-selected fonts
   - OR enter custom Google Fonts URL
   - Toggle "Use separate heading font" for different heading font
   - Preview with sample text
   - Click "Save Changes" (page will reload to apply fonts)

5. **Configure Identity**:
   - Switch to "Identity" tab
   - Enter company name (required)
   - Add tagline (optional, 200 chars max)
   - Set subdomain (e.g., `acme` → `acme.deskwise.net`)
     - Real-time validation
     - Shows availability status
   - Add custom domain (optional, requires DNS setup)
   - Click "Save Changes"

6. **Setup Email Branding**:
   - Switch to "Email" tab
   - Configure:
     - From name (shown in email headers)
     - Reply-to email address
     - Email header color (matches primary color by default)
     - Logo URL (publicly accessible)
     - Footer text (500 chars max)
   - Preview email template
   - Click "Save Changes"

7. **Preview Changes**:
   - Switch to "Preview" tab
   - See live preview of:
     - Header with logo/company name
     - Sidebar with colors
     - Sample cards with typography
     - Buttons with branding colors
   - Toggle light/dark mode
   - Changes update in real-time

8. **Manage Version History**:
   - Switch to "History" tab
   - View all branding versions
   - See who made changes and when
   - Read change descriptions
   - Rollback to previous version if needed
   - Export branding configuration

#### Managing Branding

**Export Branding**:
1. Go to Settings → Branding → History tab
2. Click "Export Configuration"
3. JSON file downloads: `branding-{orgId}-{timestamp}.json`
4. Save file for backup or sharing

**Import Branding**:
1. Go to Settings → Branding
2. Click "Import" button (top right)
3. Select exported JSON file
4. Confirm import (creates new version)
5. Page reloads with new branding

**Rollback to Previous Version**:
1. Go to Settings → Branding → History tab
2. Find desired version in history table
3. Click "Rollback" button
4. Confirm rollback
5. Page reloads with restored branding

**Reset to Default**:
1. Go to Settings → Branding
2. Click "Reset to Default" button (top right)
3. Confirm reset
4. Branding returns to Deskwise defaults

### For Developers

#### Accessing Branding in Components

```typescript
import { useBranding } from '@/components/providers/BrandingProvider'

function MyComponent() {
  const { branding, isLoading } = useBranding()

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <h1>{branding?.identity.companyName}</h1>
      <img src={`/api/branding/asset/${branding?.logos.primary.light}`} />
    </div>
  )
}
```

#### Generating Branded Emails

```typescript
import { getBrandedEmailWrapper } from '@/lib/utils/branded-email-template'

// Async function
const emailHtml = await getBrandedEmailWrapper(
  '<p>Your ticket has been updated.</p>',
  orgId
)

// Or with branding object
import { generateBrandedEmailHTML } from '@/lib/utils/branded-email-template'

const emailHtml = generateBrandedEmailHTML(
  '<p>Your ticket has been updated.</p>',
  branding
)
```

#### Programmatic Branding Updates

```typescript
import { BrandingService } from '@/lib/services/branding'

// Update colors
const updatedBranding = await BrandingService.updateBranding(
  orgId,
  {
    colors: {
      primary: { h: 220, s: 90, l: 55 }
    }
  },
  userId,
  userName,
  'Updated primary color'
)

// Update company name
const updatedBranding = await BrandingService.updateBranding(
  orgId,
  {
    identity: {
      companyName: 'Acme Corporation'
    }
  },
  userId,
  userName,
  'Changed company name'
)
```

---

## Integration Points

### Header Integration

The MegaMenuHeader component automatically uses branding:

```typescript
// Location: src/components/layout/MegaMenuHeader.tsx

const { branding } = useBranding()

// Logo display logic
const getLogoSrc = () => {
  const isDarkMode = theme === 'dark' || ...

  if (isDarkMode) {
    return branding?.logos?.primary?.dark
      ? `/api/branding/asset/${encodeURIComponent(branding.logos.primary.dark)}`
      : '/deskwise_dark.png'
  } else {
    return branding?.logos?.primary?.light
      ? `/api/branding/asset/${encodeURIComponent(branding.logos.primary.light)}`
      : '/deskwise_light.png'
  }
}

// Company name fallback
{branding?.identity?.companyName || 'Deskwise'}
```

### Email Template Integration

All email templates can use branded wrappers:

```typescript
import { generateBrandedEmailHTML } from '@/lib/utils/branded-email-template'

// In email notification service
const emailContent = `
  <h2>Ticket #${ticketNumber} Updated</h2>
  <p>Your ticket has been updated by ${technicianName}.</p>
  <a href="${ticketUrl}" class="button">View Ticket</a>
`

const brandedEmail = generateBrandedEmailHTML(emailContent, branding)

// Send email
await emailService.sendEmail({
  to: customerEmail,
  from: branding.email.fromName,
  replyTo: branding.email.replyToEmail,
  subject: `Ticket #${ticketNumber} Updated`,
  html: brandedEmail
})
```

### Theme Provider Integration

The BrandingProvider is integrated into the root layout:

```typescript
// Location: src/app/layout.tsx

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SessionProvider>
            <BrandingProvider>
              {children}
            </BrandingProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

CSS variables are automatically injected:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --background: 0 0% 100%;
  --card: 0 0% 100%;
}
```

---

## Best Practices

### Color Selection

1. **Accessibility**: Ensure sufficient contrast ratios (WCAG AA minimum 4.5:1)
2. **Consistency**: Use primary color for all CTAs and interactive elements
3. **Brand Alignment**: Match colors to existing brand guidelines
4. **Dark Mode**: Test colors in both light and dark themes
5. **Email Compatibility**: Avoid very light colors in email headers

### Typography

1. **Readability**: Choose fonts with good readability at small sizes
2. **Loading Time**: Google Fonts may slow initial page load
3. **Font Pairing**: If using heading font, ensure it pairs well with body font
4. **Fallback Fonts**: System fonts are used as fallbacks
5. **License Compliance**: Ensure fonts are licensed for web use

### Logos

1. **Format**: SVG is preferred for scalability
2. **Transparency**: Use PNG with transparency for flexible backgrounds
3. **Sizing**: Upload high-resolution logos (minimum 400px width)
4. **Dark Mode**: Provide dark mode variant if logo doesn't work on dark backgrounds
5. **Favicon**: Use 32x32 or 64x64 ICO/PNG for best browser compatibility

### Subdomain

1. **Branding**: Choose a subdomain that matches your brand
2. **Simplicity**: Keep it short and memorable
3. **Professionalism**: Avoid numbers, hyphens, or slang
4. **Availability**: Check availability before committing to branding
5. **DNS**: For custom domains, ensure DNS records are correctly configured

### Version Management

1. **Change Descriptions**: Always provide clear change descriptions
2. **Testing**: Test changes in preview before saving
3. **Rollback Plan**: Know how to rollback if issues occur
4. **Export Backups**: Export branding before major changes
5. **Communication**: Notify team members of branding changes

---

## Troubleshooting

### Logos Not Displaying

**Issue**: Logos don't show after upload

**Solutions**:
1. Check S3 bucket permissions
2. Verify presigned URL generation
3. Check browser console for 404 errors
4. Ensure S3 keys are correctly stored
5. Refresh the page to reload branding

### Colors Not Applying

**Issue**: Custom colors don't appear on pages

**Solutions**:
1. Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
2. Check BrandingProvider is in app layout
3. Verify CSS variables in DevTools
4. Ensure colors are in valid HSL range
5. Check for cached stylesheets

### Fonts Not Loading

**Issue**: Custom fonts don't apply

**Solutions**:
1. Verify Google Fonts URL is valid
2. Check browser console for font loading errors
3. Ensure Google Fonts URL includes display=swap
4. Clear browser cache
5. Reload page after font changes

### Subdomain Validation Errors

**Issue**: Valid subdomain shows as unavailable

**Solutions**:
1. Check for typos or special characters
2. Ensure subdomain is 3-63 characters
3. Avoid reserved names (www, admin, api, etc.)
4. Check if another organization is using it
5. Contact support if persistent

### Email Branding Not Working

**Issue**: Emails don't show custom branding

**Solutions**:
1. Ensure logo URL is publicly accessible
2. Verify email header color is hex format
3. Check email service is using branded templates
4. Test email preview in branding settings
5. Verify from name and reply-to are configured

### Version Rollback Fails

**Issue**: Cannot rollback to previous version

**Solutions**:
1. Check user has `settings.manage` permission
2. Verify version number exists
3. Check database connection
4. Ensure no concurrent branding updates
5. Review server logs for errors

### Import Fails

**Issue**: Branding import from JSON fails

**Solutions**:
1. Validate JSON structure matches schema
2. Ensure all required fields are present
3. Check file encoding (should be UTF-8)
4. Verify color values are in valid ranges
5. Remove any undefined or null values

---

## Performance Considerations

### Asset Loading

- **CDN**: Consider using a CDN for faster logo delivery
- **Caching**: Presigned URLs are cached for 7 days
- **Compression**: SVG logos should be optimized/compressed
- **Lazy Loading**: Logos load asynchronously via BrandingProvider

### Font Loading

- **Google Fonts**: Adds ~100ms to initial page load
- **Font Display**: Uses `swap` strategy for faster rendering
- **Subsetting**: Consider custom font subsets for performance
- **Caching**: Fonts are cached by browser

### CSS Variables

- **Performance**: Negligible impact on rendering
- **Browser Support**: All modern browsers support CSS variables
- **Fallbacks**: System defaults used if branding fails to load

### Database Queries

- **Branding Fetch**: Cached in React context after initial load
- **Version History**: Limited to 20 versions by default
- **Indexes**: Optimized queries with proper indexes

---

## Security

### Authentication

- All API endpoints require authentication
- Admin-only endpoints check RBAC permissions
- JWT tokens verify user identity

### File Upload

- File type validation (whitelist only)
- File size limit (5MB max)
- Virus scanning recommended (not included)
- S3 server-side encryption (AES256)

### Subdomain Validation

- Regex validation prevents injection
- Reserved names protected
- Uniqueness enforced at database level
- Rate limiting recommended

### Email Security

- Email addresses validated
- HTML sanitization in email content
- SPF/DKIM configuration required
- Reply-to validation

---

## Future Enhancements

### Planned Features

1. **Advanced Color Schemes**:
   - Full color palette with shades
   - Color contrast analyzer
   - Accessibility checker

2. **Custom CSS**:
   - Allow custom CSS injection
   - CSS variable overrides
   - Component-specific styling

3. **Multi-Brand Support**:
   - Multiple brand profiles per org
   - Brand switching for different products
   - Sub-brand management

4. **Enhanced Preview**:
   - Full page preview
   - Mobile preview
   - Email client previews

5. **Automatic DNS**:
   - Automated DNS verification
   - SSL certificate provisioning
   - Domain health monitoring

6. **Brand Guidelines**:
   - Downloadable brand kit
   - Logo usage guidelines
   - Color palette export

7. **Theme Marketplace**:
   - Pre-built themes
   - Community themes
   - Theme installation

8. **Analytics**:
   - Brand consistency score
   - Asset usage tracking
   - Version analytics

---

## Support

For technical support or questions about the white-label branding system:

- **Documentation**: This file
- **API Reference**: See API Endpoints section above
- **Component Examples**: See Frontend Components section
- **Issue Reporting**: [GitHub Issues](https://github.com/your-repo/issues)
- **Email Support**: support@deskwise.com

---

## Changelog

### Version 1.0.0 (January 2025)

**Initial Release**:
- Complete white-label branding system
- Logo upload and management
- Color palette customization
- Typography selection
- Company identity configuration
- Email branding
- Version history and rollback
- Export/import functionality
- Live preview
- Dynamic theme injection
- Email template integration
- Header/sidebar integration

---

## License

Copyright © 2025 Deskwise. All rights reserved.

This white-label branding system is proprietary software included with the Deskwise ITSM platform.
