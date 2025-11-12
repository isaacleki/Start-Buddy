import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { MobileDock } from '@/components/MobileDock';
import { TopNav } from '@/components/TopNav';
import { Logo } from '@/components/Logo';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Start Buddy - Task Focus App',
  description: 'Break down tasks into micro-steps and focus on one at a time',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Start Buddy',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#14b8a6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background">
        <ThemeProvider>
          <div className="min-h-screen">
            <header className="border-b border-white/20 dark:border-white/10 bg-white/60 dark:bg-black/30 backdrop-blur-2xl shadow-sm">
              <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                  <Logo size={24} className="h-6 w-6" />
                  <span>Start Buddy</span>
                </Link>
                <div className="flex items-center gap-4">
                  <TopNav />
                </div>
              </div>
            </header>
            <main className="pb-24 sm:pb-12">{children}</main>
            <MobileDock />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

