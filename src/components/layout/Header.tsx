import React from 'react';
import { Menu } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    // FIX: Changed from `sticky z-20` to `fixed left-0 right-0 z-50` to guarantee viewport anchoring
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-brand-border bg-brand-main px-4 lg:hidden">
      <button 
        onClick={onMenuClick} 
        className="text-content-primary hover:text-content-secondary p-1 -ml-1"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      
      <NotificationBell />
    </header>
  );
};