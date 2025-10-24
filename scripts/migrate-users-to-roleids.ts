// Migrate users from legacy role field to roleId
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

async function migrateUsersToRoleIds() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔌 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db('deskwise')

    // Get all organizations
    const organizations = await db.collection('organizations').find({}).toArray()

    console.log(`📊 Found ${organizations.length} organization(s)\n`)

    let totalMigrated = 0

    for (const org of organizations) {
      const orgId = org._id.toString()
      console.log(`\n🏢 Processing organization: ${org.name}`)
      console.log('─'.repeat(60))

      // Get roles for this org
      const roles = await db.collection('roles').find({ orgId }).toArray()

      if (roles.length === 0) {
        console.log('⚠️  No roles found - run seed-rbac-standalone.ts first')
        continue
      }

      // Create role mapping (legacy role name -> roleId)
      const roleMap: any = {}
      for (const role of roles) {
        const roleName = role.name.toLowerCase()
        if (roleName.includes('admin')) {
          roleMap['admin'] = role._id
        } else if (roleName.includes('technician')) {
          roleMap['technician'] = role._id
        } else if (roleName.includes('user') || roleName.includes('end user')) {
          roleMap['user'] = role._id
        }
      }

      console.log(`✅ Found ${Object.keys(roleMap).length} default roles`)

      // Find users without roleId
      const usersToMigrate = await db.collection('users').find({
        orgId,
        roleId: { $exists: false },
        isActive: true
      }).toArray()

      console.log(`📋 Found ${usersToMigrate.length} users to migrate`)

      if (usersToMigrate.length === 0) {
        console.log('✅ All users already migrated')
        continue
      }

      let orgMigrated = 0

      for (const user of usersToMigrate) {
        const legacyRole = user.role || 'user'
        const roleId = roleMap[legacyRole]

        if (!roleId) {
          console.log(`⚠️  No role mapping for legacy role: ${legacyRole}`)
          continue
        }

        const result = await db.collection('users').updateOne(
          { _id: user._id },
          {
            $set: {
              roleId,
              updatedAt: new Date(),
            },
          }
        )

        if (result.modifiedCount > 0) {
          console.log(`  ✅ ${user.email} -> ${legacyRole} role assigned`)
          orgMigrated++
          totalMigrated++
        }
      }

      console.log(`\n✅ Migrated ${orgMigrated} users in ${org.name}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Total users migrated: ${totalMigrated}`)
    console.log('='.repeat(60))

    console.log('\n💡 Next Steps:')
    console.log('1. Users need to log out and log back in to get updated permissions')
    console.log('2. Their JWT tokens will be refreshed with granular permissions')
    console.log('3. Admin bypasses can then be safely removed from API routes')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n🔌 MongoDB connection closed')
  }
}

migrateUsersToRoleIds()
