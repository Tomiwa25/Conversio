'use client';

import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  loading?: boolean;
}

const SIZE = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
} as const;

// Signal-lime fill with a horizontal sweep on hover. Ink text, never white.
// Destructive has no fill until hover so it doesn't shout from the resting state.
const VARIANT = {
  primary: 'relative overflow-hidden bg-signal text-ink font-semibold hover:brightness-105 sweep',
  secondary: 'bg-transparent text-chalk border border-line hover:bg-glass',
  ghost: 'bg-transparent text-chalk hover:bg-glass',
  destructive: 'bg-transparent text-pulse border border-pulse/40 hover:bg-pulse/10 hover:border-pulse',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', leadingIcon, trailingIcon, loading, className, children, disabled, ...rest },
    ref,
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-control font-sans tracking-[-0.005em]',
        'transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none',
        SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg
          className="animate-spin h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          aria-hidden
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
        </svg>
      )}
      {!loading && leadingIcon}
      <span className="whitespace-nowrap">{children}</span>
      {!loading && trailingIcon}
    </button>
  ),
);
Button.displayName = 'Button';
