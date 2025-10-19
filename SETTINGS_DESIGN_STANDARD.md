# Deskwise ITSM Settings Pages Design Standard

> **Version 1.0** | Created: October 2025
> A comprehensive design system for all settings pages in the Deskwise ITSM platform

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Layout System](#layout-system)
3. [Typography Hierarchy](#typography-hierarchy)
4. [Color System](#color-system)
5. [Spacing & Grid](#spacing--grid)
6. [Component Patterns](#component-patterns)
7. [Navigation Patterns](#navigation-patterns)
8. [Page States](#page-states)
9. [Category-Specific Identities](#category-specific-identities)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Implementation Checklist](#implementation-checklist)

---

## Design Principles

### 1. Simplicity Over Complexity
- Reduce cognitive load by presenting one clear action at a time
- Hide advanced features in collapsible sections or secondary dialogs
- Follow Hick's Law: fewer choices = faster decisions

### 2. Predictable Patterns
- Maintain consistent layouts across all settings pages
- Use familiar interaction patterns from established ITSM platforms
- Position common elements (headers, actions, breadcrumbs) in expected locations

### 3. Progressive Disclosure
- Show essential settings first, advanced options second
- Use collapsible sections for complex configurations
- Provide contextual help without cluttering the interface

### 4. Clear Feedback
- Immediate visual feedback for all user actions
- Loading states for async operations
- Success/error toasts positioned consistently (top-right)

### 5. Accessible by Default
- WCAG 2.1 AA compliance minimum
- Keyboard navigation support throughout
- Clear focus states and screen reader support

---

## Layout System

### Master Layout Structure

All settings pages follow this consistent structure:

```
┌─────────────────────────────────────────────────────────────────┐
│ [←] Page Title                                    [Action Btn]   │ ← Header Zone
│ Descriptive subtitle text                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Card Title                         [Secondary Action]     │   │ ← Card Header
│ │ Card description text                                     │   │
│ ├───────────────────────────────────────────────────────────┤   │
│ │                                                           │   │
│ │  Content Area (Tables, Forms, etc.)                      │   │ ← Card Content
│ │                                                           │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Another Section...                                        │   │
│ └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Zones

#### 1. Header Zone (Fixed Position)
- **Height**: Auto (min 96px padding)
- **Background**: Inherits from page background
- **Sticky**: Optional for long pages
- **Padding**: `py-6` (24px vertical)

**Structure:**
```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {/* Back button (if sub-page) */}
      <Link href="/settings">
        <Button variant="outline" size="icon">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
        <p className="text-muted-foreground">
          Clear, concise description of this settings section
        </p>
      </div>
    </div>
    {/* Primary action button */}
    <Button>
      <Icon className="h-4 w-4 mr-2" />
      Action Label
    </Button>
  </div>
  {/* Content sections below */}
</div>
```

#### 2. Content Cards
- **Container**: `<Card>` component from shadcn/ui
- **Spacing**: `space-y-6` between cards (24px)
- **Max Width**: Inherits from parent container (no arbitrary constraints)

**Structure:**
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Section Title</CardTitle>
        <CardDescription>
          What this section configures
        </CardDescription>
      </div>
      {/* Optional: Secondary action */}
      <Button variant="outline" size="sm">
        <Icon className="h-4 w-4 mr-2" />
        Action
      </Button>
    </div>
  </CardHeader>
  <CardContent>
    {/* Tables, forms, or custom content */}
  </CardContent>
</Card>
```

#### 3. Empty States
- **Center-aligned** with icon, heading, and description
- **Vertical padding**: `py-12` (48px)
- **Icon size**: `h-12 w-12` with muted color

```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-muted-foreground/50" />
  <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
  <p className="text-sm text-muted-foreground mt-2">
    Get started by adding your first item
  </p>
  <Button className="mt-4">
    <PlusCircle className="h-4 w-4 mr-2" />
    Add Item
  </Button>
</div>
```

---

## Typography Hierarchy

### Type Scale

Deskwise uses a clear typographic hierarchy optimized for enterprise SaaS applications:

| Element | Class | Font Size | Line Height | Weight | Use Case |
|---------|-------|-----------|-------------|--------|----------|
| Page Title | `text-3xl font-bold tracking-tight` | 30px | 36px | 700 | Main page heading |
| Section Title | `text-2xl font-semibold` | 24px | 32px | 600 | Major sections |
| Card Title | `text-lg font-semibold` | 18px | 28px | 600 | Card headers |
| Subsection | `text-base font-medium` | 16px | 24px | 500 | Subsections |
| Body Text | `text-sm` | 14px | 20px | 400 | Primary content |
| Description | `text-sm text-muted-foreground` | 14px | 20px | 400 | Secondary text |
| Caption | `text-xs text-muted-foreground` | 12px | 16px | 400 | Hints, labels |

### Typography Best Practices

1. **Page Title**: Always use `text-3xl font-bold tracking-tight` for consistency
2. **Descriptions**: Place directly below titles with `text-muted-foreground`
3. **Hierarchy**: Never skip levels (e.g., don't jump from h1 to h3)
4. **Readability**: Maintain 1em minimum spacing between paragraphs
5. **Line Length**: Optimal 60-80 characters per line for body text

### Code Examples

```tsx
{/* Page Header */}
<div>
  <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
  <p className="text-muted-foreground">
    Manage user accounts and permissions
  </p>
</div>

{/* Card Title */}
<CardTitle>Active Users</CardTitle>
<CardDescription>
  View and manage all active users in your organization
</CardDescription>

{/* Form Label */}
<Label htmlFor="email">Email Address</Label>
<p className="text-xs text-muted-foreground mt-1">
  We'll send notifications to this address
</p>
```

---

## Color System

### Semantic Color Usage

Deskwise uses a semantic color system based on HSL values for consistency across light/dark modes:

#### Primary Colors
- **Primary Blue** (`hsl(221.2 83.2% 53.3%)`) - Action buttons, links, focus states
- **Primary Foreground** (`hsl(210 40% 98%)`) - Text on primary backgrounds

#### Status Colors
- **Success/Active**: Use `variant="default"` or custom green badges
- **Warning/Attention**: Use amber/yellow for warnings and alerts
- **Destructive/Error**: Use `variant="destructive"` for dangerous actions
- **Info/Neutral**: Use `variant="secondary"` for informational states

#### Background Colors
- **Card Background** (`--card`) - All card components
- **Muted Background** (`--muted`) - Disabled states, subtle backgrounds
- **Accent Background** (`--accent`) - Hover states, highlighted areas

### Color Application Guidelines

#### Badges
```tsx
{/* Status indicators */}
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Inactive</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Pending</Badge>

{/* Role indicators */}
<Badge variant="destructive">Admin</Badge>
<Badge variant="default">Technician</Badge>
<Badge variant="secondary">User</Badge>
```

#### Buttons
```tsx
{/* Primary actions */}
<Button>Save Changes</Button>

{/* Secondary actions */}
<Button variant="outline">Cancel</Button>
<Button variant="secondary">View Details</Button>

{/* Destructive actions */}
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Dismiss</Button>
```

#### Alert States
```tsx
{/* Information alerts */}
<Card className="border-blue-200 bg-blue-50">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <Info className="h-5 w-5 text-blue-600" />
      <p className="text-sm text-blue-900">Informational message</p>
    </div>
  </CardContent>
</Card>

{/* Warning alerts */}
<Card className="border-amber-200 bg-amber-50">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-600" />
      <p className="text-sm text-amber-900">Warning message</p>
    </div>
  </CardContent>
</Card>

{/* Success alerts */}
<Card className="border-green-200 bg-green-50">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      <p className="text-sm text-green-900">Success message</p>
    </div>
  </CardContent>
</Card>
```

---

## Spacing & Grid

### Spacing Scale

Deskwise follows Tailwind's spacing scale with these common patterns:

| Token | Pixels | Use Case |
|-------|--------|----------|
| `gap-2` | 8px | Icon-to-text spacing |
| `gap-4` | 16px | Related elements |
| `gap-6` | 24px | Section spacing |
| `space-y-2` | 8px | Form field groups |
| `space-y-4` | 16px | Form sections |
| `space-y-6` | 24px | Major page sections |
| `p-4` | 16px | Small card padding |
| `p-6` | 24px | Standard card padding |
| `py-12` | 48px | Empty state padding |

### Grid Layouts

#### Settings Overview Grid
```tsx
{/* 2-column responsive grid */}
<div className="grid gap-6 md:grid-cols-2">
  {settings.map((item) => (
    <Card key={item.id} className="hover:shadow-lg transition-shadow">
      {/* Card content */}
    </Card>
  ))}
</div>
```

#### Form Layouts
```tsx
{/* Two-column form */}
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label>First Name</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Last Name</Label>
    <Input />
  </div>
</div>

{/* Full-width form field */}
<div className="space-y-2">
  <Label>Description</Label>
  <Textarea rows={4} />
</div>
```

### Responsive Breakpoints

- **Mobile**: < 640px - Single column, full-width cards
- **Tablet**: 640px - 1024px - 1-2 columns depending on content
- **Desktop**: > 1024px - 2-3 columns, optimal reading width

---

## Component Patterns

### Tables

Standard table pattern for data display:

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {loading ? (
      <TableRow>
        <TableCell colSpan={3} className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </TableCell>
      </TableRow>
    ) : items.length === 0 ? (
      <TableRow>
        <TableCell colSpan={3} className="text-center text-muted-foreground">
          No items found
        </TableCell>
      </TableRow>
    ) : (
      items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell>
            <Badge variant="default">{item.status}</Badge>
          </TableCell>
          <TableCell className="text-right">
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
      ))
    )}
  </TableBody>
</Table>
```

**Table Best Practices:**
- Use `font-medium` for primary column (usually name/title)
- Right-align action columns with `text-right`
- Group action buttons in a flex container with `gap-2`
- Show loading state within table structure
- Use `text-muted-foreground` for empty states

### Dialogs (Modal Forms)

Standard dialog pattern for create/edit actions:

```tsx
<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {editing ? 'Edit Item' : 'Create Item'}
        </DialogTitle>
        <DialogDescription>
          Clear description of what this form does
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Form fields */}
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Two-column layout for related fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={handleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option1">Option 1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={closeDialog}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Dialog Best Practices:**
- Set `max-w-2xl` for optimal form width
- Use `max-h-[90vh] overflow-y-auto` for scrollable content
- Wrap all content in a `<form>` tag
- Use `space-y-4 py-4` for form field spacing
- Always provide Cancel and Submit buttons in footer
- Show loading state in submit button
- Use required attribute and asterisks for required fields

### Switch Toggles

Pattern for settings toggles:

```tsx
<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label>Feature Name</Label>
    <p className="text-sm text-muted-foreground">
      Clear explanation of what this toggle controls
    </p>
  </div>
  <Switch
    checked={settings.featureEnabled}
    onCheckedChange={(checked) =>
      setSettings({ ...settings, featureEnabled: checked })
    }
  />
</div>
```

### Search Input

Standard search pattern:

```tsx
<div className="mb-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Search items..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-9"
    />
  </div>
</div>
```

### Action Buttons

Consistent button patterns:

```tsx
{/* Primary action with icon */}
<Button>
  <PlusCircle className="h-4 w-4 mr-2" />
  Add Item
</Button>

{/* Loading state */}
<Button disabled={loading}>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Loading...
    </>
  ) : (
    <>
      <Save className="h-4 w-4 mr-2" />
      Save Changes
    </>
  )}
</Button>

{/* Icon-only button */}
<Button variant="ghost" size="icon">
  <MoreVertical className="h-4 w-4" />
</Button>
```

---

## Navigation Patterns

### Breadcrumb Navigation

Use breadcrumbs for deep navigation hierarchies:

```tsx
<nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
  <Link href="/settings" className="hover:text-foreground transition-colors">
    Settings
  </Link>
  <ChevronRight className="h-4 w-4" />
  <span className="text-foreground font-medium">Current Page</span>
</nav>
```

### Back Button Pattern

Always provide a back button on sub-pages:

```tsx
<Link href="/settings">
  <Button variant="outline" size="icon">
    <ArrowLeft className="h-4 w-4" />
  </Button>
</Link>
```

### Tab Navigation

For related settings on a single page:

```tsx
<Tabs defaultValue="general" className="space-y-6">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>

  <TabsContent value="general">
    {/* General settings */}
  </TabsContent>

  <TabsContent value="security">
    {/* Security settings */}
  </TabsContent>
</Tabs>
```

### Settings Hub

The main settings page uses a card grid layout:

```tsx
<div className="grid gap-6 md:grid-cols-2">
  {settingsCategories.map((category) => (
    <Link key={category.href} href={category.href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <category.icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  ))}
</div>
```

---

## Page States

### Loading State

```tsx
{loading ? (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
) : (
  // Content
)}
```

### Empty State

```tsx
<div className="text-center py-12">
  <Icon className="mx-auto h-12 w-12 text-muted-foreground/50" />
  <h3 className="mt-4 text-lg font-semibold">No items yet</h3>
  <p className="text-sm text-muted-foreground mt-2">
    Get started by adding your first item
  </p>
  <Button className="mt-4" onClick={handleCreate}>
    <PlusCircle className="h-4 w-4 mr-2" />
    Add Item
  </Button>
</div>
```

### Error State

```tsx
<Card className="border-red-200 bg-red-50">
  <CardContent className="pt-6">
    <div className="flex items-center gap-3">
      <AlertCircle className="h-5 w-5 text-red-600" />
      <div>
        <p className="font-medium text-red-900">Error loading data</p>
        <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
      </div>
    </div>
    <Button variant="outline" size="sm" className="mt-4" onClick={retry}>
      Try Again
    </Button>
  </CardContent>
</Card>
```

### Success State (Toast)

```tsx
toast({
  title: 'Success',
  description: 'Settings saved successfully',
})
```

### Warning State

```tsx
<Card className="border-amber-200 bg-amber-50">
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <div>
          <h3 className="font-semibold text-amber-900">Warning</h3>
          <p className="text-sm text-amber-700 mt-1">
            This action requires your attention
          </p>
        </div>
      </div>
      <Button size="sm">Take Action</Button>
    </div>
  </CardContent>
</Card>
```

---

## Category-Specific Identities

Each settings category has a unique visual identity while maintaining overall consistency.

### 1. User Management
**Theme**: Team-focused, collaborative
**Icon**: `Users`, `UserPlus`, `Shield`
**Accent Color**: Primary blue (`#5B7FFF`)
**Card Styling**: Clean, professional with clear role badges

```tsx
{/* User Management specific patterns */}
<div className="flex items-center gap-4">
  <div className="p-3 rounded-lg bg-blue-100">
    <Users className="h-6 w-6 text-blue-600" />
  </div>
  <div>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>
      Manage users, roles, and permissions
    </CardDescription>
  </div>
</div>

{/* Role-based badges */}
<Badge variant="destructive">Admin</Badge>
<Badge variant="default">Technician</Badge>
<Badge variant="secondary">User</Badge>
```

### 2. Service Catalog
**Theme**: Service-oriented, catalog-like
**Icon**: `Package`, `Grid3x3`, `Layers`
**Accent Color**: Purple (`#8B5CF6`)
**Card Styling**: Visual cards with service icons and categories

```tsx
{/* Service Catalog specific patterns */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-purple-100">
          <ServiceIcon className="h-5 w-5 text-purple-600" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-base">{service.name}</CardTitle>
          <Badge variant="secondary" className="mt-1">
            {service.category}
          </Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        {service.description}
      </p>
      <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
        <span>{service.estimatedTime}</span>
        <span>{service.popularity} uses</span>
      </div>
    </CardContent>
  </Card>
</div>
```

### 3. Portal Settings
**Theme**: User-facing, welcoming
**Icon**: `Globe`, `Layout`, `Paintbrush`
**Accent Color**: Green (`#10B981`)
**Card Styling**: Settings toggles with clear explanations

```tsx
{/* Portal Settings specific patterns */}
<Card>
  <CardHeader>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-green-100">
        <Globe className="h-6 w-6 text-green-600" />
      </div>
      <div>
        <CardTitle>Portal Configuration</CardTitle>
        <CardDescription>
          Customize the end-user experience
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Multiple toggle settings */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Enable Portal</Label>
        <p className="text-sm text-muted-foreground">
          Allow end-users to access the self-service portal
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} />
    </div>
  </CardContent>
</Card>
```

### 4. Asset Management
**Theme**: Inventory-focused, organized
**Icon**: `Package`, `Tag`, `MapPin`, `Database`
**Accent Color**: Orange (`#F97316`)
**Card Styling**: Structured data tables with color-coded categories

```tsx
{/* Asset Management specific patterns */}
<Card>
  <CardHeader>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-orange-100">
        <Package className="h-6 w-6 text-orange-600" />
      </div>
      <div>
        <CardTitle>Asset Categories</CardTitle>
        <CardDescription>
          Organize assets by type and category
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <span className="font-medium">{category.name}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant="outline">{category.code}</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

### 5. System Settings
**Theme**: Technical, precise
**Icon**: `Settings`, `Cog`, `Server`
**Accent Color**: Gray (`#6B7280`)
**Card Styling**: Dense information with technical accuracy

```tsx
{/* System Settings specific patterns */}
<Card>
  <CardHeader>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-lg bg-gray-100">
        <Settings className="h-6 w-6 text-gray-600" />
      </div>
      <div>
        <CardTitle>System Configuration</CardTitle>
        <CardDescription>
          Advanced technical settings and integrations
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Code-like formatting for technical values */}
    <div className="space-y-2">
      <Label>API Endpoint</Label>
      <Input
        value={endpoint}
        onChange={handleChange}
        className="font-mono text-sm"
      />
    </div>
  </CardContent>
</Card>
```

---

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

#### Color Contrast
- **Minimum ratio**: 4.5:1 for normal text
- **Large text**: 3:1 ratio (18pt+ or 14pt+ bold)
- **UI components**: 3:1 ratio for interactive elements
- **Test with**: Browser DevTools or online contrast checkers

#### Keyboard Navigation
```tsx
{/* Ensure all interactive elements are keyboard accessible */}
<Button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction()
    }
  }}
>
  Action
</Button>

{/* Use proper tabIndex */}
<div tabIndex={0} role="button" onKeyDown={handleKeyDown}>
  Custom Interactive Element
</div>
```

#### Focus States
- All interactive elements must have visible focus indicators
- Default focus ring: `focus:ring-2 focus:ring-ring focus:ring-offset-2`
- Never use `outline-none` without providing alternative focus styling

#### Screen Reader Support
```tsx
{/* Use semantic HTML */}
<nav aria-label="Settings navigation">
  <ul>
    <li><a href="/settings/users">Users</a></li>
  </ul>
</nav>

{/* Provide aria-labels for icon-only buttons */}
<Button variant="ghost" size="icon" aria-label="Edit user">
  <Pencil className="h-4 w-4" />
</Button>

{/* Use aria-live for dynamic content */}
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

{/* Mark required fields */}
<Label htmlFor="email">
  Email Address
  <span className="text-destructive" aria-label="required">*</span>
</Label>
```

#### Form Accessibility
```tsx
<form onSubmit={handleSubmit} noValidate>
  <div className="space-y-2">
    <Label htmlFor="username">Username *</Label>
    <Input
      id="username"
      name="username"
      type="text"
      required
      aria-required="true"
      aria-invalid={errors.username ? "true" : "false"}
      aria-describedby={errors.username ? "username-error" : undefined}
    />
    {errors.username && (
      <p id="username-error" className="text-sm text-destructive">
        {errors.username}
      </p>
    )}
  </div>
</form>
```

#### Loading States
```tsx
{/* Announce loading state to screen readers */}
<Button disabled={loading} aria-busy={loading}>
  {loading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      <span>Saving...</span>
    </>
  ) : (
    <span>Save</span>
  )}
</Button>
```

---

## Implementation Checklist

Use this checklist when creating or updating settings pages:

### Layout & Structure
- [ ] Page follows master layout structure (header + content cards)
- [ ] Back button included on sub-pages
- [ ] Primary action button positioned in header (top-right)
- [ ] Consistent spacing between sections (`space-y-6`)
- [ ] Cards use proper CardHeader and CardContent structure

### Typography
- [ ] Page title uses `text-3xl font-bold tracking-tight`
- [ ] Subtitle uses `text-muted-foreground`
- [ ] Card titles use `CardTitle` component
- [ ] Card descriptions use `CardDescription` component
- [ ] No typography hierarchy skips

### Components
- [ ] Tables include loading, empty, and content states
- [ ] Dialogs have proper header, content, and footer
- [ ] Forms use proper labels and validation
- [ ] Buttons show loading states for async actions
- [ ] Search inputs have icon positioned left
- [ ] Icon size consistent (`h-4 w-4` for buttons)

### Visual Design
- [ ] Icons match category theme
- [ ] Accent color applied consistently
- [ ] Badges use appropriate variants
- [ ] Empty states include icon, heading, and CTA
- [ ] Color contrast meets WCAG AA standards

### States & Feedback
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error handling with user-friendly messages
- [ ] Success toasts on successful actions
- [ ] Confirmation dialogs for destructive actions

### Navigation
- [ ] Breadcrumbs included if nested more than 2 levels
- [ ] Back button works correctly
- [ ] Links have hover states
- [ ] Active states clearly indicated

### Accessibility
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible on all elements
- [ ] Proper ARIA labels on icon-only buttons
- [ ] Form fields have associated labels
- [ ] Error messages linked to form fields
- [ ] Color is not the only indicator of state
- [ ] Loading states announced to screen readers

### Responsive Design
- [ ] Layout adapts to mobile (< 640px)
- [ ] Tables scroll horizontally on small screens
- [ ] Dialogs fit within viewport (`max-h-[90vh]`)
- [ ] Touch targets minimum 44x44px on mobile
- [ ] Grid layouts adjust column count by breakpoint

### Performance
- [ ] Images/icons lazy loaded where applicable
- [ ] Debouncing implemented for search inputs
- [ ] Tables paginated if showing >50 rows
- [ ] Optimistic UI updates where appropriate
- [ ] API calls properly cached/revalidated

### Code Quality
- [ ] TypeScript types defined for all data structures
- [ ] Error boundaries in place for critical sections
- [ ] Console errors/warnings resolved
- [ ] No hard-coded IDs or magic numbers
- [ ] Consistent naming conventions followed

---

## Design Patterns Quick Reference

### Common Patterns at a Glance

```tsx
// ========================================
// PATTERN 1: Basic Settings Page
// ========================================
export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
          <p className="text-muted-foreground">Page description</p>
        </div>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle>Section Title</CardTitle>
          <CardDescription>Section description</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  )
}

// ========================================
// PATTERN 2: Sub-Page with Back Button
// ========================================
export default function SubPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sub Page</h1>
          <p className="text-muted-foreground">Description</p>
        </div>
      </div>
      {/* Rest of content */}
    </div>
  )
}

// ========================================
// PATTERN 3: Data Table with Actions
// ========================================
<Card>
  <CardHeader>
    <CardTitle>Items</CardTitle>
    <CardDescription>{items.length} total items</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Search */}
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" />
      </div>
    </div>

    {/* Table */}
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge variant="default">{item.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>

// ========================================
// PATTERN 4: Settings Form with Toggles
// ========================================
<Card>
  <CardHeader>
    <CardTitle>Configuration</CardTitle>
    <CardDescription>Customize behavior</CardDescription>
  </CardHeader>
  <CardContent className="space-y-6">
    {/* Toggle Row */}
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Feature Name</Label>
        <p className="text-sm text-muted-foreground">
          What this feature does
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={setEnabled} />
    </div>

    {/* Conditional Field */}
    {enabled && (
      <div className="space-y-2">
        <Label htmlFor="option">Related Setting</Label>
        <Input id="option" />
      </div>
    )}
  </CardContent>
</Card>

// ========================================
// PATTERN 5: Create/Edit Dialog
// ========================================
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-2xl">
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{editing ? 'Edit' : 'Create'} Item</DialogTitle>
        <DialogDescription>Fill in the details below</DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" required />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {editing ? 'Update' : 'Create'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

---

## Do's and Don'ts

### Layout

**DO:**
- ✅ Use consistent spacing between all sections (`space-y-6`)
- ✅ Place primary actions in the top-right header area
- ✅ Use Card components to group related settings
- ✅ Provide back navigation on sub-pages

**DON'T:**
- ❌ Use inconsistent spacing (mixing `space-y-4` and `space-y-6`)
- ❌ Place primary actions at the bottom of the page
- ❌ Mix bare content with Card components on the same page
- ❌ Leave users without clear navigation options

### Typography

**DO:**
- ✅ Maintain clear hierarchy (H1 → H2 → H3)
- ✅ Use `text-muted-foreground` for descriptions
- ✅ Keep line lengths between 60-80 characters
- ✅ Use consistent font weights across the app

**DON'T:**
- ❌ Skip heading levels (H1 → H3)
- ❌ Use colors directly for hierarchy (use semantic classes)
- ❌ Create overly long text blocks without breaks
- ❌ Mix font sizes arbitrarily

### Components

**DO:**
- ✅ Show loading states for all async operations
- ✅ Provide empty states with clear CTAs
- ✅ Use appropriate badge variants for status
- ✅ Include icons with consistent sizing (`h-4 w-4`)

**DON'T:**
- ❌ Leave buttons disabled without explanation
- ❌ Show raw error messages to users
- ❌ Use color alone to indicate status
- ❌ Mix icon sizes within the same component

### Forms

**DO:**
- ✅ Mark required fields with asterisks
- ✅ Provide inline validation feedback
- ✅ Group related fields together
- ✅ Show clear success messages after submission

**DON'T:**
- ❌ Submit forms without validation
- ❌ Use vague error messages ("An error occurred")
- ❌ Scatter related fields across different sections
- ❌ Clear form data without confirmation on errors

### Accessibility

**DO:**
- ✅ Ensure all interactive elements are keyboard accessible
- ✅ Provide text alternatives for icon-only buttons
- ✅ Maintain 4.5:1 color contrast minimum
- ✅ Test with screen readers

**DON'T:**
- ❌ Remove focus indicators without alternatives
- ❌ Use color as the only indicator of state
- ❌ Forget to link labels to form inputs
- ❌ Assume everyone uses a mouse

---

## Maintenance & Evolution

### When to Update This Standard

This design standard should be updated when:

1. **New Component Patterns Emerge**: Document new reusable patterns as they're developed
2. **User Feedback Indicates Issues**: Adjust guidelines based on usability testing
3. **Technology Updates**: Update for new versions of Next.js, Tailwind, or shadcn/ui
4. **Accessibility Requirements Change**: Stay current with WCAG updates
5. **Brand Evolution**: Reflect any updates to color palette or typography

### Version History

- **Version 1.0** (October 2025): Initial design standard based on existing patterns and ITSM best practices

---

## Additional Resources

### External References
- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Primitives](https://www.radix-ui.com/)

### Internal Documentation
- See `C:\Users\User\Desktop\Projects\Deskwise\CLAUDE.md` for technical architecture
- See `C:\Users\User\Desktop\Projects\Deskwise\tailwind.config.ts` for color tokens
- See `C:\Users\User\Desktop\Projects\Deskwise\src\components\ui\` for component library

---

**End of Design Standard Document**

*This is a living document. Contributions and improvements are welcome. Please maintain consistency with existing patterns when introducing new components or layouts.*
