import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// FIX: Importing the restored Provider and Hook from their respective isolated modules
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { useTheme } from '../src/components/ThemeProvider';

let systemPrefersDark = false;
let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;

let mockMediaQuery: {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: ReturnType<typeof vi.fn>;
  removeListener: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
};

const mockMatchMedia = () => {
  mockMediaQuery = {
    matches: systemPrefersDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(
      (_event: string, handler: (event: MediaQueryListEvent) => void) => {
        changeHandler = handler;
      }
    ),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => mockMediaQuery),
  });
};

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('light', 'dark');
    systemPrefersDark = false;
    changeHandler = undefined;
    mockMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('defaults to system theme when no preference is saved', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
    expect(result.current.activeTheme).toBe('light');
  });

  it('restores a saved theme preference', () => {
    localStorage.setItem('bound-theme', 'dark');

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('dark');
    expect(result.current.activeTheme).toBe('dark');
  });

  it('applies the dark theme to the document', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.activeTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies the light theme to the document', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.activeTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persists the selected theme in localStorage', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setTheme('dark');
    });

    await waitFor(() => {
      expect(localStorage.getItem('bound-theme')).toBe('dark');
    });
  });

  it('resolves system theme to dark when the operating system prefers dark mode', () => {
    systemPrefersDark = true;
    mockMatchMedia();

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
    expect(result.current.activeTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('resolves system theme to light when the operating system prefers light mode', () => {
    systemPrefersDark = false;
    mockMatchMedia();

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe('system');
    expect(result.current.activeTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('updates the active theme when the system preference changes', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
  
    // Initially, the system prefers light mode.
    expect(result.current.theme).toBe('system');
    expect(result.current.activeTheme).toBe('light');
  
    // Simulate the operating system switching to dark mode.
    act(() => {
      mockMediaQuery.matches = true;
      changeHandler?.({ matches: true } as MediaQueryListEvent);
    });
  
    expect(result.current.activeTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  
    // Simulate the operating system switching back to light mode.
    act(() => {
      mockMediaQuery.matches = false;
      changeHandler?.({ matches: false } as MediaQueryListEvent);
    });
  
    expect(result.current.activeTheme).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});