import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  wrapperClassName?: string;
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, label, error, children, ...props }, ref) => {
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && <label className="text-sm font-medium text-content-primary">{label}</label>}
        <div className="relative flex items-center">
          <select
            ref={ref}
            className={cn(
              "glass-input w-full appearance-none rounded-lg py-2 pl-3 pr-9 text-sm text-content-primary outline-none focus:border-action-primary focus:ring-2 focus:ring-action-primary/30 cursor-pointer",
              // FIX: Forces native dark mode UI and explicitly colors the dropdown options
              "dark:[color-scheme:dark] [&>option]:bg-brand-card [&>option]:text-content-primary",
              error && "border-[var(--status-lost)] focus:border-[var(--status-lost)] focus:ring-[var(--status-lost)]/20",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-content-secondary" />
        </div>
        {error && <span className="text-xs text-[var(--status-lost)] font-medium">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';