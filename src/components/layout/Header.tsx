import React from 'react';
import { Menu } from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-brand-border bg-brand-main px-4 lg:hidden">
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