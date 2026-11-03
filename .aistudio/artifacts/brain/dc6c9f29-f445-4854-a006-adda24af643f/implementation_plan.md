# Multi-Device Real-Time Student Synchronization Fix

Ensure that students working concurrently in the same Room PIN (e.g., `LECTURE-408`) on different devices or browser windows instantly see each other in the Live Class Stream and Room Modal.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed:
> 1. Show only real multi-user devices connected to the exact same room PIN (no fake demo students).
> 2. Enable continuous multi-device sync so students joining from different devices/tabs appear automatically without refreshing the page.

- **Confirmed Decision 1**: Real-user synchronization — Only display real student devices connected to the room PIN.
- **Confirmed Decision 2**: Continuous polling fallback — Implement a 4-second periodic sync timer in `App.tsx` via `/api/room/sync` alongside WebSockets so environments with restricted WebSocket support (e.g., serverless Vercel deployments) continuously stay in sync.

---

## 1. Overview & Core Concept

- **What It Does**: Adds an active 4-second sync loop to `App.tsx` that fetches the updated roster of all students registered in the current Room PIN from `/api/room/sync`.
- **Target Audience**: Students and instructors collaborating across multiple laptops, tablets, or browser sessions in the same classroom room.
- **Key Value**: Guarantees real-time visibility of peer students across all hosting environments and network configurations.

---

## 2. Technical Strategy & Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx State                          │
│   roomCode, studentId, studentName, studentGroup, risks      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ (Every 4 sec & WS)           ▼ (On Change)
┌─────────────────────────────────────────────────────────────┐
│               Express Server (server.ts)                    │
│   GET/POST /api/room/sync  &  ws://.../ws/classroom         │
│   - Upserts student session by roomCode & studentId         │
│   - Cleans up sessions inactive for > 15 minutes            │
│   - Returns active students list to all clients             │
└─────────────────────────────────────────────────────────────┘
```

### Proposed Changes

1. **`src/App.tsx`**:
   - Add a 4-second `setInterval` hook in `App.tsx` that calls `/api/room/sync` with current `roomCode`, `studentId`, `studentName`, `studentGroup`, and `risks`.
   - Update `activePeers` with the returned `students` list.
   - Trigger an immediate sync whenever `roomCode` changes or `handleCreateNewRisk` / `onChange` occurs.

2. **`server.ts`**:
   - Enhance `upsertStudentSession` to handle both GET and POST requests for `/api/room/sync`.
   - Prune stale student sessions inactive for over 15 minutes to keep the active roster clean.
   - Return total connected peers for the given room code.

---

## 3. Verification Plan

- Open two separate browser windows or tabs.
- Join the same Room PIN (e.g., `LECTURE-408`) in both windows.
- Verify that both windows immediately display each other in the Live Class Stream and Navbar active student counter within 4 seconds.
- Run `compile_applet` to ensure clean build.
