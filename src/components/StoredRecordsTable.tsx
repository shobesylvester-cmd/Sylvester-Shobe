import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  User, 
  Radio, 
  ArrowRight, 
  Check, 
  RefreshCw,
  Sliders,
  ExternalLink,
  Edit2,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { ClassifiedRequest, DepartmentCategory, UrgencyLevel, RequestStatus } from '../types/classifier.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { UrgencyBadge, StatusBadge } from './Badges.tsx';

interface StoredRecordsTableProps {
  requests: ClassifiedRequest[];
  highlightId?: string;
  onUpdateRequest: (id: string, updates: Partial<ClassifiedRequest>) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  onClearAll: () => Promise<void>;
  onRefresh: () => Promise<void>;
  onOpenComposer?: (request: ClassifiedRequest) => void;
}

export const StoredRecordsTable: React.FC<StoredRecordsTableProps> = ({
  requests,
  highlightId,
  onUpdateRequest,
  onDeleteRequest,
  onClearAll,
  onRefresh,
  onOpenComposer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(highlightId || null);

  // Manual re-categorization modal state
  const [overrideModal, setOverrideModal] = useState<{
    request: ClassifiedRequest;
    newCategory: DepartmentCategory;
    reason: string;
  } | null>(null);

  // JSON viewer modal
  const [jsonModalRequest, setJsonModalRequest] = useState<ClassifiedRequest | null>(null);

  // Filter requests
  const filtered = requests.filter((r) => {
    if (categoryFilter !== 'ALL' && r.category !== categoryFilter) return false;
    if (urgencyFilter !== 'ALL' && r.urgency !== urgencyFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchText = r.rawText.toLowerCase().includes(term);
      const matchSummary = r.summary.toLowerCase().includes(term);
      const matchName = r.requesterName.toLowerCase().includes(term);
      const matchSub = r.subCategory.toLowerCase().includes(term);
      const matchReason = r.reasoning.toLowerCase().includes(term);
      if (!matchText && !matchSummary && !matchName && !matchSub && !matchReason) {
        return false;
      }
    }
    return true;
  });

  const handleStatusChange = async (id: string, newStatus: RequestStatus) => {
    await onUpdateRequest(id, { status: newStatus });
  };

  const handleApplyOverride = async () => {
    if (!overrideModal) return;
    await onUpdateRequest(overrideModal.request.id, {
      category: overrideModal.newCategory,
    });
    setOverrideModal(null);
  };

  const exportToJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `autotriage-records-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const exportToCsv = () => {
    if (filtered.length === 0) return;
    const headers = ['ID', 'Category', 'Confidence', 'Urgency', 'Status', 'Requester', 'Created At', 'Summary', 'Reasoning'];
    const rows = filtered.map((r) => [
      r.id,
      r.category,
      (r.confidence * 100).toFixed(0) + '%',
      r.urgency,
      r.status,
      `"${r.requesterName.replace(/"/g, '""')}"`,
      r.createdAt,
      `"${r.summary.replace(/"/g, '""')}"`,
      `"${r.reasoning.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autotriage-records-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
            <Database className="w-3.5 h-3.5" />
            <span>Operational Persistence Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Classified Request Archive
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Audit-grade repository storing classified outputs with reasoning, continuous confidence metrics, manual override log, and department queues.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToJson}
            disabled={filtered.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={exportToCsv}
            disabled={filtered.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all stored classified requests?')) {
                onClearAll();
              }
            }}
            disabled={requests.length === 0}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Store</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search request text, author, summary, or entities..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All (4)</option>
              <option value="HR" className="bg-slate-900">HR</option>
              <option value="IT" className="bg-slate-900">IT</option>
              <option value="Finance" className="bg-slate-900">Finance</option>
              <option value="Operations" className="bg-slate-900">Operations</option>
            </select>
          </div>

          {/* Urgency */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Urgency:</span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All</option>
              <option value="Critical" className="bg-slate-900">Critical</option>
              <option value="High" className="bg-slate-900">High</option>
              <option value="Medium" className="bg-slate-900">Medium</option>
              <option value="Low" className="bg-slate-900">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Statuses</option>
              <option value="New" className="bg-slate-900">New</option>
              <option value="Triaged" className="bg-slate-900">Triaged</option>
              <option value="In Progress" className="bg-slate-900">In Progress</option>
              <option value="Escalated" className="bg-slate-900">Escalated</option>
              <option value="Resolved" className="bg-slate-900">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Record Counter */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filtered.length}</strong> of{' '}
          <strong className="text-white">{requests.length}</strong> stored records
        </span>
        <button
          onClick={onRefresh}
          className="hover:text-slate-200 flex items-center gap-1 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Refresh Store</span>
        </button>
      </div>

      {/* Records List / Table */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Database className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-base font-semibold text-slate-300">No records found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'ALL' || urgencyFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your filters or search terms.'
              : 'Submit incoming requests using the AI Classifier console to populate this archive.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            const isHighlighted = highlightId === item.id;

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isHighlighted
                    ? 'border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Main Row summary */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none hover:bg-slate-850"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <CategoryBadge category={item.category} size="md" />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {item.subCategory}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.id}
                        </span>
                        {item.manualOverride && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Re-Routed
                          </span>
                        )}
                        {item.responses && item.responses.length > 0 && (
                          <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            <span>{item.responses.length} Replied</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-1 font-medium">
                        {item.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-500" />
                          <span>{item.requesterName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                        <span className="text-indigo-400 font-mono text-[10px]">
                          Queue: {item.assignedTeam}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {(item.confidence * 100).toFixed(0)}%
                      </span>
                      <UrgencyBadge urgency={item.urgency} size="sm" />
                      <StatusBadge status={item.status} />
                    </div>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="p-5 bg-slate-950/80 border-t border-slate-800 space-y-4 animate-in fade-in duration-200">
                    {/* Raw Text */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Inbound Raw Request Content
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                        {item.rawText}
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Enterprise Classifier Reasoning
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                        {item.reasoning}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block mb-1">Target SLA & Resolution</span>
                        <span className="font-semibold text-slate-200">{item.estimatedResolutionTime}</span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block mb-1">Recommended Action</span>
                        <span className="font-semibold text-slate-200">{item.suggestedAction}</span>
                      </div>

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                        <span className="text-slate-500 block mb-1">Classifier Engine</span>
                        <span className="font-mono text-cyan-400">{item.classificationEngine} ({item.processingTimeMs}ms)</span>
                      </div>
                    </div>

                    {/* Manual Override Log if present */}
                    {item.manualOverride && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-amber-300">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Manual Routing Override Applied</span>
                        </div>
                        <div>Original Category: <strong className="font-mono">{item.manualOverride.originalCategory}</strong> &rarr; Reassigned to <strong className="font-mono">{item.category}</strong></div>
                        <div className="text-amber-300/80">Reason: {item.manualOverride.reason} (by {item.manualOverride.overriddenBy})</div>
                      </div>
                    )}

                    {/* Attached Responses History */}
                    {item.responses && item.responses.length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sent Responses &amp; Audit Trail ({item.responses.length})</span>
                        </div>
                        <div className="space-y-2">
                          {item.responses.map((resp, rIdx) => (
                            <div key={rIdx} className="bg-slate-900 rounded-xl border border-slate-800 p-3.5 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                                <div className="font-semibold text-white flex items-center gap-2">
                                  <span>{resp.subject}</span>
                                  <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    {resp.tone} tone
                                  </span>
                                </div>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {new Date(resp.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-slate-300 font-serif italic text-xs leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
                                {resp.greeting}
                                {'\n\n'}
                                {resp.body}
                                {'\n\n'}
                                {resp.signOff}
                              </div>
                              <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1">
                                <span>Commitment: <strong className="text-slate-200">{resp.slaCommitment}</strong></span>
                                <span className="font-mono text-slate-500">Template: {resp.templateName}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-medium">Update Status:</span>
                        {(['New', 'Triaged', 'In Progress', 'Resolved'] as RequestStatus[]).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleStatusChange(item.id, st)}
                            disabled={item.status === st}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                              item.status === st
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onOpenComposer && onOpenComposer(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                          <span>Draft Response with AI</span>
                        </button>

                        <button
                          onClick={() => setOverrideModal({
                            request: item,
                            newCategory: item.category === 'HR' ? 'IT' : item.category === 'IT' ? 'Finance' : 'HR',
                            reason: '',
                          })}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Re-Route</span>
                        </button>

                        <button
                          onClick={() => setJsonModalRequest(item)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inspect JSON</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm(`Delete request ${item.id}?`)) {
                              onDeleteRequest(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-amber-400" />
              <span>Manual Department Override</span>
            </h3>
            <p className="text-xs text-slate-400">
              Reassign request <strong className="text-white font-mono">{overrideModal.request.id}</strong> to a different operational pillar. This creates an immutable audit trail.
            </p>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Target Department</label>
              <select
                value={overrideModal.newCategory}
                onChange={(e) => setOverrideModal({
                  ...overrideModal,
                  newCategory: e.target.value as DepartmentCategory,
                })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="HR">HR (Human Resources)</option>
                <option value="IT">IT (Information Technology)</option>
                <option value="Finance">Finance & Accounting</option>
                <option value="Operations">Operations & Facilities</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Override Reason</label>
              <input
                type="text"
                placeholder="e.g. Involves corporate expense policy rather than IT hardware"
                value={overrideModal.reason}
                onChange={(e) => setOverrideModal({
                  ...overrideModal,
                  reason: e.target.value,
                })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyOverride}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Confirm Re-Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JSON Viewer Modal */}
      {jsonModalRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-mono">
                <FileJson className="w-4 h-4 text-cyan-400" />
                <span>{jsonModalRequest.id}.json</span>
              </h3>
              <button
                onClick={() => setJsonModalRequest(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Close
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 max-h-96 overflow-y-auto">
              {JSON.stringify(jsonModalRequest, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
