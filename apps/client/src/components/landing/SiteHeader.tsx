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
  { label: 'Product', href: '#product' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Pricing', href: '#pricing' },
];

/**
 * A thin instrument header. Wordmark left, three real nav items, sign-in state
 * right. No fake dropdowns, no announcement banner.
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenHelp, onOpenPrivacy }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Wordmark size="md" />
          <nav className="hidden md:flex items-center gap-6 text-sm" aria-label="Main">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted hover:text-chalk transition-colors relative group"
              >
                {item.label}
                <span
                  className="absolute -bottom-1 left-0 right-0 h-px bg-signal scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-200"
                  aria-hidden
                />
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <LiveDot
            state="static"
            tone="signal"
            size={6}
            label="systems reachable"
            className="hidden sm:inline-flex"
          />
          <ThemeToggle compact />
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-7 h-7 rounded-pill border border-line bg-glass flex items-center justify-center">
                  <span className="font-display italic text-xs text-chalk">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </span>
                <span className="text-sm text-chalk truncate max-w-[140px]">{user.name}</span>
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
                className="hidden sm:inline-block text-sm text-muted hover:text-chalk transition-colors px-2 whitespace-nowrap"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center h-8 px-3 rounded-control bg-signal text-ink text-xs font-semibold hover:brightness-105 transition whitespace-nowrap"
              >
                Sign up
              </Link>
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
