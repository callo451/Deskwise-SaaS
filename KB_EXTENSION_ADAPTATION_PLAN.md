# Knowledge Base Chrome Extension - Adaptation Plan

**Date**: October 12, 2025
**Project**: Deskwise ITSM Platform
**Objective**: Integrate Chrome extension with step-by-step guide recording into current Deskwise implementation

---

## Executive Summary

This document outlines the complete adaptation plan for integrating the **Deskwise Knowledge Recorder Chrome Extension** with the current Deskwise ITSM platform. The extension enables automatic creation of step-by-step knowledge base articles by recording user interactions (clicks, keyboard actions) and capturing annotated screenshots.

### Key Findings

**Chrome Extension** (Ready to adapt):
- ✅ Fully functional Manifest V3 extension
- ✅ Records clicks, keyboard actions, screenshots
- ✅ Smart screenshot cropping with visual indicators
- ✅ Session persistence with chrome.storage
- ⚠️ Hardcoded localhost:9002 URLs (needs environment detection)

**Old KB Implementation** (Superior features):
- ✅ Screenshot annotation system
- ✅ Rich text editor with markdown
- ✅ Session management UI
- ✅ Edit functionality for articles
- ✅ Helpful/not helpful voting
- ✅ Block-based content rendering

**Current Implementation** (Solid foundation):
- ✅ Multi-tenant architecture
- ✅ Authentication (NextAuth)
- ✅ AI generation (Gemini 2.0)
- ✅ Core CRUD operations
- ❌ NO Chrome extension backend
- ❌ NO recording session management
- ❌ NO screenshot upload
- ❌ NO edit page

---

## Implementation Phases

### Phase 1: Critical Foundation (6-8 hours) ⭐ PRIORITY

**Goal**: Enable basic CRUD operations and UI improvements

#### 1.1 Create Edit Page (4 hours)
**Path**: `src/app/(app)/knowledge/[id]/edit/page.tsx`

**Features**:
- Pre-populate form with existing article data
- Update API call instead of create
- Redirect to detail view on success
- Permission check (author or admin only)

**Files to create/modify**:
- `src/app/(app)/knowledge/[id]/edit/page.tsx` (new)

#### 1.2 Add Helpful Voting UI (2 hours)
**Path**: `src/app/(app)/knowledge/[id]/page.tsx`

**Features**:
- Add thumbs up/down buttons
- Call `POST /api/knowledge-base/[id]/helpful`
- Update UI with new counts
- Disable after voting (store in localStorage)

**Files to create/modify**:
- `src/app/(app)/knowledge/[id]/page.tsx` (modify)
- `src/app/api/knowledge-base/[id]/helpful/route.ts` (new)

---

### Phase 2: Recording Backend API (20-24 hours) ⭐ PRIORITY

**Goal**: Build complete backend for Chrome extension integration

#### 2.1 Database Collections (2 hours)

**Collections to implement**:
```typescript
// recording_sessions
{
  _id: ObjectId
  orgId: string
  userId: string
  sessionId: string        // Unique session ID from extension
  url: string              // Page being recorded
  title: string
  description?: string
  status: 'recording' | 'paused' | 'completed' | 'archived'
  stepCount: number
  duration?: number
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  articleId?: string       // Generated article reference
}

// recording_steps
{
  _id: ObjectId
  sessionId: string
  orgId: string
  stepNumber: number
  action: 'click' | 'type' | 'navigate' | 'scroll' | 'select'
  description: string
  selector?: string
  value?: string
  element?: object
  screenshotId?: string
  timestamp: number
  createdAt: Date
}

// recorder_screenshots (already defined in mongodb.ts)
{
  _id: ObjectId
  sessionId: string
  stepNumber: number
  orgId: string
  filename: string
  url: string
  width: number
  height: number
  annotations?: array
  createdAt: Date
}
```

**Files to modify**:
- `src/lib/mongodb.ts` (verify collections are defined)

#### 2.2 Recorder Service Layer (6 hours)
**Path**: `src/lib/services/recorder.ts` (new file)

