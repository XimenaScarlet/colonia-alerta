# Colonia Alerta - PWA de Reporte Urbano 🏙️

Plataforma de reporte ciudadano para Saltillo y Ramos Arizpe, construida usando tecnologías web modernas con especial énfasis en un robusto soporte Offline.

## Características Principales

1. **Service Worker PWA:** Aplicación web verdaderamente instalable desde el navegador y disponible fuera de línea.
2. **First-Class Offline Mode (IndexedDB):** Si pierdes la señal mientras documentas un bache, el reporte y la foto se guardan de forma local persistente.
3. **Mapas Nativos Interactivos** con OpenStreetMap y geolocalización.
4. **Híbrida Rendering (SSR y CSR):** React Server Components (App Router) en Estadísticas y Dashboard para mayor velocidad; Renderizado en Cliente para Formularios y Mapas con acceso a Hardware.
5. **Simulación Notificaciones Nativas:** Acceso y permisos reales a Notificaciones Web (*Notification API*).

## Instrucciones para Ejecución Local

Para correr el proyecto tal cual lo vería el profesor o jurado (simulando servidor de despliegue):

```bash
# 1. Instalar dependencias
npm install

# 2. Generar compilación para Producción (Crea el Service Worker sw.js)
npm run build

# 3. Arrancar servidor de Producción de Next.js
npm run start
```
Luego visita `http://localhost:3000` en Chrome.

*Si solo quieres ver el código correr rápido:* `npm run dev` (Nota: en modo dev el Service Worker está inhabilitado por caché, no se sentirá como PWA).

## Entregables Académicos Incluidos
En la carpeta `/docs` encontrarás los 6 documentos de texto listos requeridos para redactar tu proyecto final o presentación técnica en el formato exigido: Justificación, Parámetros, Pruebas, Guias Funcionales y No Funcionales, y la Guía de Vercel.

`Autor: Proyecto Escolar Desarrollado con Next.js 15+`
