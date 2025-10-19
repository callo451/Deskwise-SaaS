# Agent Remote Control Poll API

## Endpoint
`GET /api/agent/rc/poll`

## Description
This endpoint allows monitoring agents to poll for pending or active remote control sessions. When a technician initiates a remote control session via the dashboard, the agent can discover it by polling this endpoint.

## Authentication
Requires agent credential key in the `Authorization` header:
```
Authorization: Bearer <agent-credential-key>
```

The credential key is obtained during agent enrollment via `/api/agent/enroll`.

## Request
No request body required. The agent's assetId and orgId are extracted from the credential.

### Headers
- `Authorization: Bearer <credential-key>` (required)

## Response

### Success Cases

#### 200 OK - Session Available
When a pending or active remote control session exists for the agent's asset:

```json
{
  "success": true,
  "session": {
    "sessionId": "507f1f77bcf86cd799439011",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "status": "active",
    "operatorName": "John Smith",
    "startedAt": "2025-10-08T12:00:00.000Z",
    "policySnapshot": {
      "idleTimeout": 30,
      "requireConsent": false,
      "allowClipboard": false,
      "allowFileTransfer": false
    },
    "iceServers": [
      { "urls": "stun:stun.l.google.com:19302" }
    ]
  }
}
```

**Note:** If the session was in `pending` state, it will automatically be updated to `active` when the agent polls for it.

#### 204 No Content - No Session
When there are no pending or active sessions for this asset:
- Status Code: `204`
- No response body

### Error Cases

#### 401 Unauthorized - Missing Credentials
```json
{
  "error": "Missing authentication credential"
}
```

#### 401 Unauthorized - Invalid Credentials
```json
{
  "error": "Invalid or revoked credential"
}
```

#### 403 Forbidden - Revoked Credentials
```json
{
  "error": "Credential has been revoked"
}
```

#### 404 Not Found - Asset Not Found
```json
{
  "error": "Asset or session not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to poll for remote control session"
}
```

## Behavior

### Session State Transitions
1. **Technician creates session** → Session status: `pending`
2. **Agent polls endpoint** → Session status automatically updated to `active`
3. **Agent receives session info** → Agent can establish WebRTC connection

### Audit Logging
When an agent picks up a pending session, an audit log entry is created with:
- Action: `agent_connected`
- Details: Agent ID and connection timestamp

### Security Features
- **Multi-tenant isolation:** Agents can only see sessions for their own asset and organization
- **Credential validation:** Credentials are verified and last-seen timestamp is updated
- **Token generation:** Fresh JWT token generated for each poll response
- **Revocation support:** Revoked credentials are rejected

## Usage Example

### cURL
```bash
# Poll for pending sessions
curl -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer abc123def456..."

# Response when session available (200 OK)
{
  "success": true,
  "session": {
    "sessionId": "...",
    "token": "...",
    "status": "active",
    ...
  }
}

# Response when no session (204 No Content)
# Empty body
```

### Agent Integration (Pseudocode)
```go
func pollForRemoteControlSession() (*Session, error) {
    req, _ := http.NewRequest("GET", baseURL + "/api/agent/rc/poll", nil)
    req.Header.Set("Authorization", "Bearer " + credentialKey)

    resp, err := httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // No session available
    if resp.StatusCode == 204 {
        return nil, nil
    }

    // Session available
    if resp.StatusCode == 200 {
        var result struct {
            Success bool    `json:"success"`
            Session Session `json:"session"`
        }
        json.NewDecoder(resp.Body).Decode(&result)
        return &result.Session, nil
    }

    return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
}

// Poll every 5 seconds
ticker := time.NewTicker(5 * time.Second)
for range ticker.C {
    session, err := pollForRemoteControlSession()
    if session != nil {
        // Start WebRTC connection
        startRemoteControlSession(session)
    }
}
```

## Testing Recommendations

### 1. Test No Session (204 Response)
```bash
# Prerequisites: Agent enrolled with credential
# Expected: 204 No Content (no body)
curl -i -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <valid-credential-key>"
```

### 2. Test Pending Session → Active Transition
```bash
# Step 1: Technician creates session via dashboard
# POST /api/rc/sessions with assetId

# Step 2: Agent polls for session
curl -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <valid-credential-key>"

# Expected: 200 OK with session data
# Session status should be "active" (auto-updated from "pending")

# Step 3: Verify audit log
# Check MongoDB: collection "audit_remote_control"
# Should have entry with action: "agent_connected"
```

### 3. Test Missing Credentials
```bash
curl -i -X GET "http://localhost:9002/api/agent/rc/poll"
# Expected: 401 Unauthorized
# {"error": "Missing authentication credential"}
```

### 4. Test Invalid Credentials
```bash
curl -i -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer invalid_credential_key"
# Expected: 401 Unauthorized
# {"error": "Invalid or revoked credential"}
```

### 5. Test Revoked Credentials
```bash
# Step 1: Revoke credential via admin UI or API
# DELETE /api/agent/credentials/{id}

# Step 2: Try to poll with revoked credential
curl -i -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <revoked-credential-key>"
# Expected: 403 Forbidden
# {"error": "Credential has been revoked"}
```

### 6. Test Multi-Tenant Isolation
```bash
# Prerequisites: Two agents from different organizations
# Agent A (Org 1) credential
curl -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <agent-a-credential>"
# Expected: Only sees sessions for Org 1 assets

# Agent B (Org 2) credential
curl -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <agent-b-credential>"
# Expected: Only sees sessions for Org 2 assets
```

### 7. Test Active Session (Already Connected)
```bash
# If an agent has already picked up a session and it's still active,
# subsequent polls should still return the active session
curl -X GET "http://localhost:9002/api/agent/rc/poll" \
  -H "Authorization: Bearer <valid-credential-key>"
# Expected: 200 OK with session status "active"
# Session status NOT changed (already active)
```

## Edge Cases Handled

1. **Credential Validation:** Verifies both existence and active status
2. **Multi-tenant Security:** Automatically scopes queries by orgId from credential
3. **Session Status Logic:** Handles both pending and active sessions appropriately
4. **Automatic Status Update:** Pending sessions become active when agent polls
5. **Audit Trail:** Creates audit log entry when agent connects
6. **Token Refresh:** Generates fresh JWT token on each poll
7. **Error Handling:** Comprehensive error messages for debugging
8. **Last-Seen Update:** Credential last-seen timestamp updated on each request
9. **No Session Gracefully:** Returns 204 instead of 404 when no session exists
10. **Session Limit:** Only returns the most recent relevant session (limit: 1)

## Related Endpoints

- `POST /api/rc/sessions` - Technician creates remote control session
- `POST /api/agent/enroll` - Agent enrollment (get credential key)
- `GET /api/rc/sessions` - List all sessions (admin/technician)
- `PUT /api/rc/sessions/:id` - Update session status
- `GET /api/rc/sessions/:id/audit` - View audit logs

## Database Collections Used

- `agent_credentials` - Verify agent authentication
- `rc_sessions` - Query for pending/active sessions
- `audit_remote_control` - Create audit log entries
- `assets` - Asset validation (via credential)

## Security Considerations

1. **Credential-Based Auth:** Uses same authentication as performance monitoring
2. **Organization Isolation:** Complete multi-tenant data separation
3. **Audit Logging:** All agent connections are logged for security review
4. **Token Expiry:** Session tokens expire after 1 hour (configurable)
5. **Revocation Support:** Compromised credentials can be immediately revoked
6. **Rate Limiting:** Consider implementing rate limiting for production (5s poll interval recommended)
