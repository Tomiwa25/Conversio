'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Button, MonoLabel } from './primitives';

export const CookieConsent: React.FC<{
  onOpenPrivacy?: () => void;
  forceOpen?: boolean;
  onCloseForce?: () => void;
}> = ({ onOpenPrivacy, forceOpen, onCloseForce }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  useEffect(() => {
    if (forceOpen) {
      setIsVisible(true);
      return;
    }
    const consent = localStorage.getItem('conversio_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const persist = (analytics: boolean) => {
    localStorage.setItem(
      'conversio_cookie_consent',
      JSON.stringify({ essential: true, analytics, timestamp: Date.now() }),
    );
    setIsVisible(false);
    onCloseForce?.();
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and privacy preferences"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[26rem] z-[70] animate-rise"
    >
      <div className="rounded-panel border border-line bg-glass shadow-float p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-signal shrink-0" />
            <div className="min-w-0">
              <h4 className="text-xs text-chalk font-medium">Your privacy &amp; security</h4>
              <MonoLabel tone="hint" className="text-[10px] block truncate">
                essential storage only
              </MonoLabel>
            </div>
          </div>
          <button
            type="button"
            onClick={() => persist(false)}
            className="text-muted hover:text-chalk transition-colors p-0.5 -mr-1 shrink-0"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted leading-relaxed">
          Conversio stores your room admission tokens, WebRTC session state and theme preference in
          the browser. Nothing is sold.
          {onOpenPrivacy && (
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="ml-1 text-chalk underline underline-offset-2 decoration-line hover:text-signal transition-colors"
            >
              Privacy policy
            </button>
          )}
        </p>

        {showSettings && (
          <div className="rounded-control border border-line divide-y divide-line/[0.12] text-xs">
            <div className="flex items-center justify-between gap-3 p-3">
              <div>
                <span className="text-chalk block">Strictly necessary</span>
                <span className="text-muted text-[11px]">Admission tokens, encryption keys, session</span>
              </div>
              <MonoLabel tone="data" className="text-[10px] shrink-0">
                always on
              </MonoLabel>
            </div>
            <div className="flex items-center justify-between gap-3 p-3">
              <div>
                <span className="text-chalk block">Performance diagnostics</span>
                <span className="text-muted text-[11px]">Bitrate and jitter metrics</span>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="w-4 h-4 accent-signal"
                aria-label="Performance diagnostics"
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {showSettings ? (
            <Button size="sm" onClick={() => persist(analyticsEnabled)} className="flex-1">
              Save preferences
            </Button>
          ) : (
            <>
              <Button size="sm" onClick={() => persist(true)} className="flex-1">
                Accept all
              </Button>
              <Button size="sm" variant="secondary" onClick={() => persist(false)} className="flex-1">
                Essential only
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSettings((v) => !v)}
            className="px-2"
          >
            {showSettings ? 'Cancel' : 'Customise'}
          </Button>
        </div>
      </div>
    </aside>
  );
};
