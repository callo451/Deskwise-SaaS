# Email Notification System - Smoke Testing Guide

## Overview

Smoke tests are quick validation checks performed after deployment to ensure the email notification system is functioning correctly. These tests should take **less than 10 minutes** to complete.

## When to Run Smoke Tests

- After production deployment
- After staging deployment
- After major configuration changes
- After database migrations
- After dependency updates
- Daily automated health checks

---

## Pre-Deployment Checklist

Before running smoke tests, verify:

- [ ] Application deployed successfully
- [ ] Database migration completed (if any)
- [ ] Environment variables configured
- [ ] SES credentials valid (check AWS console)
- [ ] DNS records correct (for verified domains)
- [ ] Health check endpoint responding

---

## Smoke Test Procedure

### Test 1: Application Health Check (30 seconds)

**Objective:** Verify application is running and responsive.

**Steps:**
1. Open browser
2. Navigate to application URL
3. Verify homepage loads (< 3 seconds)
4. Check browser console for errors

**Pass Criteria:**
- ✅ Page loads successfully
- ✅ No JavaScript errors in console
- ✅ No network errors

**On Failure:**
- Check server logs
- Verify deployment completed
- Check database connection

---

### Test 2: Admin Login (1 minute)

**Objective:** Verify authentication works.

**Steps:**
1. Navigate to login page
2. Enter admin credentials
3. Click "Login"
4. Verify redirect to dashboard

**Pass Criteria:**
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ User menu shows admin name
- ✅ Admin navigation visible

**On Failure:**
- Check NextAuth configuration
- Verify NEXTAUTH_SECRET set
- Check database connection

---

### Test 3: Access Email Settings (1 minute)

**Objective:** Verify settings page loads correctly.

**Steps:**
1. From dashboard, navigate to Settings
2. Click "Email Integration" or similar
3. Verify page loads

**Pass Criteria:**
- ✅ Settings page loads
- ✅ Form fields visible
- ✅ No error messages
- ✅ Current settings displayed (if configured)

**On Failure:**
- Check RBAC permissions
- Verify API route working
- Check database query

---

### Test 4: Test Connection (2 minutes)

**Objective:** Verify SES credentials are valid.

**Steps:**
1. On email settings page
2. Verify SES credentials configured (or enter test credentials)
3. Click "Test Connection" button
4. Wait for response

**Pass Criteria:**
- ✅ Button shows loading state
- ✅ Success message appears (or error if credentials invalid)
- ✅ Connection status displayed

**Expected Success Message:**
```
✓ Connection successful! SES is configured correctly.
```

**On Failure:**
- Verify SES credentials in AWS console
- Check SES service status
- Verify encryption key correct
- Check network connectivity to AWS

---

### Test 5: Send Test Email (2 minutes)

**Objective:** Verify email sending works end-to-end.

**Steps:**
1. On email settings page
2. Find "Send Test Email" section
3. Enter test recipient email (verified in SES)
4. Click "Send Test Email"
5. Wait for confirmation

**Pass Criteria:**
- ✅ Email sent successfully (status 200)
- ✅ Success notification shown
- ✅ Email appears in logs

**Check Recipient Inbox:**
- ✅ Email received within 1 minute
- ✅ Subject line correct
- ✅ Body content correct
- ✅ Sender email correct

**On Failure:**
- Check email logs for error details
- Verify recipient email verified in SES
- Check SES sending quota
- Verify SES not in sandbox (or recipient verified if in sandbox)

---

### Test 6: Email Logs (1 minute)

**Objective:** Verify email logging works.

**Steps:**
1. Navigate to Email Logs page
2. Look for test email sent in Test 5
3. Verify log entry exists

**Pass Criteria:**
- ✅ Log entry found
- ✅ Status: "delivered" or "sent"
- ✅ Recipient email correct
- ✅ Timestamp accurate
- ✅ Can view email details

**On Failure:**
- Check database connection
- Verify logging code executed
- Check email_logs collection

---

### Test 7: Template Management (1 minute)

**Objective:** Verify template system accessible.

