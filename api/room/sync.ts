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
}

// Global scope room store for serverless lambda warm instance persistence
const globalRooms = (globalThis as any)._classroomRooms || new Map<string, RoomData>();
(globalThis as any)._classroomRooms = globalRooms;

function getOrCreateRoom(roomCode: string): RoomData {
  const normalized = (roomCode || 'CLASSROOM-101').toUpperCase().trim();
  if (!globalRooms.has(normalized)) {
    globalRooms.set(normalized, {
      roomCode: normalized,
      students: new Map()
    });
  }
  return globalRooms.get(normalized)!;
}

function pruneStaleStudents(room: RoomData) {
  const now = Date.now();
  const maxInactiveMs = 15 * 60 * 1000; // 15 minutes
  for (const [sId, session] of room.students.entries()) {
    if (now - session.lastActive > maxInactiveMs) {
      room.students.delete(sId);
    }
  }
}

function upsertStudentSession(
  room: RoomData,
  studentId: string,
  studentName: string,
  studentGroup: string,
  risks: any[]
): string {
  const normName = (studentName || '').trim().toLowerCase();
  
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

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.method === 'GET' ? (req.query || {}) : (req.body || {});
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
    } catch (e) {
      risks = [];
    }

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
    }

    const studentsList = Array.from(room.students.values());

    return res.status(200).json({
      success: true,
      roomCode: room.roomCode,
      activeStudentsCount: room.students.size,
      students: studentsList,
      serverTime: Date.now()
    });
  } catch (error: any) {
    console.error('Room sync serverless error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error'
    });
  }
}
