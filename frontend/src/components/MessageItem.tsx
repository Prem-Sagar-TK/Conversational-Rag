import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, BookOpen, Sparkles } from 'lucide-react';
import { Message } from '../types';
import { CitationCard } from './CitationCard';
import { RagTransparencyPanel } from './RagTransparencyPanel';
import { useStudioTheme } from '../context/StudioTheme';
import { formatChatTime } from '../utils/theme';

interface MessageItemProps {
  message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const { currentAccent } = useStudioTheme();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end my-1.5 animate-fade-in">
        <div className="max-w-[85%] sm:max-w-[75%] md:max-w-[68%]">
          <div className={`rounded-2xl rounded-tr-md px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${currentAccent.bubble}`}>
            <p className="whitespace-pre-wrap">{message.content}</p>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-white/70">{formatChatTime(message.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col items-start my-1.5 animate-fade-in">
      <div className="flex items-end space-x-2 max-w-[92%] md:max-w-[80%]">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0 mb-1 ${currentAccent.bg}`}>
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <div className="relative rounded-2xl rounded-tl-md px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200/80 dark:border-slate-700">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <div className="prose-rag text-sm pr-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-slate-400">{formatChatTime(message.timestamp)}</span>
            </div>
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sources ({message.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {message.sources.map((citation, idx) => (
                  <CitationCard key={citation.chunk_id || idx} citation={citation} index={idx} />
                ))}
              </div>
            </div>
          )}

          <RagTransparencyPanel
            originalQuery={message.original_query}
            rewrittenQuery={message.rewritten_query}
            sources={message.sources}
            summaryState={message.summary_state}
            recentMessageCount={message.recent_message_count}
          />
        </div>
      </div>
    </div>
  );
};
