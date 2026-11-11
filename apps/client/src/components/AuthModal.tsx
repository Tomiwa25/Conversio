'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/auth.context';
import {
  X,
  Lock,
  Mail,
  User,
  Loader2,
  ShieldCheck,
  Sparkles,
  Video,
  CheckCircle2,
  Users,
  Mic,
  Monitor,
} from 'lucide-react';

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}> = ({ isOpen, onClose, defaultMode = 'signin' }) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your full name');
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('sarah@conversio.io');
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[92vh] overflow-y-auto">
        {/* Left Side: Illustrative Visual Graphic Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Background Ambient Glow & Patterns */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo & Title */}
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Conversio Collaboration Suite</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              {mode === 'signup' ? 'Power your hybrid team with Conversio' : 'Welcome back to your workspace'}
            </h3>
            <p className="text-xs text-blue-100/90 leading-relaxed">
              {mode === 'signup'
                ? 'Join thousands of engineering and product teams collaborating with real-time video, interactive whiteboard, and instant breakout groups.'
                : 'Connect to your scheduled meetings, live team channels, and encrypted recordings seamlessly.'}
            </p>
          </div>

          {/* Visual Graphic Representation: Video Meeting Preview Card */}
          <div className="relative z-10 my-6 bg-slate-950/40 backdrop-blur-md rounded-2xl border border-white/15 p-4 space-y-3 shadow-xl">
            {/* Header of graphic */}
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
              <div className="flex items-center space-x-1.5 text-emerald-300 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>LiveKit SFU Active</span>
              </div>
              <span className="text-white/60 font-mono text-[10px]">1080p HD</span>
            </div>

            {/* Video participant avatars illustration */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/10 rounded-xl p-2.5 flex items-center space-x-2 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-xs font-bold shadow-md">
                  SC
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate">Sarah Connor</div>
                  <div className="text-[9px] text-blue-200 flex items-center space-x-1">
                    <Mic className="w-2.5 h-2.5 text-emerald-400" />
                    <span>Host • Speaking</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-2.5 flex items-center space-x-2 border border-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-pink-500 flex items-center justify-center text-xs font-bold shadow-md">
                  AM
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate">Alex Morgan</div>
                  <div className="text-[9px] text-white/70">Screen Sharing</div>
                </div>
              </div>
            </div>

            {/* Feature Checklist */}
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-white/85">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Client-Side AES-256-GCM Zero-Trust Encryption</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Multi-User Fabric.js Vector Whiteboard</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Note */}
          <div className="relative z-10 flex items-center space-x-2 text-[11px] text-white/80">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Cryptographic JWT Room Admission & Verified Passcodes</span>
          </div>
        </div>

        {/* Right Side: Form Body */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {mode === 'signin' ? 'Sign In' : 'Get Started Free'}
                </h4>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-4 grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMessage(null);
                }}
                className={`py-2 rounded-xl transition ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
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
                className={`py-2 rounded-xl transition ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {errorMessage && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sarah Connor"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Work or Personal Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition font-mono text-[11px]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-600/25 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Free Account'}</span>
                )}
              </button>

              {/* Demo Credentials Shortcut */}
              {mode === 'signin' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline transition inline-flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Auto-fill Demo Host Credentials (sarah@conversio.io)</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 text-center">
            By signing in or creating an account, you agree to Conversio&apos;s Terms of Service and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};
