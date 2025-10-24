// IMPORTANT: Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient, Db } from 'mongodb'
import { PermissionService } from '../src/lib/services/permissions'
import { RoleService } from '../src/lib/services/roles'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local')
  process.exit(1)
}

async function seedRBACPermissions() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔌 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db: Db = client.db('deskwise')

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
        // Seed permissions
        let permissionsCount = 0
        try {
          permissionsCount = await PermissionService.seedDefaultPermissions(orgId)
          console.log(`✅ Created ${permissionsCount} permissions`)
        } catch (error: any) {
          if (error.message.includes('already exist')) {
            console.log('ℹ️  Permissions already exist, skipping...')
          } else {
            throw error
          }
        }

        // Seed roles
        let rolesCount = 0
        try {
          rolesCount = await RoleService.seedDefaultRoles(orgId)
          console.log(`✅ Created ${rolesCount} default roles (admin, technician, user)`)
        } catch (error: any) {
          if (error.message.includes('already exist')) {
            console.log('ℹ️  Roles already exist, skipping...')
          } else {
            throw error
          }
        }

        // Migrate users to RBAC
        try {
          const migratedCount = await RoleService.migrateUsersToRBAC(orgId)
          if (migratedCount > 0) {
            console.log(`✅ Migrated ${migratedCount} users to RBAC system`)
          } else {
            console.log('ℹ️  All users already using RBAC system')
          }
        } catch (error: any) {
          console.log(`⚠️  User migration: ${error.message}`)
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
