package main

import (
	"bytes"
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
	"github.com/shirou/gopsutil/v3/process"

	"deskwise-agent/remotecontrol"
)

// Config holds the configuration for the monitoring agent
type Config struct {
	ServerURL       string // Base URL of the Deskwise server
	AgentID         string // Unique identifier for this agent instance
	AssetID         string // Asset ID assigned during enrollment
	CredentialKey   string // Long-lived credential key (obtained from enrollment)
	Interval        int    // Collection interval in seconds (default: 60)
	TimeWindow      string // Time window for data aggregation
	CredentialFile  string // Path to local credential file
}

// EnrollmentRequest is sent to the server during initial enrollment
type EnrollmentRequest struct {
	EnrollmentToken string          `json:"enrollmentToken"`
	AgentID         string          `json:"agentId"`
	Hostname        string          `json:"hostname"`
	Platform        string          `json:"platform"`
	Arch            string          `json:"arch"`
	SystemInfo      SystemInfo      `json:"systemInfo"`
	HardwareInfo    HardwareInfo    `json:"hardwareInfo"`
	NetworkInfo     NetworkInfo     `json:"networkInfo"`
}

// SystemInfo contains comprehensive operating system information
type SystemInfo struct {
	OSName            string `json:"osName"`
	OSVersion         string `json:"osVersion"`
	OSBuild           string `json:"osBuild"`
	KernelVersion     string `json:"kernelVersion"`
	KernelArch        string `json:"kernelArch"`
	Platform          string `json:"platform"`
	PlatformFamily    string `json:"platformFamily"`
	PlatformVersion   string `json:"platformVersion"`
	VirtualizationSystem string `json:"virtualizationSystem,omitempty"`
	VirtualizationRole   string `json:"virtualizationRole,omitempty"`
}

// HardwareInfo contains hardware and BIOS information
type HardwareInfo struct {
	Manufacturer    string `json:"manufacturer"`
	Model           string `json:"model"`
	SerialNumber    string `json:"serialNumber"`
	UUID            string `json:"uuid"`
	BIOSVersion     string `json:"biosVersion,omitempty"`
	BIOSVendor      string `json:"biosVendor,omitempty"`
	BIOSDate        string `json:"biosDate,omitempty"`
	CPUModel        string `json:"cpuModel"`
	CPUCores        int32  `json:"cpuCores"`
	CPUThreads      int32  `json:"cpuThreads,omitempty"`
	TotalMemoryGB   float64 `json:"totalMemoryGB"`
	TotalDiskGB     float64 `json:"totalDiskGB"`
}

// NetworkInfo contains network configuration details
type NetworkInfo struct {
	PrimaryMAC      string   `json:"primaryMac"`
	MACAddresses    []string `json:"macAddresses"`
	IPAddresses     []string `json:"ipAddresses"`
	PrimaryIP       string   `json:"primaryIp"`
	FQDN            string   `json:"fqdn,omitempty"`
}

// EnrollmentResponse is received from the server after successful enrollment
type EnrollmentResponse struct {
	Success       bool   `json:"success"`
	CredentialKey string `json:"credentialKey"`
	AssetID       string `json:"assetId"`
	Message       string `json:"message"`
	Error         string `json:"error,omitempty"`
}

// PerformanceSnapshot represents a complete snapshot of system performance metrics
type PerformanceSnapshot struct {
	AgentID         string                                   `json:"agentId"`
	AssetID         string                                   `json:"assetId"`
	Timestamp       string                                   `json:"timestamp"`
	TimeWindow      string                                   `json:"timeWindow"`
	PerformanceData PerformanceData                          `json:"performanceData"`
	Capabilities    *remotecontrol.RemoteControlCapabilities `json:"capabilities,omitempty"`
}

// PerformanceData contains all collected system metrics
type PerformanceData struct {
	CPU     CPUData     `json:"cpu"`
	Memory  MemoryData  `json:"memory"`
	Disk    []DiskData  `json:"disk"`
	Network NetworkData `json:"network"`
	System  SystemData  `json:"system"`
}

// CPUData contains CPU-related performance metrics
type CPUData struct {
	Usage       float64   `json:"usage"`
	Temperature *float64  `json:"temperature,omitempty"`
	Frequency   *float64  `json:"frequency,omitempty"`
	PerCore     []float64 `json:"perCore,omitempty"`
}

