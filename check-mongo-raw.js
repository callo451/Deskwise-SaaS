/**
 * Raw MongoDB check - look for any performance snapshots regardless of structure
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function getMongoDBURI() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  return match ? match[1].trim() : null;
}

const MONGODB_URI = getMongoDBURI();

async function checkCollections() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  try {
    console.log('Checking all collections in deskwise database...\n');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    console.log('\n-----------------------------------\n');

    // Check performance_snapshots collection
    console.log('Checking performance_snapshots collection:');
    const perfCount = await db.collection('performance_snapshots').countDocuments();
    console.log(`Total documents: ${perfCount}`);

    if (perfCount > 0) {
      console.log('\nSample documents:');
      const samples = await db.collection('performance_snapshots')
        .find()
        .limit(3)
        .toArray();

      samples.forEach((doc, i) => {
        console.log(`\nDocument ${i + 1}:`);
        console.log(JSON.stringify(doc, null, 2));
      });
    }

    console.log('\n-----------------------------------\n');

    // Check assets collection for the test asset
    console.log('Checking test asset:');
    const asset = await db.collection('assets').findOne({
      assetTag: 'TEST-001'
    });

    if (asset) {
      console.log('Asset found:');
      console.log(`  ID: ${asset._id}`);
      console.log(`  Name: ${asset.name}`);
      console.log(`  Status: ${asset.status}`);
      console.log(`  Last Seen: ${asset.lastSeen || 'Not set'}`);
      console.log(`  Created: ${asset.createdAt}`);
    } else {
      console.log('Test asset not found!');
    }

  } finally {
    await client.close();
  }
}

checkCollections();
