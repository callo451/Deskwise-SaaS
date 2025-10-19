# Deskwise Agent - Windows Service Installer
# Run this script as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerURL,

    [Parameter(Mandatory=$false)]
    [string]$EnrollmentToken,

    [Parameter(Mandatory=$false)]
    [int]$Interval = 60,

    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "DeskwiseAgent"
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$agentPath = Join-Path $scriptDir "builds\deskwise-agent-windows-amd64.exe"
$credentialPath = Join-Path $scriptDir "agent-credential.json"

# Check if agent exists
if (-not (Test-Path $agentPath)) {
    Write-Error "Agent executable not found at: $agentPath"
    Write-Host "Please build the agent first using build.bat"
    exit 1
}

# Check if service already exists
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Service '$ServiceName' already exists. Stopping and removing..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# If enrollment token provided and no credential exists, enroll first
if ($EnrollmentToken -and -not (Test-Path $credentialPath)) {
    Write-Host "Enrolling agent with server..."
    $enrollArgs = "-server `"$ServerURL`" -enrollment-token `"$EnrollmentToken`""
    Start-Process -FilePath $agentPath -ArgumentList $enrollArgs -Wait -NoNewWindow

    if (-not (Test-Path $credentialPath)) {
        Write-Error "Enrollment failed - credential file not created"
        exit 1
    }
    Write-Host "Enrollment successful!"
}

# Check if credential exists
if (-not (Test-Path $credentialPath)) {
    Write-Error "No credential file found. Please provide -EnrollmentToken parameter or enroll manually first."
    exit 1
}

# Create the service
Write-Host "Installing service '$ServiceName'..."

$serviceArgs = "-server `"$ServerURL`" -interval $Interval"
$binaryPathName = "`"$agentPath`" $serviceArgs"

New-Service -Name $ServiceName `
    -BinaryPathName $binaryPathName `
    -DisplayName "Deskwise Monitoring Agent" `
    -Description "Collects and sends system performance metrics to Deskwise server" `
    -StartupType Automatic `
    -ErrorAction Stop

# Set service to restart on failure
sc.exe failure $ServiceName reset= 86400 actions= restart/60000/restart/60000/restart/60000

# Start the service
Write-Host "Starting service..."
Start-Service -Name $ServiceName

# Wait a moment and check status
Start-Sleep -Seconds 2
$service = Get-Service -Name $ServiceName
if ($service.Status -eq 'Running') {
    Write-Host "`nService installed and started successfully!" -ForegroundColor Green
    Write-Host "`nService Details:"
    Write-Host "  Name: $ServiceName"
    Write-Host "  Status: $($service.Status)"
    Write-Host "  Startup Type: Automatic"
    Write-Host "  Server: $ServerURL"
    Write-Host "  Interval: $Interval seconds"
    Write-Host "`nThe agent will now run continuously, even after reboot."
} else {
    Write-Error "Service installed but failed to start. Status: $($service.Status)"
    Write-Host "Check Windows Event Viewer for error details."
    exit 1
}
