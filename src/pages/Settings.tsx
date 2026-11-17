import { useState } from 'react';
import { useTheme } from '../components/ThemeProvider';
import { useSettings } from '../contexts/SettingsContext';

// Import strict type definitions for regional settings
import type { Currency, DateFormat } from '../contexts/SettingsContext';

import { useToast } from '../contexts/ToastContext';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../utils/cn';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { currency, setCurrency, dateFormat, setDateFormat } = useSettings();
  const { showToast } = useToast();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Purge all application data from localStorage and trigger a hard reload to reset the workspace state
  const handleResetData = () => {
    localStorage.setItem('bound_enquiries', '[]');
    localStorage.setItem('bound_followups', '[]');
    localStorage.setItem('bound_read_notifications', '[]');
    localStorage.setItem('bound_dismissed_notifications', '[]');
    
    setIsResetDialogOpen(false);
    showToast('Workspace cleared successfully. Reloading...', 'success');
    
    setTimeout(() => {
      setTheme('system');
      window.location.reload();
    }, 1500);
  };

  // Available UI theme configurations and their corresponding icons
  const themeOptions = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-10 pb-12">
      <PageHeader 
        title="Settings" 
        subtitle="Manage your workspace preferences and application appearance." 
      />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        {/* Workspace Profile */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div>
            <h2 className="font-serif text-2xl text-content-primary">Workspace Information</h2>
            <p className="mt-1 text-sm text-content-secondary">Read-only information about the current workspace.</p>
          </div>
          
          <div className="flex flex-col gap-6 rounded-xl border border-brand-border bg-brand-card p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Studio Name" defaultValue="Bound Studios" disabled />
              <Input label="Application Name" defaultValue="Enquiry Manager" disabled />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Application Version" defaultValue="1.0.0" disabled />
            </div>
            <p className="text-sm text-content-secondary pt-4 border-t border-brand-border">
              Internal enquiry management workspace. Studio administration and account management are disabled in this environment.
            </p>
          </div>

          {/* Regional Settings */}
          <div className="mt-4">
            <h2 className="font-serif text-2xl text-content-primary">Regional Preferences</h2>
            <p className="mt-1 text-sm text-content-secondary">Customize how numbers and dates are displayed.</p>
          </div>
          <div className="flex flex-col gap-6 rounded-xl border border-brand-border bg-brand-card p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Select 
                label="Currency" 
                value={currency} 
                onChange={(e) => {
                  setCurrency(e.target.value as Currency);
                  showToast(`Currency updated to ${e.target.value}`, 'success');
                }}
              >
                <option value="NGN">Nigerian Naira (₦)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="EUR">Euro (€)</option>
              </Select>
              <Select 
                label="Date Format" 
                value={dateFormat} 
                onChange={(e) => {
                  setDateFormat(e.target.value as DateFormat);
                  showToast('Date format updated', 'success');
                }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (23/04/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (04/23/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-04-23)</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Sidebar Settings (Appearance & Data) */}
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-2xl text-content-primary">Appearance</h2>
              <p className="mt-1 text-sm text-content-secondary">Customize the interface theme.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-card p-4">
              {themeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors border",
                    theme === opt.id 
                      ? "bg-action-secondary/10 border-action-secondary text-content-primary"
                      : "border-transparent text-content-secondary hover:bg-brand-hover hover:text-content-primary"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label} theme
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-2xl text-content-primary">Data Storage</h2>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-card p-6">
              <p className="text-sm text-content-secondary mb-4">
                Enquiry records are stored locally in your browser using <strong>localStorage</strong>. Data is not synchronized across devices. Clearing your browser storage may remove saved records.
              </p>
              <Button 
                variant="outline" 
                className="w-full text-[var(--status-lost)] hover:bg-[var(--status-lost-bg)] hover:border-[var(--status-lost)]"
                onClick={() => setIsResetDialogOpen(true)}
              >
                Clear local data
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetData}
        title="Clear Application Data?"
        message="This will permanently delete all saved enquiries and follow-ups from your browser's storage, leaving you with a completely blank workspace. This cannot be undone."
        confirmText="Yes, clear data"
      />
    </div>
  );
};