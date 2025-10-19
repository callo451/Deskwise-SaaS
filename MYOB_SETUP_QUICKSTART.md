# MYOB Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Get MYOB API Credentials

1. Go to https://my.myob.com.au/Pages/Default.aspx
2. Sign in with MYOB account
3. Navigate to "Developer" section
4. Click "Create App" or "Register Application"
5. Fill in:
   - **App Name**: Deskwise ITSM
   - **Redirect URI**: `http://localhost:9002/api/integrations/myob/callback`
   - **Scopes**: `CompanyFile` (for keys created before March 12, 2025)
6. Save and copy:
   - **Client ID** (API Key)
   - **Client Secret**

### Step 2: Configure Environment Variables

Add to `.env.local`:

```env
# MYOB AccountRight API Credentials
MYOB_CLIENT_ID=your_client_id_here
MYOB_CLIENT_SECRET=your_client_secret_here
MYOB_REDIRECT_URI=http://localhost:9002/api/integrations/myob/callback

# Encryption Key (generate a random 32-character string)
INTEGRATION_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890
```

**Generate encryption key** (Node.js):
```javascript
require('crypto').randomBytes(16).toString('hex')
// Output: 32-character hex string
```

Or use online tool: https://randomkeygen.com/ (select "256-bit WPA Key")

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Test Connection

#### Via API:

```bash
# 1. Get auth URL
curl http://localhost:9002/api/integrations/myob/connect \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Output: { "authUrl": "https://secure.myob.com/oauth2/v1/authorize?..." }

# 2. Visit authUrl in browser
# 3. Login to MYOB and authorize
# 4. Callback will save tokens automatically

# 5. Test connection
curl -X POST http://localhost:9002/api/integrations/myob/test \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"

# Output: { "success": true, "companyFiles": [...] }
```

## 📋 Complete OAuth Flow

### Flow Diagram

```
User → [Connect Button] → /api/integrations/myob/connect
                          ↓
                  Generate OAuth URL
                          ↓
            Redirect to MYOB Login
                          ↓
        User authenticates with MYOB
                          ↓
      User selects company file & authorizes
                          ↓
    MYOB redirects to /api/integrations/myob/callback?code=XXX
                          ↓
        Exchange code for tokens (POST /oauth2/v1/token)
                          ↓
           Encrypt and store tokens
                          ↓
        Redirect to success page
```

### Implementation Example (React)

```typescript
// Connect to MYOB
const handleConnect = async () => {
  try {
    const response = await fetch('/api/integrations/myob/connect')
    const { authUrl } = await response.json()

    // Redirect to MYOB
    window.location.href = authUrl
  } catch (error) {
    console.error('Connection error:', error)
  }
}

// After callback, check status
const checkStatus = async () => {
  const response = await fetch('/api/integrations/myob/status')
  const { connected, integration } = await response.json()

  if (connected) {
    // Show company file selector
    const filesResponse = await fetch('/api/integrations/myob/company-files')
    const { companyFiles } = await filesResponse.json()

    // User selects file...
    await fetch('/api/integrations/myob/company-files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyFileId: selectedFile.id,
        companyFileName: selectedFile.name,
        companyFileUri: selectedFile.uri
      })
    })
  }
}
```

## 🔄 Sync Examples

### Sync Single Customer

```bash
curl -X POST http://localhost:9002/api/integrations/myob/sync/customers \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "clientIds": ["client_id_here"],
    "syncAll": false
  }'
```

### Sync All Active Customers

```bash
curl -X POST http://localhost:9002/api/integrations/myob/sync/customers \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "syncAll": true
  }'
```

### Sync Invoice

```bash
curl -X POST http://localhost:9002/api/integrations/myob/sync/invoices \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{
    "invoiceIds": ["invoice_id_here"],
    "syncAll": false
  }'
```

## 🐛 Common Issues

### ❌ "Integration not configured"

**Cause**: Missing or incorrect environment variables

**Fix**:
```bash
# Check .env.local file
cat .env.local | grep MYOB

# Should show:
# MYOB_CLIENT_ID=...
# MYOB_CLIENT_SECRET=...
# MYOB_REDIRECT_URI=...
# INTEGRATION_ENCRYPTION_KEY=...

# If missing, add them and restart server
npm run dev
```

### ❌ "Failed to exchange code for tokens"

**Cause**: Invalid Client ID/Secret or redirect URI mismatch

**Fix**:
1. Verify MYOB_CLIENT_ID matches API Key from MYOB portal
2. Verify MYOB_CLIENT_SECRET matches API Secret
3. Verify redirect URI in MYOB portal matches MYOB_REDIRECT_URI exactly
4. Check for trailing slashes or http vs https mismatch

