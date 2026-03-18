# 🚀 GUÍA DE DESARROLLO - Debugging, Extensión y Mantenimiento

## 🏃 INICIO RÁPIDO

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar BD
npx prisma migrate deploy

# 3. Iniciar desarrollo
npm run dev

# 4. Abrir en navegador
# http://localhost:3000

# 5. Permitir permisos
# - Geolocalización
# - Notificaciones
# - Acceso a localStorage
```

---

## 🐛 DEBUGGING COMÚN

### Problema: "Reportes no aparecen en el mapa"

**Causas posibles:**

1. **Dexie está vacío**
   ```javascript
   // En DevTools Console
   const db = new Dexie('ColoniaAlerta');
   db.table('reports').toArray().then(r => console.log(r))
   ```
   
2. **API no retorna datos**
   ```javascript
   // Verificar endpoint
   fetch('http://localhost:3000/api/reports?limit=200')
     .then(r => r.json())
     .then(r => console.log(r))
   ```

3. **Coordenadas inválidas**
   - Verificar que lat/lng no sean 0, 0
   - Rango válido: lat [-90, 90], lng [-180, 180]

**Solución:**

```typescript
// En MapComponent.tsx línea ~50
const loadReports = async () => {
  try {
    const response = await reportService.getReports({ limit: 200 });
    console.log('Reports loaded:', response.data?.length); // DEBUG
    if (response.success && response.data?.length > 0) {
      const filtered = response.data.filter(r => 
        r.lat !== 0 && r.lng !== 0
      );
      setReports(filtered);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
};
```

---

### Problema: "Sincronización no funciona offline"

**Verificar conexión:**
```javascript
// DevTools → Network tab → Offline checkbox
// O en Console:
navigator.onLine  // true/false
```

**Verificar Dexie:**
```javascript
const db = new Dexie('ColoniaAlerta');
db.table('reports').where('synced').equals(false).toArray()
  .then(unsynced => console.log('Unsynced:', unsynced))
```

**Forzar sincronización:**
```typescript
// En componente
import { syncService } from '@/lib/sync-service';

// Botón de debug
<button onClick={() => syncService.syncOfflineReports()}>
  Sincronizar ahora
</button>
```

---

### Problema: "Notificaciones no aparecen"

**Pasos de verificación:**

1. ¿Permisos concedidos?
   ```javascript
   // DevTools Console
   Notification.permission  // 'granted' | 'denied' | 'default'
   ```

2. ¿Service Worker activo?
   ```
   DevTools → Application → Service Workers
   → Debe estar "activated and running"
   ```

3. ¿Errores en la console?
   ```bash
   npm run dev  # Ver logs en terminal
   ```

**Forzar notificación:**
```typescript
// En cualquier página
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification('Test', { body: 'This is a test' });
}
```

---

### Problema: "Error de tipo en TypeScript"

**Ejemplo común - Async params en Next.js 16:**

```typescript
// ❌ INCORRECTO
export async function GET(request: Request, { params }: { params: Params }) {
  const id = params.id;
}

// ✅ CORRECTO
export async function GET(
  request: Request,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
}
```

---

### Problema: "Dexie query errors"

**Error: Cannot use .equals() en boolean**

```typescript
// ❌ INCORRECTO
db.table('reports')
  .where('synced')
  .equals(false)
  .count()

// ✅ CORRECTO
db.table('reports')
  .filter((r) => !r.synced)
  .count()
```

---

## 📝 AGREGAR NUEVA CATEGORÍA

### 1. Actualizar mapa de colores (MapComponent.tsx)

```typescript
const getCategoryIcon = (category: string) => {
  const categoryConfig: Record<string, { emoji: string; color: string }> = {
    'Bache': { emoji: '🕳️', color: '#dc2626' },
    'Luminaria Dañada': { emoji: '💡', color: '#f59e0b' },
    'Nueva Categoría': { emoji: '🆕', color: '#10b981' }, // ← AGREGAR
  };
  // ... resto del código
}
```

### 2. Actualizar validación en formulario (reportar/page.tsx)

```typescript
const CATEGORIES = [
  'Bache',
  'Luminaria Dañada',
  'Basura Acumulada',
  'Fuga de Agua',
  'Nueva Categoría', // ← AGREGAR
  'Inseguridad',
  'Otro'
];
```

### 3. Actualizar estadísticas (api/statistics/route.ts)

```typescript
// Si quieres tratar "Nueva Categoría" especialmente:
const byCategory = await prisma.report.groupBy({
  by: ['category'],
  _count: true,
  // La agregación cubre automáticamente todas las categorías
});
```

---

## 🗺️ CAMBIAR ÁREA DE COBERTURA (MUNICIPIOS)

### 1. En Prisma schema (prisma/schema.prisma)

```prisma
// Agregar validación (opcional)
model Report {
  // ... otros campos
  municipio String
  
  @@index([municipio])
}
```

### 2. En validación del formulario

```typescript
// reportar/page.tsx
const MUNICIPIOS = [
  'Saltillo',
  'Ramos Arizpe',
  'Nuevo municipio', // ← AGREGAR
];
```

### 3. Actualizar centro del mapa

```typescript
// components/MapComponent.tsx - línea inicial de zoom
const defaultCenter: [number, number] = [25.426, -100.973]; // Saltillo

// Cambiar a:
const defaultCenter: [number, number] = [25.388, -101.042]; // Ramos Arizpe
```

---

## 🔧 AGREGAR NUEVO CAMPO AL REPORTE

### 1. Actualizar Prisma schema

```prisma
model Report {
  id          String   @id @default(uuid())
  title       String
  description String
  // ... campos existentes
  
  // Nuevo campo
  telefono    String?  @db.String(20)
  
  createdAt   DateTime @default(now())
  // ...
}
```

### 2. Crear migración

```bash
npx prisma migrate dev --name "add_telefono_field"
```

### 3. Actualizar formulario (reportar/page.tsx)

```typescript
// Estado
const [telefono, setTelefono] = useState('');

// Input
<input
  type="tel"
  value={telefono}
  onChange={(e) => setTelefono(e.target.value)}
  placeholder="Teléfono (opcional)"
/>

// Envío
const data = {
  //... otros campos
  telefono: telefono || null,
};
```

### 4. Actualizar API (api/reports/route.ts)

```typescript
// En POST
if (!body.title || !body.category) {
  // ...validación
}

// Agregar telefono al create
const report = await prisma.report.create({
  data: {
    title: body.title,
    description: body.description,
    category: body.category,
    municipio: body.municipio,
    colonia: body.colonia,
    lat: parseFloat(body.lat),
    lng: parseFloat(body.lng),
    priority: body.priority || 'Media',
    createdBy: body.createdBy,
    telefono: body.telefono || null, // ← NUEVO
    photoB64: body.photoB64 || null,
  },
});
```

### 5. Actualizar vistas (reportes/page.tsx, MapComponent.tsx, etc.)

---

## 📊 CAMBIAR INTERVALO DE POLLING

### Sincronización de reportes (cada 5 minutos)

```typescript
// src/lib/sync-service.ts línea ~80
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

// Cambiar a 10 minutos:
const SYNC_INTERVAL = 10 * 60 * 1000;
```

### Polling de notificaciones (cada 2 minutos)

```typescript
// src/lib/report-status-service.ts línea ~60
const POLLING_INTERVAL = 2 * 60 * 1000; // 2 minutos

// Cambiar a 1 minuto:
const POLLING_INTERVAL = 1 * 60 * 1000;
```

### Refresh de mapa (cada 30 segundos)

```typescript
// src/components/MapComponent.tsx línea ~50
const REFRESH_INTERVAL = 30 * 1000; // 30 segundos

// Cambiar a 1 minuto:
const REFRESH_INTERVAL = 60 * 1000;
```

---

## 🔐 CAMBIAR MECANISMO DE USUARIO

**Actual:** ID autogenerado en localStorage (sin login)

### Para agregar autenticación básica:

1. **Instalar librerías**
```bash
npm install next-auth
```

2. **Crear ruta de auth (app/api/auth/[...nextauth]/route.ts)**

3. **Reemplazar servicios en lib/api-client.ts**
```typescript
// Actual
const userId = localStorage.getItem('userId') || generateUserId();

// Con Next-Auth
import { getSession } from 'next-auth/react';
const session = await getSession();
const userId = session?.user?.id;
```

---

## 🎨 PERSONALIZAR COLORES (Tailwind)

### tailwind.config.ts

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': '#dc2626',
        'brand-secondary': '#f59e0b',
      }
    }
  }
}
```

### Uso en componentes

```typescript
<div className="bg-brand-primary text-white">
  Estado Crítico
</div>
```

---

## 📱 AGREGAR PWA ICON

### 1. Crear icono PNG (192x192px y 512x512px)

### 2. Guardar en public/

```
public/
  ├── icon-192x192.png
  ├── icon-512x512.png
  └── manifest.json
```

### 3. Actualizar manifest.json

```json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 🧠 MEJORAR ESTADÍSTICAS

### Agregar métrica nueva (ej: tiempo promedio de resolución)

En **api/statistics/route.ts:**

```typescript
// Calcular reportes resueltos
const resolvedReports = await prisma.report.findMany({
  where: { status: 'Resuelto' },
  select: { createdAt: true, resolvedAt: true },
});

// Calcular promedio de días
const avgDays = resolvedReports.reduce((sum, r) => {
  if (r.resolvedAt) {
    const days = (r.resolvedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }
  return sum;
}, 0) / resolvedReports.length;

// Retornar
return NextResponse.json({
  success: true,
  data: {
    // ...existentes
    averageResolutionDays: Math.round(avgDays * 10) / 10,
  }
});
```

---

## 🧹 LIMPIAR DATOS ANTIGUOS

```bash
# Crear un script: scripts/cleanup.ts
npx ts-node scripts/cleanup.ts
```

Contenido:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  // Eliminar reportes resueltos hace más de 6 meses
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const deleted = await prisma.report.deleteMany({
    where: {
      status: 'Resuelto',
      resolvedAt: {
        lt: sixMonthsAgo,
      },
    },
  });

  console.log(`Deleted ${deleted.count} old reports`);
  await prisma.$disconnect();
}

cleanup();
```

---

## 📈 PERFORMANCE MONITORING

### Agregar logs en endpoints

```typescript
// api/reports/route.ts
console.time('getReports');
const reports = await prisma.report.findMany({
  // ...query
});
console.timeEnd('getReports');
```

### Verificar queries en Prisma

```bash
# .env.local
DATABASE_URL="file:./dev.db"
PRISMA_SDK_SKIP_CHANGELOG=true

# Con logs
DEBUG=prisma:* npm run dev
```

---

## 🚨 ERROR HANDLING

### Mejor tratamiento de errores en API

```typescript
// Actual
try {
  // codigo
} catch (error) {
  return NextResponse.json(
    { success: false, error: 'Error' },
    { status: 500 }
  );
}

// Mejorado
try {
  // codigo
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('API Error:', message);
  
  return NextResponse.json(
    { success: false, error: message },
    { status: error instanceof PrismaClientValidationError ? 400 : 500 }
  );
}
```

---

## 📚 TESTING

### Crear archivo de test (reportar/page.test.tsx)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import ReportarPage from './page';

describe('Reportar Page', () => {
  it('renders form inputs', () => {
    render(<ReportarPage />);
    expect(screen.getByPlaceholderText('Título')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<ReportarPage />);
    const submitBtn = screen.getByText('Enviar Reporte');
    fireEvent.click(submitBtn);
    
    // Should show validation error
  });
});
```

```bash
# Ejecutar tests
npm run test
```

---

## 🚢 DEPLOYMENT

### Vercel (recomendado para Next.js)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Configurar proyecto
vercel link

# 3. Deploy
vercel deploy

# 4. Production
vercel deploy --prod
```

### Variables de entorno necesarias

```
.env.production
DATABASE_URL=your_production_db_url
```

---

## 📦 ACTUALIZAR DEPENDENCIAS

```bash
# Ver outdated
npm outdated

# Actualizar todas
npm update

# Actualizar Prisma
npx prisma migrate deploy

# Verificar compatibility
npm run build
```

---

## 💡 TIPS Y BUENAS PRÁCTICAS

1. **Siempre validar en API**, no confiar en cliente
2. **Usar índices en BD** para queries frecuentes
3. **Logs en desarrollo**, errores silenciosos en producción
4. **Offline-first** diseño, sincronización después
5. **Caching inteligente**, no invalidar frecuentemente
6. **PWA manifesto** actualizado siempre
7. **Type safety** con TypeScript strict mode
8. **Monitorear performance**, no solo funcionalidad

---

**Guía de desarrollo completada** ✅
