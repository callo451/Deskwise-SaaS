const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://deskwise:EGTu4A5C73WB8L56@deskwise.lx1sb.mongodb.net/?retryWrites=true&w=majority&appName=Deskwise';

async function checkAssets() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('deskwise');
    const assets = await db.collection('assets').find({}).sort({ createdAt: -1 }).limit(5).toArray();

    console.log('\n===== RECENT ASSETS =====');
    assets.forEach((asset, i) => {
      console.log(`\nAsset ${i + 1}:`);
      console.log(`  _id: ${asset._id}`);
      console.log(`  assetTag: ${asset.assetTag}`);
      console.log(`  name: ${asset.name}`);
      console.log(`  orgId: ${asset.orgId}`);
      console.log(`  capabilities: ${JSON.stringify(asset.capabilities || null, null, 2)}`);
      console.log(`  lastSeen: ${asset.lastSeen}`);
      console.log(`  createdAt: ${asset.createdAt}`);
    });
  } finally {
    await client.close();
  }
}

checkAssets().catch(console.error);
