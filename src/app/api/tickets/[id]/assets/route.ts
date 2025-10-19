import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// PUT /api/tickets/[id]/assets - Link/unlink assets to a ticket
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { assetIds } = await req.json()

    // Validate assetIds is an array
    if (!Array.isArray(assetIds)) {
      return NextResponse.json(
        { error: 'assetIds must be an array' },
        { status: 400 }
      )
    }

    const orgId = session.user.orgId
    const client = await clientPromise
    const db = client.db('deskwise')

    // Verify ticket exists and belongs to org
    const ticket = await db.collection('tickets').findOne({
      _id: new ObjectId(id),
      orgId,
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    // Verify all assets exist and belong to same org
    if (assetIds.length > 0) {
      const validAssetIds = assetIds.map((assetId) => new ObjectId(assetId))
      const assets = await db
        .collection('assets')
        .find({
          _id: { $in: validAssetIds },
          orgId,
        })
        .toArray()

      if (assets.length !== assetIds.length) {
        return NextResponse.json(
          { error: 'One or more assets not found or do not belong to your organization' },
          { status: 400 }
        )
      }
    }

    // Update ticket with linked assets
    const result = await db.collection('tickets').findOneAndUpdate(
      { _id: new ObjectId(id), orgId },
      {
        $set: {
          linkedAssets: assetIds,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    )

    return NextResponse.json({
      success: true,
      data: result,
      message: assetIds.length > 0
        ? `Successfully linked ${assetIds.length} asset(s)`
        : 'Successfully unlinked all assets',
    })
  } catch (error) {
    console.error('Error updating ticket assets:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket assets' },
      { status: 500 }
    )
  }
}
