import { NextRequest, NextResponse } from 'next/server'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'

/**
 * POST /api/agent/enroll - Exchange enrollment token for agent credential
 *
 * This is the public endpoint that agents call during initial setup.
 * The agent provides the enrollment token and receives a long-lived credential key.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      enrollmentToken,
      agentId,
      hostname,
      platform,
      arch,
      systemInfo,
      hardwareInfo,
      networkInfo
    } = body

    // Validate required fields
    if (!enrollmentToken) {
      return NextResponse.json(
        { error: 'Enrollment token is required' },
        { status: 400 }
      )
    }

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      )
    }

    // Attempt to enroll the agent with comprehensive system information
    const result = await EnrollmentTokenService.enrollAgent(
      enrollmentToken,
      agentId,
      {
        hostname,
        platform,
        arch,
        systemInfo,
        hardwareInfo,
        networkInfo,
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Enrollment failed' },
        { status: 400 }
      )
    }

    // Return the credential key and asset ID to the agent
    return NextResponse.json({
      success: true,
      credentialKey: result.credentialKey,
      assetId: result.assetId,
      message: 'Agent enrolled successfully',
    })
  } catch (error) {
    console.error('Error during agent enrollment:', error)
    return NextResponse.json(
      { error: 'Internal server error during enrollment' },
      { status: 500 }
    )
  }
}
