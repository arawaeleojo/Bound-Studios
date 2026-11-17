import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { SettingsContext } from '../contexts/SettingsContext';
import type { Currency, DateFormat } from '../contexts/SettingsContext';

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Initializes regional settings from localStorage with safe fallback defaults
  const [currency, setCurrency] = useState<Currency>(() => 
    (localStorage.getItem('bound-currency') as Currency) || 'NGN'
  );
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => 
    (localStorage.getItem('bound-dateformat') as DateFormat) || 'DD/MM/YYYY'
  );

  // Persists preferences to localStorage, safely catching blocked storage exceptions
  useEffect(() => {
    try { 
      localStorage.setItem('bound-currency', currency); 
    } catch (error) {
      console.warn('Storage blocked:', error);
    }
  }, [currency]);
  
  useEffect(() => {
    try { 
      localStorage.setItem('bound-dateformat', dateFormat); 
    } catch (error) {
      console.warn('Storage blocked:', error);
    }
  }, [dateFormat]);

  // Dynamically maps the selected currency to its corresponding Intl locale
  const formatCurrency = (amount: number) => {
    const locales: Record<Currency, string> = { NGN: 'en-NG', USD: 'en-US', GBP: 'en-GB', EUR: 'en-IE' };
    return new Intl.NumberFormat(locales[currency], { style: 'currency', currency }).format(amount);
  };

  // Safely parses and formats ISO date strings based on user preferences
  const formatDate = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      const date = parseISO(isoString);
      switch (dateFormat) {
        case 'MM/DD/YYYY': return format(date, 'MM/dd/yyyy');
        case 'YYYY-MM-DD': return format(date, 'yyyy-MM-dd');
        case 'DD/MM/YYYY':
        default: return format(date, 'dd/MM/yyyy');
      }
    } catch (error) {
      console.warn('Invalid date string:', error);
      return '—';
    }
  };

  return (
    <SettingsContext.Provider value={{ currency, setCurrency, dateFormat, setDateFormat, formatCurrency, formatDate }}>
      {children}
    </SettingsContext.Provider>
  );
}