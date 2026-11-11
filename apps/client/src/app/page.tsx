'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  ShieldCheck,
  Plus,
  Users,
  ArrowRight,
  Sparkles,
  LogIn,
  LogOut,
  User,
  Crown,
  ChevronDown,
  X,
  CheckCircle2,
  Lock,
  MessageSquare,
  FileText,
  Phone,
  Monitor,
  Headphones,
  Code2,
  Search,
  Check,
  Send,
  Play,
  Share2,
  Mic,
  Smile,
  Laptop,
  HelpCircle,
  Cookie,
} from 'lucide-react';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../context/auth.context';
import { AuthModal } from '../components/AuthModal';
import { ThemeToggle } from '../components/ThemeToggle';
import { PrivacyModal } from '../components/PrivacyModal';
import { HelpModal } from '../components/HelpModal';
import { CookieConsent } from '../components/CookieConsent';

type ProductTab =
  | 'meetings'
  | 'notes'
  | 'ai-mate'
  | 'canvas'
  | 'chat-phone'
  | 'ccaas'
  | 'rooms-workvivo'
  | 'developer';

export default function LobbyPage() {
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Supporting Dialogs
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCookieForceOpen, setIsCookieForceOpen] = useState(false);

  // Announcement Banner Visibility
  const [showBanner, setShowBanner] = useState(true);

  // Active Showcase Tab
  const [activeTab, setActiveTab] = useState<ProductTab>('meetings');

  // New Meeting State
  const [meetingTopic, setMeetingTopic] = useState('');
  const [hostName, setHostName] = useState('');
  const [meetingPasscode, setMeetingPasscode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Join Meeting State
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

  // Synchronize authenticated user profile to fields
  useEffect(() => {
    if (user) {
      setHostName(user.name);
      setParticipantName(user.name);
    }
  }, [user]);

  /**
   * Start New Meeting (Binds to Authenticated Host when signed in)
   */
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveHostName = user?.name || hostName.trim();
    if (!meetingTopic.trim() || !effectiveHostName) return;

    setIsCreating(true);
    setErrorMessage(null);

    const idempotencyKey = crypto.randomUUID();
    const hostId = user?.id || `user-${crypto.randomUUID().slice(0, 8)}`;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        [IDEMPOTENCY_HEADER]: idempotencyKey,
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${serverUrl}/api/rooms`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: meetingTopic.trim(),
          hostId,
          hostName: effectiveHostName,
          passcode: meetingPasscode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start meeting');
      }

      const roomId = data.room.id;
      const token = data.token;
      router.push(
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(effectiveHostName)}&userId=${data.userId || hostId}&role=host`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error starting meeting');
      setIsCreating(false);
    }
  };

  /**
   * Join Existing Meeting
   */
  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveName = user?.name || participantName.trim();
    if (!joinMeetingId.trim() || !effectiveName) return;

    setIsJoining(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`${serverUrl}/api/rooms/${joinMeetingId.trim()}/join`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: effectiveName,
          userId: user?.id,
          passcode: joinPasscode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to join meeting');
      }

      const roomId = data.room.id;
      const token = data.token;
      const userId = data.userId;

      router.push(
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(effectiveName)}&userId=${userId}&role=participant`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error joining meeting');
      setIsJoining(false);
    }
  };

  const tabs = [
    { id: 'meetings' as ProductTab, label: 'Meetings', icon: Video },
    { id: 'notes' as ProductTab, label: 'My Notes (AI)', icon: FileText },
    { id: 'ai-mate' as ProductTab, label: 'ConversioMate AI', icon: Sparkles },
    { id: 'canvas' as ProductTab, label: 'Productivity Suite', icon: CheckCircle2 },
    { id: 'chat-phone' as ProductTab, label: 'Chat & Phone', icon: Phone },
    { id: 'ccaas' as ProductTab, label: 'Virtual Agent & CX', icon: Headphones },
    { id: 'rooms-workvivo' as ProductTab, label: 'Rooms & Culture', icon: Monitor },
    { id: 'developer' as ProductTab, label: 'Developer SDK', icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white transition-colors duration-200">
      {/* Top Announcement Banner (Zoomtopia 2026 Style) */}
      {showBanner && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white text-xs py-2 px-4 text-center relative flex items-center justify-center space-x-2 shadow-md">
          <span className="font-semibold tracking-wide">
            Catch all the Conversio 2026 Collaboration Platform highlights — now on demand.
          </span>
          <button
            onClick={() => setActiveTab('ai-mate')}
            className="ml-2 px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-medium text-[11px] backdrop-blur-sm transition"
          >
            Explore AI Suite
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-3 p-1 rounded-full hover:bg-white/20 transition text-white/80 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar (Zoom Style) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090d16]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Logo & Main Nav Links */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/25">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
                  Conversio
                </span>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                  AI Workplace
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                onClick={() => setActiveTab('meetings')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1"
              >
                <span>Products</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('ai-mate')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1"
              >
                <span>AI Platform</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1"
              >
                <span>Solutions</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById('architecture-breakdown');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition"
              >
                Architecture & Security
              </button>
              <button
                onClick={() => setIsHelpModalOpen(true)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition flex items-center space-x-1"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Help Center</span>
              </button>
            </nav>
          </div>

          {/* Right: Actions, Theme Switcher & Auth */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle: Dark, Light, System */}
            <ThemeToggle />

            {/* User Profile or Sign In / Sign Up */}
            {user ? (
              <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-2xl">
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center space-x-1 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-white truncate max-w-[110px]">
                      {user.name}
                    </span>
                    {user.role === 'host' && (
                      <span title="Verified Host">
                        <Crown className="w-3 h-3 text-amber-500" />
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setAuthModalMode('signin');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthModalMode('signup');
                    setIsAuthModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-600/25 flex items-center space-x-1.5"
                >
                  <span>Sign Up Free</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section (Matching Zoom 2026 Headline & Aesthetics) */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Gradient Glow Backdrop */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-indigo-500/10 to-purple-500/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-600 dark:text-blue-400 text-xs font-semibold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>AI-First WebRTC Collaboration Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
            Find out what&apos;s possible when work connects
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Bridge the gap between talking and doing with the AI-first collaboration platform built for your entire team.
          </p>

          {errorMessage && (
            <div className="max-w-md mx-auto p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 text-xs rounded-2xl shadow-md">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Quick Launch Cards: Start Meeting & Join Meeting */}
        <div className="mt-10 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: New Meeting */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition hover:border-blue-500/50">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Start a New Meeting</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Instantly create a secure meeting room with automated AI notes, recording, and breakout groups.
            </p>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Topic
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Product Strategy Review"
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {user ? 'Hosting As' : 'Your Name'}
                </label>
                {user ? (
                  <div className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-300 flex items-center justify-between">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Host</span>
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={hostName}
                    onChange={(e) => setHostName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meeting Passcode
                  </label>
                  <span className="text-[10px] text-slate-400">Optional (6 digits)</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={meetingPasscode}
                  onChange={(e) => setMeetingPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25"
              >
                <span>{isCreating ? 'Setting up meeting...' : 'Start Meeting Now'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Card 2: Join Meeting */}
          <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-2xl transition hover:border-indigo-500/50">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Join a Meeting</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
              Enter an invitation ID or meeting link with optional host passcode verification.
            </p>

            <form onSubmit={handleJoinMeeting} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="Paste meeting UUID..."
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Display Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Lee"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Meeting Passcode
                  </label>
                  <span className="text-[10px] text-slate-400">If required by host</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="6-digit passcode"
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25"
              >
                <span>{isJoining ? 'Verifying access...' : 'Join Meeting'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* ================================================================= */}
        {/* WHAT CONVERSIO LOOKS LIKE: High-Fidelity UI Graphic Showcase     */}
        {/* ================================================================= */}
        <div className="mt-16 max-w-5xl mx-auto px-2 sm:px-4">
          <div className="text-center mb-6 space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
              <Monitor className="w-3.5 h-3.5" />
              <span>Experience The Conversio Workplace</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Inside a Live Conversio Conference
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Engineered with sub-100ms latency, multi-user vector whiteboard, instant screen sharing, and cryptographic zero-trust privacy.
            </p>
          </div>

          {/* Application Window Frame */}
          <div className="relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-900 shadow-2xl shadow-blue-600/10 overflow-hidden text-white font-sans transition-all duration-300 hover:shadow-blue-600/20">
            {/* Window Top Titlebar */}
            <div className="h-10 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs select-none">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                <span className="ml-3 text-[11px] font-medium text-slate-400 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  <span className="text-slate-200 font-semibold truncate max-w-[200px] sm:max-w-none">Conversio Room: Engineering Sprint &amp; Architecture</span>
                  <span className="text-slate-500 hidden sm:inline">&bull; 00:24:18</span>
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[10px] text-slate-400">
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>AES-256 E2EE</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>38ms SFU</span>
                </span>
              </div>
            </div>

            {/* Main Stage Grid Area */}
            <div className="p-4 sm:p-6 bg-gradient-to-b from-slate-900 via-slate-950 to-black grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[460px]">
              {/* Left / Center: Active Speaker Main Feed + Filmstrip */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
                {/* Main Active Speaker Tile */}
                <div className="relative rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-2 border-emerald-500/80 shadow-lg shadow-emerald-500/10 overflow-hidden flex-1 min-h-[280px] flex items-center justify-center p-6">
                  {/* Decorative Speaker Video Simulation Background */}
                  <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.25) 0%, transparent 70%)" }} />

                  {/* Active Speaker Avatar */}
                  <div className="relative z-10 text-center space-y-3">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-600 to-purple-600 flex items-center justify-center text-2xl font-extrabold shadow-2xl shadow-blue-500/40 border-2 border-white/40 ring-4 ring-emerald-500/40 animate-pulse">
                        SC
                      </div>
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 text-white shadow-md">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-bold text-white flex items-center justify-center space-x-1.5">
                        <span>Sarah Connor</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 border border-blue-400/30">Host</span>
                      </div>
                      <p className="text-[11px] text-emerald-400 font-medium">Active Speaker &bull; LiveKit SFU 1080p60</p>
                    </div>

                    {/* Simulated Voice Activity Visualizer (Audio Waveform) */}
                    <div className="flex items-center justify-center space-x-1 h-5 pt-1">
                      <span className="w-1 bg-emerald-400 rounded-full h-2 animate-pulse" />
                      <span className="w-1 bg-emerald-400 rounded-full h-4 animate-bounce" />
                      <span className="w-1 bg-emerald-400 rounded-full h-5 animate-pulse" />
                      <span className="w-1 bg-emerald-400 rounded-full h-3 animate-bounce" />
                      <span className="w-1 bg-emerald-400 rounded-full h-5 animate-pulse" />
                      <span className="w-1 bg-emerald-400 rounded-full h-2 animate-bounce" />
                      <span className="w-1 bg-emerald-400 rounded-full h-4 animate-pulse" />
                    </div>
                  </div>

                  {/* Floating AI Note Taker Live Badge */}
                  <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] flex items-center space-x-2">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-slate-200">AI Transcript: &ldquo;LiveKit SFU reduces mesh uplink overhead...&rdquo;</span>
                  </div>

                  {/* Recording Badge */}
                  <div className="absolute top-3 right-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />
                    <span>REC</span>
                  </div>
                </div>

                {/* Filmstrip: Other Attendees */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center font-bold text-[10px] border border-purple-400/20">AM</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-200 truncate">Alex Morgan</div>
                      <div className="text-[9px] text-slate-400">Screen Sharing</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/30 text-emerald-300 flex items-center justify-center font-bold text-[10px] border border-emerald-400/20">DK</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-200 truncate">David Kim</div>
                      <div className="text-[9px] text-slate-400">Muted</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-2 flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-pink-500/30 text-pink-300 flex items-center justify-center font-bold text-[10px] border border-pink-400/20">ER</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-200 truncate">Elena Rostova</div>
                      <div className="text-[9px] text-emerald-400">Listening</div>
                    </div>
                  </div>

                  <div className="hidden sm:flex bg-slate-900/80 border border-slate-800 rounded-xl p-2 items-center space-x-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px] border border-blue-400/20">MW</div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-200 truncate">Marcus W.</div>
                      <div className="text-[9px] text-slate-400">Video HD</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Whiteboard & In-Meeting Chat Drawer Mockup */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
                {/* Whiteboard Preview Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Shared Whiteboard</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">Sync: Live</span>
                  </div>
                  {/* Vector Whiteboard Mini Canvas Illustration */}
                  <div className="h-24 bg-slate-950/80 rounded-xl border border-dashed border-slate-800 p-2 relative overflow-hidden flex items-center justify-around">
                    <div className="px-2 py-1 rounded bg-blue-600/20 border border-blue-500/40 text-[9px] text-blue-300 font-mono">
                      Client Next.js
                    </div>
                    <div className="text-slate-600 text-xs">&rarr;</div>
                    <div className="px-2 py-1 rounded bg-indigo-600/20 border border-indigo-500/40 text-[9px] text-indigo-300 font-mono">
                      LiveKit SFU
                    </div>
                    <div className="text-slate-600 text-xs">&rarr;</div>
                    <div className="px-2 py-1 rounded bg-emerald-600/20 border border-emerald-500/40 text-[9px] text-emerald-300 font-mono">
                      PostgreSQL
                    </div>
                  </div>
                </div>

                {/* In-Meeting Live Chat Preview Card */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
                    <span className="font-bold text-white flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      <span>In-Meeting Chat</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold">3 New</span>
                  </div>

                  <div className="space-y-2 text-[11px] font-sans">
                    <div>
                      <div className="flex items-baseline space-x-1">
                        <span className="font-semibold text-blue-400">Elena R.</span>
                        <span className="text-[9px] text-slate-500">10:22 AM</span>
                      </div>
                      <p className="text-slate-300 text-[10.5px]">LiveKit SFU cut round-trip latency to 38ms! 🚀</p>
                    </div>

                    <div>
                      <div className="flex items-baseline space-x-1">
                        <span className="font-semibold text-purple-400">Alex M.</span>
                        <span className="text-[9px] text-slate-500">10:23 AM</span>
                      </div>
                      <p className="text-slate-300 text-[10.5px]">Uploading the client-side AES encrypted specs now.</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] text-slate-500">
                    <div className="w-full bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-[10px] text-slate-400">
                      Type message to everyone...
                    </div>
                    <Send className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Floating Zoom Dock Controls Bar */}
            <div className="h-16 px-4 sm:px-6 bg-slate-950/95 border-t border-slate-800 flex items-center justify-between select-none">
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
                <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                  <Mic className="w-4 h-4" />
                  <span className="text-[9px] text-slate-300 mt-0.5">Mute</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-xl bg-slate-900 border border-slate-800 text-blue-400">
                  <Video className="w-4 h-4" />
                  <span className="text-[9px] text-slate-300 mt-0.5">Video</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4 text-xs">
                <div className="hidden sm:flex flex-col items-center px-2 py-1 rounded-xl text-slate-400 hover:text-white">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span className="text-[9px] mt-0.5">Security</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-xl text-slate-400 hover:text-white">
                  <Users className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">12 Peers</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-xl text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  <Monitor className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5 font-bold">Share</span>
                </div>
                <div className="flex flex-col items-center px-2 py-1 rounded-xl text-indigo-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">Canvas</span>
                </div>
                <div className="hidden sm:flex flex-col items-center px-2 py-1 rounded-xl text-amber-400">
                  <Smile className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">React</span>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  type="button"
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-rose-600/30"
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Zoom 2026 Ecosystem Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 transition-colors">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Complete Conversio Collaboration Platform
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Inspired by the Zoom 2026 AI-first workplace: meetings, notes, intelligent assistant, team chat, and hybrid rooms.
            </p>
          </div>

          {/* Product Domain Tabs */}
          <div className="flex items-center justify-start md:justify-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-blue-600/25'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Visual Showcase Card Container */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl transition">
            {/* 1. Video Meetings & Webinars */}
            {activeTab === 'meetings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    <Video className="w-3.5 h-3.5" />
                    <span>Video Meetings & Webinars</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Crystal-clear video conferencing with intelligent active speaker spotlight
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Connect seamlessly with WebRTC audio & video, real-time screen sharing, interactive floating emoticons, gallery/speaker views, and composite audio local recording.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Active speaker detection with glowing audio stage auto-spotlight</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Live floating emoji reactions with zero server lag (👍 👏 ❤️ 😂 🎉 😮)</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Local meeting recording with multi-track Web Audio synthesis (.webm)</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Mockup: Zoom Video Grid */}
                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-2xl aspect-video flex flex-col justify-between relative overflow-hidden">
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="bg-slate-900 rounded-xl border-2 border-blue-500 relative flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                        S
                      </div>
                      <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                        Speaking
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                        Sydney Ren (Host)
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-xl border border-slate-800 relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-lg">
                        M
                      </div>
                      <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                        Marcus Vance
                      </div>
                    </div>
                  </div>
                  {/* Floating Emojis */}
                  <div className="absolute top-8 right-12 text-3xl animate-bounce">👏</div>
                  <div className="absolute top-12 left-16 text-3xl animate-pulse">🎉</div>
                  {/* Zoom Toolbar Mock */}
                  <div className="h-10 mt-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-center space-x-4 px-4 text-slate-300 text-[10px]">
                    <div className="flex items-center space-x-1"><Mic className="w-3.5 h-3.5 text-emerald-400" /><span>Mute</span></div>
                    <div className="flex items-center space-x-1"><Video className="w-3.5 h-3.5 text-blue-400" /><span>Video</span></div>
                    <div className="flex items-center space-x-1"><Share2 className="w-3.5 h-3.5 text-indigo-400" /><span>Share</span></div>
                    <div className="flex items-center space-x-1"><Smile className="w-3.5 h-3.5 text-amber-400" /><span>React</span></div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AI Note Taker (My Notes) */}
            {activeTab === 'notes' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span>AI Note Taker (My Notes)</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Automated transcription, real-time capture, and smart action item extraction
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Never lose track of meeting outcomes. Conversio automatically transcribes live discussion, organizes executive summaries, and creates checkable action items for attendees.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Live multi-speaker speech-to-text transcript logs</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Automated action items assigned to responsible team members</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Export directly to Markdown, Notion, or Slack channels</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Mockup: Notes Document */}
                <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 font-sans">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Patrick&apos;s Notes • Q4 Review</span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">AI Summary Active</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      <strong>00:04:12</strong> • Sarah Owen met with company executives Rob and Max regarding Q4 budget expectations.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Action Items Extracted:</span>
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Share budget expectations with Rob before Friday</span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                        <span>Deploy WebRTC Perfect Negotiation to production</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ConversioMate AI Assistant */}
            {activeTab === 'ai-mate' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ConversioMate AI Assistant</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Generative AI that builds decks, drafts follow-up emails, and drives decisions
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Powered by generative LLM intelligence to answer meeting questions, synthesize multi-hour discussions, and draft professional presentations with a single prompt.
                  </p>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Natural prompt bar: &quot;+ Anything to complete?&quot;</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Instant slide deck & document generation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Pre-meeting briefing preparation & post-meeting emails</span>
                    </li>
                  </ul>
                </div>

                {/* Visual Mockup: AI Prompt Card */}
                <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold">ConversioMate Assistant</span>
                    </div>
                    <span className="text-[10px] text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full">v2.4 Active</span>
                  </div>

                  <div className="bg-slate-950/80 rounded-xl p-3 border border-indigo-900/80 flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value="+ Generate executive summary deck for engineering standup"
                      className="bg-transparent text-xs text-slate-200 w-full focus:outline-none"
                    />
                    <button className="p-1 rounded-lg bg-blue-600 text-white"><Send className="w-3.5 h-3.5" /></button>
                  </div>

                  <div className="flex items-center space-x-2 text-[10px]">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">Drive meeting</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">Build slides</span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-200 border border-indigo-700/60">Email recap</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. AI Productivity Suite & Canvas */}
            {activeTab === 'canvas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>AI Productivity Suite & Canvas</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Collaborative infinite canvas, document co-authoring, and visual ideation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Brainstorm, design system architectures, and create collaborative proposals together in real time on a shared WebRTC DataChannel canvas with zero latency.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span>Creative Design & Architecture Proposal</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Live Sync</span>
                  </div>
                  <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-around p-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-blue-500 text-white shadow font-semibold">Client Next.js</div>
                    <span className="text-slate-400">⟶</span>
                    <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow font-semibold">WebRTC Mesh</div>
                    <span className="text-slate-400">⟶</span>
                    <div className="p-2.5 rounded-lg bg-purple-600 text-white shadow font-semibold">E2EE DataChannel</div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Team Chat & Cloud Phone (UCaaS) */}
            {activeTab === 'chat-phone' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Unified Communications (UCaaS)</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Persistent Team Chat, enterprise cloud telephony, and channel collaboration
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Seamlessly transition from an asynchronous team chat channel into an encrypted HD voice call or a full video conference with a single click.
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                    <span className="font-bold"># general-engineering</span>
                    <span className="text-emerald-400 text-[10px]">● 24 Online</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-blue-400 font-semibold">Tomiwa:</span> Passcode verification & audio recording tests are passing 100%!
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-purple-400 font-semibold">Alex:</span> Starting voice call to review breakout rooms...
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Virtual Agent & Contact Center (CCaaS) */}
            {activeTab === 'ccaas' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Customer Experience (CCaaS)</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    AI Virtual Agent with intelligent omni-channel routing and real-time sentiment
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Automate tier-1 inquiries with natural conversational AI chatbots, with seamless escalation to human video and phone agents when needed.
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span>Conversio Virtual Agent</span>
                    <span className="text-[10px] text-emerald-500">99.8% CSAT</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-slate-600 dark:text-slate-300">
                      <strong>AI Virtual Agent:</strong> &quot;Hello! I have verified your room passcode and pre-allocated your high-bandwidth SFU stream.&quot;
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Rooms & Workvivo */}
            {activeTab === 'rooms-workvivo' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Conversio Rooms & Employee Hub</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Hardware room controllers, multi-screen setups, and company social engagement
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Turn any physical conference room into a one-touch collaboration hub with hardware controller pairing, room calendar scheduling, and company-wide social announcements.
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 font-bold">
                    <span>Main Boardroom • Touch Controller</span>
                    <span className="text-emerald-400 text-[10px]">Ready to Connect</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                    <p className="text-slate-400 text-[11px]">Upcoming Meeting: Executive Strategy (10:00 AM)</p>
                    <button className="px-4 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-semibold">Start One-Touch Room</button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. Developer Platform & SDK */}
            {activeTab === 'developer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-in fade-in duration-200">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold">
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Developer Platform & Video SDK</span>
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Embed real-time video, audio, and encrypted DataChannels in minutes
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Build custom video experiences with our modular TypeScript WebRTC SDK, REST APIs for room provisioning, and webhook signaling relays.
                  </p>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-xs text-blue-300 shadow-2xl overflow-x-auto">
                  <pre className="text-[11px] leading-relaxed">
{`import { webrtcManager } from '@conversio/client';

