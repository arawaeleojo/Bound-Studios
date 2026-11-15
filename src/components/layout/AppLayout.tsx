import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  
  // FIX: Track the previous path to enable derived state
  const [prevPath, setPrevPath] = useState(location.pathname);

  // FIX: Derived state. If the path changes, synchronously close the menu 
  // during render rather than firing a secondary useEffect render cycle.
  if (location.pathname !== prevPath) {
    setIsMobileMenuOpen(false);
    setPrevPath(location.pathname);
  }

  // Effect is retained strictly for DOM mutation (scrolling), which is the correct use of useEffect.
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-brand-main">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <div className="relative z-50">
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        </div>
        
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-0 lg:px-8 lg:pb-8 lg:pt-0">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};