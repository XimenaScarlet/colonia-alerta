'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, ChevronDown, CheckCircle, Clock, MapPin, Trash2, Map, WifiOff, CloudOff } from 'lucide-react';
import { reportService, userService, notificationService } from '@/lib/api-client';

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  municipio: string;
  colonia: string;
  status: string;
  lat: number;
  lng: number;
  createdAt: string;
  createdBy?: string;
  synced?: boolean;
}

export default function ReportesPage() {
  const [tab, setTab] = useState<'todos' | 'mios'>('todos');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();
  const userId = userService.getUserId();

  // Filtros
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    municipio: '',
    colonia: '',
  });

  // Mapa de categorías con emojis
  const categories = [
    { value: 'Bache', label: '🕳️ Bache' },
    { value: 'Luminaria Dañada', label: '💡 Luminaria Dañada' },
    { value: 'Basura Acumulada', label: '🗑️ Basura Acumulada' },
    { value: 'Fuga de Agua', label: '💧 Fuga de Agua' },
    { value: 'Inseguridad', label: '⚠️ Inseguridad' },
    { value: 'Otro', label: '📍 Otro' },
  ];

  useEffect(() => {
    loadReports();
  }, [tab, filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await reportService.getReports({
        limit: 100,
        ...(tab === 'mios' && { createdBy: userId }),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
        ...(filters.municipio && { municipio: filters.municipio }),
        ...(filters.colonia && { colonia: filters.colonia }),
      });

      if (response && response.success) {
        setReports(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      
      // Fallback a reporte local (Offline PWA)
      try {
        const { db } = await import('@/lib/db');
        const offlineReports = await db.reports.toArray();
        const formattedLocal = offlineReports.map(r => ({
          id: r.id?.toString() || Math.random().toString(),
          title: r.title,
          description: r.description,
          category: r.category,
          municipio: r.municipio,
          colonia: r.colonia,
          status: r.status,
          lat: r.lat,
          lng: r.lng,
          createdAt: r.datetime,
          createdBy: userId,
          synced: r.synced,
        }));
        
        // Aplicar filtros locales simples
        let filtered = formattedLocal;
        if (filters.category) filtered = filtered.filter(r => r.category === filters.category);
        if (filters.status) filtered = filtered.filter(r => r.status === filters.status);
        if (filters.municipio) filtered = filtered.filter(r => r.municipio === filters.municipio);
        
        if (filtered.length > 0) {
          setReports(filtered);
        } else {
          setReports([]);
          if (!navigator.onLine) {
            notificationService.sendError('Sin Conexión', 'Estás offline y no hay reportes filtrados localmente.');
          }
        }
      } catch (dbError) {
        notificationService.sendError('Error al Cargar Reportes', 'Estás desconectado y falló la carga local.');
        setReports([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de que deseas eliminar este reporte?')) return;
    
    setLoading(true);
    try {
      if (navigator.onLine) {
        // Enviar al servidor si estamos online
        await reportService.deleteReport(id);
      }
      
      // Eliminar de base local (Dexie) por si acaso de manera silenciosa
      try {
        const { db } = await import('@/lib/db');
        await db.reports.where('id').equals(id).delete();
      } catch (e) {}

      // Actualizar UI
      setReports(prev => prev.filter(r => r.id !== id));
      notificationService.send('✅ Reporte Eliminado', { body: 'El reporte se borró exitosamente' });
    } catch (error) {
      console.error('Error al eliminar', error);
      alert('Hubo un problema al intentar eliminar el reporte.');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (report: Report) => {
    router.push(`/mapa?lat=${report.lat}&lng=${report.lng}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'text-orange-600 bg-orange-50';
      case 'En Proceso':
        return 'text-blue-600 bg-blue-50';
      case 'Resuelto':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categories.find(c => c.value === category);
    return found ? found.label : `📍 ${category}`;
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setTab('todos')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'todos'
              ? 'text-sky-600 border-sky-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Todos ({reports.length})
        </button>
        <button
          onClick={() => setTab('mios')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'mios'
              ? 'text-sky-600 border-sky-600'
              : 'text-gray-600 border-transparent hover:text-gray-800'
          }`}
        >
          Mis Reportes ({reports.filter(r => r.createdBy === userId).length})
        </button>
      </div>

      {/* Filter Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter size={18} />
          <span>Filtros</span>
          <ChevronDown
            size={18}
            className={`ml-auto transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3 shadow-sm">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Categoría
            </label>
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Estatus
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="Pendiente">⏳ Pendiente</option>
              <option value="En Proceso">⚙️ En Proceso</option>
              <option value="Resuelto">✅ Resuelto</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Municipio
            </label>
            <select
              value={filters.municipio}
              onChange={(e) =>
                setFilters({ ...filters, municipio: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="">Todos</option>
              <option value="Saltillo">Saltillo</option>
              <option value="Ramos Arizpe">Ramos Arizpe</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Colonia
            </label>
            <input
              type="text"
              value={filters.colonia}
              onChange={(e) =>
                setFilters({ ...filters, colonia: e.target.value })
              }
              placeholder="Filtrar por colonia"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <button
            onClick={() => setFilters({ category: '', status: '', municipio: '', colonia: '' })}
            className="w-full py-2 text-sm font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Limpiar Filtros
          </button>
        </div>
      )}

      {/* Reports List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin">⏳</div>
          <p className="text-gray-500 mt-2 text-sm">Cargando reportes...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
          <p className="text-lg font-medium text-gray-600 mb-1">📭 No hay reportes</p>
          <p className="text-sm text-gray-500">
            {filters.category || filters.status ? 'Intenta cambiar los filtros' : 'Sé el primero en reportar'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleCardClick(report)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all hover:border-sky-300 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-2 gap-2">
                <div className="flex flex-col gap-1.5 items-start">
                  <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700">
                    {getCategoryLabel(report.category)}
                  </span>
                  
                  {report.synced === false && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1 border border-gray-200" title="Guardado localmente. Esperando internet.">
                      <CloudOff size={10} /> Local offline
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ${getStatusColor(
                      report.status
                    )}`}
                  >
                    {report.status === 'Pendiente' && <Clock size={12} />}
                    {report.status === 'Resuelto' && <CheckCircle size={12} />}
                    {report.status}
                  </span>
                  
                  {/* Botón de eliminar (solo mis reportes) */}
                  {(tab === 'mios' || report.createdBy === userId) && (
                    <button
                      onClick={(e) => handleDelete(e, report.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar reporte"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <h3 className="font-bold text-gray-900 mb-1 text-sm">{report.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {report.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 border-t border-gray-100 pt-3">
                <div>
                  <div className="text-gray-700 font-medium">📅 {new Date(report.createdAt).toLocaleDateString('es-MX')}</div>
                  <div className="flex items-center gap-1 mt-1">
                    📍 <span className="truncate">{report.colonia}, {report.municipio}</span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="text-gray-600 font-mono text-[10px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                    {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                  </div>
                  <div className="text-sky-600 font-medium text-xs flex items-center gap-1 group-hover:underline">
                    <Map size={12} /> Ver en mapa
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-gray-400 mt-6 mb-4">
        Total: {reports.length} reporte{reports.length !== 1 ? 's' : ''} encontrado{reports.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
