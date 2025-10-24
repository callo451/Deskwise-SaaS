const https = require('https');

// Test configuration
const BASE_URL = 'http://localhost:9002';

// Simple HTTP GET request
function get(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = require(url.protocol === 'https:' ? 'https' : 'http').request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testUnifiedTicketsAPI() {
  console.log('🧪 Testing Unified Tickets API\n');

  try {
    // Test 1: GET /api/unified-tickets (public endpoint or requires auth?)
    console.log('Test 1: GET /api/unified-tickets');
    const listResponse = await get('/api/unified-tickets');
    console.log(`  Status: ${listResponse.status}`);

    if (listResponse.status === 200) {
      const tickets = listResponse.body;
      console.log(`  ✅ Success - Retrieved ${Array.isArray(tickets) ? tickets.length : 'N/A'} tickets`);
      if (Array.isArray(tickets) && tickets.length > 0) {
        console.log(`  Sample ticket: ${tickets[0].ticketNumber} - "${tickets[0].title}"`);
        console.log(`    ├─ Type: ${tickets[0].ticketType}`);
        console.log(`    ├─ Status: ${tickets[0].status}`);
        console.log(`    └─ Priority: ${tickets[0].priority || 'N/A'}`);
      }
    } else if (listResponse.status === 401) {
      console.log('  ⚠️  Requires authentication - Expected for production API');
    } else {
      console.log(`  ❌ Unexpected status: ${listResponse.status}`);
      console.log(`  Response: ${JSON.stringify(listResponse.body, null, 2)}`);
    }

    console.log('\nTest 2: GET /api/unified-tickets/stats');
    const statsResponse = await get('/api/unified-tickets/stats');
    console.log(`  Status: ${statsResponse.status}`);

    if (statsResponse.status === 200) {
      const stats = statsResponse.body;
      console.log('  ✅ Success - Statistics:');
      console.log(`    ├─ Total: ${stats.total || 'N/A'}`);
      console.log(`    ├─ Tickets: ${stats.byType?.ticket || 0}`);
      console.log(`    ├─ Incidents: ${stats.byType?.incident || 0}`);
      console.log(`    ├─ Changes: ${stats.byType?.change || 0}`);
      console.log(`    ├─ Service Requests: ${stats.byType?.service_request || 0}`);
      console.log(`    └─ Problems: ${stats.byType?.problem || 0}`);
    } else if (statsResponse.status === 401) {
      console.log('  ⚠️  Requires authentication');
    } else {
      console.log(`  ❌ Unexpected status: ${statsResponse.status}`);
    }

    console.log('\n✅ API endpoint tests complete');
    console.log('\n📝 Note: Most endpoints require authentication.');
    console.log('   For full testing, log in via browser and use authenticated requests.');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testUnifiedTicketsAPI();
