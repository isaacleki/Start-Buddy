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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-gradient-to-t from-background/95 via-background/95 to-transparent backdrop-blur sm:hidden">
      <div className="pointer-events-auto mx-auto mb-4 flex max-w-sm items-center justify-evenly rounded-2xl border bg-card/95 px-6 py-3 shadow-lg shadow-black/5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.path || pathname.startsWith(link.path);

          return (
            <Link
              key={link.label}
              href={link.path}
              className={`flex flex-col items-center gap-1 text-[11px] transition ${active ? 'text-emerald-600' : 'text-muted-foreground'}`}
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 ${active ? 'text-emerald-600' : ''}`}>
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
