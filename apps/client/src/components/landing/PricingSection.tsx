'use client';

import React from 'react';
import { Check, Sparkles, ArrowRight } from 'lucide-react';

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for quick catch-ups, private chats, and casual brainstorming.',
    features: [
      'Up to 4 participants per room',
      '45-minute meeting duration',
      '100% in-browser, zero downloads',
      'Interactive collaborative whiteboard',
      'Direct peer-to-peer file sharing',
      'End-to-end encrypted video & audio',
    ],
    cta: 'Start Free Meeting',
    href: '#start',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: '$12',
    period: 'per month',
    description: 'Ideal for freelancers, designers, and independent consultants.',
    features: [
      'Unlimited 1-on-1 call duration',
      'Up to 15 participants in group calls',
      'Custom room names & persistent links',
      'Room passcode & gatekeeping controls',
      'High-definition 1080p video',
      'Whiteboard export as PNG',
    ],
    cta: 'Choose Starter',
    href: '#start',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$24',
    period: 'per month',
    description: 'Designed for fast-moving teams, startups, and collaborative agencies.',
    features: [
      'Unlimited duration for all meetings',
      'Up to 50 participants per room',
      'Global media relay for flawless stability',
      'Vector whiteboard export (SVG, PNG, JSON)',
      'Advanced host controls (Mute all, Room Lock)',
      'Priority video bandwidth routing',
    ],
    cta: 'Start 14-Day Free Trial',
    href: '#start',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'tailored plans',
    description: 'For companies requiring dedicated infrastructure and custom branding.',
    features: [
      'Up to 250+ participants per session',
      'Custom company domain (meet.yourcompany.com)',
      'White-label branding and company theme',
      'Dedicated private STUN/TURN relays',
      'SAML / Single Sign-On (SSO) & Audit Logs',
      '99.99% Uptime SLA & 24/7 dedicated support',
    ],
    cta: 'Contact Sales',
    href: 'mailto:sales@conversio.app?subject=Conversio%20Enterprise%20Inquiry',
    highlighted: false,
  },
];

export const PricingSection: React.FC = () => {
  return (
    <section id="pricing" className="border-b border-line py-20 lg:py-28 bg-gradient-to-b from-ink via-glass/30 to-ink">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-signal/30 bg-signal/5 text-signal text-xs font-medium tracking-wide mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-signal" />
            <span>Transparent Pricing</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl text-chalk leading-tight tracking-[-0.02em]">
            Simple plans for teams of any size.
          </h2>
          <p className="text-base text-muted mt-4 leading-relaxed">
            Start for free without an account. Upgrade when you need longer meetings, larger groups, or custom domains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 relative ${
                plan.highlighted
                  ? 'bg-glass border-2 border-signal shadow-[0_0_32px_rgba(0,176,122,0.15)] md:-translate-y-2'
                  : 'bg-glass border border-line hover:border-line/80'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-signal text-ink text-[11px] font-semibold tracking-wide flex items-center gap-1 shadow-md">
                  <Sparkles className="w-3 h-3" />
                  <span>{plan.badge}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-chalk">{plan.name}</h3>
                </div>

                <div className="mt-4 mb-2 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl text-chalk font-normal tracking-tight">{plan.price}</span>
                  <span className="text-xs text-muted">/ {plan.period}</span>
                </div>

                <p className="text-xs text-muted leading-relaxed min-h-[38px] mb-6">{plan.description}</p>

                <div className="pt-6 border-t border-line/60 space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-signal/15 text-signal flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="text-xs text-muted leading-relaxed">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <a
                  href={plan.href}
                  className={`w-full h-11 rounded-full text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    plan.highlighted
                      ? 'bg-signal text-ink hover:shadow-[0_0_20px_rgba(0,176,122,0.4)] hover:brightness-105 active:scale-[0.98]'
                      : 'border border-line bg-ink/60 text-chalk hover:bg-glass hover:border-signal/40'
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
