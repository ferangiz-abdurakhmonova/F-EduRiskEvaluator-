import React from 'react';
import { AIAuditFeedback } from '../types/risk';
import { Sparkles, CheckCircle2, AlertTriangle, Lightbulb, RefreshCw, Award } from 'lucide-react';

interface AIAuditCardProps {
  audit?: AIAuditFeedback;
  onReevaluate: () => void;
  isEvaluating: boolean;
  isDarkMode: boolean;
}

export const AIAuditCard: React.FC<AIAuditCardProps> = ({
  audit,
  onReevaluate,
  isEvaluating,
  isDarkMode
}) => {
  if (!audit) {
    return (
      <div className={`border rounded-2xl p-8 text-center space-y-3 transition-colors ${
        isDarkMode ? 'bg-slate-900/60 border-slate-800/80 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}>
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold font-display">No AI Audit Executed Yet</h3>
        <p className={`text-xs max-w-md mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Fill in your risk assessment details and click <span className="text-cyan-600 dark:text-cyan-400 font-semibold">"Request AI Audit"</span> to receive feedback and a grade score from Google AI Studio Gemini 3.8.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (score >= 5) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-500/30' };
    return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const colors = getScoreColor(audit.score);

  return (
    <div className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-colors ${
      isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      
      {/* Audit Header Banner */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b ${
        isDarkMode ? 'border-slate-800' : 'border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600/20 to-blue-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-base font-bold font-display ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Google AI Studio Risk Assessment Audit
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded border border-cyan-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Audited at {new Date(audit.evaluatedAt).toLocaleTimeString()} · Academic Grade Evaluation
            </p>
          </div>
        </div>

        {/* Grade Badge */}
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-2xl border ${colors.bg} ${colors.border} flex items-center gap-3`}>
            <Award className={`w-6 h-6 ${colors.text}`} />
            <div>
              <div className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Student Grade</div>
              <div className={`text-xl font-extrabold font-mono ${colors.text}`}>
                {audit.score} <span className="text-xs text-slate-500 font-normal">/ 10</span>
              </div>
            </div>
          </div>

          <button
            onClick={onReevaluate}
            disabled={isEvaluating}
            className={`p-2.5 border text-slate-700 dark:text-slate-300 rounded-xl transition-all active:scale-95 disabled:opacity-50 ${
              isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 hover:text-slate-900'
            }`}
            title="Re-run AI Audit"
          >
            <RefreshCw className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className={`p-4 border rounded-xl ${
        isDarkMode ? 'bg-slate-950/60 border-slate-800/80 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
      }`}>
        <h4 className={`text-xs font-mono font-bold uppercase mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Executive Auditor Summary
        </h4>
        <p className="text-sm leading-relaxed">
          {audit.summary}
        </p>
      </div>

      {/* Strengths & Flaws Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Strengths */}
        <div className={`p-4 border rounded-xl space-y-3 ${
          isDarkMode ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2 font-display">
            <CheckCircle2 className="w-4 h-4" />
            <span>Analysis Strengths ({audit.strengths.length})</span>
          </h4>
          <ul className="space-y-2">
            {audit.strengths.map((item, idx) => (
              <li key={idx} className={`text-xs flex items-start gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="text-emerald-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Logical Flaws */}
        <div className={`p-4 border rounded-xl space-y-3 ${
          isDarkMode ? 'bg-amber-950/20 border-amber-500/20' : 'bg-amber-50/80 border-amber-200'
        }`}>
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-2 font-display">
            <AlertTriangle className="w-4 h-4" />
            <span>Logical Flaws & Oversights ({audit.logicalFlaws.length})</span>
          </h4>
          <ul className="space-y-2">
            {audit.logicalFlaws.map((item, idx) => (
              <li key={idx} className={`text-xs flex items-start gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span className="text-amber-500 font-bold mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Recommendations */}
      <div className={`p-4 border rounded-xl space-y-3 ${
        isDarkMode ? 'bg-cyan-950/20 border-cyan-500/20' : 'bg-cyan-50/80 border-cyan-200'
      }`}>
        <h4 className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-display">
          <Lightbulb className="w-4 h-4" />
          <span>Actionable Auditor Recommendations</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {audit.recommendations.map((item, idx) => (
            <div key={idx} className={`p-3 border rounded-lg space-y-1 ${
              isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}>
              <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">Recommendation {idx + 1}</span>
              <p className="text-xs leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
