# Email Notification System - Security Testing Guide

## Overview

This document outlines comprehensive security testing procedures for the email notification system to ensure data protection, access control, and compliance with security best practices.

## Security Testing Objectives

- Verify credentials are encrypted at rest
- Ensure credentials are not exposed in API responses or logs
- Validate RBAC (Role-Based Access Control) enforcement
- Test input validation and sanitization
- Prevent injection attacks (XSS, SQL, Template)
- Verify multi-tenancy isolation
- Test rate limiting and abuse prevention
- Ensure audit logging completeness
- Validate secure transmission (TLS)

---

## 1. Credential Security

### 1.1 Encryption at Rest

**Test: SES Credentials Encrypted in Database**

**Steps:**
1. Login as admin
2. Configure SES credentials:
   - Access Key: `AKIAIOSFODNN7EXAMPLE`
   - Secret Key: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   - Region: `us-east-1`
3. Save settings
4. Connect to MongoDB directly:
   ```javascript
   use deskwise
   db.email_settings.findOne({ orgId: "test_org" })
   ```

**Expected Results:**
```javascript
{
  _id: ObjectId("..."),
  orgId: "test_org",
  sesCredentials: {
    encryptedData: "a1b2c3d4e5f6...", // Encrypted blob
    iv: "1234567890abcdef", // Initialization vector
    tag: "fedcba0987654321" // Authentication tag
  },
  senderEmail: "sender@example.com",
  senderName: "Deskwise Support"
}
```

**Pass Criteria:**
- ✅ `accessKeyId` NOT visible in plain text
- ✅ `secretAccessKey` NOT visible in plain text
- ✅ `encryptedData` field exists and is a string
- ✅ `iv` field exists (16+ bytes)
- ✅ `tag` field exists (for AES-GCM authentication)
- ✅ Encrypted data is different each time (non-deterministic encryption)

**Fail If:**
- ❌ Plain credentials visible in database
- ❌ Missing `iv` or `tag` fields
- ❌ Same encrypted output for same input (missing IV)

---

### 1.2 Credentials Not Exposed in API Responses

**Test: GET Settings API Does Not Return Plain Credentials**

**Steps:**
1. Login as admin
2. Open browser DevTools > Network tab
3. Navigate to email settings page
4. Find API request: `GET /api/email/settings`
5. Inspect response body

**Expected Response:**
```json
{
  "sesCredentials": {
    "accessKeyId": "AKIA***MPLE",  // Masked
    "region": "us-east-1"
  },
  "senderEmail": "sender@example.com",
  "senderName": "Deskwise Support",
  "isConfigured": true
}
```

**Pass Criteria:**
- ✅ Access Key masked (show first 4 and last 3 chars)
- ✅ Secret Key NOT included in response
- ✅ Region visible (not sensitive)
- ✅ Sender email visible (not sensitive)

**Fail If:**
- ❌ Full `accessKeyId` visible
- ❌ `secretAccessKey` included in response
- ❌ `encryptedData` exposed to client

---

### 1.3 Credentials Not Logged

**Test: Server Logs Don't Contain Credentials**

**Steps:**
1. Configure SES settings with real credentials
2. Trigger email sending
3. Check server logs:
   ```bash
   tail -f logs/app.log
   grep -i "AKIA" logs/app.log
   grep -i "secret" logs/app.log
   ```

**Pass Criteria:**
- ✅ Credentials NOT logged in plain text
- ✅ Error messages don't include credentials
- ✅ Debug logs don't expose sensitive data

**Example Safe Log:**
```
[INFO] SES credentials updated for org: test_org
[INFO] Email sent successfully to user@example.com
[ERROR] SES send failed: Invalid credentials (credentials redacted)
```

**Example Unsafe Log (FAIL):**
```
[DEBUG] Sending email with key: AKIAIOSFODNN7EXAMPLE
[ERROR] SES error: Invalid secret key wJalrXUtnFEMI/K7MDENG...
```

---

### 1.4 Encryption Key Security

**Test: Encryption Key Not Hardcoded**

**Steps:**
1. Review code in `src/lib/services/email-ses.ts`
2. Check for encryption key source

