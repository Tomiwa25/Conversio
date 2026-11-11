'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/auth.context';
import { PrivacyModal } from './PrivacyModal';
import { HelpModal } from './HelpModal';
import {
  KeyRound,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Sparkles,
  Video,
  ShieldCheck,
  Globe,
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

  const { login, register, user } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [socialNotification, setSocialNotification] = useState<string | null>(null);

  // Modals & Language dropdown
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  const languages = ['English', 'Español', 'Français', 'Deutsch', 'Português', '日本語'];

  // Handle Form Submission
  const handleIdentifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email, Conversio ID or phone number.');
      return;
    }

    if (mode === 'signup') {
      // In signup, we need name and password as well
      setStep('password');
    } else {
      // Move to password step
      setStep('password');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await register(name, identifier, password);
      } else {
        await login(identifier, password);
      }
      router.push('/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo 1-Click shortcuts
  const fillDemoHost = () => {
    setIdentifier('sarah@conversio.io');
    setPassword('Password123!');
    setMode('signin');
    setStep('password');
    setErrorMessage(null);
  };

  const fillDemoParticipant = () => {
    setIdentifier('alex@conversio.io');
    setPassword('Password123!');
    setMode('signin');
    setStep('password');
    setErrorMessage(null);
  };

  const handleSocialClick = (provider: string) => {
    setSocialNotification(`${provider} authentication is ready. Connecting via OAuth 2.0 / SAML...`);
    setTimeout(() => {
      setSocialNotification(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b101b] text-slate-800 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Top Navigation Bar */}
      <header className="w-full px-6 py-4 sm:px-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-white/95 dark:bg-[#0b101b]/95 sticky top-0 z-30 backdrop-blur-sm">
        {/* Left: Brand Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="flex items-center">
            {/* Zoom-style custom logo mark: Conversio */}
            <span className="text-[26px] sm:text-[30px] font-black tracking-tight text-[#0E71EB] hover:opacity-95 transition-opacity">
              conversio
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-[#0E71EB] ml-0.5 mt-2 animate-pulse" />
          </div>
        </Link>

        {/* Right Navigation Items */}
        <div className="flex items-center space-x-5 sm:space-x-8 text-sm">
          {mode === 'signin' ? (
            <div className="text-slate-600 dark:text-slate-300">
              New to Conversio?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setStep('identifier');
                  setErrorMessage(null);
                }}
                className="font-medium text-[#0E71EB] hover:underline"
              >
                Sign Up
              </button>
            </div>
          ) : (
            <div className="text-slate-600 dark:text-slate-300">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setStep('identifier');
                  setErrorMessage(null);
                }}
                className="font-medium text-[#0E71EB] hover:underline"
              >
                Sign In
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors hidden sm:inline-block"
          >
            Support
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center space-x-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium transition-colors"
            >
              <span>{selectedLang}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                      selectedLang === lang ? 'font-bold text-[#0E71EB]' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Centered Form Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 max-w-lg mx-auto w-full">
        {/* Hero Vector Graphic matching Zoom Sign-in */}
        <div className="w-full flex justify-center mb-4 sm:mb-6">
          <div className="relative w-full max-w-[280px] sm:max-w-[320px] h-[160px] sm:h-[180px]">
            <img
              src="/conversio-signin-hero.svg"
              alt="Conversio Collaboration Sign In"
              className="w-full h-full object-contain filter drop-shadow-sm select-none pointer-events-none"
            />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white text-center mb-6">
          {mode === 'signin' ? 'Sign in' : 'Sign up free'}
        </h1>

        {/* Social Notification Banner */}
        {socialNotification && (
          <div className="w-full mb-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-xl text-blue-700 dark:text-blue-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>{socialNotification}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="w-full mb-4 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-start space-x-2 animate-in fade-in">
            <span className="font-bold">•</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Identifier Input Form */}
        {step === 'identifier' && (
          <form onSubmit={handleIdentifierSubmit} className="w-full space-y-4">
            <div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter email, Conversio ID or phone number"
                className="w-full px-4 py-3.5 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all shadow-sm"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-[#0E71EB] hover:bg-[#005ce6] active:bg-[#0052cc] text-white font-medium text-base rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <span>Next</span>
            </button>
          </form>
        )}

        {/* Step 2: Password / Name Input Form */}
        {step === 'password' && (
          <form onSubmit={handleFinalSubmit} className="w-full space-y-4 animate-in fade-in duration-150">
            {/* Show Selected Identifier with edit button */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[260px]">
                {identifier}
              </span>
              <button
                type="button"
                onClick={() => setStep('identifier')}
                className="text-[#0E71EB] hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {mode === 'signup' && (
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name (e.g. Sarah Connor)"
                  className="w-full px-4 py-3.5 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all shadow-sm"
                  autoFocus
                />
              </div>
            )}

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3.5 pr-11 text-sm sm:text-base bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0E71EB] focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 transition-all shadow-sm"
                autoFocus={mode !== 'signup'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#0E71EB] hover:bg-[#005ce6] active:bg-[#0052cc] text-white font-medium text-base rounded-lg transition-colors shadow-sm flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>{mode === 'signup' ? 'Create Account' : 'Sign In'}</span>
              )}
            </button>
          </form>
        )}

        {/* 3. Divider: "Or sign in with" */}
        <div className="w-full my-6 flex items-center">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
          <span className="px-4 text-xs text-slate-500 dark:text-slate-400 font-normal">
            Or {mode === 'signup' ? 'sign up with' : 'sign in with'}
          </span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* 4. Social Sign In Buttons (5 round buttons matching Zoom screenshot) */}
        <div className="w-full flex items-start justify-center space-x-4 sm:space-x-6">
          {/* SSO */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => handleSocialClick('SSO / SAML Enterprise')}
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              title="Sign in with Enterprise SSO"
            >
              <KeyRound className="w-5 h-5 text-slate-800 dark:text-slate-100 group-hover:scale-110 transition-transform" />
            </button>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">SSO</span>
          </div>

          {/* Apple */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => handleSocialClick('Apple')}
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              title="Sign in with Apple"
            >
              <svg className="w-5 h-5 fill-current text-slate-900 dark:text-white group-hover:scale-110 transition-transform" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.85-12.02-14.42-6.11-9.14-10.84-19.66-14.21-31.57-3.37-11.9-5.06-23.08-5.06-33.52 0-14.37 3.58-26.31 10.74-35.81 7.16-9.51 16.3-14.37 27.42-14.6 4.89 0 10.14 1.25 15.75 3.76 5.61 2.5 9.53 3.81 11.75 3.92 1.95 0 6.07-1.42 12.35-4.25 6.28-2.83 11.83-4.14 16.66-3.92 12.82.65 23.08 5.43 30.79 14.34-11.08 6.74-16.52 16.09-16.3 28.04.22 9.57 3.8 17.51 10.74 23.82 6.94 6.31 15.11 9.9 24.51 10.76-2.39 7.18-5.22 14.36-8.51 21.56zM119.22 33.11c0-7.17 2.6-13.8 7.82-19.89 5.21-6.09 11.63-9.89 19.25-11.41.22 1.3.33 2.39.33 3.26 0 7.17-2.71 13.91-8.15 20.22-5.43 6.3-11.95 10-19.56 11.08-.1-.97-.15-2.06-.15-3.26z" />
              </svg>
            </button>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">Apple</span>
          </div>

          {/* Google */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => handleSocialClick('Google Workspace')}
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              title="Sign in with Google"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
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
            </button>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">Google</span>
          </div>

          {/* Facebook */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => handleSocialClick('Facebook')}
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              title="Sign in with Facebook"
            >
              <svg className="w-5 h-5 fill-[#1877F2] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">Facebook</span>
          </div>

          {/* Microsoft */}
          <div className="flex flex-col items-center space-y-1.5">
            <button
              type="button"
              onClick={() => handleSocialClick('Microsoft 365')}
              className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
              title="Sign in with Microsoft"
            >
              <div className="grid grid-cols-2 gap-0.5 w-4 h-4 group-hover:scale-110 transition-transform">
                <span className="w-1.5 h-1.5 bg-[#F25022]" />
                <span className="w-1.5 h-1.5 bg-[#7FBA00]" />
                <span className="w-1.5 h-1.5 bg-[#00A4EF]" />
                <span className="w-1.5 h-1.5 bg-[#FFB900]" />
              </div>
            </button>
            <span className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">Microsoft</span>
          </div>
        </div>

        {/* 5. Forgot email/password Link */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setSocialNotification('Password recovery instructions sent to your registered address.');
              setTimeout(() => setSocialNotification(null), 3500);
            }}
            className="text-sm font-medium text-[#0E71EB] hover:underline"
          >
            Forgot email or password?
          </button>
        </div>

        {/* 6. Quick Demo Logins Pill */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 w-full flex flex-col items-center space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Quick One-Click Test Accounts
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={fillDemoHost}
              className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              Host (Sarah Connor)
            </button>
            <button
              type="button"
              onClick={fillDemoParticipant}
              className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 transition-colors"
            >
              Participant (Alex Chen)
            </button>
          </div>
        </div>
      </main>

      {/* 3. Footer Section matching Zoom Screenshot */}
      <footer className="w-full py-6 px-4 text-center border-t border-slate-100 dark:border-slate-800/60 bg-white dark:bg-[#0b101b] space-y-3">
        {/* Footer Links */}
        <div className="flex items-center justify-center space-x-6 text-sm text-[#0E71EB]">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="hover:underline text-slate-600 dark:text-slate-400 hover:text-[#0E71EB]"
          >
            Help
          </button>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="hover:underline text-slate-600 dark:text-slate-400 hover:text-[#0E71EB]"
          >
            Terms
          </button>
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="hover:underline text-slate-600 dark:text-slate-400 hover:text-[#0E71EB]"
          >
            Privacy
          </button>
        </div>

        {/* Security Subtext */}
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md mx-auto leading-relaxed">
          Conversio is protected by end-to-end encryption and enterprise access controls.{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-[#0E71EB] hover:underline"
          >
            Privacy Policy
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="text-[#0E71EB] hover:underline"
          >
            Terms of Service
          </button>{' '}
          apply.
        </p>
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
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0b101b]">
          <div className="w-8 h-8 border-2 border-[#0E71EB] border-t-transparent rounded-full animate-spin" />
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
