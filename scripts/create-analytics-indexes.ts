/**
 * Create Analytics Database Indexes
 * This script creates optimized indexes for analytics queries
 *
 * Run with: npx ts-node scripts/create-analytics-indexes.ts
 */

import { MongoClient } from 'mongodb'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI not found in environment variables')
  process.exit(1)
}

async function createAnalyticsIndexes() {
  const client = new MongoClient(MONGODB_URI!)

  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    console.log('Connected successfully\n')

    const db = client.db('deskwise')

    // ============================================
    // Tickets Collection Indexes
    // ============================================
    console.log('Creating indexes for tickets collection...')
    const ticketsCollection = db.collection('tickets')

    await ticketsCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt')

    await ticketsCollection.createIndex({ orgId: 1, status: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + status + createdAt')

    await ticketsCollection.createIndex({ orgId: 1, priority: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + priority + createdAt')

    await ticketsCollection.createIndex({ orgId: 1, category: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + category + createdAt')

    await ticketsCollection.createIndex({ orgId: 1, assignedTo: 1, status: 1 })
    console.log('  ✓ Created: orgId + assignedTo + status')

    await ticketsCollection.createIndex({ orgId: 1, resolvedAt: -1 })
    console.log('  ✓ Created: orgId + resolvedAt')

    await ticketsCollection.createIndex({ orgId: 1, 'sla.resolutionDeadline': 1 })
    console.log('  ✓ Created: orgId + SLA resolution deadline')

    await ticketsCollection.createIndex({ orgId: 1, 'sla.breached': 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + SLA breached + createdAt\n')

    // ============================================
    // Incidents Collection Indexes
    // ============================================
    console.log('Creating indexes for incidents collection...')
    const incidentsCollection = db.collection('incidents')

    await incidentsCollection.createIndex({ orgId: 1, startedAt: -1 })
    console.log('  ✓ Created: orgId + startedAt')

    await incidentsCollection.createIndex({ orgId: 1, status: 1, startedAt: -1 })
    console.log('  ✓ Created: orgId + status + startedAt')

    await incidentsCollection.createIndex({ orgId: 1, severity: 1, startedAt: -1 })
    console.log('  ✓ Created: orgId + severity + startedAt')

    await incidentsCollection.createIndex({ orgId: 1, priority: 1, startedAt: -1 })
    console.log('  ✓ Created: orgId + priority + startedAt')

    await incidentsCollection.createIndex({ orgId: 1, resolvedAt: -1 })
    console.log('  ✓ Created: orgId + resolvedAt')

    await incidentsCollection.createIndex({ orgId: 1, affectedServices: 1 })
    console.log('  ✓ Created: orgId + affectedServices\n')

    // ============================================
    // Assets Collection Indexes
    // ============================================
    console.log('Creating indexes for assets collection...')
    const assetsCollection = db.collection('assets')

    await assetsCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt')

    await assetsCollection.createIndex({ orgId: 1, status: 1 })
    console.log('  ✓ Created: orgId + status')

    await assetsCollection.createIndex({ orgId: 1, category: 1 })
    console.log('  ✓ Created: orgId + category')

    await assetsCollection.createIndex({ orgId: 1, assignedTo: 1 })
    console.log('  ✓ Created: orgId + assignedTo')

    await assetsCollection.createIndex({ orgId: 1, warrantyExpiry: 1 })
    console.log('  ✓ Created: orgId + warrantyExpiry')

    await assetsCollection.createIndex({ orgId: 1, purchaseDate: 1 })
    console.log('  ✓ Created: orgId + purchaseDate\n')

    // ============================================
    // Projects Collection Indexes
    // ============================================
    console.log('Creating indexes for projects collection...')
    const projectsCollection = db.collection('projects')

    await projectsCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt')

    await projectsCollection.createIndex({ orgId: 1, status: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + status + createdAt')

    await projectsCollection.createIndex({ orgId: 1, projectManager: 1 })
    console.log('  ✓ Created: orgId + projectManager')

    await projectsCollection.createIndex({ orgId: 1, actualEndDate: -1 })
    console.log('  ✓ Created: orgId + actualEndDate')

    await projectsCollection.createIndex({ orgId: 1, endDate: 1 })
    console.log('  ✓ Created: orgId + endDate\n')

    // ============================================
    // Project Milestones Collection Indexes
    // ============================================
    console.log('Creating indexes for project_milestones collection...')
    const milestonesCollection = db.collection('project_milestones')

    await milestonesCollection.createIndex({ orgId: 1, dueDate: 1 })
    console.log('  ✓ Created: orgId + dueDate')

    await milestonesCollection.createIndex({ orgId: 1, completedAt: -1 })
    console.log('  ✓ Created: orgId + completedAt\n')

    // ============================================
    // Asset Maintenance Collection Indexes
    // ============================================
    console.log('Creating indexes for asset_maintenance collection...')
    const maintenanceCollection = db.collection('asset_maintenance')

    await maintenanceCollection.createIndex({ orgId: 1, completedAt: -1 })
    console.log('  ✓ Created: orgId + completedAt')

    await maintenanceCollection.createIndex({ orgId: 1, assetId: 1 })
    console.log('  ✓ Created: orgId + assetId\n')

    // ============================================
    // Change Requests Collection Indexes
    // ============================================
    console.log('Creating indexes for change_requests collection...')
    const changesCollection = db.collection('change_requests')

    await changesCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt')

    await changesCollection.createIndex({ orgId: 1, status: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + status + createdAt\n')

    // ============================================
    // Service Requests Collection Indexes
    // ============================================
    console.log('Creating indexes for service_requests collection...')
    const serviceRequestsCollection = db.collection('service_requests')

    await serviceRequestsCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt')

    await serviceRequestsCollection.createIndex({ orgId: 1, status: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + status + createdAt\n')

    // ============================================
    // Report Schedules Collection Indexes
    // ============================================
    console.log('Creating indexes for report_schedules collection...')
    const schedulesCollection = db.collection('report_schedules')

    await schedulesCollection.createIndex({ orgId: 1, enabled: 1, nextRun: 1 })
    console.log('  ✓ Created: orgId + enabled + nextRun')

    await schedulesCollection.createIndex({ orgId: 1, createdAt: -1 })
    console.log('  ✓ Created: orgId + createdAt\n')

    // ============================================
    // Report Executions Collection Indexes
    // ============================================
    console.log('Creating indexes for report_executions collection...')
    const executionsCollection = db.collection('report_executions')

    await executionsCollection.createIndex({ scheduleId: 1, executedAt: -1 })
    console.log('  ✓ Created: scheduleId + executedAt')

    await executionsCollection.createIndex({ orgId: 1, executedAt: -1 })
    console.log('  ✓ Created: orgId + executedAt\n')

    console.log('✅ All analytics indexes created successfully!')

  } catch (error) {
    console.error('Error creating indexes:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('\nDatabase connection closed')
  }
}

// Run the script
createAnalyticsIndexes()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
