'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../context/theme.context';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { MonoLabel } from './primitives';

export const ThemeToggle: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: 'Light Mode',
      icon: <Sun className="w-3.5 h-3.5" />,
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="w-3.5 h-3.5" />,
    },
    {
      value: 'system',
      label: 'System Match',
      icon: <Laptop className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 h-8 px-2.5 rounded-control border border-line bg-transparent hover:bg-glass text-muted hover:text-chalk transition-colors text-xs"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        aria-label="Toggle display theme"
        aria-expanded={isOpen}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5" />
        ) : (
          <Sun className="w-3.5 h-3.5" />
        )}
        {!compact && (
          <span className="hidden sm:inline capitalize text-[11px]">{theme}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-44 rounded-panel border border-line bg-glass shadow-float p-1 z-50 animate-rise">
          <MonoLabel tone="hint" className="block px-2 py-1.5 text-[10px]">
            appearance
          </MonoLabel>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-control text-xs transition-colors ${
                  isSelected
                    ? 'bg-signal/10 text-chalk'
                    : 'text-muted hover:bg-glass hover:text-chalk'
                }`}
              >
                <div className="flex items-center gap-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-signal" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
