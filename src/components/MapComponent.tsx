'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
        }));
        setReports(formattedLocal);
      } catch (dbError) {
        setReports([]);
      }
      setLoading(false);
    }
  };

  // Coordenadas centrales entre Saltillo y Ramos Arizpe
  const centerPosition: [number, number] = [25.4600, -100.9650];

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
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />

        {/* Marcadores de reportes */}
        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.lat, report.lng]}
            icon={getCategoryIcon(report.category)}
          >
            <Popup className="report-popup">
              <div className="w-48 text-sm">
                <h3 className="font-bold text-gray-900 mb-1">{report.title}</h3>
                
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

                <div className={`text-xs font-medium px-2 py-1 rounded text-center ${getStatusBadgeColor(
                  report.status
                )}`}>
                  {report.status}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
