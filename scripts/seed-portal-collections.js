/**
 * Portal Collections Seed Script
 *
 * This script initializes all required MongoDB collections for the Portal Visual Composer.
 *
 * Usage:
 *   Method 1 (with dotenv):
 *     node scripts/seed-portal-collections.js
 *
 *   Method 2 (direct env var):
 *     MONGODB_URI="your-connection-string" node scripts/seed-portal-collections.js
 *
 * Requirements:
 *   - MONGODB_URI environment variable
 *   - MongoDB Node.js driver installed (npm install mongodb)
 */

// Load environment variables from .env.local manually
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local')

  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8')
    const lines = envFile.split('\n')

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
          process.env[key.trim()] = value
        }
      }
    }
    console.log('✓ Loaded environment from .env.local\n')
  }
}

// Load environment variables
loadEnvFile()

const { MongoClient, ObjectId } = require('mongodb')

// Validate environment
if (!process.env.MONGODB_URI) {
  console.error('\n❌ ERROR: MONGODB_URI is not defined')
  console.error('\nPlease set the MONGODB_URI environment variable:')
  console.error('  Option 1: Create a .env.local file with MONGODB_URI')
  console.error('  Option 2: Pass it directly:')
  console.error('    Set MONGODB_URI="your-connection-string" && node scripts/seed-portal-collections.js\n')
  process.exit(1)
}

const MONGODB_URI = process.env.MONGODB_URI
const DB_NAME = 'deskwise'

