# Chrome Extension Testing Guide

**Date**: October 12, 2025
**Purpose**: End-to-end testing guide for Deskwise Recorder Chrome Extension integration

---

## Prerequisites

### 1. Backend Setup

Ensure the Deskwise backend is running:

```bash
npm run dev
```

The server should be running on `http://localhost:9002`

### 2. Database Connection

Verify MongoDB connection is active:
- Check `.env.local` has `MONGODB_URI` configured
- Collections required: `recording_sessions`, `recording_steps`, `recorder_screenshots`

### 3. Authentication

Ensure you have a valid user account:
- Navigate to `http://localhost:9002/auth/signin`
- Sign in with your credentials
- This creates the NextAuth JWT cookie required by the extension

### 4. AI Configuration

Verify Gemini API is configured:
- Check `.env.local` has `GEMINI_API_KEY` set
- This is required for article generation

---

## Extension Installation

### Step 1: Load Unpacked Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `extension/deskwise-recorder` folder
6. Extension should appear in the extensions list

### Step 2: Verify Extension Loaded

**Expected Result:**
- Extension icon appears in Chrome toolbar
- Extension name: "Deskwise Recorder"
- Version should match manifest.json
- No errors in extension details

**If errors appear:**
- Check browser console for manifest errors
- Verify all extension files are present
- Ensure `background.js`, `content.js`, `popup.html` exist

---

## Authentication Testing

### Test 1: Cookie Access from Extension

**Steps:**
1. With Deskwise open in a tab, check you're logged in
2. Open extension popup (click icon in toolbar)
3. Extension should detect authentication status

**Expected Result:**
- Extension can access NextAuth JWT cookie
- No CORS errors in DevTools console

**Verification:**
```javascript
// In extension background DevTools console:
chrome.cookies.get({
  url: 'http://localhost:9002',
  name: 'next-auth.session-token'
}, (cookie) => {
  console.log('Cookie found:', !!cookie)
})
```

### Test 2: API Request with Credentials

**Steps:**
1. Open extension background service worker DevTools
2. Test session creation API call:

```javascript
fetch('http://localhost:9002/api/knowledge-base/recorder/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    sessionId: 'test-' + Date.now(),
    url: 'https://example.com',
    title: 'Test Session'
  })
})
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Expected Result:**
- HTTP 200 response
- JSON with `success: true`
- Session object with `_id`, `sessionId`, `url`, etc.

**Possible Issues:**
- **401 Unauthorized**: User not logged in or cookie not sent
- **CORS error**: Need to configure CORS in Next.js (see CORS Configuration section)

---

## CORS Configuration

If you encounter CORS errors, add CORS headers to API routes.

### Option 1: Add Middleware for /api/knowledge-base/recorder/*

Create `src/middleware.ts` (if not exists) or update existing:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Handle CORS for recorder API
  if (request.nextUrl.pathname.startsWith('/api/knowledge-base/recorder')) {
    const response = NextResponse.next()

    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT')
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization'
    )

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/knowledge-base/recorder/:path*',
}
```

### Option 2: Add to next.config.js

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/knowledge-base/recorder/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

---

## End-to-End Recording Test

### Test 3: Complete Recording Workflow

#### Step 1: Start Recording

1. Navigate to any website (e.g., `https://github.com`)
2. Click the Deskwise Recorder extension icon
3. Click "Start Recording" button

**Expected Result:**
- Recording indicator appears on page (red dot or recording badge)
- Extension popup shows "Recording..." status
- Backend creates session via `POST /api/knowledge-base/recorder/sessions`

**Verification:**
- Check browser DevTools Network tab for API call
- Check MongoDB for new document in `recording_sessions` collection
- Session status should be `"recording"`

#### Step 2: Capture Clicks

1. Click on various elements on the page (buttons, links, etc.)
2. After each click, wait ~1 second for processing

**Expected Result:**
- Visual feedback on click (animated circle or highlight)
- Screenshot captured for each click
- Step added to recording

**Verification:**
- Check DevTools Network tab for:
  - `POST /api/knowledge-base/recorder/screenshots` (returns screenshotId)
  - `POST /api/knowledge-base/recorder/steps` (includes screenshotId)
- Check MongoDB collections:
  - `recorder_screenshots` has new documents
  - `recording_steps` has new documents with matching `sessionId`
- GridFS should contain image files (check `fs.files` and `fs.chunks` collections)

#### Step 3: Stop Recording

