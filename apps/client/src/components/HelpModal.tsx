'use client';

import React, { useState } from 'react';
import {
  X,
  HelpCircle,
  Video,
  Share2,
  Shield,
  Monitor,
  Mic,
  ChevronRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How do I start and invite colleagues to a meeting?',
      a: 'On the Conversio home page, enter your Meeting Topic and Your Name, then click "Start Meeting Now". Once inside the room, click the "Copy Meeting Link" button in the bottom control bar to share the link. Anyone with the link (and optional 6-digit passcode) can join instantly without requiring software installation.',
    },
    {
      q: 'How does high-definition screen sharing work?',
      a: 'Click the "Share Screen" button in the meeting controls. Your browser will prompt you to select an entire display, application window, or browser tab. Conversio leverages RTCRtpSender.replaceTrack to dynamically swap video streams with sub-100ms latency without dropping peer negotiations.',
    },
    {
      q: 'What is the Interactive Whiteboard and who can use it?',
      a: 'Conversio includes a built-in Fabric.js multi-user vector canvas. Clicking "Whiteboard" opens the collaborative surface where all participants can draw, highlight, insert shapes, and point in real time. State snapshots are synchronized reliably across peers with capped memory history to prevent browser slowdowns.',
    },
    {
      q: 'What are Breakout Rooms and how does the host manage them?',
      a: 'The host can click "Breakout Groups" in the meeting controls, select how many sub-rooms to create (2 to 8), and choose between automatic round-robin assignment or manual participant allocation. The host can broadcast text announcements to all rooms or end breakout sessions with a 60-second countdown.',
    },
    {
      q: 'Why am I having microphone or camera connection issues?',
      a: 'Check your browser address bar permissions to ensure camera and microphone access is allowed for Conversio. You can also click the gear icon in the control bar to open Device Settings and switch between connected hardware devices. Conversio includes Google STUN and integrated Coturn TURN relays for strict corporate NAT traversal.',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Conversio Help Center & Knowledge Base
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Guides, troubleshooting, and platform documentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300">
          {/* Quick Support Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Video className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Audio & Video</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">1080p HD, VAD active speaker & noise suppression.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Room Security</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Host lock, bcrypt passcodes & waiting rooms.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                <Share2 className="w-3.5 h-3.5" />
              </div>
              <h5 className="font-semibold text-slate-900 dark:text-white text-xs">Collaboration</h5>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Fabric whiteboard, file share & breakout groups.</p>
            </div>
          </div>

          {/* Accordion FAQ */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Frequently Asked Questions
            </h4>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden"
                >
                  <button
                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                    className="w-full p-3.5 text-left flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                        activeFaq === i ? 'rotate-90 text-blue-500' : ''
                      }`}
                    />
                  </button>
                  {activeFaq === i && (
                    <div className="px-3.5 pb-3.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-2.5">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Need direct engineering assistance?</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold transition hover:opacity-90"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
