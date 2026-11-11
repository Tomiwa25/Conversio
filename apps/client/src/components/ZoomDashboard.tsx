'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Plus,
  Calendar,
  MonitorUp,
  MessageSquare,
  Edit3,
  Clock,
  Settings,
  Search,
  ChevronDown,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  Check,
  Crown,
  LogOut,
  LogIn,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../context/auth.context';
import { ThemeToggle } from './ThemeToggle';
import { AuthModal } from './AuthModal';

export const ZoomDashboard: React.FC = () => {
  const router = useRouter();
  const { user, accessToken, logout } = useAuth();

  // Top nav active tab
  const [activeNavTab, setActiveNavTab] = useState<'home' | 'meetings' | 'chat' | 'whiteboard'>('home');

  // Time & Date state for modern clock widget
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Modals state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New Meeting Split Dropdown & Settings
  const [isNewMeetingDropdownOpen, setIsNewMeetingDropdownOpen] = useState(false);
  const [startWithVideo, setStartWithVideo] = useState(true);
  const [usePMI, setUsePMI] = useState(false);

  // Form inputs
  const [meetingTopic, setMeetingTopic] = useState('My Zoom Meeting');
  const [hostName, setHostName] = useState('');
  const [meetingPasscode, setMeetingPasscode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

  // Live Clock loop
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync user profile
  useEffect(() => {
    if (user) {
      setHostName(user.name);
      setParticipantName(user.name);
    }
  }, [user]);

  /**
   * Start New Meeting Handler
   */
  const handleCreateMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveHostName = user?.name || hostName.trim() || 'Host';
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
          title: meetingTopic.trim() || 'Instant Meeting',
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
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(
          effectiveHostName
        )}&userId=${data.userId || hostId}&role=host`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error starting meeting');
      setIsCreating(false);
    }
  };

  /**
   * Join Existing Meeting Handler
   */
  const handleJoinMeeting = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const effectiveName = user?.name || participantName.trim() || 'Attendee';
    if (!joinMeetingId.trim()) {
      setErrorMessage('Please enter a valid Meeting ID');
      return;
    }

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
        `/room/${roomId}?token=${encodeURIComponent(token)}&name=${encodeURIComponent(
          effectiveName
        )}&userId=${userId}&role=participant`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error joining meeting');
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#18181B] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-[#0E71EB] selection:text-white transition-colors duration-200">
      {/* 1. Zoom Top Navigation Bar */}
      <header className="h-14 border-b border-slate-200 dark:border-zinc-800 bg-white/90 dark:bg-[#18181B]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40">
        {/* Left: Brand Logo & Navigation Tabs */}
        <div className="flex items-center space-x-6 sm:space-x-8">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0E71EB] flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Video className="w-4 h-4 fill-current" />
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-sans">
              zoom
            </span>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2 text-xs font-semibold">
            <button
              onClick={() => setActiveNavTab('home')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeNavTab === 'home'
                  ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveNavTab('meetings')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeNavTab === 'meetings'
                  ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setActiveNavTab('chat')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeNavTab === 'chat'
                  ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Team Chat
            </button>
            <button
              onClick={() => setActiveNavTab('whiteboard')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeNavTab === 'whiteboard'
                  ? 'bg-slate-200/80 dark:bg-zinc-800 text-slate-900 dark:text-white'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/50'
              }`}
            >
              Whiteboards
            </button>
          </nav>
        </div>

        {/* Right: Search, Settings, Theme & User Avatar with Status Dot */}
        <div className="flex items-center space-x-3">
          <ThemeToggle compact />

          {/* User Profile Avatar with Online Status Dot */}
          {user ? (
            <div className="flex items-center space-x-2 pl-2">
              <div className="relative cursor-pointer" title={`${user.name} • Available`}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0E71EB] to-indigo-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white dark:border-zinc-800 shadow">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {/* Active green status dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#22C55E] border-2 border-white dark:border-[#18181B]" />
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthModalMode('signin');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0E71EB] hover:bg-[#005CE6] text-white shadow-md shadow-blue-500/20 transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Dashboard Content (Home View) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 flex flex-col justify-center">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-medium shadow-md">
            {errorMessage}
          </div>
        )}

        {activeNavTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: 4 Rounded-3xl Quick Action Tiles (Official Zoom Desktop Layout) */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-5 sm:gap-6">
              {/* Tile 1: "New Meeting" (Solid Orange #FF7426 with split dropdown) */}
              <div className="relative group">
                <div
                  onClick={() => setIsNewMeetingModalOpen(true)}
                  className="bg-[#FF7426] hover:bg-[#E8641B] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-orange-500/20 cursor-pointer transition transform hover:-translate-y-0.5 flex flex-col justify-between aspect-square select-none"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Video className="w-7 h-7 text-white fill-current" />
                    </div>
                    {/* Split button dropdown arrow */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNewMeetingDropdownOpen((prev) => !prev);
                      }}
                      className="p-2 rounded-xl hover:bg-white/20 transition text-white"
                      title="New Meeting Options"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">New Meeting</h3>
                    <p className="text-xs text-white/80 font-medium mt-0.5">Start instant conference</p>
                  </div>
                </div>

                {/* Split Dropdown Popover */}
                {isNewMeetingDropdownOpen && (
                  <div className="absolute top-20 right-2 w-64 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 text-xs text-slate-800 dark:text-zinc-200 space-y-2.5">
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setStartWithVideo(!startWithVideo)}>
                      <input
                        type="checkbox"
                        checked={startWithVideo}
                        onChange={(e) => setStartWithVideo(e.target.checked)}
                        className="rounded border-zinc-700 text-[#0E71EB] focus:ring-0"
                      />
                      <span className="font-medium">Start with video</span>
                    </div>
                    <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setUsePMI(!usePMI)}>
                      <input
                        type="checkbox"
                        checked={usePMI}
                        onChange={(e) => setUsePMI(e.target.checked)}
                        className="rounded border-zinc-700 text-[#0E71EB] focus:ring-0"
                      />
                      <span className="font-medium">Use Personal Meeting ID (PMI)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setIsNewMeetingDropdownOpen(false);
                          setIsNewMeetingModalOpen(true);
                        }}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-[#0E71EB] text-white font-semibold text-center hover:bg-[#005CE6] transition"
                      >
                        Meeting Settings...
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Tile 2: "Join" (Solid Blue #0E71EB with plus icon) */}
              <div
                onClick={() => setIsJoinModalOpen(true)}
                className="bg-[#0E71EB] hover:bg-[#005CE6] text-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-blue-500/20 cursor-pointer transition transform hover:-translate-y-0.5 flex flex-col justify-between aspect-square select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Join</h3>
                  <p className="text-xs text-white/80 font-medium mt-0.5">Enter with ID or passcode</p>
                </div>
              </div>

              {/* Tile 3: "Schedule" (Calendar icon, clean outline/fill) */}
              <div
                onClick={() => setIsScheduleModalOpen(true)}
                className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 hover:border-[#0E71EB] dark:hover:border-[#0E71EB] text-slate-800 dark:text-zinc-100 rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none cursor-pointer transition transform hover:-translate-y-0.5 flex flex-col justify-between aspect-square select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#0E71EB]/10 text-[#0E71EB] dark:text-blue-400 flex items-center justify-center">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">Schedule</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Plan upcoming meetings</p>
                </div>
              </div>

              {/* Tile 4: "Share Screen" (Screen icon with upward arrow) */}
              <div
                onClick={() => {
                  setMeetingTopic('Screen Share Session');
                  handleCreateMeeting();
                }}
                className="bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 hover:border-[#22C55E] dark:hover:border-[#22C55E] text-slate-800 dark:text-zinc-100 rounded-3xl p-6 sm:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none cursor-pointer transition transform hover:-translate-y-0.5 flex flex-col justify-between aspect-square select-none"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center">
                  <MonitorUp className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight">Share Screen</h3>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium mt-0.5">Direct desktop broadcast</p>
                </div>
              </div>
            </div>

            {/* Right Column: Modern Live Clock & Upcoming Meetings Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Modern Clock Widget */}
              <div className="bg-gradient-to-br from-white to-slate-100 dark:from-zinc-900 dark:to-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl p-7 shadow-xl shadow-slate-200/50 dark:shadow-2xl flex flex-col justify-center relative overflow-hidden">
                <div className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {currentTime || '09:45 AM'}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 mt-2 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-[#0E71EB]" />
                  <span>{currentDate || 'Wednesday, November 11, 2026'}</span>
                </div>
              </div>

              {/* Upcoming Meetings List Card */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-400">
                    Today&apos;s Schedule
                  </span>
                  <span className="text-[10px] font-semibold text-[#0E71EB] bg-[#0E71EB]/10 px-2 py-0.5 rounded-full">
                    2 Meetings
                  </span>
                </div>

                {/* Meeting Card 1 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 flex items-center justify-between hover:border-[#0E71EB]/50 transition">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Engineering Architecture Review
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      10:00 AM - 10:45 AM • ID: 842-991-304
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMeetingTopic('Engineering Architecture Review');
                      handleCreateMeeting();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-bold transition shadow-md shadow-blue-500/20"
                  >
                    Start
                  </button>
                </div>

                {/* Meeting Card 2 */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800/80 flex items-center justify-between hover:border-[#0E71EB]/50 transition">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      Product Design & Zoom UI Alignment
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      02:00 PM - 03:00 PM • ID: 712-405-998
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMeetingTopic('Product Design & Zoom UI Alignment');
                      handleCreateMeeting();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-white text-xs font-bold transition"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Meetings Navigation Tab View */}
        {activeNavTab === 'meetings' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Scheduled & Recurring Meetings</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">View your upcoming appointments, personal room ID, and recording archives.</p>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-4 py-2 bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule a Meeting</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Personal Meeting Room (PMI)</span>
                <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">https://conversio.io/room/pmi-921-482-019</p>
              </div>
              <button
                onClick={() => handleCreateMeeting()}
                className="px-4 py-2 bg-[#0E71EB] text-white text-xs font-bold rounded-xl hover:bg-[#005CE6] transition"
              >
                Start Room
              </button>
            </div>
          </div>
        )}

        {/* 4. Team Chat Tab View */}
        {activeNavTab === 'chat' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Team Chat Channels</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-[#0E71EB] transition cursor-pointer">
                <span className="font-bold text-[#0E71EB]"># general</span>
                <p className="text-slate-500 dark:text-zinc-400 mt-1">Company-wide announcements and team updates.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-[#0E71EB] transition cursor-pointer">
                <span className="font-bold text-[#0E71EB]"># engineering</span>
                <p className="text-slate-500 dark:text-zinc-400 mt-1">WebRTC, SFU, and Next.js frontend discussions.</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 hover:border-[#0E71EB] transition cursor-pointer">
                <span className="font-bold text-[#0E71EB]"># product-design</span>
                <p className="text-slate-500 dark:text-zinc-400 mt-1">Zoom-caliber UI tokens and user feedback.</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. Whiteboard Tab View */}
        {activeNavTab === 'whiteboard' && (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Zoom-Style Whiteboards</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">Collaborative canvases synced in real time via WebRTC DataChannels.</p>
              </div>
              <button
                onClick={() => {
                  setMeetingTopic('Collaborative Whiteboard');
                  handleCreateMeeting();
                }}
                className="px-4 py-2 bg-[#0E71EB] hover:bg-[#005CE6] text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>New Whiteboard</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 dark:border-zinc-800/80 px-6 flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
        <span>&copy; {new Date().getFullYear()} Conversio • Official Zoom UI/UX Design System</span>
        <div className="flex items-center space-x-4">
          <span className="hover:text-[#0E71EB] cursor-pointer">Version 2.4.0</span>
          <span className="hover:text-[#0E71EB] cursor-pointer">Privacy & Security</span>
        </div>
      </footer>

      {/* New Meeting Modal */}
      {isNewMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Video className="w-4 h-4 text-[#FF7426]" />
                <span>Start New Meeting</span>
              </h3>
              <button onClick={() => setIsNewMeetingModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Topic</label>
                <input
                  type="text"
                  required
                  value={meetingTopic}
                  onChange={(e) => setMeetingTopic(e.target.value)}
                  placeholder="e.g. Design Sync"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB]"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Your Name</label>
                <input
                  type="text"
                  required
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Passcode</label>
                  <span className="text-[10px] text-slate-400">Optional (6 digits)</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={meetingPasscode}
                  onChange={(e) => setMeetingPasscode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB] font-mono tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-2.5 rounded-xl bg-[#FF7426] hover:bg-[#E8641B] text-white font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isCreating ? 'Connecting...' : 'Start Meeting'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Meeting Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-[#0E71EB]" />
                <span>Join Meeting</span>
              </h3>
              <button onClick={() => setIsJoinModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Meeting ID or Personal Link</label>
                <input
                  type="text"
                  required
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  placeholder="Enter Meeting UUID..."
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Your Name</label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g. Jordan Lee"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-zinc-300">Meeting Passcode</label>
                  <span className="text-[10px] text-slate-400">If required by host</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={joinPasscode}
                  onChange={(e) => setJoinPasscode(e.target.value)}
                  placeholder="6-digit passcode"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-[#0E71EB] font-mono tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining}
                className="w-full py-2.5 rounded-xl bg-[#0E71EB] hover:bg-[#005CE6] text-white font-bold transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#0E71EB]" />
                <span>Schedule a Meeting</span>
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Topic</label>
                <input
                  type="text"
                  defaultValue="Weekly Team Sync"
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">Time</label>
                  <input
                    type="time"
                    defaultValue="10:00"
                    className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setIsScheduleModalOpen(false);
                  handleCreateMeeting();
                }}
                className="w-full py-2.5 rounded-xl bg-[#0E71EB] hover:bg-[#005CE6] text-white font-bold transition shadow-md shadow-blue-500/20"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
    </div>
  );
};

export default ZoomDashboard;
