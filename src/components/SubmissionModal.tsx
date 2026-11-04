import React, { useState } from 'react';
import { RiskAssessment } from '../types/risk';
import { Download, CheckCircle2, X, FileText, Layers, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: RiskAssessment[];
  onDownloadPDF: () => Promise<void>;
  onShowToast: (msg: string, type: 'warning' | 'success' | 'info') => void;
  theme: 'dark' | 'light';
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  risks,
  onDownloadPDF,
  onShowToast,
  theme
}) => {
  const isDark = theme === 'dark';
  const primaryStudentName = risks[0]?.studentName || 'Student Anonymous';
  const primaryStudentGroup = risks[0]?.studentGroup || 'CS-408 Enterprise Risk';
  
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadPDF();
      setDownloadSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onShowToast(`Complete PDF Report (${risks.length} Risk ${risks.length === 1 ? 'Item' : 'Items'}) generated and downloaded!`, 'success');
    } catch (err) {
      console.error('PDF error:', err);
      onShowToast('Failed to generate PDF report. Please try again.', 'warning');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyReportText = () => {
    const reportSummary = `F-EduRiskEvaluator - Academic Risk Report
========================================
Student: ${primaryStudentName}
Course / Group: ${primaryStudentGroup}
Total Registered Risks: ${risks.length}
Date: ${new Date().toLocaleDateString()}

${risks.map((r, i) => `
----------------------------------------
RISK ITEM #${i + 1} (ID: ${r.id})
----------------------------------------
Title / Example: ${r.riskExample || 'N/A'}
Department: ${r.department} (Severity Level ${r.severity}/5)
Root Cause: ${r.cause || 'N/A'}
Impact / Consequences: ${r.consequences || 'N/A'}
Mitigation Strategy: ${r.mitigationStrategy || 'N/A'}
Conclusion: ${r.conclusion || 'N/A'}
${r.aiAudit ? `AI Audit Score: ${r.aiAudit.score}/10` : ''}
`).join('')}`;

    navigator.clipboard.writeText(reportSummary);
    onShowToast('All risk assessments copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className={`border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-6 transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className={`p-3 border rounded-xl ${
            isDark ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-700'
          }`}>
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Download Complete PDF Report
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Exports all {risks.length} registered student risk {risks.length === 1 ? 'assessment' : 'assessments'} into a single formatted PDF.
            </p>
          </div>
        </div>

        {/* Student & Risk Breakdown List */}
        <div className={`border rounded-xl p-4 space-y-3 ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-mono border-b pb-2.5 border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Student</span>
              <span className="font-bold">{primaryStudentName}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Group</span>
              <span className="font-bold">{primaryStudentGroup}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase">Risk Items</span>
              <span className="font-bold text-cyan-600 dark:text-cyan-400">{risks.length} Included</span>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block">
              Document Risk Items Breakdown
            </span>
            {risks.map((r, idx) => (
              <div 
                key={r.id || idx}
                className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0">#{idx + 1}</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {r.riskExample || 'Untitled Risk'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    Lvl {r.severity}
                  </span>
                  {r.aiAudit && (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-bold">
                      {r.aiAudit.score}/10
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {downloadSuccess && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
            isDark ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>PDF downloaded! All {risks.length} risks included in the generated document.</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className={`pt-3 border-t space-y-3 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-xs font-extrabold text-white rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Generating Multi-Risk PDF...' : `Download Complete Report PDF (${risks.length} ${risks.length === 1 ? 'Risk' : 'Risks'})`}</span>
          </button>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyReportText}
              className={`flex items-center gap-1.5 text-xs font-mono underline hover:no-underline transition-colors ${
                isDark ? 'text-slate-400 hover:text-cyan-300' : 'text-slate-600 hover:text-cyan-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Text Summary</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