**Methods to implement**:
```typescript
class RecorderService {
  // Session management
  static async createSession(orgId, userId, data)
  static async getSession(sessionId, orgId)
  static async updateSession(sessionId, orgId, updates)
  static async listSessions(orgId, userId?, status?)
  static async deleteSession(sessionId, orgId)

  // Step management
  static async addStep(sessionId, orgId, stepData)
  static async getSteps(sessionId, orgId)
  static async updateStep(stepId, orgId, updates)
  static async deleteStep(stepId, orgId)

  // Screenshot management
  static async uploadScreenshot(sessionId, orgId, imageData, metadata)
  static async getScreenshot(screenshotId, orgId)
  static async deleteScreenshot(screenshotId, orgId)

  // Article generation
  static async generateArticleFromSession(sessionId, orgId, options?)
}
```

**Files to create**:
- `src/lib/services/recorder.ts` (new)

#### 2.3 Session API Routes (4 hours)

**Endpoints**:
- `POST /api/knowledge-base/recorder/sessions` - Create session
- `GET /api/knowledge-base/recorder/sessions` - List sessions
- `GET /api/knowledge-base/recorder/sessions/[id]` - Get session
- `PUT /api/knowledge-base/recorder/sessions/[id]` - Update session
- `DELETE /api/knowledge-base/recorder/sessions/[id]` - Delete session

**Files to create**:
- `src/app/api/knowledge-base/recorder/sessions/route.ts` (new)
- `src/app/api/knowledge-base/recorder/sessions/[id]/route.ts` (new)

#### 2.4 Steps API Routes (3 hours)

**Endpoints**:
- `POST /api/knowledge-base/recorder/steps` - Add step
- `GET /api/knowledge-base/recorder/steps?sessionId=xxx` - Get steps
- `PUT /api/knowledge-base/recorder/steps/[id]` - Update step
- `DELETE /api/knowledge-base/recorder/steps/[id]` - Delete step

**Files to create**:
- `src/app/api/knowledge-base/recorder/steps/route.ts` (new)
- `src/app/api/knowledge-base/recorder/steps/[id]/route.ts` (new)

#### 2.5 Screenshot Upload API (5 hours)

**Endpoint**:
- `POST /api/knowledge-base/recorder/screenshots` - Upload screenshot

**Implementation choices**:

**Option A: MongoDB GridFS** (Recommended for simplicity)
```typescript
// Stores images in MongoDB as binary
// No external dependencies
// 16MB file size limit
```

**Option B: Local Filesystem**
```typescript
// Stores in public/uploads/screenshots/
// Fast, no database overhead
// Requires filesystem access
```

**Option C: AWS S3/Cloud Storage**
```typescript
// Scalable, CDN-ready
// Additional cost and complexity
// Best for production
```

**Recommendation**: Start with MongoDB GridFS, migrate to S3 later.

**Files to create**:
- `src/app/api/knowledge-base/recorder/screenshots/route.ts` (new)
- `src/app/api/knowledge-base/recorder/screenshots/[id]/route.ts` (new)
- `src/lib/services/screenshot-storage.ts` (new)

#### 2.6 Article Generation from Session (4 hours)

**Endpoint**:
- `POST /api/knowledge-base/recorder/generate` - Generate article from session

**AI Function**:
```typescript
// src/ai/genkit.ts
export async function generateArticleFromSteps(
  steps: RecordingStep[],
  sessionMetadata: { url: string, title: string }
) {
  // Use Gemini to:
  // 1. Analyze step sequence
  // 2. Generate natural language descriptions
  // 3. Create markdown content
  // 4. Embed screenshot references
  // 5. Add introduction and conclusion
}
```

**Files to create/modify**:
- `src/app/api/knowledge-base/recorder/generate/route.ts` (new)
- `src/ai/genkit.ts` (modify - add generateArticleFromSteps function)

---

### Phase 3: Chrome Extension Adaptation (8-10 hours)

**Goal**: Adapt extension to work with current Deskwise environment

#### 3.1 Environment Configuration (1 hour)

**Update hardcoded URLs**:
```javascript
// extension/deskwise-recorder/background.js
// OLD:
const API_BASE = 'http://localhost:9002'

// NEW:
const API_BASE = chrome.runtime.getManifest().host_permissions[0]
// or detect from chrome.storage.sync (user-configurable)
```

**Manifest changes**:
```json
{
  "host_permissions": [
    "http://localhost:9002/*",
    "https://*.deskwise.com/*",
    "<all_urls>"
  ]
}
```

