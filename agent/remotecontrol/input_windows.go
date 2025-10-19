//go:build windows
// +build windows

package remotecontrol

import (
	"fmt"
	"log"
	"syscall"
	"unsafe"
)

var (
	user32            = syscall.NewLazyDLL("user32.dll")
	procSendInput     = user32.NewProc("SendInput")
	procGetSystemMetrics = user32.NewProc("GetSystemMetrics")
)

const (
	INPUT_TYPE_MOUSE    = 0
	INPUT_TYPE_KEYBOARD = 1

	MOUSEEVENTF_MOVE       = 0x0001
	MOUSEEVENTF_ABSOLUTE   = 0x8000
	MOUSEEVENTF_LEFTDOWN   = 0x0002
	MOUSEEVENTF_LEFTUP     = 0x0004
	MOUSEEVENTF_RIGHTDOWN  = 0x0008
	MOUSEEVENTF_RIGHTUP    = 0x0010
	MOUSEEVENTF_MIDDLEDOWN = 0x0020
	MOUSEEVENTF_MIDDLEUP   = 0x0040
	MOUSEEVENTF_WHEEL      = 0x0800

	KEYEVENTF_EXTENDEDKEY = 0x0001
	KEYEVENTF_KEYUP       = 0x0002
	KEYEVENTF_UNICODE     = 0x0004
	KEYEVENTF_SCANCODE    = 0x0008

	SM_CXSCREEN = 0
	SM_CYSCREEN = 1

	WHEEL_DELTA = 120
)

type MOUSEINPUT struct {
	Dx          int32
	Dy          int32
	MouseData   uint32
	DwFlags     uint32
	Time        uint32
	DwExtraInfo uintptr
}

type KEYBDINPUT struct {
	WVk         uint16
	WScan       uint16
	DwFlags     uint32
	Time        uint32
	DwExtraInfo uintptr
}

// INPUT_MOUSE represents an INPUT struct with MOUSEINPUT
type INPUT_MOUSE struct {
	Type uint32
	_    uint32 // padding for 64-bit alignment
	Mi   MOUSEINPUT
}

// INPUT_KEYBOARD represents an INPUT struct with KEYBDINPUT
type INPUT_KEYBOARD struct {
	Type uint32
	_    uint32 // padding for 64-bit alignment
	Ki   KEYBDINPUT
	_    [8]byte // padding to match MOUSEINPUT size
}

// WindowsInputInjector implements input injection for Windows using Windows API
type WindowsInputInjector struct {
	screenWidth   int32
	screenHeight  int32
	encodedWidth  int32            // Width of encoded video (always 1920)
	encodedHeight int32            // Height of encoded video (always 1080)
	monitorIndex  int              // Which monitor is being captured (-1 for virtual desktop)
	monitorInfo   *MonitorInfo     // Info about the monitor being captured (nil for virtual desktop)
	monitors      MultiMonitorInfo // Info about all monitors
}

func (wii *WindowsInputInjector) Initialize() error {
	// Get primary screen dimensions as default
	width, _, _ := procGetSystemMetrics.Call(uintptr(SM_CXSCREEN))
	height, _, _ := procGetSystemMetrics.Call(uintptr(SM_CYSCREEN))

	wii.screenWidth = int32(width)
	wii.screenHeight = int32(height)
	wii.encodedWidth = 1920  // Fixed encoded resolution
	wii.encodedHeight = 1080 // Fixed encoded resolution
	wii.monitorIndex = 0     // Default to primary monitor

	log.Printf("[WindowsInputInjector] Initialized (Primary Screen: %dx%d, Encoded: %dx%d)",
		wii.screenWidth, wii.screenHeight, wii.encodedWidth, wii.encodedHeight)
	return nil
}

// SetMonitorInfo updates the monitor configuration for coordinate mapping
func (wii *WindowsInputInjector) SetMonitorInfo(monitorIndex int, monitors MultiMonitorInfo) error {
	wii.monitorIndex = monitorIndex
	wii.monitors = monitors

	if monitorIndex == -1 {
		// Virtual desktop mode - use virtual desktop dimensions
		wii.screenWidth = int32(monitors.VirtualWidth)
		wii.screenHeight = int32(monitors.VirtualHeight)
		wii.monitorInfo = nil
		log.Printf("[WindowsInputInjector] Updated to virtual desktop mode: %dx%d", wii.screenWidth, wii.screenHeight)
	} else if monitorIndex >= 0 && monitorIndex < len(monitors.Monitors) {
		// Specific monitor mode
		mon := monitors.Monitors[monitorIndex]
		wii.screenWidth = int32(mon.Width)
		wii.screenHeight = int32(mon.Height)
		wii.monitorInfo = &mon
		log.Printf("[WindowsInputInjector] Updated to monitor %d: %dx%d at (%d,%d)",
			monitorIndex, mon.Width, mon.Height, mon.X, mon.Y)
	} else {
		return fmt.Errorf("invalid monitor index: %d", monitorIndex)
	}

	return nil
}

