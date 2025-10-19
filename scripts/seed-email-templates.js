/**
 * Seed Default Email Templates
 *
 * Creates production-ready email templates for all major notification events.
 * These templates can be customized by admins after seeding.
 *
 * Usage:
 *   MONGODB_URI="your-connection-string" ORG_ID="your-org-id" node scripts/seed-email-templates.js
 *
 * Options:
 *   --dry-run: Preview templates without saving to database
 *   --force: Overwrite existing templates
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'deskwise';
const ORG_ID = process.env.ORG_ID;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// Professional email template wrapper
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .button {
      display: inline-block;
      background-color: #667eea;
      color: #ffffff !important;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: 600;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .info-box {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-high { background-color: #fef3c7; color: #92400e; }
    .badge-critical { background-color: #fee2e2; color: #991b1b; }
    .badge-medium { background-color: #dbeafe; color: #1e40af; }
    .badge-low { background-color: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

// Default email templates
const templates = [
  // ===== TICKET TEMPLATES =====
  {
    name: 'Ticket Created',
    description: 'Sent when a new ticket is created',
    event: 'ticket.created',
    subject: 'New Ticket #{{ticket.ticketNumber}}: {{ticket.title}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>New Ticket Created</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>A new support ticket has been created:</p>

          <div class="info-box">
            <strong>Ticket #{{ticket.ticketNumber}}</strong>: {{ticket.title}}<br>
            <strong>Priority</strong>: <span class="badge badge-{{ticket.priority}}">{{ticket.priority}}</span><br>
            <strong>Status</strong>: {{ticket.status}}<br>
            <strong>Created by</strong>: {{ticket.requester.name}} ({{ticket.requester.email}})<br>
            <strong>Created at</strong>: {{formatDate ticket.createdAt}}
          </div>

          <p><strong>Description:</strong></p>
          <p>{{ticket.description}}</p>

          <a href="{{platform.url}}/tickets/{{ticket._id}}" class="button">View Ticket</a>

          <p>If you have any questions, please reply to this email or contact support.</p>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'ticket.description', 'ticket.priority',
      'ticket.status', 'ticket.requester.name', 'ticket.requester.email',
      'ticket.createdAt', 'recipient.name', 'organization.name', 'platform.url'
    ]
  },

  {
    name: 'Ticket Assigned',
    description: 'Sent when a ticket is assigned to a technician',
    event: 'ticket.assigned',
    subject: 'Ticket #{{ticket.ticketNumber}} assigned to you',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>Ticket Assigned to You</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>The following ticket has been assigned to you:</p>

          <div class="info-box">
            <strong>Ticket #{{ticket.ticketNumber}}</strong>: {{ticket.title}}<br>
            <strong>Priority</strong>: <span class="badge badge-{{ticket.priority}}">{{ticket.priority}}</span><br>
            <strong>Status</strong>: {{ticket.status}}<br>
            <strong>Requester</strong>: {{ticket.requester.name}}<br>
            <strong>Due Date</strong>: {{formatDate ticket.dueDate}}
          </div>

          <p><strong>Description:</strong></p>
          <p>{{ticket.description}}</p>

          <a href="{{platform.url}}/tickets/{{ticket._id}}" class="button">View & Respond</a>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'ticket.description', 'ticket.priority',
      'ticket.status', 'ticket.dueDate', 'ticket.requester.name', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  {
    name: 'Ticket Status Changed',
    description: 'Sent when a ticket status is updated',
    event: 'ticket.status_changed',
    subject: 'Ticket #{{ticket.ticketNumber}} status updated to {{ticket.status}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>Ticket Status Updated</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>The status of your ticket has been updated:</p>

          <div class="info-box">
            <strong>Ticket #{{ticket.ticketNumber}}</strong>: {{ticket.title}}<br>
            <strong>Previous Status</strong>: {{ticket.previousStatus}}<br>
            <strong>New Status</strong>: {{ticket.status}}<br>
            <strong>Updated by</strong>: {{updatedBy.name}}<br>
            <strong>Updated at</strong>: {{formatDate ticket.updatedAt}}
          </div>

          {{#if ticket.statusComment}}
          <p><strong>Comment:</strong></p>
          <p>{{ticket.statusComment}}</p>
          {{/if}}

          <a href="{{platform.url}}/tickets/{{ticket._id}}" class="button">View Ticket</a>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'ticket.status', 'ticket.previousStatus',
      'ticket.statusComment', 'ticket.updatedAt', 'updatedBy.name', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  {
    name: 'Ticket Comment Added',
    description: 'Sent when a comment is added to a ticket',
    event: 'ticket.comment_added',
    subject: 'New comment on ticket #{{ticket.ticketNumber}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>New Comment Added</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>A new comment has been added to ticket #{{ticket.ticketNumber}}:</p>

          <div class="info-box">
            <strong>Ticket</strong>: {{ticket.title}}<br>
            <strong>Commented by</strong>: {{comment.author.name}}<br>
            <strong>Date</strong>: {{formatDate comment.createdAt}}
          </div>

          <p><strong>Comment:</strong></p>
          <p>{{comment.content}}</p>

          <a href="{{platform.url}}/tickets/{{ticket._id}}#comment-{{comment._id}}" class="button">View Comment</a>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'comment.content', 'comment.author.name',
      'comment.createdAt', 'recipient.name', 'organization.name', 'platform.url'
    ]
  },

  {
    name: 'Ticket Resolved',
    description: 'Sent when a ticket is marked as resolved',
    event: 'ticket.resolved',
    subject: 'Ticket #{{ticket.ticketNumber}} has been resolved',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>Ticket Resolved</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>Great news! Your support ticket has been resolved:</p>

          <div class="info-box">
            <strong>Ticket #{{ticket.ticketNumber}}</strong>: {{ticket.title}}<br>
            <strong>Resolved by</strong>: {{ticket.assignee.name}}<br>
            <strong>Resolution time</strong>: {{ticket.resolutionTime}}<br>
            <strong>Resolved at</strong>: {{formatDate ticket.resolvedAt}}
          </div>

          {{#if ticket.resolutionNotes}}
          <p><strong>Resolution Notes:</strong></p>
          <p>{{ticket.resolutionNotes}}</p>
          {{/if}}

          <p>If this resolves your issue, you can close the ticket. If you need further assistance, please reopen the ticket or reply to this email.</p>

          <a href="{{platform.url}}/tickets/{{ticket._id}}" class="button">View Ticket</a>

          <p>We'd appreciate your feedback! Please take a moment to rate your experience.</p>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'ticket.resolutionNotes', 'ticket.resolvedAt',
      'ticket.resolutionTime', 'ticket.assignee.name', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  {
    name: 'SLA Breach Warning',
    description: 'Sent when a ticket is approaching SLA deadline',
    event: 'ticket.sla_warning',
    subject: '⚠️ SLA Warning: Ticket #{{ticket.ticketNumber}} approaching deadline',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);">
          <h1>⚠️ SLA Warning</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p><strong>URGENT:</strong> The following ticket is approaching its SLA deadline:</p>

          <div class="info-box" style="border-left-color: #dc2626;">
            <strong>Ticket #{{ticket.ticketNumber}}</strong>: {{ticket.title}}<br>
            <strong>Priority</strong>: <span class="badge badge-{{ticket.priority}}">{{ticket.priority}}</span><br>
            <strong>Assigned to</strong>: {{ticket.assignee.name}}<br>
            <strong>SLA Deadline</strong>: {{formatDate ticket.sla.resolutionDeadline}}<br>
            <strong>Time Remaining</strong>: {{ticket.sla.timeRemaining}}
          </div>

          <p>Please take immediate action to resolve this ticket before the SLA is breached.</p>

          <a href="{{platform.url}}/tickets/{{ticket._id}}" class="button" style="background-color: #dc2626;">View Ticket Immediately</a>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'ticket.ticketNumber', 'ticket.title', 'ticket.priority', 'ticket.assignee.name',
      'ticket.sla.resolutionDeadline', 'ticket.sla.timeRemaining', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  // ===== INCIDENT TEMPLATES =====
  {
    name: 'Incident Created',
    description: 'Sent when a new incident is reported',
    event: 'incident.created',
    subject: '🚨 New Incident #{{incident.incidentNumber}}: {{incident.title}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
          <h1>🚨 New Incident Reported</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>A new incident has been reported and requires immediate attention:</p>

          <div class="info-box" style="border-left-color: #dc2626;">
            <strong>Incident #{{incident.incidentNumber}}</strong>: {{incident.title}}<br>
            <strong>Severity</strong>: <span class="badge badge-{{incident.severity}}">{{incident.severity}}</span><br>
            <strong>Status</strong>: {{incident.status}}<br>
            <strong>Reported by</strong>: {{incident.reporter.name}}<br>
            <strong>Reported at</strong>: {{formatDate incident.createdAt}}
          </div>

          <p><strong>Description:</strong></p>
          <p>{{incident.description}}</p>

          <a href="{{platform.url}}/incidents/{{incident._id}}" class="button" style="background-color: #dc2626;">View Incident</a>

          <p>Best regards,<br>{{organization.name}} Support Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'incident.incidentNumber', 'incident.title', 'incident.description', 'incident.severity',
      'incident.status', 'incident.reporter.name', 'incident.createdAt', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  // ===== PROJECT TEMPLATES =====
  {
    name: 'Project Task Assigned',
    description: 'Sent when a project task is assigned to a user',
    event: 'project.task_assigned',
    subject: 'New task assigned: {{task.name}} in {{project.name}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header">
          <h1>New Task Assigned</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>A new task has been assigned to you:</p>

          <div class="info-box">
            <strong>Project</strong>: {{project.name}}<br>
            <strong>Task</strong>: {{task.name}}<br>
            <strong>Priority</strong>: <span class="badge badge-{{task.priority}}">{{task.priority}}</span><br>
            <strong>Due Date</strong>: {{formatDate task.dueDate}}<br>
            <strong>Estimated Hours</strong>: {{task.estimatedHours}}
          </div>

          {{#if task.description}}
          <p><strong>Description:</strong></p>
          <p>{{task.description}}</p>
          {{/if}}

          <a href="{{platform.url}}/projects/{{project._id}}/tasks/{{task._id}}" class="button">View Task</a>

          <p>Best regards,<br>{{organization.name}} Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'project.name', 'task.name', 'task.description', 'task.priority',
      'task.dueDate', 'task.estimatedHours', 'recipient.name',
      'organization.name', 'platform.url'
    ]
  },

  // ===== ASSET TEMPLATES =====
  {
    name: 'Asset Warranty Expiring',
    description: 'Sent when an asset warranty is about to expire',
    event: 'asset.warranty_expiring',
    subject: '⚠️ Asset Warranty Expiring: {{asset.name}}',
    htmlBody: emailWrapper(`
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
          <h1>Warranty Expiration Notice</h1>
        </div>
        <div class="content">
          <p>Hi {{recipient.name}},</p>
          <p>The warranty for the following asset is expiring soon:</p>

          <div class="info-box" style="border-left-color: #f59e0b;">
            <strong>Asset</strong>: {{asset.name}}<br>
            <strong>Type</strong>: {{asset.type}}<br>
            <strong>Serial Number</strong>: {{asset.serialNumber}}<br>
            <strong>Warranty Expires</strong>: {{formatDate asset.warrantyExpiry}}<br>
            <strong>Days Remaining</strong>: {{asset.warrantyDaysRemaining}}
          </div>

          <p>Please review this asset and take appropriate action (renew warranty, plan replacement, etc.).</p>

          <a href="{{platform.url}}/assets/{{asset._id}}" class="button">View Asset</a>

          <p>Best regards,<br>{{organization.name}} IT Team</p>
        </div>
        <div class="footer">
          <p>This is an automated notification from {{organization.name}}<br>
          <a href="{{platform.url}}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    `),
    availableVariables: [
      'asset.name', 'asset.type', 'asset.serialNumber', 'asset.warrantyExpiry',
      'asset.warrantyDaysRemaining', 'recipient.name', 'organization.name', 'platform.url'
    ]
  }
];

async function seedTemplates() {
  if (!ORG_ID && !DRY_RUN) {
    console.error('❌ Error: ORG_ID environment variable is required');
    console.error('Usage: ORG_ID="your-org-id" node scripts/seed-email-templates.js');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🌱 Seeding Email Templates\n');

    if (DRY_RUN) {
      console.log('📋 DRY RUN MODE - Templates will not be saved to database\n');
    }

    if (!DRY_RUN) {
      console.log('Connecting to MongoDB...');
      await client.connect();
      console.log('✓ Connected successfully\n');
    }

    const db = client.db(DB_NAME);
    const templatesCollection = db.collection('notification_templates');

    let created = 0;
    let skipped = 0;
    let updated = 0;

    for (const templateData of templates) {
      console.log(`📧 ${templateData.name} (${templateData.event})`);

      if (DRY_RUN) {
        console.log(`  Subject: ${templateData.subject}`);
        console.log(`  Variables: ${templateData.availableVariables.length} available`);
        console.log('');
        continue;
      }

      // Check if template already exists
      const existing = await templatesCollection.findOne({
        orgId: ORG_ID,
        event: templateData.event,
        isSystem: true
      });

      if (existing && !FORCE) {
        console.log('  ⊘ Already exists, skipping (use --force to overwrite)');
        skipped++;
      } else {
        const now = new Date();
        const template = {
          orgId: ORG_ID,
          name: templateData.name,
          description: templateData.description,
          subject: templateData.subject,
          htmlBody: templateData.htmlBody,
          textBody: templateData.textBody,
          availableVariables: templateData.availableVariables,
          event: templateData.event,
          isSystem: true,
          isActive: true,
          usageCount: 0,
          createdBy: 'system',
          createdAt: existing?.createdAt || now,
          updatedAt: now
        };

        if (existing && FORCE) {
          await templatesCollection.updateOne(
            { _id: existing._id },
            { $set: template }
          );
          console.log('  ✓ Updated');
          updated++;
        } else {
          await templatesCollection.insertOne(template);
          console.log('  ✓ Created');
          created++;
        }
      }

      console.log('');
    }

    console.log('═══════════════════════════════════════');
    if (!DRY_RUN) {
      console.log(`Templates created: ${created}`);
      console.log(`Templates updated: ${updated}`);
      console.log(`Templates skipped: ${skipped}`);
    } else {
      console.log(`Templates previewed: ${templates.length}`);
    }
    console.log('═══════════════════════════════════════\n');

    if (!DRY_RUN) {
      console.log('✅ Seeding complete!');
      console.log('\nNext steps:');
      console.log('1. Review templates in Settings > Email Templates');
      console.log('2. Create notification rules to use these templates');
      console.log('3. Test email delivery with a test notification\n');
    } else {
      console.log('To actually create these templates, run without --dry-run flag\n');
    }

  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    process.exit(1);
  } finally {
    if (!DRY_RUN) {
      await client.close();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  seedTemplates()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { seedTemplates, templates };
