// Migrate existing organizations to new ITSM role structure
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

// Get ITSM role permissions (same as in PermissionService)
function getITSMRolePermissions(roleName: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    'system_administrator': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.delete', 'tickets.assign', 'tickets.close', 'tickets.reopen', 'tickets.comment',
      'tickets.createIncident', 'tickets.manageIncident', 'tickets.publishIncident',
      'tickets.createChange', 'tickets.approveChange', 'tickets.implementChange',
      'tickets.createServiceRequest', 'tickets.approveServiceRequest',
      'tickets.createProblem', 'tickets.manageProblem',
      'assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'assets.manage', 'assets.remoteControl',
      'projects.view.all', 'projects.create', 'projects.edit.all', 'projects.delete', 'projects.manage',
      'kb.view', 'kb.create', 'kb.edit.all', 'kb.delete', 'kb.publish',
      'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage',
      'roles.view', 'roles.create', 'roles.edit', 'roles.delete', 'roles.assign',
      'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.manage',
      'schedule.view.all', 'schedule.create', 'schedule.edit', 'schedule.delete',
      'reports.view', 'reports.create', 'reports.export',
      'settings.view', 'settings.edit', 'settings.manage',
      'portal.view', 'portal.create', 'portal.edit', 'portal.publish', 'portal.delete', 'portal.theme.edit', 'portal.datasource.edit',
    ],
    'service_desk_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.delete', 'tickets.assign', 'tickets.close', 'tickets.reopen', 'tickets.comment',
      'tickets.createIncident', 'tickets.manageIncident', 'tickets.publishIncident',
      'tickets.createChange', 'tickets.approveChange', 'tickets.createServiceRequest', 'tickets.approveServiceRequest',
      'tickets.createProblem', 'tickets.manageProblem',
      'assets.view', 'assets.create', 'assets.edit',
      'projects.view.all', 'projects.create', 'projects.edit.all',
      'kb.view', 'kb.create', 'kb.edit.all', 'kb.publish',
      'users.view', 'users.create', 'users.edit', 'roles.view',
      'clients.view', 'clients.create', 'clients.edit',
      'schedule.view.all', 'schedule.create', 'schedule.edit', 'schedule.delete',
      'reports.view', 'reports.create', 'reports.export',
      'settings.view', 'portal.view', 'portal.edit',
    ],
    'service_desk_agent': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.assign', 'tickets.close', 'tickets.reopen', 'tickets.comment',
      'tickets.createIncident', 'tickets.manageIncident', 'tickets.createChange', 'tickets.implementChange',
      'tickets.createServiceRequest', 'tickets.createProblem',
      'assets.view', 'assets.create', 'assets.edit', 'assets.remoteControl',
      'projects.view.all', 'projects.create', 'projects.edit.own',
      'kb.view', 'kb.create', 'kb.edit.own',
      'users.view', 'clients.view',
      'schedule.view.all', 'schedule.create', 'schedule.edit',
      'reports.view', 'settings.view',
    ],
    'technical_lead': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.assign', 'tickets.close', 'tickets.reopen', 'tickets.comment',
      'tickets.createIncident', 'tickets.manageIncident', 'tickets.publishIncident',
      'tickets.createChange', 'tickets.implementChange', 'tickets.createServiceRequest',
      'tickets.createProblem', 'tickets.manageProblem',
      'assets.view', 'assets.create', 'assets.edit', 'assets.manage', 'assets.remoteControl',
      'projects.view.all', 'projects.create', 'projects.edit.all', 'projects.manage',
      'kb.view', 'kb.create', 'kb.edit.all', 'kb.publish',
      'users.view', 'clients.view',
      'schedule.view.all', 'schedule.create', 'schedule.edit',
      'reports.view', 'reports.create', 'settings.view',
    ],
    'problem_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.comment',
      'tickets.createIncident', 'tickets.createProblem', 'tickets.manageProblem',
      'assets.view', 'kb.view', 'kb.create', 'kb.edit.all', 'kb.publish',
      'users.view', 'clients.view',
      'schedule.view.all', 'reports.view', 'reports.create', 'reports.export',
      'settings.view',
    ],
    'change_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.edit.all', 'tickets.comment',
      'tickets.createChange', 'tickets.approveChange', 'tickets.implementChange', 'tickets.createIncident',
      'assets.view', 'projects.view.all', 'projects.create', 'projects.edit.all',
      'kb.view', 'kb.create', 'kb.edit.own',
      'users.view', 'clients.view',
      'schedule.view.all', 'schedule.create', 'schedule.edit',
      'reports.view', 'reports.create', 'settings.view',
    ],
    'asset_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.comment', 'tickets.createServiceRequest',
      'assets.view', 'assets.create', 'assets.edit', 'assets.delete', 'assets.manage', 'assets.remoteControl',
      'projects.view.all', 'kb.view', 'users.view', 'clients.view',
      'schedule.view.all', 'reports.view', 'reports.create', 'settings.view',
    ],
    'project_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.comment', 'tickets.createServiceRequest',
      'assets.view', 'projects.view.all', 'projects.create', 'projects.edit.all', 'projects.delete', 'projects.manage',
      'kb.view', 'users.view', 'clients.view', 'clients.create', 'clients.edit',
      'schedule.view.all', 'schedule.create', 'schedule.edit', 'schedule.delete',
      'reports.view', 'reports.create', 'settings.view',
    ],
    'knowledge_manager': [
      'tickets.view.all', 'tickets.create', 'tickets.comment',
      'kb.view', 'kb.create', 'kb.edit.all', 'kb.delete', 'kb.publish',
      'assets.view', 'users.view', 'clients.view',
      'schedule.view.own', 'reports.view', 'settings.view',
      'portal.view', 'portal.edit',
    ],
    'end_user': [
      'tickets.view.own', 'tickets.create', 'tickets.edit.own', 'tickets.comment', 'tickets.createServiceRequest',
      'assets.view', 'projects.view.own', 'kb.view', 'schedule.view.own',
    ],
    'read_only': [
      'tickets.view.all', 'assets.view', 'projects.view.all', 'kb.view',
      'users.view', 'clients.view', 'schedule.view.all', 'reports.view', 'settings.view',
    ],
  }

  return rolePermissions[roleName] || []
}

