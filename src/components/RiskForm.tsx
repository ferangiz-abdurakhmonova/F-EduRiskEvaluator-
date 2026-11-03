import React, { useState } from 'react';
import { RiskAssessment, Department, ResolutionTimeframe, SeverityLevel } from '../types/risk';
import { createAntiPasteHandlers, countWords } from '../utils/antiPaste';
import { 
  ShieldAlert, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  Building2, 
  Clock, 
  Lock, 
  Keyboard, 
  BookOpen,
  User,
  GraduationCap,
  Hash,
  Plus,
  Trash2,
  Flame,
  ListPlus,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface RiskFormProps {
  currentRisk: RiskAssessment;
  allRisks: RiskAssessment[];
  activeRiskIndex: number;
  onSelectRiskIndex: (index: number) => void;
  onAddNewRisk: () => void;
  onDeleteCurrentRisk: () => void;
  onChange: (updated: RiskAssessment) => void;
  onEvaluateAI: () => void;
  isEvaluating: boolean;
  onShowToast: (msg: string, type: 'warning' | 'success' | 'info') => void;
  isDarkMode: boolean;
}

const DEPARTMENTS: Department[] = [
  'IT & Cyber',
  'Finance',
  'Operations',
  'HR',
  'Legal & Compliance',
  'R&D'
];

const TIMEFRAMES: ResolutionTimeframe[] = [
  'Immediate (<24h)',
  '1 Week',
  '1 Month',
  '1 Quarter',
  'Long Term'
];

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; desc: string; color: string; border: string; bg: string }> = {
  1: { label: 'Low', desc: 'Minimal operational impact', color: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  2: { label: 'Moderate', desc: 'Minor delay or resource strain', color: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  3: { label: 'Substantial', desc: 'Noticeable business disruption', color: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  4: { label: 'High', desc: 'Severe financial/operational loss', color: 'text-orange-600 dark:text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  5: { label: 'Critical', desc: 'Existential threat or regulatory shutdown', color: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-50 dark:bg-rose-500/10' }
};

interface WordProgressRingProps {
  currentWords: number;
  targetWords: number;
  label?: string;
  isDarkMode: boolean;
}

const WordProgressRing: React.FC<WordProgressRingProps> = ({
  currentWords,
  targetWords,
  label,
  isDarkMode
}) => {
  const percentage = Math.min(100, Math.round((currentWords / targetWords) * 100));
  const isTargetMet = currentWords >= targetWords;
  
  const radius = 12;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
        <svg className="w-7 h-7 transform -rotate-90">
          <circle
            cx="14"
            cy="14"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={isDarkMode ? 'text-slate-800' : 'text-slate-200'}
            fill="transparent"
          />
          <circle
            cx="14"
            cy="14"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-300 ${
              isTargetMet 
                ? 'text-emerald-500' 
                : currentWords > 0 
                ? 'text-cyan-500' 
                : 'text-slate-400'
            }`}
            fill="transparent"
          />
        </svg>
        <span className={`absolute text-[9px] font-mono font-bold ${
          isTargetMet 
            ? 'text-emerald-500 dark:text-emerald-400' 
            : isDarkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {isTargetMet ? '✓' : `${percentage}%`}
        </span>
      </div>

      <div className="text-right">
        <span className={`text-[11px] font-mono font-bold block ${
          isTargetMet 
            ? 'text-emerald-600 dark:text-emerald-400' 
            : isDarkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {currentWords} / {targetWords} words
        </span>
        {label && (
          <span className="text-[9px] text-slate-500 block uppercase font-mono">
            {isTargetMet ? 'Target Met' : `${targetWords - currentWords} left`}
          </span>
        )}
      </div>
    </div>
  );
};

export const RiskForm: React.FC<RiskFormProps> = ({
  currentRisk,
  allRisks,
  activeRiskIndex,
  onSelectRiskIndex,
  onAddNewRisk,
  onDeleteCurrentRisk,
  onChange,
  onEvaluateAI,
  isEvaluating,
  onShowToast,
  isDarkMode
}) => {
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const [pastedFields, setPastedFields] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  const handleInputChange = (field: keyof RiskAssessment, value: any) => {
    if (!typingStartTime && typeof value === 'string' && value.length > 0) {
      setTypingStartTime(Date.now());
    }

    if (validationErrors[field] && value.trim()) {
      setValidationErrors(prev => ({ ...prev, [field]: false }));
    }

    onChange({
      ...currentRisk,
      [field]: value,
      updatedAt: new Date().toISOString()
    });
  };

  const handleResetCurrentRisk = () => {
    onChange({
      ...currentRisk,
      riskExample: '',
      cause: '',
      consequences: '',
      fixationDate: new Date().toISOString().split('T')[0],
      occurrenceDate: new Date().toISOString().split('T')[0],
      responsiblePerson: '',
      severity: 3,
      department: 'IT & Cyber',
      resolutionTimeframe: '1 Month',
      mitigationStrategy: '',
      conclusion: '',
      aiAudit: undefined,
      updatedAt: new Date().toISOString()
    });
    setValidationErrors({});
    setIsResetConfirmOpen(false);
    onShowToast(`Cleared Risk #${activeRiskIndex + 1} fields back to blank placeholders.`, 'info');
  };

  const notifyPasteAttempt = (fieldName: string) => {
    setPastedFields(prev => ({ ...prev, [fieldName]: true }));
    onShowToast(
      `Handwriting protection active! Copy/paste/cut/drop events are disabled for '${fieldName}' to enforce original student writing.`,
      'warning'
    );
  };

  const validateAndSubmitAI = () => {
    const errors: Record<string, boolean> = {};

    if (!currentRisk.riskExample?.trim()) errors.riskExample = true;
    if (!currentRisk.cause?.trim()) errors.cause = true;
    if (!currentRisk.consequences?.trim()) errors.consequences = true;
    if (!currentRisk.mitigationStrategy?.trim()) errors.mitigationStrategy = true;
    if (!currentRisk.conclusion?.trim()) errors.conclusion = true;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      onShowToast(
        'Please complete all required fields including Risk Influence/Consequences before requesting an AI audit.',
        'warning'
      );
      return;
    }

    setValidationErrors({});
    onEvaluateAI();
  };

  const causeWords = countWords(currentRisk.cause || '');
  const consequencesWords = countWords(currentRisk.consequences || '');
  const mitigationWords = countWords(currentRisk.mitigationStrategy || '');
  const conclusionWords = countWords(currentRisk.conclusion || '');

  return (
    <div className="space-y-6">

      {/* Multi-Risk Selector Strip */}
      <div className={`p-4 border rounded-2xl space-y-3 transition-colors ${
        isDarkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-cyan-500" />
            <span className="text-sm font-bold font-display">Student Risk Item List ({allRisks.length} Registered)</span>
            <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
              isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
            }`}>
              Risk #{activeRiskIndex + 1} Selected
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className={`px-3 py-1.5 border rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/30' 
                  : 'bg-slate-100 border-slate-200 text-amber-700 hover:bg-amber-50'
              }`}
              title="Reset current risk entry to blank placeholders"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>

            {allRisks.length > 1 && (
              <button
                type="button"
                onClick={onDeleteCurrentRisk}
                className="px-2.5 py-1.5 text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                title="Delete current risk item"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              type="button"
              onClick={onAddNewRisk}
              className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Risk ({allRisks.length + 1})</span>
            </button>
          </div>
        </div>

        {/* Scrollable Risk Badges Row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {allRisks.map((risk, idx) => {
            const isSelected = idx === activeRiskIndex;
            const sevLvl = (risk.severity || 3) as SeverityLevel;
            const cfg = SEVERITY_CONFIG[sevLvl] || SEVERITY_CONFIG[3];
            return (
              <button
                key={risk.id || idx}
                type="button"
                onClick={() => onSelectRiskIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all border flex items-center gap-2 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-400/40 shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30'
                    : isDarkMode
                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Risk #{idx + 1}</span>
                <span className={`text-[9.5px] px-2 py-0.5 rounded-md font-mono font-bold border transition-colors ${
                  isSelected
                    ? 'bg-slate-950/90 text-cyan-200 border-cyan-400/30 shadow-sm'
                    : `${cfg.bg} ${cfg.color} ${cfg.border}`
                }`}>
                  Lvl {sevLvl} · {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Form Box */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-6 transition-colors ${
        isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Student Metadata Header */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div>
            <label className={`block text-xs font-mono font-semibold uppercase mb-1 flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <User className="w-3.5 h-3.5 text-cyan-500" />
              <span>Student Name / Full Name</span>
            </label>
            <input
              type="text"
              placeholder="e.g. John Doe / Name Surname"
              value={currentRisk.studentName || ''}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-mono font-semibold uppercase mb-1 flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
              <span>Course Title / Study Group</span>
            </label>
            <input
              type="text"
              placeholder="e.g. CS-408 / Enterprise Risk Management"
              value={currentRisk.studentGroup || ''}
              onChange={(e) => handleInputChange('studentGroup', e.target.value)}
              className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-mono font-semibold uppercase mb-1 flex items-center gap-1.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              <Hash className="w-3.5 h-3.5 text-amber-500" />
              <span>Risk ID (Risk #{activeRiskIndex + 1})</span>
            </label>
            <div className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono font-bold flex items-center justify-between ${
              isDarkMode ? 'bg-slate-950/60 border-slate-800/80 text-cyan-400' : 'bg-slate-100 border-slate-200 text-cyan-700'
            }`}>
              <span>{currentRisk.id || `RISK-2026-${activeRiskIndex + 1}`}</span>
              <span className={`text-[10px] uppercase font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Item #{activeRiskIndex + 1}</span>
            </div>
          </div>
        </div>

        {/* 1. Core Risk Registration Section */}
        <div className="space-y-4">
          <h3 className={`text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 ${
            isDarkMode ? 'text-slate-200' : 'text-slate-800'
          }`}>
            <ShieldAlert className="w-4 h-4 text-cyan-500" />
            <span>1. Risk Identification & Classification (Risk #{activeRiskIndex + 1})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Risk Example / Description */}
            <div className="md:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Risk Example / Description <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Unencrypted S3 Bucket Data Exposure during API Deployment..."
                value={currentRisk.riskExample || ''}
                onChange={(e) => handleInputChange('riskExample', e.target.value)}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  validationErrors.riskExample 
                    ? 'border-rose-500 ring-2 ring-rose-500/20' 
                    : 'focus:border-cyan-500'
                } ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {validationErrors.riskExample && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> Risk Example / Description is required.
                </p>
              )}
            </div>

            {/* Root Cause & Origin Factors */}
            <div className="md:col-span-2 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Root Cause & Origin Factors <span className="text-rose-500">*</span>
                </label>
                <WordProgressRing
                  currentWords={causeWords}
                  targetWords={15}
                  label="Target"
                  isDarkMode={isDarkMode}
                />
              </div>
              <input
                type="text"
                placeholder="e.g. Bypassed code peer-review pipeline during emergency hotfix release..."
                value={currentRisk.cause || ''}
                onChange={(e) => handleInputChange('cause', e.target.value)}
                {...createAntiPasteHandlers('cause', { onAttemptedPaste: () => notifyPasteAttempt('Root Cause') })}
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors ${
                  validationErrors.cause 
                    ? 'border-rose-500 ring-2 ring-rose-500/20' 
                    : 'focus:border-cyan-500'
                } ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {validationErrors.cause && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> Root Cause is required.
                </p>
              )}
            </div>

            {/* FIELD: Influence / Consequences with Anti-Copy/Paste/Cut/Drop & Progress Ring */}
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>Risk Influence / Consequences</span>
                  <span className="text-rose-500">*</span>
                </label>
                <WordProgressRing
                  currentWords={consequencesWords}
                  targetWords={20}
                  label="Target"
                  isDarkMode={isDarkMode}
                />
              </div>

              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="Describe the potential negative impact, consequences, or influence if this risk occurs (copy/paste/cut/drop disabled)..."
                  value={currentRisk.consequences || ''}
                  onChange={(e) => handleInputChange('consequences', e.target.value)}
                  {...createAntiPasteHandlers('consequences', { onAttemptedPaste: () => notifyPasteAttempt('Influence / Consequences') })}
                  className={`w-full border rounded-xl p-3 text-sm focus:outline-none transition-colors resize-y ${
                    validationErrors.consequences 
                      ? 'border-rose-500 ring-2 ring-rose-500/20' 
                      : 'focus:border-cyan-500'
                  } ${
                    isDarkMode 
                      ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                  }`}
                />
                {pastedFields['Influence / Consequences'] && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] rounded font-mono font-bold">
                    Paste Blocked
                  </div>
                )}
              </div>
              {consequencesWords < 20 && consequencesWords > 0 && (
                <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  💡 <span className="font-semibold">Tip:</span> Detail specific financial, operational, or reputational impacts for higher AI audit score.
                </p>
              )}
              {validationErrors.consequences && (
                <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" /> Risk Influence / Consequences is required.
                </p>
              )}
            </div>

            {/* Fixation Date */}
            <div>
              <label className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Fixation Date (Discovered)</span>
              </label>
              <input
                type="date"
                value={currentRisk.fixationDate || ''}
                onChange={(e) => handleInputChange('fixationDate', e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Occurrence Date */}
            <div>
              <label className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Occurrence Date (Manifested)</span>
              </label>
              <input
                type="date"
                value={currentRisk.occurrenceDate || ''}
                onChange={(e) => handleInputChange('occurrenceDate', e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Responsible Person */}
            <div>
              <label className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Who is Responsible? (Person/Role)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chief Information Security Officer / Infrastructure Lead"
                value={currentRisk.responsiblePerson || ''}
                onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Assigned Department */}
            <div>
              <label className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Building2 className="w-3.5 h-3.5 text-purple-500" />
                <span>Assigned Department</span>
              </label>
              <select
                value={currentRisk.department || 'IT & Cyber'}
                onChange={(e) => handleInputChange('department', e.target.value as Department)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution Timeframe */}
            <div>
              <label className={`block text-xs font-medium mb-1 flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                <span>Resolution Timeframe Urgency</span>
              </label>
              <select
                value={currentRisk.resolutionTimeframe || '1 Month'}
                onChange={(e) => handleInputChange('resolutionTimeframe', e.target.value as ResolutionTimeframe)}
                className={`w-full border rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-cyan-500 transition-colors ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white' 
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>
                    {tf}
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Rating Selector */}
            <div>
              <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Risk Importance / Severity Level (1 to 5)
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {([1, 2, 3, 4, 5] as SeverityLevel[]).map((lvl) => {
                  const cfg = SEVERITY_CONFIG[lvl];
                  const isSelected = currentRisk.severity === lvl;
                  return (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => handleInputChange('severity', lvl)}
                      className={`p-2 rounded-xl text-center transition-all border ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} ring-2 ring-cyan-500/50 scale-105 font-bold`
                          : isDarkMode
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`text-sm font-bold font-mono ${isSelected ? cfg.color : isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        Lvl {lvl}
                      </div>
                      <div className="text-[10px] font-medium truncate mt-0.5">
                        {cfg.label}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                <span className={`font-semibold ${SEVERITY_CONFIG[currentRisk.severity || 3].color}`}>
                  {SEVERITY_CONFIG[currentRisk.severity || 3].label}:
                </span>{' '}
                {SEVERITY_CONFIG[currentRisk.severity || 3].desc}
              </p>
            </div>

          </div>
        </div>

        {/* 2. Handwritten Mitigation Strategy & Conclusion */}
        <div className={`space-y-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 ${
              isDarkMode ? 'text-slate-200' : 'text-slate-800'
            }`}>
              <Keyboard className="w-4 h-4 text-cyan-500" />
              <span>2. Handwritten Student Mitigation & Conclusion</span>
            </h3>

            <div className={`flex items-center gap-3 text-xs font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>Writing Verified</span>
              </span>
              <span>·</span>
              <span>{mitigationWords + conclusionWords} words typed</span>
            </div>
          </div>

          {/* Mitigation Strategy Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>How to Resolve / Mitigate the Risk? (Mitigation Strategy)</span>
                <span className="text-rose-500">*</span>
              </label>
              <WordProgressRing
                currentWords={mitigationWords}
                targetWords={25}
                label="Target"
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="relative">
              <textarea
                rows={4}
                placeholder="Write your mitigation steps in your own words (copying/pasting/cutting/dropping disabled)..."
                value={currentRisk.mitigationStrategy || ''}
                onChange={(e) => handleInputChange('mitigationStrategy', e.target.value)}
                {...createAntiPasteHandlers('mitigationStrategy', { onAttemptedPaste: () => notifyPasteAttempt('Mitigation Strategy') })}
                className={`w-full border rounded-xl p-3.5 text-sm focus:outline-none transition-colors resize-y ${
                  validationErrors.mitigationStrategy 
                    ? 'border-rose-500 ring-2 ring-rose-500/20' 
                    : 'focus:border-cyan-500'
                } ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {pastedFields['Mitigation Strategy'] && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] rounded font-mono font-bold">
                  Paste Blocked
                </div>
              )}
            </div>
            {mitigationWords < 25 && mitigationWords > 0 && (
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                💡 <span className="font-semibold">Tip:</span> Specify technical controls, responsible owners, and verification checkpoints.
              </p>
            )}
            {validationErrors.mitigationStrategy && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> Mitigation Strategy is required.
              </p>
            )}
          </div>

          {/* Conclusion / Synthesis Report */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className={`font-medium flex items-center gap-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <span>Written Conclusion & Synthesis Report</span>
                <span className="text-rose-500">*</span>
              </label>
              <WordProgressRing
                currentWords={conclusionWords}
                targetWords={30}
                label="Target"
                isDarkMode={isDarkMode}
              />
            </div>

            <div className="relative">
              <textarea
                rows={3}
                placeholder="Write your overall conclusions, tradeoffs, and long-term takeaways in your own words..."
                value={currentRisk.conclusion || ''}
                onChange={(e) => handleInputChange('conclusion', e.target.value)}
                {...createAntiPasteHandlers('conclusion', { onAttemptedPaste: () => notifyPasteAttempt('Conclusion & Synthesis') })}
                className={`w-full border rounded-xl p-3.5 text-sm focus:outline-none transition-colors resize-y ${
                  validationErrors.conclusion 
                    ? 'border-rose-500 ring-2 ring-rose-500/20' 
                    : 'focus:border-cyan-500'
                } ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              {pastedFields['Conclusion & Synthesis'] && (
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-[10px] rounded font-mono font-bold">
                  Paste Blocked
                </div>
              )}
            </div>
            {conclusionWords < 30 && conclusionWords > 0 && (
              <p className={`text-[11px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                💡 <span className="font-semibold">Tip:</span> Summarize organizational trade-offs and lessons learned for full marks.
              </p>
            )}
            {validationErrors.conclusion && (
              <p className="text-[11px] text-rose-500 mt-0.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> Written Conclusion & Synthesis Report is required.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className={`pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${
          isDarkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className={`text-xs font-mono flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <span>Draft saved locally (Risk #{activeRiskIndex + 1})</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={validateAndSubmitAI}
              disabled={isEvaluating}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl shadow-lg transition-all w-full sm:w-auto ${
                isEvaluating
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20 active:scale-95'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isEvaluating ? 'animate-spin' : ''}`} />
              <span>{isEvaluating ? 'Auditing with Gemini 3.8...' : 'Request AI Audit'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 ${
            isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold font-display">Reset Risk #{activeRiskIndex + 1}?</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Are you sure you want to clear this risk entry? All fields will be reset to blank placeholders.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  isDarkMode ? 'border-slate-800 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResetCurrentRisk}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-rose-600/20"
              >
                Yes, Clear Risk #{activeRiskIndex + 1}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
