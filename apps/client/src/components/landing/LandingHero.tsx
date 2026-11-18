'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../../context/auth.context';
import { LiveDot } from '../primitives';
import {
  Monitor,
  ShieldCheck,
  Link as LinkIcon,
  Video,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Palette,
  MessageSquare,
  PhoneOff,
  Calendar,
  User,
  Lock,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

const HIGHLIGHT_CAPSULES = [
  {
    icon: Monitor,
    title: 'In-Browser Setup',
    subtitle: '100% in-browser (No Apps)',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy & Security',
    subtitle: 'Private & End-to-End Encrypted',
  },
  {
    icon: LinkIcon,
    title: 'Instant Access',
    subtitle: 'Instant Link or Passcode',
  },
  {
    icon: Video,
    title: 'Full Meeting Tools',
    subtitle: 'Video, Whiteboard & Files',
  },
];

export const LandingHero: React.FC = () => {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [title, setTitle] = useState('');
  const [passcode, setPasscode] = useState('');
  const [guestName, setGuestName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name || guestName.trim() || 'Guest';

  const authHeaders = (): Record<string, string> =>
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const parseRoomCode = (raw: string): string => {
    const value = raw.trim();
    const match = value.match(/\/room\/([^/?#]+)/);
    return decodeURIComponent(match ? match[1] : value);
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${serverUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [IDEMPOTENCY_HEADER]: crypto.randomUUID(),
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: title.trim(),
          hostId: user?.id || `user-${crypto.randomUUID().slice(0, 8)}`,
          hostName: displayName,
          passcode: passcode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || data.error || 'Failed to initialize room.');
        return;
      }

      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(displayName)}&userId=${data.userId || user?.id || ''}&role=host`
      );
    } catch {
      setError('Unable to reach server. Please verify your connection.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedCode = parseRoomCode(roomId);
    if (!cleanedCode) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${serverUrl}/api/rooms/${encodeURIComponent(cleanedCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: displayName,
          userId: user?.id,
          passcode: joinPasscode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'ROOM_LOCKED') {
          setError('This room has been locked by the host.');
        } else if (data.code === 'PASSCODE_REQUIRED' || data.code === 'INVALID_PASSCODE') {
          setError('This room requires a valid meeting passcode.');
        } else {
          setError(data.error || 'Unable to join meeting.');
        }
        return;
      }

      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(displayName)}&userId=${data.userId}&role=participant`
      );
    } catch {
      setError('Unable to connect to meeting room.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border-b border-line bg-gradient-to-b from-ink via-ink to-glass/30 pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        {/* 1. Hero Two-Column Grid: Headline/Copy on Left, High-Fi Laptop Mockup on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center mb-16">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-signal/30 bg-signal/10 text-signal text-xs font-semibold tracking-wide">
              <span className="w-2 h-2 rounded-full bg-signal animate-pulse" />
              <span>Fast, Private Online Meetings</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[62px] text-chalk leading-[1.05] tracking-[-0.03em]">
              Simple video calls.
              <br />
              <span className="italic text-signal font-normal">No downloads required.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-[52ch] leading-relaxed">
              Meet face-to-face, chat, draw on a live whiteboard, and share files securely right in your browser. No apps to install, no tracking, and no hassle—just create a room and share the link.
            </p>

            <div className="pt-2 flex items-center gap-4">
              <a
                href="#start"
                className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-signal text-ink font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,176,122,0.35)] hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <span>Start a Meeting</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex items-center px-5 h-12 rounded-full border border-line bg-glass/60 text-chalk text-sm font-medium hover:bg-glass hover:border-signal/40 transition"
              >
                How It Works
              </a>
            </div>
          </div>

          {/* Right Column: High-Fi Laptop Device Mockup with Video Call UI */}
          <div className="lg:col-span-6">
            <div className="relative mx-auto w-full max-w-[560px]">
              {/* Screen Bezel */}
              <div className="rounded-t-2xl border-[5px] border-[#1e293b] dark:border-[#334155] bg-[#0f172a] p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] relative">
                {/* Webcam dot */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1e293b] flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-signal/80" />
                </div>

                {/* Inner Video Window */}
                <div className="rounded-xl overflow-hidden bg-gradient-to-br from-[#0b1329] via-[#0d1b2a] to-[#0a1128] aspect-[16/10] relative flex flex-col justify-between p-3.5 border border-white/10 select-none">
                  {/* Top Bar inside Video Call */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[11px] text-white/90">
                      <span className="w-1.5 h-1.5 rounded-full bg-signal animate-ping" />
                      <span className="font-medium">Design Review</span>
                      <span className="text-white/40">·</span>
                      <span className="text-white/60">4 in room</span>
                    </div>

                    <div className="bg-black/50 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white/70 font-mono border border-white/10">
                      1080p HD
                    </div>
                  </div>

                  {/* Main Call View: Presenter + Video Sidebar */}
                  <div className="grid grid-cols-12 gap-2.5 h-[65%] my-auto z-10">
                    {/* Main Presenter Screen */}
                    <div className="col-span-8 rounded-lg bg-gradient-to-br from-[#162a45] to-[#0c182b] border border-white/10 relative overflow-hidden flex flex-col justify-between p-2.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium backdrop-blur-sm">
                          Alex Chen (Host)
                        </span>
                        <div className="w-5 h-5 rounded-full bg-signal/20 text-signal flex items-center justify-center">
                          <Mic className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Presenter Visual Avatar */}
                      <div className="my-auto self-center flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-signal to-[#38d39f] flex items-center justify-center text-ink font-display text-2xl font-bold shadow-lg">
                          AC
                        </div>
                        <span className="text-[11px] text-white/80 mt-1.5 font-medium">Screen Sharing Active</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-white/50 font-mono">
                        <span>Latency 28ms</span>
                        <span>Encrypted</span>
                      </div>
                    </div>

                    {/* Right Participant Sidebar (3 Tiles) */}
                    <div className="col-span-4 flex flex-col gap-2 h-full">
                      <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/80 font-medium truncate">Sarah Lin</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                        </div>
                        <div className="self-center w-7 h-7 rounded-full bg-[#2a4365] text-white/90 flex items-center justify-center text-[10px] font-bold">
                          SL
                        </div>
                        <span className="text-[9px] text-white/40">Speaking...</span>
                      </div>

                      <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/80 font-medium truncate">Marcus V.</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                        </div>
                        <div className="self-center w-7 h-7 rounded-full bg-[#2d3748] text-white/90 flex items-center justify-center text-[10px] font-bold">
                          MV
                        </div>
                        <span className="text-[9px] text-white/40">Cam on</span>
                      </div>

                      <div className="flex-1 rounded-lg bg-white/5 border border-white/10 p-2 flex flex-col justify-between relative overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/80 font-medium truncate">Elena R.</span>
                          <MicOff className="w-2.5 h-2.5 text-white/40" />
                        </div>
                        <div className="self-center w-7 h-7 rounded-full bg-[#1a365d] text-white/90 flex items-center justify-center text-[10px] font-bold">
                          ER
                        </div>
                        <span className="text-[9px] text-white/40">Muted</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Bottom Call Controls Pill */}
                  <div className="mx-auto bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 flex items-center gap-2.5 shadow-2xl z-20">
                    <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-signal flex items-center justify-center transition">
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-signal flex items-center justify-center transition">
                      <Video className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition">
                      <ScreenShare className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-signal/20 border border-signal/40 text-signal flex items-center justify-center transition">
                      <Palette className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white/80 flex items-center justify-center transition">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md transition">
                      <PhoneOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Laptop Keyboard Base & Notch */}
              <div className="h-4 bg-gradient-to-b from-[#334155] via-[#1e293b] to-[#0f172a] rounded-b-xl shadow-xl relative flex items-center justify-center">
                <div className="w-20 h-1.5 bg-[#475569] rounded-full shadow-inner" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. 4-Capsule Feature Highlight Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {HIGHLIGHT_CAPSULES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-glass border border-line rounded-xl p-4 flex items-center gap-3.5 hover:border-signal/40 transition-colors group shadow-sm"
              >
                <div className="w-10 h-10 rounded-lg bg-signal/10 border border-signal/20 text-signal flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-chalk tracking-tight">{item.title}</h3>
                  <p className="text-[11px] text-muted leading-tight mt-0.5">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. Interactive Meeting Room Creator Box (Anchor #start) */}
        <div id="start" className="max-w-3xl mx-auto scroll-mt-24">
          <div className="bg-glass border border-line rounded-2xl p-6 sm:p-8 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('create');
                    setError(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                    mode === 'create'
                      ? 'bg-signal text-ink shadow-sm'
                      : 'text-muted hover:text-chalk hover:bg-chalk/[0.04]'
                  }`}
                >
                  Start Meeting
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('join');
                    setError(null);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                    mode === 'join'
                      ? 'bg-signal text-ink shadow-sm'
                      : 'text-muted hover:text-chalk hover:bg-chalk/[0.04]'
                  }`}
                >
                  Join with Code
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted font-medium">
                <span className="w-2 h-2 rounded-full bg-signal" />
                <span>Ready to Connect</span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-pulse/10 border border-pulse/25 text-pulse text-xs leading-relaxed">
                {error}
              </div>
            )}

            {mode === 'create' ? (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Field 1: Meeting Title */}
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-signal" />
                      <span>Meeting title</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Architecture Review"
                      required
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  {/* Field 2: Your Name */}
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-signal" />
                      <span>Your display name</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={user ? user.name : 'e.g. Alex Chen'}
                      required={!user}
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  {/* Field 3: Optional Passcode */}
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-signal" />
                      <span>Optional Passcode</span>
                    </label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Leave blank for open access"
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="submit"
                    disabled={busy || !title.trim()}
                    className="w-full sm:w-auto sm:min-w-[240px] h-12 px-8 rounded-full bg-signal text-ink font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,176,122,0.4)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{busy ? 'Setting up meeting...' : 'Start Meeting →'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-signal" />
                      <span>Meeting ID or link</span>
                    </label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Paste room link or code"
                      required
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-signal" />
                      <span>Your name</span>
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder={user ? user.name : 'e.g. Sarah Connor'}
                      required={!user}
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-signal" />
                      <span>Meeting Passcode</span>
                    </label>
                    <input
                      type="password"
                      value={joinPasscode}
                      onChange={(e) => setJoinPasscode(e.target.value)}
                      placeholder="Only if room is locked"
                      className="w-full h-11 px-3.5 rounded-xl bg-ink/70 border border-line text-chalk text-xs placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    type="submit"
                    disabled={busy || !roomId.trim()}
                    className="w-full sm:w-auto sm:min-w-[240px] h-12 px-8 rounded-full bg-signal text-ink font-semibold text-sm hover:shadow-[0_0_24px_rgba(0,176,122,0.4)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{busy ? 'Connecting to room...' : 'Join Meeting →'}</span>
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted">
              <span>Zero software downloads required</span>
              <span className="text-signal font-mono font-medium">100% In-Browser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
