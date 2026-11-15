import React, { useEffect, useState } from 'react';
import { ThemeContext } from '../components/ThemeProvider';
import type { Theme } from '../components/ThemeProvider';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('bound-theme') as Theme) || 'system';
  });

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (selectedTheme: Theme) => {
      root.classList.remove('light', 'dark');
      const resolved = selectedTheme === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light') 
        : selectedTheme;
      
      root.classList.add(resolved);
      setActiveTheme(resolved);
    };

    applyTheme(theme);
    
    // Safety fallback for localStorage resilience (preserved from ESLint fixes)
    try {
      localStorage.setItem('bound-theme', theme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage:', e);
    }

    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}