'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone, Laptop } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detectar si es móvil
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();

    // Escuchar el evento beforeinstallprompt para móviles
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    // listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt?.();
    const { outcome } = await deferredPrompt.userChoice || {};

    if (outcome === 'accepted') {
      console.log('✅ PWA instalada exitosamente');
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  // Mostrar banner de desktop si no es mobile
  if (!showPrompt && !isMobile && !showDesktopGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-lg shadow-lg p-4 z-40 animate-bounce">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5" />
            <div>
              <p className="font-semibold">Instala Colonia Alerta</p>
              <p className="text-sm opacity-90">Como una aplicación en tu computadora</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDesktopGuide(true)}
              className="bg-white text-sky-600 px-3 py-1 rounded font-semibold hover:bg-gray-100 transition"
            >
              Ver instrucciones
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modal de instrucciones para desktop
  if (showDesktopGuide && !isMobile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Laptop className="w-6 h-6 text-sky-500" />
              <h2 className="text-xl font-bold">Instala en tu Laptop</h2>
            </div>
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-semibold text-gray-700 mb-2">✨ Chrome / Edge:</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Busca el icono <strong>"+"</strong> en la barra de direcciones</li>
                <li>Haz clic en <strong>"Instalar"</strong></li>
                <li>¡Listo! Se abrirá como aplicación</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-3 rounded">
              <p className="font-semibold text-gray-700 mb-2">🍎 Safari (Mac):</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Menú <strong>"Compartir"</strong> (arriba a la derecha)</li>
                <li>Selecciona <strong>"Agregar a Dock"</strong></li>
                <li>¡Listo! Se agregará a tu Dock</li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => setShowDesktopGuide(false)}
            className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 rounded-lg transition"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // Prompt para móviles
  if (showPrompt && isMobile && deferredPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-sky-500" />
              <h2 className="text-xl font-bold">Instala Colonia Alerta</h2>
            </div>
            <button
              onClick={() => {
                setShowPrompt(false);
                setDeferredPrompt(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Accede a Colonia Alerta como una aplicación nativa. Funciona offline y con acceso a GPS y cámara.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleInstall}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              Instalar Ahora
            </button>
            <button
              onClick={() => {
                setShowPrompt(false);
                setDeferredPrompt(null);
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
            >
              Más tarde
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            Se instala como una app separada. No ocupa mucho espacio.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
