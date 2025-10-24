const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function checkData() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('deskwise');
  
  const nullOrgId = await db.collection('unified_tickets').find({ orgId: null }).limit(5).toArray();
  const nullTicketNumber = await db.collection('unified_tickets').find({ ticketNumber: null }).limit(5).toArray();
  
  console.log('Records with null orgId:', nullOrgId.length);
  if (nullOrgId.length > 0) {
    console.log('Sample:', JSON.stringify(nullOrgId[0], null, 2));
  }
  
  console.log('\nRecords with null ticketNumber:', nullTicketNumber.length);
  if (nullTicketNumber.length > 0) {
    console.log('Sample:', JSON.stringify(nullTicketNumber[0], null, 2));
  }
  
  await client.close();
}

checkData().catch(console.error);
