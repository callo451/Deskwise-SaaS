package remotecontrol

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"
)

// RemoteControlCapabilities describes what this agent can do
type RemoteControlCapabilities struct {
	RemoteControl     bool   `json:"remoteControl"`
	ScreenCapture     bool   `json:"screenCapture"`
	InputInjection    bool   `json:"inputInjection"`
	WebRTCSupported   bool   `json:"webrtcSupported"`
	Platform          string `json:"platform"`
	AgentVersion      string `json:"agentVersion"`
}

// Session represents an active remote control session
type Session struct {
	SessionID     string
	Token         string
	ServerURL     string
	AssetID       string
	OrgID         string
	Status        string // pending, active, ended

	// Internal state
	ctx           context.Context
	cancel        context.CancelFunc
	screenCapture *ScreenCapture
	inputHandler  *InputHandler
	webrtcPeer    *WebRTCPeer
	signalClient  *SignalClient
	mu            sync.RWMutex
}

// Manager handles remote control sessions
type Manager struct {
	serverURL    string
	capabilities RemoteControlCapabilities
	sessions     map[string]*Session
	mu           sync.RWMutex
}

// NewManager creates a new remote control manager
func NewManager(serverURL string, platform string, version string) *Manager {
	caps := RemoteControlCapabilities{
		RemoteControl:   true,
		ScreenCapture:   isScreenCaptureSupported(),
		InputInjection:  isInputInjectionSupported(),
		WebRTCSupported: true,
		Platform:        platform,
		AgentVersion:    version,
	}

	return &Manager{
		serverURL:    serverURL,
		capabilities: caps,
		sessions:     make(map[string]*Session),
	}
}

// GetCapabilities returns the remote control capabilities of this agent
func (m *Manager) GetCapabilities() RemoteControlCapabilities {
	return m.capabilities
}

// StartSession initiates a new remote control session
func (m *Manager) StartSession(sessionID, token, assetID, orgID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Check if session already exists
	if _, exists := m.sessions[sessionID]; exists {
		return fmt.Errorf("session %s already exists", sessionID)
	}

	ctx, cancel := context.WithCancel(context.Background())

	session := &Session{
		SessionID:  sessionID,
		Token:      token,
		ServerURL:  m.serverURL,
		AssetID:    assetID,
		OrgID:      orgID,
		Status:     "pending",
		ctx:        ctx,
		cancel:     cancel,
	}

	// Initialize components
	session.signalClient = NewSignalClient(m.serverURL, sessionID, token)
	session.screenCapture = NewScreenCapture()
	session.inputHandler = NewInputHandler()

	// Initialize input handler
	if err := session.inputHandler.Initialize(); err != nil {
		log.Printf("[RemoteControl] Warning: Failed to initialize input handler: %v", err)
	}

	session.webrtcPeer = NewWebRTCPeer(session.screenCapture, session.inputHandler)

	m.sessions[sessionID] = session

	// Start session in background
	go session.run()

	log.Printf("[RemoteControl] Session %s started", sessionID)
	return nil
}

// StopSession ends an active remote control session
func (m *Manager) StopSession(sessionID string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	session, exists := m.sessions[sessionID]
	if !exists {
		return fmt.Errorf("session %s not found", sessionID)
	}

	session.cancel()
	delete(m.sessions, sessionID)

	log.Printf("[RemoteControl] Session %s stopped", sessionID)
	return nil
}

// GetActiveSession returns the active session (only one allowed at a time)
func (m *Manager) GetActiveSession() *Session {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, session := range m.sessions {
		if session.Status == "active" {
			return session
		}
	}
	return nil
}

