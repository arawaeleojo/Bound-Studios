import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error';

// Defines the structure of an individual flash notification
export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// Defines the contract for dispatching global notifications
export interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom hook enabling any component to trigger a toast notification
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};