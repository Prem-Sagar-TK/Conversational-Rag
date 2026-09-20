import React, { useMemo, useState } from 'react';
import { Search, MessageSquarePlus, MessageSquare, Trash2, Sparkles } from 'lucide-react';
import { ConversationSummaryItem } from '../types';
import { useStudioTheme } from '../context/StudioTheme';
import { formatChatTime } from '../utils/theme';

interface ConversationSidebarProps {
  conversations: ConversationSummaryItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}) => {
  const { currentAccent, setMobilePanel } = useStudioTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((conv) => conv.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  return (
    <div className="w-full md:w-80 lg:w-[340px] xl:w-[380px] h-full flex flex-col flex-shrink-0 border-r bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Chats</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${currentAccent.bgSubtle} ${currentAccent.text}`}>
              {conversations.length}
            </span>
          </div>
          <button
            onClick={() => {
              onNewChat();
              setMobilePanel('chat');
            }}
            className={`p-2 rounded-xl text-white shadow-sm transition-transform hover:scale-105 ${currentAccent.bg}`}
            title="New conversation"
            aria-label="New conversation"
          >
            <MessageSquarePlus className="w-4 h-4" />
          </button>
        </div>

        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${currentAccent.ring}
              bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400`}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">Start a new chat to ask grounded questions about your documents.</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isActive = conv.conversation_id === activeId;
            return (
              <div
                key={conv.conversation_id}
                onClick={() => {
                  onSelect(conv.conversation_id);
                  setMobilePanel('chat');
                }}
                className={`group flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-800/80 ${
                  isActive
                    ? 'bg-indigo-50/80 dark:bg-slate-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white ${currentAccent.bg}`}
                >
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{conv.title}</h3>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">{formatChatTime(conv.updated_at)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.message_count} {conv.message_count === 1 ? 'message' : 'messages'}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(conv.conversation_id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
