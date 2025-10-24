const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifyMigration() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('deskwise');

  console.log('🔍 Verifying Unified Tickets Migration\n');

  // Check unified_tickets collection
  const totalRecords = await db.collection('unified_tickets').countDocuments();
  console.log(`Total records in unified_tickets: ${totalRecords}`);

  // Count by ticket type
  const tickets = await db.collection('unified_tickets').countDocuments({ ticketType: 'ticket' });
  const incidents = await db.collection('unified_tickets').countDocuments({ ticketType: 'incident' });
  const serviceRequests = await db.collection('unified_tickets').countDocuments({ ticketType: 'service_request' });
  const changes = await db.collection('unified_tickets').countDocuments({ ticketType: 'change' });
  const problems = await db.collection('unified_tickets').countDocuments({ ticketType: 'problem' });

  console.log('\nRecords by type:');
  console.log(`  ├─ Tickets: ${tickets}`);
  console.log(`  ├─ Incidents: ${incidents}`);
  console.log(`  ├─ Service Requests: ${serviceRequests}`);
  console.log(`  ├─ Changes: ${changes}`);
  console.log(`  └─ Problems: ${problems}`);

  // Check for null ticketNumber or orgId
  const nullTicketNumber = await db.collection('unified_tickets').countDocuments({ ticketNumber: null });
  const nullOrgId = await db.collection('unified_tickets').countDocuments({ orgId: null });

  console.log('\nData quality checks:');
  console.log(`  ├─ Records with null ticketNumber: ${nullTicketNumber}`);
  console.log(`  └─ Records with null orgId: ${nullOrgId}`);

  // Sample records from each type
  console.log('\nSample records:');

  const sampleTicket = await db.collection('unified_tickets').findOne({ ticketType: 'ticket' });
  if (sampleTicket) {
    console.log(`\n  Ticket: ${sampleTicket.ticketNumber} - "${sampleTicket.title}"`);
    console.log(`    ├─ Type: ${sampleTicket.ticketType}`);
    console.log(`    ├─ Status: ${sampleTicket.status}`);
    console.log(`    └─ Priority: ${sampleTicket.priority}`);
  }

  const sampleIncident = await db.collection('unified_tickets').findOne({ ticketType: 'incident' });
  if (sampleIncident) {
    console.log(`\n  Incident: ${sampleIncident.ticketNumber} - "${sampleIncident.title}"`);
    console.log(`    ├─ Type: ${sampleIncident.ticketType}`);
    console.log(`    ├─ Status: ${sampleIncident.status}`);
    console.log(`    ├─ Severity: ${sampleIncident.metadata?.severity || 'N/A'}`);
    console.log(`    └─ Legacy Number: ${sampleIncident.legacyNumber || 'N/A'}`);
  }

  const sampleChange = await db.collection('unified_tickets').findOne({ ticketType: 'change' });
  if (sampleChange) {
    console.log(`\n  Change: ${sampleChange.ticketNumber} - "${sampleChange.title}"`);
    console.log(`    ├─ Type: ${sampleChange.ticketType}`);
    console.log(`    ├─ Status: ${sampleChange.status}`);
    console.log(`    ├─ Risk: ${sampleChange.metadata?.risk || 'N/A'}`);
    console.log(`    └─ Legacy Number: ${sampleChange.legacyNumber || 'N/A'}`);
  }

  // Check indexes
  const indexes = await db.collection('unified_tickets').indexes();
  console.log(`\nIndexes created: ${indexes.length}`);
  indexes.forEach(idx => {
    console.log(`  ├─ ${idx.name}: ${JSON.stringify(idx.key)}`);
  });

  console.log('\n✅ Migration verification complete!\n');
  await client.close();
}

verifyMigration().catch(console.error);
