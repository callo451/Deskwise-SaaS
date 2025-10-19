# Deskwise Monitoring Agent

A lightweight, cross-platform monitoring agent for the Deskwise ITSM platform. Collects real-time performance metrics from workstations and servers and streams them to the Deskwise dashboard.

## Quick Start for Development

### Building the Agent Locally

1. **Prerequisites**: Install Go 1.21 or later from https://go.dev/dl/

2. **Navigate to agent directory**:
   ```bash
   cd agent
   ```

3. **Install dependencies**:
   ```bash
   go mod download
   ```

4. **Build for your current platform**:
   ```bash
   # Linux/macOS
   go build -o deskwise-agent main.go

   # Windows (PowerShell)
   go build -o deskwise-agent.exe main.go
   ```

5. **Generate an enrollment token in Deskwise**:
   - Navigate to Settings → Assets in the Deskwise web interface
   - Click on the asset you want to monitor
   - Go to the "Monitoring Agent" tab
   - Click "Generate Enrollment Token"
   - Copy the one-time enrollment token

6. **Test the agent locally**:
   ```bash
   # Linux/macOS - First time enrollment
   ./deskwise-agent -server "http://localhost:9002" -enrollment-token "et_xxxxxxxxxxxxxxxxxx"

   # Windows - First time enrollment
   .\deskwise-agent.exe -server "http://localhost:9002" -enrollment-token "et_xxxxxxxxxxxxxxxxxx"
   ```

   After successful enrollment, the agent will store credentials locally and use them for subsequent runs.

### Building for All Platforms

Use the provided build scripts to create binaries for all supported platforms:

```bash
# Linux/macOS
./build.sh

# Windows
build.bat
```

Binaries will be created in the `builds/` directory:
- `deskwise-agent-windows-amd64.exe` - Windows 64-bit
- `deskwise-agent-linux-amd64` - Linux 64-bit
- `deskwise-agent-linux-arm64` - Linux ARM64
- `deskwise-agent-darwin-amd64` - macOS Intel
- `deskwise-agent-darwin-arm64` - macOS Apple Silicon

### Server-Side Configuration

No special environment variables are required for agent enrollment. The enrollment token system is enabled by default and uses MongoDB to store:
- Enrollment tokens (one-time use, with expiration)
- Agent credentials (long-lived credentials for enrolled agents)

These collections are automatically created when you generate your first enrollment token through the Deskwise web interface.

### Testing the Complete Flow

1. **Start the Deskwise server**:
   ```bash
   npm run dev
   ```

2. **Generate an enrollment token**:
   - Open http://localhost:9002 in your browser
   - Navigate to Settings → Assets
   - Select an asset (or create a new one)
   - Go to the "Monitoring Agent" tab
   - Click "Generate Enrollment Token"
   - Copy the token (it looks like: `et_xxxxxxxxxxxxxxxxxx`)

3. **In another terminal, enroll and run the agent**:
   ```bash
   # First run with enrollment token
   ./deskwise-agent -server "http://localhost:9002" -enrollment-token "et_xxxxxxxxxxxxxxxxxx" -interval 30

   # Subsequent runs (credentials stored locally)
   ./deskwise-agent -server "http://localhost:9002" -interval 30
   ```

4. **Monitor the agent output**:
   - You should see "Agent enrolled successfully" on first run
   - Then "Performance data sent successfully" messages every 30 seconds
   - Check the server logs for incoming performance data

5. **Verify data in MongoDB**:
   ```bash
   # Connect to your MongoDB instance
   mongosh "your-mongodb-uri"

   # Query performance snapshots
   use deskwise
   db.performance_snapshots.find().limit(5).pretty()
   ```

## Features

### Performance Monitoring
- **Multi-Platform Support**: Works on Windows, Linux, and macOS
- **Real-Time Monitoring**: Collects performance data every 60 seconds (configurable)
- **Comprehensive Metrics**:
  - CPU usage (overall and per-core), frequency, temperature
  - Memory usage (RAM and swap)
  - Disk usage and I/O statistics
  - Network activity (bytes/packets per second)
  - System information (uptime, process/thread counts)

