# Deskwise Monitoring Agent - Quick Start Guide

## One-Page Reference for Installation and Troubleshooting

---

## Before You Start: Generate Enrollment Token

**Required First Step**: In the Deskwise web interface:
1. Navigate to **Settings → Assets**
2. Select (or create) the asset you want to monitor
3. Go to the **"Monitoring Agent"** tab
4. Click **"Generate Enrollment Token"**
5. Copy the token (format: `et_xxxxxxxxxxxxxxxxxx`)

---

## Installation Commands by Platform

### Windows

```powershell
# Download agent
Invoke-WebRequest -Uri "https://your-deskwise.com/downloads/agent/windows" -OutFile "deskwise-agent.exe"

# First run with enrollment token
.\deskwise-agent.exe -server "https://your-deskwise.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"

# Install as Windows Service (run as Administrator)
.\deskwise-agent.exe install -server "https://your-deskwise.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"

# Start the service
Start-Service DeskwiseAgent

# Check status
Get-Service DeskwiseAgent
```

### Linux

```bash
# Download and make executable
wget https://your-deskwise.com/downloads/agent/linux-amd64 -O deskwise-agent
chmod +x deskwise-agent

# Enroll the agent (first run)
./deskwise-agent -server "https://your-deskwise.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"
# Press Ctrl+C after seeing "Agent enrolled successfully"

# Install as systemd service
sudo cp deskwise-agent /usr/local/bin/
sudo systemctl daemon-reload
sudo systemctl enable deskwise-agent
sudo systemctl start deskwise-agent

# Check status
sudo systemctl status deskwise-agent
```

### macOS

```bash
# Download and make executable
wget https://your-deskwise.com/downloads/agent/darwin-arm64 -O deskwise-agent  # For Apple Silicon
# or
wget https://your-deskwise.com/downloads/agent/darwin-amd64 -O deskwise-agent  # For Intel
chmod +x deskwise-agent

# Enroll the agent (first run)
./deskwise-agent -server "https://your-deskwise.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"
# Press Ctrl+C after seeing "Agent enrolled successfully"

# Install as launchd service
sudo cp deskwise-agent /usr/local/bin/
sudo launchctl load /Library/LaunchDaemons/com.deskwise.agent.plist
```

---

## Required Parameters

| Parameter | Description | Example | Required |
|-----------|-------------|---------|----------|
| `-server` | Deskwise server URL | `https://deskwise.example.com` or `http://localhost:9002` | Yes |
| `-enrollment-token` | One-time enrollment token | `et_abc123xyz...` | First run only |
| `-interval` | Collection interval (seconds) | `60` (default) | No |
| `-time-window` | Data aggregation window | `1min` (default) | No |

**Note**: After enrollment, `asset-id`, `org-id`, and credentials are automatically managed.

---

## Quick Troubleshooting

### Issue: Connection Refused

**Cause**: Can't reach Deskwise server
**Fix**:
- ✅ Verify server URL is correct
- ✅ Ensure server is running: `npm run dev` (local) or check production URL
- ✅ Check firewall allows outbound connections
- ✅ Test with: `curl http://localhost:9002/api/health`

### Issue: Enrollment Failed

**Cause**: Invalid or expired enrollment token
**Fix**:
- ✅ Generate new token in Deskwise: Settings → Assets → Monitoring Agent tab
- ✅ Tokens are one-time use and expire after 24 hours
- ✅ Verify token format starts with `et_`
- ✅ Check token status in Deskwise UI (Active/Used/Expired)
- ✅ Ensure server URL is reachable during enrollment

### Issue: Credentials Not Found

**Cause**: Agent not enrolled or credentials deleted
**Fix**:
- ✅ Re-enroll agent with new enrollment token
- ✅ Check credential file exists:
  - Linux/macOS: `~/.deskwise/agent-credentials.json`
  - Windows: `%USERPROFILE%\.deskwise\agent-credentials.json`
