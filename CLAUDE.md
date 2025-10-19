# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Deskwise ITSM** is an AI-powered IT Service Management platform built with Next.js 15, TypeScript, and MongoDB. It provides ticketing, incident management, project tracking, scheduling, asset management, and more.

## Development Commands

- **Start development server**: `npm run dev` (runs on port 9002 with Turbopack)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Lint code**: `npm run lint`
- **Type checking**: `npm run typecheck`

## Technology Stack

- **Frontend**: Next.js 15 with React 18, TypeScript, App Router
- **Build Tool**: Turbopack (for development)
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Database**: MongoDB Atlas with Node.js driver
- **Authentication**: NextAuth.js with JWT sessions
- **AI Integration**: Google Gemini 2.0 Flash (via @google/generative-ai)
- **Icons**: Lucide React
- **Validation**: Zod schemas

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main application pages
│   └── ...                # Other feature modules
├── components/            # React components
│   ├── layout/           # Layout components (sidebar, header)
│   ├── ui/               # Base UI components
│   └── providers/        # Context providers
├── lib/                   # Utilities and services
│   ├── services/         # Business logic services
│   ├── mongodb.ts        # Database connection
│   ├── types.ts          # TypeScript type definitions
│   └── utils.ts          # Helper functions
└── middleware.ts          # Route protection and authentication