1. Click extension icon again
2. Click "Stop Recording" button

**Expected Result:**
- Recording stops
- Article generation begins
- New tab opens with generated article

**Verification:**
- Check Network tab for `POST /api/knowledge-base/recorder/generate`
- Response includes `articleId`
- Session status updated to `"completed"` in database
- New document created in `kb_articles` collection
- Article content includes markdown with embedded screenshots

#### Step 4: View Generated Article

**Expected Result:**
- Article displays in knowledge base
- Title is action-oriented (e.g., "How to Navigate GitHub")
- Steps are numbered and clearly described
- Screenshots are embedded inline
- Each screenshot shows the clicked element with visual indicator

**Verification:**
- Article has `autoGenerated: true` flag
- `recordingMetadata` field contains `sessionId`, `stepCount`, `duration`
- Tags include `"screen-recording"` and `"auto-generated"`
- Images load correctly (check Network tab for screenshot GET requests)

---

## Frontend Testing

### Test 4: Sessions List Page

1. Navigate to `http://localhost:9002/knowledge/sessions`

**Expected Result:**
- Page loads without errors
- Table shows all recording sessions
- Each row displays:
  - Session title
  - URL (clickable external link)
  - Status badge (Recording/Completed/Archived)
  - Step count
  - Duration
  - Created timestamp
  - Action buttons (View, Generate Article, Delete)

**Interactions to Test:**
- **Status Filter**: Change filter dropdown, verify list updates
- **View Button**: Navigates to session detail page
- **Generate Article Button**: Only visible for completed sessions without articles
- **Delete Button**: Opens confirmation dialog
- **Extension Install Link**: Opens in new tab

### Test 5: Session Detail Page

1. Click "View" on any session from the list
2. Or navigate to `http://localhost:9002/knowledge/sessions/[sessionId]`

**Expected Result:**
- Page loads with session metadata
- Session information card shows:
  - Status badge
  - URL (clickable)
  - Step count
  - Duration
  - Created/updated timestamps
  - Description (if exists)
- Steps list displays:
  - Numbered steps in order
  - Action icon (click/type/navigate)
  - Description text
  - Element details (tagName, id, className, text)
  - Selector string
  - Coordinates and viewport size
  - Screenshot image (if exists)
  - Timestamp

**Interactions to Test:**
- **Back Button**: Returns to sessions list
- **Generate Article Button**: Creates article and redirects
- **View Article Button**: Navigates to article (if exists)
- **Screenshot Images**: Load correctly and display at proper size

---

## Error Handling Tests

### Test 6: Backend Offline

1. Stop the Next.js development server
2. Try to start a recording

**Expected Result:**
- Extension continues to work locally
- Steps and screenshots saved to Chrome storage
- When stopping, fallback HTML page displays
- No crashes or unhandled errors

### Test 7: Unauthenticated User

1. Log out of Deskwise
2. Try to start a recording

**Expected Result:**
- API requests return 401 Unauthorized
- Extension handles gracefully
- User sees message to log in
- OR extension falls back to local mode

### Test 8: Invalid Session ID

1. Try to access a non-existent session:
   `http://localhost:9002/knowledge/sessions/invalid-session-id`

**Expected Result:**
- Session detail page shows "Session not found"
- "Back to Sessions" button is displayed
- No errors in console

### Test 9: Failed Screenshot Upload

Simulate by making the screenshot too large or invalid format.

**Expected Result:**
- Step is still created (without screenshotId)
- Recording continues
- User sees error notification (if implemented)
- No unhandled exceptions

---

## Performance Tests

### Test 10: Large Recording Session

1. Create a recording with 20+ clicks
2. Monitor performance

**Metrics to Check:**
- Screenshot upload time (should be < 2 seconds per screenshot)
- Step creation time (should be < 500ms per step)
- Article generation time (should be < 15 seconds for 20 steps)
- Page load time for session detail (should be < 2 seconds)

### Test 11: Multiple Concurrent Sessions

1. Start recording in multiple tabs
2. Verify sessions are tracked separately

**Expected Result:**
- Each tab has unique sessionId
- Sessions don't interfere with each other
- All sessions saved correctly to database

---

## Integration Tests

### Test 12: Screenshot in GridFS

**Verification Steps:**
1. Record a session with screenshots
2. Connect to MongoDB
3. Check GridFS collections:

