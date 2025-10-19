import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { PortalPage } from '@/lib/types'
import {
  canEditPortal,
  canPublishPage,
  canDeletePage,
  PortalAuditService,
} from '@/lib/portal/auth'
import { ObjectId } from 'mongodb'

type Params = {
  params: Promise<{
    id: string
  }>
}

/**
 * GET /api/portal/pages/[id]
 *
 * Get a specific portal page
 * Requires: portal.view permission
 */
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canEditPortal(session))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to view portal pages.' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    const page = await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ page })
  } catch (error) {
    console.error('Error fetching portal page:', error)
    return NextResponse.json({ error: 'Failed to fetch portal page' }, { status: 500 })
  }
}

/**
 * PUT /api/portal/pages/[id]
 *
 * Update a portal page
 * Requires: portal.edit permission
 */
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canEditPortal(session))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to edit portal pages.' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Get existing page for audit log
    const existingPage = await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!existingPage) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // If slug is changing, check for conflicts
    if (body.slug && body.slug !== existingPage.slug) {
      const conflictingPage = await pagesCollection.findOne({
        orgId: session.user.orgId,
        slug: body.slug,
        _id: { $ne: new ObjectId(id) },
      })

      if (conflictingPage) {
        return NextResponse.json(
          { error: 'A page with this slug already exists' },
          { status: 409 }
        )
      }
    }

    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    }

    const allowedFields = [
      'title',
      'slug',
      'description',
      'blocks',
      'dataSources',
      'themeId',
      'themeOverrides',
      'seo',
      'isPublic',
      'allowedRoles',
      'requiredPermissions',
      'layout',
      'parentPageId',
      'order',
      'showInNav',
      'navLabel',
    ]

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateFields[field] = body[field]
      }
    })

    // Increment version
    updateFields.version = (existingPage.version || 1) + 1
    updateFields.previousVersionId = existingPage._id.toString()

    const result = await pagesCollection.updateOne(
      { _id: new ObjectId(id), orgId: session.user.orgId },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Get changed fields
    const changedFields = Object.keys(body).filter(
      (field) => allowedFields.includes(field)
    )

    // Audit log
    await PortalAuditService.logPageUpdate({
      orgId: session.user.orgId,
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      pageId: id,
      pageName: body.title || existingPage.title,
      changes: {
        fields: changedFields,
      },
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    // Get updated page
    const updatedPage = await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    return NextResponse.json({ success: true, page: updatedPage })
  } catch (error) {
    console.error('Error updating portal page:', error)
    return NextResponse.json({ error: 'Failed to update portal page' }, { status: 500 })
  }
}

/**
 * DELETE /api/portal/pages/[id]
 *
 * Delete a portal page
 * Requires: portal.delete permission
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canDeletePage(session, id))) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You do not have permission to delete portal pages.' },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Get page for audit log
    const page = await pagesCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Don't allow deleting the home page
    if (page.isHomePage) {
      return NextResponse.json(
        { error: 'Cannot delete the home page. Set a different page as home first.' },
        { status: 400 }
      )
    }

    const result = await pagesCollection.deleteOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    // Audit log
    await PortalAuditService.logPageDelete({
      orgId: session.user.orgId,
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      pageId: id,
      pageName: page.title,
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting portal page:', error)
    return NextResponse.json({ error: 'Failed to delete portal page' }, { status: 500 })
  }
}
