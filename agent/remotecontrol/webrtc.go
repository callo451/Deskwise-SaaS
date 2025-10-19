package remotecontrol

import (
	"context"
	"encoding/json"
	"fmt"
	"image"
	"log"
	"sync"
	"time"

	"github.com/pion/webrtc/v4"
	"github.com/pion/webrtc/v4/pkg/media"
)

// ICEServer represents a STUN/TURN server configuration
type ICEServer struct {
	URLs       []string `json:"urls"`
	Username   string   `json:"username,omitempty"`
	Credential string   `json:"credential,omitempty"`
}

// WebRTCPeer handles WebRTC peer connection
type WebRTCPeer struct {
	screenCapture    *ScreenCapture
	inputHandler     *InputHandler
	connected        bool
	iceServers       []ICEServer
	peerConnection   *webrtc.PeerConnection
	videoTrack       *webrtc.TrackLocalStaticSample
	dataChannel      *webrtc.DataChannel
	signalClient     *SignalClient
	vp8Encoder       *VP8Encoder
	ctx              context.Context
	cancel           context.CancelFunc
	mu               sync.RWMutex
}

// NewWebRTCPeer creates a new WebRTC peer
func NewWebRTCPeer(screenCapture *ScreenCapture, inputHandler *InputHandler) *WebRTCPeer {
	ctx, cancel := context.WithCancel(context.Background())
	return &WebRTCPeer{
		screenCapture: screenCapture,
		inputHandler:  inputHandler,
		connected:     false,
		ctx:           ctx,
		cancel:        cancel,
	}
}

// Init initializes the WebRTC peer connection
func (wp *WebRTCPeer) Init(iceServers []ICEServer) error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	wp.iceServers = iceServers

	// Convert ICEServer to pion format
	pionICEServers := []webrtc.ICEServer{}
	for _, server := range iceServers {
		pionServer := webrtc.ICEServer{
			URLs: server.URLs,
		}
		if server.Username != "" {
			pionServer.Username = server.Username
		}
		if server.Credential != "" {
			pionServer.Credential = server.Credential
		}
		pionICEServers = append(pionICEServers, pionServer)
	}

	// Create peer connection configuration
	config := webrtc.Configuration{
		ICEServers: pionICEServers,
	}

	// Create media engine for codec support
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return fmt.Errorf("failed to register codecs: %w", err)
	}

	// Create API with media engine
	api := webrtc.NewAPI(webrtc.WithMediaEngine(mediaEngine))

	// Create peer connection
	pc, err := api.NewPeerConnection(config)
	if err != nil {
		return fmt.Errorf("failed to create peer connection: %w", err)
	}

	wp.peerConnection = pc

	// Setup connection state change handler
	pc.OnConnectionStateChange(func(state webrtc.PeerConnectionState) {
		log.Printf("[WebRTCPeer] Connection state changed: %s", state.String())

		switch state {
		case webrtc.PeerConnectionStateConnected:
			wp.mu.Lock()
			wp.connected = true
			wp.mu.Unlock()
			log.Println("[WebRTCPeer] Successfully connected!")

			// Start sending screen capture frames
			go wp.sendScreenCaptureFrames()

		case webrtc.PeerConnectionStateFailed, webrtc.PeerConnectionStateDisconnected, webrtc.PeerConnectionStateClosed:
			wp.mu.Lock()
			wp.connected = false
			wp.mu.Unlock()
			log.Printf("[WebRTCPeer] Connection ended: %s", state.String())
		}
	})

	// Setup ICE connection state change handler
	pc.OnICEConnectionStateChange(func(state webrtc.ICEConnectionState) {
		log.Printf("[WebRTCPeer] ICE connection state changed: %s", state.String())
	})

	// Setup ICE candidate handler
	pc.OnICECandidate(func(candidate *webrtc.ICECandidate) {
		if candidate == nil {
			log.Println("[WebRTCPeer] ICE gathering complete")
			return
		}

		// Send ICE candidate to remote peer via signalling
		if wp.signalClient != nil {
			candidateInit := candidate.ToJSON()
			candidateData := map[string]interface{}{
				"candidate":     candidateInit.Candidate,
				"sdpMid":        candidateInit.SDPMid,
				"sdpMLineIndex": candidateInit.SDPMLineIndex,
			}

			if err := wp.signalClient.SendSignal("ice-candidate", candidateData); err != nil {
				log.Printf("[WebRTCPeer] Failed to send ICE candidate: %v", err)
			} else {
				log.Println("[WebRTCPeer] Sent ICE candidate to remote peer")
			}
		}
	})

	// Setup data channel handler (for receiving input events from browser)
	pc.OnDataChannel(func(dc *webrtc.DataChannel) {
		log.Printf("[WebRTCPeer] Data channel opened: %s", dc.Label())
		wp.dataChannel = dc

		dc.OnMessage(func(msg webrtc.DataChannelMessage) {
			if err := wp.HandleDataChannel(msg.Data); err != nil {
				log.Printf("[WebRTCPeer] Error handling data channel message: %v", err)
			}
		})

		dc.OnOpen(func() {
			log.Println("[WebRTCPeer] Data channel is open")
		})

		dc.OnClose(func() {
			log.Println("[WebRTCPeer] Data channel closed")
		})
	})

	// Create video track for screen streaming
	videoTrack, err := webrtc.NewTrackLocalStaticSample(
		webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
		"video",
		"screen-capture",
	)
	if err != nil {
		return fmt.Errorf("failed to create video track: %w", err)
	}

	wp.videoTrack = videoTrack

	// Add video track to peer connection
	_, err = pc.AddTrack(videoTrack)
	if err != nil {
		return fmt.Errorf("failed to add video track: %w", err)
	}

	// Initialize VP8 encoder
	// 1920x1080 @ 30fps, 5000kbps bitrate (Full HD quality)
	vp8Enc, err := NewVP8Encoder(1920, 1080, 30, 5000)
	if err != nil {
		return fmt.Errorf("failed to create VP8 encoder: %w", err)
	}
	wp.vp8Encoder = vp8Enc

	log.Printf("[WebRTCPeer] Initialized with %d ICE servers and VP8 encoder", len(iceServers))
	return nil
}

