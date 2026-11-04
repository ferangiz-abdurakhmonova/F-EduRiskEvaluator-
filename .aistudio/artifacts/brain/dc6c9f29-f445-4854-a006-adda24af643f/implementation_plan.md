# Real-Time Multi-User Firebase Integration & Vercel Setup Guide

Transform the application's student risk evaluation platform from single-server / local browser state into a true real-time cloud multiplayer experience using Firebase Firestore. Multi-device students connecting to the same Room PIN (e.g. `LECTURE-408`) on Vercel or any hosting provider will instantly sync live across all devices.

---

## User Preferences & Decisions

> [!IMPORTANT]
> The user confirmed the following choices:
> 1. **Database Service**: Firebase Firestore with real-time `onSnapshot` listeners.
> 2. **Fallback Strategy**: Automatically fall back to local server polling if cloud keys are unset.
> 3. **Documentation**: Provide a detailed step-by-step guide in English for packages, database schema, Vercel Environment Variables, and updated components.

---

## 1. Overview & Architecture

When deployed on serverless hosting like Vercel, isolated lambda instances do not share in-memory server state. Integrating Firebase Firestore enables instant real-time synchronization via web sockets (`onSnapshot`) across all connected devices and browser sessions.

```
┌─────────────────────────────────────────────────────────────┐
│                 React Client (Multi-Device)                 │
│      Student enters Room PIN: "LECTURE-408" & Name          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     (If VITE_FIREBASE_*)            (If Unset / Fallback)
               │                              │
               ▼                              ▼
┌──────────────────────────────┐┌──────────────────────────────┐
│  Firebase Firestore Cloud    ││    Local Express Server      │
│  rooms/LECTURE-408/students  ││   /api/room/sync (polling)   │
│  (Real-Time onSnapshot Sync) ││  (Serverless / Dev Fallback) │
└──────────────────────────────┘└──────────────────────────────┘
```

---

## 2. Step-by-Step Vercel & Firebase Setup Guide

Below are the step-by-step instructions for configuring Firebase and Vercel:

### Step 1: Install Dependencies
Run the following command in your project terminal:
```bash
npm install firebase
```

### Step 2: Create a Firebase Project & Firestore Database
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** (or select an existing project) and follow the prompts.
3. In the project sidebar, go to **Build > Firestore Database** and click **Create Database**.
4. Select your preferred database region and start in **Test mode** (or apply production security rules).

### Step 3: Configure Database Collection Structure
Firestore creates collections dynamically, but the hierarchy is defined as follows:

- **Collection**: `rooms` (Document ID: Room PIN, e.g. `LECTURE-408`)
  - **Subcollection**: `students` (Document ID: Student ID, e.g. `STD-X9A21`)
    - **Fields**:
      - `studentId` (string): e.g., `"STD-X9A21"`
      - `studentName` (string): e.g., `"Alex Rivers"`
      - `studentGroup` (string): e.g., `"Group 4B"`
      - `risks` (array of objects): Complete list of identified risks and evaluations.
      - `lastActive` (number): Epoch timestamp (e.g., `Date.now()`) for live heartbeat and active stream tracking.
      - `updatedAt` (string): ISO timestamp string.

### Step 4: Add Environment Variables in Vercel
1. In the Firebase Console, go to **Project Settings** > **General** > **Your apps** > Web app `</>`.
2. Copy your Firebase Configuration object values.
3. Open your project in the [Vercel Dashboard](https://vercel.com/dashboard).
4. Go to **Settings > Environment Variables** and add the following keys:

| Environment Variable Name | Value Example |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `your-app-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `1234567890` |
| `VITE_FIREBASE_APP_ID` | `1:1234567890:web:abcdef...` |

5. Redeploy your app on Vercel so the environment variables take effect.

---

## 3. Technical Implementation Plan

### 1. Firebase Helper & Fallback Handler (`src/lib/firebase.ts`)
- Initialize Firebase App and Firestore using client environment variables (`import.meta.env.VITE_FIREBASE_*`).
- Export a helper function `isFirebaseConfigured()` to seamlessly toggle between cloud Firestore and local server fallback.

### 2. Real-Time Room Subscription Hook (`src/hooks/useRealtimeRoom.ts`)
- Listen to `rooms/{roomCode}/students` subcollection using Firestore `onSnapshot`.
- Automatically write student status changes, risk additions, and updates using `setDoc(doc(db, 'rooms', roomCode, 'students', studentId), payload, { merge: true })`.
- Clean up active snapshot subscriptions on component unmount or room PIN changes.
- Provide automatic fallback to continuous 4-second local server polling if `isFirebaseConfigured()` is `false`.

### 3. Application State Integration (`src/App.tsx`)
- Bind `useRealtimeRoom` hook to sync `activePeers` into state.
- Enable instant reflect of submitted projects, live activity stream entries, and peer student counters across all multi-user sessions.

---

## 4. Verification Plan

1. **Build Verification**:
   - Run `compile_applet` to ensure zero compilation or TypeScript errors.
2. **Multi-Tab / Multi-Device Test**:
   - Test in 2 browser windows/tabs with room PIN `LECTURE-408`.
   - Update student name or submit a risk evaluation in Window 1 and verify instant appearance in Window 2.
