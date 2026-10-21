import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Cpu, 
  Play, 
  FileText, 
  User, 
  Radio, 
  AlertCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { ClassifiedRequest, DepartmentCategory } from '../types/classifier.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { UrgencyBadge, StatusBadge } from './Badges.tsx';

interface ClassifierConsoleProps {
  onClassified: (newRecord: ClassifiedRequest) => void;
  onViewInStore: (id?: string) => void;
  onDraftResponse?: (request: ClassifiedRequest) => void;
}

const SAMPLE_REQUESTS = [
  {
    category: 'IT' as DepartmentCategory,
    label: 'IT • MacBook Crash',
    text: 'My work MacBook Pro keeps experiencing kernel panics after the latest security patch. The screen freezes and reboots every 20 minutes, preventing me from pushing critical production code.',
    requester: 'Devon Wright (Engineering)',
  },
  {
    category: 'HR' as DepartmentCategory,
    label: 'HR • Parental Leave',
    text: 'I am planning to take parental leave starting in November for 8 weeks. Could someone explain the required documentation and whether PTO accrual continues during that period?',
    requester: 'Maria Santos (Product Design)',
  },
  {
    category: 'Finance' as DepartmentCategory,
    label: 'Finance • Overdue Vendor Invoice',
    text: 'Vendor Datadog sent an urgent reminder for Invoice #DD-88129 totaling $8,450. It was due 5 days ago on net-30 terms. Please expedite payment disbursement via ACH.',
    requester: 'Liam Zhao (DevOps Lead)',
  },
  {
    category: 'Operations' as DepartmentCategory,
    label: 'Operations • Badge Access Offline',
    text: 'The RFID badge turnstile at the North Tower main lobby is flashing red and refusing all employee cards. Employees are stuck outside waiting in line in the rain.',
    requester: 'Security Desk (Reception)',
  },
  {
    category: 'HR' as DepartmentCategory,
    label: 'HR • HSA & Payroll Update',
    text: 'I need to adjust my pre-tax HSA contribution to the maximum annual federal limit and change my direct deposit checking account before next payroll cut-off.',
    requester: 'Karen Miller (Sales)',
  },
];

