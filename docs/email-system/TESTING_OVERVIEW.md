# Email Notification System - Testing Overview

## Purpose

This document provides a high-level overview of all testing documentation and procedures for the email notification system.

---

## Testing Documentation Index

### 1. Unit Tests
**Location:** `__tests__/services/`

**Files:**
- `email-ses.test.ts` - SES email service tests
- `email-templates.test.ts` - Template rendering tests
- `notification-engine.test.ts` - Notification rule engine tests

**Coverage:**
- SES email sending (mocked)
- Credential encryption/decryption
- Email validation
- Template rendering with variables
- Template validation
- XSS prevention
- Rule evaluation
- Recipient determination
- Event triggering

**Run Tests:**
```bash
npm test
# or
npm run test:unit
```

---

### 2. Integration Testing
**Location:** `docs/email-system/INTEGRATION_TESTING.md`

**Scope:**
- End-to-end workflows from configuration to delivery
- Multi-component integration testing
- Real SES interaction (test environment)
- Database persistence verification

**Key Test Flows:**
1. SES Configuration Flow (7 steps)
2. Template Creation Flow (10 steps)
3. Notification Rule Flow (9 steps)
4. User Preferences Flow (10 steps)
5. Error Handling (6 scenarios)

**End-to-End Workflows:**
- Ticket Created → Email Sent to Requester
- Ticket Assigned → Email Sent to Assignee
- Ticket Commented → Email to Watchers
- Ticket Resolved → CSAT Survey Email
- Incident Created → Team Notification
- User Mentioned → Direct Notification
- SLA Breach → Escalation Email

**Run Integration Tests:**
```bash
npm run test:integration
```

---

### 3. Manual Testing Checklist
**Location:** `docs/email-system/MANUAL_TESTING_CHECKLIST.md`

**Sections:**
1. Email Integration Settings (8 subsections)
2. Template Management (13 subsections)
3. Notification Rules (13 subsections)
4. User Preferences (6 subsections)
5. Email Logs (8 subsections)
6. End-to-End Flows (8 workflows)
7. Error Scenarios (6 scenarios)
8. Security Testing (4 tests)
9. Performance Testing (3 tests)
10. Compatibility Testing (browser & email client)
11. Accessibility Testing (3 tests)
12. Smoke Tests (quick validation)

**Total Checklist Items:** 250+

**Use For:**
- Pre-release validation
- UAT (User Acceptance Testing)
- Manual QA cycles
- Regression testing

---

### 4. Load Testing Plan
**Location:** `docs/email-system/LOAD_TESTING.md`

**Test Scenarios:**
1. **Concurrent Email Sending** - 100 simultaneous emails
2. **High Volume Burst** - 1,000 emails in 1 minute
3. **Sustained Load** - 10,000 emails over 1 hour
4. **SES Rate Limit Testing** - Verify throttling works
5. **Database Performance** - Large dataset queries
6. **Concurrent Rule Evaluation** - Multiple rules per event
7. **Email Queue Processing** - Background worker performance

**Tools:**
- k6 (load testing tool)
- Artillery (alternative)
- Custom Node.js scripts

**Performance Baselines:**
| Metric | Target |
|--------|--------|
| API Response Time (P95) | < 500ms |
| Template Rendering | < 10ms |
| Email Send Rate | 14/sec (SES limit) |
| Database Query (100k logs) | < 100ms |

**Run Load Tests:**
```bash
k6 run load-tests/concurrent-100.js
k6 run load-tests/burst-1000.js
```

---

### 5. Security Testing Guide
**Location:** `docs/email-system/SECURITY_TESTING.md`

**Security Areas:**
1. **Credential Security** (4 tests)
   - Encryption at rest
   - API exposure prevention
   - Logging security
   - Encryption key security

2. **Access Control** (3 tests)
   - Settings page RBAC
   - API endpoint RBAC
   - Permission middleware

3. **Input Validation** (4 tests)
   - Email address validation
   - Template XSS prevention
   - SQL/NoSQL injection prevention
   - Template injection prevention

4. **Multi-Tenancy** (2 tests)
   - Organization isolation
   - Database query filtering

