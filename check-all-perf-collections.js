/**
 * Check all performance-related collections
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
const ASSET_ID = '68e4f969f25a4656bb4ba9f2';

async function checkAllPerfCollections() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  const perfCollections = [
    'performance_snapshots',
    'asset_performance_snapshots',
    'agent_performance_data',
    'performance_metrics',
    'agent_metrics'
  ];

  try {
    for (const collName of perfCollections) {
      console.log(`\n=== ${collName} ===`);

      const count = await db.collection(collName).countDocuments();
      console.log(`Total documents: ${count}`);

      if (count > 0) {
        // Check for our asset ID
        const assetDocs = await db.collection(collName)
          .find({ assetId: ASSET_ID })
          .limit(2)
          .toArray();

        console.log(`Documents for asset ${ASSET_ID}: ${assetDocs.length}`);

        if (assetDocs.length > 0) {
          console.log('\nSample document:');
          console.log(JSON.stringify(assetDocs[0], null, 2));
        }

        // Also check any documents (not filtered by assetId)
        const anyDocs = await db.collection(collName)
          .find()
          .limit(1)
          .toArray();

        if (anyDocs.length > 0 && assetDocs.length === 0) {
          console.log('\nSample document (any):');
          console.log(JSON.stringify(anyDocs[0], null, 2));
        }
      }
    }
  } finally {
    await client.close();
  }
}

checkAllPerfCollections();
