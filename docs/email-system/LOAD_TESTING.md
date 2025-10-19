# Email Notification System - Load Testing Plan

## Overview

This document outlines load testing scenarios to ensure the email notification system performs well under high volume and stress conditions.

## Testing Objectives

- Validate system performance under normal and peak loads
- Identify bottlenecks and resource constraints
- Verify SES rate limit handling
- Test database performance with large datasets
- Ensure system stability under sustained load
- Measure response times and throughput

## Test Environment

### Infrastructure
- **Application Server:** Next.js production build
- **Database:** MongoDB Atlas (M10 or higher)
- **Email Service:** AWS SES (production quotas)
- **Load Generation:** k6, Artillery, or custom scripts

### Baseline Metrics
Document current performance before load testing:
- Average email send time: _______ ms
- Database query time: _______ ms
- API response time: _______ ms
- Server CPU usage: _______%
- Server memory usage: _______ MB
- Database connections: _______

---

## Test Scenarios

### 1. Concurrent Email Sending (100 Emails)

**Objective:** Verify system handles 100 simultaneous email requests.

**Test Script:**
```javascript
// k6 script: load-test-100-concurrent.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // 100 virtual users
  duration: '30s',
};

export default function () {
  const url = 'http://localhost:9002/api/notifications/trigger';

  const payload = JSON.stringify({
    eventType: 'ticket.created',
    data: {
      ticketNumber: `TICKET-${__VU}`,
      priority: 'high',
      subject: 'Load test ticket',
      requesterId: 'user_test',
      requesterEmail: `user${__VU}@example.com`
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'session-token-here'
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Run Test:**
```bash
k6 run load-test-100-concurrent.js
```

**Success Criteria:**
- ✅ All 100 requests complete successfully
- ✅ 95th percentile response time < 1000ms
- ✅ 99th percentile response time < 2000ms
- ✅ No failed requests
- ✅ No database connection errors
- ✅ All emails queued successfully

**Monitor:**
- Server CPU usage (should stay < 80%)
- Server memory usage (should not grow unbounded)
- Database connections (should not hit max limit)
- SES API calls (rate limiting applied)

---

### 2. High Volume Email Burst (1000 Emails in 1 Minute)

**Objective:** Test queueing system and throttling under burst load.

**Test Script:**
```javascript
// load-test-burst.js
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    burst: {
      executor: 'constant-arrival-rate',
      rate: 1000, // 1000 requests
      timeUnit: '1m', // in 1 minute
      duration: '1m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
  },
};

