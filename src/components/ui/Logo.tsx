import React from 'react';
import { cn } from '../../utils/cn';

interface LogoProps {
  className?: string;
  collapsed?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, collapsed }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-action-primary text-brand-main font-serif text-xl italic">
        B
      </div>
      {!collapsed && (
        <div className="flex flex-col">
          <span className="font-serif text-2xl leading-none tracking-tight text-content-sidebar">
            Bound
          </span>
          <span className="font-sans text-[0.65rem] font-medium tracking-[0.2em] text-content-sidebar opacity-80">
            STUDIOS
          </span>
        </div>
      )}
    </div>
  );
};