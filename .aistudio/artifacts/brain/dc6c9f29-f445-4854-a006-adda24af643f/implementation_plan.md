# Vercel Serverless Functions Migration for AI Risk Evaluation & Room Sync

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1:

- **Confirmed Decision 1 (Vercel Serverless AI Route)**: Create `/api/evaluate-risk.ts` in Vercel API directory exporting a standard serverless handler `export default async function handler(req: VercelRequest, res: VercelResponse)`.
- **Confirmed Decision 2 (CORS Preflight Support)**: Include standard CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`) and handle `HTTP OPTIONS` preflight requests across all Vercel API routes.
- **Confirmed Decision 3 (Room Sync Serverless Route)**: Create `/api/room/sync.ts` alongside `evaluate-risk.ts` so live classroom session synchronization operates natively on Vercel infrastructure.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces express server route dependencies with Vercel Serverless Functions inside the `api/` directory (`api/evaluate-risk.ts` and `api/room/sync.ts`).
- **Target Audience / Persona**: Students and instructors using the deployed app at `f-edu-risk-evaluator.vercel.app` on Vercel.
- **Key Value**: Fixes 404 HTML errors on Vercel deployment, enables serverless AI evaluations via Gemini 3.8 Flash, and keeps classroom PIN multi-student sync functional on Vercel serverless edge routes.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Requesting AI Audit on Vercel**: Clicking "Request AI Audit" sends a `POST /api/evaluate-risk` request to Vercel's serverless endpoint.
  2. **Audit Execution**: The Vercel function initializes `@google/genai`, queries `gemini-3.8-flash` with `responseMimeType: "application/json"`, cleans code blocks, and returns `{ success: true, audit: {...} }`.
  3. **Live Room Sync**: Student actions trigger `POST /api/room/sync`, persisting classroom state across serverless invocations.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vercel Function Structure & Request Method Validation**:
  - *Chosen Approach*: Validate `req.method === 'POST'`, return status `405 Method Not Allowed` if not POST.
  - *Why*: Conforms strictly to REST standards and prevents accidental GET invocations.
- **Decision 2: Defensive Response Cleaning**:
  - *Chosen Approach*: Strip markdown code blocks (` ```json ` and ` ``` `) from `response.text` before running `JSON.parse`. Wrap in `try...catch` and return `res.status(500).json({ success: false, error: "Internal Server Error" })` on exceptions.
  - *Why*: Guarantees valid JSON responses regardless of model output nuances.

---

## 4. Technical Architecture & Data Strategy

```
┌───────────────────────────────────────────────────────────────┐
│                    Vercel Frontend (React)                    │
│                 f-edu-risk-evaluator.vercel.app               │
└───────────────────────────────┬───────────────────────────────┘
                                │ POST /api/evaluate-risk
                                ▼
┌───────────────────────────────────────────────────────────────┐
│          Vercel Serverless Function (api/evaluate-risk.ts)    │
│  - Method check (405 for non-POST)                            │
│  - CORS preflight handling (200 OK for OPTIONS)               │
│  - @google/genai SDK (gemini-3.8-flash)                       │
│  - Markdown fence stripper                                    │
│  - Standardized JSON response / Error catch (500)              │
└───────────────────────────────┬───────────────────────────────┘
                                │ generateContent()
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     Google Gemini 3.8 Flash                   │
│             apiKey: process.env.GEMINI_API_KEY                │
│             responseMimeType: "application/json"              │
└───────────────────────────────────────────────────────────────┘
```

### Proposed Files to Create / Update:

1. **`api/evaluate-risk.ts`**:
   - Vercel serverless function exporting default `handler(req, res)`.
   - Handles CORS headers and OPTIONS preflight.
   - Validates `POST` request method.
   - Calls `@google/genai` model `gemini-3.8-flash`.
   - Strips code block backticks and parses output JSON.

2. **`api/room/sync.ts`**:
   - Vercel serverless function for `/api/room/sync`.
   - Handles classroom room state synchronization with CORS headers.
