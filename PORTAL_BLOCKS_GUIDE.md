# Portal Visual Composer Blocks Guide

**Deskwise ITSM - Complete Documentation for Portal Page Builder**

Version: 1.0
Last Updated: October 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Block Categories](#block-categories)
4. [Container Blocks](#container-blocks)
5. [Content Blocks](#content-blocks)
6. [Data Blocks](#data-blocks)
7. [Form Blocks](#form-blocks)
8. [Widget Blocks](#widget-blocks)
9. [Integration Guide](#integration-guide)
10. [Visibility Guards](#visibility-guards)
11. [Data Binding System](#data-binding-system)
12. [Advanced Topics](#advanced-topics)
13. [Portal Examples](#portal-examples)
14. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

The Deskwise Portal Visual Composer enables you to build self-service portal pages without code. It provides 21 pre-built blocks aligned with ITIL/ITSM best practices for IT service delivery.

**Key Features:**
- Drag-and-drop page building
- ITIL-aligned components (Service Catalog, Incident Status, KB Articles)
- Role-based visibility controls (RBAC integration)
- Dynamic data binding from Deskwise entities
- Responsive design system
- Multi-tenant isolation

### ITIL Alignment

The portal supports core ITIL processes:
- **Service Request Management** - Service Catalog, Request Forms
- **Incident Management** - Incident Status, Announcements
- **Knowledge Management** - KB Article Lists, Search
- **Self-Service** - Ticket Lists, User Profiles

### Best Practices

**Self-Service Portal Design:**
1. **Homepage** - Hero, Icon Grid (quick links), Announcements, Stats
2. **Service Catalog** - Category browsing, search, request forms
3. **Knowledge Base** - Article lists, categories, search
4. **My Services** - Active tickets, incidents, request status
5. **Support** - Contact forms, FAQ, live chat

---

## Architecture

### Component Hierarchy

```
PortalPage
├── BlockInstance[] (tree structure)
│   ├── type: PortalBlockType
│   ├── props: BlockProps
│   ├── children?: BlockInstance[]
│   ├── visibilityGuards?: VisibilityGuard[]
│   └── order: number
├── dataSources?: DataSource[]
├── theme?: PortalTheme
└── layout?: LayoutSettings
```

### Rendering Pipeline

1. **Page Load** - Fetch PortalPage document from MongoDB
2. **Data Loading** - Resolve all DataSource configurations in parallel
3. **Block Rendering** - Recursive rendering via BlockRenderer component
4. **Visibility Evaluation** - Server-side evaluation of visibility guards
5. **Data Binding** - Replace binding expressions with actual data
6. **Client Hydration** - Interactive components become functional

### Multi-Tenancy

All portal pages are organization-scoped (`orgId`). Data sources automatically filter by organization, ensuring complete data isolation between tenants.

---

## Block Categories

### Category Overview

| Category | Blocks | Purpose |
|----------|--------|---------|
| **Container** | 4 blocks | Layout and structure |
| **Content** | 10 blocks | Text, media, and visual elements |
| **Data** | 3 blocks | Dynamic data display from Deskwise |
| **Form** | 1 block | Service request forms |
| **Widget** | 3 blocks | ITSM-specific components |

### Block Type Reference

```typescript
type PortalBlockType =
  // Container Blocks
  | 'container'       // Flexible layout container
  | 'hero'           // Hero banner with background
  | 'card'           // Card container
  | 'card-grid'      // Grid of cards

  // Content Blocks
  | 'heading'        // H1-H6 headings
  | 'paragraph'      // Rich text content
  | 'button'         // Call-to-action button
  | 'image'          // Image display
  | 'video'          // Video embed (YouTube/Vimeo/Custom)
  | 'divider'        // Visual separator
  | 'spacer'         // Vertical spacing
  | 'accordion'      // Collapsible sections
  | 'tabs'           // Tabbed content
  | 'testimonial'    // Customer testimonial

  // Data Blocks
  | 'icon-grid'      // Grid of icons with links
  | 'stats-grid'     // Statistics display
  | 'faq'            // FAQ collapsible list

  // Form Blocks
  | 'form'           // Service catalog request form

  // Widget Blocks
  | 'ticket-list'        // User's tickets
  | 'incident-list'      // Active incidents
  | 'kb-article-list'    // Knowledge base articles
  | 'service-catalog'    // Service catalog grid
  | 'announcement-bar'   // Alert/announcement banner
  | 'custom-html'        // Custom HTML (sanitized)
```

---

## Container Blocks

Container blocks provide layout structure and can contain child blocks.

### Container Block

**Purpose:** Flexible layout container with row/column/grid support.

**Use Cases:**
- Page sections with custom backgrounds
- Multi-column layouts
- Centered content containers

**Properties:**

```typescript
interface ContainerBlockProps {
  layout?: {
    container?: 'fixed' | 'fluid' | 'full'  // Width constraint
    direction?: 'row' | 'column'            // Flex direction
    gap?: number                            // Space between children (px)
    padding?: number                        // Internal padding (px)
    margin?: number                         // External margin (px)
    align?: 'start' | 'center' | 'end' | 'stretch'  // Cross-axis
    justify?: 'start' | 'center' | 'end' | 'between' | 'around'  // Main-axis
  }
  style?: {
    backgroundColor?: string    // Hex color or CSS color
    backgroundImage?: string    // CSS background-image
    borderRadius?: number       // Border radius (px)
    border?: string            // CSS border shorthand
    boxShadow?: string         // CSS box-shadow
    className?: string         // Custom Tailwind classes
  }
}
```

**Configuration Example:**

```json
{
  "type": "container",
  "props": {
    "layout": {
      "container": "fixed",
      "direction": "row",
      "gap": 24,
      "padding": 48,
      "align": "center",
      "justify": "between"
    },
    "style": {
      "backgroundColor": "#f3f4f6",
      "borderRadius": 8
    }
  },
  "children": [...]
}
```

**Best Practices:**
- Use `container: 'fixed'` for standard page width (max-width with auto margins)
- Use `container: 'fluid'` for full width with horizontal padding
- Use `container: 'full'` for edge-to-edge layouts (no padding)
- Set `gap` for consistent spacing between child elements
- Use `direction: 'column'` for vertical stacking

---

### Hero Block

**Purpose:** Large hero banner with background image/color and centered content.

**Use Cases:**
- Homepage hero section
- Page headers
- Feature announcements

**Properties:**

```typescript
interface HeroBlockProps {
  text?: {
    content?: string         // Heading text
    align?: 'left' | 'center' | 'right'
    color?: string          // Text color
  }
  image?: {
    src?: string           // Background image URL
  }
  style?: {
    backgroundColor?: string
    backgroundImage?: string
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "hero",
  "props": {
    "text": {
      "content": "Welcome to IT Support Portal",
      "align": "center",
      "color": "#ffffff"
    },
    "image": {
      "src": "https://example.com/hero-bg.jpg"
    },
    "style": {
      "backgroundColor": "#1f2937"
    }
  },
  "children": [
    {
      "type": "paragraph",
      "props": {
        "text": {
          "content": "Get help anytime, anywhere.",
          "align": "center",
          "color": "#e5e7eb"
        }
      }
    },
    {
      "type": "button",
      "props": {
        "button": {
          "text": "Browse Services",
          "href": "/portal/services",
          "variant": "primary",
          "size": "lg"
        }
      }
    }
  ]
}
```

**ITSM Integration:**
- Hero blocks are ideal for portal homepage
- Include quick action buttons (View Services, Submit Ticket)
- Display current incident status in child blocks

**Best Practices:**
- Keep heading concise (5-10 words)
- Ensure text contrast against background
- Include 1-2 primary CTAs as child buttons
- Minimum height: 400px

---

### Card Block

**Purpose:** Container with border, shadow, and optional image.

**Use Cases:**
- Service cards
- Feature highlights
- KB article previews

**Properties:**

```typescript
interface CardBlockProps {
  card?: {
    title?: string
    description?: string
    image?: string          // Card header image
    href?: string          // Make entire card clickable
    variant?: 'default' | 'bordered' | 'elevated'
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "card",
  "props": {
    "card": {
      "title": "Password Reset",
      "description": "Reset your account password in minutes",
      "image": "/icons/password.svg",
      "href": "/portal/services/password-reset"
    }
  },
  "children": []
}
```

**Best Practices:**
- Use `variant: 'elevated'` for important cards
- Keep titles short (2-5 words)
- Descriptions should be 10-20 words
- Use consistent image aspect ratios

---

### Card Grid Block

**Purpose:** Responsive grid layout for multiple cards.

**Use Cases:**
- Service catalog display
- Feature grids
- Team member cards

**Properties:**

```typescript
interface CardGridBlockProps {
  layout?: {
    gap?: number           // Gap between cards (px)
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "card-grid",
  "props": {
    "layout": {
      "gap": 24
    }
  },
  "children": [
    { "type": "card", "props": {...} },
    { "type": "card", "props": {...} },
    { "type": "card", "props": {...} }
  ]
}
```

**Responsive Behavior:**
- **Mobile (< 768px):** 1 column
- **Tablet (768px - 1024px):** 2 columns
- **Desktop (> 1024px):** 3 columns

**Best Practices:**
- Use 3-6 cards for optimal display
- Keep card content uniform height
- Add hover effects via style.className

---

## Content Blocks

Content blocks display text, media, and visual elements.

### Heading Block

**Purpose:** Display H1-H6 headings with custom styling.

**Properties:**

```typescript
interface HeadingBlockProps {
  text?: {
    content?: string
    level?: 1 | 2 | 3 | 4 | 5 | 6    // H1-H6
    align?: 'left' | 'center' | 'right'
    size?: string                     // CSS font-size
    weight?: string                   // CSS font-weight
    color?: string                    // Text color
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "heading",
  "props": {
    "text": {
      "content": "How can we help you today?",
      "level": 2,
      "align": "center",
      "color": "#1f2937"
    }
  }
}
```

**SEO Considerations:**
- Use only one H1 per page (typically in hero)
- Maintain heading hierarchy (H2 → H3 → H4)
- Include keywords naturally

---

### Paragraph Block

**Purpose:** Rich text content display.

**Properties:**

```typescript
interface ParagraphBlockProps {
  text?: {
    content?: string       // Plain text or HTML
    align?: 'left' | 'center' | 'right'
    size?: string
    weight?: string
    color?: string
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "paragraph",
  "props": {
    "text": {
      "content": "Our IT support team is available 24/7 to assist you with technical issues, password resets, software requests, and more.",
      "align": "left",
      "color": "#6b7280"
    }
  }
}
```

**Best Practices:**
- Keep paragraphs concise (2-3 sentences)
- Use line-height: 1.5 for readability
- Avoid walls of text

---

### Button Block

**Purpose:** Call-to-action button with links.

**Properties:**

```typescript
interface ButtonBlockProps {
  button?: {
    text?: string
    href?: string
    variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
    icon?: string              // Lucide icon name
    openInNewTab?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "button",
  "props": {
    "button": {
      "text": "Submit a Ticket",
      "href": "/portal/tickets/new",
      "variant": "primary",
      "size": "lg",
      "icon": "Ticket"
    }
  }
}
```

**Variant Guide:**
- `primary` - Main action (blue background)
- `secondary` - Secondary action (gray background)
- `outline` - Transparent with border
- `ghost` - Text-only button
- `default` - Standard button

**Best Practices:**
- Limit to 2-3 words
- Use action verbs (Submit, Browse, Download)
- Primary buttons for main actions
- Outline buttons for secondary actions

---

### Image Block

**Purpose:** Display images with responsive sizing.

**Properties:**

```typescript
interface ImageBlockProps {
  image?: {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "image",
  "props": {
    "image": {
      "src": "https://example.com/support-team.jpg",
      "alt": "Our support team",
      "width": 800,
      "height": 600,
      "objectFit": "cover"
    }
  }
}
```

**Best Practices:**
- Always include `alt` text for accessibility
- Use `objectFit: 'cover'` for hero images
- Use `objectFit: 'contain'` for logos
- Optimize images (WebP format, compressed)
- Recommended widths: 800px (content), 1920px (full-width)

---

### Video Block

**Purpose:** Embed YouTube, Vimeo, or custom video players.

**Properties:**

```typescript
interface VideoBlockProps {
  video?: {
    src?: string
    provider?: 'youtube' | 'vimeo' | 'custom'
    autoplay?: boolean
    controls?: boolean
    loop?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "video",
  "props": {
    "video": {
      "src": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "provider": "youtube",
      "autoplay": false,
      "controls": true,
      "loop": false
    }
  }
}
```

**Supported URL Formats:**
- **YouTube:** `https://youtube.com/watch?v=VIDEO_ID` or `https://youtu.be/VIDEO_ID`
- **Vimeo:** `https://vimeo.com/VIDEO_ID`
- **Custom:** Direct video file URL (MP4, WebM)

**Best Practices:**
- Avoid autoplay (poor UX)
- Always enable controls
- Use 16:9 aspect ratio
- Include captions for accessibility

---

### Divider Block

**Purpose:** Visual separator between sections.

**Properties:**

```typescript
interface DividerBlockProps {
  divider?: {
    orientation?: 'horizontal' | 'vertical'
    thickness?: number    // px
    color?: string
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "divider",
  "props": {
    "divider": {
      "orientation": "horizontal",
      "thickness": 1,
      "color": "#e5e7eb"
    }
  }
}
```

---

### Spacer Block

**Purpose:** Add vertical or horizontal whitespace.

**Properties:**

```typescript
interface SpacerBlockProps {
  spacer?: {
    height?: number    // px
    width?: number     // px
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "spacer",
  "props": {
    "spacer": {
      "height": 64
    }
  }
}
```

**Best Practices:**
- Use multiples of 8px (8, 16, 24, 32, 48, 64)
- Prefer layout.gap in containers over spacers
- Use for fine-tuning spacing

---

### Accordion Block

**Purpose:** Collapsible content sections.

**Use Cases:**
- FAQ sections
- Terms & conditions
- Detailed documentation

**Properties:**

```typescript
interface AccordionBlockProps {
  accordion?: {
    items?: Array<{
      title: string
      content: string        // HTML content
      defaultOpen?: boolean
    }>
    allowMultiple?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "accordion",
  "props": {
    "accordion": {
      "items": [
        {
          "title": "How do I reset my password?",
          "content": "<p>Click the 'Forgot Password' link on the login page...</p>",
          "defaultOpen": true
        },
        {
          "title": "How do I request software?",
          "content": "<p>Navigate to Service Catalog > Software Requests...</p>"
        }
      ],
      "allowMultiple": false
    }
  }
}
```

**Best Practices:**
- Keep titles concise (5-10 words)
- Use HTML formatting in content
- Set first item `defaultOpen: true`
- Use for 5+ items to reduce page height

---

### Tabs Block

**Purpose:** Organize content into tabbed interface.

**Use Cases:**
- Service categories
- Multi-step instructions
- Related content sections

**Properties:**

```typescript
interface TabsBlockProps {
  tabs?: {
    items?: Array<{
      label: string
      content: string        // HTML content
      icon?: string         // Lucide icon name
    }>
    defaultTab?: number      // Index of default tab (0-based)
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "tabs",
  "props": {
    "tabs": {
      "items": [
        {
          "label": "Software",
          "content": "<h3>Software Requests</h3><p>Request new software licenses...</p>",
          "icon": "Package"
        },
        {
          "label": "Hardware",
          "content": "<h3>Hardware Requests</h3><p>Request new equipment...</p>",
          "icon": "Laptop"
        }
      ],
      "defaultTab": 0
    }
  }
}
```

**Best Practices:**
- Use 2-5 tabs (not more)
- Keep tab labels short (1-2 words)
- Include icons for visual clarity
- Balance content length across tabs

---

### Testimonial Block

**Purpose:** Display customer/user testimonials.

**Properties:**

```typescript
interface TestimonialBlockProps {
  testimonial?: {
    quote?: string
    author?: string
    role?: string
    avatar?: string        // Image URL
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "testimonial",
  "props": {
    "testimonial": {
      "quote": "The IT support portal has reduced our ticket resolution time by 40%. Highly recommended!",
      "author": "John Smith",
      "role": "IT Manager, Acme Corp",
      "avatar": "https://example.com/avatars/john.jpg"
    }
  }
}
```

**Best Practices:**
- Keep quotes to 2-3 sentences
- Include author name and role
- Use authentic testimonials
- Add avatar for credibility

---

## Data Blocks

Data blocks display dynamic content from Deskwise or external sources.

### Icon Grid Block

**Purpose:** Grid of icons with titles, descriptions, and links.

**Use Cases:**
- Quick links section
- Service categories
- Feature highlights

**Properties:**

```typescript
interface IconGridBlockProps {
  iconGrid?: {
    items?: Array<{
      icon: string           // Lucide icon name
      title: string
      description: string
      href?: string         // Optional link
    }>
    columns?: 2 | 3 | 4
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "icon-grid",
  "props": {
    "iconGrid": {
      "columns": 3,
      "items": [
        {
          "icon": "Ticket",
          "title": "Submit Ticket",
          "description": "Report an issue or request support",
          "href": "/portal/tickets/new"
        },
        {
          "icon": "BookOpen",
          "title": "Knowledge Base",
          "description": "Search our help articles",
          "href": "/portal/kb"
        },
        {
          "icon": "ShoppingCart",
          "title": "Service Catalog",
          "description": "Request services and software",
          "href": "/portal/services"
        }
      ]
    }
  }
}
```

**ITSM Integration:**
- Link to Service Catalog categories
- Link to KB article categories
- Link to ticket submission forms
- Link to incident status page

**Icon Reference:** [Lucide Icons](https://lucide.dev/icons/)

**Best Practices:**
- Use 3-6 items per grid
- Keep descriptions to 5-10 words
- Use consistent icon style
- Ensure all items have hrefs

---

### Stats Grid Block

**Purpose:** Display key metrics and statistics.

**Use Cases:**
- Portal homepage metrics
- SLA performance
- Ticket/incident statistics

**Properties:**

```typescript
interface StatsGridBlockProps {
  stats?: {
    items?: Array<{
      label: string
      value: string | number
      icon?: string              // Lucide icon name
      trend?: 'up' | 'down' | 'neutral'
      trendValue?: string       // e.g., "+12%"
    }>
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "stats-grid",
  "props": {
    "stats": {
      "items": [
        {
          "label": "Open Tickets",
          "value": 23,
          "icon": "Ticket",
          "trend": "down",
          "trendValue": "-15%"
        },
        {
          "label": "Avg. Response Time",
          "value": "2.5 hrs",
          "icon": "Clock",
          "trend": "down",
          "trendValue": "-20%"
        },
        {
          "label": "SLA Met",
          "value": "94%",
          "icon": "TrendingUp",
          "trend": "up",
          "trendValue": "+3%"
        },
        {
          "label": "KB Articles",
          "value": 127,
          "icon": "BookOpen",
          "trend": "up",
          "trendValue": "+8"
        }
      ]
    }
  }
}
```

**Data Binding Example:**

```json
{
  "type": "stats-grid",
  "props": {
    "stats": {
      "items": [
        {
          "label": "Open Tickets",
          "value": "{{tickets.length}}",
          "icon": "Ticket"
        }
      ]
    },
    "bindings": {
      "stats.items[0].value": {
        "sourceId": "myTickets",
        "field": "length",
        "fallback": 0
      }
    }
  }
}
```

**ITSM Integration:**
- Display open ticket count
- Show SLA compliance rate
- Display incident count
- Show KB article count

**Best Practices:**
- Use 4 stats for optimal display
- Keep labels short (2-3 words)
- Use green for positive trends, red for negative
- Update stats via data bindings

---

### FAQ Block

**Purpose:** Frequently Asked Questions with collapsible answers.

**Use Cases:**
- Support page FAQ
- Onboarding guides
- Troubleshooting steps

**Properties:**

```typescript
interface FAQBlockProps {
  faq?: {
    items?: Array<{
      question: string
      answer: string
    }>
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "faq",
  "props": {
    "faq": {
      "items": [
        {
          "question": "How do I reset my password?",
          "answer": "Click 'Forgot Password' on the login page and follow the email instructions."
        },
        {
          "question": "How long does it take to get a response?",
          "answer": "Our standard SLA is 4 hours for normal priority tickets and 1 hour for high priority."
        },
        {
          "question": "Can I track my ticket status?",
          "answer": "Yes! Navigate to 'My Tickets' to view all your tickets and their current status."
        }
      ]
    }
  }
}
```

**Best Practices:**
- Order by most common questions
- Keep questions concise (5-15 words)
- Keep answers concise (1-2 sentences)
- Include links in answers when relevant
- Use 5-10 FAQ items

---

## Form Blocks

### Form Block

**Purpose:** Integrate Service Catalog request forms into portal pages.

**Use Cases:**
- Embedded service request forms
- Custom feedback forms
- Contact forms

**Properties:**

```typescript
interface FormBlockProps {
  form?: {
    serviceId?: string        // Service Catalog Item ID
    title?: string
    description?: string
    submitButtonText?: string
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "form",
  "props": {
    "form": {
      "serviceId": "507f1f77bcf86cd799439011",
      "title": "Password Reset Request",
      "description": "Fill out the form below to reset your password.",
      "submitButtonText": "Submit Request"
    }
  }
}
```

**ITSM Integration:**

The Form block integrates with the Service Catalog form builder system:

1. **Service Selection** - Reference a Service Catalog Item by `_id`
2. **Form Rendering** - Automatically renders the service's form schema
3. **Field Types** - Supports all form field types (text, select, date, etc.)
4. **Validation** - Client-side and server-side validation
5. **Conditional Logic** - Show/hide fields based on other field values
6. **Approval Workflow** - Submits to configured approval workflow
7. **ITIL Mapping** - Maps to Service Request, Incident, or Change

**Form Field Types Supported:**

- Text, Textarea, Number, Email, Phone, URL
- Date, DateTime, Time
- Select, Multi-select, Radio, Checkbox
- Boolean, File Upload
- User Select, Asset Select
- Priority, Impact, Urgency selectors
- Rich Text Editor
- Divider, Heading, Description (layout)

**Example Form Schema Integration:**

```typescript
// Service Catalog Item
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "Password Reset",
  "itilCategory": "service-request",
  "formVersions": [
    {
      "version": 1,
      "schema": {
        "fields": [
          {
            "id": "field_1",
            "type": "text",
            "label": "Username",
            "required": true
          },
          {
            "id": "field_2",
            "type": "email",
            "label": "Email Address",
            "required": true
          }
        ],
        "sections": [
          {
            "id": "section_1",
            "title": "User Information",
            "order": 1
          }
        ]
      }
    }
  ]
}
```

**Best Practices:**
- Create dedicated service catalog items for portal forms
- Use clear, concise field labels
- Include helpful field descriptions
- Set appropriate field validation rules
- Test form submission workflow

---

## Widget Blocks

Widget blocks display dynamic ITSM data from Deskwise.

### Ticket List Block

**Purpose:** Display user's tickets with status and links.

**Use Cases:**
- "My Tickets" page
- Homepage ticket summary
- Department ticket lists

**Properties:**

```typescript
interface TicketListBlockProps {
  list?: {
    dataSource?: string       // Data source ID
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    showPagination?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "ticket-list",
  "props": {
    "list": {
      "dataSource": "myTickets",
      "filters": {
        "status": { "$ne": "closed" }
      },
      "sortBy": "createdAt",
      "sortOrder": "desc",
      "limit": 10
    }
  }
}
```

**Data Source Configuration:**

```json
{
  "id": "myTickets",
  "name": "My Tickets",
  "type": "internal",
  "internal": {
    "entity": "tickets",
    "filters": {
      "onlyMine": true,
      "status": { "$ne": "closed" }
    },
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "limit": 10
  },
  "cache": {
    "enabled": true,
    "ttl": 300
  }
}
```

**ITSM Integration:**
- Automatically filters by requester (current user)
- Displays ticket number, title, status
- Links to ticket detail pages
- Real-time status updates

**Filter Options:**

```typescript
{
  "status": "open" | "new" | "pending" | "resolved" | "closed"
  "priority": "low" | "medium" | "high" | "critical"
  "category": string
  "assignedTo": string  // User ID
  "onlyMine": boolean   // Filter by requesterId
}
```

**Best Practices:**
- Default to showing open/pending tickets only
- Sort by `createdAt` descending (newest first)
- Limit to 10-20 items with pagination
- Enable caching with 5-minute TTL

---

### Incident List Block

**Purpose:** Display active incidents with status and updates.

**Use Cases:**
- System status page
- Homepage incident banner
- Department incident dashboard

**Properties:**

```typescript
interface IncidentListBlockProps {
  list?: {
    dataSource?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    showPagination?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "incident-list",
  "props": {
    "list": {
      "dataSource": "activeIncidents",
      "filters": {
        "status": { "$ne": "resolved" },
        "isPublic": true
      },
      "sortBy": "startedAt",
      "sortOrder": "desc",
      "limit": 5
    }
  }
}
```

**Data Source Configuration:**

```json
{
  "id": "activeIncidents",
  "name": "Active Incidents",
  "type": "internal",
  "internal": {
    "entity": "incidents",
    "filters": {
      "status": { "$ne": "resolved" },
      "isPublic": true
    },
    "sortBy": "severity",
    "sortOrder": "desc",
    "limit": 5
  },
  "cache": {
    "enabled": true,
    "ttl": 60
  }
}
```

**ITSM Integration:**
- Displays only public incidents (not internal)
- Shows incident number, title, severity, status
- Links to incident detail pages
- Color-coded by severity (critical=red, major=orange, minor=yellow)

**Filter Options:**

```typescript
{
  "status": "investigating" | "identified" | "monitoring" | "resolved"
  "severity": "minor" | "major" | "critical"
  "impact": "low" | "medium" | "high"
  "priority": "low" | "medium" | "high" | "critical"
  "isPublic": boolean
  "affectedServices": string[]
}
```

**Best Practices:**
- Show only public incidents on public portal
- Sort by severity (critical first)
- Use short cache TTL (1 minute)
- Display max 5 incidents to avoid alarm

---

### KB Article List Block

**Purpose:** Display knowledge base articles with search and filters.

**Use Cases:**
- Homepage KB section
- Category-specific article lists
- Search results

**Properties:**

```typescript
interface KBArticleListBlockProps {
  list?: {
    dataSource?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    showPagination?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "kb-article-list",
  "props": {
    "list": {
      "dataSource": "popularArticles",
      "filters": {
        "category": "Getting Started"
      },
      "sortBy": "views",
      "sortOrder": "desc",
      "limit": 12
    }
  }
}
```

**Data Source Configuration:**

```json
{
  "id": "popularArticles",
  "name": "Popular Articles",
  "type": "internal",
  "internal": {
    "entity": "kb-articles",
    "filters": {
      "visibility": "public",
      "status": "published",
      "isArchived": false
    },
    "sortBy": "views",
    "sortOrder": "desc",
    "limit": 12
  },
  "cache": {
    "enabled": true,
    "ttl": 600
  }
}
```

**ITSM Integration:**
- Displays article title, excerpt, category, views
- Links to full article pages
- Shows badges for category
- Displays view count

**Filter Options:**

```typescript
{
  "category": string
  "tags": string[]
  "visibility": "internal" | "public"
  "status": "draft" | "published" | "archived"
  "isArchived": boolean
  "publicOnly": boolean
}
```

**Sort Options:**
- `views` - Most viewed articles
- `helpful` - Most helpful articles
- `createdAt` - Newest articles
- `updatedAt` - Recently updated

**Best Practices:**
- Show public articles only on portal
- Sort by views for "Popular Articles"
- Sort by createdAt for "Recent Articles"
- Display 6-12 articles with grid layout
- Cache for 10 minutes

---

### Service Catalog Block

**Purpose:** Display service catalog items in grid layout.

**Use Cases:**
- Service catalog browsing page
- Category-specific service lists
- Homepage featured services

**Properties:**

```typescript
interface ServiceCatalogBlockProps {
  list?: {
    dataSource?: string
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
    showPagination?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "service-catalog",
  "props": {
    "list": {
      "dataSource": "allServices",
      "filters": {
        "category": "Software Requests"
      },
      "sortBy": "popularity",
      "sortOrder": "desc",
      "limit": 12
    }
  }
}
```

**Data Source Configuration:**

```json
{
  "id": "allServices",
  "name": "All Services",
  "type": "internal",
  "internal": {
    "entity": "service-catalog",
    "filters": {
      "isActive": true
    },
    "sortBy": "popularity",
    "sortOrder": "desc",
    "limit": 50
  },
  "cache": {
    "enabled": true,
    "ttl": 600
  }
}
```

**ITSM Integration:**
- Displays service name, description, icon
- Shows estimated time
- Links to service request form
- Role-based filtering (availableFor)
- Category badges

**Filter Options:**

```typescript
{
  "category": string
  "tags": string[]
  "isActive": boolean
  "type": "fixed" | "recurring" | "hourly"
  "itilCategory": "service-request" | "incident" | "problem" | "change"
}
```

**Best Practices:**
- Display 6-12 services per page
- Sort by popularity for discovery
- Use category filters for navigation
- Show service icon for visual identification
- Cache for 10 minutes

---

### Announcement Bar Block

**Purpose:** Display important announcements and alerts.

**Use Cases:**
- System maintenance notices
- Important updates
- Emergency notifications

**Properties:**

```typescript
interface AnnouncementBarBlockProps {
  announcement?: {
    message?: string
    type?: 'info' | 'warning' | 'success' | 'error'
    dismissible?: boolean
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "announcement-bar",
  "props": {
    "announcement": {
      "message": "Scheduled maintenance on Saturday, Oct 14 from 2-4 AM EST. Services may be unavailable.",
      "type": "warning",
      "dismissible": true
    }
  }
}
```

**ITSM Integration:**
- Can be bound to incident data
- Can be scheduled via visibility guards
- Can target specific user roles

**Type Colors:**
- `info` - Blue (informational)
- `warning` - Yellow (caution)
- `success` - Green (positive)
- `error` - Red (critical)

**Advanced Example (Data-Driven):**

```json
{
  "type": "announcement-bar",
  "props": {
    "announcement": {
      "message": "{{activeIncident.title}}",
      "type": "error",
      "dismissible": false
    },
    "bindings": {
      "announcement.message": {
        "sourceId": "criticalIncidents",
        "field": "[0].title",
        "fallback": ""
      }
    }
  },
  "visibilityGuards": [
    {
      "type": "custom",
      "expression": "data.criticalIncidents && data.criticalIncidents.length > 0"
    }
  ]
}
```

**Best Practices:**
- Keep messages concise (1-2 sentences)
- Use appropriate type for severity
- Make critical announcements non-dismissible
- Use visibility guards for scheduling
- Place at top of page

---

### Custom HTML Block

**Purpose:** Insert custom HTML/CSS for advanced use cases.

**⚠️ Security Warning:** Custom HTML is sanitized to prevent XSS attacks. JavaScript is stripped.

**Properties:**

```typescript
interface CustomHTMLBlockProps {
  customHtml?: {
    html?: string
    css?: string
  }
  style?: {
    className?: string
  }
}
```

**Configuration Example:**

```json
{
  "type": "custom-html",
  "props": {
    "customHtml": {
      "html": "<div class='custom-banner'><h2>Special Offer</h2><p>Contact support for details.</p></div>",
      "css": ".custom-banner { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 2rem; border-radius: 8px; }"
    }
  }
}
```

**Security:**
- HTML is sanitized with DOMPurify
- JavaScript is stripped
- Only safe HTML tags allowed
- CSS is scoped to block

**Best Practices:**
- Use only when native blocks insufficient
- Test thoroughly before publishing
- Keep HTML simple and semantic
- Ensure responsive design
- Avoid complex layouts

---

## Integration Guide

### Service Catalog Integration

**Workflow:**

1. **Create Service Catalog Item** (`/settings/service-catalog`)
   - Define service details (name, description, category)
   - Build form schema with form builder
   - Configure approval workflow
   - Set ITIL category (service-request, incident, etc.)

2. **Create Portal Page** (`/admin/portal/pages`)
   - Add Service Catalog Block or Form Block
   - Configure data source for Service Catalog Block
   - Set serviceId for Form Block

3. **Publish Page**
   - Set page status to "published"
   - Set access control (isPublic, allowedRoles)
   - Add to navigation menu

**Example Integration:**

```json
// Page: /portal/services
{
  "title": "Service Catalog",
  "slug": "services",
  "status": "published",
  "isPublic": false,
  "allowedRoles": ["user", "technician", "admin"],
  "blocks": [
    {
      "type": "hero",
      "props": {
        "text": {
          "content": "Service Catalog",
          "align": "center"
        }
      }
    },
    {
      "type": "service-catalog",
      "props": {
        "list": {
          "dataSource": "allServices"
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "allServices",
      "name": "All Services",
      "type": "internal",
      "internal": {
        "entity": "service-catalog",
        "filters": { "isActive": true },
        "sortBy": "popularity",
        "sortOrder": "desc"
      }
    }
  ]
}
```

---

### Ticket/Incident Display

**Use Cases:**
- User dashboard showing their open tickets
- System status page showing active incidents
- Department ticket queues

**Ticket List Example:**

```json
{
  "title": "My Tickets",
  "slug": "my-tickets",
  "status": "published",
  "isPublic": false,
  "blocks": [
    {
      "type": "heading",
      "props": {
        "text": {
          "content": "My Support Tickets",
          "level": 1
        }
      }
    },
    {
      "type": "ticket-list",
      "props": {
        "list": {
          "dataSource": "myTickets"
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "myTickets",
      "name": "My Tickets",
      "type": "internal",
      "internal": {
        "entity": "tickets",
        "filters": {
          "onlyMine": true,
          "status": { "$ne": "closed" }
        },
        "sortBy": "createdAt",
        "sortOrder": "desc",
        "limit": 50
      },
      "cache": {
        "enabled": true,
        "ttl": 300
      }
    }
  ]
}
```

**Incident Status Page Example:**

```json
{
  "title": "System Status",
  "slug": "status",
  "status": "published",
  "isPublic": true,
  "blocks": [
    {
      "type": "announcement-bar",
      "props": {
        "announcement": {
          "message": "All systems operational",
          "type": "success",
          "dismissible": false
        }
      },
      "visibilityGuards": [
        {
          "type": "custom",
          "expression": "!data.activeIncidents || data.activeIncidents.length === 0"
        }
      ]
    },
    {
      "type": "incident-list",
      "props": {
        "list": {
          "dataSource": "activeIncidents"
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "activeIncidents",
      "name": "Active Incidents",
      "type": "internal",
      "internal": {
        "entity": "incidents",
        "filters": {
          "status": { "$ne": "resolved" },
          "isPublic": true
        },
        "sortBy": "severity",
        "sortOrder": "desc"
      },
      "cache": {
        "enabled": true,
        "ttl": 60
      }
    }
  ]
}
```

---

### Knowledge Base Integration

**KB Article List Example:**

```json
{
  "title": "Help Center",
  "slug": "help",
  "status": "published",
  "isPublic": true,
  "blocks": [
    {
      "type": "hero",
      "props": {
        "text": {
          "content": "How can we help you?",
          "align": "center"
        }
      }
    },
    {
      "type": "tabs",
      "props": {
        "tabs": {
          "items": [
            {
              "label": "Getting Started",
              "content": "<div id='getting-started'></div>"
            },
            {
              "label": "Troubleshooting",
              "content": "<div id='troubleshooting'></div>"
            }
          ]
        }
      }
    },
    {
      "type": "kb-article-list",
      "props": {
        "list": {
          "dataSource": "gettingStartedArticles"
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "gettingStartedArticles",
      "name": "Getting Started Articles",
      "type": "internal",
      "internal": {
        "entity": "kb-articles",
        "filters": {
          "category": "Getting Started",
          "visibility": "public",
          "status": "published"
        },
        "sortBy": "views",
        "sortOrder": "desc",
        "limit": 12
      },
      "cache": {
        "enabled": true,
        "ttl": 600
      }
    }
  ]
}
```

---

### User Authentication & Roles

**Authentication States:**
- **Anonymous** - Not logged in (user context is undefined)
- **Authenticated** - Logged in (user context available)

**User Context Structure:**

```typescript
interface UserContext {
  id: string
  email: string
  role: 'admin' | 'technician' | 'user'
  permissions: string[]
}
```

**Page Access Control:**

```json
{
  "isPublic": false,              // Requires authentication
  "allowedRoles": ["technician", "admin"],
  "requiredPermissions": ["tickets.view.all"]
}
```

**Block-Level Access Control:**

Use visibility guards (see section below).

---

## Visibility Guards

Visibility guards control when blocks are displayed based on user authentication, role, permissions, or custom logic.

### Guard Types

```typescript
type VisibilityGuardType =
  | 'authenticated'  // User must be logged in
  | 'role'          // User must have specific role
  | 'permission'    // User must have specific permission
  | 'custom'        // Custom JavaScript expression
```

### Guard Configuration

```typescript
interface VisibilityGuard {
  type: VisibilityGuardType
  roles?: UserRole[]              // For 'role' type
  permissions?: string[]          // For 'permission' type
  expression?: string             // For 'custom' type
  fallbackContent?: string        // HTML to show if guard fails
}
```

---

### Authenticated Guard

**Purpose:** Show block only to logged-in users.

**Example:**

```json
{
  "type": "ticket-list",
  "props": {...},
  "visibilityGuards": [
    {
      "type": "authenticated",
      "fallbackContent": "<p>Please <a href='/login'>log in</a> to view your tickets.</p>"
    }
  ]
}
```

**Use Cases:**
- My Tickets page
- User profile sections
- Personalized content

---

### Role Guard

**Purpose:** Show block only to users with specific roles.

**Example:**

```json
{
  "type": "stats-grid",
  "props": {...},
  "visibilityGuards": [
    {
      "type": "role",
      "roles": ["admin", "technician"],
      "fallbackContent": "<p>This section is only available to administrators and technicians.</p>"
    }
  ]
}
```

**Use Cases:**
- Admin-only content
- Technician dashboards
- Role-specific documentation

---

### Permission Guard

**Purpose:** Show block only to users with specific permissions.

**Example:**

```json
{
  "type": "button",
  "props": {
    "button": {
      "text": "Delete Tickets",
      "href": "/admin/tickets/delete"
    }
  },
  "visibilityGuards": [
    {
      "type": "permission",
      "permissions": ["tickets.delete"],
      "fallbackContent": ""
    }
  ]
}
```

**Common Permissions:**
- `tickets.view.all` - View all tickets
- `tickets.create` - Create tickets
- `tickets.delete` - Delete tickets
- `kb.manage` - Manage KB articles
- `settings.edit` - Edit settings

---

### Custom Guard

**Purpose:** Show block based on custom JavaScript expression.

**⚠️ Security:** Expressions are evaluated server-side in a sandboxed environment.

**Available Variables:**
- `user` - User context (id, email, role, permissions)
- `orgId` - Organization ID
- `data` - Data context from data sources

**Example 1: Show based on data:**

```json
{
  "type": "announcement-bar",
  "props": {
    "announcement": {
      "message": "You have open tickets!",
      "type": "warning"
    }
  },
  "visibilityGuards": [
    {
      "type": "custom",
      "expression": "data.myTickets && data.myTickets.length > 0"
    }
  ]
}
```

**Example 2: Show based on user email:**

```json
{
  "type": "heading",
  "props": {
    "text": {
      "content": "Beta Feature"
    }
  },
  "visibilityGuards": [
    {
      "type": "custom",
      "expression": "user && user.email.endsWith('@betatesters.com')"
    }
  ]
}
```

**Example 3: Show during specific hours:**

```json
{
  "type": "announcement-bar",
  "props": {
    "announcement": {
      "message": "Live chat is currently offline. Please submit a ticket.",
      "type": "info"
    }
  },
  "visibilityGuards": [
    {
      "type": "custom",
      "expression": "new Date().getHours() < 8 || new Date().getHours() >= 18"
    }
  ]
}
```

---

### Multiple Guards (AND Logic)

All guards must pass for block to be visible.

**Example:**

```json
{
  "type": "button",
  "props": {...},
  "visibilityGuards": [
    {
      "type": "authenticated"
    },
    {
      "type": "role",
      "roles": ["admin"]
    },
    {
      "type": "permission",
      "permissions": ["settings.edit"]
    }
  ]
}
```

This block is only visible to authenticated admin users with `settings.edit` permission.

---

## Data Binding System

Data bindings enable dynamic content by connecting block props to data sources.

### Data Source Types

```typescript
type DataSourceType =
  | 'internal'   // Deskwise entities (tickets, incidents, KB articles, etc.)
  | 'external'   // External API calls
  | 'api'        // Same as external
  | 'static'     // Static JSON data
```

---

### Internal Data Sources

**Purpose:** Fetch data from Deskwise database.

**Supported Entities:**
- `tickets` - Support tickets
- `incidents` - System incidents
- `kb-articles` - Knowledge base articles
- `service-catalog` - Service catalog items
- `announcements` - System announcements (future)

**Configuration:**

```typescript
interface InternalDataSource {
  id: string
  name: string
  type: 'internal'
  internal: {
    entity: 'tickets' | 'incidents' | 'kb-articles' | 'service-catalog'
    filters?: Record<string, any>
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    limit?: number
  }
  cache?: {
    enabled: boolean
    ttl: number  // seconds
  }
}
```

**Example:**

```json
{
  "id": "myOpenTickets",
  "name": "My Open Tickets",
  "type": "internal",
  "internal": {
    "entity": "tickets",
    "filters": {
      "onlyMine": true,
      "status": { "$in": ["new", "open", "pending"] }
    },
    "sortBy": "createdAt",
    "sortOrder": "desc",
    "limit": 20
  },
  "cache": {
    "enabled": true,
    "ttl": 300
  }
}
```

**Filter Syntax:**

Filters use MongoDB query syntax:

```typescript
{
  "status": "open"                    // Exact match
  "status": { "$ne": "closed" }       // Not equal
  "status": { "$in": ["open", "pending"] }  // In array
  "priority": { "$gte": "high" }      // Greater than or equal
  "createdAt": { "$gte": "2024-01-01" }  // Date comparison
}
```

**Special Filters:**
- `onlyMine: true` - Filter by current user (tickets)
- `includePrivate: true` - Include private items (incidents)
- `publicOnly: true` - Only public items (KB articles)

---

### External Data Sources

**Purpose:** Fetch data from external APIs.

**Configuration:**

```typescript
interface ExternalDataSource {
  id: string
  name: string
  type: 'external'
  external: {
    url: string
    method: 'GET' | 'POST'
    headers?: Record<string, string>
    body?: Record<string, any>
    transformResponse?: string  // JavaScript expression
  }
  cache?: {
    enabled: boolean
    ttl: number
  }
}
```

**Example:**

```json
{
  "id": "externalStatus",
  "name": "External System Status",
  "type": "external",
  "external": {
    "url": "https://status.example.com/api/v1/status",
    "method": "GET",
    "headers": {
      "Authorization": "Bearer YOUR_API_KEY"
    },
    "transformResponse": "data.services.map(s => ({ name: s.name, status: s.status }))"
  },
  "cache": {
    "enabled": true,
    "ttl": 60
  }
}
```

**Transform Response:**

Use JavaScript expressions to transform API responses:

```javascript
// Original response
{
  "data": {
    "services": [
      { "id": 1, "name": "Email", "status": "operational" },
      { "id": 2, "name": "VPN", "status": "degraded" }
    ]
  }
}

// Transform expression
"data.services.map(s => ({ name: s.name, status: s.status }))"

// Transformed result
[
  { "name": "Email", "status": "operational" },
  { "name": "VPN", "status": "degraded" }
]
```

---

### Static Data Sources

**Purpose:** Provide static JSON data.

**Configuration:**

```typescript
interface StaticDataSource {
  id: string
  name: string
  type: 'static'
  static: {
    data: any
  }
}
```

**Example:**

```json
{
  "id": "quickLinks",
  "name": "Quick Links",
  "type": "static",
  "static": {
    "data": [
      { "title": "Submit Ticket", "href": "/portal/tickets/new", "icon": "Ticket" },
      { "title": "View KB", "href": "/portal/kb", "icon": "BookOpen" },
      { "title": "My Requests", "href": "/portal/my-requests", "icon": "List" }
    ]
  }
}
```

---

### Data Bindings

**Purpose:** Bind data source values to block props.

**Syntax:**

```typescript
interface DataBinding {
  sourceId: string        // Data source ID
  field: string          // Dot-notation path (e.g., 'length', 'items[0].title')
  transform?: string     // JavaScript expression to transform value
  fallback?: any        // Fallback value if binding fails
}
```

**Configuration:**

```json
{
  "type": "stats-grid",
  "props": {
    "stats": {
      "items": [
        {
          "label": "Open Tickets",
          "value": 0  // Default value
        }
      ]
    },
    "bindings": {
      "stats.items[0].value": {
        "sourceId": "myTickets",
        "field": "length",
        "fallback": 0
      }
    }
  }
}
```

**Field Path Examples:**

```typescript
"length"                 // Array length
"[0]"                   // First array item
"[0].title"             // First item's title property
"user.firstName"        // Nested object property
"tickets[3].status"     // Array index with property
```

**Transform Examples:**

```json
{
  "sourceId": "myTickets",
  "field": "length",
  "transform": "value > 0 ? value : 'None'"
}
```

```json
{
  "sourceId": "incidents",
  "field": "[0].startedAt",
  "transform": "new Date(value).toLocaleDateString()"
}
```

**Multiple Bindings:**

```json
{
  "type": "heading",
  "props": {
    "text": {
      "content": "Welcome, {{user.firstName}}!"
    },
    "bindings": {
      "text.content": {
        "sourceId": "currentUser",
        "field": "firstName",
        "transform": "'Welcome, ' + value + '!'",
        "fallback": "Welcome!"
      }
    }
  }
}
```

---

### Caching Strategy

**Cache Configuration:**

```typescript
interface CacheConfig {
  enabled: boolean
  ttl: number  // Time-to-live in seconds
}
```

**Recommended TTL Values:**

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Tickets | 300s (5 min) | Moderate update frequency |
| Incidents | 60s (1 min) | High priority, frequent updates |
| KB Articles | 600s (10 min) | Infrequent updates |
| Service Catalog | 600s (10 min) | Infrequent updates |
| External APIs | 60-300s | Depends on API rate limits |
| Static Data | N/A | No expiration needed |

**Cache Invalidation:**

```typescript
// Clear specific data source cache
DataLoader.clearCache('myTickets')

// Clear all cache
DataLoader.clearCache()
```

---

## Advanced Topics

### Custom Data Sources

**Creating Custom Internal Entity Loaders:**

To add support for custom entities, extend `DataLoader` class in `src/lib/portal/renderer/dataLoader.ts`:

```typescript
// Add new entity type
export type InternalEntity =
  | 'tickets'
  | 'incidents'
  | 'kb-articles'
  | 'service-catalog'
  | 'my-custom-entity'  // Add here

// Add loader method
private async loadCustomEntity(
  filters: Record<string, any>,
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  limit = 50
): Promise<any[]> {
  const client = await clientPromise
  const db = client.db('deskwise')

  const query: any = { orgId: this.orgId, ...filters }

  const sort: any = {}
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1
  } else {
    sort.createdAt = -1
  }

  const items = await db.collection('my_custom_collection')
    .find(query)
    .sort(sort)
    .limit(limit)
    .toArray()

  return items
}

// Register in loadInternalDataSource
case 'my-custom-entity':
  return await this.loadCustomEntity(filters, sortBy, sortOrder as 'asc' | 'desc', limit)
```

---

### Theme Customization

**Portal Theme Structure:**

```typescript
interface PortalTheme {
  name: string
  description?: string
  isDefault: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    // ... full design tokens
  }
  typography: {
    fontFamily: string
    headingFontFamily?: string
    fontSize: { ... }
    fontWeight: { ... }
    lineHeight: { ... }
  }
  spacing: { ... }
  borderRadius: { ... }
  shadows: { ... }
  customCss?: string
}
```

**Page-Level Theme Overrides:**

```json
{
  "themeId": "507f1f77bcf86cd799439011",
  "themeOverrides": {
    "colors": {
      "primary": "#3b82f6",
      "secondary": "#8b5cf6"
    },
    "customCss": ".portal-hero { min-height: 600px; }"
  }
}
```

---

### Performance Optimization

**Best Practices:**

1. **Enable Caching:**
   - Use appropriate TTL for each data source
   - Cache static and slowly-changing data

2. **Limit Data Fetching:**
   - Set `limit` on data sources (default: 50)
   - Use pagination for large datasets
   - Avoid fetching all records

3. **Parallel Data Loading:**
   - Data sources load in parallel automatically
   - Keep data sources independent

4. **Optimize Images:**
   - Use WebP format
   - Compress images before upload
   - Use Next.js Image component
   - Serve from CDN

5. **Minimize Blocks:**
   - Use 10-20 blocks per page
   - Avoid deep nesting (3 levels max)
   - Combine similar content

6. **Database Indexes:**
   - Ensure MongoDB indexes on frequently queried fields
   - Index: `orgId`, `status`, `createdAt`, `category`

---

### SEO Considerations

**Page SEO Configuration:**

```json
{
  "title": "IT Support Portal",
  "slug": "support",
  "seo": {
    "title": "IT Support Portal - Get Help Now",
    "description": "24/7 IT support for all your technical needs. Submit tickets, browse knowledge base, and request services.",
    "keywords": ["IT support", "help desk", "technical support"],
    "ogImage": "https://example.com/og-image.jpg",
    "canonicalUrl": "https://portal.example.com/support",
    "noIndex": false,
    "noFollow": false
  }
}
```

**SEO Best Practices:**

1. **Unique Titles:** Each page has unique title (50-60 chars)
2. **Meta Descriptions:** 150-160 characters, include keywords
3. **Heading Hierarchy:** One H1, proper H2-H6 structure
4. **Alt Text:** All images have descriptive alt text
5. **Semantic HTML:** Use proper HTML5 elements
6. **Internal Links:** Link between portal pages
7. **Mobile-Friendly:** All blocks are responsive
8. **Page Speed:** Optimize images, enable caching

---

### Multi-Tenant Considerations

**Organization Isolation:**

All data is automatically filtered by `orgId`:

```typescript
// Data loader automatically adds orgId to queries
const query: any = { orgId: this.orgId, ...filters }
```

**User Context:**

User context includes organization:

```typescript
interface UserContext {
  id: string
  email: string
  role: UserRole
  permissions: string[]
  orgId: string  // Organization ID
}
```

**Shared Portal Pages:**

Portal pages are organization-scoped. Each organization has its own pages.

**Theme Inheritance:**

Themes can be set at organization level or page level.

---

## Portal Examples

### Example 1: IT Support Portal Homepage

**Purpose:** Homepage for internal IT support portal with quick links, stats, and announcements.

**Page Structure:**
- Hero with welcome message
- Announcement bar (if incidents)
- Stats grid (tickets, SLA, KB articles)
- Icon grid (quick links)
- Service catalog preview
- FAQ section

**JSON Configuration:**

```json
{
  "title": "IT Support Portal",
  "slug": "home",
  "status": "published",
  "isPublic": false,
  "allowedRoles": ["user", "technician", "admin"],
  "isHomePage": true,
  "blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "order": 1,
      "props": {
        "text": {
          "content": "Welcome to IT Support",
          "align": "center",
          "color": "#ffffff"
        },
        "style": {
          "backgroundColor": "#1f2937",
          "backgroundImage": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }
      },
      "children": [
        {
          "id": "hero-subtitle",
          "type": "paragraph",
          "order": 1,
          "props": {
            "text": {
              "content": "Get help anytime, anywhere. We're here for you 24/7.",
              "align": "center",
              "color": "#e5e7eb"
            }
          }
        },
        {
          "id": "hero-cta",
          "type": "button",
          "order": 2,
          "props": {
            "button": {
              "text": "Submit a Ticket",
              "href": "/portal/tickets/new",
              "variant": "primary",
              "size": "lg"
            }
          }
        }
      ]
    },
    {
      "id": "announcement",
      "type": "announcement-bar",
      "order": 2,
      "props": {
        "announcement": {
          "message": "Active Incident: Email service degraded. We are working on a fix.",
          "type": "warning",
          "dismissible": false
        },
        "bindings": {
          "announcement.message": {
            "sourceId": "criticalIncidents",
            "field": "[0].title",
            "fallback": ""
          }
        }
      },
      "visibilityGuards": [
        {
          "type": "custom",
          "expression": "data.criticalIncidents && data.criticalIncidents.length > 0"
        }
      ]
    },
    {
      "id": "stats",
      "type": "stats-grid",
      "order": 3,
      "props": {
        "stats": {
          "items": [
            {
              "label": "Open Tickets",
              "value": "0",
              "icon": "Ticket"
            },
            {
              "label": "Avg Response Time",
              "value": "2.5 hrs",
              "icon": "Clock"
            },
            {
              "label": "SLA Compliance",
              "value": "94%",
              "icon": "TrendingUp",
              "trend": "up",
              "trendValue": "+3%"
            },
            {
              "label": "KB Articles",
              "value": "127",
              "icon": "BookOpen"
            }
          ]
        },
        "bindings": {
          "stats.items[0].value": {
            "sourceId": "openTickets",
            "field": "length",
            "transform": "String(value)",
            "fallback": "0"
          }
        }
      }
    },
    {
      "id": "spacer-1",
      "type": "spacer",
      "order": 4,
      "props": {
        "spacer": { "height": 48 }
      }
    },
    {
      "id": "section-heading",
      "type": "heading",
      "order": 5,
      "props": {
        "text": {
          "content": "How can we help you today?",
          "level": 2,
          "align": "center"
        }
      }
    },
    {
      "id": "quick-links",
      "type": "icon-grid",
      "order": 6,
      "props": {
        "iconGrid": {
          "columns": 3,
          "items": [
            {
              "icon": "Ticket",
              "title": "Submit Ticket",
              "description": "Report an issue or request support",
              "href": "/portal/tickets/new"
            },
            {
              "icon": "BookOpen",
              "title": "Knowledge Base",
              "description": "Search our help articles",
              "href": "/portal/kb"
            },
            {
              "icon": "ShoppingCart",
              "title": "Service Catalog",
              "description": "Request services and software",
              "href": "/portal/services"
            },
            {
              "icon": "Calendar",
              "title": "Schedule Appointment",
              "description": "Book a time with support",
              "href": "/portal/schedule"
            },
            {
              "icon": "MessageSquare",
              "title": "Live Chat",
              "description": "Chat with a technician",
              "href": "/portal/chat"
            },
            {
              "icon": "Activity",
              "title": "System Status",
              "description": "View current incidents",
              "href": "/portal/status"
            }
          ]
        }
      }
    },
    {
      "id": "spacer-2",
      "type": "spacer",
      "order": 7,
      "props": {
        "spacer": { "height": 64 }
      }
    },
    {
      "id": "services-heading",
      "type": "heading",
      "order": 8,
      "props": {
        "text": {
          "content": "Popular Services",
          "level": 2,
          "align": "center"
        }
      }
    },
    {
      "id": "services",
      "type": "service-catalog",
      "order": 9,
      "props": {
        "list": {
          "dataSource": "popularServices"
        }
      }
    },
    {
      "id": "spacer-3",
      "type": "spacer",
      "order": 10,
      "props": {
        "spacer": { "height": 64 }
      }
    },
    {
      "id": "faq-heading",
      "type": "heading",
      "order": 11,
      "props": {
        "text": {
          "content": "Frequently Asked Questions",
          "level": 2,
          "align": "center"
        }
      }
    },
    {
      "id": "faq",
      "type": "faq",
      "order": 12,
      "props": {
        "faq": {
          "items": [
            {
              "question": "How do I reset my password?",
              "answer": "Click the 'Forgot Password' link on the login page and follow the email instructions."
            },
            {
              "question": "How long does it take to get a response?",
              "answer": "Our standard SLA is 4 hours for normal priority tickets and 1 hour for high priority."
            },
            {
              "question": "Can I track my ticket status?",
              "answer": "Yes! Navigate to 'My Tickets' to view all your tickets and their current status."
            },
            {
              "question": "How do I request new software?",
              "answer": "Go to Service Catalog > Software Requests and submit a request form."
            }
          ]
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "openTickets",
      "name": "Open Tickets",
      "type": "internal",
      "internal": {
        "entity": "tickets",
        "filters": {
          "status": { "$in": ["new", "open", "pending"] }
        },
        "limit": 1000
      },
      "cache": {
        "enabled": true,
        "ttl": 300
      }
    },
    {
      "id": "criticalIncidents",
      "name": "Critical Incidents",
      "type": "internal",
      "internal": {
        "entity": "incidents",
        "filters": {
          "status": { "$ne": "resolved" },
          "severity": "critical",
          "isPublic": true
        },
        "sortBy": "startedAt",
        "sortOrder": "desc",
        "limit": 1
      },
      "cache": {
        "enabled": true,
        "ttl": 60
      }
    },
    {
      "id": "popularServices",
      "name": "Popular Services",
      "type": "internal",
      "internal": {
        "entity": "service-catalog",
        "filters": {
          "isActive": true
        },
        "sortBy": "popularity",
        "sortOrder": "desc",
        "limit": 6
      },
      "cache": {
        "enabled": true,
        "ttl": 600
      }
    }
  ]
}
```

---

### Example 2: HR Self-Service Portal

**Purpose:** Portal for HR-related requests (PTO, benefits, onboarding).

**Page Structure:**
- Hero with HR branding
- Icon grid (PTO request, benefits, payroll)
- Form block (PTO request)
- KB articles (HR policies)

**JSON Configuration:**

```json
{
  "title": "HR Self-Service",
  "slug": "hr",
  "status": "published",
  "isPublic": false,
  "allowedRoles": ["user", "admin"],
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "order": 1,
      "props": {
        "text": {
          "content": "Human Resources Portal",
          "align": "center",
          "color": "#ffffff"
        },
        "style": {
          "backgroundColor": "#059669"
        }
      }
    },
    {
      "id": "quick-actions",
      "type": "icon-grid",
      "order": 2,
      "props": {
        "iconGrid": {
          "columns": 4,
          "items": [
            {
              "icon": "Calendar",
              "title": "Request PTO",
              "description": "Submit time off request",
              "href": "/portal/hr/pto"
            },
            {
              "icon": "Heart",
              "title": "Benefits",
              "description": "View and manage benefits",
              "href": "/portal/hr/benefits"
            },
            {
              "icon": "DollarSign",
              "title": "Payroll",
              "description": "View pay stubs and W-2",
              "href": "/portal/hr/payroll"
            },
            {
              "icon": "FileText",
              "title": "Policies",
              "description": "Company policies and procedures",
              "href": "/portal/hr/policies"
            }
          ]
        }
      }
    },
    {
      "id": "spacer",
      "type": "spacer",
      "order": 3,
      "props": {
        "spacer": { "height": 64 }
      }
    },
    {
      "id": "pto-form-heading",
      "type": "heading",
      "order": 4,
      "props": {
        "text": {
          "content": "Request Time Off",
          "level": 2
        }
      }
    },
    {
      "id": "pto-form",
      "type": "form",
      "order": 5,
      "props": {
        "form": {
          "serviceId": "507f1f77bcf86cd799439011",
          "title": "PTO Request Form",
          "description": "Submit your time off request for manager approval.",
          "submitButtonText": "Submit Request"
        }
      }
    },
    {
      "id": "spacer-2",
      "type": "spacer",
      "order": 6,
      "props": {
        "spacer": { "height": 64 }
      }
    },
    {
      "id": "policies-heading",
      "type": "heading",
      "order": 7,
      "props": {
        "text": {
          "content": "HR Policies & Resources",
          "level": 2
        }
      }
    },
    {
      "id": "policies-articles",
      "type": "kb-article-list",
      "order": 8,
      "props": {
        "list": {
          "dataSource": "hrArticles"
        }
      }
    }
  ],
  "dataSources": [
    {
      "id": "hrArticles",
      "name": "HR Articles",
      "type": "internal",
      "internal": {
        "entity": "kb-articles",
        "filters": {
          "category": "HR Policies",
          "visibility": "internal",
          "status": "published"
        },
        "sortBy": "updatedAt",
        "sortOrder": "desc",
        "limit": 12
      },
      "cache": {
        "enabled": true,
        "ttl": 600
      }
    }
  ]
}
```

---

### Example 3: Department-Specific Portal

**Purpose:** Engineering team portal with team-specific resources.

**Features:**
- Role-based visibility (technicians and admins only)
- Custom data sources (external API for CI/CD status)
- Tabs for different sections

**JSON Configuration:**

```json
{
  "title": "Engineering Portal",
  "slug": "engineering",
  "status": "published",
  "isPublic": false,
  "allowedRoles": ["technician", "admin"],
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "order": 1,
      "props": {
        "text": {
          "content": "Engineering Team Hub",
          "align": "center",
          "color": "#ffffff"
        },
        "style": {
          "backgroundColor": "#3b82f6"
        }
      }
    },
    {
      "id": "stats",
      "type": "stats-grid",
      "order": 2,
      "props": {
        "stats": {
          "items": [
            {
              "label": "Open Tickets",
              "value": "0",
              "icon": "Ticket"
            },
            {
              "label": "Active Changes",
              "value": "3",
              "icon": "GitBranch"
            },
            {
              "label": "Build Status",
              "value": "Passing",
              "icon": "CheckCircle"
            },
            {
              "label": "Uptime",
              "value": "99.9%",
              "icon": "Activity"
            }
          ]
        }
      }
    },
    {
      "id": "spacer",
      "type": "spacer",
      "order": 3,
      "props": {
        "spacer": { "height": 48 }
      }
    },
    {
      "id": "tabs",
      "type": "tabs",
      "order": 4,
      "props": {
        "tabs": {
          "items": [
            {
              "label": "Quick Links",
              "icon": "Link",
              "content": "<div id='quick-links'></div>"
            },
            {
              "label": "Documentation",
              "icon": "BookOpen",
              "content": "<div id='documentation'></div>"
            },
            {
              "label": "Tools",
              "icon": "Tool",
              "content": "<div id='tools'></div>"
            }
          ],
          "defaultTab": 0
        }
      }
    },
    {
      "id": "quick-links-grid",
      "type": "icon-grid",
      "order": 5,
      "props": {
        "iconGrid": {
          "columns": 3,
          "items": [
            {
              "icon": "Github",
              "title": "GitHub",
              "description": "Source code repositories",
              "href": "https://github.com/company"
            },
            {
              "icon": "Trello",
              "title": "Project Board",
              "description": "Sprint planning and tasks",
              "href": "https://trello.com/company"
            },
            {
              "icon": "Slack",
              "title": "Team Chat",
              "description": "Engineering Slack channel",
              "href": "https://company.slack.com/channels/engineering"
            },
            {
              "icon": "Server",
              "title": "Server Admin",
              "description": "Infrastructure management",
              "href": "/portal/infrastructure"
            },
            {
              "icon": "Database",
              "title": "Database Tools",
              "description": "DB admin and monitoring",
              "href": "/portal/database"
            },
            {
              "icon": "Shield",
              "title": "Security Center",
              "description": "Security tools and reports",
              "href": "/portal/security"
            }
          ]
        }
      }
    }
  ],
  "dataSources": []
}
```

---

## Troubleshooting

### Common Issues

#### 1. Block Not Rendering

**Symptoms:** Block doesn't appear on page.

**Causes & Solutions:**

- **Visibility Guard Failure:**
  - Check user role matches `allowedRoles`
  - Check user has required permissions
  - Check custom expression syntax
  - View console for guard evaluation errors

- **Missing Required Props:**
  - Check block requires specific props (e.g., Form block needs `serviceId`)
  - Validate prop structure matches interface

- **Invalid Data Binding:**
  - Check data source ID exists in `dataSources`
  - Verify data source returns data
  - Check field path is correct
  - Use fallback values

#### 2. Data Not Loading

**Symptoms:** Empty data lists, "No items found" messages.

**Causes & Solutions:**

- **Data Source Configuration:**
  - Verify data source type is correct
  - Check filters syntax (MongoDB query format)
  - Verify entity name is correct
  - Check organization has data

- **Cache Issues:**
  - Clear cache: `DataLoader.clearCache()`
  - Reduce TTL for testing
  - Check cache statistics

- **Multi-Tenant Filter:**
  - Ensure data has correct `orgId`
  - Verify session `orgId` matches data

#### 3. Data Binding Not Updating

**Symptoms:** Block shows default value instead of bound data.

**Causes & Solutions:**

- **Binding Configuration:**
  - Check `sourceId` matches data source ID
  - Verify `field` path is correct (use array notation for indexes)
  - Test field path: `data.sourceId.field`
  - Use fallback value for debugging

- **Data Source Returns Null:**
  - Check data source query returns results
  - Verify filters don't exclude all data
  - Check cache expiration

- **Transform Error:**
  - Check transform expression syntax
  - Test transform in browser console
  - Remove transform to isolate issue

#### 4. Permission Errors

**Symptoms:** "Insufficient permissions" or 403 errors.

**Causes & Solutions:**

- **Page Access Control:**
  - Check page `isPublic` setting
  - Verify user role in `allowedRoles`
  - Check `requiredPermissions`

- **Block Visibility:**
  - Review visibility guards
  - Check RBAC permissions
  - Verify user session includes permissions

- **API Access:**
  - Check API route requires authentication
  - Verify user has permission for data entity

#### 5. Styling Issues

**Symptoms:** Block looks incorrect, layout broken.

**Causes & Solutions:**

- **Container Layout:**
  - Check container `direction` (row vs. column)
  - Verify `gap` and `padding` values
  - Ensure no negative values

- **Responsive Design:**
  - Test on different screen sizes
  - Check mobile layout (< 768px)
  - Verify grid column counts

- **Custom CSS:**
  - Check `style.className` for typos
  - Verify Tailwind classes are correct
  - Check theme custom CSS

- **Theme Overrides:**
  - Verify theme ID is correct
  - Check theme overrides syntax
  - Test with default theme

---

### Debugging Tools

#### Browser Console

Check console for errors:

```javascript
// Visibility guard evaluation
[WebRTC] Visibility guard failed: User role 'user' not in allowed roles: admin, technician

// Data binding errors
[Portal] Failed to resolve binding for stats.items[0].value: Field not found

// Data source errors
[DataLoader] Failed to load data source myTickets: Invalid filter syntax
```

#### Network Tab

Monitor API requests:

```
GET /api/portal/pages/home
GET /api/portal/data-sources/myTickets
GET /api/tickets?orgId=...&onlyMine=true
```

#### React DevTools

Inspect component props:

- Check `BlockRenderer` props
- Verify `resolvedProps` after data binding
- Inspect `dataContext` object

---

### Best Practices for Debugging

1. **Start Simple:**
   - Remove visibility guards temporarily
   - Remove data bindings temporarily
   - Use static data sources

2. **Test Incrementally:**
   - Add one block at a time
   - Test each block before adding more
   - Verify data sources individually

3. **Use Fallback Values:**
   - Always provide fallback in data bindings
   - Use default values in props

4. **Check Logs:**
   - Server console for data loader errors
   - Browser console for client errors
   - MongoDB logs for query errors

5. **Validate Data:**
   - Test MongoDB queries in MongoDB Compass
   - Test external APIs in Postman
   - Verify data structure matches expectations

---

### Performance Issues

**Symptoms:** Slow page load, high memory usage.

**Solutions:**

1. **Reduce Data Fetching:**
   - Lower `limit` values
   - Enable caching
   - Remove unnecessary data sources

2. **Optimize Images:**
   - Compress images
   - Use appropriate sizes
   - Enable lazy loading

3. **Simplify Page:**
   - Reduce block count
   - Avoid deep nesting
   - Combine similar blocks

4. **Database Optimization:**
   - Add MongoDB indexes
   - Optimize filters
   - Use projection to limit fields

---

## Summary

This guide covers all 21 portal blocks available in Deskwise ITSM, including:

- **4 Container Blocks** - Layout structure
- **10 Content Blocks** - Text, media, visual elements
- **3 Data Blocks** - Dynamic content display
- **1 Form Block** - Service request forms
- **3 Widget Blocks** - ITSM-specific components

**Key Features:**
- Drag-and-drop visual composer
- ITIL/ITSM alignment
- Role-based visibility controls (RBAC)
- Dynamic data binding system
- Multi-tenant isolation
- Responsive design
- Performance optimization

**Next Steps:**
1. Review portal examples
2. Create test pages in composer
3. Configure data sources
4. Test visibility guards
5. Optimize performance
6. Deploy to production

**Documentation References:**
- RBAC System: `RBAC_SETUP_GUIDE.md`
- Service Catalog: `SERVICE_CATALOG_GUIDE.md`
- Component Library: `src/components/ui/`
- Block Implementations: `src/lib/portal/renderer/blocks/`

**Support:**
- GitHub Issues: Report bugs and feature requests
- Documentation: `/docs/portal-builder`
- Community Forum: Share templates and best practices

---

*Last Updated: October 2025*
*Version: 1.0*
*Deskwise ITSM - Portal Visual Composer*