### Remote Control (Integrated)
- **Browser-Based Remote Access**: Technicians can remotely control workstations directly from Deskwise dashboard
- **WebRTC Technology**: Low-latency, peer-to-peer connections for screen sharing and input control
- **Automatic Discovery**: Agent automatically detects when remote control session is requested
- **No Separate Installation**: Remote control functionality built into the monitoring agent
- **Security-First**: Encrypted connections, audit logging, and optional consent workflow
- **📖 Full Documentation**: See [REMOTE_CONTROL.md](REMOTE_CONTROL.md) for complete details

### Security & Deployment
- **Secure Enrollment**: One-time enrollment token system with automatic credential exchange
- **Token-Based Authentication**: Secure credential storage and automatic authentication
- **Lightweight**: Minimal resource footprint (~10MB memory usage)
- **Easy Deployment**: Single binary with no dependencies, no manual configuration needed

## System Requirements

- **Windows**: Windows 10/11 or Windows Server 2016+
- **Linux**: Any modern Linux distribution (Ubuntu, CentOS, Debian, etc.)
- **macOS**: macOS 10.15+ (Intel or Apple Silicon)

## Installation

**Important**: Before installing the agent, generate an enrollment token in the Deskwise web interface:
1. Navigate to Settings → Assets
2. Select or create an asset to monitor
3. Go to the "Monitoring Agent" tab
4. Click "Generate Enrollment Token"
5. Copy the enrollment token (format: `et_xxxxxxxxxxxxxxxxxx`)

### Windows

1. Download the agent executable:
   ```powershell
   # Download from Deskwise dashboard or use direct link
   Invoke-WebRequest -Uri "https://your-deskwise-instance.com/downloads/agent/windows" -OutFile "deskwise-agent.exe"
   ```

2. Install as a Windows Service:
   ```powershell
   # Run as administrator with enrollment token
   .\deskwise-agent.exe install -server "https://your-deskwise-instance.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"
   ```

3. Start the service:
   ```powershell
   Start-Service DeskwiseAgent
   ```

### Linux

1. Download the agent executable:
   ```bash
   # For x64 systems
   wget https://your-deskwise-instance.com/downloads/agent/linux-amd64 -O deskwise-agent

   # For ARM64 systems
   wget https://your-deskwise-instance.com/downloads/agent/linux-arm64 -O deskwise-agent

   chmod +x deskwise-agent
   ```

2. Enroll the agent first (stores credentials locally):
   ```bash
   ./deskwise-agent -server "https://your-deskwise-instance.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"
   # Press Ctrl+C after seeing "Agent enrolled successfully"
   ```

3. Install as a systemd service:
   ```bash
   sudo cp deskwise-agent /usr/local/bin/
   sudo cp deskwise-agent.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable deskwise-agent
   sudo systemctl start deskwise-agent
   ```

### macOS

1. Download the agent executable:
   ```bash
   # For Intel Macs
   wget https://your-deskwise-instance.com/downloads/agent/darwin-amd64 -O deskwise-agent

   # For Apple Silicon Macs
   wget https://your-deskwise-instance.com/downloads/agent/darwin-arm64 -O deskwise-agent

   chmod +x deskwise-agent
   ```

2. Enroll the agent first (stores credentials locally):
   ```bash
   ./deskwise-agent -server "https://your-deskwise-instance.com" -enrollment-token "YOUR_ENROLLMENT_TOKEN"
   # Press Ctrl+C after seeing "Agent enrolled successfully"
   ```

3. Install as a launchd service:
   ```bash
   sudo cp deskwise-agent /usr/local/bin/
   sudo cp com.deskwise.agent.plist /Library/LaunchDaemons/
   sudo launchctl load /Library/LaunchDaemons/com.deskwise.agent.plist
   ```

## Configuration

### First-Time Enrollment

On first run, use an enrollment token to register the agent:

```bash
deskwise-agent \
  -server "https://your-deskwise-instance.com" \
  -enrollment-token "et_xxxxxxxxxxxxxxxxxx"
```