export const ClassifierConsole: React.FC<ClassifierConsoleProps> = ({
  onClassified,
  onViewInStore,
  onDraftResponse,
}) => {
  const [requestText, setRequestText] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [source, setSource] = useState<'web_portal' | 'rest_api' | 'email_webhook'>('web_portal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastClassified, setLastClassified] = useState<ClassifiedRequest | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);

  const handleSelectSample = (sample: typeof SAMPLE_REQUESTS[0]) => {
    setRequestText(sample.text);
    setRequesterName(sample.requester);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!requestText.trim()) {
      setError('Please enter a request message to classify.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestText: requestText.trim(),
          requesterName: requesterName.trim() || undefined,
          source,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Classification failed.');
      }

      const result: ClassifiedRequest = await response.json();
      setLastClassified(result);
      onClassified(result);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to classifier API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBatchDemo = async () => {
    setBatchRunning(true);
    setBatchLogs([]);
    const appendLog = (msg: string) => setBatchLogs((prev) => [...prev, msg]);

    appendLog('🚀 Initializing Enterprise Batch Ingestion Pipeline...');

    for (let i = 0; i < SAMPLE_REQUESTS.length; i++) {
      const sample = SAMPLE_REQUESTS[i];
      appendLog(`[${i + 1}/${SAMPLE_REQUESTS.length}] Sending inbound request from ${sample.requester}...`);

      try {
        const response = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requestText: sample.text,
            requesterName: sample.requester,
            source: 'batch_import',
          }),
        });
        const res: ClassifiedRequest = await response.json();
        appendLog(`✓ Classified as [${res.category}] (Confidence: ${(res.confidence * 100).toFixed(0)}%, Urgency: ${res.urgency}) in ${res.processingTimeMs}ms`);
        onClassified(res);
        setLastClassified(res);
      } catch (err: any) {
        appendLog(`✗ Error classifying: ${err.message}`);
      }
    }

    appendLog('🎉 Batch pipeline complete! All records persisted to storage.');
    setBatchRunning(false);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
              <Cpu className="w-3.5 h-3.5" />
              <span>Gemini 3.8 Flash AI Classifier</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Request Ingestion & Classifier
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Submit raw incoming tickets, emails, or messages. The AI engine analyzes contextual semantics, categorizes into{' '}
              <strong className="text-slate-200">HR, IT, Finance, or Operations</strong>, scores confidence, and stores the structured output in the operational database.
            </p>
          </div>

          <button
            onClick={handleRunBatchDemo}
            disabled={batchRunning || isLoading}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:border-slate-600 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 text-cyan-400 ${batchRunning ? 'animate-spin' : ''}`} />
            <span>{batchRunning ? 'Running Batch...' : 'Simulate Batch Stream'}</span>
          </button>
        </div>

        {/* Batch Logs Display */}
        {batchLogs.length > 0 && (
          <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto space-y-1">
            {batchLogs.map((log, idx) => (
              <div key={idx} className={log.startsWith('✓') ? 'text-emerald-400' : log.startsWith('🚀') ? 'text-cyan-400' : 'text-slate-300'}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Form + Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Request Submission Form */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Inbound Request Form</span>
            </h2>

            {/* Quick Preset Samples */}
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-400 block mb-2">
                Click a preset to test real-world scenarios:
              </label>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_REQUESTS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSample(sample)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 transition-colors flex items-center gap-1.5 text-left"
                  >
                    <span>{sample.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Text Area */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex justify-between">
                  <span>Request Content / Description</span>
                  <span className="text-slate-500 font-normal">{requestText.length} characters</span>
                </label>
                <textarea
                  rows={4}
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Paste or type request here, e.g., 'Need new employee laptop setup with AWS credentials and VPN access' or 'Vendor invoice #4928 is overdue for payment'..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
                />
              </div>

              {/* Requester & Source Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Requester Name / Title</span>
                  </label>
                  <input
                    type="text"
                    value={requesterName}
                    onChange={(e) => setRequesterName(e.target.value)}
                    placeholder="e.g. Jordan Lee (Design Lead)"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                    <span>Ingestion Channel</span>
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="web_portal">Internal Web Portal (Form)</option>
                    <option value="rest_api">REST Ingestion API (Microservice)</option>
                    <option value="email_webhook">Email / Helpdesk Webhook</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !requestText.trim()}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing with Gemini 3.8 Flash...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-indigo-200" />
                    <span>Classify & Route Request</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Architecture Snapshot Strip */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-4 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium text-slate-300">Target Categories:</span>
              <span>HR • IT • Finance • Operations</span>
            </div>
            <div className="font-mono text-slate-500 hidden sm:block">
              Auto-dispatch &gt; 70% confidence
            </div>
          </div>
        </div>

        {/* Right Column: Live Classified Output & Storage Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Classification Output</span>
            </h2>
            {lastClassified && (
              <button
                onClick={() => onViewInStore(lastClassified.id)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <span>View in Store</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {lastClassified ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Header Badge Row */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Classified Department
                  </div>
                  <CategoryBadge category={lastClassified.category} size="lg" />
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Urgency Level
                  </div>
                  <UrgencyBadge urgency={lastClassified.urgency} />
                </div>
              </div>

              {/* Confidence Score Bar */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-slate-400">Confidence Score</span>
                  <span className="font-bold text-slate-200">
                    {(lastClassified.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      lastClassified.confidence >= 0.9
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : lastClassified.confidence >= 0.75
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        : 'bg-gradient-to-r from-amber-500 to-orange-400'
                    }`}
                    style={{ width: `${Math.round(lastClassified.confidence * 100)}%` }}
                  />
                </div>
              </div>

              {/* Sub-Category & Target Queue */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <div className="text-slate-500 font-medium">Sub-Category</div>
                  <div className="font-semibold text-slate-200 mt-0.5">
                    {lastClassified.subCategory}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 font-medium">Routed Queue</div>
                  <div className="font-mono font-semibold text-indigo-400 mt-0.5 truncate">
                    {lastClassified.assignedTeam}
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Synopsis</div>
                <p className="text-sm text-slate-200 font-medium leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  {lastClassified.summary}
                </p>
              </div>

              {/* Deep AI Reasoning */}
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Classifier Reasoning</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  {lastClassified.reasoning}
                </p>
              </div>

              {/* Extracted Key Entities */}
              {lastClassified.keyEntities && lastClassified.keyEntities.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-400 mb-1.5">
                    Extracted Entities
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastClassified.keyEntities.map((ent, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Action & SLA */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target SLA:</span>
                  <span className="font-semibold text-slate-200">
                    {lastClassified.estimatedResolutionTime}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Persisted in DB</span>
                </div>
              </div>

              {/* Metadata strip */}
              <div className="pt-2 text-[11px] font-mono text-slate-500 flex justify-between">
                <span>Model: {lastClassified.classificationEngine}</span>
                <span>Latency: {lastClassified.processingTimeMs}ms</span>
              </div>

              {/* Action Button: Draft Professional AI Response */}
              <div className="pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => onDraftResponse && onDraftResponse(lastClassified)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-violet-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Draft Professional AI Response (Formal/Friendly/Urgent)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">No Classification Active</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Type an incoming request or click one of the preset samples on the left to see Gemini classify and route in real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
