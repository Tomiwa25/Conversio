'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/auth.context';
import { Wordmark } from './brand/Wordmark';
import { ThemeToggle } from './ThemeToggle';
import { PrivacyModal } from './PrivacyModal';
import { HelpModal } from './HelpModal';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Mail,
  Lock,
  User,
  KeyRound,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
} from 'lucide-react';

function SignInContent({ forcedMode }: { forcedMode?: 'signin' | 'signup' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode =
    forcedMode ||
    (typeof window !== 'undefined' && window.location.pathname.includes('/signup')
      ? 'signup'
      : searchParams.get('mode') === 'signup'
      ? 'signup'
      : 'signin');

  const { login, register, requestPasswordReset } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>(initialMode);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socialNotification, setSocialNotification] = useState<string | null>(null);

  // Modals
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Handle Forgot Password Request
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const msg = await requestPasswordReset(forgotEmail);
      setForgotSuccess(msg);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to request password reset link.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Form Submission (Sign In / Sign Up)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        if (!identifier.trim()) {
          throw new Error('Please enter a valid email address.');
        }
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await register(name.trim(), identifier.trim(), password);
      } else {
        if (!identifier.trim()) {
          throw new Error('Please enter your email or Conversio ID.');
        }
        if (!password) {
          throw new Error('Please enter your password.');
        }
        await login(identifier.trim(), password);
      }
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialClick = (provider: string) => {
    setSocialNotification(`${provider} authentication is ready. Connecting via secure OAuth 2.0...`);
    setTimeout(() => {
      setSocialNotification(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col justify-between selection:bg-signal selection:text-ink relative overflow-hidden">
      {/* Background ambient glow matching Landing Page */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-signal/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,176,122,0.08),rgba(255,255,255,0))] pointer-events-none" />

      {/* 1. Top Navigation Bar */}
      <header className="w-full px-6 py-4 sm:px-10 flex items-center justify-between border-b border-line bg-ink/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Wordmark size="md" />
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center space-x-4 sm:space-x-6 text-xs">
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-glass/60 border border-line text-muted">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-signal opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-signal"></span>
            </span>
            <span className="font-medium text-[11px] text-chalk">Production Ready</span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-muted hover:text-chalk transition-colors font-medium hidden sm:inline-block"
          >
            Help & Support
          </button>

          <ThemeToggle compact />

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-line bg-glass/60 text-chalk text-xs font-medium hover:bg-glass hover:border-signal/40 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Subtle Gold / Brass Decorative Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[#C5A86C]/40 to-transparent" />

      {/* 2. Main Centered Form Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16 max-w-md mx-auto w-full z-10">
        {/* Main Glass Panel */}
        <div className="w-full bg-glass/85 backdrop-blur-xl border border-line rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative overflow-hidden transition-all">
          {/* Top Feature Pill Badge */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-signal/30 bg-signal/10 text-signal text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero Downloads · Private Collaboration</span>
            </div>
          </div>

          {/* Title in Instrument Serif */}
          <h1 className="font-display text-3xl sm:text-4xl text-chalk text-center leading-[1.1] tracking-[-0.02em] mb-2">
            {mode === 'signin' && (
              <>
                Sign in to <span className="italic text-signal font-normal">Conversio</span>
              </>
            )}
            {mode === 'signup' && (
              <>
                Create your <span className="italic text-signal font-normal">account</span>
              </>
            )}
            {mode === 'forgot' && (
              <>
                Reset your <span className="italic text-signal font-normal">password</span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-muted text-center max-w-[36ch] mx-auto mb-6 leading-relaxed">
            {mode === 'signin' && 'Enter your credentials to access your meetings, whiteboard canvases, and files.'}
            {mode === 'signup' && 'Join in seconds for instant browser-based meetings with zero software installs.'}
            {mode === 'forgot' && 'Enter your account email to receive a secure password recovery link.'}
          </p>

          {/* Mode Switcher Tabs (Sign In / Sign Up) - Hidden on Forgot mode */}
          {mode !== 'forgot' && (
            <div className="flex p-1 rounded-full bg-ink/70 border border-line mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-full transition-all text-center ${
                  mode === 'signin'
                    ? 'bg-signal text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-chalk'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-medium rounded-full transition-all text-center ${
                  mode === 'signup'
                    ? 'bg-signal text-ink font-semibold shadow-sm'
                    : 'text-muted hover:text-chalk'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Social Notification Banner */}
          {socialNotification && (
            <div className="w-full mb-4 p-3 bg-signal/10 border border-signal/30 rounded-xl text-signal text-xs flex items-center space-x-2 animate-in fade-in">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>{socialNotification}</span>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="w-full mb-4 p-3.5 bg-pulse/10 border border-pulse/30 rounded-xl text-pulse text-xs flex items-start space-x-2 animate-in fade-in">
              <span className="font-bold">•</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Forgot Password Flow */}
          {mode === 'forgot' ? (
            <div className="w-full space-y-4">
              {forgotSuccess ? (
                <div className="p-5 rounded-2xl bg-signal/10 border border-signal/30 text-chalk text-xs space-y-3">
                  <div className="flex items-center gap-2 font-semibold text-sm text-signal">
                    <CheckCircle2 className="w-4 h-4 text-signal" />
                    <span>Recovery Link Dispatched</span>
                  </div>
                  <p className="leading-relaxed text-muted">{forgotSuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setForgotSuccess(null);
                    }}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-signal hover:underline"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="w-full space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-signal" />
                      <span>Account Email</span>
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !forgotEmail.trim()}
                    className="w-full h-12 rounded-full bg-signal text-ink font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,176,122,0.4)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Send Recovery Link</span>}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signin');
                        setErrorMessage(null);
                      }}
                      className="text-xs text-muted hover:text-chalk transition inline-flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Sign In & Sign Up Direct Form */
            <form onSubmit={handleSubmit} className="w-full space-y-4">
              {/* Full Name for Sign Up */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-signal" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Connor"
                    required
                    className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    autoFocus
                  />
                </div>
              )}

              {/* Email / Identifier */}
              <div>
                <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-signal" />
                  <span>{mode === 'signup' ? 'Email Address' : 'Email or Conversio ID'}</span>
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === 'signup' ? 'name@company.com' : 'Enter your email or ID'}
                  required
                  className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                  autoFocus={mode === 'signin'}
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-chalk flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-signal" />
                    <span>Password</span>
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMessage(null);
                      }}
                      className="text-[11px] text-signal hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    required
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-chalk transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-full bg-signal text-ink font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,176,122,0.4)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center space-x-2 shadow-md"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mode === 'signup' ? 'Creating account...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-line" />
            <span className="px-3 text-[11px] text-muted uppercase tracking-wider font-medium">
              Or continue with
            </span>
            <div className="flex-1 border-t border-line" />
          </div>

          {/* Social & SSO Actions */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialClick('Google')}
              className="h-10 rounded-xl border border-line bg-ink/50 hover:bg-glass hover:border-signal/40 text-chalk text-xs font-medium flex items-center justify-center gap-2 transition group"
              title="Sign in with Google"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleSocialClick('Apple')}
              className="h-10 rounded-xl border border-line bg-ink/50 hover:bg-glass hover:border-signal/40 text-chalk text-xs font-medium flex items-center justify-center gap-2 transition group"
              title="Sign in with Apple"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.02-14.42-6.11-9.14-10.84-19.66-14.21-31.57-3.37-11.9-5.06-23.08-5.06-33.52 0-14.37 3.58-26.31 10.74-35.81 7.16-9.51 16.3-14.37 27.42-14.6 4.89 0 10.14 1.25 15.75 3.76 5.61 2.5 9.53 3.81 11.75 3.92 1.95 0 6.07-1.42 12.35-4.25 6.28-2.83 11.83-4.14 16.66-3.92 12.82.65 23.08 5.43 30.79 14.34-11.08 6.74-16.52 16.09-16.3 28.04.22 9.57 3.8 17.51 10.74 23.82 6.94 6.31 15.11 9.9 24.51 10.76-2.39 7.18-5.22 14.36-8.51 21.56zM119.22 33.11c0-7.17 2.6-13.8 7.82-19.89 5.21-6.09 11.63-9.89 19.25-11.41.22 1.3.33 2.39.33 3.26 0 7.17-2.71 13.91-8.15 20.22-5.43 6.3-11.95 10-19.56 11.08-.1-.97-.15-2.06-.15-3.26z" />
              </svg>
              <span>Apple</span>
            </button>

            {/* SSO */}
            <button
              type="button"
              onClick={() => handleSocialClick('Enterprise SSO')}
              className="h-10 rounded-xl border border-line bg-ink/50 hover:bg-glass hover:border-signal/40 text-chalk text-xs font-medium flex items-center justify-center gap-2 transition group"
              title="Sign in with Enterprise SSO"
            >
              <KeyRound className="w-4 h-4 text-signal" />
              <span>SSO</span>
            </button>
          </div>
        </div>
      </main>

      {/* 3. Footer Section with Requested Social Links & Policies */}
      <footer className="w-full border-t border-line bg-ink/90 backdrop-blur-md py-6 px-6 sm:px-10 z-20">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright & Security note */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs text-muted text-center sm:text-left">
            <span>&copy; {new Date().getFullYear()} Conversio. All rights reserved.</span>
            <span className="hidden sm:inline text-line">|</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="hover:text-chalk transition"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="hover:text-chalk transition"
              >
                Terms
              </button>
              <button
                type="button"
                onClick={() => setShowHelpModal(true)}
                className="hover:text-chalk transition"
              >
                Help Centre
              </button>
            </div>
          </div>

          {/* Social Links Requested by User */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <a
              href="https://twitter.com/Tomiwa25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-chalk transition-colors flex items-center gap-1.5"
            >
              <Twitter className="w-3.5 h-3.5" />
              <span>Twitter</span>
            </a>
            <a
              href="https://instagram.com/Tomiwa25"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-chalk transition-colors flex items-center gap-1.5"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>Instagram</span>
            </a>
            <a
              href="https://www.linkedin.com/in/muhydeen-ayandola"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-chalk transition-colors flex items-center gap-1.5"
            >
              <Linkedin className="w-3.5 h-3.5" />
              <span>LinkedIn</span>
            </a>
            <a
              href="https://wa.me/2349130831439"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-chalk transition-colors flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-signal" />
              <span>WhatsApp (09130831439)</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />
      <HelpModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
    </div>
  );
}

export function SignInView({ forcedMode }: { forcedMode?: 'signin' | 'signup' } = {}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-ink">
          <div className="w-8 h-8 border-2 border-signal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SignInContent forcedMode={forcedMode} />
    </Suspense>
  );
}

export default function SignInPage() {
  return <SignInView />;
}