5. **Rate Limiting** (2 tests)
   - API rate limiting
   - Email spam prevention

6. **Audit Logging** (2 tests)
   - Security event logging
   - Audit log integrity

7. **Secure Transmission** (3 tests)
   - HTTPS enforcement
   - TLS configuration
   - SES TLS enforcement

8. **Dependency Security** (2 tests)
   - Vulnerable dependencies
   - Supply chain security

9. **Security Headers** (1 test)
   - HTTP security headers

10. **Penetration Testing** (2 scenarios)
    - Session hijacking
    - CSRF protection

**Run Security Tests:**
```bash
npm audit
npm run test:security
```

---

### 6. Validation Script
**Location:** `scripts/validate-email-setup.js`

**What It Validates:**
- ✅ Environment variables configured
- ✅ Database schema integrity
- ✅ SES credentials format and encryption
- ✅ Email template syntax
- ✅ Notification rule configuration
- ✅ Database indexes
- ✅ RBAC permissions

**Run Validation:**
```bash
node scripts/validate-email-setup.js
node scripts/validate-email-setup.js --fix  # Auto-fix issues
```

**Example Output:**
```
Email System Validation
Started at 2024-01-15T10:30:00Z

1. Environment Variables
✓ MONGODB_URI is set
✓ NEXTAUTH_SECRET is set
✓ EMAIL_ENCRYPTION_KEY is set
✓ EMAIL_ENCRYPTION_KEY format is valid (64 hex chars)

2. Database Connection
✓ Connected to MongoDB: deskwise
✓ Database is responsive

3. Database Schema
✓ Collection exists: email_settings
  └─ 1 document(s)
✓ Collection exists: email_templates
  └─ 5 document(s)
...

Validation Summary
Total Errors: 0
Total Warnings: 2

✓ Validation passed with warnings
```

---

### 7. Smoke Testing Guide
**Location:** `docs/email-system/SMOKE_TESTING.md`

**Purpose:** Quick post-deployment validation (< 10 minutes)

**Tests:**
1. Application Health Check (30 sec)
2. Admin Login (1 min)
3. Access Email Settings (1 min)
4. Test Connection (2 min)
5. Send Test Email (2 min)
6. Email Logs (1 min)
7. Template Management (1 min)
8. Create Sample Ticket (2 min - optional)

**Quick Smoke Test (5 min):**
1. Login ✓
2. Settings page loads ✓
3. Test connection succeeds ✓
4. Test email sends ✓
5. Logs show email ✓

**Automated Smoke Tests:**
```bash
# Bash script
./scripts/smoke-test.sh

# Node.js script
node scripts/smoke-test.js
```

**CI/CD Integration:**
- GitHub Actions workflow included
- Runs after successful deployment
- Notifies team on failure

---

## Testing Strategy

### Development Phase
1. **Unit Tests** - Write tests alongside features
2. **Validation Script** - Run before commits
3. **Manual Testing** - Test new features interactively

### Pre-Release
1. **Integration Tests** - Full end-to-end flows
2. **Manual Testing Checklist** - Complete UAT
3. **Load Testing** - Verify performance targets
4. **Security Testing** - Complete security audit

### Deployment
1. **Smoke Tests** - Immediate post-deployment
2. **Validation Script** - Verify configuration

### Production Monitoring
1. **Automated Smoke Tests** - Daily scheduled runs
2. **Performance Monitoring** - Track metrics
3. **Error Monitoring** - Alert on failures

---

## Test Coverage Goals

### Unit Test Coverage
- **Target:** 80% code coverage
- **Critical Paths:** 100% coverage
- **Current:** _____% (run `npm run test:coverage`)

### Integration Test Coverage
- **All API Endpoints:** 100%
- **All User Workflows:** 100%
- **Error Scenarios:** Major error paths

### Manual Test Coverage
- **All UI Components:** 100%
- **All Settings Pages:** 100%
- **All User Roles:** Admin, Technician, End User

---

## Test Data

### Test Credentials
Store in `.env.test`:
```env
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpass123
TEST_TECH_EMAIL=tech@test.com
TEST_TECH_PASSWORD=testpass123
TEST_USER_EMAIL=user@test.com
TEST_USER_PASSWORD=testpass123
```

