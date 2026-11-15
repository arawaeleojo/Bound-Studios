import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { Settings } from '../src/pages/Settings';
import { MemoryRouter } from 'react-router-dom';

// FIX: Importing all restored Providers from the dedicated providers directory
import { ThemeProvider } from '../src/providers/ThemeProvider';
import { SettingsProvider } from '../src/providers/SettingsProvider';
import { ToastProvider } from '../src/providers/ToastProvider';

import { FollowUpsProvider } from '../src/hooks/useFollowUps';
import { EnquiriesProvider } from '../src/hooks/useEnquiries';

const renderSettings = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <SettingsProvider>
            <ToastProvider>
              <FollowUpsProvider>
                <EnquiriesProvider>
                  <Settings />
                </EnquiriesProvider>
              </FollowUpsProvider>
            </ToastProvider>
          </SettingsProvider>
        </ThemeProvider>
      </MemoryRouter>
    );
  };

describe('Settings page', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('changes currency and saves the preference', async () => {
    renderSettings();

    const dropdowns = screen.getAllByRole('combobox');

    fireEvent.change(dropdowns[0], {
      target: { value: 'USD' },
    });

    await waitFor(() => {
      expect(localStorage.getItem('bound-currency')).toBe('USD');
    });

    expect(dropdowns[0]).toHaveValue('USD');
    expect(screen.getByText('Currency updated to USD')).toBeInTheDocument();
  });

  it('changes date format and saves the preference', async () => {
    renderSettings();

    const dropdowns = screen.getAllByRole('combobox');

    fireEvent.change(dropdowns[1], {
      target: { value: 'YYYY-MM-DD' },
    });

    await waitFor(() => {
      expect(localStorage.getItem('bound-dateformat')).toBe('YYYY-MM-DD');
    });

    expect(dropdowns[1]).toHaveValue('YYYY-MM-DD');
    expect(screen.getByText('Date format updated')).toBeInTheDocument();
  });

  it('allows the user to select Dark theme', async () => {
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Dark theme' }));

    await waitFor(() => {
      expect(localStorage.getItem('bound-theme')).toBe('dark');
    });

    expect(document.documentElement).toHaveClass('dark');
  });

  it('allows the user to select Light theme', async () => {
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'Light theme' }));

    await waitFor(() => {
      expect(localStorage.getItem('bound-theme')).toBe('light');
    });

    expect(document.documentElement).toHaveClass('light');
  });

  it('allows the user to select System theme', async () => {
    renderSettings();

    fireEvent.click(screen.getByRole('button', { name: 'System theme' }));

    await waitFor(() => {
      expect(localStorage.getItem('bound-theme')).toBe('system');
    });
  });

  it('opens the clear-data confirmation dialog', () => {
    renderSettings();

    fireEvent.click(
      screen.getByRole('button', { name: /clear local data/i })
    );

    expect(screen.getByText('Clear Application Data?')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Yes, clear data' })
    ).toBeInTheDocument();
  });

  it('does not delete data when the user cancels the confirmation', () => {
    localStorage.setItem('bound_enquiries', '[{"id":"test-1"}]');
    localStorage.setItem('bound_followups', '[{"id":"followup-1"}]');

    renderSettings();

    fireEvent.click(
      screen.getByRole('button', { name: /clear local data/i })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('Clear Application Data?')).not.toBeInTheDocument();
    expect(localStorage.getItem('bound_enquiries')).toBe('[{"id":"test-1"}]');
    expect(localStorage.getItem('bound_followups')).toBe('[{"id":"followup-1"}]');
  });

  it('clears all application data after confirmation', () => {
    vi.useFakeTimers();

    localStorage.setItem('bound_enquiries', '[{"id":"test-1"}]');
    localStorage.setItem('bound_followups', '[{"id":"followup-1"}]');
    localStorage.setItem('bound_read_notifications', '["notification-1"]');
    localStorage.setItem('bound_dismissed_notifications', '["notification-2"]');

    renderSettings();

    fireEvent.click(
      screen.getByRole('button', { name: /clear local data/i })
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Yes, clear data' })
    );

    expect(localStorage.getItem('bound_enquiries')).toBe('[]');
    expect(localStorage.getItem('bound_followups')).toBe('[]');
    expect(localStorage.getItem('bound_read_notifications')).toBe('[]');
    expect(localStorage.getItem('bound_dismissed_notifications')).toBe('[]');

    expect(
      screen.queryByText('Clear Application Data?')
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('Workspace cleared successfully. Reloading...')
    ).toBeInTheDocument();
  });
});