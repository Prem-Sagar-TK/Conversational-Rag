import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Citation } from '../types';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export const CitationCard: React.FC<CitationCardProps> = ({ citation, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between p-2.5 cursor-pointer select-none hover:bg-slate-50 dark:hover:bg-slate-800/70"
      >
        <div className="flex items-center space-x-2 min-w-0">
          <span className="flex items-center justify-center w-5 h-5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-mono text-[10px] font-bold">
            {index + 1}
          </span>
          <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="font-medium text-slate-700 dark:text-slate-200 truncate" title={citation.document}>
            {citation.document}
          </span>
          {citation.page && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 font-mono">
              p. {citation.page}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {citation.score !== null && citation.score !== undefined && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              {(citation.score * 100).toFixed(0)}%
            </span>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>
      {expanded && citation.snippet && (
        <div className="px-3 pb-3 pt-1 text-[11px] text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800">
          <p className="italic">"{citation.snippet}"</p>
        </div>
      )}
    </div>
  );
};
