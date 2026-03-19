'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Download, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt?: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Solo mostrar en /home
  if (pathname !== '/home') return null;

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
      if (isMobileDevice) {
        // En móvil, mostrar después de 4.5 segundos (después del splash)
        setTimeout(() => setShowMobilePrompt(true), 4500);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (!mounted) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt?.();
      await deferredPrompt.userChoice;
      setShowMobilePrompt(false);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
    setDeferredPrompt(null);
  };

  // Solo mostrar en móvil y si hay prompt disponible
  if (!isMobile || !showMobilePrompt) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-sky-500" />
            <h2 className="text-lg font-bold">Instala la App</h2>
          </div>
          <button
            onClick={() => setShowMobilePrompt(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          Accede más rápido. Funciona offline con GPS y cámara.
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
            onClick={() => setShowMobilePrompt(false)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 rounded-lg transition"
          >
            Más tarde
          </button>
        </div>
      </div>
    </div>
  );
}