agent/                     # Go monitoring agent (separate from web app)
```

## Key Architecture Patterns

### Multi-Tenancy
- All database documents include `orgId` field for organization isolation
- Every API route filters data by organization
- Session includes organization context via NextAuth
- Complete data separation between organizations

### Authentication
- NextAuth.js with credentials provider
- JWT sessions with HTTP-only cookies
- User sessions include `orgId`, `userId`, `email`, `name`, `role`
- Middleware protects `/dashboard/*` routes

### Database
- MongoDB connection: `src/lib/mongodb.ts`
- Service layer pattern: `src/lib/services/*.ts`
- Collections: `users`, `tickets`, `incidents`, `change_requests`, `projects`, `schedule_items`, `kb_articles`, `assets`, etc.
- All services enforce organization-scoped queries

### API Routes
- Follow REST conventions (`GET`, `POST`, `PUT`, `DELETE`)
- Organization ID extracted from session
- Error handling with proper HTTP status codes
- Input validation with Zod schemas

### Component Organization
- Base UI components in `src/components/ui/`
- Layout components in `src/components/layout/`
- Feature-specific components co-located with pages
- Reusable components follow shadcn/ui patterns

## Environment Configuration

Required environment variables in `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-connection-string

# NextAuth.js
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-32-character-secret

# Google Gemini (for AI features)
GEMINI_API_KEY=your-gemini-api-key

# Email System - Platform Provider (AWS SES)
# Organizations using "Platform Email" will use these credentials
AWS_SES_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SES_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@deskwise.com
AWS_SES_FROM_NAME=Deskwise

# Email Encryption (Required for SMTP password encryption)
EMAIL_ENCRYPTION_SECRET=your-32-character-secret-for-encryption

# Remote Control (Optional - for TURN server)
RC_JWT_SECRET=your-remote-control-jwt-secret
TURN_URL=turn:your-turn-server.com:3478
TURN_USERNAME=your-turn-username
TURN_CREDENTIAL=your-turn-password
```

## Development Guidelines

### TypeScript
- Strict mode enabled
- Type definitions in `src/lib/types.ts`
- No implicit `any` types
- Comprehensive interface definitions

### Styling
- Tailwind CSS utility classes
- Custom design tokens in `tailwind.config.ts`
- Consistent spacing and color palette
- Responsive design with mobile-first approach

### Code Quality
- ESLint configuration for Next.js
- Prettier for formatting
- TypeScript strict mode
- Zero type errors in codebase

## Common Patterns

### API Route Example
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const orgId = session.user.orgId
  // Query with orgId filter
  // ...
}
```

### Service Layer Example
```typescript
export class TicketService {
  static async getAll(orgId: string, filters?: TicketFilters) {
    const client = await clientPromise
    const db = client.db('deskwise')
    const tickets = await db.collection('tickets')
      .find({ orgId, ...filters })
      .sort({ createdAt: -1 })
      .toArray()
    return tickets
  }
}
```

## Remote Control Feature ✅ **COMPLETE**

Deskwise includes a **production-ready** Remote Control feature that allows technicians to remotely access and control managed devices via WebRTC with **Full HD 1080p video streaming** at **30 FPS** and **sub-400ms latency**.

### Architecture Overview

**Backend (Next.js API)**
- Session management API (`/api/rc/sessions`)
- Policy management API (`/api/rc/policy`)
- REST-based WebRTC signalling API (`/api/rc/signalling`)
- Audit logging for all remote control sessions
- JWT-based session tokens for security
- RBAC enforcement (admin/technician roles only)

**Go Agent (`agent/remotecontrol/`)** ✅ **Full Implementation**
- **VP8 Video Encoding**: Hardware-accelerated encoding via libvpx (CGO wrapper)
- **Screen Capture**: Platform-specific implementation (Windows GDI via `github.com/kbinani/screenshot`)
- **Input Injection**: Mouse and keyboard event handling (SendInput for Windows)
- **WebRTC Peer**: pion/webrtc v4 with video track and data channel
- **REST Signalling Client**: HTTP-based SDP offer/answer and ICE candidate exchange
- **Real-time Performance**: Full HD 1080p @ 30 FPS with 5 Mbps bitrate

**Frontend (React Components)** ✅ **Full Implementation**
- `RemoteControlButton`: Initiates remote control sessions
- `RemoteSessionModal`: Full-screen remote control interface
- `WebRTCViewport`: Video viewport with **video transceiver negotiation** for proper video track reception
- Real-time mouse/keyboard input capture and transmission
- Interactive viewport with context menu prevention

### Video Streaming Implementation Details

#### **VP8 Encoding with libvpx (CGO)**
Located in: `agent/remotecontrol/vp8_encoder.go`

**Key Features:**
- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 FPS
- **Bitrate**: 5000 kbps (5 Mbps)
- **Codec**: VP8 via Google's libvpx 1.15.2
- **Color Space**: YUV420 (I420) with ITU-R BT.601 conversion
- **Latency Optimization**: Zero frame lookahead (`g_lag_in_frames = 0`)
- **Error Resilience**: Enabled for network packet loss
- **Keyframes**: Every 1 second (30 frames) for faster recovery

**CGO Integration:**
```go
// +build cgo

/*
#cgo CFLAGS: -IC:/msys64/mingw64/include
#cgo LDFLAGS: -LC:/msys64/mingw64/lib -lvpx -lm
#include <vpx/vpx_encoder.h>
#include <vpx/vp8cx.h>
*/
import "C"
```

**Build Requirements:**
- MSYS2 (MinGW-w64 toolchain)
- libvpx 1.15.2 (`pacman -S mingw-w64-x86_64-libvpx`)
- GCC compiler for CGO compilation
- Runtime DLLs: `libvpx-1.dll`, `libgcc_s_seh-1.dll`, `libwinpthread-1.dll`

**RGB to YUV Conversion:**
```go
// ITU-R BT.601 standard conversion with correct operator precedence
yVal := ((66*r + 129*g + 25*b + 128) >> 8) + 16
uVal := ((-38*r - 74*g + 112*b + 128) >> 8) + 128
vVal := ((112*r - 94*g - 18*b + 128) >> 8) + 128
```

#### **WebRTC Video Track Configuration**
Located in: `agent/remotecontrol/webrtc.go`, `src/components/remote-control/WebRTCViewport.tsx`

**Critical Browser Configuration:**
```typescript
// MUST add video transceiver BEFORE creating offer
pc.addTransceiver('video', { direction: 'recvonly' })
```
This ensures the browser's SDP offer includes `m=video` so the agent can add video to its answer.

**Agent-Side Video Track:**
```go
// Create video track from encoder output
videoTrack, err := webrtc.NewTrackLocalStaticSample(
    webrtc.RTPCodecCapability{MimeType: webrtc.MimeTypeVP8},
    "video",
    "screen-capture",
)
```

#### **Screen Capture Pipeline**
Located in: `agent/remotecontrol/screencapture.go`

**Windows Implementation:**
- **Library**: `github.com/kbinani/screenshot` (Windows GDI)
- **Capture Method**: `screenshot.CaptureDisplay(0)` - Primary display
- **Native Resolution**: Captures at full desktop resolution (e.g., 1920x1080, 2560x1440)
- **Frame Buffer**: 2-frame channel buffer for minimal latency (~67ms at 30 FPS)
- **Target FPS**: 30 FPS with ticker-based capture loop

**Downscaling Algorithm:**
Located in: `agent/remotecontrol/webrtc.go`

```go
// Optimized nearest-neighbor scaling with integer bit-shifting
xRatio := (srcWidth << 16) / targetWidth  // Fixed-point arithmetic
yRatio := (srcHeight << 16) / targetHeight