**Pass Criteria:**
- ✅ Encryption key loaded from environment variable
- ✅ Key NOT hardcoded in source code
- ✅ Key stored securely (e.g., AWS Secrets Manager, env vars)
- ✅ Key is 32 bytes (256-bit) for AES-256

**Example Correct Implementation:**
```typescript
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  throw new Error('EMAIL_ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
}
```

**Fail If:**
- ❌ Key hardcoded: `const KEY = "0123456789abcdef..."`
- ❌ Weak key (< 32 bytes)
- ❌ Key committed to version control

---

## 2. Access Control (RBAC)

### 2.1 Settings Page Access Control

**Test: Non-Admin Users Cannot Access Email Settings**

**Steps:**
1. Login as end user (role: `user`)
2. Try to access: `/dashboard/settings/email-integration`
3. Expected: 403 Forbidden or redirect to dashboard

**Test Variations:**
| User Role | Expected Access |
|-----------|----------------|
| Admin | ✅ Full Access |
| Technician | ❌ Denied |
| End User | ❌ Denied |
| Guest | ❌ Denied (not logged in) |

**Pass Criteria:**
- ✅ Only admins can access settings pages
- ✅ Non-admins redirected or shown 403
- ✅ Appropriate error message shown

---

### 2.2 API Endpoint Access Control

**Test: API Endpoints Enforce RBAC**

**Test Script:**
```javascript
// test-rbac.js
const axios = require('axios');

async function testRBAC() {
  const endpoints = [
    { method: 'GET', url: '/api/email/settings' },
    { method: 'POST', url: '/api/email/settings' },
    { method: 'POST', url: '/api/email/templates' },
    { method: 'DELETE', url: '/api/email/templates/123' },
    { method: 'POST', url: '/api/notifications/rules' },
  ];

  // Test with end user session
  const endUserCookie = 'session-token-end-user';

  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `http://localhost:9002${endpoint.url}`,
        headers: { Cookie: endUserCookie }
      });

      console.log(`FAIL: ${endpoint.method} ${endpoint.url} - Expected 403, got ${response.status}`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`PASS: ${endpoint.method} ${endpoint.url} - Correctly denied`);
      } else {
        console.log(`UNEXPECTED: ${endpoint.method} ${endpoint.url} - Status ${error.response?.status}`);
      }
    }
  }
}

testRBAC();
```

**Pass Criteria:**
- ✅ All protected endpoints return 403 for non-admin users
- ✅ 401 returned if not authenticated
- ✅ Error message: "Insufficient permissions" or "Forbidden"

---

### 2.3 Permission Check Implementation

**Test: Code Uses Permission Middleware**

**Code Review:**
```typescript
// Example API route
import { requirePermission } from '@/lib/middleware/permissions';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Should have permission check
  if (!await requirePermission(session, 'email.settings.manage')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ... rest of handler
}
```

**Pass Criteria:**
- ✅ All settings routes have permission checks
- ✅ Permission checks at start of handler (before any logic)
- ✅ Consistent permission naming convention

---

## 3. Input Validation and Sanitization

### 3.1 Email Address Validation

**Test: Invalid Email Addresses Rejected**

**Test Cases:**
```javascript
const testCases = [
  { email: 'valid@example.com', expected: 'valid' },
  { email: 'user+tag@example.co.uk', expected: 'valid' },
  { email: 'invalid', expected: 'invalid' },
  { email: '@example.com', expected: 'invalid' },
  { email: 'user@', expected: 'invalid' },
  { email: 'user @example.com', expected: 'invalid' }, // Space
  { email: 'user@example', expected: 'invalid' }, // No TLD
  { email: '', expected: 'invalid' },
  { email: null, expected: 'invalid' },
  { email: '<script>alert(1)</script>@example.com', expected: 'invalid' },
];

