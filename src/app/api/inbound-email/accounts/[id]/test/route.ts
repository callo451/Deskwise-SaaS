import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { InboundEmailAccount } from '@/lib/types'
import { IMAPService } from '@/lib/services/imap-service'
import { ObjectId } from 'mongodb'

/**
 * POST /api/inbound-email/accounts/[id]/test
 * Test IMAP connection for an account
 */
export async function POST(
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

    // Get account with decrypted credentials
    const account = await accountsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId,
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Test IMAP connection
    const testResult = await IMAPService.testConnection(account.imap)

    // Update last test result in database
    await accountsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastTestedAt: new Date(),
          lastTestResult: {
            success: testResult.success,
            message: testResult.message,
            timestamp: new Date(),
          },
        },
      }
    )

    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
    })
  } catch (error: any) {
    console.error('Test IMAP connection error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Failed to test IMAP connection',
      },
      { status: 500 }
    )
  }
}
