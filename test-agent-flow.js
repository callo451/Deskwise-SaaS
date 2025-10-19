/**
 * Test script for agent-to-API-to-dashboard flow
 * This script creates a test asset and verifies the complete monitoring pipeline
 */

const { MongoClient, ObjectId } = require('mongodb');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const TEST_ORG_ID = 'test-org';
const TEST_USER_ID = 'test-user';

async function createTestAsset() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  try {
    console.log('Creating test asset...');

    const asset = {
      _id: new ObjectId(),
      orgId: TEST_ORG_ID,
      assetTag: 'TEST-001',
      name: 'Test Monitoring Asset',
      category: 'Server',
      status: 'active',
      manufacturer: 'Dell',
      model: 'PowerEdge R740',
      location: 'Data Center 1',
      specifications: {
        cpu: 'Intel Xeon Gold 6248',
        ram: '128GB DDR4',
        storage: '2TB NVMe SSD'
      },
      createdBy: TEST_USER_ID,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('assets').insertOne(asset);

    console.log('✅ Test asset created successfully!');
    console.log('Asset ID:', asset._id.toString());
    console.log('Asset Tag:', asset.assetTag);
    console.log('Name:', asset.name);
    console.log('Category:', asset.category);
    console.log('Status:', asset.status);
    console.log('\n-----------------------------------\n');

    return asset;
  } finally {
    await client.close();
  }
}

async function verifyEnvironmentVariables() {
  console.log('Checking environment variables...');
  const fs = require('fs');
  const path = require('path');

  const envPath = path.join(__dirname, '.env.local');

  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local not found!');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasAgentKey = envContent.includes('AGENT_API_KEY');

  if (!hasAgentKey) {
    console.log('⚠️  AGENT_API_KEY not found in .env.local');
    console.log('Adding AGENT_API_KEY=dev-agent-key to .env.local...');

    fs.appendFileSync(envPath, '\n\n# Agent API Key\nAGENT_API_KEY=dev-agent-key\n');
    console.log('✅ AGENT_API_KEY added to .env.local');
  } else {
    console.log('✅ AGENT_API_KEY found in .env.local');
  }

  console.log('\n-----------------------------------\n');
  return true;
}

async function checkPerformanceSnapshots(assetId) {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  try {
    console.log('Checking performance snapshots for asset:', assetId);

    const snapshots = await db.collection('performance_snapshots')
      .find({ assetId })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    console.log(`Found ${snapshots.length} snapshots`);

    if (snapshots.length > 0) {
      console.log('\n✅ Sample snapshot:');
      console.log(JSON.stringify(snapshots[0], null, 2));
    } else {
      console.log('⚠️  No snapshots found yet. Agent may not have sent data.');
    }

    return snapshots;
  } finally {
    await client.close();
  }
}

async function checkAssetLastSeen(assetId) {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  try {
    console.log('\nChecking asset lastSeen field...');

    const asset = await db.collection('assets').findOne({
      _id: new ObjectId(assetId)
    });

    if (asset?.lastSeen) {
      console.log('✅ Asset lastSeen:', asset.lastSeen);
      const secondsAgo = Math.floor((Date.now() - asset.lastSeen.getTime()) / 1000);
      console.log(`   (${secondsAgo} seconds ago)`);
    } else {
      console.log('⚠️  Asset lastSeen not set yet');
    }

    return asset;
  } finally {
    await client.close();
  }
}

async function testAPIEndpoint(assetId) {
  console.log('\nTesting API endpoint...');

  try {
    const response = await fetch(
      `http://localhost:9002/api/agent/performance?assetId=${assetId}&timeWindow=5min`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const data = await response.json();

    console.log('API Response Status:', response.status);
    console.log('API Response:', JSON.stringify(data, null, 2));

    if (data.success && data.data?.length > 0) {
      console.log(`✅ API returned ${data.data.length} snapshots`);
    } else {
      console.log('⚠️  API returned no snapshots');
    }

    return data;
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    return null;
  }
}

async function printAgentCommand(assetId) {
  console.log('\n-----------------------------------');
  console.log('AGENT COMMAND:');
  console.log('-----------------------------------\n');
  console.log(`cd "C:\\Users\\User\\Desktop\\Projects\\Deskwise\\agent\\builds"\n`);
  console.log(`deskwise-agent-windows-amd64.exe -server "http://localhost:9002" -asset-id "${assetId}" -org-id "${TEST_ORG_ID}" -api-key "dev-agent-key" -interval 10\n`);
  console.log('-----------------------------------\n');
  console.log('Dashboard URL:');
  console.log(`http://localhost:9002/dashboard/assets/${assetId}`);
  console.log('-----------------------------------\n');
}

async function main() {
  console.log('===========================================');
  console.log('AGENT-TO-API-TO-DASHBOARD FLOW TEST');
  console.log('===========================================\n');

  try {
    // Step 1: Create test asset
    const asset = await createTestAsset();
    const assetId = asset._id.toString();

    // Step 2: Verify environment variables
    await verifyEnvironmentVariables();

    // Step 3: Print agent command
    printAgentCommand(assetId);

    console.log('⏳ Waiting for you to run the agent...');
    console.log('   Press Ctrl+C after the agent has run for 30+ seconds\n');

    // Wait for user to run agent (they'll Ctrl+C when done)
    await new Promise(resolve => {
      process.on('SIGINT', async () => {
        console.log('\n\n===========================================');
        console.log('VERIFYING DATA...');
        console.log('===========================================\n');

        // Step 4: Check performance snapshots
        await checkPerformanceSnapshots(assetId);

        // Step 5: Check asset lastSeen
        await checkAssetLastSeen(assetId);

        // Step 6: Test API endpoint
        await testAPIEndpoint(assetId);

        console.log('\n===========================================');
        console.log('TEST COMPLETE!');
        console.log('===========================================\n');
        console.log('Next step: Visit the dashboard URL to verify UI display');
        console.log(`http://localhost:9002/dashboard/assets/${assetId}\n`);

        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
