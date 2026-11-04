import { GoogleGenAI, Type } from "@google/genai";
import express from "express";
import dotenv from "dotenv";
import { createServer as createHttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json({ limit: "10mb" }));

const httpServer = createHttpServer(app);

// Initialize Google GenAI with User-Agent header for telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// In-Memory Classroom Room Store for Real-Time Multi-User Collaboration
interface StudentSession {
  studentId: string;
  studentName: string;
  studentGroup: string;
  risks: any[];
  lastActive: number;
}

interface RoomData {
  roomCode: string;
  students: Map<string, StudentSession>;
  wsClients: Set<WebSocket>;
}

const classroomRooms = new Map<string, RoomData>();

function getOrCreateRoom(roomCode: string): RoomData {
  const normalized = (roomCode || 'CLASSROOM-101').toUpperCase().trim();
  if (!classroomRooms.has(normalized)) {
    classroomRooms.set(normalized, {
      roomCode: normalized,
      students: new Map(),
      wsClients: new Set()
    });
  }
  return classroomRooms.get(normalized)!;
}

function broadcastRoomState(room: RoomData) {
  const studentsList = Array.from(room.students.values()).map(s => ({
    studentId: s.studentId,
    studentName: s.studentName,
    studentGroup: s.studentGroup,
    risks: s.risks,
    lastActive: s.lastActive
  }));

  const payload = JSON.stringify({
    type: 'room_state',
    roomCode: room.roomCode,
    activeStudentsCount: room.students.size,
    students: studentsList,
    serverTime: Date.now()
  });

  room.wsClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Periodic ticker to recalculate and broadcast presence times every 10 seconds
setInterval(() => {
  classroomRooms.forEach(room => {
    if (room.wsClients.size > 0) {
      broadcastRoomState(room);
    }
  });
}, 10000);

function upsertStudentSession(
  room: RoomData,
  studentId: string,
  studentName: string,
  studentGroup: string,
  risks: any[]
): string {
  const normName = (studentName || '').trim().toLowerCase();
  
  // Find existing session by ID or matching normalized studentName
  let targetKey: string | null = null;

  if (studentId && room.students.has(studentId)) {
    targetKey = studentId;
  } else if (normName && normName !== 'anonymous student' && normName !== 'student anonymous') {
    for (const [sKey, sSession] of room.students.entries()) {
      if ((sSession.studentName || '').trim().toLowerCase() === normName) {
        targetKey = sKey;
        break;
      }
    }
  }

  const finalKey = targetKey || studentId || `STUDENT-${Math.random().toString(36).substring(2, 7)}`;
  const existing = room.students.get(finalKey);

  room.students.set(finalKey, {
    studentId: finalKey,
    studentName: studentName || (existing ? existing.studentName : 'Anonymous Student'),
    studentGroup: studentGroup || (existing ? existing.studentGroup : 'Risk Group'),
    risks: (Array.isArray(risks) && risks.length > 0) ? risks : (existing ? existing.risks : []),
    lastActive: Date.now()
  });

  return finalKey;
}

// WebSocket Server attached to same HTTP Server
const wss = new WebSocketServer({ server: httpServer, path: '/ws/classroom' });

wss.on('connection', (ws) => {
  let currentRoomCode: string | null = null;
  let currentStudentId: string | null = null;

  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());

      if (msg.type === 'join_room') {
        const roomCode = (msg.roomCode || 'CLASSROOM-101').toUpperCase().trim();
        currentRoomCode = roomCode;
        const room = getOrCreateRoom(roomCode);
        room.wsClients.add(ws);

        currentStudentId = upsertStudentSession(
          room,
          msg.studentId,
          msg.studentName || 'Anonymous Student',
          msg.studentGroup || 'Risk Management Group',
          msg.risks || []
        );

        broadcastRoomState(room);
      }

      if (msg.type === 'update_risks' && currentRoomCode) {
        const room = getOrCreateRoom(currentRoomCode);
        currentStudentId = upsertStudentSession(
          room,
          currentStudentId || msg.studentId,
          msg.studentName || 'Anonymous Student',
          msg.studentGroup || 'Risk Management Group',
          msg.risks || []
        );
        broadcastRoomState(room);
      }

      // Explicit activity pulse / heartbeat event to sync lastActive
      if (msg.type === 'activity_pulse' && currentRoomCode) {
        const room = getOrCreateRoom(currentRoomCode);
        currentStudentId = upsertStudentSession(
          room,
          currentStudentId || msg.studentId,
          msg.studentName || '',
          msg.studentGroup || '',
          msg.risks || []
        );
        broadcastRoomState(room);
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoomCode && currentStudentId) {
      const room = classroomRooms.get(currentRoomCode);
      if (room) {
        room.wsClients.delete(ws);
        broadcastRoomState(room);
      }
    }
  });
});

// Helper to prune inactive sessions older than 15 minutes
function pruneStaleStudents(room: RoomData) {
  const now = Date.now();
  const maxInactiveMs = 15 * 60 * 1000; // 15 minutes
  for (const [sId, session] of room.students.entries()) {
    if (now - session.lastActive > maxInactiveMs) {
      room.students.delete(sId);
    }
  }
}

