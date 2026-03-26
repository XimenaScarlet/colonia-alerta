'use client';

import { usePathname } from 'next/navigation';
import { Bell, Download, X, Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { reportService, userService } from '@/lib/api-client';

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Sistema de Notificaciones / Alarma
  const [hasNewAlarm, setHasNewAlarm] = useState(false);
  const [latestExternalReport, setLatestExternalReport] = useState<any>(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  
  const userId = userService.getUserId();

  useEffect(() => {
    let lastKnownId: string | null = null;
    
    // Polling cada 15 segundos simulando "WebSockets" para alertas en tiempo real
    const interval = setInterval(async () => {
      try {
        if (!navigator.onLine) return; // Si no hay internet, no consultar
        
        const res = await reportService.getReports({ limit: 1 });
        if (res && res.success && res.data.length > 0) {
          const newest = res.data[0];
          
          if (!lastKnownId) {
            lastKnownId = newest.id; // Carga inicial
            return;
          }
          
          // Si el ID es diferente y el reporte NO fue creado por ti
          if (newest.id !== lastKnownId && newest.createdBy !== userId) {
            lastKnownId = newest.id;
            setLatestExternalReport(newest);
            setHasNewAlarm(true);
            
            // Efectos del dispositivo
            if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🚨 Alerta Vecinal Cerca de Ti', { 
                body: `${newest.category} reportado en ${newest.colonia}, ${newest.municipio}` 
              });
            }
          }
        }
      } catch (e) {
        // Ignorar errores silenciosos de polling
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [userId]);

  if (pathname === '/') return null;

  const titles: Record<string, string> = {
    '/home': 'Colonia Alerta',
    '/mapa': 'Mapa de Incidencias',
    '/reportar': 'Nuevo Reporte',
    '/mis-reportes': 'Mis Reportes',
    '/admin': 'Panel de Administración',
  };

  const title = titles[pathname] || 'Colonia Alerta';

  return (
    <>
      <header className="fixed top-0 w-full bg-background/80 backdrop-blur-md text-foreground h-16 flex items-center justify-between px-6 z-50 pt-safe transition-all duration-300">
        <div className="font-bold text-xl text-blue-accent tracking-tight">Colonia Alerta</div>
        <div className="flex items-center gap-4">
          {session?.user?.role === 'admin' && (
            <Link 
              href="/admin"
              className="p-2 rounded-full hover:bg-card-bg transition-colors text-gray-400 hover:text-white"
              title="Panel Admin"
            >
              <Settings size={20} />
            </Link>
          )}
          <button 
            onClick={() => {
              setShowNotificationPopup(!showNotificationPopup);
              setHasNewAlarm(false);
            }}
            className={`p-2 relative rounded-xl transition-all duration-300 ${hasNewAlarm ? 'bg-red-500 text-white shadow-lg shadow-red-500/50' : 'bg-card-bg text-gray-400 hover:text-white'}`}
            title="Notificaciones"
          >
            <Bell size={20} className={hasNewAlarm ? 'animate-bounce' : ''} />
            {hasNewAlarm && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-white border-2 border-red-500 rounded-full"></span>
            )}
            {!hasNewAlarm && latestExternalReport && (
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-accent rounded-full"></span>
            )}
          </button>
          
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-card-border bg-gradient-to-br from-orange-400 to-red-500 p-0.5 shadow-sm active:scale-95 transition-transform cursor-pointer">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center text-lg">
              {session?.user?.image ? (
                <img src={session.user.image} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                "👤"
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Popup / Dropdown de Notificación (Alarma) */}
      {showNotificationPopup && (
        <div className="fixed top-16 right-4 bg-white rounded-xl shadow-2xl p-4 w-72 z-50 border border-sky-100 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className={`font-bold flex items-center gap-1 ${latestExternalReport ? 'text-red-600' : 'text-sky-600'}`}>
              {latestExternalReport ? '🚨 Alerta Vecinal' : '🔔 Notificaciones'}
            </h3>
            <button onClick={() => setShowNotificationPopup(false)} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          
          {latestExternalReport ? (
            <>
              <p className="text-sm font-semibold text-gray-800 mb-1">{latestExternalReport.category}</p>
              <p className="text-xs text-gray-600 mb-3">
                Alguien acaba de advertir un problema cerca en <strong>{latestExternalReport.colonia}, {latestExternalReport.municipio}</strong>.
              </p>
              
              <div className="flex gap-2">
                <button onClick={() => setShowNotificationPopup(false)} className="flex-1 text-xs bg-gray-50 text-gray-600 font-medium py-2 rounded-lg border border-gray-200 hover:bg-gray-100">
                  Cerrar
                </button>
                <a href="/mapa" className="flex-1 text-xs text-center bg-red-50 text-red-600 font-medium py-2 rounded-lg border border-red-100 hover:bg-red-100">
                  Ver Mapa
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600">
                Aquí te aparecerán las notificaciones de tus reportes y alertas cercanas.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
