'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Upload } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { syncService } from '@/lib/sync-service';

export function OfflineStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Contar reportes pendientes de sincronizar
  const pendingCount = useLiveQuery(
    () => db.reports.filter((r) => !r.synced).count(),
    []
  ) || 0;

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      // Sincronizar automáticamente cuando se restaura la conexión
      await handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuchar eventos de sincronización
    const handleSyncEvent = () => {
      // Recargar para reflejar cambios
      window.location.reload();
    };
    window.addEventListener('reports-synced', handleSyncEvent as any);

    // Inicializar sincronización
    syncService.setupSyncListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('reports-synced', handleSyncEvent as any);
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncService.syncOfflineReports();
      if (result.synced > 0) {
        alert(`✓ ${result.synced} reporte(s) sincronizado(s)`);
      }
    } catch (error) {
      console.error('Error en sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Ocultar si todo está sincronizado y online
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1">
        <div
          className={`p-2 rounded-full ${
            isOnline && pendingCount === 0
              ? 'bg-green-100 text-green-600'
              : isOnline
                ? 'bg-blue-100 text-blue-600'
                : 'bg-red-100 text-red-600'
          }`}
        >
          {!isOnline ? (
            <WifiOff size={20} />
          ) : pendingCount === 0 ? (
            <CheckCircle2 size={20} />
          ) : (
            <Upload size={20} className={isSyncing ? 'animate-pulse' : ''} />
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-800">
            {!isOnline
              ? 'Modo Sin Conexión'
              : pendingCount > 0
                ? 'Reportes Pendientes'
                : 'Sincronizado'}
          </h4>
          <p className="text-xs text-gray-500">
            {pendingCount > 0
              ? `${pendingCount} reporte${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
              : 'Todo actualizado'}
          </p>
        </div>
      </div>

      {pendingCount > 0 && isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="ml-2 px-3 py-1.5 bg-sky-600 text-white text-xs font-medium rounded-lg hover:bg-sky-700 disabled:opacity-70 flex items-center gap-1"
        >
          {isSyncing ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Upload size={14} />
              Sincronizar
            </>
          )}
        </button>
      )}
    </section>
  );
}
