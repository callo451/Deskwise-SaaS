package remotecontrol

import (
	"fmt"
	"image"
	"log"
	"runtime"
	"sync"
	"time"

	"github.com/kbinani/screenshot"
)

// ScreenCapture handles screen capturing and encoding
type ScreenCapture struct {
	running      bool
	frameChan    chan *image.RGBA
	targetFPS    int
	mu           sync.RWMutex
	capturer     PlatformCapturer
	monitorIndex int  // Which monitor to capture (-1 for all monitors/virtual desktop)
	monitors     MultiMonitorInfo
}

// PlatformCapturer is the platform-specific screen capture interface
type PlatformCapturer interface {
	Initialize() error
	CaptureFrame() (*image.RGBA, error)
	Close() error
	GetDisplayInfo() DisplayInfo
}

// DisplayInfo contains information about the display
type DisplayInfo struct {
	Width  int
	Height int
	DPI    int
}

// MonitorInfo contains information about a single monitor
type MonitorInfo struct {
	Index  int
	Name   string
	X      int
	Y      int
	Width  int
	Height int
	Primary bool
}

// MultiMonitorInfo contains information about all monitors
type MultiMonitorInfo struct {
	Monitors         []MonitorInfo
	VirtualWidth     int // Total width of virtual desktop
	VirtualHeight    int // Total height of virtual desktop
	VirtualMinX      int // Leftmost X coordinate
	VirtualMinY      int // Topmost Y coordinate
}

// NewScreenCapture creates a new screen capture instance
// Defaults to capturing the primary monitor (monitor 0)
func NewScreenCapture() *ScreenCapture {
	// Detect monitors early for logging
	numDisplays := screenshot.NumActiveDisplays()

	// Always default to primary monitor (monitor 0)
	// User can switch monitors via UI controls
	defaultMonitorIndex := 0
	if numDisplays > 1 {
		log.Printf("[ScreenCapture] Multiple monitors detected (%d), defaulting to primary monitor 0", numDisplays)
	} else {
		log.Printf("[ScreenCapture] Single monitor detected, capturing monitor 0")
	}

	return &ScreenCapture{
		frameChan:    make(chan *image.RGBA, 2), // Buffer only 2 frames for low latency
		targetFPS:    30,
		monitorIndex: defaultMonitorIndex,
	}
}

// NewScreenCaptureWithMonitor creates a screen capture instance for a specific monitor
func NewScreenCaptureWithMonitor(monitorIndex int) *ScreenCapture {
	return &ScreenCapture{
		frameChan:    make(chan *image.RGBA, 2),
		targetFPS:    30,
		monitorIndex: monitorIndex,
	}
}

// DetectMonitors detects all available monitors
func DetectMonitors() MultiMonitorInfo {
	numDisplays := screenshot.NumActiveDisplays()
	monitors := make([]MonitorInfo, numDisplays)

	minX, minY := 0, 0
	maxX, maxY := 0, 0

	for i := 0; i < numDisplays; i++ {
		bounds := screenshot.GetDisplayBounds(i)

		monitors[i] = MonitorInfo{
			Index:   i,
			Name:    fmt.Sprintf("Monitor %d", i+1),
			X:       bounds.Min.X,
			Y:       bounds.Min.Y,
			Width:   bounds.Dx(),
			Height:  bounds.Dy(),
			Primary: i == 0, // Assume first display is primary
		}

		// Calculate virtual desktop bounds
		if bounds.Min.X < minX {
			minX = bounds.Min.X
		}
		if bounds.Min.Y < minY {
			minY = bounds.Min.Y
		}
		if bounds.Max.X > maxX {
			maxX = bounds.Max.X
		}
		if bounds.Max.Y > maxY {
			maxY = bounds.Max.Y
		}
	}

	return MultiMonitorInfo{
		Monitors:      monitors,
		VirtualWidth:  maxX - minX,
		VirtualHeight: maxY - minY,
		VirtualMinX:   minX,
		VirtualMinY:   minY,
	}
}

// SetMonitor sets which monitor to capture (-1 for all monitors)
func (sc *ScreenCapture) SetMonitor(index int) {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	log.Printf("[ScreenCapture] Switching to monitor %d", index)
	sc.monitorIndex = index

	// If screen capture is running, reinitialize the capturer with the new monitor
	if sc.running && sc.capturer != nil {
		// Close old capturer
		if err := sc.capturer.Close(); err != nil {
			log.Printf("[ScreenCapture] Error closing capturer: %v", err)
		}

		// Create new capturer with updated monitor index
		sc.capturer = newPlatformCapturerWithMonitor(sc.monitorIndex, sc.monitors)
		if err := sc.capturer.Initialize(); err != nil {
			log.Printf("[ScreenCapture] Error reinitializing capturer: %v", err)
			return
		}

		if sc.monitorIndex == -1 {
			log.Printf("[ScreenCapture] Switched to ALL monitors (Virtual Desktop: %dx%d)",
				sc.monitors.VirtualWidth, sc.monitors.VirtualHeight)
		} else {
			log.Printf("[ScreenCapture] Switched to Monitor %d", sc.monitorIndex)
		}
	}
}

