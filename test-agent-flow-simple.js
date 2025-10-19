/**
 * Test script for agent-to-API-to-dashboard flow
 * This script creates a test asset and verifies the complete monitoring pipeline
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Read MongoDB URI from .env.local
function getMongoDBURI() {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/MONGODB_URI=(.+)/);
  return match ? match[1].trim() : null;
}

const MONGODB_URI = getMongoDBURI();
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

function printAgentCommand(assetId) {
  console.log('-----------------------------------');
  console.log('AGENT COMMAND:');
  console.log('-----------------------------------\n');
  console.log('Run this command in a NEW terminal window:\n');
  console.log(`cd "C:\\Users\\User\\Desktop\\Projects\\Deskwise\\agent\\builds"\n`);
  console.log(`deskwise-agent-windows-amd64.exe -server "http://localhost:9002" -asset-id "${assetId}" -org-id "${TEST_ORG_ID}" -api-key "dev-agent-key" -interval 10\n`);
  console.log('Let the agent run for at least 30 seconds (3+ snapshots)\n');
  console.log('-----------------------------------\n');
}

function printVerificationSteps(assetId) {
  console.log('-----------------------------------');
  console.log('VERIFICATION STEPS:');
  console.log('-----------------------------------\n');
  console.log('After running the agent for 30+ seconds:\n');
  console.log('1. MongoDB Check:');
  console.log(`   db.performance_snapshots.find({assetId: "${assetId}"}).sort({timestamp: -1}).limit(5)\n`);
  console.log('2. API Check:');
  console.log(`   curl "http://localhost:9002/api/agent/performance?assetId=${assetId}&timeWindow=5min"\n`);
  console.log('3. Dashboard Check:');
  console.log(`   http://localhost:9002/dashboard/assets/${assetId}\n`);
  console.log('-----------------------------------\n');
}

async function main() {
  console.log('===========================================');
  console.log('AGENT-TO-API-TO-DASHBOARD FLOW TEST');
  console.log('===========================================\n');

  try {
    // Create test asset
    const asset = await createTestAsset();
    const assetId = asset._id.toString();

    // Print commands
    printAgentCommand(assetId);
    printVerificationSteps(assetId);

    console.log('✅ Setup complete! Now run the agent and verify the results.\n');

    // Save asset ID to file for later verification
    fs.writeFileSync(
      path.join(__dirname, 'test-asset-id.txt'),
      assetId
    );
    console.log('📝 Asset ID saved to test-asset-id.txt\n');

  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

main();
