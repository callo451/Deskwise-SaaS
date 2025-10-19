# QuickBooks OAuth 2.0 Flow - Technical Documentation

## Overview

The QuickBooks integration uses OAuth 2.0 authorization code flow for secure authentication. This document provides detailed technical information about the OAuth implementation.

## OAuth 2.0 Authorization Code Flow

### Step-by-Step Flow

```
┌─────────────┐                                              ┌──────────────┐
│   Deskwise  │                                              │  QuickBooks  │
│   (Client)  │                                              │   (Server)   │
└──────┬──────┘                                              └───────┬──────┘
       │                                                              │
       │  1. User clicks "Connect QuickBooks"                        │
       │                                                              │
       │  2. POST /api/integrations/quickbooks/connect               │
       │     Generate authorization URL + state token                │
       │                                                              │
       │  3. Redirect to QuickBooks authorization page               │
       │─────────────────────────────────────────────────────────────>│
       │     https://appcenter.intuit.com/connect/oauth2             │
       │     ?client_id=...&scope=...&redirect_uri=...&state=...     │
       │                                                              │
       │                    4. User logs in and approves             │
       │                       permissions                            │
       │                                                              │
       │  5. Redirect to callback URL with code                      │
       │<─────────────────────────────────────────────────────────────│
       │     /api/integrations/quickbooks/callback                   │
       │     ?code=...&realmId=...&state=...                         │
       │                                                              │
       │  6. Validate state token (CSRF protection)                  │
       │                                                              │
       │  7. Exchange code for tokens                                │
       │─────────────────────────────────────────────────────────────>│
       │     POST https://oauth.platform.intuit.com/oauth2/v1/tokens │
       │                                                              │
       │  8. Return access_token + refresh_token                     │
       │<─────────────────────────────────────────────────────────────│
       │                                                              │
       │  9. Encrypt and store tokens                                │
       │                                                              │
       │  10. Redirect to success page                               │
       │                                                              │
```

## Implementation Details

### 1. Authorization URL Generation

**Endpoint**: `POST /api/integrations/quickbooks/connect`

**Process**:
```typescript
import OAuthClient from 'intuit-oauth'

const oauthClient = new OAuthClient({
  clientId: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  environment: 'sandbox', // or 'production'
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
})

// Generate CSRF state token
const state = crypto.randomBytes(32).toString('hex')

// Store state in database for validation
await db.collection('qbo_oauth_states').insertOne({
  orgId,
  state,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 600000), // 10 minutes
})

// Generate authorization URL
const authUri = oauthClient.authorizeUri({
  scope: [
    OAuthClient.scopes.Accounting,  // Access to accounting data
    OAuthClient.scopes.OpenId,      // User identity
  ],
  state,
})

return { authorizationUrl: authUri }
```

**Generated URL**:
```
https://appcenter.intuit.com/connect/oauth2
  ?client_id=AB123456789xyz
  &scope=com.intuit.quickbooks.accounting%20openid
  &redirect_uri=http://localhost:9002/api/integrations/quickbooks/callback
  &response_type=code
  &state=a1b2c3d4e5f6...
```

### 2. User Authorization

User is redirected to Intuit's authorization page where they:
1. Log in to their Intuit account (if not already logged in)
2. Select which QuickBooks company to connect
3. Review requested permissions
4. Click "Connect" or "Cancel"

### 3. OAuth Callback

**Endpoint**: `GET /api/integrations/quickbooks/callback`

**Parameters**:
- `code` - Authorization code (one-time use, 10-minute expiry)
- `realmId` - QuickBooks Company ID
- `state` - CSRF token (must match stored value)

**Error Parameters** (if user cancels or error occurs):
- `error` - Error code (e.g., `access_denied`)
- `error_description` - Human-readable error message

**Process**:
```typescript
// Extract query parameters
const code = searchParams.get('code')
const state = searchParams.get('state')
const realmId = searchParams.get('realmId')

// Validate state token (CSRF protection)
const stateRecord = await db.collection('qbo_oauth_states').findOne({
  orgId,
  state,
  expiresAt: { $gt: new Date() },
})

if (!stateRecord) {
  throw new Error('Invalid or expired state token')
}

// Delete used state token (prevent replay attacks)
await db.collection('qbo_oauth_states').deleteOne({ _id: stateRecord._id })
```

### 4. Token Exchange

