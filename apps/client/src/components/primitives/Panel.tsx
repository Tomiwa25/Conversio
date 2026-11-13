'use client';

import React from 'react';
import { clsx } from 'clsx';

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `default` is a glass surface on the ink ground. `raised` floats above with a shadow. `flat` is transparent with just a hairline. */
  surface?: 'default' | 'raised' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

const SURFACE = {
  default: 'bg-glass border border-line',
  raised: 'bg-glass border border-line shadow-float',
  flat: 'bg-transparent border border-line',
} as const;

/**
 * The single panel primitive. 2px radius, 1px hairline border. Everything that
 * used to be a rounded-3xl card is this.
 */
export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ surface = 'default', padding = 'md', className, children, ...rest }, ref) => (
    <div
      ref={ref}
      className={clsx('rounded-panel', SURFACE[surface], PADDING[padding], className)}
      {...rest}
    >
      {children}
    </div>
  ),
);
Panel.displayName = 'Panel';
