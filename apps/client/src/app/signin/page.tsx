import React from 'react';
import type { Metadata } from 'next';
import { SignInView } from '../../components/SignInView';

export const metadata: Metadata = {
  title: 'Sign in — Conversio',
  description: 'Sign in to start a meeting or join one with a room code.',
};

export default function SignInPage() {
  return <SignInView forcedMode="signin" />;
}
