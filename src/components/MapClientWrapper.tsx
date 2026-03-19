"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Cargar el mapa dinámicamente porque usa APIs del navegador no disponibles en servidor (Window/Document)
const MapComponent = dynamic(
  () => import('@/components/MapComponent'),
  { ssr: false }
);

export function MapClientWrapper() {
  return (
    <Suspense fallback={<div>Cargando mapa...</div>}>
      <MapComponent />
    </Suspense>
  );
}
