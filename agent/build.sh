#!/bin/bash

# Deskwise Agent Build Script
# Builds the monitoring agent for Windows, Linux, and macOS

set -e

echo "Building Deskwise Monitoring Agent..."

# Version
VERSION="1.0.0"
BUILD_DIR="builds"

# Create build directory
mkdir -p $BUILD_DIR

# Build for Windows (64-bit)
echo "Building for Windows (amd64)..."
GOOS=windows GOARCH=amd64 go build -o $BUILD_DIR/deskwise-agent-windows-amd64.exe -ldflags="-s -w" main.go

# Build for Linux (64-bit)
echo "Building for Linux (amd64)..."
GOOS=linux GOARCH=amd64 go build -o $BUILD_DIR/deskwise-agent-linux-amd64 -ldflags="-s -w" main.go

# Build for Linux (ARM64)
echo "Building for Linux (arm64)..."
GOOS=linux GOARCH=arm64 go build -o $BUILD_DIR/deskwise-agent-linux-arm64 -ldflags="-s -w" main.go

# Build for macOS (Intel)
echo "Building for macOS (amd64)..."
GOOS=darwin GOARCH=amd64 go build -o $BUILD_DIR/deskwise-agent-darwin-amd64 -ldflags="-s -w" main.go

# Build for macOS (Apple Silicon)
echo "Building for macOS (arm64)..."
GOOS=darwin GOARCH=arm64 go build -o $BUILD_DIR/deskwise-agent-darwin-arm64 -ldflags="-s -w" main.go

echo ""
echo "Build complete! Binaries available in $BUILD_DIR/"
echo ""
ls -lh $BUILD_DIR/
