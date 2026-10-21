import React, { useState } from 'react';
import { 
  GitFork, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  GitMerge, 
  Database, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Clock, 
  Code, 
  FileJson, 
  Server,
  Zap,
  Info
} from 'lucide-react';
import { SYSTEM_ARCHITECTURE_LAYERS, SYSTEM_DATA_FLOW } from '../data/architectureSpec.ts';
import { CATEGORIES_CONFIG } from '../data/categories.ts';
import { SystemArchitectureNode, DepartmentCategory } from '../types/classifier.ts';

export const ArchitectureBlueprint: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<SystemArchitectureNode>(SYSTEM_ARCHITECTURE_LAYERS[2]); // default to AI core
  const [activeTab, setActiveTab] = useState<'visual' | 'specification' | 'api-contracts'>('visual');
  const [simulatingStep, setSimulatingStep] = useState<number | null>(null);

  const runSimulation = () => {
    if (simulatingStep !== null) return;
    setSimulatingStep(1);

    const stepIntervals = [1, 2, 3, 4, 5];
    let current = 0;

    const interval = setInterval(() => {
      current++;
      if (current < stepIntervals.length) {
        setSimulatingStep(stepIntervals[current]);
        setSelectedNode(SYSTEM_ARCHITECTURE_LAYERS[current]);
      } else {
        clearInterval(interval);
        setTimeout(() => setSimulatingStep(null), 1500);
      }
    }, 1100);
  };

  const getLayerIcon = (id: string) => {
    switch (id) {
      case 'layer-ingestion': return <Server className="w-5 h-5 text-indigo-400" />;
      case 'layer-preprocessing': return <ShieldCheck className="w-5 h-5 text-teal-400" />;
      case 'layer-ai-core': return <Cpu className="w-5 h-5 text-cyan-400" />;
      case 'layer-validation': return <GitMerge className="w-5 h-5 text-amber-400" />;
      case 'layer-storage-sinks': return <Database className="w-5 h-5 text-emerald-400" />;
      default: return <Layers className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Blueprint Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-3">
              <GitFork className="w-3.5 h-3.5" />
              <span>System Design & Pipeline Topology</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AutoTriage Architecture Blueprint
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              End-to-end multi-tier pipeline converting unstructured employee inputs into validated, persistently stored, and categorized operational records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runSimulation}
              disabled={simulatingStep !== null}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${simulatingStep !== null ? 'animate-bounce text-yellow-300' : ''}`} />
              <span>{simulatingStep !== null ? `Simulating Step ${simulatingStep}...` : 'Simulate Packet Flow'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-800 pb-0">
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'visual'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Visual Pipeline Diagram
          </button>
          <button
            onClick={() => setActiveTab('specification')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'specification'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Specifications
          </button>
          <button
            onClick={() => setActiveTab('api-contracts')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'api-contracts'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            API Schema Contracts
          </button>
        </div>
      </div>

      {activeTab === 'visual' && (
        <div className="space-y-6">
          {/* Main Visual Node Flow */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>End-to-End Processing Stages (Click to Inspect)</span>
              </h2>
              {simulatingStep !== null && (
                <div className="text-xs font-medium text-cyan-400 flex items-center gap-1.5 bg-cyan-950/60 px-2.5 py-1 rounded-full border border-cyan-800">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>Packet at Step {simulatingStep}: {SYSTEM_DATA_FLOW[simulatingStep - 1]?.title}</span>
                </div>
              )}
            </div>

            {/* Horizontal Pipeline Steps */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
              {SYSTEM_ARCHITECTURE_LAYERS.map((node, index) => {
                const isSelected = selectedNode.id === node.id;
                const isSimActive = simulatingStep === index + 1;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all duration-300 flex flex-col justify-between relative ${
                      isSimActive
                        ? 'bg-cyan-950/80 border-cyan-400 ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/30 -translate-y-1'
                        : isSelected
                        ? 'bg-slate-800/90 border-indigo-500 ring-1 ring-indigo-500/40 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      {/* Step index & icon */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60">
                          {getLayerIcon(node.id)}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          Stage {index + 1}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1 leading-snug">
                        {node.title.replace(/^\d+\.\s*/, '')}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                        {node.shortDesc}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Latency</span>
                      <span className="font-mono font-medium text-slate-300">
                        {node.spec.latencyTarget}
                      </span>
                    </div>

                    {/* Arrow to next item (desktop) */}
                    {index < 4 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                        <ArrowRight className="w-5 h-5 text-slate-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Downstream Routing Sinks (HR, IT, Finance, Operations) */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Final Output Sinks & Department Dispatch Queues</span>
                <span className="text-slate-500 normal-case font-normal text-xs">
                  Triggered after Stage 5 Storage & Validation
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(['HR', 'IT', 'Finance', 'Operations'] as DepartmentCategory[]).map((catKey) => {
                  const cat = CATEGORIES_CONFIG[catKey];
                  return (
                    <div
                      key={catKey}
                      className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded border"
                            style={{
                              borderColor: `${cat.accentColor}55`,
                              color: cat.accentColor,
                              backgroundColor: `${cat.accentColor}15`,
                            }}
                          >
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            SLA: {cat.defaultSLA}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-3">{cat.description}</p>
                      </div>

                      <div className="bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300 truncate">
                        {cat.dispatchQueue}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Detailed Node Inspector Card */}
          {selectedNode && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                    {getLayerIcon(selectedNode.id)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedNode.title}</h3>
                    <p className="text-xs text-slate-400">Architecture Layer: <span className="text-cyan-400 font-medium">{selectedNode.layer}</span></p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Latency SLA</div>
                    <div className="text-xs font-mono font-bold text-emerald-400">{selectedNode.spec.latencyTarget}</div>
                  </div>
                  <div className="text-right pl-3 border-l border-slate-800">
                    <div className="text-[11px] text-slate-500 uppercase font-semibold">Status</div>
                    <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Operational
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsibilities & Data Contract */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Layer Responsibilities & Tasks</span>
                  </h4>
                  <ul className="space-y-2">
                    {selectedNode.spec.responsibilities.map((resp, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" />
                      <span>Interface & Protocol</span>
                    </h4>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300">
                      {selectedNode.spec.protocol}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                      <FileJson className="w-4 h-4 text-indigo-400" />
                      <span>Data Schema Contract</span>
                    </h4>
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed overflow-x-auto">
                      {selectedNode.spec.schemaSummary}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'specification' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-sm">
          <div>
            <h2 className="text-lg font-bold text-white mb-2">1. System Architectural Overview</h2>
            <p className="text-slate-300 leading-relaxed">
              AutoTriage is designed as a high-throughput, fault-tolerant enterprise request classification system. It ingests unstructured text requests across multiple digital channels (web ticketing portals, Slack/Teams bots, REST endpoints, and email webhooks) and deterministically maps them to 4 core corporate pillars: <strong>HR, IT, Finance, and Operations</strong>.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h2 className="text-lg font-bold text-white mb-2">2. Department Taxonomy Boundaries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-bold text-rose-400 mb-1">Human Resources (HR)</h3>
                <p className="text-xs text-slate-400">Payroll reconciliation, benefits administration, medical/dental, 401(k), PTO/vacation, bereavement, onboarding workflows, parental leaves, and employee relations.</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-bold text-indigo-400 mb-1">Information Technology (IT)</h3>
                <p className="text-xs text-slate-400">Workstation hardware, laptop swelling/repair, monitors, VPN access, Okta SSO/MFA credentials, developer tooling licenses, network degradation, and cyber security.</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-bold text-emerald-400 mb-1">Finance & Accounting</h3>
                <p className="text-xs text-slate-400">Accounts payable/receivable, overdue vendor invoices, corporate credit cards, Expensify reports, budget approvals, purchase order generation, and tax forms.</p>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <h3 className="font-bold text-amber-400 mb-1">Operations & Facilities</h3>
                <p className="text-xs text-slate-400">Physical plant maintenance, HVAC climate control, access turnstiles, ergonomic furniture, office supply inventory, courier/shipping, and incident safety.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4">
            <h2 className="text-lg font-bold text-white mb-2">3. Confidence Gating & Human-in-the-Loop Routing</h2>
            <p className="text-slate-300 leading-relaxed mb-3">
              To guarantee zero erroneous automated actions on mission-critical corporate functions, the decision engine evaluates the model's confidence rating:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-300 pl-2">
              <li><strong>Score &ge; 0.85</strong>: Automatic status assigned as <span className="text-sky-400 font-mono">"New"</span> and dispatched directly to the primary department queue.</li>
              <li><strong>0.70 &le; Score &lt; 0.85</strong>: Assigned as <span className="text-purple-400 font-mono">"Triaged"</span> for second-tier review while queued.</li>
              <li><strong>Urgency === "Critical"</strong>: Triggers on-call escalation badge and marks record as <span className="text-rose-400 font-mono">"Escalated"</span>.</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'api-contracts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-white mb-2">REST API Contract Endpoints</h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded">
                  POST /api/classify
                </span>
                <span className="text-xs text-slate-400">Classifies and stores a single inbound request</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto">
{`// Request Payload
{
  "requestText": "MacBook trackpad stopped working, battery swollen.",
  "requesterName": "Alex Rivera",
  "source": "web_portal"
}

// 201 Created Response
{
  "id": "req-171928372-ab3",
  "category": "IT",
  "confidence": 0.98,
  "subCategory": "Hardware & Peripherals",
  "urgency": "Critical",
  "summary": "Swollen MacBook battery causing trackpad failure.",
  "reasoning": "Device safety hazard requiring immediate hardware replacement.",
  "assignedTeam": "queue.infra.support",
  "status": "Escalated",
  "createdAt": "2026-10-21T09:41:00Z"
}`}
              </pre>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded">
                  GET /api/requests
                </span>
                <span className="text-xs text-slate-400">Query stored classified records with filters</span>
              </div>
              <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-3 rounded-lg overflow-x-auto">
{`// Query Parameters: ?category=IT&urgency=Critical&status=In%20Progress&search=battery
{
  "total": 14,
  "requests": [ /* ClassifiedRequest[] */ ]
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
