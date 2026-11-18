'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../../context/auth.context';
import { Button, Input, LiveDot, MonoLabel, Waveform } from '../primitives';
import { ShieldCheck, Video, Lock, ArrowRight, Sparkles, KeyRound } from 'lucide-react';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

const SPEC: Array<[string, string]> = [
  ['Setup', '100% In-Browser (No Apps)'],
  ['Security', 'Private & End-to-End Encrypted'],
  ['Access', 'Instant Link or Passcode'],
  ['Features', 'Video, Whiteboard & Files'],
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
      setError('Unable to reach signaling gateway. Please verify your connection.');
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
    <section className="border-b border-line bg-gradient-to-b from-ink via-ink to-glass/40">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Focused Problem & Solution */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-signal/30 bg-signal/5 text-signal text-xs font-medium tracking-wide">
              <LiveDot state="live" tone="signal" size={6} />
              <span>Fast, Private Online Meetings</span>
            </div>

            <h1 className="font-display text-[46px] sm:text-5xl lg:text-6xl text-chalk leading-[0.98] tracking-[-0.03em] max-w-[16ch]">
              Simple video calls.
              <br />
              <span className="italic text-signal">No downloads required.</span>
            </h1>

            <p className="text-base text-muted max-w-[54ch] leading-relaxed">
              Meet face-to-face, chat, draw on a live whiteboard, and share files securely right in your browser. No apps to install, no tracking, and no hassle—just create a room and share the link.
            </p>

            {/* Spec telemetry tags */}
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-line/60">
              {SPEC.map(([term, def]) => (
                <div key={term}>
                  <dt className="text-muted text-[11px] uppercase tracking-wider font-mono">{term}</dt>
                  <dd className="text-chalk text-xs font-medium mt-0.5">{def}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Right Column: Instant Action Console */}
          <div className="lg:col-span-5">
            <div className="bg-glass border border-line rounded-panel p-6 sm:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('create');
                      setError(null);
                    }}
                    className={`px-3 py-1.5 rounded-control text-xs font-semibold transition ${
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
                    className={`px-3 py-1.5 rounded-control text-xs font-semibold transition ${
                      mode === 'join'
                        ? 'bg-signal text-ink shadow-sm'
                        : 'text-muted hover:text-chalk hover:bg-chalk/[0.04]'
                    }`}
                  >
                    Join with Code
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted font-medium">
                  <LiveDot state="static" tone="signal" size={6} />
                  <span>Ready to Connect</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-control bg-pulse/10 border border-pulse/25 text-pulse text-xs leading-relaxed">
                  {error}
                </div>
              )}

              {mode === 'create' ? (
                <form onSubmit={handleCreateRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5">Meeting title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Architecture Review"
                      required
                      className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-xs font-medium text-chalk mb-1.5">Your display name</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Alex Chen"
                        required
                        className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5">
                      Optional Passcode <span className="text-muted font-normal">(Protects room entrance)</span>
                    </label>
                    <input
                      type="password"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Leave blank for open access"
                      className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !title.trim()}
                    className="w-full h-11 rounded-control bg-signal text-ink font-semibold text-sm hover:brightness-105 transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>{busy ? 'Initializing room...' : 'Launch Instant Meeting'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleJoinRoom} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5">Meeting ID or link</label>
                    <input
                      type="text"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      placeholder="Paste room code or https://.../room/xyz"
                      required
                      className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition font-mono"
                    />
                  </div>

                  {!user && (
                    <div>
                      <label className="block text-xs font-medium text-chalk mb-1.5">Your display name</label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        required
                        className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-chalk mb-1.5">Meeting Passcode</label>
                    <input
                      type="password"
                      value={joinPasscode}
                      onChange={(e) => setJoinPasscode(e.target.value)}
                      placeholder="Required if room is protected"
                      className="w-full h-10 px-3 rounded-control bg-ink/70 border border-line text-chalk text-sm placeholder:text-muted/40 focus:outline-none focus:border-signal transition"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy || !roomId.trim()}
                    className="w-full h-11 rounded-control bg-signal text-ink font-semibold text-sm hover:brightness-105 transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>{busy ? 'Connecting...' : 'Join Meeting'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="mt-5 pt-4 border-t border-line/50 flex items-center justify-between text-[11px] text-muted">
                <span>Zero software downloads required</span>
                <span className="text-signal font-mono">100% In-Browser</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
