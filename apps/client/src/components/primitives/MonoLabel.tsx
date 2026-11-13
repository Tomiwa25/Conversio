'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface MonoLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `data` is wave-tinted, for things that are genuinely data (room codes, latency). `hint` is muted, for a caption above a control. */
  tone?: 'data' | 'hint' | 'chalk';
}

const TONE = {
  data: 'text-wave',
  hint: 'text-muted',
  chalk: 'text-chalk',
} as const;

/**
 * A monospaced string. Reserved for room codes, latency, socket events and
 * timestamps — the places where the content IS data. Never used as a
 * decorative eyebrow or label above a section.
 */
export const MonoLabel: React.FC<MonoLabelProps> = ({ tone = 'data', className, children, ...rest }) => (
  <span
    className={clsx('font-mono text-xs tracking-[-0.01em]', TONE[tone], className)}
    {...rest}
  >
    {children}
  </span>
);
