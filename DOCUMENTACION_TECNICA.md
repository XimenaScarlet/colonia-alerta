# 🔧 DOCUMENTACIÓN TÉCNICA - Arquitectura y Flujos

## 📐 ARQUITECTURA DEL PROYECTO

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTE (next.js)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │ Components   │  │   Lib        │      │
│  │              │  │              │  │              │      │
│  │ - Home       │  │ - Map        │  │ - api-client │      │
│  │ - Reportes   │  │ - OfflineSta│  │ - sync-      │      │
│  │ - Reportar   │  │   tusBadge   │  │   service    │      │
│  │ - Estadístic│  │ - SyncInit   │  │ - report-    │      │
│  │ - Mapa       │  │   ializer    │  │   status-    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌────────────────────────┐  ┌─────────────────────┐       │
│  │   DEXIE (Offline DB)   │  │ localStorage (datos)│       │
│  │                        │  │                     │       │
│  │ - Reportes (synced)    │  │ - userId            │       │
│  │ - Estado local         │  │ - reportStatuses    │       │
│  └────────────────────────┘  └─────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                    SERVIDOR (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │       API Routes (/app/api/)                │            │
│  │                                              │            │
│  │ GET/POST  /api/reports          [CRUD]     │            │
│  │ GET       /api/reports/count     [Count]    │            │
│  │ GET/PUT   /api/reports/[id]      [Detail]   │            │
│  │ GET       /api/statistics        [Stats]    │            │
│  └─────────────────────────────────────────────┘            │
│                            ↑                                │
│  ┌────────────────────────────────────────────┐             │
│  │       PRISMA ORM + SQLite                  │             │
│  │                                             │             │
│  │ Model: Report                              │             │
│  │ - id, title, description, category         │             │
│  │ - municipio, colonia, lat, lng             │             │
│  │ - priority, status, photoB64, createdBy    │             │
│  │ - createdAt, updatedAt, resolvedAt         │             │
│  │ - Índices en campos frecuentes             │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 TABLA DE ENDPOINTS API

| Método | Path | Descripción | Query Params | Respuesta |
|--------|------|-------------|--------------|-----------|
| GET | `/api/reports` | Listar reportes | limit, offset, category, status, municipio, colonia, createdBy | `{success, data[], pagination}` |
| POST | `/api/reports` | Crear reporte | N/A | `{success, data}` |
| GET | `/api/reports/[id]` | Detalle reporte | N/A | `{success, data}` |
| PUT | `/api/reports/[id]` | Actualizar estatus | N/A (body: {status}) | `{success, data}` |
| DELETE | `/api/reports/[id]` | Eliminar reporte | N/A | `{success, message}` |
| GET | `/api/reports/count` | Contar reportes | createdBy (opcional) | `{success, count}` |
| GET | `/api/statistics` | Estadísticas agregadas | N/A | `{success, data{*stats}}` |

---

## 🔄 FLUJO: CREAR UN REPORTE

```
Usuario                    Cliente                  Dexie                 Servidor
   │                          │                        │                      │
   │ 1. Rellena formulario     │                        │                      │
   ├─────────────────────────>│                        │                      │
   │                          │                        │                      │
   │ 2. Obtiene geolocalización│                        │                      │
   ├─────────────────────────>│                        │                      │
   │ 3. Valida datos           │                        │                      │
   │<──────────────────────────┤                        │                      │
   │                          │                        │                      │
   │ 4a. Si hay conexión       │                        │                      │
   │                          │ 5. POST /api/reports   │                      │
   │                          ├──────────────────────────────────────────────>│
   │                          │                        │                      │ 6. Crea en BD
   │                          │                        │                      │ 7. Retorna ID
   │                          │<──────────────────────────────────────────────┤
   │                          │                        │                      │
   │                          │ 8. Guarda en Dexie (synced=true)               │
   │                          ├───────────────────────>│                      │
   │ 9. Notificación           │<───────────────────────┤                      │
   │<──────────────────────────┤                        │                      │
   │                          │                        │                      │
   │ 4b. Si SIN conexión       │                        │                      │
   │                          │ 10. Guarda en Dexie (synced=false)             │
   │                          ├───────────────────────>│                      │
   │ 11. Notificación offline  │<───────────────────────┤                      │
   │<──────────────────────────┤                        │                      │
```

---

## 🔄 FLUJO: SINCRONIZAR REPORTES

```
App Inicia                       SyncInitializer          Dexie           Servidor
   │                                  │                    │                  │
   │ 1. Renderiza componente         │                    │                  │
   ├─────────────────────────────────>│                    │                  │
   │                                  │                    │                  │
   │                       2. setupSyncListener()          │                  │
   │                                  ├──────────────────>│                  │
   │                                  │                    │                  │
   │                       3. Escucha evento 'online'      │                  │
   │                                  │                    │                  │
   ┌─────────────────────────────────────────────────────────────────────────┐
   │ CUANDO USUARIO RECUPERA CONEXIÓN                                        │
   └─────────────────────────────────────────────────────────────────────────┘
   │                                  │                    │                  │
   │                       4. Dispara 'online' event       │                  │
   │                                  │                    │                  │
   │                       5. syncOfflineReports()        │                  │
   │                                  ├───────────────────>│ (synced=false)   │
   │                                  │                    │                  │
   │                       6. Itera cada reporte          │                  │
   │                                  ├───────────────────>│                  │
   │                                  │                    │                  │
   │                       7. POST /api/reports           │                  │
   │                                  ├────────────────────────────────────>│
   │                                  │                    │                  │
   │                       8. Crea en BD                  │                  │
   │                                  │                    │                  │
   │                       9. Retorna éxito               │                  │
   │                                  │<────────────────────────────────────┤
   │                                  │                    │                  │
   │                       10. Actualiza synced=true      │                  │
   │                                  ├───────────────────>│                  │
   │                                  │<───────────────────┤                  │
```

---

## 📲 FLUJO: NOTIFICACIONES DE CAMBIO DE ESTADO

```
Servidor (Admin)              Polling en Cliente         Notificación
       │                               │                      │
       │ 1. Actualiza status           │                      │
       │ (de API/Panel admin)          │                      │
       │                               │                      │
       │ 2. Cada 2 minutos:            │                      │
       │ Usuario solicita reportes     │                      │
       │<──────────────────────────────┤                      │
       │                               │                      │
       │ 3. GET /api/reports?          │                      │
       │ createdBy=usuario             │                      │
       │                               │                      │
       │ 4. Retorna lista con estatus  │                      │
       │──────────────────────────────>│                      │
       │                               │                      │
       │                   5. Compara con localStorage        │
       │                      (reportStatuses)                │
       │                               │                      │
       │                   6. Si cambió: estado anterior≠nuevo
       │                               │                      │
       │                   7. notificationService.send()      │
       │                               ├─────────────────────>│
       │                               │        Notificación  │
       │                               │      "Reporte X:  ✅ │
       │                               │       Resuelto"      │
```

---

## 💾 ESQUEMA DE BASE DE DATOS (Prisma)

```typescript
model Report {
  id          String   @id @default(uuid())
  
  // Contenido del reporte
  title       String        // "Bache en esquina"
  description String        // "Es muy profundo y peligroso"
  category    String        // "Bache"
  priority    String        // "Media"
  
  // Ubicación
  municipio   String        // "Saltillo"
  colonia     String        // "Mirasierra"
  lat         Float         // 25.426
  lng         Float         // -100.973
  
  // Estado
  status      String @default("Pendiente")  // "Pendiente|En Proceso|Resuelto"
  photoB64    String?       // Imagen en base64
  
  // Auditoría
  createdBy   String        // ID del usuario
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  resolvedAt  DateTime?     // Cuándo se resolvió
  
  // Índices para performance
  @@index([status])
  @@index([category])
  @@index([municipio])
  @@index([colonia])
  @@index([createdBy])
  @@index([createdAt])
}
```

---

## 🗄️ ESQUEMA LOCAL (Dexie)

```typescript
interface Report {
  id?: number                      // ID autoincremental local
  title: string
  description: string
  category: string
  municipio: string
  colonia: string
  lat: number
  lng: number
  datetime: string                 // ISO datetime
  photoUrl?: string                // Data URL
  priority: 'Baja' | 'Media' | 'Alta'
  status: 'Pendiente' | 'En Proceso' | 'Resuelto'
  synced: boolean                  // ¿Sincronizado con servidor?
}
```

---

## 🔐 MODELO DE USUARIO

Sistema simple sin autenticación formal:
- ID generado automáticamente en app
- Almacenado en `localStorage.userId`
- Formato: `user_[timestamp]_[random 9 chars]`
- Ejemplo: `user_1710723600000_a9k3x2m1b`

---

## 🎨 COLORES Y EMOJIS POR CATEGORÍA

| Categoría | Emoji | Color | Hex |
|-----------|-------|-------|-----|
| Bache | 🕳️ | Rojo | #dc2626 |
| Luminaria Dañada | 💡 | Ámbar | #f59e0b |
| Basura Acumulada | 🗑️ | Púrpura | #8b5cf6 |
| Fuga de Agua | 💧 | Azul | #3b82f6 |
| Inseguridad | ⚠️ | Rojo oscuro | #ef4444 |
| Otro | 📍 | Gris | #6b7280 |

---

## 📊 ESTADÍSTICAS CALCULADAS

### En tiempo real (SSR):
```javascript
{
  total: 145,                    // Total reportes
  resolved: 87,                  // Resueltos
  pending: 35,                   // Pendientes
  inProgress: 23,                // En proceso
  percentageResolved: 60,        // % resueltos
  
  byStatus: {                    // Desglose por estatus
    "Pendiente": 35,
    "En Proceso": 23,
    "Resuelto": 87
  },
  
  byCategory: {                  // Desglose por categoría
    "Bache": 45,
    "Luminaria Dañada": 32,
    "Fuga de Agua": 28,
    "Basura Acumulada": 25,
    "Otro": 15
  },
  
  byMunicipio: {                 // Desglose por municipio
    "Saltillo": 89,
    "Ramos Arizpe": 56
  },
  
  topColonias: [                 // Top 8 colonias
    { colonia: "Mirasierra", count: 23 },
    { colonia: "Saltillo 2000", count: 18 },
    ...
  ]
}
```

---

## 🔄 CICLO DE VIDA DE COMPONENTES KEY

### MapComponent
```
1. Renderiza
2. useEffect → loadReports()
3. fetch /api/reports (limit 200)
4. Crea marcadores dinámicos
5. Cada 30s recarga reportes
6. Cleanup: clearInterval
```

### SyncInitializer
```
1. Montaje
2. setupSyncListener() → escucha online/offline
3. Solicita notificaciones
4. setupSyncListener() retorna cleanup
5. startStatusPolling() cada 2 minutos
6. Desmontaje: cleanup + clearInterval
```

### OfflineStatusBadge
```
1. Renderiza si NOT (online && synced)
2. useLiveQuery → monitorea Dexie
3. Escucha eventos online/offline
4. Botón sincronización manual
5. Dinámico según estado
```

---

## ⚡ OPTIMIZACIONES

1. **SSR en páginas estáticas** (Home, Estadísticas)
   - Datos calculados en servidor → HTML
   - Mejor SEO y primer render

2. **Lazy loading del Mapa**
   - dynamic import sin SSR
   - Carga solo en cliente

3. **Índices de BD**
   - Clave en queries frequentes
   - Status, category, municipio, colonia

4. **Caché en Dexie**
   - Offline-first
   - Sincronización inteligente

5. **Polling inteligente**
   - Notificaciones cada 2 minutos
   - Reportes cada 30 segundos
   - Sincronización cada 5 minutos

---

## 🛡️ VALIDACIONES

### En Formulario:
- ✅ Título requerido
- ✅ Categoría obligatoria
- ✅ Colonia obligatoria
- ✅ Descripción no vacía
- ✅ Ubicación (lat, lng ≠ 0)

### En API:
- ✅ Campos requeridos validados
- ✅ Coordenadas parseadas a Float
- ✅ Status permitidos validados
- ✅ Error 404 si reporte no existe

---

## 🧪 CASOS DE PRUEBA RECOMENDADOS

1. **Crear reporte online**
   - Debe guardarse en Prisma + Dexie
   - Debe aparecer en mapa al instante
   - Notificación en cliente

2. **Crear reporte offline**
   - Mensaje "guardado offline"
   - Badge mostrará "pendiente sync"

3. **Reconectar → Sincronizar**
   - Reporte offline se envía
   - Badge actualiza a "sincronizado"

4. **Filtros en Reportes**
   - Por categoría → funciona
   - Por estatus → funciona
   - Combinados → funciona

5. **Estadísticas**
   - Números coinciden con BD
   - Porcentajes correctos

6. **Notificaciones**
   - Solicita permiso al cargar
   - Al crear reporte → notificación
   - Cambio de estado → notificación

---

## 📚 DEPENDENCIAS CLAVE

- `next`: 16.1.7 - Framework
- `@prisma/client`: 5.22.0 - ORM/BD
- `dexie`: 4.3.0 - Offline DB
- `react-leaflet`: 5.0.0 - Maps
- `next-pwa`: 5.6.0 - PWA
- `tailwindcss`: 4 - Estilos
- `lucide-react`: 0.577.0 - Iconos

---

**Documentación técnica completada** ✅
