# Remote Control - Debugging Guide

## Issue: "Remote Control - Not Available" Button Greyed Out

If the Remote Control button appears greyed out with "Not Available" after installing the agent, follow these troubleshooting steps:

---

## Step 1: Verify You're Looking at the Correct Asset

**Problem**: You might be viewing an asset that was created manually, not through agent enrollment.

**Solution**:
1. Check the asset's "Last Seen" field - it should show a recent timestamp if the agent is reporting
2. Look for the "Monitoring" badge - it should show "Online" (green) or "Recent" if agent is connected
3. Navigate to the Assets list and look for the asset that was created during enrollment (it will have system info populated)

---

## Step 2: Check Agent Logs

When you ran the agent, you should see these log messages:

```
[RemoteControl] Manager initialized with capabilities: {RemoteControl:true ScreenCapture:true InputInjection:true WebRTCSupported:true Platform:windows AgentVersion:1.0.0}
```

**If you DON'T see this message:**
- The agent didn't initialize the remote control manager
- Rebuild the agent or use the provided binary

---

## Step 3: Check Server Logs for Capabilities

After the agent sends performance data (every 60 seconds), check the Next.js terminal for these logs:

```
[Performance API] Capabilities received from agent: {"remoteControl":true,"screenCapture":true,...}
[Performance API] Updating asset capabilities for assetId: 673e... orgId: org_...
[AssetService.updateAssetCapabilities] Updating capabilities for assetId: 673e...
[AssetService.updateAssetCapabilities] Update result: {"matchedCount":1,"modifiedCount":1,...}
```

**If you see "No capabilities provided in this snapshot":**
- The agent isn't sending capabilities in the performance data
- Check that you're using the rebuilt agent with remote control integration

**If you see "matchedCount: 0":**
- The asset ID or org ID doesn't match
- This is a critical issue - see Step 4

---

## Step 4: Verify Asset ID and Org ID Match

The agent uses credentials that were created during enrollment. These credentials contain:
- `assetId` - The MongoDB asset document ID
- `orgId` - The organization ID
- `credentialKey` - The authentication key

**Check credential file:**
```powershell
# Location: Same directory as agent executable
cat .\agent-credential.json
```

Expected content:
```json
{
  "agentId": "windows-HOSTNAME-123456",
  "assetId": "673e1a2b3c4d5e6f7g8h9i0j",
  "credentialKey": "ac_xxxxxxxxxxxxx:secret_xxxxxxxxxx"
}
```

**Verify this assetId matches the asset you're viewing:**
1. Go to http://localhost:9002/dashboard/assets
2. Click on the asset
3. Check the URL: `/dashboard/assets/[ASSET_ID]`
4. This ID should match the `assetId` in `agent-credential.json`

---

## Step 5: Check Database Directly (Advanced)

If you have MongoDB access, you can verify the capabilities field:

```javascript
// Connect to MongoDB
use deskwise

// Find your asset (replace with your asset ID)
db.assets.findOne({ _id: ObjectId("673e1a2b3c4d5e6f7g8h9i0j") })

// Check if capabilities field exists
db.assets.findOne(
  { _id: ObjectId("673e1a2b3c4d5e6f7g8h9i0j") },
  { capabilities: 1, lastSeen: 1, orgId: 1 }
)
```

Expected output:
```json
{
  "_id": ObjectId("673e1a2b3c4d5e6f7g8h9i0j"),
  "capabilities": {
    "remoteControl": true,
    "screenCapture": true,
    "inputInjection": true,
    "webrtcSupported": true,
    "platform": "windows",
    "agentVersion": "1.0.0"
  },
  "lastSeen": ISODate("2025-10-08T11:23:45.123Z"),
  "orgId": "org_xxxxxxxx"
}
```

---

## Step 6: Force Refresh Asset Page

The asset details page fetches data on load. After the agent sends capabilities:

1. **Wait 60 seconds** for the agent to send the next performance snapshot
2. **Refresh the browser page** (F5 or Ctrl+R)
3. Check the Remote Control button again

---

## Step 7: Restart Agent with Verbose Logging

Stop the agent (Ctrl+C) and restart with enhanced logging:

```powershell
.\deskwise-agent-windows-amd64.exe -server http://localhost:9002
```

Watch for these specific log lines:
```
[RemoteControl] Manager initialized
Deskwise Monitoring Agent started
Performance data sent successfully
```

---

## Step 8: Common Issues and Solutions

### Issue: "Asset ID mismatch" error in logs
**Cause**: Agent credentials don't match the asset
**Solution**: Re-enroll the agent with a new enrollment token

### Issue: Capabilities not updating even though logs show success
**Cause**: Browser cache or React state not refreshing
**Solution**: Hard refresh (Ctrl+Shift+R) or clear browser cache

### Issue: Multiple assets with same hostname
**Cause**: Agent was enrolled multiple times
**Solution**: Delete duplicate assets, keep the one with the matching asset ID

### Issue: Agent connects but no performance data
**Cause**: Network or authentication issue
**Solution**: Check credential file exists and is valid