// MemoryData contains memory usage statistics
type MemoryData struct {
	UsagePercent   float64 `json:"usagePercent"`
	UsedBytes      uint64  `json:"usedBytes"`
	TotalBytes     uint64  `json:"totalBytes"`
	AvailableBytes uint64  `json:"availableBytes"`
	SwapUsed       *uint64 `json:"swapUsed,omitempty"`
}

// DiskData contains disk usage and I/O statistics
type DiskData struct {
	Name             string   `json:"name"`
	UsagePercent     float64  `json:"usagePercent"`
	TotalBytes       uint64   `json:"totalBytes"`
	UsedBytes        uint64   `json:"usedBytes"`
	FreeBytes        uint64   `json:"freeBytes"`
	ReadBytesPerSec  *float64 `json:"readBytesPerSec,omitempty"`
	WriteBytesPerSec *float64 `json:"writeBytesPerSec,omitempty"`
	ReadOpsPerSec    *float64 `json:"readOpsPerSec,omitempty"`
	WriteOpsPerSec   *float64 `json:"writeOpsPerSec,omitempty"`
}

// NetworkData contains network statistics across all interfaces
type NetworkData struct {
	TotalUsage float64            `json:"totalUsage"`
	Interfaces []NetworkInterface `json:"interfaces"`
}

// NetworkInterface contains statistics for a single network interface
type NetworkInterface struct {
	Name              string  `json:"name"`
	BytesRecvPerSec   float64 `json:"bytesRecvPerSec"`
	BytesSentPerSec   float64 `json:"bytesSentPerSec"`
	PacketsRecvPerSec float64 `json:"packetsRecvPerSec"`
	PacketsSentPerSec float64 `json:"packetsSentPerSec"`
}

// SystemData contains general system information
type SystemData struct {
	Uptime       uint64 `json:"uptime"`
	ProcessCount int    `json:"processCount"`
	ThreadCount  int    `json:"threadCount"`
}

// SessionInfo represents a remote control session from the server
type SessionInfo struct {
	SessionID string `json:"sessionId"`
	Token     string `json:"token"`
	AssetID   string `json:"assetId"`
	OrgID     string `json:"orgId"`
	Status    string `json:"status"`
}

// Global variables for network statistics delta calculation
var prevNetStats map[string]net.IOCountersStat
var prevNetTime time.Time

// Global remote control manager
var rcManager *remotecontrol.Manager

func main() {
	// Command line flags
	serverURL := flag.String("server", "http://localhost:9002", "Deskwise server URL")
	enrollmentToken := flag.String("enrollment-token", "", "Enrollment token for first-time setup")
	interval := flag.Int("interval", 60, "Collection interval in seconds")
	timeWindow := flag.String("time-window", "1min", "Time window for aggregation")
	credentialFile := flag.String("credential-file", "./agent-credential.json", "Path to credential file")

	flag.Parse()

	// Load or create configuration
	config := Config{
		ServerURL:      *serverURL,
		Interval:       *interval,
		TimeWindow:     *timeWindow,
		CredentialFile: *credentialFile,
	}

	// Generate agent ID if not already set
	hostname, _ := os.Hostname()
	config.AgentID = fmt.Sprintf("%s-%s-%d", runtime.GOOS, hostname, time.Now().Unix())

	// Try to load existing credential
	if err := loadCredential(&config); err != nil {
		log.Printf("No existing credential found: %v", err)

		// Check if enrollment token was provided
		if *enrollmentToken == "" {
			log.Fatal("No credential found and no enrollment token provided. Please provide -enrollment-token flag.")
		}

		// Enroll the agent
		log.Printf("Enrolling agent with server...")
		if err := enrollAgent(&config, *enrollmentToken); err != nil {
			log.Fatalf("Enrollment failed: %v", err)
		}

		log.Printf("Enrollment successful! Credential saved to %s", config.CredentialFile)

		// Attempt to install as service (Windows only, no-op on other platforms)
		if err := installService(&config); err == nil {
			// Service installed successfully and will run in background
			os.Exit(0)
		}
	} else {
		log.Printf("Loaded existing credential from %s", config.CredentialFile)
	}

	// Check if running as service (Windows only)
	if isRunningAsService() {
		// Run as service
		if err := runAsService(config); err != nil {
			log.Fatalf("Service failed: %v", err)
		}
		return
	}

	// Run in interactive mode (console/terminal)
	log.Printf("Deskwise Monitoring Agent started")
	log.Printf("Server: %s", config.ServerURL)
	log.Printf("Agent ID: %s", config.AgentID)
	log.Printf("Collection Interval: %d seconds", config.Interval)
	log.Printf("Platform: %s/%s", runtime.GOOS, runtime.GOARCH)

	// Initialize remote control manager
	const agentVersion = "1.0.0"
	rcManager = remotecontrol.NewManager(config.ServerURL, runtime.GOOS, agentVersion)
	log.Printf("[RemoteControl] Manager initialized with capabilities: %+v", rcManager.GetCapabilities())

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle interrupt signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	go func() {
		<-sigChan
		log.Printf("Shutdown signal received")

		// Stop any active remote control sessions
		if activeSession := rcManager.GetActiveSession(); activeSession != nil {
			log.Printf("[RemoteControl] Stopping active session: %s", activeSession.SessionID)
			rcManager.StopSession(activeSession.SessionID)
		}

		cancel()
	}()

	// Run monitoring
	if err := runMonitoring(ctx, config); err != nil {
		log.Fatalf("Monitoring failed: %v", err)
	}
}

