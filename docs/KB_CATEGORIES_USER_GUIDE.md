# Knowledge Base Categories User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Understanding Categories](#understanding-categories)
3. [Viewing Categories](#viewing-categories)
4. [Creating Articles](#creating-articles)
5. [Managing Categories](#managing-categories)
6. [Category Permissions](#category-permissions)
7. [Best Practices](#best-practices)
8. [Common Tasks](#common-tasks)
9. [FAQ](#faq)

---

## Introduction

Welcome to the Deskwise Knowledge Base Categories system! This guide will help you organize, find, and manage knowledge base articles effectively using our hierarchical category structure.

### What Are Categories?

Categories are organizational containers that help group related articles together. Think of them as folders in a file system - they can contain articles and even other categories (subcategories).

### Key Features

- **Hierarchical Structure**: Nest categories inside other categories (e.g., IT Support > Windows > Drivers)
- **Visual Identification**: Each category can have a custom icon and color
- **Access Control**: Control who can view or contribute to specific categories
- **Easy Navigation**: Browse articles by category or use the category tree
- **Search Filtering**: Filter search results by category

---

## Understanding Categories

### Category Structure

```
Category Hierarchy Example:

IT Support (Root Category)
├── Windows Troubleshooting
│   ├── Driver Issues
│   ├── Printer Setup
│   └── Network Configuration
├── macOS Support
│   ├── Software Installation
│   └── Hardware Issues
└── Email Issues
    ├── Outlook
    └── Gmail
```

### Category Elements

Each category has:

1. **Name**: The display name (e.g., "Windows Troubleshooting")
2. **Description**: Optional details about what belongs in the category
3. **Icon**: Visual identifier (e.g., laptop icon for Windows)
4. **Color**: Color coding for quick recognition
5. **Parent**: The category this belongs under (optional)
6. **Article Count**: Number of articles in the category

### Visual Guide

```
┌─────────────────────────────────────────────────┐
│  [Icon] Category Name                    (42)   │  ← Category Header
│  └─ Brief description of category               │  ← Description
│                                                  │
│  Article 1 Title                                │  ← Articles
│  Article 2 Title                                │
│  Article 3 Title                                │
│                                                  │
│  └─ [Icon] Subcategory Name              (15)   │  ← Subcategory
└─────────────────────────────────────────────────┘
```

---

## Viewing Categories

### Accessing the Knowledge Base

1. **Log in** to Deskwise
2. Click **Knowledge Base** in the left sidebar
3. You'll see the category tree on the left, articles on the right

### Browsing the Category Tree

The category tree shows all categories you have access to:

```
Navigation Panel:
┌────────────────────────────┐
│ [+] IT Support        (125)│ ← Click + to expand
│ [+] Hardware           (45)│
│ [+] Software           (78)│
│ [-] Email Issues       (32)│ ← Click - to collapse
│   ├─ Outlook          (18)│ ← Subcategory
│   └─ Gmail            (14)│
└────────────────────────────┘
```

**To browse categories:**

1. Click the **[+]** icon to expand a category
2. Click the **[-]** icon to collapse it
3. Click the **category name** to view all articles in that category
4. Subcategories are indented beneath their parent

### Filtering Articles

**By Category:**
1. Click a category name in the tree
2. Articles in that category (and subcategories) will display

**By Search + Category:**
1. Enter search terms in the search box
2. Select a category from the filter dropdown
3. Only matching articles in that category will show

---

## Creating Articles

### Choosing a Category

When creating a new article:

1. Click **New Article** button
2. Fill in article details (title, content)
3. Click the **Category** dropdown
4. Select the most specific category that applies

**Category Selector:**
```
┌─────────────────────────────────────────┐
│ Select category...                    ▼ │ ← Click to open
├─────────────────────────────────────────┤
│ IT Support                              │
│   Windows Troubleshooting               │
│     Driver Issues                 ✓     │ ← Selected
│     Printer Setup                       │
│   macOS Support                         │
│     Software Installation               │
└─────────────────────────────────────────┘
```

### Category Guidelines

**Choose the most specific category:**
- Good: "IT Support > Windows > Driver Issues"
- Okay: "IT Support > Windows"
- Avoid: "IT Support" (too broad)

**If unsure:**
- Use "General" for miscellaneous topics
- Ask your team lead for guidance
- Check similar existing articles

---

## Managing Categories

> **Note**: Category management requires **Administrator** or **KB Manager** permissions.

### Accessing Category Management

1. Navigate to **Settings** > **Knowledge Base**
2. Click **Categories** tab
3. You'll see the category management interface

### Creating a New Category

**Steps:**

1. Click **New Category** button
2. Fill in the form:
   - **Name**: Category name (required)
   - **Description**: Brief explanation (optional)
   - **Parent Category**: Select parent if this is a subcategory
   - **Icon**: Choose from icon library
   - **Color**: Pick a color for visual identification
   - **Visibility**: Internal or Public
3. Click **Create Category**

**Form Example:**
```
┌─────────────────────────────────────────┐
│ Create New Category                     │
├─────────────────────────────────────────┤
│ Name:                                   │
│ [Windows Drivers                     ]  │
│                                         │
│ Description:                            │
│ [Articles about Windows driver issues]  │
│                                         │
│ Parent Category:                        │
│ [Windows Troubleshooting            ▼]  │
│                                         │
│ Icon:          Color:                   │
│ [Settings ▼]   [🎨 #8B5CF6          ]  │
│                                         │
│ Visibility:                             │
│ ○ Internal    ○ Public                  │
│                                         │
│        [Cancel]  [Create Category]      │
└─────────────────────────────────────────┘
```

### Editing a Category

1. Find the category in the list
2. Click the **Edit** (pencil) icon
3. Modify fields as needed
4. Click **Save Changes**

**What You Can Edit:**
- Name and description
- Icon and color
- Parent category (move to different location)
- Visibility and permissions

### Deleting a Category

> **Warning**: Deleting a category affects articles in that category.

**Steps:**

1. Click the **Delete** (trash) icon next to a category
2. You'll see a confirmation dialog:

```
┌─────────────────────────────────────────┐
│ Delete Category                         │
├─────────────────────────────────────────┤
│ Are you sure you want to delete         │
│ "Driver Issues"?                        │
│                                         │
│ This category contains 15 articles.     │
│                                         │
│ What should happen to these articles?   │
│                                         │
│ ○ Move to another category:             │
│   [Select category...              ▼]   │
│                                         │
│ ○ Leave uncategorized (not recommended) │
│                                         │
│        [Cancel]  [Delete Category]      │
└─────────────────────────────────────────┘
```

3. Choose what happens to articles:
   - **Move to another category**: Recommended
   - **Leave uncategorized**: Only if necessary
4. Click **Delete Category**

**Important Notes:**
- Subcategories are also deleted
- All articles in subcategories are affected
- This action cannot be undone

### Reordering Categories

Categories display in a specific order. To change the order:

1. Hover over a category
2. Click and hold the **drag handle** (⋮⋮)
3. Drag to new position
4. Release to drop

```
Before:                    After:
[⋮⋮] Hardware             [⋮⋮] Software
[⋮⋮] Software    →        [⋮⋮] Hardware
[⋮⋮] Network              [⋮⋮] Network
```

---

## Category Permissions

Categories can have access restrictions to control who can view or contribute.

### Permission Levels

1. **View**: Can see articles in the category
2. **Contribute**: Can create articles in the category
3. **Manage**: Can edit/delete the category itself

### Understanding Access Control

**Example Scenario:**

```
Category: "Executive Reports"
Permissions:
  View:       Admin, Executive
  Contribute: Admin
  Manage:     Admin only

Result:
  - Admins: Full access
  - Executives: Can read articles, cannot create
  - Other users: Cannot see category or articles
```

### Setting Category Permissions

> **Administrator or KB Manager only**

1. Edit a category
2. Click **Permissions** tab
3. Configure access:

```
┌─────────────────────────────────────────┐
│ Category Permissions                    │
├─────────────────────────────────────────┤
│ Who can VIEW articles:                  │
│ ☑ Administrators                        │
│ ☑ Technicians                           │
│ ☐ End Users                             │
│                                         │
│ Specific users (optional):              │
│ [Add user...                        ▼]  │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Who can CREATE articles:                │
│ ☑ Administrators                        │
│ ☑ Technicians                           │
│ ☐ End Users                             │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Who can MANAGE category:                │
│ ☑ Administrators                        │
│ ☐ Technicians                           │
│ ☐ End Users                             │
│                                         │
│        [Cancel]  [Save Permissions]     │
└─────────────────────────────────────────┘
```

### Public vs. Internal Categories

**Internal Categories:**
- Only visible to logged-in users
- Respects user role permissions
- Default for most categories

**Public Categories:**
- Visible in public portal (if enabled)
- Anyone with the link can view
- Articles must also be marked "Public"
- Use for customer-facing content

**Example:**
```
Public Portal:
┌────────────────────────────────────────┐
│ Help Center                            │
├────────────────────────────────────────┤
│ Getting Started              (12)      │
│ Account Management           (8)       │
│ Troubleshooting              (24)      │
│   ├─ Login Issues            (6)       │
│   └─ Password Reset          (4)       │
└────────────────────────────────────────┘

Internal Portal:
┌────────────────────────────────────────┐
│ Knowledge Base                         │
├────────────────────────────────────────┤
│ Public Categories:                     │
│   Getting Started            (12)      │
│   Account Management         (8)       │
│   Troubleshooting            (24)      │
│                                        │
│ Internal Categories:                   │
│   IT Support                 (125)     │
│   HR Policies                (34)      │
│   Executive Reports          (18)      │
└────────────────────────────────────────┘
```

---

## Best Practices

### Naming Categories

**Good Names:**
- Clear and descriptive
- Use proper capitalization
- Keep under 50 characters
- Examples:
  - "Windows Troubleshooting"
  - "Email Configuration"
  - "Network Setup"

**Avoid:**
- ALL CAPS
- Special characters (%, #, &)
- Very long names (>50 chars)
- Abbreviations users won't understand

### Organizing Hierarchies

**Optimal Structure:**
- 3-4 levels deep maximum
- 5-15 categories at each level
- Balance breadth vs. depth

**Example:**
```
Good:                          Too Deep:
IT Support                     IT Support
├── Windows                    ├── Windows
│   ├── OS Issues              │   ├── Desktop
│   └── Drivers                │   │   ├── Windows 10
                               │   │   │   ├── Pro Edition
                               │   │   │   │   └── Driver Issues
                                              ↑ Too many levels!
```

### When to Create a New Category

**Create a new category when:**
- You have 10+ articles on the same topic
- The topic doesn't fit existing categories
- Users frequently search for this topic
- The topic needs different permissions

**Don't create a category for:**
- Just 1-2 articles (use existing category)
- Very specific one-off topics (use "General")
- Temporary topics (use tags instead)

### Using Categories vs. Tags

**Categories:**
- Primary organizational structure
- One category per article
- Hierarchical
- Example: "IT Support > Windows"

**Tags:**
- Secondary metadata
- Multiple tags per article
- Flat structure
- Example: Tags = ["windows", "drivers", "printer", "hp"]

**Use both:**
```
Article: "How to Install HP Printer Drivers on Windows 10"

Category: IT Support > Windows > Drivers
Tags: windows, printer, hp, drivers, installation
```

### Maintaining Categories

**Regular Maintenance Tasks:**

1. **Monthly Review:**
   - Check article counts
   - Identify empty categories
   - Look for misplaced articles

2. **Quarterly Cleanup:**
   - Merge duplicate categories
   - Reorganize as needed
   - Update permissions

3. **Annual Audit:**
   - Review entire structure
   - Archive outdated categories
   - Update icons/colors

---

## Common Tasks

### Task 1: Finding an Article

**Using Categories:**

1. Navigate to Knowledge Base
2. Look at category tree on left
3. Click relevant category (e.g., "Windows Troubleshooting")
4. Browse articles or use search within category

**Using Search:**

1. Enter keywords in search box
2. (Optional) Filter by category
3. Review results
4. Click article to read

### Task 2: Creating an Article in the Right Category

**Steps:**

1. Click **New Article**
2. Write your article
3. Click **Category** dropdown
4. Navigate to most specific category:
   - If article is about Windows driver issues:
   - Select: IT Support > Windows > Driver Issues
   - Not just: IT Support
5. Add relevant tags
6. Save article

### Task 3: Moving an Article to Different Category

**Steps:**

1. Open the article
2. Click **Edit**
3. Change the **Category** dropdown selection
4. Click **Save**

**Bulk Move (Administrators):**

1. Go to Knowledge Base
2. Select multiple articles (checkboxes)
3. Click **Bulk Actions** > **Move to Category**
4. Select new category
5. Confirm

### Task 4: Requesting a New Category

**If you don't have permission to create categories:**

1. Contact your administrator or team lead
2. Provide:
   - Proposed category name
   - Description of what belongs in it
   - Where it should be in hierarchy
   - Estimated number of articles
3. They will review and create if appropriate

**Email Template:**
```
Subject: KB Category Request - [Category Name]

Hi [Admin Name],

I'd like to request a new Knowledge Base category:

Name: Mobile Device Support
Description: Articles about iOS and Android device setup,
             troubleshooting, and management
Parent Category: IT Support
Estimated Articles: ~20 articles currently in "General"

This would help organize our growing collection of
mobile device documentation.

Thanks,
[Your Name]
```

### Task 5: Making a Category Public

**Steps:**

1. Edit the category
2. Check **Public** visibility option
3. Set appropriate permissions
4. Save category
5. Ensure articles in category are also marked "Public"

**Result:**
- Category appears in public portal
- Only public articles are visible
- Internal articles remain hidden

---

## FAQ

### General Questions

**Q: How many categories should I create?**

A: Start with 5-10 broad categories. Add subcategories as needed when you have 10+ articles on a specific topic. Avoid creating too many empty categories.

**Q: Can an article be in multiple categories?**

A: No, each article belongs to one category. Use **tags** for cross-referencing topics.

**Q: What's the difference between categories and tags?**

A: Categories are hierarchical and define the primary organization. Tags are flat keywords for secondary classification. Example: Category = "Windows", Tags = ["windows", "drivers", "printer"].

**Q: Can I change a category's parent?**

A: Yes (if you have permissions). Edit the category and change the "Parent Category" field. The full path will automatically update.

**Q: What happens if I delete a category with articles?**

A: You'll be prompted to either move articles to another category or leave them uncategorized. We recommend moving them.

### Permissions Questions

**Q: Why can't I see certain categories?**

A: Categories have permission settings. You only see categories your role has access to. Contact an administrator if you need access.

**Q: Can I give specific users access to a category?**

A: Yes (administrators only). Edit the category's permissions and add specific users to the "Allowed Users" list.

**Q: How do public categories work?**

A: Public categories are visible in the public portal. However, only articles marked as "Public" within those categories are accessible to external users.

**Q: Can end users create categories?**

A: Typically no. Category creation is restricted to Administrators and KB Managers to maintain organization.

### Technical Questions

**Q: I moved an article but it still shows in the old category?**

A: Clear your browser cache or do a hard refresh (Ctrl+F5 or Cmd+Shift+R). If it persists, contact support.

**Q: The category tree isn't loading?**

A: Try:
1. Refresh the page
2. Clear browser cache
3. Check your internet connection
4. Contact support if issue persists

**Q: Can I export the category structure?**

A: Administrators can export category data via Settings > Knowledge Base > Export. This creates a CSV file with all categories and their relationships.

**Q: Are there category limits?**

A: No hard limits, but we recommend:
- Maximum depth: 4 levels
- Maximum categories per level: 15
- Keep it manageable and logical

### Best Practice Questions

**Q: Should I create separate categories for each product version?**

A: Only if there are significant differences. Consider using tags (e.g., "windows-10", "windows-11") instead of separate categories.

**Q: How do I handle articles that fit multiple categories?**

A: Place in the most specific category, then use tags for cross-referencing. You can also mention related categories in the article.

**Q: What should I do with old/outdated categories?**

A:
1. Archive articles in the category
2. Move remaining articles to current categories
3. Delete the outdated category

**Q: Can I use emojis in category names?**

A: Technically yes, but not recommended. Use the icon field instead for visual identification.

---

## Getting Help

### Need Assistance?

**For Category Questions:**
- Contact your KB Manager or Administrator
- Email: support@yourcompany.com
- Slack: #knowledge-base

**For Technical Issues:**
- Submit a ticket: Help Desk > New Ticket
- Category: "IT Support > Knowledge Base"
- Include: Screenshots, error messages, steps to reproduce

**Additional Resources:**
- [KB Categories Implementation Guide](./KB_CATEGORIES_IMPLEMENTATION.md) (Technical)
- [KB Categories Migration Guide](./KB_CATEGORIES_MIGRATION.md) (Administrators)
- Video Tutorials: [Link to video library]
- Training Schedule: [Link to training calendar]

---

## Quick Reference Card

### Category Icons Legend

| Icon | Category Type |
|------|---------------|
| 💻 Laptop | Windows/PC Support |
| 🖥️ Monitor | macOS/Apple Support |
| 📧 Mail | Email Issues |
| 🌐 Network | Network/Connectivity |
| 🔒 Lock | Security |
| ⚙️ Settings | Configuration |
| 📱 Phone | Mobile Devices |
| 🖨️ Printer | Printer Support |
| 📁 Folder | General |
| ❓ Help | Troubleshooting |

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Article | Ctrl+N / Cmd+N |
| Search KB | Ctrl+K / Cmd+K |
| Expand All Categories | Ctrl+E / Cmd+E |
| Collapse All Categories | Ctrl+Shift+E / Cmd+Shift+E |

### Permission Matrix

| Role | View Articles | Create Articles | Manage Categories |
|------|--------------|----------------|-------------------|
| Administrator | ✅ All | ✅ Yes | ✅ Yes |
| Technician | ✅ Internal | ✅ Yes | ❌ No |
| End User | ✅ Assigned | ⚠️ Limited | ❌ No |
| Guest | ✅ Public Only | ❌ No | ❌ No |

---

**Document Version**: 1.0
**Last Updated**: October 12, 2025
**Feedback**: Please submit suggestions to kb-admin@yourcompany.com