---

## Step 9: Manual Capabilities Update (Temporary Workaround)

If all else fails, you can manually add capabilities to the asset via MongoDB:

```javascript
db.assets.updateOne(
  { _id: ObjectId("YOUR_ASSET_ID_HERE") },
  {
    $set: {
      capabilities: {
        remoteControl: true,
        screenCapture: true,
        inputInjection: true,
        webrtcSupported: true,
        platform: "windows",
        agentVersion: "1.0.0"
      },
      lastSeen: new Date()
    }
  }
)
```

**Note**: This is a temporary workaround. The agent should be sending capabilities automatically.

---

## Step 10: Full Reset and Re-enrollment

If nothing works, perform a full reset:

1. **Delete agent credential file:**
   ```powershell
   del .\agent-credential.json
   ```

2. **Delete the asset from the dashboard:**
   - Go to the asset page
   - Click "Delete" button
   - Confirm deletion

3. **Generate a new enrollment token:**
   - Navigate to http://localhost:9002/dashboard/settings/assets
   - Click "Generate Enrollment Token"
   - Copy the token (format: `et_xxxxxxxxxxxxx`)

4. **Re-enroll the agent:**
   ```powershell
   .\deskwise-agent-windows-amd64.exe -server http://localhost:9002 -enrollment-token et_YOUR_NEW_TOKEN
   ```

5. **Verify enrollment:**
   - Look for "Enrollment successful!" message
   - Check for new asset in dashboard
   - Note the new asset ID
   - Navigate to the new asset's detail page

6. **Wait 60 seconds** for first performance snapshot

7. **Refresh the page** and check for Remote Control button

---

## Expected Timeline

- **T+0s**: Agent starts, Remote Control manager initializes
- **T+60s**: First performance snapshot sent with capabilities
- **T+60s**: Server updates asset capabilities in database
- **T+60s+**: Refresh asset page, Remote Control button should be enabled

---

## Still Not Working?

If you've followed all steps and the button is still greyed out:

1. **Check Next.js console output** for the specific log messages mentioned in Step 3
2. **Share the agent logs** from when it starts and sends first performance data
3. **Share the server logs** showing the performance API calls
4. **Verify the asset document** in MongoDB has the capabilities field

---

## Quick Verification Checklist

- [ ] Agent is running and showing "Performance data sent successfully"
- [ ] Agent logs show "[RemoteControl] Manager initialized"
- [ ] Server logs show "Capabilities received from agent"
- [ ] Server logs show "matchedCount: 1" (not 0)
- [ ] Asset page shows recent "Last Seen" timestamp
- [ ] Asset page shows "Online" or "Recent" monitoring badge
- [ ] You're viewing the correct asset (ID matches agent-credential.json)
- [ ] Browser page has been refreshed after capabilities were sent
- [ ] Asset document in MongoDB has capabilities field populated

---

## Debug Output Examples

### ✅ Correct Output (Working)

**Agent Log:**
```
[RemoteControl] Manager initialized with capabilities: {RemoteControl:true ScreenCapture:true InputInjection:true WebRTCSupported:true Platform:windows AgentVersion:1.0.0}
Deskwise Monitoring Agent started
Server: http://localhost:9002
Agent ID: windows-MYPC-1234567890
Collection Interval: 60 seconds
Platform: windows/amd64
Performance data sent successfully
```

**Server Log:**
```
[Performance API] Capabilities received from agent: {"remoteControl":true,"screenCapture":true,"inputInjection":true,"webrtcSupported":true,"platform":"windows","agentVersion":"1.0.0"}
[Performance API] Updating asset capabilities for assetId: 673e1a2b3c4d5e6f7g8h9i0j orgId: org_abc123xyz
[AssetService.updateAssetCapabilities] Updating capabilities for assetId: 673e1a2b3c4d5e6f7g8h9i0j
[AssetService.updateAssetCapabilities] Capabilities to set: {"remoteControl":true,"screenCapture":true,"inputInjection":true,"webrtcSupported":true,"platform":"windows","agentVersion":"1.0.0"}
[AssetService.updateAssetCapabilities] Update result: {"matchedCount":1,"modifiedCount":1,"acknowledged":true}
```

### ❌ Incorrect Output (Not Working)

**Missing Capabilities:**
```
[Performance API] No capabilities provided in this snapshot
```
→ Agent isn't sending capabilities. Use the rebuilt agent.

**Asset Not Found:**
```
[AssetService.updateAssetCapabilities] Update result: {"matchedCount":0,"modifiedCount":0,"acknowledged":true}
[AssetService.updateAssetCapabilities] WARNING: No asset found with id: 673e... and orgId: org_...
```
→ Asset ID or org ID mismatch. Check credentials and asset ID.

---

## Contact Support

If you're still experiencing issues, provide:
1. Complete agent startup logs
2. Complete server logs from a 60-second performance snapshot cycle
3. Contents of `agent-credential.json` (redact secrets)
4. Screenshot of the asset detail page showing the greyed-out button
5. MongoDB query result for the asset document