// Direct pixel copy (4x faster than slice copy)
dst.Pix[dstOffset] = src.Pix[srcOffset]     // R
dst.Pix[dstOffset+1] = src.Pix[srcOffset+1] // G
dst.Pix[dstOffset+2] = src.Pix[srcOffset+2] // B
dst.Pix[dstOffset+3] = src.Pix[srcOffset+3] // A
```

**Performance Characteristics:**
- **Capture Time**: ~5-10ms per frame (Windows GDI)
- **Downscaling Time**: ~2-3ms (optimized integer math)
- **Encoding Time**: ~10-15ms (VP8 with zero-lag settings)
- **Total Latency**: 200-400ms (capture + encode + network + decode + render)

### Key Features

- **Full HD Video Streaming**: 1920x1080 @ 30 FPS with 5 Mbps bitrate
- **Low Latency**: Sub-400ms end-to-end latency on LAN
- **Remote Input**: Real-time mouse movement, clicks, and keyboard input injection with Windows SendInput API
- **Multi-Monitor Support**: Dynamic monitor switching with proper coordinate mapping
- **Security**: TLS transport, JWT session tokens, audit logging, multi-tenant scoping
- **Consent Management**: Optional end-user consent prompts (policy-based)
- **Quality Monitoring**: Real-time FPS, latency, and bandwidth metrics
- **RBAC**: Admin and technician roles only, with policy-based access control
- **Production Ready**: Optimized for commercial SaaS deployment with scalable bandwidth

### Input Injection Implementation ✅ **NEW**

**Windows SendInput API Integration**
Located in: `agent/remotecontrol/input_windows.go`

**Features:**
- **Native Windows API**: Direct SendInput calls via Go syscall package (no external dependencies)
- **Mouse Control**: Movement, clicks (left/right/middle), and scrolling
- **Keyboard Control**: Full keyboard input with Virtual-Key code mapping
- **Coordinate Translation**: Viewport coordinates mapped to actual screen coordinates

**Implementation Details:**
```go
// Separate structures for C ABI compatibility (Go doesn't support C unions)
type INPUT_MOUSE struct {
    Type uint32
    _    uint32          // padding for 64-bit alignment
    Mi   MOUSEINPUT
}

type INPUT_KEYBOARD struct {
    Type uint32
    _    uint32          // padding for 64-bit alignment
    Ki   KEYBDINPUT
    _    [8]byte         // padding to match MOUSEINPUT size
}
```

**Absolute Mouse Coordinates:**
```go
// Convert viewport coordinates to Windows 0-65535 range
absX := int32((screenX * 65535.0) / virtualWidth)
absY := int32((screenY * 65535.0) / virtualHeight)
```

**Virtual-Key Code Mapping:**
- Comprehensive key mapping from JavaScript key codes to Windows VK codes
- Support for special keys (Ctrl, Alt, Shift, Arrow keys, Function keys)
- Alphanumeric character handling with automatic case conversion

### Multi-Monitor Support ✅ **NEW**

**Dynamic Monitor Selection**
Located in: `agent/remotecontrol/screencapture.go`, `agent/remotecontrol/input_windows.go`

**Features:**
- **Auto-Detection**: Detects all connected monitors on session start
- **Default Behavior**: Captures primary monitor (monitor 0) by default
- **Monitor Switching**: Switch between monitors mid-session via UI controls
- **Virtual Desktop Mode**: Capture all monitors as a single composited view
- **Coordinate Mapping**: Accurate mouse control across different monitor configurations

**Monitor Information Structure:**
```go
type MonitorInfo struct {
    Index   int         // Monitor index (0, 1, 2, ...)
    Name    string      // Display name
    X       int         // X position in virtual desktop
    Y       int         // Y position in virtual desktop
    Width   int         // Monitor width in pixels
    Height  int         // Monitor height in pixels
    Primary bool        // True if primary monitor
}

type MultiMonitorInfo struct {
    Monitors      []MonitorInfo
    VirtualWidth  int    // Total width of virtual desktop
    VirtualHeight int    // Total height of virtual desktop
    VirtualMinX   int    // Leftmost X coordinate
    VirtualMinY   int    // Topmost Y coordinate
}
```

**Coordinate Translation:**
```go
// Single monitor mode - translate viewport coords to monitor's actual position
if monitorInfo != nil {
    screenX = float64(monitorInfo.X + x)
    screenY = float64(monitorInfo.Y + y)
}

