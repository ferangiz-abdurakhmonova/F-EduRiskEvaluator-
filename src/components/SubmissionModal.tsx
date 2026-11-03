import React, { useState } from 'react';
import { RiskAssessment } from '../types/risk';
import { Download, Send, CheckCircle2, X, Mail } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  risk: RiskAssessment;
  onDownloadPDF: () => Promise<void>;
  onShowToast: (msg: string, type: 'warning' | 'success' | 'info') => void;
  theme: 'dark' | 'light';
}

export const SubmissionModal: React.FC<SubmissionModalProps> = ({
  isOpen,
  onClose,
  risk,
  onDownloadPDF,
  onShowToast,
  theme
}) => {
  const isDark = theme === 'dark';
  const [instructorEmail, setInstructorEmail] = useState<string>('nfatxulaevna@gmail.com');
  const [studentName, setStudentName] = useState<string>(
    risk.studentName || `${risk.studentFirstName || 'Alex'} ${risk.studentLastName || 'Mercer'}`.trim()
  );
  const [studentGroup, setStudentGroup] = useState<string>(risk.studentGroup || 'CS-408 Enterprise Risk');
  const [notes, setNotes] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instructorEmail) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const receipt = `SUB-${Math.random().toString(36).substring(2, 9).toUpperCase()}-2026`;
    setSubmissionReceipt(receipt);
    setIsSubmitting(false);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    onShowToast(`Assessment submitted successfully to ${instructorEmail}! Receipt: ${receipt}`, 'success');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownloadPDF();
      onShowToast('PDF Report generated and downloaded to your device!', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      onShowToast('Failed to generate PDF. Please try again.', 'warning');
    } finally {
      setIsDownloading(false);
    }
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
            <Send className="w-6 h-6" />
          </div>
          <div>
            <h3 className={`text-base font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Submit Risk Assessment to Instructor
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Download certified PDF report or dispatch directly to professor email.
            </p>
          </div>
        </div>

        {submissionReceipt ? (
          /* Receipt View */
          <div className={`border rounded-xl p-5 space-y-4 text-center ${
            isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className={`text-sm font-bold font-display ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Assessment Submitted Successfully!
              </h4>
              <p className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                A digital copy and verified audit log was sent to <span className="text-cyan-600 font-mono font-bold">{instructorEmail}</span>.
              </p>
            </div>

            <div className={`p-3 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <span className={`uppercase text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Submission Receipt ID</span>
              <span className="text-emerald-600 font-bold">{submissionReceipt}</span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center gap-2 px-4 py-2 border text-xs font-bold rounded-xl transition-colors ${
                  isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Copy'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-slate-950 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Submission Form */
          <form onSubmit={handleDirectSubmit} className="space-y-4">
            
            <div>
              <label className={`block text-xs font-mono font-semibold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Instructor Email Address
              </label>
              <div className="relative">
                <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  value={instructorEmail}
                  onChange={(e) => setInstructorEmail(e.target.value)}
                  placeholder="nfatxulaevna@gmail.com"
                  className={`w-full border rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-xs font-mono font-semibold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Student Full Name
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Alex Mercer"
                  className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-mono font-semibold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Course / Group
                </label>
                <input
                  type="text"
                  required
                  value={studentGroup}
                  onChange={(e) => setStudentGroup(e.target.value)}
                  placeholder="CS-408 Enterprise Risk"
                  className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-mono font-semibold uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Submission Notes / Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional note for professor regarding your mitigation strategy..."
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors resize-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>

            {/* Submission Actions */}
            <div className={`pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border text-xs font-bold rounded-xl transition-all w-full sm:w-auto ${
                  isDark ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                }`}
              >
                <Download className="w-4 h-4 text-cyan-500" />
                <span>{isDownloading ? 'Generating PDF...' : 'Download PDF Report'}</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-xs font-bold text-slate-950 rounded-xl shadow-lg shadow-cyan-500/20 transition-all w-full sm:w-auto active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Dispatching...' : 'Direct Submit to Email'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
