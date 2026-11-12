'use client';

import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Server, HardDrive, CheckCircle2 } from 'lucide-react';

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Conversio Privacy & Cryptographic Guarantee
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Zero-knowledge media architecture & enterprise security principles
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
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-start space-x-3">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-950 dark:text-blue-200 text-xs">
                Zero-Knowledge WebRTC Media Streams
              </h4>
              <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 mt-0.5">
                All voice, video, and screen sharing feeds are encrypted in transit using standard DTLS 1.3 and SRTP. Media packets are forwarded directly between verified peers or via dedicated SFU routing without ever being stored or tapped on disk.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                <HardDrive className="w-4 h-4 text-indigo-500" />
                <span>Client-Side AES-256-GCM</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Files shared during conferences are encrypted client-side using Web Crypto API PBKDF2 keys derived from room passcodes. Only authorized participants with the key can decrypt file chunks.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-semibold">
                <EyeOff className="w-4 h-4 text-emerald-500" />
                <span>Local-Only Recording</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                In-meeting recordings are assembled directly in your browser using the MediaRecorder API and saved locally to your device. No audio or video recording ever uploads to cloud servers without explicit host action.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Our 4 Core Privacy Commitments</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>No Selling of Personal Data:</strong> We never monetize, sell, or rent participant meeting recordings, chat transcripts, or biometric metadata to advertisers or third parties.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Cryptographic Admission Tokens:</strong> Room entry requires HMAC-SHA256 signed admission tokens, preventing unauthorized URL sniffing, role spoofing, or meeting crashes.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Bcrypt Passcode Hashing:</strong> Meeting passcodes are securely hashed using bcrypt with adaptive salt rounds before database storage. Plaintext passcodes are never stored.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>GDPR & CCPA Compliant:</strong> You have the right to request deletion of your account profile, audit logs, and message histories at any time.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Last updated: November 2026</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
