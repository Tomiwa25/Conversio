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

        {/* 2. Minimal Solution Architecture: 3 High-Signal Pillars */}
        <section className="border-b border-line py-16 lg:py-20">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
            <div className="max-w-2xl mb-12">
              <span className="text-xs uppercase tracking-wider font-mono text-signal">Core Architecture</span>
              <h2 className="font-display text-2xl sm:text-3xl text-chalk mt-2 leading-tight">
                Engineered for speed. Fortified for privacy.
              </h2>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                Three foundational pillars solve the common pain points of modern meeting software.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pillar 1 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Browser-Native WebRTC</h3>
                <p className="text-xs text-muted leading-relaxed">
                  No sluggish 200MB desktop client installs or forced update restarts. Direct peer-to-peer UDP media routing delivers sub-100ms latency, backed by LiveKit SFU clustering for large team meetings.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>SRTP Audio/Video Separation</span>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Client-Side Zero-Trust</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Shared files are encrypted in your browser using AES-256-GCM with keys derived via PBKDF2 (100,000 SHA-256 iterations). The signaling server never holds the keys or inspects your transfers.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>SCTP Encrypted DataChannels</span>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-glass border border-line rounded-panel p-6 space-y-4 hover:border-signal/30 transition-colors group">
                <div className="w-10 h-10 rounded-control bg-signal/10 border border-signal/25 text-signal flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Palette className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-chalk">Interactive Vector Canvas</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Brainstorm freely on a shared, memory-mindful Fabric.js vector whiteboard. Break out into sub-groups on demand with Optimistic Concurrency Control (OCC) to guard against unauthorized access.
                </p>
                <div className="pt-2 text-[11px] font-mono text-muted flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal" />
                  <span>OCC Lock Versioning</span>
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
