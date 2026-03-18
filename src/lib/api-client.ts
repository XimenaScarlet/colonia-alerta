// Servicio para comunicarse con los API endpoints
export const reportService = {
  // Obtener lista de reportes con filtros
  async getReports(filters?: {
    limit?: number;
    offset?: number;
    category?: string;
    status?: string;
    municipio?: string;
    colonia?: string;
    createdBy?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.municipio) params.append('municipio', filters.municipio);
    if (filters?.colonia) params.append('colonia', filters.colonia);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);

    const response = await fetch(`/api/reports?${params.toString()}`);
    return response.json();
  },

  // Crear un nuevo reporte
  async createReport(data: {
    title: string;
    description: string;
    category: string;
    municipio: string;
    colonia: string;
    lat: number;
    lng: number;
    priority?: string;
    photoB64?: string;
  }) {
    const response = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Obtener un reporte por ID
  async getReport(id: string) {
    const response = await fetch(`/api/reports/${id}`);
    return response.json();
  },

  // Actualizar estatus de un reporte
  async updateReportStatus(id: string, status: string) {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return response.json();
  },

  // Actualizar estatus con notificaciones integradas
  async updateReportStatusWithNotification(id: string, status: string) {
    try {
      const response = await this.updateReportStatus(id, status);
      
      if (response.success && response.statusChanged) {
        const report = response.data;
        notificationService.sendStatusChange(report.title, status);
      }
      
      return response;
    } catch (error) {
      console.error('Error updating report status:', error);
      throw error;
    }
  },

  // Monitorear cambios en un reporte (polling cada 30 segundos)
  startMonitoringReport(reportId: string, onStatusChange?: (oldStatus: string, newStatus: string) => void) {
    const intervalId = setInterval(async () => {
      try {
        const response = await this.getReport(reportId);
        
        if (response.success) {
          const storedStatus = sessionStorage.getItem(`report_${reportId}_status`);
          if (storedStatus && storedStatus !== response.data.status) {
            if (onStatusChange) {
              onStatusChange(storedStatus, response.data.status);
            }
            // Enviar notificación automática
            notificationService.sendStatusChange(response.data.title, response.data.status);
          }
          sessionStorage.setItem(`report_${reportId}_status`, response.data.status);
        }
      } catch (error) {
        console.error('Error monitoring report:', error);
      }
    }, 30000); // Polling cada 30 segundos

    // Retornar función para detener el monitoreo
    return () => clearInterval(intervalId);
  },

  // Eliminar un reporte
  async deleteReport(id: string) {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Contar reportes (total o por usuario)
  async countReports(createdBy?: string) {
    const params = new URLSearchParams();
    if (createdBy) params.append('createdBy', createdBy);

    const response = await fetch(`/api/reports/count?${params.toString()}`);
    return response.json();
  },

  // Obtener estadísticas
  async getStatistics() {
    const response = await fetch('/api/statistics');
    return response.json();
  },
};

// Utilitario para obtener o crear ID de usuario
export const userService = {
  getUserId(): string {
    if (typeof window === 'undefined') return 'server-user';

    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  },

  clearUser() {
    localStorage.removeItem('userId');
  },
};

// Notificaciones mejoradas con categorías de reportes
export const notificationService = {
  // Emojis para categorías
  categoryEmojis: {
    'Bache': '🕳️',
    'Luminaria Dañada': '💡',
    'Basura Acumulada': '🗑️',
    'Fuga de Agua': '💧',
    'Inseguridad': '⚠️',
    'Otro': '📍'
  } as Record<string, string>,

  getCategoryEmoji(category: string): string {
    return this.categoryEmojis[category as keyof typeof this.categoryEmojis] || '📍';
  },

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  send(title: string, options?: NotificationOptions) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/icons/icon-192x192.png',
        ...options,
      });
    }
  },

  sendReportCreated(title: string, category: string, colonia: string) {
    const emoji = this.getCategoryEmoji(category);
    this.send('✅ Reporte Creado Exitosamente', {
      body: `${emoji} ${title}\n📍 ${colonia}`,
      tag: `report-${Date.now()}`,
      requireInteraction: false,
    });
  },

  sendReportSaved(category: string, offline: boolean = false) {
    const emoji = this.getCategoryEmoji(category);
    if (offline) {
      this.send('📱 Reporte Guardado Offline', {
        body: `${emoji} Tu reporte se sincronizará cuando tengas conexión`,
        tag: 'offline-save',
      });
    } else {
      this.send('☁️ Reporte Sincronizado', {
        body: `${emoji} Tu reporte está en la plataforma`,
        tag: 'online-sync',
      });
    }
  },

  sendStatusChange(reportTitle: string, newStatus: string) {
    const statusMessages: Record<string, { emoji: string; message: string }> = {
      'Pendiente': { emoji: '⏳', message: 'Pendiente de revisión' },
      'En Proceso': { emoji: '⚙️', message: 'En proceso de solución' },
      'Resuelto': { emoji: '✅', message: 'Problema solucionado' },
    };

    const statusInfo = statusMessages[newStatus] || { emoji: '📌', message: newStatus };

    this.send('Estado del Reporte Actualizado', {
      body: `"${reportTitle}"\n${statusInfo.emoji} ${statusInfo.message}`,
      tag: `status-${reportTitle}`,
      requireInteraction: false,
    });
  },

  sendLocationObtained(lat: number, lng: number) {
    this.send('📍 Ubicación Obtenida', {
      body: `Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      tag: 'location-obtained',
      requireInteraction: false,
    });
  },

  sendError(title: string, message: string) {
    this.send(`❌ ${title}`, {
      body: message,
      tag: 'error',
      requireInteraction: true,
    });
  },
};
