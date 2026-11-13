'use client';

import React from 'react';
import Link from 'next/link';
import { Wordmark } from '../brand/Wordmark';
import { MonoLabel } from '../primitives';

export interface SiteFooterProps {
  onOpenHelp: () => void;
  onOpenPrivacy: () => void;
  onOpenCookies: () => void;
}

const COLUMNS: Array<{ title: string; links: Array<{ label: string; action: 'link' | 'help' | 'privacy' | 'cookies' | 'external'; href?: string }> }> = [
  {
    title: 'Product',
    links: [
      { label: 'Start a meeting', action: 'link', href: '#start' },
      { label: 'Video rooms', action: 'link', href: '#product' },
      { label: 'Whiteboard', action: 'link', href: '#product' },
      { label: 'Files & chat', action: 'link', href: '#product' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Help centre', action: 'help' },
      { label: 'Privacy', action: 'privacy' },
      { label: 'Source', action: 'external', href: 'https://github.com/Tomiwa25/Conversio' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', action: 'link', href: '/signin' },
      { label: 'Create account', action: 'link', href: '/signup' },
      { label: 'Cookie preferences', action: 'cookies' },
    ],
  },
];

/**
 * Hairline footer, aligned to the same column grid as the page. No fake
 * social tiles, no fake language pickers.
 */
export const SiteFooter: React.FC<SiteFooterProps> = ({ onOpenHelp, onOpenPrivacy, onOpenCookies }) => {
  const handlers = { help: onOpenHelp, privacy: onOpenPrivacy, cookies: onOpenCookies } as const;

  return (
    <footer className="bg-glass">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12 grid grid-cols-1 md:grid-cols-12 gap-10">
        <div className="md:col-span-5">
          <Wordmark size="md" />
          <p className="text-sm text-muted mt-4 max-w-[34ch] leading-relaxed">
            Live rooms for teams. Video, whiteboard, files and chat, all in one call.
          </p>
        </div>
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-6">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs text-chalk font-medium mb-3">{col.title}</h2>
              <ul className="space-y-2 text-sm">
                {col.links.map((l) => {
                  if (l.action === 'link') {
                    return (
                      <li key={l.label}>
                        <Link href={l.href!} className="text-muted hover:text-chalk transition-colors">
                          {l.label}
                        </Link>
                      </li>
                    );
                  }
                  if (l.action === 'external') {
                    return (
                      <li key={l.label}>
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted hover:text-chalk transition-colors"
                        >
                          {l.label}
                        </a>
                      </li>
                    );
                  }
                  return (
                    <li key={l.label}>
                      <button
                        type="button"
                        onClick={handlers[l.action as 'help' | 'privacy' | 'cookies']}
                        className="text-muted hover:text-chalk transition-colors text-left"
                      >
                        {l.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 h-12 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <MonoLabel tone="hint" className="text-[11px]">
            &copy; {new Date().getFullYear()} Conversio
          </MonoLabel>
          <MonoLabel tone="hint" className="text-[11px]">
            next.js · socket.io · webrtc · postgres
          </MonoLabel>
        </div>
      </div>
    </footer>
  );
};
