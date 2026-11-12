'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';
import { Button, MonoLabel } from './primitives';

/**
 * A dismissed notice, not a modal. Bottom-right, hairline panel, no backdrop —
 * it never blocks the room code field. The only control that stores anything is
 * the checkbox in Customize; opening the panel does not imply consent.
 */
export const CookieConsent: React.FC<{
  onOpenPrivacy?: () => void;
  forceOpen?: boolean;
  onCloseForce?: () => void;
}> = ({ onOpenPrivacy, forceOpen, onCloseForce }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [diagnosticsEnabled, setDiagnosticsEnabled] = useState(true);

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

  const store = (diagnostics: boolean) => {
    localStorage.setItem(
      'conversio_cookie_consent',
      JSON.stringify({ essential: true, diagnostics, timestamp: Date.now() }),
    );
    setIsVisible(false);
    onCloseForce?.();
  };

  if (!isVisible) return null;

  return (
    <aside
      aria-label="Cookie and privacy preferences"
      className="fixed bottom-4 inset-x-4 sm:left-auto sm:right-4 sm:w-[380px] z-50"
    >
      <div className="rounded-panel border border-line bg-ink shadow-float">
        <div className="flex items-start justify-between gap-4 px-4 h-11 border-b border-line">
          <div className="flex items-center gap-2 min-w-0 h-full">
            <Cookie className="w-3.5 h-3.5 text-signal flex-none" aria-hidden />
            <MonoLabel tone="hint" className="truncate">
              cookie preferences
            </MonoLabel>
          </div>
          <button
            type="button"
            onClick={() => store(false)}
            className="text-muted hover:text-chalk transition-colors p-1 -mr-1 rounded-control"
            aria-label="Dismiss and accept essential storage only"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <p className="text-sm text-muted leading-relaxed">
            Conversio keeps browser storage for room tokens, video session state and your theme. We never sell your
            data.
            {onOpenPrivacy && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="text-chalk underline underline-offset-2 decoration-line hover:decoration-signal transition-colors"
                >
                  Privacy notice
                </button>
                .
              </>
            )}
          </p>

          {showSettings && (
            <div className="rounded-control border border-line divide-y divide-line text-xs">
              <div className="flex items-center justify-between gap-4 p-3">
                <div>
                  <span className="text-chalk font-medium block">Strictly necessary</span>
                  <span className="text-muted text-2xs block mt-0.5">Room tokens, encryption keys, theme</span>
                </div>
                <MonoLabel tone="hint" className="flex-none">
                  always on
                </MonoLabel>
              </div>

              <label className="flex items-center justify-between gap-4 p-3 cursor-pointer">
                <div>
                  <span className="text-chalk font-medium block">Performance diagnostics</span>
                  <span className="text-muted text-2xs block mt-0.5">Bitrate and jitter measurements</span>
                </div>
                <input
                  type="checkbox"
                  checked={diagnosticsEnabled}
                  onChange={(e) => setDiagnosticsEnabled(e.target.checked)}
                  className="w-4 h-4 flex-none accent-[var(--c-signal)]"
                />
              </label>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {showSettings ? (
              <Button size="sm" onClick={() => store(diagnosticsEnabled)}>
                Save
              </Button>
            ) : (
              <>
                <Button size="sm" onClick={() => store(true)}>
                  Accept all
                </Button>
                <Button size="sm" variant="secondary" onClick={() => store(false)}>
                  Essential only
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => setShowSettings((v) => !v)}
              className="ml-auto text-xs text-muted hover:text-chalk px-1 py-1 transition-colors"
            >
              {showSettings ? 'Cancel' : 'Customize'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