**Process**:
```typescript
const oauthClient = new OAuthClient({
  clientId: process.env.QUICKBOOKS_CLIENT_ID,
  clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
  environment: 'sandbox',
  redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
})

// Exchange authorization code for tokens
const authResponse = await oauthClient.createToken(code)
const token = authResponse.getToken()

// Token structure:
{
  access_token: 'eyJlbmMiOiJBMTI4Q0JDLUhTMjU2Iiwia...',
  refresh_token: 'AB11234567890xyz...',
  token_type: 'bearer',
  expires_in: 3600,                      // seconds (1 hour)
  x_refresh_token_expires_in: 8726400,   // seconds (101 days)
}
```

**HTTP Request** (performed by intuit-oauth):
```http
POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <Base64(clientId:clientSecret)>

grant_type=authorization_code
&code=AB123456789xyz
&redirect_uri=http://localhost:9002/api/integrations/quickbooks/callback
```

### 5. Token Encryption

**Why Encryption?**
- Tokens grant full access to QuickBooks company data
- Must be protected at rest in database
- Prevents token theft if database is compromised

**Encryption Method**: AES-256-GCM

```typescript
class EncryptionService {
  private static algorithm = 'aes-256-gcm'

  static encrypt(text: string): string {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16)

    // Derive key from secret
    const key = crypto.scryptSync(
      process.env.INTEGRATION_ENCRYPTION_KEY,
      'salt',
      32
    )

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv)

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  }

  static decrypt(encryptedText: string): string {
    // Parse format
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    // Derive key
    const key = crypto.scryptSync(
      process.env.INTEGRATION_ENCRYPTION_KEY,
      'salt',
      32
    )

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }
}
```

**Storage**:
```javascript
{
  accessToken: "a1b2c3:d4e5f6:78901234...",  // Encrypted
  refreshToken: "x9y8z7:w6v5u4:32109876...", // Encrypted
  accessTokenExpiresAt: ISODate("2024-10-19T11:00:00Z"),
  refreshTokenExpiresAt: ISODate("2025-01-28T10:00:00Z"),
}
```

### 6. Token Refresh

**When to Refresh?**
- Access tokens expire after 1 hour
- System auto-refreshes 5 minutes before expiry
- Triggered on each API call

**Process**:
```typescript
// Check if token is expiring
const now = new Date()
const expiryBuffer = 5 * 60 * 1000 // 5 minutes
const isExpiring =
  integration.accessTokenExpiresAt.getTime() - now.getTime() < expiryBuffer

if (isExpiring) {
  // Refresh token
  const refreshToken = EncryptionService.decrypt(integration.refreshToken)

  oauthClient.setToken({ refresh_token: refreshToken })
  const authResponse = await oauthClient.refresh()
  const token = authResponse.getToken()

  // Encrypt new tokens
  const encryptedAccessToken = EncryptionService.encrypt(token.access_token)
  const encryptedRefreshToken = EncryptionService.encrypt(token.refresh_token)

  // Calculate new expiry dates
  const accessTokenExpiresAt = new Date(now.getTime() + token.expires_in * 1000)
  const refreshTokenExpiresAt = new Date(
    now.getTime() + token.x_refresh_token_expires_in * 1000
  )

  // Update database
  await db.collection('quickbooks_integrations').updateOne(
    { _id: integrationId },
    {
      $set: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        status: 'connected',
      },
    }
  )
}
```

**HTTP Request** (performed by intuit-oauth):
```http
POST https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <Base64(clientId:clientSecret)>

grant_type=refresh_token
&refresh_token=AB11234567890xyz...
```

**Response**:
```json
{
  "access_token": "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2...",
  "refresh_token": "AB11234567890xyz...",  // NEW refresh token
  "token_type": "bearer",
  "expires_in": 3600,
  "x_refresh_token_expires_in": 8726400
}
```

**Important**: Each refresh returns a NEW refresh token. The old refresh token is invalidated.

### 7. Token Revocation (Disconnect)

**Endpoint**: `POST /api/integrations/quickbooks/disconnect`

**Process**:
```typescript
const accessToken = EncryptionService.decrypt(integration.accessToken)

oauthClient.setToken({ access_token: accessToken })

// Revoke tokens with QuickBooks
await oauthClient.revoke()

// Update database
await db.collection('quickbooks_integrations').updateOne(
  { orgId },
  {
    $set: {
      status: 'disconnected',
      disconnectedAt: new Date(),
      disconnectedBy: userId,
    },
  }
)
```

**HTTP Request** (performed by intuit-oauth):
```http
POST https://developer.api.intuit.com/v2/oauth2/tokens/revoke
Content-Type: application/json
Authorization: Basic <Base64(clientId:clientSecret)>

{
  "token": "eyJlbmMiOiJBMTI4Q0JDLUhTMjU2..."
}
```

