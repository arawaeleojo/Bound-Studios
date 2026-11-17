import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

// A reusable, polymorphic button component providing standard design system variants
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-secondary disabled:pointer-events-none disabled:opacity-50',
          {
            // Map design system variants to Tailwind utility classes
            'bg-action-primary text-action-primary-text hover:opacity-90': variant === 'primary',
            'bg-brand-elevated text-content-primary hover:bg-brand-hover': variant === 'secondary',
            'border border-brand-border bg-transparent hover:bg-brand-hover': variant === 'outline',
            'hover:bg-brand-hover text-content-primary': variant === 'ghost',
            // Scale padding and typography based on the requested size
            'h-8 px-3 text-sm rounded-sm': size === 'sm',
            'h-10 px-4 py-2 rounded-md': size === 'md',
            'h-12 px-6 text-lg rounded-md': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';