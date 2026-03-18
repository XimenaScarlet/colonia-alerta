# ✅ PLAN DE PRUEBAS Y VALIDACIÓN

## 📋 CHECKLIST DE VALIDACIÓN COMPLETA

### ✓ Fase 1: Verificación de Ambiente

- [ ] Node.js versión 18+ instalado → `node --version`
- [ ] npm versión 9+ instalado → `npm --version`
- [ ] Proyecto tiene `node_modules/` → `ls node_modules | wc -l`
- [ ] `.env.local` configurado (si aplica)
- [ ] Base de datos inicializada → `npx prisma migrate deploy`

**Comandos:**
```bash
node --version    # Debe ser v18 o superior
npm --version     # Debe ser 9 o superior
ls -la .next      # Si existe .next, proyecto ya fue compilado
```

---

### ✓ Fase 2: Build y Compilación

**Objetivo:** Verificar que el proyecto compila sin errores TypeScript

```bash
npm run build
```

**Resultado esperado:**
```
✓ Compiled successfully
Generated optimized production build with 12 pages
Compiled in 14.7s
```

**Si hay errores:**
- [ ] Revisar console para línea del error
- [ ] Revisar archivos: `api/reports/[id]/route.ts`, `components/OfflineStatusBadge.tsx`, `lib/sync-service.ts`
- [ ] Todos tienen tipos correctos para Next.js 16

---

### ✓ Fase 3: Base de Datos

**Objetivo:** Verificar conectividad y versión del schema

```bash
# Verificar migración
npx prisma migrate status

# Ver schema actual
npx prisma studio
```

**Resultado esperado:**
- 2 migraciones aplicadas correctamente
- Portal de Prisma Studio muestra tabla "Report"
- Campos: id, title, description, category, municipio, colonia, lat, lng, priority, status, photoB64, createdBy, createdAt, updatedAt, resolvedAt

**Si hay problemas:**
```bash
# Reset completo (⚠️ PERDERÁ DATOS)
npx prisma migrate reset --skip-generate

# O:
rm prisma/dev.db
npx prisma migrate deploy
```

---

### ✓ Fase 4: Desarrollo y Funcionalidad

**Comando:**
```bash
npm run dev
```

**Esperado en Terminal:**
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

#### 4.1 Página HOME (/)

**URL:** http://localhost:3000

**Verificar:**
- [ ] Carga sin errores
- [ ] Muestra contador de reportes (**número real**, no "142" hardcodeado)
- [ ] Muestra "% Resueltos" (**valor calculado**, no "89%")
- [ ] Botones: Reportar, Ver Mapa, Estadísticas
- [ ] Badge offline/online en esquina

**Test acciones:**
```javascript
// En DevTools Console
// Ver si el contador es dinámico
fetch('http://localhost:3000/api/reports/count')
  .then(r => r.json())
  .then(r => console.log('Count in DB:', r.count))
```

#### 4.2 Página REPORTAR (http://localhost:3000/reportar)

**Verificar UI:**
- [ ] Formulario completo visible
- [ ] Campos: Título, Descripción, Categoría, Colonia, Municipio, Prioridad

**Test geolocalización:**
- [ ] Click "Obtener ubicación actual"
- [ ] Navegador solicita permiso
- [ ] [ ] Permite → Coordenadas se rellenan automáticamente
- [ ] [ ] Rechaza → Mensaje de error sensato
- [ ] [ ] Ya concedido → Se rellenan sin preguntar

**Test con ubicación manual:**
- [ ] Borrar campos lat/lng
- [ ] Ingresar: `25.426` (Saltillo lat), `-100.973` (Saltillo lng)
- [ ] Rellenar otros campos
- [ ] Click "Enviar Reporte"

**Resultado esperado:**
- [ ] Success message: "Reporte creado exitosamente"
- [ ] Notificación en navegador (si permitidas)
- [ ] Badge offline mostrará 0 reportes pendientes si está online
- [ ] Si offline: mensaje "Guardado offline"

**Verificación en BD:**
```bash
npx prisma studio
# Ir a Reports table
# Debe haber nuevo registro con datos que enviaste
```

#### 4.3 Página REPORTES (http://localhost:3000/reportes)

**Verificar tabs:**
- [ ] Tab "Todos los Reportes" activo
- [ ] Tab "Mis Reportes" disponible
- [ ] Clickeable entre tabs

**En tab "Todos":**
- [ ] Lista de reportes (debe haber al menos los creados en 4.2)
- [ ] Cada item muestra: título, colonia, estado (color)
- [ ] Estados coloreados: rojo (Pendiente), naranja (En Proceso), verde (Resuelto)

**En tab "Mis Reportes":**
- [ ] Solo muestra reportes creados por este usuario
- [ ] Debe incluir los creados en test 4.2

