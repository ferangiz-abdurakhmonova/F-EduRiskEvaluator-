import React from 'react';
import { Users, Layers, ShieldAlert, Award, Eye, CheckCircle2, Clock, FileSpreadsheet, Download } from 'lucide-react';
import { RiskAssessment } from '../types/risk';
import { getPresenceStatus } from './ClassroomRoomModal';

interface StudentPeer {
  studentId: string;
  studentName: string;
  studentGroup: string;
  risks: RiskAssessment[];
  lastActive: number;
}

interface ClassroomLiveDashboardProps {
  roomCode: string;
  peers: StudentPeer[];
  onOpenRoomModal: () => void;
  isDarkMode: boolean;
  onInspectRisk: (risk: RiskAssessment) => void;
}

export const ClassroomLiveDashboard: React.FC<ClassroomLiveDashboardProps> = ({
  roomCode,
  peers,
  onOpenRoomModal,
  isDarkMode,
  onInspectRisk
}) => {
  // Deduplicate peers by normalized name or ID for a clean 1-row-per-student view
  const uniquePeersMap = new Map<string, StudentPeer>();
  peers.forEach(p => {
    const key = (p.studentName || '').trim().toLowerCase() || p.studentId;
    const existing = uniquePeersMap.get(key);
    if (!existing || (p.lastActive || 0) > (existing.lastActive || 0)) {
      uniquePeersMap.set(key, p);
    }
  });
  const uniquePeers = Array.from(uniquePeersMap.values());

  const totalClassStudents = uniquePeers.length;
  const allClassRisks: { studentName: string; lastActive: number; risk: RiskAssessment }[] = [];

  let activeCount = 0;
  let awayCount = 0;
  let inactiveCount = 0;

  uniquePeers.forEach(peer => {
    const presence = getPresenceStatus(peer.lastActive);
    if (presence.category === 'active') activeCount++;
    else if (presence.category === 'away') awayCount++;
    else inactiveCount++;

    if (Array.isArray(peer.risks)) {
      peer.risks.forEach(r => {
        allClassRisks.push({
          studentName: peer.studentName || 'Anonymous Student',
          lastActive: peer.lastActive,
          risk: r
        });
      });
    }
  });

  const totalClassRisks = allClassRisks.length;
  const classAvgSeverity = totalClassRisks > 0
    ? (allClassRisks.reduce((acc, r) => acc + (r.risk.severity || 3), 0) / totalClassRisks).toFixed(1)
    : '0.0';

  const auditedClassRisks = allClassRisks.filter(r => r.risk.aiAudit?.score !== undefined);
  const classAvgAIGrade = auditedClassRisks.length > 0
    ? (auditedClassRisks.reduce((acc, r) => acc + (r.risk.aiAudit?.score || 0), 0) / auditedClassRisks.length).toFixed(1)
    : 'N/A';

  const handleExportCSV = () => {
    const sanitizeText = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '';
      return String(val)
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const formatDate = (val: string | undefined) => {
      if (!val) return new Date().toISOString().split('T')[0];
      try {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toISOString().split('T')[0];
        }
      } catch (e) {}
      return String(val).split('T')[0] || String(val);
    };

    const headers = [
      'Student Name',
      'Course / Group',
      'Risk ID',
      'Risk Description',
      'Root Cause & Origin',
      'Influence & Consequences',
      'Department',
      'Severity Level (1-5)',
      'Resolution Timeframe',
      'Responsible Person',
      'Mitigation Strategy',
      'Written Conclusion',
      'Gemini AI Audit Score',
      'Fixation Date (YYYY-MM-DD)',
      'Occurrence Date (YYYY-MM-DD)',
      'Submission Status'
    ];

    const rows: string[][] = [];

    uniquePeers.forEach(peer => {
      const studentName = sanitizeText(peer.studentName || 'Anonymous Student');
      const studentGroup = sanitizeText(peer.studentGroup || 'Risk Group');
      const studentRisks = Array.isArray(peer.risks) ? peer.risks : [];

      if (studentRisks.length === 0) {
        rows.push([
          studentName,
          studentGroup,
          'N/A',
          'No risks logged yet',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          'Pending',
          formatDate(undefined),
          formatDate(undefined),
          'Drafting'
        ]);
      } else {
        studentRisks.forEach(r => {
          const status = r.aiAudit?.score !== undefined 
            ? 'Audit Passed' 
            : (r.consequences && r.mitigationStrategy ? 'Ready for AI' : 'Drafting');

          rows.push([
            studentName,
            studentGroup,
            sanitizeText(r.id || 'N/A'),
            sanitizeText(r.riskExample),
            sanitizeText(r.cause),
            sanitizeText(r.consequences),
            sanitizeText(r.department || 'IT & Cyber'),
            String(r.severity || 1),
            sanitizeText(r.resolutionTimeframe || '1 Month'),
            sanitizeText(r.responsiblePerson),
            sanitizeText(r.mitigationStrategy),
            sanitizeText(r.conclusion),
            r.aiAudit?.score !== undefined ? `${r.aiAudit.score}/10` : 'Pending',
            formatDate(r.fixationDate),
            formatDate(r.occurrenceDate),
            status
          ]);
        });
      }
    });

    const escapeCSV = (field: string) => {
      const clean = String(field || '').replace(/"/g, '""');
      return `"${clean}"`;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `Classroom_Risks_${roomCode}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const cardStyle = isDarkMode
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  return (
    <div className="space-y-6">
      
      {/* Real-time Room Banner */}
      <div className={`p-5 border rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold font-display">Classroom Collaboration Stream</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>LIVE SYNC</span>
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Classroom PIN: <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{roomCode}</span> · {totalClassStudents} Connected Students
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            title="Download all classroom student risks as CSV spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Class CSV</span>
          </button>

          <button
            onClick={onOpenRoomModal}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-500/20"
          >
            Manage Room PIN ({roomCode})
          </button>
        </div>
      </div>

      {/* Class Metrics & Presence Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Participant Status</span>
            <Users className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl font-extrabold font-mono text-cyan-500 flex items-baseline gap-2">
            <span>{activeCount} Active</span>
            <span className="text-xs text-amber-500 font-normal">({awayCount} Away)</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            {activeCount} Active · {awayCount} Away (&lt;5m) · {inactiveCount} Inactive (&gt;5m)
          </p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Total Class Risks</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono">
            {totalClassRisks}
          </div>
          <p className="text-[11px] text-slate-400">Combined class entries</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Class Avg Severity</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            {classAvgSeverity} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400">Class risk index</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Class Avg AI Grade</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-500">
            {classAvgAIGrade} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400">Evaluated by Gemini 3.8</p>
        </div>

      </div>

      {/* Live Class Stream Feed Table - Grouped 1 Row Per Student */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 ${cardStyle}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold font-display">Live Student Stream & Activity Feed</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time student progress and risk entries in Room PIN {roomCode}.</p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              🟢 {activeCount} Active Now
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              🟡 {awayCount} Away (&lt;5m)
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/30">
              ⚪ {inactiveCount} Inactive (&gt;5m)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`border-b font-mono uppercase tracking-wider ${
                isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}>
                <th className="py-3 px-3">Student Name & Group</th>
                <th className="py-3 px-3">Presence Status</th>
                <th className="py-3 px-3">Registered Risks</th>
                <th className="py-3 px-3">Primary / Latest Risk Title</th>
                <th className="py-3 px-3">Max Severity</th>
                <th className="py-3 px-3">Form Completion</th>
                <th className="py-3 px-3">AI Grade</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
              {uniquePeers.length > 0 ? (
                uniquePeers.map((peer, idx) => {
                  const presence = getPresenceStatus(peer.lastActive);
                  const studentRisks = Array.isArray(peer.risks) ? peer.risks : [];
                  const risksCount = studentRisks.length;
                  const primaryRisk = studentRisks[0];

                  // Max Severity
                  const maxSeverity = risksCount > 0
                    ? Math.max(...studentRisks.map(r => r.severity || 1))
                    : 3;

                  // Average Form Completion % across student's risks
                  let totalFilledPct = 0;
                  studentRisks.forEach(r => {
                    const hasCause = Boolean(r.cause?.trim());
                    const hasConsequences = Boolean(r.consequences?.trim());
                    const hasMitigation = Boolean(r.mitigationStrategy?.trim());
                    const hasConclusion = Boolean(r.conclusion?.trim());
                    const filled = [hasCause, hasConsequences, hasMitigation, hasConclusion].filter(Boolean).length;
                    totalFilledPct += (filled / 4) * 100;
                  });
                  const avgCompletionPct = risksCount > 0 ? Math.round(totalFilledPct / risksCount) : 0;

                  // Best AI score
                  const scores = studentRisks
                    .map(r => r.aiAudit?.score)
                    .filter((s): s is number => s !== undefined);
                  const bestScore = scores.length > 0 ? Math.max(...scores) : null;

                  return (
                    <tr key={peer.studentId || idx} className={isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                      <td className="py-3 px-3">
                        <div className="font-bold text-cyan-600 dark:text-cyan-400">
                          {peer.studentName || 'Anonymous Student'}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          {peer.studentGroup || 'Risk Group'}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${presence.badgeBg} ${presence.badgeText}`}>
                          <span className={`w-2 h-2 rounded-full ${presence.dotColor}`}></span>
                          <span>{presence.label}</span>
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          {risksCount} {risksCount === 1 ? 'Risk' : 'Risks'}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-medium max-w-xs truncate">
                        {primaryRisk ? (
                          <span>{primaryRisk.riskExample || 'Untitled Risk'}</span>
                        ) : (
                          <span className="text-slate-400 italic">No risks logged</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          maxSeverity === 5 ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' :
                          maxSeverity === 4 ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30' :
                          maxSeverity === 3 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' :
                          maxSeverity === 2 ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30' :
                          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                        }`}>
                          Lvl {maxSeverity} · {
                            maxSeverity === 5 ? 'Critical' :
                            maxSeverity === 4 ? 'High' :
                            maxSeverity === 3 ? 'Substantial' :
                            maxSeverity === 2 ? 'Moderate' : 'Low'
                          }
                        </span>
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                avgCompletionPct === 100 ? 'bg-emerald-500' : avgCompletionPct >= 50 ? 'bg-cyan-500' : 'bg-amber-500'
                              }`} 
                              style={{ width: `${avgCompletionPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400">{avgCompletionPct}%</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold">
                        {bestScore !== null ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 w-max ${
                            bestScore >= 8 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{bestScore}/10</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">Pending</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            if (primaryRisk) onInspectRisk(primaryRisk);
                          }}
                          disabled={!primaryRisk}
                          className="p-1.5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Inspect Student's Risk Assessment"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No classroom students connected yet in Room PIN {roomCode}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
};
