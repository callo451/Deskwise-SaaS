// Standalone RBAC seeding script - doesn't depend on app code
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

// Get legacy role permissions (copied from PermissionService)
function getLegacyRolePermissions(role: string): string[] {
  const legacyRoleMap: Record<string, string[]> = {
    admin: [
      'tickets.view.all',
      'tickets.create',
      'tickets.edit.all',
      'tickets.delete',
      'tickets.assign',
      'tickets.close',
      'tickets.reopen',
      'tickets.comment',
      'tickets.createIncident',
      'tickets.manageIncident',
      'tickets.publishIncident',
      'tickets.createChange',
      'tickets.approveChange',
      'tickets.implementChange',
      'tickets.createServiceRequest',
      'tickets.approveServiceRequest',
      'tickets.createProblem',
      'tickets.manageProblem',
      'assets.view',
      'assets.create',
      'assets.edit',
      'assets.delete',
      'assets.manage',
      'assets.remoteControl',
      'projects.view.all',
      'projects.create',
      'projects.edit.all',
      'projects.delete',
      'projects.manage',
      'kb.view',
      'kb.create',
      'kb.edit.all',
      'kb.delete',
      'kb.publish',
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.manage',
      'roles.view',
      'roles.create',
      'roles.edit',
      'roles.delete',
      'roles.assign',
      'clients.view',
      'clients.create',
      'clients.edit',
      'clients.delete',
      'clients.manage',
      'schedule.view.all',
      'schedule.create',
      'schedule.edit',
      'schedule.delete',
      'reports.view',
      'reports.create',
      'reports.export',
      'settings.view',
      'settings.edit',
      'settings.manage',
      'portal.view',
      'portal.create',
      'portal.edit',
      'portal.publish',
      'portal.delete',
      'portal.theme.edit',
      'portal.datasource.edit',
    ],
    technician: [
      'tickets.view.all',
      'tickets.create',
      'tickets.edit.all',
      'tickets.assign',
      'tickets.close',
      'tickets.reopen',
      'tickets.comment',
      'tickets.createIncident',
      'tickets.manageIncident',
      'tickets.createChange',
      'tickets.implementChange',
      'tickets.createServiceRequest',
      'tickets.createProblem',
      'tickets.manageProblem',
      'assets.view',
      'assets.create',
      'assets.edit',
      'assets.manage',
      'assets.remoteControl',
      'projects.view.all',
      'projects.create',
      'projects.edit.own',
      'projects.manage',
      'kb.view',
      'kb.create',
      'kb.edit.own',
      'users.view',
      'clients.view',
      'schedule.view.all',
      'schedule.create',
      'schedule.edit',
      'reports.view',
      'settings.view',
    ],
    user: [
      'tickets.view.own',
      'tickets.create',
      'tickets.edit.own',
      'tickets.comment',
      'tickets.createServiceRequest',
      'assets.view',
      'projects.view.own',
      'kb.view',
      'schedule.view.own',
    ],
  }

  return legacyRoleMap[role] || []
}

async function seedRBACPermissions() {
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
      console.log(`\n🏢 Processing organization: ${org.name} (${orgId})`)
      console.log('─'.repeat(60))

      try {
        // Check if roles already exist
        const existingRoles = await db.collection('roles').countDocuments({ orgId })

        if (existingRoles > 0) {
          console.log(`ℹ️  Roles already exist (${existingRoles} roles), skipping seeding...`)

          // Still try to migrate users
          const roleMap: any = {}
          const roles = await db.collection('roles').find({ orgId }).toArray()

          for (const role of roles) {
            if (role.name === 'admin' || role.name === 'technician' || role.name === 'user') {
              roleMap[role.name] = role._id.toString()
            }
          }

          if (Object.keys(roleMap).length === 3) {
            const usersToMigrate = await db.collection('users').find({
              orgId,
              roleId: { $exists: false }
            }).toArray()

            let migratedCount = 0
            for (const user of usersToMigrate) {
              const roleId = roleMap[user.role]
              if (roleId) {
                await db.collection('users').updateOne(
                  { _id: user._id },
                  {
                    $set: {
                      roleId,
                      updatedAt: new Date(),
                    },
                  }
                )
                migratedCount++
              }
            }

            if (migratedCount > 0) {
              console.log(`✅ Migrated ${migratedCount} users to RBAC system`)
            } else {
              console.log('ℹ️  All users already using RBAC system')
            }
          }

          continue
        }

        // Create default roles
        const now = new Date()
        const rolesToInsert = [
          {
            orgId,
            name: 'admin',
            displayName: 'Administrator',
            description: 'Full access to all features and settings',
            permissions: getLegacyRolePermissions('admin'),
            isSystem: true,
            isActive: true,
            color: '#ef4444',
            icon: 'ShieldCheck',
            createdBy: 'system',
            createdAt: now,
            updatedAt: now,
          },
          {
            orgId,
            name: 'technician',
            displayName: 'Technician',
            description: 'Access to tickets, assets, and projects',
            permissions: getLegacyRolePermissions('technician'),
            isSystem: true,
            isActive: true,
            color: '#3b82f6',
            icon: 'Wrench',
            createdBy: 'system',
            createdAt: now,
            updatedAt: now,
          },
          {
            orgId,
            name: 'user',
            displayName: 'End User',
            description: 'Basic access to view and create tickets',
            permissions: getLegacyRolePermissions('user'),
            isSystem: true,
            isActive: true,
            color: '#22c55e',
            icon: 'User',
            createdBy: 'system',
            createdAt: now,
            updatedAt: now,
          },
        ]

        const result = await db.collection('roles').insertMany(rolesToInsert)
        console.log(`✅ Created ${result.insertedCount} default roles`)

        // Get role IDs for migration
        const insertedRoles = await db.collection('roles').find({ orgId }).toArray()
        const roleMap: any = {}

        for (const role of insertedRoles) {
          roleMap[role.name] = role._id.toString()
        }

        // Migrate users to RBAC
        const usersToMigrate = await db.collection('users').find({
          orgId,
          roleId: { $exists: false }
        }).toArray()

        let migratedCount = 0
        for (const user of usersToMigrate) {
          const roleId = roleMap[user.role]
          if (roleId) {
            await db.collection('users').updateOne(
              { _id: user._id },
              {
                $set: {
                  roleId,
                  updatedAt: new Date(),
                },
              }
            )
            migratedCount++
          }
        }

        if (migratedCount > 0) {
          console.log(`✅ Migrated ${migratedCount} users to RBAC system`)
        } else {
          console.log('ℹ️  No users to migrate')
        }

        console.log(`\n✅ RBAC seeding completed for ${org.name}`)
      } catch (error: any) {
        console.error(`❌ Error seeding RBAC for ${org.name}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ RBAC seeding completed for all organizations')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Fatal error:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n🔌 MongoDB connection closed')
  }
}

// Run the script
seedRBACPermissions()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
