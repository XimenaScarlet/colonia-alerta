'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';

export function Header() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  const titles: Record<string, string> = {
    '/home': 'Colonia Alerta',
    '/mapa': 'Mapa de Incidencias',
    '/reportar': 'Nuevo Reporte',
    '/mis-reportes': 'Mis Reportes',
    '/estadisticas': 'Estadísticas',
  };

  const title = titles[pathname] || 'Colonia Alerta';

  return (
    <header className="fixed top-0 w-full bg-sky-500 text-white h-14 flex items-center justify-between px-4 z-50 shadow-md pt-safe">
      <div className="font-semibold text-lg">{title}</div>
      <button className="p-2 relative rounded-full hover:bg-sky-600 transition-colors">
        <Bell size={20} />
        {/* Simularemos un badge de notificaciones más adelante */}
        <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
      </button>
    </header>
  );
}