**Files to modify**:
- `extension/deskwise-recorder/manifest.json`
- `extension/deskwise-recorder/background.js`
- `extension/deskwise-recorder/popup.js`

#### 3.2 Update API Integration (3 hours)

**Changes needed**:
1. Session creation: POST to `/api/knowledge-base/recorder/sessions`
2. Step addition: POST to `/api/knowledge-base/recorder/steps`
3. Screenshot upload: POST to `/api/knowledge-base/recorder/screenshots`
4. Article generation: POST to `/api/knowledge-base/recorder/generate`

**Authentication**:
```javascript
// All fetch calls must include credentials
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // Send NextAuth cookies
  body: JSON.stringify(data)
})
```

**Files to modify**:
- `extension/deskwise-recorder/background.js`

#### 3.3 Test and Debug Extension (4 hours)

**Testing checklist**:
- [ ] Extension loads in Chrome
- [ ] Recording starts successfully
- [ ] Clicks are captured
- [ ] Screenshots are taken and cropped
- [ ] Steps are sent to API
- [ ] Session data persists
- [ ] Article generation works
- [ ] Generated article opens in Deskwise

**Files to test**:
- All extension files

---

### Phase 4: Frontend Session Management (8-10 hours)

**Goal**: Build UI for viewing and managing recording sessions

#### 4.1 Sessions List Page (4 hours)
**Path**: `src/app/(app)/knowledge/sessions/page.tsx`

**Features**:
- List all recording sessions for user
- Filter by status (recording, completed, archived)
- Show step count, duration, creation date
- Actions: View, Generate Article, Delete
- "Install Extension" button if not detected

**Files to create**:
- `src/app/(app)/knowledge/sessions/page.tsx` (new)

#### 4.2 Session Detail Page (4 hours)
**Path**: `src/app/(app)/knowledge/sessions/[sessionId]/page.tsx`

**Features**:
- Session metadata (URL, duration, step count)
- Step-by-step breakdown with:
  - Step number
  - Action description
  - Screenshot display
  - Element details (tag, text, selector)
  - Timestamp
- "Generate Article" button
- "Edit Session" button (edit steps, descriptions)

**Files to create**:
- `src/app/(app)/knowledge/sessions/[sessionId]/page.tsx` (new)

---

### Phase 5: Enhanced Features (16-20 hours) [OPTIONAL]

**Goal**: Add rich editing and advanced features

#### 5.1 Rich Text Editor (8 hours)
**Component**: `src/components/knowledge-base/AdvancedEditor.tsx`

**Options**:
- **react-markdown-editor-lite**: Simple, lightweight
- **tiptap**: Powerful, extensible, headless
- **slate**: Full control, steep learning curve

**Recommendation**: Tiptap (good balance of power and usability)

**Features**:
- Markdown editing with live preview
- Toolbar with formatting options
- Image embedding
- Code blocks with syntax highlighting
- Table support

**Files to create**:
- `src/components/knowledge-base/AdvancedEditor.tsx` (new)
- Update `/knowledge/new/page.tsx` and `/knowledge/[id]/edit/page.tsx`

#### 5.2 Screenshot Annotation Tool (8 hours)
**Component**: `src/components/knowledge-base/ScreenshotEditor.tsx`

**Features**:
- Canvas-based image editing
- Annotation tools:
  - Arrow
  - Rectangle highlight
  - Text label
  - Blur/pixelate (for sensitive data)
  - Freehand draw
- Save annotations as JSON
- Export annotated image as base64

**Files to create**:
- `src/components/knowledge-base/ScreenshotEditor.tsx` (new)
- Update session detail page to use editor

---

## Technical Architecture

### Data Flow: Recording to Article

