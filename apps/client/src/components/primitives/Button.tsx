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

// Sleek studio glass button system.
// Primary: Signal fill with specular edge, tactile micro-sweep, and ink typography.
// Secondary: Translucent dark glass with crisp 1px specular line.
const VARIANT = {
  primary:
    'relative overflow-hidden bg-signal text-ink font-semibold shadow-sm hover:shadow-[0_0_20px_rgba(180,255,57,0.25)] hover:brightness-105 active:scale-[0.98] sweep transition-all duration-150',
  secondary:
    'bg-glass/80 text-chalk border border-line/80 hover:bg-glass hover:border-line hover:text-chalk active:scale-[0.98] transition-all duration-150 backdrop-blur-sm',
  ghost:
    'bg-transparent text-muted hover:text-chalk hover:bg-glass/60 active:scale-[0.98] transition-all duration-150',
  destructive:
    'bg-transparent text-pulse border border-pulse/30 hover:bg-pulse/10 hover:border-pulse active:scale-[0.98] transition-all duration-150',
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
