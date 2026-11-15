import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Inbox, Calendar, BarChart2, Settings, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Enquiries', path: '/enquiries', icon: Inbox },
    { name: 'Follow-ups', path: '/follow-ups', icon: Calendar },
    { name: 'Statistics', path: '/statistics', icon: BarChart2 },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Panel */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-[60] flex w-64 flex-col justify-between bg-brand-sidebar px-4 py-6 transition-transform duration-300 lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col gap-8">
          <div className="flex items-center justify-between px-2">
            
            <img 
              src="/assets/bound-studios-logo.png" 
              alt="Bound Studios" 
              className="h-10 w-auto max-w-[180px] object-contain block" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />

            <span className="hidden font-serif text-2xl font-medium tracking-tight text-content-sidebar">
              Bound.
            </span>

            <button onClick={onClose} className="text-content-sidebar hover:text-white lg:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      // FIX: Uses primary action color and dark text for contrast
                      ? 'bg-action-primary text-action-primary-text font-semibold shadow-sm'
                      // FIX: Increased base opacity (80) and hover visibility (white/10) to fix the washed-out look
                      : 'text-content-sidebar/80 hover:bg-white/10 hover:text-content-sidebar'
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        {/* Workspace Profile & Settings Link */}
        <div className="px-1">
          <NavLink 
            to="/settings"
            onClick={onClose}
            className={({ isActive }) => cn(
              "group flex items-center justify-between rounded-lg p-2 transition-all",
              isActive ? "ring-1 ring-content-sidebar/30 bg-white/5" : "hover:bg-white/5"
            )}
            title="Workspace Settings"
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-content-sidebar">
                    B
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-content-sidebar transition-colors">
                      Bound Studios
                    </span>
                    <span className="text-xs text-content-sidebar/60 transition-colors group-hover:text-content-sidebar/80">
                      Enquiry Manager
                    </span>
                  </div>
                </div>
                <Settings className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-content-sidebar" : "text-content-sidebar/40 group-hover:text-content-sidebar"
                )} />
              </>
            )}
          </NavLink>
        </div>
      </aside>
    </>
  );
};