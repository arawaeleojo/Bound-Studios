import { createContext, useContext } from 'react';

export type Theme = 'light' | 'dark' | 'system';

// Defines the contract for application-wide theme state management
export interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  activeTheme: 'light' | 'dark';
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook providing safe access to read or mutate the active UI theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}