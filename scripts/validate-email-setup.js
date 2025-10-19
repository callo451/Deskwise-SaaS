/**
 * Email System Validation Script
 *
 * This script validates the email notification system setup including:
 * - SES credentials format
 * - Email template syntax
 * - Database schema integrity
 * - Required environment variables
 * - API endpoints accessibility
 * - RBAC permissions configured
 *
 * Usage:
 *   node scripts/validate-email-setup.js
 *   node scripts/validate-email-setup.js --fix  (attempt to fix issues)
 */

const { MongoClient, ObjectId } = require('mongodb');
const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

class EmailSystemValidator {
  constructor(options = {}) {
    this.options = options;
    this.errors = [];
    this.warnings = [];
    this.client = null;
    this.db = null;
  }

  async validate() {
    log.section('Email System Validation');
    log.info(`Started at ${new Date().toISOString()}\n`);

    try {
      await this.checkEnvironmentVariables();
      await this.connectToDatabase();
      await this.validateDatabaseSchema();
      await this.validateSESCredentials();
      await this.validateEmailTemplates();
      await this.validateNotificationRules();
      await this.validateIndexes();
      await this.validateRBACPermissions();

      if (this.options.checkEndpoints) {
        await this.validateAPIEndpoints();
      }

      this.printSummary();

      return this.errors.length === 0;
    } catch (error) {
      log.error(`Validation failed: ${error.message}`);
      return false;
    } finally {
      if (this.client) {
        await this.client.close();
      }
    }
  }

  async checkEnvironmentVariables() {
    log.section('1. Environment Variables');

    const required = [
      'MONGODB_URI',
      'NEXTAUTH_SECRET',
      'EMAIL_ENCRYPTION_KEY',
    ];

    const optional = [
      'AWS_SES_ACCESS_KEY_ID',
      'AWS_SES_SECRET_ACCESS_KEY',
      'AWS_SES_REGION',
    ];

    for (const varName of required) {
      if (process.env[varName]) {
        log.success(`${varName} is set`);
      } else {
        this.errors.push(`Missing required environment variable: ${varName}`);
        log.error(`${varName} is missing`);
      }
    }

    // Check encryption key format
    if (process.env.EMAIL_ENCRYPTION_KEY) {
      const key = process.env.EMAIL_ENCRYPTION_KEY;
      if (key.length === 64 && /^[0-9a-f]+$/i.test(key)) {
        log.success('EMAIL_ENCRYPTION_KEY format is valid (64 hex chars)');
      } else {
        this.errors.push('EMAIL_ENCRYPTION_KEY must be 64 hexadecimal characters (32 bytes)');
        log.error('EMAIL_ENCRYPTION_KEY format is invalid');
      }
    }

    for (const varName of optional) {
      if (process.env[varName]) {
        log.success(`${varName} is set (optional)`);
      } else {
        this.warnings.push(`Optional environment variable not set: ${varName}`);
        log.warning(`${varName} is not set (optional)`);
      }
    }
  }

