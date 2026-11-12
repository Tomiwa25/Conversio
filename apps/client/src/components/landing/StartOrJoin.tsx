'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { IDEMPOTENCY_HEADER } from '@conversio/shared';
import { useAuth } from '../../context/auth.context';
import { Button, ErrorText, Field, Input, LiveDot, MonoLabel } from '../primitives';

type Mode = 'start' | 'join';

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';

const digitsOnly = (v: string) => v.replace(/\D/g, '');

/**
 * One instrument with two states, not two competing cards. The user says what
 * they're doing first; then only the fields that matter appear. The join pane
 * sits under the form, not beside it — on mobile you never scroll sideways.
 */
export const StartOrJoin: React.FC = () => {
  const router = useRouter();
  const { user, accessToken } = useAuth();
  const [mode, setMode] = useState<Mode>('start');

  const [topic, setTopic] = useState('');
  const [passcode, setPasscode] = useState('');
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinPasscode, setJoinPasscode] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = user?.name || name.trim();

  const authHeaders = (): Record<string, string> =>
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  /**
   * Accepts a bare room id or a pasted room link
   * (`https://host/room/<id>?token=…`). The id is the path segment after
   * `/room/`; everything else in the link is dropped.
   */
  const parseRoomCode = (raw: string): string => {
    const value = raw.trim();
    const match = value.match(/\/room\/([^/?#]+)/);
    return decodeURIComponent(match ? match[1] : value);
  };

  const onStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !displayName) return;
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
          title: topic.trim(),
          hostId: user?.id || `user-${crypto.randomUUID().slice(0, 8)}`,
          hostName: displayName,
          passcode: passcode.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Turn HTTP failures into a sentence the user can act on.
        if (res.status === 409) setError('A room with that name already exists. Try a different title.');
        else setError(data.error || 'The room could not be created. Check your connection and try again.');
        return;
      }
      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(displayName)}&userId=${data.userId || user?.id || ''}&role=host`,
      );
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !displayName) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch(`${serverUrl}/api/rooms/${encodeURIComponent(parseRoomCode(roomId))}/join`, {
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
        if (res.status === 404) setError('No meeting exists with that code. Check it and try again.');
        else if (res.status === 403) setError('That passcode is not correct. Ask the host to confirm it.');
        else setError(data.error || 'You could not join this meeting. Try again in a moment.');
        return;
      }
      router.push(
        `/room/${data.room.id}?token=${encodeURIComponent(data.token)}&name=${encodeURIComponent(displayName)}&userId=${data.userId}&role=participant`,
      );
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const reset = (m: Mode) => {
    setMode(m);
    setError(null);
  };

  return (
    <section id="start" className="border-b border-line bg-glass/40">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <h2 className="font-display text-xl text-chalk leading-tight">
              Start a room you control. Or join someone else&apos;s.
            </h2>
            <p className="text-sm text-muted mt-3 max-w-[38ch] leading-relaxed">
              Rooms are passcode-protected and open in the browser. Nothing to install, nothing to dial in to.
            </p>
            {user && (
              <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted">
                <LiveDot state="static" tone="signal" size={6} />
                <span>
                  Signed in as <span className="text-chalk font-medium">{user.name}</span>
                </span>
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="rounded-panel border border-line bg-ink overflow-hidden">
              {/* segmented control */}
              <div className="grid grid-cols-2 border-b border-line" role="tablist">
                {(['start', 'join'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => reset(m)}
                    className={clsx(
                      'h-11 text-sm font-medium transition-colors relative',
                      mode === m ? 'text-chalk' : 'text-muted hover:text-chalk',
                      m === 'start' && 'border-r border-line',
                    )}
                  >
                    {m === 'start' ? 'Start a meeting' : 'Join with a code'}
                    {mode === m && (
                      <span className="absolute left-4 right-4 -bottom-px h-[2px] bg-signal" aria-hidden />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-5 lg:p-6">
                {mode === 'start' ? (
                  <form onSubmit={onStart} className="space-y-4">
                    <Field label="Meeting topic">
                      <Input
                        required
                        autoFocus
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Product strategy review"
                      />
                    </Field>
                    {!user && (
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
                    <Field
                      label="Passcode"
                      hint={passcode.length > 0 && passcode.length < 6 ? `${passcode.length} of 6 digits` : 'Optional · six digits'}
                    >
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        value={passcode}
                        onChange={(e) => setPasscode(digitsOnly(e.target.value))}
                        placeholder="——————"
                        mono
                        className="tracking-[0.3em]"
                      />
                    </Field>
                    {error && <ErrorText text={error} />}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <MonoLabel tone="hint">you become the host</MonoLabel>
                      <Button type="submit" loading={busy} disabled={!topic.trim() || !displayName}>
                        Start a meeting
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form id="join" onSubmit={onJoin} className="space-y-4">
                    <Field label="Room code" hint="ID or full room link">
                      <Input
                        required
                        autoFocus
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder="Paste the room code or link"
                        mono
                      />
                    </Field>
                    {!user && (
                      <Field label="Your name">
                        <Input
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Jordan Lee"
                          autoComplete="name"
                        />
                      </Field>
                    )}
                    <Field
                      label="Passcode"
                      hint={joinPasscode.length > 0 && joinPasscode.length < 6 ? `${joinPasscode.length} of 6 digits` : 'If the host set one'}
                    >
                      <Input
                        inputMode="numeric"
                        maxLength={6}
                        value={joinPasscode}
                        onChange={(e) => setJoinPasscode(digitsOnly(e.target.value))}
                        placeholder="——————"
                        mono
                        className="tracking-[0.3em]"
                      />
                    </Field>
                    {error && <ErrorText text={error} />}
                    <div className="flex items-center justify-between gap-4 pt-1">
                      <MonoLabel tone="hint">nothing installs</MonoLabel>
                      <Button type="submit" loading={busy} disabled={!roomId.trim() || !displayName}>
                        Join meeting
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
