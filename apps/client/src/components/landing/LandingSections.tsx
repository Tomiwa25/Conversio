'use client';

import React, { useState } from 'react';
import { SiteHeader } from './SiteHeader';
import { LandingHero } from './LandingHero';
import { SiteFooter } from './SiteFooter';
import { PrivacyModal } from '../PrivacyModal';
import { HelpModal } from '../HelpModal';
import { CookieConsent } from '../CookieConsent';
import { Shield, Zap, Palette } from 'lucide-react';

export const LandingSections: React.FC = () => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isCookieForceOpen, setIsCookieForceOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-chalk flex flex-col selection:bg-signal selection:text-ink">
      <SiteHeader onOpenHelp={() => setIsHelpOpen(true)} onOpenPrivacy={() => setIsPrivacyOpen(true)} />

      <main className="flex-1">
        {/* 1. Hero Section: Focused squarely on what the app solves */}
        <LandingHero />

        {/* 2. Core Features: 3 Clear, User-Friendly Pillars */}
        <section id="features" className="border-b border-line py-16 lg:py-20">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="max-w-2xl mb-12">
              <span className="text-xs uppercase tracking-wider font-mono text-signal">Simple & Powerful Features</span>
              <h2 className="font-display text-2xl sm:text-3xl text-chalk mt-2 leading-tight">
                Everything you need to meet and work together.
              </h2>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                Three simple reasons Conversio is faster, easier, and more private than traditional meeting apps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Works Right in Your Browser</h3>
                <p className="text-xs text-muted leading-relaxed">
                  No bulky 200MB desktop apps to install and no software updates to wait for. Just click your room link and jump straight into fast, HD video calls with your team.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>Zero Software Downloads</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Private & Secure Calls</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Your meetings, chats, and shared files are protected with end-to-end encryption. What you say and share in your room stays strictly between you and your attendees.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>End-to-End Encrypted</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Interactive Shared Whiteboard</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Draw, diagram, and brainstorm together on a live whiteboard while on your call. Everyone can sketch and share ideas at the same time without losing their work.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>Live Collaborative Drawing</span>
                </div>
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