```
┌─────────────────────────────────────────────────────────────┐
│                    USER WORKFLOW                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INSTALLS CHROME EXTENSION                            │
│    - Loads extension from chrome://extensions                │
│    - Authenticates with Deskwise (cookie-based)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. USER STARTS RECORDING SESSION                             │
│    Extension: Click "Start Recording" in popup               │
│    ↓ POST /api/knowledge-base/recorder/sessions             │
│    Backend: Create session in DB, return sessionId           │
│    ↓ Response: { sessionId: "xxx" }                          │
│    Extension: Store sessionId in chrome.storage              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. USER PERFORMS ACTIONS (clicks, types, navigates)          │
│    Content Script: Captures DOM events                       │
│    ↓ Extract selector, element info, coordinates             │
│    ↓ Generate auto-description                               │
│    ↓ Capture screenshot with chrome.tabs.captureVisibleTab() │
│    ↓ Crop screenshot around clicked element                  │
│    ↓ Add visual indicator (red circle)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. EXTENSION UPLOADS SCREENSHOT                              │
│    ↓ POST /api/knowledge-base/recorder/screenshots          │
│    Backend: Save image to GridFS/S3                          │
│    ↓ Response: { screenshotId: "yyy", url: "/uploads/..." } │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. EXTENSION CREATES STEP                                    │
│    ↓ POST /api/knowledge-base/recorder/steps                │
│    Body: {                                                   │
│      sessionId: "xxx",                                       │
│      stepNumber: 1,                                          │
│      action: "click",                                        │
│      description: "Click the Submit button",                 │
│      screenshotId: "yyy",                                    │
│      element: { tagName: "BUTTON", text: "Submit", ... },    │
│      timestamp: 1234567890                                   │
│    }                                                         │
│    Backend: Save step to DB                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                     (repeat 3-5 for each action)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. USER STOPS RECORDING                                      │
│    Extension: Click "Stop Recording" in popup                │
│    ↓ PUT /api/knowledge-base/recorder/sessions/xxx          │
│    Body: { status: "completed", duration: 45000 }           │
│    Backend: Update session status                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. GENERATE ARTICLE FROM SESSION                             │
│    Extension: Click "Generate Article" button                │
│    ↓ POST /api/knowledge-base/recorder/generate             │
│    Body: { sessionId: "xxx", category: "...", tags: [...] } │
│    Backend:                                                  │
│      1. Fetch session and steps from DB                      │
│      2. Call AI: generateArticleFromSteps()                  │
│      3. Build markdown content with embedded screenshots     │
│      4. Create KBArticle with recordingMetadata              │
│      5. Update session with articleId                        │
│    ↓ Response: { articleId: "zzz", url: "/knowledge/zzz" }  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. USER VIEWS GENERATED ARTICLE                              │
│    Extension: Opens Deskwise tab at /knowledge/zzz           │
│    Article displays:                                         │
│      - AI-generated title and introduction                   │
│      - Step-by-step guide with numbered steps                │
│      - Embedded screenshots with annotations                 │
│      - Element selectors and details                         │
│      - Conclusion and tips                                   │
│    User can:                                                 │
│      - Edit article (/knowledge/zzz/edit)                    │
│      - Mark as helpful/not helpful                           │
│      - Share with internal team or make public               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema Updates

### New Collections

Add to `src/lib/mongodb.ts`:
```typescript
export const Collections = {
  // Existing...
  KB_ARTICLES: 'kb_articles',

  // New for recorder
  RECORDING_SESSIONS: 'recording_sessions',
  RECORDING_STEPS: 'recording_steps',
  RECORDER_SCREENSHOTS: 'recorder_screenshots',
}
```

### Updated KBArticle Interface

Add to `src/lib/types.ts`:
```typescript
export interface KBArticle extends BaseEntity {
  // ... existing fields ...

  recordingMetadata?: {
    sessionId: string       // Reference to recording_sessions
    stepCount: number
    duration?: number       // Milliseconds
    url?: string           // Recorded page URL
    generatedFrom: 'manual' | 'recording' | 'ticket' | 'ai'
  }

