import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Inbox,
  Activity
} from 'lucide-react';
import { ClassifiedRequest, DepartmentCategory, UrgencyLevel, RequestStatus } from '../types/classifier.ts';
import { CATEGORIES_CONFIG } from '../data/categories.ts';
import { CategoryBadge } from './CategoryBadge.tsx';

interface AnalyticsOverviewProps {
  requests: ClassifiedRequest[];
}

export const AnalyticsOverview: React.FC<AnalyticsOverviewProps> = ({ requests }) => {
  const total = requests.length;

  const catCounts: Record<DepartmentCategory, number> = {
    HR: 0,
    IT: 0,
    Finance: 0,
    Operations: 0,
  };

  const urgencyCounts: Record<UrgencyLevel, number> = {
    Low: 0,
    Medium: 0,
    High: 0,
    Critical: 0,
  };

  const statusCounts: Record<RequestStatus, number> = {
    New: 0,
    Triaged: 0,
    'In Progress': 0,
    Escalated: 0,
    Resolved: 0,
  };

  let totalConf = 0;
  let totalLatency = 0;
  let escalations = 0;

  requests.forEach((r) => {
    if (catCounts[r.category] !== undefined) catCounts[r.category]++;
    if (urgencyCounts[r.urgency] !== undefined) urgencyCounts[r.urgency]++;
    if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;
    totalConf += r.confidence || 0;
    totalLatency += r.processingTimeMs || 350;
    if (r.urgency === 'Critical' || r.escalationRequired) escalations++;
  });

  const avgConfidence = total > 0 ? ((totalConf / total) * 100).toFixed(1) : '0';
  const avgLatency = total > 0 ? Math.round(totalLatency / total) : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Stored</span>
            <Inbox className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{total}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across 4 departments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Confidence</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{avgConfidence}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Gemini zero-shot taxonomy</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Mean Latency</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-300">{avgLatency} ms</div>
          <p className="text-[11px] text-slate-500 mt-1">Ingestion to persistence</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">P1 Escalations</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{escalations}</div>
          <p className="text-[11px] text-slate-500 mt-1">Critical urgency triggers</p>
        </div>
      </div>

      {/* Visual Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Volume by Department Category</span>
          </h3>

          <div className="space-y-3">
            {(['HR', 'IT', 'Finance', 'Operations'] as DepartmentCategory[]).map((cat) => {
              const count = catCounts[cat];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              const cfg = CATEGORIES_CONFIG[cat];

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-200 flex items-center gap-2">
                      <CategoryBadge category={cat} size="sm" />
                      <span>{cfg.name}</span>
                    </span>
                    <span className="font-mono text-slate-400">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: cfg.accentColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Urgency & Status Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Operational Urgency Distribution</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['Critical', 'High', 'Medium', 'Low'] as UrgencyLevel[]).map((urg) => {
              const count = urgencyCounts[urg];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={urg} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center">
                  <div className="text-[11px] font-semibold text-slate-400">{urg}</div>
                  <div className="text-xl font-bold text-white mt-1">{count}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{pct}% of tickets</div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Ticket Resolution Lifecycle
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
              {(['New', 'Triaged', 'In Progress', 'Escalated', 'Resolved'] as RequestStatus[]).map((st) => (
                <div key={st} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px]">{st}</div>
                  <div className="font-bold text-white mt-0.5">{statusCounts[st]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
