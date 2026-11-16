'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Video, Link2, Sparkles, Shield, Zap, Lock } from 'lucide-react';
import { clsx } from 'clsx';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../../context/auth.context';
import { Button, MonoLabel } from '../primitives';
import { HubInteractiveStage } from './HubInteractiveStage';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

export const LandingHero: React.FC = () => {
  const router = useRouter();
  const { user, accessToken } = useAuth();

  const [mode, setMode] = useState<'start' | 'join'>('start');
  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name || name.trim() || 'Guest';

  const authHeaders = (): Record<string, string> =>
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const parseRoomCode = (raw: string): string => {
    const value = raw.trim();
    const match = value.match(/\/room\/([^/?#]+)/);
    return decodeURIComponent(match ? match[1] : value);
  };

  const handleStartRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const roomTopic = topic.trim() || `${displayName}'s Sync Space`;

    try {
      const res = await fetch(`${serverUrl}/api/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          [IDEMPOTENCY_HEADER]: crypto.randomUUID(),
          ...authHeaders(),
        },
        body: JSON.stringify({
          title: roomTopic,
          hostId: user?.id || `user-${crypto.randomUUID().slice(0, 8)}`,
          hostName: displayName,
          passcode: passcode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create room. Please try again.');
        return;
      }

      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(
          displayName
        )}&userId=${data.userId || user?.id || ''}&role=host`
      );
    } catch {
      setError('Could not connect to the signaling server. Please check your network.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    setBusy(true);
    setError(null);

    try {
      const parsedId = parseRoomCode(roomCode);
      const res = await fetch(`${serverUrl}/api/rooms/${encodeURIComponent(parsedId)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: displayName,
          userId: user?.id,
          passcode: passcode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404) setError('Room not found. Check your code or link.');
        else if (res.status === 403) setError('Passcode incorrect or room is locked.');
        else setError(data.error || 'Could not join room.');
        return;
      }

      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(
          displayName
        )}&userId=${data.userId}&role=participant`
      );
    } catch {
      setError('Could not connect to the signaling server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-line/60 hero-glow py-16 lg:py-24">
      {/* Background radial gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-signal/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 relative z-10">
        {/* Top Eyebrow */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-control bg-glass/80 border border-line/80 backdrop-blur-sm text-xs text-muted hover:border-signal/50 transition">
            <Sparkles className="w-3.5 h-3.5 text-signal" />
            <span className="font-mono text-[11px] tracking-tight uppercase text-chalk">
              Unified Real-Time Communication Hub
            </span>
            <span className="text-line">|</span>
            <span className="text-[10px] text-signal font-mono font-semibold">LiveKit SFU + P2P</span>
          </div>

          {/* Minimalist Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-[-0.03em] text-chalk leading-[1.05]">
            Where real-time teams meet,{' '}
            <span className="italic text-transparent bg-clip-text bg-gradient-to-r from-signal via-emerald-400 to-sky-400">
              sync, and build.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted max-w-[56ch] leading-relaxed">
            Ultra-low latency video conferencing, persistent team channels, client-side encrypted canvas, and agenda
            sync in one seamless space. Zero installs, zero tracking.
          </p>

          {/* Quick Action Launchpad */}
          <div className="w-full max-w-xl mt-4">
            <div className="rounded-panel border border-line/80 bg-ink/90 p-1.5 shadow-float backdrop-blur-md">
              {/* Segmented Mode Selector */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-control bg-glass/40 border border-line/40 text-xs mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode('start');
                    setError(null);
                  }}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 py-1.5 rounded-control font-medium transition-all duration-150',
                    mode === 'start'
                      ? 'bg-signal text-ink shadow-[0_0_12px_rgba(180,255,57,0.3)] font-semibold'
                      : 'text-muted hover:text-chalk'
                  )}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Instant Meeting</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('join');
                    setError(null);
                  }}
                  className={clsx(
                    'flex items-center justify-center gap-1.5 py-1.5 rounded-control font-medium transition-all duration-150',
                    mode === 'join'
                      ? 'bg-signal text-ink shadow-[0_0_12px_rgba(180,255,57,0.3)] font-semibold'
                      : 'text-muted hover:text-chalk'
                  )}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Join with Code</span>
                </button>
              </div>

              {/* Form Input Area */}
              {mode === 'start' ? (
                <form onSubmit={handleStartRoom} className="space-y-2 p-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Meeting Topic (e.g. Design Architecture Sync)"
                      className="flex-1 h-10 px-3 rounded-control bg-glass/50 border border-line/70 text-sm text-chalk placeholder:text-muted/60 focus:outline-none focus:border-signal/70 transition"
                    />
                    {!user && (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="sm:w-36 h-10 px-3 rounded-control bg-glass/50 border border-line/70 text-sm text-chalk placeholder:text-muted/60 focus:outline-none focus:border-signal/70 transition"
                      />
                    )}
                    <Button
                      type="submit"
                      loading={busy}
                      variant="primary"
                      className="h-10 px-5 text-xs font-semibold whitespace-nowrap"
                    >
                      <span>Create Space</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Passcode toggle */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => setShowPasscode((s) => !s)}
                      className="text-muted hover:text-chalk transition flex items-center gap-1 text-[11px]"
                    >
                      <Lock className="w-3 h-3 text-muted" />
                      <span>{showPasscode ? 'Hide passcode' : 'Add 6-digit passcode'}</span>
                    </button>
                    {user && (
                      <span className="text-[11px] text-muted">
                        Signed in as <span className="text-chalk font-medium">{user.name}</span>
                      </span>
                    )}
                  </div>

                  {showPasscode && (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Passcode (6 digits)"
                      className="w-full h-9 px-3 rounded-control bg-glass/50 border border-line/70 text-xs font-mono text-chalk tracking-[0.2em] focus:outline-none focus:border-signal/70 transition"
                    />
                  )}
                </form>
              ) : (
                <form onSubmit={handleJoinRoom} className="space-y-2 p-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="Enter room code or paste meeting link"
                      className="flex-1 h-10 px-3 rounded-control bg-glass/50 border border-line/70 text-sm font-mono text-chalk placeholder:text-muted/60 focus:outline-none focus:border-signal/70 transition"
                    />
                    {!user && (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Name"
                        className="sm:w-36 h-10 px-3 rounded-control bg-glass/50 border border-line/70 text-sm text-chalk placeholder:text-muted/60 focus:outline-none focus:border-signal/70 transition"
                      />
                    )}
                    <Button
                      type="submit"
                      loading={busy}
                      variant="primary"
                      className="h-10 px-5 text-xs font-semibold whitespace-nowrap"
                    >
                      <span>Join Space</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Passcode toggle for join */}
                  <div className="flex items-center justify-between text-xs pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => setShowPasscode((s) => !s)}
                      className="text-muted hover:text-chalk transition flex items-center gap-1 text-[11px]"
                    >
                      <Lock className="w-3 h-3 text-muted" />
                      <span>{showPasscode ? 'Hide passcode' : 'Enter meeting passcode (if set)'}</span>
                    </button>
                    <MonoLabel tone="hint" className="text-[10px]">
                      zero config
                    </MonoLabel>
                  </div>

                  {showPasscode && (
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Passcode (6 digits)"
                      className="w-full h-9 px-3 rounded-control bg-glass/50 border border-line/70 text-xs font-mono text-chalk tracking-[0.2em] focus:outline-none focus:border-signal/70 transition"
                    />
                  )}
                </form>
              )}

              {error && (
                <div className="p-2 text-xs text-pulse bg-pulse/10 border border-pulse/20 rounded-control text-center">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Hub Live Preview Spotlight */}
        <div className="mt-14 lg:mt-18" id="capabilities">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xs uppercase font-mono tracking-wider text-muted">
                Interactive Capability Sandbox
              </h2>
              <p className="text-sm font-medium text-chalk mt-0.5">Explore the 4 unified pillars of Conversio</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-signal" />
              <span>Click tabs to preview real-time engine</span>
            </div>
          </div>

          <HubInteractiveStage />
        </div>
      </div>
    </section>
  );
};