testCases.forEach(test => {
  const result = validateEmail(test.email);
  console.log(`${test.email}: ${result ? 'VALID' : 'INVALID'} - ${result === (test.expected === 'valid') ? 'PASS' : 'FAIL'}`);
});
```

**Pass Criteria:**
- ✅ Valid email formats accepted
- ✅ Invalid formats rejected
- ✅ Special characters handled correctly
- ✅ Plus addressing supported
- ✅ XSS attempts rejected

---

### 3.2 Template XSS Prevention

**Test: HTML Escaping in Templates**

**Steps:**
1. Create email template
2. Include variable: `{{requesterName}}`
3. Trigger notification with malicious data:
   ```javascript
   {
     requesterName: '<script>alert("XSS")</script>'
   }
   ```
4. Check rendered email

**Expected Output:**
```html
<p>Hello &lt;script&gt;alert("XSS")&lt;/script&gt;,</p>
```

**Pass Criteria:**
- ✅ HTML tags escaped by default
- ✅ `<` becomes `&lt;`
- ✅ `>` becomes `&gt;`
- ✅ `&` becomes `&amp;`
- ✅ `"` becomes `&quot;`
- ✅ `'` becomes `&#x27;`

**Test with Triple-Brace (Raw HTML):**
```handlebars
<div>{{{unsafeHtml}}}</div>
```

**Pass Criteria:**
- ✅ Still sanitize dangerous tags (`<script>`, `<iframe>`)
- ✅ Use DOMPurify or similar sanitizer
- ✅ Allow safe HTML (e.g., `<b>`, `<i>`, `<a>`)

---

### 3.3 SQL Injection Prevention

**Note:** MongoDB is NoSQL, but still test for injection.

**Test: MongoDB Query Injection**

**Test Cases:**
```javascript
// Malicious input attempts
const maliciousInputs = [
  "'; DROP TABLE users; --",
  "{ $ne: null }",
  "admin' OR '1'='1",
  "{ $gt: '' }",
  "{ $regex: '.*' }"
];

for (const input of maliciousInputs) {
  // Try to inject in recipient search
  const result = await searchRecipients(input);

  // Should return empty or error, NOT all users
  console.log(`Input: ${input} - Results: ${result.length}`);
}
```

**Pass Criteria:**
- ✅ Query parameters properly sanitized
- ✅ Use parameterized queries (MongoDB filters)
- ✅ Never construct queries with string concatenation
- ✅ Input validation before database queries

**Example Secure Code:**
```typescript
// SECURE
const users = await db.collection('users').find({
  email: { $regex: escapeRegex(searchTerm), $options: 'i' }
});

// INSECURE (Don't do this)
const users = await db.collection('users').find({
  email: { $regex: searchTerm } // No escaping
});
```

---

### 3.4 Template Injection Prevention

**Test: Prevent Template Code Injection**

**Attack Scenario:**
```javascript
// Attacker provides malicious requesterName
{
  requesterName: "{{#each users}}{{this.password}}{{/each}}"
}
```

**Expected Behavior:**
- Variable values treated as data, NOT executable code
- Template should render: "Hello {{#each users}}{{this.password}}{{/each}}"

**Pass Criteria:**
- ✅ Variables are not re-evaluated as template code
- ✅ Template compilation happens once (at template save)
- ✅ Runtime data is just data, not code

---

## 4. Multi-Tenancy Security

### 4.1 Organization Isolation

**Test: Cannot Access Other Organization's Data**

**Steps:**
1. Login as admin of Org A
2. Get Org A's email settings
3. Note Org B's ID (from database)
4. Try to access Org B's data:
   ```javascript
   GET /api/email/settings?orgId=org_B
   ```

**Expected:**
- 403 Forbidden or 404 Not Found
- Only Org A's data returned

**Pass Criteria:**
- ✅ Cannot view other org's settings
- ✅ Cannot modify other org's settings
- ✅ Cannot view other org's templates
- ✅ Cannot view other org's email logs

---

### 4.2 Database Query Filtering

**Code Review:**

**Every database query MUST include `orgId` filter:**

```typescript
// SECURE
const settings = await db.collection('email_settings').findOne({
  orgId: session.user.orgId // Always filter by orgId
});

// INSECURE (Don't do this)
const settings = await db.collection('email_settings').findOne({
  _id: new ObjectId(settingsId) // No orgId filter!
});
```