The agent will:
1. Exchange the enrollment token for permanent credentials
2. Store credentials locally in a secure file
3. Begin collecting and sending performance data

### Subsequent Runs

After enrollment, the agent automatically uses stored credentials:

```bash
deskwise-agent \
  -server "https://your-deskwise-instance.com" \
  -interval 60 \
  -time-window "1min"
```

### Configuration File

Create a `config.json` file (credentials are stored separately):

```json
{
  "serverURL": "https://your-deskwise-instance.com",
  "interval": 60,
  "timeWindow": "1min"
}
```

Then run:
```bash
deskwise-agent -config config.json
```

### Configuration Options

| Option | Description | Default | Required |
|--------|-------------|---------|----------|
| `-server` | Deskwise server URL | http://localhost:9002 | Yes |
| `-enrollment-token` | One-time enrollment token | - | First run only |
| `-interval` | Collection interval (seconds) | 60 | No |
| `-time-window` | Time window for aggregation | 1min | No |
| `-config` | Path to configuration file | - | No |

**Note**: After enrollment, `asset-id`, `org-id`, and authentication credentials are automatically managed by the agent.

## Usage

### Manual Run

```bash
# First run - Windows (with enrollment token)
deskwise-agent.exe -server "https://your-deskwise.com" -enrollment-token "et_xxxxxxxxxxxxxxxxxx"

# First run - Linux/macOS (with enrollment token)
./deskwise-agent -server "https://your-deskwise.com" -enrollment-token "et_xxxxxxxxxxxxxxxxxx"

# Subsequent runs - credentials stored locally
deskwise-agent.exe -server "https://your-deskwise.com"
./deskwise-agent -server "https://your-deskwise.com"
```

### Service Management

**Windows:**
```powershell
# Start service
Start-Service DeskwiseAgent

# Stop service
Stop-Service DeskwiseAgent

# Check status
Get-Service DeskwiseAgent

# View logs
Get-EventLog -LogName Application -Source "Deskwise Agent"
```

**Linux (systemd):**
```bash
# Start service
sudo systemctl start deskwise-agent

# Stop service
sudo systemctl stop deskwise-agent

# Check status
sudo systemctl status deskwise-agent

# View logs
sudo journalctl -u deskwise-agent -f
```

**macOS (launchd):**
```bash
# Start service
sudo launchctl start com.deskwise.agent

# Stop service
sudo launchctl stop com.deskwise.agent

# View logs
tail -f /var/log/deskwise-agent.log
```

## Building from Source

### Prerequisites

- Go 1.21 or later
- Internet connection (for dependencies)

### Build Steps

1. Clone the repository and navigate to the agent directory:
   ```bash
   cd agent
   ```

2. Install dependencies:
   ```bash
   go mod download
   ```

3. Build for your platform:
   ```bash
   go build -o deskwise-agent main.go
   ```

4. Or use the provided build scripts to compile for all platforms:
   ```bash
   # Linux/macOS
   ./build.sh

   # Windows
   build.bat
   ```

Binaries will be available in the `builds/` directory.

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused Error

**Symptom**: Agent shows `failed to send request: ... connection refused`

**Solutions**:
- **Verify Server URL**: Ensure the `-server` flag points to the correct Deskwise instance
  ```bash
  # For local development
  -server "http://localhost:9002"

  # For production
  -server "https://your-deskwise-instance.com"
  ```
- **Check Server Status**: Verify the Deskwise server is running
  ```bash
  # Local development
  npm run dev

  # Check if server is responding
  curl http://localhost:9002/api/health
  ```
- **Firewall Settings**: Ensure outbound connections are allowed on port 9002 (dev) or 443 (production)
- **VPN/Proxy**: If behind a corporate proxy, configure proxy settings in your environment

#### 2. Enrollment Failures

**Symptom**: `Error enrolling agent: invalid enrollment token` or `Enrollment token expired`

**Solutions**:
- **Generate New Token**: Enrollment tokens are one-time use and expire after 24 hours
  - Go to Settings → Assets in Deskwise
  - Navigate to the asset's "Monitoring Agent" tab
  - Click "Generate Enrollment Token" for a fresh token