**Filtros:**
- [ ] Seleccionar categoría → Filtra resultados
- [ ] Seleccionar estado → Filtra resultados
- [ ] Ambos combinados → Filtra correctamente

#### 4.4 Página MAPA (http://localhost:3000/mapa)

**Verificar:**
- [ ] Mapa carga (Leaflet visible)
- [ ] Centro en Saltillo (aprox 25.426, -100.973)
- [ ] Controles zoom/pan funcionan
- [ ] Markers aparecen en ubicaciones de reportes

**Markers:**
- [ ] Cada reporte es un marker
- [ ] ícono diferente por categoría (🕳️ bache, 💡 luminaria, etc.)
- [ ] Click en marker → popup con datos del reporte
- [ ] Popup muestra: título, colonia, estado, categoría

**Auto-refresh:**
- [ ] Crear nuevo reporte vía formulario
- [ ] Esperar max 30 segundos
- [ ] Nuevo marker debe aparecer en mapa

#### 4.5 Página ESTADÍSTICAS (http://localhost:3000/estadisticas)

**Verificar KPIs:**
- [ ] Total reportes (número real)
- [ ] % Resueltos (calculado, debe coincidir con home)
- [ ] En proceso (número real)
- [ ] Pendientes (número real)

**Verificar Gráficas:**
- [ ] Gráfica por estado (barras, colores)
- [ ] Gráfica por categoría (todas que existan)
- [ ] Top colonias (lista de 8)
- [ ] Números deben sumar a total

#### 4.6 Notificaciones

**Verificar:**
- [ ] Navegador solicita permiso al cargar app
- [ ] Si permitidas: crear reporte → notificación aparece
- [ ] Si rechazadas: no hay error, app sigue funcionando

**Test con status change:**
```bash
# En otra terminal
npx prisma studio

# Encontrar un reporte de usuario
# Cambiar su status de "Pendiente" a "En Proceso"
# Esperar máx 2 minutos

# Debes recibir notificación: "Reporte actualizado"
```

---

### ✓ Fase 5: Funcionalidad Offline

**Setup:**

1. Crear un reporte online (verificar apareció en BD)
2. Abrir DevTools → Network → Offline checkbox
3. Refrescar página (F5)

**Verificar:**
- [ ] Página carga (aunque sea versión cacheada)
- [ ] Badge offline muestra "Desconectado"
- [ ] Botón "Sincronizar" disponible (gris si no hay pendientes)

**Test crear offline:**
- [ ] Rellenar y enviar nuevo reporte
- [ ] Mensaje: "Guardado offline"
- [ ] Badge muestra "1 pendiente de sincronizar"

**Test sincronización:**
- [ ] DevTools → Network → Offline unchecked (reconectar)
- [ ] Esperar 5 segundos O click en botón "Sincronizar"
- [ ] Badge cambia a "Sincronizado"
- [ ] Notificación: "X reportes sincronizados"

**Verificar en BD:**
```bash
npx prisma studio
# Reportes created offline ahora deben estar en BD
```

---

### ✓ Fase 6: Performance y PWA

**Lighthouse:**
```bash
# En DevTools
DevTools → Lighthouse → Generate report
```

**Metas:**
- Performance: > 80
- Accessibility: > 85
- Best Practices: > 80
- PWA: Installable

**PWA Install:**
- [ ] Dirección muestra icono "Instalar" (derecha)
- [ ] Click instala app
- [ ] App abre en ventana sin barra de navegador
- [ ] App offline funciona (serviceworker cacheó)

**Carga de caché:**
- [ ] Primera carga: ~2s (depende conexión)
- [ ] Segunda carga: < 1s (from cache)

---

### ✓ Fase 7: Compatibilidad Móvil

**Test Responsive (DevTools):**
- [ ] iPhone 12 (390x844)
- [ ] Pixel 5 (393x851)
- [ ] iPad (768x1024)
- [ ] Todos displays responsive sin scroll horizontal

**Touch:**
- [ ] Buttons son > 44x44px (tap-friendly)
- [ ] Forms accesibles en móvil
- [ ] Mapa paneable con dos dedos
- [ ] Zoom con pinch-zoom

---

### ✓ Fase 8: Integración de Datos

**Datos esperados en DB:**

```sql
-- Ejecutar en SQLite
SELECT COUNT(*) as total_reports FROM Report;

SELECT status, COUNT(*) as count FROM Report GROUP BY status;

SELECT category, COUNT(*) as count FROM Report GROUP BY category;

SELECT municipio, COUNT(*) as count FROM Report GROUP BY municipio;

-- Ver índices
PRAGMA index_list(Report);
```

