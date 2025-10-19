// Check if asset has system information stored
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

async function checkAssetSystemInfo() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db('deskwise');
    const orgId = '68e58cd6b25f052c6692aa1b';

    // Get the latest asset
    const asset = await db.collection('assets')
      .findOne({ orgId }, { sort: { createdAt: -1 } });

    if (!asset) {
      console.log('❌ No assets found');
      return;
    }

    console.log('📋 Latest Asset:');
    console.log(`   ID: ${asset._id}`);
    console.log(`   Name: ${asset.name}`);
    console.log(`   Asset Tag: ${asset.assetTag}`);
    console.log(`   Created: ${asset.createdAt}`);
    console.log('\n');

    // Check for system info
    console.log('🖥️  System Information:');
    if (asset.systemInfo) {
      console.log('   ✅ Has systemInfo:');
      console.log(JSON.stringify(asset.systemInfo, null, 2));
    } else {
      console.log('   ❌ No systemInfo field');
    }

    console.log('\n💻 Hardware Information:');
    if (asset.hardwareInfo) {
      console.log('   ✅ Has hardwareInfo:');
      console.log(JSON.stringify(asset.hardwareInfo, null, 2));
    } else {
      console.log('   ❌ No hardwareInfo field');
    }

    console.log('\n🌐 Network Information:');
    if (asset.networkInfo) {
      console.log('   ✅ Has networkInfo:');
      console.log(JSON.stringify(asset.networkInfo, null, 2));
    } else {
      console.log('   ❌ No networkInfo field');
    }

    // Show all fields
    console.log('\n📄 All asset fields:');
    console.log(Object.keys(asset).join(', '));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
  }
}

checkAssetSystemInfo();
