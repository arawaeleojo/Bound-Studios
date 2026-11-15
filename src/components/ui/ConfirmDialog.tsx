import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-brand-border bg-brand-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start gap-4">
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            variant === 'danger' ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-500" : "bg-action-primary/10 text-action-primary"
          )}>
            {variant === 'danger' ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-content-primary">{title}</h3>
            <p className="mt-2 text-sm text-content-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button 
            variant={variant === 'danger' ? 'secondary' : 'primary'} 
            onClick={onConfirm}
            className={variant === 'danger' ? "bg-red-600 text-white hover:bg-red-700 border-transparent dark:bg-red-700 dark:hover:bg-red-800" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};