  attachments?: Array<{
    id: string
    name: string
    type: string           // MIME type
    url: string
    size: number
    uploadedAt: Date
    uploadedBy: string
  }>
}
```

---

## API Endpoints Summary

### Existing Endpoints
✅ `GET /api/knowledge-base` - List articles
✅ `POST /api/knowledge-base` - Create article
✅ `GET /api/knowledge-base/[id]` - Get article
✅ `PUT /api/knowledge-base/[id]` - Update article
✅ `DELETE /api/knowledge-base/[id]` - Delete article
✅ `GET /api/knowledge-base/search` - Search articles
✅ `GET /api/knowledge-base/stats` - KB statistics
✅ `GET /api/knowledge-base/categories` - List categories
✅ `GET /api/knowledge-base/tags` - List tags
✅ `POST /api/knowledge-base/generate` - AI generate article

### New Endpoints (To Implement)

**Session Management**:
- `POST /api/knowledge-base/recorder/sessions` - Create session
- `GET /api/knowledge-base/recorder/sessions` - List sessions
- `GET /api/knowledge-base/recorder/sessions/[id]` - Get session
- `PUT /api/knowledge-base/recorder/sessions/[id]` - Update session
- `DELETE /api/knowledge-base/recorder/sessions/[id]` - Delete session

**Steps Management**:
- `POST /api/knowledge-base/recorder/steps` - Add step
- `GET /api/knowledge-base/recorder/steps?sessionId=xxx` - Get steps
- `PUT /api/knowledge-base/recorder/steps/[id]` - Update step
- `DELETE /api/knowledge-base/recorder/steps/[id]` - Delete step

**Screenshots**:
- `POST /api/knowledge-base/recorder/screenshots` - Upload screenshot
- `GET /api/knowledge-base/recorder/screenshots/[id]` - Get screenshot
- `DELETE /api/knowledge-base/recorder/screenshots/[id]` - Delete screenshot

**Article Generation**:
- `POST /api/knowledge-base/recorder/generate` - Generate article from session

**Voting** (Backend exists, needs route):
- `POST /api/knowledge-base/[id]/helpful` - Mark helpful/not helpful

---

## Security Considerations

### Authentication
- ✅ NextAuth JWT sessions (HTTP-only cookies)
- ✅ Multi-tenant isolation (orgId filtering)
- ⚠️ Extension needs cookie access to Deskwise domain

### Authorization
- Session creator can edit/delete own sessions
- Admins can view/delete any session in orgId
- RBAC permissions: `knowledge-base.create`, `knowledge-base.edit.all`

### CORS Configuration
- Extension origin: `chrome-extension://[extension-id]`
- Must allow credentials in CORS headers
- Add to API routes: `Access-Control-Allow-Credentials: true`

### Input Validation
- Zod schemas for all API inputs
- File upload size limits (max 10MB per screenshot)
- Image type validation (PNG, JPEG only)
- XSS prevention in markdown rendering

### Rate Limiting
- Screenshot uploads: 10 per minute per user
- Article generation: 5 per hour per user
- Session creation: 20 per hour per user

---

## Testing Strategy

### Unit Tests
- Service layer methods (recorder.ts, knowledge-base.ts)
- AI generation functions (genkit.ts)
- Utility functions (markdown parsing, selector generation)

### Integration Tests
- API routes with mock MongoDB
- Extension background script → API communication
- Session creation → step recording → article generation flow

### E2E Tests
- Install extension in Chrome
- Record a workflow (e.g., login, create ticket)
- Verify all steps captured
- Generate article
- Verify article content matches recorded steps

### Manual Testing Checklist
- [ ] Extension installation
- [ ] Authentication with Deskwise
- [ ] Start recording session
- [ ] Capture 5+ clicks on different element types
- [ ] Verify screenshots appear in extension popup
- [ ] Stop recording
- [ ] Generate article
- [ ] Verify article opens in Deskwise
- [ ] Edit generated article
- [ ] Vote helpful/not helpful
- [ ] View session in /knowledge/sessions
- [ ] Delete session

---

## Implementation Timeline

### Week 1: Foundation (40 hours)
- **Day 1-2**: Phase 1 (Edit page, voting UI) - 6 hours
- **Day 3-5**: Phase 2 (Backend APIs) - 22 hours
- **Day 6-7**: Phase 3 (Extension adaptation) - 10 hours
- **Buffer**: Testing and debugging - 2 hours

### Week 2: Frontend & Testing (20 hours)
- **Day 1-2**: Phase 4 (Session management UI) - 8 hours
- **Day 3-4**: Integration testing - 6 hours
- **Day 5**: End-to-end testing - 4 hours
- **Buffer**: Bug fixes - 2 hours

### Week 3+: Enhanced Features (Optional)
- Rich text editor (8 hours)
- Screenshot annotation tool (8 hours)
- File attachments (4 hours)

**Total Core Development**: ~60 hours (1.5 weeks full-time)

---

## Success Metrics

### Functional Metrics
- ✅ Extension successfully records user workflows
- ✅ All clicks captured with screenshots
- ✅ Screenshots automatically cropped and annotated
- ✅ AI generates readable, accurate articles
- ✅ Articles display correctly in knowledge base

