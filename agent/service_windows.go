//go:build windows
// +build windows

package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"strings"
	"time"

	"golang.org/x/sys/windows/svc"
)

// Windows service handler
type deskwiseService struct {
	config Config
}

func (m *deskwiseService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown
	changes <- svc.Status{State: svc.StartPending}

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Start monitoring in background
	done := make(chan error, 1)
	go func() {
		done <- runMonitoring(ctx, m.config)
	}()

	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
	log.Printf("Windows service started successfully")

loop:
	for {
		select {
		case c := <-r:
			switch c.Cmd {
			case svc.Interrogate:
				changes <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				log.Printf("Service stop request received")
				changes <- svc.Status{State: svc.StopPending}
				cancel()
				break loop
			default:
				log.Printf("Unexpected control request #%d", c)
			}
		case err := <-done:
			if err != nil {
				log.Printf("Monitoring stopped with error: %v", err)
			}
			break loop
		}
	}

	changes <- svc.Status{State: svc.Stopped}
	return
}

// isRunningAsService checks if the agent is running as a Windows service
func isRunningAsService() bool {
	isService, err := svc.IsWindowsService()
	if err != nil {
		return false
	}
	return isService
}

// runAsService runs the agent as a Windows service
func runAsService(config Config) error {
	log.Printf("Starting DeskwiseAgent service")
	return svc.Run("DeskwiseAgent", &deskwiseService{config: config})
}

// installService installs the agent as a Windows service
func installService(config *Config) error {
	// Check if already running as a service
	isService, err := svc.IsWindowsService()
	if err != nil || isService {
		// Either can't determine or already running as service
		return fmt.Errorf("skip service installation")
	}

	log.Printf("Installing agent as Windows service...")

	// Get the executable path
	exePath, err := os.Executable()
	if err != nil {
		log.Printf("Warning: Failed to get executable path: %v", err)
		return err
	}

	// Service configuration
	serviceName := "DeskwiseAgent"
	displayName := "Deskwise Monitoring Agent"
	description := "Collects and sends system performance metrics to Deskwise server"

	// Build service binary path with arguments
	binaryPathName := fmt.Sprintf(`"%s" -server "%s" -interval %d`, exePath, config.ServerURL, config.Interval)

	// Create service using sc.exe
	createCmd := exec.Command("sc.exe", "create", serviceName,
		"binPath=", binaryPathName,
		"DisplayName=", displayName,
		"start=", "auto")

	createOutput, err := createCmd.CombinedOutput()
	if err != nil {
		// Check if service already exists
		if strings.Contains(string(createOutput), "already exists") {
			log.Printf("Service already exists, updating...")
			// Delete existing service
			deleteCmd := exec.Command("sc.exe", "delete", serviceName)
			deleteCmd.Run()
			time.Sleep(2 * time.Second)
			// Try creating again
			createOutput, err = createCmd.CombinedOutput()
			if err != nil {
				log.Printf("Warning: Failed to create service: %v - %s", err, string(createOutput))
				return err
			}
		} else {
			log.Printf("Warning: Failed to create service: %v - %s", err, string(createOutput))
			return err
		}
	}

	// Set service description
	descCmd := exec.Command("sc.exe", "description", serviceName, description)
	descCmd.Run()

	// Set service to restart on failure
	failureCmd := exec.Command("sc.exe", "failure", serviceName,
		"reset= 86400",
		"actions= restart/60000/restart/60000/restart/60000")
	failureCmd.Run()

	// Start the service
	startCmd := exec.Command("sc.exe", "start", serviceName)
	startOutput, err := startCmd.CombinedOutput()
	if err != nil {
		// If start fails, still consider installation successful
		log.Printf("Service created but start may have failed: %s", string(startOutput))
	} else {
		log.Printf("Successfully installed as Windows service 'DeskwiseAgent'")
		log.Printf("The service will start automatically and run in the background")
	}

	return nil
}
