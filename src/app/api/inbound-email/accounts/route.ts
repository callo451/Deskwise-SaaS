import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { InboundEmailAccount, ImapConfig } from '@/lib/types'
import { encryptCredentials } from '@/lib/utils/email-encryption'
import { ObjectId } from 'mongodb'

/**
 * GET /api/inbound-email/accounts
 * List all inbound email accounts for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    const accounts = await accountsCollection
      .find({ orgId: session.user.orgId })
      .sort({ createdAt: -1 })
      .toArray()

    // Mask IMAP passwords in response
    const maskedAccounts = accounts.map((account) => ({
      ...account,
      imap: {
        ...account.imap,
        password: '***********',
      },
    }))

    return NextResponse.json({ success: true, data: maskedAccounts })
  } catch (error: any) {
    console.error('Get inbound email accounts error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get inbound email accounts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/inbound-email/accounts
 * Create a new inbound email account
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await req.json()

    // Validate required fields
    const requiredFields = ['name', 'email', 'imap']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate IMAP configuration
    const imapRequiredFields = ['host', 'port', 'username', 'password']
    for (const field of imapRequiredFields) {
      if (!body.imap[field]) {
        return NextResponse.json(
          { error: `Missing required IMAP field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Encrypt IMAP password
    const encryptedCredentials = encryptCredentials({
      smtpPassword: body.imap.password, // Reuse SMTP encryption key
    })

    const encryptedImap: ImapConfig = {
      host: body.imap.host,
      port: body.imap.port,
      secure: body.imap.secure !== false, // Default to true
      username: body.imap.username,
      password: encryptedCredentials.smtpPassword!,
    }

    const db = await getDatabase()
    const accountsCollection = db.collection<InboundEmailAccount>(
      COLLECTIONS.INBOUND_EMAIL_ACCOUNTS
    )

    // Check if email already exists for this org
    const existing = await accountsCollection.findOne({
      orgId: session.user.orgId,
      email: body.email,
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email account already exists' },
        { status: 409 }
      )
    }

    const now = new Date()
    const newAccount: Omit<InboundEmailAccount, '_id'> = {
      orgId: session.user.orgId,
      name: body.name,
      email: body.email,
      imap: encryptedImap,
      isActive: body.isActive !== false, // Default to true
      pollingInterval: body.pollingInterval || 60, // Default 60 seconds
      deleteAfterProcessing: body.deleteAfterProcessing || false,
      processedFolder: body.processedFolder,
      defaultAssignee: body.defaultAssignee,
      autoAssignmentEnabled: body.autoAssignmentEnabled || false,
      assignmentRules: body.assignmentRules || [],
      emailsProcessed: 0,
      ticketsCreated: 0,
      createdBy: session.user.id,
      createdAt: now,
      updatedAt: now,
    }

    const result = await accountsCollection.insertOne(newAccount as InboundEmailAccount)

    const created = {
      ...newAccount,
      _id: result.insertedId,
      imap: {
        ...encryptedImap,
        password: '***********', // Mask in response
      },
    }

    return NextResponse.json({ success: true, data: created })
  } catch (error: any) {
    console.error('Create inbound email account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create inbound email account' },
      { status: 500 }
    )
  }
}
