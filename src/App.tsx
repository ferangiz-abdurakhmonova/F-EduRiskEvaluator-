import React, { useState, useEffect, useRef } from 'react';
import { RiskAssessment, ScenarioTemplate } from './types/risk';
import { Navbar } from './components/Navbar';
import { RiskForm } from './components/RiskForm';
import { AIAuditCard } from './components/AIAuditCard';
import { Dashboard } from './components/Dashboard';
import { PDFReportView } from './components/PDFReportView';
import { SubmissionModal } from './components/SubmissionModal';
import { ClassroomRoomModal } from './components/ClassroomRoomModal';
import { ClassroomLiveDashboard } from './components/ClassroomLiveDashboard';
import { useRealtimeRoom } from './hooks/useRealtimeRoom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export default function App() {
  const STORAGE_KEY = 'student_risk_assessments_v4';

  // Light Theme active by default (isDarkMode = false)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Classroom Room State
  const [roomCode, setRoomCode] = useState<string>('LECTURE-408');
  const [studentId] = useState<string>(() => {
    try {
      const savedId = localStorage.getItem('student_tracker_id_v1');
      if (savedId) return savedId;
      const newId = `STD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      localStorage.setItem('student_tracker_id_v1', newId);
      return newId;
    } catch (e) {
      return `STD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    }
  });

  // Blank risk creator helper
  const createBlankRisk = (indexNumber: number = 1): RiskAssessment => ({
    id: `RISK-2026-${String(indexNumber).padStart(3, '0')}`,
    studentName: '',
    studentGroup: '',
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [risks, setRisks] = useState<RiskAssessment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load from local storage', e);
    }
    return [createBlankRisk(1)];
  });

  const [activeRiskIndex, setActiveRiskIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard' | 'classroom'>('form');

  // Real-time Cloud Firestore & Fallback Sync Hook
  const currentStudentName = risks[0]?.studentName || '';
  const currentStudentGroup = risks[0]?.studentGroup || '';

  const { activePeers, syncNow } = useRealtimeRoom({
    roomCode,
    studentId,
    studentName: currentStudentName,
    studentGroup: currentStudentGroup,
    risks
  });

  // Modals & States
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState<boolean>(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState<boolean>(false);

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'warning' | 'success' | 'info' } | null>(null);

  const pdfReportRef = useRef<HTMLDivElement | null>(null);

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(risks));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }, [risks]);

  // Toggle body dark class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Ensure activeRiskIndex stays in bounds
  const safeActiveIndex = Math.min(Math.max(0, activeRiskIndex), Math.max(0, risks.length - 1));
  const currentRisk = risks[safeActiveIndex] || risks[0] || createBlankRisk(1);

  const showToast = (message: string, type: 'warning' | 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleUpdateCurrentRisk = (updated: RiskAssessment) => {
    setRisks(prev => {
      const copy = [...prev];
      copy[safeActiveIndex] = updated;
      return copy;
    });
  };

  const handleCreateNewRisk = () => {
    const nextNumber = risks.length + 1;
    const newRisk: RiskAssessment = {
      ...createBlankRisk(nextNumber),
      studentName: currentRisk.studentName || '',
      studentGroup: currentRisk.studentGroup || ''
    };

    setRisks(prev => [...prev, newRisk]);
    setActiveRiskIndex(risks.length);
    setActiveTab('form');
    showToast(`Risk Item #${nextNumber} added to assessment!`, 'success');
  };

  const handleDeleteCurrentRisk = () => {
    if (risks.length <= 1) {
      showToast('Cannot delete the last remaining risk assessment.', 'warning');
      return;
    }
    const filtered = risks.filter((_, idx) => idx !== safeActiveIndex);
    setRisks(filtered);
    setActiveRiskIndex(Math.max(0, safeActiveIndex - 1));
    showToast('Risk item deleted.', 'info');
  };

  const handleDeleteRiskById = (id: string) => {
    if (risks.length <= 1) {
      showToast('Cannot delete the last remaining risk assessment.', 'warning');
      return;
    }
    const filtered = risks.filter(r => r.id !== id);
    setRisks(filtered);
    if (safeActiveIndex >= filtered.length) {
      setActiveRiskIndex(Math.max(0, filtered.length - 1));
    }
    showToast('Risk item deleted.', 'info');
  };

  const handleSelectScenario = (scenario: ScenarioTemplate) => {
    const updatedRisk: RiskAssessment = {
      ...currentRisk,
      riskExample: scenario.data.riskExample,
      cause: scenario.data.cause,
      consequences: scenario.data.consequences,
      fixationDate: scenario.data.fixationDate,
      occurrenceDate: scenario.data.occurrenceDate,
      responsiblePerson: scenario.data.responsiblePerson,
      severity: scenario.data.severity,
      department: scenario.data.department,
      resolutionTimeframe: scenario.data.resolutionTimeframe,
      mitigationStrategy: scenario.data.mitigationStrategy,
      conclusion: scenario.data.conclusion,
      aiAudit: undefined,
      updatedAt: new Date().toISOString()
    };

    handleUpdateCurrentRisk(updatedRisk);
    showToast(`Loaded lecture scenario: "${scenario.title}"`, 'success');
  };

  // Evaluate Risk with Gemini API on Express Proxy
  const handleEvaluateAI = async () => {
    if (!currentRisk.riskExample || !currentRisk.mitigationStrategy) {
      showToast('Please fill out the Risk Example and Mitigation Strategy before requesting an AI audit.', 'warning');
      return;
    }

    setIsEvaluating(true);
    try {
      const response = await fetch('/api/evaluate-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentRisk)
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'AI Evaluation endpoint error');
      }

      const updatedRisk: RiskAssessment = {
        ...currentRisk,
        aiAudit: data.audit,
        updatedAt: new Date().toISOString()
      };

      handleUpdateCurrentRisk(updatedRisk);
      showToast(`AI Audit complete for Risk #${safeActiveIndex + 1}! Score: ${data.audit.score}/10`, 'success');
    } catch (error: any) {
      console.error('Evaluate AI Error:', error);
      showToast(`AI Audit failed: ${error.message || 'Server error'}`, 'warning');
    } finally {
      setIsEvaluating(false);
    }
  };

  // PDF Download Generator
  const handleDownloadPDF = async () => {
    if (!pdfReportRef.current) return;
    const element = pdfReportRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`Risk_Assessment_${currentRisk.id}.pdf`);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-cyan-500/30 selection:text-cyan-200 ${
      isDarkMode ? 'bg-slate-950 text-slate-100 dark' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 z-50 max-w-md w-full animate-in fade-in slide-in-from-top-4 duration-200">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 ${
            toast.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/90 border-cyan-500/40 text-cyan-200'
          }`}>
            {toast.type === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /> :
             toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> :
             <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewRisk={handleCreateNewRisk}
        onOpenSubmissionModal={() => setIsSubmissionModalOpen(true)}
        onOpenRoomModal={() => setIsRoomModalOpen(true)}
        hasActiveRisk={!!currentRisk}
        aiScore={currentRisk.aiAudit?.score}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        roomCode={roomCode}
        activeStudentsCount={activePeers.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* View Switcher Tabs */}
        <div className={`flex items-center justify-between border-b pb-4 ${
          isDarkMode ? 'border-slate-800/80' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'form'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30'
                  : isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Risk Assessment Form
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30'
                  : isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Analytics Dashboard ({risks.length} Risks)
            </button>

            <button
              onClick={() => setActiveTab('classroom')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'classroom'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 ring-1 ring-cyan-400/30'
                  : isDarkMode ? 'bg-slate-900 text-slate-400 hover:text-white' : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Live Class Stream ({activePeers.length})</span>
            </button>
          </div>

          <div className={`text-xs font-mono hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Room PIN: <span className="text-cyan-600 dark:text-cyan-400 font-bold">{roomCode}</span>
          </div>
        </div>

        {/* Tab 1: Form View & AI Audit */}
        {activeTab === 'form' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Risk Registration Form */}
            <div className="lg:col-span-7 space-y-6">
              <RiskForm
                currentRisk={currentRisk}
                allRisks={risks}
                activeRiskIndex={safeActiveIndex}
                onSelectRiskIndex={(idx) => setActiveRiskIndex(idx)}
                onAddNewRisk={handleCreateNewRisk}
                onDeleteCurrentRisk={handleDeleteCurrentRisk}
                onChange={handleUpdateCurrentRisk}
                onEvaluateAI={handleEvaluateAI}
                isEvaluating={isEvaluating}
                onShowToast={showToast}
                isDarkMode={isDarkMode}
              />
            </div>

            {/* AI Auditor Feedback Panel */}
            <div className="lg:col-span-5 space-y-6">
              <AIAuditCard
                audit={currentRisk.aiAudit}
                onReevaluate={handleEvaluateAI}
                isEvaluating={isEvaluating}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Dashboard Analytics View */}
        {activeTab === 'dashboard' && (
          <Dashboard
            risks={risks}
            activeRiskId={currentRisk.id}
            onSelectRisk={(id) => {
              const idx = risks.findIndex(r => r.id === id);
              if (idx !== -1) setActiveRiskIndex(idx);
              setActiveTab('form');
            }}
            onDeleteRisk={handleDeleteRiskById}
            onNewRisk={handleCreateNewRisk}
            isDarkMode={isDarkMode}
          />
        )}

        {/* Tab 3: Live Classroom Collaboration Stream View */}
        {activeTab === 'classroom' && (
          <ClassroomLiveDashboard
            roomCode={roomCode}
            peers={activePeers}
            onOpenRoomModal={() => setIsRoomModalOpen(true)}
            isDarkMode={isDarkMode}
            onInspectRisk={(inspectedRisk) => {
              const existingIdx = risks.findIndex(r => r.id === inspectedRisk.id);
              if (existingIdx !== -1) {
                setActiveRiskIndex(existingIdx);
              } else {
                setRisks(prev => [...prev, inspectedRisk]);
                setActiveRiskIndex(risks.length);
              }
              setActiveTab('form');
              showToast(`Inspecting risk item: "${inspectedRisk.riskExample || inspectedRisk.id}"`, 'info');
            }}
          />
        )}

      </main>

      {/* Hidden DOM element for offscreen PDF generation */}
      <PDFReportView
        risk={currentRisk}
        refProp={pdfReportRef}
      />

      {/* Submission Modal */}
      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        risk={currentRisk}
        onDownloadPDF={handleDownloadPDF}
        onShowToast={showToast}
        theme={isDarkMode ? 'dark' : 'light'}
      />

      {/* Classroom Room PIN Modal */}
      <ClassroomRoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        roomCode={roomCode}
        onJoinRoom={(newCode) => {
          setRoomCode(newCode);
          showToast(`Joined Classroom Room PIN: ${newCode}`, 'success');
        }}
        activeStudents={activePeers}
        isDarkMode={isDarkMode}
      />

      {/* Footer */}
      <footer className={`border-t py-6 text-center text-xs font-mono ${
        isDarkMode ? 'border-slate-900 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            F-EduRiskEvaluator · Multi-Student Classroom System
          </div>
          <div>
            Powered by Google AI Studio Gemini 3.8 Flash
          </div>
        </div>
      </footer>

    </div>
  );
}
