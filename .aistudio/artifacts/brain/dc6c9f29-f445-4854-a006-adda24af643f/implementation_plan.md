# AI Risk Audit JSON Handling & Resilient Error Recovery

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1:

- **Confirmed Decision 1 (Server Formatting)**: The Express proxy `/api/evaluate-risk` will instruct Gemini (`gemini-3.8-flash`) via `config: { responseMimeType: "application/json" }`, strip any markdown triple-backtick fences (` ```json `), and safely wrap all error paths in structured JSON `{ success: false, error: "..." }` responses with standard status codes.
- **Confirmed Decision 2 (UI Error Feedback)**: The client dashboard (`handleEvaluateAI` in `src/App.tsx`) will catch network or parsing exceptions gracefully, showing an inline warning toast with an instant **"Retry AI Audit"** action button instead of breaking or crashing the app.

---

## 1. Overview & Core Concept

- **What It Does**: Resolves the `Unexpected token 'T', "The page c"... is not valid JSON` error during AI student project risk evaluations. Guarantees that both Gemini API outputs and Express proxy endpoints strictly produce JSON, while client-side callers safely handle HTML fallback pages (e.g., 404/500 server errors) without JSON parsing exceptions.
- **Target Audience / Persona**: Lecturers and students monitoring academic integrity and risk evaluation across synchronized live classroom sessions.
- **Key Value**: Prevents application crashes during AI risk audits, ensures 100% reliable audit reports, and provides instant visual retry options when external model calls or network endpoints encounter hiccups.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Submitting Student Work**: Student or instructor triggers "Request AI Audit" on a project submission.
  2. **Audit Execution**: The server calls Gemini with JSON constraints, sanitizes the raw output string, and returns structured risk metrics (Risk Level, Key Risks, Recommendations, Score).
  3. **Graceful Error Recovery**: If an API error occurs, an inline warning toast appears at the top right: *"AI Audit temporary network issue. Retry evaluation."* with an interactive **[Retry]** button.
- **Visual Identity & Theme**:
  - Consistent slate canvas with emerald (low risk), amber (medium risk), and rose (high risk) visual cues.
  - Toast notification utilizes warning amber/rose accents with crisp, unboxed typography and instant action triggers.
- **Interactive Feedback & Motion**:
  - Smooth loading spinners on submission cards during active AI audit evaluations.
  - Non-intrusive toast pop-up with auto-dismiss and explicit action handlers.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Markdown Strip & Strict JSON Schema**:
  - *Chosen Approach*: Enforce `responseMimeType: "application/json"` in `@google/genai` call and run `.replace(/```json/gi, '').replace(/```/g, '').trim()` before `JSON.parse`.
  - *Why*: Gemini may occasionally wrap valid JSON in markdown fences; stripping them on the server prevents client-side parse errors.
- **Decision 2: Defensive Client Response Parsing**:
  - *Chosen Approach*: Inspect response `Content-Type` header and inspect raw response text before attempting `JSON.parse()`.
  - *Why*: If a proxy server or hosting route returns a 404 HTML error page starting with `<html>` or `The page cannot...`, reading raw text first allows detecting HTML and displaying a human-friendly toast rather than throwing an unhandled `SyntaxError`.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────┐
│                      Client (React)                     │
│  - SubmissionModal / App.tsx                            │
│  - handleEvaluateAI() with try...catch                   │
│  - Inline Error Toast + Retry Button                    │
└────────────────────────────┬────────────────────────────┘
                             │ POST /api/evaluate-risk (JSON payload)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    Express Server                       │
│  - /api/evaluate-risk proxy route                       │
│  - GoogleGenAI SDK (gemini-3.8-flash)                    │
│  - Markdown fence stripper & JSON sanitizer             │
│  - Standardized JSON Error Handler                      │
└────────────────────────────┬────────────────────────────┘
                             │ ai.models.generateContent()
                             ▼
┌─────────────────────────────────────────────────────────┐
│                  Google Gemini API                      │
│  - responseMimeType: "application/json"                 │
│  - System instructions for strict schema output         │
└─────────────────────────────────────────────────────────┘
```

### Key Endpoint & Handler Implementation Plan:

1. **`server.ts` (`POST /api/evaluate-risk`)**:
   - Initialize `@google/genai` client using `process.env.GEMINI_API_KEY` and header `'User-Agent': 'aistudio-build'`.
   - Call model `gemini-3.8-flash` with `config: { responseMimeType: "application/json" }`.
   - Strip markdown code blocks (` ```json `) from `response.text`.
   - Parse clean JSON string; on failure or missing API key, return `res.status(500).json({ success: false, error: message })`.

2. **`src/App.tsx` (`handleEvaluateAI`)**:
   - Make `fetch('/api/evaluate-risk', ...)` request.
   - Check `res.headers.get('content-type')` or safely extract `await res.text()`.
   - Parse JSON safely within `try...catch`.
   - If invalid or non-200, display warning toast with one-click retry trigger.