**Test Script:**
```javascript
// test-org-isolation.js
async function testOrgIsolation() {
  const db = await connectToDatabase();

  // Check all queries include orgId filter
  const collections = [
    'email_settings',
    'email_templates',
    'notification_rules',
    'email_logs'
  ];

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);

    // Try to query without orgId (should be impossible in code)
    const allDocs = await collection.find({}).toArray();

    if (allDocs.length > 0 && !allDocs[0].orgId) {
      console.log(`FAIL: ${collectionName} missing orgId field`);
    } else {
      console.log(`PASS: ${collectionName} has orgId field`);
    }
  }
}
```

**Pass Criteria:**
- ✅ All documents have `orgId` field
- ✅ All queries filter by `orgId`
- ✅ Database indexes include `orgId`

---

## 5. Rate Limiting and Abuse Prevention

### 5.1 API Rate Limiting

**Test: Prevent Abuse with Rate Limiting**

**Test Script:**
```javascript
// test-rate-limit.js
const axios = require('axios');

async function testRateLimit() {
  const url = 'http://localhost:9002/api/notifications/trigger';
  const requests = [];

  // Send 100 requests in quick succession
  for (let i = 0; i < 100; i++) {
    requests.push(
      axios.post(url, { eventType: 'test.email' }, {
        headers: { Cookie: 'session-token' }
      }).catch(e => e.response)
    );
  }

  const responses = await Promise.all(requests);

  const successful = responses.filter(r => r.status === 200).length;
  const rateLimited = responses.filter(r => r.status === 429).length;

  console.log(`Successful: ${successful}`);
  console.log(`Rate Limited (429): ${rateLimited}`);
}

testRateLimit();
```

**Expected:**
- After X requests per minute, return 429 Too Many Requests
- Response headers include:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 0`
  - `X-RateLimit-Reset: 1609459200`

**Pass Criteria:**
- ✅ Rate limiting enforced
- ✅ 429 status code returned
- ✅ Retry-After header included
- ✅ Rate limit per user/org (not global)

---

### 5.2 Email Sending Rate Limiting

**Test: Prevent Email Spam**

**Test:**
1. User creates notification rule
2. User triggers event 1000 times rapidly
3. System should:
   - Queue emails (not send all immediately)
   - Apply rate limiting
   - Deduplicate similar notifications

**Pass Criteria:**
- ✅ Deduplication prevents 1000 identical emails
- ✅ Rate limiting respects SES quotas
- ✅ User cannot spam recipients

---

## 6. Audit Logging

### 6.1 Security Events Logged

**Test: All Security-Relevant Actions Logged**

**Events to Log:**
- [ ] Admin configures SES settings
- [ ] Admin updates SES credentials
- [ ] Admin tests SES connection
- [ ] Admin creates email template
- [ ] Admin modifies email template
- [ ] Admin deletes email template
- [ ] Admin creates notification rule
- [ ] Admin modifies notification rule
- [ ] User updates email preferences
- [ ] Failed login attempts (if applicable)
- [ ] Permission denied events

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "email.settings.updated",
  "userId": "user_admin",
  "orgId": "org_123",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "changes": {
    "senderEmail": {
      "from": "old@example.com",
      "to": "new@example.com"
    }
  },
  "success": true
}
```

**Pass Criteria:**
- ✅ All security events logged
- ✅ Logs include user, org, timestamp, IP
- ✅ Logs immutable (append-only)
- ✅ Logs retained for compliance period

---

### 6.2 Audit Log Integrity

**Test: Logs Cannot Be Modified**

**Steps:**
1. Perform action (e.g., update settings)
2. Try to modify audit log in database
3. Verify integrity mechanism

**Pass Criteria:**
- ✅ Audit logs in separate collection
- ✅ No update/delete operations allowed
- ✅ Optional: Cryptographic signatures on logs
- ✅ Optional: External log aggregation (e.g., CloudWatch, Datadog)

---

## 7. Secure Transmission

### 7.1 HTTPS Enforcement

**Test: All Requests Over HTTPS**

**Steps:**
1. Try to access: `http://deskwise.com` (no HTTPS)
2. Expected: Redirect to `https://deskwise.com`

