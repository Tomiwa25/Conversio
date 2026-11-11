'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, X, CheckCircle2 } from 'lucide-react';

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
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [forceOpen]);

  const handleAcceptAll = () => {
    localStorage.setItem(
      'conversio_cookie_consent',
      JSON.stringify({ essential: true, analytics: true, timestamp: Date.now() })
    );
    setIsVisible(false);
    if (onCloseForce) onCloseForce();
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(
      'conversio_cookie_consent',
      JSON.stringify({ essential: true, analytics: false, timestamp: Date.now() })
    );
    setIsVisible(false);
    if (onCloseForce) onCloseForce();
  };

  const handleSaveCustom = () => {
    localStorage.setItem(
      'conversio_cookie_consent',
      JSON.stringify({ essential: true, analytics: analyticsEnabled, timestamp: Date.now() })
    );
    setIsVisible(false);
    if (onCloseForce) onCloseForce();
  };

  if (!isVisible) return null;

  return (
    <aside aria-label="Cookie and Privacy Preferences" className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Top Info */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                We Respect Your Privacy & Security
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Essential storage for WebRTC tokens & room encryption
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleEssentialOnly();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
            aria-label="Dismiss cookie notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text */}
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Conversio uses essential browser storage to preserve your cryptographic room admission tokens, WebRTC session candidate state, and theme preferences. We never sell your personal data.
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              className="ml-1 text-blue-600 dark:text-blue-400 hover:underline font-medium inline"
            >
              Read our Privacy Policy.
            </button>
          )}
        </p>

        {/* Optional Granular Settings Drawer */}
        {showSettings && (
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Strictly Necessary</span>
                <span className="text-[10px] text-slate-400">JWT admission, encryption keys & session cookies</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                Always Active
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">Performance Diagnostics</span>
                <span className="text-[10px] text-slate-400">Bitrate & jitter latency metrics</span>
              </div>
              <input
                type="checkbox"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
          {showSettings ? (
            <button
              onClick={handleSaveCustom}
              className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              Save Preferences
            </button>
          ) : (
            <>
              <button
                onClick={handleAcceptAll}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition shadow-md shadow-blue-600/20"
              >
                Accept All
              </button>
              <button
                onClick={handleEssentialOnly}
                className="w-full sm:flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                Essential Only
              </button>
            </>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 transition"
          >
            {showSettings ? 'Cancel' : 'Customize'}
          </button>
        </div>
      </div>
    </aside>
  );
};
