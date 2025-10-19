import { NextRequest, NextResponse } from 'next/server'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'
import { RemoteControlService } from '@/lib/services/remote-control'

/**
 * GET /api/agent/rc/poll
 * Poll for pending remote control sessions
 *
 * This endpoint allows agents to discover when a technician wants to
 * initiate a remote control session with their asset.
 *
 * Authentication: Requires agent credential key in Authorization header
 *
 * Returns:
 * - 200 with session data if a pending/active session exists
 * - 204 No Content if no pending session
 * - 401 for missing/invalid credentials
 * - 403 for revoked credentials
 * - 500 for server errors
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract and validate agent credential from Authorization header
    const authHeader = request.headers.get('authorization')
    const credentialKey = authHeader?.replace('Bearer ', '')

    if (!credentialKey) {
      return NextResponse.json(
        { error: 'Missing authentication credential' },
        { status: 401 }
      )
    }

    // 2. Verify the credential and extract agent context
    const { valid, credential } = await EnrollmentTokenService.verifyCredential(credentialKey)

    if (!valid || !credential) {
      return NextResponse.json(
        { error: 'Invalid or revoked credential' },
        { status: 401 }
      )
    }

    // Check if credential is active (additional security check)
    if (!credential.isActive) {
      return NextResponse.json(
        { error: 'Credential has been revoked' },
        { status: 403 }
      )
    }

    // 3. Extract assetId and orgId from the credential
    const { assetId, orgId } = credential

    // 4. Check for pending or active remote control sessions for this asset
    // We look for both 'pending' (waiting for agent) and 'active' (already connected)
    const sessions = await RemoteControlService.getSessions(orgId, {
      assetId,
      limit: 1, // Only need the most recent session
    })

    // Filter to only pending or active sessions
    const relevantSession = sessions.find(
      (session) => session.status === 'pending' || session.status === 'active'
    )

    // 5. If no session found, return 204 No Content
    if (!relevantSession) {
      return new NextResponse(null, { status: 204 })
    }

    // 6. If session is pending, update status to active (agent has picked it up)
    let sessionData = relevantSession
    if (relevantSession.status === 'pending') {
      sessionData = await RemoteControlService.updateSessionStatus(
        relevantSession.sessionId,
        orgId,
        'active'
      )

      // Create audit log for agent connection
      await RemoteControlService.createAuditLog(orgId, {
        sessionId: relevantSession.sessionId,
        assetId: relevantSession.assetId,
        operatorUserId: relevantSession.operatorUserId,
        action: 'agent_connected',
        details: {
          agentId: credential.agentId,
          connectedAt: new Date().toISOString(),
        },
      })
    }

    // 7. Generate a fresh token for this session
    const token = RemoteControlService.generateSessionToken({
      sessionId: sessionData.sessionId,
      assetId: sessionData.assetId,
      orgId: sessionData.orgId,
      userId: sessionData.operatorUserId,
      permissions: ['view', 'input'],
    })

    // 8. Get ICE server configuration
    const iceServers = RemoteControlService.getICEServers()

    // 9. Return session info to agent
    return NextResponse.json({
      success: true,
      session: {
        sessionId: sessionData.sessionId,
        token,
        status: sessionData.status,
        operatorName: sessionData.operatorName,
        startedAt: sessionData.startedAt,
        policySnapshot: sessionData.policySnapshot,
        iceServers,
      },
    })
  } catch (error) {
    console.error('Error polling for remote control session:', error)

    // Return appropriate error based on error type
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Asset or session not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to poll for remote control session' },
      { status: 500 }
    )
  }
}
