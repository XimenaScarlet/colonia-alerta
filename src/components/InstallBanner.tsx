'use client';

import { useEffect, useState } from 'react';
import { X, Download, Smartphone, Laptop } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detectar móvil
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|(blackberry)|iemobile|opera mini/i.test(userAgent);
    setIsMobile(isMobileDevice);

    // Escuchar beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Mostrar banner después de 4.5 segundos (después del splash)
    const timer = setTimeout(() => setShowBanner(true), 4500);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt?.();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult?.outcome === 'accepted') {
        setShowBanner(false);
      }
    } catch (error) {
      console.error('Error installing:', error);
    }
  };

  if (!mounted || !showBanner) return null;

  // MODAL con instrucciones
  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Download className="w-6 h-6 text-sky-500" />
              Instala Colonia Alerta
            </h2>
            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Celular (Android/iPhone)
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Tap menú <strong>⋮</strong> (arriba a la derecha)</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong></li>
                <li>¡Aparecerá en tu home!</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Laptop className="w-5 h-5" />
                Laptop (Chrome/Edge/Firefox)
              </p>
              <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
                <li>Busca <strong>"+"</strong> en la barra de URL</li>
                <li>O presiona <strong>Ctrl+Shift+S</strong></li>
                <li>¡Se abrirá como app!</li>
              </ol>
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <p className="font-semibold text-amber-900 mb-2">🍎 Mac Safari</p>
              <ol className="text-sm text-amber-800 space-y-1 list-decimal list-inside">
                <li>Menú <strong>"Compartir"</strong></li>
                <li><strong>"Agregar a Dock"</strong></li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => setShowModal(false)}
            className="mt-6 w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-lg transition"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // BANNER GRANDE Y VISIBLE
  return (
    <div className="bg-gradient-to-r from-sky-500 via-sky-400 to-cyan-400 text-white rounded-xl p-5 shadow-xl mb-6 border-2 border-white/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
            <Download className="w-5 h-5" />
            ¡Instala la App!
          </h3>
          <p className="text-sm text-white/90 mb-4">
            Acceso rápido, funciona sin internet, con GPS y cámara.
          </p>
          <div className="flex gap-2">
            {isMobile && deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="bg-white text-sky-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Instalar Ahora
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="bg-white text-sky-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Ver Instrucciones
              </button>
            )}
            <button
              onClick={() => setShowBanner(false)}
              className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-semibold transition"
            >
              Más Tarde
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-white hover:bg-white/20 p-1 rounded transition flex-shrink-0"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
