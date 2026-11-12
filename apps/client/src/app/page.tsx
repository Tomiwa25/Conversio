import type { Metadata } from 'next';
import React from 'react';
import { LandingSections } from '../components/landing/LandingSections';

/**
 * Landing page. Kept as a server component so the marketing page carries real
 * title/description/canonical metadata; the interactive shell lives in
 * LandingSections.
 *
 * Removed in this redesign: the announcement banner, the 8-tab ecosystem
 * carousel, the fake social tiles, and the demo-credentials pill. All of them
 * advertised things that either did not exist or were a security hole.
 */
export const metadata: Metadata = {
  title: 'Conversio — live rooms for teams',
  description:
    'Video, whiteboard, files and chat in one place. Start a call in ten seconds, or join with a room code.',
  alternates: { canonical: '/' },
};

export default function LandingPage() {
  return <LandingSections />;
}
