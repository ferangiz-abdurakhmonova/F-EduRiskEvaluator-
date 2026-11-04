import { useState, useEffect, useCallback, useRef } from 'react';
import { RiskAssessment } from '../types/risk';
import { db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot, query, limit } from 'firebase/firestore';

export interface StudentPeer {
  studentId: string;
  studentName: string;
  studentGroup: string;
  risks: RiskAssessment[];
  lastActive: number;
}

interface UseRealtimeRoomProps {
  roomCode: string;
  studentId: string;
  studentName: string;
  studentGroup: string;
  risks: RiskAssessment[];
}

export function useRealtimeRoom({
  roomCode,
  studentId,
  studentName,
  studentGroup,
  risks
}: UseRealtimeRoomProps) {
  const [activePeers, setActivePeers] = useState<StudentPeer[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isFirebase, setIsFirebase] = useState<boolean>(isFirebaseConfigured());
  const lastSyncRef = useRef<number>(0);

  // Sync current student's status to cloud database or local endpoint
  const syncSelfState = useCallback(async () => {
    if (!roomCode || !studentId) return;

    const payload = {
      studentId,
      studentName: studentName || 'Anonymous Student',
      studentGroup: studentGroup || 'Unassigned',
      risks: risks || [],
      lastActive: Date.now(),
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConfigured() && db) {
      try {
        const studentDocRef = doc(db, 'rooms', roomCode, 'students', studentId);
        await setDoc(studentDocRef, payload, { merge: true });
        lastSyncRef.current = Date.now();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${roomCode}/students/${studentId}`);
      }
    } else {
      // Local server fallback sync
      try {
        const res = await fetch('/api/room/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomCode, ...payload })
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.students)) {
            setActivePeers(data.students);
          }
        }
      } catch (err) {
        console.debug('Local sync fallback fetch error:', err);
      }
    }
  }, [roomCode, studentId, studentName, studentGroup, risks]);

  // Main real-time listener effect
  useEffect(() => {
    setIsFirebase(isFirebaseConfigured());

    if (!roomCode) return;

    // Trigger immediate self sync whenever room code or student profile changes
    syncSelfState();

    let unsubscribeFirebase: (() => void) | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    if (isFirebaseConfigured() && db) {
      const studentsCollectionRef = collection(db, 'rooms', roomCode, 'students');
      const q = query(studentsCollectionRef, limit(100));

      unsubscribeFirebase = onSnapshot(
        q,
        (snapshot) => {
          const peers: StudentPeer[] = [];
          const now = Date.now();
          const MAX_INACTIVE_MS = 15 * 60 * 1000; // 15 minutes

          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as StudentPeer;
            if (data && data.studentId && data.lastActive && (now - data.lastActive < MAX_INACTIVE_MS)) {
              peers.push(data);
            }
          });

          // Sort peers: current user first, then by name
          peers.sort((a, b) => {
            if (a.studentId === studentId) return -1;
            if (b.studentId === studentId) return 1;
            return (a.studentName || '').localeCompare(b.studentName || '');
          });

          setActivePeers(peers);
          setIsConnected(true);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `rooms/${roomCode}/students`);
          setIsConnected(false);
        }
      );

      // Periodically update active presence timestamp every 10 seconds for Firebase
      fallbackInterval = setInterval(() => {
        syncSelfState();
      }, 10000);
    } else {
      // HTTP Polling Fallback (every 4 seconds for non-Firebase environments)
      const fetchPeersFallback = async () => {
        try {
          const res = await fetch(`/api/room/sync?roomCode=${encodeURIComponent(roomCode)}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.students)) {
              setActivePeers(data.students);
              setIsConnected(true);
            }
          }
        } catch (e) {
          setIsConnected(false);
        }
      };

      fetchPeersFallback();
      fallbackInterval = setInterval(() => {
        syncSelfState();
        fetchPeersFallback();
      }, 4000);
    }

    return () => {
      if (unsubscribeFirebase) unsubscribeFirebase();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [roomCode, studentId, syncSelfState]);

  return {
    activePeers,
    isConnected,
    isFirebase,
    syncNow: syncSelfState
  };
}
