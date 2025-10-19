const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function checkCollections() {
  try {
    await client.connect();
    const db = client.db('deskwise');
    const collections = await db.listCollections().toArray();
    
    console.log('Existing collections in deskwise database:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    console.log(`\nTotal: ${collections.length} collections`);
    
  } finally {
    await client.close();
  }
}

checkCollections().catch(console.error);
