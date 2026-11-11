'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '../context/theme.context';
import { Sun, Moon, Laptop, Check } from 'lucide-react';

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
      icon: <Sun className="w-3.5 h-3.5 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'Dark Mode',
      icon: <Moon className="w-3.5 h-3.5 text-blue-400" />,
    },
    {
      value: 'system',
      label: 'System Match',
      icon: <Laptop className="w-3.5 h-3.5 text-slate-400" />,
    },
  ];

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition text-xs font-medium backdrop-blur-md shadow-sm"
        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)} (${resolvedTheme})`}
        aria-label="Toggle display theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-3.5 h-3.5 text-blue-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" />
        )}
        {!compact && (
          <span className="hidden sm:inline capitalize text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            {theme}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-1">
            Appearance
          </div>
          {options.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

