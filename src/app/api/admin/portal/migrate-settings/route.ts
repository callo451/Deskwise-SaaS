import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

/**
 * POST /api/admin/portal/migrate-settings
 * Migrate portal_settings data to portal_pages as pageSettings
 * This is a one-time migration endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can run migrations
    if (!session?.user?.orgId || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('deskwise')
    const orgId = session.user.orgId

    // Get existing portal settings for this organization
    const portalSettings = await db.collection('portal_settings').findOne({ orgId })

    if (!portalSettings) {
      return NextResponse.json({
        success: true,
        message: 'No portal settings found to migrate',
        updated: 0,
      })
    }

    // Get all portal pages for this organization
    const portalPages = await db
      .collection('portal_pages')
      .find({ orgId })
      .toArray()

    if (portalPages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No portal pages found to update',
        updated: 0,
      })
    }

    // Map portal settings to pageSettings structure
    const pageSettings = {
      // General
      enabled: portalSettings.enabled ?? true,
      welcomeMessage: portalSettings.welcomeMessage ?? '',
      showKnowledgeBase: portalSettings.showKnowledgeBase ?? true,
      showIncidentStatus: portalSettings.showIncidentStatus ?? true,

      // Ticket Management
      allowGuestSubmissions: portalSettings.allowGuestSubmissions ?? false,
      guestSubmissionEmail: portalSettings.guestSubmissionEmail ?? '',
      autoAssignment: portalSettings.autoAssignment ?? false,
      defaultAssignee: portalSettings.defaultAssignee ?? '',

      // Notifications
      notificationSettings: portalSettings.notificationSettings ?? {
        emailOnSubmission: true,
        emailOnStatusChange: true,
        emailOnComment: false,
      },

      // Custom Announcement
      customAnnouncement: portalSettings.customAnnouncement ?? {
        enabled: false,
        message: '',
        type: 'info',
      },
    }

    // Update all portal pages with the migrated settings
    const result = await db.collection('portal_pages').updateMany(
      {
        orgId,
        pageSettings: { $exists: false }, // Only update pages that don't have settings yet
      },
      {
        $set: {
          pageSettings,
          updatedAt: new Date(),
          updatedBy: session.user.userId,
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Portal settings migrated successfully',
      updated: result.modifiedCount,
      totalPages: portalPages.length,
      settings: pageSettings,
    })
  } catch (error) {
    console.error('Failed to migrate portal settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