export default function () {
  const url = 'http://localhost:9002/api/notifications/trigger';

  const payload = JSON.stringify({
    eventType: 'ticket.created',
    data: {
      ticketNumber: `TICKET-${Date.now()}-${__VU}`,
      priority: 'medium',
      subject: 'Burst test ticket'
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': 'session-token-here'
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
}
```

**Success Criteria:**
- ✅ All 1000 requests accepted (200/202 status)
- ✅ Queueing system handles burst
- ✅ SES rate limits respected (14 emails/sec in production)
- ✅ All emails eventually delivered (within 5 minutes)
- ✅ No lost emails
- ✅ System remains responsive

**Monitor:**
- Queue depth (should grow then shrink)
- Email throughput (emails/second)
- SES throttling errors (should be zero with proper rate limiting)
- Background worker performance

---

### 3. Sustained Load (10,000 Emails Over 1 Hour)

**Objective:** Test system stability under sustained load.

**Test Script:**
```javascript
// load-test-sustained.js
export const options = {
  scenarios: {
    sustained: {
      executor: 'constant-arrival-rate',
      rate: 167, // ~10,000 emails per hour
      timeUnit: '1m',
      duration: '1h',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
};

export default function () {
  // Similar to burst test but sustained over 1 hour
  // ... (same request logic)
}
```

**Success Criteria:**
- ✅ All 10,000 emails processed
- ✅ No memory leaks (memory usage stable)
- ✅ No database connection leaks
- ✅ Consistent response times throughout test
- ✅ Error rate < 0.1%

**Monitor:**
- Memory usage over time (should be flat or sawtooth from GC)
- Database connection pool utilization
- Queue processing rate
- Average email delivery time

---

### 4. SES Rate Limit Testing

**Objective:** Verify SES rate limiting works correctly.

**SES Rate Limits (Production):**
- **Maximum Send Rate:** 14 emails/second
- **Daily Sending Quota:** 50,000 emails/day
- **Sandbox:** 1 email/second, 200 emails/day

**Test Scenario:**
```javascript
// test-ses-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const startTime = Date.now();
  const promises = [];

  // Attempt to send 100 emails as fast as possible
  for (let i = 0; i < 100; i++) {
    promises.push(
      axios.post('http://localhost:9002/api/notifications/trigger', {
        eventType: 'test.email',
        data: { recipient: `test${i}@example.com` }
      })
    );
  }

  const results = await Promise.allSettled(promises);
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000; // seconds

  console.log(`Sent 100 emails in ${duration} seconds`);
  console.log(`Rate: ${100 / duration} emails/second`);

  const successful = results.filter(r => r.status === 'fulfilled').length;
  console.log(`Successful: ${successful}`);
}

testRateLimit();
```

**Success Criteria:**
- ✅ Sending rate does not exceed SES limit (14/sec)
- ✅ No SES "Throttling" errors
- ✅ Emails queued when limit approached
- ✅ All emails eventually sent

**Expected Behavior:**
- Sandbox: 100 emails should take ~100 seconds (1/sec rate)
- Production: 100 emails should take ~7-8 seconds (14/sec rate)

---

### 5. Database Performance Testing

**Objective:** Test database performance with large datasets.

#### 5.1 Large Email Logs Table

**Setup:**
```javascript
// seed-email-logs.js
const { MongoClient } = require('mongodb');

async function seedLogs() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('deskwise');
  const collection = db.collection('email_logs');

  const batch = [];
  for (let i = 0; i < 100000; i++) {
    batch.push({
      orgId: 'test_org',
      recipient: `user${i}@example.com`,
      subject: `Test Email ${i}`,
      status: 'delivered',
      sentAt: new Date(),
      eventType: 'ticket.created'
    });

    // Insert in batches of 1000
    if (batch.length === 1000) {
      await collection.insertMany(batch);
      batch.length = 0;
      console.log(`Inserted ${i + 1} records`);
    }
  }

  console.log('Seeding complete');
  await client.close();
}

seedLogs();
```

**Test Queries:**
```javascript
// Test query performance with 100k+ logs
const startTime = Date.now();

const logs = await db.collection('email_logs')
  .find({ orgId: 'test_org', status: 'delivered' })
  .sort({ sentAt: -1 })
  .limit(50)
  .toArray();

const queryTime = Date.now() - startTime;
console.log(`Query time: ${queryTime}ms`);
```

**Success Criteria:**
- ✅ Query with 100k logs: < 100ms
- ✅ Query with 1M logs: < 500ms
- ✅ Indexes used (verify with `.explain()`)
- ✅ No full table scans

**Required Indexes:**
```javascript
db.email_logs.createIndex({ orgId: 1, sentAt: -1 });
db.email_logs.createIndex({ orgId: 1, status: 1 });
db.email_logs.createIndex({ orgId: 1, recipient: 1 });
```

#### 5.2 Template Rendering Performance

**Test:**
```javascript
// test-template-rendering.js
const Handlebars = require('handlebars');

const template = Handlebars.compile(`
  <html>
    <body>
      <h1>Ticket {{ticketNumber}}</h1>
      {{#each comments}}
        <div class="comment">
          <p>{{this.author}}: {{this.text}}</p>
        </div>
      {{/each}}
    </body>
  </html>
`);

const data = {
  ticketNumber: 'TICKET-001',
  comments: Array(100).fill({ author: 'User', text: 'Comment' })
};

const iterations = 1000;
const startTime = Date.now();

for (let i = 0; i < iterations; i++) {
  const result = template(data);
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`Average render time: ${avgTime}ms`);
```

**Success Criteria:**
- ✅ Average render time < 10ms
- ✅ Complex templates < 50ms
- ✅ No memory leaks over 10,000 renders

---

### 6. Concurrent Rule Evaluation

**Objective:** Test performance when multiple rules evaluated for single event.

**Setup:**
```javascript
// Create 50 notification rules
for (let i = 0; i < 50; i++) {
  await db.collection('notification_rules').insertOne({
    name: `Rule ${i}`,
    eventType: 'ticket.created',
    isActive: true,
    conditions: [
      { field: 'priority', operator: 'equals', value: 'high' }
    ],
    templateId: 'template_test',
    recipients: { type: 'role', roles: ['admin'] }
  });
}
```

**Test:**
```javascript
// Trigger event and measure rule evaluation time
const startTime = Date.now();

await notificationEngine.processEvent({
  type: 'ticket.created',
  data: { ticketNumber: 'TICKET-001', priority: 'high' }
});

const endTime = Date.now();
console.log(`Evaluated 50 rules in ${endTime - startTime}ms`);
```

**Success Criteria:**
- ✅ 50 rules evaluated in < 500ms
- ✅ 100 rules evaluated in < 1000ms
- ✅ Parallel evaluation if possible
- ✅ No race conditions

---

### 7. Email Queue Processing

**Objective:** Test background worker performance.

**Test Scenario:**
1. Queue 10,000 emails rapidly
2. Start background worker
3. Measure processing rate

**Test Script:**
```javascript
// test-queue-processing.js
async function testQueueProcessing() {
  // Queue 10,000 emails
  console.log('Queueing 10,000 emails...');
  for (let i = 0; i < 10000; i++) {
    await emailQueue.add({
      recipient: `user${i}@example.com`,
      subject: `Test ${i}`,
      body: 'Test email'
    });
  }

  console.log('Starting worker...');
  const startTime = Date.now();

  // Monitor queue depth
  const interval = setInterval(async () => {
    const pending = await emailQueue.count();
    console.log(`Pending: ${pending}`);

    if (pending === 0) {
      clearInterval(interval);
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const rate = 10000 / duration;

      console.log(`Processed 10,000 emails in ${duration}s`);
      console.log(`Rate: ${rate} emails/second`);
    }
  }, 5000);
}

testQueueProcessing();
```

**Success Criteria:**
- ✅ Processing rate matches or exceeds SES rate limit (14/sec)
- ✅ Queue drains completely
- ✅ No stuck jobs
- ✅ Error handling works (failed jobs retried)

---

## Performance Baselines

After testing, document baseline performance metrics:

### Response Times
| Operation | Avg | P95 | P99 | Max |
|-----------|-----|-----|-----|-----|
| API - Trigger Notification | ___ms | ___ms | ___ms | ___ms |
| DB - Insert Email Log | ___ms | ___ms | ___ms | ___ms |
| DB - Query Logs (100k records) | ___ms | ___ms | ___ms | ___ms |
| Template Rendering | ___ms | ___ms | ___ms | ___ms |
| Rule Evaluation (10 rules) | ___ms | ___ms | ___ms | ___ms |
| SES - Send Email | ___ms | ___ms | ___ms | ___ms |

### Throughput
| Metric | Value |
|--------|-------|
| Max emails/second | ___ |
| Max concurrent requests | ___ |
| Max queue processing rate | ___ |
| Max database writes/second | ___ |

### Resource Utilization
| Resource | Normal Load | Peak Load | Limit |
|----------|-------------|-----------|-------|
| CPU Usage | ___% | ___% | 80% |
| Memory Usage | ___MB | ___MB | ___MB |
| DB Connections | ___ | ___ | 100 |
| SES Rate | ___/s | ___/s | 14/s |

---

## Stress Testing

### Finding Breaking Points

Gradually increase load until system breaks:

**Test:**
```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 VUs
    { duration: '5m', target: 100 },   // Stay at 100 VUs
    { duration: '2m', target: 200 },   // Ramp up to 200 VUs
    { duration: '5m', target: 200 },   // Stay at 200 VUs
    { duration: '2m', target: 500 },   // Ramp up to 500 VUs
    { duration: '5m', target: 500 },   // Stay at 500 VUs
    { duration: '5m', target: 0 },     // Ramp down to 0
  ],
};
```

**Document:**
- At what load does error rate increase?
- At what load do response times degrade?
- What is the bottleneck? (CPU, memory, database, SES rate limit)
- What is the maximum sustainable load?

---

## Monitoring During Load Tests

Use these tools to monitor system health:

### Application Metrics
```bash
# Monitor Node.js process
pm2 monit

# Check memory usage
node --max-old-space-size=4096 app.js

# Enable profiling
node --inspect app.js
```

### Database Metrics
```javascript
// MongoDB Atlas: Monitor in web UI
// - CPU usage
// - Memory usage
// - Disk I/O
// - Connections
// - Operation execution times

// Or use MongoDB CLI
db.serverStatus()
db.currentOp()
```

### SES Metrics
```bash
# AWS CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/SES \
  --metric-name Send \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T01:00:00Z \
  --period 60 \
  --statistics Sum
```

---

## Optimization Recommendations

Based on load testing results, consider these optimizations:

### Application Level
- [ ] Implement caching for templates (compiled Handlebars templates)
- [ ] Use connection pooling for database
- [ ] Batch database inserts for email logs
- [ ] Implement request rate limiting
- [ ] Add Redis for queueing (if using in-memory queue)

### Database Level
- [ ] Ensure proper indexes exist
- [ ] Enable compression
- [ ] Partition large collections
- [ ] Implement TTL for old logs

### Infrastructure Level
- [ ] Scale horizontally (multiple app servers)
- [ ] Use load balancer
- [ ] Increase SES sending quota
- [ ] Use dedicated email queue (SQS, RabbitMQ, Bull)

---

## Continuous Performance Testing

Integrate load testing into CI/CD:

```yaml
# .github/workflows/load-test.yml
name: Performance Tests

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly
  workflow_dispatch: # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: load-tests/basic-load.js

      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: k6-results
          path: results/
```

---

## Sign-Off

**Load Testing Completed:** _______________
**Date:** _______________
**Tested By:** _______________
**Performance Acceptable:** [ ] Yes [ ] No
**Comments:** _______________________________________________
