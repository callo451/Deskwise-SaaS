import { NextRequest, NextResponse } from 'next/server'
import { RemoteControlService } from '@/lib/services/remote-control'
import { z } from 'zod'

const signalSchema = z.object({
  sessionId: z.string(),
  token: z.string(),
  type: z.enum(['offer', 'answer', 'ice-candidate']),
  data: z.any(),
  sender: z.enum(['operator', 'agent']), // Track who sent this signal
})

// In-memory store for signalling messages (in production, use Redis or similar)
const signalStore = new Map<string, Array<{ type: string; data: any; timestamp: number; sender: 'operator' | 'agent' }>>()

// Clean up old messages every 5 minutes
setInterval(() => {
  const now = Date.now()
  const expiry = 10 * 60 * 1000 // 10 minutes

  for (const [sessionId, messages] of signalStore.entries()) {
    const filtered = messages.filter(msg => now - msg.timestamp < expiry)
    if (filtered.length === 0) {
      signalStore.delete(sessionId)
    } else if (filtered.length !== messages.length) {
      signalStore.set(sessionId, filtered)
    }
  }
}, 5 * 60 * 1000)

/**
 * POST /api/rc/signalling
 * Send a signalling message (offer, answer, or ICE candidate)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validation = signalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { sessionId, token, type, data, sender } = validation.data

    // Verify session token
    try {
      const tokenPayload = RemoteControlService.verifySessionToken(token)
      if (tokenPayload.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Store the signal
    if (!signalStore.has(sessionId)) {
      signalStore.set(sessionId, [])
    }

    const signals = signalStore.get(sessionId)!
    signals.push({
      type,
      data,
      timestamp: Date.now(),
      sender,
    })

    // Keep only last 100 messages per session
    if (signals.length > 100) {
      signals.shift()
    }

    return NextResponse.json({
      success: true,
      message: 'Signal sent successfully',
    })
  } catch (error) {
    console.error('Error sending signal:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send signal' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/rc/signalling?sessionId=xxx&token=xxx&since=timestamp&role=operator|agent
 * Poll for new signalling messages
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const token = searchParams.get('token')
    const since = parseInt(searchParams.get('since') || '0')
    const role = searchParams.get('role') as 'operator' | 'agent' | null

    if (!sessionId || !token) {
      return NextResponse.json(
        { error: 'Missing sessionId or token' },
        { status: 400 }
      )
    }

    if (!role || (role !== 'operator' && role !== 'agent')) {
      return NextResponse.json(
        { error: 'Missing or invalid role parameter (must be "operator" or "agent")' },
        { status: 400 }
      )
    }

    // Verify session token
    try {
      const tokenPayload = RemoteControlService.verifySessionToken(token)
      if (tokenPayload.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Get new signals, filtering out signals sent by the caller
    const signals = signalStore.get(sessionId) || []
    const newSignals = signals.filter(signal =>
      signal.timestamp > since && signal.sender !== role
    )

    return NextResponse.json({
      success: true,
      data: newSignals,
    })
  } catch (error) {
    console.error('Error polling signals:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to poll signals' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rc/signalling?sessionId=xxx&token=xxx
 * Clear signalling messages for a session
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')
    const token = searchParams.get('token')

    if (!sessionId || !token) {
      return NextResponse.json(
        { error: 'Missing sessionId or token' },
        { status: 400 }
      )
    }

    // Verify session token
    try {
      const tokenPayload = RemoteControlService.verifySessionToken(token)
      if (tokenPayload.sessionId !== sessionId) {
        return NextResponse.json({ error: 'Invalid session token' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    // Clear signals
    signalStore.delete(sessionId)

    return NextResponse.json({
      success: true,
      message: 'Signals cleared successfully',
    })
  } catch (error) {
    console.error('Error clearing signals:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to clear signals' },
      { status: 500 }
    )
  }
}