- **Check Token Format**: Ensure token starts with `et_` and is complete
- **Verify Server URL**: Ensure `-server` flag points to the correct Deskwise instance
- **Check Token Status**: In Deskwise UI, check if token shows as "Used" or "Expired"
- **Network Issues**: Ensure agent can reach the server during enrollment

#### 3. Credential Issues

**Symptom**: `Failed to load credentials` or `Authentication failed`

**Solutions**:
- **Re-enroll Agent**: Delete credential file and enroll again
  ```bash
  # Linux/macOS
  rm ~/.deskwise/agent-credentials.json

  # Windows
  del %USERPROFILE%\.deskwise\agent-credentials.json
  ```
  Then run enrollment again with a new token
- **Check File Permissions**: Ensure credential file is readable
- **Revoked Credentials**: Admin may have revoked agent credentials in Deskwise
  - Check agent status in Settings → Assets → Monitoring Agent tab
  - Re-enroll if credentials were revoked

#### 4. No Data Appearing in Dashboard

**Symptom**: Agent reports "Performance data sent successfully" but no data visible in Deskwise

**Solutions**:
- **Verify Enrollment**: Ensure agent enrolled successfully (check for "Agent enrolled successfully" message)
- **Check Asset Page**: In Deskwise, navigate to the asset and check the "Monitoring Agent" tab
  - Verify agent status shows as "Active"
  - Check "Last Seen" timestamp updates
- **Verify Data Storage**: Check MongoDB for performance snapshots
  ```bash
  # Connect to MongoDB
  mongosh "your-mongodb-uri"

  # Query recent snapshots
  use deskwise
  db.performance_snapshots.find().sort({ timestamp: -1 }).limit(5).pretty()
  ```
- **Check Collection Permissions**: Ensure the MongoDB user has write access to `performance_snapshots`
- **Time Window Issues**: Verify you're looking at the correct time range in the dashboard

#### 5. Agent Crashes or Exits Unexpectedly

**Symptom**: Agent stops running after a short time

**Solutions**:
- **Check Enrollment**: Ensure agent was enrolled before running as a service
  - Enrollment must complete successfully first
  - Credentials must be stored locally
- **Check System Permissions**: Agent needs read access to system metrics
  ```bash
  # Linux - Run with appropriate permissions
  sudo ./deskwise-agent ...

  # Windows - Run as Administrator
  ```
- **Review Error Logs**: Check agent output for error messages
- **Memory Limits**: Ensure system has at least 50MB free memory for the agent

#### 5. High CPU/Memory Usage

**Symptom**: Agent consumes excessive resources

**Solutions**:
- **Increase Collection Interval**: Reduce collection frequency
  ```bash
  -interval 300  # Collect every 5 minutes instead of 1 minute
  ```
- **Limit Per-Core Monitoring**: Disable if not needed (modify source code)
- **Check Network Issues**: Slow network connections can cause data to queue up
- **Update Go Version**: Ensure using Go 1.21 or later for performance improvements

#### 6. Build Failures

**Symptom**: `go build` fails with errors

**Solutions**:
- **Install Go**: Ensure Go 1.21+ is installed
  ```bash
  go version  # Should show go1.21 or higher
  ```
- **Clear Module Cache**: Remove corrupted dependencies
  ```bash
  go clean -modcache
  go mod download
  ```
- **Check Dependencies**: Ensure all required packages are available
  ```bash
  go mod tidy
  ```
- **Platform-Specific Issues**: Use appropriate build commands for your OS

#### 7. Service Installation Issues (Windows)

**Symptom**: Windows Service fails to install or start

**Solutions**:
- **Run as Administrator**: Service installation requires admin privileges
- **Check Service Name**: Ensure no conflicting service exists
  ```powershell
  Get-Service DeskwiseAgent
  ```
- **Review Event Viewer**: Check Windows Event Viewer for service errors
- **Verify Paths**: Ensure all file paths are absolute and accessible

#### 8. Service Installation Issues (Linux)

**Symptom**: systemd service fails to start

