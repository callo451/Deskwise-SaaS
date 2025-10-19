/**
 * Unified Ticketing System Migration Script
 *
 * Migrates existing tickets, incidents, service_requests, change_requests, and problems
 * into a single unified_tickets collection with type-based metadata.
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-unified-tickets.ts --dry-run  # Preview migration
 *   npx ts-node scripts/migrate-to-unified-tickets.ts            # Execute migration
 *   npx ts-node scripts/migrate-to-unified-tickets.ts --rollback # Rollback to legacy collections
 */

import { MongoClient, ObjectId } from 'mongodb'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables')
  process.exit(1)
}

interface MigrationStats {
  tickets: number
  incidents: number
  serviceRequests: number
  changes: number
  problems: number
  total: number
  errors: number
  errorMessages: string[]
}

interface MigrationOptions {
  dryRun: boolean
  rollback: boolean
}

async function migrateToUnifiedTickets(options: MigrationOptions) {
  const client = await MongoClient.connect(MONGODB_URI)
  const db = client.db('deskwise')

  const stats: MigrationStats = {
    tickets: 0,
    incidents: 0,
    serviceRequests: 0,
    changes: 0,
    problems: 0,
    total: 0,
    errors: 0,
    errorMessages: [],
  }

  try {
    console.log('\n🚀 Unified Ticketing System Migration')
    console.log('=====================================\n')

    if (options.rollback) {
      await performRollback(db)
      return
    }

    if (options.dryRun) {
      console.log('🔍 DRY RUN MODE - No changes will be made\n')
    }

    // Step 1: Count existing records
    console.log('📊 Analyzing existing data...\n')
    const counts = {
      tickets: await db.collection('tickets').countDocuments({}),
      incidents: await db.collection('incidents').countDocuments({}),
      serviceRequests: await db.collection('service_requests').countDocuments({}),
      changes: await db.collection('change_requests').countDocuments({}),
      problems: await db.collection('problems').countDocuments({}),
    }

    console.log('Existing records:')
    console.log(`  ├─ Tickets: ${counts.tickets}`)
    console.log(`  ├─ Incidents: ${counts.incidents}`)
    console.log(`  ├─ Service Requests: ${counts.serviceRequests}`)
    console.log(`  ├─ Changes: ${counts.changes}`)
    console.log(`  └─ Problems: ${counts.problems}`)
    console.log(`\n  Total: ${Object.values(counts).reduce((a, b) => a + b, 0)} records\n`)

    if (options.dryRun) {
      console.log('✅ Dry run completed. Run without --dry-run to execute migration.\n')
      await client.close()
      return
    }

    // Step 2: Create unified_tickets collection
    console.log('📦 Creating unified_tickets collection...')
    const unifiedTickets = db.collection('unified_tickets')

    // Step 3: Migrate Tickets
    console.log('\n📋 Migrating Tickets...')
    const tickets = await db.collection('tickets').find({}).toArray()

    for (const ticket of tickets) {
      try {
        const unified = {
          ...ticket,
          ticketType: 'ticket' as const,
          legacyNumber: ticket.ticketNumber,
          requesterId: ticket.requesterId,
          requesterName: ticket.requesterName,
          metadata: {
            type: 'ticket' as const,
            linkedTickets: ticket.linkedTickets || [],
          },
        }

        await unifiedTickets.insertOne(unified)
        stats.tickets++
      } catch (error: any) {
        stats.errors++
        stats.errorMessages.push(`Ticket ${ticket.ticketNumber}: ${error.message}`)
      }
    }
    console.log(`  ✅ Migrated ${stats.tickets} tickets`)

    // Step 4: Migrate Incidents
    console.log('\n🚨 Migrating Incidents...')
    const incidents = await db.collection('incidents').find({}).toArray()

    for (const incident of incidents) {
      try {
        const unified = {
          _id: incident._id,
          orgId: incident.orgId,
          createdAt: incident.createdAt,
          updatedAt: incident.updatedAt,
          createdBy: incident.createdBy,

          ticketNumber: incident.incidentNumber,
          legacyNumber: incident.incidentNumber,
          ticketType: 'incident' as const,
          title: incident.title,
          description: incident.description,
          status: incident.status,
          priority: incident.priority,
          category: incident.category || 'Uncategorized',

          requesterId: incident.createdBy,
          requesterName: incident.createdByName,
          assignedTo: incident.assignedTo,
          assignedToName: incident.assignedToName,

          clientId: incident.clientIds?.[0] || undefined,
          clientName: incident.clientName,

          tags: incident.tags || [],
          linkedAssets: incident.linkedAssets || [],

          attachments: incident.attachments || [],
          sla: incident.sla,
          totalTimeSpent: incident.totalTimeSpent,
          csatRating: incident.csatRating,

          resolvedAt: incident.resolvedAt,
          closedAt: incident.closedAt,

          metadata: {
            type: 'incident' as const,
            severity: incident.severity,
            impact: incident.impact,
            urgency: incident.urgency,
            affectedServices: incident.affectedServices || [],
            clientIds: incident.clientIds || [],
            isPublic: incident.isPublic || false,
            startedAt: incident.startedAt || incident.createdAt,
            relatedProblemId: incident.relatedProblemId,
          },
        }

        await unifiedTickets.insertOne(unified)
        stats.incidents++
      } catch (error: any) {
        stats.errors++
        stats.errorMessages.push(`Incident ${incident.incidentNumber}: ${error.message}`)
      }
    }
    console.log(`  ✅ Migrated ${stats.incidents} incidents`)

    // Step 5: Migrate Service Requests
    console.log('\n📝 Migrating Service Requests...')
    const serviceRequests = await db.collection('service_requests').find({}).toArray()

    for (const sr of serviceRequests) {
      try {
        const unified = {
          _id: sr._id,
          orgId: sr.orgId,
          createdAt: sr.createdAt,
          updatedAt: sr.updatedAt,
          createdBy: sr.createdBy,

          ticketNumber: sr.requestNumber,
          legacyNumber: sr.requestNumber,
          ticketType: 'service_request' as const,
          title: sr.title,
          description: sr.description,
          status: sr.status,
          priority: sr.priority,
          category: sr.category,

          requesterId: sr.requestedBy,
          requesterName: sr.requestedByName,
          assignedTo: sr.assignedTo,
          assignedToName: sr.assignedToName,

          clientId: sr.clientId,
          clientName: sr.clientName,

          tags: sr.tags || [],
          linkedAssets: sr.linkedAssets || [],

          attachments: sr.attachments || [],
          sla: sr.sla,
          totalTimeSpent: sr.totalTimeSpent,
          csatRating: sr.csatRating,

          resolvedAt: sr.resolvedAt,
          closedAt: sr.closedAt,

          metadata: {
            type: 'service_request' as const,
            serviceId: sr.serviceId,
            formData: sr.formData,
            approvalStatus: sr.approvalStatus,
            approvedBy: sr.approvedBy,
            approvedByName: sr.approvedByName,
            approvedAt: sr.approvedAt,
            rejectionReason: sr.rejectionReason,
            completedAt: sr.completedAt,
          },
        }

        await unifiedTickets.insertOne(unified)
        stats.serviceRequests++
      } catch (error: any) {
        stats.errors++
        stats.errorMessages.push(`Service Request ${sr.requestNumber}: ${error.message}`)
      }
    }
    console.log(`  ✅ Migrated ${stats.serviceRequests} service requests`)

    // Step 6: Migrate Changes
    console.log('\n🔧 Migrating Changes...')
    const changes = await db.collection('change_requests').find({}).toArray()

    for (const change of changes) {
      try {
        const unified = {
          _id: change._id,
          orgId: change.orgId,
          createdAt: change.createdAt,
          updatedAt: change.updatedAt,
          createdBy: change.createdBy,

          ticketNumber: change.changeNumber,
          legacyNumber: change.changeNumber,
          ticketType: 'change' as const,
          title: change.title,
          description: change.description,
          status: change.status,
          priority: 'medium' as const, // Changes don't have priority in old schema
          category: change.category,

          requesterId: change.requestedBy,
          requesterName: change.requestedByName,
          assignedTo: change.assignedTo,
          assignedToName: change.assignedToName,

          clientId: change.clientId,
          clientName: change.clientName,

          tags: change.tags || [],
          linkedAssets: change.affectedAssets || [],

          attachments: change.attachments || [],
          sla: change.sla,
          totalTimeSpent: change.totalTimeSpent,

          resolvedAt: change.actualEndDate,
          closedAt: change.actualEndDate,

          metadata: {
            type: 'change' as const,
            risk: change.risk,
            impact: change.impact,
            plannedStartDate: change.plannedStartDate,
            plannedEndDate: change.plannedEndDate,
            actualStartDate: change.actualStartDate,
            actualEndDate: change.actualEndDate,
            affectedAssets: change.affectedAssets || [],
            relatedTickets: change.relatedTickets || [],
            backoutPlan: change.backoutPlan,
            testPlan: change.testPlan,
            implementationPlan: change.implementationPlan,
            approvalStatus: change.approvedBy ? 'approved' : change.rejectionReason ? 'rejected' : undefined,
            approvedBy: change.approvedBy,
            approvedByName: change.approvedByName,
            approvedAt: change.approvedAt,
            rejectionReason: change.rejectionReason,
            cabMembers: change.cabMembers,
            cabNotes: change.cabNotes,
          },
        }

        await unifiedTickets.insertOne(unified)
        stats.changes++
      } catch (error: any) {
        stats.errors++
        stats.errorMessages.push(`Change ${change.changeNumber}: ${error.message}`)
      }
    }
    console.log(`  ✅ Migrated ${stats.changes} changes`)

    // Step 7: Migrate Problems
    console.log('\n🔍 Migrating Problems...')
    const problems = await db.collection('problems').find({}).toArray()

    for (const problem of problems) {
      try {
        const unified = {
          _id: problem._id,
          orgId: problem.orgId,
          createdAt: problem.createdAt,
          updatedAt: problem.updatedAt,
          createdBy: problem.createdBy,

          ticketNumber: problem.problemNumber,
          legacyNumber: problem.problemNumber,
          ticketType: 'problem' as const,
          title: problem.title,
          description: problem.description,
          status: problem.status,
          priority: problem.priority,
          category: problem.category,

          requesterId: problem.reportedBy,
          requesterName: problem.reportedByName,
          assignedTo: problem.assignedTo,
          assignedToName: problem.assignedToName,

          clientId: problem.clientIds?.[0] || undefined,
          clientName: problem.clientName,

          tags: problem.tags || [],
          linkedAssets: problem.linkedAssets || [],

          attachments: problem.attachments || [],
          sla: problem.sla,
          totalTimeSpent: problem.totalTimeSpent,

          resolvedAt: problem.resolvedAt,
          closedAt: problem.closedAt,

          metadata: {
            type: 'problem' as const,
            impact: problem.impact,
            urgency: problem.urgency,
            rootCause: problem.rootCause,
            workaround: problem.workaround,
            solution: problem.solution,
            relatedIncidents: problem.relatedIncidents || [],
            affectedServices: problem.affectedServices || [],
            clientIds: problem.clientIds || [],
            isPublic: problem.isPublic || false,
            startedAt: problem.startedAt || problem.createdAt,
            knownErrorDate: problem.knownErrorDate,
          },
        }

        await unifiedTickets.insertOne(unified)
        stats.problems++
      } catch (error: any) {
        stats.errors++
        stats.errorMessages.push(`Problem ${problem.problemNumber}: ${error.message}`)
      }
    }
    console.log(`  ✅ Migrated ${stats.problems} problems`)

    // Step 8: Create indexes
    console.log('\n🔍 Creating indexes...')
    await unifiedTickets.createIndex({ orgId: 1, ticketType: 1, status: 1 })
    await unifiedTickets.createIndex({ orgId: 1, ticketNumber: 1 }, { unique: true })
    await unifiedTickets.createIndex({ orgId: 1, requesterId: 1 })
    await unifiedTickets.createIndex({ orgId: 1, assignedTo: 1 })
    await unifiedTickets.createIndex({ orgId: 1, clientId: 1 })
    await unifiedTickets.createIndex({ orgId: 1, createdAt: -1 })
    await unifiedTickets.createIndex({ orgId: 1, 'metadata.type': 1 })
    await unifiedTickets.createIndex({ ticketNumber: 'text', title: 'text', description: 'text' })
    console.log('  ✅ Indexes created')

    // Step 9: Migrate related collections
    console.log('\n🔗 Migrating related collections...')

    // Migrate incident_updates to unified_ticket_updates
    const incidentUpdates = await db.collection('incident_updates').find({}).toArray()
    if (incidentUpdates.length > 0) {
      const transformedUpdates = incidentUpdates.map((update) => ({
        ...update,
        ticketId: update.incidentId,
        ticketType: 'incident' as const,
      }))
      await db.collection('unified_ticket_updates').insertMany(transformedUpdates)
      console.log(`  ✅ Migrated ${incidentUpdates.length} incident updates`)
    }

    // Migrate problem_updates to unified_ticket_updates
    const problemUpdates = await db.collection('problem_updates').find({}).toArray()
    if (problemUpdates.length > 0) {
      const transformedUpdates = problemUpdates.map((update) => ({
        ...update,
        ticketId: update.problemId,
        ticketType: 'problem' as const,
      }))
      await db.collection('unified_ticket_updates').insertMany(transformedUpdates)
      console.log(`  ✅ Migrated ${problemUpdates.length} problem updates`)
    }

    // Step 10: Archive legacy collections
    console.log('\n📦 Archiving legacy collections...')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    const collectionsToArchive = [
      'tickets',
      'incidents',
      'service_requests',
      'change_requests',
      'problems',
      'incident_updates',
      'problem_updates',
    ]

    for (const collectionName of collectionsToArchive) {
      const collection = db.collection(collectionName)
      const count = await collection.countDocuments({})

      if (count > 0) {
        const archiveName = `${collectionName}_legacy_${timestamp}`
        await collection.rename(archiveName)
        console.log(`  ✅ Archived ${collectionName} → ${archiveName}`)
      }
    }

    // Step 11: Calculate statistics
    stats.total = stats.tickets + stats.incidents + stats.serviceRequests + stats.changes + stats.problems

    console.log('\n✅ Migration Complete!')
    console.log('======================\n')
    console.log('Migration Summary:')
    console.log(`  ├─ Tickets: ${stats.tickets}`)
    console.log(`  ├─ Incidents: ${stats.incidents}`)
    console.log(`  ├─ Service Requests: ${stats.serviceRequests}`)
    console.log(`  ├─ Changes: ${stats.changes}`)
    console.log(`  ├─ Problems: ${stats.problems}`)
    console.log(`  └─ Total: ${stats.total}`)

    if (stats.errors > 0) {
      console.log(`\n⚠️  ${stats.errors} errors occurred during migration:`)
      stats.errorMessages.slice(0, 10).forEach((msg) => console.log(`  - ${msg}`))
      if (stats.errorMessages.length > 10) {
        console.log(`  ... and ${stats.errorMessages.length - 10} more`)
      }
    }

    console.log('\n📝 Next Steps:')
    console.log('  1. Verify data in unified_tickets collection')
    console.log('  2. Update application code to use unified_tickets')
    console.log('  3. Test thoroughly before removing legacy collections')
    console.log('  4. Legacy collections archived with timestamp for rollback\n')
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await client.close()
  }
}