// GetMonitors returns information about all detected monitors
func (sc *ScreenCapture) GetMonitors() MultiMonitorInfo {
	return sc.monitors
}

// GetMonitorIndex returns the current monitor index being captured
func (sc *ScreenCapture) GetMonitorIndex() int {
	sc.mu.RLock()
	defer sc.mu.RUnlock()
	return sc.monitorIndex
}

// Start begins screen capture
func (sc *ScreenCapture) Start() error {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if sc.running {
		return fmt.Errorf("screen capture already running")
	}

	// Detect all monitors
	sc.monitors = DetectMonitors()
	log.Printf("[ScreenCapture] Detected %d monitor(s)", len(sc.monitors.Monitors))
	for _, mon := range sc.monitors.Monitors {
		log.Printf("[ScreenCapture]   Monitor %d: %dx%d at (%d,%d) %s",
			mon.Index, mon.Width, mon.Height, mon.X, mon.Y,
			map[bool]string{true: "[PRIMARY]", false: ""}[mon.Primary])
	}

	// Initialize platform-specific capturer
	sc.capturer = newPlatformCapturerWithMonitor(sc.monitorIndex, sc.monitors)
	if err := sc.capturer.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize capturer: %w", err)
	}

	sc.running = true

	// Start capture loop
	go sc.captureLoop()

	if sc.monitorIndex == -1 {
		log.Printf("[ScreenCapture] Started capturing ALL monitors (Virtual Desktop: %dx%d) at %d FPS",
			sc.monitors.VirtualWidth, sc.monitors.VirtualHeight, sc.targetFPS)
	} else {
		log.Printf("[ScreenCapture] Started capturing Monitor %d at %d FPS",
			sc.monitorIndex, sc.targetFPS)
	}
	return nil
}

// Stop stops screen capture
func (sc *ScreenCapture) Stop() {
	sc.mu.Lock()
	defer sc.mu.Unlock()

	if !sc.running {
		return
	}

	sc.running = false

	if sc.capturer != nil {
		sc.capturer.Close()
	}

	close(sc.frameChan)
	log.Println("[ScreenCapture] Stopped")
}

// GetFrameChannel returns the channel for receiving captured frames
func (sc *ScreenCapture) GetFrameChannel() <-chan *image.RGBA {
	return sc.frameChan
}

// GetDisplayInfo returns information about the display
func (sc *ScreenCapture) GetDisplayInfo() DisplayInfo {
	if sc.capturer != nil {
		return sc.capturer.GetDisplayInfo()
	}
	return DisplayInfo{Width: 1920, Height: 1080, DPI: 96}
}

// captureLoop continuously captures frames at the target FPS
func (sc *ScreenCapture) captureLoop() {
	interval := time.Second / time.Duration(sc.targetFPS)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		sc.mu.RLock()
		running := sc.running
		sc.mu.RUnlock()

		if !running {
			break
		}

		<-ticker.C

		frame, err := sc.capturer.CaptureFrame()
		if err != nil {
			log.Printf("[ScreenCapture] Failed to capture frame: %v", err)
			continue
		}

		// Send frame to channel (non-blocking)
		select {
		case sc.frameChan <- frame:
		default:
			// Channel full, drop frame
		}
	}
}

// newPlatformCapturerWithMonitor creates the appropriate capturer for the current platform
func newPlatformCapturerWithMonitor(monitorIndex int, monitors MultiMonitorInfo) PlatformCapturer {
	switch runtime.GOOS {
	case "windows":
		return &WindowsCapturer{
			monitorIndex: monitorIndex,
			monitors:     monitors,
		}
	case "linux":
		return &LinuxCapturer{}
	case "darwin":
		return &MacOSCapturer{}
	default:
		log.Printf("[ScreenCapture] Unsupported platform: %s, using dummy capturer", runtime.GOOS)
		return &DummyCapturer{}
	}
}

// ============================================
// Platform-Specific Implementations
// ============================================

// WindowsCapturer implements screen capture for Windows
type WindowsCapturer struct {
	displayInfo  DisplayInfo
	monitorIndex int              // Which monitor to capture (-1 for all)
	monitors     MultiMonitorInfo // Information about all monitors
}

func (wc *WindowsCapturer) Initialize() error {
	if wc.monitorIndex == -1 {
		// Virtual desktop mode - capture all monitors
		wc.displayInfo = DisplayInfo{
			Width:  wc.monitors.VirtualWidth,
			Height: wc.monitors.VirtualHeight,
			DPI:    96,
		}
		log.Printf("[WindowsCapturer] Initialized - Virtual Desktop Mode: %dx%d",
			wc.displayInfo.Width, wc.displayInfo.Height)
	} else {
		// Single monitor mode
		bounds := screenshot.GetDisplayBounds(wc.monitorIndex)
		wc.displayInfo = DisplayInfo{
			Width:  bounds.Dx(),
			Height: bounds.Dy(),
			DPI:    96,
		}
		log.Printf("[WindowsCapturer] Initialized - Monitor %d: %dx%d",
			wc.monitorIndex, wc.displayInfo.Width, wc.displayInfo.Height)
	}

	return nil
}

