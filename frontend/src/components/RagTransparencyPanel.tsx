import React, { useState } from 'react';
import { Sparkles, Database, Brain, ChevronDown, ChevronUp } from 'lucide-react';
import { Citation } from '../types';

interface RagTransparencyPanelProps {
  originalQuery?: string;
  rewrittenQuery?: string;
  sources?: Citation[];
  summaryState?: string | null;
  recentMessageCount?: number;
}

export const RagTransparencyPanel: React.FC<RagTransparencyPanelProps> = ({
  originalQuery,
  rewrittenQuery,
  sources,
  summaryState,
  recentMessageCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!rewrittenQuery && (!sources || sources.length === 0)) {
    return null;
  }

  const isRewritten =
    originalQuery &&
    rewrittenQuery &&
    originalQuery.trim().toLowerCase() !== rewrittenQuery.trim().toLowerCase();

  return (
    <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/80 dark:bg-slate-900/80 overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-500 dark:text-slate-400"
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span className="font-medium text-slate-600 dark:text-slate-300">RAG details</span>
          {isRewritten && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              Query rewritten
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-[11px]">
          <span>{sources?.length || 0} sources</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 space-y-3 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase text-slate-400 block mb-1">Original</span>
              <span className="text-slate-700 dark:text-slate-200">"{originalQuery || 'N/A'}"</span>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] uppercase text-indigo-500 block mb-1">Retrieval query</span>
              <span className="text-indigo-800 dark:text-indigo-200 font-medium">
                "{rewrittenQuery || originalQuery}"
              </span>
            </div>
          </div>

          {sources && sources.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span>Retrieved chunks</span>
              </div>
              {sources.map((s, idx) => (
                <div key={s.chunk_id || idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-1 font-medium text-slate-700 dark:text-slate-200">
                    <span>
                      #{idx + 1} {s.document}
                      {s.page ? ` · p.${s.page}` : ''}
                    </span>
                    {s.score != null && (
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {(s.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {s.snippet && <p className="text-slate-500 italic line-clamp-2">"{s.snippet}"</p>}
                </div>
              ))}
            </div>
          )}

          <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <Brain className="w-3.5 h-3.5 text-emerald-500" />
                <span>Memory</span>
              </div>
              <span className="text-[10px] text-slate-400">Window: {recentMessageCount ?? 0} turns</span>
            </div>
            {summaryState ? (
              <p className="mt-1 text-slate-500 italic">{summaryState}</p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-400 italic">Summary not triggered yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
