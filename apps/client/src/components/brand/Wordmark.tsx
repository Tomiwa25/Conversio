'use client';

import React from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';

export interface WordmarkProps {
  href?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE = {
  sm: { type: 'text-lg', wave: 20 },
  md: { type: 'text-xl', wave: 24 },
  lg: { type: 'text-[40px]', wave: 44 },
} as const;

/**
 * The Conversio wordmark. Instrument Serif italic lowercase, with a small
 * oscilloscope trace before it — the mark derived from "live signal".
 * The trace is a decorative brand element only.
 */
export const Wordmark: React.FC<WordmarkProps> = ({ href = '/', size = 'md', className }) => {
  const s = SIZE[size];
  const content = (
    <span className={clsx('inline-flex items-baseline gap-2 select-none group', className)}>
      <svg
        width={s.wave}
        height={Math.round(s.wave * 0.42)}
        viewBox="0 0 26 11"
        fill="none"
        aria-hidden
        className="translate-y-[-1px] text-signal group-hover:text-chalk transition-colors duration-200"
      >
        <path
          d="M0 5.5 L3 5.5 L4.5 2 L6.5 9 L8.8 0.5 L11 8.2 L13 3 L15 6.8 L17 1.8 L19 8.8 L21 4.2 L22.5 6.4 L26 6.4"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={clsx('font-display italic tracking-[-0.02em] text-chalk leading-none', s.type)}>
        conversio
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label="Conversio home" className="inline-flex">
      {content}
    </Link>
  );
};
