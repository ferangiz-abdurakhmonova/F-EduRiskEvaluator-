import React, { useState } from 'react';
import { Users, Key, X, Clock } from 'lucide-react';

interface StudentPeer {
  studentId: string;
  studentName: string;
  studentGroup: string;
  risks: any[];
  lastActive: number;
}

interface ClassroomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onJoinRoom: (newRoomCode: string) => void;
  activeStudents: StudentPeer[];
  isDarkMode: boolean;
}

export function getPresenceStatus(lastActive: number): {
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  category: 'active' | 'away' | 'inactive';
} {
  if (!lastActive) {
    return {
      label: 'Active now',
      dotColor: 'bg-emerald-500 animate-pulse',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      category: 'active'
    };
  }

  const elapsedMinutes = (Date.now() - lastActive) / 60000;

  if (elapsedMinutes < 2) {
    return {
      label: 'Active now',
      dotColor: 'bg-emerald-500 animate-pulse',
      badgeBg: 'bg-emerald-500/10 border-emerald-500/30',
      badgeText: 'text-emerald-600 dark:text-emerald-400',
      category: 'active'
    };
  } else if (elapsedMinutes <= 5) {
    const mins = Math.max(2, Math.floor(elapsedMinutes));
    return {
      label: `Away (${mins}m ago)`,
      dotColor: 'bg-amber-500',
      badgeBg: 'bg-amber-500/10 border-amber-500/30',
      badgeText: 'text-amber-600 dark:text-amber-400',
      category: 'away'
    };
  } else {
    const mins = Math.floor(elapsedMinutes);
    return {
      label: `Inactive (>5m ago)`,
      dotColor: 'bg-slate-400 dark:bg-slate-500',
      badgeBg: 'bg-slate-500/10 border-slate-500/30',
      badgeText: 'text-slate-500 dark:text-slate-400',
      category: 'inactive'
    };
  }
}

export const ClassroomRoomModal: React.FC<ClassroomRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  onJoinRoom,
  activeStudents,
  isDarkMode
}) => {
  const [inputCode, setInputCode] = useState<string>(roomCode);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim()) {
      onJoinRoom(inputCode.trim().toUpperCase());
      onClose();
    }
  };

  // Calculate status counters
  let activeCount = 0;
  let awayCount = 0;
  let inactiveCount = 0;

  activeStudents.forEach(peer => {
    const status = getPresenceStatus(peer.lastActive);
    if (status.category === 'active') activeCount++;
    else if (status.category === 'away') awayCount++;
    else inactiveCount++;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 ${
        isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display">Join Real-Time Classroom Room</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Students in the same Room PIN work simultaneously, share analytics, and sync live.
            </p>
          </div>
        </div>

        {/* Room Code Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-semibold uppercase text-slate-500 mb-1">
              Classroom Room PIN / Code
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="e.g. LECTURE-408 or ROOM-101"
                className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-sm font-mono font-bold uppercase focus:outline-none focus:border-cyan-500 ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-cyan-400' : 'bg-slate-50 border-slate-300 text-cyan-700'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all"
          >
            Connect to Classroom Room PIN ({inputCode.toUpperCase()})
          </button>
        </form>

        {/* Connected Peers Roster with Presence Status Badges */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold uppercase text-slate-500">
              Connected Students in {roomCode}
            </span>
            
            {/* Status Breakdown Badges */}
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {activeCount} Active
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {awayCount} Away (&lt;5m)
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/30">
                {inactiveCount} Inactive (&gt;5m)
              </span>
            </div>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {activeStudents.length > 0 ? (
              activeStudents.map((peer, idx) => {
                const presence = getPresenceStatus(peer.lastActive);
                return (
                  <div 
                    key={peer.studentId || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isDarkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${presence.dotColor}`} title={presence.label}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold block">{peer.studentName || 'Anonymous Student'}</span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${presence.badgeBg} ${presence.badgeText}`}>
                            {presence.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{peer.studentGroup || 'Risk Group'}</span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                      {peer.risks ? peer.risks.length : 0} Risks Logged
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                No other students in Room {roomCode} yet. Share this PIN to collaborate!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