  async connectToDatabase() {
    log.section('2. Database Connection');

    try {
      this.client = new MongoClient(process.env.MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db();

      log.success(`Connected to MongoDB: ${this.db.databaseName}`);

      // Test connection
      await this.db.command({ ping: 1 });
      log.success('Database is responsive');
    } catch (error) {
      this.errors.push(`Database connection failed: ${error.message}`);
      log.error(`Failed to connect: ${error.message}`);
      throw error;
    }
  }

  async validateDatabaseSchema() {
    log.section('3. Database Schema');

    const requiredCollections = [
      'email_settings',
      'email_templates',
      'notification_rules',
      'email_logs',
      'users',
    ];

    const collections = await this.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    for (const collectionName of requiredCollections) {
      if (collectionNames.includes(collectionName)) {
        log.success(`Collection exists: ${collectionName}`);

        // Check for documents
        const count = await this.db.collection(collectionName).countDocuments();
        log.info(`  └─ ${count} document(s)`);
      } else {
        this.warnings.push(`Collection missing: ${collectionName} (will be created on first use)`);
        log.warning(`Collection not found: ${collectionName}`);
      }
    }

    // Validate schema for existing documents
    await this.validateCollectionSchema('email_settings', {
      orgId: 'string',
      sesCredentials: 'object',
      senderEmail: 'string',
      senderName: 'string',
      isEnabled: 'boolean',
    });

    await this.validateCollectionSchema('email_templates', {
      orgId: 'string',
      name: 'string',
      category: 'string',
      subject: 'string',
      htmlBody: 'string',
      textBody: 'string',
      isActive: 'boolean',
    });

    await this.validateCollectionSchema('notification_rules', {
      orgId: 'string',
      name: 'string',
      eventType: 'string',
      isActive: 'boolean',
      templateId: 'string',
    });
  }

  async validateCollectionSchema(collectionName, expectedSchema) {
    const collection = this.db.collection(collectionName);
    const sample = await collection.findOne({});

    if (!sample) {
      log.info(`  └─ No documents to validate in ${collectionName}`);
      return;
    }

    let schemaValid = true;
    for (const [field, expectedType] of Object.entries(expectedSchema)) {
      const actualType = typeof sample[field];

      if (actualType === 'undefined') {
        this.warnings.push(`${collectionName}: Missing field '${field}' in sample document`);
        schemaValid = false;
      } else if (actualType !== expectedType && expectedType !== 'object') {
        this.warnings.push(`${collectionName}: Field '${field}' has type '${actualType}', expected '${expectedType}'`);
        schemaValid = false;
      }
    }

    if (schemaValid) {
      log.success(`  └─ Schema valid for ${collectionName}`);
    }
  }

  async validateSESCredentials() {
    log.section('4. SES Credentials');

    const settings = await this.db.collection('email_settings').find({}).toArray();

    if (settings.length === 0) {
      this.warnings.push('No SES credentials configured yet');
      log.warning('No SES credentials found (configure via UI)');
      return;
    }

    for (const setting of settings) {
      log.info(`Checking credentials for org: ${setting.orgId}`);

      // Check encryption
      if (setting.sesCredentials && setting.sesCredentials.encryptedData) {
        log.success('  └─ Credentials are encrypted');

        if (setting.sesCredentials.iv && setting.sesCredentials.tag) {
          log.success('  └─ Encryption metadata present (iv, tag)');
        } else {
          this.errors.push(`Org ${setting.orgId}: Missing encryption metadata (iv or tag)`);
          log.error('  └─ Missing iv or tag');
        }
      } else {
        this.errors.push(`Org ${setting.orgId}: Credentials not encrypted or missing`);
        log.error('  └─ Credentials not encrypted');
      }

      // Check for plain text credentials (security issue)
      if (setting.sesCredentials && (setting.sesCredentials.accessKeyId || setting.sesCredentials.secretAccessKey)) {
        this.errors.push(`Org ${setting.orgId}: SECURITY ISSUE - Plain text credentials found in database!`);
        log.error('  └─ SECURITY ISSUE: Plain credentials in database');
      }

      // Check sender email format
      if (setting.senderEmail && this.validateEmailFormat(setting.senderEmail)) {
        log.success(`  └─ Sender email valid: ${setting.senderEmail}`);
      } else {
        this.errors.push(`Org ${setting.orgId}: Invalid sender email format`);
        log.error(`  └─ Invalid sender email: ${setting.senderEmail}`);
      }
    }
  }

  async validateEmailTemplates() {
    log.section('5. Email Templates');

    const templates = await this.db.collection('email_templates').find({}).toArray();

    if (templates.length === 0) {
      this.warnings.push('No email templates configured');
      log.warning('No templates found');
      return;
    }

    log.info(`Found ${templates.length} template(s)`);

    for (const template of templates) {
      log.info(`\nValidating template: ${template.name} (${template._id})`);

      // Check required fields
      const requiredFields = ['name', 'subject', 'htmlBody', 'textBody', 'category'];
      for (const field of requiredFields) {
        if (template[field]) {
          log.success(`  └─ Field '${field}' present`);
        } else {
          this.errors.push(`Template ${template.name}: Missing required field '${field}'`);
          log.error(`  └─ Missing field '${field}'`);
        }
      }

      // Validate Handlebars syntax
      const syntaxFields = ['subject', 'htmlBody', 'textBody'];
      for (const field of syntaxFields) {
        if (template[field]) {
          try {
            Handlebars.compile(template[field]);
            log.success(`  └─ ${field} syntax valid`);
          } catch (error) {
            this.errors.push(`Template ${template.name}: Invalid ${field} syntax - ${error.message}`);
            log.error(`  └─ ${field} syntax error: ${error.message}`);
          }
        }
      }

      // Check for potentially dangerous content
      if (template.htmlBody) {
        const dangerous = ['<script', 'javascript:', 'onerror=', 'onclick='];
        for (const pattern of dangerous) {
          if (template.htmlBody.toLowerCase().includes(pattern)) {
            this.warnings.push(`Template ${template.name}: Contains potentially dangerous content: ${pattern}`);
            log.warning(`  └─ Contains: ${pattern}`);
          }
        }
      }
    }
  }

  async validateNotificationRules() {
    log.section('6. Notification Rules');

    const rules = await this.db.collection('notification_rules').find({}).toArray();

    if (rules.length === 0) {
      this.warnings.push('No notification rules configured');
      log.warning('No rules found');
      return;
    }

    log.info(`Found ${rules.length} rule(s)`);

    for (const rule of rules) {
      log.info(`\nValidating rule: ${rule.name} (${rule._id})`);

      // Check required fields
      if (rule.eventType) {
        log.success(`  └─ Event type: ${rule.eventType}`);
      } else {
        this.errors.push(`Rule ${rule.name}: Missing eventType`);
        log.error(`  └─ Missing eventType`);
      }

      // Check template reference
      if (rule.templateId) {
        const template = await this.db.collection('email_templates').findOne({
          _id: new ObjectId(rule.templateId),
        });

        if (template) {
          log.success(`  └─ Template reference valid: ${template.name}`);
        } else {
          this.errors.push(`Rule ${rule.name}: Referenced template not found (${rule.templateId})`);
          log.error(`  └─ Template not found: ${rule.templateId}`);
        }
      } else {
        this.errors.push(`Rule ${rule.name}: Missing templateId`);
        log.error(`  └─ Missing templateId`);
      }

      // Check recipients configuration
      if (rule.recipients) {
        log.success(`  └─ Recipients configured: ${rule.recipients.type || 'unknown'}`);
      } else {
        this.warnings.push(`Rule ${rule.name}: No recipients configured`);
        log.warning(`  └─ No recipients configured`);
      }

      // Check conditions syntax
      if (rule.conditions && Array.isArray(rule.conditions)) {
        log.success(`  └─ ${rule.conditions.length} condition(s) defined`);

        for (const condition of rule.conditions) {
          if (!condition.field || !condition.operator) {
            this.errors.push(`Rule ${rule.name}: Invalid condition (missing field or operator)`);
            log.error(`  └─ Invalid condition`);
          }
        }
      }
    }
  }

  async validateIndexes() {
    log.section('7. Database Indexes');

    const requiredIndexes = {
      email_settings: [
        { key: { orgId: 1 }, unique: true },
      ],
      email_templates: [
        { key: { orgId: 1, name: 1 } },
        { key: { orgId: 1, category: 1 } },
      ],
      notification_rules: [
        { key: { orgId: 1, eventType: 1 } },
        { key: { orgId: 1, isActive: 1 } },
      ],
      email_logs: [
        { key: { orgId: 1, sentAt: -1 } },
        { key: { orgId: 1, status: 1 } },
        { key: { orgId: 1, recipient: 1 } },
      ],
    };

    for (const [collectionName, indexes] of Object.entries(requiredIndexes)) {
      const collection = this.db.collection(collectionName);
      const existingIndexes = await collection.indexes();

      log.info(`\nChecking indexes for ${collectionName}:`);

      for (const requiredIndex of indexes) {
        const exists = existingIndexes.some(idx => {
          return JSON.stringify(idx.key) === JSON.stringify(requiredIndex.key);
        });

        if (exists) {
          log.success(`  └─ Index exists: ${JSON.stringify(requiredIndex.key)}`);
        } else {
          this.warnings.push(`Missing index on ${collectionName}: ${JSON.stringify(requiredIndex.key)}`);
          log.warning(`  └─ Missing index: ${JSON.stringify(requiredIndex.key)}`);

          if (this.options.fix) {
            try {
              await collection.createIndex(requiredIndex.key, requiredIndex.unique ? { unique: true } : {});
              log.success(`  └─ Created index: ${JSON.stringify(requiredIndex.key)}`);
            } catch (error) {
              log.error(`  └─ Failed to create index: ${error.message}`);
            }
          }
        }
      }
    }
  }

  async validateRBACPermissions() {
    log.section('8. RBAC Permissions');

    // Check if permissions collection exists
    const permissions = await this.db.collection('permissions').find({
      key: { $regex: '^email\\.' }
    }).toArray();

    const requiredPermissions = [
      'email.settings.manage',
      'email.templates.create',
      'email.templates.edit',
      'email.templates.delete',
      'email.rules.create',
      'email.rules.edit',
      'email.rules.delete',
      'email.logs.view',
    ];

    if (permissions.length === 0) {
      this.warnings.push('No email-related RBAC permissions found (run RBAC seed)');
      log.warning('No RBAC permissions found');
      return;
    }

    const permissionKeys = permissions.map(p => p.key);

    for (const requiredPerm of requiredPermissions) {
      if (permissionKeys.includes(requiredPerm)) {
        log.success(`  └─ Permission exists: ${requiredPerm}`);
      } else {
        this.warnings.push(`Missing RBAC permission: ${requiredPerm}`);
        log.warning(`  └─ Missing: ${requiredPerm}`);
      }
    }
  }

  async validateAPIEndpoints() {
    log.section('9. API Endpoints (Optional)');

    log.info('Skipping API endpoint validation (requires running server)');
    log.info('To test endpoints, run integration tests instead');
  }

  validateEmailFormat(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  printSummary() {
    log.section('Validation Summary');

    console.log(`\nTotal Errors: ${colors.red}${this.errors.length}${colors.reset}`);
    console.log(`Total Warnings: ${colors.yellow}${this.warnings.length}${colors.reset}`);

    if (this.errors.length > 0) {
      console.log(`\n${colors.red}${colors.bright}Errors:${colors.reset}`);
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}${colors.bright}Warnings:${colors.reset}`);
      this.warnings.forEach((warning, i) => {
        console.log(`  ${i + 1}. ${warning}`);
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ All validations passed!${colors.reset}`);
    } else if (this.errors.length === 0) {
      console.log(`\n${colors.green}${colors.bright}✓ Validation passed with warnings${colors.reset}`);
    } else {
      console.log(`\n${colors.red}${colors.bright}✗ Validation failed${colors.reset}`);
    }

    console.log('');
  }
}

// Run validation
async function main() {
  const args = process.argv.slice(2);
  const options = {
    fix: args.includes('--fix'),
    checkEndpoints: args.includes('--check-endpoints'),
  };

  // Load environment variables from .env.local
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    log.info(`Loaded environment from ${envPath}\n`);
  }

  const validator = new EmailSystemValidator(options);
  const success = await validator.validate();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { EmailSystemValidator };
