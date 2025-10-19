// Quick script to update asset orgIds from "test-org" to the correct authenticated user orgId
const { MongoClient } = require('mongodb');
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

async function fixOrgIds() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('deskwise');

    // The correct orgId from your authenticated session
    const correctOrgId = '68e58cd6b25f052c6692aa1b';

    // Update assets collection
    const assetsResult = await db.collection('assets').updateMany(
      { orgId: 'test-org' },
      { $set: { orgId: correctOrgId } }
    );
    console.log(`Updated ${assetsResult.modifiedCount} assets`);

    // Update enrollment_tokens collection
    const tokensResult = await db.collection('enrollment_tokens').updateMany(
      { orgId: 'test-org' },
      { $set: { orgId: correctOrgId } }
    );
    console.log(`Updated ${tokensResult.modifiedCount} enrollment tokens`);

    // Update agent_credentials collection
    const credsResult = await db.collection('agent_credentials').updateMany(
      { orgId: 'test-org' },
      { $set: { orgId: correctOrgId } }
    );
    console.log(`Updated ${credsResult.modifiedCount} agent credentials`);

    // Update performance_snapshots collection
    const snapshotsResult = await db.collection('performance_snapshots').updateMany(
      { orgId: 'test-org' },
      { $set: { orgId: correctOrgId } }
    );
    console.log(`Updated ${snapshotsResult.modifiedCount} performance snapshots`);

    console.log('\n✓ All orgIds updated successfully!');
    console.log(`All "test-org" references changed to: ${correctOrgId}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

fixOrgIds();
