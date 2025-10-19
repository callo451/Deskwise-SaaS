'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Card } from '@/components/ui/card'

interface WebRTCViewportProps {
  sessionId: string
  token: string
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>
  onConnectionStateChange?: (state: string) => void
  onStatsUpdate?: (stats: QualityMetrics) => void
  videoRef?: React.RefObject<HTMLVideoElement>
}

interface QualityMetrics {
  fps: number
  latency: number
  bandwidth: number
  packetsLost: number
}

export interface WebRTCViewportHandle {
  sendMonitorChange: (monitorIndex: number) => void
}

export const WebRTCViewport = forwardRef<WebRTCViewportHandle, WebRTCViewportProps>(
  function WebRTCViewport({
    sessionId,
    token,
    iceServers,
    onConnectionStateChange,
    onStatsUpdate,
    videoRef: externalVideoRef,
  }, ref) {
  const internalVideoRef = useRef<HTMLVideoElement>(null)
  const videoRef = externalVideoRef || internalVideoRef
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const signalPollRef = useRef<NodeJS.Timeout | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [connectionState, setConnectionState] = useState<string>('new')
  const [lastSignalTime, setLastSignalTime] = useState<number>(0)

  useEffect(() => {
    initializeWebRTC()

    return () => {
      cleanup()
    }
  }, [sessionId])

  // Setup wheel event listener with passive: false to prevent scroll warnings
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const handleWheelEvent = (e: WheelEvent) => {
      e.preventDefault()
      sendInputEvent({
        type: 'mouse',
        eventType: 'scroll',
        deltaX: e.deltaX,
        deltaY: e.deltaY,
      })
    }

    viewport.addEventListener('wheel', handleWheelEvent, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheelEvent)
  }, [])

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    sendMonitorChange: (monitorIndex: number) => {
      console.log('[WebRTCViewport] Sending monitor change to agent:', monitorIndex)
      sendInputEvent({
        type: 'monitor',
        monitorIndex,
      })
    },
  }))

  const initializeWebRTC = async () => {
    try {
      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers,
      })

      peerConnectionRef.current = pc

      // Setup connection state monitoring
      pc.onconnectionstatechange = () => {
        const state = pc.connectionState
        setConnectionState(state)
        onConnectionStateChange?.(state)
        console.log('[WebRTC] Connection state:', state)
      }

      // Setup ICE candidate handling
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', {
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid,
            sdpMLineIndex: event.candidate.sdpMLineIndex,
          })
        }
      }

      // Add a recvonly video transceiver to signal we want to receive video
      // This MUST be done before creating the offer
      pc.addTransceiver('video', { direction: 'recvonly' })
      console.log('[WebRTC] Added recvonly video transceiver')

      // Handle incoming video track
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received track:', event.track.kind)
        console.log('[WebRTC] Track label:', event.track.label)
        console.log('[WebRTC] Track ID:', event.track.id)
        console.log('[WebRTC] Streams:', event.streams.length)

        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0]
          console.log('[WebRTC] Video srcObject set:', event.streams[0].id)

          // Log when video starts playing
          videoRef.current.onloadedmetadata = () => {
            console.log('[WebRTC] Video metadata loaded')
          }
          videoRef.current.onplay = () => {
            console.log('[WebRTC] Video started playing')
          }
          videoRef.current.onerror = (e) => {
            console.error('[WebRTC] Video error:', e)
          }
        }
      }

      // Create data channel for input
      const dataChannel = pc.createDataChannel('input')
      dataChannelRef.current = dataChannel

      dataChannel.onopen = () => {
        console.log('[WebRTC] Data channel opened')
      }

      dataChannel.onclose = () => {
        console.log('[WebRTC] Data channel closed')
      }

      // Create and send offer to start WebRTC connection
      console.log('[WebRTC] Creating offer...')
      const offer = await pc.createOffer()
      console.log('[WebRTC] Offer SDP:', offer.sdp)
      await pc.setLocalDescription(offer)
      await sendSignal('offer', { type: offer.type, sdp: offer.sdp })
      console.log('[WebRTC] Offer sent to agent')

      // Start signalling poll
      startSignallingPoll()
    } catch (error) {
      console.error('[WebRTC] Initialization error:', error)
    }
  }

  const sendSignal = async (type: string, data: any) => {
    try {
      const response = await fetch('/api/rc/signalling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          token,
          type,
          data,
          sender: 'operator',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send signal')
      }
    } catch (error) {
      console.error('[WebRTC] Error sending signal:', error)
    }
  }

  const startSignallingPoll = () => {
    const pollInterval = 2000 // Poll every 2 seconds

    const poll = async () => {
      try {
        const response = await fetch(
          `/api/rc/signalling?sessionId=${sessionId}&token=${token}&since=${lastSignalTime}&role=operator`
        )

        if (!response.ok) {
          throw new Error('Failed to poll signals')
        }

        const result = await response.json()

        if (result.success && result.data.length > 0) {
          // Update lastSignalTime FIRST to prevent fetching same signals again
          const latestTimestamp = result.data[result.data.length - 1].timestamp
          setLastSignalTime(latestTimestamp)

          // Then process all signals
          for (const signal of result.data) {
            await handleSignal(signal.type, signal.data)
          }
        }
      } catch (error) {
        console.error('[WebRTC] Error polling signals:', error)
      }
    }

    signalPollRef.current = setInterval(poll, pollInterval)
  }

  const handleSignal = async (type: string, data: any) => {
    const pc = peerConnectionRef.current
    if (!pc) return

    try {
      switch (type) {
        case 'answer':
          console.log('[WebRTC] Received answer from agent')
          console.log('[WebRTC] Answer SDP:', data.sdp)
          // Only set remote description if we're in the correct state
          if (pc.signalingState !== 'have-local-offer') {
            console.log('[WebRTC] Ignoring answer - wrong state:', pc.signalingState)
            return
          }
          await pc.setRemoteDescription(new RTCSessionDescription(data))
          console.log('[WebRTC] Set remote description')
          console.log('[WebRTC] Remote tracks count:', pc.getReceivers().length)
          break

        case 'ice-candidate':
          console.log('[WebRTC] Received ICE candidate from agent')
          await pc.addIceCandidate(new RTCIceCandidate(data))
          console.log('[WebRTC] Added ICE candidate')
          break

        default:
          console.log('[WebRTC] Unknown signal type:', type)
      }
    } catch (error) {
      console.error('[WebRTC] Error handling signal:', error)
    }
  }

  const sendInputEvent = (event: any) => {
    const dataChannel = dataChannelRef.current
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(event))
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 1920 // Assuming 1920x1080
    const y = ((e.clientY - rect.top) / rect.height) * 1080

    sendInputEvent({
      type: 'mouse',
      eventType: 'move',
      x: Math.floor(x),
      y: Math.floor(y),
    })
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    let button = 'left'
    if (e.button === 1) button = 'middle'
    else if (e.button === 2) button = 'right'

    sendInputEvent({
      type: 'mouse',
      eventType: 'button',
      button,
      down: true,
    })
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    let button = 'left'
    if (e.button === 1) button = 'middle'
    else if (e.button === 2) button = 'right'

    sendInputEvent({
      type: 'mouse',
      eventType: 'button',
      button,
      down: false,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    sendInputEvent({
      type: 'keyboard',
      key: e.key,
      down: true,
    })
  }

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault()
    sendInputEvent({
      type: 'keyboard',
      key: e.key,
      down: false,
    })
  }

  const cleanup = () => {
    if (signalPollRef.current) {
      clearInterval(signalPollRef.current)
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close()
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
  }

  return (
    <Card className="relative bg-black overflow-hidden h-full w-full">
      <div
        ref={viewportRef}
        className="relative w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onContextMenu={(e) => e.preventDefault()}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        />

        {/* Connection Status Overlay */}
        {connectionState !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="text-center">
              {/* Animated Spinner */}
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              </div>

              {/* Status Text */}
              <div className="space-y-2">
                <p className="text-white text-lg font-semibold">
                  {connectionState === 'new' && 'Initializing Connection...'}
                  {connectionState === 'connecting' && 'Establishing Secure Link...'}
                  {connectionState === 'disconnected' && 'Connection Lost'}
                  {connectionState === 'failed' && 'Connection Failed'}
                </p>
                <p className="text-gray-400 text-sm">
                  {connectionState === 'new' && 'Setting up WebRTC peer connection'}
                  {connectionState === 'connecting' && 'Negotiating with remote agent'}
                  {connectionState === 'disconnected' && 'Attempting to reconnect...'}
                  {connectionState === 'failed' && 'Unable to establish connection'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Connection Info */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded">
        {connectionState}
      </div>
    </Card>
  )
  }
)

WebRTCViewport.displayName = 'WebRTCViewport'
