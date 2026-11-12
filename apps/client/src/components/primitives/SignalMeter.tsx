'use client';

import React from 'react';
import { clsx } from 'clsx';

export type Quality = 'good' | 'fair' | 'poor' | 'unknown';

const QUALITY_TO_BARS: Record<Quality, number> = {
  good: 3,
  fair: 2,
  poor: 1,
  unknown: 0,
};

const QUALITY_TONE: Record<Quality, string> = {
  good: 'bg-signal',
  fair: 'bg-amber-500',
  poor: 'bg-pulse',
  unknown: 'bg-line',
};

/** Map a numeric 0-100 score or a string label to one of four levels. */
export const qualityFromScore = (score?: number | null): Quality => {
  if (score == null || Number.isNaN(score)) return 'unknown';
  if (score >= 70) return 'good';
  if (score >= 40) return 'fair';
  if (score > 0) return 'poor';
  return 'unknown';
};

export interface SignalMeterProps {
  quality?: Quality;
  /** Shown to screen readers and on hover. */
  label?: string;
  className?: string;
}

/**
 * A three-bar signal meter. Bars light in sequence and the tone shifts with
 * connection quality. Reads as a per-participant data point, not an icon.
 */
export const SignalMeter: React.FC<SignalMeterProps> = ({
  quality = 'unknown',
  label,
  className,
}) => {
  const lit = QUALITY_TO_BARS[quality];
  const tone = QUALITY_TONE[quality];
  const readable = label ?? `Connection: ${quality}`;

  return (
    <span
      className={clsx('inline-flex items-end gap-[2px] h-3', className)}
      role="img"
      aria-label={readable}
      title={readable}
    >
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={clsx(
            'w-[3px] rounded-[1px] transition-colors duration-200',
            bar <= lit ? tone : 'bg-line',
          )}
          style={{ height: 4 + bar * 2.5 }}
        />
      ))}
    </span>
  );
};