**Solutions**:
- **Check Service File**: Verify `/etc/systemd/system/deskwise-agent.service` exists
- **Reload systemd**: After creating service file
  ```bash
  sudo systemctl daemon-reload
  ```
- **Check Permissions**: Ensure binary is executable
  ```bash
  sudo chmod +x /usr/local/bin/deskwise-agent
  ```
- **Review Logs**: Check systemd logs for errors
  ```bash
  sudo journalctl -u deskwise-agent -n 50 --no-pager
  ```

### Getting Additional Help

If issues persist:
1. **Check Enrollment Status**: In Deskwise web UI, go to Settings → Assets → Select Asset → Monitoring Agent tab
   - View enrollment token status (Active/Used/Expired/Revoked)
   - Check agent credential status (Active/Revoked)
   - View agent last seen timestamp
2. **Test Enrollment Endpoint**: Verify enrollment API is working
   ```bash
   curl -X POST http://localhost:9002/api/agent/enroll \
     -H "Content-Type: application/json" \
     -d '{"enrollmentToken":"et_test123","hostname":"test-host","platform":"linux","architecture":"amd64"}'
   ```
3. **Verify MongoDB Connection**: Ensure MongoDB is accessible from the server
   - Check `enrollment_tokens` collection for generated tokens
   - Check `agent_credentials` collection for enrolled agents
4. **Check Server Logs**: Review Next.js server logs for enrollment and authentication errors

## Security Considerations

- **Enrollment Tokens**: One-time use tokens that expire after 24 hours
- **Credential Storage**: Agent credentials stored locally in encrypted format
- **Token Revocation**: Admins can revoke agent credentials at any time through the web UI
- **Encryption**: All communication uses HTTPS/TLS
- **Permissions**: Agent requires read-only system access
- **Network**: Agent only sends data outbound; no inbound connections
- **Updates**: Keep agent updated for security patches
- **Audit Trail**: All enrollment and authentication events are logged in MongoDB

## API Endpoints

The agent communicates with these Deskwise API endpoints:

- `POST /api/agent/enroll` - Enroll agent with one-time enrollment token
- `POST /api/agent/performance` - Submit performance snapshots (requires agent credentials)
- `GET /api/agent/performance` - Retrieve historical performance data (optional)

## Data Format

Performance snapshots are sent in JSON format:

```json
{
  "agentId": "windows-DESKTOP-ABC-1696234567",
  "assetId": "65f1a2b3c4d5e6f7g8h9i0j1",
  "timestamp": "2025-10-07T10:30:00Z",
  "timeWindow": "1min",
  "performanceData": {
    "cpu": {
      "usage": 45.2,
      "temperature": 65.0,
      "frequency": 3600.0,
      "perCore": [40.1, 42.3, 48.5, 50.1]
    },
    "memory": {
      "usagePercent": 68.5,
      "usedBytes": 11019960320,
      "totalBytes": 16106127360,
      "availableBytes": 5086167040,
      "swapUsed": 0
    },
    "disk": [
      {
        "name": "C:",
        "usagePercent": 72.3,
        "totalBytes": 512110190592,
        "usedBytes": 370331242496,
        "freeBytes": 141778948096
      }
    ],
    "network": {
      "totalUsage": 152430,
      "interfaces": [
        {
          "name": "Ethernet",
          "bytesRecvPerSec": 102400,
          "bytesSentPerSec": 50030,
          "packetsRecvPerSec": 150,
          "packetsSentPerSec": 120
        }
      ]
    },
    "system": {
      "uptime": 345600,
      "processCount": 245,
      "threadCount": 1820
    }
  }
}
```

## License

Copyright © 2025 Deskwise. All rights reserved.

## Support

For issues, questions, or feature requests:
- **Documentation**: https://docs.deskwise.com
- **Support Portal**: https://support.deskwise.com
- **Email**: support@deskwise.com

## Changelog

### Version 1.0.0 (2025-10-07)
- Initial release
- Multi-platform support (Windows, Linux, macOS)
- Real-time performance monitoring
- Secure API integration
- Service installation support
