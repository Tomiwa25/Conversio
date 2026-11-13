'use client';

import React from 'react';
import { ShieldCheck, Lock, EyeOff, HardDrive, Check } from 'lucide-react';
import { Button, ModalShell, MonoLabel, Panel } from './primitives';

const GUARANTEES = [
  { icon: HardDrive, title: 'Client-side AES-256-GCM', body: 'Files are encrypted in your browser with keys derived from the room passphrase. Only participants holding that key can decrypt the chunks.' },
  { icon: EyeOff, title: 'Local-only recording', body: 'Recordings are assembled in the browser with MediaRecorder and saved to your device. Nothing uploads unless the host explicitly sends it.' },
];

const COMMITMENTS: Array<[string, string]> = [
  ['No selling of personal data', 'Recordings, transcripts and metadata are never monetised or handed to advertisers.'],
  ['Cryptographic admission tokens', 'Room entry needs an HMAC-SHA256 signed token, which blocks link sniffing and role spoofing.'],
  ['Bcrypt passcode hashing', 'Passcodes are hashed with adaptive salt rounds before storage. Plaintext is never kept.'],
  ['GDPR and CCPA rights', 'You can request deletion of your profile, audit logs and message history at any time.'],
];

export const PrivacyModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => (
  <ModalShell
    isOpen={isOpen}
    onClose={onClose}
    title="privacy & cryptographic guarantee"
    icon={<ShieldCheck className="w-4 h-4" />}
    size="lg"
    footer={
      <>
        <MonoLabel tone="hint" className="mr-auto">
          updated 2026-11
        </MonoLabel>
        <Button onClick={onClose}>I understand</Button>
      </>
    }
  >
    <div className="space-y-5">
      <Panel surface="flat" padding="sm" className="flex items-start gap-3 border-signal/40">
        <Lock className="w-4 h-4 text-signal shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm text-chalk font-medium">Zero-knowledge WebRTC media</h4>
          <p className="text-xs text-muted leading-relaxed mt-1">
            Voice, video and screen sharing are encrypted in transit with DTLS-SRTP. Media travels
            directly between peers, or through a relay when a network won&apos;t allow a direct
            path, and is never written to disk.
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GUARANTEES.map(({ icon: Icon, title, body }) => (
          <Panel key={title} surface="flat" padding="sm" className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-chalk">
              <Icon className="w-4 h-4 text-wave shrink-0" />
              {title}
            </div>
            <p className="text-xs text-muted leading-relaxed">{body}</p>
          </Panel>
        ))}
      </div>

      <div className="space-y-3">
        <MonoLabel tone="hint" className="block">
          four commitments
        </MonoLabel>
        <ul className="space-y-3">
          {COMMITMENTS.map(([title, body]) => (
            <li key={title} className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-signal shrink-0 mt-0.5" />
              <p className="text-xs text-muted leading-relaxed">
                <span className="text-chalk">{title}.</span> {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </ModalShell>
);
