# AI Agent Session Memory

> **IMPORTANT**: This file must be read at the start of every AI session and updated after every significant change.

## Project Overview

**Project Name**: PillowWatch (WatchParty)
**Description**: A collaborative video watching application where users can watch content together in real-time with voice chat, text chat, and shared cloud browser (Hyperbeam).

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express, TypeScript, Socket.IO, PostgreSQL
- **Cloud Browser**: Hyperbeam API (premium tier - unlimited sessions)
- **Hosting**: 
  - Frontend: Vercel (https://pillow-watch.vercel.app)
  - Backend: Render (https://watchparty-backend-ii4b.onrender.com)
  - Database: Render PostgreSQL

### Repository Structure
```
/
├── frontend/          # Next.js frontend (separate git repo)
├── backend/           # Express backend (separate git repo)
├── AGENTS.md          # This file - AI session memory
└── README.md
```

---

## Current State (Last Updated: 2026-01-12)

### ✅ Completed Features

#### 1. Database Persistence (PostgreSQL)
- **Files**: `backend/src/services/Database.ts`, `backend/src/services/DatabaseRoomManager.ts`
- Rooms, participants, chat messages, and Hyperbeam sessions persist across server restarts
- Auto-creates schema on startup
- Falls back to memory-only mode if DATABASE_URL not configured

#### 2. Hyperbeam Session Pool
- **File**: `backend/src/services/HyperbeamSessionPool.ts`
- Pre-creates sessions on startup (configurable via `HYPERBEAM_POOL_SIZE`, default: 10)
- Instant session allocation for rooms (no waiting for Hyperbeam API)
- Sessions return to pool when rooms become empty (recycling)
- Keep-alive mechanism pings sessions every 5 minutes
- Auto-replenishes pool every 60 seconds
- Creates 1 session per batch with 30 second delay (conservative to avoid rate limits)

#### 3. Admin Dashboard
- **File**: `frontend/src/app/admin/page.tsx`
- View all active rooms and Hyperbeam sessions
- Delete individual rooms or all rooms
- Terminate Hyperbeam sessions
- Server statistics display
- Simple token-based authentication (`ADMIN_TOKEN` env var)
- Access at `/admin`

#### 4. Join Sounds
- **Files**: `frontend/src/hooks/useRoom.ts`, `frontend/src/components/VoiceCall.tsx`
- `RoomJoin.mp3` plays when user joins room (80% volume)
- `CallJoin.mp3` plays when user joins voice call (80% volume)
- Sounds play for all users in room/call (not just the joining user)

#### 5. Room Recovery
- When server restarts, rooms are loaded from database
- If a room doesn't exist but there's an active Hyperbeam session, room is recreated
- Host token validation works across reconnections

### 🔧 Recent Fixes

#### Session Pool Database Persistence (2026-01-12)
- **Problem**: Pool sessions couldn't be recovered after restart - Hyperbeam's list API doesn't return `admin_token`
- **Fix**: Save session `admin_token` to database when created, load on startup
- **File**: `backend/src/services/HyperbeamSessionPool.ts`

#### Hyperbeam API Response Parsing (2026-01-12)
- **Problem**: API returns paginated `{"results": [...], "next": ...}` not direct array
- **Fix**: Updated `listActiveSessions()` to handle paginated response and map `id` to `session_id`
- **File**: `backend/src/services/HyperbeamService.ts`

#### Rate Limit Handling
- Exponential backoff for consecutive rate limit hits
- 5 minute base cooldown, doubles with each consecutive hit (capped at 16x)
- Conservative session creation: 1 session per minute to fill pool

#### Async Database Operations
- All `setHyperbeamSession()` and `clearHyperbeamSession()` calls are now awaited
- Ensures database writes complete before responses are sent

---

## Known Issues & TODOs

### 🐛 Issues to Investigate

1. **Host loses control after refresh**
   - Sometimes host rejoins as guest even with valid hostToken
   - Debug logging added to `DatabaseRoomManager.addParticipant()`

2. **Viewer can't see host's Hyperbeam session**
   - Usually happens after server restart
   - Should be fixed by session pool + database persistence
   - Monitor logs for "No cloud browser session found"

### 📋 Potential Improvements

1. **Session pool optimization**
   - Consider pre-warming sessions with specific URLs
   - Add session reset (navigate to blank page) when returning to pool

2. **Better error handling in frontend**
   - Show user-friendly messages for rate limits
   - Add retry UI for session allocation failures

3. **Voice call improvements**
   - Add leave sound when user leaves call
   - Add volume controls per user

---

## Environment Variables

### Backend (Render)
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://pillow-watch.vercel.app
DATABASE_URL=postgresql://...  # Render PostgreSQL connection string
HYPERBEAM_API_KEY=sk_...       # Hyperbeam API key (premium account)
HYPERBEAM_POOL_SIZE=10         # Number of sessions to keep in pool
ADMIN_TOKEN=your-secret-token  # Optional: protects admin endpoints
```

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://watchparty-backend-ii4b.onrender.com
NEXT_PUBLIC_WS_URL=https://watchparty-backend-ii4b.onrender.com
```

---

## Key Files Reference

### Backend

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, Express + Socket.IO setup |
| `src/services/Database.ts` | PostgreSQL connection and queries |
| `src/services/DatabaseRoomManager.ts` | Room management with DB persistence |
| `src/services/HyperbeamService.ts` | Hyperbeam API wrapper |
| `src/services/HyperbeamSessionPool.ts` | Session pool management |
| `src/controllers/roomController.ts` | REST API endpoints |
| `src/websocket/socketHandlers.ts` | Socket.IO event handlers |

### Frontend

| File | Purpose |
|------|---------|
| `src/app/room/[roomId]/page.tsx` | Main room page |
| `src/app/admin/page.tsx` | Admin dashboard |
| `src/hooks/useRoom.ts` | Room state and socket management |
| `src/components/VoiceCall.tsx` | WebRTC voice chat |
| `src/lib/api.ts` | API client functions |

---

## API Endpoints

### Rooms
- `POST /api/rooms` - Create room
- `GET /api/rooms/:roomId` - Get room info
- `GET /api/rooms/:roomId/exists` - Check if room exists

### Hyperbeam
- `POST /api/rooms/:roomId/hyperbeam` - Allocate session from pool
- `GET /api/rooms/:roomId/hyperbeam` - Get session for room
- `DELETE /api/rooms/:roomId/hyperbeam` - Terminate session
- `GET /api/hyperbeam/status` - Pool and rate limit status
- `GET /api/hyperbeam/pool` - Detailed pool info (admin)
- `GET /api/hyperbeam/sessions` - List all Hyperbeam sessions
- `DELETE /api/hyperbeam/sessions` - Terminate all sessions

### Admin
- `GET /api/admin/rooms` - List all rooms (requires admin token)
- `DELETE /api/admin/rooms/:roomId` - Force delete room
- `DELETE /api/admin/rooms` - Delete all rooms

---

## Socket.IO Events

### Client → Server
- `room:join` - Join a room
- `playback:play/pause/seek/rate` - Playback control (host only)
- `media:change` - Change media URL (host only)
- `chat:send` - Send chat message
- `voice:join/leave` - Join/leave voice call

### Server → Client
- `room:joined` - Joined successfully
- `room:participant-joined/left` - Participant updates
- `room:host-changed` - Host changed
- `hyperbeam:session` - Session ready
- `playback:play/pause/seek/sync` - Playback updates
- `chat:message` - New chat message

---

## Debugging Tips

### Check Hyperbeam Status
```bash
curl https://watchparty-backend-ii4b.onrender.com/api/hyperbeam/status
```

### Check Session Pool
```bash
curl https://watchparty-backend-ii4b.onrender.com/api/hyperbeam/pool
```

### List All Sessions
```bash
curl https://watchparty-backend-ii4b.onrender.com/api/hyperbeam/sessions
```

### Terminate All Sessions (cleanup)
```bash
curl -X DELETE https://watchparty-backend-ii4b.onrender.com/api/hyperbeam/sessions
```

---

## Instructions for AI Agents

### At Session Start
1. **Read this file completely**
2. Check recent git commits for context: `git log --oneline -20`
3. Ask user what they want to work on

### During Development
1. **Always commit and push changes** after each significant modification
2. Test changes locally if possible before pushing
3. Update this file after significant changes

### After Making Changes
1. **Update this AGENTS.md file** with:
   - What was changed
   - Why it was changed
   - Any new issues discovered
   - Update the "Last Updated" date
2. Commit and push both the code changes AND this file

### Commit Message Format
```
type: short description

- Detail 1
- Detail 2
```
Types: `feat`, `fix`, `debug`, `refactor`, `docs`

---

## Change Log

### 2026-01-12
- Fixed Hyperbeam API pagination parsing (was returning 0 sessions when there were active ones)
- Added session pool with conservative creation (1 per minute)
- Added PostgreSQL database persistence
- Added admin dashboard at `/admin`
- Added join sounds for room and voice call
- Multiple rate limit handling improvements

---

## Contact & Resources

- **Hyperbeam Dashboard**: https://hyperbeam.com/dashboard
- **Hyperbeam Docs**: https://docs.hyperbeam.com/
- **Render Dashboard**: https://dashboard.render.com/
- **Vercel Dashboard**: https://vercel.com/
