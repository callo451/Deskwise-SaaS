# Xero Integration - Environment Variables Setup

## Required Environment Variables

Add these to your `.env.local` file:

```env
# ============================================
# Xero Integration
# ============================================

# Xero OAuth 2.0 Credentials
# Get these from: https://developer.xero.com/app/manage
XERO_CLIENT_ID=your-xero-client-id-here
XERO_CLIENT_SECRET=your-xero-client-secret-here

# OAuth Redirect URI
# Must match EXACTLY what's configured in Xero Developer Portal
# Local Development:
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# Production:
# XERO_REDIRECT_URI=https://yourdomain.com/api/integrations/xero/callback

# ============================================
# Integration Security
# ============================================

# Encryption key for OAuth tokens (32+ characters required)
# Generate with: openssl rand -base64 32
INTEGRATION_ENCRYPTION_KEY=your-32-character-encryption-secret-here

# Alternative: If INTEGRATION_ENCRYPTION_KEY is not set,
# the system will fall back to NEXTAUTH_SECRET
# NEXTAUTH_SECRET=your-nextauth-secret-here
```

## How to Get Xero Credentials

### Step 1: Create Xero Developer Account
1. Go to https://developer.xero.com/
2. Sign in with your Xero account (or create one)
3. Accept the Developer Platform terms

### Step 2: Create a New App
1. Navigate to https://developer.xero.com/app/manage
2. Click "New app"
3. Fill in the form:
   - **App name**: Deskwise MSP (or your app name)
   - **Integration type**: Web app
   - **Company or application URL**: https://yourdomain.com
   - **OAuth 2.0 redirect URI**:
     - Local: `http://localhost:9002/api/integrations/xero/callback`
     - Production: `https://yourdomain.com/api/integrations/xero/callback`
4. Click "Create app"

### Step 3: Get Client Credentials
1. After creating the app, you'll see your app details
2. Find the "OAuth 2.0 credentials" section
3. Copy:
   - **Client id** → Use as `XERO_CLIENT_ID`
   - **Client secret** → Use as `XERO_CLIENT_SECRET`
4. Save these securely (client secret is only shown once!)

### Step 4: Configure Redirect URI
1. Make sure the redirect URI in Xero matches your environment:
   - For local development: `http://localhost:9002/api/integrations/xero/callback`
   - For production: `https://yourdomain.com/api/integrations/xero/callback`
2. **Important**: The URI must match EXACTLY (including protocol, domain, port, path)

### Step 5: Generate Encryption Key
```bash
# Generate a secure 32-character encryption key
openssl rand -base64 32

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Use the output as your `INTEGRATION_ENCRYPTION_KEY`

## Environment-Specific Configuration

### Local Development (.env.local)
```env
XERO_CLIENT_ID=YOUR_DEV_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_DEV_CLIENT_SECRET
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback
INTEGRATION_ENCRYPTION_KEY=your-local-encryption-key-here
```

### Staging (.env.staging)
```env
XERO_CLIENT_ID=YOUR_STAGING_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_STAGING_CLIENT_SECRET
XERO_REDIRECT_URI=https://staging.yourdomain.com/api/integrations/xero/callback
INTEGRATION_ENCRYPTION_KEY=your-staging-encryption-key-here
```

### Production (.env.production)
```env
XERO_CLIENT_ID=YOUR_PROD_CLIENT_ID
XERO_CLIENT_SECRET=YOUR_PROD_CLIENT_SECRET
XERO_REDIRECT_URI=https://yourdomain.com/api/integrations/xero/callback
INTEGRATION_ENCRYPTION_KEY=your-production-encryption-key-here
```

## Security Best Practices

### 1. Never Commit Secrets
Add to `.gitignore`:
```
.env.local
.env.staging
.env.production
.env*.local
```

### 2. Use Different Apps for Different Environments
- Create separate Xero apps for:
  - Development (localhost)
  - Staging
  - Production
- This provides isolation and easier debugging

### 3. Rotate Encryption Keys
- Rotate `INTEGRATION_ENCRYPTION_KEY` periodically
- When rotating:
  1. Note the old key
  2. Set new key in environment
  3. Re-encrypt existing tokens (see migration script)
  4. Test thoroughly before removing old key

### 4. Use Environment Variable Services
For production, use secure environment variable services:
- **Vercel**: Environment Variables in project settings
- **AWS**: AWS Secrets Manager
- **Azure**: Azure Key Vault
- **GCP**: Google Secret Manager

## Verification

After setting environment variables:

### 1. Check Variables are Loaded
```typescript
// In Next.js API route or server component
console.log('Xero Client ID:', process.env.XERO_CLIENT_ID ? 'Set ✓' : 'Missing ✗')
console.log('Xero Client Secret:', process.env.XERO_CLIENT_SECRET ? 'Set ✓' : 'Missing ✗')
console.log('Xero Redirect URI:', process.env.XERO_REDIRECT_URI)
console.log('Encryption Key:', process.env.INTEGRATION_ENCRYPTION_KEY ? 'Set ✓' : 'Missing ✗')
```

### 2. Test OAuth Flow
```bash
# Start dev server
npm run dev

# Navigate to
http://localhost:9002/dashboard/settings/integrations

# Click "Connect to Xero"
# Should redirect to Xero login page
```

### 3. Test API Endpoint
```bash
# Test connection endpoint
curl -X POST http://localhost:9002/api/integrations/xero/connect \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "success": true,
#   "authorizationUrl": "https://login.xero.com/identity/connect/authorize?..."
# }
```

## Troubleshooting

### Error: "OAuth credentials not configured"
**Cause**: Environment variables not loaded

**Solutions**:
1. Verify `.env.local` file exists in project root
2. Restart dev server: `npm run dev`
3. Check variable names (case-sensitive)
4. Ensure no extra spaces or quotes

### Error: "Invalid redirect URI"
**Cause**: Redirect URI mismatch

**Solutions**:
1. Check Xero app settings match `XERO_REDIRECT_URI` exactly
2. Include protocol (`http://` or `https://`)
3. Include port for localhost (`:9002`)
4. No trailing slash

### Error: "INTEGRATION_ENCRYPTION_KEY must be at least 32 characters"
**Cause**: Encryption key too short

**Solutions**:
1. Generate new key: `openssl rand -base64 32`
2. Ensure it's at least 32 characters
3. Or set `NEXTAUTH_SECRET` (must also be 32+ characters)

### Error: "Client secret is invalid"
**Cause**: Incorrect client secret

**Solutions**:
1. Regenerate client secret in Xero Developer Portal
2. Update `XERO_CLIENT_SECRET` immediately (old secret becomes invalid)
3. Restart server

## Example .env.local Template

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string

# NextAuth.js
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-32-character-nextauth-secret

# Xero Integration
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=
XERO_REDIRECT_URI=http://localhost:9002/api/integrations/xero/callback

# Integration Encryption
INTEGRATION_ENCRYPTION_KEY=

# Email (if using)
EMAIL_ENCRYPTION_SECRET=your-32-character-email-secret

# Other integrations (if any)
# QUICKBOOKS_CLIENT_ID=
# QUICKBOOKS_CLIENT_SECRET=
# QUICKBOOKS_REDIRECT_URI=
```

## Next Steps

After environment setup:
1. Review [XERO_INTEGRATION_DOCUMENTATION.md](./XERO_INTEGRATION_DOCUMENTATION.md) for full integration details
2. Test OAuth flow
3. Sync test invoice
4. Check sync logs
5. Configure default accounts in Xero integration settings

---

**Last Updated**: October 19, 2025
