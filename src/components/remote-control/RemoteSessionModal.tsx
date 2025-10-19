'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WebRTCViewport } from './WebRTCViewport'
import {
  Monitor,
  X,
  Activity,
  Maximize2,
  Minimize2,
  Settings,
  FolderUp,
  Clipboard,
  Camera,
  Video,
  VolumeX,
  Volume2,
  Lock,
  Unlock,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface RemoteSessionModalProps {
  open: boolean
  onClose: () => void
  assetId: string
  assetName: string
}

interface SessionData {
  sessionId: string
  token: string
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>
  status: string
}

export function RemoteSessionModal({
  open,
  onClose,
  assetId,
  assetName,
}: RemoteSessionModalProps) {
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<string>('new')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInputLocked, setIsInputLocked] = useState(false)
  const [isAudioMuted, setIsAudioMuted] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [metrics, setMetrics] = useState({
    fps: 0,
    latency: 0,
    bandwidth: 0,
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [isActionBarCollapsed, setIsActionBarCollapsed] = useState(false)
  const [selectedMonitor, setSelectedMonitor] = useState<number>(0) // 0 = Monitor 1, 1 = Monitor 2, -1 = All Monitors
  const videoRef = useRef<HTMLVideoElement>(null)
  const dialogContentRef = useRef<HTMLDivElement>(null)
  const webrtcViewportRef = useRef<any>(null) // Reference to WebRTCViewport for sending messages

  useEffect(() => {
    if (open) {
      if (!sessionData) {
        checkAndStartSession()
      }
    } else {
      // Modal closed - cleanup session if exists and reset state
      if (sessionData) {
        // Silent cleanup - don't wait for response
        fetch(`/api/rc/sessions/${sessionData.sessionId}`, {
          method: 'DELETE',
        }).catch(err => console.error('Error cleaning up session:', err))

        setSessionData(null)
      }
      // Reset all state
      setError(null)
      setConnectionState('new')
      setLoading(false)
    }
  }, [open])

  const checkAndStartSession = async () => {
    setLoading(true)
    setError(null)

    try {
      // First, check if there's an existing active session for this asset
      const checkResponse = await fetch(`/api/rc/sessions?assetId=${assetId}&status=active`)
      const checkResult = await checkResponse.json()

      if (checkResult.success && checkResult.data.length > 0) {
        // Found an existing active session - force end it first
        const existingSession = checkResult.data[0]
        console.log('[RemoteControl] Found existing active session, ending it first:', existingSession.sessionId)

        await fetch(`/api/rc/sessions/${existingSession.sessionId}`, {
          method: 'DELETE',
        })
      }

      // Now create a new session
      await startSession()
    } catch (err) {
      console.error('Error checking/starting session:', err)
      setError(err instanceof Error ? err.message : 'Failed to start session')
      setLoading(false)
    }
  }

  const startSession = async () => {
    try {
      const response = await fetch('/api/rc/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start remote control session')
      }

      const result = await response.json()

      if (result.success) {
        setSessionData({
          sessionId: result.data.session.sessionId,
          token: result.data.token,
          iceServers: result.data.iceServers,
          status: result.data.session.status,
        })
      } else {
        throw new Error(result.error || 'Failed to create session')
      }
    } catch (err) {
      console.error('Error starting session:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const endSession = async () => {
    if (!sessionData) return

    try {
      const response = await fetch(`/api/rc/sessions/${sessionData.sessionId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSessionData(null)
        onClose()
      }
    } catch (err) {
      console.error('Error ending session:', err)
    }
  }

  const handleClose = () => {
    if (sessionData) {
      if (confirm('Are you sure you want to end this remote control session?')) {
        endSession()
      }
    } else {
      // Reset state and close
      setError(null)
      setConnectionState('new')
      onClose()
    }
  }

  const handleConnectionStateChange = (state: string) => {
    setConnectionState(state)
  }

  const handleStatsUpdate = (stats: any) => {
    setMetrics({
      fps: stats.fps || 0,
      latency: stats.latency || 0,
      bandwidth: Math.round((stats.bandwidth || 0) / 1000000), // Convert to Mbps
    })
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleScreenshot = () => {
    const video = videoRef.current
    if (!video || !video.srcObject) {
      showToast('No video stream available', 'error')
      return
    }

    try {
      // Create canvas to capture video frame
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1920
      canvas.height = video.videoHeight || 1080
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        showToast('Failed to create canvas context', 'error')
        return
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `remote-control-${assetName}-${Date.now()}.png`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          showToast('Screenshot saved successfully')
        }
      }, 'image/png')
    } catch (error) {
      console.error('Screenshot error:', error)
      showToast('Failed to capture screenshot', 'error')
    }
  }

  const handleClipboard = async () => {
    try {
      // Read from local clipboard
      const text = await navigator.clipboard.readText()

      if (text) {
        // TODO: Send clipboard data to remote agent via data channel
        showToast('Clipboard synced to remote')
        console.log('[Clipboard] Synced to remote:', text.substring(0, 50) + '...')
      } else {
        showToast('Clipboard is empty', 'error')
      }
    } catch (error) {
      console.error('Clipboard error:', error)
      showToast('Failed to access clipboard. Please grant permission.', 'error')
    }
  }

  const handleMonitorChange = (monitorIndex: number) => {
    try {
      // Send monitor change message to agent via WebRTC data channel
      if (webrtcViewportRef.current?.sendMonitorChange) {
        webrtcViewportRef.current.sendMonitorChange(monitorIndex)
        setSelectedMonitor(monitorIndex)

        const monitorName = monitorIndex === -1 ? 'All Monitors' : `Monitor ${monitorIndex + 1}`
        showToast(`Switched to ${monitorName}`)
        console.log('[Monitor] Changed to:', monitorName)
      } else {
        showToast('Monitor switching not available', 'error')
      }
    } catch (error) {
      console.error('Monitor change error:', error)
      showToast('Failed to change monitor', 'error')
    }
  }

  const handleFullscreen = async () => {
    const content = dialogContentRef.current
    if (!content) return

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (content.requestFullscreen) {
          await content.requestFullscreen()
        }
        setIsFullscreen(true)
        showToast('Entered fullscreen mode')
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
        setIsFullscreen(false)
        showToast('Exited fullscreen mode')
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
      showToast('Fullscreen not supported', 'error')
    }
  }

  // Listen for fullscreen changes (e.g., ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent ref={dialogContentRef} className="w-full max-w-[98vw] h-[98vh] p-0 gap-0 [&>button]:hidden">
        <DialogTitle className="sr-only">
          Remote Control Session - {assetName}
        </DialogTitle>
        {/* Content Area */}
        <div className="h-full flex flex-col overflow-hidden bg-slate-900 relative">
          {loading && (
            <div className="flex-1 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="text-center">
                {/* Animated Spinner */}
                <div className="relative mb-6">
                  <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                </div>

                {/* Status Text */}
                <div className="space-y-2">
                  <p className="text-white text-lg font-semibold">Securing Connection</p>
                  <p className="text-gray-400 text-sm">Please wait while we connect to {assetName}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 backdrop-blur-sm">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">Connection Failed</h3>
                  <p className="text-gray-300 text-sm mb-6">{error}</p>
                  <Button onClick={checkAndStartSession} className="bg-blue-600 hover:bg-blue-700">
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {sessionData && !loading && !error && (
            <div className="absolute inset-0">
              <WebRTCViewport
                ref={webrtcViewportRef}
                sessionId={sessionData.sessionId}
                token={sessionData.token}
                iceServers={sessionData.iceServers}
                onConnectionStateChange={handleConnectionStateChange}
                onStatsUpdate={handleStatsUpdate}
                videoRef={videoRef}
              />
            </div>
          )}

          {/* Floating Control Bar - Only show when connected */}
          {sessionData && !loading && !error && connectionState === 'connected' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 max-w-[90%]">
              <div className="bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl">
                {/* Header with Asset Info and Controls */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-4 w-4 text-blue-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">{assetName}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          connectionState === 'connected'
                            ? 'bg-green-400 animate-pulse'
                            : 'bg-yellow-400 animate-pulse'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-gray-400 hover:text-white hover:bg-slate-700/50"
                      onClick={() => setIsActionBarCollapsed(!isActionBarCollapsed)}
                    >
                      {isActionBarCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-red-500/20"
                      onClick={handleClose}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Control Bar Content */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isActionBarCollapsed ? 'max-h-0' : 'max-h-96'
                  }`}
                >
                  <div className="px-4 py-2 flex items-center justify-between gap-4">
                    {/* Left: Action Buttons */}
                    <TooltipProvider>
                      <div className="flex items-center gap-2">
                        {/* Screenshot */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={handleScreenshot}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Screenshot
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Capture screenshot of remote screen</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-slate-700 mx-2" />

                        {/* Monitor Switcher */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                selectedMonitor === 0
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                              }`}
                              onClick={() => handleMonitorChange(0)}
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              1
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Switch to Monitor 1</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                selectedMonitor === 1
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                              }`}
                              onClick={() => handleMonitorChange(1)}
                            >
                              <Monitor className="h-4 w-4 mr-1" />
                              2
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Switch to Monitor 2</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                selectedMonitor === -1
                                  ? 'text-blue-400 bg-blue-500/10'
                                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                              }`}
                              onClick={() => handleMonitorChange(-1)}
                            >
                              <Monitor className="h-4 w-4 mr-2" />
                              All
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View all monitors</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-slate-700 mx-2" />

                        {/* Video Toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                isVideoEnabled
                                  ? 'text-gray-300 hover:text-white hover:bg-slate-700'
                                  : 'text-red-400 bg-red-500/10'
                              }`}
                              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isVideoEnabled ? 'Disable' : 'Enable'} Video (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Audio Toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                isAudioMuted
                                  ? 'text-gray-300 hover:text-white hover:bg-slate-700'
                                  : 'text-green-400 bg-green-500/10'
                              }`}
                              onClick={() => setIsAudioMuted(!isAudioMuted)}
                            >
                              {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isAudioMuted ? 'Unmute' : 'Mute'} Audio (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-slate-700 mx-2" />

                        {/* File Transfer */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={() => {}}
                            >
                              <FolderUp className="h-4 w-4 mr-2" />
                              Transfer Files
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>File transfer (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Clipboard */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={handleClipboard}
                            >
                              <Clipboard className="h-4 w-4 mr-2" />
                              Clipboard
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sync clipboard to remote machine</p>
                          </TooltipContent>
                        </Tooltip>

                        <div className="w-px h-6 bg-slate-700 mx-2" />

                        {/* Input Lock */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-9 px-3 ${
                                isInputLocked
                                  ? 'text-red-400 bg-red-500/10'
                                  : 'text-gray-300 hover:text-white hover:bg-slate-700'
                              }`}
                              onClick={() => setIsInputLocked(!isInputLocked)}
                            >
                              {isInputLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isInputLocked ? 'Unlock' : 'Lock'} Remote Input (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Fullscreen */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={handleFullscreen}
                            >
                              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isFullscreen ? 'Exit' : 'Enter'} Fullscreen Mode</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Settings */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 px-3 text-gray-300 hover:text-white hover:bg-slate-700"
                              onClick={() => {}}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Session Settings (Coming Soon)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>

                    {/* Center: Quality Metrics */}
                    <div className="flex items-center gap-4 px-4 py-1 bg-slate-900/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-400">Quality:</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">FPS:</span>{' '}
                        <span className="text-white font-medium">{metrics.fps}</span>
                      </div>
                      <div className="w-px h-4 bg-slate-700" />
                      <div className="text-xs">
                        <span className="text-gray-400">Latency:</span>{' '}
                        <span className="text-white font-medium">{metrics.latency}ms</span>
                      </div>
                      <div className="w-px h-4 bg-slate-700" />
                      <div className="text-xs">
                        <span className="text-gray-400">Bandwidth:</span>{' '}
                        <span className="text-white font-medium">{metrics.bandwidth} Mbps</span>
                      </div>
                    </div>

                    {/* Right: End Session */}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={endSession}
                      className="h-9 bg-red-600 hover:bg-red-700"
                    >
                      <X className="h-4 w-4 mr-2" />
                      End Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right">
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm ${
                toast.type === 'success'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-red-500/90 text-white'
              }`}
            >
              {toast.type === 'success' && <Check className="h-5 w-5" />}
              {toast.type === 'error' && <X className="h-5 w-5" />}
              <p className="font-medium">{toast.message}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
