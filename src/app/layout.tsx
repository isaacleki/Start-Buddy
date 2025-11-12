import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { MobileDock } from '@/components/MobileDock';
import { TopNav } from '@/components/TopNav';

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
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-background">
        <div className="min-h-screen">
          <header className="border-b bg-card">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
              <Link href="/" className="text-lg font-semibold">
                Start Buddy
              </Link>
              <TopNav />
            </div>
          </header>
          <main className="pb-24 sm:pb-12">{children}</main>
          <MobileDock />
        </div>
      </body>
    </html>
  );
}

