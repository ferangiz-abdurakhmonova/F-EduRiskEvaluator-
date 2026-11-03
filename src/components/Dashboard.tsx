import React, { useState } from 'react';
import { RiskAssessment } from '../types/risk';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, CartesianGrid 
} from 'recharts';
import { 
  ShieldAlert, AlertTriangle, Layers, Building2, Clock, Award, Trash2, Eye, Filter, Plus 
} from 'lucide-react';

interface DashboardProps {
  risks: RiskAssessment[];
  activeRiskId: string;
  onSelectRisk: (id: string) => void;
  onDeleteRisk: (id: string) => void;
  onNewRisk: () => void;
  isDarkMode: boolean;
}

const DEPARTMENT_COLORS: Record<string, string> = {
  'IT & Cyber': '#38BDF8',
  'Finance': '#3B82F6',
  'Operations': '#F59E0B',
  'HR': '#10B981',
  'Legal & Compliance': '#A855F7',
  'R&D': '#EC4899'
};

const SEVERITY_COLORS: Record<number, string> = {
  1: '#10B981',
  2: '#3B82F6',
  3: '#F59E0B',
  4: '#F97316',
  5: '#F43F5E'
};

const TIMEFRAME_MAP: Record<string, number> = {
  'Immediate (<24h)': 1,
  '1 Week': 2,
  '1 Month': 3,
  '1 Quarter': 4,
  'Long Term': 5
};

