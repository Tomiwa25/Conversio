'use client';

import React, { useState } from 'react';
import { SiteHeader } from './SiteHeader';
import { LandingHero } from './LandingHero';
import { LiveDemo } from './LiveDemo';
import { StartOrJoin } from './StartOrJoin';
import { Architecture } from './Architecture';
import { SiteFooter } from './SiteFooter';
import { PrivacyModal } from '../PrivacyModal';
import { HelpModal } from '../HelpModal';
import { CookieConsent } from '../CookieConsent';
import { ChannelGrid, MonoLabel } from '../primitives';

/**
 * The interactive landing shell. Everything below the header is static
 * content laid out on the instrument grid; visibility of the demo's scripted
 * loop lives inside LiveDemo.
 */
export const LandingSections: React.FC = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCookieForceOpen, setIsCookieForceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col">
      <SiteHeader onOpenHelp={() => setIsHelpOpen(true)} onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <main className="flex-1">
        <LandingHero />

        {/* The live demo, full-bleed inside the grid */}
        <section id="product" className="border-b border-line">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14">
            <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
              <h2 className="font-display text-xl text-chalk leading-tight max-w-[22ch]">
                See what a room actually looks like.
              </h2>
              <p className="text-sm text-muted max-w-[40ch] leading-relaxed">
                This is the live room component rendering as you scroll, driven by a scripted loop.
              </p>
            </div>
            <LiveDemo />
          </div>
        </section>

        <StartOrJoin />
        <Architecture />

        {/* Pricing, honest */}
        <section id="pricing" className="border-b border-line">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4">
              <h2 className="font-display text-xl text-chalk leading-tight">Pricing is simple.</h2>
            </div>
            <div className="lg:col-span-8">
              <ChannelGrid cols={2} className="rounded-panel overflow-hidden border border-line">
                <div className="bg-ink p-6">
                  <h3 className="text-sm font-medium text-chalk">Free</h3>
                  <p className="font-display text-3xl text-chalk mt-2 leading-none">£0</p>
                  <p className="text-sm text-muted mt-2">Start or join any room, no account needed.</p>
                </div>
                <div className="bg-ink p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-medium text-chalk">Teams</h3>
                    <MonoLabel tone="hint">unreleased</MonoLabel>
                  </div>
                  <p className="font-display text-3xl text-muted mt-2 leading-none">£—</p>
                  <p className="text-sm text-muted mt-2">Not launched yet. This page will say so when it is.</p>
                </div>
              </ChannelGrid>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenCookies={() => setIsCookieForceOpen(true)}
      />

      <PrivacyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <CookieConsent
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        forceOpen={isCookieForceOpen}
        onCloseForce={() => setIsCookieForceOpen(false)}
      />
    </div>
  );
};
