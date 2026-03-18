'use client';

import { useEffect } from 'react';
import { syncService } from '@/lib/sync-service';
import { reportStatusService } from '@/lib/report-status-service';
import { notificationService } from '@/lib/api-client';

export function SyncInitializer() {
  useEffect(() => {
    // Inicializar sincronización
    syncService.setupSyncListener();

    // Pedir permisos de notificación
    notificationService.requestPermission().catch(err => {
      console.log('Notificaciones no disponibles:', err);
    });

    // Sincronizar cada 5 minutos
    const syncInterval = setInterval(() => {
      if (navigator.onLine) {
        syncService.syncOfflineReports();
      }
    }, 5 * 60 * 1000);

    // Verificar cambios de estado cada 2 minutos
    const cleanupStatusPolling = reportStatusService.startStatusPolling(2 * 60 * 1000);

    return () => {
      clearInterval(syncInterval);
      cleanupStatusPolling();
    };
  }, []);

  return null;
}