export const Dashboard: React.FC<DashboardProps> = ({
  risks,
  activeRiskId,
  onSelectRisk,
  onDeleteRisk,
  onNewRisk,
  isDarkMode
}) => {
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const getSeverityTagConfig = (severity: number = 3) => {
    switch (severity) {
      case 1:
        return {
          label: 'Low',
          colorClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
        };
      case 2:
        return {
          label: 'Moderate',
          colorClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30'
        };
      case 3:
        return {
          label: 'Substantial',
          colorClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        };
      case 4:
        return {
          label: 'High',
          colorClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
        };
      case 5:
      default:
        return {
          label: 'Critical',
          colorClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
        };
    }
  };

  const renderSeverityTag = (severity: number = 3) => {
    const cfg = getSeverityTagConfig(severity);
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${cfg.colorClass}`}>
        <span>Lvl {severity}</span>
        <span className="opacity-40">·</span>
        <span>{cfg.label}</span>
      </span>
    );
  };

  const filteredRisks = risks.filter(r => {
    if (selectedDeptFilter !== 'All' && r.department !== selectedDeptFilter) return false;
    if (selectedSeverityFilter !== 'All' && r.severity.toString() !== selectedSeverityFilter) return false;
    return true;
  });

  const totalRisks = risks.length;
  const criticalRisksCount = risks.filter(r => r.severity >= 4).length;
  const avgSeverity = totalRisks > 0 
    ? (risks.reduce((acc, r) => acc + r.severity, 0) / totalRisks).toFixed(1) 
    : '0.0';

  const auditedRisks = risks.filter(r => r.aiAudit?.score !== undefined);
  const avgAIScore = auditedRisks.length > 0 
    ? (auditedRisks.reduce((acc, r) => acc + (r.aiAudit?.score || 0), 0) / auditedRisks.length).toFixed(1)
    : 'N/A';

  const deptCounts: Record<string, number> = {};
  risks.forEach(r => {
    if (r.department) {
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
    }
  });
  const pieData = Object.keys(deptCounts).map(dept => ({
    name: dept,
    value: deptCounts[dept]
  }));

  const timeframeCounts: Record<string, number> = {
    'Immediate (<24h)': 0,
    '1 Week': 0,
    '1 Month': 0,
    '1 Quarter': 0,
    'Long Term': 0
  };
  risks.forEach(r => {
    if (r.resolutionTimeframe) {
      timeframeCounts[r.resolutionTimeframe] = (timeframeCounts[r.resolutionTimeframe] || 0) + 1;
    }
  });
  const timeframeBarData = Object.keys(timeframeCounts).map(tf => ({
    name: tf.split(' ')[0],
    fullName: tf,
    count: timeframeCounts[tf]
  }));

  const severityCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  risks.forEach(r => {
    if (r.severity) {
      severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1;
    }
  });
  const severityBarData = [1, 2, 3, 4, 5].map(lvl => ({
    severity: `Lvl ${lvl}`,
    count: severityCounts[lvl],
    level: lvl
  }));

  const scatterData = risks.map(r => ({
    id: r.id,
    title: r.riskExample || 'Untitled Risk',
    x: TIMEFRAME_MAP[r.resolutionTimeframe] || 3,
    y: r.severity || 3,
    z: 100,
    department: r.department
  }));

  const cardStyle = isDarkMode
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200 text-slate-900 shadow-sm';

  const gridLineColor = isDarkMode ? '#1e293b' : '#e2e8f0';
  const axisTextColor = isDarkMode ? '#64748b' : '#475569';

  return (
    <div className="space-y-6">
      
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Total Risks</span>
            <Layers className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono">
            {totalRisks}
          </div>
          <p className="text-[11px] text-slate-400">Registered in session</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Critical Risks</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-rose-500">
            {criticalRisksCount}
          </div>
          <p className="text-[11px] text-slate-400">Severity Level 4 & 5</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Avg Severity</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-500">
            {avgSeverity} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[11px] text-slate-400">Importance index</p>
        </div>

        <div className={`border rounded-2xl p-5 space-y-2 ${cardStyle}`}>
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono font-bold uppercase">Avg AI Grade</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-500">
            {avgAIScore} <span className="text-xs font-normal text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400">Evaluated by Gemini 3.8</p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Heatmap / Scatter Matrix */}
        <div className={`border rounded-2xl p-5 space-y-4 ${cardStyle}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-500" />
              <span>Risk Matrix: Severity vs Resolution Urgency</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Heatmap</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Timeframe" 
                  domain={[0, 6]} 
                  ticks={[1, 2, 3, 4, 5]} 
                  tickFormatter={(val) => ['Immediate', '1 Wk', '1 Mo', '1 Qtr', 'Long'][val - 1] || ''}
                  stroke={axisTextColor} 
                  fontSize={11}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Severity" 
                  domain={[0, 6]} 
                  ticks={[1, 2, 3, 4, 5]} 
                  tickFormatter={(val) => `Lvl ${val}`}
                  stroke={axisTextColor} 
                  fontSize={11}
                />
                <ZAxis type="number" dataKey="z" range={[100, 300]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className={`p-2.5 rounded-lg shadow-xl text-xs space-y-1 max-w-xs border ${
                          isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                        }`}>
                          <p className="font-bold leading-tight">{data.title}</p>
                          <p className="text-slate-500">Department: <span className="text-cyan-600 font-bold">{data.department}</span></p>
                          <p className="text-slate-500">Severity: <span className="text-rose-500 font-bold">Level {data.y}</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.y] || '#38BDF8'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
            <span>← High Urgency (Immediate)</span>
            <span>Low Urgency (Long Term) →</span>
          </div>
        </div>

        {/* Chart 2: Department Distribution Pie */}
        <div className={`border rounded-2xl p-5 space-y-4 ${cardStyle}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500" />
              <span>Risk Concentration by Department</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Department Profile</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={DEPARTMENT_COLORS[entry.name] || '#38BDF8'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#090d16' : '#ffffff', 
                      borderColor: isDarkMode ? '#1e293b' : '#cbd5e1', 
                      borderRadius: '8px', 
                      color: isDarkMode ? '#fff' : '#000', 
                      fontSize: '12px' 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-400">No risks registered yet</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center text-xs">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DEPARTMENT_COLORS[entry.name] }}></span>
                <span>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Timeframe Resolution Urgency Bar */}
        <div className={`border rounded-2xl p-5 space-y-4 ${cardStyle}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Resolution Timeframe Breakdown</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Urgency Profile</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeframeBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                <XAxis dataKey="name" stroke={axisTextColor} fontSize={11} />
                <YAxis stroke={axisTextColor} fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#090d16' : '#ffffff', 
                    borderColor: isDarkMode ? '#1e293b' : '#cbd5e1', 
                    borderRadius: '8px', 
                    color: isDarkMode ? '#fff' : '#000', 
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Severity Bar Chart */}
        <div className={`border rounded-2xl p-5 space-y-4 ${cardStyle}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Severity Level Distribution (1 to 5)</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Impact Rating</span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridLineColor} />
                <XAxis dataKey="severity" stroke={axisTextColor} fontSize={11} />
                <YAxis stroke={axisTextColor} fontSize={11} allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#090d16' : '#ffffff', 
                    borderColor: isDarkMode ? '#1e293b' : '#cbd5e1', 
                    borderRadius: '8px', 
                    color: isDarkMode ? '#fff' : '#000', 
                    fontSize: '12px' 
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {severityBarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Interactive Risk Assessment Registry */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 ${cardStyle}`}>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-display">Risk Assessment Registry</h3>
            <p className="text-xs text-slate-400 mt-0.5">Click any record to inspect, view AI audit grades, or update strategy.</p>
          </div>

          {/* Filter Bar & View Toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 border rounded-lg p-0.5 text-xs font-mono bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table View
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <Filter className="w-3.5 h-3.5 text-cyan-500" />
              <span className="text-slate-400">Dept:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className={`border rounded-lg px-2.5 py-1 text-xs focus:outline-none ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              >
                <option value="All">All Departments</option>
                {Object.keys(DEPARTMENT_COLORS).map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <button
              onClick={onNewRisk}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Risk</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Cards View */}
        {viewMode === 'cards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {filteredRisks.length > 0 ? (
              filteredRisks.map((risk) => {
                const isSelected = risk.id === activeRiskId;
                return (
                  <div
                    key={risk.id}
                    className={`border rounded-xl p-4 space-y-3 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30'
                          : 'bg-cyan-50/80 border-cyan-400 ring-1 ring-cyan-400/30'
                        : isDarkMode
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      {/* Card Header: Risk ID & Severity Tag */}
                      <div className="flex items-center justify-between gap-2 border-b pb-2 border-slate-200 dark:border-slate-800/80">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 font-mono text-[10px] font-bold">
                            {risk.id}
                          </span>
                          {renderSeverityTag(risk.severity)}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onSelectRisk(risk.id)}
                            className="p-1 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Inspect/Edit Risk"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRisk(risk.id)}
                            className="p-1 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Risk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Risk Title */}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                        {risk.riskExample || 'Untitled Risk'}
                      </h4>

                      {/* Card Details */}
                      <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
                        <p><span className="text-slate-700 dark:text-slate-300 font-semibold">Dept:</span> {risk.department || 'Unassigned'}</p>
                        <p><span className="text-slate-700 dark:text-slate-300 font-semibold">Timeframe:</span> {risk.resolutionTimeframe || '1 Month'}</p>
                        <p><span className="text-slate-700 dark:text-slate-300 font-semibold">Responsible:</span> {risk.responsiblePerson || 'Unassigned'}</p>
                      </div>
                    </div>

                    {/* Card Footer: AI Grade & Select CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs font-mono">
                      <div>
                        {risk.aiAudit?.score !== undefined ? (
                          <span className={`font-bold ${risk.aiAudit.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            AI: {risk.aiAudit.score}/10
                          </span>
                        ) : (
                          <span className="text-slate-400">AI: Pending</span>
                        )}
                      </div>

                      <button
                        onClick={() => onSelectRisk(risk.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-colors"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-slate-400 text-xs">
                No risk assessments match the selected filter.
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-mono uppercase tracking-wider ${
                  isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                }`}>
                  <th className="py-3 px-3">Severity Tag</th>
                  <th className="py-3 px-3">Risk Example Title</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Timeframe</th>
                  <th className="py-3 px-3">Responsible</th>
                  <th className="py-3 px-3">AI Grade</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800/60' : 'divide-slate-200'}`}>
                {filteredRisks.length > 0 ? (
                  filteredRisks.map((risk) => {
                    const isSelected = risk.id === activeRiskId;
                    return (
                      <tr 
                        key={risk.id} 
                        className={`transition-colors ${
                          isSelected 
                            ? isDarkMode ? 'bg-cyan-500/10' : 'bg-cyan-50' 
                            : isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono">
                          {renderSeverityTag(risk.severity)}
                        </td>

                        <td className="py-3 px-3 font-medium max-w-xs truncate">
                          <div className="flex items-center gap-2">
                            <span>{risk.riskExample || 'Untitled Risk'}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {risk.department || 'Unassigned'}
                        </td>

                        <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {risk.resolutionTimeframe || '1 Month'}
                        </td>

                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                          {risk.responsiblePerson || 'Unassigned'}
                        </td>

                        <td className="py-3 px-3 font-mono">
                          {risk.aiAudit?.score !== undefined ? (
                            <span className={`font-bold ${risk.aiAudit.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                              {risk.aiAudit.score}/10
                            </span>
                          ) : (
                            <span className="text-slate-400">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            onClick={() => onSelectRisk(risk.id)}
                            className="p-1.5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                            title="Inspect/Edit"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRisk(risk.id)}
                            className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Risk"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No risk assessments match the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