// SetSignalClient sets the signal client for ICE candidate exchange
func (wp *WebRTCPeer) SetSignalClient(signalClient *SignalClient) {
	wp.signalClient = signalClient
}

// CreateOffer creates a WebRTC offer (not used - agent creates answers instead)
func (wp *WebRTCPeer) CreateOffer() (map[string]interface{}, error) {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if wp.peerConnection == nil {
		return nil, fmt.Errorf("peer connection not initialized")
	}

	offer, err := wp.peerConnection.CreateOffer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create offer: %w", err)
	}

	if err := wp.peerConnection.SetLocalDescription(offer); err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	result := map[string]interface{}{
		"type": offer.Type.String(),
		"sdp":  offer.SDP,
	}

	log.Println("[WebRTCPeer] Created offer")
	return result, nil
}

// CreateAnswer creates a WebRTC answer in response to an offer
func (wp *WebRTCPeer) CreateAnswer() (map[string]interface{}, error) {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if wp.peerConnection == nil {
		return nil, fmt.Errorf("peer connection not initialized")
	}

	// Log number of senders (should include video track)
	senders := wp.peerConnection.GetSenders()
	log.Printf("[WebRTCPeer] Number of senders before creating answer: %d", len(senders))
	for i, sender := range senders {
		if sender.Track() != nil {
			log.Printf("[WebRTCPeer] Sender %d: %s (ID: %s)", i, sender.Track().Kind(), sender.Track().ID())
		}
	}

	answer, err := wp.peerConnection.CreateAnswer(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create answer: %w", err)
	}

	log.Printf("[WebRTCPeer] Answer SDP:\n%s", answer.SDP)

	if err := wp.peerConnection.SetLocalDescription(answer); err != nil {
		return nil, fmt.Errorf("failed to set local description: %w", err)
	}

	result := map[string]interface{}{
		"type": answer.Type.String(),
		"sdp":  answer.SDP,
	}

	log.Println("[WebRTCPeer] Created answer")
	return result, nil
}

