/**
 * Database Index Creation Script for Accounting Integrations
 *
 * This script creates all required indexes for Xero, QuickBooks, and MYOB integrations.
 * Run this script once before using the accounting integrations.
 *
 * Usage: node scripts/create-integration-indexes.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://deancallaghan8:Harpervalley1!@deskwise.1jbpoqb.mongodb.net/?retryWrites=true&w=majority&appName=Deskwise';

async function createIndexes() {
  let client;

  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();

    const db = client.db('deskwise');
    console.log('✅ Connected to database: deskwise\n');

    // ============================================
    // XERO INTEGRATION INDEXES
    // ============================================
    console.log('📊 Creating Xero integration indexes...');

    const xeroIntegrations = db.collection('xero_integrations');
    await xeroIntegrations.createIndex({ orgId: 1 }, { unique: true });
    console.log('  ✓ xero_integrations: orgId (unique)');

    await xeroIntegrations.createIndex({ tenantId: 1 });
    console.log('  ✓ xero_integrations: tenantId');

    await xeroIntegrations.createIndex({ status: 1 });
    console.log('  ✓ xero_integrations: status');

    const xeroSyncLogs = db.collection('xero_sync_logs');
    await xeroSyncLogs.createIndex({ orgId: 1, createdAt: -1 });
    console.log('  ✓ xero_sync_logs: orgId + createdAt');

    await xeroSyncLogs.createIndex({ integrationId: 1, createdAt: -1 });
    console.log('  ✓ xero_sync_logs: integrationId + createdAt');

    await xeroSyncLogs.createIndex({ entityType: 1 });
    console.log('  ✓ xero_sync_logs: entityType');

    const xeroEntityRefs = db.collection('xero_entity_references');
    await xeroEntityRefs.createIndex(
      { orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 },
      { unique: true }
    );
    console.log('  ✓ xero_entity_references: orgId + deskwiseEntityId + deskwiseEntityType (unique)');

    await xeroEntityRefs.createIndex({ orgId: 1, xeroEntityId: 1 });
    console.log('  ✓ xero_entity_references: orgId + xeroEntityId');

    await xeroEntityRefs.createIndex({ integrationId: 1 });
    console.log('  ✓ xero_entity_references: integrationId');

    // ============================================
    // QUICKBOOKS INTEGRATION INDEXES
    // ============================================
    console.log('\n📊 Creating QuickBooks integration indexes...');

    const qboIntegrations = db.collection('quickbooks_integrations');
    await qboIntegrations.createIndex({ orgId: 1 }, { unique: true });
    console.log('  ✓ quickbooks_integrations: orgId (unique)');

    await qboIntegrations.createIndex({ realmId: 1 });
    console.log('  ✓ quickbooks_integrations: realmId');

    await qboIntegrations.createIndex({ status: 1 });
    console.log('  ✓ quickbooks_integrations: status');

    const qboSyncLogs = db.collection('quickbooks_sync_logs');
    await qboSyncLogs.createIndex({ orgId: 1, createdAt: -1 });
    console.log('  ✓ quickbooks_sync_logs: orgId + createdAt');

    await qboSyncLogs.createIndex({ integrationId: 1, createdAt: -1 });
    console.log('  ✓ quickbooks_sync_logs: integrationId + createdAt');

    await qboSyncLogs.createIndex({ entityType: 1 });
    console.log('  ✓ quickbooks_sync_logs: entityType');

    const qboEntityRefs = db.collection('quickbooks_entity_references');
    await qboEntityRefs.createIndex(
      { orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 },
      { unique: true }
    );
    console.log('  ✓ quickbooks_entity_references: orgId + deskwiseEntityId + deskwiseEntityType (unique)');

    await qboEntityRefs.createIndex({ orgId: 1, qboEntityId: 1 });
    console.log('  ✓ quickbooks_entity_references: orgId + qboEntityId');

    // ============================================
    // MYOB INTEGRATION INDEXES
    // ============================================
    console.log('\n📊 Creating MYOB integration indexes...');

    const myobIntegrations = db.collection('myob_integrations');
    await myobIntegrations.createIndex({ orgId: 1 }, { unique: true });
    console.log('  ✓ myob_integrations: orgId (unique)');

    await myobIntegrations.createIndex({ companyFileId: 1 });
    console.log('  ✓ myob_integrations: companyFileId');

    await myobIntegrations.createIndex({ status: 1 });
    console.log('  ✓ myob_integrations: status');

    const myobMappings = db.collection('myob_mappings');
    await myobMappings.createIndex(
      { orgId: 1, deskwiseEntityId: 1, deskwiseEntityType: 1 },
      { unique: true }
    );
    console.log('  ✓ myob_mappings: orgId + deskwiseEntityId + deskwiseEntityType (unique)');

    await myobMappings.createIndex({ orgId: 1, myobEntityId: 1 });
    console.log('  ✓ myob_mappings: orgId + myobEntityId');

    const myobSyncLogs = db.collection('myob_sync_logs');
    await myobSyncLogs.createIndex({ orgId: 1, createdAt: -1 });
    console.log('  ✓ myob_sync_logs: orgId + createdAt');

    await myobSyncLogs.createIndex({ integrationId: 1, createdAt: -1 });
    console.log('  ✓ myob_sync_logs: integrationId + createdAt');

    console.log('\n✅ All indexes created successfully!');
    console.log('\n📋 Summary:');
    console.log('  - Xero: 9 indexes');
    console.log('  - QuickBooks: 8 indexes');
    console.log('  - MYOB: 7 indexes');
    console.log('  - Total: 24 indexes\n');

  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
createIndexes().catch(console.error);
