@echo off
REM Deskwise Agent Build Script for Windows
REM Builds the monitoring agent for Windows, Linux, and macOS

echo Building Deskwise Monitoring Agent...

set VERSION=1.0.0
set BUILD_DIR=builds

REM Create build directory
if not exist %BUILD_DIR% mkdir %BUILD_DIR%

REM Build for Windows (64-bit)
echo Building for Windows (amd64)...
set GOOS=windows
set GOARCH=amd64
go build -o %BUILD_DIR%\deskwise-agent-windows-amd64.exe -ldflags="-s -w" .

REM Build for Linux (64-bit)
echo Building for Linux (amd64)...
set GOOS=linux
set GOARCH=amd64
go build -o %BUILD_DIR%\deskwise-agent-linux-amd64 -ldflags="-s -w" .

REM Build for Linux (ARM64)
echo Building for Linux (arm64)...
set GOOS=linux
set GOARCH=arm64
go build -o %BUILD_DIR%\deskwise-agent-linux-arm64 -ldflags="-s -w" .

REM Build for macOS (Intel)
echo Building for macOS (amd64)...
set GOOS=darwin
set GOARCH=amd64
go build -o %BUILD_DIR%\deskwise-agent-darwin-amd64 -ldflags="-s -w" .

REM Build for macOS (Apple Silicon)
echo Building for macOS (arm64)...
set GOOS=darwin
set GOARCH=arm64
go build -o %BUILD_DIR%\deskwise-agent-darwin-arm64 -ldflags="-s -w" .

echo.
echo Build complete! Binaries available in %BUILD_DIR%\
echo.
dir %BUILD_DIR%
