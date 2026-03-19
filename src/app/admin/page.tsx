'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { reportService } from '@/lib/api-client';

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
  upvotes: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'Pendiente' | 'En Proceso' | 'Resuelto' | 'todos'>('Pendiente');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  // Validar que sea admin
  useEffect(() => {
    if (status === 'loading') return;

    if (!session || session.user?.role !== 'admin') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  // Cargar reportes
  useEffect(() => {
    if (session?.user?.role !== 'admin') return;

    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await reportService.getReports({ limit: 1000 });
        if (response.success) {
          setReports(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
    // Recargar cada 30 segundos
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.role]);

  const filteredReports = filter === 'todos'
    ? reports
    : reports.filter(r => r.status === filter);

  const changeStatus = async (reportId: string, newStatus: string) => {
    if (changingStatus) return;

    try {
      setChangingStatus(true);
      const response = await reportService.updateReportStatus(reportId, newStatus);

      if (response.success) {
        // Actualizar lista local
        setReports(prev =>
          prev.map(r =>
            r.id === reportId ? { ...r, status: newStatus } : r
          )
        );
        // Cerrar modal
        setSelectedReport(null);
        alert(`✓ Reporte marcado como ${newStatus}`);
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert('Error al cambiar status');
    } finally {
      setChangingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Resuelto':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return <AlertCircle size={16} />;
      case 'En Proceso':
        return <Clock size={16} />;
      case 'Resuelto':
        return <CheckCircle size={16} />;
      default:
        return null;
    }
  };

  if (status === 'loading' || (session?.user?.role === 'admin' && loading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Administración</h1>
        <p className="text-gray-600">Gestiona y actualiza el estado de los reportes</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['Pendiente', 'En Proceso', 'Resuelto', 'todos'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status === 'todos' ? 'Todos' : status}
            {' '}
            <span className="text-sm">
              ({reports.filter(r => status === 'todos' || r.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Lista de reportes */}
      {loading ? (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Cargando reportes...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center bg-yellow-50 rounded-2xl p-8 border border-yellow-200">
          <p className="text-lg font-medium text-gray-600 mb-1">📭 No hay reportes</p>
          <p className="text-sm text-gray-500">No hay reportes con el filtro seleccionado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map(report => (
            <div
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-sky-300 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1">{report.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm font-medium whitespace-nowrap ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                  {report.status}
                </div>
              </div>

              <div className="flex gap-4 text-xs text-gray-600 mb-2">
                <span>📍 {report.colonia}, {report.municipio}</span>
                <span>🏷️ {report.category}</span>
                <span>👍 {report.upvotes}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{new Date(report.createdAt).toLocaleDateString('es-MX')} {new Date(report.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-sky-600 font-medium">Ver más →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/60 z-[500] flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                  {getStatusIcon(selectedReport.status)}
                  {selectedReport.status}
                </span>
              </div>

              <h3 className="font-bold text-lg text-gray-900 mb-2">{selectedReport.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{selectedReport.description}</p>

              <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 mb-4 border border-gray-200">
                <div><strong>📍 Ubicación:</strong> {selectedReport.colonia}, {selectedReport.municipio}</div>
                <div><strong>🏷️ Categoría:</strong> {selectedReport.category}</div>
                <div><strong>📅 Creado:</strong> {new Date(selectedReport.createdAt).toLocaleDateString('es-MX')} {new Date(selectedReport.createdAt).toLocaleTimeString('es-MX')}</div>
                <div><strong>👍 Apoyos:</strong> {selectedReport.upvotes}</div>
                <div><strong>📌 Coordenadas:</strong> {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 block">Cambiar estado a:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Pendiente', 'En Proceso', 'Resuelto'].map(status => (
                    <button
                      key={status}
                      onClick={() => changeStatus(selectedReport.id, status)}
                      disabled={changingStatus || status === selectedReport.status}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        status === selectedReport.status
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-sky-100 text-sky-700 hover:bg-sky-200'
                      }`}
                    >
                      {changingStatus ? '...' : status.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
