'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, PlusCircle, List, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/') return null; // No nav on splash screen

  const links = [
    { href: '/home', label: 'Inicio', icon: Home },
    { href: '/mapa', label: 'Mapa', icon: MapIcon },
    { href: '/reportar', label: 'Reportar', icon: PlusCircle },
    { href: '/reportes', label: 'Reportes', icon: List },
    { href: '/estadisticas', label: 'Estadísticas', icon: BarChart2 },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe z-50">
      <ul className="flex justify-around items-center h-16">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <li key={link.href} className="flex-1">
              <Link
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 text-xs transition-colors",
                  isActive ? "text-sky-500 font-medium" : "text-gray-500 hover:text-sky-400"
                )}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="hidden sm:inline-block">{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