func (wc *WindowsCapturer) CaptureFrame() (*image.RGBA, error) {
	if wc.monitorIndex == -1 {
		// Capture all monitors and composite them
		return wc.captureVirtualDesktop()
	}

	// Capture single monitor
	img, err := screenshot.CaptureDisplay(wc.monitorIndex)
	if err != nil {
		return nil, fmt.Errorf("failed to capture display: %w", err)
	}

	return img, nil
}

// captureVirtualDesktop captures all monitors and composites them into a single image
func (wc *WindowsCapturer) captureVirtualDesktop() (*image.RGBA, error) {
	// Create a canvas for the entire virtual desktop
	canvas := image.NewRGBA(image.Rect(0, 0, wc.monitors.VirtualWidth, wc.monitors.VirtualHeight))

	// Capture and composite each monitor
	for _, mon := range wc.monitors.Monitors {
		img, err := screenshot.CaptureDisplay(mon.Index)
		if err != nil {
			log.Printf("[WindowsCapturer] Failed to capture monitor %d: %v", mon.Index, err)
			continue
		}

		// Calculate position in virtual desktop
		offsetX := mon.X - wc.monitors.VirtualMinX
		offsetY := mon.Y - wc.monitors.VirtualMinY

		// Copy monitor image to canvas at correct position
		for y := 0; y < mon.Height; y++ {
			for x := 0; x < mon.Width; x++ {
				srcOffset := (y*img.Stride + x*4)
				dstX := offsetX + x
				dstY := offsetY + y
				dstOffset := (dstY*canvas.Stride + dstX*4)

				if dstX >= 0 && dstX < wc.monitors.VirtualWidth && dstY >= 0 && dstY < wc.monitors.VirtualHeight {
					copy(canvas.Pix[dstOffset:dstOffset+4], img.Pix[srcOffset:srcOffset+4])
				}
			}
		}
	}

	return canvas, nil
}

func (wc *WindowsCapturer) Close() error {
	log.Println("[WindowsCapturer] Closed")
	return nil
}

func (wc *WindowsCapturer) GetDisplayInfo() DisplayInfo {
	return wc.displayInfo
}

// LinuxCapturer implements screen capture for Linux using X11/Wayland
type LinuxCapturer struct {
	displayInfo DisplayInfo
}

func (lc *LinuxCapturer) Initialize() error {
	// TODO: Implement X11 XShm or Wayland capture
	log.Println("[LinuxCapturer] Initialized (TODO: Implement X11/Wayland)")
	lc.displayInfo = DisplayInfo{Width: 1920, Height: 1080, DPI: 96}
	return nil
}

func (lc *LinuxCapturer) CaptureFrame() (*image.RGBA, error) {
	// TODO: Implement actual frame capture
	img := image.NewRGBA(image.Rect(0, 0, lc.displayInfo.Width, lc.displayInfo.Height))
	return img, nil
}

func (lc *LinuxCapturer) Close() error {
	log.Println("[LinuxCapturer] Closed")
	return nil
}

func (lc *LinuxCapturer) GetDisplayInfo() DisplayInfo {
	return lc.displayInfo
}

// MacOSCapturer implements screen capture for macOS using CGDisplayStream
type MacOSCapturer struct {
	displayInfo DisplayInfo
}

func (mc *MacOSCapturer) Initialize() error {
	// TODO: Implement CGDisplayStream
	log.Println("[MacOSCapturer] Initialized (TODO: Implement CGDisplayStream)")
	mc.displayInfo = DisplayInfo{Width: 1920, Height: 1080, DPI: 96}
	return nil
}

func (mc *MacOSCapturer) CaptureFrame() (*image.RGBA, error) {
	// TODO: Implement actual frame capture
	img := image.NewRGBA(image.Rect(0, 0, mc.displayInfo.Width, mc.displayInfo.Height))
	return img, nil
}

func (mc *MacOSCapturer) Close() error {
	log.Println("[MacOSCapturer] Closed")
	return nil
}

func (mc *MacOSCapturer) GetDisplayInfo() DisplayInfo {
	return mc.displayInfo
}

// DummyCapturer is a fallback capturer for unsupported platforms
type DummyCapturer struct {
	displayInfo DisplayInfo
}

func (dc *DummyCapturer) Initialize() error {
	log.Println("[DummyCapturer] Initialized")
	dc.displayInfo = DisplayInfo{Width: 1920, Height: 1080, DPI: 96}
	return nil
}

func (dc *DummyCapturer) CaptureFrame() (*image.RGBA, error) {
	img := image.NewRGBA(image.Rect(0, 0, dc.displayInfo.Width, dc.displayInfo.Height))
	return img, nil
}

func (dc *DummyCapturer) Close() error {
	return nil
}

func (dc *DummyCapturer) GetDisplayInfo() DisplayInfo {
	return dc.displayInfo
}
