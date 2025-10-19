package remotecontrol

import (
	"fmt"
	"log"
	"runtime"
)

// InputHandler handles mouse and keyboard input injection
type InputHandler struct {
	injector PlatformInputInjector
}

// PlatformInputInjector is the platform-specific input injection interface
type PlatformInputInjector interface {
	Initialize() error
	SetMonitorInfo(monitorIndex int, monitors MultiMonitorInfo) error
	InjectMouseMove(x, y int) error
	InjectMouseButton(button string, pressed bool) error
	InjectMouseScroll(deltaX, deltaY int) error
	InjectKeyPress(key string, pressed bool) error
	Close() error
}

// MouseEvent represents a mouse input event
type MouseEvent struct {
	Type   string // move, button, scroll
	X      int
	Y      int
	Button string // left, right, middle
	Down   bool
	DeltaX int
	DeltaY int
}

// KeyboardEvent represents a keyboard input event
type KeyboardEvent struct {
	Key  string // Key code or name
	Down bool   // true for press, false for release
}

// NewInputHandler creates a new input handler
func NewInputHandler() *InputHandler {
	return &InputHandler{
		injector: newPlatformInputInjector(),
	}
}

// Initialize sets up the input handler
func (ih *InputHandler) Initialize() error {
	if ih.injector == nil {
		return fmt.Errorf("no input injector available for platform: %s", runtime.GOOS)
	}
	return ih.injector.Initialize()
}

// SetMonitorInfo updates the monitor configuration for coordinate mapping
func (ih *InputHandler) SetMonitorInfo(monitorIndex int, monitors MultiMonitorInfo) error {
	if ih.injector == nil {
		return fmt.Errorf("no input injector available")
	}
	return ih.injector.SetMonitorInfo(monitorIndex, monitors)
}

// HandleMouseEvent processes a mouse event
func (ih *InputHandler) HandleMouseEvent(event MouseEvent) error {
	switch event.Type {
	case "move":
		return ih.injector.InjectMouseMove(event.X, event.Y)
	case "button":
		return ih.injector.InjectMouseButton(event.Button, event.Down)
	case "scroll":
		return ih.injector.InjectMouseScroll(event.DeltaX, event.DeltaY)
	default:
		return fmt.Errorf("unknown mouse event type: %s", event.Type)
	}
}

// HandleKeyboardEvent processes a keyboard event
func (ih *InputHandler) HandleKeyboardEvent(event KeyboardEvent) error {
	return ih.injector.InjectKeyPress(event.Key, event.Down)
}

// Close releases input handler resources
func (ih *InputHandler) Close() {
	if ih.injector != nil {
		ih.injector.Close()
	}
}

// newPlatformInputInjector creates the appropriate injector for the current platform
// Platform-specific implementations are in input_windows.go, input_linux.go, input_darwin.go
func newPlatformInputInjector() PlatformInputInjector {
	switch runtime.GOOS {
	case "windows":
		return &WindowsInputInjector{}
	case "linux":
		log.Printf("[InputHandler] Linux input injection not yet implemented")
		return nil
	case "darwin":
		log.Printf("[InputHandler] macOS input injection not yet implemented")
		return nil
	default:
		log.Printf("[InputHandler] Unsupported platform: %s", runtime.GOOS)
		return nil
	}
}
