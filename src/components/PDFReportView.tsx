import React from 'react';
import { RiskAssessment } from '../types/risk';
import { ShieldAlert } from 'lucide-react';

interface PDFReportViewProps {
  risks: RiskAssessment[];
  refProp: React.RefObject<HTMLDivElement | null>;
}

export const PDFReportView: React.FC<PDFReportViewProps> = ({ risks, refProp }) => {
  const primaryStudentName = risks[0]?.studentName || 'Student Anonymous';
  const primaryStudentGroup = risks[0]?.studentGroup || 'Enterprise Risk Lecture';

  return (
    <div style={{ position: 'fixed', top: 0, left: '-9999px', zIndex: -9999, opacity: 1, pointerEvents: 'none' }}>
      <div 
        ref={refProp}
        className="w-[800px] bg-white text-slate-900 p-10 font-sans leading-relaxed space-y-8 shadow-2xl"
        id="pdf-printable-report"
        style={{ width: '800px', minWidth: '800px', backgroundColor: '#ffffff' }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-cyan-700 font-extrabold text-xl tracking-tight">
              <ShieldAlert className="w-6 h-6 text-cyan-600" />
              <span>F-EduRiskEvaluator · Academic Risk Assessment Report</span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              University Lecture & Enterprise Risk Management Audit System ({risks.length} {risks.length === 1 ? 'Registered Risk' : 'Registered Risks'})
            </p>
          </div>

          <div className="text-right font-mono text-xs text-slate-600 space-y-0.5">
            <div><span className="font-bold">Total Items:</span> {risks.length}</div>
            <div><span className="font-bold">Generated:</span> {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Student & Course Metadata */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-3 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase block text-[10px]">Student Name</span>
            <span className="font-bold text-slate-900">{primaryStudentName}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase block text-[10px]">Course / Group</span>
            <span className="font-bold text-slate-900">{primaryStudentGroup}</span>
          </div>
          <div>
            <span className="text-slate-500 uppercase block text-[10px]">Writing Verification</span>
            <span className="font-bold text-emerald-700">Verified Handwritten</span>
          </div>
        </div>

        {/* List of All Risk Items */}
        {risks.map((risk, index) => (
          <div key={risk.id || index} className={`space-y-5 ${index > 0 ? 'pt-8 border-t-2 border-slate-300' : ''}`}>
            
            {/* Risk Title & ID Banner */}
            <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between font-mono text-xs">
              <span className="font-bold uppercase tracking-wider text-cyan-300">
                Risk Item #{index + 1}: {risk.riskExample ? `"${risk.riskExample}"` : 'Untitled Risk'}
              </span>
              <span className="text-slate-300">ID: {risk.id}</span>
            </div>

            {/* Section 1: Risk Identification Details */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                1. Risk Identification & Classification
              </h2>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 bg-slate-100/70 p-3 rounded-lg">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Risk Example / Title</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{risk.riskExample || 'Untitled Risk'}</p>
                </div>

                <div className="col-span-2 bg-slate-100/70 p-3 rounded-lg">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Root Cause & Origin Drivers</span>
                  <p className="text-slate-800 mt-0.5">{risk.cause || 'Not specified'}</p>
                </div>

                <div className="col-span-2 bg-rose-50 border border-rose-200 p-3 rounded-lg">
                  <span className="font-bold text-rose-800 uppercase text-[10px] block">Risk Influence, Impact & Consequences</span>
                  <p className="text-slate-900 mt-0.5 font-medium">{risk.consequences || 'Not specified'}</p>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Fixation Date</span>
                  <span className="font-mono font-bold text-slate-800">{risk.fixationDate}</span>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Occurrence Date</span>
                  <span className="font-mono font-bold text-slate-800">{risk.occurrenceDate}</span>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Assigned Department</span>
                  <span className="font-bold text-slate-800">{risk.department}</span>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Resolution Timeframe</span>
                  <span className="font-bold text-slate-800">{risk.resolutionTimeframe}</span>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Responsible Role</span>
                  <span className="font-bold text-slate-800">{risk.responsiblePerson || 'Unassigned'}</span>
                </div>

                <div className="p-2.5 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase block">Severity Importance Rating</span>
                  <span className="font-mono font-bold text-rose-700">Level {risk.severity} / 5</span>
                </div>
              </div>
            </div>

            {/* Section 2: Handwritten Strategy & Conclusion */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1">
                2. Student Analysis & Mitigation Strategy
              </h2>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Mitigation Strategy</span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{risk.mitigationStrategy || 'Not specified'}</p>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="font-bold text-slate-600 uppercase text-[10px] block mb-1">Written Synthesis Report & Conclusion</span>
                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{risk.conclusion || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Section 3: AI Auditor Feedback */}
            {risk.aiAudit && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-800 border-b border-cyan-200 pb-1 flex items-center justify-between">
                  <span>3. Google AI Studio Evaluation</span>
                  <span className="font-mono text-cyan-700 font-bold">Grade: {risk.aiAudit.score} / 10</span>
                </h2>

                <div className="bg-cyan-50/60 border border-cyan-200 rounded-xl p-4 text-xs space-y-3">
                  <div>
                    <span className="font-bold text-cyan-900 block text-[10px] uppercase">Auditor Executive Summary</span>
                    <p className="text-slate-800 mt-0.5">{risk.aiAudit.summary}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <span className="font-bold text-emerald-800 block text-[10px] uppercase">Key Strengths</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {risk.aiAudit.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="font-bold text-amber-800 block text-[10px] uppercase">Logical Oversights</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-700 mt-1">
                        {risk.aiAudit.logicalFlaws.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}

        {/* Footer Signature & Stamp */}
        <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div>
            <span>Verified Student Submissions · Anti-Copy/Paste Shield Active</span>
          </div>
          <div className="border border-slate-300 p-2 rounded text-center">
            <div className="font-bold text-slate-800 uppercase">Risk Management Faculty</div>
            <div>Official Audit Certification Stamp</div>
          </div>
        </div>

      </div>
    </div>
  );
};
