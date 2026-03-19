# Pruebas de PWA y Funcionalidad Offline

## Requerimientos No Funcionales Implementados

### 1. **Pantallas de Splash y Home** ✓
- **Implementación**: 
  - Splash/Home: [src/app/home/page.tsx](../src/app/home/page.tsx)
  - Pantalla inicial con bienvenida y acciones rápidas
  - Navbar inferior para navegación (BottomNav)
  - Estadísticas en tiempo real

### 2. **Vistas del lado del Cliente y Servidor** ✓
- **Lado del Servidor (SSR)**:
  - [src/app/home/page.tsx](../src/app/home/page.tsx) - Renderiza estadísticas desde BD
  - [src/app/api/reports/route.ts](../src/app/api/reports/route.ts) - API endpoint
  
- **Lado del Cliente (CSR)**:
  - [src/app/reportes/page.tsx](../src/app/reportes/page.tsx) - Con filtros dinámicos
  - [src/app/reportar/page.tsx](../src/app/reportar/page.tsx) - Formulario reactivo

### 3. **Datos Locales, Remotos y Offline** ✓
- **Almacenamiento Local**: Dexie.js (IndexedDB)
  - Ubicación: [src/lib/db.ts](../src/lib/db.ts)
  - Tabla `reports` con campos sincronizados
  
- **Datos Remotos**: Prisma + SQLite/PostgreSQL
  - API endpoints en [src/app/api/](../src/app/api/reports/)
  
- **Sincronización Offline**:
  - Ubicación: [src/lib/sync-service.ts](../src/lib/sync-service.ts)
  - Guarda reportes localmente si no hay conexión
  - Sincroniza automáticamente cuando regresa internet

### 4. **Notificaciones** ✓
- **Implementación**: 
  - API: [src/lib/api-client.ts](../src/lib/api-client.ts) - Servicio `notificationService`
  - Notificaciones en navegador y vibración
  - Eventos personalizados para sincronización

### 5. **Uso de Elementos Físicos del Dispositivo** ✓
- **Geolocalización**:
  - [src/app/reportar/page.tsx](../src/app/reportar/page.tsx) - Botón "Obtener Ubicación"
  - Captura lat/lng automáticamente
  
- **Cámara**:
  - Captura de fotos en base64
  - Input file con atributo `capture="environment"`
  
- **Vibración**:
  - Disponible en componente de reportes
  - Notificación con feedback físico

## Requerimientos Funcionales Implementados

### 1. **Crear Reportes Offline** ✓
**Pasos de Prueba**:
1. Desconectar internet (DevTools > Network > Offline)
2. Ir a `/reportar`
3. Llenar formulario:
   - Título, Descripción, Categoría
   - Colonia, Ubicación (geolocalización)
   - Foto (opcional)
4. Hacer click en "Enviar Reporte"
5. **Resultado Esperado**: Reporte guardado localmente con indicador de sincronización pendiente

**Evidencia de Código**:
```typescript
// src/app/reportar/page.tsx - línea ~140
if (isOnline) {
  // Envía a API
} else {
  // Guarda en Dexie sin sincronizar
  await db.reports.add({
    ...formData,
    synced: false  // Marca como pendiente
  });
}
```

### 2. **Sincronización Automática** ✓
**Pasos de Prueba**:
1. Crear reportes en modo offline
2. Conectar internet nuevamente
3. **Resultado Esperado**: 
   - Badge "Reportes Pendientes" aparece
   - Sincronización automática en 3 segundos
   - Reportes se marcan como `synced: true`

**Evidencia de Código**:
```typescript
// src/lib/sync-service.ts - línea ~67
window.addEventListener('online', () => {
  setTimeout(async () => {
    const result = await this.syncOfflineReports();
    // Emitir evento de éxito
  }, 3000);
});
```

### 3. **Indicador de Estado Offline** ✓
- **Ubicación**: [src/components/OfflineStatusBadge.tsx](../src/components/OfflineStatusBadge.tsx)
- **Muestra**:
  - Icono WiFi tachado si sin conexión
  - Contador de reportes pendientes
  - Botón manual de sincronización (cuando online y hay pendientes)

