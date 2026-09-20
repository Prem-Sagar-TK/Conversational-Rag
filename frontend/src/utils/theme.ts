export type AccentColor = 'indigo' | 'teal' | 'blue' | 'emerald' | 'violet' | 'rose';

export interface AccentClasses {
  bg: string;
  bgHover: string;
  bgSubtle: string;
  text: string;
  textMuted: string;
  border: string;
  ring: string;
  badge: string;
  bubble: string;
  iconActive: string;
  indicator: string;
}

export const accentColorMap: Record<AccentColor, AccentClasses> = {
  indigo: {
    bg: 'bg-indigo-600',
    bgHover: 'hover:bg-indigo-700',
    bgSubtle: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    textMuted: 'text-indigo-500/80',
    border: 'border-indigo-500',
    ring: 'focus:ring-indigo-500',
    badge: 'bg-indigo-600 text-white',
    bubble: 'bg-indigo-600 text-white',
    iconActive: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50',
    indicator: 'bg-indigo-600',
  },
  teal: {
    bg: 'bg-teal-600',
    bgHover: 'hover:bg-teal-700',
    bgSubtle: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    textMuted: 'text-teal-500/80',
    border: 'border-teal-500',
    ring: 'focus:ring-teal-500',
    badge: 'bg-teal-600 text-white',
    bubble: 'bg-teal-600 text-white',
    iconActive: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50',
    indicator: 'bg-teal-600',
  },
  blue: {
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    bgSubtle: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    textMuted: 'text-blue-500/80',
    border: 'border-blue-500',
    ring: 'focus:ring-blue-500',
    badge: 'bg-blue-600 text-white',
    bubble: 'bg-blue-600 text-white',
    iconActive: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    indicator: 'bg-blue-600',
  },
  emerald: {
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    bgSubtle: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    textMuted: 'text-emerald-500/80',
    border: 'border-emerald-500',
    ring: 'focus:ring-emerald-500',
    badge: 'bg-emerald-600 text-white',
    bubble: 'bg-emerald-600 text-white',
    iconActive: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    indicator: 'bg-emerald-600',
  },
  violet: {
    bg: 'bg-violet-600',
    bgHover: 'hover:bg-violet-700',
    bgSubtle: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    textMuted: 'text-violet-500/80',
    border: 'border-violet-500',
    ring: 'focus:ring-violet-500',
    badge: 'bg-violet-600 text-white',
    bubble: 'bg-violet-600 text-white',
    iconActive: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/50',
    indicator: 'bg-violet-600',
  },
  rose: {
    bg: 'bg-rose-600',
    bgHover: 'hover:bg-rose-700',
    bgSubtle: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    textMuted: 'text-rose-500/80',
    border: 'border-rose-500',
    ring: 'focus:ring-rose-500',
    badge: 'bg-rose-600 text-white',
    bubble: 'bg-rose-600 text-white',
    iconActive: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50',
    indicator: 'bg-rose-600',
  },
};

export const formatChatTime = (iso?: string): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
