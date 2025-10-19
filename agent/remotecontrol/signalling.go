package remotecontrol

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"time"
)

// SignalClient handles communication with the signalling server
type SignalClient struct {
	serverURL      string
	sessionID      string
	token          string
	lastPollTime   int64
	httpClient     *http.Client
}

// SignalMessage represents a signalling message
type SignalMessage struct {
	Type      string          `json:"type"`
	Data      json.RawMessage `json:"data"`
	Timestamp int64           `json:"timestamp"`
}

// NewSignalClient creates a new signalling client
func NewSignalClient(serverURL, sessionID, token string) *SignalClient {
	return &SignalClient{
		serverURL:    serverURL,
		sessionID:    sessionID,
		token:        token,
		lastPollTime: 0,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SendSignal sends a signalling message to the server
func (sc *SignalClient) SendSignal(signalType string, data interface{}) error {
	url := fmt.Sprintf("%s/api/rc/signalling", sc.serverURL)

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal signal data: %w", err)
	}

	payload := map[string]interface{}{
		"sessionId": sc.sessionID,
		"token":     sc.token,
		"type":      signalType,
		"data":      json.RawMessage(dataJSON),
		"sender":    "agent",
	}

	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payloadJSON))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := sc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send signal: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("signal request failed: %s - %s", resp.Status, string(body))
	}

	log.Printf("[SignalClient] Sent %s signal for session %s", signalType, sc.sessionID)
	return nil
}

// PollSignals polls for new signalling messages from the server
func (sc *SignalClient) PollSignals() ([]SignalMessage, error) {
	url := fmt.Sprintf("%s/api/rc/signalling?sessionId=%s&token=%s&since=%d&role=agent",
		sc.serverURL, sc.sessionID, sc.token, sc.lastPollTime)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := sc.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to poll signals: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return nil, fmt.Errorf("poll request failed: %s - %s", resp.Status, string(body))
	}

	var result struct {
		Success bool            `json:"success"`
		Data    []SignalMessage `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("poll failed")
	}

	// Update last poll time to most recent message
	if len(result.Data) > 0 {
		sc.lastPollTime = result.Data[len(result.Data)-1].Timestamp
	}

	if len(result.Data) > 0 {
		log.Printf("[SignalClient] Received %d signals", len(result.Data))
	}

	return result.Data, nil
}

// ClearSignals clears all signalling messages for the session
func (sc *SignalClient) ClearSignals() error {
	url := fmt.Sprintf("%s/api/rc/signalling?sessionId=%s&token=%s",
		sc.serverURL, sc.sessionID, sc.token)

	req, err := http.NewRequest("DELETE", url, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := sc.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to clear signals: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		return fmt.Errorf("clear request failed: %s - %s", resp.Status, string(body))
	}

	log.Printf("[SignalClient] Cleared signals for session %s", sc.sessionID)
	return nil
}
