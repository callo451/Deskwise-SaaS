import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { PortalPage } from '@/lib/types'
import { canPublishPage, PortalAuditService } from '@/lib/portal/auth'
import { ObjectId } from 'mongodb'

type Params = {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/portal/pages/[id]/publish
 *
 * Publish or unpublish a portal page
 * Requires: portal.publish permission
 */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canPublishPage(session))) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to publish portal pages.',
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { publish } = body // true to publish, false to unpublish

    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Get existing page
    const page = await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    const now = new Date()
    const updateFields: any = {
      status: publish ? 'published' : 'draft',
      updatedAt: now,
    }

    if (publish) {
      updateFields.publishedAt = now
      updateFields.publishedBy = session.user.id
    }

    await pagesCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      { $set: updateFields }
    )

    // Audit log
    if (publish) {
      await PortalAuditService.logPagePublish({
        orgId: session.user.orgId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        pageId: id,
        pageName: page.title,
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      })
    } else {
      await PortalAuditService.logPageUnpublish({
        orgId: session.user.orgId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        pageId: id,
        pageName: page.title,
        ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined,
        userAgent: req.headers.get('user-agent') || undefined,
      })
    }

    return NextResponse.json({
      success: true,
      status: publish ? 'published' : 'draft',
    })
  } catch (error) {
    console.error('Error publishing/unpublishing page:', error)
    return NextResponse.json(
      { error: 'Failed to update page status' },
      { status: 500 }
    )
  }
}