// runMonitoring contains the main monitoring loop
func runMonitoring(ctx context.Context, config Config) error {
	// Initialize network stats
	prevNetStats = make(map[string]net.IOCountersStat)
	prevNetTime = time.Now()

	// Start monitoring loop
	ticker := time.NewTicker(time.Duration(config.Interval) * time.Second)
	defer ticker.Stop()

	// Start remote control session polling (every 10 seconds)
	rcTicker := time.NewTicker(10 * time.Second)
	defer rcTicker.Stop()

	// Collect and send immediately on start
	collectAndSend(config)

	// Then collect on interval
	for {
		select {
		case <-ctx.Done():
			log.Printf("Monitoring stopped")
			return nil
		case <-ticker.C:
			collectAndSend(config)
		case <-rcTicker.C:
			// Check for remote control sessions
			checkForRemoteControlSession(config)
		}
	}
}

// collectSystemInfo gathers comprehensive operating system information
func collectSystemInfo() SystemInfo {
	hostInfo, _ := host.Info()

	sysInfo := SystemInfo{
		OSName:          runtime.GOOS,
		Platform:        hostInfo.Platform,
		PlatformFamily:  hostInfo.PlatformFamily,
		PlatformVersion: hostInfo.PlatformVersion,
		OSVersion:       hostInfo.PlatformVersion,
		KernelVersion:   hostInfo.KernelVersion,
		KernelArch:      hostInfo.KernelArch,
	}

	// OS-specific build information
	if runtime.GOOS == "windows" {
		sysInfo.OSBuild = hostInfo.KernelVersion
	} else {
		sysInfo.OSBuild = hostInfo.KernelVersion
	}

	// Virtualization detection
	if hostInfo.VirtualizationSystem != "" {
		sysInfo.VirtualizationSystem = hostInfo.VirtualizationSystem
		sysInfo.VirtualizationRole = hostInfo.VirtualizationRole
	}

	return sysInfo
}

// collectHardwareInfo gathers hardware and system specifications
func collectHardwareInfo() HardwareInfo {
	hostInfo, _ := host.Info()
	memInfo, _ := mem.VirtualMemory()
	cpuInfo, _ := cpu.Info()

	hwInfo := HardwareInfo{
		UUID: hostInfo.HostID,
	}

	// CPU information
	if len(cpuInfo) > 0 {
		hwInfo.CPUModel = cpuInfo[0].ModelName
		hwInfo.CPUCores = cpuInfo[0].Cores
	}

	// Physical core count (logical processors / threads per core)
	physicalCount, _ := cpu.Counts(false)
	logicalCount, _ := cpu.Counts(true)
	if physicalCount > 0 {
		hwInfo.CPUCores = int32(physicalCount)
		hwInfo.CPUThreads = int32(logicalCount)
	}

	// Memory information (convert to GB)
	if memInfo != nil {
		hwInfo.TotalMemoryGB = float64(memInfo.Total) / (1024 * 1024 * 1024)
	}

	// Total disk capacity
	partitions, _ := disk.Partitions(false)
	var totalDiskBytes uint64 = 0
	for _, partition := range partitions {
		usage, err := disk.Usage(partition.Mountpoint)
		if err == nil {
			totalDiskBytes += usage.Total
		}
	}
	hwInfo.TotalDiskGB = float64(totalDiskBytes) / (1024 * 1024 * 1024)

	// Platform-specific hardware details
	// These fields may be populated differently per OS
	// Manufacturer, Model, SerialNumber often require platform-specific calls
	// For cross-platform compatibility, we'll use what gopsutil provides

	return hwInfo
}

