//go:build !windows
// +build !windows

package main

import "fmt"

// isRunningAsService always returns false on non-Windows platforms
func isRunningAsService() bool {
	return false
}

// runAsService is not supported on non-Windows platforms
func runAsService(config Config) error {
	return fmt.Errorf("service mode not supported on this platform")
}

// installService is not supported on non-Windows platforms
func installService(config *Config) error {
	// Return error to indicate service installation is not available
	// This will be silently ignored in main.go
	return fmt.Errorf("service installation not supported on this platform")
}
