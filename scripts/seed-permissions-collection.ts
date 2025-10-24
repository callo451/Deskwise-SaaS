// Seed permissions collection for all organizations
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

// Generate all permissions
function getAllPermissions(orgId: string) {
  const now = new Date()
  const permissions: any[] = []

  const createPerm = (
    module: string,
    action: string,
    description: string,
    resource?: string
  ) => ({
    orgId,
    module,
    action,
    resource,
    permissionKey: resource ? `${module}.${action}.${resource}` : `${module}.${action}`,
    description,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  })

  // Unified Tickets (includes Tickets, Incidents, Changes, Service Requests, Problems)
  permissions.push(
    // Basic ticket permissions
    createPerm('tickets', 'view', 'View tickets', 'own'),
    createPerm('tickets', 'view', 'View all tickets', 'all'),
    createPerm('tickets', 'create', 'Create tickets'),
    createPerm('tickets', 'edit', 'Edit tickets', 'own'),
    createPerm('tickets', 'edit', 'Edit all tickets', 'all'),
    createPerm('tickets', 'delete', 'Delete tickets'),
    createPerm('tickets', 'assign', 'Assign tickets to users'),
    createPerm('tickets', 'close', 'Close tickets'),
    createPerm('tickets', 'reopen', 'Reopen closed tickets'),
    createPerm('tickets', 'comment', 'Add comments to tickets'),

    // Type-specific permissions (ITIL compliance)
    createPerm('tickets', 'createIncident', 'Create incident tickets'),
    createPerm('tickets', 'manageIncident', 'Manage incident status and updates'),
    createPerm('tickets', 'publishIncident', 'Publish public incident status updates'),

    createPerm('tickets', 'createChange', 'Create change request tickets'),
    createPerm('tickets', 'approveChange', 'Approve change requests'),
    createPerm('tickets', 'implementChange', 'Implement approved changes'),

    createPerm('tickets', 'createServiceRequest', 'Create service request tickets'),
    createPerm('tickets', 'approveServiceRequest', 'Approve service requests'),

    createPerm('tickets', 'createProblem', 'Create problem tickets'),
    createPerm('tickets', 'manageProblem', 'Manage problem records and KEDB')
  )

  // Assets
  permissions.push(
    createPerm('assets', 'view', 'View assets'),
    createPerm('assets', 'create', 'Create assets'),
    createPerm('assets', 'edit', 'Edit assets'),
    createPerm('assets', 'delete', 'Delete assets'),
    createPerm('assets', 'manage', 'Manage asset lifecycle'),
    createPerm('assets', 'remoteControl', 'Use remote control on assets')
  )

  // Projects
  permissions.push(
    createPerm('projects', 'view', 'View projects', 'own'),
    createPerm('projects', 'view', 'View all projects', 'all'),
    createPerm('projects', 'create', 'Create projects'),
    createPerm('projects', 'edit', 'Edit projects', 'own'),
    createPerm('projects', 'edit', 'Edit all projects', 'all'),
    createPerm('projects', 'delete', 'Delete projects'),
    createPerm('projects', 'manage', 'Manage project tasks and milestones')
  )

  // Knowledge Base
  permissions.push(
    createPerm('kb', 'view', 'View knowledge base articles'),
    createPerm('kb', 'create', 'Create knowledge base articles'),
    createPerm('kb', 'edit', 'Edit knowledge base articles', 'own'),
    createPerm('kb', 'edit', 'Edit all knowledge base articles', 'all'),
    createPerm('kb', 'delete', 'Delete knowledge base articles'),
    createPerm('kb', 'publish', 'Publish articles as public')
  )

  // Users
  permissions.push(
    createPerm('users', 'view', 'View users'),
    createPerm('users', 'create', 'Create users'),
    createPerm('users', 'edit', 'Edit users'),
    createPerm('users', 'delete', 'Delete users'),
    createPerm('users', 'manage', 'Manage user roles and permissions')
  )

  // Roles
  permissions.push(
    createPerm('roles', 'view', 'View roles'),
    createPerm('roles', 'create', 'Create custom roles'),
    createPerm('roles', 'edit', 'Edit custom roles'),
    createPerm('roles', 'delete', 'Delete custom roles'),
    createPerm('roles', 'assign', 'Assign roles to users')
  )

  // Clients (MSP mode)
  permissions.push(
    createPerm('clients', 'view', 'View clients'),
    createPerm('clients', 'create', 'Create clients'),
    createPerm('clients', 'edit', 'Edit clients'),
    createPerm('clients', 'delete', 'Delete clients'),
    createPerm('clients', 'manage', 'Manage client contracts and quotes')
  )

  // Schedule
  permissions.push(
    createPerm('schedule', 'view', 'View schedule', 'own'),
    createPerm('schedule', 'view', 'View all schedules', 'all'),
    createPerm('schedule', 'create', 'Create schedule items'),
    createPerm('schedule', 'edit', 'Edit schedule items'),
    createPerm('schedule', 'delete', 'Delete schedule items')
  )

  // Reports
  permissions.push(
    createPerm('reports', 'view', 'View reports'),
    createPerm('reports', 'create', 'Create custom reports'),
    createPerm('reports', 'export', 'Export reports')
  )

  // Settings
  permissions.push(
    createPerm('settings', 'view', 'View organization settings'),
    createPerm('settings', 'edit', 'Edit organization settings'),
    createPerm('settings', 'manage', 'Manage advanced settings')
  )

  // Portal Composer
  permissions.push(
    createPerm('portal', 'view', 'View portal pages'),
    createPerm('portal', 'create', 'Create new portal pages'),
    createPerm('portal', 'edit', 'Edit portal pages'),
    createPerm('portal', 'publish', 'Publish portal pages'),
    createPerm('portal', 'delete', 'Delete portal pages'),
    createPerm('portal', 'theme', 'Edit portal themes', 'edit'),
    createPerm('portal', 'datasource', 'Manage data sources', 'edit')
  )

  return permissions
}

async function seedPermissions() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔌 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db('deskwise')

    // Get all organizations
    const organizations = await db.collection('organizations').find({}).toArray()

    if (organizations.length === 0) {
      console.log('⚠️  No organizations found')
      return
    }

    console.log(`📊 Found ${organizations.length} organization(s)\n`)

    for (const org of organizations) {
      const orgId = org._id.toString()
      console.log(`\n🏢 Processing: ${org.name} (${orgId})`)
      console.log('─'.repeat(70))

      try {
        // Check if permissions already exist
        const existingCount = await db.collection('permissions').countDocuments({ orgId })

        if (existingCount > 0) {
          console.log(`ℹ️  Permissions already exist (${existingCount} permissions), skipping...`)
          continue
        }

        // Create permissions
        const permissions = getAllPermissions(orgId)
        const result = await db.collection('permissions').insertMany(permissions)

        console.log(`✅ Created ${result.insertedCount} permissions`)
      } catch (error: any) {
        console.error(`❌ Error processing ${org.name}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ Permissions seeding completed for all organizations')
    console.log('='.repeat(70))
  } catch (error) {
    console.error('❌ Fatal error:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 MongoDB connection closed')
  }
}

// Run the script
seedPermissions()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
