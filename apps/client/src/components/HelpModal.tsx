'use client';

import React, { useState } from 'react';
import { HelpCircle, Video, Shield, Share2, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Button, MonoLabel, ModalShell } from './primitives';

const TOPICS = [
  {
    icon: Video,
    title: 'Audio & video',
    body: 'Device pickers, mute, camera and screen share.',
  },
  {
    icon: Shield,
    title: 'Room security',
    body: 'Passcodes, host lock and the waiting room.',
  },
  {
    icon: Share2,
    title: 'Collaboration',
    body: 'Whiteboard, file share and breakout groups.',
  },
];

// Trimmed to what the code does today. The pre-redesign copy quoted internal
// implementation details and a latency number we cannot measure.
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How do I start a meeting and invite people?',
    a: 'On the home page, give the room a topic and your name, then start it. Inside the room, copy the room link from the control bar and send it on. Anyone with the link — and the passcode, if you set one — can join in the browser without installing anything.',
  },
  {
    q: 'How does screen sharing work?',
    a: 'Choose Share screen in the meeting controls. Your browser asks which display, window or tab to share. The shared track replaces your camera track in the same call, so the call is not renegotiated and nobody drops out.',
  },
  {
    q: 'What is the whiteboard and who can draw on it?',
    a: 'The whiteboard is a shared canvas every participant in the room can draw on, highlight on and point at. It lives alongside the call; switching back to camera leaves the drawing in place.',
  },
  {
    q: 'How do breakout rooms get managed?',
    a: 'The host opens Breakout groups from the meeting controls and picks how many rooms to create. Participants are assigned from there; the host can bring everyone back to the main room at any time.',
  },
  {
    q: 'My camera or microphone is not working.',
    a: 'Check the browser address bar for camera and microphone permission for this site. If permission is granted and the device still does not appear, open Device settings from the control bar and pick it from the list. Networks that block direct connections are handled with a TURN relay.',
  },
];

export const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="help"
      icon={<HelpCircle className="w-4 h-4" />}
      footer={
        <>
          <MonoLabel tone="hint" className="mr-auto">
            v0.1
          </MonoLabel>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close guide
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-xl text-chalk leading-tight">How to get through a call.</h2>
          <p className="text-sm text-muted leading-relaxed mt-2 max-w-[58ch]">
            Short answers to the questions that come up most. If one of these does not cover it, that is a gap worth
            reporting.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line rounded-panel overflow-hidden border border-line">
          {TOPICS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-ink p-4">
              <Icon className="w-4 h-4 text-signal" aria-hidden />
              <h3 className="text-sm font-medium text-chalk mt-2">{title}</h3>
              <p className="text-xs text-muted leading-relaxed mt-1">{body}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-xs text-muted mb-2">Frequently asked</h3>
          <div className="rounded-panel border border-line divide-y divide-line">
            {FAQS.map((faq, i) => {
              const open = activeFaq === i;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setActiveFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full text-left flex items-center justify-between gap-4 px-4 py-3 hover:bg-glass transition-colors"
                  >
                    <span className={clsx('text-sm', open ? 'text-chalk' : 'text-chalk/90')}>{faq.q}</span>
                    <ChevronRight
                      className={clsx(
                        'w-4 h-4 flex-none transition-transform duration-200',
                        open ? 'rotate-90 text-signal' : 'text-muted',
                      )}
                      aria-hidden
                    />
                  </button>
                  {open && (
                    <p className="px-4 pb-4 text-sm text-muted leading-relaxed animate-rise">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
