# TipTap Editor Integration Plan
**Date**: October 12, 2025
**Goal**: Integrate TipTap rich text editor with Chrome extension recording workflow

---

## Current vs. Desired Flow

### Current Implementation ❌
```
Extension → Generate Article (AI) → Redirect to View Page
```

### Desired Implementation ✅
```
Extension → Create Draft Article → Redirect to Edit Page (TipTap) → User Edits → Publish
```

---

## Key Differences from Old Implementation

### Old Implementation (`old-docs/knowledge-base`)
- ✅ Used `AdvancedTiptapEditor` component
- ✅ Had `ScreenshotEditor` component for annotation
- ✅ Screenshots tab with editing capabilities
- ✅ Extracted screenshots from markdown
- ✅ Allowed screenshot annotation (arrows, highlights, text, blur, circles)
- ✅ Re-uploaded edited screenshots
- ✅ Two-tab interface (Content / Screenshots)

### Current Implementation Issues
- ❌ Uses basic textarea editor
- ❌ No TipTap integration
- ❌ No screenshot editing capabilities
- ❌ No annotation support
- ❌ Generates final article immediately (no draft stage)

---

## Implementation Plan

### Phase 1: TipTap Editor Setup (Est: 2-3 hours)

#### 1.1 Install Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder @tiptap/extension-code-block-lowlight @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

#### 1.2 Create TipTap Editor Component
**File**: `src/components/knowledge-base/AdvancedTiptapEditor.tsx`

**Features to Include:**
- Rich text editing (bold, italic, underline, strike)
- Headings (H1-H6)
- Lists (bullet, numbered)
- Links
- Code blocks with syntax highlighting
- Images (drag & drop, paste, URL)
- Tables
- Blockquotes
- Horizontal rules
- Undo/redo
- Toolbar with formatting options
- Markdown shortcuts
- Image resize/alignment
- Custom image rendering for screenshots

**Component Structure:**
```typescript
interface AdvancedTiptapEditorProps {
  content: string          // HTML/Markdown content
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean      // For read-only mode
  screenshots?: Array<{   // For embedding screenshots
    id: string
    url: string
    stepNumber: number
    description?: string
  }>
}
```

#### 1.3 Create Screenshot Editor Component
**File**: `src/components/knowledge-base/ScreenshotEditor.tsx`

**Features to Include:**
- Canvas-based image editor
- Annotation tools:
  - Arrow (with adjustable size/color)
  - Highlight rectangle (with opacity)
  - Text annotation (with font size/color)
  - Blur tool (for sensitive data)
  - Circle/Ellipse
- Undo/redo annotations
- Save edited image as base64
- Export annotations separately (for re-editing)

**Component Structure:**
```typescript
interface ScreenshotEditorProps {
  imageUrl: string
  onSave: (editedImageUrl: string, annotations: Annotation[]) => void
  initialAnnotations?: Annotation[]
  onCancel?: () => void
}

interface Annotation {
  type: 'arrow' | 'highlight' | 'text' | 'blur' | 'circle'
  x: number
  y: number
  width?: number
  height?: number
  text?: string
  color?: string
  radius?: number
}
```

---

### Phase 2: Update Edit Page (Est: 2 hours)

#### 2.1 Replace Current Edit Page
**File**: `src/app/(app)/knowledge/[id]/edit/page.tsx`

**Changes Required:**
1. Replace Textarea with `AdvancedTiptapEditor`
2. Add Tabs component:
   - Tab 1: Content (TipTap editor)
   - Tab 2: Screenshots (grid with edit buttons)
3. Extract screenshots from article content
4. Add screenshot editing modal with `ScreenshotEditor`
5. Handle screenshot save (upload edited image)
6. Update article content with new screenshot URLs
7. Add draft state management

**Key Functions:**
```typescript
// Extract screenshots from HTML/Markdown content
extractScreenshots(content: string): Screenshot[]

// Handle screenshot editing
handleScreenshotSave(screenshotId: string, editedImage: string, annotations: Annotation[]): Promise<void>

// Upload base64 image to GridFS
uploadBase64Image(base64DataUrl: string, screenshotId: string): Promise<string>

// Update article content with new screenshot URL
updateScreenshotInContent(oldUrl: string, newUrl: string): void
```

---

### Phase 3: Update Extension Workflow (Est: 1-2 hours)

#### 3.1 Modify Extension to Create Draft Articles
**File**: `extension/deskwise-recorder/background.js`

**Current Code (Line ~374):**
```javascript
// Generate article from session
const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/generate`, {
  method: 'POST',
  body: JSON.stringify({
    sessionId: this.sessionId,
    category: 'How-To',
    tags: ['screen-recording', 'auto-generated'],
    visibility: 'internal',
  }),
})

