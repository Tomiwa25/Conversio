'use client';

import React, { useState } from 'react';
import { HelpCircle, Video, Shield, Share2, ChevronRight } from 'lucide-react';
import { Button, ModalShell, MonoLabel } from './primitives';

const CARDS = [
  { icon: Video, title: 'Audio & video', body: '1080p, active-speaker detection, noise suppression.' },
  { icon: Shield, title: 'Room security', body: 'Host lock, bcrypt passcodes, waiting rooms.' },
  { icon: Share2, title: 'Collaboration', body: 'Whiteboard, file share, breakout groups.' },
];

const FAQS: Array<[string, string]> = [
  [
    'How do I start a room and invite people?',
    'On the home page, enter a topic and your name, then start the meeting. Inside the room, use the share control to copy the link. Anyone with the link, plus the six-digit passcode if you set one, can join without installing anything.',
  ],
  [
    'How does screen sharing work?',
    'Pick the screen, window or tab you want to share. Conversio swaps the outbound track with replaceTrack, so the stream changes without renegotiating the peer connection.',
  ],
  [
    'What is the whiteboard and who can use it?',
    'A shared vector canvas every participant can draw on. State is synced across peers with a capped history so long sessions stay responsive.',
  ],
  [
    'How do breakout rooms work?',
    'The host opens breakout groups, picks between two and eight rooms, then assigns people round-robin or by hand. Announcements can be broadcast to every room, and sessions end with a countdown.',
  ],
  [
    'Why is my mic or camera not working?',
    'Check the browser permission for camera and microphone on this site, then open device settings from the room controls to pick different hardware. A TURN relay covers strict corporate networks.',
  ],
];

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="help centre & knowledge base"
      icon={<HelpCircle className="w-4 h-4" />}
      size="lg"
      footer={
        <>
          <MonoLabel tone="hint" className="mr-auto">
            still stuck? send it to the team
          </MonoLabel>
          <Button variant="secondary" onClick={onClose}>
            Close guide
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-line rounded-panel overflow-hidden">
          {CARDS.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className={`p-3.5 space-y-1.5 ${i > 0 ? 'sm:border-l border-line' : ''} ${i > 0 ? 'border-t sm:border-t-0' : ''}`}
            >
              <Icon className="w-4 h-4 text-signal" />
              <h5 className="text-xs text-chalk font-medium">{title}</h5>
              <p className="text-xs text-muted leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <MonoLabel tone="hint" className="block">
            frequently asked
          </MonoLabel>
          <div className="border border-line rounded-panel divide-y divide-line/[0.12] overflow-hidden">
            {FAQS.map(([q, a], i) => (
              <div key={q}>
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  aria-expanded={activeFaq === i}
                  className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs text-chalk hover:bg-glass transition-colors"
                >
                  <span>{q}</span>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      activeFaq === i ? 'rotate-90 text-signal' : 'text-muted'
                    }`}
                  />
                </button>
                {activeFaq === i && (
                  <p className="px-4 pb-3 text-xs text-muted leading-relaxed">{a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
