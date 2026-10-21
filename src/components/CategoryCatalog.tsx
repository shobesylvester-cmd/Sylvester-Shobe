import React from 'react';
import { 
  Users, 
  Laptop, 
  DollarSign, 
  Briefcase, 
  Clock, 
  User, 
  Tag, 
  ArrowRight, 
  Play, 
  Layers,
  Sparkles,
  Inbox
} from 'lucide-react';
import { CATEGORIES_CONFIG } from '../data/categories.ts';
import { DepartmentCategory, ClassifiedRequest } from '../types/classifier.ts';

interface CategoryCatalogProps {
  requests: ClassifiedRequest[];
  onTestPrompt: (sampleText: string, defaultRequester: string) => void;
}

export const CategoryCatalog: React.FC<CategoryCatalogProps> = ({
  requests,
  onTestPrompt,
}) => {
  const getCategoryCount = (cat: DepartmentCategory) => {
    return requests.filter((r) => r.category === cat).length;
  };

  const getCategoryIcon = (id: DepartmentCategory) => {
    switch (id) {
      case 'HR': return <Users className="w-6 h-6 text-rose-400" />;
      case 'IT': return <Laptop className="w-6 h-6 text-indigo-400" />;
      case 'Finance': return <DollarSign className="w-6 h-6 text-emerald-400" />;
      case 'Operations': return <Briefcase className="w-6 h-6 text-amber-400" />;
    }
  };

  const categories = Object.values(CATEGORIES_CONFIG);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          <span>Department Taxonomy Specification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Enterprise Categories: HR, IT, Finance, Operations
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Detailed taxonomy definitions, expected SLAs, dispatch queues, and sub-category routing logic governing incoming request classifications.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((cat) => {
          const count = getCategoryCount(cat.id);

          return (
            <div
              key={cat.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all relative overflow-hidden"
            >
              {/* Category accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: cat.accentColor }}
              />

              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      {getCategoryIcon(cat.id)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>{cat.name}</span>
                        <span className="text-xs font-mono font-normal text-slate-400">({cat.id})</span>
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-indigo-400">{cat.dispatchQueue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase">Stored Tickets</div>
                    <div className="text-lg font-extrabold text-white flex items-center justify-end gap-1">
                      <Inbox className="w-4 h-4 text-slate-400" />
                      <span>{count}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {cat.description}
                </p>

                {/* Subcategories */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Managed Sub-Domains
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.subCategories.map((sub, i) => (
                      <span
                        key={i}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sample Triggers with 1-Click Test Button */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Sample Inbound Triggers</span>
                    <span className="text-[10px] text-slate-500 normal-case">Click to test classifier</span>
                  </div>
                  <div className="space-y-1.5">
                    {cat.sampleTriggers.map((sample, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => onTestPrompt(sample, `${cat.id} Test User`)}
                        className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 text-slate-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate pr-2">"{sample}"</span>
                        <Play className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer info: SLA & Team Lead */}
              <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target SLA:</span>
                  <span className="font-semibold text-slate-200">{cat.defaultSLA}</span>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="truncate max-w-[200px] text-slate-300">{cat.primaryLead}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
