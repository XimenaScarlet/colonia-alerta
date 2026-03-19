'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    'Basura': '#ef4444',
    'Bache': '#f97316',
    'Alumbrado': '#eab308',
    'Agua': '#3b82f6',
    'Seguridad': '#dc2626',
    'Parque': '#10b981',
    'Otro': '#6b7280',
  };
  return colors[category] || '#6b7280';
}

export function StatisticsWithOfflineReports({ serverStats }: any) {
  const [totalWithOffline, setTotalWithOffline] = useState(serverStats.total);
  const [offlineCount, setOfflineCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Contar reportes offline
    const countOfflineReports = async () => {
      try {
        const offlineReports = await db.reports.filter(r => !r.synced).toArray();
        setOfflineCount(offlineReports.length);
        setTotalWithOffline(serverStats.total + offlineReports.length);
      } catch (error) {
        console.error('Error counting offline reports:', error);
      }
    };

    countOfflineReports();
  }, [serverStats.total]);

  if (!mounted) return null;

  // Datos para gráficos
  const categoryLength = serverStats.byCategory.length;
  const categoryStats = serverStats.byCategory.map((cat: any) => ({
    name: cat.category,
    value: cat._count,
    percentage: categoryLength > 0 ? Math.round((cat._count / serverStats.total) * 100) : 0,
    color: getCategoryColor(cat.category),
  }));

  const municipioStats = serverStats.byMunicipio.map((mun: any) => ({
    name: mun.municipio,
    count: mun._count,
  }));

  const coloniaStats = serverStats.byColonia.map((col: any) => ({
    name: col.colonia,
    count: col._count,
  }));

  return (
    <div className="p-4 pb-24">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Estadísticas de Reportes</h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl border border-sky-200 p-4">
          <div className="text-sm text-sky-600 font-medium mb-1">Total de Reportes</div>
          <div className="text-2xl font-bold text-sky-900">{totalWithOffline}</div>
          {offlineCount > 0 && (
            <div className="text-xs text-sky-700 mt-2 bg-sky-50 px-2 py-1 rounded inline-block">
              📤 {offlineCount} por sincronizar
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-4">
          <div className="text-sm text-emerald-600 font-medium mb-1">Resueltos</div>
          <div className="text-2xl font-bold text-emerald-900">{serverStats.resolved}</div>
          <div className="text-xs text-emerald-700 mt-2">{serverStats.percentageResolved}% del total</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-4">
          <div className="text-sm text-orange-600 font-medium mb-1">Pendientes</div>
          <div className="text-2xl font-bold text-orange-900">{serverStats.pending}</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-4">
          <div className="text-sm text-blue-600 font-medium mb-1">En Proceso</div>
          <div className="text-2xl font-bold text-blue-900">{serverStats.inProgress}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de categorías (Pie) */}
        {categoryStats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reportes por Categoría</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} reportes`, 'Cantidad']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de municipios (Bar) */}
        {municipioStats.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reportes por Municipio</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={municipioStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} reportes`, 'Cantidad']} />
                <Bar dataKey="count" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top 8 colonias con más reportes */}
      {coloniaStats.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top 8 Colonias Afectadas</h2>
          <div className="space-y-2">
            {coloniaStats.map((colonia: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{colonia.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-sky-500 h-2 rounded-full"
                      style={{
                        width: `${(colonia.count / coloniaStats[0].count) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-gray-900 w-8 text-right">{colonia.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota sobre sincronización */}
      {offlineCount > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>📱 Nota:</strong> Tienes {offlineCount} reporte{offlineCount !== 1 ? 's' : ''} pendiente{offlineCount !== 1 ? 's' : ''} de sincronizar. Se incluirán en las estadísticas una vez que se suban a internet.
          </p>
        </div>
      )}
    </div>
  );
}
