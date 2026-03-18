'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, MapPin } from 'lucide-react';

export default function SplashScreen() {
  const router = useRouter();
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    // El logo aparece y desaparece durante 3 segundos
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
    }, 2000); // Se desvanece después de 2 segundos

    // Después de 3 segundos totales, ir a home
    const navigationTimer = setTimeout(() => {
      router.push('/home');
    }, 3000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(navigationTimer);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-sky-500 to-sky-600 flex flex-col items-center justify-center text-white z-[100]">
      {/* Logo con animación de aparición y desaparición */}
      <div
        className={`mb-8 relative transition-all duration-1000 ${
          showLogo
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-75'
        }`}
      >
        <div className="animate-pulse-slow">
          <MapPin size={100} strokeWidth={1.5} className="drop-shadow-lg" />
          <AlertTriangle
            size={40}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white fill-sky-500 drop-shadow-lg"
          />
        </div>
      </div>

      {/* Título */}
      <h1
        className={`text-5xl font-bold tracking-tight mb-2 transition-all duration-1000 ${
          showLogo
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95'
        }`}
      >
        Colonia Alerta
      </h1>

      {/* Subtítulo */}
      <p
        className={`text-sky-100 text-lg opacity-90 transition-all duration-1000 ${
          showLogo
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`}
      >
        Reporte Urbano Saltillo-Ramos
      </p>

      {/* Loading indicator */}
      <div className="absolute bottom-16 flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-sky-200 border-t-white rounded-full animate-spin"></div>
        <p className="mt-4 text-sky-100 text-sm">Cargando...</p>
      </div>

      <style jsx>{`
        @keyframes pulse-slow {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
