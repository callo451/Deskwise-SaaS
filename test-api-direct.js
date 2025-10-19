/**
 * Test API endpoint directly with proper data format
 */

const ASSET_ID = '68e4f969f25a4656bb4ba9f2';
const ORG_ID = 'test-org';
const API_KEY = 'dev-agent-key';

// Create a test snapshot matching the agent's format
const testSnapshot = {
  agentId: 'test-manual-agent',
  assetId: ASSET_ID,
  timestamp: new Date().toISOString(),
  timeWindow: '1min',
  performanceData: {
    cpu: {
      usage: 45.2,
      temperature: 62.5,
      frequency: 3200.0,
      perCore: [42.1, 48.3, 45.9, 44.5]
    },
    memory: {
      usagePercent: 68.5,
      usedBytes: 8589934592,
      totalBytes: 17179869184,
      availableBytes: 8589934592
    },
    disk: [
      {
        name: 'C:\\',
        usagePercent: 72.3,
        totalBytes: 500000000000,
        usedBytes: 361500000000,
        freeBytes: 138500000000
      }
    ],
    network: {
      totalUsage: 170000,
      interfaces: [
        {
          name: 'Ethernet',
          bytesRecvPerSec: 125000,
          bytesSentPerSec: 45000,
          packetsRecvPerSec: 150,
          packetsSentPerSec: 80
        }
      ]
    },
    system: {
      uptime: 3600,
      processCount: 156,
      threadCount: 1024
    }
  }
};

async function testPost() {
  console.log('Testing POST /api/agent/performance...\n');
  console.log('Request payload:');
  console.log(JSON.stringify(testSnapshot, null, 2));
  console.log('\n-----------------------------------\n');

  try {
    const response = await fetch('http://localhost:9002/api/agent/performance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-Org-Id': ORG_ID
      },
      body: JSON.stringify(testSnapshot)
    });

    const data = await response.json();

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log('Response body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ POST successful!');
      return true;
    } else {
      console.log('\n❌ POST failed!');
      return false;
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    return false;
  }
}

async function testGet() {
  console.log('\n\n===================================');
  console.log('Testing GET /api/agent/performance...\n');

  try {
    const url = `http://localhost:9002/api/agent/performance?assetId=${ASSET_ID}&timeWindow=5min`;
    console.log(`URL: ${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-Org-Id': ORG_ID
      }
    });

    const data = await response.json();

    console.log(`Response Status: ${response.status} ${response.statusText}`);
    console.log('Response body:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log(`\n✅ GET successful! Returned ${data.data?.length || 0} snapshots`);
    } else {
      console.log('\n❌ GET failed!');
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

async function main() {
  console.log('===================================');
  console.log('API ENDPOINT DIRECT TEST');
  console.log('===================================\n');

  const postSuccess = await testPost();

  if (postSuccess) {
    // Wait a second for data to be written
    await new Promise(resolve => setTimeout(resolve, 1000));
    await testGet();
  }

  console.log('\n===================================');
  console.log('TEST COMPLETE');
  console.log('===================================\n');
}

main();
