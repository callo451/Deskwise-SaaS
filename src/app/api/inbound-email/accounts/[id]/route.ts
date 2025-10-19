import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { InboundEmailAccount, ImapConfig } from '@/lib/types'
import { encryptCredentials, decryptCredentials } from '@/lib/utils/email-encryption'
import { ObjectId } from 'mongodb'

/**
 * GET /api/inbound-email/accounts/[id]
 * Get a specific inbound email account
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    const account = await accountsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Mask IMAP password
    const maskedAccount = {
      ...account,
      imap: {
        ...account.imap,
        password: '***********',
      },
    }

    return NextResponse.json({ success: true, data: maskedAccount })
  } catch (error: any) {
    console.error('Get inbound email account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get inbound email account' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/inbound-email/accounts/[id]
 * Update an inbound email account
 */
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    const body = await req.json()

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    // Check account exists
    const account = await accountsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const updateFields: any = {
      updatedAt: new Date(),
    }

    // Update basic fields
    if (body.name !== undefined) updateFields.name = body.name
    if (body.email !== undefined) updateFields.email = body.email
    if (body.isActive !== undefined) updateFields.isActive = body.isActive
    if (body.pollingInterval !== undefined)
      updateFields.pollingInterval = body.pollingInterval
    if (body.deleteAfterProcessing !== undefined)
      updateFields.deleteAfterProcessing = body.deleteAfterProcessing
    if (body.processedFolder !== undefined)
      updateFields.processedFolder = body.processedFolder
    if (body.defaultAssignee !== undefined)
      updateFields.defaultAssignee = body.defaultAssignee
    if (body.autoAssignmentEnabled !== undefined)
      updateFields.autoAssignmentEnabled = body.autoAssignmentEnabled
    if (body.assignmentRules !== undefined)
      updateFields.assignmentRules = body.assignmentRules

    // Update IMAP config if provided
    if (body.imap) {
      let encryptedImap: ImapConfig

      // If password is masked (***********), keep existing password
      if (body.imap.password === '***********') {
        encryptedImap = {
          ...body.imap,
          password: account.imap.password, // Keep existing encrypted password
        }
      } else {
        // Encrypt new password
        const encryptedCredentials = encryptCredentials({
          smtpPassword: body.imap.password,
        })

        encryptedImap = {
          host: body.imap.host,
          port: body.imap.port,
          secure: body.imap.secure !== false,
          username: body.imap.username,
          password: encryptedCredentials.smtpPassword!,
        }
      }

      updateFields.imap = encryptedImap
    }

    // Update account
    await accountsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    )

    // Get updated account
    const updated = await accountsCollection.findOne({
      _id: new ObjectId(id),
    })

    // Mask password
    const maskedAccount = {
      ...updated!,
      imap: {
        ...updated!.imap,
        password: '***********',
      },
    }

    return NextResponse.json({ success: true, data: maskedAccount })
  } catch (error: any) {
    console.error('Update inbound email account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update inbound email account' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/inbound-email/accounts/[id]
 * Delete an inbound email account
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await context.params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 })
    }

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    const result = await accountsCollection.deleteOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete inbound email account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete inbound email account' },
      { status: 500 }
    )
  }
}