func (wii *WindowsInputInjector) InjectMouseMove(x, y int) error {
	// Input coordinates are in encoded space (1920x1080)
	// Need to scale to actual capture resolution, then add monitor offsets

	var scaledX, scaledY float64
	var screenX, screenY float64

	if wii.monitorInfo != nil {
		// Single monitor mode
		// 1. Scale from encoded resolution to actual monitor resolution
		scaleX := float64(wii.monitorInfo.Width) / float64(wii.encodedWidth)
		scaleY := float64(wii.monitorInfo.Height) / float64(wii.encodedHeight)
		scaledX = float64(x) * scaleX
		scaledY = float64(y) * scaleY

		// 2. Add monitor's offset to get absolute screen coordinates
		screenX = float64(wii.monitorInfo.X) + scaledX
		screenY = float64(wii.monitorInfo.Y) + scaledY
	} else if wii.monitorIndex == -1 {
		// Virtual desktop mode - all monitors composited
		// 1. Scale from encoded resolution to virtual desktop resolution
		scaleX := float64(wii.monitors.VirtualWidth) / float64(wii.encodedWidth)
		scaleY := float64(wii.monitors.VirtualHeight) / float64(wii.encodedHeight)
		scaledX = float64(x) * scaleX
		scaledY = float64(y) * scaleY

		// 2. Add virtual desktop offset
		screenX = float64(wii.monitors.VirtualMinX) + scaledX
		screenY = float64(wii.monitors.VirtualMinY) + scaledY
	} else {
		// Fallback - use coordinates as-is
		screenX = float64(x)
		screenY = float64(y)
	}

	// Get total virtual screen dimensions for absolute coordinate calculation
	virtualWidth, _, _ := procGetSystemMetrics.Call(uintptr(78))  // SM_CXVIRTUALSCREEN
	virtualHeight, _, _ := procGetSystemMetrics.Call(uintptr(79)) // SM_CYVIRTUALSCREEN

	// Convert to Windows absolute coordinates (0-65535 range) relative to virtual screen
	absX := int32((screenX * 65535.0) / float64(virtualWidth))
	absY := int32((screenY * 65535.0) / float64(virtualHeight))

	input := INPUT_MOUSE{
		Type: INPUT_TYPE_MOUSE,
		Mi: MOUSEINPUT{
			Dx:      absX,
			Dy:      absY,
			DwFlags: MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE,
		},
	}

	return wii.sendMouseInput(&input)
}

func (wii *WindowsInputInjector) InjectMouseButton(button string, pressed bool) error {
	var flags uint32

	switch button {
	case "left":
		if pressed {
			flags = MOUSEEVENTF_LEFTDOWN
		} else {
			flags = MOUSEEVENTF_LEFTUP
		}
	case "right":
		if pressed {
			flags = MOUSEEVENTF_RIGHTDOWN
		} else {
			flags = MOUSEEVENTF_RIGHTUP
		}
	case "middle", "center":
		if pressed {
			flags = MOUSEEVENTF_MIDDLEDOWN
		} else {
			flags = MOUSEEVENTF_MIDDLEUP
		}
	default:
		return fmt.Errorf("unknown mouse button: %s", button)
	}

	input := INPUT_MOUSE{
		Type: INPUT_TYPE_MOUSE,
		Mi: MOUSEINPUT{
			DwFlags: flags,
		},
	}

	return wii.sendMouseInput(&input)
}

func (wii *WindowsInputInjector) InjectMouseScroll(deltaX, deltaY int) error {
	// Convert web wheel delta to Windows WHEEL_DELTA units
	// Browser typically sends deltaY in pixels (e.g., -100 for scroll up)
	// Windows expects multiples of WHEEL_DELTA (120)
	scrollAmount := int32(-deltaY) // Invert because browser and Windows have opposite directions

	input := INPUT_MOUSE{
		Type: INPUT_TYPE_MOUSE,
		Mi: MOUSEINPUT{
			DwFlags:   MOUSEEVENTF_WHEEL,
			MouseData: uint32(scrollAmount),
		},
	}

	return wii.sendMouseInput(&input)
}

