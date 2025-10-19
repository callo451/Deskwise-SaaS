# Automatic Email Template Seeding

## Overview

As of the latest update, **all new organizations automatically receive 9 production-ready email templates** when they are created. This eliminates the need for manual seeding and ensures every organization has a complete notification system from day one.

## How It Works

### Automatic Seeding Process

1. **Organization Creation**: When a new organization is created via `OrganizationService.createOrganization()`
2. **Template Seeding**: System automatically calls `TemplateService.seedDefaultTemplates(orgId)`
3. **9 Templates Created**: All default templates are inserted into the database
4. **Ready to Use**: Templates are immediately available in Settings > Email Templates

### Implementation Details

**Service Layer**: `src/lib/services/organizations.ts`

```typescript
const result = await orgsCollection.insertOne(organization as Organization)

const createdOrg = {
  ...organization,
  _id: result.insertedId,
} as Organization

// Automatically seed default email templates for the new organization
try {
  await TemplateService.seedDefaultTemplates(result.insertedId.toString())
} catch (error) {
  console.error('Failed to seed email templates for new organization:', error)
  // Don't fail organization creation if template seeding fails
}

return createdOrg
```

**Template Service**: `src/lib/services/email-templates.ts`

```typescript
static async seedDefaultTemplates(orgId: string): Promise<number> {
  const db = await getDatabase()
  const templatesCollection = db.collection<NotificationTemplate>(COLLECTIONS.NOTIFICATION_TEMPLATES)

  // Check if templates already exist
  const existingCount = await templatesCollection.countDocuments({ orgId })
  if (existingCount > 0) {
    console.log(`Organization ${orgId} already has ${existingCount} templates, skipping seeding`)
    return 0
  }

  const { getDefaultTemplates } = await import('@/lib/data/default-email-templates')
  const defaultTemplates = getDefaultTemplates()

  // Insert all templates
  const result = await templatesCollection.insertMany(templatesToInsert as NotificationTemplate[])

  console.log(`✅ Seeded ${result.insertedCount} default email templates for organization ${orgId}`)
  return result.insertedCount
}
```

**Template Data Source**: `src/lib/data/default-email-templates.ts`

This file contains all default template definitions in TypeScript format, making them:
- Type-safe
- Maintainable
- Reusable across the codebase
- Version-controlled with the application

## Default Templates Included

The following 9 templates are automatically created:

### Ticket Templates (6)
1. **Ticket Created** (`ticket.created`)
   - Sent when a new ticket is created
   - Includes ticket number, priority, status, description
   - Action button to view ticket

2. **Ticket Assigned** (`ticket.assigned`)
   - Sent when a ticket is assigned to a technician
   - Includes assignee, due date, priority
   - Action button to view and respond

3. **Ticket Status Changed** (`ticket.status_changed`)
   - Sent when ticket status is updated
   - Shows previous and new status
   - Includes optional status comment

4. **Ticket Comment Added** (`ticket.comment_added`)
   - Sent when a comment is added
   - Shows comment content and author
   - Direct link to comment

5. **Ticket Resolved** (`ticket.resolved`)
   - Sent when ticket is marked as resolved
   - Includes resolution notes and time
   - Requests customer feedback

6. **SLA Breach Warning** (`ticket.sla_warning`)
   - Urgent alert for approaching SLA deadlines
   - Shows time remaining
   - Red/orange theme for urgency

### Incident Templates (1)
7. **Incident Created** (`incident.created`)
   - Critical incident notifications
   - Shows severity and impact
   - Red theme for urgency

### Project Templates (1)
8. **Project Task Assigned** (`project.task_assigned`)
   - Task assignment notifications
   - Includes due date and estimated hours
   - Action button to view task

### Asset Templates (1)
9. **Asset Warranty Expiring** (`asset.warranty_expiring`)
   - Proactive maintenance alerts
   - Shows days remaining
   - Orange theme for warning

## Template Characteristics

All default templates include:

- **Professional Design**: Gradient headers, clean layout
- **Responsive HTML**: Mobile-friendly design
- **Handlebars Variables**: 120+ dynamic variables available
- **Brand Colors**: Customizable organization branding
- **Action Buttons**: Direct links to relevant resources
- **Footer Links**: Notification preference management
- **System Flag**: Marked as `isSystem: true`
- **Active by Default**: Immediately ready to use

## Updating Default Templates

### For New Organizations

To change what templates new organizations receive:

1. **Edit**: `src/lib/data/default-email-templates.ts`
2. **Modify**: Update template content, add/remove templates
3. **Deploy**: Templates will be used for all new organizations

### For Existing Organizations

To update templates for existing organizations, you have three options:

#### Option 1: Manual Update via UI
1. Navigate to Settings > Email Templates
2. Edit each template individually
3. Save changes

#### Option 2: Use Seed Script with --force
```bash
MONGODB_URI="your-uri" ORG_ID="org-id" node scripts/seed-email-templates.js --force
```
This overwrites existing templates with the latest defaults.

