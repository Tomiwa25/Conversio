'use client';

import React, { useState, useEffect } from 'react';
import {
  Video,
  Mic,
  MicOff,
  MessageSquare,
  PenTool,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Sparkles,
  Share2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Waveform, MonoLabel, SignalMeter } from '../primitives';

type HubPillar = 'video' | 'channels' | 'whiteboard' | 'schedule';

const PILLARS: Array<{ id: HubPillar; label: string; icon: React.ElementType; badge: string }> = [
  { id: 'video', label: 'Video Conferencing', icon: Video, badge: 'P2P + SFU' },
  { id: 'channels', label: 'Team Channels', icon: MessageSquare, badge: 'Persistent' },
  { id: 'whiteboard', label: 'Encrypted Canvas', icon: PenTool, badge: 'AES-256' },
  { id: 'schedule', label: 'Smart Scheduler', icon: Calendar, badge: 'Agenda Sync' },
];

export const HubInteractiveStage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HubPillar>('video');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(142);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);

  // Small timer to make the live preview feel authentic
  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const triggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setTimeout(() => setActiveReaction(null), 1400);
  };

  const elapsedLabel = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(
    elapsed % 60
  ).padStart(2, '0')}`;

  return (
    <div className="w-full rounded-panel border border-line/80 bg-glass/70 backdrop-blur-xl overflow-hidden shadow-float">
      {/* Pillar switcher header */}
      <div className="flex items-center justify-between border-b border-line/60 bg-ink/40 px-3 py-2 flex-wrap gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar" role="tablist">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            const isSelected = activeTab === p.id;
            return (
              <button
                key={p.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveTab(p.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-control text-xs font-medium transition-all duration-150 relative whitespace-nowrap',
                  isSelected
                    ? 'bg-signal text-ink shadow-[0_0_12px_rgba(180,255,57,0.25)] font-semibold'
                    : 'text-muted hover:text-chalk hover:bg-glass/60'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{p.label}</span>
                <span
                  className={clsx(
                    'hidden sm:inline text-[9px] px-1 py-0.2 rounded font-mono',
                    isSelected ? 'bg-ink/20 text-ink' : 'bg-line/20 text-muted'
                  )}
                >
                  {p.badge}
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-3 pr-2">
          <SignalMeter quality="good" label="Optimal Latency (14ms)" />
          <MonoLabel tone="hint" className="text-[10px]">
            zero-trust
          </MonoLabel>
        </div>
      </div>

      {/* Main interactive stage canvas */}
      <div className="p-4 sm:p-6 min-h-[360px] flex flex-col justify-between">
        {activeTab === 'video' && (
          <div className="space-y-4 animate-rise">
            <div className="flex items-center justify-between gap-4 border-b border-line/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pulse animate-soft-pulse" />
                <span className="text-xs font-medium text-chalk">Architecture &amp; Security Sync</span>
                <MonoLabel tone="hint" className="text-[10px]">
                  ID: #eng-sync-94
                </MonoLabel>
              </div>
              <div className="flex items-center gap-2">
                <MonoLabel className="text-[11px]">{elapsedLabel}</MonoLabel>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-control bg-signal/10 border border-signal/30 text-[10px] text-signal font-mono">
                  <ShieldCheck className="w-3 h-3" /> E2EE DTLS-SRTP
                </span>
              </div>
            </div>

            {/* Stage tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Main active speaker */}
              <div className="sm:col-span-2 relative rounded-panel border border-line/60 bg-ink/90 overflow-hidden aspect-video flex flex-col justify-between p-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-glass/80 border border-line text-[10px] text-chalk">
                    <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                    <span>Amara Osei (Host)</span>
                  </div>
                  <MonoLabel tone="hint" className="text-[10px]">
                    1080p · 60fps
                  </MonoLabel>
                </div>

                {/* Center visual avatar */}
                <div className="flex flex-col items-center justify-center my-auto">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full border-2 border-signal/60 scale-125 animate-soft-pulse" />
                    <div className="w-16 h-16 rounded-full bg-glass border-2 border-signal flex items-center justify-center text-signal font-display text-xl italic shadow-[0_0_24px_rgba(180,255,57,0.3)]">
                      AO
                    </div>
                  </div>
                  <span className="text-xs text-muted mt-2">Speaking...</span>
                </div>

                {/* Bottom audio waveform rail */}
                <div className="flex items-center justify-between pt-2">
                  <Waveform height={20} bars={24} barWidth={2} />
                  <button
                    onClick={() => setIsMuted((m) => !m)}
                    className={clsx(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded-control text-xs font-medium border transition-colors',
                      isMuted
                        ? 'border-pulse/50 text-pulse bg-pulse/10'
                        : 'border-line text-chalk hover:bg-glass'
                    )}
                  >
                    {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                    <span>{isMuted ? 'Muted' : 'Live'}</span>
                  </button>
                </div>

                {/* Emoji float */}
                {activeReaction && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl animate-bounce pointer-events-none">
                    {activeReaction}
                  </div>
                )}
              </div>

              {/* Side peer strip */}
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Dov Levin', tag: 'SFU Peer', initials: 'DL', active: false },
                  { name: 'Inês Ferreira', tag: 'Screen Share', initials: 'IF', active: true },
                ].map((p, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-panel border border-line/60 bg-ink/70 p-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-glass border border-line flex items-center justify-center font-display text-xs text-chalk italic">
                          {p.initials}
                        </span>
                        <span className="font-medium text-chalk text-xs">{p.name}</span>
                      </div>
                      <span className="text-[10px] text-muted font-mono">{p.tag}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted pt-2">
                      <span className="text-[10px] text-signal">Adaptive 48kHz</span>
                      <SignalMeter quality="good" label="Good signal" />
                    </div>
                  </div>
                ))}

                {/* Quick interactive reaction dock */}
                <div className="rounded-panel border border-line/60 bg-ink/50 p-2 flex items-center justify-around">
                  {['👍', '🔥', '🎉', '💡'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => triggerReaction(emoji)}
                      className="p-1.5 rounded hover:bg-glass transition hover:scale-125 active:scale-95 text-sm"
                      title="Send instant reaction"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-chalk"># general-engineering</span>
                <MonoLabel tone="hint" className="text-[10px]">
                  34 active members
                </MonoLabel>
              </div>
              <span className="text-[10px] text-signal font-mono">Real-time persistent history</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Channel list */}
              <div className="sm:col-span-4 rounded-panel border border-line/60 bg-ink/80 p-2.5 space-y-1 text-xs">
                <span className="text-[10px] text-muted uppercase font-mono px-2">Workspaces</span>
                {[
                  { name: 'general-engineering', active: true, unread: 0 },
                  { name: 'product-roadmap', active: false, unread: 2 },
                  { name: 'security-audit', active: false, unread: 0 },
                  { name: 'direct-messages', active: false, unread: 1 },
                ].map((c) => (
                  <div
                    key={c.name}
                    className={clsx(
                      'px-2.5 py-1.5 rounded-control flex items-center justify-between cursor-pointer transition',
                      c.active ? 'bg-signal/15 text-signal font-medium' : 'text-muted hover:text-chalk hover:bg-glass'
                    )}
                  >
                    <span># {c.name}</span>
                    {c.unread > 0 && (
                      <span className="px-1.5 py-0.2 rounded-pill bg-signal text-ink text-[9px] font-bold">
                        {c.unread}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Chat thread preview */}
              <div className="sm:col-span-8 rounded-panel border border-line/60 bg-ink/90 p-4 space-y-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-chalk">Alex Chen</span>
                    <MonoLabel tone="hint" className="text-[10px]">
                      11:42 AM
                    </MonoLabel>
                  </div>
                  <p className="text-muted leading-relaxed">
                    Deployed the new LiveKit SFU media router. Uplink bandwidth dropped from O(N²) to O(1) across all
                    active conference rooms!
                  </p>
                </div>

                <div className="p-2.5 rounded bg-glass/60 border border-line/50 font-mono text-[11px] text-emerald-400">
                  <code>// WebSocket signaling verified: DTLS-SRTP 256-bit</code>
                </div>

                <div className="space-y-2 text-xs pt-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-semibold text-chalk">Sarah Connor</span>
                    <MonoLabel tone="hint" className="text-[10px]">
                      11:44 AM
                    </MonoLabel>
                  </div>
                  <p className="text-muted leading-relaxed">
                    Tested direct messaging and token auth. Zero latency and zero dropped frames.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whiteboard' && (
          <div className="space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-signal" />
                <span className="text-xs font-semibold text-chalk">Interactive Infinite Canvas</span>
                <MonoLabel tone="hint" className="text-[10px]">
                  Fabric.js + WebRTC DataChannels
                </MonoLabel>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-signal font-mono">
                <Lock className="w-3 h-3" /> AES-256-GCM Zero-Trust
              </span>
            </div>

            <div className="relative rounded-panel border border-line/60 bg-ink/95 aspect-[21/9] flex items-center justify-center p-6 overflow-hidden">
              {/* Grid trace */}
              <div className="absolute inset-0 bg-[radial-gradient(#252a36_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

              {/* Dynamic canvas sketch mockup */}
              <div className="relative z-10 w-full max-w-lg flex flex-col items-center gap-3 text-center">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-control border border-signal/40 bg-signal/10 text-xs font-mono text-signal">
                    Node A: Video Ingest
                  </div>
                  <span className="text-muted text-xs">➔</span>
                  <div className="px-3 py-1.5 rounded-control border border-wave/40 bg-wave/10 text-xs font-mono text-sky-400">
                    LiveKit SFU Relay
                  </div>
                  <span className="text-muted text-xs">➔</span>
                  <div className="px-3 py-1.5 rounded-control border border-line bg-glass text-xs font-mono text-chalk">
                    End Clients
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <CheckCircle2 className="w-3 h-3 text-signal" /> Low-latency vector sync
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <Users className="w-3 h-3 text-wave" /> Live laser pointers
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4 animate-rise">
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-signal" />
                <span className="text-xs font-semibold text-chalk">Automated Meeting Agenda &amp; Calendar</span>
              </div>
              <MonoLabel tone="hint" className="text-[10px]">
                UTC &amp; Local Timezone Sync
              </MonoLabel>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-panel border border-line/60 bg-ink/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-chalk">Quarterly Engineering All-Hands</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-signal/20 text-signal">
                    Upcoming
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Deep dive into LiveKit media cluster scaling, end-to-end security audit, and interactive UI launch.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[11px] text-muted">
                  <span>📅 Tomorrow · 14:00 - 15:00 UTC</span>
                  <span>🔒 Passcode Required</span>
                </div>
              </div>

              <div className="rounded-panel border border-line/60 bg-ink/80 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-chalk">Product Design Sprint</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-wave/20 text-sky-400">
                    Recurring Weekly
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Reviewing minimalist communication hub layouts, tactile buttons, and user experience flows.
                </p>
                <div className="flex items-center gap-3 pt-2 text-[11px] text-muted">
                  <span>📅 Fridays · 16:30 UTC</span>
                  <span>⚡ 1-Click Launch</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
