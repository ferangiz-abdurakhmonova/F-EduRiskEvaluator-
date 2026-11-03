import React from 'react';
import { PRESET_SCENARIOS, ScenarioTemplate } from '../types/risk';
import { BookOpen, X, ArrowRight, ShieldAlert, Cpu, DollarSign, Scale, Layers } from 'lucide-react';

interface ScenarioSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: ScenarioTemplate) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'IT & Cyber Security': <Cpu className="w-4 h-4 text-cyan-400" />,
  'Operations & Procurement': <Layers className="w-4 h-4 text-amber-400" />,
  'Financial Risk': <DollarSign className="w-4 h-4 text-emerald-400" />,
  'Legal & Regulatory': <Scale className="w-4 h-4 text-purple-400" />
};

export const ScenarioSelectorModal: React.FC<ScenarioSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectScenario
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Classroom Lecture Scenarios</h3>
            <p className="text-xs text-slate-400">
              Select a pre-loaded enterprise scenario to test risk registration and Gemini AI auditing.
            </p>
          </div>
        </div>

        {/* Scenarios Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESET_SCENARIOS.map((scenario, index) => (
            <div
              key={index}
              onClick={() => {
                onSelectScenario(scenario);
                onClose();
              }}
              className="p-4 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40 group space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    {CATEGORY_ICONS[scenario.category] || <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />}
                    <span>{scenario.category}</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                    Lvl {scenario.data.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-display group-hover:text-cyan-300 transition-colors">
                  {scenario.title}
                </h4>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {scenario.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Load Scenario Data</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
