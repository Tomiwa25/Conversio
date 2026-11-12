'use client';

import React, { useId } from 'react';
import { clsx } from 'clsx';
import { AlertCircle } from 'lucide-react';

/**
 * Form field primitives. The input is a glass well inside the ink ground: one
 * hairline, signal border on focus, and the error state takes the pulse colour
 * on both the rule and the message so it reads at a glance without a fill.
 */

const CONTROL =
  'w-full h-11 px-3 rounded-control bg-glass border border-line text-sm text-chalk ' +
  'placeholder:text-muted/70 focus:border-signal focus:outline-none focus-visible:outline-none ' +
  'transition-colors disabled:opacity-50';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Renders the error rule. Pair with `<Field error>`. */
  invalid?: boolean;
  /** Monospaced, letter-spaced text. For room codes and passcodes. */
  mono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ invalid, mono, className, ...rest }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={clsx(CONTROL, invalid && 'border-pulse focus:border-pulse', mono && 'font-mono', className)}
      {...rest}
    />
  ),
);
Input.displayName = 'Input';

export interface FieldProps {
  label: string;
  /** Small right-aligned note next to the label, e.g. "Optional · six digits". */
  hint?: string;
  error?: string | null;
  /** Control id. Generated when omitted; the control must be a direct child using it. */
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label, hint and consumer-provided control, stacked. The error sits under the
 * control, in the same slot the hint used — one line, one message.
 */
export const Field: React.FC<FieldProps> = ({ label, hint, error, htmlFor, className, children }) => {
  const autoId = useId();
  const id = htmlFor ?? autoId;

  return (
    <div className={clsx('block', className)}>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <label htmlFor={id} className="text-xs text-chalk font-medium">
          {label}
        </label>
        {hint && !error && <span className="text-2xs text-muted flex-none">{hint}</span>}
      </div>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, {
            id,
            ...(error ? { invalid: true } : {}),
          })
        : children}
      {error && <ErrorText text={error} className="mt-1.5" />}
    </div>
  );
};

export interface ErrorTextProps {
  text: string;
  className?: string;
}

/**
 * A single-line failure message. Used under a field, and at form level when the
 * failure is not tied to one input (wrong password, unreachable server).
 */
export const ErrorText: React.FC<ErrorTextProps> = ({ text, className }) => (
  <p role="alert" className={clsx('flex items-start gap-1.5 text-xs text-pulse leading-snug', className)}>
    <AlertCircle className="w-3.5 h-3.5 flex-none mt-px" aria-hidden />
    <span>{text}</span>
  </p>
);
