// Servicio para sincronizar reportes entre Dexie (cliente) y Prisma (servidor)
import { db } from './db';
import { reportService } from './api-client';

export const syncService = {
  // Sincronizar reportes no sincronizados
  async syncOfflineReports() {
    try {
      // Buscar reportes no sincronizados
      const unsyncedReports = await db.reports.filter((r) => !r.synced).toArray();
      
      if (unsyncedReports.length === 0) {
        return { success: true, synced: 0 };
      }

      let syncedCount = 0;
      const errors: any[] = [];

      for (const report of unsyncedReports) {
        try {
          // Intentar sincronizar este reporte
          const response = await reportService.createReport({
            title: report.title,
            description: report.description,
            category: report.category,
            municipio: report.municipio,
            colonia: report.colonia,
            lat: report.lat,
            lng: report.lng,
            priority: report.priority,
            photoB64: report.photoUrl,
          });

          if (response.success) {
            // Marcar como sincronizado
            await db.reports.update(report.id!, { synced: true });
            syncedCount++;
          } else {
            errors.push({
              reportId: report.id,
              error: response.error,
            });
          }
        } catch (error) {
          errors.push({
            reportId: report.id,
            error: String(error),
          });
        }
      }

      return {
        success: errors.length === 0,
        synced: syncedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      console.error('Error syncing reports:', error);
      return {
        success: false,
        synced: 0,
        error: String(error),
      };
    }
  },

  // Monitorear cambios de conexión
  setupSyncListener() {
    if (typeof window === 'undefined') return;

    const syncOnOnline = () => {
      console.log('Conexión restaurada, esperando 3 segundos a que se estabilice el internet...');
      
      setTimeout(async () => {
        const result = await this.syncOfflineReports();
        if (result.synced > 0) {
          console.log(`${result.synced} reportes sincronizados exitosamente`);
          // Emitir evento para que componentes se actualicen
          window.dispatchEvent(
            new CustomEvent('reports-synced', { detail: { synced: result.synced } })
          );
        } else if (result.errors) {
          console.error('La sincronización falló para algunos reportes:', result.errors);
        } else {
          console.log('No había reportes pendientes o nada que sincronizar.');
        }
      }, 3000); // 3 segundos de gracia
    };

    // Escuchar cambios de conectividad
    window.addEventListener('online', syncOnOnline);
    window.addEventListener('offline', () => {
      console.log('Se perdió la conexión a internet');
    });

    // Sincronizar al inicio si hay conexión
    if (navigator.onLine) {
      setTimeout(syncOnOnline, 2000);
    }

    return () => {
      window.removeEventListener('online', syncOnOnline);
      window.removeEventListener('offline', () => {});
    };
  },

  // Obtener estado de sincronización
  async getSyncStatus() {
    try {
      const unsyncedCount = await db.reports.filter((r) => !r.synced).count();
      return {
        isSynced: unsyncedCount === 0,
        pendingSync: unsyncedCount,
      };
    } catch (error) {
      return {
        isSynced: true,
        pendingSync: 0,
      };
    }
  },
};