// Join secure meeting with cryptographic token
await webrtcManager.joinRoom('room-xyz', {
  id: 'user-001',
  name: 'Senior Dev',
  role: 'host'
}, admissionToken);

// Real-time audio FFT monitoring
webrtcManager.startActiveSpeakerMonitoring();`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Architecture & Security Breakdown Section */}
      <section id="architecture-breakdown" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Architecture: Conversio vs Cloud Video Relays
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Why our dual-layer WebRTC architecture provides unmatched privacy, speed, and reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">End-to-End Cryptography</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              All media tracks are encrypted with DTLS-SRTP and DataChannels with Web Crypto AES-GCM. Room passcodes are securely hashed with bcrypt salt rounds.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">In-Meeting Local Recording</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Synthesize local microphone and all attendee streams via Web Audio API, recording directly to `.webm` on your computer with zero cloud upload exposure.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sub-100ms Latency</h4>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Direct peer connection mesh with perfect negotiation glare prevention eliminates round-trip cloud transcoding latency completely.
            </p>
          </div>
        </div>
      </section>

      {/* Enterprise Multi-Column Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-slate-600 dark:text-slate-400">
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Product</h5>
            <ul className="space-y-2">
              <li onClick={() => setActiveTab('meetings')} className="hover:text-blue-500 cursor-pointer">Video Meetings</li>
              <li onClick={() => setActiveTab('notes')} className="hover:text-blue-500 cursor-pointer">AI Note Taker</li>
              <li onClick={() => setActiveTab('ai-mate')} className="hover:text-blue-500 cursor-pointer">ConversioMate AI</li>
              <li onClick={() => setIsHelpModalOpen(true)} className="hover:text-blue-500 cursor-pointer flex items-center space-x-1">
                <span>Help Center &amp; Guides</span>
              </li>
              <li onClick={() => setActiveTab('canvas')} className="hover:text-blue-500 cursor-pointer">Interactive Whiteboard</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Unified Comms</h5>
            <ul className="space-y-2">
              <li onClick={() => setActiveTab('chat-phone')} className="hover:text-blue-500 cursor-pointer">Team Chat Channels</li>
              <li onClick={() => setActiveTab('chat-phone')} className="hover:text-blue-500 cursor-pointer">Conversio Cloud Phone</li>
              <li onClick={() => setActiveTab('rooms-workvivo')} className="hover:text-blue-500 cursor-pointer">Hardware Rooms</li>
              <li onClick={() => setActiveTab('rooms-workvivo')} className="hover:text-blue-500 cursor-pointer">Employee Culture Hub</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Developers</h5>
            <ul className="space-y-2">
              <li onClick={() => setActiveTab('developer')} className="hover:text-blue-500 cursor-pointer">WebRTC Video SDK</li>
              <li onClick={() => setActiveTab('developer')} className="hover:text-blue-500 cursor-pointer">REST APIs &amp; Webhooks</li>
              <li>
                <a
                  href="https://github.com/Tomiwa25/Conversio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 cursor-pointer"
                >
                  GitHub Repository
                </a>
              </li>
              <li onClick={() => setIsHelpModalOpen(true)} className="hover:text-blue-500 cursor-pointer">Open Documentation</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Security &amp; Community</h5>
            <ul className="space-y-2">
              <li onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-500 cursor-pointer">End-to-End Encryption</li>
              <li onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-500 cursor-pointer">Bcrypt Room Passcodes</li>
              <li onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-500 cursor-pointer">Privacy &amp; Zero-Trust</li>
              <li onClick={() => setIsCookieForceOpen(true)} className="hover:text-blue-500 cursor-pointer">Cookie Preferences</li>
            </ul>

            {/* Social Media Links: Twitter/X, Instagram, WhatsApp */}
            <div className="pt-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block mb-2">Connect With Us</span>
              <div className="flex items-center space-x-3">
                {/* Twitter / X */}
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-500 dark:hover:text-sky-400 flex items-center justify-center transition shadow-sm"
                  title="Follow us on X (Twitter)"
                  aria-label="Follow Conversio on X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-pink-500 dark:hover:text-pink-400 flex items-center justify-center transition shadow-sm"
                  title="Follow us on Instagram"
                  aria-label="Follow Conversio on Instagram"
                >
                  <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://whatsapp.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center justify-center transition shadow-sm"
                  title="Chat with Conversio Support on WhatsApp"
                  aria-label="Chat with Conversio on WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.78 14.07c-.24.68-1.4 1.25-1.92 1.33-.51.08-1.17.12-3.79-.96-3.23-1.34-5.32-4.64-5.48-4.85-.16-.21-1.3-1.74-1.3-3.32 0-1.58.82-2.35 1.11-2.67.29-.32.63-.4.85-.4.21 0 .42 0 .61.01.2.01.46-.07.72.55.26.62.9 2.2.98 2.36.08.16.13.35.03.56-.11.21-.16.34-.32.53-.16.19-.34.42-.49.57-.16.16-.33.34-.14.67.19.33.84 1.39 1.8 2.25 1.24 1.11 2.29 1.45 2.62 1.61.33.16.52.14.71-.08.2-.21.84-.98 1.07-1.32.23-.33.46-.28.77-.16.31.12 1.98.93 2.32 1.1.34.17.57.26.65.4.08.14.08.82-.16 1.5z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px] space-y-2 sm:space-y-0">
          <span>&copy; {new Date().getFullYear()} Conversio Collaboration Platform &bull; Built with Next.js, WebRTC, TypeScript, PostgreSQL &amp; Redis.</span>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-500 transition">Privacy Policy</button>
            <button onClick={() => setIsPrivacyModalOpen(true)} className="hover:text-blue-500 transition">Security Overview</button>
            <button onClick={() => setIsHelpModalOpen(true)} className="hover:text-blue-500 transition">Help Center</button>
            <button onClick={() => setIsCookieForceOpen(true)} className="hover:text-blue-500 transition">Cookie Settings</button>
          </div>
        </div>
      </footer>

      {/* Sign In & Sign Up Modal with Visual Graphic Banner */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />

      {/* Privacy Policy & Zero-Trust Security Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
      />

      {/* Help Center & FAQ Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* Cookie & Storage Consent Banner */}
      <CookieConsent
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        forceOpen={isCookieForceOpen}
        onCloseForce={() => setIsCookieForceOpen(false)}
      />
    </div>
  );
}
