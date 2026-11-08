import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}

