// Quick script to verify performance data in MongoDB
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

async function checkPerformanceData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('deskwise');
    const orgId = '68e58cd6b25f052c6692aa1b';

    // Count performance snapshots
    const count = await db.collection('performance_snapshots').countDocuments({ orgId });
    console.log(`📊 Total performance snapshots: ${count}`);

    // Get latest snapshot
    const latest = await db.collection('performance_snapshots')
      .find({ orgId })
      .sort({ timestamp: -1 })
      .limit(1)
      .toArray();

    if (latest.length > 0) {
      const snapshot = latest[0];
      console.log('\n📈 Latest snapshot:');
      console.log(`   Asset ID: ${snapshot.assetId}`);
      console.log(`   Timestamp: ${new Date(snapshot.timestamp).toLocaleString()}`);
      console.log(`   CPU Usage: ${snapshot.performanceData.cpu.usage.toFixed(2)}%`);
      console.log(`   Memory Usage: ${snapshot.performanceData.memory.usagePercent.toFixed(2)}%`);
      console.log(`   Memory Used: ${(snapshot.performanceData.memory.usedBytes / (1024**3)).toFixed(2)} GB`);
      console.log(`   Memory Total: ${(snapshot.performanceData.memory.totalBytes / (1024**3)).toFixed(2)} GB`);

      if (snapshot.performanceData.disk?.length > 0) {
        console.log(`\n💾 Disk Info:`);
        snapshot.performanceData.disk.forEach(disk => {
          console.log(`   ${disk.name}: ${disk.usagePercent.toFixed(2)}% used (${(disk.usedBytes / (1024**3)).toFixed(2)} GB / ${(disk.totalBytes / (1024**3)).toFixed(2)} GB)`);
        });
      }

      if (snapshot.performanceData.network) {
        console.log(`\n🌐 Network Usage: ${(snapshot.performanceData.network.totalUsage / 1024).toFixed(2)} KB/s`);
      }

      console.log(`\n🖥️  System Info:`);
      console.log(`   Uptime: ${(snapshot.performanceData.system.uptime / 3600).toFixed(2)} hours`);
      console.log(`   Processes: ${snapshot.performanceData.system.processCount}`);
      console.log(`   Threads: ${snapshot.performanceData.system.threadCount}`);
    } else {
      console.log('\n⚠️  No performance snapshots found');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkPerformanceData();
