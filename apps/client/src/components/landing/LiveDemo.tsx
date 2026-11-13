'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, Monitor, Hand, MessageSquare, Pencil, PhoneOff } from 'lucide-react';
import { clsx } from 'clsx';
import { Waveform } from '../primitives';
import { LiveDot } from '../primitives';
import { MonoLabel } from '../primitives';
import { SignalMeter, qualityFromScore } from '../primitives';

interface DemoParticipant {
  id: string;
  name: string;
  initials: string;
  muted: boolean;
  hand: boolean;
  sharing: boolean;
  quality: number;
}

const INITIAL: DemoParticipant[] = [
  { id: 'amara', name: 'Amara Osei', initials: 'AO', muted: false, hand: false, sharing: false, quality: 88 },
  { id: 'dov', name: 'Dov Levin', initials: 'DL', muted: true, hand: false, sharing: false, quality: 64 },
  { id: 'ines', name: 'Inês Ferreira', initials: 'IF', muted: false, hand: true, sharing: false, quality: 79 },
  { id: 'kenji', name: 'Kenji Arai', initials: 'KA', muted: false, hand: false, sharing: false, quality: 42 },
];

// Prewritten transcript lines, cycled to make the chat drawer feel alive.
const TRANSCRIPT: Array<{ who: string; text: string }> = [
  { who: 'Amara', text: 'Sharing the revised scope now — hold on.' },
  { who: 'Dov', text: 'Got it. Reading through.' },
  { who: 'Inês', text: 'Two questions on the second slide.' },
  { who: 'Amara', text: 'Fire away.' },
  { who: 'Kenji', text: 'The passcode step works now, by the way.' },
  { who: 'Dov', text: 'Nice. Let’s ship Tuesday.' },
];

/**
 * The live demo in the landing hero. Renders the same shapes the real room uses
 * (tile, waveform rail, control dock) fed by a tick, so the animation is a
 * demonstration of what the product does rather than an ornament.
 */
