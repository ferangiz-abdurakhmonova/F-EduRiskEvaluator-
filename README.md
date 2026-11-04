# 🛡️ F-EduRiskEvaluator
> **Academic Training & Financial Risk Simulation Platform**

`F-EduRiskEvaluator` is an interactive web platform designed for students, lecturers, and risk management professionals. It enables structured financial risk modeling, real-time multi-user classroom collaboration, interactive analytics, and automated academic AI grading powered by **Google AI Studio Gemini API**.
Link to watch: https://www.youtube.com/watch?v=FWkGKgRvGVQ

---

## ✨ Key Features

### 📋 1. Multi-Risk Assessment Form
- **Structured Risk Entry**: Register multiple risk items per session with customizable student details, risk titles, descriptions, root causes, severity levels (1–5), responsible roles, department classifications, and resolution timeframes.
- **Pre-Built Academic Scenarios**: Quickly populate forms with industry-standard financial risk scenarios:
  - *Banking Liquidity Mismatch (Cash Flow Mismatch)*
  - *Cybersecurity Data Breach & IT Vulnerability*
  - *AML & Regulatory Compliance Failure*
  - *Market Volatility & Asset Portfolio Impairment*
- **Field Validation**: Automatic character counting, word limits, and input completeness verification.

### 🤖 2. Google AI Studio Gemini 3.8 Risk Audit
- **Automated Academic Grading**: Evaluates student responses on a **0 to 10 scale** based on academic rigor, financial logic, and clarity.
- **Strict Anti-Gibberish Engine**: Advanced pattern recognition automatically flags keyboard mashing, nonsense strings (e.g. `fgbfgb`, `qwerty`), or trivial placeholders, assigning an immediate `0/10` grade.
- **Detailed Direct Quotations**: Extracts exact phrases from student responses to highlight analysis strengths and logical flaws.
- **Actionable Auditor Recommendations**: Provides real-world financial risk management frameworks, metrics (KRI, LCR, VaR), and Enterprise Risk Management (ERM) guidelines for improvement.

### 👥 3. Live Class Stream & Multi-User Collaboration
- **WebSocket Classroom Synchronization**: Join shared lecture rooms (e.g. `LECTURE-408`) via room PINs.
- **Live Student Presence**: Monitor real-time active student counts, submission activity, and presence timers.
- **Class-Wide Risk Metrics**: Aggregate risk statistics and total registered risk items across all participating students in real time.

### 📊 4. Interactive Analytics Dashboard
- **Risk Severity Distribution**: Interactive Recharts bar visualization categorizing risks from Level 1 (Minor) to Level 5 (Catastrophic).
- **Departmental Exposure Breakdown**: Donut chart detailing risk distribution across Operations, Finance, IT & Cyber, Legal & Compliance, and Strategic units.
- **Executive Heatmap**: Visual risk matrix comparing severity against operational departments.

### 📄 5. Unified PDF Report Generation
- **Single-Click Download**: Generates a single, comprehensive PDF document containing all student risk items and their corresponding AI Auditor evaluation cards using `jspdf` and `html2canvas`.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5, Vite 8, Tailwind CSS v4, Lucide React, Motion |
| **Data Viz** | Recharts, Canvas Confetti |
| **PDF Export** | jsPDF, html2canvas |
| **Backend** | Express 4, WebSockets (`ws`), Node.js, `tsx` |
| **AI Integration**| Google GenAI SDK (`@google/genai`), Gemini 2.5 Flash / Gemini 1.5 Flash |
| **Deployment** | Serverless on Vercel (`/api/evaluate-risk.ts`) & Node.js (`server.ts`) |

---

## 📁 Project Structure

```
.
├── api/
│   └── evaluate-risk.ts   # Vercel Serverless Function for AI Risk Evaluation
├── src/
│   ├── components/        # React Components
│   │   ├── AIAuditCard.tsx             # AI Audit Grade & Feedback Display
│   │   ├── ClassroomLiveDashboard.tsx  # Multi-user Live Stream View
│   │   ├── ClassroomRoomModal.tsx      # Room PIN Join Modal
│   │   ├── Dashboard.tsx               # Analytics & Charts Component
│   │   ├── Navbar.tsx                  # Header Navigation & Room PIN Status
│   │   ├── PDFReportView.tsx           # Printable PDF Layout Component
│   │   ├── RiskForm.tsx                # Structured Risk Input Form
│   │   ├── ScenarioSelectorModal.tsx   # Pre-built Risk Scenarios Modal
│   │   └── SubmissionModal.tsx         # Report Download Modal
│   ├── hooks/             # Custom React Hooks (Classroom Sync, Theme)
│   ├── types/             # TypeScript Interfaces & Types
│   ├── utils/             # Helper Functions & Report Export Logic
│   ├── App.tsx            # Main Application Layout & State Container
│   └── main.tsx           # React Application Entry Point
├── server.ts              # Express App & WebSocket Server Entry Point
├── vite.config.ts         # Vite Configuration
├── tsconfig.json          # TypeScript Compiler Options
├── package.json           # Dependencies & NPM Scripts
└── README.md              # Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **npm** or **bun** / **yarn**
- **Google AI Studio API Key**: Get a free key at [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ferangiz-abdurakhmonova/F-EduRiskEvaluator-.git
   cd F-EduRiskEvaluator-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## ⚡ Deployment Guide

### Vercel Deployment

1. Push your code to GitHub.
2. Import the repository into **Vercel**.
3. Set the Environment Variable in Vercel settings:
   - `GEMINI_API_KEY`: Your Google AI Studio API Key
4. Vercel automatically detects Vite and builds the serverless API routes located in `/api`.

---

## 📄 License

Distributed under the GNU Affero General Public License v3 (AGPL-3.0). See `LICENSE` for more information.
