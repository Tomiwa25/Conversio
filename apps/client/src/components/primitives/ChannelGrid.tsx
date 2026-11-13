'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface ChannelGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Number of columns above md. Two on mobile, one by default. */
  cols?: 1 | 2 | 3 | 4;
  /** Draw hairline separators between cells (the patch-bay look). */
  ruled?: boolean;
}

const COLS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
} as const;

/**
 * The layout primitive that gives the product its "instrument panel" structure.
 * A grid of cells separated by hairlines rather than gutters, so the page reads
 * as one continuous surface rather than a pile of cards.
 *
 * When `ruled` is set, children receive border classes via the CSS sibling rules
 * below — cells are rendered bare, no padding, and callers own cell content.
 */
export const ChannelGrid: React.FC<ChannelGridProps> = ({
  cols = 2,
  ruled = true,
  className,
  children,
  ...rest
}) => (
  <div
    className={clsx(
      'grid',
      COLS[cols],
      ruled && 'gap-px bg-line [&>*]:bg-ink',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);