export const LiveDemo: React.FC = () => {
  const [participants, setParticipants] = useState(INITIAL);
  const [speaker, setSpeaker] = useState<string>('amara');
  const [messages, setMessages] = useState<Array<{ id: number; who: string; text: string }>>(
    TRANSCRIPT.slice(0, 2).map((m, i) => ({ ...m, id: i })),
  );
  const [elapsed, setElapsed] = useState(0);
  // Levels are per participant, small arrays — cheap to redraw.
  const [levels, setLevels] = useState<Record<string, number[]>>({});

  const cycleRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Every ~3s, a new speaker or a new transcript line. Never both, never a
  // random twitch — one purposeful change at a time.
  useEffect(() => {
    const timer = window.setInterval(() => {
      cycleRef.current += 1;
      const tick = cycleRef.current;

      setLevels(
        Object.fromEntries(
          participants.map((p) => [
            p.id,
            Array.from({ length: 10 }, () => (p.muted ? 0 : Math.random() * (p.id === speaker ? 1 : 0.35))),
          ]),
        ),
      );

      if (tick % 2 === 0) {
        const others = participants.filter((p) => p.id !== speaker && !p.muted && !p.hand);
        if (others.length) setSpeaker(others[Math.floor(Math.random() * others.length)].id);
      } else {
        const next = TRANSCRIPT[tick % TRANSCRIPT.length];
        setMessages((prev) => {
          const trimmed = prev.length >= 4 ? prev.slice(1) : prev;
          return [...trimmed, { ...next, id: tick }];
        });
      }
    }, 2600);
    return () => window.clearInterval(timer);
  }, [participants, speaker]);

  const main = participants.find((p) => p.id === speaker) ?? participants[0];
  const strip = participants.filter((p) => p.id !== main.id);
  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="rounded-panel border border-line bg-glass overflow-hidden shadow-float">
      {/* instrument header */}
      <div className="flex items-center justify-between gap-4 px-4 h-11 border-b border-line">
        <div className="flex items-center gap-3 min-w-0">
          <LiveDot tone="pulse" size={6} label="recording" />
          <span className="text-xs text-chalk font-medium truncate">Engineering sprint &amp; scope review</span>
        </div>
        <div className="flex items-center gap-3 flex-none">
          <SignalMeter quality="good" label="Good connection" />
          <MonoLabel className="text-[11px]">{elapsedLabel}</MonoLabel>
          <MonoLabel tone="hint" className="text-[11px]">
            {participants.length} peers
          </MonoLabel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* stage */}
        <div className="lg:col-span-8 p-3 space-y-2">
          <div className="relative rounded-panel border border-line bg-ink overflow-hidden aspect-video">
            {/* active speaker glyph */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border-2 border-signal/70 scale-[1.12] animate-soft-pulse" />
                <div className="w-20 h-20 rounded-full bg-glass border-2 border-signal flex items-center justify-center">
                  <span className="font-display italic text-2xl text-signal">{main.initials}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-chalk">{main.name}</span>
                {main.id === 'amara' && <MonoLabel className="text-[10px]">host</MonoLabel>}
              </div>
            </div>
            {/* bottom rail: the waveform on the left, mute on the right */}
            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between px-3 pb-2">
              <Waveform height={18} bars={16} barWidth={2} />
              <span className={clsx('flex items-center gap-1 text-xs', main.muted ? 'text-pulse' : 'text-muted')}>
                {main.muted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                <MonoLabel tone={main.muted ? 'chalk' : 'hint'} className="text-[10px]">
                  {main.muted ? 'muted' : 'live'}
                </MonoLabel>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {strip.map((p) => (
              <div
                key={p.id}
                className="rounded-panel border border-line bg-ink px-2 py-1.5 flex items-center gap-2 min-w-0"
              >
                <div className="w-6 h-6 flex-none rounded-full border border-line bg-glass flex items-center justify-center">
                  <span className="font-display italic text-[11px] text-chalk">{p.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-chalk truncate">
                    <span className="truncate">{p.name.split(' ')[0]}</span>
                    {p.hand && <Hand className="w-3 h-3 flex-none text-amber-400" />}
                  </div>
                  <div className="flex gap-[2px] h-[3px] mt-1">
                    {(levels[p.id] ?? []).slice(0, 8).map((l, i) => (
                      <span
                        key={i}
                        className={clsx('flex-1 rounded-[1px]', p.muted ? 'bg-line' : 'bg-signal')}
                        style={{ opacity: Math.max(0.15, Math.min(1, l + 0.15)) }}
                      />
                    ))}
                  </div>
                </div>
                <SignalMeter quality={qualityFromScore(p.quality)} className="flex-none" />
              </div>
            ))}
          </div>
        </div>

        {/* chat drawer */}
        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-line flex flex-col min-h-[240px]">
          <div className="flex items-center justify-between px-4 h-11 border-b border-line">
            <span className="text-xs text-chalk font-medium flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-muted" />
              In-meeting chat
            </span>
            <MonoLabel tone="hint" className="text-[10px]">
              {messages.length} recent
            </MonoLabel>
          </div>
          <div className="flex-1 p-4 space-y-3 overflow-hidden">
            {messages.map((m) => (
              <div key={m.id} className="animate-rise">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-chalk">{m.who}</span>
                  <MonoLabel tone="hint" className="text-[10px]">
                    {elapsedLabel}
                  </MonoLabel>
                </div>
                <p className="text-sm text-muted leading-snug mt-0.5">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* control dock */}
      <div className="flex items-center justify-between px-4 h-16 border-t border-line bg-ink/60">
        <div className="flex items-center gap-1">
          <DockButton icon={Mic} active={!main.muted} />
          <DockButton icon={Video} />
          <DockButton icon={Pencil} />
        </div>
        <div className="flex items-center gap-1">
          <DockButton icon={Monitor} active />
          <DockButton icon={MessageSquare} />
          <DockButton icon={Hand} />
        </div>
        <button
          type="button"
          className="flex items-center gap-2 h-9 px-3 rounded-control border border-pulse/40 text-pulse text-xs font-medium"
          aria-label="Leave (demo)"
        >
          <PhoneOff className="w-3.5 h-3.5" />
          Leave
        </button>
      </div>
    </div>
  );
};

const DockButton: React.FC<{ icon: React.ElementType; active?: boolean }> = ({ icon: Icon, active }) => (
  <span
    aria-hidden
    className={clsx(
      'w-9 h-9 rounded-control flex items-center justify-center',
      active ? 'bg-signal text-ink' : 'bg-glass text-chalk border border-line',
    )}
  >
    <Icon className="w-4 h-4" />
  </span>
);
