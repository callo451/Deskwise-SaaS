/**
 * Test Data Creation Script for Ticket System Features
 *
 * Creates sample tickets, time entries, and CSAT ratings for testing.
 *
 * Usage:
 *   node scripts/create-test-data.js
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (required)
 *   ORG_ID - Organization ID to use (optional, will create if not provided)
 *   USER_ID - User ID to use (optional, will use first admin user)
 */

const { MongoClient, ObjectId } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'deskwise';
const ORG_ID = process.env.ORG_ID || 'test-org-' + Date.now();
const USER_ID = process.env.USER_ID;

// Sample data templates
const ticketTemplates = [
  {
    title: 'VPN connection keeps dropping',
    description: 'User reports VPN disconnects every 30 minutes. Affects remote work.',
    priority: 'high',
    category: 'network',
    status: 'open',
    sla: { responseTime: 60, resolutionTime: 240 } // 1 hour response, 4 hours resolution
  },
  {
    title: 'Cannot access shared drive',
    description: 'Permissions error when trying to open Finance folder on network drive.',
    priority: 'medium',
    category: 'access',
    status: 'in-progress',
    sla: { responseTime: 120, resolutionTime: 480 }
  },
  {
    title: 'Laptop running very slow',
    description: 'Computer takes 10+ minutes to boot. Applications freeze frequently.',
    priority: 'medium',
    category: 'hardware',
    status: 'open',
    sla: { responseTime: 240, resolutionTime: 1440 } // 4 hours response, 24 hours resolution
  },
  {
    title: 'Email not syncing on mobile',
    description: 'iPhone not receiving emails since this morning. WiFi and data work fine.',
    priority: 'low',
    category: 'email',
    status: 'open',
    sla: { responseTime: 480, resolutionTime: 1440 }
  },
  {
    title: 'Printer error code 49',
    description: 'Office printer displays error 49 and will not print any jobs.',
    priority: 'critical',
    category: 'hardware',
    status: 'open',
    sla: { responseTime: 15, resolutionTime: 60 } // 15 min response, 1 hour resolution
  },
  {
    title: 'Password reset request',
    description: 'User forgot password and cannot access their account.',
    priority: 'high',
    category: 'account',
    status: 'resolved',
    sla: { responseTime: 30, resolutionTime: 120 }
  },
  {
    title: 'Software installation - Adobe Creative Suite',
    description: 'New designer needs Adobe CC installed on workstation.',
    priority: 'medium',
    category: 'software',
    status: 'in-progress',
    sla: { responseTime: 240, resolutionTime: 1440 }
  },
  {
    title: 'Website down - cannot access company portal',
    description: 'Getting 502 Bad Gateway error when accessing portal.company.com',
    priority: 'critical',
    category: 'infrastructure',
    status: 'in-progress',
    sla: { responseTime: 5, resolutionTime: 30 } // 5 min response, 30 min resolution
  },
  {
    title: 'Request new laptop for employee',
    description: 'New hire starting Monday. Need laptop with Windows 11 and Office 365.',
    priority: 'high',
    category: 'hardware',
    status: 'open',
    sla: { responseTime: 120, resolutionTime: 2880 } // 2 hours response, 48 hours resolution
  },
  {
    title: 'Scanner not working properly',
    description: 'Document scanner in copy room produces blurry scans.',
    priority: 'low',
    category: 'hardware',
    status: 'open',
    sla: { responseTime: 480, resolutionTime: 2880 }
  }
];

