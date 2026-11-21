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
      'Up to 4 people per meeting',
      '45-minute meeting length',
      'Runs in browser, zero downloads',
      'Shared live drawing board',
      'Safe direct file sharing',
      'Scrambled private video & audio',
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
      'Unlimited 1-on-1 meeting time',
      'Up to 15 people in group calls',
      'Custom room names & permanent links',
      'Room password & host lock controls',
      'High-definition 1080p video',
      'Save whiteboard drawings as images',
    ],
    cta: 'Choose Starter',
    href: '#start',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$24',
    period: 'per month',
    description: 'Designed for fast-moving teams, startups, and collaborative groups.',
    features: [
      'Unlimited meeting time for everyone',
      'Up to 50 people per room',
      'Global servers for super-smooth video',
      'Save and download drawing boards',
      'Host tools (Mute all, Lock room)',
      'Priority HD video streaming',
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
    description: 'For organizations that need custom company branding and dedicated support.',
    features: [
      'Up to 250+ people per meeting',
      'Custom web address (meet.yourcompany.com)',
      'Custom company logo and branding',
      'Dedicated private connection servers',
      'Work email single sign-on (SSO)',
      'Guaranteed 99.99% uptime & 24/7 help',
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
