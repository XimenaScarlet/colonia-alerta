"use client";

import { WifiOff, MapPin } from 'lucide-react';

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="mb-8 relative scale-110">
        <div className="bg-sky-500 p-6 rounded-3xl shadow-lg shadow-sky-500/20">
          <MapPin size={64} fill="white" className="text-white" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold mb-2">No tienes conexión</h1>
      
      <div className="flex items-center justify-center gap-2 text-slate-400 mb-8">
        <WifiOff size={20} />
      </div>

      <p className="text-slate-400 max-w-xs mb-10 leading-relaxed">
        Parece que no hay internet. Puedes seguir registrando incidencias y se enviarán cuando recuperes la señal.
      </p>

      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-all active:scale-95 shadow-lg shadow-sky-900/20"
      >
        Reintentar
      </button>
    </main>
  );
}
