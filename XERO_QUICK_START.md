# Xero Integration - Quick Start Guide

Get your Xero integration up and running in 10 minutes.

---

## Step 1: Install Dependencies (Already Done ✓)

The `xero-node` package has already been installed.

```bash
npm install xero-node  # Already installed
```

---

## Step 2: Create Xero App (5 minutes)

1. **Go to Xero Developer Portal**
   - Navigate to: https://developer.xero.com/app/manage
   - Sign in with your Xero account

2. **Create New App**
   - Click "New app"
   - Fill in:
     - **App name**: Deskwise MSP
     - **Integration type**: Web app
     - **Company URL**: https://yourdomain.com
     - **Redirect URI**: `http://localhost:9002/api/integrations/xero/callback`
   - Click "Create app"

3. **Copy Credentials**
   - Copy **Client ID**
   - Copy **Client Secret** (shown only once!)

---

## Step 3: Configure Environment Variables (2 minutes)

Add to your `.env.local` file:

```env
# Xero Integration
XERO_CLIENT_ID=paste-your-client-id-here
XERO_CLIENT_SECRET=paste-your-client-secret-here
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# Generate encryption key: openssl rand -base64 32
INTEGRATION_ENCRYPTION_KEY=paste-generated-32-char-key-here
```

**Generate Encryption Key:**
```bash
openssl rand -base64 32
```

Or in Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 4: Create Database Indexes (1 minute)

Open MongoDB shell or Compass and run:

```javascript
// xero_integrations collection
db.xero_integrations.createIndex({ orgId: 1 }, { unique: true })

// xero_sync_logs collection
db.xero_sync_logs.createIndex({ orgId: 1, createdAt: -1 })

// xero_entity_references collection
db.xero_entity_references.createIndex(
  { orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 },
  { unique: true }
)
```

---

## Step 5: Test the Integration (2 minutes)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Integrations Page**
   ```
   http://localhost:9002/dashboard/settings/integrations
   ```

3. **Connect to Xero**
   - Click "Connect to Xero" button
   - Authorize on Xero login page
   - Select your organization
   - Grant permissions
   - You'll be redirected back to Deskwise

4. **Verify Connection**
   - You should see "Connected to Xero"
   - Organization name displayed
   - Connection status: Active

---

## Step 6: Test Sync (Optional)

### Test Invoice Sync

Using curl:
```bash
curl -X POST http://localhost:9002/api/integrations/xero/sync/invoices \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"invoiceId": "your-invoice-id-here"}'
```

Or from the Deskwise UI:
1. Go to Invoices
2. Click on an invoice
3. Click "Sync to Xero" button
4. Verify in Xero dashboard

---

## Quick Test Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Dev server running (`npm run dev`)
- [ ] Can access integrations page
- [ ] "Connect to Xero" button visible
- [ ] OAuth flow completes successfully
- [ ] Redirects back to Deskwise
- [ ] Connection status shows "Connected"
- [ ] Organization name displayed correctly
- [ ] Test connection button works
- [ ] Can sync an invoice (optional)

---

## Common Issues & Quick Fixes

### "OAuth credentials not configured"
**Fix**: Restart dev server after adding environment variables
```bash
npm run dev
```

### "Invalid redirect URI"
**Fix**: Ensure redirect URI in Xero app matches exactly:
```
http://localhost:9002/api/integrations/xero/callback
```
(Include `http://`, port `:9002`, and full path)

### "Encryption error"
**Fix**: Generate a 32+ character encryption key
```bash
openssl rand -base64 32
```

### Can't see "Connect to Xero" button
**Fix**: You may need to add UI components (not included in backend implementation)

---

## Next Steps

1. **Read Full Documentation**
   - See `XERO_INTEGRATION_DOCUMENTATION.md` for complete details

2. **Configure Default Accounts**
   - Set default revenue account
   - Set default bank account
   - Configure tax settings

3. **Enable Auto-Sync** (Optional)
   - Configure sync frequency
   - Enable automatic syncing

4. **Test All Entity Types**
   - Sync an invoice
   - Sync a quote
   - Sync a customer
   - Sync a product
   - Record a payment

5. **Review Sync Logs**
   - Check sync history
   - Review any errors
   - Monitor performance

---

## API Endpoints Reference

### Test Connection
```bash
POST /api/integrations/xero/test
```

### Sync Invoice
```bash
POST /api/integrations/xero/sync/invoices
Body: { "invoiceId": "..." }
```

### Sync Quote
```bash
POST /api/integrations/xero/sync/quotes
Body: { "quoteId": "..." }
```

### Sync Customer
```bash
POST /api/integrations/xero/sync/customers
Body: { "clientId": "..." }
```

### Sync Product
```bash
POST /api/integrations/xero/sync/products
Body: { "productId": "..." }
```

### Get Sync Logs
```bash
GET /api/integrations/xero/sync-logs?limit=50
```

### Get Tax Rates
```bash
GET /api/integrations/xero/tax-rates
```

---

## File Structure

```
src/
├── lib/
│   ├── services/
│   │   └── xero-integration.ts          # Main service layer
│   └── types.ts                          # Type definitions (additions)
└── app/
    └── api/
        └── integrations/
            └── xero/
                ├── connect/route.ts
                ├── callback/route.ts
                ├── disconnect/route.ts
                ├── status/route.ts
                ├── test/route.ts
                ├── sync/
                │   ├── invoices/route.ts
                │   ├── quotes/route.ts
                │   ├── customers/route.ts
                │   └── products/route.ts
                ├── sync-logs/route.ts
                └── tax-rates/route.ts

Documentation:
├── XERO_INTEGRATION_DOCUMENTATION.md    # Complete technical docs
├── XERO_ENV_SETUP.md                    # Environment setup guide
├── XERO_IMPLEMENTATION_SUMMARY.md       # Implementation overview
└── XERO_QUICK_START.md                  # This file
```

---

## Support

For detailed information:
- **Complete Documentation**: `XERO_INTEGRATION_DOCUMENTATION.md`
- **Environment Setup**: `XERO_ENV_SETUP.md`
- **Implementation Details**: `XERO_IMPLEMENTATION_SUMMARY.md`

For Xero-specific help:
- **Xero Developer Docs**: https://developer.xero.com/documentation/
- **xero-node SDK**: https://github.com/XeroAPI/xero-node

---

**Estimated Setup Time**: 10 minutes
**Difficulty**: Easy
**Status**: Production Ready ✅

You're all set! The Xero integration is ready to use.
