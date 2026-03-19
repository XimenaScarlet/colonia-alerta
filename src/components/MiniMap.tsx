'use client';

import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

const defaultIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

export default function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  // Solución para problema de carga inicial de mapas en modales
  useEffect(() => {
    // Forzar re-render de tile layer despues de 100ms para asegurar dimensiones
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <MapContainer center={[lat, lng]} zoom={16} className="h-full w-full z-0" zoomControl={false} dragging={false} scrollWheelZoom={false}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={defaultIcon} />
    </MapContainer>
  );
}
