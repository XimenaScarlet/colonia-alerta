import { prisma } from '@/lib/prisma';

export const dynamic = "force-dynamic";

async function getStatistics() {
  try {
    // Total de reportes
    const total = await prisma.report.count();
    const resolved = await prisma.report.count({ where: { status: 'Resuelto' } });
    const pending = await prisma.report.count({ where: { status: 'Pendiente' } });
    const inProgress = await prisma.report.count({ where: { status: 'En Proceso' } });

    // Por categoría
    const byCategory = await prisma.report.groupBy({
      by: ['category'],
      _count: true,
    });

    // Por municipio
    const byMunicipio = await prisma.report.groupBy({
      by: ['municipio'],
      _count: true,
    });

    // Top colonias
    const byColonia = await prisma.report.groupBy({
      by: ['colonia'],
      _count: true,
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    });

    return {
      total,
      resolved,
      pending,
      inProgress,
      percentageResolved: total > 0 ? Math.round((resolved / total) * 100) : 0,
      byCategory,
      byMunicipio,
      byColonia,
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return {
      total: 0,
      resolved: 0,
      pending: 0,
      inProgress: 0,
      percentageResolved: 0,
      byCategory: [],
      byMunicipio: [],
      byColonia: [],
    };
  }
}

export default async function EstadisticasPage() {
  const stats = await getStatistics();

  // Mapear datos para mostrar porcentajes
  const categoryLength = stats.byCategory.length;
  const categoryStats = stats.byCategory.map((cat: any) => ({
    cat: cat.category,
    pct: categoryLength > 0 ? Math.round((cat._count / stats.total) * 100) : 0,
    count: cat._count,
    color: getCategoryColor(cat.category),
  }));

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas en Tiempo Real</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-sky-50 rounded-2xl p-4 border border-sky-100 flex flex-col justify-center items-center">
          <span className="text-3xl font-black text-sky-600">{stats.total}</span>
          <span className="text-xs font-semibold text-sky-800 uppercase tracking-widest mt-1">
            Reportes Total
          </span>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex flex-col justify-center items-center">
          <span className="text-3xl font-black text-emerald-600">{stats.percentageResolved}%</span>
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mt-1">
            Resueltos
          </span>
        </div>
        <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100 flex flex-col justify-center items-center">
          <span className="text-3xl font-black text-orange-600">{stats.pending}</span>
          <span className="text-xs font-semibold text-orange-800 uppercase tracking-widest mt-1">
            Pendientes
          </span>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 flex flex-col justify-center items-center">
          <span className="text-3xl font-black text-blue-600">{stats.inProgress}</span>
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-widest mt-1">
            En Proceso
          </span>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Estado de Reportes</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1 text-gray-600">
              <span>🟠 Pendientes</span>
              <span>{stats.pending}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium mb-1 text-gray-600">
              <span>🔵 En Proceso</span>
              <span>{stats.inProgress}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.inProgress / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs font-medium mb-1 text-gray-600">
              <span>🟢 Resueltos</span>
              <span>{stats.resolved}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full"
                style={{
                  width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Por Categoría */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Reportes por Categoría</h3>
        <div className="space-y-3">
          {categoryStats.length > 0 ? (
            categoryStats.map((c: any) => (
              <div key={c.cat}>
                <div className="flex justify-between text-xs font-medium mb-1 text-gray-600">
                  <span>{c.cat}</span>
                  <span>{c.count} ({c.pct}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${c.color}`}
                    style={{ width: `${c.pct}%` }}
                  ></div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Sin reportes aún</p>
          )}
        </div>
      </div>

      {/* Por Municipio */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 className="font-bold text-gray-800 mb-4">Reportes por Municipio</h3>
        <div className="divide-y divide-gray-100">
          {stats.byMunicipio.length > 0 ? (
            stats.byMunicipio.map((m: any, idx: number) => (
              <div key={m.municipio} className="py-3 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  <span className="text-gray-400 font-bold mr-2">{idx + 1}.</span>
                  {m.municipio}
                </span>
                <span className="text-xs font-bold bg-sky-100 text-sky-600 px-2 py-1 rounded-md">
                  {m._count}
                </span>
              </div>
            ))
          ) : (
            <p className="py-3 text-sm text-gray-500">Sin reportes aún</p>
          )}
        </div>
      </div>

      {/* Top Colonias Afectadas */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-bold text-gray-800 mb-4">🔝 Top Colonias Afectadas</h3>
        <div className="divide-y divide-gray-50">
          {stats.byColonia.length > 0 ? (
            stats.byColonia.map((col: any, i: number) => (
              <div key={col.colonia} className="py-2 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <span className="text-gray-400 font-bold">#{i + 1}</span>
                  {col.colonia}
                </span>
                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-md">
                  {col._count}
                </span>
              </div>
            ))
          ) : (
            <div className="py-2 text-sm text-gray-500">Sin reportes aún</div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        ✓ Datos actualizados en servidor | Última actualización: {new Date().toLocaleTimeString('es-MX')}
      </p>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Bache': 'bg-red-500',
    'Luminaria Dañada': 'bg-yellow-400',
    'Basura Acumulada': 'bg-purple-500',
    'Fuga de Agua': 'bg-blue-500',
    'Inseguridad': 'bg-red-700',
    'Otro': 'bg-gray-400',
  };
  return colors[category] || 'bg-gray-400';
}