## Security Considerations

### CSRF Protection

**Attack Scenario**:
An attacker tricks a user into clicking a malicious link:
```
https://deskwise.com/api/integrations/quickbooks/callback
  ?code=ATTACKER_CODE&realmId=ATTACKER_COMPANY&state=FAKE_STATE
```

**Protection**:
1. Generate random state token before redirecting to QuickBooks
2. Store state in database with user's orgId
3. Validate state matches on callback
4. Ensure state hasn't expired (10-minute TTL)
5. Delete state after use (prevent replay)

### Token Security

**Best Practices**:
- ✅ Encrypt tokens before database storage (AES-256-GCM)
- ✅ Use secure random encryption keys (32+ characters)
- ✅ Never log decrypted tokens
- ✅ Use HTTPS for all OAuth redirects (production)
- ✅ Implement token expiry checks
- ✅ Auto-refresh before expiry
- ✅ Revoke tokens on disconnect

**What NOT to do**:
- ❌ Store tokens in plain text
- ❌ Include tokens in URLs or logs
- ❌ Use weak encryption keys
- ❌ Ignore token expiry
- ❌ Share tokens between organizations

### Environment Separation

**Sandbox**:
- For development and testing
- Separate QuickBooks app credentials
- Test with sample companies
- No real financial data

**Production**:
- Live QuickBooks companies
- Different app credentials
- Intuit review/approval required for public apps
- HTTPS required for redirect URIs

## Scopes

### Accounting Scope
```
com.intuit.quickbooks.accounting
```

**Grants access to**:
- Invoices (read, create, update)
- Estimates (read, create, update)
- Customers (read, create, update)
- Items/Services (read, create, update)
- Payments (read, create, update)
- Company Info (read)
- Tax Rates (read)
- Accounts (read)

### OpenID Scope
```
openid
```

**Grants access to**:
- User's identity
- Email address
- Company information

## Error Handling

### OAuth Errors

**User Cancels Authorization**:
```
GET /api/integrations/quickbooks/callback
  ?error=access_denied
  &error_description=User%20canceled%20authorization
```

**Invalid Redirect URI**:
```
Error displayed on Intuit page:
"redirect_uri does not match configured value"
```

**Invalid Client Credentials**:
```
HTTP 401 Unauthorized
{
  "error": "invalid_client",
  "error_description": "Invalid client credentials"
}
```

### Token Refresh Errors

**Refresh Token Expired** (after 101 days):
```
HTTP 400 Bad Request
{
  "error": "invalid_grant",
  "error_description": "Token expired"
}
```

**Solution**: User must re-authorize connection

### Rate Limiting

**Error Response**:
```
HTTP 429 Too Many Requests
Retry-After: 60
```

**Handling**:
- Implement exponential backoff
- Retry after delay specified in `Retry-After` header
- Max 3 retry attempts

## Testing

### Sandbox Testing

1. Create sandbox app at [Intuit Developer](https://developer.intuit.com)
2. Create test company:
   - Go to "My Apps" → Your App → "Test Company"
   - Click "Create test company"
3. Use sandbox credentials in `.env.local`:
   ```
   QUICKBOOKS_ENVIRONMENT=sandbox
   ```
4. Test OAuth flow with test company

### Token Lifecycle Testing

```javascript
// 1. Test initial authorization
POST /api/integrations/quickbooks/connect
→ Get authorizationUrl
→ Complete OAuth flow
→ Verify tokens stored and encrypted

// 2. Test token usage
POST /api/integrations/quickbooks/sync/invoices
→ Verify access token used successfully

// 3. Test token refresh
// (Manually expire access token in database or wait 1 hour)
POST /api/integrations/quickbooks/test
→ Verify auto-refresh triggered
→ Verify new tokens stored

// 4. Test disconnect
POST /api/integrations/quickbooks/disconnect
→ Verify tokens revoked
→ Verify status = 'disconnected'
```

## Monitoring

### Key Metrics

1. **Token Refresh Rate**
   - Track frequency of token refreshes
   - Alert on excessive refresh attempts

2. **OAuth Failures**
   - Track authorization failures
   - Monitor state validation errors

3. **Token Expiry**
   - Alert when refresh tokens near expiry (101 days)
   - Notify users to re-authorize

4. **API Errors**
   - 401 errors → Token issues
   - 429 errors → Rate limiting
   - 400 errors → Validation issues

## References

- [Intuit OAuth 2.0 Documentation](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [intuit-oauth npm package](https://www.npmjs.com/package/intuit-oauth)
- [QuickBooks API Reference](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/most-commonly-used/invoice)