// SetRemoteDescription sets the remote SDP description (offer from browser)
func (wp *WebRTCPeer) SetRemoteDescription(description map[string]interface{}) error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if wp.peerConnection == nil {
		return fmt.Errorf("peer connection not initialized")
	}

	sdpType, ok := description["type"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid SDP type")
	}

	sdp, ok := description["sdp"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid SDP")
	}

	log.Printf("[WebRTCPeer] Received %s SDP:\n%s", sdpType, sdp)

	// Convert string type to webrtc.SDPType
	var sdpTypeEnum webrtc.SDPType
	switch sdpType {
	case "offer":
		sdpTypeEnum = webrtc.SDPTypeOffer
	case "answer":
		sdpTypeEnum = webrtc.SDPTypeAnswer
	case "pranswer":
		sdpTypeEnum = webrtc.SDPTypePranswer
	case "rollback":
		sdpTypeEnum = webrtc.SDPTypeRollback
	default:
		return fmt.Errorf("unknown SDP type: %s", sdpType)
	}

	sessionDesc := webrtc.SessionDescription{
		Type: sdpTypeEnum,
		SDP:  sdp,
	}

	if err := wp.peerConnection.SetRemoteDescription(sessionDesc); err != nil {
		return fmt.Errorf("failed to set remote description: %w", err)
	}

	log.Printf("[WebRTCPeer] Set remote description: %s", sdpType)
	return nil
}

// AddICECandidate adds an ICE candidate received from the remote peer
func (wp *WebRTCPeer) AddICECandidate(candidateData map[string]interface{}) error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	if wp.peerConnection == nil {
		return fmt.Errorf("peer connection not initialized")
	}

	candidate, ok := candidateData["candidate"].(string)
	if !ok {
		return fmt.Errorf("missing or invalid candidate")
	}

	// Extract optional fields
	sdpMid, _ := candidateData["sdpMid"].(string)
	sdpMLineIndex, _ := candidateData["sdpMLineIndex"].(float64)

	// Create ICE candidate init
	candidateInit := webrtc.ICECandidateInit{
		Candidate: candidate,
	}

	if sdpMid != "" {
		candidateInit.SDPMid = &sdpMid
	}

	if sdpMLineIndex >= 0 {
		index := uint16(sdpMLineIndex)
		candidateInit.SDPMLineIndex = &index
	}

	if err := wp.peerConnection.AddICECandidate(candidateInit); err != nil {
		return fmt.Errorf("failed to add ICE candidate: %w", err)
	}

	log.Println("[WebRTCPeer] Added ICE candidate")
	return nil
}

// HandleDataChannel processes data channel messages (input events)
func (wp *WebRTCPeer) HandleDataChannel(data []byte) error {
	var message map[string]interface{}
	if err := json.Unmarshal(data, &message); err != nil {
		return fmt.Errorf("invalid data channel message: %w", err)
	}

	msgType, ok := message["type"].(string)
	if !ok {
		return fmt.Errorf("missing message type")
	}

	switch msgType {
	case "mouse":
		return wp.handleMouseInput(message)
	case "keyboard":
		return wp.handleKeyboardInput(message)
	case "monitor":
		return wp.handleMonitorChange(message)
	default:
		return fmt.Errorf("unknown message type: %s", msgType)
	}
}

// handleMouseInput processes mouse input events
func (wp *WebRTCPeer) handleMouseInput(message map[string]interface{}) error {
	eventType, _ := message["eventType"].(string)

	switch eventType {
	case "move":
		x, _ := message["x"].(float64)
		y, _ := message["y"].(float64)
		log.Printf("[WebRTC] Mouse move: (%d, %d)", int(x), int(y))
		return wp.inputHandler.HandleMouseEvent(MouseEvent{
			Type: "move",
			X:    int(x),
			Y:    int(y),
		})

	case "button":
		button, _ := message["button"].(string)
		down, _ := message["down"].(bool)
		action := "up"
		if down {
			action = "down"
		}
		log.Printf("[WebRTC] Mouse %s button %s", button, action)
		return wp.inputHandler.HandleMouseEvent(MouseEvent{
			Type:   "button",
			Button: button,
			Down:   down,
		})

	case "scroll":
		deltaX, _ := message["deltaX"].(float64)
		deltaY, _ := message["deltaY"].(float64)
		log.Printf("[WebRTC] Mouse scroll: (%d, %d)", int(deltaX), int(deltaY))
		return wp.inputHandler.HandleMouseEvent(MouseEvent{
			Type:   "scroll",
			DeltaX: int(deltaX),
			DeltaY: int(deltaY),
		})
	}

	return nil
}