const cannedResponseTemplates = [
  {
    name: 'Password Reset Instructions',
    category: 'Account Management',
    content: 'To reset your password:\n1. Go to https://portal.company.com/reset\n2. Enter your email address\n3. Check your email for the reset link\n4. Create a new password (min 12 characters)\n\nIf you encounter any issues, please reply to this ticket.',
    tags: ['password', 'account', 'security'],
    isActive: true
  },
  {
    name: 'VPN Troubleshooting Steps',
    category: 'Network',
    content: 'Please try these troubleshooting steps:\n1. Disconnect from VPN\n2. Restart your computer\n3. Reconnect to VPN\n4. If issue persists, uninstall and reinstall VPN client from: https://vpn.company.com/download\n\nLet me know if this resolves the issue.',
    tags: ['vpn', 'network', 'connection'],
    isActive: true
  },
  {
    name: 'Ticket Resolved - Follow Up',
    category: 'General',
    content: 'Your ticket has been resolved. If you experience any further issues or have questions, please don\'t hesitate to reopen this ticket or create a new one.\n\nThank you for your patience!',
    tags: ['resolution', 'follow-up'],
    isActive: true
  },
  {
    name: 'More Information Needed',
    category: 'General',
    content: 'Hi {{requester.name}},\n\nTo assist you better, I need some additional information:\n- What specific error message do you see?\n- When did this issue start?\n- Are other users experiencing the same problem?\n\nPlease provide these details when you have a chance.',
    tags: ['information', 'follow-up'],
    isActive: true
  },
  {
    name: 'Escalated to Management',
    category: 'Escalation',
    content: 'This ticket has been escalated to management for approval/further action. We will update you within {{sla.responseTime}} minutes.\n\nReference Number: {{ticket.id}}',
    tags: ['escalation', 'management'],
    isActive: true
  }
];

