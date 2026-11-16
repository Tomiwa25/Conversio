import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/auth.context';
import { ThemeProvider } from '../context/theme.context';

/**
 * Runs before first paint so the correct scheme is on <html> before React
 * hydrates — otherwise a stored "light" preference flashes dark.
 */
const THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('conversio_theme');var d=s==='light'?false:s==='dark'?true:(s==='system'?window.matchMedia('(prefers-color-scheme: dark)').matches:true);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export const metadata: Metadata = {
  title: 'Conversio | Real-Time Communication Hub',
  description:
    'Enterprise-grade WebRTC video conferencing, persistent team channels, and client-side encrypted collaboration.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-ink text-chalk antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
