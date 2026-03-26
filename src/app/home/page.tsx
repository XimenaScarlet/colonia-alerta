import Link from 'next/link';
import { Map, PlusCircle, List, Bell, Navigation, History, Maximize2 } from 'lucide-react';
import { OfflineStatusBadge } from '@/components/OfflineStatusBadge';

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="flex flex-col gap-10 pb-20 px-4 md:px-0">
      {/* Hero Section */}
      <section className="relative h-72 rounded-[2.5rem] overflow-hidden shadow-2xl group active:scale-[0.99] transition-all duration-500 mt-4">
        <img 
          src="/hero-bg.png" 
          alt="Ciudad Satillo y Ramos Arizpe" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="relative z-10 h-full flex flex-col justify-center px-10">
          <h1 className="text-5xl font-extrabold text-white mb-3 tracking-tighter drop-shadow-2xl">
            ¡Hola Ciudadano!
          </h1>
          <p className="text-gray-200 text-sm md:text-base max-w-sm drop-shadow-lg leading-relaxed font-medium">
            Tu participación hace la diferencia en <span className="text-blue-accent font-bold">Saltillo</span> y <span className="text-blue-accent font-bold">Ramos Arizpe</span>. Juntos construimos una comunidad más segura.
          </p>
        </div>
      </section>

      {/* Quick Actions (Acciones Rápidas) */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 px-2">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Reportar */}
          <Link href="/reportar" className="relative bg-card-bg/40 backdrop-blur-sm border border-card-border rounded-3xl p-8 overflow-hidden group hover:border-blue-accent/60 transition-all duration-300 shadow-lg hover:shadow-blue-accent/5">
             <div className="relative z-10">
               <div className="bg-blue-accent/20 text-blue-accent p-3.5 rounded-2xl w-fit mb-6 ring-1 ring-blue-accent/30 shadow-inner">
                 <Bell size={28} strokeWidth={2.5} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Reportar</h3>
               <p className="text-gray-400 text-sm mb-6 leading-snug">Inicia un reporte de incidente en tiempo real para alertar a tus vecinos.</p>
               <span className="text-blue-accent text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                 Comenzar ahora <span className="text-lg">→</span>
               </span>
             </div>
             <Bell size={140} className="absolute -right-8 -bottom-8 text-white/[0.03] group-hover:text-white/[0.08] transition-all duration-500 rotate-12" />
          </Link>

          {/* Card 2: Mapa */}
          <Link href="/mapa" className="relative bg-card-bg/40 backdrop-blur-sm border border-card-border rounded-3xl p-8 overflow-hidden group hover:border-orange-400/60 transition-all duration-300 shadow-lg hover:shadow-orange-400/5">
             <div className="relative z-10">
               <div className="bg-orange-400/20 text-orange-400 p-3.5 rounded-2xl w-fit mb-6 ring-1 ring-orange-400/30 shadow-inner">
                 <Navigation size={28} strokeWidth={2.5} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Mapa</h3>
               <p className="text-gray-400 text-sm mb-6 leading-snug">Visualiza las zonas de alerta activas en tu sector geográfico.</p>
               <span className="text-orange-400 text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                 Explorar zona <span className="text-lg">→</span>
               </span>
             </div>
             <Map size={140} className="absolute -right-8 -bottom-8 text-white/[0.03] group-hover:text-white/[0.08] transition-all duration-500 -rotate-12" />
          </Link>

          {/* Card 3: Mis Reportes */}
          <Link href="/reportes" className="relative bg-card-bg/40 backdrop-blur-sm border border-card-border rounded-3xl p-8 overflow-hidden group hover:border-emerald-400/60 transition-all duration-300 shadow-lg hover:shadow-emerald-400/5">
             <div className="relative z-10">
               <div className="bg-emerald-400/20 text-emerald-400 p-3.5 rounded-2xl w-fit mb-6 ring-1 ring-emerald-400/30 shadow-inner">
                 <List size={28} strokeWidth={2.5} />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">Mis Reportes</h3>
               <p className="text-gray-400 text-sm mb-6 leading-snug">Consulta el estado y seguimiento de las alertas que has generado.</p>
               <span className="text-emerald-400 text-sm font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                 Ver historial <span className="text-lg">→</span>
               </span>
             </div>
             <History size={140} className="absolute -right-8 -bottom-8 text-white/[0.03] group-hover:text-white/[0.08] transition-all duration-500 rotate-6" />
          </Link>
        </div>
      </section>

      {/* Mapa en Vivo */}
      <section className="relative px-1">
        <h2 className="text-2xl font-bold text-white mb-6">Mapa en Vivo</h2>
        <div className="relative h-[28rem] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl group transition-all duration-700 hover:border-blue-accent/20">
          {/* Map Preview Background */}
          <div className="absolute inset-0 bg-[#0d0d0d]">
             <img 
               src="https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/-100.9650,25.4600,12,0/1200x800?access_token=none" 
               alt="Vista Previa Mapa" 
               className="w-full h-full object-cover opacity-60 contrast-[1.1] saturate-[0.8] blur-[1px] group-hover:blur-0 transition-all duration-1000" 
             />
             <div className="absolute inset-0 bg-blue-accent/10 pointer-events-none mix-blend-overlay" />
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent opacity-80" />
          </div>
          
          {/* Overlay Content */}
          <div className="absolute bottom-8 left-8 right-8">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-7 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform translate-y-0 group-hover:-translate-y-2 transition-transform duration-500">
              <div className="flex items-center gap-5">
                <div className="w-3 h-3 bg-blue-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(14,165,233,1)]" />
                <div>
                  <span className="text-[11px] text-blue-accent font-black uppercase tracking-[0.2em] mb-1.5 block opacity-80">Monitoreando Ahora</span>
                  <p className="text-xl font-bold text-white tracking-tight">Saltillo: <span className="text-gray-400 font-medium">Sector Norte</span></p>
                </div>
              </div>
              <button className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-white transition-all duration-300 active:scale-90 border border-white/5">
                <Maximize2 size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <OfflineStatusBadge />
    </div>
  );
}


