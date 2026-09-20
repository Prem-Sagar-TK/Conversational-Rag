import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccentColor, AccentClasses, accentColorMap } from '../utils/theme';

export type NavTab = 'chats' | 'documents';
export type MobilePanel = 'list' | 'chat';
export type ThemeMode = 'light' | 'dark';

interface StudioThemeContextType {
  themeMode: ThemeMode;
  toggleTheme: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  currentAccent: AccentClasses;
  navTab: NavTab;
  setNavTab: (tab: NavTab) => void;
  mobilePanel: MobilePanel;
  setMobilePanel: (panel: MobilePanel) => void;
}

const StudioThemeContext = createContext<StudioThemeContextType | undefined>(undefined);

export const StudioThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [navTab, setNavTab] = useState<NavTab>('chats');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      toggleTheme: () => setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark')),
      accentColor,
      setAccentColor,
      currentAccent: accentColorMap[accentColor],
      navTab,
      setNavTab,
      mobilePanel,
      setMobilePanel,
    }),
    [themeMode, accentColor, navTab, mobilePanel]
  );

  return <StudioThemeContext.Provider value={value}>{children}</StudioThemeContext.Provider>;
};

export const useStudioTheme = (): StudioThemeContextType => {
  const context = useContext(StudioThemeContext);
  if (!context) {
    throw new Error('useStudioTheme must be used within StudioThemeProvider');
  }
  return context;
};
