/**
 * Create Database Indexes for Inbound Email Integration
 *
 * Run this script once to create necessary indexes:
 * node scripts/create-inbound-email-indexes.js
 */

const { MongoClient } = require('mongodb')

async function createIndexes() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI environment variable not set')
    process.exit(1)
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')

    const db = client.db('deskwise')

    // ============================================
    // Inbound Email Accounts Collection
    // ============================================
    console.log('\n📧 Creating indexes for inbound_email_accounts...')

    const accountsCollection = db.collection('inbound_email_accounts')

    // Unique email per organization
    await accountsCollection.createIndex(
      { orgId: 1, email: 1 },
      { unique: true, name: 'orgId_email_unique' }
    )
    console.log('  ✓ Created unique index: orgId + email')

    // Active accounts for polling queries
    await accountsCollection.createIndex(
      { orgId: 1, isActive: 1 },
      { name: 'orgId_isActive' }
    )
    console.log('  ✓ Created index: orgId + isActive')

    // Last polled timestamp (for scheduling)
    await accountsCollection.createIndex(
      { lastPolledAt: 1 },
      { name: 'lastPolledAt' }
    )
    console.log('  ✓ Created index: lastPolledAt')

    // ============================================
    // Processed Emails Collection
    // ============================================
    console.log('\n📨 Creating indexes for processed_emails...')

    const processedCollection = db.collection('processed_emails')

    // Unique message ID per organization (prevent duplicate processing)
    await processedCollection.createIndex(
      { orgId: 1, messageId: 1 },
      { unique: true, name: 'orgId_messageId_unique' }
    )
    console.log('  ✓ Created unique index: orgId + messageId')

    // Query by account
    await processedCollection.createIndex(
      { orgId: 1, accountId: 1 },
      { name: 'orgId_accountId' }
    )
    console.log('  ✓ Created index: orgId + accountId')

    // Query by action type
    await processedCollection.createIndex(
      { orgId: 1, action: 1 },
      { name: 'orgId_action' }
    )
    console.log('  ✓ Created index: orgId + action')

    // Query by processed date (for filtering/sorting)
    await processedCollection.createIndex(
      { orgId: 1, processedAt: -1 },
      { name: 'orgId_processedAt' }
    )
    console.log('  ✓ Created index: orgId + processedAt (desc)')

    // Find by ticket ID (reverse lookup)
    await processedCollection.createIndex(
      { orgId: 1, ticketId: 1 },
      { name: 'orgId_ticketId', sparse: true }
    )
    console.log('  ✓ Created sparse index: orgId + ticketId')

    // Reply threading (find original email by In-Reply-To)
    await processedCollection.createIndex(
      { orgId: 1, inReplyTo: 1 },
      { name: 'orgId_inReplyTo', sparse: true }
    )
    console.log('  ✓ Created sparse index: orgId + inReplyTo')

    // Full-text search on subject and body
    await processedCollection.createIndex(
      { subject: 'text', bodyText: 'text' },
      { name: 'text_search' }
    )
    console.log('  ✓ Created text index: subject + bodyText')

    // ============================================
    // Summary
    // ============================================
    console.log('\n✅ All indexes created successfully!')
    console.log('\n📊 Index Summary:')

    const accountIndexes = await accountsCollection.indexes()
    console.log(`\n  inbound_email_accounts: ${accountIndexes.length} indexes`)
    accountIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`)
    })

    const processedIndexes = await processedCollection.indexes()
    console.log(`\n  processed_emails: ${processedIndexes.length} indexes`)
    processedIndexes.forEach(idx => {
      console.log(`    - ${idx.name}`)
    })

  } catch (error) {
    console.error('❌ Error creating indexes:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run the script
createIndexes()
