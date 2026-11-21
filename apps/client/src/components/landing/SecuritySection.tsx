'use client';

import React from 'react';
import { ShieldCheck, EyeOff, Lock, RefreshCw, CheckCircle2 } from 'lucide-react';

const SECURITY_CARDS = [
  {
    icon: ShieldCheck,
    title: 'End-to-End Encrypted',
    description:
      'Video and audio are scrambled between participants. No one outside your room—not even our servers—can listen in.',
    badge: 'Bank-Grade Protection',
  },
  {
    icon: EyeOff,
    title: 'Zero Tracking & No Recordings',
    description:
      'We never record calls, listen to speech, or sell your activity. What you say in your meeting stays strictly between you.',
    badge: 'Never Recorded',
  },
  {
    icon: Lock,
    title: 'Passcode & Room Lock',
    description:
      'Keep your calls private. Set an optional entry passcode or lock the room once your team arrives so uninvited guests cannot join.',
    badge: 'You Control Who Enters',
  },
  {
    icon: RefreshCw,
    title: 'Self-Cleaning Sessions',
    description:
      'Drawings, chats, and shared files travel directly between attendees. When you hang up and leave, everything safely disappears.',
    badge: 'Leaves Zero Trace',
  },
];

const TRUST_POINTS = [
  'No marketing cookies, advertising scripts, or hidden trackers',
  'No software downloads or installations that risk your computer',
  'Complies with strict global data privacy and consumer standards',
  'Files and drawings transfer directly between attendees with no cloud copies',
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
              Traditional meeting apps store your recordings on their servers and track your calls. Conversio is built so only you and your guests can see and hear what happens.
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
