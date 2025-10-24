// Check user permissions script
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI!

async function checkUserPermissions() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('deskwise')

    // Get a sample user (first admin user found)
    const adminUser = await db.collection('users').findOne({ role: 'admin' })

    if (!adminUser) {
      console.log('❌ No admin user found')
      return
    }

    console.log('\n👤 User:', adminUser.email)
    console.log('🏢 Organization:', adminUser.orgId)
    console.log('📛 Legacy Role:', adminUser.role)
    console.log('🆔 Role ID:', adminUser.roleId?.toString() || 'NOT SET')

    if (adminUser.roleId) {
      // Get role details
      const role = await db.collection('roles').findOne({ _id: adminUser.roleId })

      if (role) {
        console.log('\n✅ Role:', role.name)
        console.log('📋 Total Permissions:', role.permissions?.length || 0)

        // Check for project permissions
        const projectPerms = role.permissions?.filter((p: string) => p.startsWith('projects.')) || []
        console.log('\n🏗️  Project Permissions:')
        projectPerms.forEach((p: string) => console.log(`  - ${p}`))

        // Check for milestone permissions
        const milestonePerms = role.permissions?.filter((p: string) => p.includes('milestone')) || []
        if (milestonePerms.length > 0) {
          console.log('\n📍 Milestone Permissions:')
          milestonePerms.forEach((p: string) => console.log(`  - ${p}`))
        } else {
          console.log('\n⚠️  No milestone permissions found - will add these')
        }
      } else {
        console.log('\n❌ Role not found in database')
      }
    } else {
      console.log('\n⚠️  User has no roleId - needs migration')
      console.log('Run: npx tsx scripts/seed-rbac-standalone.ts')
    }

    // Check if user needs to log out and back in
    if (adminUser.roleId) {
      console.log('\n💡 Next Steps:')
      console.log('1. Log out and log back in to refresh permissions in session')
      console.log('2. Permissions will be cached in JWT token')
      console.log('3. All admin bypasses can then be safely removed')
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.close()
  }
}

checkUserPermissions()