// run executes the session workflow
func (s *Session) run() {
	defer func() {
		if err := recover(); err != nil {
			log.Printf("[RemoteControl] Session %s panic: %v", s.SessionID, err)
		}
		s.cleanup()
	}()

	// Step 1: Check if consent is required
	// TODO: Implement consent dialog if required by policy

	// Step 2: Update status to active
	s.mu.Lock()
	s.Status = "active"
	s.mu.Unlock()

	log.Printf("[RemoteControl] Session %s is now active", s.SessionID)

	// Step 3: Initialize screen capture
	if err := s.screenCapture.Start(); err != nil {
		log.Printf("[RemoteControl] Failed to start screen capture: %v", err)
		return
	}
	defer s.screenCapture.Stop()

	// Step 3.5: Update input handler with monitor info for coordinate mapping
	monitors := s.screenCapture.GetMonitors()
	monitorIndex := s.screenCapture.GetMonitorIndex()
	if err := s.inputHandler.SetMonitorInfo(monitorIndex, monitors); err != nil {
		log.Printf("[RemoteControl] Warning: Failed to set monitor info: %v", err)
	}

	// Step 4: Setup WebRTC connection
	if err := s.setupWebRTC(); err != nil {
		log.Printf("[RemoteControl] Failed to setup WebRTC: %v", err)
		return
	}

	// Connect signal client to WebRTC peer for ICE candidate exchange
	s.webrtcPeer.SetSignalClient(s.signalClient)

	// Step 5: Handle signalling and keep session alive
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			log.Printf("[RemoteControl] Session %s context cancelled", s.SessionID)
			return
		case <-ticker.C:
			// Poll for signalling messages
			if err := s.handleSignalling(); err != nil {
				log.Printf("[RemoteControl] Signalling error: %v", err)
			}
		}
	}
}

// setupWebRTC initializes the WebRTC peer connection
func (s *Session) setupWebRTC() error {
	// Get ICE servers from session creation response
	iceServers := []ICEServer{
		{URLs: []string{"stun:stun.l.google.com:19302"}},
	}

	// Initialize peer connection
	if err := s.webrtcPeer.Init(iceServers); err != nil {
		return fmt.Errorf("failed to initialize WebRTC peer: %w", err)
	}

	// Agent waits for operator's offer instead of creating one
	// The answer will be created in handleSignalling() when offer is received
	log.Printf("[RemoteControl] WebRTC initialized, waiting for operator's offer")
	return nil
}

// handleSignalling processes incoming signalling messages
func (s *Session) handleSignalling() error {
	messages, err := s.signalClient.PollSignals()
	if err != nil {
		return err
	}

	for _, msg := range messages {
		switch msg.Type {
		case "offer":
			// Agent receives offer from operator
			var offer map[string]interface{}
			if err := json.Unmarshal(msg.Data, &offer); err != nil {
				log.Printf("[RemoteControl] Invalid offer format: %v", err)
				continue
			}

			// Set the operator's offer as remote description
			if err := s.webrtcPeer.SetRemoteDescription(offer); err != nil {
				log.Printf("[RemoteControl] Failed to set remote description: %v", err)
				continue
			}
			log.Printf("[RemoteControl] Received and set operator's offer")

			// Create answer in response to the offer
			answer, err := s.webrtcPeer.CreateAnswer()
			if err != nil {
				log.Printf("[RemoteControl] Failed to create answer: %v", err)
				continue
			}

			// Send answer back to operator
			if err := s.signalClient.SendSignal("answer", answer); err != nil {
				log.Printf("[RemoteControl] Failed to send answer: %v", err)
				continue
			}
			log.Printf("[RemoteControl] Sent answer to operator")

		case "ice-candidate":
			var candidate map[string]interface{}
			if err := json.Unmarshal(msg.Data, &candidate); err != nil {
				log.Printf("[RemoteControl] Invalid ICE candidate format: %v", err)
				continue
			}

			if err := s.webrtcPeer.AddICECandidate(candidate); err != nil {
				log.Printf("[RemoteControl] Failed to add ICE candidate: %v", err)
			}
		}
	}

	return nil
}

// cleanup releases all session resources
func (s *Session) cleanup() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.Status = "ended"

	if s.webrtcPeer != nil {
		s.webrtcPeer.Close()
	}

	if s.screenCapture != nil {
		s.screenCapture.Stop()
	}

	log.Printf("[RemoteControl] Session %s cleaned up", s.SessionID)
}

// Platform-specific capability detection
func isScreenCaptureSupported() bool {
	// Windows: DXGI Desktop Duplication API
	// Linux: X11 or Wayland capture
	// macOS: CGDisplayStream
	return true // Simplified for MVP
}

func isInputInjectionSupported() bool {
	// Windows: SendInput API
	// Linux: X11 XTest extension
	// macOS: CGEvent
	return true // Simplified for MVP
}
