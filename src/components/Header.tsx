'use client';

import { usePathname } from 'next/navigation';
import { Bell, Download } from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const pathname = usePathname();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
          <button className="p-2 relative rounded-full hover:bg-sky-600 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
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
    </>
  );
}
