'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { Theme, useTheme } from '../context/theme.context';
import { MonoLabel } from './primitives';

const OPTIONS: Array<{ value: Theme; label: string; icon: React.ElementType }> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Appearance picker. A hairline control in the header that opens a small glass
 * menu. The trigger shows the theme that is actually rendering, not the stored
 * preference, so "System" never leaves you guessing.
 */
export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const CurrentIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Theme: ${theme}`}
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-control border border-line text-chalk hover:bg-glass transition-colors text-xs"
      >
        <CurrentIcon className="w-3.5 h-3.5 text-muted" aria-hidden />
        {!compact && <span className="hidden sm:inline capitalize">{theme}</span>}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-1.5 w-40 rounded-panel border border-line bg-ink shadow-float p-1 z-50 animate-rise"
        >
          <div className="px-2 py-1.5">
            <MonoLabel tone="hint" className="text-2xs">
              appearance
            </MonoLabel>
          </div>
          {OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = theme === value;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(value);
                  setIsOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center gap-2 h-8 px-2 rounded-control text-xs transition-colors',
                  selected ? 'text-chalk bg-signal-soft' : 'text-muted hover:text-chalk hover:bg-glass',
                )}
              >
                <Icon className="w-3.5 h-3.5 flex-none" aria-hidden />
                <span>{label}</span>
                {selected && <Check className="w-3.5 h-3.5 text-signal ml-auto" aria-hidden />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