// Virtual desktop mode - add offset to virtual desktop origin
if monitorIndex == -1 {
    screenX = float64(virtualMinX + x)
    screenY = float64(virtualMinY + y)
}
```

**UI Controls:**
- **Monitor 1 Button**: Switch to first monitor
- **Monitor 2 Button**: Switch to second monitor
- **All Monitors Button**: Virtual desktop mode (all monitors composited)
- **Visual Feedback**: Active monitor highlighted with blue background

**Data Channel Protocol:**
```json
{
  "type": "monitor",
  "monitorIndex": 0  // 0=Monitor 1, 1=Monitor 2, -1=All Monitors
}
```

### Viewport User Interface

**Floating Action Bar**
Located in: `src/components/remote-control/RemoteSessionModal.tsx`

**Available Controls:**
- **Screenshot**: Capture and download current viewport frame
- **Monitor Switcher**: Switch between Monitor 1, Monitor 2, or All Monitors
- **Video/Audio Toggle**: Enable/disable video and audio (placeholder for future features)
- **File Transfer**: Upload files to remote machine (coming soon)
- **Clipboard Sync**: Sync clipboard between local and remote machine
- **Input Lock**: Lock/unlock remote input control
- **Fullscreen Toggle**: Enter/exit fullscreen mode
- **Connection Metrics**: Real-time FPS, latency, and bandwidth display

**Connection States:**
- `new`: Initializing WebRTC peer connection
- `connecting`: Negotiating with remote agent
- `connected`: Active video streaming with input control
- `disconnected`: Attempting to reconnect
- `failed`: Connection failed (user action required)

### Database Collections

- `rc_sessions`: Active and historical remote control sessions
- `rc_policies`: Organization-level remote control policies
- `audit_remote_control`: Complete audit trail of all remote control actions

### Usage Flow

1. Asset agent reports `capabilities.remoteControl = true`
2. Technician clicks "Remote Control" button on asset details page
3. System creates session and generates JWT token
4. Browser creates WebRTC peer connection with **video transceiver**
5. WebRTC signalling (offer/answer/ICE) via REST API
6. Video streaming begins (screen capture → VP8 encode → WebRTC → browser)
7. Technician can view Full HD screen and control device remotely
8. Session ends and duration/metrics logged

### Build Instructions

#### **Windows Agent with VP8 Support**

1. **Install MSYS2:**
```bash
winget install MSYS2.MSYS2
```

2. **Install libvpx and toolchain:**
```bash
"C:\msys64\usr\bin\bash.exe" --login -c "pacman -Sy --noconfirm mingw-w64-x86_64-gcc mingw-w64-x86_64-pkg-config mingw-w64-x86_64-libvpx"
```

3. **Build agent with CGO:**
```bash
cd agent
set CGO_ENABLED=1
set CC=C:\msys64\mingw64\bin\gcc.exe
set PKG_CONFIG_PATH=C:\msys64\mingw64\lib\pkgconfig
set PATH=C:\msys64\mingw64\bin;%PATH%
go build -o builds/deskwise-agent-windows-amd64.exe .
```

4. **Copy runtime DLLs to builds/ directory:**
- `C:\msys64\mingw64\bin\libvpx-1.dll`
- `C:\msys64\mingw64\bin\libgcc_s_seh-1.dll`
- `C:\msys64\mingw64\bin\libwinpthread-1.dll`

### Troubleshooting

#### **Black Screen in Viewport**

**Symptom:** WebRTC connection established, mouse moves register, but video is black.

**Root Cause:** Browser's SDP offer doesn't include video track request.

**Fix:** Add video transceiver **before** creating offer in `WebRTCViewport.tsx`:
```typescript
pc.addTransceiver('video', { direction: 'recvonly' })
const offer = await pc.createOffer()
```

**Verification:** Check browser console for:
- `[WebRTC] Added recvonly video transceiver`
- `[WebRTC] Received track: video`
- `[WebRTC] Remote tracks count: 1` (not 0)

#### **CGO Build Errors**

**Error:** `could not determine what C.vpx_codec_enc_init refers to`

**Root Cause:** `vpx_codec_enc_init` is a C macro, not a function. CGO cannot process macros.

**Fix:** Use the underlying function:
```go
C.vpx_codec_enc_init_ver(&encoder.ctx, iface, &encoder.cfg, 0, C.VPX_ENCODER_ABI_VERSION)
```

**Error:** `pkt.data.frame undefined (type [128]byte has no field or method frame)`

**Root Cause:** CGO cannot access fields within C unions.

**Fix:** Create C helper functions:
```c
static inline void* get_frame_buf(const vpx_codec_cx_pkt_t *pkt) {
    return pkt->data.frame.buf;
}
```

#### **High Latency (>1 second)**

**Symptoms:** Video feels sluggish, actions delayed.

**Fixes Applied:**
1. Reduce frame buffer: Change `frameChan: make(chan *image.RGBA, 2)` (was 30)
2. Optimize downscaling: Use integer bit-shifting instead of float math
3. Encoder settings: Set `g_lag_in_frames = 0` and increase keyframe frequency

**Expected Result:** Latency reduced to 200-400ms on LAN.

#### **DLL Not Found Errors**

**Symptom:** Agent fails to start with "libvpx-1.dll not found"

**Fix:** Copy runtime DLLs from `C:\msys64\mingw64\bin\` to agent `builds/` directory:
- `libvpx-1.dll`
- `libgcc_s_seh-1.dll`
- `libwinpthread-1.dll`

### Performance Optimization History

**Initial Implementation (Test Pattern):**
- Resolution: 320x240
- Bitrate: 500 kbps
- Purpose: Proof of concept

**HD Quality:**
- Resolution: 1280x720
- Bitrate: 2500 kbps
- User Feedback: "Much better"

**Full HD Quality (Final):**
- Resolution: 1920x1080
- Bitrate: 5000 kbps
- User Feedback: "Great, HD works great"

**Latency Optimizations:**
- Frame buffer: 30 → 2 frames (~933ms improvement)
- Downscaling: Float math → Integer bit-shifting (2-3x faster)
- Encoder: Added `g_lag_in_frames = 0` and frequent keyframes
- **Result**: 200-400ms end-to-end latency

### Security Considerations

- All sessions are ephemeral and tenant-scoped
- RBAC strictly enforced at API level
- Sessions automatically expire after policy-defined idle timeout
- Complete audit trail for compliance
- Optional TURN server for NAT traversal
- VP8 codec chosen for browser compatibility and licensing (royalty-free)

## RBAC (Role-Based Access Control) System ✅ **PRODUCTION READY**

Deskwise includes a comprehensive RBAC system with 120+ granular permissions, custom roles, and user-level permission overrides.

### Architecture Overview

**Permission Structure:** `{module}.{action}.{scope}`
- Example: `tickets.view.all`, `assets.manage`, `users.create`
- 15 modules with 120+ permissions total
- Scoped permissions (own, assigned, all) for fine-grained control

**Database Collections:**
- `permissions` - All available permissions (system and custom)
- `roles` - Role definitions with permission arrays
- `role_assignment_history` - Audit trail for role changes
- `user_permissions` - User-level permission overrides

**Default Roles:**
1. **Administrator** - All permissions (wildcard: `*.*`)
2. **Technician** - ~80 operational permissions
3. **End User** - ~25 basic permissions

### Backend Implementation

**Service Layer:**
- `src/lib/services/permissions.ts` (580 lines) - Permission management
- `src/lib/services/roles.ts` (420 lines) - Role management
- `src/lib/middleware/permissions.ts` (200 lines) - Permission checking middleware

**API Routes:**
- `/api/rbac/permissions` - List/seed permissions
- `/api/rbac/roles` - CRUD operations for roles
- `/api/rbac/roles/[id]/clone` - Clone roles
- `/api/rbac/seed` - Initialize RBAC system
- `/api/users/[id]/permissions` - User permission overrides
- `/api/users/[id]/role` - Role assignment

**Authentication Integration:**
- Permissions cached in JWT token for fast checks (<5ms)
- Session includes `roleId` and `permissions` array
- Automatic refresh on token renewal

### Frontend Components

**Hooks:**
- `src/hooks/use-roles.ts` - Role management hook
- `src/hooks/use-permissions.ts` - Permission checking hook

**RBAC Components:**
- `src/components/rbac/role-badge.tsx` - Color-coded role badges
- `src/components/rbac/permission-selector.tsx` - Searchable permission selector
- `src/components/rbac/permission-matrix.tsx` - Visual permission matrix

**User Management UI:**
- Tabbed interface (Users / Roles & Permissions)
- Full user CRUD with role assignment
- Permission override management
- Role cloning and custom role creation
- Permission matrix visualization

### Permission Modules (15 modules)

1. **Tickets** (14) - Ticketing system
2. **Incidents** (7) - Incident management
3. **Changes** (10) - Change requests
4. **Assets** (9) - Asset management
5. **Knowledge Base** (7) - KB articles
6. **Projects** (9) - Project management
7. **Scheduling** (7) - Calendar/scheduling
8. **Users** (6) - User management
9. **Roles** (6) - Role management
10. **Clients** (5) - Client management
11. **Billing** (6) - Billing/invoicing
12. **Quoting** (5) - Quote management
13. **Settings** (7) - System settings
14. **Reports** (4) - Reporting
15. **Audit Logs** (3) - Audit trail

### API Integration Example

```typescript
import { requirePermission } from '@/lib/middleware/permissions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)

  // Check permission
  if (!await requirePermission(session, 'tickets.delete')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Proceed with delete
  // ...
}
```

### Initialization

**First-time setup:**
```bash
curl -X POST http://localhost:9002/api/rbac/seed \
  -H "Cookie: your-session-cookie"
