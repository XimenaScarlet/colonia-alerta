"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { notificationService } from "@/lib/api-client";

export function CreateReportButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [showLoginHint, setShowLoginHint] = useState(false);
  const [pulse, setPulse] = useState(false);

  // Animar el botón cada 3 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    if (!session) {
      // Solicitar permiso de notificaciones
      notificationService.requestPermission();
      
      // Mostrar hint de login
      setShowLoginHint(true);
      notificationService.send("Inicia sesión para reportar", {
        body: "Crea una cuenta en Colonia Alerta para reportar problemas",
        tag: "login-reminder",
      });
      
      setTimeout(() => {
        router.push("/auth/login?callbackUrl=/reportar");
      }, 1500);
    } else {
      // Notificar que se abre formulario
      notificationService.send("Abriendo formulario de reporte", {
        body: "Completa los detalles y tu ubicación",
        tag: "open-form",
      });
      
      // Ir directamente a crear reporte
      router.push("/reportar");
    }
  };

  if (router && typeof window !== 'undefined') {
    const pathname = window.location.pathname;
    if (pathname === '/reportar' || pathname.startsWith('/auth')) {
      return null; // El botón "más" no debe salir si ya estás reportando o iniciando sesión
    }
  }

  return (
    <>
      {/* Botón flotante mejorado */}
      <button
        onClick={handleClick}
        className={`fixed bottom-24 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white flex items-center justify-center shadow-2xl hover:shadow-2xl transition-all z-40 active:scale-95 border-2 border-emerald-300 ${
          pulse ? "animate-bounce" : ""
        }`}
        title={session ? "Crear reporte urgente" : "Inicia sesión para crear reporte"}
      >
        <div className="flex items-center justify-center">
          <Plus size={28} className="font-bold" strokeWidth={3} />
        </div>
      </button>

      {/* Badge de actividad */}
      <div className="fixed bottom-32 right-8 w-3 h-3 bg-emerald-500 rounded-full animate-pulse z-40"></div>

      {/* Tooltip */}
      {!session && !showLoginHint && (
        <div className="fixed bottom-40 right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-3 max-w-xs z-40 animation-slideUp">
          <div className="flex items-center gap-2">
            <FileText size={16} />
            <div>
              <p className="text-sm font-semibold">¿Encontraste un problema?</p>
              <p className="text-xs mt-1 opacity-90">Reporta bachés, luminarias, basura...</p>
            </div>
          </div>
        </div>
      )}

      {/* Hint de login */}
      {showLoginHint && (
        <div className="fixed bottom-32 right-6 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40 animation-fadeIn border-l-4 border-blue-500">
          <p className="text-sm text-gray-800 font-medium">
            🔐 Por favor inicia sesión para crear un reporte
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Redirigiendo al login...
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animation-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .animation-slideUp {
          animation: slideUp 0.3s ease-in-out;
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }
        .animate-bounce {
          animation: bounce 0.6s ease-in-out;
        }
      `}</style>
    </>
  );
}
