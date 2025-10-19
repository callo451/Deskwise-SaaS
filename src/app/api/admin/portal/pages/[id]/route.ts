import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * GET /api/admin/portal/pages/:id
 * Fetch a single portal page by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const client = await clientPromise
    const db = client.db('deskwise')

    const page = await db.collection('portal_pages').findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(page)
  } catch (error) {
    console.error('Failed to fetch portal page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/portal/pages/:id
 * Update a portal page
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams
    const body = await req.json()

    const client = await clientPromise
    const db = client.db('deskwise')

    // Build dynamic update object based on provided fields
    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
      updatedBy: session.user.userId,
    }

    // Add fields if they exist in the request body
    if (body.blocks !== undefined) updateFields.blocks = body.blocks
    if (body.themeOverrides !== undefined) updateFields.themeOverrides = body.themeOverrides
    if (body.pageSettings !== undefined) updateFields.pageSettings = body.pageSettings

    const result = await db.collection('portal_pages').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId: session.user.orgId,
      },
      {
        $set: updateFields,
        $inc: {
          version: 1,
        },
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to update portal page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/portal/pages/:id
 * Delete a portal page
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const { id } = resolvedParams

    const client = await clientPromise
    const db = client.db('deskwise')

    const result = await db.collection('portal_pages').deleteOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete portal page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