async function performRollback(db: any) {
  console.log('\n🔄 Performing rollback...\n')

  try {
    // Find the most recent legacy backup
    const collections = await db.listCollections().toArray()
    const legacyCollections = collections.filter((c: any) => c.name.includes('_legacy_'))

    if (legacyCollections.length === 0) {
      console.log('❌ No legacy collections found for rollback')
      return
    }

    // Get the timestamp from the first legacy collection
    const timestampMatch = legacyCollections[0].name.match(/_legacy_(.+)$/)
    if (!timestampMatch) {
      console.log('❌ Could not determine legacy collection timestamp')
      return
    }

    const timestamp = timestampMatch[1]
    console.log(`Found legacy collections with timestamp: ${timestamp}\n`)

    // Drop unified collections
    console.log('Dropping unified collections...')
    await db.collection('unified_tickets').drop().catch(() => {})
    await db.collection('unified_ticket_updates').drop().catch(() => {})
    console.log('  ✅ Unified collections dropped')

    // Restore legacy collections
    console.log('\nRestoring legacy collections...')
    const restoreMap: Record<string, string> = {
      [`tickets_legacy_${timestamp}`]: 'tickets',
      [`incidents_legacy_${timestamp}`]: 'incidents',
      [`service_requests_legacy_${timestamp}`]: 'service_requests',
      [`change_requests_legacy_${timestamp}`]: 'change_requests',
      [`problems_legacy_${timestamp}`]: 'problems',
      [`incident_updates_legacy_${timestamp}`]: 'incident_updates',
      [`problem_updates_legacy_${timestamp}`]: 'problem_updates',
    }

    for (const [legacyName, originalName] of Object.entries(restoreMap)) {
      try {
        await db.collection(legacyName).rename(originalName)
        console.log(`  ✅ Restored ${originalName}`)
      } catch (error: any) {
        console.log(`  ⚠️  Could not restore ${originalName}: ${error.message}`)
      }
    }

    console.log('\n✅ Rollback complete!\n')
  } catch (error) {
    console.error('❌ Rollback failed:', error)
    throw error
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options: MigrationOptions = {
  dryRun: args.includes('--dry-run'),
  rollback: args.includes('--rollback'),
}

// Run migration
migrateToUnifiedTickets(options)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
