'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { CheckCircle, Clock, MapPin, Trash2, Map, WifiOff, CloudOff, X } from 'lucide-react';
import { reportService, userService, notificationService } from '@/lib/api-client';

const MiniMap = dynamic(() => import('@/components/MiniMap'), { 
  ssr: false, 
  loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-sm text-gray-500">Cargando mapa...</div> 
});

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
  upvotes?: number;
  upvotedBy?: string[];
}

export default function ReportesPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<'todos' | 'mios'>('todos');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();
  const [localUserId, setLocalUserId] = useState<string>('');
  const authUserId = session?.user?.id;

  useEffect(() => {
    // Inicializar ID local solo en el cliente para evitar mismatch de hidratación
    setLocalUserId(userService.getUserId());
  }, []);

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
    if (localUserId) {
      loadReports();
    }
    
    // Auto-refresh cada 20 segundos si estamos online
    const interval = setInterval(() => {
      if (navigator.onLine && localUserId) {
        loadReports();
      }
    }, 20000);
    
    return () => clearInterval(interval);
  }, [tab, authUserId, localUserId]);

  const loadReports = async () => {
    if (!localUserId) return;
    setLoading(true);
    try {
      const params = {
        limit: 100,
        ...(tab === 'mios' && { createdBy: authUserId || localUserId }),
      };
      
      console.log('Cargando reportes con params:', params);
      
      let apiReports: Report[] = [];
      let isOnline = navigator.onLine;

      // 1. Intentar cargar desde API si hay conexión
      if (isOnline) {
        try {
          const response = await reportService.getReports(params);
          if (response && response.success) {
            apiReports = Array.isArray(response.data) ? response.data : [];
            
            // --- NUEVO: Guardar reportes del API en caché local (Dexie) para offline ---
            try {
              const { db } = await import('@/lib/db');
              // Mapear reportes del API al esquema local
              const mapToLocal = apiReports.map(r => ({
                // No asignamos ID numérico para que Dexie lo maneje o usemos uno consistente
                // Pero para evitar duplicados, es mejor limpiar y reinsertar o usar bulkPut con una lógica de ID
                title: r.title,
                description: r.description,
                category: r.category,
                municipio: r.municipio,
                colonia: r.colonia,
                lat: r.lat,
                lng: r.lng,
                datetime: r.createdAt,
                status: r.status as any,
                synced: true, // Los que vienen del API ya están sincronizados
                priority: 'Media' as any, // Valor por defecto
                createdBy: r.createdBy
              }));

              // Para no saturar, podemos limpiar los ya sincronizados antes de meter los nuevos del API
              // O simplemente añadir los nuevos. Aquí guardamos los del API como referencia offline.
              // Solo guardamos si no estamos filtrando por "mis reportes" para tener un caché general
              if (tab === 'todos') {
                // Limpiar reportes antiguos sincronizados para mantener caché fresco
                await db.reports.where('synced').equals(true).delete();
                await db.reports.bulkAdd(mapToLocal);
              }
            } catch (cacheError) {
              console.error('Error al cachear reportes:', cacheError);
            }
            // --------------------------------------------------------------------------
          }
        } catch (apiError) {
          console.error('Error al llamar al API:', apiError);
          isOnline = false;
        }
      }

      // 2. Cargar reportes locales desde Dexie (PWA Offline storage)
      let localReports: Report[] = [];
      try {
        const { db } = await import('@/lib/db');
        const offlineReports = await db.reports.toArray();
        localReports = offlineReports.map(r => ({
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
          createdBy: localUserId, // Por simplicidad localUserId identifica al dueño local
          synced: r.synced,
          upvotes: 0,
          upvotedBy: []
        }));

        // Aplicar filtros locales equivalentes a los del API
        if (tab === 'mios') {
          // Ya que localUserId es el dueño local, todos son "míos" en el contexto local si no hay auth
          // Si hay auth, dependemos de si fueron creados con ese ID
          localReports = localReports.filter(r => r.createdBy === localUserId);
        }
      } catch (dbError) {
        console.error('Error al cargar base de datos local:', dbError);
      }

      // 3. Mezclar y de-duplicar
      // Estrategia: Mostrar todos los del API + los locales que NO están sincronizados
      // (Los locales sincronizados ya deberían estar en el API)
      const unsyncedLocal = localReports.filter(r => !r.synced);
      
      // Combinar ambos conjuntos
      const combined = [...apiReports, ...unsyncedLocal];
      
      // Ordenar por fecha descendente
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setReports(combined);

      if (!isOnline && combined.length === 0) {
        notificationService.sendError('Sin Conexión', 'No se pudieron cargar reportes y no hay datos locales.');
      }
    } catch (error) {
      console.error('Error general en loadReports:', error);
      notificationService.sendError('Error', 'Hubo un problema al cargar los reportes');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    setIsDeleting(true);
    try {
      if (navigator.onLine) {
        // Enviar al servidor si estamos online
        await reportService.deleteReport(reportToDelete);
      }
      
      // Eliminar de base local (Dexie) por si acaso de manera silenciosa
      try {
        const { db } = await import('@/lib/db');
        await db.reports.where('id').equals(reportToDelete).delete();
      } catch (e) {}

      // Actualizar UI
      setReports(prev => prev.filter(r => r.id !== reportToDelete));
      notificationService.send('✅ Reporte Eliminado', { body: 'El reporte se borró exitosamente' });
    } catch (error) {
      console.error('Error al eliminar', error);
      alert('Hubo un problema al intentar eliminar el reporte.');
    } finally {
      setIsDeleting(false);
      setReportToDelete(null);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setReportToDelete(id);
  };

  const handleUpvote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    // Validar si es local (offline) que no intente apoyarlo si aún no sube
    const report = reports.find(r => r.id === id);
    if (!navigator.onLine || report?.synced === false) {
      notificationService.sendError('Sin Conexión', 'Necesitas internet para respaldar este reporte.');
      return;
    }
    
    // Actualización optimista UI
    setReports(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          upvotes: (r.upvotes || 0) + 1,
          upvotedBy: [...(r.upvotedBy || []), authUserId || localUserId]
        };
      }
      return r;
    }));

    try {
      const response = await reportService.upvoteReport(id, localUserId);
      if (!response.success) {
        throw new Error(response.error);
      }
    } catch (error) {
      // Revertir optimismo
      setReports(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            upvotes: Math.max((r.upvotes || 0) - 1, 0),
            upvotedBy: (r.upvotedBy || []).filter(u => u !== (authUserId || localUserId))
          };
        }
        return r;
      }));
      alert('Error: ' + (error as Error).message);
    }
  };

  const handleCardClick = (report: Report) => {
    setSelectedReport(report);
  };

  const getWhatsAppUrl = (report: Report) => {
    const text = `🚨 ¡Atención vecinos! Acabo de reportar un/a ${report.category} en ${report.colonia}, ${report.municipio}. Manténganse alerta. Ver más: https://colonia-alerta.vercel.app/mapa?lat=${report.lat}&lng=${report.lng}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
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
          Mis Reportes ({reports.filter(r => r.createdBy === authUserId || r.createdBy === localUserId).length})
        </button>
      </div>

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
            Sé el primero en reportar
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
                  {(tab === 'mios' || report.createdBy === authUserId || report.createdBy === localUserId) && (
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
                  
                  <div className="flex gap-2">
                    {/* Solo mostrar botón de like si no es tu reporte */}
                    {report.createdBy !== authUserId && report.createdBy !== localUserId ? (
                      <button 
                        onClick={(e) => handleUpvote(e, report.id)}
                        disabled={report.upvotedBy?.includes(authUserId || localUserId)}
                        className="text-emerald-600 font-medium text-xs flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded transition disabled:opacity-50 disabled:grayscale"
                        title="Respaldar problema"
                      >
                        👍 {report.upvotes || 0}
                      </button>
                    ) : (
                      /* Mostrar solo contador si es tu reporte */
                      <div className="text-emerald-600 font-medium text-xs flex items-center gap-1 px-2 py-1">
                        👍 {report.upvotes || 0}
                      </div>
                    )}
                    <div className="text-sky-600 font-medium text-xs flex items-center gap-1 group-hover:underline py-1">
                      <Map size={12} /> Ver
                    </div>
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

      {/* Modal Popup */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 z-[500] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedReport(null)}
              className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full text-gray-600 hover:bg-gray-100 z-10"
            >
              <X size={20} />
            </button>
            
            <div className="h-48 w-full relative bg-gray-200">
              <MiniMap lat={selectedReport.lat} lng={selectedReport.lng} />
            </div>
            
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-sky-100 text-sky-700">
                  {getCategoryLabel(selectedReport.category)}
                </span>
                <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${getStatusColor(selectedReport.status)}`}>
                  {selectedReport.status}
                </span>
              </div>
              
              <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                {selectedReport.title}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {selectedReport.description}
              </p>
              
              <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-2 border border-gray-100 mb-4">
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5" />
                  <span className="text-gray-600">{selectedReport.colonia}, {selectedReport.municipio}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-gray-600">Fecha: {new Date(selectedReport.createdAt).toLocaleDateString('es-MX')}</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                {/* Solo mostrar botón de respaldar si no es tu reporte */}
                {selectedReport.createdBy !== authUserId && selectedReport.createdBy !== localUserId ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpvote(e as any, selectedReport.id);
                      setSelectedReport({
                        ...selectedReport,
                        upvotes: (selectedReport.upvotes || 0) + 1,
                        upvotedBy: [...(selectedReport.upvotedBy || []), authUserId || localUserId]
                      });
                    }}
                    disabled={selectedReport.upvotedBy?.includes(authUserId || localUserId)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    👍 Respaldar ({selectedReport.upvotes || 0})
                  </button>
                ) : (
                  /* Solo mostrar contador si es tu reporte */
                  <div className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center gap-2">
                    👍 Apoyos recibidos: {selectedReport.upvotes || 0}
                  </div>
                )}
                
                <a 
                  href={getWhatsAppUrl(selectedReport)}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600 transition-colors shadow-md shadow-green-200 flex items-center justify-center gap-2"
                >
                  📱 Compartir
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <div className="fixed inset-0 bg-black/40 z-[600] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setReportToDelete(null)}>
          <div className="bg-gradient-to-b from-sky-50 to-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border-2 border-sky-100" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                <Trash2 size={28} />
              </div>
              <h3 className="text-xl font-bold text-sky-950 mb-2">¿Eliminar reporte?</h3>
              <p className="text-sky-700/80 text-sm mb-6">
                Esta acción borrará el reporte para siempre y no podrá deshacerse.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setReportToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-sky-600 bg-sky-50 hover:bg-sky-100 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-md shadow-sky-200 flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isDeleting ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Borrando...</>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
