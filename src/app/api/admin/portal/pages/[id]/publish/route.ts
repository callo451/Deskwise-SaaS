import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * POST /api/admin/portal/pages/:id/publish
 * Publish a portal page (makes it live)
 */
export async function POST(
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

    const result = await db.collection('portal_pages').findOneAndUpdate(
      {
        _id: new ObjectId(id),
        orgId: session.user.orgId,
      },
      {
        $set: {
          blocks: body.blocks,
          themeOverrides: body.themeOverrides,
          isPublished: true,
          publishedAt: new Date(),
          publishedBy: session.user.userId,
          updatedAt: new Date(),
          updatedBy: session.user.userId,
        },
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
    console.error('Failed to publish portal page:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
