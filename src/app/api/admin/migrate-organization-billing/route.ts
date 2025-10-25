import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'

interface MigrationStats {
  total: number
  alreadyMigrated: number
  migrated: number
  errors: number
  organizations: Array<{
    name: string
    id: string
    status: 'migrated' | 'skipped' | 'error'
    message?: string
  }>
}

/**
 * Organization Billing Information Migration API
 *
 * GET /api/admin/migrate-organization-billing?dryRun=true  - Preview changes
 * POST /api/admin/migrate-organization-billing             - Execute migration
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check admin access
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const dryRun = searchParams.get('dryRun') === 'true'

  try {
    const result = await runMigration(dryRun)
    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check admin access
  if (!session?.user?.id || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
  }

  try {
    const result = await runMigration(false)
    return NextResponse.json({
      success: true,
      dryRun: false,
      ...result,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: String(error) },
      { status: 500 }
    )
  }
}

async function runMigration(dryRun: boolean): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    alreadyMigrated: 0,
    migrated: 0,
    errors: 0,
    organizations: [],
  }

  const db = await getDatabase()
  const orgsCollection = db.collection(COLLECTIONS.ORGANIZATIONS)

  // Get all organizations
  const orgs = await orgsCollection.find({}).toArray()
  stats.total = orgs.length

  for (const org of orgs) {
    const orgName = org.name || 'Unknown'
    const orgId = org._id.toString()

    // Check if already migrated
    if (org.invoiceDefaults || org.address || org.taxId || org.paymentInstructions) {
      stats.alreadyMigrated++
      stats.organizations.push({
        name: orgName,
        id: orgId,
        status: 'skipped',
        message: 'Already migrated',
      })
      continue
    }

    // Prepare migration data
    const updateData: any = {
      updatedAt: new Date(),
      invoiceDefaults: {
        paymentTerms: 30, // Default NET 30
        footerText: 'Thank you for your business!',
      },
    }

    if (!dryRun) {
      try {
        await orgsCollection.updateOne(
          { _id: org._id },
          { $set: updateData }
        )
        stats.migrated++
        stats.organizations.push({
          name: orgName,
          id: orgId,
          status: 'migrated',
          message: 'Added default invoice settings',
        })
      } catch (error) {
        stats.errors++
        stats.organizations.push({
          name: orgName,
          id: orgId,
          status: 'error',
          message: String(error),
        })
      }
    } else {
      stats.migrated++
      stats.organizations.push({
        name: orgName,
        id: orgId,
        status: 'migrated',
        message: 'Would add default invoice settings (dry run)',
      })
    }
  }

  return stats
}
