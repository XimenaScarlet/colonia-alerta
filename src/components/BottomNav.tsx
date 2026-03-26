'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, PlusCircle, List, Asterisk } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/') return null; // No nav on splash screen

  const links = [
    { href: '/home', label: 'Inicio', icon: Home },
    { href: '/mapa', label: 'Mapa', icon: MapIcon },
    { href: '/sos', label: 'S.O.S.', icon: Asterisk, isSpecial: true },
    { href: '/reportar', label: 'Reportar', icon: PlusCircle },
    { href: '/reportes', label: 'Reportes', icon: List },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-background/95 backdrop-blur-md border-t border-card-border pb-safe z-50">
      <ul className="flex justify-around items-end h-20 px-2 pb-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          if (link.isSpecial) {
            return (
              <li key={link.href} className="relative -top-6">
                <Link
                  href={link.href}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 bg-blue-accent rounded-2xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(14,165,233,0.5)] active:scale-90 transition-transform">
                    <Icon size={32} strokeWidth={3} />
                  </div>
                  <span className="text-[10px] font-bold text-blue-accent mt-2 uppercase tracking-widest">{link.label}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={link.href} className="flex-1 mb-2">
              <Link
                href={link.href}
                prefetch={true}
                className={cn(
                  "flex flex-col items-center justify-center w-full space-y-1 text-[10px] transition-all duration-300",
                  isActive ? "text-blue-accent font-bold" : "text-gray-500 hover:text-gray-300"
                )}
              >
                <div className={cn(
                  "p-1 rounded-lg transition-colors",
                  isActive ? "bg-blue-accent/10" : ""
                )}>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="uppercase tracking-tighter">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