// REST Fallback & Polling route for real-time room state
const handleRoomSync = (req: express.Request, res: express.Response) => {
  const body = req.method === 'GET' ? req.query : req.body;
  const roomCode = String(body.roomCode || 'CLASSROOM-101');
  const studentId = String(body.studentId || '');
  const studentName = String(body.studentName || '');
  const studentGroup = String(body.studentGroup || '');
  let risks: any[] = [];

  try {
    if (typeof body.risks === 'string') {
      risks = JSON.parse(body.risks);
    } else if (Array.isArray(body.risks)) {
      risks = body.risks;
    }
  } catch (e) {}

  const room = getOrCreateRoom(roomCode);
  pruneStaleStudents(room);

  if (studentId || studentName) {
    upsertStudentSession(
      room,
      studentId,
      studentName || 'Anonymous Student',
      studentGroup || 'Risk Group',
      risks
    );
    broadcastRoomState(room);
  }

  const studentsList = Array.from(room.students.values());
  return res.json({
    success: true,
    roomCode: room.roomCode,
    activeStudentsCount: room.students.size,
    students: studentsList,
    serverTime: Date.now()
  });
};

app.post("/api/room/sync", handleRoomSync);
app.get("/api/room/sync", handleRoomSync);

function isGibberish(text: string): boolean {
  if (!text) return true;
  const cleaned = text.trim();
  if (cleaned.length < 5) return true;

  const lower = cleaned.toLowerCase();

  // Extract letters (latin + cyrillic)
  const lettersOnly = lower.replace(/[^a-zа-яё]/gi, '');
  if (lettersOnly.length === 0) return true;

  // Check unique character count vs length
  const uniqueChars = new Set(lettersOnly).size;
  if (uniqueChars <= 3 && lettersOnly.length >= 5) return true;

  // Check vowel ratio
  const vowels = lower.match(/[aeiouyаеёиоуыэюя]/gi) || [];
  const vowelRatio = vowels.length / lettersOnly.length;
  if (vowels.length === 0 || vowelRatio < 0.15) return true;

  // 4 or more consecutive consonants
  const consonantCluster = /[bcdfghjklmnpqrstvwxzбвгджзйклмнпрстфхцчшщ]{4,}/i;
  if (consonantCluster.test(lower)) return true;

  // Keyboard row sequence patterns
  const mashPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qwert', 'asdfg', 'zxcvb',
    'yuiop', 'hjkl', 'bnm', 'fghj', 'dfgh', 'fgb', 'gbf'
  ];
  if (mashPatterns.some(pattern => lower.includes(pattern))) return true;

  return false;
}

function generateFallbackAudit(risk: any) {
  const isAnyGibberish = 
    isGibberish(risk.riskExample) || 
    isGibberish(risk.cause) || 
    isGibberish(risk.mitigationStrategy) ||
    isGibberish(risk.conclusion);

  if (isAnyGibberish) {
    const offendingText = (risk.mitigationStrategy || risk.riskExample || risk.cause || 'input').trim();
    return {
      score: 0,
      summary: `Academic Audit Grade: 0/10. The submitted text contains invalid or non-academic gibberish ("${offendingText.slice(0, 30)}"). Academic evaluation requires structured, professional financial risk analysis.`,
      strengths: [
        'Form submission mechanism successfully logged the entry attempt.'
      ],
      logicalFlaws: [
        `The input field contains random character mashing or gibberish: "${offendingText.slice(0, 30)}" - lacks required academic terminology.`,
        'No quantifiable financial impact, root causes, or mitigation mechanisms were identified.'
      ],
      recommendations: [
        'Professional Example: "Liquidity risk arising from a cash outflow mismatch (Cash Outflow > Cash Inflow during peak settlement periods)..."',
        'Specify Key Risk Indicators (KRIs), Liquidity Coverage Ratios (LCR), or Value at Risk (VaR) parameters.',
        'Cite recognized Enterprise Risk Management (ERM) frameworks (e.g., COSO ERM, ISO 31000).'
      ],
      evaluatedAt: new Date().toISOString()
    };
  }

  const causeLength = (risk.cause || '').length;
  const strategyLength = (risk.mitigationStrategy || '').length;
  const conclusionLength = (risk.conclusion || '').length;

  let score = 7;
  if (causeLength > 50 && strategyLength > 60 && conclusionLength > 30) score = 9;
  else if (causeLength > 30 && strategyLength > 40) score = 8;
  else if (strategyLength < 20) score = 6;

  const severityNum = Number(risk.severity) || 3;

  return {
    score,
    summary: `Academic Audit: Score ${score}/10. Student response identifies a Level ${severityNum}/5 risk in the "${risk.department || 'Operations'}" department. The quoted strategy "${(risk.mitigationStrategy || '').slice(0, 40)}..." addresses primary root causes but requires enhanced operational controls.`,
    strengths: [
      `Specific assignment of responsible officer: "${risk.responsiblePerson || 'Assigned Officer'}".`,
      `Establishes a resolution timeframe: "${risk.resolutionTimeframe || 'Immediate'}".`,
      `Focuses on risk mitigation in the "${risk.department || 'Target Dept'}" division.`
    ],
    logicalFlaws: [
      `Timeline gap between discovery date (${risk.fixationDate || 'Discovery'}) and event manifestation date (${risk.occurrenceDate || 'Manifested'}).`,
      `Insufficient quantitative financial damage breakdown provided.`
    ],
    recommendations: [
      `Enhancement Example: "Implement weekly KRI monitoring with a strict 5% tolerance threshold..."`,
      `Define an escalation protocol for target resolution date overruns.`,
      `Conduct a post-implementation audit with key financial stakeholders.`
    ],
    evaluatedAt: new Date().toISOString()
  };
}

