'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

export interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  /** Mono label shown in the header. Leave undefined for an icon-only header. */
  title?: string;
  /** Optional icon to place left of the title. */
  icon?: React.ReactNode;
  /** Size of the panel. */
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Hides the close button (e.g., for destructive confirmations that must be answered). */
  hideClose?: boolean;
}

const SIZE = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
} as const;

/**
 * The shared modal. Hairline-bordered glass panel, 2px corners, Escape to
 * close, focus trapped inside, scroll locked while open. Every modal in the
 * product is this shell.
 */
export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  icon,
  size = 'md',
  children,
  footer,
  hideClose,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    lastFocused.current = document.activeElement as HTMLElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    if (panel) {
      const first = panel.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      // Focus trap
      if (e.key !== 'Tab' || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => n.offsetParent !== null);
      if (!nodes.length) return;
      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === firstNode) {
        e.preventDefault();
        lastNode.focus();
      } else if (!e.shiftKey && document.activeElement === lastNode) {
        e.preventDefault();
        firstNode.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      lastFocused.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-rise"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] cursor-default"
      />
      <div
        ref={panelRef}
        className={clsx(
          'relative w-full rounded-panel border border-line bg-glass shadow-float flex flex-col max-h-[calc(100vh-2rem)]',
          SIZE[size],
        )}
      >
        <header className="flex items-center justify-between px-5 h-12 border-b border-line flex-none">
          <div className="flex items-center gap-2 min-w-0">
            {icon && <span className="text-signal flex-none">{icon}</span>}
            <span className="font-mono text-xs text-muted tracking-[-0.01em] truncate">{title}</span>
          </div>
          {!hideClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-none text-muted hover:text-chalk transition-colors p-1 -mr-1 rounded-control"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </header>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-line flex-none">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
};
