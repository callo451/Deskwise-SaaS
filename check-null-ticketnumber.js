const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('deskwise');

  console.log('Checking for null ticketNumber in source collections...\n');

  const nullTickets = await db.collection('tickets').find({
    orgId: { $ne: null },
    ticketNumber: null
  }).toArray();

  const nullIncidents = await db.collection('incidents').find({
    orgId: { $ne: null },
    incidentNumber: null
  }).toArray();

  const nullChanges = await db.collection('change_requests').find({
    orgId: { $ne: null },
    changeNumber: null
  }).toArray();

  console.log('Tickets with null ticketNumber:', nullTickets.length);
  if (nullTickets.length > 0) {
    console.log('Sample:', JSON.stringify(nullTickets[0], null, 2));
  }

  console.log('\nIncidents with null incidentNumber:', nullIncidents.length);
  if (nullIncidents.length > 0) {
    console.log('Sample:', JSON.stringify(nullIncidents[0], null, 2));
  }

  console.log('\nChanges with null changeNumber:', nullChanges.length);
  if (nullChanges.length > 0) {
    console.log('Sample:', JSON.stringify(nullChanges[0], null, 2));
  }

  await client.close();
}

checkData().catch(console.error);
