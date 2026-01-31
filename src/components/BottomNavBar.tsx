'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Ticket, Wallet, ScrollText, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/play', label: 'Play', icon: Ticket },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/results', label: 'Results', icon: ClipboardList },
  { href: '/bet-ledger', label: 'Bets', icon: ScrollText },
];

export function BottomNavBar() {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-card border-t border-border">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted group"
            >
              <item.icon
                className={cn(
                  'w-6 h-6 mb-1 text-muted-foreground group-hover:text-primary',
                  isActive && 'text-primary'
                )}
              />
              <span
                className={cn(
                  'text-xs text-muted-foreground group-hover:text-primary',
                  isActive && 'text-primary font-semibold'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
