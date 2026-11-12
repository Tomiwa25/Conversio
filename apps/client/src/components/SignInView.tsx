'use client';

import React, { Suspense, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/auth.context';
import { Button, ErrorText, Field, Input, LiveDot, MonoLabel, Waveform } from './primitives';
import { Wordmark } from './brand/Wordmark';
import { PrivacyModal } from './PrivacyModal';
import { HelpModal } from './HelpModal';

type Step = 'identifier' | 'password';

/**
 * Sign-in / sign-up. Two panes: the instrument on the left, the form on the
 * right. Two-step flow (identifier → password) with a horizontal slide between
 * the steps.
 *
 * Removed in this redesign: the 320×180 hero SVG, the five social buttons that
 * only fired a toast, the language dropdown, and the demo-credentials pills.
 * The credentials are gone because the account they point at is seeded by the
 * server and ships in production.
 */
function SignInContent({ forcedMode }: { forcedMode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(forcedMode ?? 'signin');
  const [step, setStep] = useState<Step>('identifier');

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m);
    setStep('identifier');
    setError(null);
  };

  const goPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim()) {
      setError('Enter the email address you signed up with.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())) {
      setError("That doesn't look like an email address. Check it and try again.");
      return;
    }
    setStep('password');
    // The password pane slides in; move focus with it once it has settled.
    window.setTimeout(() => passwordRef.current?.focus(), 220);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Tell us your name so people know who they’re meeting.');
        await register(name.trim(), identifier.trim(), password);
      } else {
        await login(identifier.trim(), password);
      }
      router.push('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      // Normalise the server's raw messages into something actionable.
      if (/invalid credentials/i.test(msg)) {
        setError('That email and password do not match. Check them and try again.');
      } else if (/already exists/i.test(msg)) {
        setError('An account already exists with that email. Sign in instead, or use a different address.');
      } else if (/fetch|network|failed/i.test(msg) && !/password/i.test(msg)) {
        setError('Could not reach the server. Check your connection and try again.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const heading = mode === 'signin' ? 'Welcome back.' : 'Make a room of your own.';
  const sub =
    mode === 'signin'
      ? 'Sign in to start a meeting, or pick up one you left.'
      : 'One account. Start or join any room.';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-ink text-chalk">
      {/* Left: the instrument */}
      <aside className="hidden lg:flex flex-col justify-between border-r border-line p-10">
        <Wordmark size="lg" href="/" />

        <div>
          <h1 className="font-display text-3xl text-chalk max-w-[14ch]">{heading}</h1>
          <p className="text-sm text-muted mt-4 max-w-[38ch] leading-relaxed">{sub}</p>
          <div className="mt-10">
            <Waveform height={44} bars={36} barWidth={2} />
            <div className="mt-3 flex items-center justify-between">
              <MonoLabel tone="hint">local stream</MonoLabel>
              <LiveDot state="live" tone="signal" size={6} label="listening" />
            </div>
          </div>
        </div>

        <MonoLabel tone="hint">peer-to-peer video · client-side file encryption</MonoLabel>
      </aside>

      {/* Right: the form */}
      <main className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between px-6 h-14 lg:px-8">
          <div className="lg:hidden">
            <Wordmark size="sm" href="/" />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-4 text-sm">
            {mode === 'signin' ? (
              <span className="text-muted">
                New here?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-chalk underline underline-offset-4 decoration-line hover:decoration-signal transition-colors"
                >
                  Create an account
                </button>
              </span>
            ) : (
              <span className="text-muted">
                Already have one?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-chalk underline underline-offset-4 decoration-line hover:decoration-signal transition-colors"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            <div className="lg:hidden mb-6">
              <h1 className="font-display text-2xl text-chalk leading-none">{heading}</h1>
              <p className="text-sm text-muted mt-2">{sub}</p>
            </div>

            {/* The horizontal slide between steps. Both steps render inside one
                width track; the container translates. Only the active pane is
                reachable — the inactive one is inert and hidden from AT. */}
            <div className="overflow-hidden">
              <div
                className="flex w-[200%] transition-transform duration-200 ease-out motion-reduce:transition-none"
                style={{ transform: step === 'identifier' ? 'translateX(0)' : 'translateX(-50%)' }}
              >
                {/* STEP 1: identifier */}
                <form
                  onSubmit={goPassword}
                  inert={step !== 'identifier'}
                  className={clsx('w-1/2 pr-3 space-y-4', step !== 'identifier' && 'invisible')}
                >
                  {mode === 'signup' && (
                    <Field label="Your name">
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alex Morgan"
                        autoComplete="name"
                      />
                    </Field>
                  )}
                  <Field label="Email address">
                    <Input
                      required
                      type="email"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      autoFocus
                    />
                  </Field>

                  {error && <ErrorText text={error} />}

                  <Button type="submit" size="lg" className="w-full">
                    Continue
                  </Button>
                </form>

                {/* STEP 2: password */}
                <form
                  onSubmit={submit}
                  inert={step !== 'password'}
                  className={clsx('w-1/2 pl-3 space-y-4', step !== 'password' && 'invisible')}
                >
                  <div className="flex items-center gap-2 text-sm text-muted h-[18px]">
                    <button
                      type="button"
                      onClick={() => {
                        setStep('identifier');
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 text-muted hover:text-chalk transition-colors"
                      aria-label="Back to email"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="truncate">{identifier}</span>
                  </div>

                  <Field label="Password">
                    <div className="relative">
                      <Input
                        ref={passwordRef}
                        required
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Your password"
                        autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </Field>

                  {error && <ErrorText text={error} />}

                  <Button type="submit" size="lg" className="w-full" loading={busy}>
                    {mode === 'signup' ? 'Create account' : 'Sign in'}
                  </Button>
                </form>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted leading-relaxed">
              By continuing you agree to the{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="text-chalk underline underline-offset-2 decoration-line hover:decoration-signal transition-colors"
              >
                terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setPrivacyOpen(true)}
                className="text-chalk underline underline-offset-2 decoration-line hover:decoration-signal transition-colors"
              >
                privacy notice
              </button>
              .
            </p>
          </div>
        </div>

        <footer className="border-t border-line px-6 lg:px-8 h-12 flex items-center justify-between">
          <MonoLabel tone="hint" className="text-[11px]">
            &copy; {new Date().getFullYear()} Conversio
          </MonoLabel>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/" className="text-muted hover:text-chalk transition-colors">
              Home
            </Link>
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="text-muted hover:text-chalk transition-colors"
            >
              Help
            </button>
            <button
              type="button"
              onClick={() => setPrivacyOpen(true)}
              className="text-muted hover:text-chalk transition-colors"
            >
              Privacy
            </button>
          </div>
        </footer>
      </main>

      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export function SignInView({ forcedMode }: { forcedMode?: 'signin' | 'signup' } = {}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <Loader2 className="w-6 h-6 text-signal animate-spin" />
        </div>
      }
    >
      <SignInContent forcedMode={forcedMode} />
    </Suspense>
  );
}
