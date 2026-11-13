'use client';

import React from 'react';
import {
  Waveform,
  SignalMeter,
  LiveDot,
  Panel,
  Button,
  MonoLabel,
  ChannelGrid,
  ToastProvider,
  useToast,
} from '../../components/primitives';

// The lab is a static specimen, so it needs its own ToastProvider to prerender.
export default function PrimitivesLab() {
  return (
    <ToastProvider>
      <Lab />
    </ToastProvider>
  );
}

function Lab() {
  const { push } = useToast();
  return (
    <main className="min-h-screen bg-ink text-chalk p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl leading-none">Primitives</h1>
          <p className="text-sm text-muted mt-2">Stage 1 specimen — every element below uses the real components</p>
        </div>
        <MonoLabel>v0.1 · stage 01</MonoLabel>
      </header>

      <Panel padding="lg">
        <Waveform height={44} bars={32} barWidth={2} />
        <div className="flex flex-col gap-2 mt-3 sm:flex-row sm:items-center sm:justify-between">
          <MonoLabel tone="hint">local stream · 240p → 1080p</MonoLabel>
          <span className="flex flex-wrap items-center gap-1.5">
            <SignalMeter quality="good" label="Good connection" />
            <MonoLabel>28.4 kB/s</MonoLabel>
          </span>
        </div>
      </Panel>

      <ChannelGrid cols={3} ruled>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between"><LiveDot label="Live" /><MonoLabel tone="hint">04 peers</MonoLabel></div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">Start a meeting</Button>
            <Button variant="secondary">Join</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="destructive">Leave</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <SignalMeter quality="good" label="Good" />
            <SignalMeter quality="fair" label="Fair" />
            <SignalMeter quality="poor" label="Poor" />
            <SignalMeter quality="unknown" label="Unknown" />
          </div>
        </div>
        <div className="p-6 space-y-3">
          <MonoLabel tone="hint" className="block mb-1">Room code</MonoLabel>
          <MonoLabel className="text-base">aKx9-Kq2</MonoLabel>
          <div className="flex gap-1.5 pt-2">
            <LiveDot state="live" tone="pulse" size={8} label="Recording" />
            <LiveDot state="static" tone="wave" size={8} label="Encrypted" />
          </div>
        </div>
        <div className="p-6 space-y-2">
          <p className="text-sm text-muted mb-3">Toast (click below)</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => push({ tone: 'success', title: 'Meeting created', description: 'Code aKx9-Kq2 copied to clipboard.' })}>Success</Button>
            <Button size="sm" variant="secondary" onClick={() => push({ tone: 'error', title: "That code doesn't exist", description: 'Check the code and try again.' })}>Error</Button>
          </div>
        </div>
      </ChannelGrid>

      <Panel padding="lg">
        <h2 className="font-display text-xl mb-3">Type</h2>
        <p className="text-sm text-muted mb-3">Instrument Serif for the headline above; Geist for UI. Geist Mono only for data.</p>
        <Waveform height={40} bars={48} barWidth={1} />
      </Panel>
    </main>
  );
}
