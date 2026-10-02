import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-aqua" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber" />,
    error: <XCircle className="w-5 h-5 text-coral" />,
    info: <Info className="w-5 h-5 text-primary" />,
  };

  const borderColors = {
    success: 'border-aqua/40',
    warning: 'border-amber/40',
    error: 'border-coral/40',
    info: 'border-primary/40',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-sm w-full pointer-events-auto">
      <div
        className={`glass-card p-4 rounded-2xl shadow-xl border ${borderColors[toast.type]} flex items-start gap-3`}
      >
        <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-ink dark:text-white">
            {toast.title}
          </p>
          {toast.message && (
            <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-300 break-words">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-ink-400 hover:text-ink dark:hover:text-white p-1 rounded-lg hover:bg-ink-100 dark:hover:bg-darkcard2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