async function migrateOrganizations() {
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

    console.log(`📊 Found ${organizations.length} organization(s) to migrate\n`)

    for (const org of organizations) {
      const orgId = org._id.toString()
      console.log(`\n🏢 Processing: ${org.name} (${orgId})`)
      console.log('─'.repeat(70))

      try {
        // Step 1: Delete old legacy roles
        const oldRoleNames = ['admin', 'technician', 'user']
        const deleteResult = await db.collection('roles').deleteMany({
          orgId,
          name: { $in: oldRoleNames }
        })
        if (deleteResult.deletedCount > 0) {
          console.log(`🗑️  Deleted ${deleteResult.deletedCount} legacy roles`)
        }

        // Step 2: Create new ITSM roles
        const now = new Date()
        const itsmRoles = [
          { name: 'system_administrator', displayName: 'System Administrator', description: 'Full administrative access to all platform features, settings, and user management', color: '#dc2626', icon: 'ShieldCheck' },
          { name: 'service_desk_manager', displayName: 'Service Desk Manager', description: 'Manages service desk operations, teams, queues, SLAs, and workflow approvals', color: '#7c3aed', icon: 'Users' },
          { name: 'service_desk_agent', displayName: 'Service Desk Agent', description: 'Front-line support agent handling tickets, incidents, and service requests', color: '#2563eb', icon: 'Headphones' },
          { name: 'technical_lead', displayName: 'Technical Lead', description: 'Advanced technical support for escalations, complex issues, and knowledge creation', color: '#0891b2', icon: 'Cpu' },
          { name: 'problem_manager', displayName: 'Problem Manager', description: 'Problem management specialist focused on root cause analysis and KEDB maintenance', color: '#ea580c', icon: 'SearchCheck' },
          { name: 'change_manager', displayName: 'Change Manager', description: 'Change management specialist for CAB coordination, approvals, and change control', color: '#c026d3', icon: 'GitBranch' },
          { name: 'asset_manager', displayName: 'Asset Manager', description: 'IT asset management specialist responsible for inventory and asset lifecycle', color: '#65a30d', icon: 'Package' },
          { name: 'project_manager', displayName: 'Project Manager', description: 'Project management specialist for planning, execution, and resource allocation', color: '#0d9488', icon: 'Briefcase' },
          { name: 'knowledge_manager', displayName: 'Knowledge Manager', description: 'Knowledge base specialist for content curation, approval, and portal management', color: '#0369a1', icon: 'BookOpen' },
          { name: 'end_user', displayName: 'End User', description: 'Standard user with basic access to create tickets and view own items', color: '#16a34a', icon: 'User' },
          { name: 'read_only', displayName: 'Read Only', description: 'View-only access for auditors, observers, and reporting purposes', color: '#64748b', icon: 'Eye' },
        ]

        const rolesToInsert = itsmRoles.map(role => ({
          orgId,
          name: role.name,
          displayName: role.displayName,
          description: role.description,
          permissions: getITSMRolePermissions(role.name),
          isSystem: true,
          isActive: true,
          color: role.color,
          icon: role.icon,
          createdBy: 'system',
          createdAt: now,
          updatedAt: now,
        }))

        const insertResult = await db.collection('roles').insertMany(rolesToInsert)
        console.log(`✅ Created ${insertResult.insertedCount} ITSM roles`)

        // Step 3: Get role IDs for migration
        const insertedRoles = await db.collection('roles').find({ orgId }).toArray()
        const roleMap: any = {}

        for (const role of insertedRoles) {
          roleMap[role.name] = role._id.toString()
        }

        // Step 4: Migrate users to new roles
        const legacyToITSM: Record<string, string> = {
          admin: roleMap['system_administrator'],
          technician: roleMap['service_desk_agent'],
          user: roleMap['end_user'],
        }

        const usersToMigrate = await db.collection('users').find({ orgId }).toArray()

        let migratedCount = 0
        for (const user of usersToMigrate) {
          const newRoleId = legacyToITSM[user.role]
          if (newRoleId) {
            await db.collection('users').updateOne(
              { _id: user._id },
              {
                $set: {
                  roleId: newRoleId,
                  updatedAt: new Date(),
                },
              }
            )
            migratedCount++
          }
        }

        console.log(`✅ Migrated ${migratedCount} users to ITSM roles`)
        console.log(`   • Admins → System Administrator`)
        console.log(`   • Technicians → Service Desk Agent`)
        console.log(`   • Users → End User`)

      } catch (error: any) {
        console.error(`❌ Error processing ${org.name}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(70))
    console.log('✅ ITSM role migration completed for all organizations')
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
migrateOrganizations()
  .then(() => {
    console.log('\n✅ Migration script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error)
    process.exit(1)
  })