async function seedPortalCollections() {
  const client = new MongoClient(MONGODB_URI)

  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    console.log('✓ Connected to MongoDB\n')

    const db = client.db(DB_NAME)

    // ====================================================================
    // 1. portal_pages - Page definitions with draft/publish workflow
    // ====================================================================
    console.log('Creating portal_pages collection...')
    const pagesCollection = db.collection('portal_pages')

    await pagesCollection.createIndex({ orgId: 1, slug: 1 }, { unique: true })
    await pagesCollection.createIndex({ orgId: 1, status: 1 })
    await pagesCollection.createIndex({ orgId: 1, isHomePage: 1 })
    await pagesCollection.createIndex({ orgId: 1, updatedAt: -1 })
    await pagesCollection.createIndex({ createdAt: -1 })
    console.log('✓ Created portal_pages with indexes')

    // ====================================================================
    // 2. portal_page_versions - Version history for rollback
    // ====================================================================
    console.log('Creating portal_page_versions collection...')
    const versionsCollection = db.collection('portal_page_versions')

    await versionsCollection.createIndex({ pageId: 1, version: -1 })
    await versionsCollection.createIndex({ orgId: 1, createdAt: -1 })
    await versionsCollection.createIndex({ createdAt: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
    console.log('✓ Created portal_page_versions with indexes')

    // ====================================================================
    // 3. portal_themes - Design token system
    // ====================================================================
    console.log('Creating portal_themes collection...')
    const themesCollection = db.collection('portal_themes')

    await themesCollection.createIndex({ orgId: 1, name: 1 }, { unique: true })
    await themesCollection.createIndex({ orgId: 1, isDefault: 1 })
    await themesCollection.createIndex({ orgId: 1, status: 1 })
    console.log('✓ Created portal_themes with indexes')

    // ====================================================================
    // 4. portal_data_sources - Internal/external data connectors
    // ====================================================================
    console.log('Creating portal_data_sources collection...')
    const dataSourcesCollection = db.collection('portal_data_sources')

    await dataSourcesCollection.createIndex({ orgId: 1, name: 1 }, { unique: true })
    await dataSourcesCollection.createIndex({ orgId: 1, type: 1 })
    await dataSourcesCollection.createIndex({ orgId: 1, status: 1 })
    console.log('✓ Created portal_data_sources with indexes')

    // ====================================================================
    // 5. portal_audit_logs - Complete audit trail
    // ====================================================================
    console.log('Creating portal_audit_logs collection...')
    const auditLogsCollection = db.collection('portal_audit_logs')

    await auditLogsCollection.createIndex({ orgId: 1, timestamp: -1 })
    await auditLogsCollection.createIndex({ pageId: 1, timestamp: -1 })
    await auditLogsCollection.createIndex({ userId: 1, timestamp: -1 })
    await auditLogsCollection.createIndex({ action: 1, timestamp: -1 })
    await auditLogsCollection.createIndex({ timestamp: -1 }, { expireAfterSeconds: 31536000 }) // 1 year TTL
    console.log('✓ Created portal_audit_logs with indexes')

    // ====================================================================
    // 6. portal_analytics - Page view tracking
    // ====================================================================
    console.log('Creating portal_analytics collection...')
    const analyticsCollection = db.collection('portal_analytics')

    await analyticsCollection.createIndex({ orgId: 1, pageId: 1, date: -1 })
    await analyticsCollection.createIndex({ pageId: 1, timestamp: -1 })
    await analyticsCollection.createIndex({ timestamp: -1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
    console.log('✓ Created portal_analytics with indexes')

    // ====================================================================
    // 7. portal_preview_tokens - Preview mode JWT tokens
    // ====================================================================
    console.log('Creating portal_preview_tokens collection...')
    const previewTokensCollection = db.collection('portal_preview_tokens')

    await previewTokensCollection.createIndex({ token: 1 }, { unique: true })
    await previewTokensCollection.createIndex({ pageId: 1, createdAt: -1 })
    await previewTokensCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // Auto-delete expired tokens
    console.log('✓ Created portal_preview_tokens with indexes')

    console.log('\n✅ All portal collections created successfully!\n')

    // ====================================================================
    // Optional: Create default theme
    // ====================================================================
    console.log('Creating default theme...')

    // Check if a default theme already exists
    const existingTheme = await themesCollection.findOne({
      name: 'Default Theme',
      isDefault: true
    })

    if (!existingTheme) {
      const defaultTheme = {
        _id: new ObjectId(),
        name: 'Default Theme',
        description: 'Default portal theme with professional styling',
        orgId: 'system', // System-level theme, can be copied per org
        isDefault: true,
        status: 'active',
        colors: {
          primary: '#4F46E5', // Indigo
          primaryForeground: '#FFFFFF',
          secondary: '#10B981', // Green
          secondaryForeground: '#FFFFFF',
          accent: '#F59E0B', // Amber
          accentForeground: '#FFFFFF',
          background: '#FFFFFF',
          foreground: '#1F2937',
          muted: '#F3F4F6',
          mutedForeground: '#6B7280',
          border: '#E5E7EB',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
        },
        typography: {
          fontFamily: {
            sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          },
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
          },
          fontWeight: {
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
          },
        },
        spacing: {
          xs: '0.5rem',
          sm: '0.75rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
        borderRadius: {
          none: '0',
          sm: '0.25rem',
          md: '0.375rem',
          lg: '0.5rem',
          xl: '0.75rem',
          full: '9999px',
        },
        shadows: {
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        },
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await themesCollection.insertOne(defaultTheme)
      console.log('✓ Created default theme')
    } else {
      console.log('✓ Default theme already exists (skipped)')
    }

    console.log('\n====================================================================')
    console.log('Portal Collections Summary:')
    console.log('====================================================================')
    console.log(`✓ portal_pages - Page definitions`)
    console.log(`✓ portal_page_versions - Version history (90-day retention)`)
    console.log(`✓ portal_themes - Design token system`)
    console.log(`✓ portal_data_sources - Data connectors`)
    console.log(`✓ portal_audit_logs - Audit trail (1-year retention)`)
    console.log(`✓ portal_analytics - View tracking (90-day retention)`)
    console.log(`✓ portal_preview_tokens - Preview JWT tokens`)
    console.log('====================================================================\n')

    console.log('Next Steps:')
    console.log('1. Start the dev server: npm run dev')
    console.log('2. Navigate to: http://localhost:9002/admin/portal/pages')
    console.log('3. Click "New Page" to create your first portal page')
    console.log('4. Use the visual composer to build your page')
    console.log('5. Publish and view at: http://localhost:9002/portal/[slug]\n')

  } catch (error) {
    console.error('\n❌ Error seeding portal collections:', error)
    process.exit(1)
  } finally {
    await client.close()
    console.log('Database connection closed.')
  }
}

// Run the seed script
seedPortalCollections()
  .then(() => {
    console.log('✅ Seed script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error)
    process.exit(1)
  })