// handleKeyboardInput processes keyboard input events
func (wp *WebRTCPeer) handleKeyboardInput(message map[string]interface{}) error {
	key, _ := message["key"].(string)
	down, _ := message["down"].(bool)

	action := "up"
	if down {
		action = "down"
	}
	log.Printf("[WebRTC] Keyboard key '%s' %s", key, action)

	return wp.inputHandler.HandleKeyboardEvent(KeyboardEvent{
		Key:  key,
		Down: down,
	})
}

// handleMonitorChange processes monitor selection changes
func (wp *WebRTCPeer) handleMonitorChange(message map[string]interface{}) error {
	monitorIndex, ok := message["monitorIndex"].(float64)
	if !ok {
		return fmt.Errorf("missing or invalid monitorIndex")
	}

	index := int(monitorIndex)
	log.Printf("[WebRTC] Changing monitor selection to: %d", index)

	// Update screen capture monitor selection
	wp.screenCapture.SetMonitor(index)

	// Update input handler monitor info
	monitors := wp.screenCapture.GetMonitors()
	if err := wp.inputHandler.SetMonitorInfo(index, monitors); err != nil {
		return fmt.Errorf("failed to update input handler monitor info: %w", err)
	}

	log.Printf("[WebRTC] Successfully changed to monitor %d", index)
	return nil
}

// sendScreenCaptureFrames sends real screen capture frames
func (wp *WebRTCPeer) sendScreenCaptureFrames() {
	log.Println("[WebRTCPeer] Starting screen capture frame sender")

	frameCount := 0
	frameChannel := wp.screenCapture.GetFrameChannel()

	for {
		select {
		case <-wp.ctx.Done():
			log.Println("[WebRTCPeer] Stopping screen capture sender")
			return

		case capturedFrame, ok := <-frameChannel:
			if !ok {
				log.Println("[WebRTCPeer] Screen capture channel closed")
				return
			}

			if !wp.IsConnected() {
				continue
			}

			// Downscale captured frame to 1920x1080 for encoding (Full HD quality)
			scaledFrame := wp.downscaleFrame(capturedFrame, 1920, 1080)

			// Convert to raw RGBA bytes
			rgbaData := scaledFrame.Pix

			// Encode with VP8
			encoded, err := wp.vp8Encoder.Encode(rgbaData, frameCount)
			if err != nil {
				log.Printf("[WebRTCPeer] Failed to encode frame: %v", err)
				continue
			}

			frameCount++

			// Send encoded frame
			if err := wp.SendFrame(encoded); err != nil {
				log.Printf("[WebRTCPeer] Failed to send frame: %v", err)
			}
		}
	}
}

// downscaleFrame downscales an image to the target width and height using optimized nearest neighbor
func (wp *WebRTCPeer) downscaleFrame(src *image.RGBA, targetWidth, targetHeight int) *image.RGBA {
	srcBounds := src.Bounds()
	srcWidth := srcBounds.Dx()
	srcHeight := srcBounds.Dy()

	// If already at target size, return as-is (zero-copy optimization)
	if srcWidth == targetWidth && srcHeight == targetHeight {
		return src
	}

	dst := image.NewRGBA(image.Rect(0, 0, targetWidth, targetHeight))

	// Optimized nearest neighbor scaling with integer math
	xRatio := (srcWidth << 16) / targetWidth
	yRatio := (srcHeight << 16) / targetHeight

	for y := 0; y < targetHeight; y++ {
		srcY := (y * yRatio) >> 16
		srcRowOffset := srcY * src.Stride
		dstRowOffset := y * dst.Stride

		for x := 0; x < targetWidth; x++ {
			srcX := (x * xRatio) >> 16
			srcOffset := srcRowOffset + srcX*4
			dstOffset := dstRowOffset + x*4

			// Copy 4 bytes (RGBA) at once
			dst.Pix[dstOffset] = src.Pix[srcOffset]
			dst.Pix[dstOffset+1] = src.Pix[srcOffset+1]
			dst.Pix[dstOffset+2] = src.Pix[srcOffset+2]
			dst.Pix[dstOffset+3] = src.Pix[srcOffset+3]
		}
	}

	return dst
}

