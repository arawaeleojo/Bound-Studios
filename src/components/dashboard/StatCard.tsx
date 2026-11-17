import React from 'react';
import { cn } from '../../utils/cn';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string; 
  icon: LucideIcon;
  variant?: 'default' | 'highlight' | 'warning';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, variant = 'default' }) => {
  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-xl border p-5 transition-colors",
      variant === 'default' && "border-brand-border bg-brand-card text-content-primary",
      variant === 'highlight' && "border-[var(--status-new-bg)] bg-[var(--status-new-bg)]/30 text-content-primary dark:bg-[var(--status-new-bg)] dark:border-[var(--status-new)]/20",
      variant === 'warning' && "border-[var(--status-lost-bg)] bg-[var(--status-lost-bg)]/40 text-content-primary dark:bg-[var(--status-lost-bg)] dark:border-[var(--status-lost)]/20"
    )}>
      <div className="flex items-center justify-between">
        <Icon className={cn(
          "h-5 w-5",
          variant === 'default' ? "text-content-secondary" : "text-current opacity-80"
        )} />
      </div>
      <div>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <div className={cn(
          "text-sm font-medium mt-1",
          variant === 'default' ? "text-content-secondary" : "text-current opacity-90"
        )}>{title}</div>
      </div>
    </div>
  );
};