import React from 'react';
import { ShieldAlert, BarChart3, FileEdit, Sparkles, BookOpen, Download, Sun, Moon, Users, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: 'form' | 'dashboard' | 'classroom';
  setActiveTab: (tab: 'form' | 'dashboard' | 'classroom') => void;
  onNewRisk: () => void;
  onOpenSubmissionModal: () => void;
  onOpenRoomModal: () => void;
  hasActiveRisk: boolean;
  aiScore?: number;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  roomCode: string;
  activeStudentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onNewRisk,
  onOpenSubmissionModal,
  onOpenRoomModal,
  hasActiveRisk,
  aiScore,
  isDarkMode,
  onToggleTheme,
  roomCode,
  activeStudentsCount
}) => {
  return (
    <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${
      isDarkMode 
        ? 'bg-slate-950/90 border-slate-800 text-white' 
        : 'bg-white/90 border-slate-200 text-slate-900 shadow-sm'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <a href="#" className="flex items-center gap-2.5 group text-lg font-bold tracking-tight whitespace-nowrap shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className={`font-display font-extrabold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  F-Edu<span className="text-[#008ca8] dark:text-[#38bdf8]">RiskEvaluator</span>
                </span>
                <span className={`text-[10px] uppercase font-mono tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Academic Training & Risk Simulation Platform
                </span>
              </div>
            </a>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className={`hidden md:flex items-center gap-1 p-1 rounded-xl border shrink-0 ${
            isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'form'
                  ? isDarkMode 
                    ? 'bg-[#008ca8]/15 text-cyan-300 border border-[#008ca8]/30 shadow-sm font-bold' 
                    : 'bg-white text-[#008ca8] shadow-sm border border-slate-200 font-extrabold'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Assessment Form</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? isDarkMode 
                    ? 'bg-[#008ca8]/15 text-cyan-300 border border-[#008ca8]/30 shadow-sm font-bold' 
                    : 'bg-white text-[#008ca8] shadow-sm border border-slate-200 font-extrabold'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('classroom')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'classroom'
                  ? isDarkMode 
                    ? 'bg-[#008ca8]/15 text-cyan-300 border border-[#008ca8]/30 shadow-sm font-bold' 
                    : 'bg-white text-[#008ca8] shadow-sm border border-slate-200 font-extrabold'
                  : isDarkMode
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Live Class Stream</span>
            </button>
          </nav>

          {/* Zone 3: Actions, Room Badge, Theme Toggle & Submission */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Room PIN Badge */}
            <button
              onClick={onOpenRoomModal}
              className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-mono font-bold transition-all ${
                isDarkMode 
                  ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:border-cyan-500/40' 
                  : 'bg-slate-100 border-slate-200 text-[#008ca8] hover:bg-slate-200'
              }`}
              title="Click to manage Classroom Room PIN"
            >
              <Users className="w-3.5 h-3.5 text-emerald-500" />
              <span>{roomCode}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span className="text-[10px] text-slate-500">({activeStudentsCount})</span>
            </button>

            {/* Light / Dark Mode Toggle Button */}
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode
                  ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {aiScore !== undefined && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-xs font-mono ${
                isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Grade:</span>
                <span className={`font-bold ${aiScore >= 8 ? 'text-emerald-600 dark:text-emerald-400' : aiScore >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {aiScore}/10
                </span>
              </div>
            )}

            <button
              onClick={onOpenSubmissionModal}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report PDF</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