**Validaciones:**
- [ ] Reportes creados tienen createdBy = usuario actual
- [ ] Reportes tienen coordenadas válidas
- [ ] Status válido (Pendiente|En Proceso|Resuelto)
- [ ] Categoría válida
- [ ] Índices existen (6 indexes)

---

## 🧪 CASOS DE PRUEBA AUTOMÁTICOS

### Script: Crear 10 reportes de test

```bash
# guardar como scripts/seed.js
node scripts/seed.js
```

**Contenido:**

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  { title: 'Bache grande', category: 'Bache', colonia: 'Mirasierra', priority: 'Alta' },
  { title: 'Luminaria rota', category: 'Luminaria Dañada', colonia: 'Saltillo 2000', priority: 'Media' },
  { title: 'Acumulación de basura', category: 'Basura Acumulada', colonia: 'Centro', priority: 'Media' },
  { title: 'Fuga de agua', category: 'Fuga de Agua', colonia: 'Mirasierra', priority: 'Alta' },
  { title: 'Zona insegura', category: 'Inseguridad', colonia: 'Rincones de San Javier', priority: 'Alta' },
  // ... más reportes
];

async function seed() {
  for (const item of data) {
    await prisma.report.create({
      data: {
        ...item,
        description: 'Reporte de prueba',
        municipio: 'Saltillo',
        lat: 25.426 + Math.random() * 0.5,
        lng: -100.973 + Math.random() * 0.5,
        status: ['Pendiente', 'En Proceso', 'Resuelto'][Math.floor(Math.random() * 3)],
        createdBy: 'test_user',
      }
    });
  }
  console.log('Seeded database with test data');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
```

---

## 📊 MATRIZ DE VERIFICACIÓN

| Característica | Sprint 1 | Sprint 2 | Sprint 3 | Status |
|---|---|---|---|---|
| Contador real en home | ✅ | ✅ | ✅ | DONE |
| Mapa con reportes | ✅ | ✅ | ✅ | DONE |
| GPS en formulario | ✅ | ✅ | ✅ | DONE |
| Tabs reportes | ✅ | ✅ | ✅ | DONE |
| Estadísticas reales | ✅ | ✅ | ✅ | DONE |
| Notificaciones | ✅ | ✅ | ✅ | DONE |
| Sync offline | ✅ | ✅ | ✅ | DONE |
| Filtros avanzados | ✅ | ✅ | ✅ | DONE |
| Auto-refresh mapa | ✅ | ✅ | ✅ | DONE |
| PWA funcional | ✅ | ✅ | ✅ | DONE |

---

## 🔍 CHECKLIST FINAL PARA PRODUCCIÓN

### Código

- [ ] No hay console.log() en archivos finales (solo en dev)
- [ ] No hay comentarios de debug
- [ ] TypeScript strict mode sin errors
- [ ] Todos los archivos compilados sin warnings
- [ ] No hay funciones sin usar
- [ ] Imports están ordenados y limpios

### Base de Datos

- [ ] Índices presentes en campos frecuentes
- [ ] Constraints adecuados (required fields)
- [ ] Backups realizados antes de deploy
- [ ] Migración probada en staging

### Seguridad

- [ ] Validaciones en API (no confiar en cliente)
- [ ] Inputs sanitizados (evitar XSS)
- [ ] CORS configurado correctamente (si aplica)
- [ ] No hay credenciales en código
- [ ] .env.local en .gitignore

### Performance

- [ ] Imágenes optimizadas (< 150KB)
- [ ] CSS bundled y minimizado
- [ ] JavaScript code-split
- [ ] Lazy loading de imágenes
- [ ] Cache headers configurados

### Testing

- [ ] Probado en Chrome, Firefox, Safari
- [ ] Probado en iPhone 12 y Pixel 5
- [ ] Offline funciona completamente
- [ ] PWA installable
- [ ] Notificaciones funcionan

### Documentación

- [ ] README.md actualizado
- [ ] CAMBIOS_IMPLEMENTADOS.md completado
- [ ] DOCUMENTACION_TECNICA.md disponible
- [ ] GUIA_DESARROLLO.md disponible
- [ ] Comentarios en código complejo

---

## ✨ SEÑALES DE ÉXITO

✅ **El proyecto está listo si:**

1. `npm run build` completa sin errores
2. `npm run dev` inicia sin warnings
3. Todos los tests pasan (si existen)
4. Mapa carga reportes reales en <2s
5. Offline sync funciona end-to-end
6. Notificaciones llegan correctamente
7. Base de datos refleja cambios inmediatos
8. PWA es installable y offline-first
9. Responsive en móviles y desktops
10. Performance score > 80 en Lighthouse

---

**Plan de pruebas completado** ✅

Para iniciar: `npm run dev` y visita http://localhost:3000
