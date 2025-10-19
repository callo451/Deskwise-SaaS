# Deskwise Remote Control Integration

Comprehensive documentation for the integrated remote control feature in the Deskwise monitoring agent.

---

## Table of Contents

1. [Overview](#overview)
2. [How Remote Control Works](#how-remote-control-works)
3. [Configuration](#configuration)
4. [Building & Deployment](#building--deployment)
5. [Troubleshooting](#troubleshooting)
6. [Development](#development)
7. [Security Considerations](#security-considerations)

---

## Overview

### What is Remote Control Integration?

The Deskwise monitoring agent now includes **integrated remote control functionality**, allowing technicians to remotely access and control monitored workstations and servers directly from the Deskwise dashboard. This eliminates the need for separate remote control software like TeamViewer, AnyDesk, or RDP.

### Key Features

- **Unified Agent**: Single agent binary handles both performance monitoring AND remote control
- **On-Demand Sessions**: Remote control sessions start only when requested by technicians
- **WebRTC-Based**: Browser-based remote control using modern WebRTC technology
- **Automatic Discovery**: Agent automatically detects when a session is requested
- **Capability Reporting**: Agent reports its remote control capabilities to the server
- **Security-First**: Built-in authentication, encryption, and audit logging

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Deskwise Dashboard                          │
│  (Technician clicks "Remote Control" button on asset detail page)  │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ 1. POST /api/rc/sessions
                         │    (Creates session in database)
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Deskwise Server                              │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │ MongoDB Collections:                                        │   │
│  │ - rc_sessions (stores session state)                       │   │
│  │ - rc_signalling (stores WebRTC signalling messages)        │   │
│  │ - rc_audit_logs (stores all session events)                │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ 2. Agent polls every 10 seconds
                         │    GET /api/agent/rc/poll
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Monitoring Agent                               │
│  (Running on monitored workstation/server)                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Performance Monitoring                                        │ │
│  │ - Collects metrics every 60s (default)                       │ │
│  │ - Sends metrics to /api/agent/performance                    │ │
│  │ - Includes capabilities in performance data                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Remote Control Session Polling                                │ │
│  │ - Polls /api/agent/rc/poll every 10s                         │ │
│  │ - Discovers pending sessions                                 │ │
│  │ - Starts WebRTC connection when session found                │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Remote Control Manager                                        │ │
│  │ - Handles session lifecycle                                  │ │
│  │ - Manages WebRTC peer connection                             │ │
│  │ - Screen capture (30 FPS target)                             │ │
│  │ - Input injection (mouse & keyboard)                         │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                         │
                         │ 3. WebRTC signalling via
                         │    /api/rc/signalling
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Technician Browser                              │
│  - Receives video stream (screen capture)                           │
│  - Sends input events (mouse & keyboard)                            │
│  - Real-time, peer-to-peer connection                               │
└─────────────────────────────────────────────────────────────────────┘
```

### How It Works with the Existing Agent

The remote control feature is **fully integrated** into the existing monitoring agent:

1. **Same Binary**: No separate installation needed - remote control is built into the monitoring agent
2. **Same Enrollment**: Uses the existing enrollment token system for authentication
3. **Same Credentials**: Uses the same agent credentials for all API calls
4. **Automatic Activation**: Remote control capabilities are automatically reported and enabled
5. **Zero Configuration**: No additional setup required beyond normal agent enrollment

The agent runs two parallel loops:
- **Performance Monitoring Loop**: Collects and sends metrics every 60 seconds (default)
- **Session Polling Loop**: Checks for remote control sessions every 10 seconds

Both loops use the same configuration, credentials, and server connection.

---

## How Remote Control Works

### Step-by-Step Flow

#### Step 1: Technician Initiates Session

1. Technician navigates to an asset detail page in Deskwise dashboard
2. Clicks the **"Remote Control"** button
3. Dashboard sends `POST /api/rc/sessions` with `assetId`
4. Server creates a session record in MongoDB with status `pending`
5. Dashboard opens WebRTC modal and begins waiting for agent connection

#### Step 2: Agent Discovers Session

1. Agent's polling loop runs every 10 seconds
2. Agent sends `GET /api/agent/rc/poll` with its credential key
3. Server checks for pending/active sessions for this asset
4. If session exists, server responds with session details:
   ```json
   {
     "success": true,
     "session": {
       "sessionId": "rc_abc123xyz",
       "token": "session_token_here",
       "status": "pending",
       "operatorName": "John Smith",
       "startedAt": "2025-10-08T10:30:00Z",
       "policySnapshot": { "requireConsent": false, "recordSession": true },
       "iceServers": [
         { "urls": ["stun:stun.l.google.com:19302"] }
       ]
     }
   }
   ```

#### Step 3: Agent Starts Session

1. Agent receives session info and calls `rcManager.StartSession()`
2. Session status changes from `pending` to `active`
3. Agent initializes components:
   - **Screen Capture**: Starts capturing screen at 30 FPS
   - **Input Handler**: Prepares to receive mouse/keyboard events
   - **WebRTC Peer**: Creates peer connection with ICE servers
4. Agent creates WebRTC offer (SDP)
5. Agent sends offer to server via `POST /api/rc/signalling`

#### Step 4: WebRTC Negotiation

1. Dashboard polls signalling endpoint and receives agent's offer
2. Dashboard creates WebRTC answer (SDP)
3. Dashboard sends answer to server via `POST /api/rc/signalling`
4. Agent polls signalling endpoint and receives answer
5. Agent sets remote description (answer)
6. Both sides exchange ICE candidates via signalling endpoint
7. WebRTC peer-to-peer connection established

#### Step 5: Active Remote Control Session

1. Agent captures screen at 30 FPS and sends frames via WebRTC video track
2. Technician sees live screen feed in browser
3. Technician's mouse/keyboard input sent via WebRTC data channel
4. Agent receives input events and injects them into the OS
5. Session continues until technician disconnects or timeout occurs

#### Step 6: Session Cleanup

1. Technician closes modal or session ends
2. Dashboard sends `PUT /api/rc/sessions/{id}` with status `ended`
3. Agent polling detects session ended
4. Agent calls `rcManager.StopSession()`
5. Screen capture stops, WebRTC connection closes
6. Session audit log created with duration and events

### Agent Polling Mechanism

**Polling Interval**: Every 10 seconds (configurable via `rcTicker` in `main.go`)

**Polling Endpoint**: `GET /api/agent/rc/poll`

**Authentication**: Uses agent credential key in `Authorization: Bearer {credentialKey}` header

**Response Codes**:
- `200 OK`: Session found, returns session details
- `204 No Content`: No pending session (normal case)
- `401 Unauthorized`: Invalid or missing credentials
- `403 Forbidden`: Credentials revoked
- `500 Internal Server Error`: Server error

**Efficient Design**:
- Polling is silent - no logs unless session found
- Only polls when agent is running and enrolled
- Uses lightweight HTTP GET with minimal payload
- Server-side filtering ensures only relevant sessions returned

### Session Lifecycle

```
Lifecycle States:
pending → active → ended
                ↓
             (error state: failed)
```

1. **Pending**: Session created, waiting for agent to pick it up
2. **Active**: Agent connected, WebRTC established
3. **Ended**: Session completed normally
4. **Failed**: Session failed to establish or encountered error

**Timeouts**:
- Pending sessions timeout after 5 minutes (configurable in policy)
- Active sessions timeout after inactivity (configurable in policy)
- Agent automatically cleans up failed connections

### Capability Reporting

The agent reports its remote control capabilities in the performance snapshot sent to `/api/agent/performance`:

```json
{
  "agentId": "windows-DESKTOP-ABC-1696234567",
  "assetId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "timestamp": "2025-10-08T10:30:00Z",
  "performanceData": { ... },
  "capabilities": {
    "remoteControl": true,
    "screenCapture": true,
    "inputInjection": true,
    "webrtcSupported": true,
    "platform": "windows",
    "agentVersion": "1.0.0"
  }
}
```

**Capability Detection**:
- Reported on every performance snapshot
- Server stores capabilities in asset record
- Dashboard uses capabilities to show/hide Remote Control button
- If `remoteControl: false`, button is disabled with tooltip explanation

**Platform-Specific Detection**:
- **Windows**: DXGI Desktop Duplication API (screen) + SendInput API (input)
- **Linux**: X11/Wayland capture (screen) + XTest extension (input)
- **macOS**: CGDisplayStream (screen) + CGEvent (input)

Currently all platforms report `true` for all capabilities (MVP implementation). Platform-specific APIs are marked as `TODO` in the codebase.

---

## Configuration

### No New Configuration Required

The remote control feature uses the **exact same configuration** as performance monitoring:

- Same enrollment token system
- Same agent credentials
- Same server URL
- Same credential file location

### How Capabilities Are Automatically Reported

**Automatic Reporting**: Capabilities are included in every performance snapshot automatically.

**Implementation**: In `main.go`, the `collectPerformanceData()` function:
```go
// Get remote control capabilities (included on every send)
var capabilities *remotecontrol.RemoteControlCapabilities
if rcManager != nil {
    caps := rcManager.GetCapabilities()
    capabilities = &caps
}

snapshot := PerformanceSnapshot{
    AgentID:    config.AgentID,
    AssetID:    config.AssetID,
    Timestamp:  time.Now().Format(time.RFC3339),
    TimeWindow: config.TimeWindow,
    PerformanceData: performanceData,
    Capabilities: capabilities, // ← Automatically included
}
```

**Server-Side Processing**: The `/api/agent/performance` endpoint extracts capabilities and updates the asset record.

### What Happens When a Session is Requested

1. **Technician Action**: Clicks "Remote Control" button in dashboard
2. **Server Action**: Creates session in `rc_sessions` collection with status `pending`
3. **Agent Polling**: Within 10 seconds, agent polls `/api/agent/rc/poll`
4. **Server Response**: Returns session details to agent
5. **Agent Action**: Automatically starts remote control session
6. **Status Update**: Session status changes from `pending` to `active`
7. **WebRTC Setup**: Agent and dashboard establish peer-to-peer connection
8. **Session Begins**: Screen sharing and input control activated

**No User Interaction Required on Agent Side** (by default - consent can be required via policy)

---

## Building & Deployment

### Build Instructions

**No Changes to Build Process**: Remote control is built into the same binary.

Use the existing build scripts:

```bash
# Linux/macOS
cd agent
./build.sh

# Windows
cd agent
build.bat
```

Builds will create the same binaries:
- `deskwise-agent-windows-amd64.exe`
- `deskwise-agent-linux-amd64`
- `deskwise-agent-linux-arm64`
- `deskwise-agent-darwin-amd64`
- `deskwise-agent-darwin-arm64`

### No Changes to Deployment

Deploy exactly as before:

**Windows**:
```powershell
.\deskwise-agent.exe install -server "https://your-deskwise.com" -enrollment-token "YOUR_TOKEN"
Start-Service DeskwiseAgent
```

**Linux**:
```bash
./deskwise-agent -server "https://your-deskwise.com" -enrollment-token "YOUR_TOKEN"
sudo cp deskwise-agent /usr/local/bin/
sudo systemctl enable deskwise-agent
sudo systemctl start deskwise-agent
```

**macOS**:
```bash
./deskwise-agent -server "https://your-deskwise.com" -enrollment-token "YOUR_TOKEN"
sudo cp deskwise-agent /usr/local/bin/
sudo launchctl load /Library/LaunchDaemons/com.deskwise.agent.plist
```

### Backward Compatibility

**100% Backward Compatible**:
- Agents without remote control code will still work for monitoring
- New agents with remote control will automatically report capabilities
- Dashboard detects capabilities and enables/disables Remote Control button accordingly
- No breaking changes to existing APIs

**Migration Path**:
1. Deploy new agent binaries to monitored assets
2. Agents automatically report remote control capabilities on next performance snapshot
3. Dashboard immediately enables Remote Control button for assets with capable agents
4. No restart or re-enrollment required

---

## Troubleshooting

### Common Issues

#### Issue 1: Remote Control Button Not Showing

**Symptom**: No "Remote Control" button visible on asset detail page

**Possible Causes**:
1. Agent hasn't reported capabilities yet
2. Agent is running old version without remote control support
3. Asset not associated with enrolled agent

**Solutions**:
✅ **Wait for capabilities report**: Capabilities are sent with performance data (every 60 seconds by default)
  - Check asset detail page → Monitoring Agent tab
  - Look for "Remote Control Capabilities" section
  - Should show: `remoteControl: true`, `screenCapture: true`, etc.

✅ **Verify agent version**: Check agent logs for version
  ```bash
  # Look for this line in agent logs:
  [RemoteControl] Manager initialized with capabilities: {RemoteControl:true ...}
  ```

✅ **Force capability update**: Wait for next performance snapshot or restart agent
  ```bash
  # Linux
  sudo systemctl restart deskwise-agent

  # Windows
  Restart-Service DeskwiseAgent
  ```

✅ **Check agent enrollment**: Ensure agent is enrolled and sending performance data
  - Navigate to Settings → Assets → Select Asset → Monitoring Agent tab
  - Verify "Last Seen" timestamp is recent

#### Issue 2: Connection Fails After Clicking Remote Control

**Symptom**: Modal opens but shows "Connecting..." indefinitely or "Connection failed"

**Possible Causes**:
1. Agent is offline or not polling
2. WebRTC connection blocked by firewall
3. Session timed out before agent picked it up

**Solutions**:
✅ **Check agent status**: Verify agent is running and polling
  ```bash
  # Linux
  sudo systemctl status deskwise-agent
  sudo journalctl -u deskwise-agent -f

  # Windows
  Get-Service DeskwiseAgent
  Get-EventLog -LogName Application -Source "Deskwise Agent" -Newest 10
  ```

✅ **Check agent logs for polling**: Look for polling activity
  - Successful poll (no session): Silent (no log entry)
  - Session detected: `[RemoteControl] Starting session: rc_abc123xyz`
  - Connection established: `[RemoteControl] Session rc_abc123xyz is now active`

✅ **Verify firewall rules**: Ensure outbound HTTPS and WebRTC traffic allowed
  - Check that agent can reach server: `curl https://your-deskwise.com/api/agent/rc/poll`
  - WebRTC uses UDP ports (random high ports) - ensure not blocked
  - STUN server access required: `stun.l.google.com:19302`

✅ **Check session timeout**: Sessions expire after 5 minutes in pending state
  - If agent polls late, session may have already expired
  - Try creating a new session

✅ **Review server logs**: Check Next.js console for API errors
  ```bash
  # Look for errors in /api/agent/rc/poll or /api/rc/sessions endpoints
  ```

#### Issue 3: Session Doesn't Start

**Symptom**: Agent logs show session detected but WebRTC never establishes

**Possible Causes**:
1. WebRTC offer/answer exchange failed
2. ICE candidate gathering failed
3. Network prevents peer-to-peer connection

**Solutions**:
✅ **Check signalling logs**: Look for WebRTC negotiation in agent logs
  ```bash
  # Should see:
  [WebRTCPeer] Initialized with X ICE servers
  [WebRTCPeer] Created offer (TODO: Implement real SDP)
  [SignalClient] Sent offer signal for session rc_abc123xyz
  ```

✅ **Verify ICE servers**: Ensure STUN server is reachable
  ```bash
  # Test STUN server connectivity
  nc -u stun.l.google.com 19302
  ```

✅ **Check NAT traversal**: If behind restrictive NAT/firewall, may need TURN server
  - STUN servers help with simple NAT traversal
  - Complex networks may require TURN relay servers
  - Configure TURN servers in `getICEServers()` method (server-side)

✅ **Enable verbose logging**: Modify agent to log all signalling messages
  - Temporarily remove "silent polling" logic
  - Add debug logs in `handleSignalling()` method

#### Issue 4: Black Screen or No Video

**Symptom**: Session connected but technician sees black screen or no video

**Possible Causes**:
1. Screen capture not implemented yet (MVP limitation)
2. Screen capture failed to initialize
3. Permission issues on agent machine

**Solutions**:
✅ **Check platform implementation**: Review `screencapture.go`
  - Windows: DXGI Desktop Duplication API marked as `TODO`
  - Linux: X11/Wayland capture marked as `TODO`
  - macOS: CGDisplayStream marked as `TODO`
  - **Currently returns dummy frames** (MVP implementation)

✅ **Verify permissions**: Screen capture requires elevated permissions on some OSes
  ```bash
  # Linux: X11 display access
  echo $DISPLAY  # Should show :0 or similar

  # macOS: Screen Recording permission in System Preferences
  # Windows: Should work with normal user permissions
  ```

✅ **Check screen capture logs**: Look for initialization messages
  ```bash
  # Should see:
  [ScreenCapture] Started with target FPS: 30
  [WindowsCapturer] Initialized (TODO: Implement DXGI)
  ```

✅ **Implementation Status**: Screen capture is **TODO** in MVP
  - Framework is in place
  - Platform-specific APIs need implementation
  - See [Development](#development) section for implementation details

### Checking Agent Logs

**Linux (systemd)**:
```bash
# Real-time logs
sudo journalctl -u deskwise-agent -f

# Last 50 lines
sudo journalctl -u deskwise-agent -n 50 --no-pager

# Grep for remote control events
sudo journalctl -u deskwise-agent | grep -i "remotecontrol"
```

**Windows (Event Log)**:
```powershell
# View service logs
Get-EventLog -LogName Application -Source "Deskwise Agent" -Newest 50

# Filter for remote control events
Get-EventLog -LogName Application -Source "Deskwise Agent" | Where-Object {$_.Message -like "*RemoteControl*"}
```

**macOS (launchd)**:
```bash
# View logs
tail -f /var/log/deskwise-agent.log

# Grep for remote control
grep -i "remotecontrol" /var/log/deskwise-agent.log
```

**Console Mode** (development):
```bash
# Run agent in foreground to see all logs
./deskwise-agent -server "http://localhost:9002"
```

### Verifying Capabilities Are Being Reported

**Method 1: Check Asset Page**
1. Navigate to Settings → Assets in Deskwise
2. Select the asset
3. Go to "Monitoring Agent" tab
4. Look for "Remote Control Capabilities" section

**Method 2: Check MongoDB**
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Query asset record
use deskwise
db.assets.findOne(
  { _id: ObjectId("your-asset-id") },
  { capabilities: 1, lastSeen: 1 }
)
```

Should show:
```json
{
  "_id": ObjectId("..."),
  "lastSeen": ISODate("2025-10-08T10:35:00.000Z"),
  "capabilities": {
    "remoteControl": true,
    "screenCapture": true,
    "inputInjection": true,
    "webrtcSupported": true,
    "platform": "windows",
    "agentVersion": "1.0.0"
  }
}
```

**Method 3: Check Performance Data API Response**
```bash
# If you have agent credential
curl -H "Authorization: Bearer your-credential-key" \
  https://your-deskwise.com/api/agent/performance
```

---

## Development

### Testing Remote Control Locally

**1. Setup Development Environment**

```bash
# Terminal 1: Start Deskwise server
cd /path/to/deskwise
npm run dev

# Terminal 2: Build and run agent
cd agent
go build -o deskwise-agent main.go

# Generate enrollment token in UI first, then:
./deskwise-agent -server "http://localhost:9002" -enrollment-token "et_your_token_here"
```

**2. Create Test Asset**

```bash
# In Deskwise UI:
# 1. Navigate to Settings → Assets
# 2. Click "Add Asset"
# 3. Fill in details (name, type, etc.)
# 4. Click "Generate Enrollment Token" on Monitoring Agent tab
# 5. Copy token and use in agent enrollment
```

**3. Test Session Creation**

```bash
# In Deskwise UI:
# 1. Navigate to asset detail page
# 2. Wait for "Remote Control" button to appear (after agent reports capabilities)
# 3. Click "Remote Control" button
# 4. Watch agent logs for session pickup
```

**4. Monitor Both Sides**

**Agent Logs** (Terminal 2):
```bash
# Look for these messages:
[RemoteControl] Manager initialized with capabilities: ...
[RemoteControl] Starting session: rc_abc123xyz
[RemoteControl] Session rc_abc123xyz is now active
[WebRTCPeer] Initialized with 1 ICE servers
[ScreenCapture] Started with target FPS: 30
```

**Server Logs** (Terminal 1):
```bash
# Look for API calls:
POST /api/rc/sessions 200
GET /api/agent/rc/poll 200
POST /api/rc/signalling 200
```

### Implementing Platform-Specific APIs (TODOs)

The remote control framework is complete, but platform-specific APIs are marked as `TODO`. Here's how to implement them:

#### Screen Capture Implementation

**Windows (DXGI Desktop Duplication API)**

File: `agent/remotecontrol/screencapture.go` → `WindowsCapturer`

```go
// Required: CGO and Windows SDK
import "github.com/kbinani/screenshot"

func (wc *WindowsCapturer) Initialize() error {
    // Use DXGI Desktop Duplication API via CGO
    // Or use a library like github.com/kbinani/screenshot
    n := screenshot.NumActiveDisplays()
    if n > 0 {
        bounds := screenshot.GetDisplayBounds(0)
        wc.displayInfo = DisplayInfo{
            Width:  bounds.Dx(),
            Height: bounds.Dy(),
            DPI:    96,
        }
    }
    return nil
}

func (wc *WindowsCapturer) CaptureFrame() (*image.RGBA, error) {
    img, err := screenshot.CaptureDisplay(0)
    if err != nil {
        return nil, err
    }

    // Convert to RGBA if needed
    rgba := image.NewRGBA(img.Bounds())
    draw.Draw(rgba, rgba.Bounds(), img, image.Point{}, draw.Src)
    return rgba, nil
}
```

**Linux (X11 with XShm extension)**

File: `agent/remotecontrol/screencapture.go` → `LinuxCapturer`

```go
// Required: CGO and X11 libraries
import "github.com/BurntSushi/xgb/xproto"

func (lc *LinuxCapturer) Initialize() error {
    // Connect to X11 display
    // Setup XShm extension for efficient capture
    // Get screen dimensions
    return nil
}

func (lc *LinuxCapturer) CaptureFrame() (*image.RGBA, error) {
    // Use XGetImage with XShm for efficient capture
    // Convert to RGBA format
    return img, nil
}
```

**macOS (CGDisplayStream)**

File: `agent/remotecontrol/screencapture.go` → `MacOSCapturer`

```go
// Required: CGO and Core Graphics framework
/*
#cgo LDFLAGS: -framework CoreGraphics -framework CoreFoundation
#include <CoreGraphics/CoreGraphics.h>

// C helper functions...
*/
import "C"

func (mc *MacOSCapturer) Initialize() error {
    // Create CGDisplayStream
    // Setup frame callback
    return nil
}

func (mc *MacOSCapturer) CaptureFrame() (*image.RGBA, error) {
    // Get latest frame from CGDisplayStream
    // Convert to RGBA
    return img, nil
}
```

#### Input Injection Implementation

**Windows (SendInput API)**

File: `agent/remotecontrol/input.go` → `WindowsInputInjector`

```go
// Required: CGO and Windows SDK
/*
#cgo LDFLAGS: -luser32
#include <windows.h>

// C helper functions for SendInput...
*/
import "C"

func (wii *WindowsInputInjector) InjectMouseMove(x, y int) error {
    // Use SendInput with MOUSEEVENTF_ABSOLUTE
    // Convert coordinates to 0-65535 range
    // Call SendInput
    return nil
}

func (wii *WindowsInputInjector) InjectKeyPress(key string, pressed bool) error {
    // Map key string to virtual key code
    // Use SendInput with KEYEVENTF_SCANCODE
    return nil
}
```

**Linux (XTest Extension)**

File: `agent/remotecontrol/input.go` → `LinuxInputInjector`

```go
// Required: CGO and X11 XTest library
import "github.com/BurntSushi/xgb/xtest"

func (lii *LinuxInputInjector) InjectMouseMove(x, y int) error {
    // Use XTestFakeMotionEvent
    return nil
}

func (lii *LinuxInputInjector) InjectKeyPress(key string, pressed bool) error {
    // Map key string to X11 keysym
    // Use XTestFakeKeyEvent
    return nil
}
```

**macOS (CGEvent)**

File: `agent/remotecontrol/input.go` → `MacOSInputInjector`

```go
// Required: CGO and Core Graphics framework
/*
#cgo LDFLAGS: -framework CoreGraphics
#include <CoreGraphics/CoreGraphics.h>
*/
import "C"

func (mii *MacOSInputInjector) InjectMouseMove(x, y int) error {
    // Create CGEventCreateMouseEvent
    // Post with CGEventPost
    return nil
}

func (mii *MacOSInputInjector) InjectKeyPress(key string, pressed bool) error {
    // Map key string to CGKeyCode
    // Create CGEventCreateKeyboardEvent
    // Post with CGEventPost
    return nil
}
```

#### WebRTC Implementation (Using Pion)

File: `agent/remotecontrol/webrtc.go`

**Add Dependency**:
```bash
go get github.com/pion/webrtc/v3
```

**Implement WebRTC Peer**:
```go
import (
    "github.com/pion/webrtc/v3"
    "github.com/pion/webrtc/v3/pkg/media"
)

type WebRTCPeer struct {
    pc            *webrtc.PeerConnection
    videoTrack    *webrtc.TrackLocalStaticSample
    dataChannel   *webrtc.DataChannel
    screenCapture *ScreenCapture
    inputHandler  *InputHandler
}

func (wp *WebRTCPeer) Init(iceServers []ICEServer) error {
    // Convert ICEServer format to pion format
    config := webrtc.Configuration{
        ICEServers: []webrtc.ICEServer{...},
    }

    // Create peer connection
    pc, err := webrtc.NewPeerConnection(config)
    if err != nil {
        return err
    }
    wp.pc = pc

    // Create video track for screen capture
    videoTrack, err := webrtc.NewTrackLocalStaticSample(
        webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
        "video",
        "screen",
    )
    if err != nil {
        return err
    }
    wp.videoTrack = videoTrack

    // Add track to peer connection
    _, err = pc.AddTrack(videoTrack)
    if err != nil {
        return err
    }

    // Create data channel for input events
    dataChannel, err := pc.CreateDataChannel("input", nil)
    if err != nil {
        return err
    }
    wp.dataChannel = dataChannel

    // Setup data channel callbacks
    dataChannel.OnMessage(func(msg webrtc.DataChannelMessage) {
        wp.HandleDataChannel(msg.Data)
    })

    // Setup ICE candidate callback
    pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
        if candidate != nil {
            // Send candidate via signalling
            wp.sendICECandidate(candidate)
        }
    })

    return nil
}

func (wp *WebRTCPeer) CreateOffer() (map[string]interface{}, error) {
    offer, err := wp.pc.CreateOffer(nil)
    if err != nil {
        return nil, err
    }

    err = wp.pc.SetLocalDescription(offer)
    if err != nil {
        return nil, err
    }

    // Start sending frames
    go wp.sendFrames()

    return map[string]interface{}{
        "type": offer.Type.String(),
        "sdp":  offer.SDP,
    }, nil
}

func (wp *WebRTCPeer) sendFrames() {
    frameChan := wp.screenCapture.GetFrameChannel()

    for frame := range frameChan {
        // Encode frame to VP8
        // Send via video track
        wp.videoTrack.WriteSample(media.Sample{
            Data:     encodedFrame,
            Duration: time.Second / 30,
        })
    }
}
```

### Code Structure Overview

```
agent/
├── main.go                              # Main agent with integration
│   ├── Config struct                    # Unchanged
│   ├── Performance monitoring loop      # Unchanged (60s interval)
│   ├── Remote control polling loop      # NEW (10s interval)
│   ├── rcManager initialization         # NEW
│   └── checkForRemoteControlSession()   # NEW
│
├── remotecontrol/
│   ├── remotecontrol.go                 # Session management
│   │   ├── Manager                      # Manages sessions
│   │   ├── Session                      # Individual session
│   │   ├── RemoteControlCapabilities    # Capability struct
│   │   └── Session lifecycle methods
│   │
│   ├── signalling.go                    # WebRTC signalling
│   │   ├── SignalClient                 # HTTP client for signalling
│   │   ├── SendSignal()                 # Send offer/answer/ICE
│   │   └── PollSignals()                # Receive from server
│   │
│   ├── webrtc.go                        # WebRTC peer connection
│   │   ├── WebRTCPeer                   # Peer connection manager
│   │   ├── CreateOffer()                # TODO: Implement with Pion
│   │   ├── SetRemoteDescription()       # TODO: Implement with Pion
│   │   └── HandleDataChannel()          # Input event processing
│   │
│   ├── screencapture.go                 # Screen capture
│   │   ├── ScreenCapture                # Platform-agnostic interface
│   │   ├── WindowsCapturer              # TODO: DXGI implementation
│   │   ├── LinuxCapturer                # TODO: X11 implementation
│   │   └── MacOSCapturer                # TODO: CGDisplayStream impl
│   │
│   └── input.go                         # Input injection
│       ├── InputHandler                 # Platform-agnostic interface
│       ├── WindowsInputInjector         # TODO: SendInput API
│       ├── LinuxInputInjector           # TODO: XTest extension
│       └── MacOSInputInjector           # TODO: CGEvent API
│
└── service_*.go                         # Service management (unchanged)
```

**Key Design Patterns**:
1. **Platform Abstraction**: Interfaces for platform-specific code
2. **Dependency Injection**: Managers receive dependencies in constructors
3. **Goroutine Safety**: Mutexes protect shared state
4. **Error Handling**: Comprehensive error returns with context
5. **Logging**: Structured logging with `[Component]` prefixes

---

## Security Considerations

### Authentication

**Agent Authentication**:
- Uses existing enrollment token system (one-time use, 24-hour expiration)
- Long-lived agent credentials stored securely in credential file
- All API calls authenticated with `Authorization: Bearer {credentialKey}` header
- Credentials can be revoked by admins at any time

**Session Authentication**:
- Each session has a unique session token generated by server
- Tokens are short-lived (valid only for active session)
- Tokens cryptographically signed (JWT with secret)
- Token validation on every signalling message

### Session Token Security

**Token Generation**:
```typescript
// Server-side: src/lib/services/remote-control.ts
const token = jwt.sign(
  {
    sessionId: session.sessionId,
    assetId: session.assetId,
    orgId: session.orgId,
    userId: operatorUserId,
    permissions: ['view', 'input'],
  },
  JWT_SECRET,
  { expiresIn: '2h' }
)
```

**Token Usage**:
- Included in all signalling API calls
- Validated on server before processing any request
- Cannot be used across different sessions
- Expires automatically after session ends

### Multi-Tenancy Enforcement

**Organization Isolation**:
- Every session tied to specific `orgId`
- Agent credentials include `orgId` in claims
- Server validates `orgId` matches for all operations
- Cross-organization session creation blocked

**Data Isolation**:
- MongoDB queries always filter by `orgId`
- Audit logs include `orgId` for compliance
- Session tokens include `orgId` in claims
- WebRTC signalling messages filtered by `orgId`

**Permission Checks**:
- Technician role verified before session creation
- Policy settings checked per organization
- Consent requirements enforced per organization
- Recording settings respected per organization

### Audit Logging

**Comprehensive Audit Trail**:
- Session creation (who, what asset, when)
- Agent connection (agent details, connection time)
- WebRTC establishment (offer/answer exchange)
- Input events (optional, based on policy)
- Session termination (duration, reason)

**Audit Log Structure**:
```typescript
{
  sessionId: string
  assetId: string
  orgId: string
  operatorUserId: string
  action: 'session_created' | 'agent_connected' | 'webrtc_established' | 'input_event' | 'session_ended'
  timestamp: Date
  details: {
    // Action-specific details
  }
}
```

**Audit Log Storage**:
- MongoDB collection: `rc_audit_logs`
- Indexed by `orgId`, `sessionId`, `timestamp`
- Queryable via admin API
- Exportable for compliance reporting

**Compliance Features**:
- Immutable audit logs (no updates/deletes)
- Complete session timeline reconstruction
- Operator attribution for all actions
- Policy enforcement verification

### Network Security

**Encryption**:
- All HTTP API calls over HTTPS in production
- WebRTC streams encrypted with DTLS/SRTP by default
- Signalling messages encrypted in transit
- Agent credentials encrypted at rest (credential file)

**Firewall Considerations**:
- Agent only makes **outbound** connections (no inbound ports required)
- HTTPS (443) for API calls
- WebRTC uses random high UDP ports (ephemeral)
- STUN server: `stun.l.google.com:19302` (UDP 19302)
- TURN servers (if configured) use TCP/UDP

**NAT Traversal**:
- STUN servers help with simple NAT scenarios
- TURN relay servers for restrictive networks (configurable)
- ICE framework handles complex network topologies
- Fallback to server-relayed connection if peer-to-peer fails

### Consent and Privacy

**Consent Workflow** (optional, policy-based):
```go
// In agent/remotecontrol/remotecontrol.go
func (s *Session) run() {
    // Step 1: Check if consent is required
    if s.requireConsent() {
        // Show consent dialog on agent machine
        approved, err := s.showConsentDialog()
        if !approved || err != nil {
            s.deny("User denied consent")
            return
        }
    }

    // Step 2: Proceed with session...
}
```

**Privacy Controls**:
- Consent dialog shows operator name and purpose
- User can deny remote control request
- Visual indicator when session is active (optional)
- Session recording notification (if enabled)
- Automatic timeout for inactive sessions

**Policy Settings** (per organization):
- Require consent: Yes/No
- Record sessions: Yes/No
- Log input events: Yes/No
- Session timeout: Duration (default: 30 minutes)
- Maximum concurrent sessions: Number (default: 1 per asset)

---

## Summary

The remote control feature is **fully integrated** into the existing Deskwise monitoring agent:

✅ **Single Binary**: No separate installation
✅ **Automatic Discovery**: Agent polls for sessions every 10 seconds
✅ **Capability Reporting**: Included in performance snapshots
✅ **Zero Configuration**: Uses existing enrollment and credentials
✅ **Security-First**: Authentication, encryption, audit logging
✅ **Platform Support**: Framework ready for Windows, Linux, macOS

**Current Status**: MVP framework complete, platform-specific APIs marked as TODO.

**Next Steps for Production**:
1. Implement platform-specific screen capture (DXGI, X11, CGDisplayStream)
2. Implement platform-specific input injection (SendInput, XTest, CGEvent)
3. Integrate Pion WebRTC library for real peer connections
4. Add consent dialog UI (optional based on policy)
5. Implement session recording (optional based on policy)
6. Add visual indicators for active sessions

**Documentation References**:
- Main README: `agent/README.md`
- Quick Start: `agent/QUICKSTART.md`
- Remote Control Quick Start: `agent/QUICKSTART_REMOTE_CONTROL.md`
- Server-Side Docs: `CLAUDE.md` (Performance Monitoring Agent section)

---

**Version**: 1.0.0-MVP
**Last Updated**: 2025-10-08
**License**: Copyright © 2025 Deskwise. All rights reserved.
