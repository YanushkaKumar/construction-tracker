'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  closing?: boolean;
}

interface ToastContextValue {
  toast: (opts: Omit<Toast, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ── Context ──────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ── Provider ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, closing: true } : t))
    );
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 250);
  }, []);

  const dismissAll = useCallback(() => {
    setToasts(prev => prev.map(t => ({ ...t, closing: true })));
    setTimeout(() => setToasts([]), 250);
  }, []);

  const toast = useCallback((opts: Omit<Toast, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const duration = opts.duration ?? 4500;

    setToasts(prev => [{ ...opts, id, closing: false }, ...prev].slice(0, 5));

    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }

    return id;
  }, [dismiss]);

  const success = useCallback((title: string, description?: string) =>
    toast({ variant: 'success', title, description }), [toast]);

  const error = useCallback((title: string, description?: string) =>
    toast({ variant: 'error', title, description, duration: 6000 }), [toast]);

  const warning = useCallback((title: string, description?: string) =>
    toast({ variant: 'warning', title, description }), [toast]);

  const info = useCallback((title: string, description?: string) =>
    toast({ variant: 'info', title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ── Icons ────────────────────────────────────────────────────

const ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-success" aria-hidden />,
  error:   <XCircle className="w-4 h-4 flex-shrink-0 text-danger" aria-hidden />,
  warning: <AlertTriangle className="w-4 h-4 flex-shrink-0 text-warning" aria-hidden />,
  info:    <Info className="w-4 h-4 flex-shrink-0 text-info" aria-hidden />,
};

const CLASSES: Record<ToastVariant, string> = {
  success: 'toast toast-success',
  error:   'toast toast-error',
  warning: 'toast toast-warning',
  info:    'toast toast-info',
};

// ── Single Toast ──────────────────────────────────────────────

function ToastItem({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={cn(
        CLASSES[t.variant],
        t.closing ? 'animate-toast-out' : 'animate-toast-in'
      )}
      onMouseEnter={handleMouseEnter}
    >
      {ICONS[t.variant]}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[13px] leading-tight">{t.title}</p>
        {t.description && (
          <p className="text-[12px] opacity-80 mt-0.5 leading-relaxed">{t.description}</p>
        )}
        {t.action && (
          <button
            onClick={() => {
              t.action!.onClick();
              onDismiss(t.id);
            }}
            className="mt-1.5 text-[11px] font-bold underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
          >
            {t.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(t.id)}
        className="flex-shrink-0 opacity-50 hover:opacity-80 transition-opacity p-0.5 rounded"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Container ─────────────────────────────────────────────────

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
