# Remote Control Quick Start Guide

**5-step guide to testing remote control functionality in Deskwise**

---

## Prerequisites

Before testing remote control, ensure:

✅ **Agent Installed**: Deskwise monitoring agent installed and running
✅ **Agent Enrolled**: Agent successfully enrolled with enrollment token
✅ **Performance Data**: Agent sending performance data (check "Last Seen" in UI)
✅ **Server Running**: Deskwise server running (dev: `npm run dev`, production: verify URL)

---

## Step 1: Verify Agent Has Remote Control Capabilities

### In Deskwise UI

1. Navigate to **Settings → Assets**
2. Select the asset with installed agent
3. Click on **"Monitoring Agent"** tab
4. Look for **"Remote Control Capabilities"** section

**Expected Result**: Should show:
```
Remote Control: ✓ Supported
Screen Capture: ✓ Supported
Input Injection: ✓ Supported
WebRTC: ✓ Supported
Platform: windows (or linux/darwin)
Agent Version: 1.0.0
```

### Via Agent Logs

```bash
# Linux
sudo journalctl -u deskwise-agent | grep "RemoteControl"

# Windows
Get-EventLog -LogName Application -Source "Deskwise Agent" | Where-Object {$_.Message -like "*RemoteControl*"}

# macOS
grep "RemoteControl" /var/log/deskwise-agent.log
```

**Expected Log Message**:
```
[RemoteControl] Manager initialized with capabilities: {RemoteControl:true ScreenCapture:true InputInjection:true WebRTCSupported:true Platform:windows AgentVersion:1.0.0}
```

**⚠️ If capabilities not showing**:
- Wait 60 seconds (capabilities sent with next performance snapshot)
- Or restart agent to force immediate report

---

## Step 2: Initiate Remote Control Session

### In Deskwise UI

1. Navigate to the **asset detail page** (click on asset name)
2. Look for **"Remote Control"** button in the top-right corner
3. Click the **"Remote Control"** button

**Expected Result**: Modal opens with "Connecting to agent..." message

**⚠️ If button not visible**:
- Capabilities not reported yet (see Step 1)
- Check browser console for errors (F12 → Console tab)

---

## Step 3: Agent Picks Up Session

### What Happens Automatically

Within 10 seconds, the agent will:
1. Poll `/api/agent/rc/poll` endpoint
2. Discover the pending session
3. Start remote control session
4. Initialize WebRTC connection

### Monitor Agent Logs

```bash
# Linux
sudo journalctl -u deskwise-agent -f

# Windows (PowerShell, run as Administrator)
Get-EventLog -LogName Application -Source "Deskwise Agent" -Newest 1 -Wait

# macOS
tail -f /var/log/deskwise-agent.log
```

**Expected Log Sequence**:
```
[RemoteControl] Starting session: rc_abc123xyz789
[RemoteControl] Session rc_abc123xyz789 is now active
[ScreenCapture] Started with target FPS: 30
[WindowsCapturer] Initialized (TODO: Implement DXGI)
[WebRTCPeer] Initialized with 1 ICE servers
[WebRTCPeer] Created offer (TODO: Implement real SDP)
[SignalClient] Sent offer signal for session rc_abc123xyz789
```

**⚠️ If logs show nothing**:
- Agent might not be polling (check agent is running)
- Check network connectivity: `curl http://localhost:9002/api/agent/rc/poll`
- Verify credentials valid (check Settings → Assets → Monitoring Agent tab)

---

## Step 4: Verify WebRTC Negotiation

### In Browser Console

1. Open browser developer tools (F12)
2. Go to **Console** tab
3. Look for WebRTC-related messages

**Expected Console Messages**:
```
[RemoteControl] Session created: rc_abc123xyz789
[WebRTC] Creating peer connection...
[WebRTC] Received offer from agent
[WebRTC] Sending answer to agent
[WebRTC] ICE candidate: candidate:...
[WebRTC] Connection state: connected
```

### In Agent Logs

**Expected Log Sequence**:
```
[SignalClient] Received 1 signals
[WebRTCPeer] Set remote description: answer (TODO)
[WebRTCPeer] Added ICE candidate (TODO)
```

