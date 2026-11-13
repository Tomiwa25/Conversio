'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { clsx } from 'clsx';

type ToastTone = 'info' | 'success' | 'error';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  /** Optional short explanation of how to fix the problem. */
  description?: string;
}

interface ToastContextValue {
  push: (t: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TONE_RAIL: Record<ToastTone, string> = {
  info: 'bg-wave',
  success: 'bg-signal',
  error: 'bg-pulse',
};

/**
 * Toast provider. Rises from the bottom of the screen as a stack of
 * instrument-panel notifications — replaces every `alert()` and `confirm()`
 * in the app.
 *
 * Note: this is a notification stack, not a confirm dialog. For destructive
 * confirms, use `window.confirm` replacement in Stage 2 (`ConfirmDialog`).
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-24 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto animate-rise rounded-panel border border-line bg-glass shadow-float overflow-hidden flex"
            role={t.tone === 'error' ? 'alert' : 'status'}
          >
            <div className={clsx('w-[3px] flex-none', TONE_RAIL[t.tone])} />
            <div className="px-4 py-3 flex-1">
              <p className="text-sm font-medium text-chalk">{t.title}</p>
              {t.description && (
                <p className="text-xs text-muted mt-0.5">{t.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
