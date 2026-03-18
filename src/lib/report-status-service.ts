// Servicio para verificar cambios de estado de reportes y enviar notificaciones
import { reportService, userService, notificationService } from './api-client';

export const reportStatusService = {
  // Almacenar estados previos en localStorage
  getStoredReportStatuses(): Record<string, string> {
    const stored = localStorage.getItem('reportStatuses');
    return stored ? JSON.parse(stored) : {};
  },

  setStoredReportStatuses(statuses: Record<string, string>) {
    localStorage.setItem('reportStatuses', JSON.stringify(statuses));
  },

  // Verificar cambios de estado
  async checkForStatusChanges() {
    try {
      const userId = userService.getUserId();
      if (!userId || userId === 'anonymous') return;

      // Obtener reportes del usuario
      const response = await reportService.getReports({
        createdBy: userId,
        limit: 50,
      });

      if (!response.success || !response.data) return;

      const currentStatuses: Record<string, string> = {};
      const storedStatuses = this.getStoredReportStatuses();
      const changedReports: Array<{
        id: string;
        title: string;
        oldStatus: string;
        newStatus: string;
      }> = [];

      // Buscar cambios de estado
      for (const report of response.data) {
        currentStatuses[report.id] = report.status;

        const oldStatus = storedStatuses[report.id];
        if (oldStatus && oldStatus !== report.status) {
          changedReports.push({
            id: report.id,
            title: report.title,
            oldStatus,
            newStatus: report.status,
          });
        }
      }

      // Guardar estados actuales
      this.setStoredReportStatuses(currentStatuses);

      // Enviar notificaciones para cambios detectados
      for (const change of changedReports) {
        notificationService.sendStatusChange(change.title, change.newStatus);
      }

      return changedReports;
    } catch (error) {
      console.error('Error checking report status changes:', error);
    }
  },

  // Iniciar polling de cambios de estado
  startStatusPolling(intervalMs: number = 2 * 60 * 1000) {
    // Primero, verificar inmediatamente
    this.checkForStatusChanges().catch(console.error);

    // Luego, establecer intervalo
    const pollInterval = setInterval(async () => {
      if (navigator.onLine) {
        this.checkForStatusChanges().catch(console.error);
      }
    }, intervalMs);

    return () => clearInterval(pollInterval);
  },

  // Limpiar estado almacenado
  clearStoredStatuses() {
    localStorage.removeItem('reportStatuses');
  },
};