**Pass Criteria:**
- ✅ HTTP redirects to HTTPS
- ✅ HSTS header present: `Strict-Transport-Security: max-age=31536000`
- ✅ No mixed content warnings

---

### 7.2 TLS Configuration

**Test: Strong TLS Configuration**

**Use SSL Labs Test:**
```
https://www.ssllabs.com/ssltest/analyze.html?d=deskwise.com
```

**Pass Criteria:**
- ✅ Grade A or A+
- ✅ TLS 1.2+ only (no TLS 1.0/1.1)
- ✅ Strong cipher suites
- ✅ Perfect Forward Secrecy
- ✅ Valid SSL certificate

---

### 7.3 SES TLS Enforcement

**Test: Emails Sent Over TLS**

**SES Configuration:**
- Ensure TLS required for SMTP (if using SMTP)
- SES API uses HTTPS by default

**Pass Criteria:**
- ✅ SES API calls over HTTPS
- ✅ Email content encrypted in transit

---

## 8. Dependency Security

### 8.1 Vulnerable Dependencies

**Test: No Known Vulnerabilities**

**Run:**
```bash
npm audit
npm audit fix
```

**Pass Criteria:**
- ✅ No high or critical vulnerabilities
- ✅ All dependencies up to date
- ✅ Regular dependency updates

---

### 8.2 Supply Chain Security

**Test: Dependencies from Trusted Sources**

**Verify:**
- All packages from npm registry
- No dependencies from unknown sources
- Lock file (`package-lock.json`) committed

**Pass Criteria:**
- ✅ All dependencies verified
- ✅ No malicious packages
- ✅ Lock file prevents unexpected updates

---

## 9. Security Headers

### 9.1 HTTP Security Headers

**Test: Security Headers Present**

**Check Response Headers:**
```bash
curl -I https://deskwise.com/dashboard/settings
```

**Expected Headers:**
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Pass Criteria:**
- ✅ CSP header prevents XSS
- ✅ X-Frame-Options prevents clickjacking
- ✅ X-Content-Type-Options prevents MIME sniffing

---

## 10. Penetration Testing Scenarios

### 10.1 Session Hijacking

**Test: Session Tokens Secure**

**Verify:**
- Session cookies have `HttpOnly` flag
- Session cookies have `Secure` flag (HTTPS only)
- Session cookies have `SameSite=Strict` or `SameSite=Lax`

**Pass Criteria:**
- ✅ Session token not accessible via JavaScript
- ✅ Session token only sent over HTTPS
- ✅ CSRF protection with SameSite

---

### 10.2 CSRF Protection

**Test: Cross-Site Request Forgery Prevention**

**Attack Scenario:**
```html
<!-- Attacker's malicious site -->
<form action="https://deskwise.com/api/email/settings" method="POST">
  <input name="senderEmail" value="attacker@evil.com">
</form>
<script>document.forms[0].submit();</script>
```

**Pass Criteria:**
- ✅ CSRF token required for state-changing operations
- ✅ SameSite cookie attribute
- ✅ Origin header validation

---

## Security Checklist Summary

- [ ] SES credentials encrypted at rest
- [ ] Credentials not exposed in API responses
- [ ] Credentials not logged
- [ ] Encryption key not hardcoded
- [ ] RBAC enforced (admin-only access)
- [ ] API endpoints protected
- [ ] Email validation prevents injection
- [ ] Template XSS prevention works
- [ ] MongoDB injection prevented
- [ ] Template injection prevented
- [ ] Multi-tenancy isolation enforced
- [ ] Database queries always filter by orgId
- [ ] API rate limiting implemented
- [ ] Email spam prevention works
- [ ] Security events logged
- [ ] Audit logs immutable
- [ ] HTTPS enforced
- [ ] Strong TLS configuration
- [ ] No vulnerable dependencies
- [ ] Security headers present
- [ ] Session tokens secure
- [ ] CSRF protection enabled

---

## Security Testing Sign-Off

**Security Testing Completed:** _______________
**Date:** _______________
**Tested By:** _______________
**Security Posture:** [ ] Acceptable [ ] Needs Improvement
**Critical Issues Found:** _______
**Medium Issues Found:** _______
**Recommendations:** _______________________________________________