func (wii *WindowsInputInjector) InjectKeyPress(key string, pressed bool) error {
	vkCode := convertKeyToVK(key)
	if vkCode == 0 {
		log.Printf("[WindowsInputInjector] Unknown key: %s", key)
		return nil // Don't error on unknown keys, just skip
	}

	var flags uint32
	if !pressed {
		flags = KEYEVENTF_KEYUP
	}

	input := INPUT_KEYBOARD{
		Type: INPUT_TYPE_KEYBOARD,
		Ki: KEYBDINPUT{
			WVk:     vkCode,
			DwFlags: flags,
		},
	}

	return wii.sendKeyboardInput(&input)
}

func (wii *WindowsInputInjector) Close() error {
	return nil
}

func (wii *WindowsInputInjector) sendMouseInput(input *INPUT_MOUSE) error {
	ret, _, err := procSendInput.Call(
		uintptr(1),
		uintptr(unsafe.Pointer(input)),
		uintptr(unsafe.Sizeof(*input)),
	)

	if ret == 0 {
		return fmt.Errorf("SendInput failed: %v", err)
	}

	return nil
}

func (wii *WindowsInputInjector) sendKeyboardInput(input *INPUT_KEYBOARD) error {
	ret, _, err := procSendInput.Call(
		uintptr(1),
		uintptr(unsafe.Pointer(input)),
		uintptr(unsafe.Sizeof(*input)),
	)

	if ret == 0 {
		return fmt.Errorf("SendInput failed: %v", err)
	}

	return nil
}

// Virtual-Key Codes for Windows
const (
	VK_BACK      = 0x08
	VK_TAB       = 0x09
	VK_RETURN    = 0x0D
	VK_SHIFT     = 0x10
	VK_CONTROL   = 0x11
	VK_MENU      = 0x12 // ALT key
	VK_ESCAPE    = 0x1B
	VK_SPACE     = 0x20
	VK_PRIOR     = 0x21 // PAGE UP
	VK_NEXT      = 0x22 // PAGE DOWN
	VK_END       = 0x23
	VK_HOME      = 0x24
	VK_LEFT      = 0x25
	VK_UP        = 0x26
	VK_RIGHT     = 0x27
	VK_DOWN      = 0x28
	VK_INSERT    = 0x2D
	VK_DELETE    = 0x2E
	VK_LWIN      = 0x5B
	VK_RWIN      = 0x5C
	VK_F1        = 0x70
	VK_F2        = 0x71
	VK_F3        = 0x72
	VK_F4        = 0x73
	VK_F5        = 0x74
	VK_F6        = 0x75
	VK_F7        = 0x76
	VK_F8        = 0x77
	VK_F9        = 0x78
	VK_F10       = 0x79
	VK_F11       = 0x7A
	VK_F12       = 0x7B
)

func convertKeyToVK(jsKey string) uint16 {
	// Handle special keys
	switch jsKey {
	case "Backspace":
		return VK_BACK
	case "Tab":
		return VK_TAB
	case "Enter":
		return VK_RETURN
	case "Shift", "ShiftLeft", "ShiftRight":
		return VK_SHIFT
	case "Control", "ControlLeft", "ControlRight":
		return VK_CONTROL
	case "Alt", "AltLeft", "AltRight":
		return VK_MENU
	case "Escape":
		return VK_ESCAPE
	case " ", "Space":
		return VK_SPACE
	case "PageUp":
		return VK_PRIOR
	case "PageDown":
		return VK_NEXT
	case "End":
		return VK_END
	case "Home":
		return VK_HOME
	case "ArrowLeft":
		return VK_LEFT
	case "ArrowUp":
		return VK_UP
	case "ArrowRight":
		return VK_RIGHT
	case "ArrowDown":
		return VK_DOWN
	case "Insert":
		return VK_INSERT
	case "Delete":
		return VK_DELETE
	case "Meta", "MetaLeft", "OSLeft":
		return VK_LWIN
	case "MetaRight", "OSRight":
		return VK_RWIN
	case "F1":
		return VK_F1
	case "F2":
		return VK_F2
	case "F3":
		return VK_F3
	case "F4":
		return VK_F4
	case "F5":
		return VK_F5
	case "F6":
		return VK_F6
	case "F7":
		return VK_F7
	case "F8":
		return VK_F8
	case "F9":
		return VK_F9
	case "F10":
		return VK_F10
	case "F11":
		return VK_F11
	case "F12":
		return VK_F12
	}

	// Handle alphanumeric keys (A-Z, 0-9)
	if len(jsKey) == 1 {
		ch := jsKey[0]
		// A-Z (0x41-0x5A)
		if ch >= 'A' && ch <= 'Z' {
			return uint16(ch)
		}
		if ch >= 'a' && ch <= 'z' {
			return uint16(ch - 32) // Convert to uppercase
		}
		// 0-9 (0x30-0x39)
		if ch >= '0' && ch <= '9' {
			return uint16(ch)
		}
	}

	return 0 // Unknown key
}
