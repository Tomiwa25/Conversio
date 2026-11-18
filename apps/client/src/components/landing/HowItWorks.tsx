'use client';

import React from 'react';
import { Sparkles, Link as LinkIcon, Users, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: Sparkles,
    title: 'Create in One Click',
    description:
      'Enter a meeting title, add an optional passcode for extra privacy, and click Start. Your room is generated instantly.',
    tag: 'No Account Required',
  },
  {
    step: '02',
    icon: LinkIcon,
    title: 'Share One Simple Link',
    description:
      'Copy your room link or share a quick room code. Anyone can join immediately in their browser on laptop, tablet, or phone.',
    tag: 'Works on Any Device',
  },
  {
    step: '03',
    icon: Users,
    title: 'Collaborate in Real Time',
    description:
      'Meet with HD video and clear audio, sketch ideas together on the live whiteboard, chat, and send files with total privacy.',
    tag: 'All-in-One Workspace',
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
                className="bg-glass border border-line rounded-2xl p-8 relative flex flex-col justify-between hover:border-signal/40 transition-all duration-200 group hover:shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-signal/10 border border-signal/20 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-2xl font-bold text-muted/30 group-hover:text-signal/40 transition-colors">
                      {s.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-chalk mb-2.5 tracking-tight">{s.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{s.description}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/60 flex items-center justify-between">
                  <span className="text-xs font-medium text-signal">{s.tag}</span>
                  {idx < 2 && (
                    <ArrowRight className="w-4 h-4 text-muted/40 hidden md:block group-hover:text-signal group-hover:translate-x-1 transition-all" />
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
