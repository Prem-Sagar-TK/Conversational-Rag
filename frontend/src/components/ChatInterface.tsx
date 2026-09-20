import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Loader2,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Sliders,
  Smile,
} from 'lucide-react';
import { Message, HealthStatus } from '../types';
import { MessageItem } from './MessageItem';
import { useStudioTheme } from '../context/StudioTheme';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string, topK?: number) => Promise<void>;
  documentCount: number;
  conversationTitle: string;
  health: HealthStatus | null;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  onSendMessage,
  documentCount,
  conversationTitle,
  health,
}) => {
  const { currentAccent, setMobilePanel } = useStudioTheme();
  const [input, setInput] = useState('');
  const [topK, setTopK] = useState(4);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const commonEmojis = ['😊', '👍', '✨', '📄', '❓', '💡', '🔎', '✅'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput('');
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(trimmed, topK);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  };

  const handleStarterClick = (promptText: string) => {
    setInput(promptText);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex-1 h-full flex flex-col min-w-0 bg-slate-50/60 dark:bg-slate-950/50 relative">
      <header className="h-16 px-4 flex items-center justify-between border-b flex-shrink-0 z-20 backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={() => setMobilePanel('list')}
            className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${currentAccent.bg}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{conversationTitle}</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {health?.openai_configured ? 'Online · grounded retrieval' : 'Local fallback · grounded retrieval'}
              {' · '}
              {documentCount} {documentCount === 1 ? 'doc' : 'docs'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-all ${
            showSettings
              ? `${currentAccent.iconActive} ${currentAccent.border}`
              : 'text-slate-500 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span className="hidden sm:inline">Top-{topK}</span>
        </button>
      </header>

      {showSettings && (
        <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-4 text-xs">
          <span className="text-slate-500">Chunks to retrieve</span>
          <div className="flex items-center space-x-1.5">
            {[2, 4, 6, 8].map((k) => (
              <button
                key={k}
                onClick={() => setTopK(k)}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  topK === k ? `${currentAccent.bg} text-white` : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 chat-wallpaper">
        {messages.length === 0 ? (
          <div className="max-w-xl mx-auto pt-10 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg ${currentAccent.bg}`}>
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">Conversational RAG</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Ask a question, then follow up with “can it be carried forward?” — pronouns are rewritten before retrieval.
            </p>
            <div className="space-y-2 text-left">
              <button
                onClick={() => handleStarterClick('What are the annual leave entitlements?')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-sm text-slate-700 dark:text-slate-200"
              >
                What are the annual leave entitlements?
              </button>
              <button
                onClick={() => handleStarterClick('Can it be carried forward to next year?')}
                className="w-full text-left px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 text-sm text-slate-700 dark:text-slate-200"
              >
                Can it be carried forward to next year?
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center my-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-slate-850 text-slate-500 border border-slate-200/60 dark:border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Answers are grounded in your indexed documents</span>
              </div>
            </div>
            {messages.map((msg, index) => (
              <MessageItem key={`${msg.timestamp}-${index}`} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 my-2 animate-fade-in">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white ${currentAccent.bg}`}>
                  <Sparkles className="w-3 h-3" />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl px-3.5 py-2.5 flex items-center space-x-2 border border-slate-200 dark:border-slate-700">
                  <Loader2 className={`w-3.5 h-3.5 animate-spin ${currentAccent.text}`} />
                  <span className="text-xs text-slate-500">Rewriting query and retrieving chunks...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <footer className="p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                documentCount === 0
                  ? 'Upload a document, then type a message...'
                  : 'Type a message...'
              }
              className={`w-full resize-none max-h-32 py-2.5 pl-3 pr-10 text-sm rounded-2xl border transition-all focus:outline-none focus:ring-2 ${currentAccent.ring}
                bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-750 text-slate-900 dark:text-slate-100 placeholder-slate-400`}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 bottom-2 p-1.5 text-slate-400 hover:text-amber-500"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 right-0 w-56 p-3 rounded-2xl shadow-xl border z-50 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750">
                <div className="grid grid-cols-8 gap-1">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setInput((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="p-1.5 text-lg hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl text-white shadow-md transition-all ${
              input.trim() && !isLoading ? `${currentAccent.bg} ${currentAccent.bgHover} hover:scale-105` : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
            }`}
            title="Send"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="mt-2 text-[10px] text-center text-slate-400">Enter to send · Shift+Enter for a new line</p>
      </footer>
    </div>
  );
};
