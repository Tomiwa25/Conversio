import type { Metadata } from 'next';
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-600 selection:text-white transition-colors duration-200" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
