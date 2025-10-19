# Email Notification System - Testing Documentation

## Quick Start

This directory contains comprehensive testing documentation and resources for the email notification system.

### Running Tests

```bash
# Install test dependencies (if not already installed)
npm install --save-dev jest ts-jest @types/jest

# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run validation script
node scripts/validate-email-setup.js

# Run smoke tests (requires running server)
node scripts/smoke-test.js
```

---

## Testing Documentation Files

### 1. **TESTING_OVERVIEW.md** 📋
**Start here** - High-level overview of all testing procedures and documentation.

**Contents:**
- Documentation index
- Testing strategy
- Test coverage goals
- CI/CD integration
- Best practices

**Time to read:** 15 minutes

---

### 2. **INTEGRATION_TESTING.md** 🔄
Complete integration testing guide with detailed test scenarios.

**Contents:**
- SES configuration flow (7 steps)
- Template creation flow (10 steps)
- Notification rule flow (9 steps)
- User preferences flow (10 steps)
- Error handling scenarios (6 tests)
- End-to-end workflows (7 flows)

**Time to read:** 45 minutes
**Use for:** End-to-end testing, UAT, pre-release validation

---

### 3. **MANUAL_TESTING_CHECKLIST.md** ✅
Comprehensive manual testing checklist with 250+ items.

**Contents:**
- Email integration settings (50+ checks)
- Template management (60+ checks)
- Notification rules (50+ checks)
- User preferences (30+ checks)
- Email logs (30+ checks)
- End-to-end flows (30+ checks)

**Time to complete:** 2-4 hours
**Use for:** Manual QA cycles, regression testing, release certification

---

### 4. **LOAD_TESTING.md** ⚡
Load and performance testing plan.

**Contents:**
- 7 load test scenarios
- k6 test scripts
- Performance baselines
- Stress testing procedures
- Monitoring guidelines

**Time to read:** 30 minutes
**Use for:** Performance validation, capacity planning

---

### 5. **SECURITY_TESTING.md** 🔒
Security testing procedures and checklist.

**Contents:**
- 10 security testing areas
- 30+ security test cases
- Penetration testing scenarios
- Compliance verification

**Time to read:** 40 minutes
**Use for:** Security audits, compliance verification, pen testing

---

### 6. **SMOKE_TESTING.md** 🔥
Quick smoke tests for post-deployment validation (< 10 minutes).

**Contents:**
- 8-step smoke test procedure
- 5-minute quick validation
- Automated scripts
- CI/CD integration

**Time to complete:** 5-10 minutes
**Use for:** Post-deployment verification, daily health checks

---

## Test Files Location

### Unit Tests
```
__tests__/
├── services/
│   ├── email-ses.test.ts           # SES service tests (250+ lines)
│   ├── email-templates.test.ts     # Template tests (300+ lines)
│   └── notification-engine.test.ts # Engine tests (400+ lines)
```

**Total:** 950+ lines of test code
**Coverage target:** 80%

---

## Scripts

### Validation Script
**File:** `scripts/validate-email-setup.js`

**Validates:**
- ✅ Environment variables
- ✅ Database schema
- ✅ SES credentials encryption
- ✅ Template syntax
- ✅ Notification rules
- ✅ Database indexes
- ✅ RBAC permissions

**Usage:**
```bash
node scripts/validate-email-setup.js
node scripts/validate-email-setup.js --fix
```

---

### Smoke Test Scripts

**Bash:** `scripts/smoke-test.sh`
**Node.js:** `scripts/smoke-test.js`

**Tests:**
1. Health check
2. Admin login
3. Email settings access
4. Send test email
5. Email logs

---

## Quick Reference Commands

```bash
# Development
npm test                              # Run unit tests
npm run test:watch                    # Watch mode
npm run test:coverage                 # Coverage report

# Validation
node scripts/validate-email-setup.js  # Validate setup
node scripts/validate-email-setup.js --fix  # Auto-fix issues

# Smoke Testing
node scripts/smoke-test.js            # Post-deployment check
./scripts/smoke-test.sh               # Bash version

# Linting
npm run lint                          # Lint code
```

