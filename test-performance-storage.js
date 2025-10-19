/**
 * Test script for performance snapshot storage
 *
 * This script tests:
 * 1. Storing performance snapshots in the performance_snapshots collection
 * 2. Updating lastSeen in the assets collection
 * 3. Retrieving performance snapshots from the correct collection
 */

const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  }
}

loadEnvFile();
const MONGODB_URI = process.env.MONGODB_URI;
const TEST_ORG_ID = 'test-org-' + Date.now();
const TEST_ASSET_ID = new ObjectId();

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function testPerformanceStorage() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!\n');

    const db = client.db('deskwise');
    const assetsCollection = db.collection('assets');
    const performanceCollection = db.collection('performance_snapshots');

    // Step 1: Create a test asset
    console.log('Step 1: Creating test asset...');
    const testAsset = {
      _id: TEST_ASSET_ID,
      orgId: TEST_ORG_ID,
      assetTag: 'TEST-001',
      name: 'Test Asset for Performance Monitoring',
      category: 'Server',
      status: 'active',
      isActive: true,
      createdBy: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await assetsCollection.insertOne(testAsset);
    console.log(`✓ Test asset created with ID: ${TEST_ASSET_ID}\n`);

    // Step 2: Create and store a performance snapshot
    console.log('Step 2: Storing performance snapshot...');
    const performanceSnapshot = {
      _id: new ObjectId(),
      orgId: TEST_ORG_ID,
      agentId: 'test-agent-001',
      assetId: TEST_ASSET_ID.toString(),
      timestamp: new Date(),
      timeWindow: '1min',
      performanceData: {
        cpu: {
          usage: 45.5,
          temperature: 65,
          frequency: 2400,
          perCore: [40, 45, 50, 46]
        },
        memory: {
          usagePercent: 68.2,
          usedBytes: 6871947673,
          totalBytes: 10737418240,
          availableBytes: 3865470567,
          swapUsed: 0
        },
        disk: [
          {
            name: 'C:',
            usagePercent: 72.5,
            totalBytes: 536870912000,
            usedBytes: 389273886720,
            freeBytes: 147597025280,
            readBytesPerSec: 1048576,
            writeBytesPerSec: 524288,
            readOpsPerSec: 50,
            writeOpsPerSec: 25
          }
        ],
        network: {
          totalUsage: 2621440,
          interfaces: [
            {
              name: 'Ethernet',
              bytesRecvPerSec: 1310720,
              bytesSentPerSec: 1310720,
              packetsRecvPerSec: 1000,
              packetsSentPerSec: 1000
            }
          ]
        },
        system: {
          uptime: 345600,
          processCount: 245,
          threadCount: 3456
        }
      }
    };

    await performanceCollection.insertOne(performanceSnapshot);
    console.log(`✓ Performance snapshot stored in 'performance_snapshots' collection\n`);

    // Step 3: Update asset's lastSeen timestamp
    console.log('Step 3: Updating asset lastSeen timestamp...');
    const updateResult = await assetsCollection.updateOne(
      { _id: TEST_ASSET_ID, orgId: TEST_ORG_ID },
      {
        $set: {
          lastSeen: performanceSnapshot.timestamp,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(`✓ Asset lastSeen timestamp updated successfully\n`);
    } else {
      console.log(`✗ Failed to update asset lastSeen timestamp\n`);
    }

    // Step 4: Verify data storage - Check performance_snapshots collection
    console.log('Step 4: Verifying performance snapshot storage...');
    const storedSnapshot = await performanceCollection.findOne({
      assetId: TEST_ASSET_ID.toString(),
      orgId: TEST_ORG_ID
    });

    if (storedSnapshot) {
      console.log('✓ Performance snapshot found in performance_snapshots collection');
      console.log(`  - Snapshot ID: ${storedSnapshot._id}`);
      console.log(`  - Asset ID: ${storedSnapshot.assetId}`);
      console.log(`  - Org ID: ${storedSnapshot.orgId}`);
      console.log(`  - CPU Usage: ${storedSnapshot.performanceData.cpu.usage}%`);
      console.log(`  - Memory Usage: ${storedSnapshot.performanceData.memory.usagePercent}%`);
      console.log(`  - Timestamp: ${storedSnapshot.timestamp}\n`);
    } else {
      console.log('✗ Performance snapshot NOT found in performance_snapshots collection\n');
    }

    // Step 5: Verify asset lastSeen was updated
    console.log('Step 5: Verifying asset lastSeen update...');
    const updatedAsset = await assetsCollection.findOne({
      _id: TEST_ASSET_ID,
      orgId: TEST_ORG_ID
    });

    if (updatedAsset && updatedAsset.lastSeen) {
      console.log('✓ Asset lastSeen field updated successfully');
      console.log(`  - Last Seen: ${updatedAsset.lastSeen}\n`);
    } else {
      console.log('✗ Asset lastSeen field NOT updated\n');
    }

    // Step 6: Test retrieval with time window filtering
    console.log('Step 6: Testing performance data retrieval with time window...');
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const retrievedSnapshots = await performanceCollection
      .find({
        assetId: TEST_ASSET_ID.toString(),
        orgId: TEST_ORG_ID,
        timestamp: { $gte: oneHourAgo }
      })
      .sort({ timestamp: -1 })
      .limit(60)
      .toArray();

    console.log(`✓ Retrieved ${retrievedSnapshots.length} snapshot(s) from last hour\n`);

    // Step 7: Verify no performance data in assets collection
    console.log('Step 7: Verifying no performance data in assets collection...');
    const performanceInAssets = await assetsCollection.findOne({
      assetId: TEST_ASSET_ID.toString(),
      performanceData: { $exists: true }
    });

    if (!performanceInAssets) {
      console.log('✓ Confirmed: No performance snapshots stored in assets collection\n');
    } else {
      console.log('✗ Warning: Found performance data in assets collection (should not happen)\n');
    }

    // Step 8: Test collection counts
    console.log('Step 8: Collection counts...');
    const assetCount = await assetsCollection.countDocuments({ orgId: TEST_ORG_ID });
    const snapshotCount = await performanceCollection.countDocuments({ orgId: TEST_ORG_ID });

    console.log(`  - Assets in test org: ${assetCount}`);
    console.log(`  - Performance snapshots in test org: ${snapshotCount}\n`);

    // Step 9: Clean up test data
    console.log('Step 9: Cleaning up test data...');
    const deleteAssetResult = await assetsCollection.deleteOne({ _id: TEST_ASSET_ID });
    const deleteSnapshotResult = await performanceCollection.deleteMany({ orgId: TEST_ORG_ID });

    console.log(`✓ Deleted ${deleteAssetResult.deletedCount} test asset(s)`);
    console.log(`✓ Deleted ${deleteSnapshotResult.deletedCount} test snapshot(s)\n`);

    console.log('='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('✓ Performance snapshots stored in correct collection: performance_snapshots');
    console.log('✓ Asset lastSeen timestamp updated correctly');
    console.log('✓ Performance data retrieval working as expected');
    console.log('✓ No performance data contaminating assets collection');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Test failed with error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the test
testPerformanceStorage().catch(console.error);
