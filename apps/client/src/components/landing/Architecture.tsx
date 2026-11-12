'use client';

import React from 'react';
import { ChannelGrid, MonoLabel } from '../primitives';

const PROMISES = [
  {
    id: 'media',
    title: 'Peer-to-peer media',
    body: 'Audio and video travel directly between participants over WebRTC, with DTLS-SRTP encryption on every track. A TURN relay only steps in when a network will not allow a direct path.',
    tag: 'webrtc',
  },
  {
    id: 'files',
    title: 'Client-side file encryption',
    body: 'Files are encrypted in your browser with AES-256-GCM before they leave your machine. The key is derived from the room passphrase and never sent to the server.',
    tag: 'aes-gcm',
  },
  {
    id: 'rooms',
    title: 'Room codes and passcodes',
    body: 'Every room has a code to join and may carry a passcode on top. Conflicts are guarded with optimistic locking, so two people acting on the same room cannot silently overwrite each other.',
    tag: 'optimistic-lock',
  },
];

/**
 * Architecture and security. Honest claims only — no latency numbers we cannot
 * measure, no "zero-trust" where the code does not back it up.
 */
export const Architecture: React.FC = () => (
  <section id="architecture" className="border-b border-line">
    <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
        <div className="lg:col-span-5">
          <h2 className="font-display text-xl text-chalk leading-tight">
            Built as an engineering product, not a demo.
          </h2>
        </div>
        <p className="lg:col-span-6 lg:col-start-7 text-sm text-muted leading-relaxed self-end">
          These are the properties the code actually implements. If a claim is not here, we are not making it.
        </p>
      </div>

      <ChannelGrid cols={3} className="rounded-panel overflow-hidden border border-line">
        {PROMISES.map((p) => (
          <div key={p.id} className="bg-ink p-6 flex flex-col">
            <MonoLabel tone="hint" className="text-[10px]">
              {p.tag}
            </MonoLabel>
            <h3 className="text-base font-medium text-chalk mt-3">{p.title}</h3>
            <p className="text-sm text-muted leading-relaxed mt-2">{p.body}</p>
          </div>
        ))}
      </ChannelGrid>
    </div>
  </section>
);