const data = await response.json()
const articleUrl = `${API_BASE_URL}/knowledge/${data.data.articleId}`
chrome.tabs.create({ url: articleUrl })
```

**New Code:**
```javascript
// Create draft article from session
const response = await fetch(`${API_BASE_URL}/api/knowledge-base/recorder/create-draft`, {
  method: 'POST',
  body: JSON.stringify({
    sessionId: this.sessionId,
    category: 'How-To',
    tags: ['screen-recording', 'auto-generated', 'draft'],
    visibility: 'internal',
  }),
})

const data = await response.json()
// Redirect to EDIT page, not view page
const editUrl = `${API_BASE_URL}/knowledge/${data.data.articleId}/edit`
chrome.tabs.create({ url: editUrl })
```

---

### Phase 4: Create Draft API Endpoint (Est: 1 hour)

#### 4.1 New API Route
**File**: `src/app/api/knowledge-base/recorder/create-draft/route.ts`

**Functionality:**
- Fetch session data (steps, screenshots)
- Build initial HTML content structure with TipTap format
- Embed screenshots in proper HTML image tags
- Create article with `status: 'draft'`
- Do NOT run AI generation (user will edit manually)
- Return articleId for redirect

**Content Structure:**
```html
<h1>How to [Task Name]</h1>
<p><em>This article was auto-generated from a screen recording. Please review and edit.</em></p>

<h2>Steps</h2>
<ol>
  <li>
    <p>Step 1: Click the Submit button</p>
    <img src="/api/knowledge-base/recorder/screenshots/[id]" alt="Step 1 screenshot" />
  </li>
  <li>
    <p>Step 2: Enter your credentials</p>
    <img src="/api/knowledge-base/recorder/screenshots/[id]" alt="Step 2 screenshot" />
  </li>
  <!-- ... -->
</ol>
```

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  // 1. Get session and steps
  const session = await RecorderService.getSession(sessionId, orgId)
  const steps = await RecorderService.getSteps(sessionId, orgId)
  const screenshots = await RecorderService.getSessionScreenshots(sessionId, orgId)

  // 2. Build HTML content for TipTap
  const htmlContent = buildTiptapContent(steps, screenshots)

  // 3. Create draft article
  const article = await KnowledgeBaseService.createArticle(orgId, {
    title: session.title,
    content: htmlContent,
    category: 'How-To',
    tags: ['draft', 'screen-recording', 'auto-generated'],
    visibility: 'internal',
    status: 'draft',  // NEW FIELD
    autoGenerated: true,
    recordingMetadata: {
      sessionId: session.sessionId,
      stepCount: steps.length,
      url: session.url,
    },
  }, userId)

  return NextResponse.json({
    success: true,
    data: { articleId: article._id.toString() },
  })
}
```

---

### Phase 5: Database Schema Update (Est: 30 min)

#### 5.1 Add `status` Field to KBArticle
**File**: `src/lib/types.ts`

```typescript
export interface KBArticle extends BaseEntity {
  // ... existing fields ...
  status?: 'draft' | 'published' | 'archived'  // NEW FIELD

  // Also add for screenshots reference
  screenshots?: Array<{
    id: string
    url: string
    stepNumber: number
    annotations?: Annotation[]
  }>
}
```

---

### Phase 6: Screenshot Upload for Edited Images (Est: 1 hour)

#### 6.1 Create Screenshot Update API
**File**: `src/app/api/knowledge-base/recorder/update-screenshot/route.ts`

