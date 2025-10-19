# QuickBooks Integration - Quick Setup Guide

## Prerequisites

- Active Deskwise installation
- MongoDB database
- Node.js 18+ environment
- Intuit Developer account

## Setup Steps

### 1. Install Dependencies ✅

Dependencies already installed:
- `intuit-oauth` - Official Intuit OAuth client
- `node-quickbooks` - QuickBooks API client

### 2. Create QuickBooks App

1. **Go to Intuit Developer Portal**
   - Visit: https://developer.intuit.com
   - Sign in or create account

2. **Create New App**
   - Dashboard → "Create an app"
   - Select: "QuickBooks Online and Payments"
   - App Name: "Deskwise MSP Platform"
   - Click "Create app"

3. **Configure App**
   - Go to "Keys & OAuth" tab
   - Copy your credentials:
     - **Client ID**: `AB...xyz`
     - **Client Secret**: `...`

4. **Set Redirect URI**
   - Under "Redirect URIs"
   - Add: `http://localhost:9002/api/integrations/quickbooks/callback`
   - For production, also add: `https://yourdomain.com/api/integrations/quickbooks/callback`

5. **Enable Scopes**
   - Accounting: ✅ (enabled by default)
   - OpenID: ✅ (enabled by default)

### 3. Configure Environment Variables

Add to your `.env.local` file:

```env
# QuickBooks Online Integration
QUICKBOOKS_CLIENT_ID=your_client_id_from_step_2
QUICKBOOKS_CLIENT_SECRET=your_client_secret_from_step_2
QUICKBOOKS_REDIRECT_URI=http://localhost:9002/api/integrations/quickbooks/callback
QUICKBOOKS_ENVIRONMENT=sandbox

# Integration Encryption (IMPORTANT: 32+ characters)
INTEGRATION_ENCRYPTION_KEY=change-this-to-a-random-32-char-string-now
```

**Generate Encryption Key**:
```bash
# On Linux/Mac:
openssl rand -base64 32

# On Windows PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use any 32+ character random string
```

### 4. Create Database Indexes

Connect to your MongoDB and run:

```javascript
// Switch to deskwise database
use deskwise

// QuickBooks integrations
db.quickbooks_integrations.createIndex({ orgId: 1, status: 1 })

// Sync logs
db.quickbooks_sync_logs.createIndex({ orgId: 1, createdAt: -1 })
db.quickbooks_sync_logs.createIndex({ orgId: 1, entityType: 1, status: 1 })

// Entity references
db.quickbooks_entity_references.createIndex({
  orgId: 1,
  deskwiseEntityId: 1,
  deskwiseEntityType: 1
}, { unique: true })

db.quickbooks_entity_references.createIndex({
  orgId: 1,
  quickbooksEntityId: 1
})

// OAuth states (with auto-expiry)
db.qbo_oauth_states.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.qbo_oauth_states.createIndex({ orgId: 1, state: 1 })
```

### 5. Test the Integration

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Connect to QuickBooks**
   - Log in to Deskwise
   - Go to Settings → Integrations
   - Click "Connect to QuickBooks"
   - Complete OAuth flow

3. **Test Connection**
   ```bash
   curl -X POST http://localhost:9002/api/integrations/quickbooks/test \
     -H "Cookie: your-session-cookie"
   ```

4. **Test Sync Operations**
   - Create a test invoice in Deskwise
   - Sync to QuickBooks:
     ```bash
     curl -X POST http://localhost:9002/api/integrations/quickbooks/sync/invoices \
       -H "Cookie: your-session-cookie" \
       -H "Content-Type: application/json" \
       -d '{"invoiceId": "your-invoice-id"}'
     ```

### 6. Verify Installation

**Check Integration Status**:
```bash
curl http://localhost:9002/api/integrations/quickbooks/status \
  -H "Cookie: your-session-cookie"
```

**Expected Response**:
```json
{
  "connected": true,
  "integration": {
    "status": "connected",
    "companyName": "Sandbox Company_US_1",
    "environment": "sandbox",
    "totalInvoicesSynced": 0,
    "lastHealthCheckStatus": "healthy"
  }
}
```

## API Endpoints

All endpoints require authentication (NextAuth session).

### Connection Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/integrations/quickbooks/connect` | Get OAuth URL |
| GET | `/api/integrations/quickbooks/callback` | OAuth callback |
| POST | `/api/integrations/quickbooks/disconnect` | Disconnect |
| GET | `/api/integrations/quickbooks/status` | Get status |
| POST | `/api/integrations/quickbooks/test` | Test connection |

