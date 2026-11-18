'use client';

import React, { useState } from 'react';
import { SiteHeader } from './SiteHeader';
import { LandingHero } from './LandingHero';
import { HowItWorks } from './HowItWorks';
import { SecuritySection } from './SecuritySection';
import { PricingSection } from './PricingSection';
import { SiteFooter } from './SiteFooter';
import { PrivacyModal } from '../PrivacyModal';
import { HelpModal } from '../HelpModal';
import { CookieConsent } from '../CookieConsent';
import { Shield, Zap, Palette, Sparkles } from 'lucide-react';

export const LandingSections: React.FC = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCookieForceOpen, setIsCookieForceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col selection:bg-signal selection:text-ink">
      <SiteHeader onOpenHelp={() => setIsHelpOpen(true)} onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <main className="flex-1">
        {/* 1. Hero Section: Value Prop, Video UI Laptop Mockup, 4-Capsule Strip & Meeting Console */}
        <LandingHero />

        {/* 2. Core Features: 3 Clear, User-Friendly Pillars */}
        <section id="features" className="border-b border-line py-20 lg:py-28">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="max-w-2xl mb-14">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-signal/30 bg-signal/5 text-signal text-xs font-medium tracking-wide mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                <span>Simple & Powerful Features</span>
              </div>
              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-chalk leading-tight tracking-[-0.02em]">
                Everything you need to meet and work together.
              </h2>
              <p className="text-base text-muted mt-4 leading-relaxed">
                Three simple reasons Conversio is faster, easier, and more private than traditional meeting apps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Pillar 1 */}
              <div className="bg-glass border border-line rounded-2xl p-8 space-y-4 hover:border-signal/40 transition-all duration-200 group hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-signal/10 border border-signal/20 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-chalk tracking-tight">Works Right in Your Browser</h3>
                <p className="text-sm text-muted leading-relaxed">
                  No bulky 200MB desktop apps to install and no software updates to wait for. Just click your room link and jump straight into fast, HD video calls with your team.
                </p>
                <div className="pt-3 border-t border-line/60 flex items-center gap-2 text-xs font-medium text-signal">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>Zero Software Downloads</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-glass border border-line rounded-2xl p-8 space-y-4 hover:border-signal/40 transition-all duration-200 group hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-signal/10 border border-signal/20 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-chalk tracking-tight">Private & Secure Calls</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Your meetings, chats, and shared files are protected with end-to-end encryption. What you say and share in your room stays strictly between you and your attendees.
                </p>
                <div className="pt-3 border-t border-line/60 flex items-center gap-2 text-xs font-medium text-signal">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>End-to-End Encrypted</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-glass border border-line rounded-2xl p-8 space-y-4 hover:border-signal/40 transition-all duration-200 group hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-signal/10 border border-signal/20 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-chalk tracking-tight">Interactive Shared Whiteboard</h3>
                <p className="text-sm text-muted leading-relaxed">
                  Draw, diagram, and brainstorm together on a live whiteboard while on your call. Everyone can sketch and share ideas at the same time without losing their work.
                </p>
                <div className="pt-3 border-t border-line/60 flex items-center gap-2 text-xs font-medium text-signal">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>Live Collaborative Drawing</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works: Step-by-Step Flow */}
        <HowItWorks />

        {/* 4. Security & Privacy Deep Dive */}
        <SecuritySection />

        {/* 5. Transparent 4-Tier Pricing (Free, Starter, Pro, Enterprise) */}
        <PricingSection />

        {/* 6. Decorative Bottom Wave Framing Element */}
        <div className="relative w-full overflow-hidden leading-none select-none">
          {/* Subtle Brass/Gold Accent Ribbon */}
          <div className="h-1 w-full bg-gradient-to-r from-[#C5A86C]/40 via-[#D4AF37] to-[#C5A86C]/40" />
          {/* Deep Forest Gradient Wave Band */}
          <div className="h-10 sm:h-14 bg-gradient-to-b from-[#0A3E27]/40 via-[#0D5C3A]/25 to-glass/50" />
        </div>
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