**Functionality:**
- Accept base64 edited image
- Upload to GridFS
- Update screenshot metadata with annotations
- Return new screenshot URL

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  const { screenshotId, imageData, annotations } = await request.json()

  // Convert base64 to buffer
  const { buffer, contentType } = ScreenshotStorageService.dataUrlToBuffer(imageData)

  // Upload new version to GridFS
  const fileId = await ScreenshotStorageService.upload(buffer, filename, metadata)
  const newUrl = ScreenshotStorageService.getUrl(fileId)

  // Update screenshot metadata with annotations
  await RecorderService.updateScreenshotAnnotations(screenshotId, orgId, {
    url: newUrl,
    annotations: annotations,
  })

  return NextResponse.json({
    success: true,
    data: { url: newUrl },
  })
}
```

---

### Phase 7: UI Polish (Est: 1 hour)

#### 7.1 Add Draft Status Indicators
- Draft badge on articles list
- "Publish" button on edit page
- "Save as Draft" button
- Warning when leaving with unsaved changes

#### 7.2 Publishing Workflow
**File**: Update `src/app/(app)/knowledge/[id]/edit/page.tsx`

```typescript
const handlePublish = async () => {
  // Update status to 'published'
  await fetch(`/api/knowledge-base/${articleId}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...formData,
      status: 'published',
    }),
  })

  router.push(`/knowledge/${articleId}`)
}
```

---

## File Structure Summary

### New Files to Create
```
src/
├── components/
│   └── knowledge-base/
│       ├── AdvancedTiptapEditor.tsx        ✅ NEW
│       └── ScreenshotEditor.tsx             ✅ NEW
├── app/
│   └── api/
│       └── knowledge-base/
│           └── recorder/
│               ├── create-draft/
│               │   └── route.ts             ✅ NEW
│               └── update-screenshot/
│                   └── route.ts             ✅ NEW
```

### Files to Modify
```
extension/
└── deskwise-recorder/
    └── background.js                        🔧 MODIFY (change redirect)

src/
├── app/
│   └── (app)/
│       └── knowledge/
│           └── [id]/
│               └── edit/
│                   └── page.tsx             🔧 MODIFY (replace with TipTap)
├── lib/
│   └── types.ts                             🔧 MODIFY (add status field)
```

---

## Testing Checklist

### TipTap Editor
- [ ] Editor loads with existing content
- [ ] Formatting toolbar works (bold, italic, headings, etc.)
- [ ] Images can be inserted
- [ ] Screenshots display correctly
- [ ] Content saves as HTML
- [ ] Undo/redo works
- [ ] Markdown shortcuts work

### Screenshot Editor
- [ ] Canvas loads with image
- [ ] Arrow annotation works
- [ ] Highlight annotation works
- [ ] Text annotation works
- [ ] Blur tool works
- [ ] Circle annotation works
- [ ] Undo/redo works
- [ ] Save exports base64
- [ ] Annotations persist

### Extension Workflow
- [ ] Recording creates draft article
- [ ] Redirects to edit page (not view page)
- [ ] Edit page loads with screenshots
- [ ] Screenshots embedded in TipTap editor
- [ ] User can edit content
- [ ] User can edit screenshots
- [ ] User can publish draft
- [ ] Published article displays correctly

### Edge Cases
- [ ] No screenshots (recording without clicks)
- [ ] Large recordings (20+ steps)
- [ ] Network errors during upload
- [ ] Editing without saving (warn user)
- [ ] Multiple screenshot edits
- [ ] Screenshot aspect ratio preservation

---

## Dependencies Required

```json
{
  "@tiptap/react": "^2.6.0",
  "@tiptap/starter-kit": "^2.6.0",
  "@tiptap/extension-image": "^2.6.0",
  "@tiptap/extension-link": "^2.6.0",
  "@tiptap/extension-placeholder": "^2.6.0",
  "@tiptap/extension-code-block-lowlight": "^2.6.0",
  "@tiptap/extension-table": "^2.6.0",
  "@tiptap/extension-table-row": "^2.6.0",
  "@tiptap/extension-table-cell": "^2.6.0",
  "@tiptap/extension-table-header": "^2.6.0",
  "lowlight": "^3.1.0"  // For code syntax highlighting
}
```

---

## Timeline Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | TipTap Editor Component | 2-3 hours |
| 1 | Screenshot Editor Component | 2-3 hours |
| 2 | Update Edit Page | 2 hours |
| 3 | Update Extension Workflow | 1-2 hours |
| 4 | Create Draft API Endpoint | 1 hour |
| 5 | Database Schema Update | 30 min |
| 6 | Screenshot Update API | 1 hour |
| 7 | UI Polish | 1 hour |
| **TOTAL** | **Full Integration** | **10-13 hours** |

---

## Success Criteria

✅ **The integration is successful when:**

1. Extension creates a **draft** article (not published)
2. Extension redirects to **edit page** (not view page)
3. Edit page displays **TipTap editor** (not textarea)
4. Screenshots are **embedded** in the editor as images
5. User can **edit screenshots** with annotation tools
6. User can **edit content** with rich text formatting
7. User can **save as draft** or **publish**
8. Published article displays correctly with edited screenshots
9. Screenshot annotations persist when re-editing

---

## Alternative: Simplified Approach

If the full TipTap integration is too complex, we could implement a **hybrid approach**:

### Simplified Plan
1. Keep current markdown-based editor
2. Add screenshot editing modal
3. Create draft articles with markdown
4. Embed screenshots as markdown images
5. Skip rich text formatting for Phase 1

**Pros:**
- Faster implementation (~4-5 hours vs. 10-13 hours)
- Simpler maintenance
- Markdown is already supported

**Cons:**
- Less user-friendly than WYSIWYG editor
- No rich formatting toolbar
- Steeper learning curve for non-technical users

---

## Recommendation

I recommend implementing the **full TipTap integration** for the following reasons:

1. **Better UX**: WYSIWYG editor is more intuitive
2. **Professional**: Matches modern KB platforms (Notion, Confluence)
3. **Screenshot Management**: Integrated image handling
4. **Future-Proof**: Easier to add features later (embeds, mentions, etc.)
5. **Old Codebase Parity**: Matches the superior old implementation

---

## Questions for User

Before proceeding, please confirm:

1. ✅ Do you approve the full TipTap integration plan?
2. ✅ Should we include screenshot annotation tools?
3. ✅ Do you want draft/publish workflow?
4. ✅ Any additional editor features needed (tables, code blocks, etc.)?
5. ✅ Preferred timeline - all at once or phased rollout?

---

**Status**: ⏸️ Awaiting User Approval
**Next Step**: Install dependencies and create TipTap components
**Last Updated**: October 12, 2025
