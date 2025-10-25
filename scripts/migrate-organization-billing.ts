/**
 * Organization Billing Information Migration Script
 *
 * This script migrates existing organizations to the new billing schema
 * by adding default values for the new billing-related fields.
 *
 * Usage:
 *   npx tsx scripts/migrate-organization-billing.ts --dry-run    # Preview changes
 *   npx tsx scripts/migrate-organization-billing.ts              # Execute migration
 *
 * Date: 2025-10-25
 * Version: 1.0.0
 */

import { getDatabase, COLLECTIONS } from '../src/lib/mongodb'

interface MigrationStats {
  total: number
  alreadyMigrated: number
  migrated: number
  errors: number
}

async function migrateOrganizationBilling(dryRun: boolean = false) {
  console.log('='.repeat(60))
  console.log('Organization Billing Information Migration')
  console.log('='.repeat(60))
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`)
  console.log('='.repeat(60))
  console.log('')

  const stats: MigrationStats = {
    total: 0,
    alreadyMigrated: 0,
    migrated: 0,
    errors: 0,
  }

  try {
    const db = await getDatabase()
    const orgsCollection = db.collection(COLLECTIONS.ORGANIZATIONS)

    // Get all organizations
    const orgs = await orgsCollection.find({}).toArray()
    stats.total = orgs.length

    console.log(`Found ${stats.total} organizations\n`)

    for (const org of orgs) {
      const orgName = org.name || 'Unknown'
      const orgId = org._id.toString()

      console.log(`Processing: ${orgName} (${orgId})`)

      // Check if already migrated
      if (org.invoiceDefaults || org.address || org.taxId || org.paymentInstructions) {
        console.log(`  ✓ Already migrated - skipping\n`)
        stats.alreadyMigrated++
        continue
      }

      // Prepare migration data
      const updateData: any = {
        updatedAt: new Date(),
      }

      // Add default invoice settings
      updateData.invoiceDefaults = {
        paymentTerms: 30, // Default NET 30
        footerText: 'Thank you for your business!',
      }

      // Add email if not present (organizations might have this already)
      if (!org.email) {
        console.log(`  ℹ Email not set - leaving blank`)
      }

      // Add phone if not present
      if (!org.phone) {
        console.log(`  ℹ Phone not set - leaving blank`)
      }

      // Log what will be added
      console.log(`  ✓ Will add default invoice settings:`)
      console.log(`    - Payment Terms: NET 30`)
      console.log(`    - Footer Text: "Thank you for your business!"`)

      if (!dryRun) {
        try {
          await orgsCollection.updateOne(
            { _id: org._id },
            { $set: updateData }
          )
          console.log(`  ✓ Migrated successfully\n`)
          stats.migrated++
        } catch (error) {
          console.error(`  ✗ Error migrating: ${error}\n`)
          stats.errors++
        }
      } else {
        console.log(`  ℹ DRY RUN - no changes made\n`)
        stats.migrated++
      }
    }

    // Print summary
    console.log('='.repeat(60))
    console.log('Migration Summary')
    console.log('='.repeat(60))
    console.log(`Total organizations: ${stats.total}`)
    console.log(`Already migrated: ${stats.alreadyMigrated}`)
    console.log(`${dryRun ? 'Would migrate' : 'Migrated'}: ${stats.migrated}`)
    console.log(`Errors: ${stats.errors}`)
    console.log('='.repeat(60))

    if (dryRun) {
      console.log('\n⚠️  DRY RUN MODE - No changes were made to the database')
      console.log('Run without --dry-run to execute the migration\n')
    } else {
      console.log('\n✅ Migration completed successfully!\n')
    }

    // Next steps
    if (!dryRun && stats.migrated > 0) {
      console.log('Next Steps:')
      console.log('1. Review migrated organizations in the database')
      console.log('2. Have MSPs configure their billing information via UI')
      console.log('3. Test invoice generation with new organizations')
      console.log('4. Configure white label branding via BrandingService\n')
    }

  } catch (error) {
    console.error('Fatal error during migration:', error)
    process.exit(1)
  }
}

/**
 * Interactive migration prompts (optional)
 */
async function promptForOrganizationData(orgName: string): Promise<any> {
  console.log(`\nEnter billing information for: ${orgName}`)
  console.log('(Press Enter to skip any field)\n')

  // This could be extended to use readline for interactive input
  // For now, we'll use defaults

  return {
    email: undefined,
    phone: undefined,
    website: undefined,
    address: undefined,
    taxId: undefined,
    taxIdLabel: undefined,
    registrationNumber: undefined,
    paymentInstructions: undefined,
    invoiceDefaults: {
      paymentTerms: 30,
      footerText: 'Thank you for your business!',
    },
  }
}

/**
 * Validate billing data
 */
function validateBillingData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate email format
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  }

  // Validate phone format (basic check)
  if (data.phone && data.phone.length < 10) {
    errors.push('Phone number too short')
  }

  // Validate website URL
  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.push('Invalid website URL (must start with http:// or https://)')
  }

  // Validate tax ID format (basic check - at least 5 characters)
  if (data.taxId && data.taxId.length < 5) {
    errors.push('Tax ID too short')
  }

  // Validate payment terms
  if (data.invoiceDefaults?.paymentTerms && data.invoiceDefaults.paymentTerms < 1) {
    errors.push('Payment terms must be at least 1 day')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  await migrateOrganizationBilling(dryRun)
  process.exit(0)
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}

export { migrateOrganizationBilling, validateBillingData }
