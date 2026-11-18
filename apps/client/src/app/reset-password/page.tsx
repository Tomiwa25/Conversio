'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/auth.context';
import { Wordmark } from '../../components/brand/Wordmark';
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token) {
      setErrorMessage('Missing password reset token. Please request a new reset link.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setErrorMessage('Password must contain at least one uppercase letter and one number.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(token, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. The link may have expired or already been used.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col justify-between p-6">
      <header className="max-w-md w-full mx-auto flex items-center justify-between pt-4">
        <Wordmark size="md" />
        <Link
          href="/signin"
          className="text-xs text-muted hover:text-chalk transition-colors inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
        </Link>
      </header>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="bg-glass border border-line rounded-panel p-8 shadow-2xl relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-signal via-wave to-signal" />

          {isSuccess ? (
            <div className="text-center py-6 space-y-5 animate-rise">
              <div className="w-12 h-12 rounded-full bg-signal/10 border border-signal/30 text-signal flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-display text-chalk">Password updated</h2>
                <p className="text-xs text-muted leading-relaxed max-w-sm mx-auto">
                  Your password has been successfully updated. All active sessions have been securely signed out.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push('/signin')}
                className="w-full py-2.5 rounded-control bg-signal text-ink font-semibold text-xs hover:brightness-105 transition shadow-lg"
              >
                Sign in with new password
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-md bg-signal/10 text-signal border border-signal/20">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <span className="text-xs uppercase tracking-wider text-muted font-mono">Account Security</span>
                </div>
                <h1 className="text-2xl font-display text-chalk pt-2">Set new password</h1>
                <p className="text-xs text-muted leading-relaxed">
                  Enter your new password below. It must be at least 8 characters with letters and numbers.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 p-3 rounded-control bg-pulse/10 border border-pulse/30 text-pulse text-xs leading-relaxed animate-shake">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-chalk mb-1.5">New password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full h-10 px-3 pr-10 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/50 focus:outline-none focus:border-signal transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-chalk mb-1.5">Confirm new password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/50 focus:outline-none focus:border-signal transition"
                  />
                </div>

                <div className="p-3 rounded-control bg-ink/40 border border-line/60 flex items-start gap-2.5 text-[11px] text-muted">
                  <ShieldCheck className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                  <span>
                    Upon updating your password, all prior active browser tokens and sessions will be instantly invalidated.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 rounded-control bg-signal text-ink text-sm font-semibold hover:brightness-105 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Updating password...</span>
                    </>
                  ) : (
                    <span>Update password & sign in</span>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-xs text-muted/60 pb-4">
        Conversio Zero-Trust Communication Suite · Protected against Host Poisoning
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ink flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-signal" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
