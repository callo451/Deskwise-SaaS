# Accounting Integrations Setup and Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [OAuth App Registration](#oauth-app-registration)
  - [Xero App Setup](#xero-app-setup)
  - [QuickBooks App Setup](#quickbooks-app-setup)
  - [MYOB App Setup](#myob-app-setup)
- [Database Setup](#database-setup)
- [Webhook Configuration](#webhook-configuration)
- [Testing in Development](#testing-in-development)
- [Production Deployment Checklist](#production-deployment-checklist)
- [Monitoring and Logging](#monitoring-and-logging)

---

## Prerequisites

Before setting up accounting integrations, ensure you have:

1. **Deskwise Platform**:
   - Next.js 15 application running
   - MongoDB database configured
   - Redis instance for queue management (Bull/BullMQ)
   - NextAuth.js authentication configured

2. **Developer Accounts**:
   - Xero Developer Account (https://developer.xero.com)
   - QuickBooks Developer Account (https://developer.intuit.com)
   - MYOB Developer Account (https://developer.myob.com)

3. **SSL/TLS Certificate**:
   - Valid SSL certificate for your domain
   - Required for OAuth redirect URIs

4. **Dependencies**:
   ```bash
   npm install xero-node intuit-oauth axios bull bullmq ioredis
   ```

---

## Environment Variables

Add the following to your `.env.local` file:

### General Configuration

```env
# Base URL (must be HTTPS in production)
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# MongoDB (already configured)
MONGODB_URI=mongodb+srv://your-connection-string

# Redis (for sync queue)
REDIS_URL=redis://localhost:6379
```

### Xero Configuration

```env
# Xero OAuth Credentials
XERO_CLIENT_ID=your_xero_client_id
XERO_CLIENT_SECRET=your_xero_client_secret
XERO_REDIRECT_URI=https://your-domain.com/api/integrations/accounting/callback/xero

# Xero Webhook Secret (for signature verification)
XERO_WEBHOOK_SECRET=your_xero_webhook_secret
```

### QuickBooks Configuration

```env
# QuickBooks OAuth Credentials
QBO_CLIENT_ID=your_quickbooks_client_id
QBO_CLIENT_SECRET=your_quickbooks_client_secret
QBO_REDIRECT_URI=https://your-domain.com/api/integrations/accounting/callback/quickbooks
QBO_ENVIRONMENT=production  # or 'sandbox' for testing

# QuickBooks Webhook Verification Token
QBO_WEBHOOK_VERIFIER_TOKEN=your_qbo_webhook_token
```

### MYOB Configuration

```env
# MYOB OAuth Credentials
MYOB_CLIENT_ID=your_myob_client_id
MYOB_CLIENT_SECRET=your_myob_client_secret
MYOB_REDIRECT_URI=https://your-domain.com/api/integrations/accounting/callback/myob

# MYOB API Key
MYOB_API_KEY=your_myob_api_key

# MYOB Webhook Secret
MYOB_WEBHOOK_SECRET=your_myob_webhook_secret
```

### Encryption Key

```env
# For encrypting OAuth tokens in database
INTEGRATION_ENCRYPTION_KEY=your-32-character-encryption-key-here-12345
```

**Generate encryption key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## OAuth App Registration

## Xero App Setup

### Step 1: Create Xero App

1. Go to https://developer.xero.com/app/manage
2. Click **New app**
3. Fill in app details:
   - **App name**: Deskwise Integration
   - **Company or application URL**: https://your-domain.com
   - **OAuth 2.0 redirect URI**: `https://your-domain.com/api/integrations/accounting/callback/xero`
   - **App type**: Web app

4. Click **Create app**

### Step 2: Get Credentials

1. Click on your newly created app
2. Navigate to **Configuration** tab
3. Copy **Client ID** → Add to `XERO_CLIENT_ID`
4. Click **Generate a secret** → Copy → Add to `XERO_CLIENT_SECRET`

### Step 3: Configure Scopes

Ensure the following scopes are enabled:
- ✅ `openid`
- ✅ `profile`
- ✅ `email`
- ✅ `accounting.transactions` (Read and Write)
- ✅ `accounting.contacts` (Read and Write)
- ✅ `accounting.settings` (Read only)

### Step 4: Configure Webhooks (Optional)

1. Navigate to **Webhooks** tab
2. Click **Add webhook**
3. **Webhook URL**: `https://your-domain.com/api/integrations/accounting/webhook/xero`
4. **Webhook key**: Generate a random string → Add to `XERO_WEBHOOK_SECRET`
5. Select events to subscribe to:
   - ✅ Invoice Updated
   - ✅ Invoice Created
   - ✅ Payment Created
   - ✅ Contact Updated
6. Click **Save**

### Step 5: Test Connection

```bash
# Test Xero OAuth flow in sandbox
curl -X POST http://localhost:9002/api/integrations/accounting/connect/xero
```

---

## QuickBooks App Setup

### Step 1: Create QuickBooks App

1. Go to https://developer.intuit.com/app/developer/myapps
2. Click **Create an app**
3. Select **QuickBooks Online and Payments**
4. Click **Select APIs**
5. Choose **Accounting**
6. Fill in app details:
   - **App name**: Deskwise Integration
   - **App description**: ITSM platform integration
7. Click **Create app**

### Step 2: Get Credentials

1. Click on your app
2. Navigate to **Keys & credentials** (Production or Development)
3. Copy **Client ID** → Add to `QBO_CLIENT_ID`
4. Copy **Client Secret** → Add to `QBO_CLIENT_SECRET`

### Step 3: Configure Redirect URIs

1. Scroll to **Redirect URIs** section
2. Add URI: `https://your-domain.com/api/integrations/accounting/callback/quickbooks`
3. Click **Save**

### Step 4: Configure Webhooks

1. Navigate to **Webhooks** tab
2. Click **Create a webhook**
3. **Endpoint URL**: `https://your-domain.com/api/integrations/accounting/webhook/quickbooks`
4. **Entities to monitor**:
   - ✅ Invoice
   - ✅ Estimate
   - ✅ Customer
   - ✅ Payment
5. **Verifier Token**: Generate → Copy → Add to `QBO_WEBHOOK_VERIFIER_TOKEN`
6. Click **Save**

### Step 5: Submit for Production

**Development/Sandbox:**
- Use sandbox credentials for testing
- Set `QBO_ENVIRONMENT=sandbox`

**Production:**
1. Complete app profile
2. Submit app for Intuit review
3. Wait for approval (2-5 business days)
4. Set `QBO_ENVIRONMENT=production`
5. Update credentials to production keys

---

## MYOB App Setup

### Step 1: Register MYOB App

1. Go to https://developer.myob.com/program/
2. Click **Register App**
3. Fill in application details:
   - **Application name**: Deskwise Integration
   - **Description**: ITSM platform with billing integration
   - **Redirect URI**: `https://your-domain.com/api/integrations/accounting/callback/myob`
   - **Website**: https://your-domain.com

### Step 2: Get Credentials

1. After registration, view your app
2. Copy **Client ID** (API Key) → Add to `MYOB_CLIENT_ID` and `MYOB_API_KEY`
3. Copy **Client Secret** → Add to `MYOB_CLIENT_SECRET`

### Step 3: Configure Permissions

Ensure the following permissions are requested:
- ✅ `CompanyFile` (Read)
- ✅ `Contact` (Read, Write)
- ✅ `Sale` (Read, Write)
- ✅ `GeneralLedger` (Read)
- ✅ `Inventory` (Read, Write)

### Step 4: Configure Webhooks (if available)

MYOB webhook support varies by API version. Check current documentation.

1. If supported, configure webhook endpoint: `https://your-domain.com/api/integrations/accounting/webhook/myob`
2. Generate webhook secret → Add to `MYOB_WEBHOOK_SECRET`

### Step 5: Testing

**Development:**
- MYOB provides test company files
- Use sandbox environment for testing

**Production:**
- Submit app for MYOB review
- Approval required for production use

---

## Database Setup

### Create Collections and Indexes

Run this script to set up required collections:

```javascript
// scripts/setup-accounting-integrations-db.js

const { MongoClient } = require('mongodb')

async function setupDatabase() {
  const client = new MongoClient(process.env.MONGODB_URI)
  await client.connect()

  const db = client.db('deskwise')

  // Create collections
  const collections = [
    'accounting_connections',
    'accounting_mappings',
    'accounting_sync_queue',
    'accounting_sync_history',
    'accounting_webhooks'
  ]

  for (const collectionName of collections) {
    const exists = await db.listCollections({ name: collectionName }).hasNext()
    if (!exists) {
      await db.createCollection(collectionName)
      console.log(`Created collection: ${collectionName}`)
    }
  }

  // Create indexes
  await db.collection('accounting_connections').createIndexes([
    { key: { orgId: 1, platform: 1 }, unique: true },
    { key: { tenantId: 1 } },
    { key: { tokenExpiry: 1 } }
  ])

  await db.collection('accounting_mappings').createIndexes([
    { key: { orgId: 1, platform: 1, mappingType: 1 }, unique: true }
  ])

  await db.collection('accounting_sync_queue').createIndexes([
    { key: { orgId: 1, status: 1 } },
    { key: { jobId: 1 }, unique: true },
    { key: { scheduledFor: 1 } },
    { key: { entityType: 1, entityId: 1 } }
  ])

  await db.collection('accounting_sync_history').createIndexes([
    { key: { orgId: 1, createdAt: -1 } },
    { key: { entityType: 1, entityId: 1 } },
    { key: { syncId: 1 }, unique: true },
    { key: { platform: 1, status: 1 } },
    { key: { timestamp: 1 }, expireAfterSeconds: 7776000 } // 90 days TTL
  ])

  await db.collection('accounting_webhooks').createIndexes([
    { key: { orgId: 1, processed: 1 } },
    { key: { webhookId: 1 }, unique: true, sparse: true },
    { key: { receivedAt: 1 }, expireAfterSeconds: 2592000 } // 30 days TTL
  ])

  // Add integration fields to existing collections
  await db.collection('invoices').createIndex({ 'integration.externalId': 1 })
  await db.collection('invoices').createIndex({ 'integration.syncStatus': 1 })
  await db.collection('clients').createIndex({ 'integration.externalId': 1 })
  await db.collection('products').createIndex({ 'integration.externalId': 1 })

  console.log('Database setup complete!')
  await client.close()
}

setupDatabase().catch(console.error)
```

**Run setup:**
```bash
node scripts/setup-accounting-integrations-db.js
```

---

## Webhook Configuration

### Webhook Signature Verification

#### Xero

```typescript
// src/lib/integrations/accounting/webhooks/xero-verify.ts

import crypto from 'crypto'

export function verifyXeroSignature(
  signature: string,
  payload: any,
  webhookKey: string
): boolean {
  const payloadString = JSON.stringify(payload)

  const hmac = crypto.createHmac('sha256', webhookKey)
  hmac.update(payloadString)
  const expectedSignature = hmac.digest('base64')

  return signature === expectedSignature
}
```

#### QuickBooks

```typescript
// src/lib/integrations/accounting/webhooks/quickbooks-verify.ts

import crypto from 'crypto'

export function verifyQuickBooksSignature(
  signature: string,
  payload: string,
  verifierToken: string
): boolean {
  const hmac = crypto.createHmac('sha256', verifierToken)
  hmac.update(payload)
  const expectedSignature = hmac.digest('base64')

  return signature === expectedSignature
}
```

#### MYOB

```typescript
// src/lib/integrations/accounting/webhooks/myob-verify.ts

import crypto from 'crypto'

export function verifyMYOBSignature(
  signature: string,
  payload: any,
  webhookSecret: string
): boolean {
  const payloadString = JSON.stringify(payload)

  const hmac = crypto.createHmac('sha256', webhookSecret)
  hmac.update(payloadString)
  const expectedSignature = hmac.digest('hex')

  return signature === expectedSignature
}
```

### Webhook Endpoint URLs

Configure these URLs in each platform:

- **Xero**: `https://your-domain.com/api/integrations/accounting/webhook/xero`
- **QuickBooks**: `https://your-domain.com/api/integrations/accounting/webhook/quickbooks`
- **MYOB**: `https://your-domain.com/api/integrations/accounting/webhook/myob`

**Requirements:**
- Must be HTTPS
- Must return 200 OK within 5 seconds
- Process webhooks asynchronously

---

## Testing in Development

### 1. Local Development Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up database
node scripts/setup-accounting-integrations-db.js

# Start Redis (for queue)
redis-server

# Start development server
npm run dev
```

### 2. Use ngrok for OAuth Callbacks

Since OAuth requires HTTPS callbacks, use ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 9002

# Copy HTTPS URL (e.g., https://abc123.ngrok.io)
# Update OAuth app redirect URIs to use ngrok URL
```

### 3. Test OAuth Flow

1. Navigate to `http://localhost:9002/settings/integrations`
2. Click "Connect to Xero" (or QB/MYOB)
3. Complete OAuth authorization
4. Verify connection appears as "Connected"

### 4. Test Invoice Sync

```bash
# Create test invoice via API or UI
# Then sync it

curl -X POST http://localhost:9002/api/integrations/accounting/sync/invoice \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "65a1b2c3d4e5f6789012345"}'
```

### 5. Test Webhooks Locally

Use platform sandbox/test environments:

**Xero:**
- Use Xero Demo Company
- Trigger events by updating invoices in Xero UI
- Check webhook delivery in Xero developer portal

**QuickBooks:**
- Use QuickBooks Sandbox
- Create/update invoices in QB Sandbox
- Monitor webhooks in Intuit dashboard

**MYOB:**
- Use MYOB test company file
- Trigger events and monitor webhook logs

---

## Production Deployment Checklist

### Pre-Deployment

- [ ] All OAuth apps approved for production
- [ ] Environment variables configured in production
- [ ] SSL certificate valid and configured
- [ ] Database indexes created
- [ ] Redis instance configured and accessible
- [ ] Webhook endpoints configured in all platforms
- [ ] Webhook signature verification tested
- [ ] Error monitoring configured (Sentry, etc.)
- [ ] Logging configured (CloudWatch, Datadog, etc.)

### Deployment Steps

1. **Deploy Application**
   ```bash
   # Build production bundle
   npm run build

   # Deploy to hosting (Vercel, AWS, etc.)
   vercel --prod
   # or
   npm run deploy
   ```

2. **Update OAuth Redirect URIs**
   - Update all platforms to use production domain
   - Remove ngrok/development URIs

3. **Configure Webhooks**
   - Set production webhook URLs in all platforms
   - Test webhook delivery

4. **Set Up Monitoring**
   - Configure application monitoring
   - Set up alerts for:
     - Failed syncs exceeding threshold
     - Token refresh failures
     - Webhook processing errors
     - Queue depth exceeding threshold

5. **Database Migration**
   ```bash
   # Run database setup in production
   NODE_ENV=production node scripts/setup-accounting-integrations-db.js
   ```

6. **Start Background Workers**
   ```bash
   # Start sync queue workers
   npm run worker:accounting-sync
   ```

### Post-Deployment

- [ ] Test OAuth flow with real accounts
- [ ] Create test invoice and verify sync
- [ ] Monitor sync history for errors
- [ ] Verify webhooks are being received and processed
- [ ] Check queue health and processing times
- [ ] Review error logs
- [ ] Conduct load testing if high volume expected

### Security Checklist

- [ ] OAuth tokens encrypted in database
- [ ] Webhook signatures verified on all endpoints
- [ ] Rate limiting enabled on API endpoints
- [ ] CORS configured correctly
- [ ] No secrets committed to source control
- [ ] Environment variables secured in hosting platform
- [ ] Database access restricted by IP/VPC
- [ ] Redis access secured (password, TLS)

---

## Monitoring and Logging

### Application Monitoring

#### Sentry Configuration

```typescript
// src/lib/integrations/accounting/monitoring/sentry.ts

import * as Sentry from '@sentry/nextjs'

export function captureIntegrationError(
  platform: string,
  operation: string,
  error: Error,
  context?: any
) {
  Sentry.captureException(error, {
    tags: {
      integration: 'accounting',
      platform,
      operation
    },
    extra: context
  })
}
```

#### Custom Metrics

```typescript
// src/lib/integrations/accounting/monitoring/metrics.ts

export class IntegrationMetrics {
  static async recordSync(
    platform: string,
    entityType: string,
    duration: number,
    success: boolean
  ) {
    // Send to monitoring service (Datadog, CloudWatch, etc.)
    await fetch('https://api.datadoghq.com/api/v1/series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DATADOG_API_KEY!
      },
      body: JSON.stringify({
        series: [
          {
            metric: 'accounting.sync.duration',
            points: [[Date.now() / 1000, duration]],
            tags: [`platform:${platform}`, `entity:${entityType}`, `success:${success}`]
          }
        ]
      })
    })
  }

  static async recordQueueDepth(depth: number) {
    // Track queue depth
  }

  static async recordWebhook(platform: string, eventType: string) {
    // Track webhook events
  }
}
```

### Logging

```typescript
// src/lib/integrations/accounting/logging/logger.ts

import winston from 'winston'

export const integrationLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'accounting-integration' },
  transports: [
    new winston.transports.File({
      filename: 'logs/accounting-error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/accounting-combined.log'
    })
  ]
})

if (process.env.NODE_ENV !== 'production') {
  integrationLogger.add(new winston.transports.Console({
    format: winston.format.simple()
  }))
}
```

### Health Check Endpoint

```typescript
// src/app/api/integrations/accounting/health/route.ts

export async function GET() {
  const checks = {
    database: false,
    redis: false,
    xeroApi: false,
    quickbooksApi: false,
    myobApi: false
  }

  try {
    // Check database
    const db = await getDatabase()
    await db.collection('accounting_connections').findOne({})
    checks.database = true

    // Check Redis
    const redis = new Redis(process.env.REDIS_URL)
    await redis.ping()
    checks.redis = true

    // Check platform APIs (if connections exist)
    // ...

    const allHealthy = Object.values(checks).every(v => v === true)

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date().toISOString()
    }, {
      status: allHealthy ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      checks,
      error: error.message
    }, { status: 503 })
  }
}
```

### Alerts

Configure alerts for:

1. **Sync Failures**: Alert if >5% of syncs fail in 1 hour
2. **Queue Depth**: Alert if queue depth >1000 jobs
3. **Token Expiry**: Alert 7 days before token expiry
4. **Webhook Failures**: Alert if webhooks return non-200 status
5. **API Rate Limits**: Alert if approaching platform rate limits

---

## Troubleshooting

### OAuth Issues

**Problem**: "Redirect URI mismatch"
- Verify redirect URI in platform matches exactly
- Check for trailing slashes
- Ensure HTTPS in production

**Problem**: "Invalid client credentials"
- Verify client ID and secret are correct
- Check if using production vs. sandbox credentials
- Regenerate credentials if compromised

### Sync Issues

**Problem**: Invoices not syncing
- Check sync queue for errors
- Verify client is synced first
- Check account/tax mappings configured
- Review sync history logs

**Problem**: Webhooks not received
- Verify webhook URL is accessible publicly (not localhost)
- Check webhook signature verification logic
- Review webhook logs in platform developer portal

### Database Issues

**Problem**: Duplicate key error on sync
- Check if connection already exists for org
- Verify unique indexes are correct
- Clear stale connections if needed

---

## Support and Resources

### Documentation
- **Xero API Docs**: https://developer.xero.com/documentation/
- **QuickBooks API Docs**: https://developer.intuit.com/app/developer/qbo/docs/get-started
- **MYOB API Docs**: https://developer.myob.com/api/accountright/v2/

### Community
- **Deskwise Community**: https://community.deskwise.com
- **GitHub Issues**: https://github.com/deskwise/deskwise/issues

### Support
- **Email**: integrations@deskwise.com
- **Support Portal**: https://support.deskwise.com

---

*Last Updated: January 2025*
*Version: 1.0*