async function createTestData() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    await client.connect();
    const db = client.db(DB_NAME);

    // Get or create test user
    let userId = USER_ID;
    if (!userId) {
      const user = await db.collection('users').findOne({ orgId: ORG_ID, role: 'admin' });
      if (user) {
        userId = user._id.toString();
        console.log(`✓ Using existing admin user: ${user.email}\n`);
      } else {
        console.log('⚠ No admin user found. Please create a user first or provide USER_ID environment variable.\n');
        return;
      }
    }

    console.log(`📋 Creating test data for organization: ${ORG_ID}\n`);

    // 1. Create Tickets
    console.log('1️⃣ Creating test tickets...');
    const ticketsCollection = db.collection('tickets');
    const createdTickets = [];

    for (const template of ticketTemplates) {
      const ticket = {
        ...template,
        ticketNumber: `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        orgId: ORG_ID,
        requesterId: userId,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        comments: [],
        attachments: [],
        linkedAssets: [],
        tags: [template.category]
      };

      // Calculate SLA deadlines
      if (ticket.sla) {
        const now = new Date();
        ticket.sla.responseDeadline = new Date(now.getTime() + ticket.sla.responseTime * 60000);
        ticket.sla.resolutionDeadline = new Date(now.getTime() + ticket.sla.resolutionTime * 60000);
        ticket.sla.breached = false;
      }

      const result = await ticketsCollection.insertOne(ticket);
      createdTickets.push({ _id: result.insertedId, ...ticket });
      console.log(`  ✓ Created: ${ticket.title} [${ticket.priority}]`);
    }

    console.log(`\n  📊 Total tickets created: ${createdTickets.length}\n`);

    // 2. Create Canned Responses
    console.log('2️⃣ Creating canned responses...');
    const responsesCollection = db.collection('canned_responses');

    for (const template of cannedResponseTemplates) {
      const response = {
        ...template,
        orgId: ORG_ID,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        useCount: 0
      };

      await responsesCollection.insertOne(response);
      console.log(`  ✓ Created: ${response.name}`);
    }

    console.log(`\n  📊 Total canned responses created: ${cannedResponseTemplates.length}\n`);

    // 3. Create Time Entries (for some tickets)
    console.log('3️⃣ Creating time tracking entries...');
    const timeEntriesCollection = db.collection('time_entries');
    let timeEntriesCount = 0;

    // Add time entries to first 5 tickets
    for (let i = 0; i < 5; i++) {
      const ticket = createdTickets[i];

      // Create 2-3 time entries per ticket
      const numEntries = Math.floor(Math.random() * 2) + 2;

      for (let j = 0; j < numEntries; j++) {
        const duration = Math.floor(Math.random() * 60) + 15; // 15-75 minutes
        const startTime = new Date(Date.now() - (j + 1) * 60 * 60 * 1000); // Hours ago

        const timeEntry = {
          ticketId: ticket._id.toString(),
          orgId: ORG_ID,
          userId: userId,
          description: j === 0 ? 'Initial investigation' : j === 1 ? 'Implementing solution' : 'Testing and verification',
          startTime: startTime,
          endTime: new Date(startTime.getTime() + duration * 60000),
          duration: duration,
          isBillable: Math.random() > 0.3, // 70% billable
          isRunning: false,
          createdAt: startTime,
          updatedAt: new Date()
        };

        await timeEntriesCollection.insertOne(timeEntry);
        timeEntriesCount++;
      }

      console.log(`  ✓ Added ${numEntries} time entries to: ${ticket.title}`);
    }

    console.log(`\n  📊 Total time entries created: ${timeEntriesCount}\n`);

    // 4. Create CSAT Ratings (for resolved tickets)
    console.log('4️⃣ Creating CSAT ratings...');
    const csatCollection = db.collection('csat_ratings');
    let csatCount = 0;

    const resolvedTickets = createdTickets.filter(t => t.status === 'resolved');

    for (const ticket of resolvedTickets) {
      const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars (mostly positive)
      const feedbacks = [
        'Quick response and resolved my issue efficiently.',
        'Very helpful and professional service.',
        'Took a bit longer than expected but issue is fixed.',
        'Excellent support! Explained everything clearly.',
        'Good service overall.'
      ];

      const csatRating = {
        ticketId: ticket._id.toString(),
        orgId: ORG_ID,
        rating: rating,
        feedback: feedbacks[Math.floor(Math.random() * feedbacks.length)],
        submittedBy: userId,
        submittedAt: new Date(),
        createdAt: new Date()
      };

      await csatCollection.insertOne(csatRating);

      // Update ticket with CSAT rating
      await ticketsCollection.updateOne(
        { _id: ticket._id },
        { $set: { csatRating: rating } }
      );

      csatCount++;
      console.log(`  ✓ Added ${rating}⭐ rating to: ${ticket.title}`);
    }

    console.log(`\n  📊 Total CSAT ratings created: ${csatCount}\n`);

    // 5. Create Comments (with some internal notes)
    console.log('5️⃣ Creating ticket comments...');
    let commentsCount = 0;

    for (let i = 0; i < 5; i++) {
      const ticket = createdTickets[i];

      const comments = [
        {
          userId: userId,
          content: 'Thank you for reporting this issue. I\'m looking into it now.',
          isInternal: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          userId: userId,
          content: 'Internal note: This is a recurring issue. May need to escalate to vendor.',
          isInternal: true,
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
        }
      ];

      await ticketsCollection.updateOne(
        { _id: ticket._id },
        { $set: { comments: comments } }
      );

      commentsCount += comments.length;
      console.log(`  ✓ Added ${comments.length} comments (1 internal) to: ${ticket.title}`);
    }

    console.log(`\n  📊 Total comments created: ${commentsCount}\n`);

    // Summary
    console.log('═══════════════════════════════════════');
    console.log('✅ Test Data Creation Complete!\n');
    console.log('📊 Summary:');
    console.log(`  • Organization ID: ${ORG_ID}`);
    console.log(`  • Tickets: ${createdTickets.length}`);
    console.log(`  • Canned Responses: ${cannedResponseTemplates.length}`);
    console.log(`  • Time Entries: ${timeEntriesCount}`);
    console.log(`  • CSAT Ratings: ${csatCount}`);
    console.log(`  • Comments: ${commentsCount}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🚀 Next Steps:');
    console.log('1. Start development server: npm run dev');
    console.log('2. Open http://localhost:9002/tickets');
    console.log('3. Begin testing features from TESTING_GUIDE.md\n');

    console.log('💡 Tips:');
    console.log(`  • To use this org ID: export ORG_ID="${ORG_ID}"`);
    console.log('  • To create more test data: run this script again');
    console.log('  • To reset: delete collections and re-run\n');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('✓ Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createTestData()
    .then(() => {
      console.log('\n✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { createTestData };
