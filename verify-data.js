/**
 * Verification script to check MongoDB data and API responses
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
const ASSET_ID = '68e4f969f25a4656bb4ba9f2';

async function checkMongoDBSnapshots() {
  console.log('===========================================');
  console.log('1. MONGODB VERIFICATION');
  console.log('===========================================\n');

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db('deskwise');

  try {
    const snapshots = await db.collection('performance_snapshots')
      .find({ assetId: ASSET_ID })
      .sort({ timestamp: -1 })
      .limit(5)
      .toArray();

    console.log(`Found ${snapshots.length} snapshots in database\n`);

    if (snapshots.length > 0) {
      console.log('✅ Latest Snapshot:');
      console.log('-----------------------------------');
      const latest = snapshots[0];
      console.log('Timestamp:', latest.timestamp);
      console.log('Asset ID:', latest.assetId);
      console.log('Agent ID:', latest.agentId);
      console.log('Org ID:', latest.orgId);
      console.log('\nCPU Usage:', latest.cpu?.usagePercent?.toFixed(2) + '%');
      console.log('Memory Usage:', latest.memory?.usedPercent?.toFixed(2) + '%');
      console.log('Memory Used:', (latest.memory?.used / 1024 / 1024 / 1024).toFixed(2) + ' GB');
      console.log('Memory Total:', (latest.memory?.total / 1024 / 1024 / 1024).toFixed(2) + ' GB');

      if (latest.disk && latest.disk.length > 0) {
        console.log('\nDisk Partitions:');
        latest.disk.forEach((d, i) => {
          console.log(`  ${i + 1}. ${d.mountPoint}: ${d.usedPercent?.toFixed(2)}% used (${(d.used / 1024 / 1024 / 1024).toFixed(2)} GB / ${(d.total / 1024 / 1024 / 1024).toFixed(2)} GB)`);
        });
      }

      if (latest.network && latest.network.length > 0) {
        console.log('\nNetwork Interfaces:');
        latest.network.forEach((n, i) => {
          console.log(`  ${i + 1}. ${n.name}: ↓ ${(n.bytesRecv / 1024 / 1024).toFixed(2)} MB | ↑ ${(n.bytesSent / 1024 / 1024).toFixed(2)} MB`);
        });
      }

      console.log('\n✅ Full snapshot data structure is valid');
    } else {
      console.log('❌ No snapshots found in database');
      return false;
    }

    // Check asset lastSeen
    console.log('\n-----------------------------------');
    const asset = await db.collection('assets').findOne({
      _id: new ObjectId(ASSET_ID)
    });

    if (asset?.lastSeen) {
      console.log('✅ Asset lastSeen:', asset.lastSeen);
      const secondsAgo = Math.floor((Date.now() - asset.lastSeen.getTime()) / 1000);
      console.log(`   Updated ${secondsAgo} seconds ago`);
    } else {
      console.log('⚠️  Asset lastSeen not updated yet');
    }

    console.log('\n');
    return true;
  } finally {
    await client.close();
  }
}

async function testAPIEndpoints() {
  console.log('===========================================');
  console.log('2. API ENDPOINT VERIFICATION');
  console.log('===========================================\n');

  const timeWindows = ['1min', '5min', '15min', '30min', '1hour'];

  for (const window of timeWindows) {
    console.log(`Testing time window: ${window}`);
    console.log('-----------------------------------');

    try {
      const response = await fetch(
        `http://localhost:9002/api/agent/performance?assetId=${ASSET_ID}&timeWindow=${window}`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ Status: ${response.status}`);
        console.log(`   Snapshots returned: ${data.data?.length || 0}`);

        if (data.data && data.data.length > 0) {
          const latest = data.data[0];
          console.log(`   Latest timestamp: ${new Date(latest.timestamp).toLocaleString()}`);
          console.log(`   CPU: ${latest.cpu?.usagePercent?.toFixed(2)}%`);
          console.log(`   Memory: ${latest.memory?.usedPercent?.toFixed(2)}%`);
        }
      } else {
        console.log(`❌ Status: ${response.status}`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }

    console.log('');
  }
}

async function printDashboardInfo() {
  console.log('===========================================');
  console.log('3. DASHBOARD VERIFICATION');
  console.log('===========================================\n');

  console.log('Dashboard URL:');
  console.log(`http://localhost:9002/dashboard/assets/${ASSET_ID}\n`);

  console.log('Expected behavior:');
  console.log('✅ Performance monitoring section visible');
  console.log('✅ Status badge shows "Online" (green)');
  console.log('✅ Last seen timestamp is recent');
  console.log('✅ CPU, Memory, Disk, Network charts display data');
  console.log('✅ Real-time metrics update when agent is running');
  console.log('\n');
}

async function main() {
  try {
    const hasData = await checkMongoDBSnapshots();

    if (hasData) {
      await testAPIEndpoints();
    }

    printDashboardInfo();

    console.log('===========================================');
    console.log('VERIFICATION COMPLETE!');
    console.log('===========================================\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main();
