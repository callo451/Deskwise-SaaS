import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { PortalPage } from '@/lib/types'
import { requirePermission } from '@/lib/middleware/permissions'
import {
  canCreatePage,
  canViewPortalComposer,
  PortalAuditService,
} from '@/lib/portal/auth'
import { ObjectId } from 'mongodb'

/**
 * GET /api/portal/pages
 *
 * Get all portal pages for the organization
 * Requires: portal.view permission
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canViewPortalComposer(session))) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to view portal pages.',
        },
        { status: 403 }
      )
    }

    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const filter: any = { orgId: session.user.orgId }
    if (status) {
      filter.status = status
    }

    const pages = await pagesCollection
      .find(filter)
      .sort({ order: 1, createdAt: -1 })
      .toArray()

    return NextResponse.json({ success: true, data: pages })
  } catch (error) {
    console.error('Error fetching portal pages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch portal pages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/portal/pages
 *
 * Create a new portal page
 * Requires: portal.create permission
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission
    if (!(await canCreatePage(session))) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: 'You do not have permission to create portal pages.',
        },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate required fields
    if (!body.title || !body.slug) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug' },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const pagesCollection = db.collection<PortalPage>(COLLECTIONS.PORTAL_PAGES)

    // Check if slug already exists
    const existingPage = await pagesCollection.findOne({
      orgId: session.user.orgId,
      slug: body.slug,
    })

    if (existingPage) {
      return NextResponse.json(
        { error: 'A page with this slug already exists' },
        { status: 409 }
      )
    }

    const now = new Date()
    const newPage: Omit<PortalPage, '_id'> = {
      orgId: session.user.orgId,
      title: body.title,
      slug: body.slug,
      description: body.description || '',
      status: body.status || 'draft',
      blocks: body.blocks || [],
      dataSources: body.dataSources || [],
      isPublic: body.isPublic ?? false,
      allowedRoles: body.allowedRoles || [],
      requiredPermissions: body.requiredPermissions || [],
      layout: body.layout || {
        header: true,
        footer: true,
        sidebar: false,
        maxWidth: 'xl',
      },
      version: 1,
      isHomePage: body.isHomePage ?? false,
      order: body.order || 0,
      showInNav: body.showInNav ?? true,
      viewCount: 0,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await pagesCollection.insertOne(newPage as PortalPage)

    // Audit log
    await PortalAuditService.logPageCreate({
      orgId: session.user.orgId,
      userId: session.user.id,
      userName: session.user.name || session.user.email,
      pageId: result.insertedId.toString(),
      pageName: body.title,
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || undefined,
      userAgent: req.headers.get('user-agent') || undefined,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newPage,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating portal page:', error)
    return NextResponse.json(
      { error: 'Failed to create portal page' },
      { status: 500 }
    )
  }
}
