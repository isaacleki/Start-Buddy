'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { path: '/tasks/new', label: 'Add task' },
  { path: '/focus', label: 'Focus' },
  { path: '/communities', label: 'Communities' },
  { path: '/chat', label: 'Chat' },
  { path: '/account', label: 'Account' },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
      {links.map((link) => {
        const active = pathname === link.path || pathname.startsWith(link.path);
        return (
          <Link
            key={link.label}
            href={link.path}
            className={`transition hover:text-foreground ${active ? 'text-emerald-600 font-medium' : ''}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
