'use client';

import { usePathname } from 'next/navigation';
import { Bell, Download, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { reportService, userService } from '@/lib/api-client';

export function Header() {
  const pathname = usePathname();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
    '/estadisticas': 'Estadísticas',
  };

  const title = titles[pathname] || 'Colonia Alerta';

  return (
    <>
      <header className="fixed top-0 w-full bg-sky-500 text-white h-14 flex items-center justify-between px-4 z-50 shadow-md pt-safe">
        <div className="font-semibold text-lg">{title}</div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowInstallGuide(true)}
            className="p-2 rounded-full hover:bg-sky-600 transition-colors"
            title="Instalar app"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={() => {
              if (latestExternalReport) setShowNotificationPopup(!showNotificationPopup);
              setHasNewAlarm(false);
            }}
            className={`p-2 relative rounded-full transition-all duration-300 ${hasNewAlarm ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white shadow-lg shadow-red-500/50' : 'hover:bg-sky-600'}`}
            title="Notificaciones"
          >
            <Bell size={20} className={hasNewAlarm ? 'animate-bounce' : ''} />
            {hasNewAlarm && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-400 border-2 border-white rounded-full animate-ping"></span>
            )}
            {!hasNewAlarm && latestExternalReport && (
               <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* Modal de instrucciones de instalación */}
      {showInstallGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 top-14">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Instala Colonia Alerta</h2>
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-700 mb-2">📱 Celular (Android/iPhone):</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Tap menú <strong>⋮</strong> (arriba a la derecha)</li>
                  <li>Selecciona <strong>"Instalar aplicación"</strong></li>
                  <li>¡Aparecerá en tu home!</li>
                </ol>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold text-gray-700 mb-2">💻 Chrome/Edge/Firefox:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Busca <strong>"+"</strong> en la barra de URL</li>
                  <li>O presiona <strong>Ctrl+Shift+S</strong></li>
                  <li>¡Se abrirá como app!</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-3 rounded">
                <p className="font-semibold text-gray-700 mb-2">🍎 Safari (Mac):</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Menú <strong>"Compartir"</strong></li>
                  <li><strong>"Agregar a Dock"</strong></li>
                  <li>¡Listo!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallGuide(false)}
              className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-lg transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Popup / Dropdown de Notificación (Alarma) */}
      {showNotificationPopup && latestExternalReport && (
        <div className="fixed top-16 right-4 bg-white rounded-xl shadow-2xl p-4 w-72 z-50 border border-red-100 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-red-600 flex items-center gap-1">🚨 Alerta Vecinal</h3>
            <button onClick={() => setShowNotificationPopup(false)} className="text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
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
        </div>
      )}
    </>
  );
}