```

This creates:
- 120+ default permissions
- 3 default roles
- Migrates existing users from legacy role system

### Backward Compatibility

- Legacy `role` field (admin/technician/user) continues to work
- Helper functions (`isAdmin()`, `isAdminOrTechnician()`) available
- Gradual migration path for API routes
- No breaking changes to existing code

### Documentation

- **RBAC_SETUP_GUIDE.md** - Complete setup and usage guide
- **RBAC_SYSTEM_DESIGN.md** - System architecture (70KB)
- **RBAC_QUICK_REFERENCE.md** - Permission lookup guide
- **RBAC_DEVELOPER_GUIDE.md** - Integration examples
- **RBAC_IMPLEMENTATION.md** - Technical details
- **RBAC_SEED_DATA.md** - Default permissions/roles

## Knowledge Base Categories ✅ **PRODUCTION READY**

Deskwise features a hierarchical Knowledge Base category system with full RBAC integration for organizing articles.

### Overview

The KB category system provides structured organization for knowledge articles with:

- **Hierarchical Structure**: Unlimited nesting depth with parent-child relationships
- **RBAC Integration**: Role-based and permission-based access control per category
- **Visual Identification**: Custom icons and colors for each category
- **Public Portal Support**: Categories can be public for external KB access
- **Auto-Generated Metadata**: Slugs, full paths, and article counts

### Architecture

**Database Collections:**
- `kb_categories` - Category definitions with hierarchy
- `kb_articles` - Articles with `categoryId` references (replaces string `category`)

**Key Features:**
- Multi-level nesting (e.g., IT Support > Windows > Drivers)
- Permission-based filtering (users only see categories they can access)
- Automatic slug generation from category names
- Full path calculation (e.g., "IT Support > Windows > Driver Issues")
- Article count tracking per category

### Category Structure

```typescript
interface KBCategory extends BaseEntity {
  _id: ObjectId
  orgId: string
  name: string                    // Display name
  slug: string                    // URL-friendly identifier (auto-generated)
  description?: string            // Optional description
  icon?: string                   // Lucide icon name
  color?: string                  // Hex color code
  parentId?: string               // Parent category reference (null = root)
  fullPath?: string               // Auto-calculated (e.g., "Parent > Child")
  order: number                   // Display order within parent
  isActive: boolean               // Soft delete flag
  isPublic: boolean               // Visible in public portal
  articleCount?: number           // Calculated field

