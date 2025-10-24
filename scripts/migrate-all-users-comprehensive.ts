// Comprehensive user migration - handles both ObjectId and string orgIds
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient, ObjectId } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

async function migrateAllUsers() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('🔌 Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected to MongoDB\n')

    const db = client.db('deskwise')

    // Get ALL users without roleId
    const usersWithoutRoleId = await db.collection('users').find({
      roleId: { $exists: false },
      isActive: true
    }).toArray()

    console.log(`📋 Found ${usersWithoutRoleId.length} users without roleId\n`)

    if (usersWithoutRoleId.length === 0) {
      console.log('✅ All users already have roleIds!')
      return
    }

    let totalMigrated = 0

    // Group users by orgId
    const usersByOrg: any = {}
    for (const user of usersWithoutRoleId) {
      const orgId = user.orgId || 'unknown'
      if (!usersByOrg[orgId]) {
        usersByOrg[orgId] = []
      }
      usersByOrg[orgId].push(user)
    }

    console.log(`🏢 Found users in ${Object.keys(usersByOrg).length} organizations\n`)

    for (const [orgId, users] of Object.entries(usersByOrg)) {
      console.log(`\n🏢 Processing orgId: ${orgId}`)
      console.log('─'.repeat(60))
      console.log(`📋 ${(users as any[]).length} users to migrate`)

      // Try to find roles for this orgId
      // Support both ObjectId and string format
      let roles = await db.collection('roles').find({ orgId }).toArray()

      if (roles.length === 0 && orgId !== 'unknown') {
        // Try as ObjectId if it looks like one
        try {
          const objId = new ObjectId(orgId)
          const rolesWithObjId = await db.collection('roles').find({ orgId: objId }).toArray()
          if (rolesWithObjId.length > 0) {
            roles = rolesWithObjId
            console.log(`✅ Found roles using ObjectId format`)
          }
        } catch (e) {
          // Not an ObjectId, that's fine
        }
      }

      if (roles.length === 0) {
        console.log(`⚠️  No roles found for this organization`)
        console.log(`💡 Creating default roles...`)

        // Create default admin role for this org
        const adminRole = {
          _id: new ObjectId(),
          orgId,
          name: 'Administrator',
          description: 'Full system access',
          isSystemRole: true,
          isActive: true,
          permissions: [
            '*.*', // Wildcard - all permissions
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.collection('roles').insertOne(adminRole)
        roles = [adminRole]
        console.log(`✅ Created Administrator role`)
      }

      // Create role mapping
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

      // If no admin role found, use first role
      if (!roleMap['admin'] && roles.length > 0) {
        roleMap['admin'] = roles[0]._id
        roleMap['technician'] = roles[0]._id
        roleMap['user'] = roles[0]._id
      }

      console.log(`✅ Role mapping: ${Object.keys(roleMap).length} roles`)

      // Migrate users
      let orgMigrated = 0
      for (const user of users as any[]) {
        const legacyRole = user.role || 'admin' // Default to admin if not set
        const roleId = roleMap[legacyRole]

        if (!roleId) {
          console.log(`⚠️  No role mapping for ${user.email} (role: ${legacyRole})`)
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
          console.log(`  ✅ ${user.email} -> ${legacyRole} role`)
          orgMigrated++
          totalMigrated++
        }
      }

      console.log(`✅ Migrated ${orgMigrated} users in this organization`)
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Total users migrated: ${totalMigrated}`)
    console.log('='.repeat(60))

    if (totalMigrated > 0) {
      console.log('\n💡 IMPORTANT - Next Steps:')
      console.log('1. All affected users MUST log out and log back in')
      console.log('2. This will refresh their JWT tokens with new permissions')
      console.log('3. Once logged back in, admin bypasses can be removed')
      console.log('4. Test permission checks work correctly')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.close()
    console.log('\n🔌 MongoDB connection closed')
  }
}

migrateAllUsers()
