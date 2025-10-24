/**
 * Seed Workflow Templates Script
 *
 * This script seeds ITSM workflow templates into existing organizations.
 * It can be run standalone or integrated into the signup flow.
 *
 * Usage:
 *   npx ts-node scripts/seed-workflow-templates.ts --orgId=<orgId>
 *   npx ts-node scripts/seed-workflow-templates.ts --all
 */

// Load environment variables FIRST before any imports
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables')
  console.error('Please ensure .env.local exists with MONGODB_URI set')
  process.exit(1)
}

// Now safe to import modules that depend on environment
import { MongoClient, ObjectId } from 'mongodb'
import { WorkflowTemplateService } from '../src/lib/services/workflow-templates'

const MONGODB_URI = process.env.MONGODB_URI

async function seedWorkflowTemplatesForOrg(orgId: string): Promise<void> {
  console.log(`\n📋 Seeding workflow templates for organization: ${orgId}`)

  // Get system templates
  const systemTemplates = WorkflowTemplateService.getSystemTemplates()

  console.log(`Found ${systemTemplates.length} system workflow templates`)

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')
  const workflowsCollection = db.collection('workflows')

  let seededCount = 0
  let skippedCount = 0

  for (const template of systemTemplates) {
    // Check if this template already exists for the organization
    const existingWorkflow = await workflowsCollection.findOne({
      orgId,
      name: template.name,
      isTemplate: true,
    })

    if (existingWorkflow) {
      console.log(`  ⏭️  Skipping "${template.name}" (already exists)`)
      skippedCount++
      continue
    }

    // Create workflow from template
    const workflow = {
      _id: new ObjectId(),
      orgId,
      name: template.name,
      description: template.description,
      category: template.category,
      status: 'inactive', // Templates start inactive, users can activate them
      version: 1,
      nodes: template.nodes,
      edges: template.edges,
      trigger: template.trigger,
      settings: {
        enabled: false,
        runAsync: true,
        maxRetries: 3,
        timeout: 300000, // 5 minutes
        onError: 'stop' as const,
      },
      isTemplate: true,
      isSystem: true,
      icon: template.icon || 'workflow',
      tags: template.tags || [],
      createdBy: 'system',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        seededAt: new Date(),
        source: 'system-template',
      },
    }

    await workflowsCollection.insertOne(workflow)
    console.log(`  ✅ Seeded "${template.name}"`)
    seededCount++
  }

  await client.close()

  console.log(`\n✨ Seeding complete for organization ${orgId}:`)
  console.log(`   - ${seededCount} templates seeded`)
  console.log(`   - ${skippedCount} templates skipped (already exist)`)
}

async function seedAllOrganizations(): Promise<void> {
  console.log('\n🌍 Seeding workflow templates for ALL organizations...')

  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')
  const orgsCollection = db.collection('users')

  // Get all unique organization IDs
  const orgs = await orgsCollection.distinct('orgId', { orgId: { $exists: true } })

  await client.close()

  console.log(`Found ${orgs.length} organizations\n`)

  for (const orgId of orgs) {
    if (orgId) {
      await seedWorkflowTemplatesForOrg(orgId as string)
    }
  }

  console.log('\n🎉 All organizations seeded successfully!')
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--all')) {
    await seedAllOrganizations()
  } else {
    const orgIdArg = args.find(arg => arg.startsWith('--orgId='))

    if (!orgIdArg) {
      console.error('Error: Please specify --orgId=<orgId> or --all')
      console.error('')
      console.error('Usage:')
      console.error('  npx ts-node scripts/seed-workflow-templates.ts --orgId=<orgId>')
      console.error('  npx ts-node scripts/seed-workflow-templates.ts --all')
      process.exit(1)
    }

    const orgId = orgIdArg.split('=')[1]
    await seedWorkflowTemplatesForOrg(orgId)
  }

  console.log('\n✨ Done!')
}

// Run the script
main().catch((error) => {
  console.error('❌ Error seeding workflow templates:', error)
  process.exit(1)
})
