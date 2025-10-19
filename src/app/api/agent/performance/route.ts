import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AssetService, type PerformanceSnapshot } from '@/lib/services/assets'
import { EnrollmentTokenService } from '@/lib/services/enrollment-tokens'
import { z } from 'zod'

// Schema for validating performance data from agents
const performanceSnapshotSchema = z.object({
  agentId: z.string(),
  assetId: z.string(),
  timestamp: z.string(),
  timeWindow: z.string(),
  capabilities: z.object({
    remoteControl: z.boolean().optional(),
    screenCapture: z.boolean().optional(),
    inputInjection: z.boolean().optional(),
    webrtcSupported: z.boolean().optional(),
    platform: z.string().optional(),
    agentVersion: z.string().optional(),
  }).optional(),
  performanceData: z.object({
    cpu: z.object({
      usage: z.number(),
      temperature: z.number().optional(),
      frequency: z.number().optional(),
      perCore: z.array(z.number()).optional(),
    }),
    memory: z.object({
      usagePercent: z.number(),
      usedBytes: z.number(),
      totalBytes: z.number(),
      availableBytes: z.number(),
      swapUsed: z.number().optional(),
    }),
    disk: z.array(
      z.object({
        name: z.string(),
        usagePercent: z.number(),
        totalBytes: z.number(),
        usedBytes: z.number(),
        freeBytes: z.number(),
        readBytesPerSec: z.number().optional(),
        writeBytesPerSec: z.number().optional(),
        readOpsPerSec: z.number().optional(),
        writeOpsPerSec: z.number().optional(),
      })
    ),
    network: z.object({
      totalUsage: z.number(),
      interfaces: z.array(
        z.object({
          name: z.string(),
          bytesRecvPerSec: z.number(),
          bytesSentPerSec: z.number(),
          packetsRecvPerSec: z.number(),
          packetsSentPerSec: z.number(),
        })
      ),
    }),
    system: z.object({
      uptime: z.number(),
      processCount: z.number(),
      threadCount: z.number(),
    }),
  }),
})

/**
 * POST /api/agent/performance - Ingest performance data from monitoring agents
 *
 * This endpoint receives performance snapshots from the multi-OS monitoring agents
 * and stores them for real-time monitoring and historical analysis.
 *
 * Authentication: Uses agent credential key in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate using agent credential key
    const authHeader = request.headers.get('authorization')
    const credentialKey = authHeader?.replace('Bearer ', '')

    if (!credentialKey) {
      return NextResponse.json(
        { error: 'Missing authentication credential' },
        { status: 401 }
      )
    }

    // Verify the credential
    const { valid, credential } = await EnrollmentTokenService.verifyCredential(credentialKey)

    if (!valid || !credential) {
      return NextResponse.json(
        { error: 'Invalid or revoked credential' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = performanceSnapshotSchema.parse(body)

    // Use orgId and assetId from the credential (prevents spoofing)
    const orgId = credential.orgId
    const assetId = credential.assetId

    // Validate that the agent is sending data for the correct asset
    if (validated.assetId !== assetId) {
      return NextResponse.json(
        { error: 'Asset ID mismatch - agent is not authorized for this asset' },
        { status: 403 }
      )
    }

    const snapshot: PerformanceSnapshot = {
      agentId: validated.agentId,
      assetId: validated.assetId,
      timestamp: new Date(validated.timestamp),
      timeWindow: validated.timeWindow,
      performanceData: validated.performanceData,
    }

    await AssetService.storePerformanceSnapshot(orgId, snapshot)

    // Update asset capabilities if provided
    if (validated.capabilities) {
      console.log('[Performance API] Capabilities received from agent:', JSON.stringify(validated.capabilities))
      console.log('[Performance API] Updating asset capabilities for assetId:', assetId, 'orgId:', orgId)
      await AssetService.updateAssetCapabilities(assetId, orgId, validated.capabilities)
      console.log('[Performance API] Asset capabilities updated successfully')
    } else {
      console.log('[Performance API] No capabilities provided in this snapshot')
    }

    return NextResponse.json({
      success: true,
      message: 'Performance snapshot stored successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error storing performance snapshot:', error)
    return NextResponse.json(
      { error: 'Failed to store performance snapshot' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/agent/performance - Retrieve performance data for an asset
 *
 * Query parameters:
 * - assetId: Asset ID to retrieve performance data for
 * - timeWindow: Time window (1min, 5min, 15min, 1hour, 1day)
 * - limit: Maximum number of snapshots to return
 *
 * Authentication: Supports both user session and agent credential
 */
export async function GET(request: NextRequest) {
  try {
    let orgId: string | undefined

    // Check for user session authentication first (for dashboard access)
    const session = await getServerSession(authOptions)
    if (session?.user?.orgId) {
      orgId = session.user.orgId
    } else {
      // Fall back to agent credential authentication
      const authHeader = request.headers.get('authorization')
      const credentialKey = authHeader?.replace('Bearer ', '')

      if (!credentialKey) {
        return NextResponse.json(
          { error: 'Missing authentication' },
          { status: 401 }
        )
      }

      // Verify the credential
      const { valid, credential } = await EnrollmentTokenService.verifyCredential(credentialKey)

      if (!valid || !credential) {
        return NextResponse.json(
          { error: 'Invalid or revoked credential' },
          { status: 401 }
        )
      }

      orgId = credential.orgId
    }

    if (!orgId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get('assetId')
    const timeWindow = searchParams.get('timeWindow') || '1hour'
    const limit = parseInt(searchParams.get('limit') || '60')

    if (!assetId) {
      return NextResponse.json(
        { error: 'Missing assetId parameter' },
        { status: 400 }
      )
    }

    const snapshots = await AssetService.getAssetPerformance(
      assetId,
      orgId,
      timeWindow,
      limit
    )

    return NextResponse.json({
      success: true,
      data: snapshots,
    })
  } catch (error) {
    console.error('Error fetching performance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 }
    )
  }
}