### ❌ "No active tax code found"

**Cause**: MYOB company file has no active tax codes

**Fix**:
1. Open MYOB AccountRight desktop app
2. Go to **Lists** → **Tax Codes**
3. Create or activate a tax code (e.g., "GST 10%")
4. Save changes
5. Retry invoice sync

### ❌ "Customer not synced to MYOB"

**Cause**: Trying to sync invoice before customer

**Fix**:
1. Sync customer first
2. Then sync invoice

**Correct order**:
```bash
# 1. Sync customer
curl -X POST .../sync/customers -d '{"clientIds": ["client_123"]}'

# 2. Then sync invoice
curl -X POST .../sync/invoices -d '{"invoiceIds": ["invoice_456"]}'
```

### ❌ "Token expired"

**Cause**: Access token expired (after 20 minutes)

**Fix**: Nothing needed! The system automatically refreshes tokens.

If refresh token expired (after 1 week), user must re-authenticate:
1. Click "Connect to MYOB" again
2. Go through OAuth flow

## 📊 Monitoring & Debugging

### Check Integration Status

```javascript
const response = await fetch('/api/integrations/myob/status')
const data = await response.json()

console.log(data)
// {
//   connected: true,
//   integration: {
//     status: 'connected',
//     companyFileName: 'My Company',
//     lastSyncAt: '2025-01-20T10:30:00Z',
//     lastSyncStatus: 'completed'
//   }
// }
```

### View Sync Logs

```javascript
// In service layer
const logs = await MYOBIntegrationService.getSyncLogs(orgId, {
  entityType: 'Invoice',
  status: 'failed',
  limit: 10
})

console.log(logs)
// [
//   {
//     entityType: 'Invoice',
//     status: 'failed',
//     errors: [
//       {
//         recordId: 'invoice_123',
//         error: 'Customer not synced'
//       }
//     ]
//   }
// ]
```

### MongoDB Queries

```javascript
// Check integration
db.myob_integrations.findOne({ orgId: 'org_123' })

// Check mappings
db.myob_mappings.find({ orgId: 'org_123', deskwiseEntityType: 'invoice' })

// Check sync logs
db.myob_sync_logs.find({ orgId: 'org_123', status: 'failed' }).sort({ createdAt: -1 })
```

## 🔐 Security Checklist

- [x] Environment variables in `.env.local` (never commit)
- [x] Tokens encrypted with AES-256-GCM
- [x] HTTPS in production (required by MYOB)
- [x] Session-based authentication (NextAuth)
- [x] CSRF protection via state parameter
- [x] No tokens sent to client
- [x] Audit logging for all sync operations

## 📈 Production Deployment

### Environment Variables (Production)

```env
# MYOB Production API
MYOB_CLIENT_ID=prod_client_id
MYOB_CLIENT_SECRET=prod_client_secret
MYOB_REDIRECT_URI=https://yourdomain.com/api/integrations/myob/callback

# Strong encryption key (different from dev!)
INTEGRATION_ENCRYPTION_KEY=prod_encryption_key_32_chars

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=prod_nextauth_secret
```

### Pre-Production Checklist

1. **Update MYOB App Settings**:
   - Add production redirect URI
   - Verify scopes

2. **Test OAuth Flow**:
   - Test connection from production URL
   - Verify callback works

3. **Test Sync Operations**:
   - Sync test customer
   - Sync test invoice
   - Check MYOB AccountRight desktop app

4. **Monitor Logs**:
   - Set up error monitoring (Sentry, LogRocket)
   - Monitor sync_logs collection
   - Set up alerts for failed syncs

5. **Performance**:
   - Test with large datasets
   - Monitor API rate limits
   - Implement batch processing if needed

## 📚 Additional Resources

- **Full Documentation**: See `MYOB_INTEGRATION_GUIDE.md`
- **MYOB API Docs**: https://developer.myob.com/api/accountright/v2/
- **OAuth Guide**: https://apisupport.myob.com/hc/en-us/articles/360001459455
- **API Support**: https://apisupport.myob.com

## 🆘 Get Help

1. Check logs: `db.myob_sync_logs.find().sort({createdAt:-1})`
2. Test connection: `POST /api/integrations/myob/test`
3. Review MYOB API docs for specific errors
4. Contact MYOB API support if MYOB service issue

---

**That's it!** You should now have MYOB integration running. Start by syncing a single customer, then an invoice, to verify everything works.
