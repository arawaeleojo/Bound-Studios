import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  
  const [prevPath, setPrevPath] = useState(location.pathname);

  // Close mobile menu automatically on route change
  if (location.pathname !== prevPath) {
    setIsMobileMenuOpen(false);
    setPrevPath(location.pathname);
  }

  // Reset scroll position when navigating to a new page
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    // Use 100dvh to prevent rubber-band scrolling on mobile browsers
    <div className="flex h-[100dvh] w-full overflow-hidden bg-brand-main">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden relative">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        
        {/* pt-16 offsets the fixed mobile header, resetting to 0 on desktop */}
        <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-16 lg:px-8 lg:pb-8 lg:pt-0">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};