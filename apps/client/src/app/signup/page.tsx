import React from 'react';
import type { Metadata } from 'next';
import { SignInView } from '../../components/SignInView';

export const metadata: Metadata = {
  title: 'Create an account — Conversio',
  description: 'One account. Start or join any room.',
};

export default function SignUpPage() {
  return <SignInView forcedMode="signup" />;
}
