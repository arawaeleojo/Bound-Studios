import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

// A standardized, accessible text input component with integrated label and validation error support
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        
        {/* Enforce theme-aware text contrast when the browser autofills the input */}
        <style>{`
          .bound-autofill-fix:-webkit-autofill {
            transition: background-color 9999s ease-in-out 0s !important;
            -webkit-text-fill-color: #0f172a !important; 
          }
          .dark .bound-autofill-fix:-webkit-autofill {
            -webkit-text-fill-color: #f8fafc !important; 
          }
        `}</style>

        <input
          type={type}
          className={cn(
            'bound-autofill-fix flex h-10 w-full rounded-md border border-brand-border bg-brand-card px-3 py-2 text-sm text-content-primary placeholder:text-content-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-[var(--status-lost)] focus-visible:ring-[var(--status-lost)]',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-sm text-[var(--status-lost)]">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';