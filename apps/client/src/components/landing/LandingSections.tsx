'use client';

import React, { useState } from 'react';
import { SiteHeader } from './SiteHeader';
import { LandingHero } from './LandingHero';
import { Architecture } from './Architecture';
import { SiteFooter } from './SiteFooter';
import { PrivacyModal } from '../PrivacyModal';
import { HelpModal } from '../HelpModal';
import { CookieConsent } from '../CookieConsent';
import { ChannelGrid, MonoLabel } from '../primitives';
import { Check } from 'lucide-react';

/**
 * Minimalist, high-performance Communication Hub landing page.
 * Uncluttered, intuitive, and interactive.
 */
export const LandingSections: React.FC = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCookieForceOpen, setIsCookieForceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col selection:bg-signal selection:text-ink">
      <SiteHeader onOpenHelp={() => setIsHelpOpen(true)} onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <main className="flex-1">
        {/* Sleek Hero with integrated Quick Launchpad & Interactive Hub Showcase */}
        <LandingHero />

        {/* Engineering & Cryptographic Architecture Bento Grid */}
        <Architecture />

        {/* Minimalist Honest Pricing */}
        <section id="pricing" className="border-b border-line/60 bg-glass/20 py-16">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="max-w-xl mb-10">
              <h2 className="font-display text-2xl text-chalk leading-tight">
                Simple, transparent pricing.
              </h2>
              <p className="text-sm text-muted mt-2">
                Start instant meetings and collaborate with zero friction.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div className="rounded-panel border border-line/80 bg-ink p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-chalk">Community &amp; Individuals</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-signal/15 text-signal font-semibold">
                      Free Forever
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl text-chalk">£0</span>
                    <span className="text-xs text-muted">/ month</span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Start or join any meeting instantly. No account required.
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-muted">
                    <li className="flex items-center gap-2 text-chalk">
                      <Check className="w-3.5 h-3.5 text-signal" /> Unlimited peer-to-peer WebRTC video
                    </li>
                    <li className="flex items-center gap-2 text-chalk">
                      <Check className="w-3.5 h-3.5 text-signal" /> Client-side AES-256 file encryption
                    </li>
                    <li className="flex items-center gap-2 text-chalk">
                      <Check className="w-3.5 h-3.5 text-signal" /> Interactive collaborative whiteboard
                    </li>
                    <li className="flex items-center gap-2 text-chalk">
                      <Check className="w-3.5 h-3.5 text-signal" /> Instant passcode protection
                    </li>
                  </ul>
                </div>

                <a
                  href="#start"
                  className="mt-6 w-full h-9 rounded-control bg-glass hover:bg-line/20 border border-line text-chalk text-xs font-medium flex items-center justify-center transition"
                >
                  Start Meeting Now
                </a>
              </div>

              <div className="rounded-panel border border-line/80 bg-ink p-6 flex flex-col justify-between opacity-85">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-chalk">Enterprise &amp; Teams</h3>
                    <MonoLabel tone="hint" className="text-[10px]">
                      Coming Soon
                    </MonoLabel>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="font-display text-4xl text-muted">£—</span>
                    <span className="text-xs text-muted">/ seat</span>
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Dedicated LiveKit SFU clusters, custom domain SSO, and persistent workspace channels.
                  </p>
                  <ul className="mt-5 space-y-2 text-xs text-muted">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-muted" /> Dedicated high-capacity SFU media relays
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-muted" /> Unlimited channel message archive
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-muted" /> SAML / Okta SSO &amp; custom audit logs
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-muted" /> Enterprise SLA &amp; dedicated support
                    </li>
                  </ul>
                </div>

                <button
                  disabled
                  className="mt-6 w-full h-9 rounded-control bg-glass/40 border border-line/50 text-muted text-xs font-medium flex items-center justify-center cursor-not-allowed"
                >
                  In Development
                </button>
              </div>
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
