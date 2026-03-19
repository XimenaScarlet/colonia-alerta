import Link from 'next/link';
import { Map, PlusCircle, List, BarChart2, AlertCircle } from 'lucide-react';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';
import { PrismaClient } from '@prisma/client';

async function getStats() {
  const prisma = new PrismaClient();
  try {
    const total = await prisma.report.count();
    const resolved = await prisma.report.count({ where: { status: 'Resuelto' } });
    const percentageResolved = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return { total, percentageResolved };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, percentageResolved: 0 };
  } finally {
    await prisma.$disconnect();
  }
}

export default async function Home() {
  const { total, percentageResolved } = await getStats();

  return (
    <>
      {/* Welcome & Overview */}
      <section className="bg-sky-500 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">¡Hola Ciudadano!</h2>
          <p className="text-sky-100 text-sm mb-4">
            Tu participación hace la diferencia en Saltillo y Ramos Arizpe.
          </p>
          <div className="flex gap-4">
            <div className="bg-white/20 px-3 py-2 rounded-lg text-center backdrop-blur-sm">
              <span className="block text-2xl font-bold">{total}</span>
              <span className="text-xs uppercase tracking-wide">Reportes Totales</span>
            </div>
            <div className="bg-white/20 px-3 py-2 rounded-lg text-center backdrop-blur-sm">
              <span className="block text-2xl font-bold">{percentageResolved}%</span>
              <span className="text-xs uppercase tracking-wide">Resueltos</span>
            </div>
          </div>
        </div>
        
        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-sky-400 rounded-full opacity-50 blur-2xl"></div>
      </section>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-semibold text-gray-800 mb-3 ml-1">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/reportar" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-sky-100 text-sky-600 p-3 rounded-full">
              <PlusCircle size={28} />
            </div>
            <span className="font-medium text-gray-700">Crear Reporte</span>
          </Link>
          <Link href="/mapa" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-full">
              <Map size={28} />
            </div>
            <span className="font-medium text-gray-700">Ver Mapa</span>
          </Link>
          <Link href="/reportes" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full">
              <List size={28} />
            </div>
            <span className="font-medium text-gray-700">Reportes</span>
          </Link>
          <Link href="/estadisticas" className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
              <BarChart2 size={28} />
            </div>
            <span className="font-medium text-gray-700">Estadísticas</span>
          </Link>
        </div>
      </section>

      {/* Offline Sync Status */}
      <OfflineStatusBadge />
      
      {/* Educational Card */}
      <section className="bg-slate-800 text-white rounded-2xl p-5 flex items-start gap-4 shadow-md items-center">
        <div className="bg-slate-700 p-3 rounded-full flex-shrink-0">
          <AlertCircle className="text-yellow-400" size={24} />
        </div>
        <div>
          <h4 className="font-semibold text-sm mb-1">¿Sabías qué?</h4>
          <p className="text-xs text-slate-300">
            Puedes crear reportes incluso sin conexión a internet. Se enviarán automáticamente cuando recuperes la señal.
          </p>
        </div>
      </section>
    </div>
  );
}
