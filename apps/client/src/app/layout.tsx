import type { Metadata } from 'next';
// Studio glass type: Geist for UI, Instrument Serif for display. Both ship as
// self-hosted packages rather than next/font/google, so builds don't need a
// network round-trip to fonts.googleapis.com.
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './globals.css';
import { AuthProvider } from '../context/auth.context';
import { ThemeProvider } from '../context/theme.context';

export const metadata: Metadata = {
  title: 'Conversio | Real-Time Collaboration & Conferencing',
  description: 'Enterprise-grade WebRTC video conferencing with collaborative whiteboard, screen sharing, and encrypted file sharing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-ink text-chalk antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