**Steps:**
1. Navigate to Email Templates page
2. Verify template list loads
3. Click "Create Template" (don't save, just verify form opens)
4. Close modal/form

**Pass Criteria:**
- ✅ Template list displays
- ✅ Create form opens
- ✅ All form fields visible
- ✅ Variable picker available

**On Failure:**
- Check database query
- Verify API route working
- Check RBAC permissions

---

### Test 8: Create Sample Ticket (Optional - 2 minutes)

**Objective:** Verify end-to-end notification flow.

**Prerequisites:**
- At least one active notification rule configured
- Rule triggers on ticket creation

**Steps:**
1. Navigate to Tickets page
2. Click "Create Ticket"
3. Fill in basic details:
   - Subject: "Smoke Test Ticket"
   - Description: "Testing email notifications"
   - Priority: "high" (if rule matches this)
4. Select requester
5. Submit ticket

**Pass Criteria:**
- ✅ Ticket created successfully
- ✅ Email notification queued (check logs)
- ✅ Recipient receives email within 2 minutes

**On Failure:**
- Check notification rules
- Verify rule conditions match
- Check email queue
- Check worker processing

---

## Quick Smoke Test (5 minutes)

If time is limited, run this abbreviated test:

1. **Login:** ✅ Admin can login
2. **Settings:** ✅ Email settings page loads
3. **Test Connection:** ✅ SES connection works
4. **Send Email:** ✅ Test email sends and is received
5. **Logs:** ✅ Email appears in logs

**All pass?** System is healthy ✓
**Any fail?** Investigate immediately

---

## Automated Smoke Test Script

Save as `scripts/smoke-test.sh`:

```bash
#!/bin/bash

# Email System Smoke Test
# Usage: ./scripts/smoke-test.sh

set -e

BASE_URL="${BASE_URL:-http://localhost:9002}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@test.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
TEST_RECIPIENT="${TEST_RECIPIENT:-test@example.com}"

echo "🔥 Starting Email System Smoke Tests"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health")
if [ "$STATUS" -eq 200 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed (Status: $STATUS)"
  exit 1
fi

# Test 2: Login
echo ""
echo "Test 2: Admin Login"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/signin" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}" \
  -c cookies.txt)

if echo "$LOGIN_RESPONSE" | grep -q "session"; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

# Test 3: Get Email Settings
echo ""
echo "Test 3: Email Settings Access"
SETTINGS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/email/settings" \
  -b cookies.txt)

if [ "$SETTINGS_STATUS" -eq 200 ]; then
  echo "✅ Email settings accessible"
else
  echo "❌ Cannot access email settings (Status: $SETTINGS_STATUS)"
  exit 1
fi

# Test 4: Send Test Email
echo ""
echo "Test 4: Send Test Email"
EMAIL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/email/test" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{\"recipient\":\"$TEST_RECIPIENT\"}")

if echo "$EMAIL_RESPONSE" | grep -q "success"; then
  echo "✅ Test email sent"
else
  echo "❌ Failed to send test email"
  echo "$EMAIL_RESPONSE"
  exit 1
fi

# Test 5: Check Email Logs
echo ""
echo "Test 5: Email Logs"
LOGS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/email/logs" \
  -b cookies.txt)

if [ "$LOGS_STATUS" -eq 200 ]; then
  echo "✅ Email logs accessible"
else
  echo "❌ Cannot access email logs (Status: $LOGS_STATUS)"
  exit 1
fi

# Cleanup
rm -f cookies.txt

echo ""
echo "🎉 All smoke tests passed!"
exit 0
```

**Run the script:**
```bash
chmod +x scripts/smoke-test.sh
./scripts/smoke-test.sh
```

---

## Automated Smoke Test (Node.js)

Save as `scripts/smoke-test.js`:

```javascript
/**
 * Automated Smoke Tests for Email System
 * Usage: node scripts/smoke-test.js
 */

const axios = require('axios');
const { MongoClient } = require('mongodb');

const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:9002',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@test.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  testRecipient: process.env.TEST_RECIPIENT || 'test@example.com',
  mongoUri: process.env.MONGODB_URI,
};

class SmokeTest {
  constructor() {
    this.sessionCookie = null;
    this.passed = 0;
    this.failed = 0;
  }

  async run() {
    console.log('🔥 Email System Smoke Tests\n');

    try {
      await this.test1_HealthCheck();
      await this.test2_AdminLogin();
      await this.test3_EmailSettings();
      await this.test4_SendTestEmail();
      await this.test5_EmailLogs();
      await this.test6_DatabaseCheck();

      console.log(`\n${'='.repeat(50)}`);
      console.log(`✅ Passed: ${this.passed}`);
      console.log(`❌ Failed: ${this.failed}`);

      if (this.failed === 0) {
        console.log('\n🎉 All smoke tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('\n💥 Smoke test failed:', error.message);
      process.exit(1);
    }
  }

  async test1_HealthCheck() {
    console.log('Test 1: Health Check');
    try {
      const response = await axios.get(`${config.baseUrl}/api/health`);
      if (response.status === 200) {
        console.log('✅ Health check passed');
        this.passed++;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      this.failed++;
      throw error;
    }
  }

  async test2_AdminLogin() {
    console.log('\nTest 2: Admin Login');
    try {
      const response = await axios.post(
        `${config.baseUrl}/api/auth/callback/credentials`,
        {
          email: config.adminEmail,
          password: config.adminPassword,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          maxRedirects: 0,
          validateStatus: (status) => status === 200 || status === 302,
        }
      );

      // Extract session cookie
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        this.sessionCookie = cookies[0].split(';')[0];
        console.log('✅ Login successful');
        this.passed++;
      } else {
        throw new Error('No session cookie received');
      }
    } catch (error) {
      console.log('❌ Login failed:', error.message);
      this.failed++;
      throw error;
    }
  }

  async test3_EmailSettings() {
    console.log('\nTest 3: Email Settings Access');
    try {
      const response = await axios.get(`${config.baseUrl}/api/email/settings`, {
        headers: { Cookie: this.sessionCookie },
      });

      if (response.status === 200) {
        console.log('✅ Email settings accessible');
        this.passed++;
      } else {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log('❌ Email settings failed:', error.message);
      this.failed++;
      throw error;
    }
  }

  async test4_SendTestEmail() {
    console.log('\nTest 4: Send Test Email');
    try {
      const response = await axios.post(
        `${config.baseUrl}/api/email/test`,
        { recipient: config.testRecipient },
        { headers: { Cookie: this.sessionCookie } }
      );

      if (response.data.success) {
        console.log('✅ Test email sent successfully');
        this.passed++;
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      console.log('❌ Send test email failed:', error.message);
      this.failed++;
      // Don't throw - continue with other tests
    }
  }

  async test5_EmailLogs() {
    console.log('\nTest 5: Email Logs');
    try {
      const response = await axios.get(`${config.baseUrl}/api/email/logs`, {
        headers: { Cookie: this.sessionCookie },
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        console.log(`✅ Email logs accessible (${response.data.length} entries)`);
        this.passed++;
      } else {
        throw new Error('Invalid logs response');
      }
    } catch (error) {
      console.log('❌ Email logs failed:', error.message);
      this.failed++;
    }
  }

  async test6_DatabaseCheck() {
    console.log('\nTest 6: Database Connection');

    if (!config.mongoUri) {
      console.log('⚠️  Skipping database check (MONGODB_URI not set)');
      return;
    }

    try {
      const client = new MongoClient(config.mongoUri);
      await client.connect();

      const db = client.db();
      await db.command({ ping: 1 });

      console.log('✅ Database connection OK');
      this.passed++;

      await client.close();
    } catch (error) {
      console.log('❌ Database check failed:', error.message);
      this.failed++;
    }
  }
}

// Run tests
const test = new SmokeTest();
test.run();
```

**Run:**
```bash
node scripts/smoke-test.js
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/smoke-test.yml
name: Smoke Tests

on:
  deployment_status:
    types: [success]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    if: github.event.deployment_status.state == 'success'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install axios mongodb

      - name: Run smoke tests
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          TEST_RECIPIENT: ${{ secrets.TEST_RECIPIENT }}
          MONGODB_URI: ${{ secrets.MONGODB_URI }}
        run: node scripts/smoke-test.js

      - name: Notify on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚨 Smoke tests failed after deployment!"
            }
```

---

## Troubleshooting Common Issues

### Issue: Health Check Fails

**Possible Causes:**
- Application not running
- Wrong URL
- Network issues
- Server crashed

**Solutions:**
- Check server logs: `pm2 logs`
- Verify deployment completed
- Check DNS resolution
- Restart application

---

### Issue: Login Fails

**Possible Causes:**
- Wrong credentials
- NextAuth misconfigured
- Database connection issue
- Session secret mismatch

**Solutions:**
- Verify credentials in database
- Check NEXTAUTH_SECRET matches
- Test database connection
- Clear browser cookies

---

### Issue: Test Email Not Sent

**Possible Causes:**
- Invalid SES credentials
- SES in sandbox mode (recipient not verified)
- SES quota exceeded
- Network issue to AWS

**Solutions:**
- Verify SES credentials in AWS console
- Check SES sandbox status
- Verify recipient email verified
- Check AWS SES quotas

---

### Issue: Email Not Received

**Possible Causes:**
- Spam folder
- Email client filtering
- SES reputation issue
- Wrong recipient email

**Solutions:**
- Check spam/junk folder
- Check email logs for delivery status
- Verify SES reputation in AWS console
- Check recipient email spelling

---

## Smoke Test Checklist Summary

Quick reference checklist:

- [ ] Application accessible
- [ ] Admin login works
- [ ] Settings page loads
- [ ] Test connection succeeds
- [ ] Test email sends
- [ ] Email received
- [ ] Email appears in logs
- [ ] Database connection OK

**All checked?** ✅ System healthy
**Any unchecked?** 🔍 Investigate immediately

---

## Reporting

After smoke tests, document results:

**Date:** _______________
**Environment:** [ ] Production [ ] Staging [ ] Development
**Tester:** _______________
**Test Result:** [ ] Pass [ ] Fail

**Failed Tests:**
- _______________________________________________
- _______________________________________________

**Actions Taken:**
- _______________________________________________
- _______________________________________________

**Sign-Off:** _______________