```javascript
// In MongoDB shell or Compass
db.getCollection('fs.files').find({ 'metadata.sessionId': 'your-session-id' })
db.getCollection('fs.chunks').find({ files_id: ObjectId('...') })
```

**Expected Result:**
- `fs.files` has document for each screenshot
- `fs.chunks` contains binary data chunks
- Metadata includes `sessionId`, `stepNumber`, `orgId`

### Test 13: Article Markdown Generation

**Verification:**
1. Generate an article from a session
2. Check the article content in database:

```javascript
db.getCollection('kb_articles').findOne({ 'recordingMetadata.sessionId': 'your-session-id' })
```

**Expected Result:**
- Content is markdown format
- Includes step-by-step numbered list
- Screenshots embedded with markdown syntax: `![Step N](url)`
- Has introduction and conclusion sections
- Reading level is clear and actionable

### Test 14: Multi-tenant Isolation

**Verification:**
1. Create sessions with different organizations
2. Log in as user from Org A
3. Try to access session from Org B

**Expected Result:**
- Sessions list only shows sessions from current org
- Direct URL to other org's session returns 404 or 401
- API enforces `orgId` filtering on all queries

---

## Regression Tests

After making any changes, run these quick checks:

- [ ] Extension loads without errors
- [ ] Recording can be started
- [ ] At least one click can be captured
- [ ] Screenshot appears in session detail
- [ ] Article can be generated
- [ ] Sessions list displays correctly

---

## Known Issues & Workarounds

### Issue 1: Screenshots Not Displaying

**Symptoms:** Broken image icons in session detail or article

**Cause:** GridFS ID extraction error or missing Content-Type header

**Workaround:**
- Verify screenshot URL format: `/api/knowledge-base/recorder/screenshots/[gridfsId]`
- Check GridFS download returns correct Content-Type
- Inspect Network tab for 404 or 500 errors

### Issue 2: CORS Errors

**Symptoms:** Network errors in extension console

**Cause:** Chrome extension origin not allowed by Next.js

**Workaround:** Apply CORS configuration (see CORS Configuration section above)

### Issue 3: Cookie Not Sent

**Symptoms:** 401 Unauthorized despite being logged in

**Cause:** SameSite cookie policy or missing `credentials: 'include'`

**Workaround:**
- Ensure all fetch calls use `credentials: 'include'`
- Check NextAuth cookie settings in `src/app/api/auth/[...nextauth]/route.ts`
- May need to set `sameSite: 'none'` for development

---

## Debugging Tips

### Extension Console

Access via `chrome://extensions/` → Click "Service Worker" under extension

**Useful commands:**
```javascript
// Check recording state
chrome.storage.local.get(null, console.log)

// Test API endpoint
fetch('http://localhost:9002/api/knowledge-base/recorder/sessions', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### Backend Logs

Watch server console for:
- API request logs
- Error messages from Zod validation
- MongoDB query errors
- Screenshot upload progress

### Network Tab

Filter by:
- `recorder` to see all extension API calls
- `screenshots` to track image uploads/downloads
- Status codes: 401 (auth), 404 (not found), 500 (server error)

---

## Success Criteria

The integration is considered complete when:

- ✅ Extension loads without manifest errors
- ✅ User can authenticate and cookies are sent
- ✅ Recording can be started and stopped
- ✅ Clicks are captured with visual feedback
- ✅ Screenshots are uploaded to GridFS
- ✅ Steps are saved with screenshot references
- ✅ Articles are generated with AI
- ✅ Articles display correctly with images
- ✅ Sessions list page shows all sessions
- ✅ Session detail page shows steps and screenshots
- ✅ Multi-tenancy is enforced
- ✅ Error handling works gracefully
- ✅ Performance is acceptable (< 2s per screenshot)

---

## Next Steps After Testing

Once all tests pass:

1. **Package Extension**
   - Create `.zip` of extension folder
   - Update manifest version
   - Create store listing assets

2. **Production Deployment**
   - Deploy Next.js backend
   - Configure production CORS
   - Update extension `API_BASE_URL` to production URL
   - Test with production database

3. **Documentation**
   - Create user guide for extension installation
   - Document recording workflow
   - Add troubleshooting guide
   - Create video tutorial

4. **Chrome Web Store Submission**
   - Submit extension for review
   - Provide privacy policy
   - Include screenshots and demo
   - Wait for approval (~3-5 business days)

---

**Testing Status**: Ready for Phase 5 implementation testing
**Last Updated**: October 12, 2025