### Sync Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/integrations/quickbooks/sync/invoices` | Sync invoices |
| POST | `/api/integrations/quickbooks/sync/estimates` | Sync quotes |
| POST | `/api/integrations/quickbooks/sync/customers` | Sync clients |
| POST | `/api/integrations/quickbooks/sync/items` | Sync products |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/integrations/quickbooks/sync-logs` | View logs |
| GET | `/api/integrations/quickbooks/tax-rates` | Fetch tax rates |

## Common Tasks

### Sync an Invoice

```typescript
// Single invoice
POST /api/integrations/quickbooks/sync/invoices
{
  "invoiceId": "507f1f77bcf86cd799439011"
}

// Multiple invoices
POST /api/integrations/quickbooks/sync/invoices
{
  "invoiceIds": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

### View Sync History

```typescript
GET /api/integrations/quickbooks/sync-logs?entityType=Invoice&status=failed
```

### Get Tax Rates

```typescript
GET /api/integrations/quickbooks/tax-rates
```

## Troubleshooting

### "Unauthorized" Error

**Cause**: Session not authenticated

**Solution**:
- Ensure you're logged in
- Check session cookie is being sent
- Verify `NEXTAUTH_URL` and `NEXTAUTH_SECRET` are set

### "Integration not found"

**Cause**: QuickBooks not connected yet

**Solution**:
- Connect via Settings → Integrations
- Click "Connect to QuickBooks"
- Complete OAuth flow

### "Invalid client credentials"

**Cause**: Incorrect QuickBooks app credentials

**Solution**:
- Verify `QUICKBOOKS_CLIENT_ID` matches your app
- Verify `QUICKBOOKS_CLIENT_SECRET` is correct
- Check credentials in Intuit Developer Portal

### "Redirect URI mismatch"

**Cause**: Callback URL doesn't match configuration

**Solution**:
- Verify `QUICKBOOKS_REDIRECT_URI` in `.env.local`
- Must match exactly what's configured in Intuit app
- Include protocol (`http://` or `https://`)
- Check for trailing slashes

### "Token expired"

**Cause**: Refresh token expired (after 101 days)

**Solution**:
- Disconnect integration
- Reconnect via OAuth flow
- New tokens will be issued

### "Encryption key must be at least 32 characters"

**Cause**: `INTEGRATION_ENCRYPTION_KEY` too short

**Solution**:
- Generate proper 32+ character key
- Update `.env.local`
- Restart development server

## Production Deployment

### Before Going Live

1. **Create Production QuickBooks App**
   - Separate app in Intuit Developer Portal
   - Use production credentials
   - Configure production redirect URI

2. **Update Environment Variables**
   ```env
   QUICKBOOKS_ENVIRONMENT=production
   QUICKBOOKS_REDIRECT_URI=https://yourdomain.com/api/integrations/quickbooks/callback
   ```

3. **Use Strong Encryption Key**
   - Generate new random 32+ character key
   - Different from development key
   - Store securely (never commit to git)

4. **Enable HTTPS**
   - QuickBooks requires HTTPS for production
   - Configure SSL certificate
   - Update redirect URI to use `https://`

5. **Test Thoroughly**
   - Test OAuth flow
   - Test sync operations
   - Verify token refresh
   - Test error handling

6. **Monitor**
   - Set up error tracking
   - Monitor sync logs
   - Track token expiry
   - Alert on failures

### App Approval (Optional)

For public release, submit app to Intuit for review:
1. Complete app profile
2. Submit for production review
3. Provide test accounts
4. Address any feedback
5. Wait for approval (7-10 days)

**Note**: Not required for private/internal use

## Security Checklist

- [ ] `INTEGRATION_ENCRYPTION_KEY` is 32+ characters
- [ ] Environment variables not committed to git
- [ ] Different encryption keys for dev/prod
- [ ] HTTPS enabled in production
- [ ] Database indexes created
- [ ] Token expiry monitoring configured
- [ ] Error logging enabled
- [ ] Sync logs regularly reviewed

## Support Resources

**Deskwise Documentation**:
- Full integration guide: `QUICKBOOKS_INTEGRATION.md`
- OAuth flow details: `QUICKBOOKS_OAUTH_FLOW.md`
- Environment template: `.env.example`

**QuickBooks Resources**:
- [Developer Portal](https://developer.intuit.com)
- [OAuth 2.0 Docs](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [API Reference](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice)
- [Support Forum](https://help.developer.intuit.com/)

**NPM Packages**:
- [intuit-oauth](https://www.npmjs.com/package/intuit-oauth)
- [node-quickbooks](https://www.npmjs.com/package/node-quickbooks)

## Next Steps

1. ✅ Set up QuickBooks app credentials
2. ✅ Configure environment variables
3. ✅ Create database indexes
4. ✅ Test OAuth connection
5. ✅ Sync test data
6. 📝 Build UI components (optional, not included)
7. 📝 Configure auto-sync settings
8. 📝 Set up monitoring/alerts

---

**Installation Complete!** 🎉

Your QuickBooks integration is now ready to use. Test with sandbox data before connecting to production QuickBooks companies.
