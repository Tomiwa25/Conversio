'use client';

import React from 'react';
import { MonoLabel, Waveform } from '../primitives';

/** The four properties the product actually implements. Shared by the wide
 * spec column and the mobile spec list, so they can never drift apart. */
const SPEC: Array<[string, string]> = [
  ['Media', 'Peer-to-peer'],
  ['Files', 'Client-side encrypted'],
  ['Rooms', 'Passcode protected'],
  ['Setup', 'None'],
];

/**
 * The single memorable element of the landing page.
 *
 * Hero type in Instrument Serif, left-aligned, with a full-width live trace
 * beneath it. The trace is the one place on the site where pure motion is used,
 * and it is anchored to something the product really does.
 */
export const LandingHero: React.FC = () => (
  <section className="border-b border-line">
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-8 py-16 lg:py-24 lg:pr-12">
          <h1 className="font-display text-[44px] leading-[0.98] sm:text-3xl sm:leading-[0.98] lg:text-4xl text-chalk tracking-[-0.022em] max-w-[16ch]">
            Call it a meeting.
            <br />
            It works like a room.
          </h1>
          <p className="mt-6 text-base text-muted max-w-[52ch] leading-relaxed">
            Video, whiteboard, files and chat in one place. Start a call in ten seconds, or join with a room code.
            No installs, no dial-ins, no bots pretending to be people.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <a
              href="#start"
              className="inline-flex items-center h-10 px-4 rounded-control bg-signal text-ink text-sm font-semibold hover:brightness-105 transition"
            >
              Start a meeting
            </a>
            <a
              href="#join"
              className="inline-flex items-center h-10 px-4 rounded-control border border-line text-sm text-chalk hover:bg-glass transition"
            >
              Join with a code
            </a>
          </div>

          {/* Below lg the spec column is hidden, so the specs come down here. */}
          <SpecList className="mt-10 lg:hidden" />
        </div>

        <div className="lg:col-span-4 border-t lg:border-t-0 lg:border-l border-line py-8 lg:py-12 lg:pl-10 flex flex-col justify-between gap-6">
          <SpecList className="hidden lg:grid" />

          <div>
            <Waveform height={48} bars={40} barWidth={2} className="w-full" />
            <div className="flex items-center justify-between mt-2">
              <MonoLabel tone="hint">local stream · adaptive</MonoLabel>
              <MonoLabel tone="hint">live demo</MonoLabel>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const SpecList: React.FC<{ className?: string }> = ({ className }) => (
  <dl className={`grid grid-cols-2 gap-x-6 gap-y-4 text-sm ${className}`}>
    {SPEC.map(([term, def]) => (
      <div key={term}>
        <dt className="text-muted text-xs">{term}</dt>
        <dd className="text-chalk mt-0.5">{def}</dd>
      </div>
    ))}
  </dl>
);