---

## Testing Workflow

### 1. Development Phase
```
Write Code → Write Tests → Run Tests → Fix Failures → Commit
```

### 2. Pre-Release Phase
```
Unit Tests → Validation → Manual Testing → Integration Tests → Load Tests → Security Audit
```

### 3. Deployment Phase
```
Deploy to Staging → Smoke Tests → Deploy to Production → Smoke Tests → Monitor
```

---

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| email-ses.ts | 80% | Run `npm run test:coverage` |
| email-templates.ts | 80% | to see current coverage |
| notification-engine.ts | 80% | |
| **Overall** | **80%** | |

---

## Configuration Files

### Jest Configuration
**File:** `jest.config.js`

Configures:
- TypeScript support
- Test patterns
- Coverage thresholds (70%)
- Path aliases
- Coverage collection

### Jest Setup
**File:** `jest.setup.js`

Sets up:
- Test environment variables
- Custom matchers (e.g., `toBeValidEmail`)
- Global utilities

---

## Test Environment

### Required Environment Variables
Create `.env.test`:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/deskwise-test

# Auth
NEXTAUTH_SECRET=test-secret-32-chars-long
NEXTAUTH_URL=http://localhost:9002

# Email Encryption
EMAIL_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# AWS SES (Sandbox)
AWS_SES_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SES_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_SES_REGION=us-east-1

# Test Accounts
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=testpass123
TEST_RECIPIENT=test@example.com
```

---

## CI/CD Integration

### GitHub Actions Workflows

**Unit Tests:** `.github/workflows/unit-tests.yml`
- Runs on every push/PR
- Fails build if tests fail

**Integration Tests:** `.github/workflows/integration-tests.yml`
- Runs on push to main
- Requires MongoDB service

**Smoke Tests:** `.github/workflows/smoke-tests.yml`
- Runs after successful deployment
- Notifies team on failure

---

## Documentation Status

| Document | Status | Size | Lines |
|----------|--------|------|-------|
| TESTING_OVERVIEW.md | ✅ Complete | 20 KB | 500+ |
| INTEGRATION_TESTING.md | ✅ Complete | 45 KB | 1200+ |
| MANUAL_TESTING_CHECKLIST.md | ✅ Complete | 60 KB | 1500+ |
| LOAD_TESTING.md | ✅ Complete | 30 KB | 800+ |
| SECURITY_TESTING.md | ✅ Complete | 40 KB | 1000+ |
| SMOKE_TESTING.md | ✅ Complete | 25 KB | 650+ |

**Total Documentation:** 220+ KB, 5650+ lines

---

## Troubleshooting

### Tests Won't Run
```bash
# Install dependencies
npm install --save-dev jest ts-jest @types/jest
```

### Database Errors
```bash
# Start MongoDB
mongod

# Or use Atlas URI
MONGODB_URI=mongodb+srv://... npm test
```

### Import Errors
```bash
# Check jest.config.js path mapping
# Restart Jest watch mode
```

---

## Getting Help

### Documentation
- Read relevant testing guide
- Check troubleshooting sections
- Review test examples

### Resources
- Jest docs: https://jestjs.io/
- k6 docs: https://k6.io/docs/
- Testing best practices in docs

---

## Contributing

### Adding New Tests
1. Create test file in `__tests__/`
2. Follow existing patterns
3. Include positive/negative cases
4. Update documentation

### Updating Documentation
1. Edit relevant `.md` file
2. Update this README if needed
3. Commit with clear message

---

## Checklist for New Features

When adding email features:

- [ ] Write unit tests
- [ ] Add integration test scenarios
- [ ] Update manual testing checklist
- [ ] Update validation script (if needed)
- [ ] Add smoke test (if needed)
- [ ] Update security testing (if applicable)
- [ ] Document test procedures
- [ ] Verify coverage meets 80% threshold

---

**Last Updated:** October 2024
**Testing Framework:** Jest + ts-jest
**Coverage Tool:** Istanbul (via Jest)
**Load Testing:** k6
