'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, Clock, Users, User, MessageSquare } from 'lucide-react';

const links = [
  { path: '/tasks/new', label: 'Add', icon: Plus },
  { path: '/focus', label: 'Focus', icon: Clock },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/communities', label: 'Community', icon: Users },
  { path: '/account', label: 'Account', icon: User },
];

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background/80 via-background/60 to-transparent backdrop-blur-2xl sm:hidden">
      <div className="pointer-events-auto mx-auto mb-4 flex max-w-sm items-center justify-evenly rounded-3xl border border-white/30 dark:border-white/20 bg-white/70 dark:bg-black/40 backdrop-blur-2xl px-6 py-3 shadow-2xl shadow-black/10 dark:shadow-black/50 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-transparent before:rounded-3xl before:pointer-events-none relative">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path || pathname.startsWith(link.path);

          return (
            <Link
              key={link.label}
              href={link.path}
              className={`relative z-10 flex flex-col items-center gap-1 text-[11px] font-medium transition ${active ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'}`}
            >
              <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-all ${active ? 'bg-gradient-to-b from-teal-500/20 to-teal-600/20 text-teal-600 dark:text-teal-400 shadow-lg shadow-teal-500/20' : 'bg-white/40 dark:bg-white/5 text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
              </span>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