**⚠️ If connection fails**:
- Check STUN server accessibility: `nc -u stun.l.google.com 19302`
- Verify firewall not blocking WebRTC traffic
- Review server logs: Check Next.js console for `/api/rc/signalling` errors

---

## Step 5: Verify Expected Behavior

### Current MVP Behavior (Platform APIs TODO)

**In Browser**:
- ✅ Modal shows "Connected to agent"
- ⚠️ Black screen (screen capture not implemented yet)
- ⚠️ Input not working (input injection not implemented yet)

**In Agent Logs**:
- ✅ Session active
- ✅ Screen capture initialized (dummy frames)
- ✅ WebRTC peer initialized (placeholder SDP)

### How to Confirm It's Working

**1. Check Session Status in UI**:
- Modal should show "Connected" status
- Session timer should be running
- No error messages

**2. Check MongoDB**:
```bash
# Connect to MongoDB
mongosh "your-mongodb-uri"

# Query session
use deskwise
db.rc_sessions.findOne(
  { status: "active" },
  { sessionId: 1, status: 1, operatorName: 1, startedAt: 1 }
)
```

**Expected Result**:
```json
{
  "_id": ObjectId("..."),
  "sessionId": "rc_abc123xyz789",
  "status": "active",
  "operatorName": "John Smith",
  "startedAt": ISODate("2025-10-08T10:35:00.000Z")
}
```

**3. Check Audit Logs**:
```bash
db.rc_audit_logs.find(
  { sessionId: "rc_abc123xyz789" }
).sort({ timestamp: -1 })
```

**Expected Entries**:
```json
[
  {
    "action": "agent_connected",
    "timestamp": ISODate("2025-10-08T10:35:05.000Z"),
    "details": { "agentId": "windows-DESKTOP-ABC-123" }
  },
  {
    "action": "session_created",
    "timestamp": ISODate("2025-10-08T10:35:00.000Z"),
    "details": { "operatorName": "John Smith" }
  }
]
```

**4. End Session**:
- Click "End Session" button in modal
- Verify agent logs show session cleanup:
  ```
  [RemoteControl] Session rc_abc123xyz789 cleaned up
  ```

---

## Common Issues

### Issue: "Connecting..." Indefinitely

**Cause**: Agent not picking up session

**Check**:
```bash
# Verify agent is polling (run in terminal, watch for 10 seconds)
sudo journalctl -u deskwise-agent -f
```

**Fix**:
- Restart agent: `sudo systemctl restart deskwise-agent`
- Check network: `curl http://localhost:9002/api/agent/rc/poll`
- Verify credentials: Settings → Assets → Monitoring Agent tab

---

### Issue: "Connection Failed" Error

**Cause**: WebRTC negotiation failed

**Check Browser Console**:
- Look for WebRTC errors (F12 → Console)
- Check for ICE connection failures

**Check Agent Logs**:
```bash
# Look for WebRTC errors
sudo journalctl -u deskwise-agent | grep -i "webrtc\|signalling"
```

**Fix**:
- Verify STUN server accessible
- Check firewall settings
- Review server logs for `/api/rc/signalling` errors

---

### Issue: Remote Control Button Not Showing

**Cause**: Capabilities not reported

**Check**:
- Wait 60 seconds for next performance snapshot
- Check Settings → Assets → Monitoring Agent tab for capabilities

**Fix**:
- Restart agent to force capability report
- Verify agent is sending performance data (check "Last Seen" timestamp)

---

### Issue: Black Screen in Modal

**Status**: **Expected in MVP**

**Reason**: Platform-specific screen capture APIs not yet implemented (marked as TODO)

**Files**: `agent/remotecontrol/screencapture.go`
- `WindowsCapturer`: TODO - Implement DXGI Desktop Duplication API
- `LinuxCapturer`: TODO - Implement X11/Wayland capture
- `MacOSCapturer`: TODO - Implement CGDisplayStream

**Implementation Status**: Framework complete, real screen capture coming in future update

---

## Next Steps

### For Developers