  // RBAC
  allowedRoles?: string[]         // Role IDs with access
  allowedUsers?: string[]         // User IDs with explicit access
  permissions?: {
    view?: string[]               // Required permissions to view
    contribute?: string[]         // Required permissions to create articles
    manage?: string[]             // Required permissions to manage category
  }
}
```

### API Endpoints

All endpoints require authentication and respect RBAC permissions.

**Category Management:**
- `GET /api/knowledge-base/categories` - List all accessible categories
- `GET /api/knowledge-base/categories/tree` - Get hierarchical category tree
- `POST /api/knowledge-base/categories` - Create new category (requires `kb.manage`)
- `PUT /api/knowledge-base/categories/[id]` - Update category (requires `kb.manage`)
- `DELETE /api/knowledge-base/categories/[id]` - Delete category with article migration
- `GET /api/knowledge-base/categories/[id]/articles` - Get articles in category
- `PUT /api/knowledge-base/categories/[id]/permissions` - Update category permissions

**Query Parameters:**
- `includeInactive` - Include soft-deleted categories
- `tree` - Return hierarchical structure
- `userFiltered` - Return only user-accessible categories

### Service Layer

**KBCategoryService** (`src/lib/services/kb-categories.ts`):

```typescript
export class KBCategoryService {
  // Core operations
  static async createCategory(orgId, input, createdBy): Promise<KBCategory>
  static async getCategories(orgId, includeInactive): Promise<KBCategory[]>
  static async getCategoryTree(orgId, rootId?): Promise<CategoryNode[]>
  static async getCategoryById(id, orgId): Promise<KBCategory | null>
  static async updateCategory(id, orgId, updates): Promise<KBCategory | null>
  static async deleteCategory(id, orgId, migrateArticlesTo?): Promise<Stats>

