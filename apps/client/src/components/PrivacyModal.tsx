'use client';

import React from 'react';
import { Lock, EyeOff, HardDrive, ShieldCheck } from 'lucide-react';
import { MonoLabel, ModalShell } from './primitives';

const GUARANTEES = [
  {
    icon: Lock,
    title: 'Encrypted media in transit',
    body: 'Voice, video and screen sharing travel over WebRTC with DTLS and SRTP on every track. Media is relayed between peers or through a TURN relay when a direct path is blocked — it is never written to disk.',
  },
  {
    icon: HardDrive,
    title: 'Files encrypted in your browser',
    body: 'AES-256-GCM, with the key derived from the room passphrase through PBKDF2. The key stays in the browser, so only participants who know the passphrase can open a file; the server holds ciphertext.',
  },
  {
    icon: EyeOff,
    title: 'Recordings stay on your device',
    body: 'Recording runs in your browser with MediaRecorder and saves to your machine. Nothing uploads unless a host explicitly starts a recording and shares the file.',
  },
];

const COMMITMENTS = [
  'We do not sell, rent or monetise participant data, chat transcripts or call metadata.',
  'Room entry requires a signed admission token, so a guessed URL does not make someone a participant.',
  'Meeting passcodes are hashed before storage. The plaintext passcode is never written down.',
  'You can ask for your account profile, audit log and message history to be deleted at any time.',
];

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    size="lg"
    title="privacy & security"
    icon={<ShieldCheck className="w-4 h-4" />}
    footer={
      <>
        <MonoLabel tone="hint" className="mr-auto">
          updated nov 2026
        </MonoLabel>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center h-8 px-3 rounded-control bg-signal text-ink text-xs font-semibold hover:brightness-105 transition"
        >
          I understand
        </button>
      </>
    }
  >
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl text-chalk leading-tight">What we do with your meetings.</h2>
        <p className="text-sm text-muted leading-relaxed mt-2 max-w-[58ch]">
          Everything below is a property the code implements. Where we cannot prove a claim, we do not make it.
        </p>
      </div>

      <div className="rounded-panel border border-line divide-y divide-line">
        {GUARANTEES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 p-4">
            <span className="w-7 h-7 flex-none rounded-control border border-line bg-ink text-signal flex items-center justify-center">
              <Icon className="w-3.5 h-3.5" aria-hidden />
            </span>
            <div>
              <h3 className="text-sm font-medium text-chalk">{title}</h3>
              <p className="text-sm text-muted leading-relaxed mt-1">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-chalk mb-3">Four commitments</h3>
        <ol className="space-y-2.5">
          {COMMITMENTS.map((text, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted leading-relaxed">
              <MonoLabel tone="data" className="flex-none mt-px">
                {String(i + 1).padStart(2, '0')}
              </MonoLabel>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </ModalShell>
);
