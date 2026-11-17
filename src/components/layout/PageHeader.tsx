import React from 'react';
import { NotificationBell } from '../notifications/NotificationBell';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action }) => {
  return (
    // Sticky positioning keeps the header visible while scrolling on desktop
    <div className="md:sticky md:top-0 z-40 bg-brand-main pt-6 pb-6 md:pt-8 md:pb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-normal tracking-tight text-content-primary md:text-4xl">
          {title}
        </h1>
        <p className="mt-1 text-content-secondary">
          {subtitle}
        </p>
      </div>
      
      <div className={`flex items-center justify-between sm:justify-end gap-4 ${!action ? 'hidden lg:flex' : ''}`}>
        {action && <div className="w-full sm:w-auto">{action}</div>}
        
        {/* Render contextual actions alongside the global notification bell on desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <NotificationBell />
        </div>
      </div>
    </div>
  );
};