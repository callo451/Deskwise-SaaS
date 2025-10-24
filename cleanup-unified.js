const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('deskwise');
  
  console.log('Dropping unified_tickets collection...');
  await db.collection('unified_tickets').drop().catch(() => console.log('Collection does not exist'));
  
  console.log('✅ Cleanup complete');
  await client.close();
}

cleanup().catch(console.error);
