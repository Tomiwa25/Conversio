'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/auth.context';
import { Wordmark } from '../brand/Wordmark';
import { ThemeToggle } from '../ThemeToggle';
import { Button, LiveDot, MonoLabel } from '../primitives';

export interface SiteHeaderProps {
  onOpenHelp: () => void;
  onOpenPrivacy: () => void;
}

const NAV = [
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Pricing', href: '#pricing' },
];

/**
 * Modern minimalist communication hub header. Floating studio glass with
 * telemetry status, clean nav items, and tactile actions.
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenHelp, onOpenPrivacy }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Wordmark size="md" />
          <nav className="hidden md:flex items-center gap-1 text-xs" aria-label="Main">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-control text-muted hover:text-chalk hover:bg-glass/60 transition-all duration-150 font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-control bg-glass/60 border border-line/60 text-[11px] text-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
            </span>
            <span className="font-mono text-[10px] tracking-tight text-chalk">Hub Ready</span>
          </div>

          <ThemeToggle compact />

          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-7 h-7 rounded-pill border border-line bg-glass flex items-center justify-center">
                  <span className="font-display italic text-xs text-chalk">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </span>
                <span className="text-xs text-chalk font-medium truncate max-w-[130px]">{user.name}</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                leadingIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="hidden sm:inline-block text-xs font-medium text-muted hover:text-chalk transition-colors px-2 whitespace-nowrap"
              >
                Sign in
              </Link>
              <a
                href="#start"
                className="inline-flex items-center h-8 px-3.5 rounded-control bg-signal text-ink text-xs font-semibold hover:shadow-[0_0_16px_rgba(180,255,57,0.3)] hover:brightness-105 active:scale-[0.98] transition-all whitespace-nowrap"
              >
                Launch Hub
              </a>
            </>
          )}
          <button
            className="md:hidden p-2 -mr-2 text-chalk"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-line px-6 py-4 flex flex-col gap-3 text-sm" aria-label="Mobile">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="text-muted hover:text-chalk transition-colors"
            >
              {item.label}
            </a>
          ))}
          <div className="border-t border-line pt-3 flex flex-col gap-2">
            <Link href="/signin" onClick={() => setMobileOpen(false)} className="text-muted hover:text-chalk">
              Sign in
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenHelp();
              }}
              className="text-left text-muted hover:text-chalk"
            >
              Help
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenPrivacy();
              }}
              className="text-left text-muted hover:text-chalk"
            >
              Privacy
            </button>
          </div>
          <div className="pt-2">
            <MonoLabel tone="hint">v0.1</MonoLabel>
          </div>
        </nav>
      )}
    </header>
  );
};
