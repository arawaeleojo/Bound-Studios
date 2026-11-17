import { createContext, useContext } from 'react';

export type Currency = 'NGN' | 'USD' | 'GBP' | 'EUR';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

// Defines the contract for regional workspace preferences and formatting utilities
export interface SettingsContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  dateFormat: DateFormat;
  setDateFormat: (d: DateFormat) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (isoString: string | null) => string;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Custom hook providing safe access to regional settings across the application
export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};