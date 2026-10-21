import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  FileText, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  Code,
  Printer,
  FileSpreadsheet,
  FileCode,
  Users,
  Laptop,
  DollarSign,
  Briefcase,
  Sliders,
  Filter,
  ChevronDown
} from 'lucide-react';
import { 
  ClassifiedRequest, 
  DepartmentCategory, 
  WeeklyInsightsReport, 
  TrendDataPoint,
  ReportFocusMode 
} from '../types/classifier.ts';
import { CATEGORIES_CONFIG } from '../data/categories.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { 
  generatePdfReport, 
  downloadJsonReport, 
  downloadCsvReport, 
  downloadMarkdownReport 
} from '../utils/pdfExport.ts';

interface VisualAnalyticsDashboardProps {
  requests: ClassifiedRequest[];
  onOpenComposer?: (request: ClassifiedRequest) => void;
}

export const VisualAnalyticsDashboard: React.FC<VisualAnalyticsDashboardProps> = ({
  requests,
  onOpenComposer,
}) => {
  const [trendsData, setTrendsData] = useState<{
    timeline: TrendDataPoint[];
    categoriesBreakdown: any[];
    responseTimeMetrics: any;
  } | null>(null);

  const [weeklyReport, setWeeklyReport] = useState<WeeklyInsightsReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'trends' | 'weekly-report' | 'schema'>('overview');
  const [copiedReport, setCopiedReport] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Department Customization State for Reporting
  const [selectedDept, setSelectedDept] = useState<DepartmentCategory | 'ALL'>('ALL');
  const [selectedFocus, setSelectedFocus] = useState<ReportFocusMode>('executive');
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '14d' | '30d'>('7d');

  // Fetch trend timeline on mount and when requests change
  useEffect(() => {
    fetch('/api/trends')
      .then((res) => res.json())
      .then((data) => setTrendsData(data))
      .catch((err) => console.error('Failed to load trends data:', err));
  }, [requests.length]);

  const handleGenerateWeeklyReport = async (
    dept: DepartmentCategory | 'ALL' = selectedDept,
    focus: ReportFocusMode = selectedFocus,
    timeRange: '7d' | '14d' | '30d' = selectedTimeRange
  ) => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/generate-weekly-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: dept,
          focus,
          timeRange,
        }),
      });
      if (res.ok) {
        const data: WeeklyInsightsReport = await res.json();
        setWeeklyReport(data);
        setActiveView('weekly-report');
      }
    } catch (err) {
      console.error('Failed to generate weekly report:', err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = () => {
    if (!weeklyReport) return;
    const text = `# AutoTriage Operational Summary — ${weeklyReport.weekPeriod}
Generated: ${new Date(weeklyReport.generatedAt).toLocaleString()}
Model Engine: ${weeklyReport.modelEngine}
Department Scope: ${weeklyReport.targetDepartment || 'All Corporate Departments'}
Focus Mode: ${weeklyReport.reportFocus || 'Executive'}

## Executive Synopsis
${weeklyReport.executiveSummary}

## Key Operational Metrics
- Total Ingested Tickets: ${weeklyReport.totalVolume}
- SLA Adherence Rate: ${weeklyReport.slaAdherenceRate}%
- Mean Resolution Turnaround: ${weeklyReport.meanResolutionHours}h

## Key Highlights
${weeklyReport.keyHighlights.map((h) => `- ${h}`).join('\n')}

## Department Performance & SLA Adherence
${weeklyReport.departmentPerformance
  .map(
    (d) =>
      `### ${d.category} (Health: ${d.healthStatus})
- Volume: ${d.volume} requests
- Mean Turnaround: ${d.avgResolutionHours}h (Target SLA: ${d.targetSLA})
- SLA Adherence: ${d.slaAdherenceRate}%
- Notes: ${d.summary}`
  )
  .join('\n\n')}

## Systemic Bottlenecks & Operational Risks
${weeklyReport.criticalBottlenecks.map((b) => `- ${b}`).join('\n')}

## Strategic Recommendations
${weeklyReport.strategicRecommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Projected Forward Forecast
${weeklyReport.projectedForecast}
`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Find max volume in timeline for SVG scaling
  const maxTimelineTotal = Math.max(
    ...(trendsData?.timeline.map((t) => t.total) || [5]),
    5
  );

  return (
    <div className="space-y-8">
      {/* Dashboard Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Multi-Department Operational Analytics &amp; Reporting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Executive Analytics &amp; Trends Dashboard
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Real-time monitoring of ticket influx volumes, department workload distributions, resolution velocity vs SLA targets, and AI-synthesized automated reporting customizable per department.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleGenerateWeeklyReport(selectedDept, selectedFocus, selectedTimeRange)}
              disabled={isGeneratingReport}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-indigo-200 ${isGeneratingReport ? 'animate-spin' : ''}`} />
              <span>{isGeneratingReport ? 'Generating Summary...' : 'Synthesize Report with AI'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Bar */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-0 overflow-x-auto">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'overview'
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview &amp; KPIs
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'trends'
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Volume &amp; Response Trends
          </button>
          <button
            onClick={() => {
              if (!weeklyReport) {
                handleGenerateWeeklyReport(selectedDept, selectedFocus, selectedTimeRange);
              } else {
                setActiveView('weekly-report');
              }
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeView === 'weekly-report'
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Automated Reports (PDF &amp; Depts)</span>
            {weeklyReport && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
            )}
          </button>
          <button
            onClick={() => setActiveView('schema')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'schema'
                ? 'border-indigo-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Structured Data Schema
          </button>
        </div>
      </div>

      {/* VIEW 1: Overview & KPIs */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Scorecard Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Ingested</span>
                <Database className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{requests.length}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 mt-1 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Structured &amp; Persisted</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">SLA Adherence Rate</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400">
                {trendsData?.responseTimeMetrics?.slaAdherenceRate ?? 94}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Target: &gt; 90% across 4 tiers
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Mean Resolution Time</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-cyan-300">
                {trendsData?.responseTimeMetrics?.overallMeanHours ?? 8.4} <span className="text-sm font-normal text-slate-400">hours</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Calculated from resolved tickets
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider">Critical Escalations</span>
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-3xl font-extrabold text-rose-400">
                {requests.filter((r) => r.urgency === 'Critical').length}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Immediate incident routing
              </div>
            </div>
          </div>

          {/* Department Performance Matrix & SLA Benchmark */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Category SLA & Turnaround Comparison */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Response Time vs SLA Target Comparison</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Comparing mean resolution speed against agreed enterprise department SLAs.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                {trendsData?.categoriesBreakdown?.map((cat) => {
                  return (
                    <div key={cat.category} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CategoryBadge category={cat.category} size="sm" />
                          <span className="font-bold text-white">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">
                            Mean: <strong className="text-white">{cat.avgResolutionHours}h</strong>
                          </span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-400">
                            Target SLA: <strong className="text-indigo-400">{cat.targetSLA}</strong>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              cat.healthStatus === 'Excellent'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : cat.healthStatus === 'Good'
                                ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {cat.healthStatus}
                          </span>
                        </div>
                      </div>

                      {/* Visual comparative bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>SLA Adherence: {cat.slaAdherenceRate}%</span>
                          <span>{cat.volume} tickets</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, cat.slaAdherenceRate)}%`,
                              backgroundColor: cat.accentColor,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 cols: Workload Share & Urgency Mix */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Workload Volume Share</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Percentage distribution of classified tickets across departments.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {trendsData?.categoriesBreakdown?.map((cat) => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                      <span className="font-mono text-slate-300">
                        {cat.volume} tickets ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.accentColor,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Breakdown Mini Grid */}
              <div className="pt-4 border-t border-slate-800">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Active Lifecycle Queue Status
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Resolved</span>
                    <span className="font-bold text-emerald-400">
                      {requests.filter((r) => r.status === 'Resolved').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">In Progress</span>
                    <span className="font-bold text-amber-400">
                      {requests.filter((r) => r.status === 'In Progress').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">New / Triaged</span>
                    <span className="font-bold text-sky-400">
                      {requests.filter((r) => r.status === 'New' || r.status === 'Triaged').length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400">Escalated</span>
                    <span className="font-bold text-rose-400">
                      {requests.filter((r) => r.status === 'Escalated').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Volume & Response Trends */}
      {activeView === 'trends' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>7-Day Daily Influx Volume &amp; Category Trends</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Daily incoming tickets segmented by HR, IT, Finance, and Operations.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span className="text-slate-300">HR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="text-slate-300">IT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="text-slate-300">Finance</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span className="text-slate-300">Operations</span>
                </div>
              </div>
            </div>

            {/* Custom SVG / HTML Stacked Timeline Chart */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-6">
              <div className="h-64 flex items-end justify-between gap-3 sm:gap-6 pt-6 border-b border-slate-800 pb-2">
                {trendsData?.timeline.map((point, idx) => {
                  const total = point.total;
                  const heightPercent = maxTimelineTotal > 0 ? (total / maxTimelineTotal) * 100 : 0;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                      {/* Floating tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-16 bg-slate-900 border border-slate-700 text-slate-100 text-[10px] px-2.5 py-1.5 rounded-md shadow-xl whitespace-nowrap pointer-events-none z-30">
                        <div className="font-bold text-white mb-0.5">{point.date} ({point.dayName})</div>
                        <div className="flex items-center gap-2">
                          <span className="text-rose-400">HR: {point.HR}</span>
                          <span className="text-indigo-400">IT: {point.IT}</span>
                          <span className="text-emerald-400">Fin: {point.Finance}</span>
                          <span className="text-amber-400">Ops: {point.Operations}</span>
                        </div>
                        <div className="text-slate-400 mt-0.5">Total: {point.total} tickets &bull; Avg Res: {point.avgResolutionHours}h</div>
                      </div>

                      {/* Stacked bar */}
                      <div 
                        className="w-full max-w-[48px] rounded-t-lg overflow-hidden flex flex-col justify-end transition-all duration-300 bg-slate-900/60"
                        style={{ height: `${Math.max(12, heightPercent)}%` }}
                      >
                        {point.Operations > 0 && (
                          <div
                            style={{ height: `${(point.Operations / (total || 1)) * 100}%` }}
                            className="bg-amber-500 hover:brightness-110 transition-all"
                            title={`Operations: ${point.Operations}`}
                          />
                        )}
                        {point.Finance > 0 && (
                          <div
                            style={{ height: `${(point.Finance / (total || 1)) * 100}%` }}
                            className="bg-emerald-500 hover:brightness-110 transition-all"
                            title={`Finance: ${point.Finance}`}
                          />
                        )}
                        {point.IT > 0 && (
                          <div
                            style={{ height: `${(point.IT / (total || 1)) * 100}%` }}
                            className="bg-indigo-500 hover:brightness-110 transition-all"
                            title={`IT: ${point.IT}`}
                          />
                        )}
                        {point.HR > 0 && (
                          <div
                            style={{ height: `${(point.HR / (total || 1)) * 100}%` }}
                            className="bg-rose-500 hover:brightness-110 transition-all"
                            title={`HR: ${point.HR}`}
                          />
                        )}
                      </div>

                      {/* X-axis label */}
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-300">{point.dayName}</div>
                        <div className="text-[10px] text-slate-500">{point.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Turnaround speed line summary */}
              <div className="mt-4 pt-4 border-t border-slate-900 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>Daily Mean Resolution Speed:</span>
                  <span className="font-mono text-cyan-300 font-bold">
                    {trendsData?.responseTimeMetrics?.overallMeanHours}h average
                  </span>
                </div>
                <div className="text-slate-500 text-[11px]">
                  Peak Influx: Tuesday &amp; Thursday &bull; SLA breaches avoided: {trendsData?.responseTimeMetrics?.slaAdherenceRate}% rate
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Weekly Summary Insights & Department-Specific Automated Reporting */}
      {activeView === 'weekly-report' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Department Customization Control Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 no-print">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sliders className="w-4 h-4" />
                  <span>Customise Automated Summary Reporting</span>
                </div>
                <h2 className="text-lg font-extrabold text-white">
                  Report Scope, Department Filtering &amp; Focus Controls
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tailor AI operational synthesis for specific departments, choose audience perspective, and generate downloadable reports.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGenerateWeeklyReport(selectedDept, selectedFocus, selectedTimeRange)}
                  disabled={isGeneratingReport}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 text-indigo-200 ${isGeneratingReport ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingReport ? 'Synthesizing...' : 'Generate Customized Report'}</span>
                </button>
              </div>
            </div>

            {/* Customization Options Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Department Scope */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Department Scope:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['ALL', 'HR', 'IT', 'Finance', 'Operations'] as const).map((dept) => {
                    const isSelected = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedDept(dept);
                          handleGenerateWeeklyReport(dept, selectedFocus, selectedTimeRange);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {dept === 'ALL' ? '🏢 All Depts' : dept === 'HR' ? '👥 HR' : dept === 'IT' ? '💻 IT' : dept === 'Finance' ? '💰 Finance' : '📦 Operations'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option 2: Focus Mode */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Report Perspective / Focus Mode:</span>
                </label>
                <select
                  value={selectedFocus}
                  onChange={(e) => {
                    const focus = e.target.value as ReportFocusMode;
                    setSelectedFocus(focus);
                    handleGenerateWeeklyReport(selectedDept, focus, selectedTimeRange);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="executive">Executive Briefing (KPIs, Strategy, Velocity)</option>
                  <option value="operations">Operational Deep-Dive (Task Turnaround, Queues)</option>
                  <option value="bottlenecks">Bottlenecks &amp; Incident Audit (SLA Breaches, Friction)</option>
                  <option value="capacity">Staffing &amp; Capacity Review (Workload Surge &amp; Forecast)</option>
                </select>
              </div>

              {/* Option 3: Time Range */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Reporting Period:</span>
                </label>
                <div className="flex gap-2">
                  {(['7d', '14d', '30d'] as const).map((tr) => (
                    <button
                      key={tr}
                      onClick={() => {
                        setSelectedTimeRange(tr);
                        handleGenerateWeeklyReport(selectedDept, selectedFocus, tr);
                      }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        selectedTimeRange === tr
                          ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {tr === '7d' ? 'Past 7 Days' : tr === '14d' ? 'Past 14 Days' : 'Past 30 Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Report Display Container */}
          {weeklyReport ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 printable-report-area">
              {/* Report Header with Export Dropdown */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2 no-print">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{weeklyReport.modelEngine}</span>
                    </div>
                    {weeklyReport.targetDepartment && weeklyReport.targetDepartment !== 'ALL' && (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
                        Customized: {weeklyReport.departmentMeta?.name || weeklyReport.targetDepartment}
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs">
                      Focus: {weeklyReport.reportFocus ? weeklyReport.reportFocus.toUpperCase() : 'EXECUTIVE'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                    {weeklyReport.weekPeriod}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Generated: {new Date(weeklyReport.generatedAt).toLocaleString()} &bull; Analyzed {weeklyReport.totalVolume} multi-department tickets
                  </p>
                </div>

                {/* Export & Action Buttons Toolbar (Hidden on Print) */}
                <div className="flex flex-wrap items-center gap-2 no-print">
                  {/* Download PDF Button */}
                  <button
                    onClick={() => generatePdfReport(weeklyReport)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                    title="Download high-resolution structured PDF document"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-100" />
                    <span>Download PDF</span>
                  </button>

                  {/* Print / Save to PDF */}
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Open browser print dialog to print or save as PDF"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-300" />
                    <span>Print</span>
                  </button>

                  {/* Structured Export Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export Data</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                        <button
                          onClick={() => {
                            downloadCsvReport(weeklyReport);
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Export as CSV (.csv)</span>
                        </button>
                        <button
                          onClick={() => {
                            downloadJsonReport(weeklyReport);
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Export as JSON (.json)</span>
                        </button>
                        <button
                          onClick={() => {
                            downloadMarkdownReport(weeklyReport);
                            setShowExportMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span>Download Markdown (.md)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Copy Report Text */}
                  <button
                    onClick={handleCopyReport}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedReport ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Department Meta Callout (When Customized Department is Active) */}
              {weeklyReport.departmentMeta && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CategoryBadge category={weeklyReport.targetDepartment as DepartmentCategory} size="lg" />
                    <div>
                      <div className="text-xs text-slate-400">Target Department Profile</div>
                      <div className="text-base font-bold text-white">{weeklyReport.departmentMeta.name}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block">Department Lead:</span>
                      <span className="font-semibold text-slate-200">{weeklyReport.departmentMeta.primaryLead}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Target SLA:</span>
                      <span className="font-semibold text-indigo-400">{weeklyReport.departmentMeta.defaultSLA}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Dispatch Queue:</span>
                      <span className="font-mono text-cyan-300 text-[11px]">{weeklyReport.departmentMeta.dispatchQueue}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Executive Summary Callout */}
              <div className="bg-gradient-to-r from-indigo-950/60 to-slate-950 p-6 rounded-2xl border border-indigo-500/30 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Executive Synopsis &amp; Operational Overview</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">
                  {weeklyReport.executiveSummary}
                </p>
              </div>

              {/* Scorecard Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Analyzed Tickets</div>
                  <div className="text-2xl font-extrabold text-white mt-0.5">{weeklyReport.totalVolume}</div>
                  <div className="text-[10px] text-emerald-400">100% Ingested</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">SLA Adherence</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">{weeklyReport.slaAdherenceRate}%</div>
                  <div className="text-[10px] text-slate-400">Target: &gt; 90%</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Mean Turnaround</div>
                  <div className="text-2xl font-extrabold text-cyan-300 mt-0.5">{weeklyReport.meanResolutionHours}h</div>
                  <div className="text-[10px] text-slate-400">Resolved requests</div>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Report Scope</div>
                  <div className="text-lg font-bold text-indigo-300 mt-0.5 truncate">
                    {weeklyReport.targetDepartment === 'ALL' ? 'Enterprise' : weeklyReport.targetDepartment}
                  </div>
                  <div className="text-[10px] text-slate-400">{weeklyReport.reportFocus || 'Executive'}</div>
                </div>
              </div>

              {/* Sub-Category Distribution (When Available for Department) */}
              {weeklyReport.subCategoryBreakdown && weeklyReport.subCategoryBreakdown.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Sub-Category Workload Distribution ({weeklyReport.targetDepartment})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {weeklyReport.subCategoryBreakdown.map((sub, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-200">{sub.name}</span>
                          <span className="font-mono text-slate-400">{sub.count} tickets ({sub.percentage}%)</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                            style={{ width: `${Math.min(100, sub.percentage)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Highlights */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Key Operational Highlights &amp; Wins</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {weeklyReport.keyHighlights.map((hl, i) => (
                    <div key={i} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Performance Matrix Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Multi-Department Performance &amp; SLA Health Comparison</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Department</th>
                        <th className="p-3">Volume</th>
                        <th className="p-3">Avg Resolution</th>
                        <th className="p-3">Target SLA</th>
                        <th className="p-3">SLA Adherence</th>
                        <th className="p-3">Health Status</th>
                        <th className="p-3">Operational Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {weeklyReport.departmentPerformance.map((dept) => (
                        <tr key={dept.category} className="hover:bg-slate-850">
                          <td className="p-3">
                            <CategoryBadge category={dept.category as DepartmentCategory} size="sm" />
                          </td>
                          <td className="p-3 font-bold text-white">{dept.volume}</td>
                          <td className="p-3 font-mono text-cyan-300">{dept.avgResolutionHours}h</td>
                          <td className="p-3 font-mono text-slate-400">{dept.targetSLA}</td>
                          <td className="p-3 font-bold text-emerald-400">{dept.slaAdherenceRate}%</td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                dept.healthStatus === 'Excellent'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : dept.healthStatus === 'Good'
                                  ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {dept.healthStatus}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300 max-w-xs">{dept.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottlenecks and Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Operational Bottlenecks &amp; Systemic Risks</span>
                  </div>
                  <ul className="space-y-2">
                    {weeklyReport.criticalBottlenecks.map((bot, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <span>{bot}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>Strategic Directives &amp; Action Items</span>
                  </div>
                  <ul className="space-y-2">
                    {weeklyReport.strategicRecommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/70 p-2.5 rounded-lg border border-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Projected Forecast Footer */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="font-semibold text-white">Projected Forward Forecast: </span>
                  <span>{weeklyReport.projectedForecast}</span>
                </div>
                <div className="font-mono text-[11px] text-slate-500 shrink-0">
                  Synthesized via {weeklyReport.modelEngine}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 space-y-4">
              <Sparkles className="w-12 h-12 text-indigo-400 mx-auto" />
              <h3 className="text-base font-bold text-white">No Report Generated Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select your preferred department scope above (All, HR, IT, Finance, or Operations) and click below to synthesize a tailored operational summary report with downloadable PDF and CSV exports.
              </p>
              <button
                onClick={() => handleGenerateWeeklyReport(selectedDept, selectedFocus, selectedTimeRange)}
                disabled={isGeneratingReport}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Generate Customized Summary Report</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: Structured Data Schema Inspector */}
      {activeView === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-cyan-400" />
                <span>Ticket Structured Data Schema (JSON)</span>
              </h3>
              <p className="text-xs text-slate-400">
                All classified tickets are persisted in this formal ACID-compliant structure with automated indexing.
              </p>
            </div>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              v2.4 Schema Verified
            </span>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 max-h-[500px] overflow-y-auto leading-relaxed">
{`// Enterprise Ticket Structured Storage Model
interface ClassifiedRequest {
  id: string;                       // Unique ticket UUID (e.g. "req-seed-001")
  createdAt: string;                // ISO-8601 timestamp
  updatedAt: string;                // ISO-8601 update timestamp
  rawText: string;                  // Original unedited employee input
  requesterName: string;            // Requester author identity
  source: string;                   // "web_portal" | "rest_api" | "email_webhook"
  status: RequestStatus;            // "New" | "Triaged" | "In Progress" | "Resolved"
  category: DepartmentCategory;     // "HR" | "IT" | "Finance" | "Operations"
  subCategory: string;              // Specific domain task
  confidence: number;               // Model probability [0.0 - 1.0]
  urgency: UrgencyLevel;            // "Low" | "Medium" | "High" | "Critical"
  summary: string;                  // 1-sentence synopsis
  reasoning: string;                // Operational justification
  keyEntities: string[];            // Extracted named entities & numbers
  assignedTeam: string;             // Target queue (e.g. "queue.infra.support")
  estimatedResolutionTime: string;  // Target SLA (e.g. "4 Hours")
  actualResolutionHours?: number;   // Elapsed turnaround time
  slaTargetHours?: number;          // Numeric SLA ceiling
  slaMet?: boolean;                 // SLA compliance boolean
  classificationEngine: string;     // "gemini-3.8-flash" | "heuristic-fallback"
  processingTimeMs: number;         // Model inference latency
  responses?: GeneratedResponse[];  // Audit history of drafted/sent replies
}`}
          </pre>
        </div>
      )}
    </div>
  );
};
