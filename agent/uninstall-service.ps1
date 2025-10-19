# Deskwise Agent - Windows Service Uninstaller
# Run this script as Administrator

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceName = "DeskwiseAgent"
)

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "This script must be run as Administrator"
    exit 1
}

# Check if service exists
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if (-not $service) {
    Write-Host "Service '$ServiceName' not found. Nothing to uninstall."
    exit 0
}

Write-Host "Stopping service '$ServiceName'..."
Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue

Write-Host "Removing service..."
sc.exe delete $ServiceName

Start-Sleep -Seconds 2

# Verify removal
$service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Error "Failed to remove service"
    exit 1
} else {
    Write-Host "Service uninstalled successfully!" -ForegroundColor Green
}
