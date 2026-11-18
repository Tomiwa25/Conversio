'use client';

import React from 'react';
import { ShieldCheck, Cpu, Zap, Lock, RefreshCw, KeyRound } from 'lucide-react';
import { MonoLabel } from '../primitives';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Zero-Trust Client Encryption',
    tag: 'WebCrypto · AES-256-GCM',
    description:
      'Files and shared assets are encrypted directly in participant browsers using PBKDF2 (100k iterations) and AES-256-GCM. Decryption keys never touch our servers.',
    detail: 'Unique 12-byte IV per chunk · 16-byte GCM tag verification',
  },
  {
    icon: Cpu,
    title: 'Hybrid Media Architecture',
    tag: 'WebRTC Mesh + LiveKit SFU',
    description:
      'Direct peer-to-peer WebRTC mesh for 1-to-1 and small rooms with automatic failover to containerized LiveKit SFU for large conferences, eliminating uplink saturation.',
    detail: 'O(1) single uplink scaling · Dynamic video grants',
  },
  {
    icon: RefreshCw,
    title: 'Atomic OCC & Idempotency',
    tag: 'Redis · Optimistic Locking',
    description:
      'Distributed Redis mutex locks and SHA-256 fingerprinting prevent split-brain room creation. Optimistic Concurrency Control (OCC) guards concurrent moderation.',
    detail: 'Version-stamped room states · Anti-replay caching',
  },
];

export const Architecture: React.FC = () => (
  <section id="architecture" className="border-b border-line/60 bg-ink/60 py-18">
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
      <div className="max-w-2xl mb-12">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-glass/80 border border-line/80 text-[11px] text-muted mb-3">
          <Zap className="w-3 h-3 text-signal" />
          <span className="font-mono text-chalk">Engineered for Reliability</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-chalk tracking-tight">
          Built as high-concurrency infrastructure, not a weekend mockup.
        </h2>
        <p className="text-sm text-muted mt-3 leading-relaxed">
          Every layer is backed by verifiable cryptographic guarantees, low-level WebRTC protocol optimization, and
          distributed concurrency control.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          return (
            <div
              key={i}
              className="rounded-panel border border-line/70 bg-glass/60 backdrop-blur-md p-6 flex flex-col justify-between hover:border-signal/40 transition-all duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-control bg-ink/80 border border-line flex items-center justify-center text-signal group-hover:shadow-[0_0_12px_rgba(180,255,57,0.3)] transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <MonoLabel tone="hint" className="text-[10px]">
                    {p.tag}
                  </MonoLabel>
                </div>
                <h3 className="text-base font-semibold text-chalk mt-4 tracking-tight">{p.title}</h3>
                <p className="text-xs text-muted leading-relaxed mt-2.5">{p.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-line/40 flex items-center gap-1.5 text-[11px] text-muted font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-signal/70" />
                <span className="truncate">{p.detail}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);
