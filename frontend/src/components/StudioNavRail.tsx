import React, { useState } from 'react';
import {
  MessageSquare,
  HardDrive,
  Palette,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useStudioTheme, NavTab } from '../context/StudioTheme';
import { AccentColor } from '../utils/theme';
import { HealthStatus } from '../types';

interface StudioNavRailProps {
  documentCount: number;
  conversationCount: number;
  health: HealthStatus | null;
}

export const StudioNavRail: React.FC<StudioNavRailProps> = ({
  documentCount,
  conversationCount,
  health,
}) => {
  const {
    navTab,
    setNavTab,
    themeMode,
    toggleTheme,
    accentColor,
    setAccentColor,
    currentAccent,
    setMobilePanel,
  } = useStudioTheme();

  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors: { key: AccentColor; name: string; bg: string }[] = [
    { key: 'indigo', name: 'Indigo', bg: 'bg-indigo-600' },
    { key: 'teal', name: 'Teal', bg: 'bg-teal-600' },
    { key: 'blue', name: 'Blue', bg: 'bg-blue-600' },
    { key: 'emerald', name: 'Emerald', bg: 'bg-emerald-600' },
    { key: 'violet', name: 'Violet', bg: 'bg-violet-600' },
    { key: 'rose', name: 'Rose', bg: 'bg-rose-600' },
  ];

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'chats', label: 'Chats', icon: MessageSquare, badge: conversationCount },
    { id: 'documents', label: 'Documents', icon: HardDrive, badge: documentCount },
  ];

  return (
    <aside className="w-16 lg:w-[72px] h-full flex flex-col items-center justify-between py-4 select-none border-r z-30 transition-colors duration-200 bg-slate-50 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800">
      <div className="flex flex-col items-center space-y-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${currentAccent.bg}`}
          title="Conversational RAG Studio"
        >
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="relative" title={health?.openai_configured ? 'LLM Active' : 'Local fallback'}>
          <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
            AI
          </div>
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
              health?.openai_configured ? 'bg-emerald-500' : 'bg-amber-400'
            }`}
          />
        </div>
      </div>

      <nav className="flex flex-col items-center space-y-2.5 my-auto w-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = navTab === item.id;
          return (
            <div key={item.id} className="relative w-full flex justify-center group">
              <button
                onClick={() => {
                  setNavTab(item.id);
                  setMobilePanel('list');
                }}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all relative ${
                  isActive
                    ? `${currentAccent.iconActive} font-semibold shadow-sm`
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
                title={item.label}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${currentAccent.badge} ring-2 ring-white dark:ring-slate-900 shadow-sm`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
              {isActive && (
                <span className={`absolute top-2 bottom-2 left-0 w-1 rounded-r-full ${currentAccent.indicator}`} />
              )}
            </div>
          );
        })}
      </nav>

      <div className="flex flex-col items-center space-y-2 relative">
        {health && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400"
            title={health.openai_configured ? 'OpenAI configured' : 'Using local fallback embeddings'}
          >
            {health.openai_configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400" />
            )}
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
            title="Accent color"
            aria-label="Accent color"
          >
            <Palette className="w-5 h-5" />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-0 left-14 p-2.5 rounded-xl shadow-xl border z-50 flex items-center space-x-2 bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-700 animate-fade-in">
              {colors.map((c) => (
                <button
                  key={c.key}
                  onClick={() => {
                    setAccentColor(c.key);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full ${c.bg} transition-transform hover:scale-125 ${
                    accentColor === c.key ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110' : ''
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors"
          title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}
          aria-label="Toggle theme"
        >
          {themeMode === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-400" />}
        </button>
      </div>
    </aside>
  );
};
