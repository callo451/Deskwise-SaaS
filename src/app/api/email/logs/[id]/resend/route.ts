import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, COLLECTIONS } from '@/lib/mongodb'
import { EmailDeliveryLog } from '@/lib/types'
import { EmailSettingsService } from '@/lib/services/email-settings'
import { SESEmailService } from '@/lib/services/email-ses'
import { ObjectId } from 'mongodb'

/**
 * POST /api/email/logs/[id]/resend
 * Resend a failed email
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

    // Check permission (admin only)
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params

    const db = await getDatabase()
    const logsCollection = db.collection<EmailDeliveryLog>(COLLECTIONS.EMAIL_DELIVERY_LOGS)

    // Get the original email log
    const originalLog = await logsCollection.findOne({
      _id: new ObjectId(id),
      orgId: session.user.orgId
    })

    if (!originalLog) {
      return NextResponse.json(
        { error: 'Email log not found' },
        { status: 404 }
      )
    }

    // Only allow resending failed emails
    if (originalLog.status !== 'failed') {
      return NextResponse.json(
        { error: 'Can only resend failed emails' },
        { status: 400 }
      )
    }

    // Check retry count
    if (originalLog.retryCount >= (originalLog.maxRetries || 3)) {
      return NextResponse.json(
        { error: 'Maximum retry attempts reached' },
        { status: 400 }
      )
    }

    // Get email settings with decrypted credentials
    const emailSettings = await EmailSettingsService.getSettings(session.user.orgId, true)

    if (!emailSettings || !emailSettings.isConfigured) {
      return NextResponse.json(
        { error: 'Email settings not configured' },
        { status: 400 }
      )
    }

    // Check rate limits
    const rateLimits = await EmailSettingsService.checkRateLimits(session.user.orgId)

    if (!rateLimits.canSend) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          details: {
            hourlyLimit: rateLimits.hourlyLimit,
            dailyLimit: rateLimits.dailyLimit,
            hourlyRemaining: rateLimits.hourlyRemaining,
            dailyRemaining: rateLimits.dailyRemaining
          }
        },
        { status: 429 }
      )
    }

    // Update status to sending
    await logsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { status: 'sending' },
        $inc: { retryCount: 1 },
        $push: {
          statusHistory: {
            status: 'sending',
            timestamp: new Date(),
            message: 'Manual resend initiated'
          }
        }
      }
    )

    try {
      // Send email via SES
      const sesService = new SESEmailService(emailSettings)
      const result = await sesService.sendEmail(
        originalLog.to,
        originalLog.subject,
        originalLog.htmlBody,
        originalLog.textBody
      )

      // Update status to sent
      await logsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'sent',
            sesMessageId: result.messageId,
            sesResponse: result.response,
            sentAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'sent',
              timestamp: new Date(),
              message: 'Email resent successfully'
            }
          }
        }
      )

      // Increment rate limits
      await EmailSettingsService.incrementRateLimits(session.user.orgId, 1)

      return NextResponse.json({
        success: true,
        message: 'Email resent successfully',
        data: {
          messageId: result.messageId
        }
      })
    } catch (error: any) {
      console.error('Email resend error:', error)

      // Update status to failed
      await logsCollection.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            status: 'failed',
            error: {
              message: error.message,
              code: error.code,
              timestamp: new Date(),
            },
            failedAt: new Date(),
          },
          $push: {
            statusHistory: {
              status: 'failed',
              timestamp: new Date(),
              message: error.message
            }
          }
        }
      )

      return NextResponse.json(
        {
          error: 'Failed to resend email',
          details: error.message
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Resend email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resend email' },
      { status: 500 }
    )
  }
}
