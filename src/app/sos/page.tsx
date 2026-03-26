'use client';

import { Asterisk, Phone, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SOSPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
      <div className="w-24 h-24 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] mb-8 animate-pulse">
        <Asterisk size={48} strokeWidth={3} />
      </div>
      
      <h1 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Emergencia S.O.S.</h1>
      <p className="text-gray-400 mb-10 max-w-xs">
        Este servicio está en desarrollo. En caso de una emergencia real, por favor contacta directamente a las autoridades.
      </p>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <a href="tel:911" className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl p-5 flex items-center justify-between hover:bg-red-500/20 transition-all active:scale-95">
          <div className="flex items-center gap-4">
            <Phone size={24} />
            <span className="font-bold">Llamar al 911</span>
          </div>
          <span className="text-xl">→</span>
        </a>
        
        <Link href="/reportar" className="bg-card-bg border border-card-border text-white rounded-2xl p-5 flex items-center justify-between hover:bg-card-bg/80 transition-all active:scale-95">
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} className="text-orange-400" />
            <span className="font-bold">Crear Reporte</span>
          </div>
          <span className="text-xl">→</span>
        </Link>
      </div>

      <div className="mt-12 p-4 bg-blue-accent/5 border border-blue-accent/10 rounded-2xl flex items-center gap-3 text-blue-accent text-xs font-medium">
        <ShieldCheck size={18} />
        Colonia Alerta protege tu seguridad
      </div>
    </div>
  );
}
