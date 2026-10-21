import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  Sliders, 
  Layers, 
  ArrowRight, 
  Check, 
  Copy, 
  RefreshCw, 
  Send,
  Zap,
  Tag
} from 'lucide-react';
import { RESPONSE_TEMPLATES, TONE_CONFIGS } from '../data/responseTemplates.ts';
import { DepartmentCategory, ResponseTone, ResponseTemplate, GeneratedResponse } from '../types/classifier.ts';
import { CategoryBadge } from './CategoryBadge.tsx';

interface TemplateGalleryProps {
  onSelectTemplateToDraft: (template: ResponseTemplate) => void;
}

const COMPARISON_SCENARIOS = [
  {
    category: 'IT' as DepartmentCategory,
    title: 'MacBook Swollen Battery & Trackpad Failure',
    requester: 'Alex Rivera (Staff Engineer)',
    text: 'My MacBook Pro trackpad is unresponsive and the battery has started to swell. I cannot work on pull requests.',
  },
  {
    category: 'Finance' as DepartmentCategory,
    title: 'Overdue Vendor Invoice #INV-99214 ($14,280)',
    requester: 'Marcus Zhang (DevOps Lead)',
    text: 'Vendor AWS Cloud Services invoice #INV-99214 for $14,280 is 5 days past due on Net-30 terms. Please expedite ACH release.',
  },
  {
    category: 'HR' as DepartmentCategory,
    title: 'Parental Leave & PTO Accrual Inquiry',
    requester: 'Priya Patel (Product Designer)',
    text: 'Requesting 8 weeks parental leave starting in November. Could you explain the required documentation and PTO accrual status?',
  },
  {
    category: 'Operations' as DepartmentCategory,
    title: 'Lobby RFID Badge Turnstile Offline',
    requester: 'Chloe Bennett (Security Desk)',
    text: 'The RFID badge turnstile at North Tower main lobby is flashing red and refusing all employee cards. People are queuing outside in the rain.',
  },
];

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplateToDraft }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [activeTone, setActiveTone] = useState<ResponseTone>('formal');
  const [isGeneratingComparison, setIsGeneratingComparison] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<GeneratedResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredTemplates = RESPONSE_TEMPLATES.filter((t) => {
    if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
    return true;
  });

  const scenario = COMPARISON_SCENARIOS[selectedScenarioIndex];

  const handleRunComparison = async (targetTone: ResponseTone = activeTone) => {
    setIsGeneratingComparison(true);
    setActiveTone(targetTone);

    try {
      const template = RESPONSE_TEMPLATES.find((t) => t.category === scenario.category);

      const res = await fetch('/api/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: scenario.category,
          rawText: scenario.text,
          requesterName: scenario.requester,
          summary: scenario.title,
          tone: targetTone,
          templateId: template?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      }
    } catch (err) {
      console.error('Error generating comparison:', err);
    } finally {
      setIsGeneratingComparison(false);
    }
  };

  const handleCopy = () => {
    if (!comparisonResult) return;
    const full = `Subject: ${comparisonResult.subject}\n\n${comparisonResult.greeting}\n\n${comparisonResult.body}\n\n${comparisonResult.signOff}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Generative AI Response Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Response Templates & Tone Control Studio
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Pre-built response frameworks connected to HR, IT, Finance, and Operations tickets, with three distinct enterprise tone registers: <strong>Formal</strong>, <strong>Friendly</strong>, and <strong>Urgent</strong>.
        </p>

        {/* Tone Register Overview Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800">
          {(['formal', 'friendly', 'urgent'] as ResponseTone[]).map((t) => {
            const cfg = TONE_CONFIGS[t];
            return (
              <div key={t} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded border ${cfg.badgeClass}`}>
                    {cfg.name}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{cfg.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Tone Comparison Workbench */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Interactive Tone Comparison Lab</span>
            </h2>
            <p className="text-xs text-slate-400">
              Select a scenario and toggle tones to see how generative AI adapts style, vocabulary, and commitments.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunComparison(activeTone)}
              disabled={isGeneratingComparison}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-cyan-600/25 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingComparison ? 'animate-spin' : ''}`} />
              <span>Generate Sample</span>
            </button>
          </div>
        </div>

        {/* Scenario Selection Chips */}
        <div>
          <label className="text-xs font-medium text-slate-400 block mb-2">Test Scenario:</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {COMPARISON_SCENARIOS.map((sc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedScenarioIndex(idx);
                  setComparisonResult(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  selectedScenarioIndex === idx
                    ? 'bg-slate-800 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <CategoryBadge category={sc.category} size="sm" />
                </div>
                <div className="text-xs font-semibold text-slate-200 line-clamp-1">{sc.title}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{sc.requester}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-xs font-semibold text-slate-400 mr-2">Active Tone:</span>
          {(['formal', 'friendly', 'urgent'] as ResponseTone[]).map((t) => (
            <button
              key={t}
              onClick={() => handleRunComparison(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTone === t
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${activeTone === t ? 'text-yellow-300' : 'text-slate-500'}`} />
              <span>{t} Tone</span>
            </button>
          ))}
        </div>

        {/* Live Generated Result Preview */}
        {comparisonResult ? (
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Subject</span>
                <div className="text-sm font-semibold text-white">{comparisonResult.subject}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${TONE_CONFIGS[activeTone].badgeClass}`}>
                  {activeTone} Tone
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="font-semibold text-slate-200">{comparisonResult.greeting}</div>
              <div className="text-slate-300 whitespace-pre-wrap">{comparisonResult.body}</div>

              {comparisonResult.keyNextSteps && comparisonResult.keyNextSteps.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Actionable Steps
                  </div>
                  <ul className="space-y-1">
                    {comparisonResult.keyNextSteps.map((st, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 text-slate-400 border-t border-slate-800/80 flex flex-wrap justify-between gap-2">
                <div>
                  <span className="text-slate-500">Committed SLA: </span>
                  <span className="text-slate-300 font-semibold">{comparisonResult.slaCommitment}</span>
                </div>
                <div className="whitespace-pre-wrap font-medium text-slate-300">{comparisonResult.signOff}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 border-dashed rounded-xl p-8 text-center text-slate-500">
            <p className="text-xs">
              Click <strong>"Generate Sample"</strong> or any of the tone buttons above to see the AI response rendered for this scenario.
            </p>
          </div>
        )}
      </div>

      {/* Template Catalog Grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Category Template Library ({filteredTemplates.length})</span>
          </h2>

          {/* Category Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            {['ALL', 'HR', 'IT', 'Finance', 'Operations'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <CategoryBadge category={template.category} size="sm" />
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${TONE_CONFIGS[template.recommendedTone].badgeClass}`}>
                    Rec: {template.recommendedTone}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white mb-1.5">{template.name}</h3>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{template.description}</p>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 mb-4 text-[11px] text-slate-300">
                  <span className="text-slate-500 font-semibold block mb-1">Target Scenario:</span>
                  <span>{template.targetScenario}</span>
                </div>

                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Key Standard Points
                  </span>
                  {template.keyPoints.slice(0, 3).map((pt, i) => (
                    <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                      <span className="text-indigo-400 shrink-0">&bull;</span>
                      <span className="line-clamp-1">{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {template.id}
                </span>

                <button
                  onClick={() => onSelectTemplateToDraft(template)}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Use in Composer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