  // Utilities
  static async checkCategoryAccess(categoryId, session): Promise<boolean>
  static async updateArticleCount(categoryId, orgId): Promise<void>
  private static generateSlug(name): string
  private static calculateFullPath(orgId, categoryId): Promise<string>
}
```

### RBAC Integration

Categories support three levels of access control:

1. **Permission-Based** (Recommended):
   ```typescript
   {
     permissions: {
       view: ['kb.view'],                    // View articles
       contribute: ['kb.create', 'kb.edit'], // Create articles
       manage: ['kb.manage']                 // Manage category
     }
   }
   ```

2. **Role-Based**:
   ```typescript
   {
     allowedRoles: ['role_admin', 'role_technician']  // Only these roles
   }
   ```

3. **User-Based** (Overrides):
   ```typescript
   {
     allowedUsers: ['user_123', 'user_456']  // Explicit user access
   }
   ```

**Access Check Algorithm:**
1. Admins always have access
2. Check user-level override (`allowedUsers`)
3. Check role-based access (`allowedRoles`)
4. Check permission-based access (`permissions.view`)
5. Default: Allow if no restrictions set

### Migration from Legacy System

The system migrated from string-based categories to hierarchical category references:

**Before:**
```javascript
{
  _id: ObjectId("..."),
  title: "How to Reset Password",
  category: "Windows Troubleshooting",  // Plain string
  // ...
}
```

**After:**
```javascript
{
  _id: ObjectId("..."),
  title: "How to Reset Password",
  categoryId: "507f1f77bcf86cd799439011",  // Reference to kb_categories
  category: "Windows Troubleshooting",      // Kept for backward compatibility
  // ...
}
```

**Migration Scripts:**
- `scripts/migrate-kb-categories.ts` - Main migration script
- `scripts/verify-kb-migration.ts` - Verification script

**Migration Steps:**
1. Backup database
2. Run migration in dry-run mode: `npx ts-node scripts/migrate-kb-categories.ts --dry-run`
3. Review output
4. Run production migration: `npx ts-node scripts/migrate-kb-categories.ts`
5. Verify: `npx ts-node scripts/verify-kb-migration.ts`

### Frontend Components

**Category Tree:**
- Hierarchical display with expand/collapse
- Visual indicators (icons, colors)
- Article count badges
- Drag-and-drop reordering (admin)

**Category Selector:**
- Dropdown with full path display
- Search/filter capabilities
- Hierarchical navigation

**Category Management UI:**
- Create, edit, delete categories
- Permission configuration
- Article migration on delete
- Visual preview

### Usage Examples

**Creating a Category:**
```typescript
const category = await KBCategoryService.createCategory(
  'org_123',
  {
    name: 'Email Issues',
    description: 'Email client problems and solutions',
    parentId: 'parent_category_id',
    icon: 'Mail',
    color: '#10B981',
    isPublic: false,
    permissions: {
      view: ['kb.view'],
      contribute: ['kb.create'],
      manage: ['kb.manage']
    }
  },
  'user_admin'
)
```

**Checking Access:**
```typescript
const hasAccess = await KBCategoryService.checkCategoryAccess(
  categoryId,
  session
)

if (!hasAccess) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

**Getting Category Tree:**
```typescript
const tree = await KBCategoryService.getCategoryTree('org_123')
// Returns nested structure with children arrays
```

### Best Practices

**Category Naming:**
- Clear and descriptive (e.g., "Windows Troubleshooting")
- Use proper capitalization
- Keep under 50 characters
- Avoid special characters

**Hierarchy Organization:**
- Maximum 3-4 levels deep
- 5-15 categories per level
- Create subcategory when 10+ articles on same topic

