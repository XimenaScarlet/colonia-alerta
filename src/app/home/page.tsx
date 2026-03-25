import Link from 'next/link';
import { Map, PlusCircle, List, AlertCircle } from 'lucide-react';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <>
      {/* Welcome & Overview */}
      <section className="bg-white border border-gray-100 text-gray-800 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-sky-600 mb-1">¡Hola Ciudadano!</h2>
          <p className="text-gray-500 text-sm mb-4">
            Tu participación hace la diferencia en Saltillo y Ramos Arizpe.
          </p>
        </div>
        
        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-50 rounded-full opacity-50 blur-2xl"></div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 ml-1">Acciones Rápidas</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link href="/reportar" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
              <PlusCircle size={28} />
            </div>
            <span className="text-xs font-medium text-gray-700">Reportar</span>
          </Link>
          <Link href="/mapa" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
              <Map size={28} />
            </div>
            <span className="text-xs font-medium text-gray-700">Mapa</span>
          </Link>
          <Link href="/reportes" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
              <List size={28} />
            </div>
            <span className="text-xs font-medium text-gray-700">Reportes</span>
          </Link>
        </div>
      </section>

      {/* Offline Sync Status */}
      <OfflineStatusBadge />
    </>
  );
}

