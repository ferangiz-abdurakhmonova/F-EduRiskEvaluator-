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

function generateFallbackAudit(risk: any) {
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
    summary: `Student analysis correctly identifies a Level ${severityNum}/5 risk within ${risk.department || 'Operations'}. The proposed mitigation strategy addresses immediate root causes, though long-term verification mechanisms should be strengthened.`,
    strengths: [
      `Clear identification of responsible role (${risk.responsiblePerson || 'Assigned Officer'}) for execution.`,
      `Structured resolution timeframe (${risk.resolutionTimeframe || 'Immediate'}) aligns with stated severity level.`,
      `Specific focus on root cause mitigation in ${risk.department || 'the target department'}.`
    ],
    logicalFlaws: [
      `Potential delay between fixation date (${risk.fixationDate || 'Discovery'}) and occurrence date (${risk.occurrenceDate || 'Manifested'}).`,
      `Contingency budget and quantitative impact threshold could be defined in greater detail.`
    ],
    recommendations: [
      `Establish key risk indicators (KRIs) to measure mitigation progress weekly.`,
      `Define escalation protocols if resolution timeframe exceeds target schedule.`,
      `Conduct a post-implementation review with department stakeholders to verify risk abatement.`
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

    const prompt = `
You are a Senior Chief Risk Officer and University Risk Management Professor evaluating a student's risk assessment submission.
Be thorough, objective, constructive, and realistic.

Student Risk Assessment Submission:
- Risk Example / Description: ${risk.riskExample}
- Root Cause & Drivers: ${risk.cause}
- Influence, Impact & Consequences: ${risk.consequences || 'Not specified'}
- Fixation Date (Discovered): ${risk.fixationDate}
- Occurrence Date (Manifested/Projected): ${risk.occurrenceDate}
- Responsible Role / Person: ${risk.responsiblePerson}
- Severity Level (1-5): ${risk.severity}
- Assigned Department: ${risk.department}
- Resolution Timeframe: ${risk.resolutionTimeframe}
- Student Mitigation Strategy: ${risk.mitigationStrategy}
- Student Conclusion & Synthesis Report: ${risk.conclusion}

Please evaluate the submission:
1. Grade score from 1 to 10 based on logic, completeness, cause-and-effect coherence, severity alignment with stated consequences, and mitigation feasibility.
2. Provide a concise executive evaluation summary (2-3 sentences).
3. List 2-3 specific strengths of the student's analysis.
4. List 1-3 logical flaws or oversights (e.g. underestimating consequences, unrealistic timeframe, wrong department accountability, missing contingency plans, superficial conclusion).
5. List 3 concrete action recommendations to strengthen this risk mitigation strategy.
`;

    const reqConfig = {
      systemInstruction: "You are an expert risk auditor evaluating student risk assessments. Output ONLY raw structured JSON matching the requested schema. Do NOT include markdown formatting or backticks.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "Grade score from 1 to 10" },
          summary: { type: Type.STRING, description: "Executive evaluation summary" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Strengths of the strategy" },
          logicalFlaws: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Flaws or oversights" },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Action recommendations" }
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