// collectNetworkInfo gathers network configuration details
func collectNetworkInfo() NetworkInfo {
	netInfo := NetworkInfo{
		MACAddresses: []string{},
		IPAddresses:  []string{},
	}

	// Get network interfaces
	interfaces, err := net.Interfaces()
	if err == nil {
		for _, iface := range interfaces {
			// Skip loopback and down interfaces
			if iface.Name == "lo" || len(iface.Addrs) == 0 {
				continue
			}

			// Collect MAC addresses (skip empty)
			if iface.HardwareAddr != "" {
				netInfo.MACAddresses = append(netInfo.MACAddresses, iface.HardwareAddr)
				// Use first non-loopback MAC as primary
				if netInfo.PrimaryMAC == "" {
					netInfo.PrimaryMAC = iface.HardwareAddr
				}
			}

			// Collect IP addresses
			for _, addr := range iface.Addrs {
				ipStr := addr.Addr
				// Filter out loopback and link-local
				if !strings.Contains(ipStr, "127.0.0.1") &&
				   !strings.Contains(ipStr, "::1") &&
				   !strings.HasPrefix(ipStr, "169.254") &&
				   !strings.HasPrefix(ipStr, "fe80:") {
					// Remove CIDR suffix if present
					if strings.Contains(ipStr, "/") {
						ipStr = strings.Split(ipStr, "/")[0]
					}
					netInfo.IPAddresses = append(netInfo.IPAddresses, ipStr)
					// Use first non-loopback IP as primary
					if netInfo.PrimaryIP == "" && !strings.Contains(ipStr, ":") {
						netInfo.PrimaryIP = ipStr
					}
				}
			}
		}
	}

	// Try to get FQDN
	hostname, _ := os.Hostname()
	netInfo.FQDN = hostname

	return netInfo
}

// enrollAgent enrolls the agent with the server using an enrollment token
func enrollAgent(config *Config, enrollmentToken string) error {
	hostname, _ := os.Hostname()

	// Collect comprehensive system information
	log.Printf("Collecting system information...")
	systemInfo := collectSystemInfo()
	hardwareInfo := collectHardwareInfo()
	networkInfo := collectNetworkInfo()

	log.Printf("System: %s %s", systemInfo.Platform, systemInfo.PlatformVersion)
	log.Printf("Hardware: %d CPU cores, %.2f GB RAM, %.2f GB disk",
		hardwareInfo.CPUCores, hardwareInfo.TotalMemoryGB, hardwareInfo.TotalDiskGB)
	log.Printf("Network: %s (MAC: %s)", networkInfo.PrimaryIP, networkInfo.PrimaryMAC)

	enrollReq := EnrollmentRequest{
		EnrollmentToken: enrollmentToken,
		AgentID:         config.AgentID,
		Hostname:        hostname,
		Platform:        runtime.GOOS,
		Arch:            runtime.GOARCH,
		SystemInfo:      systemInfo,
		HardwareInfo:    hardwareInfo,
		NetworkInfo:     networkInfo,
	}

	jsonData, err := json.Marshal(enrollReq)
	if err != nil {
		return fmt.Errorf("failed to marshal enrollment request: %w", err)
	}

	url := fmt.Sprintf("%s/api/agent/enroll", config.ServerURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create enrollment request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send enrollment request: %w", err)
	}
	defer resp.Body.Close()

	var enrollResp EnrollmentResponse
	if err := json.NewDecoder(resp.Body).Decode(&enrollResp); err != nil {
		return fmt.Errorf("failed to decode enrollment response: %w", err)
	}

	if !enrollResp.Success {
		return fmt.Errorf("enrollment failed: %s", enrollResp.Error)
	}

	// Save credential and asset ID to file
	config.CredentialKey = enrollResp.CredentialKey
	config.AssetID = enrollResp.AssetID

	// Log asset creation info
	if enrollResp.AssetID != "" {
		log.Printf("Asset ID: %s", enrollResp.AssetID)
	}

	return saveCredential(config)
}