### 4. **Listado de Reportes Local y Remoto** ✓
- **Ubicación**: [src/app/reportes/page.tsx](../src/app/reportes/page.tsx)
- **Características**:
  - Carga de reportes remotos via API
  - Fallback automático a BD local si no hay conexión
  - Filtros: Categoría, Estado, Municipio, Colonia
  - Tabs: "Todos" vs "Mis Reportes"

### 5. **Mapa Interactivo** ✓
- **Ubicación**: [src/app/mapa/page.tsx](../src/app/mapa/page.tsx)
- **Características**:
  - Integración con Leaflet
  - Clustering de reportes
  - Visualización offline (con datos locales si aplica)

### 6. **Estadísticas en Tiempo Real** ✓
- **Ubicación**: [src/app/estadisticas/page.tsx](../src/app/estadisticas/page.tsx)
- **Métricas**:
  - Total de reportes
  - Porcentaje resueltos
  - Reportes por categoría

## Configuración PWA

### Manifest.json
- **Ubicación**: [public/manifest.json](../public/manifest.json)
- **Características**:
  - Icono de 192x192 y 512x512
  - Nombre: "Colonia Alerta"
  - Tipo de display: standalone
  - Orientación: portrait-primary

### Service Worker
- **Configuración**: [next.config.mjs](../next.config.mjs)
- **Generado por**: next-pwa
- **Ubicación**: [public/sw.js](../public/sw.js)
- **Estrategias de Cache**:
  - NetworkFirst: API calls, HTML
  - CacheFirst: Imágenes, videos, audio
  - StaleWhileRevalidate: Estilos, fuentes

## Plan de Pruebas

### Test 1: Modo Offline Completo
```
1. Navegar a https://colonia-alerta.vercel.app
2. Abrir DevTools (F12)
3. Network tab > Throttling: Offline
4. Crear reporte en /reportar
5. Verificar que se guarde en IndexedDB (Application > IndexedDB)
6. Volver a online
7. Verificar sincronización automática
```

### Test 2: Instalación en Dispositivo
```
1. En smartphone, abrir aplicación
2. Hacer click en "Instalar" (banner superior o menú)
3. Verificar icono en pantalla de inicio
4. Abrir app instalada
5. Probar funcionalidad sin conexión
```

### Test 3: Notificaciones
```
1. Crear reporte
2. Verificar notificación en navegador
3. Permitir permisos si lo pide
4. Verificar vibración (dispositivo físico)
```

### Test 4: Geolocalización
```
1. Ir a /reportar
2. Click en "Obtener Ubicación"
3. Permitir ubicación
4. Verificar que lat/lng se llenen
5. En mapa, verificar que muestre punto
```

### Test 5: Cámara
```
1. Ir a /reportar
2. Click en área de foto
3. Seleccionar "Tomar foto" 
4. Verificar que capture y muestre preview
5. Enviar reporte con foto
```

## Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| [src/lib/db.ts](../src/lib/db.ts) | Esquema Dexie |
| [src/lib/sync-service.ts](../src/lib/sync-service.ts) | Sincronización offline |
| [src/components/OfflineStatusBadge.tsx](../src/components/OfflineStatusBadge.tsx) | Indicador estado |
| [src/components/SyncInitializer.tsx](../src/components/SyncInitializer.tsx) | Inicializador de sincronización |
| [next.config.mjs](../next.config.mjs) | Configuración PWA |
| [public/manifest.json](../public/manifest.json) | Manifest PWA |

## Conclusión

✓ **Todos los requerimientos no funcionales** fueron implementados:
- Pantallas splash/home
- Vistas SSR y CSR
- Datos local, remoto y offline
- Notificaciones
- Elementos físicos (geolocalización, cámara, vibración)

✓ **Todos los requerimientos funcionales** fueron implementados:
- Crear reportes offline
- Sincronización automática
- Indicador de estado
- Listado local/remoto
- Mapa interactivo
- Estadísticas en tiempo real

✓ **PWA Completa**: Instalable, funciona offline, notificaciones, acceso a hardware del dispositivo.
