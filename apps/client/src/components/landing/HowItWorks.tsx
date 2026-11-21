'use client';

import React from 'react';
import { Sparkles, Link as LinkIcon, Users, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Sparkles,
    title: 'Create in One Click',
    description:
      'Type in a meeting name, set a password if you want it private, and tap Start. Your meeting room is ready right away.',
    tag: 'No Account Needed',
    image: '/conversio-step-1-create.svg',
    imageAlt: 'Step 1: Type a meeting name, pick an optional password, and start your call',
  },
  {
    step: '02',
    icon: LinkIcon,
    title: 'Share Your Link',
    description:
      'Send your link to teammates, clients, or friends. Anyone can join in seconds right on their phone, tablet, or laptop.',
    tag: 'Works on Any Device',
    image: '/conversio-step-2-share.svg',
    imageAlt: 'Step 2: Share your meeting link with anyone on phone, tablet, or computer',
  },
  {
    step: '03',
    icon: Users,
    title: 'Talk, Draw, and Share',
    description:
      'Talk face-to-face with clear audio, sketch ideas together on a live drawing board, send chat messages, and drop files safely.',
    tag: 'All-in-One Space',
    image: '/conversio-step-3-collaborate.svg',
    imageAlt: 'Step 3: See everyone on video, draw together on a shared board, and share files safely',
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="border-b border-line py-20 lg:py-28 relative bg-ink/40">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-signal/30 bg-signal/5 text-signal text-xs font-medium tracking-wide mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>How It Works</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-chalk leading-tight tracking-[-0.02em]">
            Ready in under 10 seconds.
            <br />
            <span className="italic text-signal">No setup. No learning curve.</span>
          </h2>
          <p className="text-base text-muted mt-4 leading-relaxed">
            Forget about sending download links or walking guests through app updates. Conversio makes online meetings as simple as opening a website.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-glass border border-line rounded-2xl p-6 lg:p-7 relative flex flex-col justify-between hover:border-signal/40 transition-all duration-200 group hover:shadow-xl"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-signal/10 border border-signal/20 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-signal/90 font-mono">
                        Step {s.step}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium px-2 py-0.5 rounded border border-line/60 bg-ink/40 text-muted">
                      {s.tag}
                    </span>
                  </div>

                  {/* Sequential App Illustration */}
                  <div className="mb-5 rounded-xl overflow-hidden border border-line/70 bg-ink/70 aspect-[16/10] relative group-hover:border-signal/30 transition-colors shadow-inner">
                    <img
                      src={s.image}
                      alt={s.imageAlt}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="text-lg font-semibold text-chalk mb-2 tracking-tight">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{s.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                  <span className="font-mono text-[11px] text-muted/70">FAST &amp; PRIVATE</span>
                  {idx < 2 ? (
                    <div className="flex items-center gap-1 text-signal font-medium text-xs group-hover:translate-x-0.5 transition-transform">
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <span className="text-signal font-semibold text-xs">Ready</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