**Categories vs. Tags:**
- **Categories**: Primary organization (one per article, hierarchical)
- **Tags**: Secondary metadata (multiple per article, flat)
- Use both for comprehensive organization

**Permission Strategy:**
- Use permission-based access for flexibility
- Reserve role-based for simple scenarios
- Use user overrides sparingly

### Public Portal

Categories marked `isPublic: true` appear in the public portal:

```typescript
// Only public categories with public articles are visible
const publicCategories = await db.collection('kb_categories').find({
  orgId: currentOrg,
  isActive: true,
  isPublic: true
}).toArray()

const publicArticles = await db.collection('kb_articles').find({
  categoryId: { $in: publicCategoryIds },
  visibility: 'public',
  status: 'published'
}).toArray()
```

### Database Indexes

```javascript
// Unique slug per organization
db.kb_categories.createIndex({ orgId: 1, slug: 1 }, { unique: true })

// Hierarchy queries
db.kb_categories.createIndex({ orgId: 1, parentId: 1, order: 1 })

// Active categories
db.kb_categories.createIndex({ orgId: 1, isActive: 1 })

// Public portal
db.kb_categories.createIndex({ orgId: 1, isPublic: 1, isActive: 1 })
```

### Documentation

- **KB_CATEGORIES_IMPLEMENTATION.md** - Complete technical documentation
- **KB_CATEGORIES_MIGRATION.md** - Migration guide with scripts
- **KB_CATEGORIES_USER_GUIDE.md** - End-user documentation

## Settings Pages Redesign ✅ **COMPLETE**

All settings pages have been redesigned following ITIL/ITSM SaaS UI best practices with unique visual identities.

### Design System Components

**New Components:**
- `src/components/settings/settings-header.tsx` - Standardized page headers
- `src/components/settings/settings-card.tsx` - Enhanced navigation cards
- `src/components/settings/settings-section.tsx` - Section wrappers
- `src/components/settings/empty-state.tsx` - Reusable empty states

**Documentation:**
- **SETTINGS_DESIGN_STANDARD.md** (41KB) - Comprehensive design guidelines

### Redesigned Pages

1. **Main Settings** (`/settings`) - Categorized navigation with 4 sections
2. **User Management** (`/settings/users`) - Tabbed interface with RBAC (1,225 lines)
3. **Service Catalog** (`/settings/service-catalog`) - Purple theme
4. **Portal Settings** (`/settings/portal-settings`) - Teal theme
5. **Asset Categories** (`/settings/asset-categories`) - Gray theme
6. **Asset Locations** (`/settings/asset-locations`) - Gray theme
7. **Asset Settings** (`/settings/asset-settings`) - Gray theme

### Sidebar Reorganization

**7 ITIL/ITSM Categories:**
1. Overview (Dashboard)
2. Service Desk (Tickets, Incidents, Changes)
3. Operations (Projects, Scheduling)
4. Assets & Inventory
5. Knowledge & Resources
6. Business (Clients, Quoting, Billing)
7. Administration (Settings)

### Design Features

- Category-specific color themes
- Stats cards with real-time data
- Hover animations and transitions
- Empty states with contextual actions
- Consistent spacing and typography
- Mobile-responsive layouts

## Recent Updates (October 2025)

### Next.js 15 Compatibility
- ✅ All API routes migrated to async params pattern
- ✅ Client components updated to use `useParams()` hook
- ✅ `useSearchParams()` wrapped in Suspense boundaries
- ✅ Build successful with zero errors

### Dependencies
- ✅ Genkit AI packages installed (`genkit`, `@genkit-ai/googleai`)
- ✅ TypeScript ESLint configured
- ✅ All Radix UI primitives installed
- ✅ Alert component created

### Build Configuration
- ESLint warnings ignored during builds
- TypeScript errors in `old-docs` ignored (archived content)
- Full production build: 75 pages, 71 API routes, 101 KB baseline

### Documentation
- **SESSION_CHANGELOG.md** - Complete changelog of all changes
- **RBAC_SETUP_GUIDE.md** - RBAC initialization and usage
- Multiple RBAC technical documentation files

## Notes

- This is a B2B SaaS application with complete multi-tenancy
- All features are organization-scoped
- Authentication is required for all dashboard routes
- Database collections use `_id` as primary key (MongoDB ObjectId)
- API routes follow `/api/<resource>` and `/api/<resource>/[id]` patterns
