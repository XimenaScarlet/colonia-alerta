import { MapClientWrapper } from '@/components/MapClientWrapper';

export default function MapPage() {
  return (
    <div className="h-[calc(100vh-7.5rem)] w-full relative">
      <MapClientWrapper />
      
      {/* Botón flotante para crear reporte en la ubicación actual */}
      <div className="absolute bottom-6 right-4 z-[400]">
        <button className="bg-sky-600 text-white p-4 rounded-full shadow-lg hover:bg-sky-500 transition-colors flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
    </div>
  );
}
