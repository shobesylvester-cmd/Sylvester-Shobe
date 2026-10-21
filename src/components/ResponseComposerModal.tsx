import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  X, 
  MessageSquare, 
  Clock, 
  User, 
  Layers, 
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RotateCcw,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { 
  ClassifiedRequest, 
  DepartmentCategory, 
  ResponseTone, 
  GeneratedResponse, 
  ResponseTemplate 
} from '../types/classifier.ts';
import { RESPONSE_TEMPLATES, TONE_CONFIGS } from '../data/responseTemplates.ts';
import { CategoryBadge } from './CategoryBadge.tsx';
import { UrgencyBadge } from './Badges.tsx';

interface ResponseComposerModalProps {
  request: ClassifiedRequest;
  isOpen: boolean;
  onClose: () => void;
  onReplyAttached: (updatedRequest: ClassifiedRequest) => void;
}

export const ResponseComposerModal: React.FC<ResponseComposerModalProps> = ({
  request,
  isOpen,
  onClose,
  onReplyAttached,
}) => {
  const [tone, setTone] = useState<ResponseTone>('formal');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Response fields (editable)
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedResponse | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [greeting, setGreeting] = useState('');
  const [signOff, setSignOff] = useState('');
  const [slaCommitment, setSlaCommitment] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);

  // Get templates matching the ticket category
  const categoryTemplates = RESPONSE_TEMPLATES.filter((t) => t.category === request.category);

  useEffect(() => {
    if (categoryTemplates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(categoryTemplates[0].id);
      setTone(categoryTemplates[0].recommendedTone);
    }
  }, [request.category]);

  const handleTemplateSelect = (tmpl: ResponseTemplate) => {
    setSelectedTemplateId(tmpl.id);
    setTone(tmpl.recommendedTone);
  };

  const handleGenerate = async (targetTone: ResponseTone = tone) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: request.id,
          category: request.category,
          rawText: request.rawText,
          requesterName: request.requesterName,
          summary: request.summary,
          urgency: request.urgency,
          tone: targetTone,
          templateId: selectedTemplateId,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to generate response.');
      }

      const data: GeneratedResponse = await response.json();
      setGeneratedDraft(data);
      setSubject(data.subject);
      setGreeting(data.greeting);
      setBody(data.body);
      setSignOff(data.signOff);
      setSlaCommitment(data.slaCommitment);
      setNextSteps(data.keyNextSteps || []);
      setTone(targetTone);
    } catch (err: any) {
      setError(err.message || 'Generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendReply = async () => {
    if (!generatedDraft) return;

    setIsSending(true);
    setError(null);

    try {
      const updatedResponsePayload: GeneratedResponse = {
        ...generatedDraft,
        subject,
        greeting,
        body,
        signOff,
        slaCommitment,
        keyNextSteps: nextSteps,
      };

      const res = await fetch(`/api/requests/${request.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          response: updatedResponsePayload,
          newStatus: request.status === 'Resolved' ? 'Resolved' : 'In Progress',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to attach reply.');
      }

      const data = await res.json();
      onReplyAttached(data.request);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send reply.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    const fullText = `${subject ? `Subject: ${subject}\n\n` : ''}${greeting}\n\n${body}\n\n${nextSteps.length > 0 ? `Next Steps:\n${nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n` : ''}${slaCommitment ? `Commitment: ${slaCommitment}\n\n` : ''}${signOff}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">AI Professional Response Composer</h2>
                <CategoryBadge category={request.category} size="sm" />
                <UrgencyBadge urgency={request.urgency} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Drafting contextual response for <strong className="text-slate-200">{request.requesterName}</strong> &bull; Ticket <span className="font-mono text-slate-300">{request.id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left controls + Right editor */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Settings (Tone & Templates) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Ticket Context Excerpt */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Inbound Request Excerpt</div>
              <p className="text-slate-200 font-medium italic line-clamp-2">"{request.rawText}"</p>
              <div className="text-[11px] text-slate-400 font-mono">Sub-domain: {request.subCategory}</div>
            </div>

            {/* 1. Tone Control */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center justify-between">
                <span>1. Tone Control</span>
                <span className="text-[10px] font-normal text-slate-500">Affects vocabulary & urgency</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['formal', 'friendly', 'urgent'] as ResponseTone[]).map((t) => {
                  const cfg = TONE_CONFIGS[t];
                  const isSelected = tone === t;

                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTone(t);
                        if (generatedDraft) {
                          handleGenerate(t);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold capitalize mb-1">{t}</div>
                      <span className="text-[10px] opacity-75 line-clamp-1">
                        {t === 'formal' ? 'Corporate' : t === 'friendly' ? 'Warm' : 'High Priority'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                {TONE_CONFIGS[tone].description}
              </p>
            </div>

            {/* 2. Category-Connected Template */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2 flex items-center justify-between">
                <span>2. Response Template</span>
                <span className="text-[10px] font-mono text-indigo-400">{request.category} Linked</span>
              </label>

              <div className="space-y-2">
                {categoryTemplates.map((tmpl) => {
                  const isSelected = selectedTemplateId === tmpl.id;

                  return (
                    <div
                      key={tmpl.id}
                      onClick={() => handleTemplateSelect(tmpl)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-850 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-200">{tmpl.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          Rec: {tmpl.recommendedTone}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Custom Instructions / Notes */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                3. Custom Instructions (Optional)
              </label>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g. Include tracking #FEDEX-9921 or specify pickup locker #4"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Generate Trigger Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Drafting with Gemini AI ({tone} tone)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>{generatedDraft ? 'Regenerate Response' : 'Generate Response with AI'}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Editable Preview & Delivery */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {generatedDraft ? (
              <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex-1 flex flex-col justify-between">
                
                <div className="space-y-3">
                  {/* Subject */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Subject Line
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Greeting & Body */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Response Message
                    </label>
                    <input
                      type="text"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      className="w-full px-3 py-1.5 mb-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <textarea
                      rows={6}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                    />
                  </div>

                  {/* Key Next Steps */}
                  {nextSteps.length > 0 && (
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Actionable Next Steps
                      </label>
                      <div className="space-y-1.5">
                        {nextSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SLA Commitment & Sign-off */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        SLA Commitment
                      </label>
                      <input
                        type="text"
                        value={slaCommitment}
                        onChange={(e) => setSlaCommitment(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Sign-off
                      </label>
                      <input
                        type="text"
                        value={signOff}
                        onChange={(e) => setSignOff(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Toolbar: Copy + Send */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 font-mono">
                    Engine: {generatedDraft.engine}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Reply'}</span>
                    </button>

                    <button
                      onClick={handleSendReply}
                      disabled={isSending}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Sending...' : 'Send & Attach to Ticket'}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 border-dashed rounded-2xl p-10 text-center text-slate-500 flex-1 flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">No Response Drafted Yet</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Choose a tone on the left (Formal, Friendly, or Urgent) and click "Generate Response with AI" to construct a contextual reply.
                </p>
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Draft Now</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
