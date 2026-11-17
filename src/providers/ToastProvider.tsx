import React, { useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { ToastContext } from '../contexts/ToastContext';
import type { Toast, ToastType } from '../contexts/ToastContext';
import { cn } from '../utils/cn';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Manages the active queue of ephemeral toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generates a unique ID and auto-dismisses the toast after 3 seconds
  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Renders toasts in a fixed overlay using animated entry transitions */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all animate-in slide-in-from-bottom-5",
              toast.type === 'success' ? "bg-brand-card border border-[var(--status-won)] text-content-primary" : "bg-brand-card border border-[var(--status-lost)] text-content-primary"
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-[var(--status-won)]" />
            ) : (
              <XCircle className="h-5 w-5 text-[var(--status-lost)]" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} className="ml-2 text-content-secondary hover:text-content-primary">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}