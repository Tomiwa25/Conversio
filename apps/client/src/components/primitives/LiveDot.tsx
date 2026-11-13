'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface LiveDotProps {
  /** `live` pulses softly; `static` is solid; `off` is grey. */
  state?: 'live' | 'static' | 'off';
  tone?: 'signal' | 'pulse' | 'wave';
  size?: 4 | 6 | 8;
  /** Rendered next to the dot if provided. */
  label?: string;
  className?: string;
}

const TONES = {
  signal: 'bg-signal',
  pulse: 'bg-pulse',
  wave: 'bg-wave',
} as const;

/**
 * A single status dot. Used for "live", "recording", "connected". Pulses only
 * when the state actually is live — never as decoration.
 */
export const LiveDot: React.FC<LiveDotProps> = ({
  state = 'live',
  tone = 'signal',
  size = 6,
  label,
  className,
}) => {
  const dot = (
    <span
      className={clsx(
        'inline-block rounded-full flex-none',
        size === 4 && 'w-1 h-1',
        size === 6 && 'w-1.5 h-1.5',
        size === 8 && 'w-2 h-2',
        state === 'off' ? 'bg-line' : TONES[tone],
        state === 'live' && 'animate-soft-pulse',
      )}
      aria-hidden
    />
  );

  if (!label) {
    return <span className={clsx('inline-flex items-center', className)}>{dot}</span>;
  }

  return (
    <span className={clsx('inline-flex items-center gap-1.5 text-xs text-muted', className)}>
      {dot}
      <span>{label}</span>
    </span>
  );
};