// loadCredential loads the agent credential from local file
func loadCredential(config *Config) error {
	data, err := ioutil.ReadFile(config.CredentialFile)
	if err != nil {
		return err
	}

	var cred struct {
		AgentID       string `json:"agentId"`
		AssetID       string `json:"assetId"`
		CredentialKey string `json:"credentialKey"`
	}

	if err := json.Unmarshal(data, &cred); err != nil {
		return err
	}

	config.AgentID = cred.AgentID
	config.AssetID = cred.AssetID
	config.CredentialKey = cred.CredentialKey

	return nil
}

// saveCredential saves the agent credential to local file
func saveCredential(config *Config) error {
	cred := struct {
		AgentID       string `json:"agentId"`
		AssetID       string `json:"assetId"`
		CredentialKey string `json:"credentialKey"`
	}{
		AgentID:       config.AgentID,
		AssetID:       config.AssetID,
		CredentialKey: config.CredentialKey,
	}

	data, err := json.MarshalIndent(cred, "", "  ")
	if err != nil {
		return err
	}

	// Ensure directory exists
	dir := filepath.Dir(config.CredentialFile)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// Write with restricted permissions (read/write for owner only)
	return ioutil.WriteFile(config.CredentialFile, data, 0600)
}

// collectAndSend collects performance data and sends it to the server
func collectAndSend(config Config) {
	snapshot := collectPerformanceData(config)

	err := sendPerformanceData(config, snapshot)
	if err != nil {
		log.Printf("Error sending performance data: %v", err)
	} else {
		log.Printf("Performance data sent successfully")
	}
}

