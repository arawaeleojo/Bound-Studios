import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Drawer Panel */}
      <div 
        className={cn(
          "relative flex h-full w-full flex-col bg-brand-main shadow-2xl transition-transform duration-300 sm:w-[480px]",
          "border-l border-brand-border"
        )}
      >
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-serif text-2xl text-content-primary">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-content-secondary transition-colors hover:bg-brand-hover hover:text-content-primary"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};