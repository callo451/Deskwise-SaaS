import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RemoteControlService } from '@/lib/services/remote-control'
import { z } from 'zod'

const updatePolicySchema = z.object({
  enabled: z.boolean().optional(),
  requireConsent: z.boolean().optional(),
  idleTimeout: z.number().min(1).max(480).optional(), // Max 8 hours
  allowClipboard: z.boolean().optional(),
  allowFileTransfer: z.boolean().optional(),
  allowedRoles: z.array(z.enum(['admin', 'technician', 'user'])).optional(),
  consentMessage: z.string().optional(),
})

/**
 * GET /api/rc/policy
 * Get remote control policy for the organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, userId } = session.user

    const policy = await RemoteControlService.getOrCreatePolicy(orgId, userId)

    return NextResponse.json({
      success: true,
      data: policy,
    })
  } catch (error) {
    console.error('Error fetching remote control policy:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch policy' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/rc/policy
 * Update remote control policy
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.orgId || session?.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin role required' },
        { status: 403 }
      )
    }

    const { orgId, userId } = session.user

    const body = await req.json()
    const validation = updatePolicySchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const updatedPolicy = await RemoteControlService.updatePolicy(
      orgId,
      validation.data,
      userId
    )

    return NextResponse.json({
      success: true,
      data: updatedPolicy,
      message: 'Policy updated successfully',
    })
  } catch (error) {
    console.error('Error updating remote control policy:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update policy' },
      { status: 500 }
    )
  }
}