### Performance Metrics
- Screenshot upload < 2 seconds per image
- Article generation < 10 seconds for 10-step workflow
- Session creation < 500ms
- Step recording < 300ms per action

### User Experience Metrics
- Recording indicator visible and non-intrusive
- Click feedback appears within 100ms
- Extension popup loads in < 1 second
- Generated articles require minimal editing (< 20% changes)

---

## Risk Mitigation

### Risk 1: Cookie Authentication Fails
**Mitigation**:
- Test CORS with credentials in development
- Fallback to API key authentication
- Document authentication setup in extension README

### Risk 2: Screenshot Size Exceeds Limits
**Mitigation**:
- Implement image compression (quality: 80%)
- Crop aggressively (max 800x600px)
- Use JPEG instead of PNG for larger images

### Risk 3: Extension Breaks on Certain Sites
**Mitigation**:
- Content Security Policy detection
- Graceful fallback if script injection fails
- User notification with troubleshooting steps

### Risk 4: AI Generation Quality Poor
**Mitigation**:
- Provide context-rich prompts to Gemini
- Include page title, URL, element details
- Allow manual editing of generated articles
- A/B test different prompt formats

---

## Deployment Checklist

### Backend Deployment
- [ ] Deploy API routes to production
- [ ] Create MongoDB indexes for performance
- [ ] Configure screenshot storage (GridFS or S3)
- [ ] Set up rate limiting
- [ ] Enable CORS for extension origin
- [ ] Test authentication flow

### Extension Deployment
- [ ] Update manifest with production URLs
- [ ] Build extension package (zip)
- [ ] Create Chrome Web Store listing
- [ ] Upload extension for review
- [ ] Create user documentation
- [ ] Create demo video

### Documentation
- [ ] API documentation (endpoints, schemas)
- [ ] Extension installation guide
- [ ] User guide (how to record workflows)
- [ ] Troubleshooting FAQ
- [ ] Developer setup instructions

---

## Appendix

### Useful Links
- Chrome Extension Manifest V3: https://developer.chrome.com/docs/extensions/mv3/
- Tiptap Editor: https://tiptap.dev/
- MongoDB GridFS: https://www.mongodb.com/docs/manual/core/gridfs/
- Google Gemini API: https://ai.google.dev/

### File Structure Reference

```
Deskwise/
├── extension/
│   └── deskwise-recorder/
│       ├── manifest.json
│       ├── background.js
│       ├── content.js
│       ├── popup.html
│       ├── popup.js
│       └── recorder.css
├── src/
│   ├── app/
│   │   ├── (app)/
│   │   │   └── knowledge/
│   │   │       ├── page.tsx
│   │   │       ├── new/page.tsx
│   │   │       ├── [id]/
│   │   │       │   ├── page.tsx
│   │   │       │   └── edit/page.tsx (NEW)
│   │   │       └── sessions/
│   │   │           ├── page.tsx (NEW)
│   │   │           └── [sessionId]/page.tsx (NEW)
│   │   └── api/
│   │       └── knowledge-base/
│   │           ├── route.ts
│   │           ├── [id]/
│   │           │   ├── route.ts
│   │           │   └── helpful/route.ts (NEW)
│   │           └── recorder/
│   │               ├── sessions/
│   │               │   ├── route.ts (NEW)
│   │               │   └── [id]/route.ts (NEW)
│   │               ├── steps/
│   │               │   ├── route.ts (NEW)
│   │               │   └── [id]/route.ts (NEW)
│   │               ├── screenshots/
│   │               │   ├── route.ts (NEW)
│   │               │   └── [id]/route.ts (NEW)
│   │               └── generate/route.ts (NEW)
│   ├── lib/
│   │   ├── services/
│   │   │   ├── knowledge-base.ts
│   │   │   ├── recorder.ts (NEW)
│   │   │   └── screenshot-storage.ts (NEW)
│   │   ├── mongodb.ts
│   │   └── types.ts
│   ├── ai/
│   │   └── genkit.ts
│   └── components/
│       └── knowledge-base/
│           ├── AdvancedEditor.tsx (NEW - Optional)
│           └── ScreenshotEditor.tsx (NEW - Optional)
└── old-docs/
    └── knowledge-base/
        └── [Reference implementations]
```

---

**End of Adaptation Plan**

**Next Steps**:
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Set up development environment for extension testing
4. Create project board with tasks from this plan
