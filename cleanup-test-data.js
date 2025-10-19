// Cleanup script - removes all test assets, credentials, tokens, and snapshots
const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '.env.local');
let uri = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  if (match) {
    uri = match[1].trim();
  }
}

if (!uri) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function cleanup() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('deskwise');
    const orgId = '68e58cd6b25f052c6692aa1b';

    console.log(`Cleaning up data for orgId: ${orgId}\n`);

    // Delete all auto-created assets (assets with AUTO- prefix in assetTag)
    const assetsResult = await db.collection('assets').deleteMany({
      orgId: orgId,
      assetTag: { $regex: /^AUTO-/ }
    });
    console.log(`✓ Deleted ${assetsResult.deletedCount} auto-created assets`);

    // Delete all enrollment tokens
    const tokensResult = await db.collection('enrollment_tokens').deleteMany({
      orgId: orgId
    });
    console.log(`✓ Deleted ${tokensResult.deletedCount} enrollment tokens`);

    // Delete all agent credentials
    const credsResult = await db.collection('agent_credentials').deleteMany({
      orgId: orgId
    });
    console.log(`✓ Deleted ${credsResult.deletedCount} agent credentials`);

    // Delete all performance snapshots
    const snapshotsResult = await db.collection('performance_snapshots').deleteMany({
      orgId: orgId
    });
    console.log(`✓ Deleted ${snapshotsResult.deletedCount} performance snapshots`);

    console.log('\n✅ Cleanup complete! Ready for fresh testing.');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

cleanup();
