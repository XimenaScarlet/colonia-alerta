# 2. Parámetros de Configuración de Plataformas y Herramientas

Para el correcto funcionamiento del proyecto **Colonia Alerta**, se establecieron las siguientes configuraciones de las herramientas:

## Versiones Sugeridas y Dependencias Principales
- **Node.js**: v18 o superior
- **Next.js**: ^14.2 / ^15.0
- **React**: ^18 / ^19
- **TypeScript**: ^5.x
- **Tailwind CSS**: ^3.x / PostCSS
- **Leaflet**: ^1.9.4
- **react-leaflet**: ^4.2.1
- **Dexie**: ^4.x
- **next-pwa**: ^5.6.x

## Configuración del Manifest (PWA)
El archivo `public/manifest.json` configura las directivas de instalación de la aplicación:
```json
{
  "name": "Colonia Alerta",
  "short_name": "Colonia Alerta",
  "display": "standalone",
  "start_url": "/home",
  "background_color": "#ffffff",
  "theme_color": "#0ea5e9",
  "icons": [ ... ]
}
```
* `display: standalone` elimina la barra y botones de navegación del navegador garantizando experiencia App-like.

## Configuración del Service Worker
Controlado desde `next.config.mjs` con `next-pwa`:
```javascript
const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});
```
En desarrollo se desactiva para no cachear código viejo, limitando su acción a producción. `dest: "public"` inyecta dinámicamente el *sw.js*.

## Configuración de Renderizado (SSR y CSR)
- **SSR (Server-Side Rendering)**: Aplicado en `src/app/estadisticas/page.tsx` mediante un componente *asíncrono*, ejecutando los cómputos o fetch remoto antes de servir el HTML.
- **CSR (Client-Side Rendering)**: Empleado en `src/app/reportar/page.tsx` y `src/app/mapa/page.tsx`. Instrucción fundamental al inicio del archivo con `"use client"`. Para Leaflet, es obligado inicializarlo con un `next/dynamic { ssr: false }`.

## Configuración de Almacenamiento Local (Dexie.js)
El esquema base de Dexie (`src/lib/db.ts`) se configuró en la base de datos `ColoniaAlertaDB` versión 1, indicando los campos a indexar: `'++id, category, municipio, colonia, status, synced'`.

## Configuración de Elementos Físicos
- **Geolocalización**: `navigator.geolocation.getCurrentPosition(...)` para obtener latitud y longitud.
- **Cámara**: Uso estándar web con directiva HTML en input `accept="image/*"` y `capture="environment"`.
- **Notificaciones**: Acceso local condicionado a `Notification.requestPermission()`.