// generateTestPattern creates a VP8 encoded test pattern frame
func (wp *WebRTCPeer) generateTestPattern(frameCount int) []byte {
	width := 320
	height := 240

	// Create RGBA image
	rgbaData := make([]byte, width*height*4)

	// Create animated checkerboard pattern
	checkSize := 40
	offset := (frameCount / 10) % (checkSize * 2)

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			cx := (x + offset) / checkSize
			cy := (y + offset) / checkSize

			idx := (y*width + x) * 4
			if (cx+cy)%2 == 0 {
				// White
				rgbaData[idx] = 255
				rgbaData[idx+1] = 255
				rgbaData[idx+2] = 255
				rgbaData[idx+3] = 255
			} else {
				// Black
				rgbaData[idx] = 0
				rgbaData[idx+1] = 0
				rgbaData[idx+2] = 0
				rgbaData[idx+3] = 255
			}
		}
	}

	// Encode with VP8
	encoded, err := wp.vp8Encoder.Encode(rgbaData, frameCount)
	if err != nil {
		log.Printf("[WebRTCPeer] Failed to encode frame: %v", err)
		return nil
	}

	if len(encoded) == 0 {
		log.Printf("[WebRTCPeer] Warning: Encoder returned empty frame")
		return nil
	}

	// Log first frame successfully encoded
	if frameCount == 0 {
		log.Printf("[WebRTCPeer] Successfully encoded first frame: %d bytes", len(encoded))
	}

	return encoded
}

var frameSendCounter uint64 = 0

// SendFrame sends a video frame to the remote peer
func (wp *WebRTCPeer) SendFrame(frame []byte) error {
	wp.mu.RLock()
	videoTrack := wp.videoTrack
	connected := wp.connected
	wp.mu.RUnlock()

	if !connected {
		return fmt.Errorf("peer not connected")
	}

	if videoTrack == nil {
		return fmt.Errorf("video track not initialized")
	}

	if len(frame) == 0 {
		return fmt.Errorf("empty frame data")
	}

	// Send frame via video track
	if err := videoTrack.WriteSample(media.Sample{
		Data:     frame,
		Duration: time.Second / 30, // 30 FPS
	}); err != nil {
		log.Printf("[WebRTCPeer] WriteSample error: %v", err)
		return fmt.Errorf("failed to write sample: %w", err)
	}

	// Log every 30 frames (once per second at 30fps)
	frameSendCounter++
	if frameSendCounter%30 == 1 {
		log.Printf("[WebRTCPeer] Sent frame #%d (%d bytes)", frameSendCounter, len(frame))
	}

	return nil
}

// Close closes the WebRTC peer connection
func (wp *WebRTCPeer) Close() error {
	wp.mu.Lock()
	defer wp.mu.Unlock()

	wp.connected = false
	wp.cancel() // Stop test pattern sender

	if wp.dataChannel != nil {
		if err := wp.dataChannel.Close(); err != nil {
			log.Printf("[WebRTCPeer] Error closing data channel: %v", err)
		}
	}

	if wp.vp8Encoder != nil {
		if err := wp.vp8Encoder.Close(); err != nil {
			log.Printf("[WebRTCPeer] Error closing VP8 encoder: %v", err)
		}
	}

	if wp.peerConnection != nil {
		if err := wp.peerConnection.Close(); err != nil {
			log.Printf("[WebRTCPeer] Error closing peer connection: %v", err)
			return err
		}
	}

	log.Println("[WebRTCPeer] Closed")
	return nil
}

// IsConnected returns whether the peer is connected
func (wp *WebRTCPeer) IsConnected() bool {
	wp.mu.RLock()
	defer wp.mu.RUnlock()
	return wp.connected
}

// GetStats returns WebRTC connection statistics
func (wp *WebRTCPeer) GetStats() map[string]interface{} {
	wp.mu.RLock()
	defer wp.mu.RUnlock()

	if wp.peerConnection == nil {
		return map[string]interface{}{
			"connected": false,
		}
	}

	// TODO: Get actual stats from peerConnection.GetStats()
	return map[string]interface{}{
		"connected":   wp.connected,
		"fps":         30,
		"latency":     50,
		"packetsLost": 0,
		"bandwidth":   5000000, // 5 Mbps
	}
}