// Server route for AI Risk Assessment Audit
app.post("/api/evaluate-risk", async (req, res) => {
  try {
    const risk = req.body;
    if (!risk || !risk.riskExample) {
      return res.status(400).json({ success: false, error: "Missing risk evaluation data." });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.API_KEY) {
      const fallback = generateFallbackAudit(risk);
      return res.json({ success: true, audit: fallback });
    }

    const systemInstruction = `
You are a strict academic evaluator and financial risk management expert. Your task is to evaluate the student's risk assessment submission on a 0 to 10 scale.

CRITICAL EVALUATION & SCORING RULES (ENGLISH ONLY):
1. LANGUAGE: ALL fields in your JSON response (summary, strengths, logicalFlaws, recommendations) MUST BE WRITTEN EXCLUSIVELY IN ENGLISH.
2. GIBBERISH / INVALID INPUT DETECTION: If any field (such as Risk Example, Cause, or Mitigation Strategy) contains random characters, keyboard mashing, nonsense text (e.g., "fgbfgb", "qwerty", single letters, meaningless words), or lacks real academic content, YOU MUST ASSIGN A SCORE OF EXACTLY 0 (0/10). DO NOT give a passing grade (e.g. 6/10) for gibberish!
3. DIRECT CITATIONS: Always quote the exact words from the student's response when pointing out strengths or flaws.
4. ANALYSIS & FLAWS: Clearly detail what is flawed, missing, or academically unacceptable in the student's answer.
5. PROFESSIONAL EXAMPLES: In the recommendations field, provide professional, real-world risk management examples and frameworks (e.g. KRI, LCR, VaR, ERM standards).

Output ONLY raw structured JSON matching the requested schema. Do NOT include markdown code fences or backticks.
`;

    const prompt = `
Evaluate the following student financial risk assessment:

Student Submission Data:
- Risk Description / Example: "${risk.riskExample || ''}"
- Root Causes: "${risk.cause || ''}"
- Impact & Consequences: "${risk.consequences || 'Not provided'}"
- Discovery Date: ${risk.fixationDate || 'Not specified'}
- Manifested Date: ${risk.occurrenceDate || 'Not specified'}
- Responsible Officer: "${risk.responsiblePerson || ''}"
- Severity Rating (1-5): ${risk.severity || 3}
- Department: "${risk.department || ''}"
- Resolution Timeframe: "${risk.resolutionTimeframe || ''}"
- Mitigation Strategy: "${risk.mitigationStrategy || ''}"
- Conclusion: "${risk.conclusion || ''}"

Evaluation Instructions:
1. First, check if any field contains gibberish, random letters (e.g., "fgbfgb", "asdf"), or trivial placeholder text. If so, set score = 0 immediately.
2. Provide all output text strictly in ENGLISH.
3. Quote specific student phrases in strengths and logical flaws.
4. Offer concrete professional recommendations and formulas/metrics for improvement.
`;

    const reqConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "Grade score from 0 to 10" },
          summary: { type: Type.STRING, description: "Executive evaluation summary with student quotes" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths with direct student quotes" },
          logicalFlaws: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Logical flaws with quotes and error analysis" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action recommendations with professional examples" }
        },
        required: ["score", "summary", "strengths", "logicalFlaws", "recommendations"]
      }
    };

    let response: any;
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: reqConfig
      });
    } catch (mErr) {
      response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
        config: reqConfig
      });
    }

    const rawText = response.text || "{}";
    const cleanedText = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let auditResult: any;
    try {
      auditResult = JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("JSON parse error on Gemini response:", cleanedText);
      const fallback = generateFallbackAudit(risk);
      return res.json({ success: true, audit: fallback });
    }

    // Overriding score if gibberish detected programmatically
    if (isGibberish(risk.riskExample) || isGibberish(risk.cause) || isGibberish(risk.mitigationStrategy)) {
      auditResult = generateFallbackAudit(risk);
    }

    auditResult.evaluatedAt = new Date().toISOString();

    return res.json({ success: true, audit: auditResult });
  } catch (error: any) {
    console.error("Risk evaluation error, using fallback:", error);
    const fallback = generateFallbackAudit(req.body);
    return res.json({ success: true, audit: fallback });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server & WebSockets listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