// checkForRemoteControlSession polls the server for pending remote control sessions
func checkForRemoteControlSession(config Config) {
	url := fmt.Sprintf("%s/api/agent/rc/poll", config.ServerURL)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		log.Printf("[RemoteControl] Failed to create check-session request: %v", err)
		return
	}

	// Use credential key for authentication
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.CredentialKey))

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// Don't log errors for routine polls - only if verbose mode is enabled
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return
	}

	var result struct {
		Success bool        `json:"success"`
		Session SessionInfo `json:"session,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("[RemoteControl] Failed to decode check-session response: %v", err)
		return
	}

	if result.Success && result.Session.SessionID != "" {
		// Check if we already have an active session
		if activeSession := rcManager.GetActiveSession(); activeSession != nil {
			if activeSession.SessionID == result.Session.SessionID {
				// Session already active, nothing to do
				return
			}

			// Stop old session if a new one is requested
			log.Printf("[RemoteControl] Stopping old session %s to start new session %s",
				activeSession.SessionID, result.Session.SessionID)
			rcManager.StopSession(activeSession.SessionID)
		}

		// Start new remote control session
		log.Printf("[RemoteControl] Starting session: %s", result.Session.SessionID)
		if err := rcManager.StartSession(
			result.Session.SessionID,
			result.Session.Token,
			result.Session.AssetID,
			result.Session.OrgID,
		); err != nil {
			log.Printf("[RemoteControl] Failed to start session: %v", err)
		}
	}
}

// collectPerformanceData gathers all system performance metrics
func collectPerformanceData(config Config) PerformanceSnapshot {
	// Collect CPU data
	cpuPercent, _ := cpu.Percent(time.Second, false)
	cpuPerCore, _ := cpu.Percent(time.Second, true)
	cpuInfo, _ := cpu.Info()

	var cpuFreq *float64
	if len(cpuInfo) > 0 {
		freq := cpuInfo[0].Mhz
		cpuFreq = &freq
	}

	cpuData := CPUData{
		Usage:     cpuPercent[0],
		Frequency: cpuFreq,
		PerCore:   cpuPerCore,
	}

	// Collect Memory data
	memInfo, _ := mem.VirtualMemory()
	swapInfo, _ := mem.SwapMemory()

	var swapUsed *uint64
	if swapInfo != nil {
		swapUsed = &swapInfo.Used
	}

	memData := MemoryData{
		UsagePercent:   memInfo.UsedPercent,
		UsedBytes:      memInfo.Used,
		TotalBytes:     memInfo.Total,
		AvailableBytes: memInfo.Available,
		SwapUsed:       swapUsed,
	}

	// Collect Disk data
	partitions, _ := disk.Partitions(false)
	diskData := make([]DiskData, 0)

	for _, partition := range partitions {
		usage, err := disk.Usage(partition.Mountpoint)
		if err != nil {
			continue
		}

		diskData = append(diskData, DiskData{
			Name:         partition.Mountpoint,
			UsagePercent: usage.UsedPercent,
			TotalBytes:   usage.Total,
			UsedBytes:    usage.Used,
			FreeBytes:    usage.Free,
		})
	}

	// Collect Network data
	netIOCounters, _ := net.IOCounters(true)
	now := time.Now()
	duration := now.Sub(prevNetTime).Seconds()

	interfaces := make([]NetworkInterface, 0)
	totalBytesRecv := 0.0
	totalBytesSent := 0.0

	for _, nic := range netIOCounters {
		prevStats, exists := prevNetStats[nic.Name]

		var bytesRecvPerSec, bytesSentPerSec, packetsRecvPerSec, packetsSentPerSec float64

		if exists && duration > 0 {
			bytesRecvPerSec = float64(nic.BytesRecv-prevStats.BytesRecv) / duration
			bytesSentPerSec = float64(nic.BytesSent-prevStats.BytesSent) / duration
			packetsRecvPerSec = float64(nic.PacketsRecv-prevStats.PacketsRecv) / duration
			packetsSentPerSec = float64(nic.PacketsSent-prevStats.PacketsSent) / duration
		}

		totalBytesRecv += bytesRecvPerSec
		totalBytesSent += bytesSentPerSec

		interfaces = append(interfaces, NetworkInterface{
			Name:              nic.Name,
			BytesRecvPerSec:   bytesRecvPerSec,
			BytesSentPerSec:   bytesSentPerSec,
			PacketsRecvPerSec: packetsRecvPerSec,
			PacketsSentPerSec: packetsSentPerSec,
		})

		prevNetStats[nic.Name] = nic
	}

	prevNetTime = now

	networkData := NetworkData{
		TotalUsage: totalBytesRecv + totalBytesSent,
		Interfaces: interfaces,
	}

	// Collect System data
	hostInfo, _ := host.Info()
	processes, _ := process.Pids()

	totalThreads := 0
	for _, pid := range processes {
		p, err := process.NewProcess(pid)
		if err != nil {
			continue
		}
		numThreads, _ := p.NumThreads()
		totalThreads += int(numThreads)
	}

	systemData := SystemData{
		Uptime:       hostInfo.Uptime,
		ProcessCount: len(processes),
		ThreadCount:  totalThreads,
	}

	// Get remote control capabilities (include on first send or periodically)
	var capabilities *remotecontrol.RemoteControlCapabilities
	if rcManager != nil {
		caps := rcManager.GetCapabilities()
		capabilities = &caps
		log.Printf("[DEBUG] Remote control capabilities retrieved: %+v", caps)
	} else {
		log.Printf("[DEBUG] WARNING: rcManager is nil - capabilities will not be sent!")
	}

	// Create performance snapshot with actual asset ID from credential
	snapshot := PerformanceSnapshot{
		AgentID:    config.AgentID,
		AssetID:    config.AssetID,
		Timestamp:  time.Now().Format(time.RFC3339),
		TimeWindow: config.TimeWindow,
		PerformanceData: PerformanceData{
			CPU:     cpuData,
			Memory:  memData,
			Disk:    diskData,
			Network: networkData,
			System:  systemData,
		},
		Capabilities: capabilities,
	}

	return snapshot
}

// sendPerformanceData sends performance snapshot to the server using credential authentication
func sendPerformanceData(config Config, snapshot PerformanceSnapshot) error {
	jsonData, err := json.Marshal(snapshot)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Debug: Log what we're sending
	if snapshot.Capabilities != nil {
		log.Printf("[DEBUG] Sending capabilities: %+v", *snapshot.Capabilities)
	} else {
		log.Printf("[DEBUG] WARNING: No capabilities in snapshot!")
	}

	url := fmt.Sprintf("%s/api/agent/performance", config.ServerURL)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	// Use credential key for authentication
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.CredentialKey))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("server returned status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}