- ✅ Verify credentials not revoked in Deskwise UI

### Issue: No Data in Dashboard

**Cause**: Data not being stored or enrollment issue
**Fix**:
- ✅ Verify enrollment succeeded (check for "Agent enrolled successfully")
- ✅ In Deskwise UI: Settings → Assets → Monitoring Agent tab
  - Check agent status is "Active"
  - Verify "Last Seen" timestamp updates
- ✅ Check MongoDB: `db.performance_snapshots.find().sort({timestamp:-1}).limit(5)`
- ✅ Look for "Performance data sent successfully" in agent logs

### Issue: Agent Stops Running

**Cause**: Not enrolled or permissions issue
**Fix**:
- ✅ Ensure agent enrolled before running as service
- ✅ Run with appropriate permissions (sudo/Administrator)
- ✅ Check agent logs for error messages
- ✅ Verify system has at least 50MB free memory

---

## Server-Side Setup

No special environment variables needed! The enrollment system works out of the box:
- Enrollment tokens stored in MongoDB (`enrollment_tokens` collection)
- Agent credentials stored in MongoDB (`agent_credentials` collection)
- All management done through the Deskwise web UI

---

## Testing Enrollment

```bash
# Test enrollment endpoint
curl -X POST http://localhost:9002/api/agent/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "enrollmentToken": "et_your_token_here",
    "hostname": "test-host",
    "platform": "linux",
    "architecture": "amd64"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "credentialId": "ac_xxxxxxxxxx",
  "credentialSecret": "secret_xxxxxxxxxx",
  "assetId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "orgId": "org_abc123xyz"
}
```

---

## Common Log Messages

| Message | Meaning |
|---------|---------|
| `Deskwise Monitoring Agent started` | Agent initialized successfully |
| `Agent enrolled successfully` | First-time enrollment completed |
| `Loaded existing credentials from storage` | Using stored credentials from previous enrollment |
| `Performance data sent successfully` | Data transmitted to server |
| `Error sending performance data: ... connection refused` | Can't reach server |
| `Error enrolling agent: invalid enrollment token` | Token is invalid, expired, or already used |
| `Failed to load credentials` | Agent not enrolled or credential file missing |
| `Credentials revoked by administrator` | Admin revoked credentials - need to re-enroll |

---

## Where to Find Help

- **Full Documentation**: `agent/README.md`
- **Server Documentation**: `CLAUDE.md` (Performance Monitoring Agent section)
- **GitHub Issues**: Report bugs and request features
- **Check Server Logs**: Review Next.js console output for API errors
- **MongoDB Logs**: Query `performance_snapshots` collection to verify data storage

---

## Quick Reference: File Locations

| OS | Binary Location | Service/Config Location |
|----|-----------------|-------------------------|
| Windows | `C:\Program Files\Deskwise\deskwise-agent.exe` | Service: `DeskwiseAgent` |
| Linux | `/usr/local/bin/deskwise-agent` | `/etc/systemd/system/deskwise-agent.service` |
| macOS | `/usr/local/bin/deskwise-agent` | `/Library/LaunchDaemons/com.deskwise.agent.plist` |

---

## Performance Metrics Collected

- **CPU**: Usage %, frequency, temperature, per-core stats
- **Memory**: RAM usage (%), used/available/total bytes, swap usage
- **Disk**: Per-partition usage (%), capacity, I/O throughput
- **Network**: Per-interface traffic (bytes/packets per second)
- **System**: Uptime, process count, thread count

---

## Default Values

- **Collection Interval**: 60 seconds
- **Time Window**: 1min
- **Server URL**: http://localhost:9002
- **API Key** (dev): dev-agent-key
- **Timeout**: 10 seconds per request

---

**Version**: 1.0.0 MVP
**Last Updated**: 2025-10-07
**License**: Copyright © 2025 Deskwise. All rights reserved.