#### Option 3: Create Migration Script
For bulk updates across multiple organizations:

```javascript
// scripts/update-all-org-templates.js
const { MongoClient } = require('mongodb');
const { TemplateService } = require('../src/lib/services/email-templates');

async function updateAllOrganizations() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db('deskwise');
  const orgs = await db.collection('organizations').find({}).toArray();

  for (const org of orgs) {
    console.log(`Updating templates for ${org.name}...`);

    // Delete existing templates
    await db.collection('notification_templates').deleteMany({
      orgId: org._id.toString(),
      isSystem: true
    });

    // Re-seed
    await TemplateService.seedDefaultTemplates(org._id.toString());
  }

  await client.close();
  console.log('✅ All organizations updated');
}

updateAllOrganizations();
```

## Preventing Automatic Seeding

If you want to create an organization without default templates:

```typescript
// Temporarily disable seeding by commenting out the call in organizations.ts
const result = await orgsCollection.insertOne(organization as Organization)

// // Automatically seed default email templates
// try {
//   await TemplateService.seedDefaultTemplates(result.insertedId.toString())
// } catch (error) {
//   console.error('Failed to seed email templates:', error)
// }

return createdOrg
```

**Note**: This is not recommended for production environments.

## Idempotency

The seeding process is **idempotent**:

- If templates already exist for an organization, seeding is skipped
- Safe to call multiple times
- No duplicate templates created

```typescript
const existingCount = await templatesCollection.countDocuments({ orgId })
if (existingCount > 0) {
  console.log(`Organization ${orgId} already has ${existingCount} templates, skipping seeding`)
  return 0
}
```

## Monitoring and Logs

### Success Log
```
✅ Seeded 9 default email templates for organization 6874a92a4e045353ab24c59a
```

### Skip Log (Templates Already Exist)
```
Organization 6874a92a4e045353ab24c59a already has 9 templates, skipping seeding
```

### Error Log (Non-Fatal)
```
Failed to seed email templates for new organization: <error details>
```

**Important**: Template seeding errors do **not** prevent organization creation. The organization is still created successfully, and templates can be seeded manually later.

## Testing the Feature

### Create a Test Organization

```typescript
// Via API or service
import { OrganizationService } from '@/lib/services/organizations'

const newOrg = await OrganizationService.createOrganization({
  name: 'Test Company',
  domain: 'test.com',
  mode: 'internal',
  timezone: 'America/New_York',
  currency: 'USD'
})

// Templates are automatically created
```

### Verify Templates Were Created

```javascript
const { MongoClient } = require('mongodb');

async function verifyTemplates() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db('deskwise');
  const templates = await db.collection('notification_templates').find({
    orgId: 'your-org-id'
  }).toArray();

  console.log(`Found ${templates.length} templates`);
  templates.forEach(t => console.log(`- ${t.name} (${t.event})`));

  await client.close();
}

verifyTemplates();
```

## Benefits

1. **Zero Manual Setup**: No need to manually seed templates for each organization
2. **Consistency**: All organizations start with the same high-quality templates
3. **Time Savings**: Reduces onboarding time for new organizations
4. **Best Practices**: Templates follow email design best practices
5. **Immediate Functionality**: Notifications work out-of-the-box
6. **Customizable**: Admins can still customize templates as needed

## Backward Compatibility

### Existing Organizations

Organizations created before this feature was implemented will **not** receive templates automatically. To seed templates for existing organizations:

1. **Individual Organization**:
   ```bash
   MONGODB_URI="your-uri" ORG_ID="org-id" node scripts/seed-email-templates.js
   ```

2. **All Organizations** (use migration script above)

### Manual Seeding Script

The `scripts/seed-email-templates.js` script is still available and useful for:
- Seeding existing organizations
- Force-updating templates with latest versions
- Testing template changes
- Development and staging environments

## Related Documentation

- **IMPLEMENTATION_COMPLETE.md** - Full email system documentation
- **USER_GUIDE.md** - End-user documentation
- **ADMIN_GUIDE.md** - Administrator guide
- **API_DOCUMENTATION.md** - API reference

## Support

If you encounter issues with automatic template seeding:

1. **Check Logs**: Look for seeding messages in server logs
2. **Verify MongoDB Connection**: Ensure database is accessible
3. **Check Permissions**: Verify MongoDB user has insert permissions
4. **Manual Seeding**: Use seed script as fallback
5. **Contact Support**: Report persistent issues

## Summary

Automatic email template seeding ensures every organization in Deskwise has a complete, professional notification system from day one. This feature:

✅ Automatically creates 9 production-ready templates
✅ Works seamlessly during organization creation
✅ Is idempotent and safe to retry
✅ Does not prevent organization creation if seeding fails
✅ Can be customized by editing `src/lib/data/default-email-templates.ts`
✅ Maintains backward compatibility with existing organizations

New organizations can start using email notifications immediately after configuring AWS SES credentials in Settings > Email Settings.