### Test Email Addresses
SES Sandbox verified emails:
- `test1@example.com`
- `test2@example.com`
- `noreply@example.com`

### Test Organization
- **Org ID:** `test_org_12345`
- **Name:** `Test Organization`

---

## Continuous Integration

### GitHub Actions Workflows

**Unit Tests:**
```yaml
# .github/workflows/unit-tests.yml
name: Unit Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test
```

**Integration Tests:**
```yaml
# .github/workflows/integration-tests.yml
name: Integration Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:integration
```

**Smoke Tests:**
```yaml
# .github/workflows/smoke-tests.yml
name: Smoke Tests
on:
  deployment_status:
    types: [success]
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: node scripts/smoke-test.js
```

---

## Testing Best Practices

### 1. Test Isolation
- Each test should be independent
- Clean up test data after each test
- Use transactions for database tests (where possible)

### 2. Mocking
- Mock external services (SES) in unit tests
- Use real services in integration tests (sandbox environment)
- Mock time/date for consistent results

### 3. Test Data
- Use factories for test data generation
- Don't hardcode IDs (use variables)
- Create minimal test data (only what's needed)

### 4. Assertions
- Be specific in assertions
- Test both positive and negative cases
- Check error messages, not just status codes

### 5. Test Maintenance
- Update tests when features change
- Remove obsolete tests
- Refactor duplicate test code

---

## Troubleshooting Test Failures

### Unit Tests Fail

**Common Causes:**
- Missing mocks
- Incorrect test data
- Environment variable not set

**Solutions:**
- Check mock implementations
- Verify test data structure
- Set up `.env.test` file

### Integration Tests Fail

**Common Causes:**
- Database connection issue
- SES credentials invalid
- Test data conflict

**Solutions:**
- Verify MongoDB running
- Check SES sandbox settings
- Clean up test database

### Load Tests Fail

**Common Causes:**
- Insufficient resources
- Rate limits exceeded
- Network issues

**Solutions:**
- Increase server resources
- Adjust test parameters
- Check network connectivity

---

## Test Reporting

### Test Results Format

**Unit Tests:**
```
Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Time:        12.345 s
Coverage:    82.5%
```

**Integration Tests:**
```
Scenario: SES Configuration Flow
  ✓ Admin can save SES credentials
  ✓ Credentials are encrypted
  ✓ Test connection succeeds
  ✓ Settings persist after refresh

Total: 25 scenarios, 0 failures
```

**Load Tests:**
```
checks.........................: 100.00% ✓ 10000  ✗ 0
http_req_duration..............: avg=234ms min=45ms med=198ms max=1.2s
http_reqs......................: 10000 166.67/s
```

---

## Next Steps

After reviewing this testing overview:

1. **Set Up Testing Environment**
   - Install testing dependencies
   - Configure `.env.test`
   - Set up test database

2. **Run Validation**
   ```bash
   node scripts/validate-email-setup.js
   ```

3. **Run Unit Tests**
   ```bash
   npm test
   ```

4. **Complete Manual Testing Checklist**
   - Use `MANUAL_TESTING_CHECKLIST.md`
   - Document results

5. **Run Smoke Tests**
   ```bash
   node scripts/smoke-test.js
   ```

6. **Address Any Issues**
   - Fix failing tests
   - Resolve validation errors
   - Update documentation

---

## Resources

- **Unit Tests:** `__tests__/services/`
- **Integration Tests:** `docs/email-system/INTEGRATION_TESTING.md`
- **Manual Checklist:** `docs/email-system/MANUAL_TESTING_CHECKLIST.md`
- **Load Testing:** `docs/email-system/LOAD_TESTING.md`
- **Security Testing:** `docs/email-system/SECURITY_TESTING.md`
- **Validation Script:** `scripts/validate-email-setup.js`
- **Smoke Tests:** `docs/email-system/SMOKE_TESTING.md`

---

## Contact

For questions about testing:
- **Testing Lead:** _______________
- **Email:** _______________
- **Slack:** _______________

---

**Last Updated:** _______________
**Document Version:** 1.0
