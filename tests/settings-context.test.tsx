import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// FIX: Importing the restored Provider and Hook from their respective isolated modules
import { SettingsProvider } from '../src/providers/SettingsProvider';
import { useSettings } from '../src/contexts/SettingsContext';

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('SettingsContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('uses NGN and DD/MM/YYYY as the default preferences', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.currency).toBe('NGN');
    expect(result.current.dateFormat).toBe('DD/MM/YYYY');
  });

  it('restores saved currency and date format from localStorage', () => {
    localStorage.setItem('bound-currency', 'USD');
    localStorage.setItem('bound-dateformat', 'MM/DD/YYYY');

    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.currency).toBe('USD');
    expect(result.current.dateFormat).toBe('MM/DD/YYYY');
  });

  it('updates and persists the selected currency', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.setCurrency('GBP');
    });

    expect(result.current.currency).toBe('GBP');

    await waitFor(() => {
      expect(localStorage.getItem('bound-currency')).toBe('GBP');
    });
  });

  it('updates and persists the selected date format', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    act(() => {
      result.current.setDateFormat('YYYY-MM-DD');
    });

    expect(result.current.dateFormat).toBe('YYYY-MM-DD');

    await waitFor(() => {
      expect(localStorage.getItem('bound-dateformat')).toBe('YYYY-MM-DD');
    });
  });

  it('formats currency using the selected currency', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    const naira = result.current.formatCurrency(1500);

    expect(naira).toContain('1,500');

    act(() => {
      result.current.setCurrency('USD');
    });

    expect(result.current.formatCurrency(1500)).toContain('$');
  });

  it('formats dates according to the selected date format', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    const date = '2026-11-14T12:00:00.000Z';

    expect(result.current.formatDate(date)).toBe('14/11/2026');

    act(() => {
      result.current.setDateFormat('MM/DD/YYYY');
    });

    expect(result.current.formatDate(date)).toBe('11/14/2026');

    act(() => {
      result.current.setDateFormat('YYYY-MM-DD');
    });

    expect(result.current.formatDate(date)).toBe('2026-11-14');
  });

  it('returns a dash when the date is null', () => {
    const { result } = renderHook(() => useSettings(), { wrapper });

    expect(result.current.formatDate(null)).toBe('—');
  });
});