'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { reportService, userService } from '@/lib/api-client';
import { MoreVertical, Edit, Trash2, Share2, ThumbsUp } from 'lucide-react';
import { useSession } from 'next-auth/react';

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
  upvotes?: number;
  upvotedBy?: string[];
}

// Crear iconos por categoría
const getCategoryIcon = (category: string) => {
  const categoryIcons: Record<string, { color: string; emoji: string }> = {
    'Bache': { color: '#dc2626', emoji: '🕳️' },
    'Luminaria Dañada': { color: '#f59e0b', emoji: '💡' },
    'Basura Acumulada': { color: '#8b5cf6', emoji: '🗑️' },
    'Fuga de Agua': { color: '#3b82f6', emoji: '💧' },
    'Inseguridad': { color: '#ef4444', emoji: '⚠️' },
    'Otro': { color: '#6b7280', emoji: '📍' },
  };

  const config = categoryIcons[category] || categoryIcons['Otro'];

  return L.icon({
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 41">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 8.84 16 25 16 25s16-16.16 16-25c0-8.84-7.16-16-16-16z" fill="${config.color}"/>
        <text x="16" y="18" font-size="20" text-anchor="middle" dominant-baseline="middle">${config.emoji}</text>
      </svg>`
    )}`,
    iconSize: [32, 41],
    iconAnchor: [16, 41],
    popupAnchor: [0, -41],
  });
};

// Componente para rastrear geolocalización
function LocationMarker() {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on('locationfound', function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
    });
  }, [map]);

  return position === null ? null : (
    <Marker
      position={position}
      icon={L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })}
    >
      <Popup>
        <div className="text-center text-xs">
          <strong>Tu ubicación</strong>
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapComponent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  
  const localUserId = userService.getUserId();
  const authUserId = session?.user?.id;
  
  const targetLat = searchParams.get('lat');
  const targetLng = searchParams.get('lng');

  useEffect(() => {
    loadReports();
    // Recargar reportes cada 30 segundos
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadReports = async () => {
    try {
      const response = await reportService.getReports({ limit: 200 });
      if (response && response.success) {
        setReports(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error('Respuesta inválida');
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading reports for map:', error);
      
      // Fallback a Dexie si estamos offline o falla la API
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
          createdBy: localUserId,
          upvotes: 0,
          upvotedBy: []
        }));
        setReports(formattedLocal);
      } catch (dbError) {
        setReports([]);
      }
      setLoading(false);
    }
  };

  // Coordenadas centrales: si viene de un reporte enfocarlo, si no visión general
  const centerPosition: [number, number] = targetLat && targetLng 
    ? [parseFloat(targetLat), parseFloat(targetLng)] 
    : [25.4600, -100.9650];
  
  // Nivel de zoom: 16 (muy cerca) para un reporte específico, 12 para ciudad general
  const initialZoom = targetLat ? 16 : 12;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-orange-100 text-orange-800';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Resuelto':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full w-full relative z-0">
      {loading && (
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md z-[401] text-sm text-gray-600">
          Cargando reportes...
        </div>
      )}
      
      <MapContainer
        center={centerPosition}
        zoom={initialZoom}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />

        {/* Marcadores de reportes agrupados en burbujas */}
        <MarkerClusterGroup chunkedLoading>
          {reports.map((report) => (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={getCategoryIcon(report.category)}
            >
              <Popup className="report-popup">
                <div className="w-56 text-sm">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 flex-1">{report.title}</h3>
                    <button
                      onClick={() => setExpandedMenuId(expandedMenuId === report.id ? null : report.id)}
                      className="p-1 hover:bg-gray-100 rounded transition"
                      title="Más opciones"
                    >
                      <MoreVertical size={16} className="text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="space-y-1 mb-2 border-b pb-2">
                    <div className="text-xs text-gray-600">
                      <strong>Categoría:</strong> {report.category}
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Ubicación:</strong> {report.colonia}, {report.municipio}
                    </div>
                    <div className="text-xs text-gray-600">
                      <strong>Fecha:</strong>{' '}
                      {new Date(report.createdAt).toLocaleDateString('es-MX')}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                    {report.description}
                  </p>

                  <div className="flex gap-2 mb-2">
                    <div className={`flex-1 text-xs font-medium px-2 py-1 rounded text-center ${getStatusBadgeColor(
                      report.status
                    )}`}>
                      {report.status}
                    </div>
                    {/* Mostrar contador de likes */}
                    <div className="flex-1 text-xs font-medium px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-center flex items-center justify-center gap-1">
                      <ThumbsUp size={12} /> {report.upvotes || 0}
                    </div>
                  </div>

                  {/* Menú de opciones */}
                  {expandedMenuId === report.id && (
                    <div className="bg-gray-50 border-t pt-2 mt-2 space-y-2">
                      {report.createdBy === authUserId && (
                        <>
                          <button
                            onClick={() => {
                              router.push(`/reportar?edit=${report.id}`);
                              setExpandedMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded hover:bg-blue-50 transition"
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('¿Eliminar este reporte?')) {
                                try {
                                  await reportService.deleteReport(report.id);
                                  setReports(prev => prev.filter(r => r.id !== report.id));
                                  setExpandedMenuId(null);
                                } catch (error) {
                                  alert('Error al eliminar');
                                }
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition"
                          >
                            <Trash2 size={14} /> Eliminar
                          </button>
                        </>
                      )}
                      
                      {report.createdBy !== authUserId && report.createdBy !== localUserId && (
                        <button
                          onClick={async () => {
                            try {
                              await reportService.upvoteReport(report.id, localUserId);
                              setReports(prev => prev.map(r => 
                                r.id === report.id 
                                  ? { ...r, upvotes: (r.upvotes || 0) + 1, upvotedBy: [...(r.upvotedBy || []), localUserId] }
                                  : r
                              ));
                              setExpandedMenuId(null);
                            } catch (error) {
                              alert('Error al respaldar');
                            }
                          }}
                          disabled={report.upvotedBy?.includes(authUserId || localUserId)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-white border border-emerald-200 text-emerald-600 rounded hover:bg-emerald-50 transition disabled:opacity-50"
                        >
                          <ThumbsUp size={14} /> Respaldar
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          const text = `🚨 ${report.title} en ${report.colonia}, ${report.municipio}. Ver: https://colonia-alerta.vercel.app/mapa?lat=${report.lat}&lng=${report.lng}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          setExpandedMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs bg-white border border-green-200 text-green-600 rounded hover:bg-green-50 transition"
                      >
                        <Share2 size={14} /> Compartir
                      </button>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