**Implement Platform-Specific APIs**:
1. Screen Capture: Implement DXGI/X11/CGDisplayStream (see `agent/remotecontrol/screencapture.go`)
2. Input Injection: Implement SendInput/XTest/CGEvent (see `agent/remotecontrol/input.go`)
3. WebRTC: Integrate Pion library for real peer connections (see `agent/remotecontrol/webrtc.go`)

**Testing Guide**: See [REMOTE_CONTROL.md → Development section](REMOTE_CONTROL.md#development)

### For Production Deployment

**Before Production**:
1. ✅ Verify agent enrollment process
2. ✅ Test session creation and cleanup
3. ⚠️ Implement real screen capture (TODO)
4. ⚠️ Implement real input injection (TODO)
5. ⚠️ Integrate Pion WebRTC library (TODO)
6. ✅ Configure consent dialogs (if required by policy)
7. ✅ Setup session recording (if required by policy)
8. ✅ Configure TURN servers for complex networks

**Documentation**: See [REMOTE_CONTROL.md](REMOTE_CONTROL.md) for complete details

---

## Where to Look for Issues

### Agent Logs

**Linux (systemd)**:
```bash
# Real-time
sudo journalctl -u deskwise-agent -f

# Filter for remote control
sudo journalctl -u deskwise-agent | grep -i "remotecontrol\|webrtc\|signalling"
```

**Windows (Event Log)**:
```powershell
# Last 20 entries
Get-EventLog -LogName Application -Source "Deskwise Agent" -Newest 20

# Filter for remote control
Get-EventLog -LogName Application -Source "Deskwise Agent" | Where-Object {$_.Message -like "*RemoteControl*"}
```

**macOS (launchd)**:
```bash
# Real-time
tail -f /var/log/deskwise-agent.log

# Filter for remote control
grep -i "remotecontrol\|webrtc\|signalling" /var/log/deskwise-agent.log
```

### Server Logs

**Next.js Console** (Terminal running `npm run dev`):
```bash
# Look for these API routes:
POST /api/rc/sessions
GET /api/agent/rc/poll
POST /api/rc/signalling
GET /api/rc/signalling
```

### Browser Console

**Open Developer Tools** (F12):
- **Console tab**: Look for WebRTC and connection messages
- **Network tab**: Monitor API calls to `/api/rc/*` endpoints
- **Application tab** → WebRTC Internals: `chrome://webrtc-internals` (Chrome/Edge)

### MongoDB

**Query Collections**:
```bash
# Sessions
db.rc_sessions.find().sort({ startedAt: -1 }).limit(5)

# Audit logs
db.rc_audit_logs.find().sort({ timestamp: -1 }).limit(10)

# Agent credentials
db.agent_credentials.findOne({ assetId: "your-asset-id" })
```

---

## Success Criteria

**MVP Implementation is Working When**:

✅ **Capabilities Reported**: Agent capabilities visible in UI
✅ **Session Creation**: Clicking "Remote Control" creates session in database
✅ **Agent Discovery**: Agent picks up session within 10 seconds
✅ **Status Update**: Session status changes from `pending` to `active`
✅ **WebRTC Negotiation**: Offer/answer exchange completes successfully
✅ **Audit Logging**: Session events recorded in `rc_audit_logs`
✅ **Session Cleanup**: Ending session cleans up resources properly

**Full Implementation Will Include**:

⚠️ **Real Screen Capture**: Live screen feed in browser
⚠️ **Input Injection**: Mouse and keyboard control working
⚠️ **Low Latency**: <100ms latency for input-to-screen feedback
⚠️ **Consent Dialog**: Optional user consent workflow
⚠️ **Session Recording**: Optional video recording of sessions

---

## Additional Resources

- **Full Documentation**: [REMOTE_CONTROL.md](REMOTE_CONTROL.md)
- **Agent README**: [README.md](README.md)
- **Quick Start (General)**: [QUICKSTART.md](QUICKSTART.md)
- **Server Documentation**: `../CLAUDE.md` (Performance Monitoring Agent section)

---

**Version**: 1.0.0-MVP
**Last Updated**: 2025-10-08
**Status**: Framework complete, platform APIs TODO

For questions or issues, see [REMOTE_CONTROL.md → Troubleshooting](REMOTE_CONTROL.md#troubleshooting)
