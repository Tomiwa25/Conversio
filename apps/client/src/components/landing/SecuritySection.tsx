'use client';

import React from 'react';
import { ShieldCheck, EyeOff, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

const SECURITY_CARDS = [
  {
    icon: ShieldCheck,
    title: 'End-to-End Encrypted',
    description:
      'Video and audio streams are encrypted end-to-end between participants. No one outside your room—not even our servers—can listen in.',
    badge: 'DTLS-SRTP & AES-256',
  },
  {
    icon: EyeOff,
    title: 'Zero Tracking & No Recordings',
    description:
      'We do not record calls, transcribe your speech, or monetize your activity. What you say in your meeting stays in your meeting.',
    badge: 'Strict No-Logs Policy',
  },
  {
    icon: Lock,
    title: 'Passcode & Room Lock',
    description:
      'Guard confidential discussions. Set an entry passcode or lock the room once your team is in to prevent uninvited attendees from dropping in.',
    badge: 'Host Gatekeeping',
  },
  {
    icon: RefreshCw,
    title: 'Ephemeral Whiteboard & Files',
    description:
      'Drawings and files stream directly peer-to-peer. When you hang up and close your room, all session data automatically evaporates from memory.',
    badge: 'Leaves Zero Footprint',
  },
];

const TRUST_POINTS = [
  'No third-party marketing cookies or telemetry trackers',
  'No client-side software installations that expose system vulnerabilities',
  'Compliance with modern data privacy standards and strict sandbox isolation',
  'Direct peer-to-peer data channels for private document transfers',
];

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="border-b border-line py-20 lg:py-28 bg-ink">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-signal/30 bg-signal/5 text-signal text-xs font-medium tracking-wide mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-signal" />
              <span>Security & Privacy</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-chalk leading-tight tracking-[-0.02em]">
              Your meetings are private.
              <br />
              <span className="italic text-signal">By design, not by promise.</span>
            </h2>
            <p className="text-base text-muted mt-4 max-w-[50ch] leading-relaxed">
              Traditional meeting apps store your recordings on their servers and track your team. Conversio is built with a zero-trust architecture where you hold total control.
            </p>
          </div>

          <div className="lg:col-span-5 bg-glass border border-line rounded-2xl p-6 sm:p-8 space-y-3.5">
            <h3 className="text-sm font-semibold text-chalk mb-4 uppercase tracking-wider font-mono">
              Privacy Guarantees
            </h3>
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                <span className="text-xs text-muted leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECURITY_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-glass border border-line rounded-2xl p-6 flex flex-col justify-between hover:border-signal/40 transition-colors group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-signal/10 border border-signal/20 text-signal flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-chalk mb-2">{card.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{card.description}</p>
                </div>

                <div className="pt-4 mt-4 border-t border-line/60">
                  <span className="text-[11px] font-mono text-signal bg-signal/10 px-2 py-0.5 rounded-md">
                    {card.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
